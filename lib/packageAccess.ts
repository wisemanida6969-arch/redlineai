import type { createServiceClient } from "@/lib/supabase/server";
import { PRO_MONTHLY_QUOTA } from "@/lib/monetization";

type ServiceClient = ReturnType<typeof createServiceClient>;

export interface PackageAccessResult {
  /** The full package (PDF report) is unlocked for this scan. */
  unlocked: boolean;
  via: "purchase" | "pro" | "admin" | null;
  /** For pro subscribers: remaining unlocks this billing month (after any use). */
  proRemaining?: number;
  /** True when the user is on pro but has used up the monthly quota (overage price applies). */
  proQuotaExceeded?: boolean;
}

/**
 * Whether the 사인 전 패키지 (full PDF report) is unlocked for one specific
 * scan. Unlocked when: the caller is an admin; a scan_packages row exists for
 * this scan (one-time purchase, pro-quota use, or overage purchase).
 * Also reports the pro subscriber's remaining monthly quota so the UI can
 * offer "use 1 of N" instead of payment.
 */
export async function checkPackageAccess(
  service: ServiceClient,
  userId: string,
  scanId: string,
): Promise<PackageAccessResult> {
  const { data: profile } = await service
    .from("profiles")
    .select("is_admin, plan, pro_used")
    .eq("id", userId)
    .single();

  if (profile?.is_admin) return { unlocked: true, via: "admin" };

  const { data: pkg } = await service
    .from("scan_packages")
    .select("via")
    .eq("scan_id", scanId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const isPro = profile?.plan === "pro";
  const proUsed = profile?.pro_used ?? 0;
  const proRemaining = isPro ? Math.max(0, PRO_MONTHLY_QUOTA - proUsed) : undefined;

  if (pkg) {
    return {
      unlocked: true,
      via: pkg.via === "pro" ? "pro" : "purchase",
      proRemaining,
    };
  }

  return {
    unlocked: false,
    via: null,
    proRemaining,
    proQuotaExceeded: isPro ? proUsed >= PRO_MONTHLY_QUOTA : undefined,
  };
}

/**
 * Pro subscriber spends one monthly unlock on a scan. Idempotent: if the scan
 * is already unlocked for this user, nothing is consumed. Returns the result
 * state after the operation, or an error string.
 */
export async function unlockScanForPro(
  service: ServiceClient,
  userId: string,
  scanId: string,
): Promise<{ ok: true; proRemaining: number } | { ok: false; error: "not_pro" | "quota_exceeded" | "scan_not_found" }> {
  const { data: profile } = await service
    .from("profiles")
    .select("plan, pro_used")
    .eq("id", userId)
    .single();
  if (profile?.plan !== "pro") return { ok: false, error: "not_pro" };

  const { data: scan } = await service
    .from("scans")
    .select("id")
    .eq("id", scanId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!scan) return { ok: false, error: "scan_not_found" };

  const { data: existing } = await service
    .from("scan_packages")
    .select("id")
    .eq("scan_id", scanId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  const proUsed = profile?.pro_used ?? 0;
  if (existing) return { ok: true, proRemaining: Math.max(0, PRO_MONTHLY_QUOTA - proUsed) };

  if (proUsed >= PRO_MONTHLY_QUOTA) return { ok: false, error: "quota_exceeded" };

  const { error: insertError } = await service
    .from("scan_packages")
    .insert({ scan_id: scanId, user_id: userId, via: "pro" });
  if (insertError) return { ok: false, error: "scan_not_found" };

  await service.from("profiles").update({ pro_used: proUsed + 1 }).eq("id", userId);
  return { ok: true, proRemaining: Math.max(0, PRO_MONTHLY_QUOTA - proUsed - 1) };
}
