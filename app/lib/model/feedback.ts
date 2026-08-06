import { db } from "@/lib/database/db.server";
import { feedback, type InsertFeedback } from "@/lib/database/schema";

export async function addFeedback(data: InsertFeedback) {
  const result = await db.insert(feedback).values(data).returning({
    id: feedback.id,
  });

  return result[0]?.id ?? null;
}
