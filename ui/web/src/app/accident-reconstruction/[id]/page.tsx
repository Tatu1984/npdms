"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CarFront,
  FileCheck2,
  FileText,
  Pencil,
  Plus,
  Receipt,
  Route,
  ShieldAlert,
  Siren,
  Trash2,
  TrafficCone,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { EmptyState, Field, PageHeader, Panel, PhaseBadge, StatusPill } from "@/components/platform/primitives";
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
import type { RecordLink } from "@/components/platform/pickers";
import { ApiClientError } from "@/lib/api/client";
import { AttachReadDialog } from "@/components/anpr/attach-read-dialog";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import {
  useAddCamera,
  useAddFact,
  useAddPerson,
  useAddPlateRead,
  useAddSignalPhase,
  useAddVehicle,
  useApproveReport,
  useCreateReport,
  useIncidentWorkspace,
  useRemoveIncidentRecord,
  useReturnReport,
  useSubmitReport,
  useUpdateIncident,
  useUpdateReport,
} from "@/hooks/use-traffic-incidents";
import {
  INJURY_SEVERITIES,
  PERSON_ROLES,
  PLATE_SOURCES,
  PROVENANCES,
  QUANTITY_UNITS,
  SIGNAL_PHASES,
  SIGNAL_SOURCES,
  VEHICLE_TYPES,
  type ChildKind,
  type IncidentReport,
  type ReportContent,
  type InjurySeverity,
  type PersonRole,
  type PlateReadSource,
  type Provenance,
  type Quantity,
  type SignalPhaseValue,
  type SignalSource,
  type TimelineItem,
  type VehicleType,
} from "@/lib/api/traffic-incidents";
import {
  FactValue,
  IncidentFields,
  NativeSelect,
  ProvenanceBadge,
  errorMessage,
  formatWhen,
  incidentFormToInput,
  incidentToForm,
  localToApi,
} from "../shared";

/* ----------------------------- generic pieces ------------------------------ */

function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  error,
  pending,
  submitLabel,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  error: string | null;
  pending: boolean;
  submitLabel: string;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-3">{children}</div>
        {error && (
          <Alert variant="danger">
            <ShieldAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("accidentScreen.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            {pending ? t("accidentScreen.saving") : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} step={type === "datetime-local" ? 1 : undefined} value={value} onChange={onChange} placeholder={hint} />
    </div>
  );
}

/** Runs a mutation from a dialog, keeping the API's message on failure. */
function useDialogForm<T>(initial: () => T) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<T>(initial);
  const [error, setError] = React.useState<string | null>(null);
  const openWith = (f?: T) => {
    setForm(f ?? initial());
    setError(null);
    setOpen(true);
  };
  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return { open, setOpen, form, setForm, error, openWith, run };
}

const blank = (v: string) => (v.trim() === "" ? null : v.trim());
const numOrNull = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v));

/* ---------------------------------- page ----------------------------------- */

