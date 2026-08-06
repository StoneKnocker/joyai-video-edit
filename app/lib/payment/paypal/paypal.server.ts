import {
  CREDIT_TYPE,
  PAYMENT_KIND,
  PAYMENT_PROVIDER,
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
} from "@/lib/consts";
import {
  createPayment,
  getPaymentById,
  getPaymentByPublicId,
  getPaymentBySessionId,
  updatePaymentSessionId,
} from "@/lib/model/payment";
import { getSubscriptionByProviderId } from "@/lib/model/subscription";
import {
  markWebhookFailed,
  markWebhookProcessed,
  tryClaimWebhookEvent,
} from "@/lib/model/webhookEvent";
import { serverEnv } from "~/lib/env.server";
import {
  fulfillNewSubscription,
  fulfillOneTimePurchase,
  fulfillSubscriptionRenewal,
  markSubscriptionCanceled,
  syncSubscriptionState,
} from "~/lib/payment/fulfillment.server";
import {
  centsToPayPalAmount,
  getPlanInterval,
  getProduct,
  priceToCents,
} from "~/lib/payment/product";

const PROVIDER = PAYMENT_PROVIDER.PAYPAL;

type PaypalEnvironment = "sandbox" | "production";

interface PaypalLink {
  rel: string;
  href: string;
}

interface PaypalOrderResource {
  id: string;
  status: string;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    payments?: {
      captures?: Array<{ id?: string; status?: string }>;
    };
  }>;
  links?: PaypalLink[];
}

interface PaypalSubscriptionResource {
  id: string;
  status: string;
  custom_id?: string;
  plan_id?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { amount?: { value?: string; currency_code?: string } };
  };
  start_time?: string;
  links?: PaypalLink[];
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function getPaypalConfig() {
  const clientId = serverEnv.PAYPAL_CLIENT_ID;
  const clientSecret = serverEnv.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal is not configured");
  }

  const environment: PaypalEnvironment =
    serverEnv.PAYPAL_ENVIRONMENT === "production" ? "production" : "sandbox";

  const baseUrl =
    environment === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  return {
    clientId,
    clientSecret,
    webhookId: serverEnv.PAYPAL_WEBHOOK_ID,
    environment,
    baseUrl,
  };
}

export function isPaypalEnabled(): boolean {
  return (
    serverEnv.PAYPAL_ENABLED === "true" &&
    Boolean(serverEnv.PAYPAL_CLIENT_ID && serverEnv.PAYPAL_CLIENT_SECRET)
  );
}

function toBasicAuth(clientId: string, clientSecret: string): string {
  // Workers + nodejs_compat: btoa is fine for ASCII credentials
  return btoa(`${clientId}:${clientSecret}`);
}

async function ensureAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const { clientId, clientSecret, baseUrl } = getPaypalConfig();

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${toBasicAuth(clientId, clientSecret)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(
      `PayPal authentication failed: ${data.error_description ?? data.error ?? response.status}`,
    );
  }

  // Refresh 60s early
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + ((data.expires_in ?? 3600) - 60) * 1000,
  };

  return cachedToken.value;
}

async function paypalRequest<T = unknown>(
  endpoint: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const { baseUrl } = getPaypalConfig();
  const token = await ensureAccessToken();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const result = (await response.json()) as Record<string, unknown> & {
    name?: string;
    error?: string;
    message?: string;
    details?: Array<{ issue?: string; description?: string }>;
  };

  if (!response.ok) {
    let errorMessage = result.name || result.error || "Unknown error";
    if (result.details?.length) {
      errorMessage += `: ${result.details
        .map((d) => d.issue || d.description)
        .join(", ")}`;
    }
    if (result.message) {
      errorMessage += `: ${result.message}`;
    }
    throw new Error(`PayPal request failed: ${errorMessage}`);
  }

  return result as T;
}

function findApprovalUrl(links?: PaypalLink[]): string | undefined {
  return links?.find((link) => link.rel === "approve")?.href;
}

function parsePaymentIdFromCustomId(
  customId: string | undefined,
): number | null {
  if (!customId) return null;
  // Prefer plain payment id; also accept JSON {"payment_id":"123"}
  const asNumber = Number(customId);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber;
  }
  try {
    const parsed = JSON.parse(customId) as { payment_id?: string | number };
    if (parsed.payment_id != null) {
      const id = Number(parsed.payment_id);
      return Number.isFinite(id) ? id : null;
    }
  } catch {
    // ignore
  }
  return null;
}

