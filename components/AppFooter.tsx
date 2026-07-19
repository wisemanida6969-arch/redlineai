"use client";
import Link from "next/link";
import { Mail, Shield } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function AppFooter() {
  const { t } = useT();
  return (
    <footer className="border-t border-[#1e3050] mt-16 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          <span className="text-white font-bold text-sm">레드라인AI</span>
        </div>

        <a
          href="mailto:admin@pactbug.com"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          {t("footer.inquiries")} <span className="text-red-400">admin@pactbug.com</span>
        </a>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-slate-500">
          <Link href="/help"    className="hover:text-slate-300 transition-colors">{t("common.helpGuide")}</Link>
          <Link href="/guide"   className="hover:text-slate-300 transition-colors">{t("common.contractGuide")}</Link>
          <Link href="/terms"   className="hover:text-slate-300 transition-colors">{t("auth.termsOfService")}</Link>
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">{t("auth.privacyPolicy")}</Link>
          <Link href="/refund"  className="hover:text-slate-300 transition-colors">{t("auth.refundPolicy")}</Link>
        </div>

        <p className="text-slate-500 text-xs max-w-2xl leading-relaxed">
          레드라인AI 안내: 본 서비스는 프리랜서 권익 보호를 위해 계약서 내 조항을 문화체육관광부 표준계약서와 비교해 다른 점을 보여주는 가이드 툴입니다. 변호사의 법률 자문이나 대리를 대체하지 않으며, 최종 계약 체결에 대한 법적 책임은 사용자 본인에게 있습니다.
        </p>

        <p className="text-slate-600 text-xs">{t("common.copyright")}</p>
      </div>
    </footer>
  );
}
