import { and, eq } from "drizzle-orm";
import { db } from "@/lib/database/db.server";
import type { InsertPayment } from "@/lib/database/schema";
import { payment } from "@/lib/database/schema";

export async function createPayment(
  data: Omit<InsertPayment, "id" | "createdAt" | "updatedAt" | "publicId"> & {
    publicId?: string;
  },
): Promise<{ id: number; publicId: string }> {
  const result = await db.insert(payment).values(data).returning({
    id: payment.id,
    publicId: payment.publicId,
  });

  if (!result[0]) {
    throw new Error("Failed to create payment");
  }

  return result[0];
}

export async function getPaymentById(id: number) {
  const result = await db.select().from(payment).where(eq(payment.id, id));

  return result[0] || null;
}

export async function getPaymentByPublicId(publicId: string) {
  const result = await db
    .select()
    .from(payment)
    .where(eq(payment.publicId, publicId));

  return result[0] || null;
}

export async function getPaymentBySessionId(
  provider: string,
  providerSessionId: string,
) {
  const result = await db
    .select()
    .from(payment)
    .where(
      and(
        eq(payment.provider, provider),
        eq(payment.providerSessionId, providerSessionId),
      ),
    );

  return result[0] || null;
}

export async function getPaymentByTransactionId(
  provider: string,
  providerTransactionId: string,
) {
  const result = await db
    .select()
    .from(payment)
    .where(
      and(
        eq(payment.provider, provider),
        eq(payment.providerTransactionId, providerTransactionId),
      ),
    );

  return result[0] || null;
}

export async function updatePaymentStatus(
  id: number,
  status: string,
  options: {
    providerSessionId?: string;
    providerTransactionId?: string;
    subscriptionId?: number;
    paidAt?: Date | null;
  } = {},
) {
  await db
    .update(payment)
    .set({
      status,
      ...(options.providerSessionId && {
        providerSessionId: options.providerSessionId,
      }),
      ...(options.providerTransactionId && {
        providerTransactionId: options.providerTransactionId,
      }),
      ...(options.subscriptionId != null && {
        subscriptionId: options.subscriptionId,
      }),
      ...(options.paidAt !== undefined && { paidAt: options.paidAt }),
    })
    .where(eq(payment.id, id));
}

export async function updatePaymentSessionId(
  id: number,
  providerSessionId: string,
) {
  await db
    .update(payment)
    .set({
      providerSessionId,
    })
    .where(eq(payment.id, id));
}

export async function linkPaymentToSubscription(
  id: number,
  subscriptionId: number,
) {
  await db.update(payment).set({ subscriptionId }).where(eq(payment.id, id));
}
