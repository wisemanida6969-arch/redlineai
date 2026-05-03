"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, Loader2, AlertCircle, AlertTriangle, CheckCircle,
  Building2, Newspaper, DollarSign, Scale, Shield, Download,
  ArrowLeft, Copy, Check, ExternalLink, Sparkles, FileText, ChevronDown, Clock
} from "lucide-react";
import { downloadVendorPDF, downloadVendorDOCX, type VendorReport } from "@/lib/vendorReportExport";

interface VendorScanRecord {
  id: string;
  vendor_name: string;
  overall_score: "high" | "medium" | "low";
  overview: string | null;
  created_at: string;
}

interface VendorScanResult {
  report: VendorReport;
  scannedAt: string;
  vendorUsed: number;
  vendorLimit: number | null;
}

interface Props {
  onUsed?: () => void;
}

type View = "input" | "report";

export default function VendorRiskScan({ onUsed }: Props = {}) {
  const [view, setView] = useState<View>("input");
  const [vendorName, setVendorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<VendorScanResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // History
  const [history, setHistory] = useState<VendorScanRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/vendor-scans/list");
      const data = await res.json();
      setHistory(data.scans ?? []);
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openHistoryItem = async (id: string) => {
    setOpeningId(id);
    setError("");
    try {
      const res = await fetch(`/api/vendor-scans/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setResult({
        report: data.report,
        scannedAt: data.scannedAt,
        vendorUsed: 0,
        vendorLimit: null,
      });
      setView("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open scan");
    } finally {
      setOpeningId(null);
    }
  };

  const handleScan = async () => {
    const name = vendorName.trim();
    if (!name) return setError("Please enter a vendor or company name.");
    setLoading(true);
    setError("");

    try {
      setLoadingStep("Searching news, financials, and legal records…");
      const res = await fetch("/api/vendor-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorName: name }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Scan failed");

      setResult(data);
      setView("report");
      onUsed?.();
      loadHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const r = result.report;
    const text = `VENDOR RISK REPORT — ${r.vendorName}
Overall Risk: ${r.overallScore.toUpperCase()}

EXECUTIVE SUMMARY
${r.overallSummary}

NEWS & REPUTATION (${r.newsRisk.severity.toUpperCase()})
${r.newsRisk.summary}
${r.newsRisk.items.map((i) => `• ${i}`).join("\n")}

FINANCIAL RISK (${r.financialRisk.severity.toUpperCase()})
${r.financialRisk.summary}
${r.financialRisk.items.map((i) => `• ${i}`).join("\n")}

LEGAL RISK (${r.legalRisk.severity.toUpperCase()})
${r.legalRisk.summary}
${r.legalRisk.items.map((i) => `• ${i}`).join("\n")}

RECOMMENDATIONS
${r.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (type: "pdf" | "docx") => {
    if (!result) return;
    setDropOpen(false);
    setDownloading(type);
    setError("");
    try {
      const safeName = result.report.vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
      const dateStr = new Date(result.scannedAt).toISOString().slice(0, 10);
      const filename = `vendor-risk-${safeName}-${dateStr}`;
      if (type === "pdf") {
        await downloadVendorPDF(result.report, result.scannedAt, filename);
      } else {
        await downloadVendorDOCX(result.report, result.scannedAt, filename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  /* ───── INPUT VIEW ───── */
  if (view === "input") {
    return (
      <div>
        <div className="bg-gradient-to-br from-red-900/20 to-[#162035] border border-[#1e3050] rounded-2xl p-5 mb-6 flex items-start gap-3">
          <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Vendor Risk Scan</h3>
            <p className="text-slate-400 text-sm">Type any vendor or supplier name. Claude AI searches the web for news, lawsuits, financial signals, and reputation risks — then delivers a complete due-diligence report.</p>
          </div>
        </div>

        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-6">
          <label className="text-slate-300 text-sm font-medium block mb-2">Vendor / Company Name</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleScan(); }}
              placeholder="e.g., Acme Corp, Stripe, OpenAI, John's Plumbing LLC"
              disabled={loading}
              className="w-full bg-[#0f1a2e] border border-[#1e3050] rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-red-700/50 focus:ring-1 focus:ring-red-900/30 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <Hint icon={Newspaper} label="News" />
            <Hint icon={DollarSign} label="Financials" />
            <Hint icon={Scale} label="Legal" />
            <Hint icon={Shield} label="Reputation" />
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={loading || !vendorName.trim()}
          className="mt-5 w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-base sm:text-lg transition-colors flex items-center justify-center gap-3"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" />{loadingStep || "Scanning…"}</> : <><Sparkles className="w-5 h-5" /> Run Risk Scan</>}
        </button>

        {loading && (
          <div className="mt-4 bg-[#162035] border border-[#1e3050] rounded-xl p-4">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Claude is researching the web…</span><span>~30–60s</span>
            </div>
            <div className="h-1.5 bg-[#1e3050] rounded-full overflow-hidden">
              <div className="h-full bg-red-600 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* ── History ── */}
        <div className="mt-12">
          <h2 className="text-white font-semibold text-lg mb-4">Recent Vendor Scans</h2>
          {historyLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading history…
            </div>
          ) : history.length === 0 ? (
            <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8 text-center text-slate-500 text-sm">
              No vendor scans yet. Run your first scan above!
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <VendorHistoryItem
                  key={item.id}
                  item={item}
                  loading={openingId === item.id}
                  onClick={() => openHistoryItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ───── REPORT VIEW ───── */
  if (view === "report" && result) {
    const r = result.report;
    return (
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <button
            onClick={() => { setView("input"); setVendorName(""); setResult(null); }}
            className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Scan another vendor
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-[#162035] border border-[#1e3050] hover:border-slate-500 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Summary"}
            </button>
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen((v) => !v)}
                disabled={!!downloading}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading === "pdf" ? "PDF…" : downloading === "docx" ? "Word…" : "Download Report"}
                {!downloading && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropOpen ? "rotate-180" : ""}`} />}
              </button>

              {dropOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#162035] border border-[#1e3050] rounded-xl shadow-2xl overflow-hidden z-50">
                  <button
                    onClick={() => handleDownload("pdf")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-[#1e3050] hover:text-white transition-colors"
                  >
                    <div className="w-7 h-7 bg-red-900/40 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Download PDF</div>
                      <div className="text-xs text-slate-500">Styled report · .pdf</div>
                    </div>
                  </button>
                  <div className="h-px bg-[#1e3050]" />
                  <button
                    onClick={() => handleDownload("docx")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-[#1e3050] hover:text-white transition-colors"
                  >
                    <div className="w-7 h-7 bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0">
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
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Header card */}
        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Company</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{r.vendorName}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{r.overview}</p>
            </div>
            <OverallBadge score={r.overallScore} />
          </div>
        </div>

        {/* Executive summary */}
        <SummaryCard summary={r.overallSummary} />

        {/* Risk sections */}
        <div className="space-y-4 mb-6">
          <RiskSection title="News & Reputation Risk" icon={Newspaper} data={r.newsRisk} />
          <RiskSection title="Financial Risk"         icon={DollarSign} data={r.financialRisk} />
          <RiskSection title="Legal Risk"             icon={Scale}      data={r.legalRisk} />
        </div>

        {/* Recommendations */}
        <div className="bg-green-900/15 border border-green-800/40 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-semibold">Recommendations</h3>
          </div>
          <ol className="space-y-2 list-decimal list-inside text-slate-300 text-sm">
            {r.recommendations.map((rec, i) => (
              <li key={i} className="leading-relaxed">{rec}</li>
            ))}
          </ol>
        </div>

        {/* Sources */}
        {r.sources && r.sources.length > 0 && (
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3">Sources</p>
            <ul className="space-y-1.5">
              {r.sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-xs transition-colors break-all"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-slate-500 text-xs text-center mt-6">
          ⚠️ AI-generated due-diligence summary. Verify critical findings before making business decisions.
        </p>
      </div>
    );
  }

  return null;
}

/* ──────────────── Sub-components ──────────────── */

function VendorHistoryItem({
  item, loading, onClick,
}: {
  item: VendorScanRecord;
  loading: boolean;
  onClick: () => void;
}) {
  const sevConfig = {
    high:   { color: "text-red-400",    bg: "bg-red-900/30",    label: "HIGH"   },
    medium: { color: "text-yellow-400", bg: "bg-yellow-900/30", label: "MEDIUM" },
    low:    { color: "text-blue-400",   bg: "bg-blue-900/30",   label: "LOW"    },
  };
  const c = sevConfig[item.overall_score];

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full text-left bg-[#162035] border border-[#1e3050] hover:border-red-700/50 rounded-xl p-4 flex items-center gap-4 flex-wrap transition-colors disabled:opacity-50"
    >
      <div className="w-9 h-9 bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
        {loading ? (
          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
        ) : (
          <Building2 className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{item.vendor_name}</p>
        {item.overview && (
          <p className="text-slate-500 text-xs truncate mt-0.5">{item.overview.slice(0, 90)}…</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${c.bg} ${c.color}`}>
          {c.label}
        </span>
        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 ml-1">
          <Clock className="w-3 h-3" />
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
}

function Hint({ icon: Icon, label }: { icon: typeof Newspaper; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#0f1a2e] border border-[#1e3050] rounded-lg px-3 py-2">
      <Icon className="w-3.5 h-3.5 text-red-400" />
      <span className="text-slate-400 text-xs">{label}</span>
    </div>
  );
}

function OverallBadge({ score }: { score: "high" | "medium" | "low" }) {
  const config = {
    high:   { bg: "bg-red-900/30",    border: "border-red-700/60",    text: "text-red-300",    icon: AlertTriangle, label: "High Risk"   },
    medium: { bg: "bg-yellow-900/30", border: "border-yellow-700/60", text: "text-yellow-300", icon: AlertCircle,   label: "Medium Risk" },
    low:    { bg: "bg-green-900/30",  border: "border-green-700/60",  text: "text-green-300",  icon: CheckCircle,   label: "Low Risk"    },
  };
  const c = config[score];
  const Icon = c.icon;
  return (
    <div className={`${c.bg} ${c.border} border-2 ${c.text} rounded-2xl px-5 py-3 flex items-center gap-2 shrink-0`}>
      <Icon className="w-5 h-5" />
      <div className="text-left">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Overall</p>
        <p className="font-bold">{c.label}</p>
      </div>
    </div>
  );
}

function SummaryCard({ summary }: { summary: string }) {
  return (
    <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-red-400" />
        <span className="text-white font-semibold text-sm">Executive Summary</span>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
    </div>
  );
}

function RiskSection({
  title, icon: Icon, data,
}: {
  title: string;
  icon: typeof Newspaper;
  data: { severity: "high" | "medium" | "low"; summary: string; items: string[] };
}) {
  const config = {
    high:   { bg: "bg-red-900/10",    border: "border-red-800/40",    badge: "bg-red-900/50 text-red-400",       iconColor: "text-red-400"    },
    medium: { bg: "bg-yellow-900/10", border: "border-yellow-800/40", badge: "bg-yellow-900/50 text-yellow-400", iconColor: "text-yellow-400" },
    low:    { bg: "bg-blue-900/10",   border: "border-blue-800/40",   badge: "bg-blue-900/50 text-blue-400",     iconColor: "text-blue-400"   },
  };
  const c = config[data.severity];

  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-5`}>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${c.iconColor}`} />
          <h3 className="text-white font-semibold">{title}</h3>
        </div>
        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${c.badge}`}>{data.severity} risk</span>
      </div>

      <p className="text-slate-300 text-sm leading-relaxed mb-3">{data.summary}</p>

      {data.items && data.items.length > 0 && (
        <div className="bg-[#0f1a2e]/60 rounded-xl p-3">
          <p className="text-slate-500 text-xs font-bold uppercase mb-2">Key findings</p>
          <ul className="space-y-1.5">
            {data.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                <span className={`${c.iconColor} mt-1`}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
