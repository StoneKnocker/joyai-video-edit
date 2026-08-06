import {
  CREDIT_TYPE,
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from "@/lib/consts";
import { getActiveSubscriptionByUserId } from "@/lib/model/subscription";
import { serverEnv } from "~/lib/env.server";
import {
  createCheckout as createCreemCheckout,
  isCreemEnabled,
} from "./creem/creem.server";
import { createPaypalCheckout, isPaypalEnabled } from "./paypal/paypal.server";
import { getProduct } from "./product";
import {
  createSubotizCheckout,
  isSubotizEnabled,
} from "./subotiz/subotiz.server";

export interface CheckoutResult {
  url: string;
  id: string;
  publicId?: string;
}

/** Thrown when user tries to start a second subscription while one is active. */
export class AlreadySubscribedError extends Error {
  readonly code = "ALREADY_SUBSCRIBED" as const;

  constructor(existingPlanId?: string) {
    super(
      existingPlanId
        ? `You already have an active subscription (${existingPlanId}). Cancel it or wait until it ends before starting a new plan.`
        : "You already have an active subscription. Cancel it or wait until it ends before starting a new plan.",
    );
    this.name = "AlreadySubscribedError";
  }
}

function getPrimaryProvider(): PaymentProvider {
  const configured = serverEnv.PAYMENT_PROVIDER;
  if (configured === PAYMENT_PROVIDER.CREEM && isCreemEnabled()) {
    return PAYMENT_PROVIDER.CREEM;
  }
  if (isSubotizEnabled()) {
    return PAYMENT_PROVIDER.SUBOTIZ;
  }
  if (isCreemEnabled()) {
    return PAYMENT_PROVIDER.CREEM;
  }
  // Fall back to configured primary even if keys missing (caller will error clearly)
  return configured === PAYMENT_PROVIDER.CREEM
    ? PAYMENT_PROVIDER.CREEM
    : PAYMENT_PROVIDER.SUBOTIZ;
}

export function getEnabledPaymentProviders(): PaymentProvider[] {
  const providers: PaymentProvider[] = [];
  const primary = getPrimaryProvider();

  if (primary === PAYMENT_PROVIDER.SUBOTIZ && isSubotizEnabled()) {
    providers.push(PAYMENT_PROVIDER.SUBOTIZ);
  } else if (primary === PAYMENT_PROVIDER.CREEM && isCreemEnabled()) {
    providers.push(PAYMENT_PROVIDER.CREEM);
  } else if (isSubotizEnabled()) {
    providers.push(PAYMENT_PROVIDER.SUBOTIZ);
  } else if (isCreemEnabled()) {
    providers.push(PAYMENT_PROVIDER.CREEM);
  }

  // Secondary card provider (optional)
  if (isCreemEnabled() && !providers.includes(PAYMENT_PROVIDER.CREEM)) {
    providers.push(PAYMENT_PROVIDER.CREEM);
  }
  if (isSubotizEnabled() && !providers.includes(PAYMENT_PROVIDER.SUBOTIZ)) {
    // only add subotiz as secondary when creem is primary
    if (primary === PAYMENT_PROVIDER.CREEM) {
      providers.push(PAYMENT_PROVIDER.SUBOTIZ);
    }
  }

  if (isPaypalEnabled()) {
    providers.push(PAYMENT_PROVIDER.PAYPAL);
  }

  return providers.length > 0 ? providers : [PAYMENT_PROVIDER.SUBOTIZ];
}

export function isProviderEnabled(provider: PaymentProvider): boolean {
  if (provider === PAYMENT_PROVIDER.SUBOTIZ) return isSubotizEnabled();
  if (provider === PAYMENT_PROVIDER.CREEM) return isCreemEnabled();
  if (provider === PAYMENT_PROVIDER.PAYPAL) return isPaypalEnabled();
  return false;
}

export async function createCheckoutForPlan(
  planId: string,
  userId: string,
  provider: PaymentProvider = getPrimaryProvider(),
): Promise<CheckoutResult> {
  if (!isProviderEnabled(provider)) {
    throw new Error(`Payment provider '${provider}' is not enabled`);
  }

  // Single-subscription model: subscription pocket is one SET per user.
  // Block stacking plans; one-time credit packs remain allowed.
  const product = getProduct(planId);
  if (product.creditType === CREDIT_TYPE.SUBSCRIPTION) {
    const active = await getActiveSubscriptionByUserId(userId);
    if (active) {
      throw new AlreadySubscribedError(active.planId);
    }
  }

  if (provider === PAYMENT_PROVIDER.SUBOTIZ) {
    const checkout = await createSubotizCheckout(planId, userId);
    return {
      url: checkout.checkoutUrl,
      id: checkout.id,
      publicId: checkout.publicId,
    };
  }

  if (provider === PAYMENT_PROVIDER.PAYPAL) {
    const checkout = await createPaypalCheckout(planId, userId);
    return {
      url: checkout.checkoutUrl,
      id: checkout.id,
      publicId: checkout.publicId,
    };
  }

  const checkout = await createCreemCheckout(planId, userId);
  return {
    url: checkout.checkoutUrl ?? "",
    id: checkout.id,
  };
}
