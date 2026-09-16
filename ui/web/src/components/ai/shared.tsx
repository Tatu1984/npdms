"use client";

import * as React from "react";
import { FileText, ShieldAlert } from "lucide-react";
import { StatusPill } from "@/components/platform/primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import type { Role } from "@/types";
import type {
  AIDecisionPriority,
  AIDecisionStatus,
  AIDecisionType,
  AISource,
} from "@/lib/api/ai-review";

export const selectClass =
  "h-9 rounded-md border border-border bg-background-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

/**
 * The role floors the API enforces, mirrored so the screen hides what an
 * officer cannot use. The API remains the authority: a 403 is still handled.
 */
export function useAIOfficer() {
  const { user } = useAuthStore();
  const role = (user?.role ?? "CONSTABLE") as Role;
  return {
    user,
    /** Registry, evaluations, module switches, acceptance and the gateway. */
    canOversee: Boolean(user && hasMinimumRole(role, "DSP")),
    /** Register a model, record an evaluation, switch a model on. */
    canGovern: Boolean(user && hasMinimumRole(role, "SP")),
  };
}

/** A fraction from the API shown as a percentage. */
export function pct(value: number | null | undefined, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}

export function DecisionStatusPill({ value }: { value: AIDecisionStatus }) {
  const { t } = useI18n();
  const tone =
    value === "APPROVED"
      ? "success"
      : value === "REJECTED"
        ? "danger"
        : value === "OVERRIDDEN"
          ? "warning"
          : value === "EXPIRED"
            ? "neutral"
            : "info";
  return <StatusPill tone={tone}>{t(`aiScreen.status.${value}`)}</StatusPill>;
}

export function PriorityPill({ value }: { value: AIDecisionPriority }) {
  const { t } = useI18n();
  const tone = value === "CRITICAL" ? "danger" : value === "HIGH" ? "warning" : value === "MEDIUM" ? "info" : "neutral";
  return <StatusPill tone={tone}>{t(`aiScreen.priority.${value}`)}</StatusPill>;
}

export function DecisionTypePill({ value }: { value: AIDecisionType }) {
  const { t } = useI18n();
  return <StatusPill tone="ai">{t(`aiScreen.types.${value}`)}</StatusPill>;
}

/**
 * Confidence against the model's own threshold. Both numbers are shown: a
 * score on its own says nothing without the bar it had to clear.
 */
export function ConfidenceMeter({
  confidence,
  threshold,
  className,
}: {
  confidence: number;
  threshold: number;
  className?: string;
}) {
  const { t } = useI18n();
  const below = threshold > 0 && confidence < threshold;
  return (
    <div className={cn("min-w-[9rem]", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-foreground-subtle">{t("aiScreen.decision.confidence")}</span>
        <span className={cn("font-mono text-sm font-medium", below ? "text-warning" : "text-foreground")}>{pct(confidence, 1)}</span>
      </div>
      <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className={cn("h-full rounded-full", below ? "bg-warning" : "bg-ai")}
          style={{ width: `${Math.min(100, Math.max(0, confidence * 100))}%` }}
        />
        {threshold > 0 && (
          <span
            aria-hidden
            className="absolute top-0 h-full w-px bg-foreground-subtle"
            style={{ left: `${Math.min(100, Math.max(0, threshold * 100))}%` }}
          />
        )}
      </div>
      <p className="mt-1 text-xs text-foreground-muted">
        {t("aiScreen.decision.threshold")} {pct(threshold, 1)}
        {below ? ` · ${t("aiScreen.decision.belowThreshold")}` : ""}
      </p>
    </div>
  );
}

/**
 * The record text a suggestion relied on. This is the heart of the review
 * screen: the officer checks the model against the text, not against the
 * score, so an absent source is stated rather than left blank.
 */
export function SourceList({ sources }: { sources: AISource[] | null | undefined }) {
  const { t } = useI18n();

  if (!sources || sources.length === 0) {
    return (
      <Alert variant="warning">
        <ShieldAlert />
        <div>
          <AlertTitle>{t("aiScreen.decision.noSources")}</AlertTitle>
          <AlertDescription>{t("aiScreen.decision.noSourcesBody")}</AlertDescription>
        </div>
      </Alert>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {sources.map((source, i) => (
        <li key={`${source.recordType}-${source.recordId ?? i}`} className="rounded-md border border-border bg-surface-sunken p-3">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-foreground-subtle" />
            <StatusPill>{source.recordType}</StatusPill>
            {source.reference && <span className="font-mono text-xs text-foreground-muted">{source.reference}</span>}
          </div>
          {source.excerpt ? (
            <blockquote className="mt-2 border-l-2 border-ai/40 pl-3 text-sm leading-relaxed text-foreground">
              {source.excerpt}
            </blockquote>
          ) : (
            <p className="mt-2 text-sm text-foreground-muted">{t("aiScreen.decision.noExcerpt")}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Short, local date and time; the API sends RFC 3339. */
export function stamp(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** "3 h", "2 d" — how long a suggestion has been waiting. */
export function age(value?: string | null) {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}

export function isOverdue(dueBy?: string | null) {
  if (!dueBy) return false;
  const due = new Date(dueBy).getTime();
  return !Number.isNaN(due) && due < Date.now();
}