async function resolveLocalPayment(options: {
  paymentId?: number | null;
  sessionId?: string | null;
}) {
  if (options.paymentId) {
    const byId = await getPaymentById(options.paymentId);
    if (byId) return byId;
  }
  if (options.sessionId) {
    return getPaymentBySessionId(PROVIDER, options.sessionId);
  }
  return null;
}

/**
 * Create PayPal checkout (one-time order or subscription).
 */
export async function createPaypalCheckout(planId: string, userId: string) {
  const product = getProduct(planId);
  const amountCents = priceToCents(product.price);
  const amountValue = centsToPayPalAmount(amountCents);

  const kind =
    product.creditType === CREDIT_TYPE.SUBSCRIPTION
      ? PAYMENT_KIND.SUBSCRIPTION_INITIAL
      : PAYMENT_KIND.ONE_TIME;

  const payment = await createPayment({
    userId,
    kind,
    amountCents,
    currency: "USD",
    planId,
    provider: PROVIDER,
    creditType: product.creditType,
    creditsAmount: product.creditsAmount,
    status: PAYMENT_STATUS.PENDING,
    metadata: {},
  });

  const successUrl = new URL("/payment/success", serverEnv.APP_URL);
  successUrl.searchParams.set("public_id", payment.publicId);

  const cancelUrl = new URL("/pricing", serverEnv.APP_URL);

  const customId = String(payment.id);
  const planName = planId
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

  try {
    if (product.creditType === CREDIT_TYPE.SUBSCRIPTION) {
      // Use pre-created Billing Plan (P-...) — never create Product/Plan per checkout
      if (!product.paypalPlanId) {
        throw new Error(
          `Missing PayPal plan ID for planId: ${planId}. Create the plan in PayPal Catalog and set getPaypalPlanId().`,
        );
      }

      const subscriptionResponse =
        await paypalRequest<PaypalSubscriptionResource>(
          "/v1/billing/subscriptions",
          "POST",
          {
            plan_id: product.paypalPlanId,
            custom_id: customId,
            application_context: {
              brand_name: serverEnv.APP_NAME,
              locale: "en-US",
              shipping_preference: "NO_SHIPPING",
              user_action: "SUBSCRIBE_NOW",
              payment_method: {
                payer_selected: "PAYPAL",
                payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
              },
              return_url: successUrl.toString(),
              cancel_url: cancelUrl.toString(),
            },
          },
        );

      const checkoutUrl = findApprovalUrl(subscriptionResponse.links);
      if (!checkoutUrl) {
        throw new Error("PayPal subscription missing approval URL");
      }

      await updatePaymentSessionId(payment.id, subscriptionResponse.id);

      return {
        checkoutUrl,
        id: subscriptionResponse.id,
        publicId: payment.publicId,
      };
    }

    // One-time order
    const orderResponse = await paypalRequest<PaypalOrderResource>(
      "/v2/checkout/orders",
      "POST",
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: payment.publicId,
            custom_id: customId,
            description: planName,
            items: [
              {
                name: planName,
                unit_amount: {
                  currency_code: "USD",
                  value: amountValue,
                },
                quantity: "1",
                category: "DIGITAL_GOODS",
              },
            ],
            amount: {
              currency_code: "USD",
              value: amountValue,
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: amountValue,
                },
              },
            },
          },
        ],
        application_context: {
          return_url: successUrl.toString(),
          cancel_url: cancelUrl.toString(),
          user_action: "PAY_NOW",
          brand_name: serverEnv.APP_NAME,
          shipping_preference: "NO_SHIPPING",
        },
      },
    );

    const checkoutUrl = findApprovalUrl(orderResponse.links);
    if (!checkoutUrl || !orderResponse.id) {
      throw new Error("PayPal order missing approval URL");
    }

    await updatePaymentSessionId(payment.id, orderResponse.id);

    return {
      checkoutUrl,
      id: orderResponse.id,
      publicId: payment.publicId,
    };
  } catch (error) {
    console.error("Error creating PayPal checkout:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create PayPal checkout",
    );
  }
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function periodFromPlanId(
  planId: string,
  start: Date = new Date(),
): { periodStart: Date; periodEnd: Date } {
  const interval = getPlanInterval(planId);
  const periodEnd =
    interval === "YEAR" ? addYears(start, 1) : addMonths(start, 1);
  return { periodStart: start, periodEnd };
}

/**
 * Capture/activate a pending PayPal payment after user returns from PayPal.
 * Idempotent.
 */
