"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Lang, tKey } from "./translations";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<Ctx>({
  lang: "ko",
  setLang: () => {},
  t: (k) => k,
});

const STORAGE_KEY = "redlineai_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Korea-first product → default to Korean; users can switch to English via the toggle.
  const [lang, setLangState] = useState<Lang>("ko");

  /* Restore from localStorage on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "ko" || stored === "en") {
        setLangState(stored);
        document.documentElement.lang = stored;
        return;
      }
      // First visit — default Korean, but honour an explicitly English browser.
      const browser = navigator.language?.toLowerCase() ?? "";
      if (browser.startsWith("en")) {
        setLangState("en");
        document.documentElement.lang = "en";
      } else {
        document.documentElement.lang = "ko";
      }
    } catch { /* ignore */ }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch { /* ignore */ }
  }, []);

  const t = useCallback((key: string) => tKey(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}
