"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { AlertTriangle, Info, CheckCircle, Copy, Check, Download, ArrowLeft, Shield, FileText, Loader2, ChevronDown, MessageCircle, Package } from "lucide-react";
import { downloadPDF, downloadDOCX, type AnalysisResult } from "@/lib/exportReport";
import AppFooter from "@/components/AppFooter";
import PrecedentSearch from "@/components/PrecedentSearch";
import PaddleCheckout from "@/components/PaddleCheckout";
import { PADDLE_PACKAGE_PRICE_ID, PADDLE_PRO_OVERAGE_PRICE_ID } from "@/lib/paddle";
import { PACKAGE_PRICE_KRW, PRO_MONTHLY_QUOTA, PRO_OVERAGE_PRICE_KRW } from "@/lib/monetization";
import { Scale } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

interface PackageAccess {
  unlocked: boolean;
  via: "purchase" | "pro" | "admin" | null;
  proRemaining?: number;
  proQuotaExceeded?: boolean;
}

function buildClientMessage(clause: { title: string; fix: string; fixSource?: string }, lang: "en" | "ko"): string {
  const quoteLabel = clause.fixSource ? `${clause.fixSource}` : (lang === "ko" ? "표준계약서 원문" : "Standard contract text");
  const sourceLine = clause.fixSource
    ? (lang === "ko" ? `\n\n출처: 문화체육관광부 ${clause.fixSource}` : `\n\nSource: Korea MCST — ${clause.fixSource}`)
    : "";
  if (lang === "ko") {
    return `안녕하세요! 계약서를 살펴보다가 문체부 표준계약서와 다른 부분이 있어 공유드려요 😊\n\n"${clause.title}" 조항이 표준계약서 원문과 다음과 같이 다릅니다:\n\n${quoteLabel}: "${clause.fix}"${sourceLine}\n\n참고차 말씀드려요. 확인 부탁드립니다 🙏`;
  }
  return `Hi! While going through the contract I noticed this clause differs from the government standard form, wanted to share for reference 😊\n\nThe "${clause.title}" clause differs from the standard as follows:\n\n${quoteLabel}: "${clause.fix}"${sourceLine}\n\nJust sharing for reference. Let me know what you think 🙏`;
}

