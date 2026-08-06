import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { TASK_STATUS } from "~/lib/consts";
import {
  extractKieCallbackPayload,
  getKieResultUrls,
  mapKieJobState,
  verifyKieWebhookSignature,
} from "./kie.shared";

describe("KIE shared helpers", () => {
  it("maps KIE image/video job states to local task statuses", () => {
    expect(mapKieJobState("waiting")).toBe(TASK_STATUS.PENDING);
    expect(mapKieJobState("queuing")).toBe(TASK_STATUS.PENDING);
    expect(mapKieJobState("generating")).toBe(TASK_STATUS.PROCESSING);
    expect(mapKieJobState("success")).toBe(TASK_STATUS.COMPLETED);
    expect(mapKieJobState("fail")).toBe(TASK_STATUS.FAILED);
  });

  it("maps unknown KIE states to failed so callbacks don't silently stall", () => {
    expect(mapKieJobState("paused")).toBe(TASK_STATUS.FAILED);
    expect(mapKieJobState("canceled")).toBe(TASK_STATUS.FAILED);
    expect(mapKieJobState("")).toBe(TASK_STATUS.FAILED);
  });

  it("extracts callback task id and state from wrapped KIE payloads", () => {
    const payload = extractKieCallbackPayload({
      code: 200,
      msg: "ok",
      data: {
        task_id: "kie-task-1",
        taskId: "kie-task-1",
        state: "success",
        resultJson: JSON.stringify({
          resultUrls: ["https://example.com/result.mp4"],
        }),
      },
    });

    expect(payload).toEqual({
      taskId: "kie-task-1",
      state: "success",
      resultUrls: ["https://example.com/result.mp4"],
      failMessage: undefined,
    });
  });

  it("extracts result URLs from object or JSON string resultJson", () => {
    expect(
      getKieResultUrls({
        resultJson: { resultUrls: ["https://example.com/a.png"] },
      }),
    ).toEqual(["https://example.com/a.png"]);

    expect(
      getKieResultUrls({
        resultJson: JSON.stringify({
          resultUrls: [
            "https://example.com/a.mp4",
            "https://example.com/b.mp4",
          ],
        }),
      }),
    ).toEqual(["https://example.com/a.mp4", "https://example.com/b.mp4"]);
  });

  it("verifies KIE webhook signatures using task id and timestamp", async () => {
    const secret = "test-secret";
    const taskId = "kie-task-1";
    const timestamp = "1767600000";
    const signature = createHmac("sha256", secret)
      .update(`${taskId}.${timestamp}`)
      .digest("base64");

    await expect(
      verifyKieWebhookSignature({
        payload: { data: { task_id: taskId } },
        timestamp,
        signature,
        secret,
      }),
    ).resolves.toBe(true);

    await expect(
      verifyKieWebhookSignature({
        payload: { data: { task_id: taskId } },
        timestamp,
        signature: "bad-signature",
        secret,
      }),
    ).resolves.toBe(false);
  });

  it("verifies KIE webhook signatures when callback uses camelCase taskId", async () => {
    const secret = "test-secret";
    const taskId = "kie-task-2";
    const timestamp = "1767600001";
    const signature = createHmac("sha256", secret)
      .update(`${taskId}.${timestamp}`)
      .digest("base64");

    await expect(
      verifyKieWebhookSignature({
        payload: { data: { taskId } },
        timestamp,
        signature,
        secret,
      }),
    ).resolves.toBe(true);
  });
});
