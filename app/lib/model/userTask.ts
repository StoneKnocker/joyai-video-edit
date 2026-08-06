import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  or,
  sql,
} from "drizzle-orm";
import type { TaskResultData } from "@/lib/ai/seedance.shared";
import { TASK_STATUS } from "@/lib/consts";
import { db } from "@/lib/database/db.server";
import type { SelectUserTask } from "@/lib/database/schema";
import { user, userTask } from "@/lib/database/schema";

const NON_TERMINAL_STATUSES = [
  TASK_STATUS.PENDING,
  TASK_STATUS.PROCESSING,
] as const;

export function isTaskTerminal(status: string) {
  return (
    status === TASK_STATUS.COMPLETED ||
    status === TASK_STATUS.FAILED ||
    status === TASK_STATUS.CANCELED
  );
}

export async function getTaskById(id: string) {
  const result = await db.select().from(userTask).where(eq(userTask.id, id));
  return result[0] || null;
}

export async function getTaskByIdForUser(id: string, userId: string) {
  const result = await db
    .select()
    .from(userTask)
    .where(and(eq(userTask.id, id), eq(userTask.userId, userId)));
  return result[0] || null;
}

/**
 * Mark task completed only if still non-terminal.
 * Returns true when this call performed the update (first winner).
 */
export async function completeTask(
  id: string,
  resultData: TaskResultData,
  extras?: { processingDurationMs?: number },
): Promise<boolean> {
  const result = await db
    .update(userTask)
    .set({
      status: TASK_STATUS.COMPLETED,
      resultData,
      errorMessage: "",
      errorCode: "",
      completedAt: new Date(),
      ...(typeof extras?.processingDurationMs === "number"
        ? { processingDurationMs: extras.processingDurationMs }
        : {}),
    })
    .where(
      and(
        eq(userTask.id, id),
        inArray(userTask.status, [...NON_TERMINAL_STATUSES]),
      ),
    )
    .returning({ id: userTask.id });

  return result.length > 0;
}

/**
 * Mark task failed only if still non-terminal.
 * Returns true when this call performed the update (first winner).
 */
export async function failTask(
  id: string,
  errorMessage: string,
  errorCode = "",
): Promise<boolean> {
  const result = await db
    .update(userTask)
    .set({
      status: TASK_STATUS.FAILED,
      errorMessage,
      errorCode,
      completedAt: new Date(),
    })
    .where(
      and(
        eq(userTask.id, id),
        inArray(userTask.status, [...NON_TERMINAL_STATUSES]),
      ),
    )
    .returning({ id: userTask.id });

  return result.length > 0;
}

export async function markTaskProcessing(id: string): Promise<void> {
  await db
    .update(userTask)
    .set({
      status: TASK_STATUS.PROCESSING,
    })
    .where(
      and(
        eq(userTask.id, id),
        inArray(userTask.status, [...NON_TERMINAL_STATUSES]),
      ),
    );
}

/**
 * Attach providerTaskId and move to processing only if still non-terminal
 * and not already submitted. Returns true when this call performed the update.
 * Prevents resurrecting tasks that recovery already failed+refunded while
 * createKieSeedanceTask was still in flight.
 */
export async function markTaskSubmitted(
  id: string,
  providerTaskId: string,
): Promise<boolean> {
  const result = await db
    .update(userTask)
    .set({
      status: TASK_STATUS.PROCESSING,
      providerTaskId,
    })
    .where(
      and(
        eq(userTask.id, id),
        inArray(userTask.status, [...NON_TERMINAL_STATUSES]),
        isNull(userTask.providerTaskId),
      ),
    )
    .returning({ id: userTask.id });

  return result.length > 0;
}

export async function touchTaskUpdatedAt(id: string): Promise<boolean> {
  const result = await db
    .update(userTask)
    .set({
      // Force updatedAt refresh even when status is unchanged (create lease / R2 retry)
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userTask.id, id),
        inArray(userTask.status, [...NON_TERMINAL_STATUSES]),
      ),
    )
    .returning({ id: userTask.id });

  return result.length > 0;
}

