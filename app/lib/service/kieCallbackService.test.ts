import { beforeEach, describe, expect, it, vi } from "vitest";

const completeTaskMock = vi.fn();
const setTaskFailedMock = vi.fn();
const downloadAndUploadMock = vi.fn();
const markTaskProcessingMock = vi.fn();
const getTaskByIdMock = vi.fn();
const updateNonTerminalResultDataMock = vi.fn();

vi.mock("~/lib/model/userTask", () => ({
  completeTask: completeTaskMock,
  getTaskById: getTaskByIdMock,
  getTaskByProviderTaskId: vi.fn(),
  isTaskTerminal: (status: string) =>
    status === "completed" || status === "failed" || status === "canceled",
  markTaskProcessing: markTaskProcessingMock,
  updateNonTerminalResultData: updateNonTerminalResultDataMock,
}));

vi.mock("~/lib/r2/r2.server", () => ({
  downloadAndUpload: downloadAndUploadMock,
  getServerR2Url: (key: string) => `https://r2.example.com/${key}`,
}));

vi.mock("~/lib/service/taskService", () => ({
  setTaskFailed: setTaskFailedMock,
}));

vi.mock("../env.server", () => ({
  serverEnv: {
    KIE_WEBHOOK_HMAC_KEY: "test-secret",
  },
}));

function nonTerminalTask(
  overrides: { resultData?: unknown; status?: string } = {},
) {
  return {
    id: "task-1",
    status: overrides.status ?? "processing",
    resultData: overrides.resultData ?? {},
  };
}

describe("KIE callback service", () => {
  beforeEach(() => {
    completeTaskMock.mockReset();
    setTaskFailedMock.mockReset();
    downloadAndUploadMock.mockReset();
    markTaskProcessingMock.mockReset();
    getTaskByIdMock.mockReset();
    updateNonTerminalResultDataMock.mockReset();
    downloadAndUploadMock.mockResolvedValue(true);
    completeTaskMock.mockResolvedValue(true);
    updateNonTerminalResultDataMock.mockResolvedValue(true);
    getTaskByIdMock.mockResolvedValue(nonTerminalTask());
  });

  it("skips R2 work when task is already terminal", async () => {
    getTaskByIdMock.mockResolvedValue(nonTerminalTask({ status: "completed" }));
    const { completeKieTaskFromPayload } = await import("./kieCallbackService");

    const outcome = await completeKieTaskFromPayload({
      taskId: "task-done",
      body: {
        resultJson: JSON.stringify({
          resultUrls: ["https://kie.example.com/result.mp4"],
        }),
      },
    });

    expect(outcome).toBe("skipped");
    expect(downloadAndUploadMock).not.toHaveBeenCalled();
    expect(completeTaskMock).not.toHaveBeenCalled();
  });

  it("persists Seedance videos and frames with typed resultData", async () => {
    const { completeKieTaskFromPayload } = await import("./kieCallbackService");

    await completeKieTaskFromPayload({
      taskId: "task-1",
      body: {
        resultJson: JSON.stringify({
          resultUrls: ["https://kie.example.com/result.mp4"],
          firstFrameUrl: "https://kie.example.com/first.webp",
          lastFrameUrl: "https://kie.example.com/last.webp",
        }),
        costTime: 12_000,
      },
    });

    expect(downloadAndUploadMock).toHaveBeenCalledTimes(3);
    expect(downloadAndUploadMock).toHaveBeenNthCalledWith(
      2,
      "https://kie.example.com/first.webp",
      "kie/results/task-1/2.webp",
    );
    expect(downloadAndUploadMock).toHaveBeenNthCalledWith(
      3,
      "https://kie.example.com/last.webp",
      "kie/results/task-1/3.webp",
    );
    expect(completeTaskMock).toHaveBeenCalledWith(
      "task-1",
      {
        videos: [{ key: "kie/results/task-1/1.mp4", contentType: "video/mp4" }],
        frames: [
          { key: "kie/results/task-1/2.webp", role: "first" },
          { key: "kie/results/task-1/3.webp", role: "last" },
        ],
        posterKey: "kie/results/task-1/2.webp",
      },
      { processingDurationMs: 12_000 },
    );
  });

  it("fails when result has no video files", async () => {
    const { completeKieTaskFromPayload } = await import("./kieCallbackService");

    await completeKieTaskFromPayload({
      taskId: "task-2",
      body: {
        resultJson: JSON.stringify({
          resultUrls: ["https://kie.example.com/frame.webp"],
        }),
      },
    });

    expect(setTaskFailedMock).toHaveBeenCalledWith(
      "task-2",
      "KIE result did not include any video files",
    );
    expect(completeTaskMock).not.toHaveBeenCalled();
  });

  it("leaves task non-terminal when R2 upload fails under retry cap", async () => {
    downloadAndUploadMock.mockResolvedValue(false);
    getTaskByIdMock.mockResolvedValue(
      nonTerminalTask({ resultData: { videos: [], persistAttempts: 1 } }),
    );
    const { completeKieTaskFromPayload } = await import("./kieCallbackService");

    const outcome = await completeKieTaskFromPayload({
      taskId: "task-3",
      body: {
        resultJson: JSON.stringify({
          resultUrls: ["https://kie.example.com/result.mp4"],
        }),
      },
    });

    expect(outcome).toBe("processing");
    expect(setTaskFailedMock).not.toHaveBeenCalled();
    expect(completeTaskMock).not.toHaveBeenCalled();
    expect(updateNonTerminalResultDataMock).toHaveBeenCalledWith("task-3", {
      videos: [],
      persistAttempts: 2,
    });
  });

  it("fails after max R2 persist attempts", async () => {
    downloadAndUploadMock.mockResolvedValue(false);
    getTaskByIdMock.mockResolvedValue(
      nonTerminalTask({
        resultData: { videos: [], persistAttempts: 4 },
      }),
    );
    const { completeKieTaskFromPayload, MAX_R2_PERSIST_ATTEMPTS } =
      await import("./kieCallbackService");

    expect(MAX_R2_PERSIST_ATTEMPTS).toBe(5);

    const outcome = await completeKieTaskFromPayload({
      taskId: "task-4",
      body: {
        resultJson: JSON.stringify({
          resultUrls: ["https://kie.example.com/result.mp4"],
        }),
      },
    });

    expect(outcome).toBe("failed");
    expect(setTaskFailedMock).toHaveBeenCalledWith(
      "task-4",
      "Failed to persist video results after retries",
      "r2_persist_exhausted",
    );
    expect(completeTaskMock).not.toHaveBeenCalled();
  });

  it("marks pending→processing once", async () => {
    getTaskByIdMock.mockResolvedValue(nonTerminalTask({ status: "pending" }));
    const { applyKieJobToTask } = await import("./kieCallbackService");

    const outcome = await applyKieJobToTask({
      taskId: "task-1",
      body: { data: { state: "generating" } },
    });

    expect(outcome).toBe("processing");
    expect(markTaskProcessingMock).toHaveBeenCalledWith("task-1");
  });

  it("does not write while already processing", async () => {
    getTaskByIdMock.mockResolvedValue(
      nonTerminalTask({ status: "processing" }),
    );
    const { applyKieJobToTask } = await import("./kieCallbackService");

    const outcome = await applyKieJobToTask({
      taskId: "task-1",
      body: { data: { state: "generating" } },
    });

    expect(outcome).toBe("processing");
    expect(markTaskProcessingMock).not.toHaveBeenCalled();
  });
});
