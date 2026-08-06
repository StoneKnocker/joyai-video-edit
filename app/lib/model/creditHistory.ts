import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/database/db.server";
import type { InsertCreditHistory } from "@/lib/database/schema";
import { creditHistory } from "@/lib/database/schema";

export async function addCreditHistory(
  data: Omit<InsertCreditHistory, "id" | "createdAt">,
) {
  await db.insert(creditHistory).values(data);
}

export async function getCreditHistoryByUserIdPaginated(
  userId: string,
  page: number,
  pageSize: number,
) {
  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(creditHistory)
      .where(eq(creditHistory.userId, userId))
      .orderBy(desc(creditHistory.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(creditHistory)
      .where(eq(creditHistory.userId, userId)),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
