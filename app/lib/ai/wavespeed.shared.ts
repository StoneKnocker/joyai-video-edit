/**
 * WaveSpeed content-moderator shared types and pure helpers.
 *
 * The moderator returns five boolean dimensions per input. Only sexual content
 * blocks video generation; violence/harassment/hate are common in creative video
 * and are intentionally not treated as NSFW.
 */

export interface ModerationOutput {
  harassment?: boolean;
  hate?: boolean;
  sexual?: boolean;
  "sexual/minors"?: boolean;
  violence?: boolean;
}

export interface ModerationResult {
  outputs: ModerationOutput[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asBool(value: unknown): boolean | undefined {
  return value === true || value === false ? value : undefined;
}

function parseOutput(value: unknown): ModerationOutput | null {
  if (!isRecord(value)) return null;
  return {
    harassment: asBool(value.harassment),
    hate: asBool(value.hate),
    sexual: asBool(value.sexual),
    "sexual/minors": asBool(value["sexual/minors"]),
    violence: asBool(value.violence),
  };
}

/**
 * Extract moderation outputs from a WaveSpeed sync-mode response body.
 * Tolerates both `{ data: { outputs } }` and top-level `{ outputs }` shapes.
 *
 * Throws when the response is incomplete or has no usable outputs. Callers must
 * not treat a missing signal as "safe" — only a successful parse yields a decision.
 */
export function parseModerationOutputs(body: unknown): ModerationOutput[] {
  const root = isRecord(body) ? body : null;
  if (!root) {
    throw new Error("WaveSpeed moderation: invalid response body");
  }

  const data = isRecord(root.data) ? root.data : root;

  // Sync mode may return before the task completes (timeout / still processing).
  // Empty outputs without completed status must not be treated as safe.
  const status = data.status;
  if (typeof status === "string" && status !== "completed") {
    throw new Error(`WaveSpeed moderation incomplete: status=${status}`);
  }

  const outputs = data.outputs;
  if (!Array.isArray(outputs) || outputs.length === 0) {
    throw new Error("WaveSpeed moderation: empty or missing outputs");
  }

  const parsed = outputs
    .map(parseOutput)
    .filter((o): o is ModerationOutput => o !== null);

  if (parsed.length === 0) {
    throw new Error("WaveSpeed moderation: no valid outputs");
  }

  return parsed;
}

/**
 * NSFW when any sexual dimension is flagged.
 * Only call after a successful parse (non-empty outputs). An empty array is
 * "no flags", not "moderation succeeded and content is safe."
 */
export function isModerationNsfw(outputs: ModerationOutput[]): boolean {
  return outputs.some((o) => o.sexual === true || o["sexual/minors"] === true);
}
