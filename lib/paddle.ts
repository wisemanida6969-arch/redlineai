/* ------------------------------------------------------------------ */
/*  Paddle billing helpers                                              */
/* ------------------------------------------------------------------ */
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import type { Plan } from "./planLimits";

let paddleInstance: Paddle | null = null;

export function getPaddle(): Paddle {
  if (paddleInstance) return paddleInstance;
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error("PADDLE_API_KEY is not set");
  paddleInstance = new Paddle(apiKey, { environment: Environment.production });
  return paddleInstance;
}

/** Legacy recurring — the closed ₩9,900 "member" plan (existing subscribers only). */
export const PADDLE_MEMBER_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_MEMBER_PRICE_ID || "";
/** Recurring — the ₩49,900/mo Pro plan (10 package unlocks per billing month). */
export const PADDLE_PRO_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || "";
/** One-time — 24-hour passes. Handled in the webhook's transaction.completed branch, not priceIdToPlan. */
export const PADDLE_PRECEDENT_PASS_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRECEDENT_PASS_PRICE_ID || "";
export const PADDLE_VENDOR_PASS_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_VENDOR_PASS_PRICE_ID || "";
/** One-time — 사인 전 패키지 (₩19,900, per contract; customData.scan_id ties it to a scan). */
export const PADDLE_PACKAGE_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PACKAGE_PRICE_ID || "";
/** One-time — Pro overage (₩9,900 per contract beyond the monthly 10). */
export const PADDLE_PRO_OVERAGE_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRO_OVERAGE_PRICE_ID || "";

/** Map a Paddle recurring-subscription price_id to our internal plan name. */
export function priceIdToPlan(priceId: string): Plan | null {
  if (!priceId) return null;
  if (priceId === PADDLE_MEMBER_PRICE_ID) return "member";
  if (priceId === PADDLE_PRO_PRICE_ID) return "pro";
  return null;
}
