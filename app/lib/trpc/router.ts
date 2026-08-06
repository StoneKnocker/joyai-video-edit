import { feedbackRouter } from "./feedbackRouter";
import { router } from "./init";
import { paymentRouter } from "./paymentRouter";
import { r2Router } from "./r2Router";
import { userRouter } from "./userRouter";
import { videoRouter } from "./videoRouter";

export const appRouter = router({
  user: userRouter,
  feedback: feedbackRouter,
  payment: paymentRouter,
  r2: r2Router,
  video: videoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
