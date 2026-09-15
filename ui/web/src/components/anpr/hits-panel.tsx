"use client";

import * as React from "react";
import Link from "next/link";
import { BellRing, Check, Eye, Loader2, ShieldQuestion, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, Panel, StatusPill } from "@/components/platform/primitives";
import { useHits, useOpenAnalysis, useReviewHit } from "@/hooks/use-anpr";
import type { Analysis, HitStatus, WatchlistHit } from "@/lib/api/anpr";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { FrameViewer, LabeledField, Pager, PlateReadSummary, errorText, textareaClass } from "./shared";

const PAGE_SIZE = 10;
const STATUSES: ("" | HitStatus)[] = ["PENDING", "CONFIRMED", "DISMISSED", ""];

export function HitsPanel({ userId, canReview }: { userId?: string; canReview: boolean }) {
  const { t } = useI18n();
  const [status, setStatus] = React.useState<"" | HitStatus>("PENDING");
  const [page, setPage] = React.useState(1);
  const hits = useHits(status, page, PAGE_SIZE);
  const review = useReviewHit();
  const open = useOpenAnalysis();

  const [decision, setDecision] = React.useState<{ hit: WatchlistHit; kind: "CONFIRMED" | "DISMISSED" } | null>(null);
  const [note, setNote] = React.useState("");
  const [viewing, setViewing] = React.useState<WatchlistHit | null>(null);
  const [viewPurpose, setViewPurpose] = React.useState("");
  const [opened, setOpened] = React.useState<{ hit: WatchlistHit; analysis: Analysis } | null>(null);
  const rows = hits.data?.data ?? [];

  const decide = async () => {
    if (!decision) return;
    try {
      const h = await review.mutateAsync({ id: decision.hit.id, decision: decision.kind, note: note.trim() });
      toast.success(
        h.status === "CONFIRMED" ? t("anprScreen.hits.confirmed") : t("anprScreen.hits.dismissed"),
        h.alertId ? t("anprScreen.hits.alertRaised") : undefined,
      );
      setDecision(null);
      setNote("");
    } catch (e) {
      toast.error(decision.hit.hitNumber, errorText(e));
    }
  };

  const openFrame = async () => {
    if (!viewing) return;
    try {
      const analysis = await open.mutateAsync({ id: viewing.read.analysisId, purpose: viewPurpose.trim() });
      setOpened({ hit: viewing, analysis });
      setViewing(null);
      setViewPurpose("");
    } catch (e) {
      toast.error(viewing.read.analysisNumber, errorText(e));
    }
  };

  const frame = opened?.analysis.frames?.find((f) => f.id === opened.hit.read.frameId);

  return (
    <Panel
      title={t("anprScreen.hits.title")}
      description={t("anprScreen.hits.description")}
      actions={
        <div className="flex gap-1" role="tablist">
          {STATUSES.map((s) => (
            <button
              key={s || "ALL"}
              type="button"
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={
                status === s
                  ? "rounded-md border border-accent bg-accent/10 px-2 py-1 text-xs font-medium text-accent"
                  : "rounded-md border border-border px-2 py-1 text-xs text-foreground-muted hover:bg-surface-hover"
              }
            >
              {t(`anprScreen.hits.status.${s || "ALL"}` as const)}
            </button>
          ))}
        </div>
      }
    >
      {hits.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : hits.isError ? (
        <div className="flex items-center justify-between text-sm text-danger">
          {t("anprScreen.common.loadFailed")}: {errorText(hits.error)}
          <Button size="sm" variant="outline" onClick={() => hits.refetch()}>{t("anprScreen.common.retry")}</Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ShieldQuestion} title={t("anprScreen.hits.empty")} />
      ) : (
        <ul className="flex flex-col gap-3" data-testid="hit-list">
          {rows.map((h) => {
            const own = h.submittedBy === userId;
            return (
              <li key={h.id} className="rounded-md border border-border p-3" data-testid={`hit-${h.hitNumber}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono text-foreground-muted">{h.hitNumber}</span>
                      <StatusPill tone={h.status === "PENDING" ? "warning" : h.status === "CONFIRMED" ? "danger" : "neutral"}>
                        {t(`anprScreen.hits.status.${h.status}` as const)}
                      </StatusPill>
                      <StatusPill tone={h.priority === "CRITICAL" || h.priority === "HIGH" ? "danger" : "info"}>{h.priority}</StatusPill>
                      <StatusPill tone="ai">{t("anprScreen.aiBadge")}</StatusPill>
                    </div>
                    <p className="text-sm text-foreground">
                      {t(`anprScreen.hits.source.${h.source}` as const)}:{" "}
                      {h.source === "LOOKOUT" ? (
                        <Link href={`/lookout/${h.lookoutId}`} className="text-accent hover:underline">
                          {h.lookoutNumber} · {h.lookoutSubject}
                        </Link>
                      ) : (
                        h.watchlistReason
                      )}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {t("anprScreen.hits.read", {
                        plate: h.read.displayNumber,
                        place: h.read.cameraCode ? `${h.read.cameraCode} (${h.read.cameraLocation})` : t("anprScreen.hits.noCamera"),
                        when: formatDateTime(h.read.frameTime),
                      })}{" "}
                      · {h.read.analysisNumber} · {t("anprScreen.hits.submittedBy", { name: h.submittedByName })}
                    </p>
                    <PlateReadSummary read={h.read} />
                    {h.status !== "PENDING" && (
                      <p className="text-xs text-foreground-muted">
                        {t("anprScreen.hits.reviewedBy", { name: h.reviewedByName, when: h.reviewedAt ? formatDateTime(h.reviewedAt) : "" })}
                        {h.reviewNote ? ` — ${h.reviewNote}` : ""}
                      </p>
                    )}
                    {h.alertId && (
                      <p className="flex flex-wrap items-center gap-2 text-xs">
                        <StatusPill tone="danger"><BellRing className="h-3 w-3" /> {t("anprScreen.hits.alertRaised")}</StatusPill>
                        <Link href="/alerts" className="text-accent hover:underline">{t("anprScreen.hits.openAlerts")}</Link>
                        {h.sightingId && h.lookoutId && (
                          <Link href={`/lookout/${h.lookoutId}`} className="text-accent hover:underline">
                            {t("anprScreen.hits.sightingRecorded", { lookout: h.lookoutNumber })}
                          </Link>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewing(h)}>
                      <Eye className="h-4 w-4" /> {t("anprScreen.frame.view")}
                    </Button>
                    {h.status === "PENDING" && (
                      <>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setDecision({ hit: h, kind: "CONFIRMED" })} disabled={!canReview || own} data-testid="hit-confirm">
                            <Check className="h-4 w-4" /> {t("anprScreen.hits.confirm")}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setDecision({ hit: h, kind: "DISMISSED" })} disabled={!canReview || own}>
                            <X className="h-4 w-4" /> {t("anprScreen.hits.dismiss")}
                          </Button>
                        </div>
                        {(own || !canReview) && (
                          <p className="max-w-[16rem] text-right text-xs text-foreground-muted">
                            {own ? t("anprScreen.hits.ownSubmission") : t("anprScreen.hits.needsSI")}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-3">
        <Pager page={page} pages={hits.data?.totalPages ?? 0} onPage={setPage} />
      </div>

      <Dialog open={Boolean(decision)} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.kind === "CONFIRMED"
                ? t("anprScreen.hits.confirmTitle", { number: decision?.hit.hitNumber ?? "" })
                : t("anprScreen.hits.dismissTitle", { number: decision?.hit.hitNumber ?? "" })}
            </DialogTitle>
            <DialogDescription>
              {decision?.kind === "CONFIRMED" ? t("anprScreen.hits.confirmBody") : t("anprScreen.hits.noteRequired")}
            </DialogDescription>
          </DialogHeader>
          {decision && <PlateReadSummary read={decision.hit.read} />}
          <LabeledField label={t("anprScreen.hits.note")} htmlFor="anpr-hit-note">
            <textarea id="anpr-hit-note" className={textareaClass} value={note} onChange={(e) => setNote(e.target.value)} />
          </LabeledField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>{t("anprScreen.common.cancel")}</Button>
            <Button
              onClick={decide}
              disabled={review.isPending || (decision?.kind === "DISMISSED" && note.trim() === "")}
              data-testid="hit-decision-save"
            >
              {decision?.kind === "CONFIRMED" ? t("anprScreen.hits.confirm") : t("anprScreen.hits.dismiss")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("anprScreen.recent.openTitle", { number: viewing?.read.analysisNumber ?? "" })}</DialogTitle>
            <DialogDescription>{t("anprScreen.frame.needsPurpose")}</DialogDescription>
          </DialogHeader>
          <LabeledField label={t("anprScreen.recent.openPurpose")} htmlFor="anpr-view-purpose">
            <textarea id="anpr-view-purpose" className={textareaClass} value={viewPurpose} onChange={(e) => setViewPurpose(e.target.value)} />
          </LabeledField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>{t("anprScreen.common.cancel")}</Button>
            <Button onClick={openFrame} disabled={viewPurpose.trim().length < 10 || open.isPending} data-testid="hit-open-frame">
              {t("anprScreen.frame.view")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(opened)} onOpenChange={(o) => !o && setOpened(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {opened?.hit.hitNumber} · {opened?.hit.read.displayNumber}
            </DialogTitle>
            <DialogDescription>{t("anprScreen.machineNotice")}</DialogDescription>
          </DialogHeader>
          {opened && frame && <FrameViewer analysisId={opened.analysis.id} frame={frame} highlightReadId={opened.hit.read.id} />}
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
