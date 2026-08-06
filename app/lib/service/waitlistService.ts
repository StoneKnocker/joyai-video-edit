/**
 * Waitlist email validation + join logic.
 * Store is injected so production uses D1 and tests can use an in-memory store
 * without mocking this module's own functions.
 */

const EMAIL_MAX = 255;
// Practical email check: local@domain with a TLD of at least 2 chars
const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export type WaitlistStore = {
  findByEmail: (email: string) => Promise<{ id: number; email: string } | null>;
  insert: (email: string) => Promise<{ id: number }>;
};

export type WaitlistJoinResult =
  | { status: "created"; email: string; id: number }
  | { status: "already_joined"; email: string; id: number };

export class WaitlistValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WaitlistValidationError";
  }
}

/** Normalize and validate a waitlist email. Throws WaitlistValidationError if invalid. */
export function normalizeWaitlistEmail(raw: string): string {
  if (typeof raw !== "string") {
    throw new WaitlistValidationError("Email is required");
  }
  const email = raw.trim().toLowerCase();
  if (!email) {
    throw new WaitlistValidationError("Email is required");
  }
  if (email.length > EMAIL_MAX) {
    throw new WaitlistValidationError("Email is too long");
  }
  if (!EMAIL_RE.test(email)) {
    throw new WaitlistValidationError("Invalid email address");
  }
  return email;
}

/**
 * Persist a waitlist signup. Idempotent for duplicate emails (returns already_joined).
 */
export async function joinWaitlist(
  rawEmail: string,
  store: WaitlistStore,
): Promise<WaitlistJoinResult> {
  const email = normalizeWaitlistEmail(rawEmail);
  const existing = await store.findByEmail(email);
  if (existing) {
    return { status: "already_joined", email, id: existing.id };
  }
  try {
    const inserted = await store.insert(email);
    return { status: "created", email, id: inserted.id };
  } catch (error) {
    // Race: unique constraint — treat as already joined
    const again = await store.findByEmail(email);
    if (again) {
      return { status: "already_joined", email, id: again.id };
    }
    throw error;
  }
}
