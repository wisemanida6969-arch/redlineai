"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2, AlertCircle, CheckCircle, PenTool, FileText, Eraser, Shield, Calendar
} from "lucide-react";

interface SignField {
  type: "signature" | "name" | "date";
  page: number;
  x: number; y: number; width: number; height: number;
}

interface SignDoc {
  id: string;
  title: string;
  filename: string;
  pdfUrl: string;
  status: "pending" | "signed";
  signerEmail: string;
  signerName: string;
  fields: SignField[];
  signedAt: string | null;
}

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const [doc, setDoc] = useState<SignDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [renderingPDF, setRenderingPDF] = useState(false);

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<{ clear: () => void; isEmpty: () => boolean; toDataURL: (t?: string) => string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signedComplete, setSignedComplete] = useState(false);

  /* Fetch document */
  useEffect(() => {
    fetch(`/api/esign/sign/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setDoc(d);
        if (d.status === "signed") setSignedComplete(true);
      })
      .catch(() => setError("Failed to load document"))
      .finally(() => setLoading(false));
  }, [token]);

  /* Render PDF preview */
  useEffect(() => {
    if (!doc?.pdfUrl) return;
    (async () => {
      setRenderingPDF(true);
      try {
        await ensurePdfjs();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfjs = (window as any).pdfjsLib;
        const pdf = await pdfjs.getDocument({ url: doc.pdfUrl }).promise;
        const urls: string[] = [];
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width; canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          urls.push(canvas.toDataURL("image/png"));
        }
        setPdfPages(urls);
      } catch (e) {
        console.error(e);
        setError("Failed to render document.");
      } finally {
        setRenderingPDF(false);
      }
    })();
  }, [doc?.pdfUrl]);

  /* Init signature pad */
  useEffect(() => {
    if (!canvasRef.current || signedComplete || !doc) return;
    const canvas = canvasRef.current;
    // size canvas to its display size for crisp drawing
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")!.scale(ratio, ratio);

    let cancelled = false;
    (async () => {
      const mod = await import("signature_pad");
      if (cancelled) return;
      const SignaturePad = mod.default;
      const pad = new SignaturePad(canvas, {
        backgroundColor: "rgba(255,255,255,1)",
        penColor: "rgb(15, 23, 42)",
        minWidth: 0.8,
        maxWidth: 2.4,
      });
      padRef.current = pad as unknown as { clear: () => void; isEmpty: () => boolean; toDataURL: (t?: string) => string };
    })();
    return () => { cancelled = true; };
  }, [doc, signedComplete]);

  const clearPad = () => padRef.current?.clear();

  const submitSignature = async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      setError("Please draw your signature first.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const dataUrl = padRef.current.toDataURL("image/png");
      const res = await fetch(`/api/esign/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sign");
      setSignedComplete(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────── Loading / errors ─────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1a2e] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading document…
        </div>
      </div>
    );
  }
  if (error && !doc) {
    return (
      <div className="min-h-screen bg-[#0f1a2e] flex items-center justify-center px-4">
        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-white font-bold text-xl mb-2">Cannot open document</h1>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }
  if (!doc) return null;

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      {/* Top bar */}
      <header className="bg-[#162035] border-b border-[#1e3050] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Shield className="w-6 h-6 text-red-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{doc.title}</p>
              <p className="text-slate-500 text-xs truncate">For: {doc.signerName} ({doc.signerEmail})</p>
            </div>
          </div>
          {signedComplete ? (
            <span className="flex items-center gap-1 text-xs bg-green-900/30 text-green-400 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> Signed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-yellow-900/30 text-yellow-400 px-3 py-1.5 rounded-full">
              <PenTool className="w-3.5 h-3.5" /> Pending your signature
            </span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {signedComplete ? (
          <div className="bg-green-900/15 border border-green-800/40 rounded-2xl p-8 text-center mb-8">
            <div className="w-16 h-16 bg-green-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Signed successfully!</h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Thank you, {doc.signerName}. Your signature has been recorded and the document sender has been notified.
              You may close this window.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5 mb-6 flex items-start gap-3">
              <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Review & Sign</h2>
                <p className="text-slate-400 text-sm">
                  Review the document below, then draw your signature at the bottom and click <strong className="text-white">Sign Document</strong> to complete.
                </p>
              </div>
            </div>
          </>
        )}

        {/* PDF pages with field markers */}
        {renderingPDF ? (
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-12 text-center">
            <Loader2 className="w-8 h-8 text-red-400 mx-auto mb-3 animate-spin" />
            <p className="text-slate-400 text-sm">Loading document preview…</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {pdfPages.map((src, idx) => (
              <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-[#0f1a2e] px-4 py-2 text-slate-400 text-xs">Page {idx + 1} of {pdfPages.length}</div>
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Page ${idx + 1}`} className="w-full block" draggable={false} />
                  {doc.fields.filter((f) => f.page === idx + 1).map((f, i) => (
                    <SignerFieldMarker key={i} field={f} signed={signedComplete} signerName={doc.signerName} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Signature pad */}
        {!signedComplete && (
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <PenTool className="w-4 h-4 text-red-400" /> Draw your signature
              </h3>
              <button
                onClick={clearPad}
                className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors"
              >
                <Eraser className="w-3.5 h-3.5" /> Clear
              </button>
            </div>

            <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-48 sm:h-56 cursor-crosshair touch-none"
              />
            </div>

            <p className="text-slate-500 text-xs mt-2 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Today&apos;s date will be added automatically.
            </p>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={submitSignature}
              disabled={submitting}
              className="mt-5 w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 text-white font-semibold py-4 rounded-xl text-base sm:text-lg transition-colors flex items-center justify-center gap-3"
            >
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing…</> : <><CheckCircle className="w-5 h-5" /> Sign Document</>}
            </button>

            <p className="text-slate-600 text-xs mt-4 text-center">
              By clicking &ldquo;Sign Document&rdquo;, you agree this is your legal electronic signature.
              We&apos;ll record your IP address and timestamp as proof of signing.
            </p>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-slate-600 text-xs">
            Powered by <a href="https://getredlineai.com" className="text-slate-500 hover:text-slate-400">RedlineAI</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function SignerFieldMarker({ field, signed, signerName }: { field: SignField; signed: boolean; signerName: string }) {
  const colors = {
    signature: signed ? "bg-green-500/20 border-green-500/60" : "bg-yellow-500/20 border-yellow-500 animate-pulse",
    name:      signed ? "bg-green-500/20 border-green-500/60" : "bg-blue-500/20 border-blue-500",
    date:      signed ? "bg-green-500/20 border-green-500/60" : "bg-purple-500/20 border-purple-500",
  };
  const labels = {
    signature: signed ? "✓ Signed" : "Sign here",
    name:      signed ? signerName : "Name",
    date:      signed ? new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Date",
  };
  return (
    <div
      className={`absolute border-2 ${colors[field.type]} rounded flex items-center justify-center pointer-events-none`}
      style={{
        left: `${field.x * 100}%`,
        top: `${field.y * 100}%`,
        width: `${field.width * 100}%`,
        height: `${field.height * 100}%`,
      }}
    >
      <span className="text-[10px] sm:text-xs font-bold text-slate-800 drop-shadow">{labels[field.type]}</span>
    </div>
  );
}

async function ensurePdfjs() {
  const w = window as unknown as { pdfjsLib?: { GlobalWorkerOptions?: { workerSrc?: string } } };
  if (w.pdfjsLib) return;
  await new Promise<void>((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs";
    s.type = "module";
    s.onload = () => res();
    s.onerror = () => rej(new Error("Failed to load pdf.js"));
    document.head.appendChild(s);
  });
  const ww = window as unknown as { pdfjsLib?: { GlobalWorkerOptions?: { workerSrc?: string } } };
  if (ww.pdfjsLib?.GlobalWorkerOptions) {
    ww.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";
  }
}
