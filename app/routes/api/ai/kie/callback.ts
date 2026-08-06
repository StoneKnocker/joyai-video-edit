import { data, type ActionFunctionArgs } from "react-router";
import { handleKieCallback } from "~/lib/service/kieCallbackService";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return data({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await handleKieCallback({
      body,
      timestamp: request.headers.get("X-Webhook-Timestamp"),
      signature: request.headers.get("X-Webhook-Signature"),
    });

    return new Response(result.message, { status: result.status });
  } catch (error) {
    console.error("[kie-callback] Error handling callback", error);
    return new Response("OK", { status: 200 });
  }
}
