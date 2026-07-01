"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Upload, FileText, AlertCircle, Loader2, CheckCircle,
  FileType, AlertTriangle, Clock, Crown,
  Receipt, Lock, Bot, Library, X
} from "lucide-react";
import StandardContracts from "@/components/StandardContracts";
import QuoteToContract from "@/components/QuoteToContract";
import AIAgent from "@/components/AIAgent";
import UsageCounter from "@/components/UsageCounter";
import AppFooter from "@/components/AppFooter";
import { useT } from "@/lib/i18n/LanguageProvider";
import { type Plan, type FeatureKey, hasAccess, isOverLimit } from "@/lib/planLimits";
import { getCategory, getContractType } from "@/lib/standardContracts";

interface ScanRecord {
  id: string;
  filename: string;
  high_count: number;
  medium_count: number;
  low_count: number;
  summary: string;
  created_at: string;
}

const ACCEPTED_EXT = [".pdf", ".docx", ".hwpx", ".hwp"];

type Feature = FeatureKey;

interface UsageData {
  analysis: number;
  quote: number;
  vendor: number;
  agent: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { t, lang } = useT();
  const [feature, setFeature] = useState<Feature>("standard");
  // Standard form chosen from the library, carried into Review / Draft tabs.
  const [seededStandard, setSeededStandard] = useState<{ categoryId: string; typeId: string } | null>(null);
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");

  // History + plan state
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [plan, setPlan] = useState<Plan>("free");
  const [usage, setUsage] = useState<UsageData>({ analysis: 0, quote: 0, vendor: 0, agent: 0 });
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scans")
      .then((r) => r.json())
      .then((d) => {
        setScans(d.scans ?? []);
        setPlan((d.plan ?? "free") as Plan);
        setUsage(d.usage ?? { analysis: 0, quote: 0, vendor: 0, agent: 0 });
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const validateFile = (f: File) => {
    const valid = ACCEPTED_EXT.some((ext) => f.name.toLowerCase().endsWith(ext));
    if (!valid) { setError(lang === "ko" ? "PDF, DOCX, HWPX 파일만 가능합니다." : "Please upload a PDF, DOCX, or HWPX file."); return false; }
    if (f.size > 20 * 1024 * 1024) { setError(lang === "ko" ? "파일이 너무 큽니다. 최대 20MB." : "File too large. Max 20MB."); return false; }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) { setFile(f); setError(""); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyze = async () => {
    if (mode === "upload" && !file) return setError("Please upload a file first.");
    if (mode === "paste" && !text.trim()) return setError("Please paste your contract text.");
    setLoading(true); setError("");

    try {
      setLoadingStep(t("dashboard.extracting"));
      const formData = new FormData();
      if (mode === "upload" && file) formData.append("file", file);
      else formData.append("text", text);
      formData.append("lang", lang);
      if (seededStandard) {
        formData.append("standardCategory", seededStandard.categoryId);
        formData.append("standardType", seededStandard.typeId);
      }

      setLoadingStep(t("dashboard.analyzing"));
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setError(data.error);
        } else {
          throw new Error(data.error || "Analysis failed");
        }
        return;
      }

      sessionStorage.setItem("redlineai_result", JSON.stringify(data));
      // refresh history count
      setUsage((u) => ({ ...u, analysis: u.analysis + 1 }));
      router.push("/analysis");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false); setLoadingStep("");
    }
  };

  const analysisOver = isOverLimit(plan, "analysis", usage.analysis);
  const analysisLocked = !hasAccess(plan, "analysis");

  const FEATURES: { id: Feature; label: string; icon: typeof FileText; soon: boolean }[] = [
    { id: "standard", label: t("dashboard.tabStandard"), icon: Library,   soon: false },
    { id: "analysis", label: t("dashboard.tabAnalysis"), icon: FileText,  soon: false },
    { id: "quote",    label: t("dashboard.tabQuote"),    icon: Receipt,   soon: false },
    { id: "agent",    label: t("dashboard.tabAgent"),    icon: Bot,       soon: false },
  ];

  // Standard form carried in from the library → banner shown on Review / Draft tabs.
  const stdCat  = seededStandard ? getCategory(seededStandard.categoryId) : undefined;
  const stdType = seededStandard ? getContractType(seededStandard.categoryId, seededStandard.typeId) : undefined;
  const stdLabel = stdCat && stdType
    ? `${lang === "ko" ? stdCat.title.ko : stdCat.title.en} · ${lang === "ko" ? stdType.title.ko : stdType.title.en}`
    : "";

