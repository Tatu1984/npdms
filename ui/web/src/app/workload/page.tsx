"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarRange,
  Gauge,
  Loader2,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { DataTable, type Column } from "@/components/platform/data-table";
import {
  EmptyState,
  PageHeader,
  Panel,
  PhaseBadge,
  StatusPill,
} from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import {
  useOfficerWorkload,
  useStationComparison,
  useWorkloadBacklog,
  useWorkloadScopes,
  useWorkloadSLA,
  useWorkloadSummary,
  useWorkloadTrends,
} from "@/hooks/use-workload";
import type {
  AgeBands,
  OfficerWorkload,
  SLAItem,
  StationWorkload,
  TrendInterval,
  WorkloadMetric,
  WorkloadQuery,
  WorkloadScope,
} from "@/lib/api/workload";
import { formatDate } from "@/lib/utils";

const selectClass =
  "h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const METRIC_GROUPS: { key: "investigation" | "courtAndWarrants" | "evidence" | "station"; metrics: string[] }[] = [
  { key: "investigation", metrics: ["firsRegistered", "firsUnderInvestigation", "casesOpen", "tasksOpen", "tasksOverdue", "lookoutsActive"] },
  { key: "courtAndWarrants", metrics: ["casesInCourt", "hearingsNext7", "warrantsActive", "warrantsLapsed", "bailPending"] },
  { key: "evidence", metrics: ["forensicsPending", "forensicsPastExpected", "evidenceBroken", "evidenceUnverified", "weaponsOverdue"] },
  { key: "station", metrics: ["rosterStrength", "onDuty", "onLeave"] },
];

// Literal class names per band: Tailwind cannot see names assembled at runtime.
const BANDS: { key: keyof Omit<AgeBands, "total">; label: TranslationKey; bar: string; dot: string }[] = [
  { key: "days0to30", label: "workload.backlog.band0", bar: "bg-success", dot: "bg-success" },
  { key: "days31to90", label: "workload.backlog.band1", bar: "bg-info", dot: "bg-info" },
  { key: "days91to180", label: "workload.backlog.band2", bar: "bg-warning", dot: "bg-warning" },
  { key: "days181plus", label: "workload.backlog.band3", bar: "bg-danger", dot: "bg-danger" },
];

