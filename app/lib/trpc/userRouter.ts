import { z } from "zod";
import { getCreditHistoryByUserIdPaginated } from "~/lib/model/creditHistory";
import { getUserById, getUserCount } from "~/lib/model/user";
import { getTotalAvailableCredits } from "~/lib/model/userBalance";
import { authedProcedure, publicProcedure, router } from "./init";

export const userRouter = router({
  getById: authedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    return user;
  }),
  getCount: publicProcedure.query(async () => {
    const count = await getUserCount();
    return { count };
  }),
  getCredits: authedProcedure.query(async ({ ctx }) => {
    const credits = await getTotalAvailableCredits(ctx.user.id);
    return credits;
  }),
  getShowcaseAccess: authedProcedure.query(async ({ ctx }) => {
    const credits = await getTotalAvailableCredits(ctx.user.id);

    return {
      canHideFromPublic: credits.subscription > 0,
    };
  }),
  getCreditHistory: authedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getCreditHistoryByUserIdPaginated(
        ctx.user.id,
        input.page,
        input.pageSize,
      );
    }),
});
