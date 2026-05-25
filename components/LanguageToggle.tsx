"use client";
import { Globe } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

interface Props {
  className?: string;
}

export default function LanguageToggle({ className = "" }: Props) {
  const { lang, setLang } = useT();
  const toggle = () => setLang(lang === "en" ? "ko" : "en");

  return (
    <button
      onClick={toggle}
      title={lang === "en" ? "한국어로 보기" : "View in English"}
      className={`flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[#162035] ${className}`}
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{lang === "en" ? "한국어" : "EN"}</span>
    </button>
  );
}
