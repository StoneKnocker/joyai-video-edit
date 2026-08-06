export interface CheckoutCreateResult {
  checkoutUrl: string;
  checkoutId: string;
  publicId?: string;
}

export type PaymentStatusState =
  | "pending"
  | "paid"
  | "canceled"
  | "failed"
  | "refunded"
  | "not_found";

export interface PaymentStatusResult {
  status: PaymentStatusState;
  amount?: number;
  currency?: string;
  creditsAmount?: number;
  creditType?: string;
  planId?: string;
  provider?: string;
}

export interface ActiveSubscriptionResult {
  subscription: {
    planId: string;
    status: string;
    provider: string;
    periodEnd: string;
    cancelAtPeriodEnd: boolean;
    /** In-app cancel currently supported for Subotiz only */
    canCancel: boolean;
  } | null;
}
