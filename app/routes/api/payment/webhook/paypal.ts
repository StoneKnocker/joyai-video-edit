import { data } from "react-router";
import { handlePaypalWebhook } from "~/lib/payment/paypal/paypal.server";
import type { Route } from "./+types/paypal";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await handlePaypalWebhook(request);
    return data({ success: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return data(
      {
        error:
          error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 },
    );
  }
}
