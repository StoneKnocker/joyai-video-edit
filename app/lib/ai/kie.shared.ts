import { TASK_STATUS } from "~/lib/consts";

export type LocalTaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export interface KieCallbackPayload {
  taskId: string;
  state: string;
  resultUrls: string[];
  failMessage?: string;
}

interface VerifyKieWebhookSignatureParams {
  payload: unknown;
  timestamp: string | null | undefined;
  signature: string | null | undefined;
  secret: string | null | undefined;
}

const textEncoder = new TextEncoder();
const hmacKeyCache = new Map<string, CryptoKey>();

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const cached = hmacKeyCache.get(secret);
  if (cached) return cached;

  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  hmacKeyCache.set(secret, key);
  return key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function getKieDataPayload(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload)) return {};
  return isRecord(payload.data) ? payload.data : payload;
}

export function mapKieJobState(state: string): LocalTaskStatus {
  switch (state) {
    case "waiting":
    case "queuing":
      return TASK_STATUS.PENDING;
    case "generating":
      return TASK_STATUS.PROCESSING;
    case "success":
      return TASK_STATUS.COMPLETED;
    case "fail":
      return TASK_STATUS.FAILED;
    default:
      // Unknown states are treated as failed so tasks don't get stuck in limbo.
      // The caller can inspect the original state if needed for logging.
      return TASK_STATUS.FAILED;
  }
}

export function getKieResultUrls(payload: Record<string, unknown>): string[] {
  const { resultJson } = payload;
  if (!resultJson) return [];

  let parsed: unknown = resultJson;
  if (typeof resultJson === "string") {
    try {
      parsed = JSON.parse(resultJson);
    } catch {
      return [];
    }
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.resultUrls)) {
    return [];
  }

  return parsed.resultUrls.filter(
    (url): url is string => typeof url === "string" && url.length > 0,
  );
}

export function extractKieCallbackPayload(
  payload: unknown,
): KieCallbackPayload {
  const data = getKieDataPayload(payload);
  const taskId = getString(data.taskId) ?? getString(data.task_id);
  const state = getString(data.state);

  if (!taskId) {
    throw new Error("Missing task id");
  }
  if (!state) {
    throw new Error("Missing task state");
  }

  return {
    taskId,
    state,
    resultUrls: getKieResultUrls(data),
    failMessage: getString(data.failMsg) ?? getString(data.errorMessage),
  };
}

export function getKieWebhookTaskId(payload: unknown): string | undefined {
  const data = getKieDataPayload(payload);
  return getString(data.task_id) ?? getString(data.taskId);
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

export async function verifyKieWebhookSignature({
  payload,
  timestamp,
  signature,
  secret,
}: VerifyKieWebhookSignatureParams): Promise<boolean> {
  if (!timestamp || !signature || !secret) {
    return false;
  }

  const taskId = getKieWebhookTaskId(payload);
  if (!taskId) {
    return false;
  }

  const key = await importHmacKey(secret);
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(`${taskId}.${timestamp}`),
  );
  const expected = toBase64(digest);

  const expectedBytes = textEncoder.encode(expected);
  const receivedBytes = textEncoder.encode(signature);
  if (expectedBytes.byteLength !== receivedBytes.byteLength) {
    return false;
  }

  return timingSafeEqual(expectedBytes, receivedBytes);
}
