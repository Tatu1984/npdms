"use client";

import * as React from "react";
import {
  BatteryLow,
  Camera,
  CloudUpload,
  Download,
  FileVideo,
  Link2,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Undo2,
  UserCheck,
  Wrench,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { DataTable, type Column } from "@/components/platform/data-table";
import { EmptyState, Field, PageHeader, Panel, PhaseBadge, StatTile, StatusPill, type StatusTone } from "@/components/platform/primitives";
import { OfficerPicker, RecordLinkPicker, type RecordLink } from "@/components/platform/pickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import type {
  BWCAssignment,
  BWCDevice,
  BWCDeviceStatus,
  BWCReadingSource,
  BWCRecording,
  BWCRetentionClass,
  BWCVerification,
} from "@/lib/api/bodycam";
import bodycamApi from "@/lib/api/bodycam";
import { dispatchApi } from "@/lib/api/dispatch";
import {
  useBodycamAssignments,
  useBodycamDevice,
  useBodycamDevices,
  useBodycamReadings,
  useBodycamRecordings,
  useBodycamStats,
  useDockRecording,
  useIssueBodycam,
  useLinkRecording,
  usePurgeRecording,
  useRecordBodycamReading,
  useRecordingAccessLog,
  useRecordingChain,
  useRegisterBodycam,
  useReturnBodycam,
  useSetBodycamStatus,
} from "@/hooks/use-bodycam";

const STATUS_TONE: Record<BWCDeviceStatus, StatusTone> = {
  IN_SERVICE: "success",
  CHARGING: "info",
  FAULTY: "danger",
  RETIRED: "neutral",
};

const when = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const megabytes = (n: number) => `${(n / (1024 * 1024)).toFixed(n < 1024 * 1024 ? 2 : 1)} MB`;

/** A datetime-local value (IST on these terminals) as RFC 3339. */
const toRFC3339 = (local: string) => new Date(local).toISOString();

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

function useRole() {
  const user = useAuthStore((s) => s.user);
  return {
    user,
    atLeast: (role: Parameters<typeof hasMinimumRole>[1]) => Boolean(user && hasMinimumRole(user.role, role)),
  };
}

