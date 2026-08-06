import {
  CREDIT_EVENT,
  CREDIT_TYPE,
  PAYMENT_KIND,
  PAYMENT_STATUS,
  type PaymentProvider,
  SUBSCRIPTION_STATUS,
} from "@/lib/consts";
import type { SelectPayment } from "@/lib/database/schema";
import { addCreditHistory } from "@/lib/model/creditHistory";
import {
  createPayment,
  getPaymentByTransactionId,
  linkPaymentToSubscription,
  updatePaymentStatus,
} from "@/lib/model/payment";
import {
  createSubscription,
  getActiveSubscriptionByUserId,
  getSubscriptionByProviderId,
  updateSubscriptionPeriod,
  updateSubscriptionStatus,
} from "@/lib/model/subscription";
import {
  addPermanentCredits,
  addSubscriptionCredits,
} from "@/lib/model/userBalance";
import { getProduct } from "~/lib/payment/product";

type PaymentRow = SelectPayment;

/**
 * Grant permanent credits for a one-time purchase.
 * Idempotent when payment is already paid or providerTransactionId already fulfilled.
 */
export async function fulfillOneTimePurchase(
  payment: PaymentRow,
  options: {
    providerSessionId?: string;
    providerTransactionId?: string;
  } = {},
): Promise<{ granted: boolean }> {
  if (payment.status === PAYMENT_STATUS.PAID) {
    console.log("Payment already PAID, skipping one-time fulfillment", {
      paymentId: payment.id,
    });
    return { granted: false };
  }

  const sessionId = options.providerSessionId ?? payment.providerSessionId;
  const transactionId =
    options.providerTransactionId ?? payment.providerTransactionId;

  if (transactionId) {
    const existingTx = await getPaymentByTransactionId(
      payment.provider,
      transactionId,
    );
    if (existingTx && existingTx.id !== payment.id) {
      console.log("Transaction already fulfilled on another payment", {
        transactionId,
        existingPaymentId: existingTx.id,
      });
      return { granted: false };
    }
  }

  await updatePaymentStatus(payment.id, PAYMENT_STATUS.PAID, {
    providerSessionId: sessionId ?? undefined,
    providerTransactionId: transactionId ?? undefined,
    paidAt: new Date(),
  });

  await addPermanentCredits(payment.userId, Number(payment.creditsAmount));

  await addCreditHistory({
    userId: payment.userId,
    amount: payment.creditsAmount,
    creditType: CREDIT_TYPE.PERMANENT,
    creditEvent: CREDIT_EVENT.PURCHASE,
    description: "One-time purchase credits",
    referenceId: transactionId ?? sessionId ?? String(payment.id),
    paymentId: payment.id,
  });

  return { granted: true };
}

/**
 * Create subscription + grant subscription credits for first activation.
 * Idempotent when payment already paid or provider subscription already exists.
 */
export async function fulfillNewSubscription(
  payment: PaymentRow,
  options: {
    provider: PaymentProvider | string;
    providerSubscriptionId: string;
    periodStart: Date;
    periodEnd: Date;
    providerSessionId?: string;
    providerTransactionId?: string;
    providerCustomerId?: string;
  },
): Promise<{ granted: boolean; subscriptionId?: number }> {
  const sessionId =
    options.providerSessionId ??
    payment.providerSessionId ??
    options.providerSubscriptionId;
  const transactionId =
    options.providerTransactionId ?? payment.providerTransactionId;

  const existing = await getSubscriptionByProviderId(
    options.provider,
    options.providerSubscriptionId,
  );

  if (existing) {
    console.log("Subscription already exists, skipping credit grant", {
      provider: options.provider,
      subscriptionId: options.providerSubscriptionId,
    });
    await updateSubscriptionStatus(
      options.provider,
      options.providerSubscriptionId,
      SUBSCRIPTION_STATUS.ACTIVE,
    );
    await updateSubscriptionPeriod(
      options.provider,
      options.providerSubscriptionId,
      options.periodStart,
      options.periodEnd,
    );
    if (payment.status !== PAYMENT_STATUS.PAID) {
      await updatePaymentStatus(payment.id, PAYMENT_STATUS.PAID, {
        providerSessionId: sessionId,
        providerTransactionId: transactionId ?? undefined,
        subscriptionId: existing.id,
        paidAt: new Date(),
      });
    } else {
      await linkPaymentToSubscription(payment.id, existing.id);
    }
    return { granted: false, subscriptionId: existing.id };
  }

  // Defense in depth: refuse a second stacked plan (checkout should already block).
  // Mark paid so webhooks do not retry forever; ops must refund if this path is hit.
  const activeForUser = await getActiveSubscriptionByUserId(payment.userId);
  if (activeForUser) {
    console.error(
      "User already has an active subscription; refusing second plan grant",
      {
        userId: payment.userId,
        existingSubscriptionId: activeForUser.id,
        existingPlanId: activeForUser.planId,
        attemptedProviderSubscriptionId: options.providerSubscriptionId,
        paymentId: payment.id,
      },
    );
    if (payment.status !== PAYMENT_STATUS.PAID) {
      await updatePaymentStatus(payment.id, PAYMENT_STATUS.PAID, {
        providerSessionId: sessionId,
        providerTransactionId: transactionId ?? undefined,
        paidAt: new Date(),
      });
    }
    return { granted: false, subscriptionId: activeForUser.id };
  }

  if (payment.status !== PAYMENT_STATUS.PAID) {
    await updatePaymentStatus(payment.id, PAYMENT_STATUS.PAID, {
      providerSessionId: sessionId,
      providerTransactionId: transactionId ?? undefined,
      paidAt: new Date(),
    });
  }

  const subscriptionId = await createSubscription({
    userId: payment.userId,
    provider: options.provider,
    providerSubscriptionId: options.providerSubscriptionId,
    providerCustomerId: options.providerCustomerId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    planId: payment.planId,
    periodStart: options.periodStart,
    periodEnd: options.periodEnd,
    cancelAtPeriodEnd: false,
    metadata: {},
  });

  await linkPaymentToSubscription(payment.id, subscriptionId);

  await addSubscriptionCredits(
    payment.userId,
    Number(payment.creditsAmount),
    options.periodEnd,
  );

  await addCreditHistory({
    userId: payment.userId,
    amount: payment.creditsAmount,
    creditType: CREDIT_TYPE.SUBSCRIPTION,
    creditEvent: CREDIT_EVENT.SUBSCRIPTION_GRANT,
    description: "Subscription credits granted",
    referenceId: options.providerSubscriptionId,
    paymentId: payment.id,
    subscriptionId,
  });

  return { granted: true, subscriptionId };
}

