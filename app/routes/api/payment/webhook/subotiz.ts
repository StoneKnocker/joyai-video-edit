import { data } from "react-router";
import {
  PAYMENT_KIND,
  PAYMENT_PROVIDER,
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
} from "@/lib/consts";
import { upsertBillingCustomer } from "@/lib/model/billingCustomer";
import {
  getPaymentById,
  getPaymentByPublicId,
  getPaymentBySessionId,
  updatePaymentStatus,
} from "@/lib/model/payment";
import {
  getSubscriptionByProviderId,
  updateSubscriptionStatus,
} from "@/lib/model/subscription";
import {
  markWebhookFailed,
  markWebhookProcessed,
  tryClaimWebhookEvent,
} from "@/lib/model/webhookEvent";
import {
  fulfillNewSubscription,
  fulfillOneTimePurchase,
  fulfillSubscriptionRenewal,
  markSubscriptionCanceled,
  syncSubscriptionState,
} from "~/lib/payment/fulfillment.server";
import {
  fallbackWebhookEventId,
  verifySubotizWebhook,
} from "~/lib/payment/subotiz/subotiz.server";
import type { Route } from "./+types/subotiz";

const PROVIDER = PAYMENT_PROVIDER.SUBOTIZ;

type SubotizWebhookPayload = {
  id?: string | number;
  type?: string;
  created?: string;
  data?: Record<string, unknown>;
};

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function parseDate(value: unknown, fallback = new Date()): Date {
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

function dollarsToCents(amount: unknown): number | undefined {
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return Math.round(amount * 100);
  }
  if (typeof amount === "string" && amount.trim()) {
    const n = Number(amount);
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  return undefined;
}

function mapSubotizSubscriptionStatus(status: string): string {
  switch (status) {
    case "trial":
      return SUBSCRIPTION_STATUS.TRIALING;
    case "active":
      return SUBSCRIPTION_STATUS.ACTIVE;
    case "paused":
      return SUBSCRIPTION_STATUS.PAUSED;
    case "past_due":
      return SUBSCRIPTION_STATUS.PAST_DUE;
    case "unpaid":
      return SUBSCRIPTION_STATUS.PAST_DUE;
    case "canceled":
      return SUBSCRIPTION_STATUS.CANCELED;
    case "init":
    case "incomplete":
      return SUBSCRIPTION_STATUS.PENDING;
    default:
      return SUBSCRIPTION_STATUS.ACTIVE;
  }
}

async function getLocalPaymentFromOrder(data: Record<string, unknown>) {
  const orderId = asString(data.order_id);
  if (orderId) {
    const byOrder = await getPaymentByPublicId(orderId);
    if (byOrder) return byOrder;
  }

  const sessionId = asString(data.session_id);
  if (sessionId) {
    const bySession = await getPaymentBySessionId(PROVIDER, sessionId);
    if (bySession) return bySession;
  }

  const paymentIdMeta =
    data.metadata &&
    typeof data.metadata === "object" &&
    data.metadata !== null &&
    "payment_id" in data.metadata
      ? asString((data.metadata as { payment_id?: unknown }).payment_id)
      : undefined;

  if (paymentIdMeta) {
    // checkout stores internal numeric payment.id in metadata.payment_id
    const numericId = Number(paymentIdMeta);
    if (Number.isFinite(numericId) && numericId > 0) {
      const byId = await getPaymentById(numericId);
      if (byId) return byId;
    }
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const rawBody = await request.text();
  const timestamp = request.headers.get("x-timestamp") ?? "";
  const signature = request.headers.get("x-signature") ?? "";

  if (!verifySubotizWebhook(timestamp, rawBody, signature)) {
    console.error("Invalid Subotiz webhook signature");
    return data({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: SubotizWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SubotizWebhookPayload;
  } catch {
    return data({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.type ?? "unknown";
  const eventId =
    asString(payload.id) ?? fallbackWebhookEventId(timestamp, rawBody);

  const claim = await tryClaimWebhookEvent({
    provider: PROVIDER,
    eventId,
    eventType,
    payload: rawBody.slice(0, 4000),
  });

  if (!claim.claimed) {
    console.log("Subotiz webhook already processed, skipping", {
      eventId,
      eventType,
    });
    return data({ success: true, duplicate: true });
  }

  try {
    const eventData =
      payload.data && typeof payload.data === "object" ? payload.data : {};

    switch (eventType) {
      case "v2.trades.succeeded":
      case "trades.succeeded": {
        await handleTradeSucceeded(eventData);
        break;
      }
      case "v2.trades.payment_failed":
      case "trades.payment_failed": {
        await handleTradeFailed(eventData);
        break;
      }
      case "v2.subscription.first":
      case "subscription.first": {
        await handleSubscriptionFirst(eventData);
        break;
      }
      case "v2.subscription.canceled":
      case "subscription.canceled": {
        await handleSubscriptionCanceled(eventData);
        break;
      }
      case "v2.subscription.cancellation_requested":
      case "subscription.cancellation_requested": {
        await handleSubscriptionCancellationRequested(eventData);
        break;
      }
      case "v2.subscription.past_due":
      case "v2.subscription.unpaid":
      case "v2.subscription.paused":
      case "v2.subscription.resumed":
      case "subscription.past_due":
      case "subscription.unpaid":
      case "subscription.paused":
      case "subscription.resumed": {
        await handleSubscriptionStatusSync(eventData);
        break;
      }
      case "v2.invoice.paid":
      case "invoice.paid": {
        await handleInvoicePaid(eventData);
        break;
      }
      case "v2.invoice.payment_failed":
      case "invoice.payment_failed": {
        console.log("Subotiz invoice payment failed", {
          invoiceId: asString(eventData.id) ?? asString(eventData.invoice_id),
          orderId: asString(eventData.order_id),
        });
        break;
      }
      case "v2.refunds.succeeded":
      case "refunds.succeeded": {
        console.log("Subotiz refund succeeded (credits not clawed back)", {
          tradeId: asString(eventData.trade_id),
          refundId: asString(eventData.refund_id) ?? asString(eventData.id),
        });
        break;
      }
      default:
        console.log("Subotiz webhook ignored event type", { eventType });
    }

    await markWebhookProcessed(claim.id);
    return data({ success: true });
  } catch (error) {
    console.error("Subotiz webhook processing error:", error);
    await markWebhookFailed(
      claim.id,
      error instanceof Error ? error.message : "Webhook processing failed",
    );
    return data(
      {
        error:
          error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 },
    );
  }
}

/**
 * One-time purchases are fulfilled here.
 * Subscription initial grants wait for v2.subscription.first (period fields).
 */
async function handleTradeSucceeded(eventData: Record<string, unknown>) {
  const payment = await getLocalPaymentFromOrder(eventData);
  if (!payment) {
    console.log("Subotiz trade.succeeded: no local payment", {
      orderId: asString(eventData.order_id),
      sessionId: asString(eventData.session_id),
    });
    return;
  }

  const tradeId = asString(eventData.trade_id);
  const sessionId = asString(eventData.session_id);
  const customerId = asString(eventData.customer_id);
  const paymentMode = asString(eventData.payment_mode);

  if (customerId) {
    await upsertBillingCustomer(payment.userId, PROVIDER, customerId);
  }

  const isSubscription =
    payment.kind === PAYMENT_KIND.SUBSCRIPTION_INITIAL ||
    paymentMode === "subscription" ||
    paymentMode === "recurring_payment";

  if (isSubscription) {
    // Defer credit grant to subscription.first / invoice.paid to avoid double-grant
    if (payment.status === PAYMENT_STATUS.PENDING && (sessionId || tradeId)) {
      await updatePaymentStatus(payment.id, PAYMENT_STATUS.PENDING, {
        providerSessionId: sessionId,
        providerTransactionId: tradeId,
      });
    }
    console.log(
      "Subotiz trade.succeeded for subscription; waiting first/invoice",
      {
        paymentId: payment.id,
        tradeId,
      },
    );
    return;
  }

  await fulfillOneTimePurchase(payment, {
    providerSessionId: sessionId,
    providerTransactionId: tradeId,
  });
}

async function handleTradeFailed(eventData: Record<string, unknown>) {
  const payment = await getLocalPaymentFromOrder(eventData);
  if (!payment || payment.status !== PAYMENT_STATUS.PENDING) return;

  await updatePaymentStatus(payment.id, PAYMENT_STATUS.FAILED, {
    providerSessionId: asString(eventData.session_id),
    providerTransactionId: asString(eventData.trade_id),
  });
}

async function handleSubscriptionFirst(eventData: Record<string, unknown>) {
  const payment = await getLocalPaymentFromOrder(eventData);
  if (!payment) {
    console.log("Subotiz subscription.first: no local payment", {
      orderId: asString(eventData.order_id),
    });
    return;
  }

  const subscriptionId = asString(eventData.id);
  if (!subscriptionId) {
    throw new Error("Missing subscription id in subscription.first");
  }

  const customerId = asString(eventData.customer_id);
  if (customerId) {
    await upsertBillingCustomer(payment.userId, PROVIDER, customerId);
  }

  const periodStart = parseDate(eventData.current_period_start);
  const periodEnd = parseDate(
    eventData.current_period_end,
    new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000),
  );

  await fulfillNewSubscription(payment, {
    provider: PROVIDER,
    providerSubscriptionId: subscriptionId,
    periodStart,
    periodEnd,
    providerSessionId: asString(eventData.session_id) ?? undefined,
    providerTransactionId:
      asString(eventData.source_trade_id) ?? subscriptionId,
    providerCustomerId: customerId,
  });
}

async function handleSubscriptionCanceled(eventData: Record<string, unknown>) {
  const subscriptionId = asString(eventData.id);
  if (!subscriptionId) return;

  // Final termination (period ended or immediate cancel).
  await markSubscriptionCanceled(PROVIDER, subscriptionId, {
    cancelAtPeriodEnd: false,
    immediate: true,
  });
}

/** User scheduled cancel at period end — keep access until periodEnd. */
async function handleSubscriptionCancellationRequested(
  eventData: Record<string, unknown>,
) {
  const subscriptionId = asString(eventData.id);
  if (!subscriptionId) return;

  const local = await getSubscriptionByProviderId(PROVIDER, subscriptionId);
  if (!local) {
    console.log("Subotiz cancellation_requested: local not found", {
      subscriptionId,
    });
    return;
  }

  await updateSubscriptionStatus(PROVIDER, subscriptionId, local.status, {
    cancelAtPeriodEnd: true,
    canceledAt: new Date(),
  });
}

async function handleSubscriptionStatusSync(
  eventData: Record<string, unknown>,
) {
  const subscriptionId = asString(eventData.id);
  const status = asString(eventData.status);
  if (!subscriptionId || !status) return;

  const local = await getSubscriptionByProviderId(PROVIDER, subscriptionId);
  if (!local) {
    console.log("Subotiz subscription status sync: local not found", {
      subscriptionId,
    });
    return;
  }

  const mapped = mapSubotizSubscriptionStatus(status);
  const periodStart = parseDate(
    eventData.current_period_start,
    local.periodStart,
  );
  const periodEnd = parseDate(eventData.current_period_end, local.periodEnd);

  // Only manage cancelAtPeriodEnd/canceledAt when transitioning to CANCELED.
  // For other statuses (past_due, paused, resumed) preserve values set by the
  // dedicated handlers (cancellation_requested / canceled) so we don't clobber
  // a scheduled cancel-at-period-end.
  const isCanceled = mapped === SUBSCRIPTION_STATUS.CANCELED;
  await syncSubscriptionState(
    PROVIDER,
    subscriptionId,
    mapped,
    periodStart,
    periodEnd,
    isCanceled ? { cancelAtPeriodEnd: false, canceledAt: new Date() } : {},
  );
}

async function handleInvoicePaid(eventData: Record<string, unknown>) {
  const invoiceType = asString(eventData.invoice_type);
  const subscriptionId = asString(eventData.subscription_id);
  const invoiceId = asString(eventData.invoice_id) ?? asString(eventData.id);
  const tradeId = asString(eventData.trade_id);
  const amountCents = dollarsToCents(eventData.amount);

  if (invoiceType === "renewal") {
    if (!subscriptionId) {
      console.log("Subotiz invoice.paid renewal missing subscription_id");
      return;
    }

    const localSubscription = await getSubscriptionByProviderId(
      PROVIDER,
      subscriptionId,
    );
    if (!localSubscription) {
      console.log("Subotiz renewal: local subscription not found", {
        subscriptionId,
      });
      return;
    }

    // Prefer explicit period fields when present; else extend ~1 cycle from previous end
    const periodStart = parseDate(
      eventData.current_period_start ?? eventData.period_start,
      localSubscription.periodEnd,
    );
    const periodEnd = parseDate(
      eventData.current_period_end ?? eventData.period_end,
      new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000),
    );

    await fulfillSubscriptionRenewal(localSubscription, {
      periodStart,
      periodEnd,
      amountCents,
      providerTransactionId: invoiceId ?? tradeId,
      providerSessionId: tradeId,
    });
    return;
  }

  if (invoiceType === "initial" || invoiceType === "trial") {
    // Prefer subscription.first for grant; use invoice as fallback if first was missed
    const payment = await getLocalPaymentFromOrder(eventData);
    if (!payment || payment.status === PAYMENT_STATUS.PAID) {
      return;
    }
    if (!subscriptionId) return;

    const periodStart = parseDate(
      eventData.current_period_start ?? eventData.period_start,
    );
    const periodEnd = parseDate(
      eventData.current_period_end ?? eventData.period_end,
      new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000),
    );

    await fulfillNewSubscription(payment, {
      provider: PROVIDER,
      providerSubscriptionId: subscriptionId,
      periodStart,
      periodEnd,
      providerTransactionId: invoiceId ?? tradeId ?? subscriptionId,
      providerCustomerId: asString(eventData.customer_id),
    });
  }
}
