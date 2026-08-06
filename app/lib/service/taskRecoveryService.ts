import { queryKieJob } from "~/lib/ai/kie.server";
import { listStaleTasks } from "~/lib/model/userTask";
import { applyKieJobToTask } from "~/lib/service/kieCallbackService";
import { setTaskFailed } from "~/lib/service/taskService";

/** Poll provider when we have an id but no terminal callback. */
const STALE_WITH_PROVIDER_MS = 2 * 60 * 1000;
/**
 * Fail+refund only if provider create never completed.
 * Uses updatedAt (create path touches before/after provider call as a lease).
 */
const STALE_WITHOUT_PROVIDER_MS = 10 * 60 * 1000;
const BATCH_LIMIT = 20;

/**
 * Recover stuck video tasks: poll KIE when we have a provider id,
 * or fail+refund if provider submission never completed.
 */
export async function recoverStaleVideoTasks(): Promise<{
  scanned: number;
  completed: number;
  failed: number;
  processing: number;
  skipped: number;
}> {
  const tasks = await listStaleTasks({
    staleWithProviderMs: STALE_WITH_PROVIDER_MS,
    staleWithoutProviderMs: STALE_WITHOUT_PROVIDER_MS,
    limit: BATCH_LIMIT,
  });

  const stats = {
    scanned: tasks.length,
    completed: 0,
    failed: 0,
    processing: 0,
    skipped: 0,
  };

  for (const task of tasks) {
    try {
      if (!task.providerTaskId) {
        await setTaskFailed(
          task.id,
          "Provider task submission timed out",
          "provider_submit_timeout",
        );
        stats.failed += 1;
        continue;
      }

      const providerState = await queryKieJob(task.providerTaskId);
      const outcome = await applyKieJobToTask({
        taskId: task.id,
        body: providerState.raw,
      });

      if (outcome === "completed") stats.completed += 1;
      else if (outcome === "failed") stats.failed += 1;
      else if (outcome === "processing") stats.processing += 1;
      else stats.skipped += 1;
    } catch (error) {
      console.warn("[task-recovery] Failed to recover task", {
        taskId: task.id,
        error,
      });
      stats.skipped += 1;
    }
  }

  if (stats.scanned > 0) {
    console.info("[task-recovery] Batch finished", stats);
  }

  return stats;
}
