"use client";

import * as React from "react";
import {
  BadgeCheck,
  BrainCircuit,
  CircleAlert,
  FileText,
  Link2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ==========================================================================
   AI governance primitives.

   Platform rule: nothing the AI produces may present itself as fact. Every AI
   output carries a confidence figure, its sources, and an explicit human
   decision. These components are the only sanctioned way to render AI output,
   so the rule is enforced by construction rather than by review.
   ========================================================================== */

export type Confidence = number; // 0..1

function confidenceTone(value: Confidence) {
  if (value >= 0.85) return { label: "high", color: "var(--success)" };
  if (value >= 0.6) return { label: "medium", color: "var(--warning)" };
  return { label: "low", color: "var(--danger)" };
}

/** Marks a surface as AI-derived. Never render AI text without one. */
export function AIBadge({
  confidence,
  model,
  className,
  compact,
}: {
  confidence?: Confidence;
  model?: string;
  className?: string;
  compact?: boolean;
}) {
  const t = useT();
  const tone = confidence !== undefined ? confidenceTone(confidence) : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-[var(--ai-border)] bg-ai-subtle px-2 py-0.5 text-xs font-medium text-ai",
            className,
          )}
        >
          <BrainCircuit className="h-3 w-3" />
          {!compact && <span>{t("ai.assisted")}</span>}
          {tone && confidence !== undefined && (
            <span className="tabular font-semibold" style={{ color: tone.color }}>
              {Math.round(confidence * 100)}%
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{t("ai.advisory")}</p>
        {model && (
          <p className="mt-1 text-foreground-muted">
            {t("ai.model")}: <span className="font-mono">{model}</span>
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/** Horizontal confidence meter with the numeric value beside it. */
export function ConfidenceMeter({
  value,
  className,
  showLabel = true,
}: {
  value: Confidence;
  className?: string;
  showLabel?: boolean;
}) {
  const t = useT();
  const tone = confidenceTone(value);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <span className="text-xs text-foreground-muted">{t("ai.confidence")}</span>
      )}
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.round(value * 100)}%`, background: tone.color }}
        />
      </div>
      <span className="tabular text-xs font-semibold" style={{ color: tone.color }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

export interface EvidenceSource {
  id: string;
  label: string;
  /** What kind of record this came from — shown as the chip icon. */
  type: "document" | "statement" | "cctv" | "call" | "transaction" | "forensic" | "circular";
  /** Page, timestamp or section inside the source. */
  locator?: string;
  href?: string;
}

/**
 * Source chips. Every AI statement links back to the evidence it came from —
 * an officer must be able to open the underlying record in one click.
 */
export function SourceCitations({
  sources,
  className,
  onOpen,
}: {
  sources: EvidenceSource[];
  className?: string;
  onOpen?: (source: EvidenceSource) => void;
}) {
  const t = useT();
  if (sources.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="text-xs text-foreground-subtle">{t("ai.sources")}:</span>
      {sources.map((source) => {
        const body = (
          <>
            <FileText className="h-3 w-3 shrink-0" />
            <span className="truncate">{source.label}</span>
            {source.locator && (
              <span className="font-mono text-[0.65rem] text-foreground-subtle">
                {source.locator}
              </span>
            )}
          </>
        );

        const classes =
          "inline-flex max-w-[14rem] items-center gap-1 rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-foreground-muted transition-colors hover:border-accent hover:text-accent";

        return source.href ? (
          <a key={source.id} href={source.href} className={classes}>
            {body}
          </a>
        ) : (
          <button
            key={source.id}
            type="button"
            className={classes}
            onClick={() => onOpen?.(source)}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}

export type ReviewState = "pending" | "accepted" | "rejected";

/**
 * The human-in-the-loop control. An AI finding is a lead until an officer
 * accepts it; nothing downstream may treat it as established before that.
 */
export function HumanApprovalBar({
  state,
  onAccept,
  onReject,
  decidedBy,
  decidedAt,
  className,
}: {
  state: ReviewState;
  onAccept: () => void;
  onReject: () => void;
  decidedBy?: string;
  decidedAt?: string;
  className?: string;
}) {
  const t = useT();

  if (state !== "pending") {
    const accepted = state === "accepted";
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-xs",
          accepted
            ? "border-success/30 bg-success-subtle text-success"
            : "border-danger/30 bg-danger-subtle text-danger",
          className,
        )}
      >
        {accepted ? <BadgeCheck className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
        <span className="font-medium">
          {accepted ? t("ai.approvedBy") : t("ai.rejectedBy")}
          {decidedBy ? `: ${decidedBy}` : ""}
        </span>
        {decidedAt && <span className="text-foreground-muted">· {decidedAt}</span>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--ai-border)] bg-ai-subtle px-3 py-2",
        className,
      )}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-ai">
        <ShieldQuestion className="h-4 w-4" />
        {t("ai.awaitingReview")}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onReject}>
          <ThumbsDown className="h-3.5 w-3.5" />
          {t("ai.rejectFinding")}
        </Button>
        <Button size="sm" onClick={onAccept}>
          <ThumbsUp className="h-3.5 w-3.5" />
          {t("ai.approveFinding")}
        </Button>
      </div>
    </div>
  );
}

/** Banner stating the platform's AI stance. Shown at the top of AI modules. */
export function AIGovernanceNotice({ className }: { className?: string }) {
  const t = useT();
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-md border border-[var(--ai-border)] bg-ai-subtle px-3 py-2 text-xs text-foreground-muted",
        className,
      )}
    >
      <BrainCircuit className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai" />
      <p>
        <span className="font-semibold text-ai">{t("ai.humanInLoop")}.</span>{" "}
        {t("ai.advisory")}.
      </p>
    </div>
  );
}

/* ==========================================================================
   Evidence integrity primitives (blockchain-anchored modules).
   ========================================================================== */

export type IntegrityState = "verified" | "pending" | "broken";

export function IntegrityBadge({
  state,
  hash,
  block,
  className,
  showHash = false,
}: {
  state: IntegrityState;
  hash?: string;
  block?: string | number;
  className?: string;
  showHash?: boolean;
}) {
  const t = useT();

  const config = {
    verified: { icon: ShieldCheck, color: "var(--chain-verified)", label: t("chain.verified") },
    pending: { icon: ShieldQuestion, color: "var(--chain-pending)", label: t("chain.pending") },
    broken: { icon: ShieldAlert, color: "var(--chain-broken)", label: t("chain.broken") },
  }[state];

  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}
          style={{ color: config.color }}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{config.label}</span>
          {showHash && hash && (
            <span className="font-mono text-[0.65rem] text-foreground-subtle">
              {hash.slice(0, 10)}…
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {hash && (
          <p className="font-mono text-[0.65rem] break-all">
            {t("chain.hash")}: {hash}
          </p>
        )}
        {block !== undefined && (
          <p className="mt-1 text-foreground-muted">
            {t("chain.blockHeight")} #{block}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/** Compact on-chain anchor chip for list rows. */
export function ChainAnchorChip({ block, className }: { block: string | number; className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-chain-verified/30 bg-success-subtle px-1.5 py-0.5 font-mono text-[0.65rem] text-chain-verified",
        className,
      )}
    >
      <Link2 className="h-3 w-3" />
      {t("chain.blockHeight")} #{block}
    </span>
  );
}
