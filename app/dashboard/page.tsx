"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Upload, FileText, AlertCircle, Loader2, CheckCircle,
  FileType, AlertTriangle, Clock, Crown
} from "lucide-react";

interface ScanRecord {
  id: string;
  filename: string;
  high_count: number;
  medium_count: number;
  low_count: number;
  summary: string;
  created_at: string;
}

const ACCEPTED_EXT = [".pdf", ".docx"];
const FREE_LIMIT = 3;

export default function Dashboard() {
  const router = useRouter();
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");

  // History + plan state
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [plan, setPlan] = useState("free");
  const [scansUsed, setScansUsed] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scans")
      .then((r) => r.json())
      .then((d) => {
        setScans(d.scans ?? []);
        setPlan(d.plan ?? "free");
        setScansUsed(d.scansUsed ?? 0);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const validateFile = (f: File) => {
    const valid = f.name.endsWith(".pdf") || f.name.endsWith(".docx");
    if (!valid) { setError("Please upload a PDF or DOCX file."); return false; }
    if (f.size > 20 * 1024 * 1024) { setError("File too large. Max 20MB."); return false; }
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
      setLoadingStep("Extracting text…");
      const formData = new FormData();
      if (mode === "upload" && file) formData.append("file", file);
      else formData.append("text", text);

      setLoadingStep("Analyzing clauses with Claude AI…");
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
      setScansUsed((n) => n + 1);
      router.push("/analysis");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false); setLoadingStep("");
    }
  };

  const scansLeft = plan === "free" ? Math.max(0, FREE_LIMIT - scansUsed) : null;

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">

        {/* Header + plan badge */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-slate-400 text-sm">Upload a contract to get an instant AI risk report.</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border ${plan === "free" ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-yellow-900/20 border-yellow-700/50 text-yellow-400"}`}>
            {plan !== "free" && <Crown className="w-3.5 h-3.5" />}
            {plan === "free" ? (
              <span>{scansLeft} free scan{scansLeft !== 1 ? "s" : ""} left this month</span>
            ) : (
              <span className="capitalize">{plan} Plan — unlimited scans</span>
            )}
          </div>
        </div>

        {/* Upgrade banner for free users at limit */}
        {plan === "free" && scansLeft === 0 && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-700/50 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-yellow-300 font-semibold text-sm">You&apos;ve used all 3 free scans this month</p>
                <p className="text-yellow-600 text-xs">Upgrade to Pro for unlimited scans — $29/month</p>
              </div>
            </div>
            <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm px-4 py-2 rounded-xl transition-colors">
              Upgrade to Pro →
            </button>
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-1 bg-[#162035] p-1 rounded-xl border border-[#1e3050] mb-6 w-fit">
          {(["upload", "paste"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}>
              {m === "upload" ? <><Upload className="w-4 h-4" /> Upload File</> : <><FileText className="w-4 h-4" /> Paste Text</>}
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
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${dragging ? "border-red-500 bg-red-900/10" : file ? "border-green-600 bg-green-900/10" : "border-[#1e3050] hover:border-red-700/50 bg-[#162035]"}`}
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
                  <p className="text-white font-medium mb-1">Drop your file here</p>
                  <p className="text-slate-400 text-sm mb-4">or click to browse</p>
                  <div className="flex items-center justify-center gap-3">
                    <FormatBadge label="PDF" desc="Text & scanned" />
                    <FormatBadge label="DOCX" desc="Word documents" />
                  </div>
                  <p className="text-slate-500 text-xs mt-3">Max 20MB</p>
                </>
              )}
            </div>
            {file?.name.endsWith(".pdf") && (
              <div className="mt-3 flex items-start gap-2 text-slate-400 text-xs bg-[#162035] border border-[#1e3050] rounded-xl px-4 py-3">
                <FileType className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
                <span><span className="text-blue-400 font-medium">Scanned PDF?</span> RedlineAI uses Claude Vision to read it automatically.</span>
              </div>
            )}
          </>
        ) : (
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Paste your contract text here…"
            className="w-full h-56 bg-[#162035] border border-[#1e3050] rounded-2xl p-4 text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-red-700/50" />
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button onClick={handleAnalyze} disabled={loading || (plan === "free" && scansLeft === 0)}
          className="mt-5 w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-3">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" />{loadingStep}</> : "Analyze Contract →"}
        </button>

        {loading && (
          <div className="mt-4 bg-[#162035] border border-[#1e3050] rounded-xl p-4">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Claude AI is reviewing every clause…</span><span>~15–30s</span>
            </div>
            <div className="h-1.5 bg-[#1e3050] rounded-full overflow-hidden">
              <div className="h-full bg-red-600 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        )}

        {/* ── Scan History ── */}
        <div className="mt-12">
          <h2 className="text-white font-semibold text-lg mb-4">Recent Scans</h2>
          {historyLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading history…
            </div>
          ) : scans.length === 0 ? (
            <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8 text-center text-slate-500 text-sm">
              No scans yet. Upload your first contract above!
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan) => (
                <ScanHistoryItem key={scan.id} scan={scan} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScanHistoryItem({ scan }: { scan: ScanRecord }) {
  return (
    <div className="bg-[#162035] border border-[#1e3050] rounded-xl p-4 flex items-center gap-4 flex-wrap">
      <div className="w-9 h-9 bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-red-400" />
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
        <span className="flex items-center gap-1 text-xs text-slate-500 ml-1">
          <Clock className="w-3 h-3" />
          {new Date(scan.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
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
