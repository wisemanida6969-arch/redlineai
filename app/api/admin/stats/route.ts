import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Admin-only usage dashboard data. Aggregates usage_events (daily active
 * users, per-feature counts) plus signup totals from profiles. 403 for
 * everyone except is_admin accounts.
 */

const WINDOW_DAYS = 14;

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: me } = await service
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since = new Date();
  since.setDate(since.getDate() - (WINDOW_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  // Admin accounts' own activity would pollute every metric (the admin is on
  // the site constantly while building it) — exclude them everywhere.
  const { data: adminRows } = await service.from("profiles").select("id").eq("is_admin", true);
  const adminIds = new Set((adminRows ?? []).map((r) => r.id));

  const [{ data: rawEvents }, { count: totalUsers }, { data: recentUsers }] = await Promise.all([
    service
      .from("usage_events")
      .select("user_id, email, event, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
    service.from("profiles").select("id", { count: "exact", head: true }).not("is_admin", "is", true),
    service
      .from("profiles")
      .select("email, plan, created_at, scans_used, quote_used, agent_used, vendor_used, precedent_used")
      .not("is_admin", "is", true)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const events = (rawEvents ?? []).filter((e) => !adminIds.has(e.user_id));

  /* ── Aggregate events by day ── */
  const days: string[] = [];
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const byDay: Record<string, { users: Set<string>; events: Record<string, number> }> = {};
  for (const day of days) byDay[day] = { users: new Set(), events: {} };

  const eventTypes = new Set<string>();
  for (const e of events ?? []) {
    const day = String(e.created_at).slice(0, 10);
    const bucket = byDay[day];
    if (!bucket) continue;
    bucket.users.add(e.user_id);
    bucket.events[e.event] = (bucket.events[e.event] ?? 0) + 1;
    eventTypes.add(e.event);
  }

  const daily = days.map((day) => ({
    day,
    activeUsers: byDay[day].users.size,
    events: byDay[day].events,
    totalEvents: Object.values(byDay[day].events).reduce((a, b) => a + b, 0),
  }));

  /* ── Per-user activity within the window ── */
  const perUser = new Map<string, { email: string | null; count: number; lastSeen: string; features: Set<string> }>();
  for (const e of events ?? []) {
    const cur = perUser.get(e.user_id);
    if (cur) {
      cur.count += 1;
      cur.features.add(e.event);
      if (e.created_at > cur.lastSeen) cur.lastSeen = e.created_at;
      if (!cur.email && e.email) cur.email = e.email;
    } else {
      perUser.set(e.user_id, { email: e.email, count: 1, lastSeen: e.created_at, features: new Set([e.event]) });
    }
  }
  const activeUserRows = Array.from(perUser.entries())
    .map(([userId, u]) => ({ userId, email: u.email, count: u.count, lastSeen: u.lastSeen, features: Array.from(u.features) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  const today = new Date().toISOString().slice(0, 10);
  const signupsToday = (recentUsers ?? []).filter((u) => String(u.created_at).slice(0, 10) === today).length;

  return NextResponse.json({
    windowDays: WINDOW_DAYS,
    totalUsers: totalUsers ?? 0,
    signupsToday,
    todayActiveUsers: byDay[today]?.users.size ?? 0,
    eventTypes: Array.from(eventTypes).sort(),
    daily,
    activeUsers: activeUserRows,
    recentEvents: (events ?? []).slice(0, 100).map((e) => ({
      email: e.email, event: e.event, at: e.created_at,
    })),
    recentUsers: recentUsers ?? [],
  });
}
