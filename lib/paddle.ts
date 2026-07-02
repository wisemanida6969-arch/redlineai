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

/** Recurring — grants the "member" plan (₩9,900/mo; monthly quotas defined in lib/monetization.ts). */
export const PADDLE_MEMBER_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_MEMBER_PRICE_ID || "";
/** One-time — 24-hour passes. Handled in the webhook's transaction.completed branch, not priceIdToPlan. */
export const PADDLE_PRECEDENT_PASS_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRECEDENT_PASS_PRICE_ID || "";
export const PADDLE_VENDOR_PASS_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_VENDOR_PASS_PRICE_ID || "";

/** Map a Paddle recurring-subscription price_id to our internal plan name. */
export function priceIdToPlan(priceId: string): Plan | null {
  if (!priceId) return null;
  if (priceId === PADDLE_MEMBER_PRICE_ID) return "member";
  return null;
}
