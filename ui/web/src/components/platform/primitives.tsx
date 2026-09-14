"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { CountUp } from "@/components/reactbits";
import { ActionMenu, type Action } from "./actions";

/* ---------------------------------------------------------------- headings */

export function PageHeader({
  title,
  description,
  icon: Icon,
  breadcrumb,
  actions,
  menu,
  badge,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  breadcrumb?: { label: string; href?: string }[];
  /** Primary buttons. Each must navigate or open something. */
  actions?: React.ReactNode;
  /** Overflow actions for this screen. */
  menu?: Action[];
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-3", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-foreground-muted">
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <ChevronRight className="h-3 w-3 text-foreground-subtle" />}
              {crumb.href ? (
                <Link href={crumb.href} className="transition-colors hover:text-accent">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight text-foreground">{title}</h1>
              {badge}
            </div>
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-foreground-muted">{description}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {menu && menu.length > 0 && <ActionMenu actions={menu} label="Screen actions" />}
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------- stat tiles */

export function StatTile({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  icon: Icon,
  tone = "default",
  href,
  onClick,
  className,
  decimals = 0,
}: {
  label: string;
  value: number;
  unit?: string;
  /** Positive means "up"; the tile decides whether up is good via `tone`. */
  delta?: number;
  deltaLabel?: string;
  icon?: React.ElementType;
  tone?: "default" | "success" | "warning" | "danger" | "info" | "ai";
  href?: string;
  onClick?: () => void;
  className?: string;
  decimals?: number;
}) {
  const toneColor = {
    default: "var(--foreground)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    info: "var(--info)",
    ai: "var(--ai)",
  }[tone];

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 shrink-0" style={{ color: toneColor }} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold leading-none" style={{ color: toneColor }}>
          <CountUp to={value} decimals={decimals} />
        </span>
        {unit && <span className="text-xs text-foreground-muted">{unit}</span>}
      </div>
      {(delta !== undefined || deltaLabel) && (
        <p className="mt-1.5 text-xs text-foreground-muted">
          {delta !== undefined && (
            <span
              className={cn(
                "font-medium tabular",
                delta > 0 ? "text-danger" : delta < 0 ? "text-success" : "",
              )}
            >
              {delta > 0 ? "+" : ""}
              {delta}
              {unit === "%" ? "pp" : ""}
            </span>
          )}{" "}
          {deltaLabel}
        </p>
      )}
    </>
  );

  const shared = cn(
    "rounded-lg border border-border bg-surface p-4 text-left transition-colors",
    (href || onClick) && "hover:border-accent/50 hover:bg-surface-hover",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shared}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shared}>
        {body}
      </button>
    );
  }
  return <div className={shared}>{body}</div>;
}

/* ----------------------------------------------------------------- badges */

export type Severity = "low" | "medium" | "high" | "critical";

export function SeverityBadge({ level, className }: { level: Severity; className?: string }) {
  const { t } = useI18n();
  const color = `var(--sev-${level})`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        className,
      )}
      style={{ color, background: `color-mix(in oklab, ${color} 12%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {t(`severity.${level}` as const)}
    </span>
  );
}

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "ai";

const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-surface-sunken text-foreground-muted border-border",
  info: "bg-info-subtle text-info border-info/25",
  success: "bg-success-subtle text-success border-success/25",
  warning: "bg-warning-subtle text-warning border-warning/25",
  danger: "bg-danger-subtle text-danger border-danger/25",
  ai: "bg-ai-subtle text-ai border-[var(--ai-border)]",
};

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Delivery-phase marker, so stakeholders can see what ships when. */
export function PhaseBadge({ phase, className }: { phase: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.65rem] font-medium text-foreground-subtle",
        className,
      )}
    >
      P{String(phase).padStart(2, "0")}
    </span>
  );
}

/* ------------------------------------------------------------ empty states */

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-sunken text-foreground-subtle">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-foreground-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ panels */

export function Panel({
  title,
  description,
  actions,
  menu,
  children,
  className,
  bodyClassName,
  footer,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  menu?: Action[];
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface", className)}>
      {(title || actions || menu) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {actions}
            {menu && menu.length > 0 && <ActionMenu actions={menu} label="Panel actions" size="sm" />}
          </div>
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
      {footer && <footer className="border-t border-border px-4 py-3">{footer}</footer>}
    </section>
  );
}

/** Label/value row used throughout detail sheets. */
export function Field({
  label,
  value,
  className,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <dt className="text-xs uppercase tracking-wide text-foreground-subtle">{label}</dt>
      <dd className={cn("text-sm text-foreground", mono && "font-mono text-[0.8rem]")}>
        {value ?? "—"}
      </dd>
    </div>
  );
}