export default function AnalysisPage() {
  const { t, lang } = useT();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "high" | "medium" | "low">("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [exportError, setExportError] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const [pkg, setPkg] = useState<PackageAccess | null>(null);
  const [pkgBusy, setPkgBusy] = useState(false);
  const [pkgError, setPkgError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("redlineai_result");
    if (!raw) { router.push("/dashboard"); return; }
    try { setResult(JSON.parse(raw)); } catch { router.push("/dashboard"); }
  }, [router]);

  const refreshPkg = useCallback(async (scanId: string) => {
    try {
      const r = await fetch(`/api/report/${scanId}?check=1`);
      if (r.ok) setPkg(await r.json());
    } catch { /* leave pkg as-is */ }
  }, []);

  // Check package unlock status once the result (with its scan id) is loaded.
  useEffect(() => {
    if (result?.scanId) refreshPkg(result.scanId);
  }, [result?.scanId, refreshPkg]);

  // Returning from a completed package checkout (?purchased=1): the webhook can
  // lag a few seconds behind the redirect, so poll the unlock status briefly.
  useEffect(() => {
    if (!result?.scanId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchased") !== "1") return;
    (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", "purchase", {
      transaction_id: `${Date.now()}`,
      currency: "KRW",
      items: [{ item_id: "package" }],
    });
    router.replace("/analysis");
    const scanId = result.scanId;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      await refreshPkg(scanId);
      if (tries >= 6) clearInterval(timer);
    }, 2500);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.scanId]);

  const usePro = async () => {
    if (!result?.scanId) return;
    setPkgBusy(true); setPkgError("");
    try {
      const r = await fetch(`/api/report/${result.scanId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "use_pro" }),
      });
      if (!r.ok) {
        setPkgError(lang === "ko" ? "잠금 해제에 실패했습니다. 잠시 후 다시 시도해 주세요." : "Unlock failed. Please try again.");
        return;
      }
      await refreshPkg(result.scanId);
    } finally {
      setPkgBusy(false);
    }
  };

  const downloadPackageReport = async () => {
    if (!result?.scanId) return;
    setPkgBusy(true); setPkgError("");
    try {
      const r = await fetch(`/api/report/${result.scanId}`);
      if (!r.ok) {
        setPkgError(lang === "ko" ? "리포트 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." : "Report generation failed. Please try again shortly.");
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redlineai-package-report-${new Date(result.scannedAt).toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setPkgError(lang === "ko" ? "리포트 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." : "Report generation failed. Please try again shortly.");
    } finally {
      setPkgBusy(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const copyFix = (id: string, fix: string) => {
    navigator.clipboard.writeText(fix);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyClientMessage = (id: string, clause: { title: string; fix: string; fixSource?: string }) => {
    navigator.clipboard.writeText(buildClientMessage(clause, lang));
    setCopiedMsg(id);
    setTimeout(() => setCopiedMsg(null), 2000);
  };

  const handleExport = async (type: "pdf" | "docx") => {
    if (!result) return;
    setDropOpen(false);
    setExportError("");
    setExporting(type);
    try {
      const filename = `redlineai-report-${new Date(result.scannedAt).toISOString().slice(0, 10)}`;
      if (type === "pdf") {
        await downloadPDF(result, filename);
      } else {
        await downloadDOCX(result, filename);
      }
    } catch (err) {
      console.error("Export error:", err);
      setExportError(`${t("analysis.downloadFailed")}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(null);
    }
  };

  if (!result) return null;

  const allClauses = [
    ...result.high.map((c) => ({ ...c, severity: "high" as const })),
    ...result.medium.map((c) => ({ ...c, severity: "medium" as const })),
    ...result.low.map((c) => ({ ...c, severity: "low" as const })),
  ];
  const filtered = activeTab === "all" ? allClauses : allClauses.filter((c) => c.severity === activeTab);
  const totalIssues = allClauses.length;

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t("analysis.scanAnother")}
            </button>
            {/* Mobile: text-2xl, desktop: text-3xl */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t("analysis.riskReport")}</h1>
            <p className="text-slate-400 text-sm">
              {lang === "ko"
                ? `${totalIssues}개 항목 확인 · ${new Date(result.scannedAt).toLocaleString()}`
                : `${totalIssues} difference${totalIssues !== 1 ? "s" : ""} found · ${new Date(result.scannedAt).toLocaleString()}`}
            </p>
          </div>

          {/* Download dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropOpen((v) => !v)}
              disabled={!!exporting}
              className="flex items-center gap-2 bg-[#162035] border border-[#1e3050] hover:border-slate-500 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {/* Mobile: show short label; desktop: show full label */}
              {exporting === "pdf"
                ? t("analysis.generatingPdf")
                : exporting === "docx"
                ? t("analysis.generatingDocx")
                : (
                  <>
                    <span className="hidden sm:inline">{t("analysis.downloadReport")}</span>
                    <span className="sm:hidden">{t("analysis.export")}</span>
                  </>
                )}
              {!exporting && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropOpen ? "rotate-180" : ""}`} />}
            </button>

            {dropOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#162035] border border-[#1e3050] rounded-xl shadow-2xl overflow-hidden z-50">
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-[#1e3050] hover:text-white transition-colors"
                >
                  <div className="w-7 h-7 bg-red-900/40 rounded-lg flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{t("analysis.downloadPdf")}</div>
                    <div className="text-xs text-slate-500">{t("analysis.styledReport")}</div>
                  </div>
                </button>
                <div className="h-px bg-[#1e3050]" />
                <button
                  onClick={() => handleExport("docx")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-[#1e3050] hover:text-white transition-colors"
                >
                  <div className="w-7 h-7 bg-blue-900/40 rounded-lg flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{t("analysis.downloadWord")}</div>
                    <div className="text-xs text-slate-500">{t("analysis.editableDoc")}</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Export error */}
        {exportError && (
          <div className="mb-6 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {exportError}
          </div>
        )}

        {/* Standard-comparison notice */}
        <div className="mb-6 flex items-center gap-2 text-slate-400 text-sm bg-[#162035] border border-[#1e3050] rounded-xl px-4 py-3">
          <Info className="w-4 h-4 shrink-0 text-slate-500" />
          {lang === "ko" ? "아래는 정부 표준계약서와의 비교 정보입니다." : "Below is a comparison against the government standard contract."}
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <ScoreCard count={result.high.length}   level="high" t={t} />
          <ScoreCard count={result.medium.length} level="medium" t={t} />
          <ScoreCard count={result.low.length}    level="low" t={t} />
        </div>

        {/* Summary */}
        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-white font-semibold text-sm">{t("analysis.aiSummary")}</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
        </div>

        {/* ── 사인 전 패키지 ── */}
        {result.scanId && (
          <div className={`mb-8 rounded-2xl p-5 border ${pkg?.unlocked ? "bg-green-900/10 border-green-800/40" : "bg-gradient-to-br from-red-900/20 to-[#162035] border-red-700/40"}`}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Package className={`w-4 h-4 ${pkg?.unlocked ? "text-green-400" : "text-red-400"}`} />
              <span className="text-white font-bold text-sm">{lang === "ko" ? "사인 전 패키지" : "Pre-sign Package"}</span>
              {!pkg?.unlocked && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-red-300 bg-red-900/40 border border-red-700/40 rounded px-1.5 py-0.5">
                  {lang === "ko" ? "추천" : "Recommended"}
                </span>
              )}
              {pkg?.unlocked && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-green-300 bg-green-900/30 border border-green-700/40 rounded px-1.5 py-0.5">
                  {lang === "ko" ? "이 계약서 건 이용 가능" : "Unlocked for this contract"}
                </span>
              )}
            </div>

            {pkg?.unlocked ? (
              <div>
                <p className="text-slate-300 text-sm mb-3">
                  {lang === "ko"
                    ? "이 계약서 건의 전체 PDF 리포트를 내려받을 수 있습니다. 조항별 표준계약서 원문, 관련 판례, 리스크 검색 결과가 포함됩니다."
                    : "Download the full PDF report for this contract — standard-contract article text per clause, related precedents, and the vendor-risk result."}
                </p>
                <button
                  onClick={downloadPackageReport}
                  disabled={pkgBusy}
                  className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {pkgBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {lang === "ko" ? "PDF 리포트 다운로드" : "Download PDF report"}
                </button>
              </div>
            ) : (
              <div>
                <ul className="text-slate-300 text-sm space-y-1 mb-3">
                  {(lang === "ko"
                    ? ["비교 결과 전체 PDF 리포트", "상이 조항별 문체부 표준계약서 원문 첨부", "관련 판례 정보 포함", "리스크 검색 결과 포함", "판례·리스크 기능 24시간 잠금 해제"]
                    : ["Full comparison PDF report", "Verbatim MCST standard article per differing clause", "Related court precedents", "Vendor-risk result included", "Precedent & risk features unlocked for 24h"]
                  ).map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                {pkg?.proRemaining !== undefined && !pkg?.proQuotaExceeded ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={usePro}
                      disabled={pkgBusy}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {pkgBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                      {lang === "ko" ? "프로 플랜으로 잠금 해제" : "Unlock with Pro plan"}
                    </button>
                    <span className="text-slate-400 text-xs">
                      {lang === "ko" ? `이번 달 잔여 ${pkg.proRemaining} / ${PRO_MONTHLY_QUOTA}건` : `${pkg.proRemaining} / ${PRO_MONTHLY_QUOTA} left this month`}
                    </span>
                  </div>
                ) : pkg?.proQuotaExceeded ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <PaddleCheckout
                      priceId={PADDLE_PRO_OVERAGE_PRICE_ID}
                      scanId={result.scanId}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {lang === "ko" ? `이 계약서 건 잠금 해제 — ₩${PRO_OVERAGE_PRICE_KRW.toLocaleString()}` : `Unlock this contract — ₩${PRO_OVERAGE_PRICE_KRW.toLocaleString()}`}
                    </PaddleCheckout>
                    <span className="text-slate-400 text-xs">
                      {lang === "ko" ? `이번 달 ${PRO_MONTHLY_QUOTA}건을 모두 사용했습니다` : `All ${PRO_MONTHLY_QUOTA} monthly unlocks used`}
                    </span>
                  </div>
                ) : (
                  <PaddleCheckout
                    priceId={PADDLE_PACKAGE_PRICE_ID}
                    scanId={result.scanId}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {lang === "ko" ? `이 계약서 1건 — ₩${PACKAGE_PRICE_KRW.toLocaleString()}` : `This contract — ₩${PACKAGE_PRICE_KRW.toLocaleString()}`}
                  </PaddleCheckout>
                )}
              </div>
            )}

            {pkgError && (
              <p className="mt-3 text-red-400 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {pkgError}
              </p>
            )}
          </div>
        )}

        {/* Filter tabs — scrollable on mobile */}
        <div className="overflow-x-auto mb-6">
          <div className="flex gap-1 bg-[#162035] p-1 rounded-xl border border-[#1e3050] w-fit min-w-max">
            {(["all", "high", "medium", "low"] as const).map((tab) => {
              const count = tab === "all" ? totalIssues : result[tab].length;
              const label = tab === "all" ? t("analysis.tabAll") : tab === "high" ? t("analysis.tabHigh") : tab === "medium" ? t("analysis.tabMedium") : t("analysis.tabLow");
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clauses */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">{t("analysis.noIssues")}</div>
          ) : (
            filtered.map((clause) => (
              <ClauseCard
                key={clause.id}
                clause={clause}
                copied={copied === clause.id}
                onCopy={() => copyFix(clause.id, clause.fix)}
                copiedMsg={copiedMsg === clause.id}
                onCopyMessage={() => copyClientMessage(clause.id, clause)}
                t={t}
              />
            ))
          )}
        </div>

        {/* Related court precedents */}
        {result.precedentQueries && result.precedentQueries.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-5 h-5 text-red-400" />
              <h2 className="text-white font-bold text-lg">{t("analysis.relatedPrecedents")}</h2>
            </div>
            <p className="text-slate-400 text-sm mb-4">{t("analysis.relatedPrecedentsIntro")}</p>
            <PrecedentSearch queries={result.precedentQueries} />
            <p className="text-slate-500 text-[11px] leading-relaxed mt-4">{t("standard.precedentsDisclaimer")}</p>
          </div>
        )}

        <div className="mt-12 bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
          <p className="text-slate-500 text-xs leading-relaxed">
            레드라인AI 안내: 본 서비스는 프리랜서 권익 보호를 위해 계약서 내 조항을 문화체육관광부 표준계약서와 비교해 다른 점을 보여주는 가이드 툴입니다. 변호사의 법률 자문이나 대리를 대체하지 않으며, 최종 계약 체결에 대한 법적 책임은 사용자 본인에게 있습니다.
          </p>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

function ScoreCard({ count, level, t }: { count: number; level: "high" | "medium" | "low"; t: (k: string) => string }) {
  const config = {
    high:   { label: t("analysis.highRisk"),   bg: "bg-slate-700/20", border: "border-slate-600/50", text: "text-slate-300", icon: Info },
    medium: { label: t("analysis.mediumRisk"), bg: "bg-slate-800/40", border: "border-slate-700/50", text: "text-slate-400", icon: Info },
    low:    { label: t("analysis.lowRisk"),    bg: "bg-blue-900/20",  border: "border-blue-800/50",  text: "text-blue-400",  icon: CheckCircle },
  };
  const c = config[level];
  const Icon = c.icon;
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4 text-center`}>
      <Icon className={`w-5 h-5 ${c.text} mx-auto mb-2`} />
      {/* Mobile: text-xl, desktop: text-2xl */}
      <div className={`text-xl sm:text-2xl font-bold ${c.text}`}>{count}</div>
      <div className="text-slate-400 text-xs mt-0.5">{c.label}</div>
    </div>
  );
}

