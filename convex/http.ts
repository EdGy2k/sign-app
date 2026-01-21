import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "standardwebhooks";

const http = httpRouter();

const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET || "";

interface PolarWebhookPayload {
  type: string;
  data: {
    id: string;
    customer_id: string;
    status: string;
    current_period_end?: string;
    metadata?: {
      userId?: string;
      clerkId?: string;
    };
  };
}

function mapPolarStatusToAppStatus(
  polarStatus: string
): "active" | "past_due" | "cancelled" | "none" {
  switch (polarStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "cancelled":
    case "unpaid":
      return "cancelled";
    default:
      return "none";
  }
}

http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const webhookHeaders = {
      "webhook-id": request.headers.get("webhook-id") || "",
      "webhook-signature": request.headers.get("webhook-signature") || "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
    };

    let payload: PolarWebhookPayload;

    try {
      if (POLAR_WEBHOOK_SECRET) {
        const wh = new Webhook(POLAR_WEBHOOK_SECRET);
        payload = wh.verify(body, webhookHeaders) as PolarWebhookPayload;
      } else {
        console.warn(
          "POLAR_WEBHOOK_SECRET not set, skipping signature verification"
        );
        payload = JSON.parse(body) as PolarWebhookPayload;
      }
    } catch (error) {
      console.error("Webhook verification failed:", error);
      return new Response("Webhook verification failed", { status: 401 });
    }

    const { type, data } = payload;

    try {
      switch (type) {
        case "subscription.created":
        case "subscription.active": {
          const clerkId = data.metadata?.clerkId;
          if (!clerkId) {
            console.error("No clerkId in subscription metadata");
            return new Response("Missing clerkId in metadata", { status: 400 });
          }

          const planExpiresAt = data.current_period_end
            ? new Date(data.current_period_end).getTime()
            : undefined;

          await ctx.runMutation(internal.billing.upgradeToPro, {
            clerkId,
            polarCustomerId: data.customer_id,
            planExpiresAt,
          });
          break;
        }

        case "subscription.updated": {
          const status = mapPolarStatusToAppStatus(data.status);
          const planExpiresAt = data.current_period_end
            ? new Date(data.current_period_end).getTime()
            : undefined;

          await ctx.runMutation(internal.billing.updateSubscriptionStatus, {
            polarCustomerId: data.customer_id,
            subscriptionStatus: status,
            planExpiresAt,
          });
          break;
        }

        case "subscription.canceled":
        case "subscription.revoked": {
          await ctx.runMutation(internal.billing.downgradeToFree, {
            polarCustomerId: data.customer_id,
          });
          break;
        }

        default:
          console.log(`Unhandled webhook event type: ${type}`);
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("Internal error", { status: 500 });
    }
  }),
});

export default http;
