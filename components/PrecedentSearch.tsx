"use client";
import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Calendar, Loader2, Lock, Search } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";
import PassPurchaseButtons from "@/components/PassPurchaseButtons";
import { PADDLE_PRECEDENT_PASS_PRICE_ID } from "@/lib/paddle";

interface LiveResult {
  externalId: string;
  caseNo: string | null;
  title: string;
  court: string | null;
  date: string | null;
  url: string;
  source: "law" | "copyright";
}

/* One precedent card with a pass/membership-gated "판결요지" expand. */
function LiveCard({ p }: { p: LiveResult }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<{ issue: string; summary: string; body: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [locked, setLocked] = useState(false);

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (detail || loading) return;
    setLoading(true); setErr(false); setLocked(false);
    try {
      const r = await fetch(`/api/precedents/detail?id=${encodeURIComponent(p.externalId)}`);
      if (r.status === 403) { setLocked(true); return; }
      const d = await r.json();
      if (d?.locked) { setLocked(true); return; }
      if (d && (d.issue || d.summary || d.body)) setDetail({ issue: d.issue || "", summary: d.summary || "", body: d.body || "" });
      else setErr(true);
    } catch { setErr(true); } finally { setLoading(false); }
  };

  return (
    <div className="bg-[#162035] border border-[#1e3050] rounded-xl p-4">
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        {p.caseNo ? (
          <span className="text-xs font-bold text-red-300 bg-red-900/20 border border-red-800/40 rounded px-2 py-0.5">{p.court ? `${p.court} ` : ""}{p.caseNo}</span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300 bg-[#0f1a2e] border border-[#1e3050] rounded px-1.5 py-0.5">{p.court ?? t("standard.precedentsRef")}</span>
        )}
        {p.date && <span className="flex items-center gap-1 text-[11px] text-slate-500"><Calendar className="w-3 h-3" />{p.date}</span>}
      </div>
      <p className="text-white text-sm font-medium mb-2">{p.title}</p>

      {open && (
        <div className="mb-2 bg-[#0f1a2e] border border-[#1e3050] rounded-lg p-3">
          {locked ? (
            <div>
              <p className="text-yellow-300 text-xs font-bold mb-1 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> {t("standard.precedentsLockedTitle")}</p>
              <p className="text-slate-400 text-xs leading-relaxed mb-2">{t("standard.precedentsLockedBody")}</p>
              <PassPurchaseButtons feature="precedent" passPriceId={PADDLE_PRECEDENT_PASS_PRICE_ID} />
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 text-slate-500 text-xs"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("standard.precedentsSearching")}</div>
          ) : err || !detail ? (
            <p className="text-slate-500 text-xs">{t("standard.precedentsDetailNone")}</p>
          ) : (
            <div className="space-y-2">
              {detail.issue && (<div><p className="text-slate-400 text-[11px] font-bold mb-0.5">{t("standard.precedentsIssue")}</p><p className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">{detail.issue}</p></div>)}
              {detail.summary && (<div><p className="text-slate-400 text-[11px] font-bold mb-0.5">{t("standard.precedentsHolding")}</p><p className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">{detail.summary}</p></div>)}
              {!detail.issue && !detail.summary && detail.body && (<div><p className="text-slate-400 text-[11px] font-bold mb-0.5">{t("standard.precedentsBody")}</p><p className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">{detail.body}</p></div>)}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {p.source === "law" ? (
          <button onClick={toggle} className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium">
            {open ? t("standard.precedentsHide") : t("standard.precedentsViewHolding")}
          </button>
        ) : <span />}
        <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium shrink-0">
          {t("standard.precedentsSource")} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

interface Props {
  /** AI-suggested keyword chips (e.g. from a contract review). First is searched initially. */
  queries?: string[];
  /** Fallback initial query when no chips are given (e.g. a field keyword). */
  defaultQuery?: string;
}

/** Live court-precedent search (official MOLEG API → copyright.or.kr fallback). */
export default function PrecedentSearch({ queries, defaultQuery }: Props) {
  const { t } = useT();
  const chips = (queries ?? []).filter(Boolean).slice(0, 6);
  const initial = chips[0] || defaultQuery || "";
  const chipsKey = chips.join("|");

  const [searchInput, setSearchInput] = useState(initial);
  const [activeQuery, setActiveQuery] = useState(initial);
  const [live, setLive] = useState<LiveResult[]>([]);
  const [livePage, setLivePage] = useState(1);
  const [liveHasMore, setLiveHasMore] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveSource, setLiveSource] = useState<"law" | "copyright" | null>(null);
  const [searchedAs, setSearchedAs] = useState<string | null>(null);

  const runSearch = useCallback(async (query: string, page: number, append: boolean) => {
    if (!query.trim()) { setLive([]); setLiveHasMore(false); return; }
    setLiveLoading(true);
    try {
      const r = await fetch(`/api/precedents/search?q=${encodeURIComponent(query)}&page=${page}`);
      const d = await r.json();
      const results: LiveResult[] = d.results ?? [];
      const eff: string | undefined = d.effectiveQuery;
      setLive((prev) => (append ? [...prev, ...results] : results));
      setLiveHasMore(Boolean(d.hasMore));
      setLivePage(page);
      setLiveSource(d.source ?? null);
      if (!append) {
        if (eff && eff !== query) { setActiveQuery(eff); setSearchedAs(eff); }
        else setSearchedAs(null);
      }
    } catch {
      if (!append) { setLive([]); setLiveHasMore(false); }
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = chipsKey.split("|").filter(Boolean)[0] || defaultQuery || "";
    setSearchInput(init);
    setActiveQuery(init);
    setLive([]);
    setLivePage(1);
    runSearch(init, 1, false);
  }, [chipsKey, defaultQuery, runSearch]);

  const pick = (q: string) => { setSearchInput(q); setActiveQuery(q); runSearch(q, 1, false); };
  const submit = () => { setActiveQuery(searchInput); runSearch(searchInput, 1, false); };

  return (
    <div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => pick(c)}
              className={`text-xs font-medium rounded-full px-3 py-1 border transition-colors ${
                activeQuery === c
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-[#162035] text-slate-300 border-[#1e3050] hover:border-red-700/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder={t("standard.precedentsSearchPlaceholder")}
          className="flex-1 min-w-0 bg-[#0f1a2e] border border-[#1e3050] rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-red-700/50"
        />
        <button onClick={submit} disabled={liveLoading}
          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 text-white text-sm font-semibold px-4 rounded-lg shrink-0 transition-colors">
          <Search className="w-3.5 h-3.5" /> {t("standard.precedentsSearchBtn")}
        </button>
      </div>

      <div className="mb-3 bg-[#162035] border border-[#1e3050] rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-slate-400 text-xs flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-yellow-400 shrink-0" /> {t("standard.precedentsLockedBody")}</p>
        <PassPurchaseButtons feature="precedent" passPriceId={PADDLE_PRECEDENT_PASS_PRICE_ID} />
      </div>

      {searchedAs && (
        <p className="text-slate-500 text-[11px] mb-2">{t("standard.precedentsSearchedAs")}: ‘{searchedAs}’</p>
      )}

      {liveLoading && live.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("standard.precedentsSearching")}
        </div>
      ) : live.length === 0 ? (
        <p className="text-slate-500 text-sm py-2">{t("standard.precedentsLiveNone")}</p>
      ) : (
        <div className="space-y-2">
          {live.map((p) => (
            <LiveCard key={p.externalId} p={p} />
          ))}
          {liveHasMore && (
            <button onClick={() => runSearch(activeQuery, livePage + 1, true)} disabled={liveLoading}
              className="w-full bg-[#162035] hover:bg-[#1e3050] border border-[#1e3050] text-slate-300 text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
              {liveLoading && <Loader2 className="w-4 h-4 animate-spin" />} {t("standard.precedentsMore")}
            </button>
          )}
          <p className="text-slate-600 text-[11px] mt-1">
            {liveSource === "law" ? t("standard.precedentsLiveSourceLaw") : t("standard.precedentsLiveSource")}
          </p>
        </div>
      )}
    </div>
  );
}
