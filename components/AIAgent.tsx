"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot, Send, Loader2, Paperclip, X, Plus, MessageSquare,
  AlertCircle, User, Copy, Check, Trash2, FileText, Sparkles, Mail
} from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

interface Props {
  onUsed?: () => void;
}

interface ConversationListItem {
  id: string;
  title: string;
  contract_filename: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export default function AIAgent({ onUsed }: Props = {}) {
  const { t, lang } = useT();

  /* Sidebar — conversation list */
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  /* Current conversation */
  const [messages, setMessages] = useState<Message[]>([]);
  const [contractFilename, setContractFilename] = useState<string | null>(null);
  const [hasContract, setHasContract] = useState(false);

  /* Composer */
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  /* Pending attached contract for *new* conversation */
  const [pendingContractText, setPendingContractText] = useState<string | null>(null);
  const [pendingContractFilename, setPendingContractFilename] = useState<string | null>(null);
  const [extractingFile, setExtractingFile] = useState(false);

  /* UI state */
  const [copiedMessageIdx, setCopiedMessageIdx] = useState<number | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Auto-scroll on new message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  /* Load conversations on mount */
  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/conversations");
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  /* Load messages when conversation changes */
  const loadConversation = useCallback(async (id: string) => {
    setActiveConvId(id);
    setError("");
    try {
      const res = await fetch(`/api/agent/conversations/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessages(data.messages ?? []);
      setContractFilename(data.conversation?.contractFilename ?? null);
      setHasContract(!!data.conversation?.hasContract);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  /* Auto-open most recent on mount */
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      loadConversation(conversations[0].id);
    }
  }, [conversations, activeConvId, loadConversation]);

  /* Start a brand new chat (or reset) */
  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setContractFilename(null);
    setHasContract(false);
    setPendingContractText(null);
    setPendingContractFilename(null);
    setInput("");
    setError("");
    setMobileSidebarOpen(false);
  };

  /* File attach — extract text via existing analyze pipeline */
  const handleFileSelect = async (f: File) => {
    setError("");
    const ext = f.name.toLowerCase();
    if (!ext.endsWith(".pdf") && !ext.endsWith(".docx") && !ext.endsWith(".txt")) {
      setError(t("agent.onlyPdfDocx"));
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError(t("agent.tooLarge"));
      return;
    }
    setExtractingFile(true);
    try {
      // Reuse existing extract-only endpoint via /api/agent/extract
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/agent/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extract failed");
      setPendingContractText(data.text);
      setPendingContractFilename(f.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read file");
    } finally {
      setExtractingFile(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setError("");
    setSending(true);

    // Optimistic UI
    const optimisticUser: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");

    try {
      let convId = activeConvId;

      /* If no active conv, create one first */
      if (!convId) {
        const createRes = await fetch("/api/agent/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractText: pendingContractText,
            contractFilename: pendingContractFilename,
          }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error || "Failed");
        convId = createData.conversation.id;
        setActiveConvId(convId);
        if (pendingContractFilename) {
          setContractFilename(pendingContractFilename);
          setHasContract(true);
        }
        // Clear pending — they're now in the DB
        setPendingContractText(null);
        setPendingContractFilename(null);
      }

      /* Send the message */
      const res = await fetch(`/api/agent/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("agent.failedSend"));

      setMessages((prev) => [...prev, { role: "assistant", content: data.assistant }]);
      onUsed?.();
      // Refresh sidebar (in case title changed)
      refreshConversations();
    } catch (e) {
      // Roll back optimistic user message
      setMessages((prev) => prev.slice(0, -1));
      setInput(message);
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("agent.deleteConfirm"))) return;
    try {
      await fetch(`/api/agent/conversations/${id}`, { method: "DELETE" });
      if (activeConvId === id) startNewChat();
      refreshConversations();
    } catch { /* ignore */ }
  };

  const copyMessage = (idx: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageIdx(idx);
    setTimeout(() => setCopiedMessageIdx(null), 1500);
  };

  /* Suggested prompts shown on empty chat */
  const suggestedPrompts = [
    t("agent.prompt1"),
    t("agent.prompt2"),
    t("agent.prompt3"),
    t("agent.prompt4"),
  ];

  const isEmpty = !activeConvId && messages.length === 0;

  return (
    <div>
      {/* Intro */}
      <div className="bg-gradient-to-br from-red-900/20 to-[#162035] border border-[#1e3050] rounded-2xl p-5 mb-6 flex items-start gap-3">
        <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">{t("agent.title")}</h3>
          <p className="text-slate-400 text-sm">{t("agent.intro")}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-4 min-h-[600px]">
        {/* Sidebar */}
        <div className={`${mobileSidebarOpen ? "block" : "hidden md:block"} bg-[#162035] border border-[#1e3050] rounded-2xl p-3 flex flex-col`}>
          <button
            onClick={startNewChat}
            className="flex items-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg mb-3 transition-colors"
          >
            <Plus className="w-4 h-4" /> {t("agent.newChat")}
          </button>

          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 px-1">
            {t("agent.yourChats")}
          </p>

          <div className="space-y-1 overflow-y-auto max-h-[480px]">
            {conversations.length === 0 ? (
              <p className="text-slate-500 text-xs px-1 py-4 text-center">{t("agent.noChats")}</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group rounded-lg flex items-center gap-1 transition-colors ${
                    activeConvId === c.id ? "bg-red-900/30" : "hover:bg-[#1e3050]"
                  }`}
                >
                  <button
                    onClick={() => { loadConversation(c.id); setMobileSidebarOpen(false); }}
                    className="flex-1 min-w-0 flex items-center gap-2 px-2.5 py-2 text-left"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-200 text-xs truncate">{c.title}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1.5"
                    title={t("agent.deleteChat")}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl flex flex-col min-h-[600px]">
          {/* Mobile sidebar toggle */}
          <div className="md:hidden p-3 border-b border-[#1e3050]">
            <button
              onClick={() => setMobileSidebarOpen((v) => !v)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {mobileSidebarOpen ? "✕" : t("agent.yourChats")}
            </button>
          </div>

          {/* Contract attached banner */}
          {(hasContract || pendingContractFilename) && (
            <div className="px-4 py-2.5 border-b border-[#1e3050] bg-[#0f1a2e] flex items-center gap-2 text-xs">
              <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-slate-400">{t("agent.contractAttached")}</span>
              <span className="text-white font-medium truncate flex-1">
                {pendingContractFilename || contractFilename}
              </span>
              {pendingContractFilename && (
                <button
                  onClick={() => { setPendingContractText(null); setPendingContractFilename(null); }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[600px]">
            {isEmpty && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                <div className="w-14 h-14 bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{t("agent.welcomeTitle")}</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-md">{t("agent.welcomeSub")}</p>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">{t("agent.suggested")}</p>
                <div className="grid sm:grid-cols-2 gap-2 max-w-lg w-full">
                  {suggestedPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      disabled={sending}
                      className="text-left text-slate-300 text-xs bg-[#0f1a2e] border border-[#1e3050] hover:border-red-700/50 hover:text-white rounded-lg p-3 transition-colors disabled:opacity-50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, idx) => (
                  <MessageBubble
                    key={idx}
                    msg={m}
                    youLabel={t("agent.you")}
                    assistantLabel={t("agent.assistant")}
                    copyLabel={t("agent.copy")}
                    copiedLabel={t("agent.copied")}
                    copied={copiedMessageIdx === idx}
                    onCopy={() => copyMessage(idx, m.content)}
                    t={t}
                  />
                ))}
                {sending && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm pl-11">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t("agent.thinking")}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-3 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Composer */}
          <div className="p-3 border-t border-[#1e3050]">
            <div className="flex items-end gap-2">
              {/* Attach (only when conversation is new + no contract yet) */}
              {!activeConvId && !pendingContractFilename && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={extractingFile || sending}
                    title={t("agent.attachContract")}
                    className="shrink-0 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white bg-[#0f1a2e] border border-[#1e3050] hover:border-slate-500 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {extractingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </button>
                </>
              )}

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t("agent.placeholder")}
                disabled={sending}
                rows={1}
                className="flex-1 bg-[#0f1a2e] border border-[#1e3050] rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-red-700/50 disabled:opacity-50 max-h-[120px]"
                style={{ minHeight: "40px" }}
              />

              <button
                onClick={() => sendMessage()}
                disabled={sending || !input.trim()}
                className="shrink-0 w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                title={t("agent.send")}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Email parsing helper ──────────────── */

interface ParsedEmail {
  to?: string;
  subject: string;
  body: string;
}

/**
 * Detect whether an AI message contains a draft email and parse it into
 * { to, subject, body }. Supports both English ("Subject:") and Korean
 * ("제목:") headers. Returns null if no email-like block is found.
 */
function parseEmail(content: string): ParsedEmail | null {
  if (!content) return null;

  // Look for a Subject / 제목 line (case-insensitive)
  const subjectMatch = content.match(/^[ \t]*(Subject|제목)[ \t]*[:：][ \t]*(.+)$/im);
  if (!subjectMatch) return null;

  const subject = subjectMatch[2].trim().slice(0, 200);
  const subjectLineIdx = content.indexOf(subjectMatch[0]);

  // Optional "To: ..." or "받는사람: ..." line near top
  let to: string | undefined;
  const toMatch = content.slice(0, subjectLineIdx + 200).match(
    /^[ \t]*(To|받는사람|수신자|받는\s*사람)[ \t]*[:：][ \t]*([^\n\r]+)/im
  );
  if (toMatch) {
    const candidate = toMatch[2].trim();
    // Extract first email address if present
    const emailMatch = candidate.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) to = emailMatch[0];
  }

  // Body = everything AFTER the subject line
  const afterSubject = content.slice(subjectLineIdx + subjectMatch[0].length).trim();

  if (!afterSubject || afterSubject.length < 10) return null;

  return { to, subject, body: afterSubject };
}

function openMailto(email: ParsedEmail) {
  const params = new URLSearchParams();
  params.set("subject", email.subject);
  params.set("body", email.body);
  const recipient = email.to ? encodeURIComponent(email.to) : "";
  // Manually build query string because URLSearchParams uses + for spaces;
  // some mail clients prefer %20 in the body.
  const query = `subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
  const url = `mailto:${recipient}?${query}`;
  window.location.href = url;
}

/* ──────────────── Message bubble ──────────────── */

function MessageBubble({
  msg, youLabel, assistantLabel, copyLabel, copiedLabel, copied, onCopy, t,
}: {
  msg: Message;
  youLabel: string;
  assistantLabel: string;
  copyLabel: string;
  copiedLabel: string;
  copied: boolean;
  onCopy: () => void;
  t: (key: string) => string;
}) {
  const isUser = msg.role === "user";
  const email = !isUser ? parseEmail(msg.content) : null;

  return (
    <div className={`flex gap-3 ${isUser ? "" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? "bg-red-900/40" : "bg-red-600/60"
      }`}>
        {isUser ? <User className="w-4 h-4 text-red-300" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold ${isUser ? "text-red-300" : "text-white"}`}>
            {isUser ? youLabel : assistantLabel}
          </span>
        </div>

        <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser ? "text-slate-200" : "text-slate-100"
        }`}>
          {msg.content}
        </div>

        {!isUser && (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <button
              onClick={onCopy}
              className="text-slate-500 hover:text-white text-xs inline-flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? copiedLabel : copyLabel}
            </button>

            {email && (
              <button
                onClick={() => openMailto(email)}
                title={t("agent.emailHint")}
                className="text-red-400 hover:text-red-300 text-xs inline-flex items-center gap-1.5 font-medium bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 rounded-md px-2.5 py-1 transition-colors"
              >
                <Mail className="w-3 h-3" />
                {t("agent.sendEmail")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
