import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PAYMENT_PROVIDER, PAYMENT_STATUS } from "~/lib/consts";
import {
  getPaymentByPublicId,
  getPaymentBySessionId,
} from "~/lib/model/payment";
import {
  getActiveSubscriptionByUserId,
  updateSubscriptionStatus,
} from "~/lib/model/subscription";
import {
  AlreadySubscribedError,
  type CheckoutResult,
  createCheckoutForPlan,
  getEnabledPaymentProviders,
} from "~/lib/payment";
import { confirmPaypalPayment } from "~/lib/payment/paypal/paypal.server";
import { cancelSubotizSubscription } from "~/lib/payment/subotiz/subotiz.server";
import { authedProcedure, publicProcedure, router } from "./init";
import type {
  ActiveSubscriptionResult,
  CheckoutCreateResult,
  PaymentStatusResult,
} from "./types";

const providerSchema = z.enum([
  PAYMENT_PROVIDER.SUBOTIZ,
  PAYMENT_PROVIDER.CREEM,
  PAYMENT_PROVIDER.PAYPAL,
]);

const createCheckoutSchema = z.object({
  planId: z.string(),
  provider: providerSchema.default(PAYMENT_PROVIDER.SUBOTIZ),
});

const checkStatusSchema = z
  .object({
    publicId: z.string().min(1).optional(),
    sessionId: z.string().min(1).optional(),
  })
  .refine((value) => value.publicId || value.sessionId, {
    message: "publicId or sessionId is required",
  });

const confirmCheckoutSchema = z.object({
  publicId: z.string().min(1),
});

function mapPaymentToStatusResult(payment: {
  status: string;
  amountCents: number;
  currency: string;
  creditsAmount: number;
  creditType: string;
  planId: string;
  provider: string;
}): PaymentStatusResult {
  const status =
    payment.status === PAYMENT_STATUS.PAID ||
    payment.status === PAYMENT_STATUS.CANCELED ||
    payment.status === PAYMENT_STATUS.FAILED ||
    payment.status === PAYMENT_STATUS.REFUNDED
      ? payment.status
      : PAYMENT_STATUS.PENDING;

  return {
    status: status as PaymentStatusResult["status"],
    amount: payment.amountCents,
    currency: payment.currency,
    creditsAmount: payment.creditsAmount,
    creditType: payment.creditType,
    planId: payment.planId,
    provider: payment.provider,
  };
}

export const paymentRouter = router({
  listProviders: publicProcedure.query(() => {
    return { providers: getEnabledPaymentProviders() };
  }),

  /**
   * Current active-like subscription for the signed-in user (single-plan model).
   */
  getActiveSubscription: authedProcedure.query(
    async ({ ctx }): Promise<ActiveSubscriptionResult> => {
      const sub = await getActiveSubscriptionByUserId(ctx.user.id);
      if (!sub) {
        return { subscription: null };
      }

      return {
        subscription: {
          planId: sub.planId,
          status: sub.status,
          provider: sub.provider,
          periodEnd: sub.periodEnd.toISOString(),
          cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
          canCancel:
            sub.provider === PAYMENT_PROVIDER.SUBOTIZ && !sub.cancelAtPeriodEnd,
        },
      };
    },
  ),

  /**
   * Cancel active subscription at period end (Subotiz only).
   * Access and subscription credits remain until periodEnd.
   */
  cancelSubscription: authedProcedure.mutation(
    async ({ ctx }): Promise<{ success: true; periodEnd: string }> => {
      const sub = await getActiveSubscriptionByUserId(ctx.user.id);
      if (!sub) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active subscription to cancel",
        });
      }

      if (sub.cancelAtPeriodEnd) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Subscription is already scheduled to cancel at period end",
        });
      }

      if (sub.provider !== PAYMENT_PROVIDER.SUBOTIZ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "In-app cancellation is only available for Subotiz subscriptions. Please contact support.",
        });
      }

      try {
        await cancelSubotizSubscription(sub.providerSubscriptionId, {
          cancelType: "end_of_period",
          cancelReason: "user_requested",
        });
      } catch (error) {
        console.error("Subotiz cancel subscription failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to cancel subscription",
        });
      }

      // Keep status active until period ends; only stop auto-renewal.
      await updateSubscriptionStatus(
        sub.provider,
        sub.providerSubscriptionId,
        sub.status,
        {
          cancelAtPeriodEnd: true,
          canceledAt: new Date(),
        },
      );

      return {
        success: true,
        periodEnd: sub.periodEnd.toISOString(),
      };
    },
  ),

  createCheckout: authedProcedure
    .input(createCheckoutSchema)
    .mutation(async ({ ctx, input }): Promise<CheckoutCreateResult> => {
      try {
        const checkout: CheckoutResult = await createCheckoutForPlan(
          input.planId,
          ctx.user.id,
          input.provider,
        );

        return {
          checkoutUrl: checkout.url,
          checkoutId: checkout.id,
          publicId: checkout.publicId,
        };
      } catch (error) {
        console.error("Checkout creation failed:", error);

        if (error instanceof AlreadySubscribedError) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Checkout creation failed",
        });
      }
    }),

  /**
   * Sync-confirm PayPal payment after return_url redirect (capture / activate).
   * Safe to call for Creem payments (no-op beyond status read).
   */
  confirmCheckout: authedProcedure
    .input(confirmCheckoutSchema)
    .mutation(async ({ ctx, input }): Promise<PaymentStatusResult> => {
      try {
        const payment = await getPaymentByPublicId(input.publicId);

        if (!payment || payment.userId !== ctx.user.id) {
          return { status: "not_found" };
        }

        if (payment.provider === PAYMENT_PROVIDER.PAYPAL) {
          return await confirmPaypalPayment(input.publicId, ctx.user.id);
        }

        return mapPaymentToStatusResult(payment);
      } catch (error) {
        console.error("Confirm checkout failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Confirm checkout failed",
        });
      }
    }),

  checkStatus: authedProcedure
    .input(checkStatusSchema)
    .query(async ({ ctx, input }): Promise<PaymentStatusResult> => {
      let payment = input.publicId
        ? await getPaymentByPublicId(input.publicId)
        : null;

      // sessionId lookup needs provider; try known providers when only session is given
      if (!payment && input.sessionId) {
        for (const provider of [
          PAYMENT_PROVIDER.SUBOTIZ,
          PAYMENT_PROVIDER.CREEM,
          PAYMENT_PROVIDER.PAYPAL,
          PAYMENT_PROVIDER.STRIPE,
        ]) {
          payment = await getPaymentBySessionId(provider, input.sessionId);
          if (payment) break;
        }
      }

      if (!payment || payment.userId !== ctx.user.id) {
        return {
          status: input.publicId ? "not_found" : PAYMENT_STATUS.PENDING,
        };
      }

      return mapPaymentToStatusResult(payment);
    }),
});
