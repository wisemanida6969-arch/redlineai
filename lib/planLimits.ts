/* ------------------------------------------------------------------ */
/*  RedlineAI – Plan limits & feature gating                           */
/* ------------------------------------------------------------------ */

export type Plan = "free" | "pro" | "business";
export type FeatureKey = "analysis" | "quote" | "vendor" | "esign";

/** null = unlimited, 0 = locked, number = monthly limit */
export const PLAN_LIMITS: Record<Plan, Record<FeatureKey, number | null>> = {
  free:     { analysis: 3,    quote: 0,    vendor: 0,  esign: 0 },
  pro:      { analysis: 30,   quote: 30,   vendor: 10, esign: 0 },
  business: { analysis: null, quote: null, vendor: 30, esign: null },
};

export const PLAN_PRICES = {
  free:     { price: 0,  label: "Free" },
  pro:      { price: 49, label: "Pro" },
  business: { price: 99, label: "Business" },
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  analysis: "Contract Analysis",
  quote:    "Quote to Contract",
  vendor:   "Vendor Risk Scan",
  esign:    "E-Signature",
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
