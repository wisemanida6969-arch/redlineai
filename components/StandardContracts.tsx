"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ExternalLink, Download, ChevronRight, Users, Lightbulb,
  PenLine, ScanSearch, Building2, ShieldCheck, Library,
  Scale, Calendar, Loader2, Lock,
} from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";
import {
  STANDARD_CONTRACTS, OFFICIAL_PORTALS, TOTAL_CONTRACT_COUNT, TOTAL_CATEGORY_COUNT,
  type Bi,
} from "@/lib/standardContracts";
import PassPurchaseButtons from "@/components/PassPurchaseButtons";
import { PADDLE_PRECEDENT_PASS_PRICE_ID } from "@/lib/paddle";

interface Props {
  /** Jump to the Draft (작성) tab seeded with this standard form */
  onDraft?: (categoryId: string, typeId: string) => void;
  /** Jump to the Review (검토) tab seeded with this standard form */
  onReview?: (categoryId: string, typeId: string) => void;
}

export default function StandardContracts({ onDraft, onReview }: Props) {
  const { t, lang } = useT();
  const L = (b: Bi) => (lang === "ko" ? b.ko : b.en);

  const [catId, setCatId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);

  const cat = STANDARD_CONTRACTS.find((c) => c.id === catId);
  const type = cat?.types.find((tt) => tt.id === typeId);

  /* ─────────────────────────  HEADER  ───────────────────────── */
  const Header = (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
          <Library className="w-5 h-5 text-red-400" />
        </div>
        <h2 className="text-white font-bold text-xl">{t("standard.title")}</h2>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">{t("standard.intro")}</p>
      <div className="mt-3 inline-flex items-center gap-2 text-xs text-yellow-300 bg-yellow-900/15 border border-yellow-700/30 rounded-lg px-3 py-1.5">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        {t("standard.poweredByGov")}
      </div>
    </div>
  );

  /* ─────────────────────────  DETAIL VIEW  ───────────────────────── */
  if (cat && type) {
    return (
      <div>
        {Header}

        <button
          onClick={() => setTypeId(null)}
          className="text-slate-400 hover:text-white text-sm mb-4 transition-colors"
        >
          {L({ ko: `← ${cat.title.ko}`, en: `← ${cat.title.en}` })}
        </button>

        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-5">
            <span className="text-3xl leading-none">{cat.emoji}</span>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-lg">{L(type.title)}</h3>
              <p className="text-slate-500 text-xs mt-1">
                {L(cat.ministryLabel)} · {cat.revised}
              </p>
            </div>
          </div>

          {/* When to use */}
          <div className="mb-4 bg-[#0f1a2e] border border-[#1e3050] rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> {t("standard.whenToUse")}
            </div>
            <p className="text-slate-300 text-sm">{L(type.desc)}</p>
          </div>

          {/* Parties */}
          <div className="mb-5 bg-[#0f1a2e] border border-[#1e3050] rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" /> {t("standard.partiesLabel")}
            </div>
            <p className="text-slate-300 text-sm">{L(type.parties)}</p>
          </div>

          {/* Actions */}
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">{t("standard.actionsTitle")}</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => onDraft?.(cat.id, type.id)}
              className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white rounded-xl p-4 text-left transition-colors"
            >
              <PenLine className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-sm">{t("standard.actionDraft")}</span>
            </button>
            <button
              onClick={() => onReview?.(cat.id, type.id)}
              className="flex items-center gap-3 bg-[#1e3050] hover:bg-[#26395c] text-white rounded-xl p-4 text-left transition-colors"
            >
              <ScanSearch className="w-5 h-5 shrink-0 text-red-400" />
              <span className="font-semibold text-sm">{t("standard.actionReview")}</span>
            </button>
          </div>

          {/* Official download */}
          <a
            href={cat.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 bg-yellow-900/15 hover:bg-yellow-900/25 border border-yellow-700/30 rounded-xl p-4 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Download className="w-5 h-5 text-yellow-300 shrink-0" />
              <div className="min-w-0">
                <p className="text-yellow-200 font-semibold text-sm">{t("standard.downloadOfficial")}</p>
                <p className="text-slate-500 text-xs truncate">{t("standard.officialSource")}: {L(cat.ministryLabel)}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-yellow-300 shrink-0" />
          </a>
        </div>

        <RelatedPrecedents field={cat.id} />

        <Disclaimer />
      </div>
    );
  }

  /* ─────────────────────────  TYPE LIST VIEW  ───────────────────────── */
  if (cat) {
    return (
      <div>
        {Header}

        <button
          onClick={() => setCatId(null)}
          className="text-slate-400 hover:text-white text-sm mb-4 transition-colors"
        >
          {t("standard.backToFields")}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl leading-none">{cat.emoji}</span>
          <div>
            <h3 className="text-white font-bold text-lg">{L(cat.title)}</h3>
            <p className="text-slate-500 text-xs">
              {cat.types.length}{t("standard.typesIn")} · {L(cat.ministryLabel)} · {cat.revised}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {cat.types.map((tt) => (
            <button
              key={tt.id}
              onClick={() => setTypeId(tt.id)}
              className="w-full text-left bg-[#162035] border border-[#1e3050] hover:border-red-700/50 rounded-xl p-4 flex items-center gap-4 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{L(tt.title)}</p>
                <p className="text-slate-500 text-xs truncate mt-0.5">{L(tt.desc)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 shrink-0 transition-colors" />
            </button>
          ))}
        </div>

        <Disclaimer />
      </div>
    );
  }

  /* ─────────────────────────  FIELD GRID VIEW  ───────────────────────── */
  return (
    <div>
      {Header}

      <p className="text-slate-500 text-xs mb-3">
        {TOTAL_CATEGORY_COUNT}{t("standard.fieldsLabel")} · {TOTAL_CONTRACT_COUNT}{t("standard.formsLabel")}
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {STANDARD_CONTRACTS.map((c) => (
          <button
            key={c.id}
            onClick={() => { setCatId(c.id); setTypeId(null); }}
            className="text-left bg-[#162035] border border-[#1e3050] hover:border-red-700/50 rounded-2xl p-5 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-3xl leading-none">{c.emoji}</span>
              <span className="text-[11px] font-bold text-red-400 bg-red-900/20 border border-red-800/40 rounded-full px-2.5 py-1 shrink-0">
                {c.types.length}{t("standard.formsLabel")}
              </span>
            </div>
            <h3 className="text-white font-bold text-base mb-1 group-hover:text-red-300 transition-colors">{L(c.title)}</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-2">{L(c.blurb)}</p>
            <p className="text-slate-600 text-[11px]">{t("standard.revisedLabel")}: {c.revised}</p>
          </button>
        ))}
      </div>

      <Disclaimer />
    </div>
  );

  /* ─────────────────────────  SHARED: DISCLAIMER + PORTALS  ───────────────────────── */
  function Disclaimer() {
    return (
      <div className="mt-6 space-y-3">
        <div className="bg-[#162035] border border-[#1e3050] rounded-xl p-4">
          <p className="text-slate-400 text-xs leading-relaxed">{t("standard.disclaimer")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={OFFICIAL_PORTALS.kawf} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs bg-[#162035] hover:bg-[#1e3050] border border-[#1e3050] rounded-lg px-3 py-2 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-yellow-400" /> {t("standard.officialPortalKawf")} <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
          <a href={OFFICIAL_PORTALS.mcst} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs bg-[#162035] hover:bg-[#1e3050] border border-[#1e3050] rounded-lg px-3 py-2 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-yellow-400" /> {t("standard.officialPortalMcst")} <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>
    );
  }
}

/* ─────────────────────────  RELATED PRECEDENTS  ───────────────────────── */

interface Precedent {
  id: string;
  case_no: string | null;
  court: string | null;
  decided_on: string | null;
  registered_on: string | null;
  title: string;
  summary: string | null;
  fields: string[];
  topics: string[];
  is_general: boolean;
  source_name: string;
  source_url: string;
  external_id: string | null;
}

interface LiveResult {
  externalId: string;
  caseNo: string | null;
  title: string;
  court: string | null;
  date: string | null;
  url: string;
  source: "law" | "copyright";
}

function LiveCard({ p }: { p: LiveResult }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<{ issue: string; summary: string } | null>(null);
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
      if (d && (d.issue || d.summary)) setDetail({ issue: d.issue || "", summary: d.summary || "" });
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

const FIELD_KEYWORD: Record<string, string> = {
  webtoon: "웹툰", art: "미술", film: "영화", performing: "공연", craft: "공예",
};

function RelatedPrecedents({ field }: { field: string }) {
  const { t } = useT();
  const [curated, setCurated] = useState<Precedent[]>([]);
  const [curatedLoading, setCuratedLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(FIELD_KEYWORD[field] ?? "");
  const [activeQuery, setActiveQuery] = useState(FIELD_KEYWORD[field] ?? "");
  const [live, setLive] = useState<LiveResult[]>([]);
  const [livePage, setLivePage] = useState(1);
  const [liveHasMore, setLiveHasMore] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveSource, setLiveSource] = useState<"law" | "copyright" | null>(null);
  const [searchedAs, setSearchedAs] = useState<string | null>(null);

  /* curated DB highlights (always available, includes cross-cutting cases) */
  useEffect(() => {
    let active = true;
    setCuratedLoading(true);
    fetch(`/api/precedents?field=${encodeURIComponent(field)}`)
      .then((r) => r.json())
      .then((d) => { if (active) setCurated(d.precedents ?? []); })
      .catch(() => { if (active) setCurated([]); })
      .finally(() => { if (active) setCuratedLoading(false); });
    return () => { active = false; };
  }, [field]);

  /* live search against the official precedent DB */
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

  /* reset + auto-search when the field changes */
  useEffect(() => {
    const kw = FIELD_KEYWORD[field] ?? "";
    setSearchInput(kw);
    setActiveQuery(kw);
    setLive([]);
    setLivePage(1);
    runSearch(kw, 1, false);
  }, [field, runSearch]);

  const submitSearch = () => { setActiveQuery(searchInput); runSearch(searchInput, 1, false); };

  // Dedupe live results against curated highlights — by brdctsno (copyright IDs are "c"-prefixed)
  // and by case number (covers the official law.go.kr source, which uses its own id space).
  const curatedIds = new Set(curated.map((c) => c.external_id).filter(Boolean));
  const curatedCaseNos = new Set(curated.map((c) => c.case_no).filter(Boolean));
  const liveDeduped = live.filter(
    (l) => !curatedIds.has(l.externalId.replace(/^c/, "")) && !(l.caseNo && curatedCaseNos.has(l.caseNo)),
  );

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-1">
        <Scale className="w-4 h-4 text-red-400" />
        <h3 className="text-white font-bold text-base">{t("standard.precedentsTitle")}</h3>
      </div>
      <p className="text-slate-400 text-xs mb-3">{t("standard.precedentsIntro")}</p>

      {/* Curated key precedents */}
      {!curatedLoading && curated.length > 0 && (
        <div className="space-y-2 mb-5">
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">{t("standard.precedentsKeyTitle")}</p>
          {curated.map((p) => (
            <div key={p.id} className="bg-[#162035] border border-[#1e3050] rounded-xl p-4">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-xs font-bold text-red-300 bg-red-900/20 border border-red-800/40 rounded px-2 py-0.5">
                  {p.case_no ? `${p.court ?? ""} ${p.case_no}`.trim() : t("standard.precedentsRef")}
                </span>
                {(p.decided_on || p.registered_on) && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500"><Calendar className="w-3 h-3" />{p.decided_on || p.registered_on}</span>
                )}
                {p.is_general && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-yellow-300 bg-yellow-900/20 border border-yellow-700/30 rounded px-1.5 py-0.5">{t("standard.precedentsGeneral")}</span>
                )}
              </div>
              <p className="text-white text-sm font-semibold mb-1">{p.title}</p>
              {p.summary && <p className="text-slate-400 text-xs leading-relaxed mb-2">{p.summary}</p>}
              <div className="flex justify-end">
                <a href={p.source_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium shrink-0">
                  {p.source_name} · {t("standard.precedentsSource")} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live search */}
      <div>
        <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-2">{t("standard.precedentsLiveTitle")}</p>
        <div className="flex gap-2 mb-3">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
            placeholder={t("standard.precedentsSearchPlaceholder")}
            className="flex-1 min-w-0 bg-[#0f1a2e] border border-[#1e3050] rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-red-700/50"
          />
          <button onClick={submitSearch} disabled={liveLoading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 text-white text-sm font-semibold px-4 rounded-lg shrink-0 transition-colors">
            {t("standard.precedentsSearchBtn")}
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
        ) : liveDeduped.length === 0 ? (
          <p className="text-slate-500 text-sm py-2">{t("standard.precedentsLiveNone")}</p>
        ) : (
          <div className="space-y-2">
            {liveDeduped.map((p) => (
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

      <p className="text-slate-500 text-[11px] leading-relaxed mt-4">{t("standard.precedentsDisclaimer")}</p>
    </div>
  );
}
