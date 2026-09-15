"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardCheck, Eye } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { BoardEntry, BoardStation } from "@/lib/api/missing-persons";
import { StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { GENDER, PRIORITY, VULNERABILITY } from "./labels";
import { PersonThumb } from "./photos";
import { CheckPill } from "./station-checks";
import { formatWhen } from "./shared";

/** "12 min ago" in the viewer's language. */
export function useTimeAgo() {
  const { t } = useI18n();
  return React.useCallback(
    (iso: string, now: number) => {
      const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
      if (minutes < 1) return t("missingBoard.board.ago.justNow");
      if (minutes < 60) return t("missingBoard.board.ago.minutes", { n: minutes });
      if (minutes < 48 * 60) return t("missingBoard.board.ago.hours", { n: Math.floor(minutes / 60) });
      return t("missingBoard.board.ago.days", { n: Math.floor(minutes / 1440) });
    },
    [t],
  );
}

export function BoardCard({
  entry: e,
  stations,
  myStation,
  isNew,
  now,
  onCheck,
}: {
  entry: BoardEntry;
  stations: BoardStation[];
  myStation: string | null;
  isNew?: boolean;
  now: number;
  onCheck?: () => void;
}) {
  const { t, pick } = useI18n();
  const ago = useTimeAgo();
  const [showStations, setShowStations] = React.useState(false);
  const checkedIds = new Set(e.checks.map((c) => c.stationId));
  const others = stations.filter((s) => s.id !== e.stationId);
  const pending = others.filter((s) => !checkedIds.has(s.id));
  const checkedCount = others.length - pending.length;
  const mine = e.checks.find((c) => c.stationId === myStation);
  const description = [e.height, e.complexion, e.identifyingMarks, e.lastSeenWearing].filter(Boolean).join(" · ");

  return (
    <article
      data-testid="board-card"
      data-report={e.reportNumber}
      className={
        isNew
          ? "flex h-full flex-col gap-3 rounded-lg border-2 border-warning bg-surface p-4"
          : e.priority === "CRITICAL"
            ? "flex h-full flex-col gap-3 rounded-lg border border-danger/50 bg-surface p-4"
            : "flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-4"
      }
    >
      <div className="flex gap-3">
        <Link href={`/missing-persons/${e.id}`} aria-label={`${t("missingBoard.board.openReport")}: ${e.personName}`}>
          <PersonThumb reportId={e.id} photoId={e.primaryPhotoId} size="lg" name={e.personName} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {isNew && <StatusPill tone="warning">{t("missingBoard.board.newBadge")}</StatusPill>}
            {e.priority !== "NORMAL" && <StatusPill tone={PRIORITY[e.priority].tone}>{pick(PRIORITY[e.priority])}</StatusPill>}
            {e.vulnerabilities.map((v) => (
              <StatusPill key={v} tone="warning">
                {pick(VULNERABILITY[v])}
              </StatusPill>
            ))}
            {e.status === "REPORTED" && <StatusPill tone="info">{t("missingBoard.board.notTakenUp")}</StatusPill>}
          </div>
          <h3 className="mt-1 truncate text-base font-semibold text-foreground">
            <Link href={`/missing-persons/${e.id}`} className="hover:underline">
              {e.personName}
            </Link>
          </h3>
          <p className="text-sm text-foreground-muted">
            {t("missingBoard.board.years", { age: e.age })} · {GENDER[e.gender] ? pick(GENDER[e.gender]) : e.gender} ·{" "}
            <span className="font-mono text-xs">{e.reportNumber}</span>
          </p>
          <p className="text-xs text-foreground-subtle">{t("missingBoard.board.lodged", { ago: ago(e.lodgedAt, now) })}</p>
        </div>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-foreground-subtle">{t("missingBoard.board.lastSeen")}</dt>
          <dd className="text-foreground">{e.lastSeenLocation}</dd>
          <dd className="text-xs text-foreground-muted">{formatWhen(e.lastSeenAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-foreground-subtle">{t("missingBoard.board.reportingStation")}</dt>
          <dd className="text-foreground">{e.stationName || "—"}</dd>
          <dd className="text-xs text-foreground-muted">
            {t("missingBoard.board.photoCount", { n: e.photoCount })} · {t("missingBoard.board.verifiedSightings", { n: e.verifiedSightings })}
          </dd>
        </div>
        {description && (
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-foreground-subtle">{t("missingBoard.board.descriptionLabel")}</dt>
            <dd className="text-foreground-muted">{description}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-col gap-2 rounded-md bg-background-secondary p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm text-foreground" data-testid="checks-summary">
            <ClipboardCheck className="h-4 w-4" />
            {t("missingBoard.board.checksSummary", { n: checkedCount, total: others.length })}
          </span>
          {mine ? (
            <span className="flex items-center gap-1.5 text-xs text-foreground-muted" data-testid="my-check">
              {t("missingBoard.board.ours")}: <CheckPill check={mine} />
            </span>
          ) : null}
        </div>
        <Button size="sm" variant="ghost" className="self-start" onClick={() => setShowStations((v) => !v)}>
          {showStations ? t("missingBoard.board.hideStations") : t("missingBoard.board.showStations")}
        </Button>
        {showStations && (
          <div className="flex flex-col gap-2" data-testid="station-states">
            {e.checks.length > 0 && (
              <ul className="flex flex-col gap-1">
                {e.checks.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-foreground">
                      {c.stationName}
                      {c.stationId === myStation && ` (${t("missingBoard.board.yourStation")})`}
                    </span>
                    <span className="flex items-center gap-2 text-foreground-subtle">
                      {c.recordedByName} · {ago(c.createdAt, now)}
                      <CheckPill check={c} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {pending.length === 0 ? (
              <p className="text-xs text-success">{t("missingBoard.board.allChecked")}</p>
            ) : (
              <div>
                <p className="mb-1 text-xs font-medium text-foreground-muted">{t("missingBoard.board.pendingStations", { n: pending.length })}</p>
                <div className="flex flex-wrap gap-1" data-testid="pending-stations">
                  {pending.map((s) => (
                    <span
                      key={s.id}
                      title={s.name}
                      className={
                        s.id === myStation
                          ? "rounded border border-warning bg-warning-subtle px-1.5 py-0.5 text-[11px] font-medium text-warning"
                          : "rounded border border-border px-1.5 py-0.5 text-[11px] text-foreground-muted"
                      }
                    >
                      {s.code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        {onCheck && e.stationId !== myStation && (
          <Button size="sm" onClick={onCheck} data-testid="record-check">
            <ClipboardCheck className="h-3.5 w-3.5" />
            {mine ? t("missingBoard.board.updateCheck") : t("missingBoard.board.recordCheck")}
          </Button>
        )}
        <Link href={`/missing-persons/${e.id}`}>
          <Button size="sm" variant="outline">
            <Eye className="h-3.5 w-3.5" />
            {t("missingBoard.board.openReport")}
          </Button>
        </Link>
      </div>
    </article>
  );
}
