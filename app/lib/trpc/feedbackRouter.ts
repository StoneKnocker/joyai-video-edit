import { z } from "zod";
import { addFeedback } from "~/lib/model/feedback";
import { publicProcedure, router } from "./init";

const createFeedbackSchema = z.object({
  email: z.string().trim().email().max(255),
  category: z.enum(["bug", "idea", "question", "other"]),
  message: z.string().trim().min(1).max(2000),
});

export const feedbackRouter = router({
  create: publicProcedure
    .input(createFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      const id = await addFeedback({
        userId: ctx.user?.id ?? null,
        email: input.email,
        category: input.category,
        message: input.message,
      });

      return { id };
    }),
});
