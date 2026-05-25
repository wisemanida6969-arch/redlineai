"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

const STORAGE_KEY = "redlineai_disclaimer_dismissed";

export default function DisclaimerBanner() {
  const { t } = useT();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
  };

  // Avoid hydration mismatch — render nothing on server / before mount
  if (!mounted || !visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-900/90 backdrop-blur-sm border-b border-yellow-700/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
        <AlertTriangle className="w-3.5 h-3.5 text-yellow-300 shrink-0 hidden sm:block" />
        <p className="flex-1 text-yellow-100 text-[11px] sm:text-xs leading-snug">
          <span className="font-semibold">{t("disclaimer.title")}</span>{" "}
          <span className="text-yellow-200/90">{t("disclaimer.body")}</span>
        </p>
        <button
          onClick={dismiss}
          aria-label={t("disclaimer.dismiss")}
          className="shrink-0 p-1 rounded hover:bg-yellow-800/50 transition-colors text-yellow-300 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
