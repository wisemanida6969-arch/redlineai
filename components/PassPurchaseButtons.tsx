"use client";
import Link from "next/link";
import PaddleCheckout from "@/components/PaddleCheckout";
import { PADDLE_MEMBER_PRICE_ID } from "@/lib/paddle";
import { PASS_PRICE_KRW, MEMBER_PRICE_KRW, type PassFeature } from "@/lib/monetization";
import { useT } from "@/lib/i18n/LanguageProvider";

interface Props {
  feature: PassFeature;
  passPriceId: string;
}

/** Two checkout buttons shown when a precedent-view or vendor-scan request comes back locked. */
export default function PassPurchaseButtons({ feature, passPriceId }: Props) {
  const { t } = useT();
  const passPrice = PASS_PRICE_KRW[feature];

  if (!passPriceId && !PADDLE_MEMBER_PRICE_ID) {
    // Checkout isn't wired up yet (price IDs pending) — point somewhere useful instead of showing nothing.
    return (
      <Link
        href="/#pricing"
        className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        {t("pass.viewPricing")}
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {passPriceId ? (
        <PaddleCheckout
          priceId={passPriceId}
          className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {t("pass.buyPass")} (₩{passPrice.toLocaleString()})
        </PaddleCheckout>
      ) : null}
      {PADDLE_MEMBER_PRICE_ID ? (
        <PaddleCheckout
          priceId={PADDLE_MEMBER_PRICE_ID}
          className="inline-flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {t("pass.joinMember")} (₩{MEMBER_PRICE_KRW.toLocaleString()}/{t("pass.perMonth")})
        </PaddleCheckout>
      ) : null}
    </div>
  );
}
