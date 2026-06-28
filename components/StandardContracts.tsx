"use client";
import { useState } from "react";
import {
  ExternalLink, Download, ChevronRight, Users, Lightbulb,
  PenLine, ScanSearch, Building2, ShieldCheck, Library,
} from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";
import {
  STANDARD_CONTRACTS, OFFICIAL_PORTALS, TOTAL_CONTRACT_COUNT, TOTAL_CATEGORY_COUNT,
  type Bi,
} from "@/lib/standardContracts";

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