  const renderStandardBanner = (kind: "review" | "draft") =>
    seededStandard && stdType ? (
      <div className="mb-5 flex items-center justify-between gap-3 bg-gradient-to-r from-yellow-900/20 to-[#162035] border border-yellow-700/40 rounded-xl px-4 py-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-yellow-900/40 rounded-lg flex items-center justify-center shrink-0">
            <Library className="w-4 h-4 text-yellow-300" />
          </div>
          <div className="min-w-0">
            <p className="text-yellow-200 text-[11px] font-bold uppercase tracking-wide">
              {kind === "review" ? t("standard.bannerReview") : t("standard.bannerDraft")}
            </p>
            <p className="text-white text-sm font-medium truncate">{stdLabel}</p>
            {kind === "review" && <p className="text-slate-400 text-xs mt-0.5">{t("standard.reviewModeNote")}</p>}
          </div>
        </div>
        <button
          onClick={() => setSeededStandard(null)}
          className="flex items-center gap-1 text-slate-400 hover:text-white text-xs bg-[#0f1a2e] hover:bg-[#1e3050] border border-[#1e3050] rounded-lg px-3 py-1.5 shrink-0 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> {t("standard.clear")}
        </button>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">

        {/* Header + plan badge */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t("dashboard.title")}</h1>
            <p className="text-slate-400 text-sm">
              {t("dashboard.subtitle")} <Link href="/help" className="text-red-400 hover:text-red-300">{t("dashboard.viewGuide")}</Link>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border ${plan === "free" ? "bg-slate-800/50 border-slate-700 text-slate-300" : plan === "pro" ? "bg-red-900/20 border-red-700/50 text-red-300" : "bg-yellow-900/20 border-yellow-700/50 text-yellow-400"}`}>
              {plan !== "free" && <Crown className="w-3.5 h-3.5" />}
              <span className="capitalize">{plan} Plan</span>
            </div>
            {plan === "free" ? (
              <a href="/#pricing" className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1">
                <Crown className="w-3 h-3" /> {t("common.upgrade")}
              </a>
            ) : (
              <ManageSubscriptionButton label={t("dashboard.manageSub")} />
            )}
          </div>
        </div>

        {/* ── Feature Tabs ── */}
        <div className="overflow-x-auto -mx-6 px-6 mb-8">
          <div className="flex gap-2 min-w-max border-b border-[#1e3050]">
            {FEATURES.map(({ id, label, icon: Icon, soon }) => {
              const active = feature === id;
              const locked = !hasAccess(plan, id);
              return (
                <button
                  key={id}
                  onClick={() => setFeature(id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "text-white border-b-2 border-red-500 -mb-px"
                      : "text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {locked && !soon && (
                    <Lock className="w-3 h-3 text-slate-500" />
                  )}
                  {soon && (
                    <span className="ml-1 text-[10px] font-bold uppercase tracking-wider bg-yellow-900/30 text-yellow-400 border border-yellow-700/50 px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>


        {/* ── Tab content ── */}
        {feature === "standard" && (
          <StandardContracts
            plan={plan}
            onDraft={(categoryId, typeId) => { setSeededStandard({ categoryId, typeId }); setFeature("quote"); }}
            onReview={(categoryId, typeId) => { setSeededStandard({ categoryId, typeId }); setFeature("analysis"); }}
          />
        )}

        {feature === "analysis" && (
          <>
            <UsageCounter plan={plan} feature="analysis" used={usage.analysis} />
            {renderStandardBanner("review")}

            {/* Mode tabs */}
            <div className="flex gap-1 bg-[#162035] p-1 rounded-xl border border-[#1e3050] mb-6 w-fit">
              {(["upload", "paste"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}>
                  {m === "upload" ? <><Upload className="w-4 h-4" /> {t("dashboard.uploadFile")}</> : <><FileText className="w-4 h-4" /> {t("dashboard.pasteText")}</>}
                </button>
              ))}
            </div>

            {/* Upload or Paste */}
            {mode === "upload" ? (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-input")?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors ${dragging ? "border-red-500 bg-red-900/10" : file ? "border-green-600 bg-green-900/10" : "border-[#1e3050] hover:border-red-700/50 bg-[#162035]"}`}
                >
                  <input id="file-input" type="file" accept={ACCEPTED_EXT.join(",")} onChange={(e) => { const f = e.target.files?.[0]; if (f && validateFile(f)) { setFile(f); setError(""); } }} className="hidden" />
                  {file ? (
                    <>
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="text-green-400 font-medium">{file.name}</p>
                      <p className="text-slate-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-white font-medium mb-1">{t("dashboard.dropFile")}</p>
                      <p className="text-slate-400 text-sm mb-4">{t("dashboard.clickToBrowse")}</p>
                      <div className="flex items-center justify-center gap-3">
                        <FormatBadge label="PDF" desc="Text & scanned" />
                        <FormatBadge label="DOCX" desc="Word documents" />
                        <FormatBadge label="HWPX" desc={lang === "ko" ? "신형 한글 문서" : "Modern 한글 docs"} />
                      </div>
                      <p className="text-slate-500 text-xs mt-3">{t("dashboard.maxSize")}</p>
                    </>
                  )}
                </div>
                {file?.name.endsWith(".pdf") && (
                  <div className="mt-3 flex items-start gap-2 text-slate-400 text-xs bg-[#162035] border border-[#1e3050] rounded-xl px-4 py-3">
                    <FileType className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
                    <span><span className="text-blue-400 font-medium">{t("dashboard.scannedPdf")}</span> {t("dashboard.scannedPdfDesc")}</span>
                  </div>
                )}
              </>
            ) : (
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder={t("dashboard.pasteContract")}
                className="w-full h-56 bg-[#162035] border border-[#1e3050] rounded-2xl p-4 text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-red-700/50" />
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button onClick={handleAnalyze} disabled={loading || analysisOver || analysisLocked}
              className="mt-5 w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-base sm:text-lg transition-colors flex items-center justify-center gap-3">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />{loadingStep}</> : t("dashboard.analyze")}
            </button>

            {loading && (
              <div className="mt-4 bg-[#162035] border border-[#1e3050] rounded-xl p-4">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>{t("dashboard.aiReviewing")}</span><span>{t("dashboard.estimated")}</span>
                </div>
                <div className="h-1.5 bg-[#1e3050] rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full animate-pulse w-2/3" />
                </div>
              </div>
            )}

            {/* ── Scan History ── */}
            <div className="mt-12">
              <h2 className="text-white font-semibold text-lg mb-4">{t("dashboard.recentScans")}</h2>
              {historyLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("dashboard.loadingHistory")}
                </div>
              ) : scans.length === 0 ? (
                <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8 text-center text-slate-500 text-sm">
                  {t("dashboard.noScans")}
                </div>
              ) : (
                <div className="space-y-3">
                  {scans.map((scan) => (
                    <ScanHistoryItem key={scan.id} scan={scan} router={router} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {feature === "quote" && (
          <>
            <UsageCounter plan={plan} feature="quote" used={usage.quote} />
            {renderStandardBanner("draft")}
            {hasAccess(plan, "quote") && (
              <QuoteToContract
                standard={seededStandard}
                onUsed={() => setUsage((u) => ({ ...u, quote: u.quote + 1 }))}
              />
            )}
          </>
        )}

        {feature === "agent" && (
          <>
            <UsageCounter plan={plan} feature="agent" used={usage.agent} />
            {hasAccess(plan, "agent") && (
              <AIAgent
                onUsed={() => setUsage((u) => ({ ...u, agent: u.agent + 1 }))}
              />
            )}
          </>
        )}
      </div>
      <AppFooter />
    </div>
  );
}


function ManageSubscriptionButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/paddle/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || "Could not open portal");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to open subscription portal");
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="bg-[#162035] hover:bg-[#1e3050] border border-[#1e3050] text-slate-300 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
      {label}
    </button>
  );
}