/**
 * Patch resultData while non-terminal (e.g. R2 persistAttempts).
 * Returns true when this call performed the update.
 */
export async function updateNonTerminalResultData(
  id: string,
  resultData: TaskResultData,
): Promise<boolean> {
  const result = await db
    .update(userTask)
    .set({
      resultData,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userTask.id, id),
        inArray(userTask.status, [...NON_TERMINAL_STATUSES]),
      ),
    )
    .returning({ id: userTask.id });

  return result.length > 0;
}

export async function getTaskByProviderTaskId(providerTaskId: string) {
  const result = await db
    .select()
    .from(userTask)
    .where(eq(userTask.providerTaskId, providerTaskId));
  return result[0] || null;
}

/**
 * Stale non-terminal tasks for cron recovery.
 * - With providerTaskId: updated older than staleWithProviderMs
 * - Without providerTaskId: updated older than staleWithoutProviderMs
 *   (uses updatedAt so an in-flight provider create can lease via touchTaskUpdatedAt)
 */
export async function listStaleTasks({
  staleWithProviderMs,
  staleWithoutProviderMs,
  limit = 20,
}: {
  staleWithProviderMs: number;
  staleWithoutProviderMs: number;
  limit?: number;
}): Promise<SelectUserTask[]> {
  const now = Date.now();
  const withProviderCutoff = new Date(now - staleWithProviderMs);
  const withoutProviderCutoff = new Date(now - staleWithoutProviderMs);

  return db
    .select()
    .from(userTask)
    .where(
      and(
        inArray(userTask.status, [...NON_TERMINAL_STATUSES]),
        or(
          and(
            isNotNull(userTask.providerTaskId),
            lt(userTask.updatedAt, withProviderCutoff),
          ),
          and(
            isNull(userTask.providerTaskId),
            lt(userTask.updatedAt, withoutProviderCutoff),
          ),
        ),
      ),
    )
    .orderBy(userTask.updatedAt)
    .limit(limit);
}

export async function getAllUserTasksPaginated(
  page: number,
  pageSize: number,
  filters?: { userId?: string; emailPrefix?: string },
) {
  const offset = (page - 1) * pageSize;
  const conditions = [];

  if (filters?.userId) {
    conditions.push(eq(userTask.userId, filters.userId));
  }
  if (filters?.emailPrefix) {
    conditions.push(like(user.email, `${filters.emailPrefix}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: userTask.id,
        userId: userTask.userId,
        status: userTask.status,
        mode: userTask.mode,
        model: userTask.model,
        provider: userTask.provider,
        prompt: userTask.prompt,
        input: userTask.input,
        resultData: userTask.resultData,
        errorMessage: userTask.errorMessage,
        errorCode: userTask.errorCode,
        creditCost: userTask.creditCost,
        providerTaskId: userTask.providerTaskId,
        createdAt: userTask.createdAt,
        completedAt: userTask.completedAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(userTask)
      .leftJoin(user, eq(userTask.userId, user.id))
      .where(whereClause)
      .orderBy(desc(userTask.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(userTask)
      .leftJoin(user, eq(userTask.userId, user.id))
      .where(whereClause),
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

export async function getUsersWithTasks() {
  const result = await db
    .selectDistinct({
      userId: userTask.userId,
      name: user.name,
      email: user.email,
    })
    .from(userTask)
    .innerJoin(user, eq(userTask.userId, user.id));

  return result;
}

export async function getUserCompletedTasksPaginated(
  userId: string,
  page: number,
  pageSize: number,
) {
  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: userTask.id,
        mode: userTask.mode,
        model: userTask.model,
        prompt: userTask.prompt,
        input: userTask.input,
        resultData: userTask.resultData,
        creditCost: userTask.creditCost,
        createdAt: userTask.createdAt,
        completedAt: userTask.completedAt,
      })
      .from(userTask)
      .where(
        and(
          eq(userTask.userId, userId),
          eq(userTask.status, TASK_STATUS.COMPLETED),
        ),
      )
      .orderBy(desc(userTask.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(userTask)
      .where(
        and(
          eq(userTask.userId, userId),
          eq(userTask.status, TASK_STATUS.COMPLETED),
        ),
      ),
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
