"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PaddleCheckout from "@/components/PaddleCheckout";
import { Shield, Zap, FileText, CheckCircle, AlertTriangle, AlertCircle, Lock, Bot, MessageSquare, Building2, PenTool } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function Home() {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-800/50 text-red-400 text-sm px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
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
              href="#how-it-works"
              className="border border-[#1e3050] hover:border-slate-500 text-slate-300 font-medium px-8 py-4 rounded-xl text-lg transition-colors"
            >
              {t("landing.ctaSecondary")}
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-4">{t("landing.noCard")}</p>
        </div>
      </section>

      {/* Risk preview */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto bg-[#162035] border border-[#1e3050] rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-500 text-sm ml-2">{t("landing.sampleDoc")}</span>
          </div>
          <div className="space-y-3">
            <RiskItem
              level="high"
              levelLabel={t("landing.high")}
              title="Unlimited liability clause"
              text="&quot;Employee shall be liable for any and all damages, losses, or expenses of any kind...&quot;"
              fix="Liability shall be limited to direct damages not exceeding three (3) months of compensation."
              fixLabel={t("landing.suggestedFix")}
            />
            <RiskItem
              level="medium"
              levelLabel={t("landing.medium")}
              title="Vague non-compete scope"
              text="&quot;Employee agrees not to engage in any similar business activities for a reasonable period...&quot;"
              fix="Non-compete is restricted to 12 months within [City/Region] for direct competitors in [Industry]."
              fixLabel={t("landing.suggestedFix")}
            />
            <RiskItem
              level="low"
              levelLabel={t("landing.low")}
              title="Missing governing law"
              text="&quot;This agreement shall be governed by applicable laws...&quot;"
              fix='This agreement shall be governed by the laws of the State of [State], without regard to conflicts of law.'
              fixLabel={t("landing.suggestedFix")}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 border-t border-[#1e3050]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">{t("landing.howTitle")}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FileText, step: "1", title: t("landing.howStep1Title"), desc: t("landing.howStep1Desc") },
              { icon: Zap,      step: "2", title: t("landing.howStep2Title"), desc: t("landing.howStep2Desc") },
              { icon: Shield,   step: "3", title: t("landing.howStep3Title"), desc: t("landing.howStep3Desc") },
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
              { icon: AlertTriangle,  title: t("landing.f1Title"), desc: t("landing.f1Desc") },
              { icon: FileText,       title: t("landing.f2Title"), desc: t("landing.f2Desc") },
              { icon: Bot,            title: t("landing.f3Title"), desc: t("landing.f3Desc") },
              { icon: MessageSquare,  title: t("landing.f4Title"), desc: t("landing.f4Desc") },
              { icon: Building2,      title: t("landing.f5Title"), desc: t("landing.f5Desc") },
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

          {/* Sign recommendation card (E-Signature replacement notice) */}
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
                `${t("landing.featContractAnalysis")}: 3${t("landing.featPerMonth")}`,
                `${t("landing.featAIAgent")}: 10 ${t("landing.featChatMessages")}${t("landing.featPerMonth")}`,
                `${t("landing.featQuoteToContract")}: ${t("landing.featLocked")}`,
                `${t("landing.featVendorRiskScan")}: ${t("landing.featLocked")}`,
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
                `${t("landing.featContractAnalysis")}: 30${t("landing.featPerMonth")}`,
                `${t("landing.featQuoteToContract")}: 30${t("landing.featPerMonth")}`,
                `${t("landing.featAIAgent")}: 100 ${t("landing.featChatMessages")}${t("landing.featPerMonth")}`,
                `${t("landing.featVendorRiskScan")}: 10${t("landing.featPerMonth")}`,
                t("landing.featChatScreenshot"),
                t("landing.featAllLangs"),
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
                `${t("landing.featContractAnalysis")}: ${t("landing.featUnlimited")}`,
                `${t("landing.featQuoteToContract")}: ${t("landing.featUnlimited")}`,
                `${t("landing.featAIAgent")}: ${t("landing.featUnlimited")}`,
                `${t("landing.featVendorRiskScan")}: 30${t("landing.featPerMonth")}`,
                t("landing.featChatScreenshot"),
                t("landing.featAllLangs"),
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

function RiskItem({ level, levelLabel, title, text, fix, fixLabel }: { level: "high" | "medium" | "low"; levelLabel: string; title: string; text: string; fix: string; fixLabel: string }) {
  const colors = {
    high: { bg: "bg-red-900/20", border: "border-red-800/50", badge: "bg-red-900/50 text-red-400", icon: AlertTriangle },
    medium: { bg: "bg-yellow-900/20", border: "border-yellow-800/50", badge: "bg-yellow-900/50 text-yellow-400", icon: AlertCircle },
    low: { bg: "bg-blue-900/20", border: "border-blue-800/50", badge: "bg-blue-900/50 text-blue-400", icon: CheckCircle },
  };
  const c = colors[level];
  const Icon = c.icon;
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 mt-0.5 shrink-0 text-current opacity-70" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${c.badge}`}>{levelLabel}</span>
            <span className="text-white text-sm font-medium">{title}</span>
          </div>
          <p className="text-slate-400 text-xs mb-2 italic">{text}</p>
          <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-2">
            <span className="text-green-400 text-xs font-semibold">{fixLabel} </span>
            <span className="text-green-300 text-xs">{fix}</span>
          </div>
        </div>
      </div>
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
            <a href="https://www.docusign.com/" target="_blank" rel="noopener noreferrer"
               className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">
              {t("landing.signNeededLinkDocusign")}
            </a>
            <a href="https://sign.dropbox.com/" target="_blank" rel="noopener noreferrer"
               className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">
              {t("landing.signNeededLinkDropbox")}
            </a>
            <a href="https://www.modusign.co.kr/" target="_blank" rel="noopener noreferrer"
               className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">
              {t("landing.signNeededLinkModoosign")}
            </a>
            <a href="https://www.eformsign.com/" target="_blank" rel="noopener noreferrer"
               className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">
              {t("landing.signNeededLinkEformsign")}
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
