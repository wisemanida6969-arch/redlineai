"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import { useT } from "@/lib/i18n/LanguageProvider";
import {
  FileText, Receipt, Building2, ChevronDown, ChevronRight,
  Mail, Sparkles, Eye, Download,
  Search, BookOpen
} from "lucide-react";

type FeatureKey = "analysis" | "quote" | "vendor";

export default function HelpPage() {
  const { t, lang } = useT();
  const [open, setOpen] = useState<FeatureKey | null>("analysis");
  const ko = lang === "ko";

  const features: { id: FeatureKey; label: string; icon: typeof FileText; tagline: string }[] = [
    { id: "analysis", label: ko ? "계약서 분석" : "Contract Analysis", icon: FileText, tagline: ko ? "AI로 위험 조항 찾기" : "Spot risky clauses with AI" },
    { id: "quote",    label: ko ? "견적서 → 계약서" : "Quote to Contract", icon: Receipt, tagline: ko ? "견적서·대화를 즉시 계약서로" : "Turn quotes & chats into contracts" },
    { id: "vendor",   label: ko ? "공급업체 리스크 스캔" : "Vendor Risk Scan",  icon: Building2, tagline: ko ? "회사 실사 자동화" : "Due-diligence on any company" },
  ];

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-800/50 text-red-400 text-xs px-3 py-1 rounded-full mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            {t("help.badge")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t("help.title")}</h1>
          <p className="text-slate-400">{t("help.sub")}</p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {features.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setOpen(id)}
              className={`p-4 rounded-xl border transition-colors text-left ${
                open === id
                  ? "bg-red-900/20 border-red-700/50"
                  : "bg-[#162035] border-[#1e3050] hover:border-slate-500"
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${open === id ? "text-red-400" : "text-slate-400"}`} />
              <p className={`text-xs font-medium ${open === id ? "text-white" : "text-slate-300"}`}>{label}</p>
            </button>
          ))}
        </div>

        {/* ── Contract Analysis ── */}
        <Section
          isOpen={open === "analysis"}
          onToggle={() => setOpen(open === "analysis" ? null : "analysis")}
          icon={FileText}
          title={ko ? "계약서 분석" : "Contract Analysis"}
          tagline={ko ? "계약서 업로드 → AI가 위험 조항 분석 → PDF 리포트 내보내기" : "Upload a contract → AI flags risky clauses → Export PDF report"}
        >
          <Step n={1} title={ko ? "계약서 분석 탭 열기" : "Open Contract Analysis tab"}>
            {ko ? <>대시보드에서 <strong className="text-white">계약서 분석</strong> 탭을 클릭하세요.</> : <>On the Dashboard, click the <strong className="text-white">Contract Analysis</strong> tab.</>}
          </Step>
          <Step n={2} title={ko ? "계약서 업로드 또는 텍스트 붙여넣기" : "Upload your contract or paste text"}>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              {ko ? <>
                <li>📄 <strong className="text-slate-300">파일 업로드</strong>: PDF/DOCX를 드래그하거나 클릭해서 선택 (최대 20MB)</li>
                <li>📝 <strong className="text-slate-300">텍스트 붙여넣기</strong>: 계약서 원문 텍스트 복사·붙여넣기</li>
                <li>📷 <strong className="text-slate-300">스캔된 PDF</strong>: Claude Vision이 자동으로 인식합니다 — 별도 설정 불필요</li>
              </> : <>
                <li>📄 <strong className="text-slate-300">Upload File</strong>: drag PDF/DOCX or click to browse (max 20MB)</li>
                <li>📝 <strong className="text-slate-300">Paste Text</strong>: copy and paste raw contract text</li>
                <li>📷 <strong className="text-slate-300">Scanned PDFs</strong>: Claude Vision automatically reads them — no setup needed</li>
              </>}
            </ul>
          </Step>
          <Step n={3} title={ko ? "'계약서 분석하기' 클릭" : "Click 'Analyze Contract'"}>
            {ko ? "Claude AI가 모든 조항을 분석하고 심각도별로 분류합니다:" : "Claude AI analyzes every clause and categorizes issues by severity:"}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Badge color="red" label={ko ? "높음" : "HIGH"} desc={ko ? "위험·불공정 조항" : "Dangerous, one-sided"} />
              <Badge color="yellow" label={ko ? "중간" : "MEDIUM"} desc={ko ? "모호한 표현" : "Vague, unclear"} />
              <Badge color="blue" label={ko ? "낮음" : "LOW"} desc={ko ? "사소한 개선 사항" : "Minor improvements"} />
            </div>
          </Step>
          <Step n={4} title={ko ? "리포트 검토" : "Review the report"}>
            {ko ? "각 지적된 조항에는 다음이 포함됩니다:" : "Each flagged clause includes:"}
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              {ko ? <>
                <li><strong className="text-slate-300">원문 인용</strong> — 계약서 원문 그대로</li>
                <li><strong className="text-slate-300">왜 위험한가</strong> — 쉬운 말로 설명</li>
                <li><strong className="text-slate-300">수정 제안</strong> — 바로 복사해서 사용</li>
              </> : <>
                <li><strong className="text-slate-300">Original quote</strong> from the contract</li>
                <li><strong className="text-slate-300">Why it&apos;s risky</strong> in plain language</li>
                <li><strong className="text-slate-300">Suggested fix</strong> — copy-paste ready</li>
              </>}
            </ul>
          </Step>
          <Step n={5} title={ko ? "리포트 내보내기" : "Export the report"} icon={Download}>
            {ko ? <><strong className="text-white">리포트 다운로드</strong> 클릭 → <strong>PDF</strong> 또는 <strong>Word</strong> 선택. 팀이나 변호사와 공유하세요.</> : <>Click <strong className="text-white">Download Report</strong> → choose <strong>PDF</strong> or <strong>Word</strong>. Share with your team or lawyer.</>}
          </Step>
          <Step n={6} title={ko ? "과거 스캔 다시 열기" : "Re-open past scans"} icon={Eye}>
            {ko ? <>이전 스캔 기록은 하단 <strong className="text-white">최근 스캔 기록</strong>에서 확인할 수 있습니다. 항목을 클릭하면 전체 리포트가 다시 열립니다.</> : <>All your past scans appear in <strong className="text-white">Recent Scans</strong> at the bottom. Click any item to re-open the full report.</>}
          </Step>
        </Section>

        {/* ── Quote to Contract ── */}
        <Section
          isOpen={open === "quote"}
          onToggle={() => setOpen(open === "quote" ? null : "quote")}
          icon={Receipt}
          title={ko ? "견적서 → 계약서" : "Quote to Contract"}
          tagline={ko ? "견적서 업로드 → AI가 조건 추출 → 서비스 계약서 자동 생성" : "Upload a quote → AI extracts terms → Auto-generates service agreement"}
        >
          <Step n={1} title={ko ? "견적서 → 계약서 탭 열기" : "Open Quote to Contract tab"}>
            {ko ? <><strong className="text-white">견적서 → 계약서</strong> 탭을 클릭하세요.</> : <>Click the <strong className="text-white">Quote to Contract</strong> tab.</>}
            <p className="text-yellow-400 text-xs mt-1">{ko ? "⚠️ Pro 플랜 이상 (무료 플랜에서는 잠김)" : "⚠️ Pro plan and above (locked on Free plan)"}</p>
          </Step>
          <Step n={2} title={ko ? "견적서 또는 제안서 업로드" : "Upload a quote or proposal"}>
            {ko ? "당사자·서비스·가격·일정이 담긴 PDF나 DOCX를 드래그하세요." : "Drag a PDF or DOCX with quote details — parties, services, pricing, schedule."}
          </Step>
          <Step n={3} title={ko ? "'계약서 생성하기' 클릭" : "Click 'Generate Contract'"}>
            {ko ? "AI가 다음 항목을 자동으로 추출합니다:" : "AI extracts these fields automatically:"}
            <div className="bg-[#0f1a2e] rounded-lg p-3 mt-2 text-xs text-slate-400 space-y-1">
              {ko ? <>
                <p>• 공급자 & 고객 정보 (이름, 연락처, 주소)</p>
                <p>• 서비스 설명 / 업무 범위</p>
                <p>• 총 금액 + 결제 조건</p>
                <p>• 납기일 / 계약 기간</p>
                <p>• 추가 조항</p>
              </> : <>
                <p>• Provider & Client info (name, contact, address)</p>
                <p>• Service description / scope of work</p>
                <p>• Total amount + payment terms</p>
                <p>• Delivery date / contract duration</p>
                <p>• Additional terms</p>
              </>}
            </div>
          </Step>
          <Step n={4} title={ko ? "추출된 조건 검토·수정" : "Review & edit extracted terms"}>
            {ko ? "모든 필드를 편집할 수 있습니다. 생성 전 추출 오류를 수정하세요." : "All fields are editable. Fix any extraction errors before generating."}
          </Step>
          <Step n={5} title={ko ? "계약서 미리보기" : "Preview the contract"}>
            {ko ? <><strong className="text-white">계약서 미리보기</strong> 클릭 → 다음을 포함한 11개 섹션의 서비스 계약서:</> : <>Click <strong className="text-white">Preview Contract</strong> → 11-section service agreement with:</>}
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              {ko ? <>
                <li>업무 범위, 결제 조건, 납기 일정</li>
                <li>비밀유지, 지식재산권, 계약 해지</li>
                <li>책임 한도, 독립 계약자 조항</li>
                <li>서명란 (인쇄 후 사용 가능)</li>
              </> : <>
                <li>Scope of Work, Payment Terms, Delivery Timeline</li>
                <li>Confidentiality, IP, Termination</li>
                <li>Limitation of Liability, Independent Contractor</li>
                <li>Signature blocks (ready for printing)</li>
              </>}
            </ul>
          </Step>
          <Step n={6} title={ko ? "PDF로 다운로드" : "Download as PDF"} icon={Download}>
            {ko ? <><strong className="text-white">PDF 다운로드</strong>를 클릭하면 바로 서명 가능한 스타일의 계약서를 받을 수 있습니다.</> : <>Click <strong className="text-white">Download PDF</strong> for a styled, ready-to-sign contract.</>}
          </Step>
        </Section>

        {/* ── Vendor Risk Scan ── */}
        <Section
          isOpen={open === "vendor"}
          onToggle={() => setOpen(open === "vendor" ? null : "vendor")}
          icon={Building2}
          title={ko ? "공급업체 리스크 스캔" : "Vendor Risk Scan"}
          tagline={ko ? "회사명 입력 → AI가 웹 검색 → 실사 리포트 생성" : "Type a company name → AI searches the web → Generates due-diligence report"}
        >
          <Step n={1} title={ko ? "공급업체 리스크 스캔 탭 열기" : "Open Vendor Risk Scan tab"}>
            {ko ? <><strong className="text-white">공급업체 리스크 스캔</strong> 탭을 클릭하세요.</> : <>Click the <strong className="text-white">Vendor Risk Scan</strong> tab.</>}
            <p className="text-yellow-400 text-xs mt-1">{ko ? "⚠️ Pro: 월 10회 · Business: 월 30회 (무료 플랜에서는 잠김)" : "⚠️ Pro: 10/month · Business: 30/month (locked on Free)"}</p>
          </Step>
          <Step n={2} title={ko ? "공급업체명 입력" : "Enter the vendor name"}>
            {ko ? <>회사명을 입력하세요 (예: <code className="bg-[#0f1a2e] px-2 py-0.5 rounded text-red-300">Stripe</code>, <code className="bg-[#0f1a2e] px-2 py-0.5 rounded text-red-300">Acme Corp</code>, <code className="bg-[#0f1a2e] px-2 py-0.5 rounded text-red-300">Google</code>).</> : <>Type any company (e.g., <code className="bg-[#0f1a2e] px-2 py-0.5 rounded text-red-300">Stripe</code>, <code className="bg-[#0f1a2e] px-2 py-0.5 rounded text-red-300">Acme Corp</code>, <code className="bg-[#0f1a2e] px-2 py-0.5 rounded text-red-300">Google</code>).</>}
          </Step>
          <Step n={3} title={ko ? "'리스크 스캔 실행' 클릭" : "Click 'Run Risk Scan'"}>
            {ko ? "Claude AI가 실시간 웹 검색으로 조사합니다 (약 30~60초):" : "Claude AI uses live web search to investigate (~30–60 seconds):"}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <InfoCard icon={Search} label={ko ? "뉴스 & 평판" : "News & Reputation"} />
              <InfoCard icon={Search} label={ko ? "재무 상태" : "Financial Health"} />
              <InfoCard icon={Search} label={ko ? "법적 기록" : "Legal Records"} />
              <InfoCard icon={Search} label={ko ? "리뷰 & 평가" : "Reviews & Ratings"} />
            </div>
          </Step>
          <Step n={4} title={ko ? "리포트 확인" : "Read the report"}>
            {ko ? "다음 항목을 포함한 완전한 실사 리포트를 받습니다:" : "You get a complete due-diligence report with:"}
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              {ko ? <>
                <li><strong className="text-slate-300">종합 리스크</strong> — 높음 / 중간 / 낮음</li>
                <li><strong className="text-slate-300">3개 리스크 섹션</strong> — 뉴스·재무·법적 이슈</li>
                <li><strong className="text-slate-300">권장사항</strong> — 계약 전 확인할 사항</li>
                <li><strong className="text-slate-300">출처</strong> — 검증용 URL 링크</li>
              </> : <>
                <li><strong className="text-slate-300">Overall Risk</strong> — High / Medium / Low</li>
                <li><strong className="text-slate-300">3 risk sections</strong> — News, Financial, Legal</li>
                <li><strong className="text-slate-300">Recommendations</strong> — what to verify before signing</li>
                <li><strong className="text-slate-300">Sources</strong> — clickable URLs for verification</li>
              </>}
            </ul>
          </Step>
          <Step n={5} title={ko ? "내보내기 & 저장" : "Export & save"} icon={Download}>
            {ko ? <>PDF 또는 Word로 다운로드하세요. 이전 스캔은 하단 <strong className="text-white">최근 공급업체 스캔</strong>에 표시되며, 클릭하면 다시 열립니다.</> : <>Download as PDF or Word. Past scans appear in <strong className="text-white">Recent Vendor Scans</strong> at the bottom — click any to re-open.</>}
          </Step>
          <Step n={6} title={ko ? "최적의 검색 대상" : "Best vendor types"}>
            {ko ? "다음 회사에 가장 적합합니다:" : "Works best for:"}
            <div className="bg-[#0f1a2e] rounded-lg p-3 mt-2 text-xs text-slate-400">
              {ko ? <>
                <p>⭐ <strong className="text-slate-300">매우 우수:</strong> 미국·영국·캐나다·호주·인도 기업</p>
                <p>👍 <strong className="text-slate-300">우수:</strong> 싱가포르·독일·프랑스·EU 기업</p>
                <p>⚠️ <strong className="text-slate-300">제한적:</strong> 영문 정보가 없는 소규모 지역 사업체</p>
              </> : <>
                <p>⭐ <strong className="text-slate-300">Excellent:</strong> US, UK, Canada, Australia, India</p>
                <p>👍 <strong className="text-slate-300">Good:</strong> Singapore, Germany, France, EU companies</p>
                <p>⚠️ <strong className="text-slate-300">Limited:</strong> small local businesses with no English presence</p>
              </>}
            </div>
          </Step>
        </Section>


        {/* Footer CTA */}
        <div className="bg-gradient-to-br from-red-900/20 to-[#162035] border border-[#1e3050] rounded-2xl p-6 mt-10 text-center">
          <Sparkles className="w-6 h-6 text-red-400 mx-auto mb-3" />
          <h3 className="text-white font-bold text-lg mb-1">{t("help.stillQuestions")}</h3>
          <p className="text-slate-400 text-sm mb-4">{t("help.emailUs")}</p>
          <a
            href="mailto:admin@pactbug.com"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Mail className="w-4 h-4" /> admin@pactbug.com
          </a>
        </div>

        <div className="text-center mt-8">
          <Link href="/dashboard" className="text-red-400 hover:text-red-300 text-sm font-medium">
            {t("common.backToDashboard")}
          </Link>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

