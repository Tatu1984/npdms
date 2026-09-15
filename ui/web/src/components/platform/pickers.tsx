"use client";

import * as React from "react";
import { Check, FileText, FolderOpen, Search, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useOfficers } from "@/hooks/use-investigation";
import custodyApi, { type EvidenceRecord } from "@/lib/api/custody";
import { casesApi } from "@/lib/api/cases";
import { firsApi } from "@/lib/api/firs";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "./primitives";

/**
 * OfficerPicker — choose an officer from the directory rather than pasting a
 * UUID. Shows rank, badge and how many cases the officer already carries, so
 * the person assigning can see the load before adding to it.
 */
export function OfficerPicker({
  value,
  onChange,
  stationId,
  excludeId,
  emptyLabel = "No officer selected",
}: {
  value?: string;
  onChange: (officerId: string, name: string) => void;
  stationId?: string;
  /** Omit someone from the list, e.g. the current holder when reassigning. */
  excludeId?: string;
  emptyLabel?: string;
}) {
  const [search, setSearch] = React.useState("");
  const { data, isLoading, isError, error } = useOfficers(search || undefined, stationId);

  const officers = (data ?? []).filter((o) => o.id !== excludeId);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
        <Input
          value={search}
          onChange={(v: string) => setSearch(v)}
          placeholder="Search by name or badge number…"
          className="pl-9"
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-md border border-border">
        {isLoading ? (
          <div className="flex flex-col gap-1 p-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="px-3 py-6 text-center text-sm text-danger">
            The officer directory could not be loaded
            {error instanceof Error ? `: ${error.message}` : ""}
          </p>
        ) : officers.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-foreground-muted">
            {search ? "No officer matches that search" : emptyLabel}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {officers.map((o) => {
              const selected = o.id === value;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => onChange(o.id, o.name)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-hover",
                      selected && "bg-accent-subtle",
                    )}
                  >
                    <UserRound
                      className={cn(
                        "h-4 w-4 shrink-0",
                        selected ? "text-accent" : "text-foreground-subtle",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{o.name}</span>
                      <span className="block truncate text-xs text-foreground-subtle">
                        {o.roleLabel}
                        {o.badgeNumber ? ` · ${o.badgeNumber}` : ""}
                        {o.stationName ? ` · ${o.stationName}` : ""}
                      </span>
                    </span>
                    {o.openCases > 0 && (
                      <StatusPill tone={o.openCases > 5 ? "warning" : "neutral"}>
                        {o.openCases} open
                      </StatusPill>
                    )}
                    {selected && <Check className="h-4 w-4 shrink-0 text-accent" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * EvidencePicker — choose from the evidence register. Items already attached to
 * this workspace are shown as such and cannot be picked twice.
 */
export function EvidencePicker({
  value,
  onChange,
  alreadyLinked = [],
}: {
  value?: string;
  onChange: (evidenceId: string, label: string) => void;
  alreadyLinked?: string[];
}) {
  const { t } = useI18n();
  const [search, setSearch] = React.useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["evidence-register", search],
    // The Phase 02 register searches server-side; GET /evidence ignores search.
    queryFn: () => custodyApi.list({ search: search || undefined, pageSize: 50 }),
    staleTime: 60 * 1000,
  });

  const records: EvidenceRecord[] = data?.data ?? [];
  const linked = new Set(alreadyLinked);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
        <Input
          value={search}
          onChange={(v: string) => setSearch(v)}
          placeholder="Search the evidence register…"
          className="pl-9"
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-md border border-border">
        {isLoading ? (
          <div className="flex flex-col gap-1 p-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="px-3 py-6 text-center text-sm text-danger">
            The evidence register could not be loaded
            {error instanceof Error ? `: ${error.message}` : ""}
          </p>
        ) : records.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-foreground-muted">
            {search
              ? "Nothing in the register matches that search"
              : "The evidence register is empty. Register an item first."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {records.map((e) => {
              const isLinked = linked.has(e.id);
              const selected = e.id === value;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    disabled={isLinked}
                    onClick={() => onChange(e.id, e.evidenceNumber || e.description)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                      isLinked
                        ? "cursor-not-allowed opacity-55"
                        : "hover:bg-surface-hover",
                      selected && "bg-accent-subtle",
                    )}
                  >
                    <ShieldCheck
                      className={cn(
                        "h-4 w-4 shrink-0",
                        selected ? "text-accent" : "text-foreground-subtle",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">
                        {e.description || "Evidence item"}
                      </span>
                      <span className="block truncate font-mono text-xs text-foreground-subtle">
                        {e.evidenceNumber}
                        {e.evidenceType ? ` · ${e.evidenceType}` : ""}
                      </span>
                    </span>
                    {isLinked ? (
                      <StatusPill tone="success">Attached</StatusPill>
                    ) : (
                      selected && <Check className="h-4 w-4 shrink-0 text-accent" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="text-xs text-foreground-subtle">{t("common.showing")} {records.length}</p>
    </div>
  );
}

export type RecordLink =
  | { kind: "case"; id: string; firId: string; label: string }
  | { kind: "fir"; id: string; label: string };

/**
 * RecordLinkPicker — link an item to a case or a FIR chosen from the registers.
 * Choosing a case also carries its FIR, since every case is registered from one.
 */
export function RecordLinkPicker({
  value,
  onChange,
}: {
  value: RecordLink | null;
  onChange: (link: RecordLink | null) => void;
}) {
  const [kind, setKind] = React.useState<"case" | "fir">(value?.kind ?? "case");
  const [search, setSearch] = React.useState("");

  const cases = useQuery({
    queryKey: ["cases", "link-picker", search],
    queryFn: () => casesApi.list({ search: search || undefined, pageSize: 20 }),
    enabled: kind === "case" && !value,
  });
  const firs = useQuery({
    queryKey: ["firs", "link-picker", search],
    queryFn: () => firsApi.list({ search: search || undefined, pageSize: 20 }),
    enabled: kind === "fir" && !value,
  });

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
        <span className="flex min-w-0 items-center gap-2">
          {value.kind === "case" ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-accent" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-accent" />
          )}
          <span className="truncate text-sm text-foreground">{value.label}</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-accent hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  const active = kind === "case" ? cases : firs;
  const rows =
    kind === "case"
      ? (cases.data?.data ?? []).map((c) => ({
          id: c.id,
          primary: c.caseNumber,
          secondary: [c.firNumber && `FIR ${c.firNumber}`, c.title].filter(Boolean).join(" · "),
          pick: (): RecordLink => ({
            kind: "case",
            id: c.id,
            firId: c.firId,
            label: [c.caseNumber, c.firNumber && `FIR ${c.firNumber}`, c.title].filter(Boolean).join(" · "),
          }),
        }))
      : (firs.data?.data ?? []).map((f) => ({
          id: f.id,
          primary: f.firNumber,
          secondary: [f.complainantName, f.stationName].filter(Boolean).join(" · "),
          pick: (): RecordLink => ({ kind: "fir", id: f.id, label: `FIR ${f.firNumber} · ${f.complainantName}` }),
        }));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 rounded-md border border-border p-0.5 text-xs">
        {(["case", "fir"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "flex-1 rounded px-2 py-1 transition-colors",
              kind === k ? "bg-accent-subtle text-accent" : "text-foreground-muted hover:bg-surface-hover",
            )}
          >
            {k === "case" ? "Case" : "FIR"}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
        <Input
          value={search}
          onChange={(v: string) => setSearch(v)}
          placeholder={kind === "case" ? "Search case number or title…" : "Search FIR number or complainant…"}
          className="pl-9"
        />
      </div>
      <div className="max-h-48 overflow-y-auto rounded-md border border-border">
        {active.isLoading ? (
          <div className="flex flex-col gap-1 p-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : active.isError ? (
          <p className="px-3 py-4 text-center text-sm text-danger">
            {active.error instanceof Error ? active.error.message : "The register could not be loaded"}
          </p>
        ) : rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-foreground-muted">
            {search ? "Nothing matches that search" : "The register is empty"}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onChange(r.pick())}
                  className="flex w-full flex-col px-3 py-2 text-left transition-colors hover:bg-surface-hover"
                >
                  <span className="font-mono text-sm text-foreground">{r.primary}</span>
                  {r.secondary && <span className="truncate text-xs text-foreground-subtle">{r.secondary}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
