"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Upload, FileText, AlertCircle, Loader2, CheckCircle, FileType } from "lucide-react";

const ACCEPTED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ACCEPTED_EXT = [".pdf", ".docx"];

function getFileIcon(file: File) {
  if (file.name.endsWith(".docx")) return "DOCX";
  return "PDF";
}

export default function Dashboard() {
  const router = useRouter();
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");

  const validateFile = (f: File) => {
    const validType = ACCEPTED_TYPES.includes(f.type) || f.name.endsWith(".pdf") || f.name.endsWith(".docx");
    if (!validType) {
      setError("Please upload a PDF or DOCX file.");
      return false;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("File too large. Max size is 20MB.");
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) {
      setFile(f);
      setError("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && validateFile(f)) {
      setFile(f);
      setError("");
    }
  };

  const handleAnalyze = async () => {
    if (mode === "upload" && !file) return setError("Please upload a PDF or DOCX file first.");
    if (mode === "paste" && !text.trim()) return setError("Please paste your contract text.");

    setLoading(true);
    setError("");

    try {
      const isScannedLikely = file && file.name.endsWith(".pdf") && file.size > 500_000;
      setLoadingStep(isScannedLikely ? "Reading document (may use OCR for scanned PDFs)…" : "Extracting text…");

      const formData = new FormData();
      if (mode === "upload" && file) {
        formData.append("file", file);
      } else {
        formData.append("text", text);
      }

      setLoadingStep("Analyzing clauses with Claude AI…");

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();
      sessionStorage.setItem("redlineai_result", JSON.stringify(data));
      router.push("/analysis");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Scan a contract</h1>
          <p className="text-slate-400">Upload a PDF, DOCX, or paste your contract text for an instant risk report.</p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-[#162035] p-1 rounded-xl border border-[#1e3050] mb-6 w-fit">
          <button
            onClick={() => setMode("upload")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "upload" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
          <button
            onClick={() => setMode("paste")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "paste" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <FileText className="w-4 h-4" /> Paste Text
          </button>
        </div>

        {mode === "upload" ? (
          <>
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
                dragging ? "border-red-500 bg-red-900/10"
                : file ? "border-green-600 bg-green-900/10"
                : "border-[#1e3050] hover:border-red-700/50 bg-[#162035]"
              }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept={ACCEPTED_EXT.join(",")}
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <>
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="bg-green-900/40 text-green-400 text-xs font-bold px-2 py-0.5 rounded">
                      {getFileIcon(file)}
                    </span>
                    <p className="text-green-400 font-medium">{file.name}</p>
                  </div>
                  <p className="text-slate-500 text-sm">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
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

            {/* Scanned PDF notice */}
            {file?.name.endsWith(".pdf") && (
              <div className="mt-3 flex items-start gap-2 text-slate-400 text-xs bg-[#162035] border border-[#1e3050] rounded-xl px-4 py-3">
                <FileType className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
                <span>
                  <span className="text-blue-400 font-medium">Scanned PDF? No problem.</span>{" "}
                  If the PDF has no embedded text, RedlineAI automatically uses Claude Vision to read it.
                </span>
              </div>
            )}
          </>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your contract text here…"
            className="w-full h-64 bg-[#162035] border border-[#1e3050] rounded-2xl p-4 text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-red-700/50 focus:ring-1 focus:ring-red-900/30"
          />
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {loadingStep || "Analyzing…"}
            </>
          ) : (
            "Analyze Contract →"
          )}
        </button>

        {loading && (
          <div className="mt-4 bg-[#162035] border border-[#1e3050] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Claude AI is reviewing every clause…</span>
              <span>~15–30s</span>
            </div>
            <div className="h-1.5 bg-[#1e3050] rounded-full overflow-hidden">
              <div className="h-full bg-red-600 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        )}

        <p className="text-slate-500 text-xs text-center mt-4">
          Your contract is processed securely and never stored without your permission.
        </p>
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
