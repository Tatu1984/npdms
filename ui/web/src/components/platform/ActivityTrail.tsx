"use client";

import * as React from "react";
import { Clock, Loader2 } from "lucide-react";

import { useMyActivity, useOfficerActivity } from "@/hooks/use-activity";
import type { ModuleTotal } from "@/lib/api/activity";

/** "9 min", "1 h 12 min" — a duration a person reads, not 5400 seconds. */
function spell(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

// Sections whose names are not what title-casing the path gives you. "Fir"
// is not a word; the register is the FIR.
const SPELT: Record<string, string> = {
  fir: "FIR & GD",
  gis: "Operational map",
  anpr: "Vehicle detection",
  ocr: "Document OCR",
  "ai-review": "AI review queue",
  "ai-oversight": "AI oversight",
  "ip-tracker": "Access log",
  "case-file": "Case file & court readiness",
  "cyber-crime": "Cyber & financial fraud",
  "cyber-intelligence": "Cyber intelligence",
  bodycam: "Body-worn camera",
  malkhana: "Malkhana",
  "face-recognition": "Face match review",
};

const moduleLabel = (module: string) =>
  SPELT[module] ?? module.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

function Bars({ modules, total }: { modules: ModuleTotal[]; total: number }) {
  if (modules.length === 0) return null;
  const widest = Math.max(...modules.map((m) => m.seconds), 1);
  return (
    <ul className="space-y-1.5">
      {modules.map((m) => (
        <li key={m.module} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm text-foreground">
            {moduleLabel(m.module)}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${Math.max(2, (m.seconds / widest) * 100)}%` }}
            />
          </span>
          <span className="w-24 shrink-0 text-right text-xs tabular-nums text-foreground-muted">
            {spell(m.seconds)}
          </span>
          <span className="w-16 shrink-0 text-right text-xs tabular-nums text-foreground-subtle">
            {m.visits} {m.visits === 1 ? "visit" : "visits"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Where an officer went in the platform.
 *
 * Pass an officerId to read somebody else's — which needs the
 * officers.activity.view permission, and the server refuses without it.
 * Omit it to read your own, which needs nothing: an officer being able to see
 * what is kept about them is part of being told it is kept.
 */
export function ActivityTrail({ officerId, days = 7 }: { officerId?: string; days?: number }) {
  const mine = useMyActivity(officerId ? 0 : days);
  const theirs = useOfficerActivity(officerId, days);
  const query = officerId ? theirs : mine;

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (query.isError) {
    return (
      <p className="text-sm text-foreground-muted">
        This trail is not available to you.
      </p>
    );
  }

  const report = query.data;
  const summary = report?.data;
  if (!summary) return null;

  const nothingYet = summary.modules.length === 0 && summary.archivedMonthly.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <Clock className="h-4 w-4 text-foreground-subtle" />
        <span className="text-sm font-medium text-foreground">
          {spell(summary.totalSeconds)} over the last {days} days
        </span>
      </div>

      {nothingYet ? (
        <p className="text-sm text-foreground-muted">
          Nothing recorded yet. Screens are recorded as they are opened.
        </p>
      ) : (
        <Bars modules={summary.modules} total={summary.totalSeconds} />
      )}

      {summary.recent.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
            Most recent
          </p>
          <ul className="divide-y divide-border rounded-md border border-border">
            {summary.recent.slice(0, 12).map((v, i) => (
              <li key={`${v.path}-${v.openedAt}-${i}`} className="flex items-center gap-3 px-3 py-1.5">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                  {v.path}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-foreground-muted">
                  {spell(v.seconds)}
                </span>
                <span className="shrink-0 text-xs text-foreground-subtle">
                  {new Date(v.openedAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.archivedMonthly.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
            Older than {report?.retention.detailDays ?? 90} days — monthly totals only
          </p>
          <Bars
            modules={summary.archivedMonthly}
            total={summary.archivedMonthly.reduce((n, m) => n + m.seconds, 0)}
          />
        </div>
      )}

      <p className="text-xs leading-relaxed text-foreground-subtle">
        {report?.retention.note}
      </p>
    </div>
  );
}

export default ActivityTrail;
