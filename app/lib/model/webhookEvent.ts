import { and, eq } from "drizzle-orm";
import { WEBHOOK_EVENT_STATUS } from "@/lib/consts";
import { db } from "@/lib/database/db.server";
import { webhookEvent } from "@/lib/database/schema";

export type ClaimWebhookResult =
  | { claimed: true; id: number }
  | { claimed: false; reason: "duplicate" | "already_processed" };

/**
 * Try to claim a webhook event for processing.
 * Returns claimed:false if (provider, eventId) already exists.
 */
export async function tryClaimWebhookEvent(input: {
  provider: string;
  eventId: string;
  eventType: string;
  payload?: string;
}): Promise<ClaimWebhookResult> {
  try {
    const result = await db
      .insert(webhookEvent)
      .values({
        provider: input.provider,
        eventId: input.eventId,
        eventType: input.eventType,
        status: WEBHOOK_EVENT_STATUS.RECEIVED,
        payload: input.payload,
      })
      .returning({ id: webhookEvent.id });

    if (!result[0]) {
      return { claimed: false, reason: "duplicate" };
    }

    return { claimed: true, id: result[0].id };
  } catch (error) {
    // UNIQUE(provider, eventId) conflict
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("UNIQUE") ||
      message.includes("unique") ||
      message.includes("constraint")
    ) {
      return { claimed: false, reason: "duplicate" };
    }
    throw error;
  }
}

export async function markWebhookProcessed(id: number): Promise<void> {
  await db
    .update(webhookEvent)
    .set({
      status: WEBHOOK_EVENT_STATUS.PROCESSED,
      processedAt: new Date(),
    })
    .where(eq(webhookEvent.id, id));
}

export async function markWebhookFailed(
  id: number,
  errorMessage: string,
): Promise<void> {
  await db
    .update(webhookEvent)
    .set({
      status: WEBHOOK_EVENT_STATUS.FAILED,
      errorMessage: errorMessage.slice(0, 2000),
      processedAt: new Date(),
    })
    .where(eq(webhookEvent.id, id));
}

export async function getWebhookEvent(provider: string, eventId: string) {
  const result = await db
    .select()
    .from(webhookEvent)
    .where(
      and(
        eq(webhookEvent.provider, provider),
        eq(webhookEvent.eventId, eventId),
      ),
    );

  return result[0] || null;
}
