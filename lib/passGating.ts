import type { createServiceClient } from "@/lib/supabase/server";
import { MEMBER_MONTHLY_QUOTA, type PassFeature } from "@/lib/monetization";

type ServiceClient = ReturnType<typeof createServiceClient>;

const USED_COLUMN: Record<PassFeature, "precedent_used" | "vendor_used"> = {
  precedent: "precedent_used",
  vendor: "vendor_used",
};

export interface FeatureAccessResult {
  allowed: boolean;
  via: "pass" | "member" | null;
  reason?: "no_access" | "quota_exceeded";
  remaining?: number;
  limit?: number;
}

/**
 * Access to `feature` is granted if the user has an active 24h pass,
 * OR is on the "member" plan and hasn't hit their monthly quota yet.
 */
export async function checkFeatureAccess(
  service: ServiceClient,
  userId: string,
  feature: PassFeature,
): Promise<FeatureAccessResult> {
  const { data: pass } = await service
    .from("feature_passes")
    .select("id")
    .eq("user_id", userId)
    .eq("feature", feature)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (pass) return { allowed: true, via: "pass" };

  const usedColumn = USED_COLUMN[feature];
  const { data: profile } = await service
    .from("profiles")
    .select(`plan, scan_month, ${usedColumn}`)
    .eq("id", userId)
    .single();

  const plan = profile?.plan ?? "free";
  if (plan !== "member") return { allowed: false, via: null, reason: "no_access" };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const sameMonth = profile?.scan_month === currentMonth;
  const used = sameMonth ? (profile as unknown as Record<string, number>)?.[usedColumn] ?? 0 : 0;
  const limit = MEMBER_MONTHLY_QUOTA[feature];

  if (used >= limit) return { allowed: false, via: null, reason: "quota_exceeded", remaining: 0, limit };
  return { allowed: true, via: "member", remaining: limit - used, limit };
}

/** Call only after a successful use gained via the "member" monthly quota (not via a pass). */
export async function recordFeatureUsage(
  service: ServiceClient,
  userId: string,
  feature: PassFeature,
): Promise<void> {
  const usedColumn = USED_COLUMN[feature];
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: profile } = await service
    .from("profiles")
    .select(`scan_month, ${usedColumn}`)
    .eq("id", userId)
    .single();

  const sameMonth = profile?.scan_month === currentMonth;
  const used = sameMonth ? (profile as unknown as Record<string, number>)?.[usedColumn] ?? 0 : 0;

  await service
    .from("profiles")
    .update({ [usedColumn]: used + 1, scan_month: currentMonth })
    .eq("id", userId);
}
