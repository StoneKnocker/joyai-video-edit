import { eq } from "drizzle-orm";
import { db } from "@/lib/database/db.server";
import { waitlistSignup } from "@/lib/database/schema";
import type { WaitlistStore } from "~/lib/service/waitlistService";

export const drizzleWaitlistStore: WaitlistStore = {
  async findByEmail(email: string) {
    const rows = await db
      .select({ id: waitlistSignup.id, email: waitlistSignup.email })
      .from(waitlistSignup)
      .where(eq(waitlistSignup.email, email))
      .limit(1);
    return rows[0] ?? null;
  },

  async insert(email: string) {
    const result = await db
      .insert(waitlistSignup)
      .values({ email })
      .returning({ id: waitlistSignup.id });
    const id = result[0]?.id;
    if (id == null) {
      throw new Error("Failed to insert waitlist signup");
    }
    return { id };
  },
};
