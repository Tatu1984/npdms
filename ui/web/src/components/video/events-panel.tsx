"use client";

import * as React from "react";
import { FileLock2, Link2, Loader2, ScanSearch, ShieldCheck, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, Field, Panel, SeverityBadge, StatusPill } from "@/components/platform/primitives";
import { RecordLinkPicker, type RecordLink } from "@/components/platform/pickers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  useCameras,
  useEventSearch,
  useLinkVideoEvent,
  useOpenVideoEvent,
  usePurgeExpiredEvents,
  useSetEventRetention,
  useTriageVideoEvent,
  useVideoEventStats,
} from "@/hooks/use-video";
import {
  MIN_PURPOSE_LENGTH,
  RETENTION_DAYS,
  VIDEO_EVENT_TYPES,
  type EventSearch,
  type EventSeverity,
  type RetentionClass,
  type VideoEvent,
  type VideoEventStatus,
  type VideoEventType,
} from "@/lib/api/video";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { EVENT_STATUS, EVENT_TYPE_LABEL, RETENTION_LABEL, inputClass, localInputToISO } from "./labels";

const PAGE_SIZE = 20;

interface Filters {
  status: "" | VideoEventStatus;
  eventType: "" | VideoEventType;
  severity: "" | EventSeverity;
  cameraId: string;
  from: string;
  to: string;
  text: string;
}

const initialFilters: Filters = { status: "RAISED", eventType: "", severity: "", cameraId: "", from: "", to: "", text: "" };