function ScanHistoryItem({ scan, router }: { scan: ScanRecord; router: ReturnType<typeof useRouter> }) {
  const [opening, setOpening] = useState(false);

  const handleOpen = async () => {
    setOpening(true);
    try {
      const res = await fetch(`/api/scans/${scan.id}`);
      if (!res.ok) throw new Error("Failed to load scan");
      const data = await res.json();
      sessionStorage.setItem("redlineai_result", JSON.stringify(data));
      router.push("/analysis");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not open scan");
      setOpening(false);
    }
  };

  return (
    <button
      onClick={handleOpen}
      disabled={opening}
      className="w-full text-left bg-[#162035] border border-[#1e3050] hover:border-red-700/50 rounded-xl p-4 flex items-center gap-4 flex-wrap transition-colors disabled:opacity-50"
    >
      <div className="w-9 h-9 bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
        {opening ? (
          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{scan.filename}</p>
        <p className="text-slate-500 text-xs truncate mt-0.5">{scan.summary?.slice(0, 90)}…</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {scan.high_count > 0 && (
          <span className="flex items-center gap-1 text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />{scan.high_count}
          </span>
        )}
        {scan.medium_count > 0 && (
          <span className="flex items-center gap-1 text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />{scan.medium_count}
          </span>
        )}
        {scan.low_count > 0 && (
          <span className="flex items-center gap-1 text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />{scan.low_count}
          </span>
        )}
        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 ml-1">
          <Clock className="w-3 h-3" />
          {new Date(scan.created_at).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
}

function FormatBadge({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#1e3050] rounded-lg px-3 py-1.5">
      <span className="text-red-400 text-xs font-bold">{label}</span>
      <span className="text-slate-500 text-xs">{desc}</span>
    </div>
  );
}
