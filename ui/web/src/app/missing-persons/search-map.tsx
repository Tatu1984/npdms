"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Camera, Info, MapPin, MapPinned } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { CameraMatch, MissingPerson, MissingSighting } from "@/lib/api/missing-persons";
import { useSearchMap, useUpdateMissingPerson } from "@/hooks/use-missing-persons";
import { Panel, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationPicker, type LocationValue } from "@/components/ui/LocationPicker";
import type { CanvasPathStop, CanvasPoint, MapPointKind } from "./search-map-canvas";
import { SOURCE } from "./labels";
import { errorMessage, formatWhen } from "./shared";

const SearchMapCanvas = dynamic(() => import("./search-map-canvas"), {
  ssr: false,
  loading: () => <div className="h-[480px] w-full animate-pulse rounded-md bg-background-tertiary" />,
});

type Layer = "lastSeen" | "verified" | "unverified" | "rejected" | "matchConfirmed" | "matchPending" | "cameras" | "path";

// Literal classes so the legend swatches match the canvas styles.
const swatch: Record<Exclude<Layer, "path">, string> = {
  lastSeen: "inline-block h-3 w-3 rounded-full bg-red-600 ring-2 ring-white",
  verified: "inline-block h-3 w-3 rounded-full bg-green-600",
  unverified: "inline-block h-3 w-3 rounded-full border-2 border-dashed border-amber-600 bg-amber-100",
  rejected: "inline-block h-2.5 w-2.5 rounded-full border-2 border-gray-500 bg-gray-200",
  matchConfirmed: "inline-block h-3 w-3 rounded-full bg-violet-600",
  matchPending: "inline-block h-3 w-3 rounded-full border-2 border-dashed border-violet-600 bg-violet-100",
  cameras: "inline-block h-2 w-2 rounded-full bg-blue-500",
};

const kindOfSighting = (s: MissingSighting): MapPointKind =>
  s.decision === "VERIFIED" ? "VERIFIED" : s.decision === "REJECTED" ? "REJECTED" : "UNVERIFIED";

const layerOf: Record<MapPointKind, Layer> = {
  LAST_SEEN: "lastSeen",
  VERIFIED: "verified",
  UNVERIFIED: "unverified",
  REJECTED: "rejected",
  MATCH_CONFIRMED: "matchConfirmed",
  MATCH_PENDING: "matchPending",
  CAMERA: "cameras",
};

/**
 * The report's search map: last seen, sightings (verified and unverified
 * drawn differently), camera matches from the face recognition layer when it
 * exists, cameras for context, and the time-ordered route with a slider.
 */