export async function confirmPaypalPayment(publicId: string, userId: string) {
  const payment = await getPaymentByPublicId(publicId);

  if (!payment || payment.userId !== userId) {
    return { status: "not_found" as const };
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    return toStatusResult(payment);
  }

  if (payment.provider !== PAYMENT_PROVIDER.PAYPAL) {
    return toStatusResult(payment);
  }

  if (!payment.providerSessionId) {
    throw new Error("Missing PayPal session id");
  }

  const product = getProduct(payment.planId);

  if (product.creditType === CREDIT_TYPE.SUBSCRIPTION) {
    let subscription = await paypalRequest<PaypalSubscriptionResource>(
      `/v1/billing/subscriptions/${payment.providerSessionId}`,
      "GET",
    );

    // Poll briefly if still APPROVED
    if (subscription.status === "APPROVED") {
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        subscription = await paypalRequest<PaypalSubscriptionResource>(
          `/v1/billing/subscriptions/${payment.providerSessionId}`,
          "GET",
        );
        if (subscription.status === "ACTIVE") break;
      }
    }

    if (
      subscription.status === "ACTIVE" ||
      subscription.status === "APPROVED"
    ) {
      const start = subscription.start_time
        ? new Date(subscription.start_time)
        : new Date();
      const { periodStart, periodEnd } = periodFromPlanId(
        payment.planId,
        start,
      );
      const nextBilling = subscription.billing_info?.next_billing_time
        ? new Date(subscription.billing_info.next_billing_time)
        : periodEnd;

      await fulfillNewSubscription(payment, {
        provider: PROVIDER,
        providerSubscriptionId: subscription.id,
        periodStart,
        periodEnd: nextBilling,
        providerSessionId: payment.providerSessionId ?? undefined,
        providerTransactionId: subscription.id,
      });
    }

    const refreshed = await getPaymentById(payment.id);
    return toStatusResult(refreshed ?? payment);
  }

  // One-time order
  let order = await paypalRequest<PaypalOrderResource>(
    `/v2/checkout/orders/${payment.providerSessionId}`,
    "GET",
  );

  if (order.status === "APPROVED") {
    order = await paypalRequest<PaypalOrderResource>(
      `/v2/checkout/orders/${payment.providerSessionId}/capture`,
      "POST",
    );
  }

  if (order.status === "COMPLETED") {
    const captureId =
      order.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? order.id;
    await fulfillOneTimePurchase(payment, {
      providerSessionId: payment.providerSessionId ?? undefined,
      providerTransactionId: captureId,
    });
  }

  const refreshed = await getPaymentById(payment.id);
  return toStatusResult(refreshed ?? payment);
}

function toStatusResult(payment: {
  status: string;
  amountCents: number;
  currency: string;
  creditsAmount: number;
  creditType: string;
  planId: string;
  provider: string;
}) {
  const status =
    payment.status === PAYMENT_STATUS.PAID ||
    payment.status === PAYMENT_STATUS.CANCELED ||
    payment.status === PAYMENT_STATUS.REFUNDED ||
    payment.status === PAYMENT_STATUS.FAILED
      ? payment.status
      : PAYMENT_STATUS.PENDING;

  return {
    status: status as "pending" | "paid" | "canceled" | "failed" | "refunded",
    amount: payment.amountCents,
    currency: payment.currency,
    creditsAmount: payment.creditsAmount,
    creditType: payment.creditType,
    planId: payment.planId,
    provider: payment.provider,
  };
}

function getHeader(req: Request, name: string): string {
  return (
    req.headers.get(name) ||
    req.headers.get(name.toLowerCase()) ||
    req.headers.get(name.toUpperCase()) ||
    ""
  );
}

/**
 * Handle PayPal webhook: verify signature then fulfill.
 */
