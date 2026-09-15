"use client";

import * as React from "react";
import { Clock, Loader2, Phone, Radio, Search, Siren, Timer, TriangleAlert, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { PageHeader, Panel, PhaseBadge, StatTile, StatusPill } from "@/components/platform/primitives";
import { act } from "@/components/platform/actions";
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
import { toast } from "@/stores/toastStore";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import {
  useDispatchAnalytics,
  useDispatchPolicy,
  useDispatchStats,
  useDispatchUnits,
  useIncidents,
  useIntakeIncident,
} from "@/hooks/use-dispatch";
import { INCIDENT_SOURCES, type IncidentSource, type IncidentView } from "@/lib/api/dispatch";
import { IncidentSheet } from "./incident-sheet";
import { SEVERITY_TONE, STATUS_TONE, formatClock, formatSeconds } from "./tones";

const PAGE_SIZE = 20;
const VIEWS: IncidentView[] = ["queue", "active", "open", "closed"];

const selectClass =
  "h-10 w-full rounded-md border border-border bg-background-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

/** A datetime-local value for now, in the browser's timezone. */
function localNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const emptyIntake = () => ({
  source: "PHONE_112" as IncidentSource,
  callerName: "",
  callerPhone: "",
  description: "",
  locationText: "",
  latitude: "",
  longitude: "",
  receivedAt: localNow(),
});

export default function DispatchPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const canAnalyse = Boolean(user && hasMinimumRole(user.role, "SI"));

  const [view, setView] = React.useState<IncidentView>("open");
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [intakeOpen, setIntakeOpen] = React.useState(false);
  const [intake, setIntake] = React.useState(emptyIntake);
  const [days, setDays] = React.useState(7);

  const stats = useDispatchStats();
  const incidents = useIncidents({ view, search: deferredSearch || undefined, page, pageSize: PAGE_SIZE });
  const units = useDispatchUnits();
  const policy = useDispatchPolicy();
  const intakeMutation = useIntakeIncident();

  const period = React.useMemo(() => {
    const to = new Date();
    to.setMinutes(0, 0, 0);
    to.setHours(to.getHours() + 1);
    const from = new Date(to.getTime() - days * 24 * 3600 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [days]);
  const analytics = useDispatchAnalytics(period.from, period.to, canAnalyse);

  const submitIntake = async () => {
    const lat = intake.latitude.trim();
    const lng = intake.longitude.trim();
    try {
      const created = await intakeMutation.mutateAsync({
        source: intake.source,
        callerName: intake.callerName.trim() || null,
        callerPhone: intake.callerPhone.trim() || null,
        description: intake.description,
        locationText: intake.locationText,
        latitude: lat ? Number(lat) : null,
        longitude: lng ? Number(lng) : null,
        receivedAt: intake.receivedAt ? new Date(intake.receivedAt).toISOString() : undefined,
      });
      toast.success(t("dispatchScreen.intake.done"), created.incidentNumber);
      setIntakeOpen(false);
      setIntake(emptyIntake());
      setView("open");
      setSelected(created.id);
    } catch (err) {
      toast.error(t("dispatchScreen.intake.failed"), err instanceof Error ? err.message : String(err));
    }
  };

  const rows = incidents.data?.data ?? [];
  const totalPages = incidents.data?.totalPages ?? 0;
  const s = stats.data;

  return (
    <DashboardLayout ops>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.dispatch")}
          description={t("modules.dispatchDesc")}
          icon={Radio}
          badge={<PhaseBadge phase={7} />}
          breadcrumb={[{ label: t("nav.commandGroup") }, { label: t("modules.dispatch") }]}
          actions={
            <Button onClick={() => { setIntake(emptyIntake()); setIntakeOpen(true); }}>
              <Phone className="h-4 w-4" />
              {t("dispatchScreen.logIncident")}
            </Button>
          }
          menu={[
            act.link("units", t("dispatchScreen.unitRegister"), "/vehicles", { icon: Users }),
            act.link("personnel", t("dispatchScreen.personnelRegister"), "/personnel", { icon: Users }),
          ]}
        />

        {/* Counts render only once loaded: a zero on a dispatch board must mean zero. */}
        {s ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label={t("dispatchScreen.stats.awaiting")} value={s.awaitingDispatch} icon={TriangleAlert} tone="danger" onClick={() => { setView("queue"); setPage(1); }} />
            <StatTile label={t("dispatchScreen.stats.active")} value={s.unitsEngaged} icon={Siren} tone="warning" onClick={() => { setView("active"); setPage(1); }} />
            <StatTile label={t("dispatchScreen.stats.overdue")} value={s.overdueAcknowledgements + s.overdueOnScene} icon={Timer} tone="danger" />
            <StatTile label={t("dispatchScreen.stats.available")} value={s.unitsAvailable} icon={Radio} tone="success" />
          </div>
        ) : stats.isError ? (
          <p className="rounded-md border border-border p-4 text-sm text-danger">
            {t("dispatchScreen.loadFailed")}: {stats.error.message}
          </p>
        ) : (
          <div className="flex h-24 items-center justify-center rounded-md border border-border">
            <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Panel title={t("dispatchScreen.queueTitle")} description={t("dispatchScreen.queueDescription")} bodyClassName="p-0">
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
              <div className="flex flex-wrap gap-1" role="tablist">
                {VIEWS.map((v) => (
                  <Button
                    key={v}
                    role="tab"
                    aria-selected={view === v}
                    size="sm"
                    variant={view === v ? "default" : "outline"}
                    onClick={() => { setView(v); setPage(1); }}
                  >
                    {t(`dispatchScreen.views.${v}`)}
                  </Button>
                ))}
              </div>
              <div className="min-w-[14rem] flex-1">
                <Input
                  aria-label={t("common.search")}
                  placeholder={t("dispatchScreen.searchPlaceholder")}
                  value={search}
                  onChange={(v: string) => { setSearch(v); setPage(1); }}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
            </div>

            {incidents.isPending ? (
              <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-foreground-muted" /></div>
            ) : incidents.isError ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <p className="text-sm text-foreground">{t("dispatchScreen.loadFailed")}</p>
                <p className="text-xs text-foreground-muted">{incidents.error.message}</p>
                <Button size="sm" variant="outline" onClick={() => incidents.refetch()}>{t("dispatchScreen.retry")}</Button>
              </div>
            ) : rows.length === 0 ? (
              <p className="p-8 text-center text-sm text-foreground-muted">{t("dispatchScreen.empty")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(i.id)}
                      className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-surface-hover"
                      data-incident={i.incidentNumber}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{i.incidentType ?? t("dispatchScreen.unclassified")}</p>
                          <p className="mt-0.5 truncate text-xs text-foreground-subtle">
                            {i.locationText} · {formatClock(i.receivedAt)} · {t(`dispatchScreen.sources.${i.source}`)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {i.severity && <StatusPill tone={SEVERITY_TONE[i.severity]}>{t(`dispatchScreen.severities.${i.severity}`)}</StatusPill>}
                          <StatusPill tone={STATUS_TONE[i.status]}>{t(`dispatchScreen.statuses.${i.status}`)}</StatusPill>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                        <span className="font-mono">{i.incidentNumber}</span>
                        {i.activeUnits > 0 && (
                          <span className="inline-flex items-center gap-1"><Radio className="h-3 w-3" />{t("dispatchScreen.unitsCommitted", { n: i.activeUnits })}</span>
                        )}
                        {i.waitingMinutes !== null && (
                          <span className="inline-flex items-center gap-1 text-warning"><Clock className="h-3 w-3" />{t("dispatchScreen.waiting", { n: Math.floor(i.waitingMinutes) })}</span>
                        )}
                        {i.overdue && <StatusPill tone="danger">{t("dispatchScreen.overdue")}</StatusPill>}
                        {i.escalationLevel > 0 && <StatusPill tone="danger">{t("dispatchScreen.escalated", { n: i.escalationLevel })}</StatusPill>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border p-3 text-xs text-foreground-muted">
                <span>{page} / {totalPages}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</Button>
                </div>
              </div>
            )}
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel title={t("dispatchScreen.units.title")} description={t("dispatchScreen.units.description")} bodyClassName="flex flex-col gap-2">
              {units.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
              ) : units.isError ? (
                <p className="text-sm text-danger">{units.error.message}</p>
              ) : units.data.length === 0 ? (
                <p className="text-sm text-foreground-muted">{t("dispatchScreen.units.none")}</p>
              ) : (
                units.data.map((u) => (
                  <div key={`${u.kind}-${u.id}`} className="flex items-center justify-between gap-3 rounded-md border border-border p-3" data-unit-row={u.label}>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium text-foreground">{u.label}</p>
                      <p className="truncate text-xs text-foreground-subtle">
                        {u.kind === "VEHICLE" ? t("dispatchScreen.units.vehicle") : t("dispatchScreen.units.officer")} · {u.detail} · {u.stationName}
                      </p>
                      {u.reason && <p className="truncate text-xs text-foreground-muted">{u.reason}</p>}
                    </div>
                    {u.engagedIncidentId ? (
                      <button type="button" onClick={() => setSelected(u.engagedIncidentId)}>
                        <StatusPill tone="warning">{t(`dispatchScreen.availability.${u.availability}`)}</StatusPill>
                      </button>
                    ) : (
                      <StatusPill tone={u.availability === "AVAILABLE" ? "success" : "neutral"}>
                        {t(`dispatchScreen.availability.${u.availability}`)}
                      </StatusPill>
                    )}
                  </div>
                ))
              )}
            </Panel>

            <Panel title={t("dispatchScreen.policy.title")} description={t("dispatchScreen.policy.description")}>
              {policy.data ? (
                <div className="flex flex-col gap-3 text-sm text-foreground-muted">
                  <p className="text-xs">{t("dispatchScreen.policy.ladder")}</p>
                  <ol className="flex flex-col gap-2">
                    {policy.data.acknowledgementLadder.map((step) => (
                      <li key={step.level} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 font-mono text-xs text-warning">{t("dispatchScreen.policy.after", { n: step.afterMinutes })}</span>
                        <span>{step.action}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs">{policy.data.notification}</p>
                </div>
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
              )}
            </Panel>
          </div>
        </div>

        <Panel
          title={t("dispatchScreen.analytics.title")}
          description={t("dispatchScreen.analytics.description")}
          actions={
            canAnalyse ? (
              <select aria-label={t("dispatchScreen.analytics.period")} className={`${selectClass} w-40`} value={days} onChange={(e) => setDays(Number(e.target.value))}>
                <option value={7}>{t("dispatchScreen.analytics.last7")}</option>
                <option value={30}>{t("dispatchScreen.analytics.last30")}</option>
              </select>
            ) : undefined
          }
        >
          {!canAnalyse ? (
            <p className="text-sm text-foreground-muted">{t("dispatchScreen.analytics.restricted")}</p>
          ) : analytics.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
          ) : analytics.isError ? (
            <p className="text-sm text-danger">{analytics.error.message}</p>
          ) : analytics.data.data.every((r) => r.incidents === 0) ? (
            <p className="text-sm text-foreground-muted">{t("dispatchScreen.analytics.none")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="response-analytics">
                <thead>
                  <tr className="text-left text-xs text-foreground-subtle">
                    <th className="py-2 pr-4">{t("dispatchScreen.analytics.station")}</th>
                    <th className="py-2 pr-4">{t("dispatchScreen.analytics.incidents")}</th>
                    {(["callToDispatch", "dispatchToAck", "ackToScene"] as const).map((k) => (
                      <th key={k} className="py-2 pr-4">
                        {t(`dispatchScreen.analytics.${k}`)}
                        <span className="block font-normal">
                          {t("dispatchScreen.analytics.median")} / {t("dispatchScreen.analytics.p90")} ({t("dispatchScreen.analytics.samples")})
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.data.data.map((r) => (
                    <tr key={r.stationId ?? "all"} className={r.stationId ? "" : "font-medium"} data-station={r.stationName}>
                      <td className="py-2 pr-4 text-foreground">{r.stationName}</td>
                      <td className="py-2 pr-4 text-foreground">{r.incidents}</td>
                      {[r.callToDispatch, r.dispatchToAcknowledge, r.acknowledgeToScene].map((x, idx) => (
                        <td key={idx} className="py-2 pr-4 font-mono text-xs text-foreground">
                          {formatSeconds(x.medianSeconds)} / {formatSeconds(x.p90Seconds)} ({x.samples})
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <IncidentSheet incidentId={selected} onClose={() => setSelected(null)} />

      <Dialog open={intakeOpen} onOpenChange={setIntakeOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("dispatchScreen.intake.title")}</DialogTitle>
            <DialogDescription>{t("dispatchScreen.intake.description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="intake-source">{t("dispatchScreen.intake.source")}</Label>
                <select id="intake-source" className={selectClass} value={intake.source} onChange={(e) => setIntake({ ...intake, source: e.target.value as IncidentSource })}>
                  {INCIDENT_SOURCES.map((src) => (
                    <option key={src} value={src}>{t(`dispatchScreen.sources.${src}`)}</option>
                  ))}
                </select>
              </div>
              <Input id="intake-received" type="datetime-local" label={t("dispatchScreen.intake.receivedAt")} value={intake.receivedAt} onChange={(v: string) => setIntake({ ...intake, receivedAt: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input id="intake-caller" label={t("dispatchScreen.intake.callerName")} value={intake.callerName} onChange={(v: string) => setIntake({ ...intake, callerName: v })} />
              <Input id="intake-phone" label={t("dispatchScreen.intake.callerPhone")} value={intake.callerPhone} onChange={(v: string) => setIntake({ ...intake, callerPhone: v })} />
            </div>
            <Textarea id="intake-what" label={t("dispatchScreen.intake.what")} placeholder={t("dispatchScreen.intake.whatPlaceholder")} value={intake.description} onChange={(v: string) => setIntake({ ...intake, description: v })} rows={3} />
            <Input id="intake-where" label={t("dispatchScreen.intake.where")} placeholder={t("dispatchScreen.intake.wherePlaceholder")} value={intake.locationText} onChange={(v: string) => setIntake({ ...intake, locationText: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Input id="intake-lat" inputMode="decimal" label={t("dispatchScreen.intake.latitude")} value={intake.latitude} onChange={(v: string) => setIntake({ ...intake, latitude: v })} />
              <Input id="intake-lng" inputMode="decimal" label={t("dispatchScreen.intake.longitude")} value={intake.longitude} onChange={(v: string) => setIntake({ ...intake, longitude: v })} />
            </div>
            <p className="text-xs text-foreground-subtle">{t("dispatchScreen.intake.coordinatesHint")}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntakeOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={submitIntake} disabled={intakeMutation.isPending || !intake.description.trim() || !intake.locationText.trim()}>
              {t("dispatchScreen.intake.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
