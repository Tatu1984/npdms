"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Loader2, Plus, Search, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { useI18n } from "@/lib/i18n";
import { useDebounced, useSectionSearch } from "@/hooks/use-legal";
import { BNS_COMMENCEMENT, type LegalSection } from "@/lib/api/legal";

interface SectionPickerProps {
  label?: string;
  value: string[];
  onChange: (sections: string[]) => void;
  error?: string;
  /** "YYYY-MM-DD…". IPC applies to offences before 1 July 2024; later dates get a warning. */
  incidentDate?: string;
}

const isIpc = (cite: string) => /^IPC\s/i.test(cite.trim());

/**
 * Chooses the sections an FIR or case is registered under, from the statute
 * library on the server: every section of the BNS, BNSS, BSA and IPC and the
 * special Acts, searchable by number ("303"), heading ("theft") or citation
 * ("IPC 420"). An IPC section shows the BNS provision that replaced it, per the
 * BPR&D correspondence table. The officer selects; nothing is scored or
 * suggested unasked. A citation not in the library can still be typed in, and
 * SP and above add missing sections in Settings → Legal sections.
 */
export function SectionPicker({ label, value, onChange, error, incidentDate }: SectionPickerProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 250);
  const search = useSectionSearch(debounced);
  const typed = query.trim();
  const results = (search.data ?? []).filter((s) => !value.includes(s.cite));

  const add = (cite: string) => {
    const trimmed = cite.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setQuery("");
  };

  const afterCommencement = Boolean(incidentDate) && (incidentDate as string).slice(0, 10) >= BNS_COMMENCEMENT;
  const ipcChosen = value.some(isIpc);
  const settled = typed !== "" && debounced.trim() === typed && !search.isFetching;

  return (
    <div className="space-y-2">
      <Input
        label={label ?? t("legalScreen.picker.label")}
        placeholder={t("legalScreen.picker.placeholder")}
        value={query}
        autoComplete="off"
        onChange={(v: string) => setQuery(v)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (results[0] && settled) add(results[0].cite);
          }
        }}
        icon={<Search className="h-4 w-4" />}
        error={error}
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="chosen-sections">
          {value.map((section) => (
            <span
              key={section}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm ${
                isIpc(section) ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent"
              }`}
            >
              {section}
              {isIpc(section) && <span className="text-[10px]">· {t("legalScreen.picker.ipcBefore")}</span>}
              <button
                type="button"
                aria-label={t("legalScreen.picker.remove", { cite: section })}
                onClick={() => onChange(value.filter((s) => s !== section))}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {ipcChosen && afterCommencement && (
        <p className="flex items-start gap-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("legalScreen.picker.ipcAfterWarning")}
        </p>
      )}

      {typed !== "" && (
        <div
          className="max-h-72 divide-y divide-border overflow-y-auto rounded-lg border border-border"
          data-testid="section-results"
        >
          {search.isFetching && results.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-foreground-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("legalScreen.picker.searching")}
            </div>
          )}
          {search.isError && <div className="px-3 py-2 text-sm text-error">{t("legalScreen.picker.loadFailed")}</div>}
          {results.map((s) => (
            <SectionRow key={s.id} section={s} chosen={value} onAdd={add} />
          ))}
          {settled && results.length === 0 && !search.isError && (
            <div className="space-y-2 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-foreground-muted">{t("legalScreen.picker.noMatch", { q: typed })}</span>
                <Button type="button" variant="secondary" size="sm" onClick={() => add(typed)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("legalScreen.picker.addTyped", { q: typed })}
                </Button>
              </div>
              <Link href="/settings/legal" className="text-xs text-accent hover:underline">
                {t("legalScreen.picker.addInSettings")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionRow({
  section: s,
  chosen,
  onAdd,
}: {
  section: LegalSection;
  chosen: string[];
  onAdd: (cite: string) => void;
}) {
  const { t } = useI18n();
  const ipc = s.actCode === "IPC";
  // Sub-section the officer typed, e.g. "(4)" for "BNS 318(4)".
  const sub = s.cite.endsWith(s.number) ? "" : s.cite.slice(s.cite.lastIndexOf(s.number) + s.number.length);
  const classified = s.classification.find((c) => !sub || c.ref.startsWith(s.number + sub)) ?? null;

  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2 hover:bg-background-tertiary">
      <button type="button" onClick={() => onAdd(s.cite)} className="min-w-0 flex-1 text-left" data-cite={s.cite}>
        <span className="font-mono text-sm text-foreground">{s.cite}</span>
        <span className="ml-2 text-sm text-foreground-muted">{s.heading}</span>
        <span className="mt-0.5 block text-xs text-foreground-subtle">
          {s.actShortName}
          {ipc && ` · ${t("legalScreen.picker.ipcBefore")}`}
          {s.status === "repealed" && ` · ${t("legalScreen.picker.repealed")}`}
          {!s.isBuiltin && ` · ${t("legalScreen.picker.custom")}`}
          {classified && ` · ${t("legalScreen.picker.classification", { c: classified.cognizable, b: classified.bailable })}`}
        </span>
      </button>
      {s.equivalents.length > 0 && (
        <div className="flex max-w-[45%] flex-col items-end gap-1 text-right">
          <span className="text-[11px] text-foreground-muted">
            {ipc ? t("legalScreen.picker.bnsEquivalent") : t("legalScreen.picker.replacesIpc")}
          </span>
          <div className="flex flex-wrap justify-end gap-1">
            {s.equivalents.map((e) =>
              ipc ? (
                <button
                  key={e.citation}
                  type="button"
                  disabled={chosen.includes(e.citation)}
                  onClick={() => onAdd(e.citation)}
                  title={e.subject}
                  className="inline-flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 font-mono text-xs text-accent hover:bg-accent/20 disabled:opacity-50"
                  data-equivalent={e.citation}
                >
                  <ArrowRight className="h-3 w-3" />
                  {t("legalScreen.picker.useEquivalent", { cite: e.citation })}
                </button>
              ) : (
                <span key={e.citation} title={e.subject} className="font-mono text-xs text-foreground-muted">
                  {e.citation}
                </span>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
