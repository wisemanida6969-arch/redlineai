"use client";
import { useState, useEffect, useCallback } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface Props {
  priceId: string;
  className?: string;
  children: React.ReactNode;
  /** Ties a one-time package purchase to a specific scan (webhook reads customData.scan_id). */
  scanId?: string;
}

export default function PaddleCheckout({ priceId, className, children, scanId }: Props) {
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; userId: string } | null>(null);

  /* Init Paddle.js */
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return;
    initializePaddle({ environment: "production", token })
      .then((p) => p && setPaddle(p))
      .catch((e) => console.error("Paddle init failed:", e));
  }, []);

  /* Get current user email/id */
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserInfo({ email: data.user.email, userId: data.user.id });
      }
    });
  }, []);

  const handleClick = useCallback(() => {
    if (!paddle) {
      // If Paddle didn't load, send user to login (likely means they're logged out / token missing)
      window.location.href = "/auth/login?next=/dashboard";
      return;
    }
    if (!userInfo) {
      // Not logged in → send to signup
      window.location.href = "/auth/signup";
      return;
    }
    setLoading(true);
    (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.("event", "begin_checkout", {
      currency: "KRW",
      items: [{ item_id: priceId, quantity: 1 }],
    });
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: userInfo.email },
      customData: scanId ? { user_id: userInfo.userId, scan_id: scanId } : { user_id: userInfo.userId },
      settings: {
        theme: "dark",
        successUrl: scanId
          ? `${window.location.origin}/analysis?purchased=1`
          : `${window.location.origin}/dashboard?upgraded=1&price_id=${encodeURIComponent(priceId)}`,
        displayMode: "overlay",
      },
    });
    // Paddle.js will overlay; reset loading after a moment
    setTimeout(() => setLoading(false), 1500);
  }, [paddle, priceId, userInfo, scanId]);

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : children}
    </button>
  );
}
