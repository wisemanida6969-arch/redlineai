"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PaddleCheckout from "@/components/PaddleCheckout";
import {
  Shield, CheckCircle, Lock, Library, ScanSearch, PenLine,
  MessageSquare, Bot, PenTool,
} from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { STANDARD_CONTRACTS, TOTAL_CONTRACT_COUNT, TOTAL_CATEGORY_COUNT, type Bi } from "@/lib/standardContracts";

export default function Home() {
  const { t, lang } = useT();
  const L = (b: Bi) => (lang === "ko" ? b.ko : b.en);

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-800/50 text-red-400 text-sm px-4 py-1.5 rounded-full mb-6">
            <Shield className="w-3.5 h-3.5" />
            {t("landing.tag")}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            {t("landing.headline1")}{" "}
            <span className="text-red-500">{t("landing.headlineAccent")}</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            {t("landing.sub")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              {t("landing.ctaPrimary")}
            </Link>
            <a
              href="#fields"
              className="border border-[#1e3050] hover:border-slate-500 text-slate-300 font-medium px-8 py-4 rounded-xl text-lg transition-colors"
            >
              {t("landing.ctaSecondary")}
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-4">{t("landing.noCard")}</p>
        </div>
      </section>

      {/* Standard contract fields preview */}
      <section id="fields" className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">{t("landing.catTitle")}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">{t("landing.catSub")}</p>
            <p className="text-slate-600 text-sm mt-3">
              {TOTAL_CATEGORY_COUNT}{t("standard.fieldsLabel")} · {TOTAL_CONTRACT_COUNT}{t("standard.formsLabel")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STANDARD_CONTRACTS.map((c) => (
              <Link
                key={c.id}
                href="/dashboard"
                className="bg-[#162035] border border-[#1e3050] hover:border-red-700/50 rounded-2xl p-5 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-3xl leading-none">{c.emoji}</span>
                  <span className="text-[11px] font-bold text-red-400 bg-red-900/20 border border-red-800/40 rounded-full px-2.5 py-1 shrink-0">
                    {c.types.length}{t("landing.catTypesLabel")}
                  </span>
                </div>
                <h3 className="text-white font-bold text-base mb-1 group-hover:text-red-300 transition-colors">{L(c.title)}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{L(c.blurb)}</p>
              </Link>
            ))}

            {/* CTA tile */}
            <Link
              href="/dashboard"
              className="bg-gradient-to-br from-red-900/30 to-[#162035] border border-red-700/40 rounded-2xl p-5 flex flex-col justify-center items-start transition-colors hover:border-red-600/60"
            >
              <Library className="w-7 h-7 text-red-400 mb-2" />
              <h3 className="text-white font-bold text-base mb-1">{t("landing.catViewAll")}</h3>
              <span className="text-red-400 text-sm font-medium inline-flex items-center gap-1 mt-1">
                {t("landing.ctaPrimary")}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 border-t border-[#1e3050]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">{t("landing.howTitle")}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Library,    step: "1", title: t("landing.howStep1Title"), desc: t("landing.howStep1Desc") },
              { icon: ScanSearch, step: "2", title: t("landing.howStep2Title"), desc: t("landing.howStep2Desc") },
              { icon: Shield,     step: "3", title: t("landing.howStep3Title"), desc: t("landing.howStep3Desc") },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-red-900/30 border border-red-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-red-500 text-sm font-bold mb-2">{t("landing.step")} {step}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-[#1e3050]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">{t("landing.featuresTitle")}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Library,       title: t("landing.f1Title"), desc: t("landing.f1Desc") },
              { icon: ScanSearch,    title: t("landing.f2Title"), desc: t("landing.f2Desc") },
              { icon: PenLine,       title: t("landing.f3Title"), desc: t("landing.f3Desc") },
              { icon: MessageSquare, title: t("landing.f4Title"), desc: t("landing.f4Desc") },
              { icon: Bot,           title: t("landing.f5Title"), desc: t("landing.f5Desc") },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 bg-[#162035] border border-[#1e3050] rounded-xl p-5">
                <div className="w-10 h-10 bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{title}</h3>
                  <p className="text-slate-400 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sign recommendation card */}
          <SignRecommendationCard t={t} />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-[#1e3050]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">{t("landing.pricingTitle")}</h2>
          <p className="text-slate-400 text-center mb-12">{t("landing.pricingSub")}</p>
          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              name={t("common.free")}
              price="$0"
              period=""
              desc={t("landing.planFreeDesc")}
              features={[
                `${t("landing.featStandardLibrary")}: ${t("landing.featUnlimited")}`,
                `${t("landing.featContractAnalysis")}: 3${t("landing.featPerMonth")}`,
                `${t("landing.featAIAgent")}: 10 ${t("landing.featChatMessages")}${t("landing.featPerMonth")}`,
                t("landing.featPrecedentSearch"),
                `${t("landing.featPrecedentHolding")}: ${t("landing.featLocked")}`,
                `${t("landing.featQuoteToContract")}: ${t("landing.featLocked")}`,
                t("landing.featAllLangs"),
              ]}
              cta={t("landing.ctaFree")}
              href="/dashboard"
              highlighted={false}
            />
            <PricingCard
              name={t("common.pro")}
              price="$49"
              period={t("landing.perMonth")}
              desc={t("landing.planProDesc")}
              features={[
                `${t("landing.featStandardLibrary")}: ${t("landing.featUnlimited")}`,
                `${t("landing.featContractAnalysis")}: 30${t("landing.featPerMonth")}`,
                `${t("landing.featQuoteToContract")}: 30${t("landing.featPerMonth")}`,
                `${t("landing.featAIAgent")}: 100 ${t("landing.featChatMessages")}${t("landing.featPerMonth")}`,
                t("landing.featPrecedentHolding"),
                t("landing.featChatScreenshot"),
                t("landing.featEmailSupport"),
              ]}
              cta={t("landing.ctaPro")}
              href="/dashboard"
              highlighted={true}
              paddlePriceId={process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID}
              mostPopular={t("landing.mostPopular")}
            />
            <PricingCard
              name={t("common.business")}
              price="$99"
              period={t("landing.perMonth")}
              desc={t("landing.planBusinessDesc")}
              features={[
                `${t("landing.featStandardLibrary")}: ${t("landing.featUnlimited")}`,
                `${t("landing.featContractAnalysis")}: ${t("landing.featUnlimited")}`,
                `${t("landing.featQuoteToContract")}: ${t("landing.featUnlimited")}`,
                `${t("landing.featAIAgent")}: ${t("landing.featUnlimited")}`,
                t("landing.featPrecedentHolding"),
                `${t("landing.featVendorRiskScan")}: 30${t("landing.featPerMonth")}`,
                t("landing.featChatScreenshot"),
                t("landing.featPrioritySupport"),
              ]}
              cta={t("landing.ctaBusiness")}
              href="/dashboard"
              highlighted={false}
              paddlePriceId={process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-[#1e3050]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t("landing.ctaSectionTitle")}</h2>
          <p className="text-slate-400 mb-8">{t("landing.ctaSectionSub")}</p>
          <Link
            href="/dashboard"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors inline-block"
          >
            {t("landing.ctaPrimary")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e3050] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span className="text-white font-bold">RedlineAI</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/terms"   className="hover:text-slate-300 transition-colors">{t("auth.termsOfService")}</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">{t("auth.privacyPolicy")}</Link>
            <Link href="/refund"  className="hover:text-slate-300 transition-colors">{t("auth.refundPolicy")}</Link>
          </div>
          <p className="text-slate-600 text-xs">{t("common.copyright")} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function SignRecommendationCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="mt-10 bg-gradient-to-br from-yellow-900/10 to-[#162035] border border-yellow-700/30 rounded-2xl p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-yellow-900/40 rounded-lg flex items-center justify-center shrink-0">
          <PenTool className="w-5 h-5 text-yellow-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-yellow-900/40 text-yellow-300 border border-yellow-700/40 rounded px-2 py-0.5 mb-2">
            <CheckCircle className="w-3 h-3" />
            {t("landing.signNeededTag")}
          </div>
          <h3 className="text-white font-bold text-lg sm:text-xl mb-2">
            {t("landing.signNeededTitle")}
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            {t("landing.signNeededBody")}
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="https://www.modusign.co.kr/" target="_blank" rel="noopener noreferrer"
               className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">
              {t("landing.signNeededLinkModoosign")}
            </a>
            <a href="https://www.eformsign.com/" target="_blank" rel="noopener noreferrer"
               className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">
              {t("landing.signNeededLinkEformsign")}
            </a>
            <a href="https://www.docusign.com/" target="_blank" rel="noopener noreferrer"
               className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">
              {t("landing.signNeededLinkDocusign")}
            </a>
            <a href="https://sign.dropbox.com/" target="_blank" rel="noopener noreferrer"
               className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">
              {t("landing.signNeededLinkDropbox")}
            </a>
          </div>
        </div>
      </div>
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
