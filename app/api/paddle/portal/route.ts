import { NextResponse } from "next/server";
import { getPaddle } from "@/lib/paddle";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("paddle_customer_id, paddle_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile?.paddle_customer_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  try {
    const paddle = getPaddle();
    const session = await paddle.customerPortalSessions.create(
      profile.paddle_customer_id,
      profile.paddle_subscription_id ? [profile.paddle_subscription_id] : []
    );

    const url = session.urls?.general?.overview;
    if (!url) return NextResponse.json({ error: "Could not create portal session" }, { status: 500 });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Portal create error:", err);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
