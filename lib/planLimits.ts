/* ------------------------------------------------------------------ */
/*  RedlineAI – Plan limits & feature gating                           */
/*                                                                      */
/*  Beta period (~2026-08-31): contract review/draft/AI agent/standard */
/*  library are free & unlimited for everyone. Precedent-view and      */
/*  vendor risk scan are monetized separately — see lib/passGating.ts  */
/*  and lib/monetization.ts.                                           */
/* ------------------------------------------------------------------ */

export type Plan = "free" | "member";
export type FeatureKey = "standard" | "analysis" | "quote" | "agent";

/** null = unlimited, 0 = locked, number = monthly limit. */
export const PLAN_LIMITS: Record<Plan, Record<FeatureKey, number | null>> = {
  free:   { standard: null, analysis: null, quote: null, agent: null },
  member: { standard: null, analysis: null, quote: null, agent: null },
};

export const PLAN_PRICES = {
  free:   { price: 0,    label: "Free" },
  member: { price: 9900, label: "Member" },
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  standard: "Standard Contracts",
  analysis: "Contract Review",
  quote:    "Contract Draft",
  agent:    "AI Agent",
};

/** Returns true if the user has access to the feature on their plan. */
export function hasAccess(plan: Plan, feature: FeatureKey): boolean {
  const limit = PLAN_LIMITS[plan][feature];
  return limit === null || limit > 0;
}

/** Returns true if the user has hit their limit on the feature this month. */
export function isOverLimit(plan: Plan, feature: FeatureKey, used: number): boolean {
  const limit = PLAN_LIMITS[plan][feature];
  if (limit === null) return false;       // unlimited
  return used >= limit;
}

/** Format limit for display: "3", "30", "Unlimited", "Locked" */
export function formatLimit(limit: number | null): string {
  if (limit === null) return "Unlimited";
  if (limit === 0) return "Locked";
  return String(limit);
}

/** "2 / 30 used" style usage label for a feature */
export function usageLabel(plan: Plan, feature: FeatureKey, used: number): string {
  const limit = PLAN_LIMITS[plan][feature];
  if (limit === null) return "Unlimited";
  if (limit === 0) return "Upgrade to unlock";
  return `${used} / ${limit} used this month`;
}
