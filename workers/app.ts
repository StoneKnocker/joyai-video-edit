import { createRequestHandler, RouterContextProvider } from "react-router";
import { runWithCloudflareContext } from "@/lib/cf.server";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    try {
      const context = new RouterContextProvider();
      return await runWithCloudflareContext({ env, ctx, request }, () =>
        requestHandler(request, context),
      );
    } catch (error) {
      console.error(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
  async scheduled(_controller, env, ctx) {
    await runWithCloudflareContext({ env, ctx }, async () => {
      const { recoverStaleVideoTasks } = await import(
        "@/lib/service/taskRecoveryService"
      );
      await recoverStaleVideoTasks();
    });
  },
} satisfies ExportedHandler<Env>;
