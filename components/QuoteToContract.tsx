"use client";
import { useState, useCallback } from "react";
import {
  Upload, FileText, AlertCircle, Loader2, CheckCircle,
  Download, Receipt, Edit3, Eye, ArrowLeft, Building2,
  User, DollarSign, Calendar, Briefcase, Sparkles
} from "lucide-react";
import { downloadContractPDF, type ExtractedQuote } from "@/lib/contractExport";

interface QuoteResult {
  extracted: ExtractedQuote;
  contract: string;
  filename: string;
  extractionMethod: string;
  generatedAt: string;
}

type View = "upload" | "review" | "preview";

interface QuoteToContractProps {
  onUsed?: () => void;
}

export default function QuoteToContract({ onUsed }: QuoteToContractProps = {}) {
  const [view, setView] = useState<View>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [editedData, setEditedData] = useState<ExtractedQuote | null>(null);
  const [downloading, setDownloading] = useState(false);

  const validateFile = (f: File) => {
    const valid = f.name.toLowerCase().endsWith(".pdf") || f.name.toLowerCase().endsWith(".docx");
    if (!valid) { setError("Please upload a PDF or DOCX file."); return false; }
    if (f.size > 20 * 1024 * 1024) { setError("File too large. Max 20MB."); return false; }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) { setFile(f); setError(""); }
  }, []);

  const handleGenerate = async () => {
    if (!file) return setError("Please upload a quote first.");
    setLoading(true);
    setError("");

    try {
      setLoadingStep("Extracting text from quote…");
      const formData = new FormData();
      formData.append("file", file);

      setLoadingStep("Analyzing quote with Claude AI…");
      const res = await fetch("/api/quote-to-contract", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate contract");
      }

      setResult(data);
      setEditedData(data.extracted);
      setView("review");
      onUsed?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const regenerateContract = async () => {
    if (!editedData) return;
    // Re-fetch contract text with edited data via local generation function
    // For simplicity, we'll regenerate via the same API but pass JSON; instead just regenerate the contract text client-side from edits:
    const newContract = generateContractFromData(editedData);
    if (result) {
      setResult({ ...result, contract: newContract, extracted: editedData });
    }
    setView("preview");
  };

  const handleDownload = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const filename = `service-agreement-${new Date().toISOString().slice(0, 10)}`;
      await downloadContractPDF(result.contract, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const reset = () => {
    setView("upload");
    setFile(null);
    setResult(null);
    setEditedData(null);
    setError("");
  };

  /* ─────────────── UPLOAD VIEW ─────────────── */
  if (view === "upload") {
    return (
      <div>
        <div className="bg-gradient-to-br from-red-900/20 to-[#162035] border border-[#1e3050] rounded-2xl p-5 mb-6 flex items-start gap-3">
          <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Quote to Contract</h3>
            <p className="text-slate-400 text-sm">Upload a quote or proposal — RedlineAI extracts the key terms and generates a complete service agreement you can edit and download as PDF.</p>
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("quote-file-input")?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors ${dragging ? "border-red-500 bg-red-900/10" : file ? "border-green-600 bg-green-900/10" : "border-[#1e3050] hover:border-red-700/50 bg-[#162035]"}`}
        >
          <input
            id="quote-file-input"
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => { const f = e.target.files?.[0]; if (f && validateFile(f)) { setFile(f); setError(""); } }}
            className="hidden"
          />
          {file ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-green-400 font-medium">{file.name}</p>
              <p className="text-slate-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Drop your quote here</p>
              <p className="text-slate-400 text-sm mb-4">or click to browse</p>
              <p className="text-slate-500 text-xs">PDF or DOCX · Max 20MB</p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !file}
          className="mt-5 w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-base sm:text-lg transition-colors flex items-center justify-center gap-3"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" />{loadingStep}</> : <><Sparkles className="w-5 h-5" /> Generate Contract</>}
        </button>

        {loading && (
          <div className="mt-4 bg-[#162035] border border-[#1e3050] rounded-xl p-4">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Claude AI is reading your quote…</span><span>~15–30s</span>
            </div>
            <div className="h-1.5 bg-[#1e3050] rounded-full overflow-hidden">
              <div className="h-full bg-red-600 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─────────────── REVIEW VIEW ─────────────── */
  if (view === "review" && editedData) {
    return (
      <div>
        <button onClick={reset} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Upload a different quote
        </button>

        <div className="bg-green-900/15 border border-green-800/40 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="text-green-300 font-semibold text-sm">Quote analyzed successfully!</p>
            <p className="text-slate-400 text-xs">Review and edit the extracted terms below, then generate your contract.</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-red-400" />
          Review extracted terms
        </h2>

        <div className="space-y-4">
          {/* Provider */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-red-400" /> Provider (Seller / Vendor)
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Company Name" value={editedData.providerName} onChange={(v) => setEditedData({ ...editedData, providerName: v })} />
              <Field label="Contact Person" value={editedData.providerContact} onChange={(v) => setEditedData({ ...editedData, providerContact: v })} />
              <div className="sm:col-span-2">
                <Field label="Address" value={editedData.providerAddress} onChange={(v) => setEditedData({ ...editedData, providerAddress: v })} />
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" /> Client (Buyer)
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Company Name" value={editedData.clientName} onChange={(v) => setEditedData({ ...editedData, clientName: v })} />
              <Field label="Contact Person" value={editedData.clientContact} onChange={(v) => setEditedData({ ...editedData, clientContact: v })} />
              <div className="sm:col-span-2">
                <Field label="Address" value={editedData.clientAddress} onChange={(v) => setEditedData({ ...editedData, clientAddress: v })} />
              </div>
            </div>
          </div>

          {/* Service */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-yellow-400" /> Scope of Work
            </p>
            <TextArea label="Service / Product Description" value={editedData.serviceDescription} onChange={(v) => setEditedData({ ...editedData, serviceDescription: v })} rows={4} />
          </div>

          {/* Payment */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-green-400" /> Payment
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Total Amount" value={editedData.totalAmount} onChange={(v) => setEditedData({ ...editedData, totalAmount: v })} />
              <Field label="Payment Terms" value={editedData.paymentTerms} onChange={(v) => setEditedData({ ...editedData, paymentTerms: v })} />
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" /> Delivery / Term
            </p>
            <Field label="Delivery Date or Duration" value={editedData.deliveryDate} onChange={(v) => setEditedData({ ...editedData, deliveryDate: v })} />
          </div>

          {/* Additional */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Additional Terms (Optional)
            </p>
            <TextArea label="" value={editedData.additionalTerms} onChange={(v) => setEditedData({ ...editedData, additionalTerms: v })} rows={2} placeholder="Any extra terms, warranties, or conditions…" />
          </div>
        </div>

        <button
          onClick={regenerateContract}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-xl text-base sm:text-lg transition-colors flex items-center justify-center gap-3"
        >
          <Eye className="w-5 h-5" /> Preview Contract
        </button>
      </div>
    );
  }

  /* ─────────────── PREVIEW VIEW ─────────────── */
  if (view === "preview" && result) {
    return (
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <button onClick={() => setView("review")} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Edit terms
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? "Generating PDF…" : "Download PDF"}
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-[#0f1a2e] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-400" />
              <span className="text-white text-sm font-medium">Service Agreement Preview</span>
            </div>
            <span className="text-slate-400 text-xs">A4 · PDF Ready</span>
          </div>
          <div className="p-6 sm:p-10 max-h-[700px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed font-sans">
              {result.contract}
            </pre>
          </div>
        </div>

        <div className="mt-4 text-center text-slate-500 text-xs">
          ⚠️ This is a template draft. Have a lawyer review before signing important contracts.
        </div>
      </div>
    );
  }

  return null;
}

/* ──────────────── Helpers ──────────────── */

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-slate-400 text-xs font-medium block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0f1a2e] border border-[#1e3050] rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-red-700/50"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      {label && <label className="text-slate-400 text-xs font-medium block mb-1">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-[#0f1a2e] border border-[#1e3050] rounded-lg px-3 py-2 text-slate-200 text-sm resize-none focus:outline-none focus:border-red-700/50"
      />
    </div>
  );
}

/* ──────────────── Client-side contract regeneration ──────────────── */
function generateContractFromData(data: ExtractedQuote): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of ${today} (the "Effective Date") by and between:

PROVIDER: ${data.providerName || "[Provider Name]"}
${data.providerAddress ? `Address: ${data.providerAddress}` : ""}
${data.providerContact ? `Contact: ${data.providerContact}` : ""}

CLIENT: ${data.clientName || "[Client Name]"}
${data.clientAddress ? `Address: ${data.clientAddress}` : ""}
${data.clientContact ? `Contact: ${data.clientContact}` : ""}

(each a "Party" and collectively the "Parties").

1. SCOPE OF WORK

Provider agrees to deliver the following services and/or products to Client:

${data.serviceDescription || "[Service description to be specified]"}

Provider shall perform the services in a professional and workmanlike manner consistent with industry standards. Any changes to the scope must be agreed upon in writing by both Parties.

2. PAYMENT TERMS

Total Compensation: ${data.totalAmount || "[Amount to be specified]"}

Payment Schedule: ${data.paymentTerms || "[Payment terms to be specified]"}

All invoices shall be paid within the agreed timeframe. Late payments may incur a service charge of 1.5% per month or the maximum rate permitted by law, whichever is lower. All amounts are exclusive of applicable taxes unless otherwise stated.

3. DELIVERY TIMELINE

Delivery / Term: ${data.deliveryDate || "[Delivery date to be specified]"}

Provider shall use commercially reasonable efforts to meet the delivery timeline above. Any delays caused by Client (including delayed feedback or approvals) shall extend the timeline accordingly.

4. CONFIDENTIALITY

Each Party agrees to keep confidential all non-public information disclosed by the other Party in connection with this Agreement, including business plans, technical data, customer information, and pricing. This obligation survives termination of this Agreement for a period of three (3) years.

Confidential Information shall not include information that: (a) is or becomes public through no fault of the receiving Party, (b) was known prior to disclosure, (c) is independently developed without use of confidential information, or (d) is required to be disclosed by law.

5. INTELLECTUAL PROPERTY

Upon full payment, all deliverables created specifically for Client under this Agreement shall become the property of Client. Provider retains ownership of any pre-existing tools, methodologies, or general know-how used in performing the services.

6. TERMINATION

Either Party may terminate this Agreement:
(a) For convenience, with thirty (30) days written notice;
(b) Immediately, for material breach not cured within fifteen (15) days of written notice;
(c) Immediately, if the other Party becomes insolvent or files for bankruptcy.

Upon termination, Client shall pay for all work performed up to the termination date. All confidentiality obligations survive termination.

7. LIMITATION OF LIABILITY

In no event shall either Party be liable for indirect, incidental, special, consequential, or punitive damages, regardless of the cause of action. Each Party's total liability under this Agreement shall not exceed the total amounts paid or payable hereunder.

8. INDEPENDENT CONTRACTOR

Provider is an independent contractor. Nothing in this Agreement creates an employer-employee, partnership, or joint venture relationship between the Parties.

${data.additionalTerms && data.additionalTerms.trim() ? `9. ADDITIONAL TERMS\n\n${data.additionalTerms}\n\n` : ""}10. GENERAL PROVISIONS

This Agreement constitutes the entire agreement between the Parties and supersedes all prior negotiations, representations, or agreements relating to the subject matter herein. Any modifications must be in writing and signed by both Parties.

This Agreement shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved through good-faith negotiation, and failing that, through binding arbitration.

If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.

11. SIGNATURES

By signing below, each Party agrees to be bound by the terms of this Agreement.

PROVIDER:                                  CLIENT:

${(data.providerName || "[Provider Name]").padEnd(40, " ")}   ${data.clientName || "[Client Name]"}

By: ____________________________           By: ____________________________

Name: __________________________           Name: __________________________

Title: _________________________           Title: _________________________

Date: __________________________           Date: __________________________
`;
}
