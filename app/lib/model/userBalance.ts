import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/database/db.server";
import { userBalance } from "@/lib/database/schema";

export async function addSubscriptionCredits(
  userId: string,
  amount: number,
  subscriptionCycleEnd: Date,
) {
  await db
    .insert(userBalance)
    .values({
      userId,
      subscriptionCredits: amount,
      subscriptionCycleEnd,
    })
    .onConflictDoUpdate({
      target: userBalance.userId,
      set: {
        subscriptionCredits: amount,
        subscriptionCycleEnd,
      },
    });
}

export async function addPermanentCredits(userId: string, amount: number) {
  await db
    .insert(userBalance)
    .values({
      userId,
      permanentCredits: amount,
    })
    .onConflictDoUpdate({
      target: userBalance.userId,
      set: {
        permanentCredits: sql`${userBalance.permanentCredits} + ${amount}`,
      },
    });
}

export async function getUserBalance(userId: string) {
  const result = await db
    .select()
    .from(userBalance)
    .where(eq(userBalance.userId, userId));

  return result[0] || null;
}

export async function getTotalAvailableCredits(userId: string) {
  const balance = await getUserBalance(userId);

  if (!balance) {
    return { total: 0, subscription: 0, permanent: 0 };
  }

  const now = new Date();
  const subscriptionCredits =
    balance.subscriptionCycleEnd && balance.subscriptionCycleEnd > now
      ? balance.subscriptionCredits
      : 0;

  return {
    total: subscriptionCredits + balance.permanentCredits,
    subscription: subscriptionCredits,
    permanent: balance.permanentCredits,
  };
}
