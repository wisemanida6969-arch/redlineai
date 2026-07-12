"use client";
import Link from "next/link";
import PaddleCheckout from "@/components/PaddleCheckout";
import { PASS_PRICE_KRW, type PassFeature } from "@/lib/monetization";
import { useT } from "@/lib/i18n/LanguageProvider";

interface Props {
  feature: PassFeature;
  passPriceId: string;
}

/**
 * Checkout button shown when a precedent-view or vendor-scan request comes
 * back locked. The legacy ₩9,900 membership is closed to new signups, so only
 * the single-feature 24h pass is offered here (the 사인 전 패키지 upsell lives
 * on the analysis page).
 */
export default function PassPurchaseButtons({ feature, passPriceId }: Props) {
  const { t } = useT();
  const passPrice = PASS_PRICE_KRW[feature];

  if (!passPriceId) {
    // Checkout isn't wired up yet (price IDs pending) — point somewhere useful instead of showing nothing.
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        {t("pass.viewPricing")}
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <PaddleCheckout
        priceId={passPriceId}
        className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        {t("pass.buyPass")} (₩{passPrice.toLocaleString()})
      </PaddleCheckout>
    </div>
  );
}
