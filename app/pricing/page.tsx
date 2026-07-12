"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import PaddleCheckout from "@/components/PaddleCheckout";
import { CheckCircle, Lock, Clock } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { PADDLE_PRO_PRICE_ID, PADDLE_PRECEDENT_PASS_PRICE_ID, PADDLE_VENDOR_PASS_PRICE_ID } from "@/lib/paddle";
import { PASS_PRICE_KRW, PACKAGE_PRICE_KRW, PRO_PRICE_KRW, BETA_END_DATE } from "@/lib/monetization";

export default function PricingPage() {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />
      <div className="pt-28 pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">{t("landing.pricingTitle")}</h1>
          <p className="text-slate-400 text-center mb-3">{t("landing.pricingSub")}</p>
          <p className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 bg-yellow-900/20 border border-yellow-700/40 text-yellow-400 text-xs font-medium px-3 py-1 rounded-full">
              <Clock className="w-3 h-3" /> {t("landing.betaNotice")} {BETA_END_DATE}
            </span>
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <PricingCard
              name={t("common.free")}
              price="₩0"
              period=""
              desc={t("landing.planFreeDesc")}
              features={[
                t("landing.featStandardLibrary"),
                t("landing.featContractAnalysis"),
                t("landing.featQuoteToContract"),
                t("landing.featAIAgent"),
                t("landing.featAllLangs"),
              ]}
              cta={t("landing.ctaFree")}
              href="/dashboard"
              highlighted={false}
            />
            <PricingCard
              name={t("pass.buyPass")}
              price={`₩${PASS_PRICE_KRW.precedent.toLocaleString()}`}
              period={`/ ${t("landing.pass24h")}`}
              desc={t("landing.planPrecedentPassDesc")}
              features={[t("landing.featPrecedentHolding")]}
              cta={t("pass.buyPass")}
              href="/dashboard"
              highlighted={false}
              paddlePriceId={PADDLE_PRECEDENT_PASS_PRICE_ID}
            />
            <PricingCard
              name={t("pass.buyPass")}
              price={`₩${PASS_PRICE_KRW.vendor.toLocaleString()}`}
              period={`/ ${t("landing.pass24h")}`}
              desc={t("landing.planVendorPassDesc")}
              features={[t("landing.featVendorRiskScan")]}
              cta={t("pass.buyPass")}
              href="/dashboard"
              highlighted={false}
              paddlePriceId={PADDLE_VENDOR_PASS_PRICE_ID}
            />
            <PricingCard
              name={t("landing.planPackageName")}
              price={`₩${PACKAGE_PRICE_KRW.toLocaleString()}`}
              period={t("landing.planPackagePer")}
              desc={t("landing.planPackageDesc")}
              features={[
                t("landing.featPackagePdf"),
                t("landing.featPackageStandard"),
                t("landing.featPackagePrecedent"),
                t("landing.featPackageVendor"),
                t("landing.featPackageUnlock"),
              ]}
              cta={t("landing.ctaPackage")}
              href="/dashboard"
              highlighted={true}
              mostPopular={t("landing.recommended")}
            />
          </div>

          {/* ── Pro plan (agencies/teams) — visually separated from the personal tiers ── */}
          <div className="mt-10 pt-8 border-t border-[#1e3050]">
            <div className="bg-[#162035] border border-[#2a3d5f] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">{t("landing.proBanner")}</p>
                <div className="flex items-baseline gap-2 flex-wrap mb-2">
                  <h3 className="text-white font-bold text-xl">{t("landing.proName")}</h3>
                  <span className="text-white font-bold text-lg">₩{PRO_PRICE_KRW.toLocaleString()}</span>
                  <span className="text-slate-400 text-sm">{t("pass.perMonth")}</span>
                </div>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />{t("landing.featProQuota")}</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />{t("landing.featProOverage")}</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />{t("landing.featProReset")}</li>
                </ul>
              </div>
              <PaddleCheckout
                priceId={PADDLE_PRO_PRICE_ID}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shrink-0"
              >
                {t("landing.ctaProPlan")}
              </PaddleCheckout>
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

function PricingCard({
  name, price, period, desc, features, cta, href, highlighted, paddlePriceId, mostPopular,
}: {
  name: string; price: string; period: string; desc: string; features: string[];
  cta: string; href: string; highlighted: boolean; paddlePriceId?: string; mostPopular?: string;
}) {
  const buttonClass = `w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
    highlighted ? "bg-red-600 hover:bg-red-700 text-white" : "border border-[#1e3050] hover:border-slate-500 text-slate-300"
  }`;

  return (
    <div className={`rounded-2xl p-6 border flex flex-col ${highlighted ? "bg-red-900/20 border-red-700/50 ring-1 ring-red-600/30" : "bg-[#162035] border-[#1e3050]"}`}>
      {highlighted && mostPopular && (
        <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">{mostPopular}</div>
      )}
      <div className="mb-4">
        <h3 className="text-white font-bold text-xl mb-1">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">{price}</span>
          <span className="text-slate-400 text-sm">{period}</span>
        </div>
        <p className="text-slate-400 text-sm mt-2">{desc}</p>
      </div>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f) => {
          const isLocked = f.includes("locked") || f.includes("잠김");
          return (
            <li key={f} className={`flex items-center gap-2 text-sm ${isLocked ? "text-slate-500" : "text-slate-300"}`}>
              {isLocked ? (
                <Lock className="w-4 h-4 text-slate-600 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              )}
              {f}
            </li>
          );
        })}
      </ul>
      {paddlePriceId ? (
        <PaddleCheckout priceId={paddlePriceId} className={buttonClass}>
          {cta}
        </PaddleCheckout>
      ) : (
        <Link href={href} className={buttonClass}>
          {cta}
        </Link>
      )}
    </div>
  );
}
