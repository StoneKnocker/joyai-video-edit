import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { drizzleWaitlistStore } from "~/lib/model/waitlist";
import {
  joinWaitlist,
  WaitlistValidationError,
} from "~/lib/service/waitlistService";
import { publicProcedure, router } from "./init";

const joinSchema = z.object({
  email: z.string().max(255),
});

export const waitlistRouter = router({
  join: publicProcedure.input(joinSchema).mutation(async ({ input }) => {
    try {
      return await joinWaitlist(input.email, drizzleWaitlistStore);
    } catch (error) {
      if (error instanceof WaitlistValidationError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }
      throw error;
    }
  }),
});
