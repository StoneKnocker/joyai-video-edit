import { data } from "react-router";
import {
  PAYMENT_PROVIDER,
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
} from "@/lib/consts";
import { upsertBillingCustomer } from "@/lib/model/billingCustomer";
import { getPaymentById, getPaymentBySessionId } from "@/lib/model/payment";
import { getSubscriptionByProviderId } from "@/lib/model/subscription";
import {
  markWebhookFailed,
  markWebhookProcessed,
  tryClaimWebhookEvent,
} from "@/lib/model/webhookEvent";
import { creem } from "~/lib/payment/creem/creem.server";
import {
  fulfillNewSubscription,
  fulfillOneTimePurchase,
  fulfillSubscriptionRenewal,
  markSubscriptionCanceled,
  syncSubscriptionState,
} from "~/lib/payment/fulfillment.server";
import type { Route } from "./+types/creem";

const PROVIDER = PAYMENT_PROVIDER.CREEM;

async function getLocalPayment(checkoutId?: string, paymentId?: string) {
  return (
    (paymentId ? await getPaymentById(Number(paymentId)) : null) ||
    (checkoutId ? await getPaymentBySessionId(PROVIDER, checkoutId) : null)
  );
}

function mapCreemStatus(status: string): string {
  if (status === "canceled" || status === "cancelled") {
    return SUBSCRIPTION_STATUS.CANCELED;
  }
  if (status === "paused") return SUBSCRIPTION_STATUS.PAUSED;
  if (status === "past_due" || status === "unpaid") {
    return SUBSCRIPTION_STATUS.PAST_DUE;
  }
  if (status === "trialing") return SUBSCRIPTION_STATUS.TRIALING;
  return SUBSCRIPTION_STATUS.ACTIVE;
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const requestBody = await request.text();
    const signature = request.headers.get("creem-signature") ?? "";

    // Best-effort event id from payload for idempotency (Creem SDK verifies inside handleEvents)
    let claimId: number | null = null;
    try {
      const parsed = JSON.parse(requestBody) as {
        id?: string;
        eventType?: string;
        event_type?: string;
        type?: string;
      };
      const eventId =
        parsed.id ??
        // fallback: hash-ish of body length + signature prefix
        `creem_${signature.slice(0, 32)}_${requestBody.length}`;
      const eventType =
        parsed.eventType ?? parsed.event_type ?? parsed.type ?? "unknown";

      const claim = await tryClaimWebhookEvent({
        provider: PROVIDER,
        eventId,
        eventType,
        payload: requestBody.slice(0, 4000),
      });

      if (!claim.claimed) {
        console.log("Creem webhook already processed, skipping", { eventId });
        return data({ success: true, duplicate: true });
      }
      claimId = claim.id;
    } catch (err) {
      console.warn("Creem webhook claim failed, continuing:", err);
    }

    try {
      await creem.webhooks.handleEvents(requestBody, signature, {
        onCheckoutCompleted: async (checkout) => {
          const billingType = checkout.product.billingType;
          const checkoutId = checkout.id;
          const paymentId =
            typeof checkout.metadata?.payment_id === "string" ||
            typeof checkout.metadata?.payment_id === "number"
              ? String(checkout.metadata.payment_id)
              : undefined;
          const payment = await getLocalPayment(checkoutId, paymentId);

          console.log("Received checkout.completed webhook:", {
            checkoutId,
            billingType,
            paymentId,
          });

          if (!payment) {
            throw new Error("Unable to match payment from checkout.completed");
          }

          if (payment.status === PAYMENT_STATUS.PAID) {
            console.log("Payment already marked as PAID, skipping...");
            return;
          }

          const customerId =
            typeof checkout.customer === "object" &&
            checkout.customer &&
            "id" in checkout.customer
              ? String((checkout.customer as { id?: string }).id ?? "")
              : undefined;

          if (customerId) {
            await upsertBillingCustomer(payment.userId, PROVIDER, customerId);
          }

          if (billingType === "recurring") {
            console.log("Scenario: New subscription created");

            const creemSubscription = checkout.subscription;
            if (!creemSubscription) {
              throw new Error("Missing subscription data in webhook");
            }

            await fulfillNewSubscription(payment, {
              provider: PROVIDER,
              providerSubscriptionId: creemSubscription.id,
              periodStart: new Date(creemSubscription.currentPeriodStartDate),
              periodEnd: new Date(creemSubscription.currentPeriodEndDate),
              providerSessionId: checkoutId,
              providerTransactionId: checkoutId,
              providerCustomerId: customerId || undefined,
            });
          } else {
            console.log("Scenario: One-time purchase");
            await fulfillOneTimePurchase(payment, {
              providerSessionId: checkoutId,
              providerTransactionId: checkoutId,
            });
          }
        },
        onSubscriptionPaid: async (subscription) => {
          console.log("Received subscription.paid webhook:", {
            subscriptionId: subscription.id,
            status: subscription.status,
          });

          const localSubscription = await getSubscriptionByProviderId(
            PROVIDER,
            subscription.id,
          );
          if (!localSubscription) {
            console.log("Subscription not found locally, skipping renewal", {
              subscriptionId: subscription.id,
            });
            return;
          }

          console.log("Scenario: Subscription renewal");

          // Prefer provider order/invoice id when available; fall back to period-based key
          const transactionId =
            (subscription as { lastTransactionId?: string })
              .lastTransactionId ??
            `creem_renewal_${subscription.id}_${subscription.currentPeriodEndDate}`;

          await fulfillSubscriptionRenewal(localSubscription, {
            periodStart: new Date(subscription.currentPeriodStartDate),
            periodEnd: new Date(subscription.currentPeriodEndDate),
            amountCents: subscription.product.price,
            providerTransactionId: transactionId,
          });
        },
        onSubscriptionCanceled: async (subscription) => {
          console.log("Received subscription.canceled webhook:", {
            subscriptionId: subscription.id,
            status: subscription.status,
          });

          const localSubscription = await getSubscriptionByProviderId(
            PROVIDER,
            subscription.id,
          );
          if (!localSubscription) {
            console.log(
              "Subscription not found locally, skipping cancel sync",
              {
                subscriptionId: subscription.id,
              },
            );
            return;
          }

          await markSubscriptionCanceled(PROVIDER, subscription.id, {
            cancelAtPeriodEnd: true,
          });
        },
        onSubscriptionUpdate: async (subscription) => {
          console.log("Received subscription.update webhook:", {
            subscriptionId: subscription.id,
            status: subscription.status,
          });

          const localSubscription = await getSubscriptionByProviderId(
            PROVIDER,
            subscription.id,
          );
          if (!localSubscription) {
            console.log(
              "Subscription not found locally, skipping update sync",
              {
                subscriptionId: subscription.id,
              },
            );
            return;
          }

          const mapped = mapCreemStatus(subscription.status);
          await syncSubscriptionState(
            PROVIDER,
            subscription.id,
            mapped,
            new Date(subscription.currentPeriodStartDate),
            new Date(subscription.currentPeriodEndDate),
            {
              cancelAtPeriodEnd: mapped === SUBSCRIPTION_STATUS.CANCELED,
              canceledAt:
                mapped === SUBSCRIPTION_STATUS.CANCELED ? new Date() : null,
            },
          );
        },
      });

      if (claimId != null) {
        await markWebhookProcessed(claimId);
      }

      return data({ success: true });
    } catch (innerError) {
      if (claimId != null) {
        await markWebhookFailed(
          claimId,
          innerError instanceof Error
            ? innerError.message
            : "Webhook processing failed",
        );
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Creem webhook error:", error);
    return data(
      {
        error:
          error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 },
    );
  }
}
