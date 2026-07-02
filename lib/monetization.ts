/* ------------------------------------------------------------------ */
/*  RedlineAI – Beta monetization constants (2026-07 ~ 2026-08-31)      */
/*                                                                      */
/*  Everything except precedent-view and vendor risk scan is free      */
/*  during the beta period. Those two are monetized two ways:          */
/*   - a 24-hour one-time pass, or                                     */
/*   - a ₩9,900/month membership with a monthly quota per feature.     */
/* ------------------------------------------------------------------ */

export type PassFeature = "precedent" | "vendor";

export const BETA_END_DATE = "2026-08-31";

export const PASS_PRICE_KRW: Record<PassFeature, number> = {
  precedent: 3900,
  vendor: 2900,
};

export const MEMBER_PRICE_KRW = 9900;

export const MEMBER_MONTHLY_QUOTA: Record<PassFeature, number> = {
  precedent: 50,
  vendor: 40,
};

export const PASS_DURATION_MS = 24 * 60 * 60 * 1000;
