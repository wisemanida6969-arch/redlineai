"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload, FileText, AlertCircle, Loader2, CheckCircle, Mail, Send, Eye,
  PenTool, Type, Calendar, X, ArrowLeft, Download, Clock, ChevronDown
} from "lucide-react";

type FieldType = "signature" | "name" | "date";
interface SignField {
  type: FieldType;
  page: number;
  x: number; y: number; width: number; height: number;  // 0..1
}

interface SignatureRequest {
  id: string;
  title: string;
  filename: string;
  status: "pending" | "signed" | "expired" | "cancelled";
  signer_email: string;
  signer_name: string;
  signed_at: string | null;
  created_at: string;
  token: string;
}

interface Props {
  onUsed?: () => void;
}

type View = "list" | "upload" | "place" | "send" | "sent";

export default function ESignature({ onUsed }: Props = {}) {
  const [view, setView] = useState<View>("list");
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [pdfImageUrls, setPdfImageUrls] = useState<string[]>([]);
  const [renderingPDF, setRenderingPDF] = useState(false);

  // Field placement
  const [fields, setFields] = useState<SignField[]>([]);
  const [activeFieldType, setActiveFieldType] = useState<FieldType>("signature");

  // Recipient
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");

  // Send state
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sentInfo, setSentInfo] = useState<{ signUrl: string } | null>(null);

  /* Fetch list */
  const refreshList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/esign/list");
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch { /* ignore */ }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { refreshList(); }, [refreshList]);

  /* PDF → image previews using pdfjs-dist (loaded via CDN to avoid SSR/build complexity) */
  const renderPDFPreview = async (f: File) => {
    setRenderingPDF(true);
    setError("");
    try {
      const buffer = await f.arrayBuffer();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pdfjs = (window as any).pdfjsLib;
      if (!pdfjs) {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs", "module");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pdfjs = (window as any).pdfjsLib;
      }
      if (pdfjs?.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";
      }

      const loadingTask = pdfjs.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      const urls: string[] = [];

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        urls.push(canvas.toDataURL("image/png"));
      }
      setPdfImageUrls(urls);
      setPageCount(pdf.numPages);
      setView("place");
    } catch (e) {
      console.error(e);
      setError("Failed to render PDF preview. Make sure it's a valid PDF.");
    } finally {
      setRenderingPDF(false);
    }
  };

  /* file selection */
  const onFileSelect = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) { setError("PDF only."); return; }
    if (f.size > 20 * 1024 * 1024) { setError("Max 20MB."); return; }
    setFile(f);
    setTitle(f.name.replace(/\.pdf$/i, ""));
    setError("");
    renderPDFPreview(f);
  };

  /* Field placement: click on page image → add field */
  const handlePageClick = (pageIdx: number, e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const sizeMap = {
      signature: { w: 0.25, h: 0.06 },
      name:      { w: 0.22, h: 0.04 },
      date:      { w: 0.14, h: 0.04 },
    };
    const { w, h } = sizeMap[activeFieldType];
    const field: SignField = {
      type: activeFieldType,
      page: pageIdx + 1,
      x: Math.min(0.99 - w, Math.max(0, x - w / 2)),
      y: Math.min(0.99 - h, Math.max(0, y - h / 2)),
      width: w,
      height: h,
    };
    setFields((prev) => [...prev, field]);
  };

  const removeField = (index: number) => setFields((prev) => prev.filter((_, i) => i !== index));

  const canProceedToSend = fields.length > 0;

  /* SEND */
  const sendRequest = async () => {
    if (!file) return;
    if (!signerEmail.trim() || !signerName.trim()) {
      setError("Signer name and email are required.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("signerEmail", signerEmail);
      fd.append("signerName", signerName);
      fd.append("fields", JSON.stringify(fields));

      const res = await fetch("/api/esign/create", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSentInfo({ signUrl: data.signUrl });
      onUsed?.();
      refreshList();
      setView("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setFields([]);
    setSignerEmail("");
    setSignerName("");
    setPdfImageUrls([]);
    setPageCount(0);
    setSentInfo(null);
    setError("");
    setView("list");
  };

  /* ─────────── LIST VIEW (default) ─────────── */
  if (view === "list") {
    return (
      <div>
        <div className="bg-gradient-to-br from-red-900/20 to-[#162035] border border-[#1e3050] rounded-2xl p-5 mb-6 flex items-start gap-3">
          <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
            <PenTool className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">E-Signature</h3>
            <p className="text-slate-400 text-sm">Upload a contract, place signature fields, and send it for legally-tracked e-signing. Get a signed PDF back automatically.</p>
          </div>
        </div>

        <button
          onClick={() => setView("upload")}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-xl text-base sm:text-lg transition-colors flex items-center justify-center gap-2 mb-8"
        >
          <Send className="w-5 h-5" /> Create New Signing Request
        </button>

        <h2 className="text-white font-semibold text-lg mb-4">Recent Requests</h2>
        {loadingList ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8 text-center text-slate-500 text-sm">
            No signing requests yet. Create your first above.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => <RequestRow key={r.id} req={r} />)}
          </div>
        )}
      </div>
    );
  }

  /* ─────────── UPLOAD ─────────── */
  if (view === "upload") {
    return (
      <div>
        <button onClick={reset} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Step 1 of 3 · Upload Contract</h2>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) onFileSelect(f);
          }}
          onClick={() => document.getElementById("esign-file")?.click()}
          className="border-2 border-dashed border-[#1e3050] hover:border-red-700/50 rounded-2xl p-12 text-center cursor-pointer transition-colors bg-[#162035]"
        >
          <input id="esign-file" type="file" accept=".pdf"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }}
            className="hidden" />
          {renderingPDF ? (
            <>
              <Loader2 className="w-12 h-12 text-red-400 mx-auto mb-3 animate-spin" />
              <p className="text-white font-medium">Rendering PDF preview…</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Drop your PDF here</p>
              <p className="text-slate-400 text-sm">or click to browse · Max 20MB · PDF only</p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </div>
    );
  }

  /* ─────────── PLACE FIELDS ─────────── */
  if (view === "place") {
    return (
      <div>
        <button onClick={() => setView("upload")} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">Step 2 of 3 · Place Signature Fields</h2>
        <p className="text-slate-400 text-sm mb-6">Click on the document where you want each field to appear.</p>

        {/* Field type tabs */}
        <div className="sticky top-20 z-30 bg-[#0f1a2e]/95 backdrop-blur -mx-6 px-6 py-3 mb-4 border-b border-[#1e3050]">
          <div className="flex gap-2 flex-wrap">
            {(["signature", "name", "date"] as const).map((t) => {
              const active = activeFieldType === t;
              const Icon = t === "signature" ? PenTool : t === "name" ? Type : Calendar;
              return (
                <button
                  key={t}
                  onClick={() => setActiveFieldType(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? "bg-red-600 text-white" : "bg-[#162035] text-slate-400 border border-[#1e3050] hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t === "signature" ? "Signature" : t === "name" ? "Name" : "Date"}
                </button>
              );
            })}
            <span className="ml-auto text-slate-500 text-sm self-center">
              {fields.length} field{fields.length !== 1 ? "s" : ""} placed
            </span>
          </div>
        </div>

        {/* Page previews with click-to-add */}
        <div className="space-y-6 mb-6">
          {pdfImageUrls.map((src, idx) => (
            <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-[#0f1a2e] px-4 py-2 text-slate-400 text-xs flex items-center justify-between">
                <span>Page {idx + 1} of {pageCount}</span>
                <span>Click to add {activeFieldType}</span>
              </div>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Page ${idx + 1}`}
                  onClick={(e) => handlePageClick(idx, e)}
                  className="w-full block cursor-crosshair select-none"
                  draggable={false}
                />
                {fields
                  .map((f, i) => ({ f, i }))
                  .filter(({ f }) => f.page === idx + 1)
                  .map(({ f, i }) => (
                    <FieldMarker key={i} field={f} index={i} onRemove={() => removeField(i)} />
                  ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={() => setView("send")}
          disabled={!canProceedToSend}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-base sm:text-lg transition-colors flex items-center justify-center gap-3"
        >
          Next: Add Signer →
        </button>
      </div>
    );
  }

  /* ─────────── SEND ─────────── */
  if (view === "send") {
    return (
      <div>
        <button onClick={() => setView("place")} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Step 3 of 3 · Add Recipient</h2>

        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5 mb-4">
          <p className="text-slate-500 text-xs font-bold uppercase mb-3">Document</p>
          <p className="text-white font-medium">{title}</p>
          <p className="text-slate-500 text-xs mt-1">{fields.length} fields placed</p>
        </div>

        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0f1a2e] border border-[#1e3050] rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-red-700/50"
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">Signer Name</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-[#0f1a2e] border border-[#1e3050] rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-red-700/50"
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">Signer Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="signer@company.com"
                className="w-full bg-[#0f1a2e] border border-[#1e3050] rounded-lg pl-10 pr-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-red-700/50"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={sendRequest}
          disabled={sending || !signerEmail.trim() || !signerName.trim()}
          className="mt-5 w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-base sm:text-lg transition-colors flex items-center justify-center gap-3"
        >
          {sending ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : <><Send className="w-5 h-5" /> Send Signing Request</>}
        </button>
      </div>
    );
  }

  /* ─────────── SENT ─────────── */
  if (view === "sent" && sentInfo) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-900/40 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sent!</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          We emailed a signing link to <span className="text-white">{signerEmail}</span>.
          They&apos;ll receive a unique URL to review and sign the document.
        </p>

        <div className="bg-[#162035] border border-[#1e3050] rounded-xl p-4 max-w-lg mx-auto text-left">
          <p className="text-slate-500 text-xs font-bold uppercase mb-2">Signing link (you can share this manually too)</p>
          <p className="text-red-400 text-xs break-all">{sentInfo.signUrl}</p>
        </div>

        <button
          onClick={reset}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return null;
}

/* ──────────────── Sub-components ──────────────── */

function FieldMarker({ field, index, onRemove }: { field: SignField; index: number; onRemove: () => void }) {
  const colors = {
    signature: "bg-red-500/30 border-red-500",
    name:      "bg-blue-500/30 border-blue-500",
    date:      "bg-purple-500/30 border-purple-500",
  };
  const labels = { signature: "Signature", name: "Name", date: "Date" };
  return (
    <div
      className={`absolute border-2 ${colors[field.type]} rounded flex items-center justify-center group`}
      style={{
        left: `${field.x * 100}%`,
        top: `${field.y * 100}%`,
        width: `${field.width * 100}%`,
        height: `${field.height * 100}%`,
      }}
    >
      <span className="text-[10px] font-bold uppercase text-white drop-shadow">{labels[field.type]} #{index + 1}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3 text-white" />
      </button>
    </div>
  );
}

function RequestRow({ req }: { req: SignatureRequest }) {
  const config = {
    pending: { color: "text-yellow-400", bg: "bg-yellow-900/30", label: "Awaiting signature", icon: Clock },
    signed: { color: "text-green-400", bg: "bg-green-900/30", label: "Signed", icon: CheckCircle },
    expired: { color: "text-slate-500", bg: "bg-slate-900/30", label: "Expired", icon: AlertCircle },
    cancelled: { color: "text-slate-500", bg: "bg-slate-900/30", label: "Cancelled", icon: AlertCircle },
  };
  const c = config[req.status];
  const Icon = c.icon;
  const date = req.signed_at || req.created_at;

  const [dropOpen, setDropOpen] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleDownload = async (type: "pdf" | "docx") => {
    setDropOpen(false);
    setDownloading(type);
    try {
      const url = type === "pdf" ? `/api/esign/${req.id}/download` : `/api/esign/${req.id}/download-docx`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download failed" }));
        throw new Error(err.error || "Download failed");
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeName = req.filename.replace(/\.pdf$/i, "");
      a.download = `${safeName}-signed.${type}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const handleRowClick = () => {
    if (req.status === "signed") {
      // Open signed PDF in new tab for preview
      window.open(`/api/esign/${req.id}/download?inline=1`, "_blank");
    } else if (req.status === "pending") {
      // Open the public signing page in new tab so owner can preview what signer sees
      window.open(`/sign/${req.token}`, "_blank");
    }
  };

  return (
    <div className="bg-[#162035] border border-[#1e3050] hover:border-red-700/50 rounded-xl p-4 flex items-center gap-4 flex-wrap transition-colors">
      <button
        onClick={handleRowClick}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <div className="w-9 h-9 bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{req.title}</p>
          <p className="text-slate-500 text-xs truncate mt-0.5">{req.signer_name} · {req.signer_email}</p>
        </div>
      </button>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${c.bg} ${c.color}`}>
          <Icon className="w-3 h-3" /> {c.label}
        </span>
        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          {new Date(date).toLocaleDateString()}
        </span>

        {req.status === "signed" && (
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropOpen((v) => !v)}
              disabled={!!downloading}
              className="flex items-center gap-1 text-xs bg-red-900/30 hover:bg-red-900/50 disabled:opacity-50 text-red-400 px-2.5 py-1 rounded-full transition-colors"
              title="Download signed document"
            >
              {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              <span className="hidden sm:inline">
                {downloading === "pdf" ? "PDF…" : downloading === "docx" ? "Word…" : "Download"}
              </span>
              {!downloading && <ChevronDown className="w-3 h-3" />}
            </button>

            {dropOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#162035] border border-[#1e3050] rounded-xl shadow-2xl overflow-hidden z-50">
                <button
                  onClick={() => handleDownload("pdf")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-[#1e3050] hover:text-white transition-colors"
                >
                  <div className="w-7 h-7 bg-red-900/40 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Download PDF</div>
                    <div className="text-xs text-slate-500">Signed contract · .pdf</div>
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
                    <div className="text-xs text-slate-500">Editable · .docx</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {req.status === "pending" && (
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/sign/${req.token}`)}
            className="flex items-center gap-1 text-xs bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white px-2 py-1 rounded-full transition-colors"
            title="Copy signing link"
          >
            <Eye className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* helper to inject a script via classic <script> tag */
async function loadScript(src: string, type: "module" | "" = "") {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    if (type) s.type = type;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}
