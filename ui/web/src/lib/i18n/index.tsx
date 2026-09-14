"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { en, type Dictionary } from "./dictionaries/en";
import { bn } from "./dictionaries/bn";

export type Locale = "en" | "bn";

export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
];

const dictionaries = { en, bn } as const;

/** Dot-path keys of the English dictionary, e.g. "modules.investigation". */
type Paths<T> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? `${K}.${Paths<T[K]>}`
    : K;
}[keyof T & string];

export type TranslationKey = Paths<Dictionary>;

function lookup(dict: unknown, path: string): string | undefined {
  const value = path
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined,
      dict,
    );
  return typeof value === "string" ? value : undefined;
}

/** Replaces {name} placeholders: t("common.lastDays", { n: 30 }) */
function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Pick the right side of a value that exists in both languages. */
  pick: <T>(value: { en: T; bn?: T }) => T;
  isBengali: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "kpdip.locale";

export function I18nProvider({
  children,
  defaultLocale = "en",
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Restore after mount so the server and first client render agree.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "bn") setLocaleState(stored);
    } catch {
      /* private mode or blocked storage — English is a fine default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* not fatal — the choice just will not survive a reload */
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const translated = lookup(dictionaries[locale], key) ?? lookup(en, key);
      return interpolate(translated ?? key, vars);
    },
    [locale],
  );

  const pick = useCallback(
    <T,>(value: { en: T; bn?: T }): T =>
      locale === "bn" && value.bn !== undefined ? value.bn : value.en,
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, pick, isBengali: locale === "bn" }),
    [locale, setLocale, t, pick],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Shorthand for the common case: const t = useT() */
export function useT() {
  return useI18n().t;
}
