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

export const PADDLE_PRO_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || "";
export const PADDLE_BUSINESS_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID || "";

/** Map a Paddle price_id to our internal plan name. */
export function priceIdToPlan(priceId: string): Plan | null {
  if (!priceId) return null;
  if (priceId === PADDLE_PRO_PRICE_ID) return "pro";
  if (priceId === PADDLE_BUSINESS_PRICE_ID) return "business";
  return null;
}