export function SearchMapPanel({ person, canSetPoint }: { person: MissingPerson; canSetPoint: boolean }) {
  const { t, pick } = useI18n();
  const map = useSearchMap(person.id);
  const [layers, setLayers] = React.useState<Record<Layer, boolean>>({
    lastSeen: true,
    verified: true,
    unverified: true,
    rejected: false,
    matchConfirmed: true,
    matchPending: true,
    cameras: false,
    path: true,
  });
  const [selected, setSelected] = React.useState<string | null>(null);
  const [upTo, setUpTo] = React.useState<number | null>(null);
  const [settingPoint, setSettingPoint] = React.useState(false);

  const data = map.data;
  const sightings = React.useMemo(() => data?.sightings ?? [], [data]);
  const matches = React.useMemo(() => data?.cameraMatches.data ?? [], [data]);
  const path = React.useMemo(() => data?.path ?? [], [data]);
  const stops = upTo === null ? path.length : Math.min(upTo, path.length);

  const points = React.useMemo<CanvasPoint[]>(() => {
    if (!data) return [];
    const out: CanvasPoint[] = [];
    if (data.lastSeen.latitude !== null && data.lastSeen.longitude !== null) {
      out.push({ key: "last-seen", kind: "LAST_SEEN", lat: data.lastSeen.latitude, lng: data.lastSeen.longitude, title: `${t("missingBoard.map.lastSeen")}: ${data.lastSeen.location} · ${formatWhen(data.lastSeen.at)}` });
    }
    for (const s of sightings) {
      if (s.latitude === null || s.longitude === null) continue;
      out.push({ key: `s:${s.id}`, kind: kindOfSighting(s), lat: s.latitude, lng: s.longitude, title: `${s.location} · ${formatWhen(s.sightedAt)}` });
    }
    for (const c of matches) {
      if (c.latitude === null || c.longitude === null) continue;
      out.push({
        key: `m:${c.id}`,
        kind: c.status === "CONFIRMED" ? "MATCH_CONFIRMED" : "MATCH_PENDING",
        lat: c.latitude,
        lng: c.longitude,
        title: `${c.cameraName || c.sourceMedia}${c.frameTime ? ` · ${formatWhen(c.frameTime)}` : ""}`,
      });
    }
    for (const cam of data.cameras) {
      out.push({ key: `c:${cam.id}`, kind: "CAMERA", lat: cam.latitude, lng: cam.longitude, title: `${cam.name} · ${cam.location}` });
    }
    return out;
  }, [data, sightings, matches, t]);

  const visible = React.useMemo(() => points.filter((p) => layers[layerOf[p.kind]]), [points, layers]);
  const pathStops = React.useMemo<CanvasPathStop[]>(
    () => (layers.path ? path.slice(0, stops).map((p, i) => ({ key: `${p.kind}-${p.refId ?? "origin"}-${i}`, lat: p.latitude, lng: p.longitude })) : []),
    [path, stops, layers.path],
  );

  const unplotted =
    sightings.filter((s) => s.latitude === null).length + matches.filter((c) => c.latitude === null).length;

  if (map.isLoading) return <Skeleton className="h-[480px] w-full" />;
  if (map.isError || !data) {
    return (
      <Panel title={t("missingBoard.map.title")}>
        <p className="text-sm text-danger">{errorMessage(map.error) ?? t("missingBoard.map.loadFailed")}</p>
      </Panel>
    );
  }

  const selectedSighting = selected?.startsWith("s:") ? sightings.find((s) => `s:${s.id}` === selected) : undefined;
  const selectedMatch = selected?.startsWith("m:") ? matches.find((c) => `m:${c.id}` === selected) : undefined;
  const selectedCamera = selected?.startsWith("c:") ? data.cameras.find((c) => `c:${c.id}` === selected) : undefined;

  const toggle = (layer: Layer) => setLayers((l) => ({ ...l, [layer]: !l[layer] }));
  const legend: { layer: Layer; label: string; count: number }[] = [
    { layer: "lastSeen", label: t("missingBoard.map.lastSeen"), count: data.lastSeen.latitude !== null ? 1 : 0 },
    { layer: "verified", label: t("missingBoard.map.verified"), count: sightings.filter((s) => s.decision === "VERIFIED" && s.latitude !== null).length },
    { layer: "unverified", label: t("missingBoard.map.unverified"), count: sightings.filter((s) => !s.decision && s.latitude !== null).length },
    { layer: "rejected", label: t("missingBoard.map.rejected"), count: sightings.filter((s) => s.decision === "REJECTED" && s.latitude !== null).length },
    { layer: "matchConfirmed", label: t("missingBoard.map.matchConfirmed"), count: matches.filter((c) => c.status === "CONFIRMED" && c.latitude !== null).length },
    { layer: "matchPending", label: t("missingBoard.map.matchPending"), count: matches.filter((c) => c.status === "PENDING" && c.latitude !== null).length },
    { layer: "cameras", label: t("missingBoard.map.cameras"), count: data.cameras.length },
    { layer: "path", label: t("missingBoard.map.path"), count: path.length },
  ];

  return (
    <Panel title={t("missingBoard.map.title")} description={t("missingBoard.map.description")}>
      <div className="flex flex-col gap-3">
        {data.lastSeen.latitude === null && (
          <Alert variant="warning">
            <MapPin />
            <AlertDescription>
              <span>{t("missingBoard.map.noLastSeenPoint")}</span>
              {canSetPoint && (person.status === "REPORTED" || person.status === "SEARCHING") && (
                <Button size="sm" variant="outline" className="ml-2" onClick={() => setSettingPoint(true)}>
                  {t("missingBoard.map.setLastSeen")}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        {!data.cameraMatches.available ? (
          <p className="flex items-start gap-2 text-xs text-foreground-muted" data-testid="matches-unavailable">
            <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t("missingBoard.map.matchesUnavailable")}
          </p>
        ) : data.cameraMatches.error ? (
          <p className="text-xs text-danger">{t("missingBoard.map.matchesError")}</p>
        ) : matches.length === 0 ? (
          <p className="flex items-start gap-2 text-xs text-foreground-muted">
            <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t("missingBoard.map.matchesEmpty")}
          </p>
        ) : null}
        {unplotted > 0 && <p className="text-xs text-foreground-muted">{t("missingBoard.map.unplotted", { n: unplotted })}</p>}

        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="relative isolate z-0 overflow-hidden rounded-md border border-border">
            <SearchMapCanvas points={visible} path={pathStops} selected={selected} onSelect={setSelected} />
          </div>

          <div className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-1.5" data-testid="map-layers">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">{t("missingBoard.map.layers")}</legend>
              {legend.map(({ layer, label, count }) => (
                <label key={layer} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={layers[layer]} onCheckedChange={() => toggle(layer)} aria-label={label} />
                  {layer === "path" ? <span className="inline-block h-1 w-4 rounded bg-green-700" /> : <span className={swatch[layer]} />}
                  <span className="flex-1">{label}</span>
                  <span className="text-xs text-foreground-subtle">{count}</span>
                </label>
              ))}
            </fieldset>

            <div className="rounded-md border border-border p-3 text-sm" data-testid="map-detail">
              {selected === "last-seen" ? (
                <dl className="grid gap-1">
                  <dt className="text-xs text-foreground-subtle">{t("missingBoard.map.lastSeen")}</dt>
                  <dd>{data.lastSeen.location}</dd>
                  <dd className="text-xs text-foreground-muted">{formatWhen(data.lastSeen.at)}</dd>
                </dl>
              ) : selectedSighting ? (
                <SightingDetail s={selectedSighting} sourceLabel={pick(SOURCE[selectedSighting.source])} />
              ) : selectedMatch ? (
                <MatchDetail c={selectedMatch} />
              ) : selectedCamera ? (
                <dl className="grid gap-1">
                  <dt className="text-xs text-foreground-subtle">{t("missingBoard.map.camera")}</dt>
                  <dd>{selectedCamera.name} ({selectedCamera.code})</dd>
                  <dd className="text-xs text-foreground-muted">{selectedCamera.location} · {selectedCamera.stationName}</dd>
                </dl>
              ) : (
                <p className="flex items-start gap-2 text-xs text-foreground-muted">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t("missingBoard.map.selectHint")}
                </p>
              )}
            </div>
          </div>
        </div>

        <section className="flex flex-col gap-2" data-testid="map-route">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
            <MapPinned className="h-3.5 w-3.5" />
            {t("missingBoard.map.route")}
          </h3>
          {path.length === 0 ? (
            <p className="text-sm text-foreground-muted">{t("missingBoard.map.routeEmpty")}</p>
          ) : (
            <>
              {path.length > 1 && (
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="route-slider" className="text-xs text-foreground-muted">
                    {t("missingBoard.map.upTo", { n: stops, total: path.length })}
                  </label>
                  <input
                    id="route-slider"
                    type="range"
                    min={1}
                    max={path.length}
                    value={stops}
                    onChange={(e) => setUpTo(Number(e.target.value))}
                    className="w-48 accent-green-700"
                  />
                  {upTo !== null && upTo < path.length && (
                    <Button size="sm" variant="ghost" onClick={() => setUpTo(null)}>
                      {t("missingBoard.map.showAll")}
                    </Button>
                  )}
                </div>
              )}
              <ol className="flex flex-col gap-1.5">
                {path.map((p, i) => {
                  const key = p.kind === "LAST_SEEN" ? "last-seen" : p.kind === "VERIFIED_SIGHTING" ? `s:${p.refId}` : `m:${p.refId}`;
                  const prev = i > 0 ? path[i - 1] : null;
                  const minutes = prev ? Math.round((new Date(p.at).getTime() - new Date(prev.at).getTime()) / 60000) : null;
                  return (
                    <li key={`${key}-${i}`}>
                      <button
                        type="button"
                        onClick={() => setSelected(key)}
                        data-testid="route-stop"
                        className={
                          i < stops
                            ? "flex w-full items-center gap-3 rounded-md border border-border px-3 py-2 text-left hover:bg-background-tertiary"
                            : "flex w-full items-center gap-3 rounded-md border border-dashed border-border px-3 py-2 text-left opacity-50"
                        }
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-900 text-xs font-semibold text-white">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-foreground">{p.label}</span>
                          <span className="block text-xs text-foreground-subtle">
                            {p.kind === "LAST_SEEN"
                              ? t("missingBoard.map.lastSeen")
                              : p.kind === "VERIFIED_SIGHTING"
                                ? t("missingBoard.map.verified")
                                : t("missingBoard.map.matchConfirmed")}{" "}
                            · {formatWhen(p.at)}
                            {minutes !== null && ` · ${t("missingBoard.map.minutesLater", { n: minutes })}`}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </section>
      </div>
      <LastSeenPointDialog open={settingPoint} onClose={() => setSettingPoint(false)} person={person} />
    </Panel>
  );
}

function SightingDetail({ s, sourceLabel }: { s: MissingSighting; sourceLabel: string }) {
  const { t } = useI18n();
  return (
    <dl className="grid gap-1.5" data-testid="map-detail-sighting">
      <dd className="font-medium text-foreground">{s.location}</dd>
      <div>
        <dt className="text-xs text-foreground-subtle">{t("missingBoard.map.reportedBy")}</dt>
        <dd>{s.reportedByName}</dd>
      </div>
      <div>
        <dt className="text-xs text-foreground-subtle">{t("missingBoard.map.when")}</dt>
        <dd>{formatWhen(s.sightedAt)}</dd>
      </div>
      <div>
        <dt className="text-xs text-foreground-subtle">{t("missingBoard.map.source")}</dt>
        <dd>{sourceLabel}</dd>
      </div>
      <div>
        <dt className="text-xs text-foreground-subtle">{t("missingBoard.map.status")}</dt>
        <dd className="flex flex-wrap items-center gap-1">
          <StatusPill tone={s.decision === "VERIFIED" ? "success" : s.decision === "REJECTED" ? "danger" : "warning"}>
            {s.decision ? t(`missingBoard.sightingState.${s.decision}`) : t("missingBoard.sightingState.pending")}
          </StatusPill>
          {s.decidedByName && <span className="text-xs text-foreground-muted">{t("missingBoard.map.decidedBy", { name: s.decidedByName })}</span>}
        </dd>
      </div>
      {s.details && <dd className="text-xs text-foreground-muted">{s.details}</dd>}
    </dl>
  );
}

function MatchDetail({ c }: { c: CameraMatch }) {
  const { t } = useI18n();
  return (
    <dl className="grid gap-1.5" data-testid="map-detail-match">
      <dd className="font-medium text-foreground">{c.cameraName || c.sourceMedia}</dd>
      {c.frameTime && (
        <div>
          <dt className="text-xs text-foreground-subtle">{t("missingBoard.map.frameTime")}</dt>
          <dd>{formatWhen(c.frameTime)}</dd>
        </div>
      )}
      <div>
        <dt className="text-xs text-foreground-subtle">{t("missingBoard.map.media")}</dt>
        <dd>{c.sourceMedia || "—"}</dd>
      </div>
      {c.similarity !== null && <dd>{t("missingBoard.map.similarity", { pct: Math.round(c.similarity * 100) })}</dd>}
      {c.modelVersion && (
        <div>
          <dt className="text-xs text-foreground-subtle">{t("missingBoard.map.model")}</dt>
          <dd className="font-mono text-xs">{c.modelVersion}</dd>
        </div>
      )}
      <div>
        <dt className="text-xs text-foreground-subtle">{t("missingBoard.map.status")}</dt>
        <dd>
          <StatusPill tone={c.status === "CONFIRMED" ? "success" : "warning"}>
            {c.status === "CONFIRMED" ? t("missingBoard.map.matchConfirmed") : t("missingBoard.map.matchPending")}
          </StatusPill>
        </dd>
        <dd className="text-xs text-foreground-muted">
          {c.reviewedByName ? t("missingBoard.map.reviewedBy", { name: c.reviewedByName }) : t("missingBoard.map.notReviewed")}
          {c.reviewedAt && ` · ${formatWhen(c.reviewedAt)}`}
        </dd>
      </div>
      <dd className="text-xs text-foreground-subtle">
        {c.pointFrom === "CAMERA" ? t("missingBoard.map.pointFromCamera") : c.pointFrom === "CANDIDATE" ? t("missingBoard.map.pointFromMatch") : t("missingBoard.map.noPoint")}
      </dd>
    </dl>
  );
}

function LastSeenPointDialog({ open, onClose, person }: { open: boolean; onClose: () => void; person: MissingPerson }) {
  const { t } = useI18n();
  const update = useUpdateMissingPerson();
  const [value, setValue] = React.useState<LocationValue>({ location: person.lastSeenLocation, latitude: null, longitude: null });
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (open) {
      setValue({ location: person.lastSeenLocation, latitude: person.lastSeenLatitude, longitude: person.lastSeenLongitude });
      setError(null);
    }
  }, [open, person]);
  const save = async () => {
    if (value.latitude === null || value.longitude === null) {
      setError(t("missingBoard.map.setLastSeenDesc"));
      return;
    }
    try {
      await update.mutateAsync({ id: person.id, input: { lastSeenLatitude: value.latitude, lastSeenLongitude: value.longitude } });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("missingBoard.map.setLastSeen")}</DialogTitle>
          <DialogDescription>{t("missingBoard.map.setLastSeenDesc")}</DialogDescription>
        </DialogHeader>
        {/* The place name stays as registered; only the pin is taken from here. */}
        <LocationPicker value={value} onChange={(v) => setValue({ ...v, location: v.location || person.lastSeenLocation })} mapHeight="320px" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={update.isPending}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
