import { NextRequest, NextResponse } from "next/server";
import { EventName } from "@paddle/paddle-node-sdk";
import { getPaddle, priceIdToPlan, PADDLE_PRECEDENT_PASS_PRICE_ID, PADDLE_VENDOR_PASS_PRICE_ID } from "@/lib/paddle";
import { createServiceClient } from "@/lib/supabase/server";
import { PASS_DURATION_MS, type PassFeature } from "@/lib/monetization";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("PADDLE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  const signature = req.headers.get("paddle-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();

  let event: any;
  try {
    const paddle = getPaddle();
    event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
  } catch (err) {
    console.error("Paddle webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const service = createServiceClient();

  try {
    switch (event.eventType) {
      case EventName.SubscriptionActivated:
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated: {
        const sub = event.data;
        const userId = sub.customData?.user_id as string | undefined;
        const priceId = sub.items?.[0]?.price?.id as string | undefined;
        const plan = priceId ? priceIdToPlan(priceId) : null;
        const customerId = sub.customerId as string;
        const subId = sub.id as string;
        const status = sub.status as string;
        const periodEnd = sub.currentBillingPeriod?.endsAt as string | undefined;

        if (!userId) {
          console.warn("Subscription event without user_id custom_data:", subId);
          break;
        }

        const update: Record<string, unknown> = {
          paddle_customer_id: customerId,
          paddle_subscription_id: subId,
          subscription_status: status,
          subscription_price_id: priceId ?? null,
          subscription_period_end: periodEnd ?? null,
        };
        if (plan) update.plan = plan;

        await service.from("profiles").update(update).eq("id", userId);
        break;
      }

      case EventName.SubscriptionCanceled: {
        const sub = event.data;
        const subId = sub.id as string;
        await service
          .from("profiles")
          .update({
            subscription_status: "canceled",
            plan: "free",
          })
          .eq("paddle_subscription_id", subId);
        break;
      }

      case EventName.SubscriptionPaused: {
        const sub = event.data;
        const subId = sub.id as string;
        await service
          .from("profiles")
          .update({
            subscription_status: "paused",
            plan: "free",
          })
          .eq("paddle_subscription_id", subId);
        break;
      }

      case EventName.TransactionCompleted: {
        const txn = event.data;
        // Subscription renewal invoices also fire this event — only one-time
        // 24h-pass purchases (no subscriptionId) should grant a pass here.
        if (txn.subscriptionId) break;

        const priceId = txn.items?.[0]?.price?.id as string | undefined;
        const feature: PassFeature | null =
          priceId === PADDLE_PRECEDENT_PASS_PRICE_ID ? "precedent" :
          priceId === PADDLE_VENDOR_PASS_PRICE_ID ? "vendor" :
          null;
        if (!feature) break;

        const userId = txn.customData?.user_id as string | undefined;
        if (!userId) {
          console.warn("Pass transaction without user_id custom_data:", txn.id);
          break;
        }

        const { error } = await service.from("feature_passes").insert({
          user_id: userId,
          feature,
          expires_at: new Date(Date.now() + PASS_DURATION_MS).toISOString(),
          paddle_transaction_id: txn.id,
        });
        // Unique index on paddle_transaction_id makes this safe against webhook retries.
        if (error && error.code !== "23505") console.error("Failed to grant pass:", error);
        break;
      }

      case EventName.TransactionPaymentFailed:
        console.warn("Payment failed:", event.data?.id);
        break;

      default:
        // Unhandled event types are fine — return 200 so Paddle stops retrying
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}
