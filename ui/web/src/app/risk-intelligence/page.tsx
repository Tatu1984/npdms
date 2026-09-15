"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Info, Lock, MapPinned, Plus, Route, Scale, SlidersHorizontal } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { PageHeader, Panel, PhaseBadge, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import type { RiskLevel, RiskQuery, RiskShift } from "@/lib/api/risk";
import { useRiskAreas, useRiskBeats, useRiskFactors, useRiskRecommendations } from "@/hooks/use-risk";
import {
  BeatList,
  CreateBeatDialog,
  FactorTable,
  PlacementPanel,
  SimulationDialog,
  WeightsDialog,
  officerMessage,
} from "./risk-parts";

const InteractiveMap = dynamic(() => import("@/components/ui/Map").then((m) => m.InteractiveMap), {
  ssr: false,
  loading: () => <div className="h-72 rounded-lg bg-surface-sunken" />,
});

const fieldClass =
  "h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

function isoDay(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function Figure({ label, value, hint, testId }: { label: string; value: React.ReactNode; hint?: string; testId?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4" data-testid={testId}>
      <p className="text-xs uppercase tracking-wide text-foreground-subtle">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground" data-value>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-foreground-muted">{hint}</p>}
    </div>
  );
}

export default function RiskIntelligencePage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const allowed = Boolean(user && hasMinimumRole(user.role, "SHO"));
  const wide = Boolean(user && hasMinimumRole(user.role, "DSP"));
  const canEditWeights = Boolean(user && hasMinimumRole(user.role, "SP"));

  const [from, setFrom] = React.useState(() => isoDay(new Date(Date.now() - 29 * 86400000)));
  const [to, setTo] = React.useState(() => isoDay(new Date()));
  const [level, setLevel] = React.useState<RiskLevel>("station");
  const [shift, setShift] = React.useState<RiskShift>("all");
  const [stationId, setStationId] = React.useState("");
  const [top, setTop] = React.useState(3);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [simOpen, setSimOpen] = React.useState(false);
  const [weightsOpen, setWeightsOpen] = React.useState(false);
  const [beatOpen, setBeatOpen] = React.useState(false);

  const query: RiskQuery = { level, from, to, shift, stationId: wide ? stationId || undefined : undefined };
  // Check the period before asking the API, so a date half-way through being
  // edited does not flash an error.
  const spanDays = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  const periodError = !(spanDays >= 1) ? t("riskScreen.filters.invalidOrder") : spanDays > 366 ? t("riskScreen.filters.tooLong") : null;
  const ready = allowed && !periodError;
  const areas = useRiskAreas(query, ready);
  const recs = useRiskRecommendations(query, top, ready);
  const factors = useRiskFactors(allowed);
  // The station filter lists the stations in scope, from station-level scoring.
  const stationList = useRiskAreas({ level: "station", from, to, shift: "all" }, ready && wide);
  const beats = useRiskBeats(wide ? stationId || undefined : undefined, allowed);

  if (!allowed) {
    return (
      <DashboardLayout>
        <div className="flex h-96 flex-col items-center justify-center gap-2 text-center">
          <Lock className="mb-2 h-12 w-12 text-foreground-muted" />
          <h2 className="text-xl font-bold text-foreground">{t("riskScreen.restrictedTitle")}</h2>
          <p className="max-w-md text-foreground-muted">{t("riskScreen.restrictedBody")}</p>
        </div>
      </DashboardLayout>
    );
  }

  const stations = (stationList.data?.areas ?? []).map((a) => ({ id: a.id, name: a.name }));
  const placementStation = wide ? stationId || undefined : user?.stationId;
  const data = areas.data;
  const rows = data?.areas ?? [];
  const scoring = rows.filter((a) => a.score > 0).length;
  const firs = rows.reduce((n, a) => n + a.firCount, 0);
  const prev = rows.reduce((n, a) => n + a.previousFirCount, 0);
  const current = (selected && rows.find((a) => a.id === selected)) || rows[0];
  const markers = rows
    .filter((a) => a.latitude !== null && a.longitude !== null)
    .map((a) => ({
      id: a.id,
      lat: a.latitude as number,
      lng: a.longitude as number,
      title: a.name,
      description: `${t("riskScreen.table.total")} ${a.score.toFixed(2)} · ${a.firCount} FIR`,
      type: "incident" as const,
    }));

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.riskIntelligence")}
          description={t("modules.riskIntelligenceDesc")}
          icon={MapPinned}
          badge={<PhaseBadge phase={10} />}
          breadcrumb={[{ label: t("nav.citizenGroup") }, { label: t("modules.riskIntelligence") }]}
          actions={
            <>
              <Button variant="outline" onClick={() => setWeightsOpen(true)} disabled={!factors.data}>
                <SlidersHorizontal className="h-4 w-4" />
                {canEditWeights ? t("riskScreen.weights.edit") : t("riskScreen.weights.history")}
              </Button>
              <Button onClick={() => setSimOpen(true)} disabled={rows.length === 0}>
                <Scale className="h-4 w-4" />
                {t("riskScreen.simulation.open")}
              </Button>
            </>
          }
        />

        <Alert variant="info">
          <Info />
          <div>
            <AlertTitle>{t("riskScreen.placesTitle")}</AlertTitle>
            <AlertDescription>{t("riskScreen.placesBody")}</AlertDescription>
          </div>
        </Alert>

        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3">
          <div className="grid gap-1">
            <Label htmlFor="rf-level">{t("riskScreen.filters.level")}</Label>
            <select
              id="rf-level"
              className={fieldClass}
              value={level}
              onChange={(e) => {
                setLevel(e.target.value as RiskLevel);
                setSelected(null);
              }}
            >
              <option value="station">{t("riskScreen.filters.station")}</option>
              <option value="beat">{t("riskScreen.filters.beat")}</option>
            </select>
          </div>
          {wide && (
            <div className="grid gap-1">
              <Label htmlFor="rf-station">{t("riskScreen.filters.stationFilter")}</Label>
              <select
                id="rf-station"
                className={fieldClass}
                value={stationId}
                onChange={(e) => {
                  setStationId(e.target.value);
                  setSelected(null);
                }}
              >
                <option value="">{t("riskScreen.filters.allStations")}</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid gap-1">
            <Label htmlFor="rf-from">{t("riskScreen.filters.from")}</Label>
            <input id="rf-from" type="date" className={fieldClass} value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="rf-to">{t("riskScreen.filters.to")}</Label>
            <input id="rf-to" type="date" className={fieldClass} value={to} onChange={(e) => e.target.value && setTo(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="rf-shift">{t("riskScreen.filters.shift")}</Label>
            <select id="rf-shift" className={fieldClass} value={shift} onChange={(e) => setShift(e.target.value as RiskShift)}>
              <option value="all">{t("riskScreen.filters.shiftAll")}</option>
              <option value="day">{t("riskScreen.filters.shiftDay")}</option>
              <option value="night">{t("riskScreen.filters.shiftNight")}</option>
            </select>
          </div>
        </div>

        {periodError ? (
          <Alert variant="warning">
            <AlertTitle>{t("riskScreen.filters.from")} / {t("riskScreen.filters.to")}</AlertTitle>
            <AlertDescription>{periodError}</AlertDescription>
          </Alert>
        ) : areas.isError ? (
          <Alert variant="danger">
            <AlertTitle>{t("riskScreen.areasTitle")}</AlertTitle>
            <AlertDescription>
              {officerMessage(areas.error)}{" "}
              <Button variant="outline" size="sm" onClick={() => areas.refetch()}>
                {t("common.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : !data ? (
          <p className="text-sm text-foreground-muted">…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Figure testId="fig-areas" label={t("riskScreen.stats.areas")} value={rows.length} hint={data.period.shiftLabel} />
              <Figure testId="fig-scoring" label={t("riskScreen.stats.scoring")} value={scoring} />
              <Figure testId="fig-firs" label={t("riskScreen.stats.firs")} value={firs} hint={t("riskScreen.stats.previous", { count: prev })} />
              <Figure
                testId="fig-weights"
                label={t("riskScreen.stats.weights")}
                value={t("riskScreen.stats.version", { version: data.weightSet.version })}
                hint={data.weightSet.reason}
              />
            </div>

            <Panel title={t("riskScreen.formula")}>
              <p className="text-sm text-foreground" data-testid="formula">
                {data.formula}
              </p>
              <p className="mt-1 text-xs text-foreground-muted" data-testid="period">
                {t("riskScreen.period", {
                  from: data.period.from,
                  to: data.period.to,
                  days: data.period.days,
                  previousFrom: data.period.previousFrom,
                  previousTo: data.period.previousTo,
                })}
              </p>
              <ul className="mt-2 list-disc pl-5 text-xs text-foreground-muted">
                {data.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Panel>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <Panel title={t("riskScreen.areasTitle")}>
                {rows.length === 0 ? (
                  <p className="text-sm text-foreground-muted">
                    {level === "beat" ? t("riskScreen.noAreasBeat") : t("riskScreen.noAreasStation")}
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border" data-testid="area-list">
                    {rows.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          data-area={a.name}
                          onClick={() => setSelected(a.id)}
                          className={`flex w-full items-center justify-between gap-3 px-2 py-2 text-left hover:bg-surface-sunken ${
                            current?.id === a.id ? "bg-surface-sunken" : ""
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">{a.name}</span>
                            <span className="block text-xs text-foreground-muted">
                              {t("riskScreen.comparison", {
                                current: a.firCount,
                                previous: a.previousFirCount,
                                change: a.change > 0 ? `+${a.change}` : String(a.change),
                              })}
                            </span>
                          </span>
                          <span className="text-lg font-semibold tabular-nums text-foreground" data-score={a.id}>
                            {a.score.toFixed(2)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              {current && (
                <Panel title={current.name} description={current.level === "beat" ? current.stationName : undefined}>
                  <FactorTable area={current} />
                  {current.coverage && (
                    <p className="mt-2 text-xs text-foreground-muted" data-testid="coverage">
                      {t("riskScreen.coverage", { placed: current.coverage.placed, total: current.coverage.stationTotal })}
                    </p>
                  )}
                </Panel>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel
                title={t("riskScreen.recommendations.title")}
                actions={
                  <div className="flex items-center gap-2">
                    <Label htmlFor="rf-top" className="text-xs">
                      {t("riskScreen.recommendations.top")}
                    </Label>
                    <select id="rf-top" className={fieldClass} value={top} onChange={(e) => setTop(Number(e.target.value))}>
                      {[1, 3, 5, 10].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                }
              >
                {recs.isError && <p className="text-sm text-danger">{officerMessage(recs.error)}</p>}
                {recs.data && (
                  <div className="flex flex-col gap-2" data-testid="recommendations">
                    <p className="text-xs text-foreground-muted">
                      <span className="font-medium">{t("riskScreen.recommendations.rule")}:</span> {recs.data.rule}
                    </p>
                    {recs.data.recommendations.length === 0 ? (
                      <p className="text-sm text-foreground-muted">{t("riskScreen.recommendations.none")}</p>
                    ) : (
                      <ol className="flex flex-col gap-2">
                        {recs.data.recommendations.map((r) => (
                          <li key={r.areaId} className="rounded-md border border-border p-2">
                            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <Route className="h-4 w-4 text-accent" />
                              {r.rank}. {r.areaName}
                              <StatusPill tone="info">{r.score.toFixed(2)}</StatusPill>
                            </p>
                            <p className="mt-1 text-xs text-foreground-muted">{r.reasoning}</p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </Panel>

              <Panel title={t("riskScreen.map")} description={t("riskScreen.mapNote")}>
                {markers.length === 0 ? (
                  <p className="text-sm text-foreground-muted">{t("riskScreen.noCoordinates")}</p>
                ) : (
                  <InteractiveMap markers={markers} center={[markers[0].lat, markers[0].lng]} zoom={12} height="288px" />
                )}
              </Panel>
            </div>
          </>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title={t("riskScreen.beats.title")}
            actions={
              <Button size="sm" onClick={() => setBeatOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("riskScreen.beats.create")}
              </Button>
            }
          >
            {beats.isError ? (
              <p className="text-sm text-danger">{officerMessage(beats.error)}</p>
            ) : (
              <BeatList beats={beats.data?.data ?? []} />
            )}
          </Panel>
          <Panel title={t("riskScreen.placement.title")}>
            <PlacementPanel stationId={periodError ? undefined : placementStation} from={from} to={to} beats={beats.data?.data ?? []} />
          </Panel>
        </div>
      </div>

      <SimulationDialog open={simOpen} onOpenChange={setSimOpen} query={query} areas={rows} />
      {factors.data && (
        <WeightsDialog
          open={weightsOpen}
          onOpenChange={setWeightsOpen}
          factors={factors.data.factors}
          current={factors.data.weightSet}
          canEdit={canEditWeights}
        />
      )}
      <CreateBeatDialog
        open={beatOpen}
        onOpenChange={setBeatOpen}
        stations={stations}
        defaultStation={wide ? stationId || undefined : user?.stationId}
        canChooseStation={wide}
      />
    </DashboardLayout>
  );
}
