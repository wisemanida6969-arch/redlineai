"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import { useT } from "@/lib/i18n/LanguageProvider";
import {
  FileText, Receipt, Building2, ChevronDown, ChevronRight,
  Mail, Sparkles, Eye, Download, Library, Bot, Scale,
  Search, BookOpen, Edit3, Upload, MessageSquare, Info,
} from "lucide-react";

type FeatureKey = "standard" | "analysis" | "quote" | "vendor" | "agent";

export default function HelpPage() {
  const { t, lang } = useT();
  const [open, setOpen] = useState<FeatureKey | null>("standard");
  const ko = lang === "ko";

  const features: { id: FeatureKey; label: string; icon: typeof FileText; tagline: string }[] = [
    { id: "standard", label: ko ? "표준계약서" : "Standard Contracts", icon: Library, tagline: ko ? "문체부 표준양식 둘러보기" : "Browse official MCST forms" },
    { id: "analysis", label: ko ? "계약서 검토" : "Contract Review",   icon: FileText, tagline: ko ? "표준 대비 다른 조항 확인" : "See clauses that differ vs. the standard" },
    { id: "quote",    label: ko ? "초안 정리 툴" : "Draft Organizer",  icon: Receipt,  tagline: ko ? "표준양식 기반 자동화 초안 정리" : "Automated draft organizing on a standard form" },
    { id: "vendor",   label: ko ? "공급업체 리스크 스캔" : "Vendor Risk Scan", icon: Building2, tagline: ko ? "회사 실사 자동화" : "Due-diligence on any company" },
    { id: "agent",    label: ko ? "AI 에이전트" : "AI Agent",          icon: Bot,      tagline: ko ? "법률 질문·협상 이메일 챗봇" : "Legal Q&A & negotiation chat" },
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
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

        {/* ── Standard Contracts ── */}
        <Section
          isOpen={open === "standard"}
          onToggle={() => setOpen(open === "standard" ? null : "standard")}
          icon={Library}
          title={ko ? "표준계약서" : "Standard Contracts"}
          tagline={ko ? "문화체육관광부 표준계약서 5개 분야 35종을 둘러보고, 공식 양식을 받고, AI로 작성·비교하세요" : "Browse 5 fields / 35 official MCST forms, download the original, then draft or compare with AI"}
        >
          <Step n={1} title={ko ? "분야 선택" : "Pick a field"}>
            {ko ? <>미술(12종) · 만화·웹툰(8종) · 공연예술(5종) · 영화(5종) · 공예(5종) 중 내 상황에 맞는 분야를 고르세요.</> : <>Choose from Fine Art (12), Webtoon (8), Performing Arts (5), Film (5), or Craft (5).</>}
          </Step>
          <Step n={2} title={ko ? "표준양식 확인" : "Check the standard form"}>
            {ko ? "당사자, 언제 사용하는지, 관할 부처 정보를 확인하고, 공식 원본 PDF를 문화체육관광부/한국예술인복지재단에서 내려받을 수 있습니다." : "Review the parties, when it's used, and the issuing ministry — then download the official PDF from MCST or the Korea Artist Welfare Foundation."}
          </Step>
          <Step n={3} title={ko ? "판례 확인" : "Check related precedents"} icon={Scale}>
            {ko ? "각 표준양식 하단에서 이 분야 실제 법원 판례를 검색할 수 있습니다. 사건 목록·검색은 무료, 판시사항·판결요지 전체 열람은 판례 열람 패스(24시간, ₩4,900) 또는 사인 전 패키지(₩19,900)가 필요합니다." : "Search real court precedents in this field at the bottom of each form. Case search & listing are free; the full issue & holding text needs a 24h Precedent Pass (₩4,900) or the Pre-Sign Package (₩19,900)."}
          </Step>
          <Step n={4} title={ko ? "AI 작성 또는 검토로 이동" : "Jump to Draft or Review"}>
            {ko ? <><strong className="text-white">이 양식으로 AI 작성</strong>을 누르면 계약서 작성 탭으로, <strong className="text-white">받은 계약서 검토하기</strong>를 누르면 계약서 검토 탭으로 이 표준양식이 자동으로 연결된 채 이동합니다.</> : <>Tap <strong className="text-white">Draft this with AI</strong> to jump to Draft, or <strong className="text-white">Review a contract I received</strong> to jump to Review — both carry this standard form with you.</>}
          </Step>
        </Section>

        {/* ── Contract Review ── */}
        <Section
          isOpen={open === "analysis"}
          onToggle={() => setOpen(open === "analysis" ? null : "analysis")}
          icon={FileText}
          title={ko ? "계약서 검토" : "Contract Review"}
          tagline={ko ? "계약서 업로드 → AI가 표준 대비 다른 조항 표시 → PDF 리포트" : "Upload a contract → AI shows how it differs vs. the standard → Export PDF report"}
        >
          <Step n={1} title={ko ? "계약서 검토 탭 열기" : "Open the Contract Review tab"}>
            {ko ? <>대시보드에서 <strong className="text-white">계약서 검토</strong> 탭을 클릭하세요. 표준계약서 라이브러리에서 넘어왔다면 상단에 노란 배너로 어떤 표준과 비교 중인지 표시됩니다. 표준을 직접 고르지 않아도, AI가 계약서 내용을 보고 알맞은 문체부 표준계약서를 자동으로 선택합니다.</> : <>Click the <strong className="text-white">Contract Review</strong> tab. If you arrived from the Standard Contracts library, a yellow banner at the top shows which standard you&apos;re comparing against. Even without picking one, AI auto-selects the matching MCST standard form from your contract&apos;s content.</>}
          </Step>
          <Step n={2} title={ko ? "계약서 업로드 또는 텍스트 붙여넣기" : "Upload your contract or paste text"}>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              {ko ? <>
                <li>📄 <strong className="text-slate-300">파일 업로드</strong>: PDF · DOCX · HWPX · 구형 HWP 지원 (최대 20MB)</li>
                <li>📝 <strong className="text-slate-300">텍스트 붙여넣기</strong>: 계약서 원문 텍스트 복사·붙여넣기</li>
                <li>📷 <strong className="text-slate-300">스캔된 PDF</strong>: Claude Vision이 자동으로 인식합니다 — 별도 설정 불필요</li>
              </> : <>
                <li>📄 <strong className="text-slate-300">Upload File</strong>: PDF, DOCX, HWPX, and old-format HWP supported (max 20MB)</li>
                <li>📝 <strong className="text-slate-300">Paste Text</strong>: copy and paste raw contract text</li>
                <li>📷 <strong className="text-slate-300">Scanned PDFs</strong>: Claude Vision automatically reads them — no setup needed</li>
              </>}
            </ul>
          </Step>
          <Step n={3} title={ko ? "'계약서 비교하기' 클릭" : "Click 'Compare Contract'"}>
            {ko ? "Claude AI가 모든 조항을 표준계약서와 비교해 차이 정도별로 분류합니다. 표준양식과 함께 열었다면, 표준 대비 빠지거나 약화된 보호 조항을 우선적으로 표시합니다:" : "Claude AI compares every clause against the standard contract and categorizes them by how much they differ. If a standard form is attached, it prioritizes clauses that are missing or weaker than the standard:"}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Badge color="red" label={ko ? "높음" : "HIGH"} desc={ko ? "표준과 큰 차이" : "Differs significantly"} />
              <Badge color="yellow" label={ko ? "중간" : "MEDIUM"} desc={ko ? "표준과 다소 차이" : "Differs somewhat"} />
              <Badge color="blue" label={ko ? "낮음" : "LOW"} desc={ko ? "표준과 경미한 차이" : "Differs slightly"} />
            </div>
          </Step>
          <Step n={4} title={ko ? "한국 프리랜서 계약서에서 자주 발견되는 3가지 조항 자동 확인" : "Auto-checks the 3 clause patterns most common in Korean freelance contracts"} icon={Info}>
            {ko ? "계약서 종류와 무관하게 아래 세 가지를 항상 우선적으로 확인해 표시합니다:" : "Regardless of contract type, these three are always checked first and flagged when found:"}
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              {ko ? <>
                <li>♾️ <strong className="text-slate-300">수정 횟수 제한 없는 조항</strong> — &quot;갑이 만족할 때까지 수정&quot; 등 표준계약서에 있는 수정 횟수·요율 조항이 없는 경우</li>
                <li>©️ <strong className="text-slate-300">저작권 전부 귀속 조항</strong> — &quot;모든 권리는 갑에게 귀속&quot; 등 표준계약서와 달리 대금 완납 전에도 저작권이 이전되는 경우</li>
                <li>💣 <strong className="text-slate-300">지체상금 상한 없는 조항</strong> — 표준계약서에 있는 상한선·갑의 귀책 지연 제외 조항이 없는 경우</li>
              </> : <>
                <li>♾️ <strong className="text-slate-300">Unlimited-revision clause</strong> — e.g. &quot;revise until the client is satisfied&quot;, where the standard form&apos;s revision cap and rate for extra rounds is missing</li>
                <li>©️ <strong className="text-slate-300">Full copyright-transfer clause</strong> — e.g. &quot;all rights belong to the client&quot;, where the standard form&apos;s protection (copyright stays with the freelancer until paid in full) is missing</li>
                <li>💣 <strong className="text-slate-300">Uncapped late-delivery penalty clause</strong> — where the standard form&apos;s rate cap and client-caused-delay exclusion is missing</li>
              </>}
            </ul>
          </Step>
          <Step n={5} title={ko ? "리포트 확인" : "Read the report"}>
            {ko ? "각 표시된 조항에는 다음이 포함됩니다:" : "Each flagged clause includes:"}
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              {ko ? <>
                <li><strong className="text-slate-300">원문 인용</strong> — 계약서 원문 그대로</li>
                <li><strong className="text-slate-300">표준과 다른 점</strong> — 이 계약서 조항이 무엇을 규정하는지 사실 그대로 서술</li>
                <li><strong className="text-slate-300">표준계약서 원문</strong> — 대응하는 표준계약서 조항을 번호·출처와 함께 그대로 인용 (대응 조항이 없으면 표시되지 않음)</li>
              </> : <>
                <li><strong className="text-slate-300">Original quote</strong> from the contract</li>
                <li><strong className="text-slate-300">How it differs from the standard</strong> — a factual statement of what the contract&apos;s clause provides</li>
                <li><strong className="text-slate-300">Official Standard Text</strong> — the corresponding standard article quoted verbatim with its number and source (omitted when none corresponds)</li>
              </>}
            </ul>
          </Step>
          <Step n={6} title={ko ? "관련 판례 확인" : "Check related precedents"} icon={Scale}>
            {ko ? "리포트 하단에 이 계약 내용에서 뽑아낸 검색어로 실제 법원 판례를 보여줍니다. 검색어 칩을 누르거나 직접 검색할 수 있습니다." : "The bottom of the report surfaces real court precedents using keywords extracted from your contract. Tap a keyword chip or search your own."}
          </Step>
          <Step n={7} title={ko ? "리포트 내보내기" : "Export the report"} icon={Download}>
            {ko ? <><strong className="text-white">리포트 다운로드</strong> 클릭 → <strong>PDF</strong> 또는 <strong>Word</strong> 선택. 팀이나 변호사와 공유하세요. <strong className="text-white">사인 전 패키지</strong>(₩19,900, 계약서 1건)를 이용하면 표지·요약·조항별 비교·관련 판례·업체 정보를 담은 정식 PDF 리포트를 받을 수 있고, 판례 열람·리스크 검색 24시간 이용이 함께 제공됩니다.</> : <>Click <strong className="text-white">Download Report</strong> → choose <strong>PDF</strong> or <strong>Word</strong>. Share with your team or lawyer. The <strong className="text-white">Pre-Sign Package</strong> (₩19,900 per contract) adds a full PDF report — cover, summary, clause-by-clause comparison, related precedents, vendor info — plus 24h precedent and risk-search access.</>}
          </Step>
          <Step n={8} title={ko ? "과거 스캔 다시 열기" : "Re-open past scans"} icon={Eye}>
            {ko ? <>이전 스캔 기록은 하단 <strong className="text-white">최근 스캔 기록</strong>에서 확인할 수 있습니다. 항목을 클릭하면 전체 리포트가 다시 열립니다.</> : <>All your past scans appear in <strong className="text-white">Recent Scans</strong> at the bottom. Click any item to re-open the full report.</>}
          </Step>
        </Section>

        {/* ── Contract Draft ── */}
        <Section
          isOpen={open === "quote"}
          onToggle={() => setOpen(open === "quote" ? null : "quote")}
          icon={Receipt}
          title={ko ? "초안 정리 툴" : "Draft Organizer"}
          tagline={ko ? "견적서·대화·직접 입력 → 표준양식 기반 초안 자동 정리 (법률 자문 아님)" : "From a quote, chat, or manual entry → automated draft organizing on the matching standard form (not legal advice)"}
        >
          <p className="text-yellow-200 text-xs leading-relaxed bg-yellow-900/15 border border-yellow-700/30 rounded-lg px-3 py-2">
            {ko
              ? "본 서비스는 카톡 대화 내용을 바탕으로 표준 계약서 작성을 돕는 '자동화 도구'이며, 어떠한 법률 자문도 제공하지 않습니다. 최종 계약적 책임은 당사자에게 있습니다."
              : "This service is an \"automation tool\" that helps organize a standard-form draft based on your chat content, and does not provide any legal advice. Final contractual responsibility rests with the parties."}
          </p>
          <Step n={1} title={ko ? "초안 정리 툴 탭 열기" : "Open the Draft Organizer tab"}>
            {ko ? <><strong className="text-white">초안 정리 툴</strong> 탭을 클릭하세요.</> : <>Click the <strong className="text-white">Draft Organizer</strong> tab.</>}
          </Step>
          <Step n={2} title={ko ? "세 가지 시작 방법 중 선택" : "Choose one of three ways to start"} icon={Upload}>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              {ko ? <>
                <li>📤 <strong className="text-slate-300">파일 업로드</strong>: 견적서를 PDF · DOCX · HWPX/HWP · 이미지로 업로드</li>
                <li>💬 <strong className="text-slate-300">대화 붙여넣기</strong>: 카톡·슬랙 등 대화 내용을 붙여넣거나 스크린샷을 올리면 Claude Vision이 읽습니다</li>
                <li>✏️ <strong className="text-slate-300">직접 입력</strong>: 견적서가 없어도 분야·양식만 골라 바로 빈 양식에서 시작</li>
              </> : <>
                <li>📤 <strong className="text-slate-300">Upload File</strong>: PDF, DOCX, HWPX/HWP, or an image of your quote</li>
                <li>💬 <strong className="text-slate-300">Paste Chat</strong>: paste a KakaoTalk/Slack conversation, or drop a screenshot for Claude Vision to read</li>
                <li>✏️ <strong className="text-slate-300">Enter Manually</strong>: no quote at all? Pick a field/form and start from a blank form</li>
              </>}
            </ul>
          </Step>
          <Step n={3} title={ko ? "표준양식 자동 매칭" : "Automatic standard matching"} icon={Library}>
            {ko ? "표준계약서 라이브러리에서 오지 않았다면, AI가 내용을 분석해 문체부 표준계약서 중 가장 잘 맞는 것을 자동으로 골라줍니다. 창작 분야와 무관한 거래는 일반 용역계약서 템플릿으로 처리됩니다." : "If you didn't arrive from the library, AI analyzes your content and auto-selects the best-matching MCST standard form. Deals unrelated to creative fields fall back to a generic service-agreement template."}
          </Step>
          <Step n={4} title={ko ? "조건 검토·수정" : "Review & edit the terms"} icon={Edit3}>
            {ko ? "당사자 정보, 업무 범위, 대금·결제 조건, 납기·계약 기간을 직접 입력하거나 수정할 수 있습니다. 모든 필드가 편집 가능합니다." : "Enter or edit the parties, scope of work, amount & payment terms, and delivery/term — every field is editable."}
          </Step>
          <Step n={5} title={ko ? "'표준계약서 생성' 클릭" : "Click 'Generate Contract'"}>
            {ko ? "AI가 해당 표준계약서의 구조(권리 귀속, 저작인격권, 대금, 수정 범위, 해지, 손해배상 등)를 따르는 정식 계약서를 작성합니다." : "AI drafts a formal contract following the standard's structure — rights assignment, moral rights, payment, revision scope, termination, damages, and more."}
          </Step>
          <Step n={6} title={ko ? "판례 기반 보호 조항 확인" : "Check precedent-based protections"} icon={Scale}>
            {ko ? "미리보기 하단에 어떤 조항이 이 분야의 실제 법원 분쟁을 예방하기 위해 강화되었는지 보여줍니다. 각 조항은 관련 판례와 함께 표시됩니다." : "The preview shows which clauses were strengthened to prevent real disputes in this field — each tied to a related precedent."}
          </Step>
          <Step n={7} title={ko ? "PDF로 다운로드" : "Download as PDF"} icon={Download}>
            {ko ? <><strong className="text-white">PDF 다운로드</strong>를 클릭하면 바로 서명 가능한 스타일의 계약서를 받을 수 있습니다. 서명 전 공식 표준양식 대조와 전문가 검토를 권장합니다.</> : <>Click <strong className="text-white">Download PDF</strong> for a styled, ready-to-sign contract. Verify against the official standard form and have it reviewed before signing.</>}
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
            <p className="text-yellow-400 text-xs mt-1">{ko ? "⚠️ 리스크 검색 패스(24시간, ₩4,900) 또는 사인 전 패키지(₩19,900) 필요 — 프로 플랜(월 ₩49,900)은 매월 10건 포함" : "⚠️ Needs a 24h Risk-Search Pass (₩4,900) or the Pre-Sign Package (₩19,900) — Pro plan (₩49,900/mo) includes 10/mo"}</p>
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
        </Section>

        {/* ── AI Agent ── */}
        <Section
          isOpen={open === "agent"}
          onToggle={() => setOpen(open === "agent" ? null : "agent")}
          icon={Bot}
          title={ko ? "AI 에이전트" : "AI Agent"}
          tagline={ko ? "협상 이메일 작성, 법률 질문, 조항 대안까지 — AI와 대화하세요" : "Draft negotiation emails, ask legal questions, explore clause alternatives — all in chat"}
        >
          <Step n={1} title={ko ? "AI 에이전트 탭 열기" : "Open the AI Agent tab"}>
            {ko ? <><strong className="text-white">AI 에이전트</strong> 탭을 클릭하고 <strong className="text-white">+ 새 대화</strong>를 시작하세요.</> : <>Click the <strong className="text-white">AI Agent</strong> tab and start a <strong className="text-white">+ New conversation</strong>.</>}
          </Step>
          <Step n={2} title={ko ? "계약서 첨부 (선택)" : "Attach a contract (optional)"} icon={MessageSquare}>
            {ko ? "새 대화를 시작할 때 PDF·DOCX 계약서를 첨부하면, 그 내용을 바탕으로 맥락에 맞는 답변을 받을 수 있습니다." : "When starting a new conversation, attach a PDF/DOCX contract to get answers grounded in its content."}
          </Step>
          <Step n={3} title={ko ? "무엇이든 물어보기" : "Ask anything"}>
            {ko ? "예시 질문들:" : "Example prompts:"}
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              {ko ? <>
                <li>계약서의 위약금 조항을 50%로 줄여달라는 정중한 이메일을 작성해줘</li>
                <li>일방 NDA와 상호 NDA의 차이가 뭐야?</li>
                <li>&apos;손해배상예정액&apos;이 무슨 뜻인지 쉬운 말로 설명해줘</li>
                <li>첨부한 계약서를 검토해서 협상해야 할 상위 3개 조항을 알려줘</li>
              </> : <>
                <li>Draft a polite email asking to reduce a contract&apos;s penalty clause to 50%</li>
                <li>What&apos;s the difference between a unilateral NDA and a mutual NDA?</li>
                <li>Explain what &apos;liquidated damages&apos; means in plain language</li>
                <li>Review my attached contract and list the top 3 clauses I should negotiate</li>
              </>}
            </ul>
          </Step>
          <Step n={4} title={ko ? "이메일로 바로 보내기" : "Send emails directly"} icon={Mail}>
            {ko ? "AI가 협상 이메일 초안을 작성하면 답변에 '이메일로 보내기' 버튼이 나타납니다 — 누르면 기본 이메일 앱이 제목·본문을 채운 채로 열립니다." : "When the AI drafts a negotiation email, a 'Send as email' button appears on the reply — it opens your default email app with the subject and body pre-filled."}
          </Step>
          <Step n={5} title={ko ? "대화 기록 관리" : "Manage your conversations"}>
            {ko ? "왼쪽 목록에서 과거 대화를 다시 열거나 삭제할 수 있습니다. 대화 제목은 첫 메시지를 바탕으로 자동 생성됩니다." : "Reopen or delete past conversations from the sidebar. Titles are auto-generated from your first message."}
          </Step>
        </Section>

        {/* Sign recommendation */}
        <div className="mt-8 bg-gradient-to-br from-yellow-900/10 to-[#162035] border border-yellow-700/30 rounded-2xl p-6">
          <h3 className="text-white font-bold text-base mb-2">{t("landing.signNeededTitle")}</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-3">{t("landing.signNeededBody")}</p>
          <div className="flex flex-wrap gap-2">
            <a href="https://www.modusign.co.kr/" target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">모두싸인 →</a>
            <a href="https://www.eformsign.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">이폼사인 →</a>
            <a href="https://www.docusign.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">DocuSign →</a>
            <a href="https://sign.dropbox.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:text-yellow-200 text-xs font-medium bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/40 rounded-md px-3 py-1.5 transition-colors">Dropbox Sign →</a>
          </div>
        </div>

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
