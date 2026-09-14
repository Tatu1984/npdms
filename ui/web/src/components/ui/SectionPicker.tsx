"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { BNS_SECTIONS, type LegalSection } from "@/lib/platform/wb";
import { Input } from "./input";
import { Button } from "./button";

interface SectionPickerProps {
  label?: string;
  value: string[];
  onChange: (sections: string[]) => void;
  error?: string;
}

const cite = (s: LegalSection) => `${s.act} ${s.code}`;

/**
 * Chooses the penal sections an FIR or case is registered under.
 *
 * The officer selects; nothing is suggested or scored. The reference list is
 * the BNS and IT Act sections in the platform data, searchable by title, code
 * or the IPC section it superseded. Anything not in the list — an NDPS or
 * Arms Act section, say — can be typed in as cited.
 */
export function SectionPicker({ label = "Sections *", value, onChange, error }: SectionPickerProps) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = BNS_SECTIONS.filter((s) => !value.includes(cite(s)));
    if (!q) return pool.slice(0, 8);
    return pool
      .filter(
        (s) =>
          cite(s).toLowerCase().includes(q) ||
          s.title.en.toLowerCase().includes(q) ||
          (s.legacyIpc ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, value]);

  const add = (section: string) => {
    const trimmed = section.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setQuery("");
  };

  const typed = query.trim();
  const typedIsNew = typed.length > 0 && !value.includes(typed) && matches.length === 0;

  return (
    <div className="space-y-2">
      <Input
        label={label}
        placeholder="Search by title, BNS code or old IPC section — e.g. theft, 303, IPC 420"
        value={query}
        onChange={(v: string) => setQuery(v)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (matches[0]) add(cite(matches[0]));
            else if (typed) add(typed);
          }
        }}
        icon={<Search className="h-4 w-4" />}
        error={error}
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((section) => (
            <span
              key={section}
              className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-accent/10 text-accent"
            >
              {section}
              <button
                type="button"
                aria-label={`Remove ${section}`}
                onClick={() => onChange(value.filter((s) => s !== section))}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border divide-y divide-border max-h-56 overflow-y-auto">
        {matches.map((s) => (
          <button
            key={cite(s)}
            type="button"
            onClick={() => add(cite(s))}
            className="w-full text-left px-3 py-2 hover:bg-background-tertiary flex items-center justify-between gap-3"
          >
            <span>
              <span className="font-mono text-sm text-foreground">{cite(s)}</span>
              <span className="text-sm text-foreground-muted ml-2">{s.title.en}</span>
            </span>
            {s.legacyIpc && <span className="text-xs text-foreground-muted whitespace-nowrap">was {s.legacyIpc}</span>}
          </button>
        ))}
        {typedIsNew && (
          <div className="px-3 py-2 flex items-center justify-between gap-3">
            <span className="text-sm text-foreground-muted">Not in the reference list</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => add(typed)}>
              <Plus className="h-4 w-4 mr-1" />
              Add “{typed}”
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