export default function WorkloadPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const canCompare = Boolean(user && hasMinimumRole(user.role, "DSP"));

  /** A translation when one exists, otherwise the API's own English text. */
  const tr = React.useCallback(
    (key: string, fallback: string) => {
      const value = t(key as TranslationKey);
      return value === key ? fallback : value;
    },
    [t],
  );

  const [tab, setTab] = React.useState("overview");
  const [scopeChoice, setScopeChoice] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [interval, setTrendInterval] = React.useState<TrendInterval>("week");
  const [officer, setOfficer] = React.useState<OfficerWorkload | null>(null);

  const scopes = useWorkloadScopes();

  const query = React.useMemo<WorkloadQuery>(() => {
    const q: WorkloadQuery = {};
    if (scopeChoice.startsWith("station:")) q.stationId = scopeChoice.slice(8);
    if (scopeChoice.startsWith("district:")) q.district = scopeChoice.slice(9);
    if (from) q.from = from;
    if (to) q.to = to;
    return q;
  }, [scopeChoice, from, to]);

  const summary = useWorkloadSummary(query);
  const backlog = useWorkloadBacklog(query, tab === "backlog" || tab === "overview");
  const sla = useWorkloadSLA(query, tab === "sla" || tab === "overview");
  const officers = useOfficerWorkload(query, tab === "officers");
  const stations = useStationComparison(query, tab === "stations" && canCompare);
  // Trends take their own range defaults; only the scope carries over.
  const trendQuery = React.useMemo(() => ({ stationId: query.stationId, district: query.district }), [query]);
  const trends = useWorkloadTrends(trendQuery, interval, tab === "trends");

  const scope = summary.data?.scope;
  const counts = React.useMemo(() => {
    const out: Record<string, WorkloadMetric> = {};
    summary.data?.metrics.forEach((m) => (out[m.key] = m));
    return out;
  }, [summary.data]);

  const slaBreaches = sla.data?.rules.reduce((n, r) => n + r.breaches, 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.workload")}
          description={t("modules.workloadDesc")}
          icon={Gauge}
          badge={<PhaseBadge phase={8} />}
          breadcrumb={[{ label: t("nav.commandGroup") }, { label: t("modules.workload") }]}
        />

        {/* Scope and date filters */}
        <Panel bodyClassName="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs text-foreground-muted">
            {t("workload.scope")}
            {scopes.isPending ? (
              <span className="flex h-9 items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
              </span>
            ) : scopes.isError ? (
              <span className="flex h-9 items-center text-sm text-danger">{scopes.error.message}</span>
            ) : scopes.data.canCompare ? (
              <select
                aria-label={t("workload.scope")}
                className={selectClass}
                value={scopeChoice}
                onChange={(e) => setScopeChoice(e.target.value)}
              >
                <option value="">{t("workload.allStations")}</option>
                <optgroup label={t("workload.district")}>
                  {scopes.data.districts.map((d) => (
                    <option key={d} value={`district:${d}`}>
                      {d}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t("workload.station")}>
                  {scopes.data.stations.map((s) => (
                    <option key={s.stationId} value={`station:${s.stationId}`}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </optgroup>
              </select>
            ) : (
              <span className="flex h-9 items-center text-sm text-foreground">
                {scopes.data.stations[0]?.name ?? t("workload.ownStation")}
              </span>
            )}
          </label>
          <label className="grid gap-1 text-xs text-foreground-muted">
            {t("workload.from")}
            <input type="date" className={selectClass} value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="grid gap-1 text-xs text-foreground-muted">
            {t("workload.to")}
            <input type="date" className={selectClass} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          {(scopeChoice || from || to) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setScopeChoice("");
                setFrom("");
                setTo("");
              }}
            >
              {t("workload.clearFilters")}
            </Button>
          )}
          <ScopeLine scope={scope} />
        </Panel>

        {summary.isError && (
          <p role="alert" className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-sm text-danger">
            {summary.error.message}
          </p>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">{t("workload.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="backlog">{t("workload.tabs.backlog")}</TabsTrigger>
            <TabsTrigger value="sla">
              {t("workload.tabs.sla")}
              {slaBreaches ? ` (${slaBreaches})` : ""}
            </TabsTrigger>
            <TabsTrigger value="officers">{t("workload.tabs.officers")}</TabsTrigger>
            <TabsTrigger value="trends">{t("workload.tabs.trends")}</TabsTrigger>
            {canCompare && <TabsTrigger value="stations">{t("workload.tabs.stations")}</TabsTrigger>}
          </TabsList>

          {/* ------------------------------------------------------------ overview */}
          <TabsContent value="overview">
            {summary.isPending ? (
              <Loading />
            ) : summary.isError ? null : (
              <div className="flex flex-col gap-4">
                {backlog.data && (
                  <BottleneckPanel
                    bottleneck={backlog.data.bottleneck}
                    reason={backlog.data.reason}
                    rule={backlog.data.rule}
                    label={
                      backlog.data.bottleneck
                        ? tr(`workload.stages.${backlog.data.bottleneck}`, backlog.data.stages.find((s) => s.stage === backlog.data?.bottleneck)?.label ?? "")
                        : ""
                    }
                    onOpen={() => setTab("backlog")}
                  />
                )}
                {METRIC_GROUPS.map((group) => (
                  <Panel key={group.key} title={t(`workload.groups.${group.key}`)}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.metrics.map((key) => {
                        const m = counts[key];
                        if (!m) return null;
                        return (
                          <Link
                            key={key}
                            href={m.href}
                            data-metric={key}
                            className={`rounded-md border p-3 transition-colors hover:bg-surface-sunken ${
                              m.attention ? "border-warning/40 bg-warning-subtle" : "border-border"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {tr(`workload.metrics.${key}`, m.label)}
                              </span>
                              <span
                                className={`tabular text-xl font-semibold ${m.attention ? "text-warning" : "text-foreground"}`}
                                data-count
                              >
                                {m.count}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-foreground-muted">{m.definition}</p>
                          </Link>
                        );
                      })}
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ------------------------------------------------------------- backlog */}
          <TabsContent value="backlog">
            {backlog.isPending ? (
              <Loading />
            ) : backlog.isError ? (
              <ErrorLine message={backlog.error.message} onRetry={() => backlog.refetch()} />
            ) : (
              <div className="flex flex-col gap-4">
                <BottleneckPanel
                  bottleneck={backlog.data.bottleneck}
                  reason={backlog.data.reason}
                  rule={backlog.data.rule}
                  label={
                    backlog.data.bottleneck
                      ? tr(`workload.stages.${backlog.data.bottleneck}`, backlog.data.stages.find((s) => s.stage === backlog.data.bottleneck)?.label ?? "")
                      : ""
                  }
                />
                <Panel
                  title={t("workload.tabs.backlog")}
                  description={
                    <span className="flex flex-wrap gap-3">
                      {BANDS.map((b) => (
                        <span key={b.key} className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${b.dot}`} />
                          {t(b.label)}
                        </span>
                      ))}
                    </span>
                  }
                  bodyClassName="p-0"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-foreground-subtle">
                          <th className="px-4 py-2 font-medium">{t("workload.backlog.stage")}</th>
                          {BANDS.map((b) => (
                            <th key={b.key} className="px-3 py-2 text-right font-medium">
                              {t(b.label)}
                            </th>
                          ))}
                          <th className="px-4 py-2 text-right font-medium">{t("workload.backlog.total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backlog.data.stages.map((stage) => (
                          <tr key={stage.stage} data-stage={stage.stage} className="border-b border-border last:border-0 align-top">
                            <td className="px-4 py-3">
                              <Link href={stage.href} className="font-medium text-foreground hover:underline">
                                {tr(`workload.stages.${stage.stage}`, stage.label)}
                              </Link>
                              {backlog.data.bottleneck === stage.stage && (
                                <StatusPill tone="warning" className="ml-2">
                                  {t("workload.backlog.bottleneck")}
                                </StatusPill>
                              )}
                              <p className="mt-1 text-xs text-foreground-muted">{stage.definition}</p>
                              <p className="text-xs text-foreground-subtle">
                                {t("workload.backlog.ageFrom")}: {stage.ageFrom}
                              </p>
                              <BandBar bands={stage.bands} className="mt-2 max-w-sm" />
                            </td>
                            {BANDS.map((b) => (
                              <td key={b.key} className="tabular px-3 py-3 text-right" data-band={b.key}>
                                {stage.bands[b.key]}
                              </td>
                            ))}
                            <td className="tabular px-4 py-3 text-right font-medium" data-band="total">
                              {stage.bands.total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>
            )}
          </TabsContent>

          {/* ----------------------------------------------------------------- SLA */}
          <TabsContent value="sla">
            {sla.isPending ? (
              <Loading />
            ) : sla.isError ? (
              <ErrorLine message={sla.error.message} onRetry={() => sla.refetch()} />
            ) : (
              <div className="flex flex-col gap-4">
                {sla.data.rules.map((rule) => (
                  <Panel
                    key={rule.key}
                    title={
                      <span className="flex flex-wrap items-center gap-2" data-rule={rule.key}>
                        {tr(`workload.rules.${rule.key}`, rule.label)}
                        <StatusPill tone={rule.breaches > 0 ? "danger" : "success"}>
                          {t("workload.sla.breaches", { n: rule.breaches })}
                        </StatusPill>
                      </span>
                    }
                    description={rule.rule}
                  >
                    <dl className="grid gap-2 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-foreground-subtle">{t("workload.sla.source")}</dt>
                        <dd className="mt-0.5 text-foreground-muted">{rule.source}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-foreground-subtle">{t("workload.sla.limits")}</dt>
                        <dd className="mt-0.5 text-foreground-muted">{rule.limits}</dd>
                      </div>
                    </dl>
                    {rule.items.length === 0 ? (
                      <p className="mt-3 text-sm text-foreground-muted">{t("workload.sla.none")}</p>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs text-foreground-subtle">
                              <th className="py-2 pr-3 font-medium">{t("workload.sla.ref")}</th>
                              <th className="py-2 pr-3 font-medium" />
                              <th className="py-2 pr-3 font-medium">{t("workload.sla.since")}</th>
                              <th className="py-2 text-right font-medium">{t("workload.sla.daysOver")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rule.items.map((item) => (
                              <tr key={`${item.module}-${item.id}-${item.title}`} className="border-b border-border last:border-0">
                                <td className="py-2 pr-3 font-mono text-xs">
                                  <Link href={item.href} className="text-accent hover:underline">
                                    {item.ref || item.id.slice(0, 8)}
                                  </Link>
                                </td>
                                <td className="py-2 pr-3">
                                  {item.title}
                                  {item.band && <BandPill band={item.band} />}
                                </td>
                                <td className="py-2 pr-3 text-foreground-muted">{formatDate(item.since)}</td>
                                <td className="tabular py-2 text-right">{item.daysOver}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {rule.breaches > rule.items.length && (
                          <p className="mt-2 text-xs text-foreground-muted">
                            {t("workload.sla.showing", { shown: rule.items.length, total: rule.breaches })}
                          </p>
                        )}
                      </div>
                    )}
                  </Panel>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ------------------------------------------------------------ officers */}
          <TabsContent value="officers">
            <div className="flex flex-col gap-3">
              <p className="flex items-start gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2 text-sm text-foreground-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {t("workload.loadNotice")} {t("workload.officers.audited")}
                </span>
              </p>
              {officers.isPending ? (
                <Loading />
              ) : officers.isError ? (
                <ErrorLine message={officers.error.message} onRetry={() => officers.refetch()} />
              ) : (
                <OfficerTable rows={officers.data.data} onSelect={setOfficer} />
              )}
            </div>
          </TabsContent>

          {/* -------------------------------------------------------------- trends */}
          <TabsContent value="trends">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <CalendarRange className="h-4 w-4 text-foreground-subtle" />
                {(["week", "month"] as const).map((i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={interval === i ? "default" : "outline"}
                    onClick={() => setTrendInterval(i)}
                  >
                    {i === "week" ? t("workload.trends.weekly") : t("workload.trends.monthly")}
                  </Button>
                ))}
              </div>
              {trends.isPending ? (
                <Loading />
              ) : trends.isError ? (
                <ErrorLine message={trends.error.message} onRetry={() => trends.refetch()} />
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {trends.data.series.map((series) => (
                      <Panel
                        key={series.key}
                        title={
                          <span data-series={series.key}>
                            {tr(`workload.series.${series.key}`, series.label)}
                          </span>
                        }
                        description={series.definition}
                        actions={
                          <span className="tabular text-xs text-foreground-muted" data-series-total={series.key}>
                            {t("workload.trends.total", { n: series.values.reduce((a, b) => a + b, 0) })}
                          </span>
                        }
                      >
                        <TrendBars buckets={trends.data.buckets} values={series.values} interval={trends.data.interval} />
                      </Panel>
                    ))}
                  </div>
                  {trends.data.notShown.length > 0 && (
                    <p className="text-xs text-foreground-muted">
                      <span className="font-medium text-foreground-subtle">{t("workload.trends.notShown")}: </span>
                      {trends.data.notShown.join(" ")}
                    </p>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* ------------------------------------------------------------ stations */}
          {canCompare && (
            <TabsContent value="stations">
              {stations.isPending ? (
                <Loading />
              ) : stations.isError ? (
                <ErrorLine message={stations.error.message} onRetry={() => stations.refetch()} />
              ) : (
                <div className="flex flex-col gap-3">
                  <StationTable
                    rows={stations.data.data}
                    onSelect={(st) => {
                      setScopeChoice(`station:${st.stationId}`);
                      setTab("overview");
                    }}
                  />
                  <dl className="grid gap-1 text-xs text-foreground-muted">
                    {Object.entries(stations.data.definitions).map(([k, v]) => (
                      <div key={k}>
                        <dt className="inline font-medium text-foreground-subtle">{k}: </dt>
                        <dd className="inline">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Sheet open={officer !== null} onOpenChange={(o) => !o && setOfficer(null)}>
        <SheetContent className="w-[28rem]">
          {officer && (
            <>
              <SheetHeader>
                <SheetTitle>{officer.name}</SheetTitle>
                <SheetDescription>
                  {officer.rank} · {officer.badge || "—"} · {officer.stationCode}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-3 overflow-y-auto px-5 pb-5">
                <p className="text-xs text-foreground-muted">{t("workload.loadNotice")}</p>
                {[
                  { label: t("workload.officers.firs"), value: officer.firsAsIO, href: "/fir" },
                  { label: t("workload.officers.cases"), value: officer.casesAsIO, href: "/cases" },
                  { label: t("workload.officers.inCourt"), value: officer.casesInCourt, href: "/court" },
                  { label: t("workload.officers.workspaces"), value: officer.workspacesAsIO, href: "/investigation" },
                  { label: t("workload.officers.tasks"), value: officer.openTasks, href: "/investigation" },
                  { label: t("workload.officers.overdue"), value: officer.overdueTasks, href: "/investigation" },
                  { label: t("workload.officers.forensics"), value: officer.pendingForensics, href: "/forensics" },
                  { label: t("workload.officers.hearings"), value: officer.hearingsNext14Days, href: "/court" },
                ].map((row) => (
                  <Link
                    key={row.label}
                    href={row.href}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-sunken"
                  >
                    <span className="text-foreground">{row.label}</span>
                    <span className="tabular font-medium text-foreground">{row.value}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

/* ----------------------------------------------------------------- pieces */

function ScopeLine({ scope }: { scope?: WorkloadScope }) {
  const { t } = useI18n();
  if (!scope) return null;
  return (
    <p className="ml-auto text-xs text-foreground-muted" data-scope={scope.level}>
      {t("workload.covers", { label: scope.label })}
      {(scope.from || scope.to) && <> · {t("workload.windowNote")}</>}
    </p>
  );
}

function Loading() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-foreground-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      {t("common.loading")}
    </div>
  );
}

function ErrorLine({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-sm text-danger">
      <span className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        {message}
      </span>
      <Button size="sm" variant="outline" onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </div>
  );
}

function BottleneckPanel({
  bottleneck,
  reason,
  rule,
  label,
  onOpen,
}: {
  bottleneck: string | null;
  reason: string;
  rule: string;
  label: string;
  onOpen?: () => void;
}) {
  const { t } = useI18n();
  return (
    <Panel
      title={
        <span className="flex items-center gap-2" data-bottleneck={bottleneck ?? "none"}>
          <Scale className="h-4 w-4" />
          {bottleneck ? `${t("workload.backlog.bottleneck")}: ${label}` : t("workload.backlog.noBottleneck")}
        </span>
      }
      actions={
        onOpen && (
          <Button size="sm" variant="outline" onClick={onOpen}>
            {t("workload.tabs.backlog")}
          </Button>
        )
      }
    >
      <p className="text-sm text-foreground">{reason}</p>
      <p className="mt-1 text-xs text-foreground-muted">
        <span className="font-medium text-foreground-subtle">{t("workload.backlog.rule")}: </span>
        {rule}
      </p>
    </Panel>
  );
}

function BandBar({ bands, className }: { bands: AgeBands; className?: string }) {
  const total = bands.total || 1;
  return (
    <div className={`flex h-2 w-full overflow-hidden rounded-full bg-surface-sunken ${className ?? ""}`}>
      {BANDS.map((b) =>
        bands[b.key] > 0 ? (
          <div key={b.key} className={b.bar} style={{ width: `${(bands[b.key] / total) * 100}%` }} />
        ) : null,
      )}
    </div>
  );
}

function BandPill({ band }: { band: SLAItem["band"] }) {
  const { t } = useI18n();
  if (band === "past-90") return <StatusPill tone="danger" className="ml-2">{t("workload.sla.past90")}</StatusPill>;
  if (band === "past-60") return <StatusPill tone="warning" className="ml-2">{t("workload.sla.past60")}</StatusPill>;
  if (band === "approaching-60") return <StatusPill tone="info" className="ml-2">{t("workload.sla.approaching60")}</StatusPill>;
  return null;
}

function TrendBars({ buckets, values, interval }: { buckets: string[]; values: number[]; interval: TrendInterval }) {
  const max = Math.max(1, ...values);
  const label = (iso: string) =>
    interval === "month"
      ? new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
      : new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  return (
    <div>
      <div className="flex h-24 items-end gap-1" role="img" aria-label={values.map((v, i) => `${label(buckets[i])}: ${v}`).join(", ")}>
        {values.map((v, i) => (
          <div key={buckets[i]} className="flex h-full flex-1 flex-col justify-end" title={`${label(buckets[i])}: ${v}`}>
            <div className={v > 0 ? "rounded-t bg-accent" : "h-px bg-border"} style={v > 0 ? { height: `${(v / max) * 100}%` } : undefined} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[0.65rem] text-foreground-subtle">
        <span>{buckets.length ? label(buckets[0]) : ""}</span>
        <span>{buckets.length ? label(buckets[buckets.length - 1]) : ""}</span>
      </div>
    </div>
  );
}

function OfficerTable({ rows, onSelect }: { rows: OfficerWorkload[]; onSelect: (o: OfficerWorkload) => void }) {
  const { t } = useI18n();
  const num = (v: number, danger = false) => (
    <span className={`tabular text-sm ${danger && v > 0 ? "text-danger" : ""}`}>{v}</span>
  );
  const columns: Column<OfficerWorkload>[] = [
    {
      id: "name",
      header: t("workload.officers.name"),
      sortValue: (o) => o.name,
      cell: (o) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{o.name}</p>
          <p className="text-xs text-foreground-subtle">
            {o.rank} · {o.badge || "—"} · {o.stationCode}
          </p>
        </div>
      ),
    },
    { id: "firs", header: t("workload.officers.firs"), align: "right", sortValue: (o) => o.firsAsIO, cell: (o) => num(o.firsAsIO) },
    { id: "cases", header: t("workload.officers.cases"), align: "right", sortValue: (o) => o.casesAsIO, cell: (o) => num(o.casesAsIO) },
    { id: "court", header: t("workload.officers.inCourt"), align: "right", hideBelow: "md", sortValue: (o) => o.casesInCourt, cell: (o) => num(o.casesInCourt) },
    { id: "ws", header: t("workload.officers.workspaces"), align: "right", hideBelow: "lg", sortValue: (o) => o.workspacesAsIO, cell: (o) => num(o.workspacesAsIO) },
    { id: "tasks", header: t("workload.officers.tasks"), align: "right", sortValue: (o) => o.openTasks, cell: (o) => num(o.openTasks) },
    { id: "overdue", header: t("workload.officers.overdue"), align: "right", sortValue: (o) => o.overdueTasks, cell: (o) => num(o.overdueTasks, true) },
    { id: "forensics", header: t("workload.officers.forensics"), align: "right", hideBelow: "md", sortValue: (o) => o.pendingForensics, cell: (o) => num(o.pendingForensics) },
    { id: "hearings", header: t("workload.officers.hearings"), align: "right", hideBelow: "sm", sortValue: (o) => o.hearingsNext14Days, cell: (o) => num(o.hearingsNext14Days) },
  ];
  if (rows.length === 0) {
    return <EmptyState icon={Users} title={t("workload.officers.none")} />;
  }
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(o) => o.userId}
      onRowSelect={onSelect}
      searchPlaceholder={`${t("common.search")}…`}
    />
  );
}

function StationTable({ rows, onSelect }: { rows: StationWorkload[]; onSelect: (s: StationWorkload) => void }) {
  const { t } = useI18n();
  const columns: Column<StationWorkload>[] = [
    {
      id: "station",
      header: t("workload.station"),
      sortValue: (s) => s.name,
      cell: (s) => (
        <div className="min-w-0" data-station={s.code}>
          <p className="text-sm font-medium text-foreground">{s.name}</p>
          <p className="text-xs text-foreground-subtle">{s.district}</p>
        </div>
      ),
    },
    {
      id: "open",
      header: t("workload.stations.open"),
      align: "right",
      sortValue: (s) => s.openInvestigations,
      cell: (s) => (
        <div className="flex flex-col items-end gap-1">
          <span className="tabular text-sm" data-col="open">{s.openInvestigations}</span>
          <BandBar bands={s.backlog} className="w-24" />
        </div>
      ),
    },
    { id: "over90", header: t("workload.stations.over90"), align: "right", sortValue: (s) => s.over90Days, cell: (s) => <span className={`tabular text-sm ${s.over90Days > 0 ? "text-danger" : ""}`} data-col="over90">{s.over90Days}</span> },
    { id: "forensics", header: t("workload.stations.forensics"), align: "right", hideBelow: "md", sortValue: (s) => s.pendingForensics, cell: (s) => <span className="tabular text-sm">{s.pendingForensics}</span> },
    { id: "court", header: t("workload.stations.inCourt"), align: "right", hideBelow: "lg", sortValue: (s) => s.inCourt, cell: (s) => <span className="tabular text-sm">{s.inCourt}</span> },
    { id: "tasks", header: t("workload.stations.tasks"), align: "right", hideBelow: "lg", sortValue: (s) => s.openTasks, cell: (s) => <span className="tabular text-sm">{s.openTasks}</span> },
    { id: "available", header: t("workload.stations.available"), align: "right", hideBelow: "sm", sortValue: (s) => s.available, cell: (s) => <span className="tabular text-sm">{s.available} / {s.rosterStrength}</span> },
    {
      id: "ratio",
      header: t("workload.stations.ratio"),
      align: "right",
      sortValue: (s) => s.perAvailableOfficer ?? -1,
      cell: (s) => <span className="tabular text-sm">{s.perAvailableOfficer === null ? "—" : s.perAvailableOfficer.toFixed(1)}</span>,
    },
  ];
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(s) => s.stationId}
      onRowSelect={onSelect}
      searchPlaceholder={`${t("common.search")}…`}
    />
  );
}
