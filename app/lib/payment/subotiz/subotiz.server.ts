import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import {
  CREDIT_TYPE,
  PAYMENT_KIND,
  PAYMENT_PROVIDER,
  PAYMENT_STATUS,
} from "@/lib/consts";
import { createPayment, updatePaymentSessionId } from "@/lib/model/payment";
import { getUserById } from "@/lib/model/user";
import { isDevelopment, serverEnv } from "~/lib/env.server";
import { getProduct, priceToCents } from "~/lib/payment/product";

const PROVIDER = PAYMENT_PROVIDER.SUBOTIZ;

type SubotizApiResponse<T> = {
  code?: string;
  message?: string;
  data?: T;
};

type CreateSessionData = {
  session_id: string;
  session_url?: string;
};

export function getSubotizApiBase(): string {
  if (serverEnv.SUBOTIZ_API_BASE) {
    return serverEnv.SUBOTIZ_API_BASE.replace(/\/$/, "");
  }
  return isDevelopment
    ? "https://api.sandbox.subotiz.com"
    : "https://api.subotiz.com";
}

export function isSubotizEnabled(): boolean {
  return (
    serverEnv.SUBOTIZ_ENABLED !== "false" && Boolean(serverEnv.SUBOTIZ_API_KEY)
  );
}

/**
 * Verify Subotiz webhook signature.
 * Signature string: `${X-Timestamp}.${raw_body}`
 * HMAC-SHA256 hex with SUBOTIZ_API_KEY as secret (merchant config).
 */
export function verifySubotizWebhook(
  timestamp: string,
  rawBody: string,
  signature: string,
): boolean {
  const secret = serverEnv.SUBOTIZ_API_KEY;
  if (!secret || !timestamp || !signature) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function subotizRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const apiKey = serverEnv.SUBOTIZ_API_KEY;
  if (!apiKey) {
    throw new Error("SUBOTIZ_API_KEY is not configured");
  }

  const url = `${getSubotizApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Request-Id": randomUUID(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let json: SubotizApiResponse<T>;
  try {
    json = JSON.parse(text) as SubotizApiResponse<T>;
  } catch {
    throw new Error(
      `Subotiz API non-JSON response (${response.status}): ${text.slice(0, 200)}`,
    );
  }

  if (!response.ok || (json.code && json.code !== "success")) {
    const msg = json.message ?? text.slice(0, 200);
    throw new Error(
      `Subotiz API error (${response.status}): ${json.code ?? "unknown"} ${msg}`,
    );
  }

  // Some mutations (e.g. cancel) may return success with empty data.
  return json.data as T;
}

export type SubotizCancelType = "end_of_period" | "immediate";

/**
 * Cancel a Subotiz subscription.
 * API: POST /api/v1/subscription/{id}/cancel
 * cancel_type: end_of_period (access until period end) | immediate
 */
export async function cancelSubotizSubscription(
  providerSubscriptionId: string,
  options: {
    cancelType?: SubotizCancelType;
    cancelReason?: string;
  } = {},
): Promise<unknown> {
  if (!isSubotizEnabled()) {
    throw new Error("Subotiz payment provider is not enabled");
  }

  return subotizRequest<unknown>(
    "POST",
    `/api/v1/subscription/${providerSubscriptionId}/cancel`,
    {
      cancel_type: options.cancelType ?? "end_of_period",
      cancel_reason: options.cancelReason ?? "user_requested",
    },
  );
}

export async function createSubotizCheckout(planId: string, userId: string) {
  if (!isSubotizEnabled()) {
    throw new Error("Subotiz payment provider is not enabled");
  }

  const product = getProduct(planId);
  if (!product.subotizPriceId) {
    throw new Error(`Missing Subotiz price ID for planId: ${planId}`);
  }

  const user = await getUserById(userId);
  if (!user?.email) {
    throw new Error("User email is required for Subotiz checkout");
  }

  const kind =
    product.creditType === CREDIT_TYPE.SUBSCRIPTION
      ? PAYMENT_KIND.SUBSCRIPTION_INITIAL
      : PAYMENT_KIND.ONE_TIME;

  const paymentMode =
    product.creditType === CREDIT_TYPE.SUBSCRIPTION
      ? "subscription"
      : "onetime_payment";

  try {
    const payment = await createPayment({
      userId,
      kind,
      amountCents: priceToCents(product.price),
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

    const session = await subotizRequest<CreateSessionData>(
      "POST",
      "/api/v1/session",
      {
        order_id: payment.publicId,
        payer_id: userId,
        email: user.email,
        line_items: [
          {
            price_id: product.subotizPriceId,
            quantity: "1",
          },
        ],
        integration_method: "hosted",
        mode: "checkout",
        payment_mode: paymentMode,
        return_url: successUrl.toString(),
        cancel_url: cancelUrl.toString(),
        metadata: {
          payment_id: String(payment.id),
          plan_id: planId,
          user_id: userId,
        },
      },
    );

    if (!session || !session.session_id || !session.session_url) {
      throw new Error("Subotiz session missing session_id or session_url");
    }

    await updatePaymentSessionId(payment.id, session.session_id);

    return {
      checkoutUrl: session.session_url,
      id: session.session_id,
      publicId: payment.publicId,
    };
  } catch (error) {
    console.error("Error creating Subotiz checkout:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to create Subotiz checkout");
  }
}

/** Deterministic fallback event id when webhook payload has no id */
export function fallbackWebhookEventId(
  timestamp: string,
  rawBody: string,
): string {
  return createHash("sha256")
    .update(`${timestamp}:${rawBody}`)
    .digest("hex")
    .slice(0, 40);
}
