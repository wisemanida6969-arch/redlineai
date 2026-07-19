import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import { getAllGuides } from "@/lib/guides";

const BASE = "https://getredlineai.com";

export const metadata: Metadata = {
  title: "표준계약서 가이드 — 사안별 규정 정리",
  description:
    "정산, 계약 해지, 2차적저작물, 계약 변경 — 문화체육관광부 표준계약서가 각 사안을 어떻게 규정하는지 원문 인용과 함께 정리한 참고 자료입니다.",
  alternates: { canonical: `${BASE}/guide` },
  openGraph: {
    type: "website",
    url: `${BASE}/guide`,
    title: "표준계약서 가이드 — 사안별 규정 정리 | 레드라인AI",
    description: "문화체육관광부 표준계약서가 각 사안을 어떻게 규정하는지 원문 인용과 함께 정리한 참고 자료.",
    siteName: "레드라인AI",
    locale: "ko_KR",
  },
};

export default function GuideIndexPage() {
  const guides = getAllGuides();
  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />
      <div className="pt-28 pb-16 px-6 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 break-keep">표준계약서 가이드</h1>
        <p className="text-slate-400 mb-10 break-keep">
          문화체육관광부 표준계약서가 각 사안을 어떻게 규정하는지, 원문 인용과 함께 정리한 참고 자료입니다.
        </p>
        <div className="space-y-4">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/guide/${g.slug}`}
              className="block bg-[#162035] border border-[#2a3d5f] hover:border-red-600/60 rounded-2xl p-5 transition-colors"
            >
              <p className="text-red-400 text-xs font-semibold mb-1">{g.standardName}</p>
              <h2 className="text-white font-bold text-lg mb-1 break-keep">{g.title}</h2>
              <p className="text-slate-400 text-sm break-keep">{g.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
