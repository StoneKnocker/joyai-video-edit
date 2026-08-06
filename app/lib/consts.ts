export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  CANCELED: "canceled",
  REFUNDED: "refunded",
} as const;

/** one_time pack | first sub payment | renewal | refund */
export const PAYMENT_KIND = {
  ONE_TIME: "one_time",
  SUBSCRIPTION_INITIAL: "subscription_initial",
  SUBSCRIPTION_RENEWAL: "subscription_renewal",
  REFUND: "refund",
} as const;

// Provider-agnostic subscription states (map Stripe/PayPal/Creem into these)
export const SUBSCRIPTION_STATUS = {
  PENDING: "pending",
  TRIALING: "trialing",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  PAUSED: "paused",
  CANCELED: "canceled",
  EXPIRED: "expired",
} as const;

// 'PERMANENT', 'SUBSCRIPTION' (指明动了哪个口袋的钱)
export const CREDIT_TYPE = {
  PERMANENT: "permanent",
  SUBSCRIPTION: "subscription",
} as const;

// type TEXT NOT NULL,                     -- 'PURCHASE', 'SUBSCRIPTION_GRANT', 'SUBSCRIPTION_RESET', 'USAGE', 'REFUND'
export const CREDIT_EVENT = {
  NEW_USER_GRANT: "new_user_grant",
  USAGE: "usage",
  REFUND: "refund",
  PURCHASE: "purchase",
  SUBSCRIPTION_GRANT: "subscription_grant",
  SUBSCRIPTION_RESET: "subscription_reset",
  CHECK_IN_GRANT: "check_in_grant",
  MANUAL_ADJUSTMENT: "manual_adjustment",
} as const;

export const WEBHOOK_EVENT_STATUS = {
  RECEIVED: "received",
  PROCESSED: "processed",
  FAILED: "failed",
} as const;

// PENDING(排队中), PROCESSING(生成中), COMPLETED(成功), FAILED(失败), CANCELLED(取消)
export const TASK_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELED: "canceled",
} as const;

export const PAYMENT_PROVIDER = {
  SUBOTIZ: "subotiz",
  CREEM: "creem",
  PAYPAL: "paypal",
  STRIPE: "stripe",
} as const;

export type PaymentProvider =
  (typeof PAYMENT_PROVIDER)[keyof typeof PAYMENT_PROVIDER];

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type PaymentKind = (typeof PAYMENT_KIND)[keyof typeof PAYMENT_KIND];
export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];
