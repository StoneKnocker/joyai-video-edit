import { createCreem } from "creem_io";
import {
  CREDIT_TYPE,
  PAYMENT_KIND,
  PAYMENT_PROVIDER,
  PAYMENT_STATUS,
} from "@/lib/consts";
import { createPayment, updatePaymentSessionId } from "@/lib/model/payment";
import { isDevelopment, serverEnv } from "~/lib/env.server";
import { getProduct, priceToCents } from "~/lib/payment/product";

export const creem = createCreem({
  apiKey: serverEnv.CREEM_API_KEY ?? "",
  webhookSecret: serverEnv.CREEM_WEBHOOK_SECRET ?? "",
  testMode: isDevelopment,
});

/** Explicit opt-in: CREEM_ENABLED=true and API key present. */
export function isCreemEnabled(): boolean {
  return serverEnv.CREEM_ENABLED === "true" && Boolean(serverEnv.CREEM_API_KEY);
}

export async function createCheckout(planId: string, userId: string) {
  const product = getProduct(planId);

  if (!product.creemProductId) {
    throw new Error(`Missing Creem product ID for planId: ${planId}`);
  }

  const kind =
    product.creditType === CREDIT_TYPE.SUBSCRIPTION
      ? PAYMENT_KIND.SUBSCRIPTION_INITIAL
      : PAYMENT_KIND.ONE_TIME;

  try {
    // Create payment record first
    const payment = await createPayment({
      userId,
      kind,
      amountCents: priceToCents(product.price),
      currency: "USD",
      planId,
      provider: PAYMENT_PROVIDER.CREEM,
      creditType: product.creditType,
      creditsAmount: product.creditsAmount,
      status: PAYMENT_STATUS.PENDING,
      metadata: {},
    });

    const successUrl = new URL("/payment/success", serverEnv.APP_URL);
    successUrl.searchParams.set("public_id", payment.publicId);

    // Create a checkout session
    const checkout = await creem.checkouts.create({
      productId: product.creemProductId,
      successUrl: successUrl.toString(),
      metadata: { payment_id: payment.id.toString() },
    });

    await updatePaymentSessionId(payment.id, checkout.id);

    return checkout;
  } catch (error) {
    console.error("Error creating creem checkout:", error);
    throw new Error("Failed to create checkout");
  }
}
