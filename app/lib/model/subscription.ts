import { and, eq, inArray, ne } from "drizzle-orm";
import { SUBSCRIPTION_STATUS } from "@/lib/consts";
import { db } from "@/lib/database/db.server";
import type { InsertSubscription } from "@/lib/database/schema";
import { subscription } from "@/lib/database/schema";

/** Statuses that mean the user is still on a plan (blocks a second subscription). */
const ACTIVE_LIKE_STATUSES = [
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIALING,
  SUBSCRIPTION_STATUS.PAST_DUE,
  SUBSCRIPTION_STATUS.PAUSED,
] as const;

export async function createSubscription(
  data: Omit<
    InsertSubscription,
    "id" | "createdAt" | "updatedAt" | "publicId"
  > & { publicId?: string },
): Promise<number> {
  const result = await db.insert(subscription).values(data).returning({
    id: subscription.id,
  });

  if (!result[0]) {
    throw new Error("Failed to create subscription");
  }

  return result[0].id;
}

/**
 * Returns one active-like subscription for the user, if any.
 * Used to enforce single-subscription (no stacked plans).
 */
export async function getActiveSubscriptionByUserId(userId: string) {
  const result = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, userId),
        inArray(subscription.status, [...ACTIVE_LIKE_STATUSES]),
      ),
    )
    .limit(1);

  return result[0] || null;
}

export async function getSubscriptionById(id: number) {
  const result = await db
    .select()
    .from(subscription)
    .where(eq(subscription.id, id));

  return result[0] || null;
}

export async function getSubscriptionByProviderId(
  provider: string,
  providerSubscriptionId: string,
) {
  const result = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.provider, provider),
        eq(subscription.providerSubscriptionId, providerSubscriptionId),
      ),
    );

  return result[0] || null;
}

export async function updateSubscriptionPeriod(
  provider: string,
  providerSubscriptionId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  const result = await db
    .update(subscription)
    .set({
      periodStart,
      periodEnd,
    })
    .where(
      and(
        eq(subscription.provider, provider),
        eq(subscription.providerSubscriptionId, providerSubscriptionId),
        ne(subscription.periodEnd, periodEnd),
      ),
    );

  return result.meta.changed_db;
}

export async function updateSubscriptionStatus(
  provider: string,
  providerSubscriptionId: string,
  status: string,
  options: {
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | null;
  } = {},
) {
  const result = await db
    .update(subscription)
    .set({
      status,
      ...(options.cancelAtPeriodEnd !== undefined && {
        cancelAtPeriodEnd: options.cancelAtPeriodEnd,
      }),
      ...(options.canceledAt !== undefined && {
        canceledAt: options.canceledAt,
      }),
    })
    .where(
      and(
        eq(subscription.provider, provider),
        eq(subscription.providerSubscriptionId, providerSubscriptionId),
      ),
    );

  return result.meta.changed_db;
}