export function EventsPanel({
  userId,
  canSearch,
  canTriage,
  canSetRetention,
  canPurge,
}: {
  userId: string | undefined;
  canSearch: boolean;
  canTriage: boolean;
  canSetRetention: boolean;
  canPurge: boolean;
}) {
  const { t, pick } = useI18n();
  const [purpose, setPurpose] = React.useState("");
  const [draftPurpose, setDraftPurpose] = React.useState("");
  const [draft, setDraft] = React.useState<Filters>(initialFilters);
  const [applied, setApplied] = React.useState<Filters>(initialFilters);
  const [page, setPage] = React.useState(1);
  const [openEvent, setOpenEvent] = React.useState<VideoEvent | null>(null);
  const [purgeOpen, setPurgeOpen] = React.useState(false);

  const cameras = useCameras({ pageSize: 100 });
  const stats = useVideoEventStats();
  const open = useOpenVideoEvent();
  const purge = usePurgeExpiredEvents();

  const search: EventSearch | null = purpose
    ? {
        purpose,
        page,
        pageSize: PAGE_SIZE,
        status: applied.status || undefined,
        eventType: applied.eventType || undefined,
        severity: applied.severity || undefined,
        cameraId: applied.cameraId || undefined,
        from: applied.from ? localInputToISO(applied.from) : undefined,
        to: applied.to ? localInputToISO(applied.to) : undefined,
        text: applied.text.trim() || undefined,
      }
    : null;
  const events = useEventSearch(canSearch ? search : null);

  const startReview = () => {
    if (draftPurpose.trim().length < MIN_PURPOSE_LENGTH) {
      toast.error(t("video.purposeTitle"), t("video.purposeTooShort", { n: MIN_PURPOSE_LENGTH }));
      return;
    }
    setPurpose(draftPurpose.trim());
    setPage(1);
    // Events pass their expiry with time alone, so the purge count is
    // re-read when a review starts rather than trusted from an earlier load.
    stats.refetch();
  };

  const openDetail = async (e: VideoEvent) => {
    try {
      const fresh = await open.mutateAsync({ id: e.id, purpose });
      setOpenEvent(fresh);
    } catch (err) {
      toast.error(e.eventNumber, err instanceof Error ? err.message : "The event could not be opened");
    }
  };

  const runPurge = async () => {
    try {
      const result = await purge.mutateAsync();
      toast.success(t("video.purgeExpired"), t("video.results", { n: result.purged }));
      setPurgeOpen(false);
    } catch (err) {
      toast.error(t("video.purgeExpired"), err instanceof Error ? err.message : "The purge failed");
    }
  };

  if (!canSearch) {
    return (
      <Panel title={t("video.tabEvents")}>
        <EmptyState icon={FileLock2} title={t("video.tabEvents")} description={t("video.searchRankNote")} />
      </Panel>
    );
  }

  if (!purpose) {
    return (
      <Panel title={t("video.purposeTitle")} description={t("video.purposeDesc")}>
        <div className="flex max-w-xl flex-col gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="review-purpose">{t("video.purposeLabel")}</Label>
            <Textarea
              id="review-purpose"
              rows={2}
              value={draftPurpose}
              onChange={(v: string) => setDraftPurpose(v)}
              placeholder={t("video.purposePlaceholder")}
            />
          </div>
          <div>
            <Button onClick={startReview}>
              <ScanSearch className="h-4 w-4" />
              {t("video.startReview")}
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  const rows = events.data?.data ?? [];
  const totalPages = events.data?.totalPages ?? 0;
  const expired = stats.data?.expiredAwaitingPurge ?? 0;

  return (
    <>
      <Panel
        title={t("video.tabEvents")}
        description={
          <span>
            {t("video.reviewingUnder")} <span className="text-foreground">“{purpose}”</span> ·{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => {
                setDraftPurpose(purpose);
                setPurpose("");
              }}
            >
              {t("video.changePurpose")}
            </button>
          </span>
        }
        actions={
          canPurge ? (
            <Button size="sm" variant="outline" onClick={() => setPurgeOpen(true)} disabled={expired === 0}>
              <Trash2 className="h-3.5 w-3.5" />
              {t("video.purgeExpired")} ({expired})
            </Button>
          ) : undefined
        }
        bodyClassName="flex flex-col gap-4"
      >
        <form
          className="grid gap-2 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(draft);
            setPage(1);
          }}
        >
          <Input
            aria-label={t("video.filterText")}
            placeholder={t("video.filterText")}
            value={draft.text}
            onChange={(v: string) => setDraft({ ...draft, text: v })}
            className="md:col-span-2"
          />
          <select aria-label={t("video.allStatuses")} className={inputClass} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Filters["status"] })}>
            <option value="">{t("video.allStatuses")}</option>
            {(["RAISED", "CONFIRMED", "DISMISSED"] as VideoEventStatus[]).map((s) => (
              <option key={s} value={s}>
                {t(EVENT_STATUS[s].key)}
              </option>
            ))}
          </select>
          <select aria-label={t("video.allCameras")} className={inputClass} value={draft.cameraId} onChange={(e) => setDraft({ ...draft, cameraId: e.target.value })}>
            <option value="">{t("video.allCameras")}</option>
            {(cameras.data?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
          <select aria-label={t("video.allTypes")} className={inputClass} value={draft.eventType} onChange={(e) => setDraft({ ...draft, eventType: e.target.value as Filters["eventType"] })}>
            <option value="">{t("video.allTypes")}</option>
            {VIDEO_EVENT_TYPES.map((v) => (
              <option key={v} value={v}>
                {pick(EVENT_TYPE_LABEL[v])}
              </option>
            ))}
          </select>
          <select aria-label={t("video.allSeverities")} className={inputClass} value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value as Filters["severity"] })}>
            <option value="">{t("video.allSeverities")}</option>
            {(["critical", "high", "medium", "low"] as EventSeverity[]).map((s) => (
              <option key={s} value={s}>
                {t(`severity.${s}`)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-foreground-muted">
            {t("video.from")}
            <input type="datetime-local" className={inputClass} value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-xs text-foreground-muted">
            {t("video.to")}
            <input type="datetime-local" className={inputClass} value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
          </label>
          <div className="flex items-center gap-3 md:col-span-4">
            <Button type="submit" size="sm">
              <ScanSearch className="h-3.5 w-3.5" />
              {t("video.runSearch")}
            </Button>
            <span className="text-xs text-foreground-subtle">{t("video.searchRecorded")}</span>
          </div>
        </form>

        {events.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading")}
          </div>
        ) : events.isError ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-sm">
            <span className="text-foreground">{events.error instanceof Error ? events.error.message : "Search failed"}</span>
            <Button size="sm" variant="outline" onClick={() => events.refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={t("video.noEvents")} description={t("video.noEventsHint")} />
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {rows.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-foreground-subtle">{e.eventNumber}</span>
                    <span className="text-sm font-medium text-foreground">{pick(EVENT_TYPE_LABEL[e.eventType])}</span>
                    <SeverityBadge level={e.severity} />
                    <StatusPill tone={EVENT_STATUS[e.status].tone}>{t(EVENT_STATUS[e.status].key)}</StatusPill>
                    {e.retentionClass === "EVIDENTIAL" && <StatusPill tone="info">{t("video.evidentialHold")}</StatusPill>}
                    {e.maskingRequired && <StatusPill tone="neutral">{t("video.masking")}</StatusPill>}
                  </div>
                  <p className="mt-1 text-sm text-foreground-muted">{e.description}</p>
                  <p className="mt-1 text-xs text-foreground-subtle">
                    {e.cameraCode} · {e.cameraName} · {formatDateTime(e.occurredAt)} · {t("video.raisedBy", { name: e.raisedByName })}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openDetail(e)} disabled={open.isPending}>
                  {t("video.openEvent")}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-foreground-muted">
            <span>
              {page} / {totalPages} · {t("video.results", { n: events.data?.total ?? 0 })}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                ‹
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                ›
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <EventSheet
        event={openEvent}
        onClose={() => setOpenEvent(null)}
        onChanged={setOpenEvent}
        userId={userId}
        canTriage={canTriage}
        canSetRetention={canSetRetention}
      />

      <Dialog open={purgeOpen} onOpenChange={setPurgeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("video.purgeTitle")}</DialogTitle>
            <DialogDescription>{t("video.purgeDesc", { n: expired })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurgeOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={runPurge} disabled={purge.isPending}>
              {purge.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("video.purge")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EventSheet({
  event,
  onClose,
  onChanged,
  userId,
  canTriage,
  canSetRetention,
}: {
  event: VideoEvent | null;
  onClose: () => void;
  onChanged: (e: VideoEvent) => void;
  userId: string | undefined;
  canTriage: boolean;
  canSetRetention: boolean;
}) {
  const { t, pick } = useI18n();
  const triage = useTriageVideoEvent();
  const link = useLinkVideoEvent();
  const retention = useSetEventRetention();
  const [note, setNote] = React.useState("");
  const [target, setTarget] = React.useState<RecordLink | null>(null);
  const [retentionClass, setRetentionClass] = React.useState<RetentionClass>("STANDARD");
  const [masking, setMasking] = React.useState(false);
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (event) {
      setNote("");
      setTarget(null);
      setRetentionClass(event.retentionClass);
      setMasking(event.maskingRequired);
      setReason("");
    }
  }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const e = event;
  const ownEvent = Boolean(e && userId && e.raisedBy === userId);
  const linked = Boolean(e && (e.firId || e.caseId));

  const decide = async (decision: "CONFIRMED" | "DISMISSED") => {
    if (!e) return;
    if (decision === "DISMISSED" && !note.trim()) {
      toast.error(t("video.dismiss"), t("video.dismissNoteRequired"));
      return;
    }
    try {
      const updated = await triage.mutateAsync({ id: e.id, decision, note });
      onChanged(updated);
      toast.success(t(decision === "CONFIRMED" ? "video.statusConfirmed" : "video.statusDismissed"), updated.eventNumber);
    } catch (err) {
      toast.error(t("video.triage"), err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  const submitLink = async () => {
    if (!e || !target) return;
    try {
      const updated = await link.mutateAsync(
        target.kind === "case" ? { id: e.id, caseId: target.id } : { id: e.id, firId: target.id },
      );
      onChanged(updated);
      toast.success(t("video.link"), updated.eventNumber);
    } catch (err) {
      toast.error(t("video.link"), err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  const submitRetention = async () => {
    if (!e) return;
    try {
      const updated = await retention.mutateAsync({ id: e.id, retentionClass, maskingRequired: masking, reason });
      onChanged(updated);
      toast.success(t("video.updateRetention"), updated.eventNumber);
    } catch (err) {
      toast.error(t("video.updateRetention"), err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  const linkedTarget = e ? [e.caseNumber, e.firNumber && `FIR ${e.firNumber}`].filter(Boolean).join(" · ") : "";

  return (
    <Sheet open={e !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:w-[34rem]">
        {e && (
          <>
            <SheetHeader>
              <SheetTitle>
                {pick(EVENT_TYPE_LABEL[e.eventType])} · <span className="font-mono text-base">{e.eventNumber}</span>
              </SheetTitle>
              <SheetDescription>
                {e.cameraCode} · {e.cameraName} · {e.stationName}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge level={e.severity} />
                <StatusPill tone={EVENT_STATUS[e.status].tone}>{t(EVENT_STATUS[e.status].key)}</StatusPill>
                {e.retentionClass === "EVIDENTIAL" ? (
                  <StatusPill tone="info">{t("video.evidentialHold")}</StatusPill>
                ) : (
                  e.retainUntil && <StatusPill tone="neutral">{t("video.retainUntil", { date: formatDate(e.retainUntil) })}</StatusPill>
                )}
                {e.maskingRequired && <StatusPill tone="neutral">{t("video.masking")}</StatusPill>}
              </div>

              <p className="text-sm text-foreground">{e.description}</p>
              <dl className="grid grid-cols-2 gap-3">
                <Field label={t("video.fieldOccurredAt")} value={formatDateTime(e.occurredAt)} className="col-span-2" />
                <Field label={t("video.colLocation")} value={e.cameraLocation} className="col-span-2" />
                <Field label={t("video.raisedBy", { name: "" }).trim()} value={e.raisedByName} />
                {e.triagedAt && (
                  <Field
                    label={t("video.triage")}
                    value={t("video.triagedBy", { status: t(EVENT_STATUS[e.status].key), name: e.triagedByName })}
                  />
                )}
                {e.triageNote && <Field label={t("video.triageNote")} value={e.triageNote} className="col-span-2" />}
                {linked && <Field label={t("video.linkTitle")} value={t("video.linkedTo", { target: linkedTarget })} className="col-span-2" />}
              </dl>

              {e.status === "RAISED" && canTriage && (
                <section className="flex flex-col gap-2 rounded-md border border-border p-3">
                  <h3 className="text-sm font-semibold text-foreground">{t("video.triage")}</h3>
                  {ownEvent ? (
                    <p className="text-sm text-foreground-muted">{t("video.ownEventNote")}</p>
                  ) : (
                    <>
                      <Label htmlFor="triage-note">{t("video.triageNote")}</Label>
                      <Textarea id="triage-note" rows={2} value={note} onChange={(v: string) => setNote(v)} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => decide("CONFIRMED")} disabled={triage.isPending}>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {t("video.confirm")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => decide("DISMISSED")} disabled={triage.isPending}>
                          {t("video.dismiss")}
                        </Button>
                      </div>
                    </>
                  )}
                </section>
              )}

              {e.status === "CONFIRMED" && !linked && canTriage && (
                <section className="flex flex-col gap-2 rounded-md border border-border p-3">
                  <h3 className="text-sm font-semibold text-foreground">{t("video.linkTitle")}</h3>
                  <p className="text-xs text-foreground-subtle">{t("video.linkHint")}</p>
                  <RecordLinkPicker value={target} onChange={setTarget} />
                  <div>
                    <Button size="sm" onClick={submitLink} disabled={!target || link.isPending}>
                      <Link2 className="h-3.5 w-3.5" />
                      {t("video.link")}
                    </Button>
                  </div>
                </section>
              )}

              {canSetRetention && (
                <section className="flex flex-col gap-2 rounded-md border border-border p-3">
                  <h3 className="text-sm font-semibold text-foreground">{t("video.retentionTitle")}</h3>
                  {linked && <p className="text-xs text-foreground-subtle">{t("video.retentionLinkedNote")}</p>}
                  <select
                    aria-label={t("video.retention")}
                    className={inputClass}
                    value={retentionClass}
                    onChange={(ev) => setRetentionClass(ev.target.value as RetentionClass)}
                  >
                    {(["SHORT", "STANDARD", "EXTENDED", "EVIDENTIAL"] as RetentionClass[]).map((r) => (
                      <option key={r} value={r} disabled={linked && r !== "EVIDENTIAL"}>
                        {pick(RETENTION_LABEL[r])}
                        {r !== "EVIDENTIAL" ? ` — ${t("video.retentionDays", { days: RETENTION_DAYS[r] })}` : ""}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox checked={masking} onCheckedChange={(v) => setMasking(v === true)} />
                    {t("video.masking")}
                  </label>
                  <Label htmlFor="retention-reason">{t("video.retentionReason")}</Label>
                  <Input id="retention-reason" value={reason} onChange={(v: string) => setReason(v)} />
                  <div>
                    <Button size="sm" variant="outline" onClick={submitRetention} disabled={retention.isPending}>
                      {t("video.updateRetention")}
                    </Button>
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
