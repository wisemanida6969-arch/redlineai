/* ------------------------------------------------------------------ */
/*  RedlineAI – Plan limits & feature gating                           */
/* ------------------------------------------------------------------ */

export type Plan = "free" | "pro" | "business";
export type FeatureKey = "standard" | "analysis" | "quote" | "vendor" | "agent";

/** null = unlimited, 0 = locked, number = monthly limit.
 *  `standard` = the standard-contract library (browse + official download); free reference, never metered. */
export const PLAN_LIMITS: Record<Plan, Record<FeatureKey, number | null>> = {
  free:     { standard: null, analysis: 3,    quote: 0,    vendor: 0,  agent: 10   },
  pro:      { standard: null, analysis: 30,   quote: 30,   vendor: 10, agent: 100  },
  business: { standard: null, analysis: null, quote: null, vendor: 30, agent: null },
};

export const PLAN_PRICES = {
  free:     { price: 0,  label: "Free" },
  pro:      { price: 49, label: "Pro" },
  business: { price: 99, label: "Business" },
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  standard: "Standard Contracts",
  analysis: "Contract Review",
  quote:    "Contract Draft",
  vendor:   "Vendor Risk Scan",
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
