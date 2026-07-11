/* ------------------------------------------------------------------ */
/*  RedlineAI – Monetization constants                                  */
/*                                                                      */
/*  Product structure (per-contract package model):                     */
/*   - Free: upload → standard-comparison results on screen             */
/*   - Precedent pass / vendor-risk pass: ₩4,900 each (24h)             */
/*   - 사인 전 패키지: ₩19,900 one-time per contract — full PDF report   */
/*     + precedent & vendor features unlocked for 24h                   */
/*   - Pro plan: ₩49,900/mo — 10 package unlocks per billing month,     */
/*     ₩9,900 per extra contract beyond that                            */
/*  The legacy ₩9,900 membership ("member" plan) is closed to new       */
/*  signups but existing subscribers keep their quotas.                 */
/* ------------------------------------------------------------------ */

export type PassFeature = "precedent" | "vendor";

export const BETA_END_DATE = "2026-08-31";

export const PASS_PRICE_KRW: Record<PassFeature, number> = {
  precedent: 4900,
  vendor: 4900,
};

/** 사인 전 패키지 — one-time, per contract (scan). */
export const PACKAGE_PRICE_KRW = 19900;

/** Pro plan — monthly subscription for agencies/teams. */
export const PRO_PRICE_KRW = 49900;
export const PRO_MONTHLY_QUOTA = 10;
export const PRO_OVERAGE_PRICE_KRW = 9900;

/** Legacy ₩9,900 membership — kept for existing subscribers only. */
export const MEMBER_PRICE_KRW = 9900;

export const MEMBER_MONTHLY_QUOTA: Record<PassFeature, number> = {
  precedent: 30,
  vendor: 30,
};

export const PASS_DURATION_MS = 24 * 60 * 60 * 1000;
