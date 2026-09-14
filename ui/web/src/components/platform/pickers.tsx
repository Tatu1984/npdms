"use client";

import * as React from "react";
import { Check, Search, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useOfficers } from "@/hooks/use-investigation";
import { evidenceApi, type EvidenceRecord } from "@/lib/api/evidence-register";
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
  const { data, isLoading } = useOfficers(search || undefined, stationId);

  const officers = (data ?? []).filter((o) => o.id !== excludeId);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
        <Input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
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

  const { data, isLoading } = useQuery({
    queryKey: ["evidence-register", search],
    queryFn: () => evidenceApi.list({ search: search || undefined, pageSize: 50 }),
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
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