function ClauseCard({ clause, copied, onCopy, copiedMsg, onCopyMessage, t }: {
  clause: { id: string; severity: "high"|"medium"|"low"; title: string; original: string; problem: string; fix: string; fixSource?: string };
  copied: boolean;
  onCopy: () => void;
  copiedMsg: boolean;
  onCopyMessage: () => void;
  t: (k: string) => string;
}) {
  const [expanded, setExpanded] = useState(true);
  const config = {
    high:   { bg: "bg-slate-700/10", border: "border-slate-600/40", badge: "bg-slate-700/50 text-slate-300", iconColor: "text-slate-300", icon: Info, label: t("analysis.highRisk")   },
    medium: { bg: "bg-slate-800/20", border: "border-slate-700/40", badge: "bg-slate-800/60 text-slate-400", iconColor: "text-slate-400", icon: Info, label: t("analysis.mediumRisk") },
    low:    { bg: "bg-blue-900/10",  border: "border-blue-800/40",  badge: "bg-blue-900/50 text-blue-400",   iconColor: "text-blue-400",  icon: CheckCircle, label: t("analysis.lowRisk") },
  };
  const c = config[clause.severity];
  const Icon = c.icon;

  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl overflow-hidden`}>
      <button className="w-full flex items-center gap-3 p-5 text-left" onClick={() => setExpanded(!expanded)}>
        <Icon className={`w-4 h-4 ${c.iconColor} shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${c.badge}`}>{c.label}</span>
            <span className="text-white font-medium text-sm">{clause.title}</span>
          </div>
        </div>
        <span className="text-slate-500 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {clause.original && (
            <div className="bg-[#0f1a2e]/60 rounded-xl p-3">
              <p className="text-slate-500 text-xs font-semibold uppercase mb-1">{t("analysis.originalClause")}</p>
              <p className="text-slate-300 text-sm italic">&ldquo;{clause.original}&rdquo;</p>
            </div>
          )}
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase mb-1">{t("analysis.whyRisky")}</p>
            <p className="text-slate-300 text-sm">{clause.problem}</p>
          </div>
          {clause.fix && clause.fix.trim() && (
            <>
              <div className="bg-green-900/15 border border-green-800/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-green-400 text-xs font-semibold uppercase">{t("analysis.suggestedFix")}</p>
                  <button
                    onClick={onCopy}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {/* Icon only on mobile, icon + text on desktop */}
                    <span className="hidden sm:inline">{copied ? t("analysis.copied") : t("analysis.copy")}</span>
                  </button>
                </div>
                <p className="text-green-300 text-sm">
                  {clause.fixSource && <span className="font-semibold">{clause.fixSource}: </span>}
                  {clause.fix}
                </p>
                {clause.fixSource && (
                  <p className="text-green-500/70 text-xs italic mt-2">
                    {t("analysis.standardSourcePrefix")} {clause.fixSource}
                  </p>
                )}
              </div>
              <button
                onClick={onCopyMessage}
                className="w-full flex items-center justify-center gap-2 bg-[#FEE500]/10 border border-[#FEE500]/30 hover:bg-[#FEE500]/20 text-[#FEE500] rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                {copiedMsg ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                {copiedMsg ? t("analysis.copiedKakaoMsg") : t("analysis.copyKakaoMsg")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
