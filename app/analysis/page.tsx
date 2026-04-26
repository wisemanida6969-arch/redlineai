"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { AlertTriangle, AlertCircle, CheckCircle, Copy, Check, Download, ArrowLeft, Shield, FileText, Loader2, ChevronDown } from "lucide-react";
import { downloadPDF, downloadDOCX, type AnalysisResult } from "@/lib/exportReport";

export default function AnalysisPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "high" | "medium" | "low">("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [exportError, setExportError] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("redlineai_result");
    if (!raw) { router.push("/dashboard"); return; }
    try { setResult(JSON.parse(raw)); } catch { router.push("/dashboard"); }
  }, [router]);

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
      setExportError(`Download failed: ${err instanceof Error ? err.message : String(err)}`);
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
              <ArrowLeft className="w-4 h-4" /> Scan another contract
            </button>
            {/* Mobile: text-2xl, desktop: text-3xl */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Risk Report</h1>
            <p className="text-slate-400 text-sm">
              {totalIssues} issue{totalIssues !== 1 ? "s" : ""} found ·{" "}
              {new Date(result.scannedAt).toLocaleString()}
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
                ? "Generating PDF…"
                : exporting === "docx"
                ? "Generating DOCX…"
                : (
                  <>
                    <span className="hidden sm:inline">Download Report</span>
                    <span className="sm:hidden">Export</span>
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
                    <div className="font-medium">Download PDF</div>
                    <div className="text-xs text-slate-500">Styled report · .pdf</div>
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
                    <div className="font-medium">Download Word</div>
                    <div className="text-xs text-slate-500">Editable document · .docx</div>
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

        {/* Score cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <ScoreCard count={result.high.length}   level="high" />
          <ScoreCard count={result.medium.length} level="medium" />
          <ScoreCard count={result.low.length}    level="low" />
        </div>

        {/* Summary */}
        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-white font-semibold text-sm">AI Summary</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
        </div>

        {/* Filter tabs — scrollable on mobile */}
        <div className="overflow-x-auto mb-6">
          <div className="flex gap-1 bg-[#162035] p-1 rounded-xl border border-[#1e3050] w-fit min-w-max">
            {(["all", "high", "medium", "low"] as const).map((tab) => {
              const count = tab === "all" ? totalIssues : result[tab].length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {tab} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clauses */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No issues in this category</div>
          ) : (
            filtered.map((clause) => (
              <ClauseCard
                key={clause.id}
                clause={clause}
                copied={copied === clause.id}
                onCopy={() => copyFix(clause.id, clause.fix)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ count, level }: { count: number; level: "high" | "medium" | "low" }) {
  const config = {
    high:   { label: "High Risk",   bg: "bg-red-900/20",    border: "border-red-800/50",    text: "text-red-400",    icon: AlertTriangle },
    medium: { label: "Medium Risk", bg: "bg-yellow-900/20", border: "border-yellow-800/50", text: "text-yellow-400", icon: AlertCircle  },
    low:    { label: "Low Risk",    bg: "bg-blue-900/20",   border: "border-blue-800/50",   text: "text-blue-400",   icon: CheckCircle  },
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

function ClauseCard({ clause, copied, onCopy }: {
  clause: { id: string; severity: "high"|"medium"|"low"; title: string; original: string; problem: string; fix: string };
  copied: boolean;
  onCopy: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const config = {
    high:   { bg: "bg-red-900/10",    border: "border-red-800/40",    badge: "bg-red-900/50 text-red-400",       icon: AlertTriangle, iconColor: "text-red-400"    },
    medium: { bg: "bg-yellow-900/10", border: "border-yellow-800/40", badge: "bg-yellow-900/50 text-yellow-400", icon: AlertCircle,   iconColor: "text-yellow-400" },
    low:    { bg: "bg-blue-900/10",   border: "border-blue-800/40",   badge: "bg-blue-900/50 text-blue-400",     icon: CheckCircle,   iconColor: "text-blue-400"   },
  };
  const c = config[clause.severity];
  const Icon = c.icon;

  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl overflow-hidden`}>
      <button className="w-full flex items-center gap-3 p-5 text-left" onClick={() => setExpanded(!expanded)}>
        <Icon className={`w-4 h-4 ${c.iconColor} shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${c.badge}`}>{clause.severity}</span>
            <span className="text-white font-medium text-sm">{clause.title}</span>
          </div>
        </div>
        <span className="text-slate-500 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {clause.original && (
            <div className="bg-[#0f1a2e]/60 rounded-xl p-3">
              <p className="text-slate-500 text-xs font-semibold uppercase mb-1">Original clause</p>
              <p className="text-slate-300 text-sm italic">&ldquo;{clause.original}&rdquo;</p>
            </div>
          )}
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase mb-1">Why it&apos;s risky</p>
            <p className="text-slate-300 text-sm">{clause.problem}</p>
          </div>
          <div className="bg-green-900/15 border border-green-800/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-green-400 text-xs font-semibold uppercase">Suggested fix</p>
              <button
                onClick={onCopy}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {/* Icon only on mobile, icon + text on desktop */}
                <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            <p className="text-green-300 text-sm">{clause.fix}</p>
          </div>
        </div>
      )}
    </div>
  );
}
