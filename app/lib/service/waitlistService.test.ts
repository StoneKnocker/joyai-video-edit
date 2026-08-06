import { describe, expect, it } from "vitest";
import {
  joinWaitlist,
  normalizeWaitlistEmail,
  type WaitlistStore,
  WaitlistValidationError,
} from "./waitlistService";

function createMemoryStore(): WaitlistStore & {
  rows: Map<string, { id: number; email: string }>;
} {
  const rows = new Map<string, { id: number; email: string }>();
  let seq = 1;
  return {
    rows,
    async findByEmail(email: string) {
      return rows.get(email) ?? null;
    },
    async insert(email: string) {
      if (rows.has(email)) {
        throw new Error("UNIQUE constraint failed: waitlist_signup.email");
      }
      const row = { id: seq++, email };
      rows.set(email, row);
      return { id: row.id };
    },
  };
}

describe("normalizeWaitlistEmail", () => {
  it("trims and lowercases valid emails", () => {
    expect(normalizeWaitlistEmail("  User@Example.COM ")).toBe(
      "user@example.com",
    );
  });

  it("rejects empty and garbage", () => {
    expect(() => normalizeWaitlistEmail("")).toThrow(WaitlistValidationError);
    expect(() => normalizeWaitlistEmail("not-an-email")).toThrow(
      WaitlistValidationError,
    );
    expect(() => normalizeWaitlistEmail("a@b")).toThrow(
      WaitlistValidationError,
    );
    expect(() => normalizeWaitlistEmail("   ")).toThrow(
      WaitlistValidationError,
    );
  });
});

describe("joinWaitlist", () => {
  it("persists a new valid email", async () => {
    const store = createMemoryStore();
    const result = await joinWaitlist("new@example.com", store);
    expect(result).toEqual({
      status: "created",
      email: "new@example.com",
      id: 1,
    });
    expect(store.rows.get("new@example.com")?.email).toBe("new@example.com");
  });

  it("rejects invalid email without storing", async () => {
    const store = createMemoryStore();
    await expect(joinWaitlist("bad-email", store)).rejects.toBeInstanceOf(
      WaitlistValidationError,
    );
    expect(store.rows.size).toBe(0);
  });

  it("handles duplicate submit idempotently", async () => {
    const store = createMemoryStore();
    const first = await joinWaitlist("dup@example.com", store);
    const second = await joinWaitlist("DUP@example.com", store);
    expect(first.status).toBe("created");
    expect(second).toEqual({
      status: "already_joined",
      email: "dup@example.com",
      id: first.id,
    });
    expect(store.rows.size).toBe(1);
  });

  it("handles unique-constraint race as already_joined", async () => {
    const store = createMemoryStore();
    await store.insert("race@example.com");
    let findCalls = 0;
    // First find pretends missing so insert runs; insert hits unique; second find succeeds
    const racing: WaitlistStore = {
      findByEmail: async (email) => {
        findCalls += 1;
        if (findCalls === 1) {
          return null;
        }
        return store.findByEmail(email);
      },
      insert: async (email) => store.insert(email),
    };

    const result = await joinWaitlist("race@example.com", racing);
    expect(result.status).toBe("already_joined");
    expect(result.email).toBe("race@example.com");
  });
});