export default function BodycamPage() {
  const { t } = useI18n();
  const { atLeast } = useRole();
  const [tab, setTab] = React.useState("devices");
  const [deviceSearch, setDeviceSearch] = React.useState("");
  const [recordingSearch, setRecordingSearch] = React.useState("");
  const [retention, setRetention] = React.useState<"" | BWCRetentionClass>("");
  const [selectedDevice, setSelectedDevice] = React.useState<string | null>(null);
  const [purposeFor, setPurposeFor] = React.useState<BWCRecording | null>(null);
  const [opened, setOpened] = React.useState<{ recording: BWCRecording; purpose: string } | null>(null);
  const [registerOpen, setRegisterOpen] = React.useState(false);

  const stats = useBodycamStats();
  const devices = useBodycamDevices({ search: deviceSearch || undefined, pageSize: 100 });
  const canSeeRecordings = atLeast("ASI");
  const recordings = useBodycamRecordings(
    { search: recordingSearch || undefined, retention: retention || undefined, pageSize: 100 },
    canSeeRecordings && tab === "recordings",
  );
  const s = stats.data?.stats;
  const rules = stats.data?.rules;

  const deviceColumns: Column<BWCDevice>[] = [
    {
      id: "camera",
      header: t("bodycamScreen.list.camera"),
      cell: (d) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm font-medium text-foreground">{d.deviceNumber}</span>
          <span className="text-xs text-foreground-muted">
            {d.model} · {d.serialNumber}
          </span>
        </div>
      ),
      sortValue: (d) => d.deviceNumber,
      searchValue: (d) => `${d.deviceNumber} ${d.serialNumber} ${d.model}`,
    },
    { id: "station", header: t("bodycamScreen.list.station"), cell: (d) => d.stationName, hideBelow: "md" },
    {
      id: "status",
      header: t("bodycamScreen.list.status"),
      cell: (d) => <StatusPill tone={STATUS_TONE[d.status]}>{t(`bodycamScreen.status.${d.status}`)}</StatusPill>,
      sortValue: (d) => d.status,
    },
    {
      id: "issued",
      header: t("bodycamScreen.list.issuedTo"),
      cell: (d) =>
        d.currentIssue ? (
          <span className="flex items-center gap-2">
            {d.currentIssue.officerName}
            {d.currentIssue.overdue && <StatusPill tone="warning">{t("bodycamScreen.detail.overdue")}</StatusPill>}
          </span>
        ) : (
          <span className="text-foreground-muted">{t("bodycamScreen.list.notIssued")}</span>
        ),
    },
    {
      id: "reading",
      header: t("bodycamScreen.list.lastReading"),
      hideBelow: "lg",
      cell: (d) =>
        d.latestReading ? (
          <span className="flex items-center gap-2 text-sm">
            {d.latestReading.batteryPercent < 20 && <BatteryLow className="h-4 w-4 text-danger" />}
            {d.latestReading.batteryPercent}% · {d.latestReading.storagePercent}%
            {d.latestReading.stale && <StatusPill tone="warning">{t("bodycamScreen.list.stale")}</StatusPill>}
          </span>
        ) : (
          <span className="text-foreground-muted">{t("bodycamScreen.list.noReading")}</span>
        ),
    },
  ];

  const recordingColumns: Column<BWCRecording>[] = [
    {
      id: "recording",
      header: t("bodycamScreen.list.recording"),
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm font-medium text-foreground">{r.recordingNumber}</span>
          <span className="text-xs text-foreground-muted">{r.deviceNumber}</span>
        </div>
      ),
      sortValue: (r) => r.recordingNumber,
      searchValue: (r) => `${r.recordingNumber} ${r.deviceNumber} ${r.officerName}`,
    },
    { id: "officer", header: t("bodycamScreen.list.officer"), cell: (r) => r.officerName },
    { id: "recorded", header: t("bodycamScreen.list.recorded"), cell: (r) => when(r.startedAt), sortValue: (r) => r.startedAt, hideBelow: "md" },
    { id: "size", header: t("bodycamScreen.list.size"), cell: (r) => megabytes(r.sizeBytes), hideBelow: "lg", align: "right" },
    { id: "retention", header: t("bodycamScreen.list.retentionClass"), cell: (r) => <RetentionPill r={r} /> },
    {
      id: "link",
      header: t("bodycamScreen.list.link"),
      hideBelow: "lg",
      cell: (r) => (r.evidenceNumber ? `${r.evidenceNumber}${r.caseNumber ? ` · ${r.caseNumber}` : r.firNumber ? ` · ${r.firNumber}` : ""}` : "—"),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t("bodycamScreen.title")}
          description={t("bodycamScreen.description")}
          icon={Camera}
          badge={<PhaseBadge phase={13} />}
          actions={
            atLeast("SHO") ? (
              <Button onClick={() => setRegisterOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("bodycamScreen.actions.register")}
              </Button>
            ) : undefined
          }
        />

        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>{t("bodycamScreen.noAiNote")}</AlertTitle>
          {rules && (
            <AlertDescription className="flex flex-col gap-1">
              <span>{t("bodycamScreen.rules.retention", { days: rules.nonEvidentialRetentionDays })}</span>
              <span>{t("bodycamScreen.rules.stale", { hours: rules.readingStaleAfterHours })}</span>
            </AlertDescription>
          )}
        </Alert>

        {stats.isError ? (
          <Alert variant="danger">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>{errorText(stats.error)}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <StatTile label={t("bodycamScreen.stats.devices")} value={s?.devices ?? 0} icon={Camera} />
            <StatTile label={t("bodycamScreen.stats.onShift")} value={s?.onShift ?? 0} icon={UserCheck} />
            <StatTile label={t("bodycamScreen.stats.overdue")} value={s?.overdueReturns ?? 0} icon={TriangleAlert} tone={s?.overdueReturns ? "warning" : "default"} />
            <StatTile label={t("bodycamScreen.stats.stale")} value={s?.staleReadings ?? 0} icon={BatteryLow} />
            <StatTile label={t("bodycamScreen.stats.held")} value={s?.heldRecordings ?? 0} icon={FileVideo} />
            <StatTile label={t("bodycamScreen.stats.expired")} value={s?.expiredRecordings ?? 0} icon={Trash2} />
            <StatTile label={t("bodycamScreen.stats.evidential")} value={s?.evidentialRecordings ?? 0} icon={ShieldCheck} />
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="devices">{t("bodycamScreen.tabs.devices")}</TabsTrigger>
            <TabsTrigger value="recordings">{t("bodycamScreen.tabs.recordings")}</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="mt-4">
            {devices.isError ? (
              <Alert variant="danger">
                <AlertDescription>{errorText(devices.error)}</AlertDescription>
              </Alert>
            ) : devices.isLoading ? (
              <p className="py-10 text-center text-sm text-foreground-muted">…</p>
            ) : (devices.data?.data.length ?? 0) === 0 && !deviceSearch ? (
              <EmptyState icon={Camera} title={t("bodycamScreen.list.emptyCameras")} description={t("bodycamScreen.list.emptyCamerasHint")} />
            ) : (
              <DataTable
                rows={devices.data?.data ?? []}
                columns={deviceColumns}
                rowKey={(d) => d.id}
                searchable={false}
                onRowSelect={(d) => setSelectedDevice(d.id)}
                toolbar={
                  <Input value={deviceSearch} onChange={setDeviceSearch} placeholder={t("bodycamScreen.list.searchCameras")} className="max-w-sm" />
                }
              />
            )}
          </TabsContent>

          <TabsContent value="recordings" className="mt-4">
            {!canSeeRecordings ? (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>{t("bodycamScreen.list.restricted")}</AlertDescription>
              </Alert>
            ) : recordings.isError ? (
              <Alert variant="danger">
                <AlertDescription>{errorText(recordings.error)}</AlertDescription>
              </Alert>
            ) : (
              <DataTable
                rows={recordings.data?.data ?? []}
                columns={recordingColumns}
                rowKey={(r) => r.id}
                searchable={false}
                onRowSelect={(r) => setPurposeFor(r)}
                emptyTitle={t("bodycamScreen.list.emptyRecordings")}
                emptyDescription={t("bodycamScreen.list.emptyRecordingsHint")}
                toolbar={
                  <div className="flex flex-wrap items-center gap-2">
                    <Input value={recordingSearch} onChange={setRecordingSearch} placeholder={t("bodycamScreen.list.searchRecordings")} className="max-w-sm" />
                    <select
                      aria-label={t("bodycamScreen.list.retentionClass")}
                      value={retention}
                      onChange={(e) => setRetention(e.target.value as "" | BWCRetentionClass)}
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="">{t("bodycamScreen.list.all")}</option>
                      <option value="NON_EVIDENTIAL">{t("bodycamScreen.retention.NON_EVIDENTIAL")}</option>
                      <option value="EVIDENTIAL">{t("bodycamScreen.retention.EVIDENTIAL")}</option>
                    </select>
                  </div>
                }
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <RegisterDialog open={registerOpen} onOpenChange={setRegisterOpen} />
      <DeviceSheet deviceId={selectedDevice} onClose={() => setSelectedDevice(null)} maxMb={rules?.maxUploadMegabytes} retentionDays={rules?.nonEvidentialRetentionDays} />
      <PurposeDialog
        recording={purposeFor}
        onClose={() => setPurposeFor(null)}
        onOpened={(recording, purpose) => {
          setPurposeFor(null);
          setOpened({ recording, purpose });
        }}
      />
      <RecordingSheet opened={opened} onClose={() => setOpened(null)} onChanged={(r) => opened && setOpened({ ...opened, recording: r })} />
    </DashboardLayout>
  );
}

function RetentionPill({ r }: { r: BWCRecording }) {
  const { t } = useI18n();
  if (r.purgedAt) return <StatusPill tone="neutral">{t("bodycamScreen.retention.purged")}</StatusPill>;
  if (r.retentionClass === "EVIDENTIAL") return <StatusPill tone="success">{t("bodycamScreen.retention.EVIDENTIAL")}</StatusPill>;
  if (r.expired) return <StatusPill tone="warning">{t("bodycamScreen.retention.expired")}</StatusPill>;
  return <StatusPill tone="info">{t("bodycamScreen.retention.NON_EVIDENTIAL")}</StatusPill>;
}

/* --------------------------------- dialogs -------------------------------- */

function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  error,
  busy,
  onSubmit,
  children,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  error: string | null;
  busy: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {children}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("bodycamScreen.actions.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={busy}>
            {submitLabel ?? t("bodycamScreen.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RegisterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const register = useRegisterBodycam();
  const [serial, setSerial] = React.useState("");
  const [model, setModel] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      const d = await register.mutateAsync({ serialNumber: serial, model });
      toast.success(t("bodycamScreen.toasts.registered", { number: d.deviceNumber }));
      setSerial("");
      setModel("");
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("bodycamScreen.actions.register")}
      description={t("bodycamScreen.forms.stationHint")}
      error={error}
      busy={register.isPending}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-serial">{t("bodycamScreen.forms.serial")}</Label>
        <Input id="bwc-serial" value={serial} onChange={setSerial} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-model">{t("bodycamScreen.forms.model")}</Label>
        <Input id="bwc-model" value={model} onChange={setModel} />
      </div>
    </FormDialog>
  );
}

function DeviceSheet({
  deviceId,
  onClose,
  maxMb,
  retentionDays,
}: {
  deviceId: string | null;
  onClose: () => void;
  maxMb?: number;
  retentionDays?: number;
}) {
  const { t } = useI18n();
  const { user, atLeast } = useRole();
  const device = useBodycamDevice(deviceId);
  const readings = useBodycamReadings(deviceId);
  const ledger = useBodycamAssignments(deviceId);
  const [dialog, setDialog] = React.useState<null | "issue" | "return" | "dock" | "reading" | "status">(null);
  const d = device.data;
  const issue = d?.currentIssue ?? null;
  const mayDock = Boolean(issue && (atLeast("ASI") || issue.officerId === user?.id));

  return (
    <Sheet open={Boolean(deviceId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-mono">{d?.deviceNumber ?? "…"}</SheetTitle>
          <SheetDescription>{d ? `${d.model} · ${d.serialNumber} · ${d.stationName}` : ""}</SheetDescription>
        </SheetHeader>
        {device.isError && (
          <Alert variant="danger" className="mt-4">
            <AlertDescription>{errorText(device.error)}</AlertDescription>
          </Alert>
        )}
        {d && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {atLeast("ASI") && !issue && d.status === "IN_SERVICE" && (
                <Button size="sm" onClick={() => setDialog("issue")}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  {t("bodycamScreen.actions.issue")}
                </Button>
              )}
              {mayDock && (
                <Button size="sm" onClick={() => setDialog("dock")}>
                  <CloudUpload className="mr-2 h-4 w-4" />
                  {t("bodycamScreen.actions.dock")}
                </Button>
              )}
              {atLeast("ASI") && issue && (
                <Button size="sm" variant="outline" onClick={() => setDialog("return")}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  {t("bodycamScreen.actions.return")}
                </Button>
              )}
              {atLeast("ASI") && (
                <Button size="sm" variant="outline" onClick={() => setDialog("reading")}>
                  <BatteryLow className="mr-2 h-4 w-4" />
                  {t("bodycamScreen.actions.reading")}
                </Button>
              )}
              {atLeast("SHO") && (
                <Button size="sm" variant="outline" onClick={() => setDialog("status")}>
                  <Wrench className="mr-2 h-4 w-4" />
                  {t("bodycamScreen.actions.setStatus")}
                </Button>
              )}
            </div>

            <Panel title={t("bodycamScreen.detail.camera")}>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("bodycamScreen.list.status")} value={<StatusPill tone={STATUS_TONE[d.status]}>{t(`bodycamScreen.status.${d.status}`)}</StatusPill>} />
                {d.statusNote && <Field label={t("bodycamScreen.forms.statusNote")} value={d.statusNote} />}
                <Field
                  label={t("bodycamScreen.list.lastReading")}
                  value={
                    d.latestReading
                      ? `${d.latestReading.batteryPercent}% · ${d.latestReading.storagePercent}% · ${when(d.latestReading.observedAt)}${d.latestReading.stale ? ` (${t("bodycamScreen.list.stale")})` : ""}`
                      : t("bodycamScreen.list.noReading")
                  }
                />
              </div>
            </Panel>

            <Panel title={t("bodycamScreen.detail.currentIssue")}>
              {issue ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("bodycamScreen.list.issuedTo")} value={`${issue.officerName} (${issue.officerBadge})`} />
                  <Field label={t("bodycamScreen.forms.shift")} value={issue.shiftLabel} />
                  <Field label={t("bodycamScreen.forms.expectedReturn")} value={<span className={issue.overdue ? "text-warning" : undefined}>{when(issue.expectedReturn)}</span>} />
                  <Field label={t("bodycamScreen.list.recording")} value={t("bodycamScreen.detail.recordingsCount", { count: issue.recordingCount })} />
                </div>
              ) : (
                <p className="text-sm text-foreground-muted">{t("bodycamScreen.list.notIssued")}</p>
              )}
            </Panel>

            <Panel title={t("bodycamScreen.detail.ledger")}>
              {(ledger.data?.data.length ?? 0) === 0 ? (
                <p className="text-sm text-foreground-muted">{t("bodycamScreen.detail.noIssues")}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {ledger.data!.data.map((a) => (
                    <li key={a.id} className="py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{a.officerName}</span>
                        <span className="text-xs text-foreground-muted">{when(a.issuedAt)}</span>
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {a.shiftLabel} · {t("bodycamScreen.detail.recordingsCount", { count: a.recordingCount })} ·{" "}
                        {a.returnedAt ? t("bodycamScreen.detail.returned", { time: when(a.returnedAt), name: a.receivedByName }) : t("bodycamScreen.detail.stillOut")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title={t("bodycamScreen.detail.readings")}>
              {(readings.data?.data.length ?? 0) === 0 ? (
                <p className="text-sm text-foreground-muted">{t("bodycamScreen.list.noReading")}</p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {readings.data!.data.slice(0, 10).map((r) => (
                    <li key={r.id} className="flex justify-between gap-2">
                      <span>
                        {r.batteryPercent}% · {r.storagePercent}% · {t(`bodycamScreen.forms.source${r.source}`)} ({r.reportedByName})
                      </span>
                      <span className="text-xs text-foreground-muted">{when(r.observedAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}

        {d && (
          <>
            <IssueDialog open={dialog === "issue"} onOpenChange={(o) => setDialog(o ? "issue" : null)} device={d} />
            {issue && (
              <>
                <ReturnDialog open={dialog === "return"} onOpenChange={(o) => setDialog(o ? "return" : null)} device={d} issue={issue} />
                <DockDialog
                  open={dialog === "dock"}
                  onOpenChange={(o) => setDialog(o ? "dock" : null)}
                  device={d}
                  issue={issue}
                  maxMb={maxMb}
                  retentionDays={retentionDays}
                />
              </>
            )}
            <ReadingDialog open={dialog === "reading"} onOpenChange={(o) => setDialog(o ? "reading" : null)} device={d} />
            <StatusDialog open={dialog === "status"} onOpenChange={(o) => setDialog(o ? "status" : null)} device={d} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function IssueDialog({ open, onOpenChange, device }: { open: boolean; onOpenChange: (o: boolean) => void; device: BWCDevice }) {
  const { t } = useI18n();
  const issue = useIssueBodycam(device.id);
  const [officer, setOfficer] = React.useState<{ id: string; name: string } | null>(null);
  const [shift, setShift] = React.useState("");
  const [expected, setExpected] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!officer) {
      setError(t("bodycamScreen.forms.officer"));
      return;
    }
    try {
      const a = await issue.mutateAsync({ officerId: officer.id, shiftLabel: shift, expectedReturn: expected ? toRFC3339(expected) : undefined });
      toast.success(t("bodycamScreen.toasts.issued", { number: a.deviceNumber, name: a.officerName }));
      setOfficer(null);
      setShift("");
      setExpected("");
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={`${t("bodycamScreen.actions.issue")} — ${device.deviceNumber}`} error={error} busy={issue.isPending} onSubmit={submit}>
      <div className="flex flex-col gap-1.5">
        <Label>{t("bodycamScreen.forms.officer")}</Label>
        <OfficerPicker value={officer?.id} onChange={(id, name) => setOfficer({ id, name })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-shift">{t("bodycamScreen.forms.shift")}</Label>
        <Input id="bwc-shift" value={shift} onChange={setShift} placeholder={t("bodycamScreen.forms.shiftPlaceholder")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-expected">{t("bodycamScreen.forms.expectedReturn")}</Label>
        <Input id="bwc-expected" type="datetime-local" value={expected} onChange={setExpected} />
      </div>
    </FormDialog>
  );
}

function ReturnDialog({ open, onOpenChange, device, issue }: { open: boolean; onOpenChange: (o: boolean) => void; device: BWCDevice; issue: BWCAssignment }) {
  const { t } = useI18n();
  const ret = useReturnBodycam(device.id);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const submit = async () => {
    setError(null);
    try {
      const a = await ret.mutateAsync({ assignmentId: issue.id, note: note || undefined });
      toast.success(t("bodycamScreen.toasts.returned", { number: a.deviceNumber }));
      setNote("");
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${t("bodycamScreen.actions.return")} — ${device.deviceNumber}`}
      description={`${issue.officerName} · ${t("bodycamScreen.detail.recordingsCount", { count: issue.recordingCount })}`}
      error={error}
      busy={ret.isPending}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-return-note">{t("bodycamScreen.forms.returnNote")}</Label>
        <Input id="bwc-return-note" value={note} onChange={setNote} />
      </div>
    </FormDialog>
  );
}

function DockDialog({
  open,
  onOpenChange,
  device,
  issue,
  maxMb,
  retentionDays,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  device: BWCDevice;
  issue: BWCAssignment;
  maxMb?: number;
  retentionDays?: number;
}) {
  const { t } = useI18n();
  const dock = useDockRecording(device.id);
  const [file, setFile] = React.useState<File | null>(null);
  const [started, setStarted] = React.useState("");
  const [ended, setEnded] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const submit = async () => {
    setError(null);
    if (!file || !started || !ended) {
      setError(`${t("bodycamScreen.forms.file")}, ${t("bodycamScreen.forms.startedAt")}, ${t("bodycamScreen.forms.endedAt")}`);
      return;
    }
    try {
      const r = await dock.mutateAsync({ assignmentId: issue.id, file, startedAt: toRFC3339(started), endedAt: toRFC3339(ended) });
      toast.success(t("bodycamScreen.toasts.docked", { number: r.recordingNumber }), `SHA-256 ${r.sha256.slice(0, 16)}…`);
      setFile(null);
      setStarted("");
      setEnded("");
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${t("bodycamScreen.actions.dock")} — ${device.deviceNumber}`}
      description={[t("bodycamScreen.forms.dockHint", { days: retentionDays ?? 31 }), maxMb ? t("bodycamScreen.rules.upload", { mb: maxMb }) : ""].join(" ")}
      error={error}
      busy={dock.isPending}
      onSubmit={submit}
      submitLabel={t("bodycamScreen.actions.dock")}
    >
      <p className="text-sm text-foreground-muted">
        {issue.officerName} · {issue.shiftLabel}
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-file">{t("bodycamScreen.forms.file")}</Label>
        <input id="bwc-file" type="file" accept="video/*,audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bwc-started">{t("bodycamScreen.forms.startedAt")}</Label>
          <Input id="bwc-started" type="datetime-local" value={started} onChange={setStarted} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bwc-ended">{t("bodycamScreen.forms.endedAt")}</Label>
          <Input id="bwc-ended" type="datetime-local" value={ended} onChange={setEnded} />
        </div>
      </div>
    </FormDialog>
  );
}

function ReadingDialog({ open, onOpenChange, device }: { open: boolean; onOpenChange: (o: boolean) => void; device: BWCDevice }) {
  const { t } = useI18n();
  const record = useRecordBodycamReading(device.id);
  const [battery, setBattery] = React.useState("");
  const [storage, setStorage] = React.useState("");
  const [source, setSource] = React.useState<BWCReadingSource>("DOCK");
  const [error, setError] = React.useState<string | null>(null);
  const submit = async () => {
    setError(null);
    try {
      await record.mutateAsync({ batteryPercent: Number(battery), storagePercent: Number(storage), source });
      toast.success(t("bodycamScreen.toasts.reading"));
      setBattery("");
      setStorage("");
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={`${t("bodycamScreen.actions.reading")} — ${device.deviceNumber}`} error={error} busy={record.isPending} onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bwc-battery">{t("bodycamScreen.forms.battery")}</Label>
          <Input id="bwc-battery" type="number" min={0} max={100} value={battery} onChange={setBattery} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bwc-storage">{t("bodycamScreen.forms.storage")}</Label>
          <Input id="bwc-storage" type="number" min={0} max={100} value={storage} onChange={setStorage} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-source">{t("bodycamScreen.forms.source")}</Label>
        <select id="bwc-source" value={source} onChange={(e) => setSource(e.target.value as BWCReadingSource)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
          <option value="DOCK">{t("bodycamScreen.forms.sourceDOCK")}</option>
          <option value="OFFICER">{t("bodycamScreen.forms.sourceOFFICER")}</option>
        </select>
      </div>
    </FormDialog>
  );
}

function StatusDialog({ open, onOpenChange, device }: { open: boolean; onOpenChange: (o: boolean) => void; device: BWCDevice }) {
  const { t } = useI18n();
  const setStatus = useSetBodycamStatus(device.id);
  const [status, setStatusValue] = React.useState<BWCDeviceStatus>(device.status);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const submit = async () => {
    setError(null);
    try {
      await setStatus.mutateAsync({ status, note: note || undefined });
      toast.success(t("bodycamScreen.toasts.status"));
      setNote("");
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={`${t("bodycamScreen.actions.setStatus")} — ${device.deviceNumber}`} error={error} busy={setStatus.isPending} onSubmit={submit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-status">{t("bodycamScreen.forms.status")}</Label>
        <select id="bwc-status" value={status} onChange={(e) => setStatusValue(e.target.value as BWCDeviceStatus)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
          {(["IN_SERVICE", "CHARGING", "FAULTY", "RETIRED"] as const).map((s) => (
            <option key={s} value={s}>
              {t(`bodycamScreen.status.${s}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-status-note">{t("bodycamScreen.forms.statusNote")}</Label>
        <Input id="bwc-status-note" value={note} onChange={setNote} />
        <p className="text-xs text-foreground-muted">{t("bodycamScreen.forms.statusNoteHint")}</p>
      </div>
    </FormDialog>
  );
}

function PurposeDialog({
  recording,
  onClose,
  onOpened,
}: {
  recording: BWCRecording | null;
  onClose: () => void;
  onOpened: (r: BWCRecording, purpose: string) => void;
}) {
  const { t } = useI18n();
  const [purpose, setPurpose] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    setPurpose("");
    setError(null);
  }, [recording?.id]);
  const submit = async () => {
    if (!recording) return;
    setError(null);
    setBusy(true);
    try {
      const r = await bodycamApi.access(recording.id, purpose);
      onOpened(r, purpose);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <FormDialog
      open={Boolean(recording)}
      onOpenChange={(o) => !o && onClose()}
      title={`${t("bodycamScreen.actions.open")} — ${recording?.recordingNumber ?? ""}`}
      description={t("bodycamScreen.forms.purposeHint")}
      error={error}
      busy={busy}
      onSubmit={submit}
      submitLabel={t("bodycamScreen.actions.open")}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-purpose">{t("bodycamScreen.forms.purpose")}</Label>
        <Input id="bwc-purpose" value={purpose} onChange={setPurpose} />
      </div>
    </FormDialog>
  );
}

function RecordingSheet({
  opened,
  onClose,
  onChanged,
}: {
  opened: { recording: BWCRecording; purpose: string } | null;
  onClose: () => void;
  onChanged: (r: BWCRecording) => void;
}) {
  const { t } = useI18n();
  const { atLeast } = useRole();
  const r = opened?.recording ?? null;
  const chain = useRecordingChain(r?.id ?? null, Boolean(r?.evidenceId));
  const accessLog = useRecordingAccessLog(r?.id ?? null, atLeast("DSP"));
  const [verification, setVerification] = React.useState<BWCVerification | null>(null);
  const [downloadCheck, setDownloadCheck] = React.useState<null | { matched: boolean; hash: string }>(null);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [purgeOpen, setPurgeOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setVerification(null);
    setDownloadCheck(null);
  }, [r?.id]);

  const verify = async () => {
    if (!r) return;
    setBusy(true);
    try {
      setVerification(await bodycamApi.verify(r.id));
    } catch (e) {
      toast.error(t("bodycamScreen.toasts.failed"), errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!r || !opened) return;
    setBusy(true);
    try {
      const { blob, filename, recordedHash, receivedHash } = await bodycamApi.download(r.id, opened.purpose);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadCheck({ matched: Boolean(recordedHash) && recordedHash === receivedHash, hash: receivedHash });
    } catch (e) {
      toast.error(t("bodycamScreen.toasts.failed"), errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={Boolean(r)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {r && (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono">{r.recordingNumber}</SheetTitle>
              <SheetDescription>
                {r.deviceNumber} · {r.officerName} · {r.stationName}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {!r.purgedAt && (
                  <Button size="sm" onClick={download} disabled={busy}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("bodycamScreen.actions.download")}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={verify} disabled={busy}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {t("bodycamScreen.actions.verify")}
                </Button>
                {atLeast("SI") && r.retentionClass === "NON_EVIDENTIAL" && !r.purgedAt && (
                  <Button size="sm" variant="outline" onClick={() => setLinkOpen(true)}>
                    <Link2 className="mr-2 h-4 w-4" />
                    {t("bodycamScreen.actions.link")}
                  </Button>
                )}
                {atLeast("DSP") && r.expired && !r.purgedAt && (
                  <Button size="sm" variant="destructive" onClick={() => setPurgeOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("bodycamScreen.actions.purge")}
                  </Button>
                )}
              </div>

              <Alert>
                <FileVideo className="h-4 w-4" />
                <AlertDescription>{t("bodycamScreen.detail.playbackNote")}</AlertDescription>
              </Alert>

              {downloadCheck && (
                <Alert variant={downloadCheck.matched ? "success" : "danger"}>
                  <Download className="h-4 w-4" />
                  <AlertTitle>
                    {downloadCheck.matched ? t("bodycamScreen.detail.downloadChecked") : t("bodycamScreen.detail.downloadMismatch")}
                  </AlertTitle>
                  <AlertDescription className="break-all font-mono text-xs">{downloadCheck.hash}</AlertDescription>
                </Alert>
              )}

              {verification && (
                <Alert variant={verification.result === "intact" ? "success" : "danger"}>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>{verification.result === "intact" ? t("bodycamScreen.detail.verified") : t("bodycamScreen.detail.broken")}</AlertTitle>
                  {verification.computedSha256 && <AlertDescription className="break-all font-mono text-xs">{verification.computedSha256}</AlertDescription>}
                </Alert>
              )}

              <Panel title={t("bodycamScreen.detail.recording")}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("bodycamScreen.forms.startedAt")} value={when(r.startedAt)} />
                  <Field label={t("bodycamScreen.forms.endedAt")} value={when(r.endedAt)} />
                  <Field label={t("bodycamScreen.detail.uploadedBy")} value={`${r.uploadedByName} · ${when(r.uploadedAt)}`} />
                  <Field label={t("bodycamScreen.list.size")} value={`${megabytes(r.sizeBytes)} · ${r.originalFilename}`} />
                  <Field label={t("bodycamScreen.list.retentionClass")} value={<RetentionPill r={r} />} />
                  {r.retainUntil && !r.purgedAt && <Field label={t("bodycamScreen.detail.retainUntil")} value={when(r.retainUntil)} />}
                  {r.evidenceNumber && (
                    <Field label={t("bodycamScreen.detail.evidence")} value={`${r.evidenceNumber}${r.caseNumber ? ` · ${r.caseNumber}` : ""}${r.firNumber ? ` · ${r.firNumber}` : ""}`} />
                  )}
                  {r.dispatchIncidentNumber && <Field label={t("bodycamScreen.forms.dispatchIncident")} value={r.dispatchIncidentNumber} />}
                </div>
                <div className="mt-3">
                  <Field label={t("bodycamScreen.detail.sha256")} value={<span className="break-all font-mono text-xs">{r.sha256}</span>} />
                </div>
                {r.purgedAt && (
                  <p className="mt-3 text-sm text-foreground-muted">
                    {t("bodycamScreen.detail.purgeNote", { time: when(r.purgedAt), name: r.purgedByName, reason: r.purgeReason ?? "" })}
                  </p>
                )}
              </Panel>

              <Panel title={t("bodycamScreen.detail.custody")}>
                {!r.evidenceId ? (
                  <p className="text-sm text-foreground-muted">{t("bodycamScreen.detail.noChain")}</p>
                ) : chain.isError ? (
                  <p className="text-sm text-danger">{errorText(chain.error)}</p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {(chain.data?.data ?? []).map((leg) => (
                      <li key={leg.id} className="rounded-md border border-border p-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            #{leg.sequenceNumber} → {leg.toName ?? ""} {leg.toLocation ? `(${leg.toLocation})` : ""}
                          </span>
                          <StatusPill tone={leg.signatureStatus === "valid" ? "success" : "danger"}>
                            {leg.signatureStatus === "valid" ? t("bodycamScreen.detail.signatureValid") : t("bodycamScreen.detail.signatureInvalid")}
                          </StatusPill>
                        </div>
                        <div className="text-xs text-foreground-muted">
                          {leg.purpose} · {when(leg.signedAt ?? leg.transferDate)}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>

              <Panel title={t("bodycamScreen.detail.accessLog")}>
                {!atLeast("DSP") ? (
                  <p className="text-sm text-foreground-muted">{t("bodycamScreen.detail.accessRestricted")}</p>
                ) : (
                  <ul className="flex flex-col gap-1 text-sm">
                    {(accessLog.data?.data ?? []).map((e) => (
                      <li key={e.id} className="flex justify-between gap-2">
                        <span>
                          <StatusPill tone={e.accessType === "DENIED" ? "danger" : "neutral"}>{e.accessType}</StatusPill> {e.actorName}: {e.purpose || "—"}
                        </span>
                        <span className="text-xs text-foreground-muted">{when(e.accessedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <LinkDialog open={linkOpen} onOpenChange={setLinkOpen} recording={r} onLinked={onChanged} />
            <PurgeDialog open={purgeOpen} onOpenChange={setPurgeOpen} recording={r} onPurged={onChanged} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function LinkDialog({
  open,
  onOpenChange,
  recording,
  onLinked,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  recording: BWCRecording;
  onLinked: (r: BWCRecording) => void;
}) {
  const { t } = useI18n();
  const link = useLinkRecording(recording.id);
  const [record, setRecord] = React.useState<RecordLink | null>(null);
  const [incident, setIncident] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const incidents = useQuery({
    queryKey: ["dispatch", "incidents", "bodycam-link"],
    queryFn: () => dispatchApi.incidents({ pageSize: 50 }),
    enabled: open,
  });

  const submit = async () => {
    setError(null);
    if (!record) {
      setError(t("bodycamScreen.forms.linkRecord"));
      return;
    }
    try {
      const r = await link.mutateAsync({
        caseId: record.kind === "case" ? record.id : undefined,
        firId: record.kind === "fir" ? record.id : undefined,
        dispatchIncidentId: incident || undefined,
        note,
      });
      toast.success(t("bodycamScreen.toasts.linked", { number: r.recordingNumber, evidence: r.evidenceNumber }));
      onLinked(r);
      setRecord(null);
      setIncident("");
      setNote("");
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${t("bodycamScreen.actions.link")} — ${recording.recordingNumber}`}
      description={t("bodycamScreen.forms.linkHint")}
      error={error}
      busy={link.isPending}
      onSubmit={submit}
      submitLabel={t("bodycamScreen.actions.link")}
    >
      <div className="flex flex-col gap-1.5">
        <Label>{t("bodycamScreen.forms.linkRecord")}</Label>
        <RecordLinkPicker value={record} onChange={setRecord} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-incident">{t("bodycamScreen.forms.dispatchIncident")}</Label>
        <select id="bwc-incident" value={incident} onChange={(e) => setIncident(e.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
          <option value="">—</option>
          {(incidents.data?.data ?? []).map((i) => (
            <option key={i.id} value={i.id}>
              {i.incidentNumber}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-link-note">{t("bodycamScreen.forms.linkNote")}</Label>
        <Input id="bwc-link-note" value={note} onChange={setNote} />
      </div>
    </FormDialog>
  );
}

function PurgeDialog({
  open,
  onOpenChange,
  recording,
  onPurged,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  recording: BWCRecording;
  onPurged: (r: BWCRecording) => void;
}) {
  const { t } = useI18n();
  const purge = usePurgeRecording(recording.id);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const submit = async () => {
    setError(null);
    try {
      const r = await purge.mutateAsync(reason);
      toast.success(t("bodycamScreen.toasts.purged", { number: r.recordingNumber }));
      onPurged(r);
      setReason("");
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${t("bodycamScreen.actions.purge")} — ${recording.recordingNumber}`}
      error={error}
      busy={purge.isPending}
      onSubmit={submit}
      submitLabel={t("bodycamScreen.actions.purge")}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bwc-purge-reason">{t("bodycamScreen.forms.purgeReason")}</Label>
        <Input id="bwc-purge-reason" value={reason} onChange={setReason} />
      </div>
    </FormDialog>
  );
}
