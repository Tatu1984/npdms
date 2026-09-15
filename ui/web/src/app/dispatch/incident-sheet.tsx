"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Loader2, MapPin, Radio, Siren, Timer, TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Field, StatusPill } from "@/components/platform/primitives";
import { RecordLinkPicker, type RecordLink } from "@/components/platform/pickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/stores/toastStore";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import {
  useAssignUnit,
  useClassifyIncident,
  useCloseIncident,
  useDispatchPolicy,
  useDispatchUnits,
  useEscalateIncident,
  useIncident,
  useIncidentEvents,
  useStandDown,
  useUnitStep,
} from "@/hooks/use-dispatch";
import {
  OUTCOMES,
  SEVERITIES,
  type DispatchAssignment,
  type IncidentOutcome,
  type IncidentSeverity,
} from "@/lib/api/dispatch";
import { SEVERITY_TONE, STATUS_TONE, formatClock } from "./tones";

const selectClass =
  "h-10 w-full rounded-md border border-border bg-background-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

function message(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export function IncidentSheet({ incidentId, onClose }: { incidentId: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const canOperate = Boolean(user && hasMinimumRole(user.role, "ASI"));

  const incident = useIncident(incidentId);
  const events = useIncidentEvents(incidentId);
  const policy = useDispatchPolicy();
  const inc = incident.data;
  const dispatchable = Boolean(inc && (inc.status === "CLASSIFIED" || inc.status === "DISPATCHED" || inc.status === "ON_SCENE"));
  const units = useDispatchUnits(incidentId ?? undefined, Boolean(incidentId) && canOperate && dispatchable);

  const classify = useClassifyIncident();
  const assign = useAssignUnit();
  const step = useUnitStep();
  const standDown = useStandDown();
  const escalate = useEscalateIncident();
  const close = useCloseIncident();

  const [type, setType] = React.useState("");
  const [severity, setSeverity] = React.useState<IncidentSeverity | "">("");
  const [standDownFor, setStandDownFor] = React.useState<DispatchAssignment | null>(null);
  const [reason, setReason] = React.useState("");
  const [escalateOpen, setEscalateOpen] = React.useState(false);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [outcome, setOutcome] = React.useState<IncidentOutcome>("RESOLVED_ON_SCENE");
  const [note, setNote] = React.useState("");
  const [fir, setFir] = React.useState<RecordLink | null>(null);
  const [assigning, setAssigning] = React.useState<string | null>(null);

  React.useEffect(() => {
    setType(inc?.incidentType ?? "");
    setSeverity(inc?.severity ?? "");
  }, [inc?.id, inc?.incidentType, inc?.severity]);

  const saveClassification = async () => {
    if (!inc || !severity) return;
    try {
      await classify.mutateAsync({ id: inc.id, incidentType: type, severity });
      toast.success(t("dispatchScreen.classify.done"), `${inc.incidentNumber}`);
    } catch (err) {
      toast.error(t("dispatchScreen.classify.failed"), message(err));
    }
  };

  const dispatchUnit = async (kind: "VEHICLE" | "OFFICER", unitId: string, label: string) => {
    if (!inc) return;
    setAssigning(unitId);
    try {
      await assign.mutateAsync({ id: inc.id, kind, unitId });
      toast.success(t("dispatchScreen.recommend.done"), `${label} → ${inc.incidentNumber}`);
    } catch (err) {
      toast.error(t("dispatchScreen.recommend.failed"), message(err));
    } finally {
      setAssigning(null);
    }
  };

  const runStep = async (a: DispatchAssignment, s: "acknowledge" | "onScene" | "clear") => {
    try {
      await step.mutateAsync({ assignmentId: a.id, step: s });
    } catch (err) {
      toast.error(t("dispatchScreen.assignments.stepFailed"), message(err));
    }
  };

  const canActFor = (a: DispatchAssignment) => canOperate || (user && a.officerId === user.id);

  return (
    <Sheet open={incidentId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {incident.isPending ? (
          <div className="flex h-40 items-center justify-center gap-2 text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : incident.isError ? (
          <div className="flex flex-col gap-3 p-6">
            <p className="text-sm font-medium text-foreground">{t("dispatchScreen.detail.notFound")}</p>
            <p className="text-sm text-foreground-muted">{message(incident.error)}</p>
          </div>
        ) : inc ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-2">
                <span className="font-mono">{inc.incidentNumber}</span>
                <StatusPill tone={STATUS_TONE[inc.status]}>{t(`dispatchScreen.statuses.${inc.status}`)}</StatusPill>
                {inc.severity && (
                  <StatusPill tone={SEVERITY_TONE[inc.severity]}>{t(`dispatchScreen.severities.${inc.severity}`)}</StatusPill>
                )}
                {inc.escalationLevel > 0 && (
                  <StatusPill tone="danger">{t("dispatchScreen.escalated", { n: inc.escalationLevel })}</StatusPill>
                )}
              </SheetTitle>
              <SheetDescription>{inc.incidentType ?? t("dispatchScreen.unclassified")}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-5 pb-6">
              <p className="text-sm text-foreground">{inc.description}</p>
              <dl className="grid grid-cols-2 gap-3">
                <Field label={t("dispatchScreen.detail.reported")} value={`${formatClock(inc.receivedAt)} · ${t(`dispatchScreen.sources.${inc.source}`)}`} />
                <Field
                  label={t("dispatchScreen.detail.caller")}
                  value={[inc.callerName, inc.callerPhone].filter(Boolean).join(" · ") || "—"}
                />
                <Field label={t("dispatchScreen.detail.location")} value={inc.locationText} />
                <Field
                  label={t("dispatchScreen.detail.coordinates")}
                  value={
                    inc.latitude !== null && inc.longitude !== null
                      ? `${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)}`
                      : t("dispatchScreen.detail.noCoordinates")
                  }
                />
                <Field label={t("dispatchScreen.detail.station")} value={inc.stationName} />
                <Field label={t("dispatchScreen.detail.loggedBy")} value={inc.createdByName} />
                {inc.classifiedByName && (
                  <Field label={t("dispatchScreen.detail.classifiedBy")} value={`${inc.classifiedByName} · ${formatClock(inc.classifiedAt)}`} />
                )}
                {inc.status === "CLOSED" && inc.outcome && (
                  <>
                    <Field label={t("dispatchScreen.detail.outcome")} value={t(`dispatchScreen.outcomes.${inc.outcome}`)} />
                    <Field label={t("dispatchScreen.detail.closedBy")} value={`${inc.closedByName} · ${formatClock(inc.closedAt)}`} />
                    {inc.outcomeNote && <Field className="col-span-2" label={t("dispatchScreen.close.note")} value={inc.outcomeNote} />}
                    {inc.firId && (
                      <Field
                        label={t("dispatchScreen.close.fir")}
                        value={<Link className="text-accent hover:underline" href={`/fir/${inc.firId}`}>{inc.firNumber}</Link>}
                      />
                    )}
                  </>
                )}
              </dl>

              {canOperate && inc.status !== "CLOSED" && (
                <section className="flex flex-col gap-3 rounded-md border border-border p-4" aria-labelledby="classify-title">
                  <h3 id="classify-title" className="text-sm font-medium text-foreground">
                    {t("dispatchScreen.classify.title")}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      id="classify-type"
                      label={t("dispatchScreen.classify.type")}
                      placeholder={t("dispatchScreen.classify.typePlaceholder")}
                      value={type}
                      onChange={(v: string) => setType(v)}
                    />
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="classify-severity">{t("dispatchScreen.classify.severity")}</Label>
                      <select
                        id="classify-severity"
                        className={selectClass}
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                      >
                        <option value="">—</option>
                        {SEVERITIES.map((s) => (
                          <option key={s} value={s}>
                            {t(`dispatchScreen.severities.${s}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {policy.data && (
                    <ul className="flex flex-col gap-1 text-xs text-foreground-muted">
                      {policy.data.severities.map((d) => (
                        <li key={d.severity}>
                          <span className="font-medium text-foreground">{t(`dispatchScreen.severities.${d.severity}`)}</span>
                          {" — "}
                          {d.meaning} ({t("dispatchScreen.classify.arrival", { n: d.onSceneMinutes })})
                        </li>
                      ))}
                    </ul>
                  )}
                  <div>
                    <Button onClick={saveClassification} disabled={!type.trim() || !severity || classify.isPending}>
                      {inc.severity ? t("dispatchScreen.classify.reclassify") : t("dispatchScreen.classify.submit")}
                    </Button>
                  </div>
                </section>
              )}

              <section className="flex flex-col gap-2" aria-labelledby="assignments-title">
                <h3 id="assignments-title" className="text-sm font-medium text-foreground">
                  {t("dispatchScreen.assignments.title")}
                </h3>
                {(inc.assignments ?? []).length === 0 ? (
                  <p className="text-sm text-foreground-muted">{t("dispatchScreen.assignments.none")}</p>
                ) : (
                  (inc.assignments ?? []).map((a) => {
                    const label = a.vehicleNumber || a.officerName;
                    return (
                      <div key={a.id} className="flex flex-col gap-2 rounded-md border border-border p-3" data-assignment={label}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-foreground-subtle">
                              {a.unitKind === "VEHICLE" && a.officerName ? `${t("dispatchScreen.units.crew")}: ${a.officerName} · ` : ""}
                              {t("dispatchScreen.assignments.assignedBy", { name: a.assignedByName })} · {formatClock(a.assignedAt)}
                              {a.distanceKm !== null && ` · ${t("dispatchScreen.assignments.distanceAtDispatch", { km: a.distanceKm.toFixed(2) })}`}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {a.ackOverdue && <StatusPill tone="danger">{t("dispatchScreen.assignments.ackOverdue")}</StatusPill>}
                            {a.onSceneOverdue && <StatusPill tone="danger">{t("dispatchScreen.assignments.sceneOverdue")}</StatusPill>}
                            <StatusPill tone={a.status === "CANCELLED" ? "neutral" : a.status === "CLEARED" ? "success" : "info"}>
                              {t(`dispatchScreen.assignmentStatuses.${a.status}`)}
                            </StatusPill>
                          </div>
                        </div>
                        <p className="text-xs text-foreground-muted">
                          {[
                            a.acknowledgedAt &&
                              `${t("dispatchScreen.assignmentStatuses.ACKNOWLEDGED")} ${formatClock(a.acknowledgedAt)} (${a.acknowledgedByName})`,
                            a.onSceneAt && `${t("dispatchScreen.assignmentStatuses.ON_SCENE")} ${formatClock(a.onSceneAt)}`,
                            a.clearedAt && `${t("dispatchScreen.assignmentStatuses.CLEARED")} ${formatClock(a.clearedAt)}`,
                            a.cancelledAt &&
                              `${t("dispatchScreen.assignmentStatuses.CANCELLED")} ${formatClock(a.cancelledAt)}: ${a.cancelReason}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {canActFor(a) && ["ASSIGNED", "ACKNOWLEDGED", "ON_SCENE"].includes(a.status) && (
                          <div className="flex flex-wrap gap-2">
                            {a.status === "ASSIGNED" && (
                              <Button size="sm" onClick={() => runStep(a, "acknowledge")} disabled={step.isPending}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t("dispatchScreen.assignments.acknowledge")}
                              </Button>
                            )}
                            {a.status === "ACKNOWLEDGED" && (
                              <Button size="sm" onClick={() => runStep(a, "onScene")} disabled={step.isPending}>
                                <MapPin className="h-3.5 w-3.5" />
                                {t("dispatchScreen.assignments.onScene")}
                              </Button>
                            )}
                            {a.status === "ON_SCENE" && (
                              <Button size="sm" onClick={() => runStep(a, "clear")} disabled={step.isPending}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t("dispatchScreen.assignments.clear")}
                              </Button>
                            )}
                            {canOperate && a.status !== "ON_SCENE" && (
                              <Button size="sm" variant="outline" onClick={() => { setReason(""); setStandDownFor(a); }}>
                                {t("dispatchScreen.assignments.standDown")}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </section>

              {canOperate && inc.status === "NEW" && (
                <p className="rounded-md border border-border bg-surface-sunken p-3 text-sm text-foreground-muted">
                  {t("dispatchScreen.recommend.classifyFirst")}
                </p>
              )}

              {canOperate && dispatchable && (
                <section className="flex flex-col gap-2" aria-labelledby="recommend-title">
                  <h3 id="recommend-title" className="text-sm font-medium text-foreground">
                    {t("dispatchScreen.recommend.title")}
                  </h3>
                  {policy.data && <p className="text-xs text-foreground-muted">{policy.data.recommendation}</p>}
                  {units.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
                  ) : units.isError ? (
                    <p className="text-sm text-danger">{message(units.error)}</p>
                  ) : (
                    (() => {
                      const available = units.data.filter((u) => u.availability === "AVAILABLE");
                      if (available.length === 0) {
                        return <p className="text-sm text-foreground-muted">{t("dispatchScreen.recommend.noneAvailable")}</p>;
                      }
                      return available.map((u) => (
                        <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3" data-unit={u.label}>
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-medium text-foreground">{u.label}</p>
                            <p className="text-xs text-foreground-subtle">
                              {u.kind === "VEHICLE" ? t("dispatchScreen.units.vehicle") : t("dispatchScreen.units.officer")} · {u.detail} · {u.stationName}
                              {u.kind === "VEHICLE" && u.crewName && ` · ${t("dispatchScreen.units.crew")}: ${u.crewName}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-foreground-muted">
                              {u.distanceKm !== null
                                ? `${t("dispatchScreen.recommend.straightLine", { km: u.distanceKm.toFixed(2) })} · ${t(`dispatchScreen.position.${u.positionSource}`)}`
                                : t("dispatchScreen.recommend.noDistance")}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => dispatchUnit(u.kind, u.id, u.label)}
                              disabled={assigning !== null}
                            >
                              <Radio className="h-3.5 w-3.5" />
                              {t("dispatchScreen.recommend.assign")}
                            </Button>
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </section>
              )}

              {inc.status !== "CLOSED" && (
                <div className="flex flex-wrap gap-2">
                  {canOperate && (
                    <>
                      <Button variant="outline" onClick={() => { setReason(""); setEscalateOpen(true); }}>
                        <ArrowUpRight className="h-4 w-4" />
                        {t("dispatchScreen.escalate.action")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setOutcome("RESOLVED_ON_SCENE");
                          setNote("");
                          setFir(null);
                          setCloseOpen(true);
                        }}
                        disabled={inc.status === "DISPATCHED" || inc.status === "ON_SCENE"}
                        title={inc.status === "DISPATCHED" || inc.status === "ON_SCENE" ? t("dispatchScreen.close.blocked") : undefined}
                      >
                        {t("dispatchScreen.close.action")}
                      </Button>
                    </>
                  )}
                  <Link href="/fir/new">
                    <Button variant="ghost">
                      <Siren className="h-4 w-4" />
                      {t("dispatchScreen.links.fir")}
                    </Button>
                  </Link>
                </div>
              )}

              <section className="flex flex-col gap-2" aria-labelledby="timeline-title">
                <h3 id="timeline-title" className="text-sm font-medium text-foreground">
                  {t("dispatchScreen.timeline.title")}
                </h3>
                {events.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
                ) : events.isError ? (
                  <p className="text-sm text-danger">{message(events.error)}</p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {events.data.map((e) => (
                      <li key={e.id} className="flex gap-3 text-sm" data-event={e.eventType}>
                        <span className="w-14 shrink-0 font-mono text-xs text-foreground-subtle">{formatClock(e.occurredAt)}</span>
                        <span className="flex flex-col">
                          <span className={e.eventType === "ESCALATED" || e.eventType === "ON_SCENE_OVERDUE" ? "text-danger" : "text-foreground"}>
                            {e.eventType === "ESCALATED" || e.eventType === "ON_SCENE_OVERDUE" ? (
                              <TriangleAlert className="mr-1 inline h-3.5 w-3.5" />
                            ) : e.eventType === "ASSIGNED" ? (
                              <Timer className="mr-1 inline h-3.5 w-3.5" />
                            ) : null}
                            {e.detail}
                          </span>
                          <span className="text-xs text-foreground-subtle">
                            {e.actorId ? e.actorName : t("dispatchScreen.timeline.rule")}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                {policy.data && <p className="text-xs text-foreground-subtle">{policy.data.notification}</p>}
              </section>
            </div>

            <Dialog open={standDownFor !== null} onOpenChange={(o) => !o && setStandDownFor(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("dispatchScreen.assignments.standDownTitle")}</DialogTitle>
                  <DialogDescription>{standDownFor?.vehicleNumber || standDownFor?.officerName}</DialogDescription>
                </DialogHeader>
                <Textarea id="standdown-reason" label={t("dispatchScreen.assignments.reason")} value={reason} onChange={(v: string) => setReason(v)} rows={3} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStandDownFor(null)}>{t("common.cancel")}</Button>
                  <Button
                    disabled={!reason.trim() || standDown.isPending}
                    onClick={async () => {
                      if (!standDownFor) return;
                      try {
                        await standDown.mutateAsync({ assignmentId: standDownFor.id, reason });
                        setStandDownFor(null);
                      } catch (err) {
                        toast.error(t("dispatchScreen.assignments.stepFailed"), message(err));
                      }
                    }}
                  >
                    {t("dispatchScreen.assignments.standDown")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("dispatchScreen.escalate.title")}</DialogTitle>
                  <DialogDescription>{inc.incidentNumber}</DialogDescription>
                </DialogHeader>
                <Textarea id="escalate-reason" label={t("dispatchScreen.escalate.reason")} value={reason} onChange={(v: string) => setReason(v)} rows={3} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEscalateOpen(false)}>{t("common.cancel")}</Button>
                  <Button
                    disabled={!reason.trim() || escalate.isPending}
                    onClick={async () => {
                      try {
                        await escalate.mutateAsync({ id: inc.id, reason });
                        setEscalateOpen(false);
                      } catch (err) {
                        toast.error(t("dispatchScreen.escalate.failed"), message(err));
                      }
                    }}
                  >
                    {t("dispatchScreen.escalate.submit")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("dispatchScreen.close.title")}</DialogTitle>
                  <DialogDescription>{inc.incidentNumber}</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="close-outcome">{t("dispatchScreen.close.outcome")}</Label>
                    <select
                      id="close-outcome"
                      className={selectClass}
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value as IncidentOutcome)}
                    >
                      {OUTCOMES.map((o) => (
                        <option key={o} value={o}>
                          {t(`dispatchScreen.outcomes.${o}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {outcome === "FIR_REGISTERED" && (
                    <div className="flex flex-col gap-1.5">
                      <Label>{t("dispatchScreen.close.fir")}</Label>
                      <RecordLinkPicker value={fir} onChange={setFir} />
                    </div>
                  )}
                  <Textarea id="close-note" label={t("dispatchScreen.close.note")} value={note} onChange={(v: string) => setNote(v)} rows={3} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCloseOpen(false)}>{t("common.cancel")}</Button>
                  <Button
                    disabled={close.isPending}
                    onClick={async () => {
                      const firId = fir ? (fir.kind === "fir" ? fir.id : fir.firId) : null;
                      try {
                        await close.mutateAsync({ id: inc.id, outcome, note, firId });
                        setCloseOpen(false);
                      } catch (err) {
                        toast.error(t("dispatchScreen.close.failed"), message(err));
                      }
                    }}
                  >
                    {t("dispatchScreen.close.submit")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

