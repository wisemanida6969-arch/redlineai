"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Shield, CheckCircle, Library, ScanSearch, PenLine,
  MessageSquare, Bot, PenTool,
} from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { STANDARD_CONTRACTS, TOTAL_CONTRACT_COUNT, TOTAL_CATEGORY_COUNT, type Bi } from "@/lib/standardContracts";
import { PACKAGE_PRICE_KRW, PRO_PRICE_KRW } from "@/lib/monetization";

export default function Home() {
  const { t, lang } = useT();
  const L = (b: Bi) => (lang === "ko" ? b.ko : b.en);

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-[#0f1a2e] to-[#0c1624] overflow-hidden">
        {/* Decorative background: soft glow + faint grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-[8%] w-[560px] h-[560px] rounded-full bg-red-600/10 blur-[140px]" />
          <div className="absolute inset-0 hero-grid" />
        </div>

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-800/50 text-red-400 text-sm px-4 py-1.5 rounded-full mb-6">
              <Shield className="w-3.5 h-3.5" />
              {t("landing.tag")}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6 animate-fade-in-up">
              {t("landing.headline1")}
              <br />
              <span className="text-red-500 text-glow-red">{t("landing.headlineAccent")}</span>
            </h1>
            <p className="text-xl text-slate-400 mb-10 animate-fade-in-up-delay break-keep">
              {t("landing.sub")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/dashboard"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-red-950/40"
              >
                {t("landing.ctaHero")}
              </Link>
              <a
                href="#fields"
                className="border border-[#2a3d5f] hover:border-slate-500 text-slate-300 font-medium px-8 py-4 rounded-xl text-lg transition-colors"
              >
                {t("landing.ctaSecondary")}
              </a>
            </div>
            <p className="text-slate-500 text-sm mt-4">{t("landing.noCard")}</p>
          </div>

          {/* Right: product mockup (decorative) */}
          <div aria-hidden className="hidden lg:block animate-fade-in-up-delay">
            <div className="hero-mock relative bg-[#141e33] border border-[#2a3d5f] rounded-2xl shadow-2xl shadow-black/50 p-5">
              {/* window bar */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3a4a68]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3a4a68]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3a4a68]" />
                <span className="ml-3 text-slate-500 text-xs truncate">{t("landing.sampleDoc")}</span>
              </div>
              {/* score chips */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-red-900/20 border border-red-800/40 rounded-lg py-2.5 text-center">
                  <div className="text-red-300 font-bold text-xl leading-none">2</div>
                  <div className="text-red-300/70 text-[10px] mt-1">{t("analysis.highRisk")}</div>
                </div>
                <div className="bg-yellow-900/15 border border-yellow-700/40 rounded-lg py-2.5 text-center">
                  <div className="text-yellow-300 font-bold text-xl leading-none">1</div>
                  <div className="text-yellow-300/70 text-[10px] mt-1">{t("analysis.mediumRisk")}</div>
                </div>
                <div className="bg-blue-900/15 border border-blue-800/40 rounded-lg py-2.5 text-center">
                  <div className="text-blue-300 font-bold text-xl leading-none">1</div>
                  <div className="text-blue-300/70 text-[10px] mt-1">{t("analysis.lowRisk")}</div>
                </div>
              </div>
              {/* flagged clause */}
              <div className="bg-[#0f1a2e] border border-[#1e3050] rounded-xl p-3.5 mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-bold uppercase bg-red-900/40 text-red-300 rounded px-1.5 py-0.5">{t("analysis.highRisk")}</span>
                  <span className="text-slate-200 text-xs font-semibold">{lang === "ko" ? "수정 횟수 제한 없는 조항" : "Unlimited-revision clause"}</span>
                </div>
                <p className="text-slate-400 text-[11px] italic leading-relaxed">
                  {lang === "ko" ? "“을은 갑이 만족할 때까지 원고를 수정하여야 한다.”" : "“The contractor shall revise until the client is satisfied.”"}
                </p>
              </div>
              {/* verbatim standard quote */}
              <div className="bg-green-900/10 border border-green-800/30 rounded-xl p-3.5">
                <p className="text-green-400 text-[10px] font-bold uppercase mb-1.5">{t("analysis.suggestedFix")}</p>
                <p className="text-green-200/90 text-[11px] leading-relaxed">
                  {lang === "ko"
                    ? "제7조(작품의 검수) ① 서비스 제공업자는 원고를 인도받은 날로부터 __일 이내에 검수 결과를 통지한다…"
                    : "Article 7 (Inspection) ① The service provider shall notify the inspection result within __ days of delivery…"}
                </p>
                <p className="text-green-600/80 text-[10px] italic mt-1.5">
                  {lang === "ko" ? "출처: 문화체육관광부 웹툰 연재계약서 표준계약서 제7조" : "Source: MCST Webtoon Serialization Standard Contract, Art. 7"}
                </p>
              </div>
              {/* floating badge */}
              <div className="absolute -right-4 -top-4 bg-red-600 text-white text-xs font-bold rounded-xl px-3.5 py-2 shadow-lg shadow-red-950/50 rotate-3">
                {lang === "ko" ? "원문 그대로 인용" : "Quoted verbatim"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Standard contract fields preview */}
      <section id="fields" className="pb-20 px-6 bg-gradient-to-br from-[#121729] to-[#170f2a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">{t("landing.catTitle")}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto break-keep">{t("landing.catSub")}</p>
            <p className="text-slate-600 text-sm mt-3">
              {TOTAL_CATEGORY_COUNT}{t("standard.fieldsLabel")} · {TOTAL_CONTRACT_COUNT}{t("standard.formsLabel")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STANDARD_CONTRACTS.map((c) => (
              <Link
                key={c.id}
                href="/dashboard"
                className="bg-[#162035] border border-[#2a3d5f] hover:border-red-600/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30 rounded-2xl p-5 transition-all duration-300 ease-out group"
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
              className="bg-red-700 border border-red-600/50 rounded-2xl p-5 flex flex-col justify-center items-start shadow-lg shadow-red-950/40 transition-all duration-300 ease-out hover:bg-red-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-950/50"
            >
              <Library className="w-7 h-7 text-white mb-2" />
              <h3 className="text-white font-bold text-base mb-1">{t("landing.catViewAll")}</h3>
              <span className="text-red-100 text-sm font-medium inline-flex items-center gap-1 mt-1">
                {t("landing.ctaPrimary")}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 border-t border-[#1e3050] bg-gradient-to-b from-[#0f1a2e] to-[#0c1624]">
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
      <section className="py-20 px-6 border-t border-[#2a1d33] bg-gradient-to-br from-[#121729] to-[#170f2a]">
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

      {/* Pricing teaser → full pricing lives on /pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-[#1e3050] bg-gradient-to-b from-[#0f1a2e] to-[#0c1624]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t("landing.pricingTitle")}</h2>
          <p className="text-slate-400 mb-8">{t("landing.pricingSub")}</p>
          <div className="flex flex-wrap justify-center gap-3 mb-10 text-sm">
            <span className="bg-[#162035] border border-[#2a3d5f] text-slate-300 rounded-full px-4 py-2">{t("common.free")} ₩0</span>
            <span className="bg-[#162035] border border-[#2a3d5f] text-slate-300 rounded-full px-4 py-2">{t("landing.planPackageName")} ₩{PACKAGE_PRICE_KRW.toLocaleString()}</span>
            <span className="bg-[#162035] border border-[#2a3d5f] text-slate-300 rounded-full px-4 py-2">{t("landing.proName")} ₩{PRO_PRICE_KRW.toLocaleString()}/{t("pass.perMonth")}</span>
          </div>
          <Link
            href="/pricing"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            {t("landing.pricingViewAll")}
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-[#2a1d33] bg-gradient-to-br from-[#121729] to-[#170f2a]">
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
      <footer className="border-t border-[#2a1d33] bg-[#0c1120] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span className="text-white font-bold">레드라인AI</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/terms"   className="hover:text-slate-300 transition-colors">{t("auth.termsOfService")}</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">{t("auth.privacyPolicy")}</Link>
            <Link href="/refund"  className="hover:text-slate-300 transition-colors">{t("auth.refundPolicy")}</Link>
          </div>
          <p className="text-slate-500 text-xs max-w-2xl leading-relaxed">
            레드라인AI 안내: 본 서비스는 프리랜서 권익 보호를 위해 계약서 내 조항을 문화체육관광부 표준계약서와 비교해 다른 점을 보여주는 가이드 툴입니다. 변호사의 법률 자문이나 대리를 대체하지 않으며, 최종 계약 체결에 대한 법적 책임은 사용자 본인에게 있습니다.
          </p>
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
