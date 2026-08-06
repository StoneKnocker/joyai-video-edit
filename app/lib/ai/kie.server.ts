import { serverEnv } from "~/lib/env.server";
import { mapKieJobState } from "./kie.shared";
import {
  buildSeedanceInput,
  SEEDANCE_MODEL,
  type SeedanceCreateTaskInput,
} from "./seedance.shared";

const KIE_BASE_URL = "https://api.kie.ai/api/v1";

export interface KieTaskResult {
  taskId: string;
  raw: unknown;
}

interface KieApiResponse {
  code?: number;
  msg?: string;
  data?: {
    taskId?: string;
    state?: string;
    resultJson?: string;
  };
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${serverEnv.KIE_API_KEY}`,
  };
}

async function requestKieTask(payload: Record<string, unknown>) {
  const response = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`KIE request failed with status ${response.status}`);
  }

  const body = (await response.json()) as KieApiResponse;
  if (body.code !== 200) {
    throw new Error(`task creation failed: ${body.msg ?? "unknown error"}`);
  }
  if (!body.data?.taskId) {
    throw new Error("task creation failed: missing taskId");
  }

  return {
    taskId: body.data.taskId,
    raw: body.data,
  };
}

export async function createKieSeedanceTask({
  callbackUrl,
  input,
}: {
  callbackUrl: string;
  input: SeedanceCreateTaskInput;
}): Promise<KieTaskResult> {
  return requestKieTask({
    model: SEEDANCE_MODEL,
    callBackUrl: callbackUrl,
    input: buildSeedanceInput(input),
  });
}

export async function queryKieJob(taskId: string) {
  const response = await fetch(
    `${KIE_BASE_URL}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    {
      method: "GET",
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(`KIE query failed with status ${response.status}`);
  }

  const body = (await response.json()) as KieApiResponse;
  if (body.code !== 200) {
    throw new Error(`KIE query failed: ${body.msg ?? "unknown error"}`);
  }
  if (!body.data?.state) {
    throw new Error("KIE query failed: missing state");
  }

  return {
    taskId,
    status: mapKieJobState(body.data.state),
    raw: body.data,
  };
}