export async function handlePaypalWebhook(request: Request): Promise<void> {
  const { webhookId } = getPaypalConfig();
  if (!webhookId) {
    throw new Error("PAYPAL_WEBHOOK_ID not configured");
  }

  const rawBody = await request.text();
  const event = JSON.parse(rawBody) as {
    id?: string;
    event_type?: string;
    resource?: Record<string, unknown>;
  };

  if (!event?.event_type) {
    throw new Error("Invalid PayPal webhook payload");
  }

  const authAlgo = getHeader(request, "paypal-auth-algo");
  const certUrl = getHeader(request, "paypal-cert-url");
  const transmissionId = getHeader(request, "paypal-transmission-id");
  const transmissionSig = getHeader(request, "paypal-transmission-sig");
  const transmissionTime = getHeader(request, "paypal-transmission-time");

  if (!authAlgo || !transmissionId || !transmissionSig || !transmissionTime) {
    throw new Error(
      "Missing PayPal webhook signature headers — rejecting event",
    );
  }

  const verifyResponse = await paypalRequest<{
    verification_status?: string;
  }>("/v1/notifications/verify-webhook-signature", "POST", {
    auth_algo: authAlgo,
    cert_url: certUrl,
    transmission_id: transmissionId,
    transmission_sig: transmissionSig,
    transmission_time: transmissionTime,
    webhook_id: webhookId,
    webhook_event: event,
  });

  if (verifyResponse.verification_status !== "SUCCESS") {
    throw new Error(
      `Invalid PayPal webhook signature: ${verifyResponse.verification_status}`,
    );
  }

  const eventId = event.id || transmissionId;
  const claim = await tryClaimWebhookEvent({
    provider: PROVIDER,
    eventId,
    eventType: event.event_type,
    payload: rawBody.slice(0, 4000),
  });

  if (!claim.claimed) {
    console.log("PayPal webhook already processed, skipping", { eventId });
    return;
  }

  const eventType = event.event_type;
  const resource = (event.resource ?? {}) as Record<string, unknown>;

  console.log("PayPal webhook event:", eventType);

  try {
    switch (eventType) {
      case "CHECKOUT.ORDER.APPROVED": {
        const orderId = resource.id as string | undefined;
        if (!orderId) break;
        try {
          await paypalRequest(`/v2/checkout/orders/${orderId}/capture`, "POST");
        } catch (err) {
          console.warn("PayPal auto-capture on APPROVED failed:", err);
        }
        break;
      }

      case "CHECKOUT.ORDER.COMPLETED": {
        await handleOrderCompleted(resource as unknown as PaypalOrderResource);
        break;
      }

      case "PAYMENT.CAPTURE.COMPLETED": {
        await handleCaptureCompleted(resource);
        break;
      }

      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.RE-ACTIVATED": {
        await handleSubscriptionActivated(
          resource as unknown as PaypalSubscriptionResource,
        );
        break;
      }

      case "BILLING.SUBSCRIPTION.UPDATED": {
        await handleSubscriptionUpdated(
          resource as unknown as PaypalSubscriptionResource,
        );
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED": {
        const subId = resource.id as string | undefined;
        if (subId) {
          await markSubscriptionCanceled(PROVIDER, subId, {
            cancelAtPeriodEnd: true,
          });
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        const subId = resource.id as string | undefined;
        if (subId) {
          const existing = await getSubscriptionByProviderId(PROVIDER, subId);
          if (existing) {
            await syncSubscriptionState(
              PROVIDER,
              subId,
              SUBSCRIPTION_STATUS.PAUSED,
              existing.periodStart,
              existing.periodEnd,
            );
          }
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.EXPIRED": {
        const subId = resource.id as string | undefined;
        if (subId) {
          const existing = await getSubscriptionByProviderId(PROVIDER, subId);
          if (existing) {
            await syncSubscriptionState(
              PROVIDER,
              subId,
              SUBSCRIPTION_STATUS.EXPIRED,
              existing.periodStart,
              existing.periodEnd,
              { canceledAt: new Date() },
            );
          }
        }
        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        await handleSaleCompleted(resource);
        break;
      }

      default:
        console.log("Unhandled PayPal event type:", eventType);
    }

    await markWebhookProcessed(claim.id);
  } catch (err) {
    await markWebhookFailed(
      claim.id,
      err instanceof Error ? err.message : String(err),
    );
    throw err;
  }
}

async function handleOrderCompleted(order: PaypalOrderResource) {
  const customId = order.purchase_units?.[0]?.custom_id;
  const paymentId = parsePaymentIdFromCustomId(customId);
  const payment = await resolveLocalPayment({
    paymentId,
    sessionId: order.id,
  });

  if (!payment) {
    console.warn("PayPal order completed but no local payment", {
      orderId: order.id,
      customId,
    });
    return;
  }

  if (payment.status === PAYMENT_STATUS.PAID) return;

  const captureId =
    order.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? order.id;

  await fulfillOneTimePurchase(payment, {
    providerSessionId: order.id,
    providerTransactionId: captureId,
  });
}

async function handleCaptureCompleted(resource: Record<string, unknown>) {
  const supplementary = resource.supplementary_data as
    | { related_ids?: { order_id?: string } }
    | undefined;
  const orderId = supplementary?.related_ids?.order_id;
  const customId = resource.custom_id as string | undefined;
  const captureId = resource.id as string | undefined;
  const paymentId = parsePaymentIdFromCustomId(customId);

  const payment = await resolveLocalPayment({
    paymentId,
    sessionId: orderId,
  });

  if (!payment) {
    if (orderId) {
      try {
        const order = await paypalRequest<PaypalOrderResource>(
          `/v2/checkout/orders/${orderId}`,
          "GET",
        );
        await handleOrderCompleted(order);
        return;
      } catch (err) {
        console.warn("Failed to load order for capture event:", err);
      }
    }
    console.warn("PayPal capture completed but no local payment", {
      orderId,
      customId,
    });
    return;
  }

  if (payment.status === PAYMENT_STATUS.PAID) return;

  await fulfillOneTimePurchase(payment, {
    providerSessionId: orderId ?? payment.providerSessionId ?? undefined,
    providerTransactionId: captureId ?? orderId,
  });
}

async function handleSubscriptionActivated(sub: PaypalSubscriptionResource) {
  const paymentId = parsePaymentIdFromCustomId(sub.custom_id);
  const payment = await resolveLocalPayment({
    paymentId,
    sessionId: sub.id,
  });

  if (!payment) {
    console.warn("PayPal subscription activated but no local payment", {
      subscriptionId: sub.id,
      customId: sub.custom_id,
    });
    return;
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    const existing = await getSubscriptionByProviderId(PROVIDER, sub.id);
    if (existing) return;
  }

  const start = sub.start_time ? new Date(sub.start_time) : new Date();
  const { periodStart, periodEnd } = periodFromPlanId(payment.planId, start);
  const nextBilling = sub.billing_info?.next_billing_time
    ? new Date(sub.billing_info.next_billing_time)
    : periodEnd;

  await fulfillNewSubscription(payment, {
    provider: PROVIDER,
    providerSubscriptionId: sub.id,
    periodStart,
    periodEnd: nextBilling,
    providerSessionId: sub.id,
    providerTransactionId: sub.id,
  });
}

async function handleSubscriptionUpdated(sub: PaypalSubscriptionResource) {
  const existing = await getSubscriptionByProviderId(PROVIDER, sub.id);
  if (!existing) {
    if (sub.status === "ACTIVE" || sub.status === "APPROVED") {
      await handleSubscriptionActivated(sub);
    }
    return;
  }

  const start = sub.start_time
    ? new Date(sub.start_time)
    : existing.periodStart;
  const nextBilling = sub.billing_info?.next_billing_time
    ? new Date(sub.billing_info.next_billing_time)
    : existing.periodEnd;

  let status: string = SUBSCRIPTION_STATUS.ACTIVE;
  if (sub.status === "CANCELLED") status = SUBSCRIPTION_STATUS.CANCELED;
  else if (sub.status === "SUSPENDED") status = SUBSCRIPTION_STATUS.PAUSED;
  else if (sub.status === "EXPIRED") status = SUBSCRIPTION_STATUS.EXPIRED;

  await syncSubscriptionState(PROVIDER, sub.id, status, start, nextBilling, {
    cancelAtPeriodEnd: status === SUBSCRIPTION_STATUS.CANCELED,
    canceledAt:
      status === SUBSCRIPTION_STATUS.CANCELED ||
      status === SUBSCRIPTION_STATUS.EXPIRED
        ? new Date()
        : null,
  });
}

async function handleSaleCompleted(resource: Record<string, unknown>) {
  const subscriptionId =
    (resource.billing_agreement_id as string | undefined) ||
    (resource.subscription_id as string | undefined);

  if (!subscriptionId) {
    return;
  }

  const localSubscription = await getSubscriptionByProviderId(
    PROVIDER,
    subscriptionId,
  );
  if (!localSubscription) {
    try {
      const sub = await paypalRequest<PaypalSubscriptionResource>(
        `/v1/billing/subscriptions/${subscriptionId}`,
        "GET",
      );
      await handleSubscriptionActivated(sub);
    } catch (err) {
      console.warn("PayPal sale completed, subscription not found:", err);
    }
    return;
  }

  const amountValue =
    (resource.amount as { total?: string; value?: string } | undefined)
      ?.total ??
    (resource.amount as { total?: string; value?: string } | undefined)?.value;

  let amountCents: number | undefined;
  if (amountValue) {
    amountCents = Math.round(Number.parseFloat(amountValue) * 100);
  }

  const saleId = resource.id as string | undefined;
  const now = new Date();
  const { periodStart, periodEnd } = periodFromPlanId(
    localSubscription.planId,
    now,
  );

  let end = periodEnd;
  try {
    const sub = await paypalRequest<PaypalSubscriptionResource>(
      `/v1/billing/subscriptions/${subscriptionId}`,
      "GET",
    );
    if (sub.billing_info?.next_billing_time) {
      end = new Date(sub.billing_info.next_billing_time);
    }
  } catch {
    // use calculated periodEnd
  }

  await fulfillSubscriptionRenewal(localSubscription, {
    periodStart,
    periodEnd: end,
    amountCents,
    providerTransactionId: saleId,
  });
}
