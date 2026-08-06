import { eq, sql } from "drizzle-orm";
import { CREDIT_EVENT, CREDIT_TYPE } from "@/lib/consts";
import { db } from "@/lib/database/db.server";
import type { SelectUserBalance } from "@/lib/database/schema";
import { creditHistory, userBalance } from "@/lib/database/schema";

export interface CreditConsumptionResult {
  success: boolean;
  deductedSubscription: number;
  deductedPermanent: number;
}

/**
 * Consume credits from user account.
 * Priority: subscription credits first, then permanent credits.
 *
 * @param userId - User ID
 * @param amount - Amount of credits to consume
 * @param description - Description for credit history
 * @param referenceId - Reference ID (e.g., task ID)
 * @returns CreditConsumptionResult
 * @throws Error if insufficient balance
 */
export async function consumeCredits(
  userId: string,
  amount: number,
  description: string,
  referenceId = "",
): Promise<CreditConsumptionResult> {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  // Get current balance with lock
  const balanceResult = await db
    .select()
    .from(userBalance)
    .where(eq(userBalance.userId, userId));

  const balance: SelectUserBalance | null = balanceResult[0] || null;

  if (!balance) {
    throw new Error("User balance not found");
  }

  // Expire subscription pocket when cycle has ended (keep consistent with getTotalAvailableCredits)
  const now = new Date();
  const cycleValid =
    balance.subscriptionCycleEnd != null && balance.subscriptionCycleEnd > now;
  if (!cycleValid && (balance.subscriptionCredits || 0) > 0) {
    await db
      .update(userBalance)
      .set({ subscriptionCredits: 0 })
      .where(eq(userBalance.userId, userId));
  }

  // Calculate deduction path
  let deductSub = 0;
  let deductPerm = 0;
  const availableSub = cycleValid ? balance.subscriptionCredits || 0 : 0;
  const availablePerm = balance.permanentCredits || 0;

  if (availableSub >= amount) {
    // Subscription balance is sufficient
    deductSub = amount;
  } else {
    // Subscription balance is not enough, deduct all subscription first
    deductSub = availableSub;
    const remainder = amount - deductSub;

    if (availablePerm >= remainder) {
      deductPerm = remainder;
    } else {
      throw new Error("Insufficient credits");
    }
  }

  // Execute transaction
  // await db.transaction(async (tx) => {
  // A. Update balance table
  if (deductSub > 0) {
    await db
      .update(userBalance)
      .set({
        subscriptionCredits: sql`${userBalance.subscriptionCredits} - ${deductSub}`,
      })
      .where(eq(userBalance.userId, userId));
  }
  if (deductPerm > 0) {
    await db
      .update(userBalance)
      .set({
        permanentCredits: sql`${userBalance.permanentCredits} - ${deductPerm}`,
      })
      .where(eq(userBalance.userId, userId));
  }

  // B. Write credit history records
  if (deductSub > 0) {
    await db.insert(creditHistory).values({
      userId,
      amount: -deductSub,
      creditType: CREDIT_TYPE.SUBSCRIPTION,
      creditEvent: CREDIT_EVENT.USAGE,
      description,
      referenceId,
    });
  }
  if (deductPerm > 0) {
    await db.insert(creditHistory).values({
      userId,
      amount: -deductPerm,
      creditType: CREDIT_TYPE.PERMANENT,
      creditEvent: CREDIT_EVENT.USAGE,
      description,
      referenceId,
    });
  }
  // });

  return {
    success: true,
    deductedSubscription: deductSub,
    deductedPermanent: deductPerm,
  };
}

/**
 * Refund credits to user account.
 * Refunds to the original credit type that was consumed.
 *
 * @param userId - User ID
 * @param subscriptionAmount - Amount to refund to subscription credits
 * @param permanentAmount - Amount to refund to permanent credits
 * @param description - Description for credit history
 * @param referenceId - Reference ID (e.g., task ID)
 */
export async function refundCredits(
  userId: string,
  subscriptionAmount: number,
  permanentAmount: number,
  description: string,
  referenceId = "",
): Promise<void> {
  if (subscriptionAmount < 0 || permanentAmount < 0) {
    console.error("Refund amounts cannot be negative");
    throw new Error("Refund amounts cannot be negative");
  }

  // D1 does not support transactions; execute sequentially.
  // A. Update balance table
  if (subscriptionAmount > 0) {
    await db
      .insert(userBalance)
      .values({
        userId,
        subscriptionCredits: subscriptionAmount,
      })
      .onConflictDoUpdate({
        target: userBalance.userId,
        set: {
          subscriptionCredits: sql`${userBalance.subscriptionCredits} + ${subscriptionAmount}`,
        },
      });
  }
  if (permanentAmount > 0) {
    await db
      .insert(userBalance)
      .values({
        userId,
        permanentCredits: permanentAmount,
      })
      .onConflictDoUpdate({
        target: userBalance.userId,
        set: {
          permanentCredits: sql`${userBalance.permanentCredits} + ${permanentAmount}`,
        },
      });
  }

  // B. Write credit history records
  if (subscriptionAmount > 0) {
    await db.insert(creditHistory).values({
      userId,
      amount: subscriptionAmount,
      creditType: CREDIT_TYPE.SUBSCRIPTION,
      creditEvent: CREDIT_EVENT.REFUND,
      description,
      referenceId,
    });
  }
  if (permanentAmount > 0) {
    await db.insert(creditHistory).values({
      userId,
      amount: permanentAmount,
      creditType: CREDIT_TYPE.PERMANENT,
      creditEvent: CREDIT_EVENT.REFUND,
      description,
      referenceId,
    });
  }
}

/**
 * Refund credits by task ID.
 * Finds all credit consumption records for the task and refunds to original credit types.
 *
 * @param taskId - Task ID to refund
 * @param description - Description for credit history (optional, auto-generated if not provided)
 */
export async function refundCreditsByTaskId(
  taskId: string,
  description?: string,
): Promise<void> {
  console.log("Refunding credits for taskId:", taskId);
  // Find all credit consumption records for this task
  const records = await db
    .select()
    .from(creditHistory)
    .where(eq(creditHistory.referenceId, taskId));

  if (records.length === 0) {
    console.error("No credit history found for task");
    throw new Error("No credit history found for task");
  }

  // Check if already refunded (all amounts should be negative for consumption)
  const hasPositiveAmounts = records.some(
    (r: (typeof records)[0]) => r.amount > 0,
  );
  if (hasPositiveAmounts) {
    console.error("Credits for this task have already been refunded");
    return;
  }

  // Group by credit type and sum the amounts (abs value for refund)
  let subscriptionRefund = 0;
  let permanentRefund = 0;
  let userId: string | null = null;

  for (const record of records) {
    if (!record.userId) {
      continue;
    }
    userId = record.userId;
    const absAmount = Math.abs(record.amount);
    if (record.creditType === CREDIT_TYPE.SUBSCRIPTION) {
      subscriptionRefund += absAmount;
    } else if (record.creditType === CREDIT_TYPE.PERMANENT) {
      permanentRefund += absAmount;
    }
  }

  if (!userId) {
    console.error("No user ID found in credit history");
    return;
  }

  // Perform the refund
  await refundCredits(
    userId,
    subscriptionRefund,
    permanentRefund,
    description || `Refund for task ${taskId}`,
    taskId,
  );
  console.log("end, Refunding credits for taskId:", taskId);
}
