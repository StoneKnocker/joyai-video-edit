import { eq } from "drizzle-orm";
import { db } from "@/lib/database/db.server";
import { type InsertUserSource, userSource } from "@/lib/database/schema";

export async function createUserSource(input: InsertUserSource) {
  const result = await db.insert(userSource).values(input).returning();
  return result[0];
}

export async function getUserSourceByUserId(userId: string) {
  const result = await db
    .select()
    .from(userSource)
    .where(eq(userSource.userId, userId))
    .limit(1);
  return result[0] || null;
}