export default function TrafficIncidentPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { user } = useAuthStore();
  const canRecord = Boolean(user && hasMinimumRole(user.role, "ASI"));
  const canReview = Boolean(user && hasMinimumRole(user.role, "SI"));

  const workspace = useIncidentWorkspace(id);
  const ws = workspace.data;
  const incident = { isLoading: workspace.isLoading, isError: workspace.isError, error: workspace.error, data: ws?.incident };
  // Every panel reads the same response; its state is the workspace query's.
  const panel = <T,>(data: T[] | undefined) => ({
    isLoading: workspace.isLoading, isError: workspace.isError, error: workspace.error,
    refetch: workspace.refetch, data,
  });
  const vehicles = panel(ws?.vehicles);
  const persons = panel(ws?.persons);
  const cameras = panel(ws?.cameras);
  const plateReads = panel(ws?.plateReads);
  const signals = panel(ws?.signalPhases);
  const timeline = panel(ws?.timeline);
  const challans = panel(ws?.priorChallans);

  const updateIncident = useUpdateIncident();
  const addVehicle = useAddVehicle(id);
  const addPerson = useAddPerson(id);
  const addCamera = useAddCamera(id);
  const addPlateRead = useAddPlateRead(id);
  const addSignal = useAddSignalPhase(id);
  const addFact = useAddFact(id);
  const removeRecord = useRemoveIncidentRecord(id);

  const edit = useDialogForm(() => ({ form: incident.data ? incidentToForm(incident.data) : null, fir: null as RecordLink | null }));
  const vehicleDlg = useDialogForm(() => ({ registrationNumber: "", vehicleType: "CAR" as VehicleType, description: "", driverName: "" }));
  const personDlg = useDialogForm(() => ({
    name: "", role: "DRIVER" as PersonRole, vehicleId: "", injurySeverity: "MINOR" as InjurySeverity, hospital: "",
  }));
  const cameraDlg = useDialogForm(() => ({ cameraRef: "", cameraName: "", distanceM: "", footageFrom: "", footageTo: "", notes: "" }));
  const plateDlg = useDialogForm(() => ({
    registrationNumber: "", readAt: "", location: "", cameraRef: "", source: "ANPR_SYSTEM" as PlateReadSource, sourceDetail: "",
  }));
  const signalDlg = useDialogForm(() => ({
    signalRef: "", approach: "", phase: "RED" as SignalPhaseValue, phaseFrom: "", phaseTo: "",
    source: "CONTROLLER_LOG" as SignalSource, sourceDetail: "",
  }));
  const factDlg = useDialogForm(() => ({
    occurredAt: "", description: "", provenance: "MEASURED" as Provenance, source: "", method: "", vehicleId: "",
    quantity: "" as Quantity | "", value: "", valueLow: "", valueHigh: "", ranged: false,
  }));

  const [attachAnprOpen, setAttachAnprOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<{ kind: ChildKind; recordId: string; label: string } | null>(null);
  const [removeError, setRemoveError] = React.useState<string | null>(null);

  if (incident.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (incident.isError || !incident.data) {
    const notFound = incident.error instanceof ApiClientError && incident.error.code === 404;
    return (
      <DashboardLayout>
        <EmptyState
          icon={notFound ? Siren : ShieldAlert}
          title={notFound ? t("accidentScreen.notFound") : t("accidentScreen.loadFailed")}
          description={notFound ? t("accidentScreen.notFoundDesc") : errorMessage(incident.error)}
          action={
            <Link href="/accident-reconstruction">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                {t("accidentScreen.back")}
              </Button>
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  const inc = incident.data;
  const vehicleOptions = (vehicles.data ?? []).map((v) => ({ value: v.id, label: v.registrationNumber }));

  const removeButton = (kind: ChildKind, recordId: string, label: string) =>
    canRecord ? (
      <Button
        variant="ghost"
        size="icon"
        aria-label={`${t("accidentScreen.remove")} ${label}`}
        onClick={() => {
          setRemoveError(null);
          setRemoving({ kind, recordId, label });
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    ) : null;

  const addButton = (label: string, onClick: () => void) =>
    canRecord ? (
      <Button variant="outline" size="sm" onClick={onClick}>
        <Plus className="h-4 w-4" />
        {label}
      </Button>
    ) : undefined;

  const listState = (q: { isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown }, empty: boolean) => {
    if (q.isLoading) return <Skeleton className="h-12 w-full" />;
    if (q.isError)
      return (
        <p className="text-sm text-danger">
          {errorMessage(q.error)}{" "}
          <button type="button" className="underline" onClick={() => q.refetch()}>
            {t("accidentScreen.retry")}
          </button>
        </p>
      );
    if (empty) return <p className="text-sm text-foreground-subtle">{t("accidentScreen.none")}</p>;
    return null;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={inc.location}
          description={`${inc.incidentNumber} · ${formatWhen(inc.occurredAt, true)}`}
          icon={Siren}
          badge={<PhaseBadge phase={6} />}
          breadcrumb={[
            { label: t("nav.trafficGroup") },
            { label: t("modules.accidentReconstruction"), href: "/accident-reconstruction" },
            { label: inc.incidentNumber },
          ]}
          actions={
            canRecord ? (
              <Button variant="outline" onClick={() => edit.openWith({ form: incidentToForm(inc), fir: null })}>
                <Pencil className="h-4 w-4" />
                {t("accidentScreen.editTitle")}
              </Button>
            ) : undefined
          }
        />

        <Alert variant="info">
          <Route />
          <AlertDescription>{t("accidentScreen.laterLayer")}</AlertDescription>
        </Alert>

        {/* overview */}
        <Panel title={t("accidentScreen.sections.overview")}>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field label={t("accidentScreen.fields.occurredAt")} value={formatWhen(inc.occurredAt, true)} />
            <Field
              label={`${t("accidentScreen.fields.latitude")}, ${t("accidentScreen.fields.longitude")}`}
              value={`${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)}`}
              mono
            />
            <Field label={t("accidentScreen.fields.station")} value={inc.stationName || "—"} />
            <Field
              label={t("accidentScreen.fields.fir")}
              value={inc.firId ? <Link className="text-accent hover:underline" href={`/fir/${inc.firId}`}>{inc.firNumber}</Link> : "—"}
            />
            <Field label={t("accidentScreen.fields.collisionType")} value={t(`accidentScreen.enums.collision.${inc.collisionType}`)} />
            <Field label={t("accidentScreen.fields.roadCondition")} value={t(`accidentScreen.enums.road.${inc.roadCondition}`)} />
            <Field label={t("accidentScreen.fields.weather")} value={t(`accidentScreen.enums.weather.${inc.weather}`)} />
            <Field label={t("accidentScreen.fields.lighting")} value={t(`accidentScreen.enums.lighting.${inc.lighting}`)} />
            <Field className="col-span-2 md:col-span-3" label={t("accidentScreen.fields.description")} value={inc.description} />
            <Field label={t("accidentScreen.fields.reportedBy")} value={inc.reportedByName || "—"} />
          </dl>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* vehicles */}
          <Panel
            title={<span className="flex items-center gap-2"><CarFront className="h-4 w-4" />{t("accidentScreen.sections.vehicles")}</span>}
            actions={addButton(t("accidentScreen.vehicle.add"), () => vehicleDlg.openWith())}
          >
            {listState(vehicles, (vehicles.data ?? []).length === 0) ?? (
              <ul className="divide-y divide-border" data-testid="vehicles">
                {(vehicles.data ?? []).map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium text-foreground">{v.registrationNumber}</p>
                      <p className="text-xs text-foreground-muted">
                        {t(`accidentScreen.enums.vehicle.${v.vehicleType}`)}
                        {v.driverName ? ` · ${v.driverName}` : ""}
                        {v.description ? ` · ${v.description}` : ""}
                      </p>
                    </div>
                    {removeButton("vehicles", v.id, v.registrationNumber)}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* persons */}
          <Panel
            title={<span className="flex items-center gap-2"><Users className="h-4 w-4" />{t("accidentScreen.sections.persons")}</span>}
            actions={addButton(t("accidentScreen.person.add"), () => personDlg.openWith())}
          >
            {listState(persons, (persons.data ?? []).length === 0) ?? (
              <ul className="divide-y divide-border" data-testid="persons">
                {(persons.data ?? []).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{p.name ?? t("accidentScreen.person.unidentified")}</p>
                      <p className="text-xs text-foreground-muted">
                        {t(`accidentScreen.enums.role.${p.role}`)}
                        {p.vehicleRegistration ? ` · ${p.vehicleRegistration}` : ""}
                        {p.hospital ? ` · ${p.hospital}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusPill tone={p.injurySeverity === "FATAL" ? "danger" : p.injurySeverity === "GRIEVOUS" ? "warning" : "neutral"}>
                        {t(`accidentScreen.enums.severity.${p.injurySeverity}`)}
                      </StatusPill>
                      {removeButton("persons", p.id, p.name ?? p.role)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* cameras */}
          <Panel
            title={<span className="flex items-center gap-2"><Camera className="h-4 w-4" />{t("accidentScreen.sections.cameras")}</span>}
            description={t("accidentScreen.sections.camerasDesc")}
            actions={addButton(t("accidentScreen.camera.add"), () => cameraDlg.openWith())}
          >
            {listState(cameras, (cameras.data ?? []).length === 0) ?? (
              <ul className="divide-y divide-border" data-testid="cameras">
                {(cameras.data ?? []).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        <span className="font-mono">{c.cameraRef}</span>
                        {c.cameraName ? ` · ${c.cameraName}` : ""}
                        {c.distanceM !== null ? ` · ${c.distanceM} m` : ""}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {formatWhen(c.footageFrom, true)} – {formatWhen(c.footageTo, true)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusPill tone={c.coversIncident ? "success" : "warning"}>
                        {c.coversIncident ? t("accidentScreen.camera.covers") : t("accidentScreen.camera.notCovers")}
                      </StatusPill>
                      {removeButton("cameras", c.id, c.cameraRef)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* plate reads */}
          <Panel
            title={<span className="flex items-center gap-2"><CarFront className="h-4 w-4" />{t("accidentScreen.sections.plateReads")}</span>}
            description={t("accidentScreen.sections.plateReadsDesc")}
            actions={
              <>
                {canRecord && (
                  <Button variant="outline" size="sm" onClick={() => setAttachAnprOpen(true)} data-testid="open-attach-anpr">
                    <Plus className="h-4 w-4" />
                    {t("anprScreen.attach.button")}
                  </Button>
                )}
                {addButton(t("accidentScreen.plate.add"), () => plateDlg.openWith())}
              </>
            }
          >
            {listState(plateReads, (plateReads.data ?? []).length === 0) ?? (
              <ul className="divide-y divide-border" data-testid="plate-reads">
                {(plateReads.data ?? []).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        <span className="font-mono">{p.registrationNumber}</span> · {p.location}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {formatWhen(p.readAt, true)} · {t(`accidentScreen.enums.plateSource.${p.source}`)}
                        {p.cameraRef ? ` · ${p.cameraRef}` : ""}
                      </p>
                      {p.anprPlateReadId && p.readConfidence != null && (
                        <p className="flex flex-wrap items-center gap-1 text-xs text-foreground-muted">
                          <StatusPill tone="ai">{t("anprScreen.attach.aiRead", { confidence: `${Math.round(p.readConfidence * 100)}%` })}</StatusPill>
                          <span className="text-foreground-subtle">{p.modelVersion}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusPill tone={p.matchedVehicleId ? "success" : "neutral"}>
                        {p.matchedVehicleId ? t("accidentScreen.plate.matched") : t("accidentScreen.plate.unmatched")}
                      </StatusPill>
                      {removeButton("plate-reads", p.id, p.registrationNumber)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* signal phases */}
          <Panel
            title={<span className="flex items-center gap-2"><TrafficCone className="h-4 w-4" />{t("accidentScreen.sections.signals")}</span>}
            description={t("accidentScreen.sections.signalsDesc")}
            actions={addButton(t("accidentScreen.signal.add"), () => signalDlg.openWith())}
          >
            {listState(signals, (signals.data ?? []).length === 0) ?? (
              <ul className="divide-y divide-border" data-testid="signal-phases">
                {(signals.data ?? []).map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        <span className="font-mono">{g.signalRef}</span> · {g.approach} ·{" "}
                        {t(`accidentScreen.enums.phase.${g.phase}`)}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {formatWhen(g.phaseFrom, true)}
                        {g.phaseTo ? ` – ${formatWhen(g.phaseTo, true)}` : ""} ·{" "}
                        {t(`accidentScreen.enums.signalSource.${g.source}`)} · {g.sourceDetail}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {g.activeAtIncident && <StatusPill tone="info">{t("accidentScreen.signal.active")}</StatusPill>}
                      {removeButton("signal-phases", g.id, g.signalRef)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* prior challans */}
          <Panel title={<span className="flex items-center gap-2"><Receipt className="h-4 w-4" />{t("accidentScreen.sections.challans")}</span>}>
            {listState(challans, (challans.data ?? []).length === 0) ?? (
              <ul className="divide-y divide-border">
                {(challans.data ?? []).map((c) => (
                  <li key={c.challanNumber} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="font-mono">{c.challanNumber}</span>
                    <span className="text-foreground-muted">
                      {c.vehicleNumber} · {formatWhen(c.violationDate)} · {c.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* timeline with facts */}
        <Panel
          title={<span className="flex items-center gap-2"><Route className="h-4 w-4" />{t("accidentScreen.sections.timeline")}</span>}
          description={t("accidentScreen.sections.timelineDesc")}
          actions={addButton(t("accidentScreen.fact.add"), () => factDlg.openWith())}
        >
          <div className="mb-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
            {PROVENANCES.map((p) => (
              <span key={p} className="flex items-center gap-1.5">
                <ProvenanceBadge provenance={p} />
                {t(`accidentScreen.provenance.${p}Hint`)}
              </span>
            ))}
          </div>
          {listState(timeline, (timeline.data ?? []).length === 0) ?? (
            <ol className="flex flex-col gap-3" data-testid="timeline">
              {(timeline.data ?? []).map((item: TimelineItem) => (
                <li
                  key={`${item.kind}-${item.recordId}`}
                  data-provenance={item.provenance}
                  className="flex gap-3 border-l-2 border-border pl-3 text-sm"
                >
                  <span className="w-28 shrink-0 font-mono text-xs text-foreground-subtle">
                    {new Date(item.at).toLocaleTimeString("en-IN", { hour12: false })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProvenanceBadge provenance={item.provenance} />
                      <StatusPill>{t(`accidentScreen.timeline.kinds.${item.kind}`)}</StatusPill>
                      <span className="text-foreground">{item.summary}</span>
                      {item.fact && <FactValue fact={item.fact} />}
                    </div>
                    <p className="mt-0.5 text-xs text-foreground-subtle">
                      {t("accidentScreen.timeline.source")}: {item.source}
                    </p>
                    {item.method && (
                      <p className="text-xs italic text-warning">
                        {t("accidentScreen.timeline.method")}: {item.method}
                      </p>
                    )}
                  </div>
                  {item.kind === "FACT" && removeButton("facts", item.recordId, item.summary)}
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <ReportPanel
          incidentId={id}
          reports={ws?.reports ?? []}
          draft={ws ?? null}
          canRecord={canRecord}
          canReview={canReview}
          currentUserId={user?.id}
        />
      </div>

      {/* edit incident */}
      {edit.form.form && (
        <FormDialog
          open={edit.open}
          onOpenChange={edit.setOpen}
          title={t("accidentScreen.editTitle")}
          error={edit.error}
          pending={updateIncident.isPending}
          submitLabel={t("accidentScreen.save")}
          onSubmit={() =>
            edit.run(() =>
              updateIncident.mutateAsync({ id, input: incidentFormToInput(edit.form.form!) }))
          }
        >
          <IncidentFields
            form={edit.form.form}
            setForm={(f) => edit.setForm({ ...edit.form, form: f })}
            firLink={edit.form.fir ?? (inc.firId ? { kind: "fir", id: inc.firId, label: `FIR ${inc.firNumber}` } : null)}
            setFirLink={(l) => edit.setForm({ form: { ...edit.form.form!, firId: l ? (l.kind === "fir" ? l.id : l.firId) : null }, fir: l })}
          />
        </FormDialog>
      )}

      {/* add vehicle */}
      <FormDialog
        open={vehicleDlg.open}
        onOpenChange={vehicleDlg.setOpen}
        title={t("accidentScreen.vehicle.add")}
        error={vehicleDlg.error}
        pending={addVehicle.isPending}
        submitLabel={t("accidentScreen.add")}
        onSubmit={() =>
          vehicleDlg.run(() =>
            addVehicle.mutateAsync({
              registrationNumber: vehicleDlg.form.registrationNumber,
              vehicleType: vehicleDlg.form.vehicleType,
              description: vehicleDlg.form.description,
              driverName: blank(vehicleDlg.form.driverName),
            }))
        }
      >
        <TextField id="veh-reg" label={t("accidentScreen.vehicle.registration")} value={vehicleDlg.form.registrationNumber}
          onChange={(v) => vehicleDlg.setForm({ ...vehicleDlg.form, registrationNumber: v })} hint="WB-06-BC-2210" />
        <NativeSelect id="veh-type" label={t("accidentScreen.vehicle.type")} value={vehicleDlg.form.vehicleType}
          options={VEHICLE_TYPES.map((v) => ({ value: v, label: t(`accidentScreen.enums.vehicle.${v}`) }))}
          onChange={(v) => v && vehicleDlg.setForm({ ...vehicleDlg.form, vehicleType: v })} />
        <TextField id="veh-driver" label={t("accidentScreen.vehicle.driver")} value={vehicleDlg.form.driverName}
          onChange={(v) => vehicleDlg.setForm({ ...vehicleDlg.form, driverName: v })} />
        <TextField id="veh-desc" label={t("accidentScreen.vehicle.description")} value={vehicleDlg.form.description}
          onChange={(v) => vehicleDlg.setForm({ ...vehicleDlg.form, description: v })} />
      </FormDialog>

      {/* add person */}
      <FormDialog
        open={personDlg.open}
        onOpenChange={personDlg.setOpen}
        title={t("accidentScreen.person.add")}
        error={personDlg.error}
        pending={addPerson.isPending}
        submitLabel={t("accidentScreen.add")}
        onSubmit={() =>
          personDlg.run(() =>
            addPerson.mutateAsync({
              name: blank(personDlg.form.name),
              role: personDlg.form.role,
              vehicleId: personDlg.form.vehicleId || null,
              injurySeverity: personDlg.form.injurySeverity,
              hospital: blank(personDlg.form.hospital),
            }))
        }
      >
        <TextField id="per-name" label={t("accidentScreen.person.name")} value={personDlg.form.name}
          onChange={(v) => personDlg.setForm({ ...personDlg.form, name: v })} hint={t("accidentScreen.person.unidentified")} />
        <NativeSelect id="per-role" label={t("accidentScreen.person.role")} value={personDlg.form.role}
          options={PERSON_ROLES.map((v) => ({ value: v, label: t(`accidentScreen.enums.role.${v}`) }))}
          onChange={(v) => v && personDlg.setForm({ ...personDlg.form, role: v })} />
        <NativeSelect id="per-vehicle" label={t("accidentScreen.person.vehicle")} value={personDlg.form.vehicleId}
          options={vehicleOptions} allowEmpty={t("accidentScreen.person.noVehicle")}
          onChange={(v) => personDlg.setForm({ ...personDlg.form, vehicleId: v })} />
        <NativeSelect id="per-severity" label={t("accidentScreen.person.severity")} value={personDlg.form.injurySeverity}
          options={INJURY_SEVERITIES.map((v) => ({ value: v, label: t(`accidentScreen.enums.severity.${v}`) }))}
          onChange={(v) => v && personDlg.setForm({ ...personDlg.form, injurySeverity: v })} />
        <TextField id="per-hospital" label={t("accidentScreen.person.hospital")} value={personDlg.form.hospital}
          onChange={(v) => personDlg.setForm({ ...personDlg.form, hospital: v })} />
      </FormDialog>

      {/* add camera */}
      <FormDialog
        open={cameraDlg.open}
        onOpenChange={cameraDlg.setOpen}
        title={t("accidentScreen.camera.add")}
        description={t("accidentScreen.sections.camerasDesc")}
        error={cameraDlg.error}
        pending={addCamera.isPending}
        submitLabel={t("accidentScreen.add")}
        onSubmit={() =>
          cameraDlg.run(() =>
            addCamera.mutateAsync({
              cameraRef: cameraDlg.form.cameraRef,
              cameraName: cameraDlg.form.cameraName,
              distanceM: numOrNull(cameraDlg.form.distanceM),
              footageFrom: localToApi(cameraDlg.form.footageFrom),
              footageTo: localToApi(cameraDlg.form.footageTo),
              notes: cameraDlg.form.notes,
            }))
        }
      >
        <TextField id="cam-ref" label={t("accidentScreen.camera.ref")} value={cameraDlg.form.cameraRef}
          onChange={(v) => cameraDlg.setForm({ ...cameraDlg.form, cameraRef: v })} hint="TR-EMB-044" />
        <TextField id="cam-name" label={t("accidentScreen.camera.name")} value={cameraDlg.form.cameraName}
          onChange={(v) => cameraDlg.setForm({ ...cameraDlg.form, cameraName: v })} />
        <TextField id="cam-dist" label={t("accidentScreen.camera.distance")} value={cameraDlg.form.distanceM}
          onChange={(v) => cameraDlg.setForm({ ...cameraDlg.form, distanceM: v })} />
        <TextField id="cam-from" type="datetime-local" label={t("accidentScreen.camera.from")} value={cameraDlg.form.footageFrom}
          onChange={(v) => cameraDlg.setForm({ ...cameraDlg.form, footageFrom: v })} />
        <TextField id="cam-to" type="datetime-local" label={t("accidentScreen.camera.to")} value={cameraDlg.form.footageTo}
          onChange={(v) => cameraDlg.setForm({ ...cameraDlg.form, footageTo: v })} />
        <TextField id="cam-notes" label={t("accidentScreen.camera.notes")} value={cameraDlg.form.notes}
          onChange={(v) => cameraDlg.setForm({ ...cameraDlg.form, notes: v })} />
      </FormDialog>

      {canRecord && <AttachReadDialog incidentId={id} open={attachAnprOpen} onOpenChange={setAttachAnprOpen} />}

      {/* add plate read */}
      <FormDialog
        open={plateDlg.open}
        onOpenChange={plateDlg.setOpen}
        title={t("accidentScreen.plate.add")}
        description={t("accidentScreen.sections.plateReadsDesc")}
        error={plateDlg.error}
        pending={addPlateRead.isPending}
        submitLabel={t("accidentScreen.add")}
        onSubmit={() =>
          plateDlg.run(() =>
            addPlateRead.mutateAsync({
              registrationNumber: plateDlg.form.registrationNumber,
              readAt: localToApi(plateDlg.form.readAt),
              location: plateDlg.form.location,
              cameraRef: blank(plateDlg.form.cameraRef),
              source: plateDlg.form.source,
              sourceDetail: plateDlg.form.sourceDetail,
            }))
        }
      >
        <TextField id="pr-reg" label={t("accidentScreen.plate.registration")} value={plateDlg.form.registrationNumber}
          onChange={(v) => plateDlg.setForm({ ...plateDlg.form, registrationNumber: v })} />
        <TextField id="pr-at" type="datetime-local" label={t("accidentScreen.plate.readAt")} value={plateDlg.form.readAt}
          onChange={(v) => plateDlg.setForm({ ...plateDlg.form, readAt: v })} />
        <TextField id="pr-loc" label={t("accidentScreen.plate.location")} value={plateDlg.form.location}
          onChange={(v) => plateDlg.setForm({ ...plateDlg.form, location: v })} />
        <NativeSelect id="pr-source" label={t("accidentScreen.plate.source")} value={plateDlg.form.source}
          options={PLATE_SOURCES.map((v) => ({ value: v, label: t(`accidentScreen.enums.plateSource.${v}`) }))}
          onChange={(v) => v && plateDlg.setForm({ ...plateDlg.form, source: v })} />
        <TextField id="pr-cam" label={t("accidentScreen.plate.camera")} value={plateDlg.form.cameraRef}
          onChange={(v) => plateDlg.setForm({ ...plateDlg.form, cameraRef: v })}
          hint={plateDlg.form.source !== "OFFICER" ? t("accidentScreen.plate.cameraRequired") : undefined} />
        <TextField id="pr-detail" label={t("accidentScreen.plate.detail")} value={plateDlg.form.sourceDetail}
          onChange={(v) => plateDlg.setForm({ ...plateDlg.form, sourceDetail: v })} />
      </FormDialog>

      {/* add signal phase */}
      <FormDialog
        open={signalDlg.open}
        onOpenChange={signalDlg.setOpen}
        title={t("accidentScreen.signal.add")}
        description={t("accidentScreen.sections.signalsDesc")}
        error={signalDlg.error}
        pending={addSignal.isPending}
        submitLabel={t("accidentScreen.add")}
        onSubmit={() =>
          signalDlg.run(() =>
            addSignal.mutateAsync({
              signalRef: signalDlg.form.signalRef,
              approach: signalDlg.form.approach,
              phase: signalDlg.form.phase,
              phaseFrom: localToApi(signalDlg.form.phaseFrom),
              phaseTo: signalDlg.form.phaseTo ? localToApi(signalDlg.form.phaseTo) : null,
              source: signalDlg.form.source,
              sourceDetail: signalDlg.form.sourceDetail,
            }))
        }
      >
        <TextField id="sg-ref" label={t("accidentScreen.signal.ref")} value={signalDlg.form.signalRef}
          onChange={(v) => signalDlg.setForm({ ...signalDlg.form, signalRef: v })} />
        <TextField id="sg-approach" label={t("accidentScreen.signal.approach")} value={signalDlg.form.approach}
          onChange={(v) => signalDlg.setForm({ ...signalDlg.form, approach: v })} />
        <NativeSelect id="sg-phase" label={t("accidentScreen.signal.phase")} value={signalDlg.form.phase}
          options={SIGNAL_PHASES.map((v) => ({ value: v, label: t(`accidentScreen.enums.phase.${v}`) }))}
          onChange={(v) => v && signalDlg.setForm({ ...signalDlg.form, phase: v })} />
        <TextField id="sg-from" type="datetime-local" label={t("accidentScreen.signal.from")} value={signalDlg.form.phaseFrom}
          onChange={(v) => signalDlg.setForm({ ...signalDlg.form, phaseFrom: v })} />
        <TextField id="sg-to" type="datetime-local" label={t("accidentScreen.signal.to")} value={signalDlg.form.phaseTo}
          onChange={(v) => signalDlg.setForm({ ...signalDlg.form, phaseTo: v })} />
        <NativeSelect id="sg-source" label={t("accidentScreen.signal.source")} value={signalDlg.form.source}
          options={SIGNAL_SOURCES.map((v) => ({ value: v, label: t(`accidentScreen.enums.signalSource.${v}`) }))}
          onChange={(v) => v && signalDlg.setForm({ ...signalDlg.form, source: v })} />
        <TextField id="sg-detail" label={t("accidentScreen.signal.detail")} value={signalDlg.form.sourceDetail}
          onChange={(v) => signalDlg.setForm({ ...signalDlg.form, sourceDetail: v })} hint={t("accidentScreen.signal.detailHint")} />
      </FormDialog>

      {/* add fact */}
      <FormDialog
        open={factDlg.open}
        onOpenChange={factDlg.setOpen}
        title={t("accidentScreen.fact.add")}
        description={t("accidentScreen.sections.factsDesc")}
        error={factDlg.error}
        pending={addFact.isPending}
        submitLabel={t("accidentScreen.add")}
        onSubmit={() => {
          const f = factDlg.form;
          const hasQuantity = f.quantity !== "";
          factDlg.run(() =>
            addFact.mutateAsync({
              occurredAt: localToApi(f.occurredAt),
              description: f.description,
              provenance: f.provenance,
              source: f.source,
              method: blank(f.method),
              vehicleId: f.vehicleId || null,
              quantity: hasQuantity ? (f.quantity as Quantity) : null,
              value: hasQuantity && !f.ranged ? numOrNull(f.value) : null,
              valueLow: hasQuantity && f.ranged ? numOrNull(f.valueLow) : null,
              valueHigh: hasQuantity && f.ranged ? numOrNull(f.valueHigh) : null,
            }));
        }}
      >
        <TextField id="ft-at" type="datetime-local" label={t("accidentScreen.fact.occurredAt")} value={factDlg.form.occurredAt}
          onChange={(v) => factDlg.setForm({ ...factDlg.form, occurredAt: v })} />
        <TextField id="ft-desc" label={t("accidentScreen.fact.description")} value={factDlg.form.description}
          onChange={(v) => factDlg.setForm({ ...factDlg.form, description: v })} />
        <div className="grid gap-1.5">
          <Label>{t("accidentScreen.fact.provenance")}</Label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("accidentScreen.fact.provenance")}>
            {PROVENANCES.map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-1.5 rounded border border-border px-2 py-1 text-sm">
                <input
                  type="radio"
                  name="ft-provenance"
                  value={p}
                  checked={factDlg.form.provenance === p}
                  onChange={() => factDlg.setForm({ ...factDlg.form, provenance: p, ranged: p === "ESTIMATED" && factDlg.form.ranged })}
                />
                <ProvenanceBadge provenance={p} />
              </label>
            ))}
          </div>
          <p className="text-xs text-foreground-subtle">{t(`accidentScreen.provenance.${factDlg.form.provenance}Hint`)}</p>
        </div>
        <TextField id="ft-source" label={t("accidentScreen.fact.source")} value={factDlg.form.source}
          onChange={(v) => factDlg.setForm({ ...factDlg.form, source: v })} hint={t("accidentScreen.fact.sourceHint")} />
        <TextField id="ft-method" label={t("accidentScreen.fact.method")} value={factDlg.form.method}
          onChange={(v) => factDlg.setForm({ ...factDlg.form, method: v })} hint={t("accidentScreen.fact.methodHint")} />
        <NativeSelect id="ft-vehicle" label={t("accidentScreen.fact.vehicle")} value={factDlg.form.vehicleId}
          options={vehicleOptions} allowEmpty="—"
          onChange={(v) => factDlg.setForm({ ...factDlg.form, vehicleId: v })} />
        <NativeSelect id="ft-quantity" label={t("accidentScreen.fact.quantity")} value={factDlg.form.quantity}
          options={(Object.keys(QUANTITY_UNITS) as Quantity[]).map((q) => ({ value: q, label: t(`accidentScreen.enums.quantity.${q}`) }))}
          allowEmpty={t("accidentScreen.fact.noQuantity")}
          onChange={(v) => factDlg.setForm({ ...factDlg.form, quantity: v })} />
        {factDlg.form.quantity !== "" && (
          <>
            {factDlg.form.provenance === "ESTIMATED" && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  id="ft-ranged"
                  type="checkbox"
                  checked={factDlg.form.ranged}
                  onChange={(e) => factDlg.setForm({ ...factDlg.form, ranged: e.target.checked })}
                />
                {t("accidentScreen.fact.range")}
              </label>
            )}
            {factDlg.form.ranged && factDlg.form.provenance === "ESTIMATED" ? (
              <div className="grid grid-cols-2 gap-3">
                <TextField id="ft-low" label={t("accidentScreen.fact.low")} value={factDlg.form.valueLow}
                  onChange={(v) => factDlg.setForm({ ...factDlg.form, valueLow: v })} />
                <TextField id="ft-high" label={t("accidentScreen.fact.high")} value={factDlg.form.valueHigh}
                  onChange={(v) => factDlg.setForm({ ...factDlg.form, valueHigh: v })} />
              </div>
            ) : (
              <TextField id="ft-value" label={`${t("accidentScreen.fact.value")} (${QUANTITY_UNITS[factDlg.form.quantity as Quantity]})`}
                value={factDlg.form.value} onChange={(v) => factDlg.setForm({ ...factDlg.form, value: v })} />
            )}
          </>
        )}
      </FormDialog>

      {/* confirm removal */}
      <Dialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("accidentScreen.remove")} {removing?.label}
            </DialogTitle>
          </DialogHeader>
          {removeError && (
            <Alert variant="danger">
              <ShieldAlert />
              <AlertDescription>{removeError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              {t("accidentScreen.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={removeRecord.isPending}
              onClick={async () => {
                if (!removing) return;
                setRemoveError(null);
                try {
                  await removeRecord.mutateAsync({ kind: removing.kind, recordId: removing.recordId });
                  setRemoving(null);
                } catch (err) {
                  setRemoveError(errorMessage(err));
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              {t("accidentScreen.remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

/* --------------------------------- reports --------------------------------- */

function ReportPanel({
  incidentId,
  reports,
  draft,
  canRecord,
  canReview,
  currentUserId,
}: {
  incidentId: string;
  reports: IncidentReport[];
  draft: ReportContent | null;
  canRecord: boolean;
  canReview: boolean;
  currentUserId?: string;
}) {
  const { t } = useI18n();
  const create = useCreateReport(incidentId);
  const update = useUpdateReport(incidentId);
  const submit = useSubmitReport(incidentId);
  const approve = useApproveReport(incidentId);
  const giveBack = useReturnReport(incidentId);

  const list = reports;
  const current: IncidentReport | undefined = list[0];
  const [findings, setFindings] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [returnOpen, setReturnOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    setFindings(current?.findings ?? "");
  }, [current?.id, current?.findings]);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const editable = current && (current.status === "DRAFT" || current.status === "RETURNED");
  const reviewable = current?.status === "SUBMITTED";
  const ownReport = current && currentUserId === current.draftedBy;
  const canStartNew = !current || current.status === "APPROVED";
  const snapshot = current?.snapshot ?? null;
  const content = snapshot ?? draft;

  const statusTone = (s: IncidentReport["status"]) =>
    s === "APPROVED" ? "success" : s === "SUBMITTED" ? "info" : s === "RETURNED" ? "warning" : "neutral";

  return (
    <Panel
      title={<span className="flex items-center gap-2"><FileText className="h-4 w-4" />{t("accidentScreen.sections.reports")}</span>}
      actions={
        canRecord && canStartNew ? (
          <Button size="sm" variant="outline" disabled={create.isPending} onClick={() => run(() => create.mutateAsync(""))}>
            <Plus className="h-4 w-4" />
            {current ? t("accidentScreen.report.newReport") : t("accidentScreen.report.draft")}
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4" data-testid="report-panel">
        {!current && <p className="text-sm text-foreground-subtle">{t("accidentScreen.report.none")}</p>}

        {error && (
          <Alert variant="danger">
            <ShieldAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {current && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono font-medium">{current.reportNumber}</span>
              <StatusPill tone={statusTone(current.status)}>{t(`accidentScreen.report.status.${current.status}`)}</StatusPill>
              <span className="text-foreground-muted">{t("accidentScreen.report.draftedBy", { name: current.draftedByName })}</span>
              {current.reviewedByName && (
                <span className="text-foreground-muted">{t("accidentScreen.report.reviewedBy", { name: current.reviewedByName })}</span>
              )}
            </div>

            {current.status === "RETURNED" && current.returnReason && (
              <Alert variant="warning">
                <ShieldAlert />
                <AlertDescription>{t("accidentScreen.report.returnedBecause", { reason: current.returnReason })}</AlertDescription>
              </Alert>
            )}

            {current.recordChangedSinceSnapshot && (
              <Alert variant="warning">
                <ShieldAlert />
                <AlertDescription>{t("accidentScreen.report.drift")}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="rep-findings">{t("accidentScreen.report.findings")}</Label>
              {editable && canRecord ? (
                <Textarea id="rep-findings" rows={4} value={findings} onChange={(v: string) => setFindings(v)}
                  placeholder={t("accidentScreen.report.findingsHint")} />
              ) : (
                <p className="whitespace-pre-wrap rounded-md border border-border bg-surface-sunken p-3 text-sm">
                  {current.findings || "—"}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {editable && canRecord && (
                <>
                  <Button variant="outline" disabled={update.isPending}
                    onClick={() => run(() => update.mutateAsync({ reportId: current.id, findings }))}>
                    {t("accidentScreen.report.saveFindings")}
                  </Button>
                  <Button disabled={submit.isPending || current.status !== "DRAFT"}
                    onClick={() => run(() => submit.mutateAsync(current.id))}>
                    <FileCheck2 className="h-4 w-4" />
                    {t("accidentScreen.report.submit")}
                  </Button>
                </>
              )}
              {reviewable && canReview && !ownReport && (
                <>
                  <Button disabled={approve.isPending} onClick={() => run(() => approve.mutateAsync(current.id))}>
                    <FileCheck2 className="h-4 w-4" />
                    {t("accidentScreen.report.approve")}
                  </Button>
                  <Button variant="outline" onClick={() => { setReason(""); setError(null); setReturnOpen(true); }}>
                    {t("accidentScreen.report.return")}
                  </Button>
                </>
              )}
            </div>
            {reviewable && ownReport && <p className="text-xs text-foreground-muted">{t("accidentScreen.report.selfReview")}</p>}
            {reviewable && !canReview && <p className="text-xs text-foreground-muted">{t("accidentScreen.report.reviewFloor")}</p>}

            {current.snapshotSha256 && (
              <p className="text-xs text-foreground-subtle">
                {t("accidentScreen.report.frozen")} · {t("accidentScreen.report.digest")}{" "}
                <span className="font-mono">{current.snapshotSha256}</span>
              </p>
            )}
          </>
        )}

        {content && (
          <div className="rounded-md border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-foreground-subtle">
              {snapshot ? t("accidentScreen.report.frozen") : t("accidentScreen.report.liveContent")}
            </p>
            <p className="mt-1 text-sm text-foreground" data-testid="report-counts">
              {t("accidentScreen.timeline.counts", {
                measured: content.measuredFacts,
                observed: content.observedFacts,
                estimated: content.estimatedFacts,
              })}
            </p>
            <p className="text-xs text-foreground-muted">
              {content.vehicles.length} {t("accidentScreen.sections.vehicles")} · {content.persons.length}{" "}
              {t("accidentScreen.sections.persons")} · {content.timeline.length} {t("accidentScreen.sections.timeline")}
            </p>
          </div>
        )}
      </div>

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("accidentScreen.report.return")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="rep-reason">{t("accidentScreen.report.returnReason")}</Label>
            <Textarea id="rep-reason" rows={3} value={reason} onChange={(v: string) => setReason(v)} />
          </div>
          {error && (
            <Alert variant="danger">
              <ShieldAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>
              {t("accidentScreen.cancel")}
            </Button>
            <Button
              disabled={giveBack.isPending}
              onClick={async () => {
                if (!current) return;
                setError(null);
                try {
                  await giveBack.mutateAsync({ reportId: current.id, reason });
                  setReturnOpen(false);
                } catch (err) {
                  setError(errorMessage(err));
                }
              }}
            >
              {t("accidentScreen.report.return")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

