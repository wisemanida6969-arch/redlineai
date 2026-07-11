import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logUsageEvent } from "@/lib/usageEvents";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  logUsageEvent(service, user.id, user.email, "dashboard_visit");
  const { data: scans } = await service
    .from("scans")
    .select("id, filename, high_count, medium_count, low_count, summary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: profile } = await service
    .from("profiles")
    .select("plan, scans_used, scan_month, quote_used, vendor_used, agent_used")
    .eq("id", user.id)
    .single();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const sameMonth = profile?.scan_month === currentMonth;

  // If month rolled over, all usage counts reset (we report 0 even if DB still has old values)
  const usage = {
    analysis: sameMonth ? (profile?.scans_used  ?? 0) : 0,
    quote:    sameMonth ? (profile?.quote_used  ?? 0) : 0,
    vendor:   sameMonth ? (profile?.vendor_used ?? 0) : 0,
    agent:    sameMonth ? (profile?.agent_used  ?? 0) : 0,
  };

  return NextResponse.json({
    scans: scans ?? [],
    plan: profile?.plan ?? "free",
    scansUsed: usage.analysis,   // legacy field for backward compat
    usage,
  });
}
