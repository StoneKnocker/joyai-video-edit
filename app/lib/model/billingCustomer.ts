import { and, eq } from "drizzle-orm";
import { db } from "@/lib/database/db.server";
import { billingCustomer } from "@/lib/database/schema";

export async function upsertBillingCustomer(
  userId: string,
  provider: string,
  providerCustomerId: string,
): Promise<void> {
  await db
    .insert(billingCustomer)
    .values({
      userId,
      provider,
      providerCustomerId,
    })
    .onConflictDoUpdate({
      target: [billingCustomer.userId, billingCustomer.provider],
      set: {
        providerCustomerId,
      },
    });
}

export async function getBillingCustomer(userId: string, provider: string) {
  const result = await db
    .select()
    .from(billingCustomer)
    .where(
      and(
        eq(billingCustomer.userId, userId),
        eq(billingCustomer.provider, provider),
      ),
    );

  return result[0] || null;
}

export async function getBillingCustomerByProviderId(
  provider: string,
  providerCustomerId: string,
) {
  const result = await db
    .select()
    .from(billingCustomer)
    .where(
      and(
        eq(billingCustomer.provider, provider),
        eq(billingCustomer.providerCustomerId, providerCustomerId),
      ),
    );

  return result[0] || null;
}
