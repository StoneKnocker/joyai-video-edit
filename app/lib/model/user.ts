import { eq } from "drizzle-orm";
import { db } from "@/lib/database/db.server";
import { user } from "@/lib/database/schema";

export async function getUserById(userId: string) {
  const users = await db.select().from(user).where(eq(user.id, userId));
  return users[0] || null;
}

export async function getUserCount() {
  const result = await db.select({ count: user.id }).from(user);
  return result.length;
}