/* ──────────────── Sub-components ──────────────── */

function Section({
  isOpen, onToggle, icon: Icon, title, tagline, children,
}: {
  isOpen: boolean;
  onToggle: () => void;
  icon: typeof FileText;
  title: string;
  tagline: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-[#162035] border rounded-2xl mb-4 transition-colors ${isOpen ? "border-red-700/50" : "border-[#1e3050]"}`}>
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isOpen ? "bg-red-900/40" : "bg-red-900/20"}`}>
          <Icon className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <p className="text-slate-400 text-sm">{tagline}</p>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-6 space-y-4 border-t border-[#1e3050] pt-5">
          {children}
        </div>
      )}
    </div>
  );
}

function Step({
  n, title, icon: Icon, children,
}: {
  n: number;
  title: string;
  icon?: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 bg-red-900/30 border border-red-800/50 rounded-full flex items-center justify-center text-red-400 font-bold text-sm">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-red-400" />}
          {title}
        </p>
        <div className="text-slate-400 text-sm mt-1 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Badge({ color, label, desc }: { color: "red" | "yellow" | "blue"; label: string; desc: string }) {
  const colors = {
    red:    { bg: "bg-red-900/20",    border: "border-red-800/50",    text: "text-red-300" },
    yellow: { bg: "bg-yellow-900/20", border: "border-yellow-800/50", text: "text-yellow-300" },
    blue:   { bg: "bg-blue-900/20",   border: "border-blue-800/50",   text: "text-blue-300" },
  };
  const c = colors[color];
  return (
    <div className={`${c.bg} ${c.border} border rounded-lg p-2 text-center`}>
      <p className={`${c.text} text-xs font-bold`}>{label}</p>
      <p className="text-slate-500 text-[10px] mt-0.5">{desc}</p>
    </div>
  );
}

function InfoCard({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return (
    <div className="bg-[#0f1a2e] border border-[#1e3050] rounded-lg p-2 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-red-400 shrink-0" />
      <span className="text-slate-300 text-xs">{label}</span>
    </div>
  );
}

