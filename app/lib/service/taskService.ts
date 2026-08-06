import { randomUUID } from "node:crypto";
import type { SeedanceCreateTaskInput } from "@/lib/ai/seedance.shared";
import { TASK_STATUS } from "@/lib/consts";
import { db } from "@/lib/database/db.server";
import type { InsertUserTask } from "@/lib/database/schema";
import { userTask } from "@/lib/database/schema";
import { failTask, getTaskById } from "@/lib/model/userTask";
import {
  consumeCredits,
  refundCreditsByTaskId,
} from "@/lib/service/creditsService";

export interface CreateTaskParams {
  userId: string;
  mode: SeedanceCreateTaskInput["mode"];
  model: string;
  provider?: string;
  prompt: string;
  input: SeedanceCreateTaskInput;
  creditCost: number;
}

/**
 * Create a new video task and deduct credits.
 *
 * @returns Created task ID
 * @throws Error if credit deduction fails or task creation fails
 */
export async function createTask(params: CreateTaskParams): Promise<string> {
  const {
    userId,
    mode,
    model,
    provider = "kie",
    prompt,
    input,
    creditCost,
  } = params;

  const taskId = randomUUID();

  if (creditCost > 0) {
    await consumeCredits(userId, creditCost, `${mode}:${model}`, taskId);
  }

  const taskData: InsertUserTask = {
    id: taskId,
    userId,
    status: TASK_STATUS.PENDING,
    mode,
    model,
    provider,
    prompt,
    input,
    providerTaskId: null,
    creditCost,
  };

  await db.insert(userTask).values(taskData);

  return taskId;
}

/**
 * Set task as failed (idempotent) and refund credits once.
 */
export async function setTaskFailed(
  taskId: string,
  errorMessage: string,
  errorCode = "",
): Promise<void> {
  const task = await getTaskById(taskId);
  if (!task) {
    return;
  }

  const updated = await failTask(taskId, errorMessage, errorCode);

  // Only refund when we actually transitioned to failed
  if (updated && task.userId && task.creditCost > 0) {
    await refundCreditsByTaskId(taskId, `Task failed: ${errorMessage}`);
  }
}
