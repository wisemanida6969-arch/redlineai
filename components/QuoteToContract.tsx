"use client";
import { useState, useCallback } from "react";
import {
  Upload, FileText, AlertCircle, Loader2, CheckCircle,
  Download, Receipt, Edit3, Eye, ArrowLeft, Building2,
  User, DollarSign, Calendar, Briefcase, Sparkles, FileType
} from "lucide-react";
import { downloadContractPDF, type ExtractedQuote } from "@/lib/contractExport";
import { useT } from "@/lib/i18n/LanguageProvider";

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
  const { t, lang } = useT();
  const [view, setView] = useState<View>("upload");
  const [mode, setMode] = useState<"file" | "chat">("file");
  const [files, setFiles] = useState<File[]>([]);
  const [chatText, setChatText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [editedData, setEditedData] = useState<ExtractedQuote | null>(null);
  const [downloading, setDownloading] = useState(false);

  const validateFile = (f: File) => {
    const name = f.name.toLowerCase();
    const valid =
      name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".txt") ||
      name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp");
    if (!valid) { setError(lang === "ko" ? "PDF, DOCX, TXT, PNG, JPG 파일만 가능합니다." : "Please upload a PDF, DOCX, TXT, PNG, or JPG file."); return false; }
    if (f.size > 20 * 1024 * 1024) { setError(lang === "ko" ? "파일이 너무 큽니다. 최대 20MB." : "File too large. Max 20MB."); return false; }
    return true;
  };

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter(validateFile);
    if (valid.length) {
      setFiles((prev) => [...prev, ...valid].slice(0, 6));
      setError("");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) addFiles(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = async () => {
    if (mode === "file" && files.length === 0) return setError(lang === "ko" ? "파일을 업로드해 주세요." : "Please upload a file first.");
    if (mode === "chat" && chatText.trim().length < 10) return setError(lang === "ko" ? "대화 내용을 충분히 붙여넣어 주세요." : "Please paste enough chat content.");
    setLoading(true);
    setError("");

    try {
      setLoadingStep(lang === "ko" ? "내용 분석 중…" : "Extracting content…");
      const formData = new FormData();
      if (mode === "file") {
        for (const f of files) formData.append("file", f);
      } else {
        formData.append("text", chatText);
        formData.append("filename", lang === "ko" ? "대화 내용" : "Pasted conversation");
      }
      formData.append("lang", lang);

      setLoadingStep(lang === "ko" ? "Claude AI로 분석 중…" : "Analyzing with Claude AI…");
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
    const newContract = generateContractFromData(editedData, lang);
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
    setFiles([]);
    setChatText("");
    setResult(null);
    setEditedData(null);
    setError("");
  };

  /* ─────────────── UPLOAD VIEW ─────────────── */
  if (view === "upload") {
    const canSubmit = mode === "file" ? files.length > 0 : chatText.trim().length >= 10;
    return (
      <div>
        <div className="bg-gradient-to-br from-red-900/20 to-[#162035] border border-[#1e3050] rounded-2xl p-5 mb-6 flex items-start gap-3">
          <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{t("quote.title")}</h3>
            <p className="text-slate-400 text-sm">{t("quote.intro")}</p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-[#162035] p-1 rounded-xl border border-[#1e3050] mb-4 w-fit">
          <button
            onClick={() => { setMode("file"); setError(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "file" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <Upload className="w-4 h-4" /> {t("quote.modeFile")}
          </button>
          <button
            onClick={() => { setMode("chat"); setError(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "chat" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <FileText className="w-4 h-4" /> {t("quote.modeChat")}
          </button>
        </div>

        {/* FILE MODE */}
        {mode === "file" && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("quote-file-input")?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-colors ${dragging ? "border-red-500 bg-red-900/10" : files.length > 0 ? "border-green-600 bg-green-900/10" : "border-[#1e3050] hover:border-red-700/50 bg-[#162035]"}`}
            >
              <input
                id="quote-file-input"
                type="file"
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
                multiple
                onChange={(e) => { const arr = e.target.files ? Array.from(e.target.files) : []; if (arr.length) addFiles(arr); e.target.value = ""; }}
                className="hidden"
              />
              {files.length > 0 ? (
                <>
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-medium text-sm">{files.length} {lang === "ko" ? "개 파일 선택됨" : files.length === 1 ? "file selected" : "files selected"}</p>
                  <p className="text-slate-500 text-xs mt-1">{lang === "ko" ? "클릭해서 더 추가" : "Click to add more"}</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-white font-medium mb-1">{t("quote.dropQuote")}</p>
                  <p className="text-slate-400 text-sm mb-3">{t("quote.clickBrowse")}</p>
                  <p className="text-slate-500 text-xs">{t("quote.pdfOrDocx")}</p>
                </>
              )}
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#162035] border border-[#1e3050] rounded-lg px-3 py-2 text-xs">
                    <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="text-slate-300 truncate flex-1">{f.name}</span>
                    <span className="text-slate-500 shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                    <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 transition-colors shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-start gap-2 text-slate-400 text-xs bg-[#162035] border border-[#1e3050] rounded-xl px-4 py-3">
              <FileType className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
              <span>{t("quote.fileHintScreenshot")}</span>
            </div>
          </>
        )}

        {/* CHAT MODE */}
        {mode === "chat" && (
          <>
            <p className="text-slate-400 text-sm mb-2">{t("quote.chatHint")}</p>
            <textarea
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder={t("quote.chatPlaceholder")}
              className="w-full h-64 bg-[#162035] border border-[#1e3050] rounded-2xl p-4 text-slate-200 placeholder-slate-500 text-sm resize-y focus:outline-none focus:border-red-700/50 font-mono"
            />
          </>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !canSubmit}
          className="mt-5 w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-base sm:text-lg transition-colors flex items-center justify-center gap-3"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" />{loadingStep}</> : <><Sparkles className="w-5 h-5" /> {t("quote.generate")}</>}
        </button>

        {loading && (
          <div className="mt-4 bg-[#162035] border border-[#1e3050] rounded-xl p-4">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>{t("quote.readingQuote")}</span><span>{t("quote.estimated")}</span>
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
          <ArrowLeft className="w-4 h-4" /> {t("quote.uploadDifferent")}
        </button>

        <div className="bg-green-900/15 border border-green-800/40 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="text-green-300 font-semibold text-sm">{t("quote.quoteAnalyzed")}</p>
            <p className="text-slate-400 text-xs">{t("quote.reviewBelow")}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-red-400" />
          {t("quote.reviewTerms")}
        </h2>

        <div className="space-y-4">
          {/* Provider */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-red-400" /> {t("quote.provider")}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t("quote.companyName")}  value={editedData.providerName}    onChange={(v) => setEditedData({ ...editedData, providerName: v })} />
              <Field label={t("quote.contactPerson")} value={editedData.providerContact} onChange={(v) => setEditedData({ ...editedData, providerContact: v })} />
              <div className="sm:col-span-2">
                <Field label={t("quote.address")} value={editedData.providerAddress} onChange={(v) => setEditedData({ ...editedData, providerAddress: v })} />
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" /> {t("quote.client")}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t("quote.companyName")}  value={editedData.clientName}    onChange={(v) => setEditedData({ ...editedData, clientName: v })} />
              <Field label={t("quote.contactPerson")} value={editedData.clientContact} onChange={(v) => setEditedData({ ...editedData, clientContact: v })} />
              <div className="sm:col-span-2">
                <Field label={t("quote.address")} value={editedData.clientAddress} onChange={(v) => setEditedData({ ...editedData, clientAddress: v })} />
              </div>
            </div>
          </div>

          {/* Service */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-yellow-400" /> {t("quote.scopeOfWork")}
            </p>
            <TextArea label={t("quote.serviceDescQ")} value={editedData.serviceDescription} onChange={(v) => setEditedData({ ...editedData, serviceDescription: v })} rows={4} />
          </div>

          {/* Payment */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-green-400" /> {t("quote.payment")}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t("quote.totalAmount")}  value={editedData.totalAmount}  onChange={(v) => setEditedData({ ...editedData, totalAmount: v })} />
              <Field label={t("quote.paymentTerms")} value={editedData.paymentTerms} onChange={(v) => setEditedData({ ...editedData, paymentTerms: v })} />
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" /> {t("quote.deliveryTerm")}
            </p>
            <Field label={t("quote.deliveryDate")} value={editedData.deliveryDate} onChange={(v) => setEditedData({ ...editedData, deliveryDate: v })} />
          </div>

          {/* Additional */}
          <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> {t("quote.additionalTerms")}
            </p>
            <TextArea label="" value={editedData.additionalTerms} onChange={(v) => setEditedData({ ...editedData, additionalTerms: v })} rows={2} placeholder={t("quote.additionalTermsPlaceholder")} />
          </div>
        </div>

        <button
          onClick={regenerateContract}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-xl text-base sm:text-lg transition-colors flex items-center justify-center gap-3"
        >
          <Eye className="w-5 h-5" /> {t("quote.previewContract")}
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
            <ArrowLeft className="w-4 h-4" /> {t("quote.editTerms")}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? t("quote.generatingPdf") : t("quote.downloadPdf")}
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
              <span className="text-white text-sm font-medium">{t("quote.contractPreview")}</span>
            </div>
            <span className="text-slate-400 text-xs">{t("quote.pdfReady")}</span>
          </div>
          <div className="p-6 sm:p-10 max-h-[700px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed font-sans">
              {result.contract}
            </pre>
          </div>
        </div>

        <div className="mt-4 text-center text-slate-500 text-xs">
          {t("quote.legalNotice")}
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
function generateContractFromData(data: ExtractedQuote, lang: "en" | "ko" = "en"): string {
  return lang === "ko" ? generateContractFromDataKO(data) : generateContractFromDataEN(data);
}

function generateContractFromDataKO(data: ExtractedQuote): string {
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  return `용역 계약서

본 용역 계약서("계약")는 ${today}("효력 발생일")에 다음 양 당사자 간에 체결됩니다:

공급자: ${data.providerName || "[공급자명]"}
${data.providerAddress ? `주소: ${data.providerAddress}` : ""}
${data.providerContact ? `담당자: ${data.providerContact}` : ""}

고객: ${data.clientName || "[고객명]"}
${data.clientAddress ? `주소: ${data.clientAddress}` : ""}
${data.clientContact ? `담당자: ${data.clientContact}` : ""}

(이하 각각 "당사자", 통칭하여 "당사자들"이라 한다.)

1. 업무 범위

공급자는 다음의 서비스 및/또는 제품을 고객에게 제공한다:

${data.serviceDescription || "[서비스 내용 기재 필요]"}

공급자는 업계 표준에 부합하는 전문가적이고 숙련된 방식으로 서비스를 수행한다. 업무 범위의 변경은 양 당사자의 서면 합의를 요한다.

2. 결제 조건

총 대금: ${data.totalAmount || "[금액 기재 필요]"}

결제 일정: ${data.paymentTerms || "[결제 조건 기재 필요]"}

모든 청구서는 합의된 기한 내에 결제한다. 연체 시 월 1.5% 또는 법령이 허용하는 최고 한도 중 낮은 금액의 연체료가 부과될 수 있다.

3. 납기

납품일 / 계약 기간: ${data.deliveryDate || "[납기 기재 필요]"}

공급자는 상기 일정 준수를 위해 상업적으로 합리적인 노력을 한다. 고객의 사유로 인한 지연은 그만큼 일정이 연장된다.

4. 비밀유지

각 당사자는 본 계약과 관련하여 상대방으로부터 공개받은 모든 비공개 정보를 비밀로 유지한다. 본 의무는 계약 종료 후 3년간 존속한다.

5. 지식재산권

대금이 전액 지급되면 본 계약에 따라 고객을 위해 특별히 제작된 모든 산출물의 권리는 고객에게 귀속된다.

6. 계약 해지

각 당사자는 다음의 경우 본 계약을 해지할 수 있다:
(가) 편의에 의한 해지 — 30일 전 서면 통지
(나) 중대한 위반의 경우 — 서면 통지 후 15일 내 시정되지 않으면 즉시 해지
(다) 상대방이 지급불능 상태에 빠지거나 파산을 신청한 경우 — 즉시 해지

7. 책임 제한

어떠한 경우에도 양 당사자는 간접적, 부수적, 특별, 결과적 손해에 대해 책임지지 아니한다. 각 당사자의 총 책임은 본 계약에 따라 지급되었거나 지급될 총액을 초과하지 아니한다.

8. 독립 사업자

공급자는 독립 사업자이다. 본 계약은 당사자 간에 고용·동업·합작 관계를 형성하지 아니한다.

${data.additionalTerms && data.additionalTerms.trim() ? `9. 추가 조항\n\n${data.additionalTerms}\n\n` : ""}10. 일반 조항

본 계약은 본 건과 관련된 양 당사자 간의 모든 합의를 구성한다. 모든 변경은 서면으로 양 당사자가 서명해야 효력이 있다.

본 계약은 적용 법령에 따라 해석되며, 분쟁은 우선 신의성실에 입각한 협의로 해결한다.

11. 서명

아래에 서명함으로써 각 당사자는 본 계약 조건에 구속될 것에 동의한다.

공급자:                                    고객:

${(data.providerName || "[공급자명]").padEnd(40, " ")}   ${data.clientName || "[고객명]"}

서명: ____________________________         서명: ____________________________

이름: ____________________________         이름: ____________________________

직책: ____________________________         직책: ____________________________

날짜: ____________________________         날짜: ____________________________
`;
}

function generateContractFromDataEN(data: ExtractedQuote): string {
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