/**
 * Renew an existing subscription: update period, write paid payment row, re-grant credits.
 * Idempotent via providerTransactionId when provided, else periodEnd change.
 */
export async function fulfillSubscriptionRenewal(
  localSubscription: {
    id: number;
    userId: string;
    planId: string;
    provider: string;
    providerSubscriptionId: string;
  },
  options: {
    periodStart: Date;
    periodEnd: Date;
    amountCents?: number;
    providerTransactionId?: string;
    providerSessionId?: string;
  },
): Promise<{ granted: boolean }> {
  if (options.providerTransactionId) {
    const existingTx = await getPaymentByTransactionId(
      localSubscription.provider,
      options.providerTransactionId,
    );
    if (existingTx) {
      console.log("Subscription renewal already handled by transaction id", {
        provider: localSubscription.provider,
        transactionId: options.providerTransactionId,
      });
      return { granted: false };
    }
  }

  await updateSubscriptionStatus(
    localSubscription.provider,
    localSubscription.providerSubscriptionId,
    SUBSCRIPTION_STATUS.ACTIVE,
  );

  const isChanged = await updateSubscriptionPeriod(
    localSubscription.provider,
    localSubscription.providerSubscriptionId,
    options.periodStart,
    options.periodEnd,
  );

  // Without transaction id, fall back to periodEnd change for idempotency
  if (!options.providerTransactionId && !isChanged) {
    console.log("Subscription renewal already handled, skipping", {
      subscriptionId: localSubscription.providerSubscriptionId,
    });
    return { granted: false };
  }

  const product = getProduct(localSubscription.planId);
  const amountCents = options.amountCents ?? Math.round(product.price * 100);

  const renewalPayment = await createPayment({
    userId: localSubscription.userId,
    subscriptionId: localSubscription.id,
    kind: PAYMENT_KIND.SUBSCRIPTION_RENEWAL,
    amountCents,
    planId: localSubscription.planId,
    provider: localSubscription.provider,
    providerSessionId: options.providerSessionId,
    providerTransactionId: options.providerTransactionId,
    creditType: CREDIT_TYPE.SUBSCRIPTION,
    creditsAmount: product.creditsAmount,
    status: PAYMENT_STATUS.PAID,
    paidAt: new Date(),
    metadata: {},
  });

  await addSubscriptionCredits(
    localSubscription.userId,
    product.creditsAmount,
    options.periodEnd,
  );

  await addCreditHistory({
    userId: localSubscription.userId,
    amount: product.creditsAmount,
    creditType: CREDIT_TYPE.SUBSCRIPTION,
    creditEvent: CREDIT_EVENT.SUBSCRIPTION_GRANT,
    description: "Subscription renewal credits",
    referenceId:
      options.providerTransactionId ?? localSubscription.providerSubscriptionId,
    paymentId: renewalPayment.id,
    subscriptionId: localSubscription.id,
  });

  return { granted: true };
}

export async function markSubscriptionCanceled(
  provider: string,
  providerSubscriptionId: string,
  options: { cancelAtPeriodEnd?: boolean; immediate?: boolean } = {},
): Promise<void> {
  const cancelAtPeriodEnd = options.cancelAtPeriodEnd ?? !options.immediate;
  await updateSubscriptionStatus(
    provider,
    providerSubscriptionId,
    SUBSCRIPTION_STATUS.CANCELED,
    {
      cancelAtPeriodEnd,
      canceledAt: new Date(),
    },
  );
}

export async function syncSubscriptionState(
  provider: string,
  providerSubscriptionId: string,
  status: string,
  periodStart: Date,
  periodEnd: Date,
  options: {
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | null;
  } = {},
): Promise<void> {
  await updateSubscriptionStatus(
    provider,
    providerSubscriptionId,
    status,
    options,
  );
  await updateSubscriptionPeriod(
    provider,
    providerSubscriptionId,
    periodStart,
    periodEnd,
  );
}
