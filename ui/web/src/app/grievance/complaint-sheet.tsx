"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  FileText,
  FolderInput,
  Lock,
  MapPin,
  MessageSquareText,
  Send,
  Tags,
  Undo2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  STATUS_TRANSITIONS,
  type ComplaintCategory,
  type ComplaintDetail,
  type ComplaintPriority,
  type ComplaintStatus,
} from "@/lib/api/complaints";
import { firsApi } from "@/lib/api/firs";
import {
  useAddComplaintNote,
  useCategoriseComplaint,
  useComplaint,
  useDraftResponse,
  useDuplicateCandidates,
  useLinkComplaintFIR,
  useLinkDuplicate,
  useReviewResponse,
  useRouteComplaint,
  useRoutingTargets,
  useSetComplaintStatus,
} from "@/hooks/use-complaints";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { Field, StatusPill, type StatusTone } from "@/components/platform/primitives";
import { OfficerPicker } from "@/components/platform/pickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { selectClass } from "./intake-dialog";

export const STATUS_TONE: Record<ComplaintStatus, StatusTone> = {
  SUBMITTED: "neutral",
  ACKNOWLEDGED: "info",
  ASSIGNED: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
  REJECTED: "danger",
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN") : "—");

type Panel = "categorise" | "route" | "status" | "note" | "duplicates" | "fir" | "draft" | "return" | null;

function ErrorNote({ error }: { error: string | null }) {
  const { t } = useI18n();
  if (!error) return null;
  return (
    <Alert variant="danger">
      <AlertTitle>{t("common.error")}</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function ComplaintSheet({ id, onClose, onOpen }: { id: string | null; onClose: () => void; onOpen: (id: string) => void }) {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const canAct = Boolean(user && hasMinimumRole(user.role, "ASI"));
  const canApprove = Boolean(user && hasMinimumRole(user.role, "SI"));
  const { data: c, isLoading, isError, error, refetch } = useComplaint(id);

  const [panel, setPanel] = React.useState<Panel>(null);
  const [panelError, setPanelError] = React.useState<string | null>(null);
  const [returnFor, setReturnFor] = React.useState<string | null>(null);
  const openPanel = (p: Panel) => {
    setPanelError(null);
    setPanel(p);
  };
  const closePanel = () => {
    setPanelError(null);
    setPanel(null);
  };

  return (
    <Sheet open={id !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[36rem] max-w-full">
        {isLoading || !c ? (
          <div className="flex flex-col gap-3 p-5">
            {isError ? (
              <Alert variant="danger">
                <AlertTitle>{t("grievanceScreen.list.loadFailed")}</AlertTitle>
                <AlertDescription>
                  {message(error)}{" "}
                  <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
                    {t("common.retry")}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
              </>
            )}
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="font-bengali">{c.subject}</SheetTitle>
              <SheetDescription>
                <span className="font-mono">{c.trackingNumber}</span> · {t(`grievanceScreen.categories.${c.category}`)} ·{" "}
                {t(`grievanceScreen.priorities.${c.priority}`)}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-6" data-testid="complaint-sheet">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={STATUS_TONE[c.status]}>{t(`grievanceScreen.statuses.${c.status}`)}</StatusPill>
                <StatusPill>{t(`grievanceScreen.channels.${c.channel}`)}</StatusPill>
                <StatusPill>{t(`grievanceScreen.scripts.${c.textScript}`)}</StatusPill>
                {c.duplicateOf && (
                  <StatusPill tone="warning">
                    <Copy className="h-3 w-3" />
                    {t("grievanceScreen.list.duplicate")}
                  </StatusPill>
                )}
              </div>

              {(c.acknowledgeOverdue || c.resolutionOverdue) && (
                <Alert variant="warning">
                  <AlertTriangle />
                  <AlertDescription>
                    {c.acknowledgeOverdue ? t("grievanceScreen.detail.overdueAck") : t("grievanceScreen.detail.overdueResolve")}
                  </AlertDescription>
                </Alert>
              )}

              <p className="whitespace-pre-wrap text-sm text-foreground font-bengali">{c.description}</p>

              <dl className="grid grid-cols-2 gap-3">
                <Field
                  label={t("grievanceScreen.detail.complainant")}
                  value={
                    c.isAnonymous ? (
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        {t("grievanceScreen.list.anonymous")}
                      </span>
                    ) : (
                      <span>
                        {c.complainantName}
                        <span className="block font-mono text-xs text-foreground-subtle">{c.complainantPhone}</span>
                      </span>
                    )
                  }
                />
                <Field label={t("grievanceScreen.detail.submitted")} value={fmt(c.submittedAt)} />
                <Field label={t("grievanceScreen.detail.channel")} value={t(`grievanceScreen.channels.${c.channel}`)} />
                {c.sourceReference && <Field label={t("grievanceScreen.detail.sourceReference")} value={c.sourceReference} />}
                {c.recordedByName && <Field label={t("grievanceScreen.detail.recordedBy")} value={c.recordedByName} />}
                {c.incidentLocation && <Field label={t("grievanceScreen.detail.location")} value={c.incidentLocation} />}
                <Field label={t("grievanceScreen.detail.station")} value={c.stationName || t("grievanceScreen.list.notRouted")} />
                {c.assignedToName && <Field label={t("grievanceScreen.detail.assignedTo")} value={c.assignedToName} />}
                {c.categorisedByName && (
                  <Field label={t("grievanceScreen.detail.categorisedBy")} value={`${c.categorisedByName} · ${fmt(c.categorisedAt)}`} />
                )}
                <Field
                  label={t("grievanceScreen.detail.fir")}
                  value={
                    c.firId ? (
                      <Link href={`/fir/${c.firId}`} className="font-mono text-accent hover:underline">
                        {c.firNumber}
                      </Link>
                    ) : (
                      t("grievanceScreen.detail.noFir")
                    )
                  }
                />
              </dl>

              {c.duplicateOf && (
                <div className="rounded-md border border-warning/30 bg-warning-subtle p-3 text-sm">
                  <button type="button" className="font-mono text-accent hover:underline" onClick={() => onOpen(c.duplicateOf as string)}>
                    {t("grievanceScreen.detail.duplicateOf", { number: c.duplicateOfNumber })}
                  </button>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {t("grievanceScreen.detail.duplicateNote", { name: c.duplicateLinkedByName, note: c.duplicateNote ?? "" })}
                  </p>
                </div>
              )}
              {c.linkedDuplicates > 0 && (
                <p className="text-xs text-foreground-muted">{t("grievanceScreen.detail.linkedDuplicates", { n: c.linkedDuplicates })}</p>
              )}
              {c.status === "REJECTED" && c.rejectionReason && (
                <Field label={t("grievanceScreen.detail.rejectionReason")} value={c.rejectionReason} />
              )}

              {canAct ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => openPanel("categorise")}>
                    <Tags className="h-4 w-4" />
                    {t("grievanceScreen.actions.categorise")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openPanel("route")}>
                    <MapPin className="h-4 w-4" />
                    {t("grievanceScreen.actions.route")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openPanel("status")}>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("grievanceScreen.actions.status")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openPanel("duplicates")}>
                    <Copy className="h-4 w-4" />
                    {t("grievanceScreen.actions.duplicates")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openPanel("fir")}>
                    <FolderInput className="h-4 w-4" />
                    {t("grievanceScreen.actions.linkFir")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openPanel("note")}>
                    <MessageSquareText className="h-4 w-4" />
                    {t("grievanceScreen.actions.note")}
                  </Button>
                  <Button size="sm" onClick={() => openPanel("draft")} className="col-span-2">
                    <Send className="h-4 w-4" />
                    {t("grievanceScreen.actions.draft")}
                  </Button>
                </div>
              ) : (
                <Alert>
                  <Lock />
                  <AlertDescription>{t("grievanceScreen.detail.readOnly")}</AlertDescription>
                </Alert>
              )}

              <section>
                <h3 className="mb-2 text-xs uppercase tracking-wide text-foreground-subtle">{t("grievanceScreen.detail.responses")}</h3>
                {c.responses.length === 0 ? (
                  <p className="text-sm text-foreground-muted">{t("grievanceScreen.detail.noResponses")}</p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {c.responses.map((r) => (
                      <li key={r.id} className="rounded-md border border-border p-3" data-testid={`response-${r.status}`}>
                        <div className="flex items-center justify-between gap-2">
                          <StatusPill tone={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "danger" : "warning"}>
                            {r.status === "APPROVED"
                              ? t("grievanceScreen.detail.approved")
                              : r.status === "REJECTED"
                                ? t("grievanceScreen.detail.rejectedDraft")
                                : t("grievanceScreen.detail.draft")}
                          </StatusPill>
                          <span className="text-xs text-foreground-subtle">{fmt(r.draftedAt)}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm font-bengali">{r.body}</p>
                        <p className="mt-1 text-xs text-foreground-subtle">
                          {t("grievanceScreen.detail.draftedBy", { name: r.draftedByName })}
                          {r.reviewedByName && ` · ${t("grievanceScreen.detail.reviewedBy", { name: r.reviewedByName })}`}
                          {r.reviewNote && ` — ${r.reviewNote}`}
                        </p>
                        {r.status === "DRAFT" && canApprove && (
                          r.draftedBy === user?.id ? (
                            <p className="mt-2 text-xs text-foreground-muted">{t("grievanceScreen.response.selfApproval")}</p>
                          ) : (
                            <ReviewButtons complaint={c} responseId={r.id} onReturn={() => { setReturnFor(r.id); openPanel("return"); }} />
                          )
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-xs uppercase tracking-wide text-foreground-subtle">{t("grievanceScreen.detail.routings")}</h3>
                {c.routings.length === 0 ? (
                  <p className="text-sm text-foreground-muted">{t("grievanceScreen.detail.noRoutings")}</p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {c.routings.map((r) => (
                      <li key={r.id} className="text-sm">
                        <span className="flex items-center gap-1 text-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          {r.toStationName}
                          {r.toUnit && ` · ${r.toUnit}`}
                        </span>
                        <span className="block text-xs text-foreground-muted">
                          {r.reason} — {r.routedByName}, {fmt(r.routedAt)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-xs uppercase tracking-wide text-foreground-subtle">{t("grievanceScreen.detail.history")}</h3>
                <ol className="flex flex-col gap-2">
                  {c.history.map((h) => (
                    <li key={h.id} className="text-sm" data-testid={h.isPublic ? "history-public" : "history-internal"}>
                      <span className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={h.isPublic ? "info" : "neutral"}>
                          {h.isPublic ? t("grievanceScreen.detail.publicEntry") : t("grievanceScreen.detail.internalEntry")}
                        </StatusPill>
                        <span className="text-xs text-foreground-subtle">
                          {fmt(h.createdAt)}
                          {h.updatedByName && ` · ${h.updatedByName}`}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-foreground font-bengali">{h.message}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <Link href="/fir/new" className="w-full">
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4" />
                  {t("grievanceScreen.actions.registerFir")}
                </Button>
              </Link>
            </div>

            <CategoriseDialog c={c} open={panel === "categorise"} onClose={closePanel} error={panelError} setError={setPanelError} />
            <RouteDialog c={c} open={panel === "route"} onClose={closePanel} error={panelError} setError={setPanelError} />
            <StatusDialog c={c} open={panel === "status"} onClose={closePanel} error={panelError} setError={setPanelError} canReject={canApprove} />
            <NoteDialog c={c} open={panel === "note"} onClose={closePanel} error={panelError} setError={setPanelError} />
            <DuplicatesDialog c={c} open={panel === "duplicates"} onClose={closePanel} error={panelError} setError={setPanelError} />
            <FIRDialog c={c} open={panel === "fir"} onClose={closePanel} error={panelError} setError={setPanelError} />
            <DraftDialog c={c} open={panel === "draft"} onClose={closePanel} error={panelError} setError={setPanelError} />
            <ReturnDialog c={c} responseId={returnFor} open={panel === "return"} onClose={closePanel} error={panelError} setError={setPanelError} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

type DialogProps = {
  c: ComplaintDetail;
  open: boolean;
  onClose: () => void;
  error: string | null;
  setError: (e: string | null) => void;
};

function ActionDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-3">{children}</div>
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoriseDialog({ c, open, onClose, error, setError }: DialogProps) {
  const { t } = useI18n();
  const m = useCategoriseComplaint();
  const [category, setCategory] = React.useState<ComplaintCategory>(c.category);
  const [priority, setPriority] = React.useState<ComplaintPriority>(c.priority);
  React.useEffect(() => {
    if (open) {
      setCategory(c.category);
      setPriority(c.priority);
    }
  }, [open, c.category, c.priority]);
  const save = async () => {
    try {
      await m.mutateAsync({ id: c.id, category, priority });
      onClose();
    } catch (err) {
      setError(message(err));
    }
  };
  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title={t("grievanceScreen.categorise.title")}
      description={t("grievanceScreen.categorise.description")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={save} disabled={m.isPending}>{t("grievanceScreen.categorise.save")}</Button>
        </>
      }
    >
      <div className="grid gap-1.5">
        <Label htmlFor="cat-category">{t("grievanceScreen.intake.category")}</Label>
        <select id="cat-category" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as ComplaintCategory)}>
          {COMPLAINT_CATEGORIES.map((x) => (
            <option key={x} value={x}>{t(`grievanceScreen.categories.${x}`)}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cat-priority">{t("grievanceScreen.categorise.priority")}</Label>
        <select id="cat-priority" className={selectClass} value={priority} onChange={(e) => setPriority(e.target.value as ComplaintPriority)}>
          {COMPLAINT_PRIORITIES.map((x) => (
            <option key={x} value={x}>{t(`grievanceScreen.priorities.${x}`)}</option>
          ))}
        </select>
      </div>
      <ErrorNote error={error} />
    </ActionDialog>
  );
}

function RouteDialog({ c, open, onClose, error, setError }: DialogProps) {
  const { t } = useI18n();
  const m = useRouteComplaint();
  const targets = useRoutingTargets(open);
  const [stationId, setStationId] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [officer, setOfficer] = React.useState<string | undefined>();
  const [reason, setReason] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setStationId(c.stationId ?? "");
      setUnit("");
      setOfficer(undefined);
      setReason("");
    }
  }, [open, c.stationId]);
  const save = async () => {
    if (!stationId) {
      setError(t("grievanceScreen.route.station"));
      return;
    }
    try {
      await m.mutateAsync({ id: c.id, stationId, unit: unit || null, assignedTo: officer ?? null, reason });
      onClose();
    } catch (err) {
      setError(message(err));
    }
  };
  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title={t("grievanceScreen.route.title")}
      description={t("grievanceScreen.route.description")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={save} disabled={m.isPending}>{t("grievanceScreen.route.save")}</Button>
        </>
      }
    >
      <div className="grid gap-1.5">
        <Label htmlFor="route-station">{t("grievanceScreen.route.station")}</Label>
        <select id="route-station" className={selectClass} value={stationId} onChange={(e) => { setStationId(e.target.value); setOfficer(undefined); }}>
          <option value="">—</option>
          {(targets.data?.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ""}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="route-unit">{t("grievanceScreen.route.unit")}</Label>
        <Input id="route-unit" value={unit} onChange={(v: string) => setUnit(v)} placeholder={t("grievanceScreen.route.unitPlaceholder")} />
      </div>
      {stationId && (
        <div className="grid gap-1.5">
          <Label>{t("grievanceScreen.route.officer")}</Label>
          <OfficerPicker value={officer} stationId={stationId} onChange={(oid) => setOfficer(oid)} />
        </div>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="route-reason">{t("grievanceScreen.route.reason")}</Label>
        <Textarea id="route-reason" rows={2} value={reason} onChange={(v: string) => setReason(v)} />
      </div>
      <ErrorNote error={error} />
    </ActionDialog>
  );
}

function StatusDialog({ c, open, onClose, error, setError, canReject }: DialogProps & { canReject: boolean }) {
  const { t } = useI18n();
  const m = useSetComplaintStatus();
  const options = (STATUS_TRANSITIONS[c.status] ?? []).filter((s) => s !== "REJECTED" || canReject);
  const [target, setTarget] = React.useState<ComplaintStatus | "">("");
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setTarget(options[0] ?? "");
      setReason("");
      setNote("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, c.status]);
  const save = async () => {
    if (!target) return;
    try {
      await m.mutateAsync({ id: c.id, status: target, reason: target === "REJECTED" ? reason : null, note: note || null });
      onClose();
    } catch (err) {
      setError(message(err));
    }
  };
  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title={t("grievanceScreen.status.title")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={save} disabled={m.isPending || !target}>{t("grievanceScreen.status.save")}</Button>
        </>
      }
    >
      {options.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          {t("grievanceScreen.status.none", { status: t(`grievanceScreen.statuses.${c.status}`) })}
        </p>
      ) : (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="status-to">{t("grievanceScreen.status.to")}</Label>
            <select id="status-to" className={selectClass} value={target} onChange={(e) => setTarget(e.target.value as ComplaintStatus)}>
              {options.map((s) => (
                <option key={s} value={s}>{t(`grievanceScreen.statuses.${s}`)}</option>
              ))}
            </select>
          </div>
          {target === "RESOLVED" && c.approvedResponses === 0 && (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertDescription>{t("grievanceScreen.status.resolveNeedsResponse")}</AlertDescription>
            </Alert>
          )}
          {target === "REJECTED" && (
            <div className="grid gap-1.5">
              <Label htmlFor="status-reason">{t("grievanceScreen.status.reason")}</Label>
              <Textarea id="status-reason" rows={2} value={reason} onChange={(v: string) => setReason(v)} />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="status-note">{t("grievanceScreen.status.note")}</Label>
            <Textarea id="status-note" rows={2} value={note} onChange={(v: string) => setNote(v)} />
          </div>
        </>
      )}
      {!canReject && (STATUS_TRANSITIONS[c.status] ?? []).includes("REJECTED") && (
        <p className="text-xs text-foreground-subtle">{t("grievanceScreen.status.rejectNeedsSI")}</p>
      )}
      <ErrorNote error={error} />
    </ActionDialog>
  );
}

function NoteDialog({ c, open, onClose, error, setError }: DialogProps) {
  const { t } = useI18n();
  const m = useAddComplaintNote();
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (open) setNote("");
  }, [open]);
  const save = async () => {
    try {
      await m.mutateAsync({ id: c.id, note });
      onClose();
    } catch (err) {
      setError(message(err));
    }
  };
  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title={t("grievanceScreen.note.title")}
      description={t("grievanceScreen.note.description")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={save} disabled={m.isPending}>{t("grievanceScreen.note.save")}</Button>
        </>
      }
    >
      <Textarea id="note-body" rows={3} value={note} onChange={(v: string) => setNote(v)} />
      <ErrorNote error={error} />
    </ActionDialog>
  );
}

function DuplicatesDialog({ c, open, onClose, error, setError }: DialogProps) {
  const { t } = useI18n();
  const candidates = useDuplicateCandidates(c.id, open);
  const m = useLinkDuplicate();
  const [chosen, setChosen] = React.useState<{ id: string; number: string } | null>(null);
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setChosen(null);
      setNote("");
    }
  }, [open]);
  const link = async () => {
    if (!chosen) return;
    try {
      await m.mutateAsync({ id: c.id, originalId: chosen.id, note });
      onClose();
    } catch (err) {
      setError(message(err));
    }
  };
  const list = candidates.data?.data ?? [];
  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title={t("grievanceScreen.duplicates.title")}
      description={t("grievanceScreen.duplicates.rule", { days: candidates.data?.windowDays ?? 30 })}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          {chosen && (
            <Button onClick={link} disabled={m.isPending}>{t("grievanceScreen.duplicates.link")}</Button>
          )}
        </>
      }
    >
      {candidates.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : candidates.isError ? (
        <ErrorNote error={message(candidates.error)} />
      ) : list.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t("grievanceScreen.duplicates.none")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setChosen({ id: d.id, number: d.trackingNumber })}
                className={`w-full rounded-md border p-3 text-left text-sm ${chosen?.id === d.id ? "border-accent bg-accent/10" : "border-border hover:bg-surface-sunken"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono">{d.trackingNumber}</span>
                  <StatusPill>{t(`grievanceScreen.duplicates.${d.rule}`)}</StatusPill>
                </span>
                <span className="mt-1 block font-bengali text-foreground">{d.subject}</span>
                <span className="block text-xs text-foreground-subtle">
                  {t(`grievanceScreen.statuses.${d.status}`)} · {fmt(d.submittedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {chosen && (
        <div className="grid gap-1.5 rounded-md border border-border p-3">
          <p className="text-sm font-medium">{t("grievanceScreen.duplicates.linkTitle", { number: chosen.number })}</p>
          <p className="text-xs text-foreground-muted">{t("grievanceScreen.duplicates.linkHint")}</p>
          <Label htmlFor="dup-note">{t("grievanceScreen.duplicates.note")}</Label>
          <Textarea id="dup-note" rows={2} value={note} onChange={(v: string) => setNote(v)} />
        </div>
      )}
      <ErrorNote error={error} />
    </ActionDialog>
  );
}

function FIRDialog({ c, open, onClose, error, setError }: DialogProps) {
  const { t } = useI18n();
  const m = useLinkComplaintFIR();
  const [search, setSearch] = React.useState("");
  const firs = useQuery({
    queryKey: ["firs", "complaint-link", search],
    queryFn: () => firsApi.list({ search: search || undefined, pageSize: 10 }),
    enabled: open,
  });
  const link = async (firId: string) => {
    try {
      await m.mutateAsync({ id: c.id, firId });
      toast.success(t("grievanceScreen.actions.linkFir"));
      onClose();
    } catch (err) {
      setError(message(err));
    }
  };
  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title={t("grievanceScreen.fir.title")}
      description={t("grievanceScreen.fir.description")}
      footer={<Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>}
    >
      <Input value={search} onChange={(v: string) => setSearch(v)} placeholder={t("grievanceScreen.fir.search")} />
      {firs.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (firs.data?.data ?? []).length === 0 ? (
        <p className="text-sm text-foreground-muted">{t("grievanceScreen.fir.none")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {(firs.data?.data ?? []).map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="font-mono">{f.firNumber}</span>
                <span className="block truncate text-xs text-foreground-subtle">{f.complainantName}</span>
              </span>
              <Button size="sm" variant="outline" onClick={() => link(f.id)} disabled={m.isPending}>
                {t("grievanceScreen.fir.link")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ErrorNote error={error} />
    </ActionDialog>
  );
}

function DraftDialog({ c, open, onClose, error, setError }: DialogProps) {
  const { t } = useI18n();
  const m = useDraftResponse();
  const [body, setBody] = React.useState("");
  React.useEffect(() => {
    if (open) setBody("");
  }, [open]);
  const save = async () => {
    try {
      await m.mutateAsync({ id: c.id, body });
      onClose();
    } catch (err) {
      setError(message(err));
    }
  };
  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title={t("grievanceScreen.response.title")}
      description={t("grievanceScreen.response.description")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={save} disabled={m.isPending}>{t("grievanceScreen.response.save")}</Button>
        </>
      }
    >
      <Label htmlFor="draft-body">{t("grievanceScreen.response.body")}</Label>
      <Textarea id="draft-body" rows={5} className="font-bengali" value={body} onChange={(v: string) => setBody(v)} />
      <ErrorNote error={error} />
    </ActionDialog>
  );
}

function ReviewButtons({ complaint, responseId, onReturn }: { complaint: ComplaintDetail; responseId: string; onReturn: () => void }) {
  const { t } = useI18n();
  const m = useReviewResponse();
  const approve = async () => {
    try {
      await m.mutateAsync({ id: complaint.id, responseId, approve: true });
      toast.success(t("grievanceScreen.detail.approved"));
    } catch (err) {
      toast.error(t("common.error"), message(err));
    }
  };
  return (
    <div className="mt-2 flex gap-2">
      <Button size="sm" onClick={approve} disabled={m.isPending}>
        <CheckCircle2 className="h-4 w-4" />
        {t("grievanceScreen.actions.approve")}
      </Button>
      <Button size="sm" variant="outline" onClick={onReturn}>
        <Undo2 className="h-4 w-4" />
        {t("grievanceScreen.actions.returnDraft")}
      </Button>
    </div>
  );
}

function ReturnDialog({ c, responseId, open, onClose, error, setError }: DialogProps & { responseId: string | null }) {
  const { t } = useI18n();
  const m = useReviewResponse();
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (open) setNote("");
  }, [open]);
  const save = async () => {
    if (!responseId) return;
    try {
      await m.mutateAsync({ id: c.id, responseId, approve: false, note });
      onClose();
    } catch (err) {
      setError(message(err));
    }
  };
  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title={t("grievanceScreen.response.returnTitle")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={save} disabled={m.isPending}>{t("grievanceScreen.actions.returnDraft")}</Button>
        </>
      }
    >
      <Label htmlFor="return-note">{t("grievanceScreen.response.returnNote")}</Label>
      <Textarea id="return-note" rows={3} value={note} onChange={(v: string) => setNote(v)} />
      <ErrorNote error={error} />
    </ActionDialog>
  );
}
