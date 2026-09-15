"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, MapPinned } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Panel } from "@/components/platform/primitives";
import { useI18n } from "@/lib/i18n";
import { useStations } from "@/hooks/use-legacy-registers";
import vehiclesApi from "@/lib/api/vehicles";
import { dispatchApi } from "@/lib/api/dispatch";
import { videoApi } from "@/lib/api/video";
import { trafficIncidentsApi } from "@/lib/api/traffic-incidents";
import { KOLKATA_CENTER } from "@/lib/platform/wb";
import type { MapMarker } from "@/components/ui/Map";

const InteractiveMap = dynamic(() => import("@/components/ui/Map").then((m) => m.InteractiveMap), {
  ssr: false,
  loading: () => <div className="h-[560px] rounded-lg bg-background-tertiary" />,
});

/** Each layer reads at most this many records; the legend says when a layer was capped. */
const LAYER_LIMIT = 100;

type LayerId = "stations" | "vehicles" | "dispatch" | "cameras" | "traffic";

const L = {
  title: { en: "Operational map", bn: "কার্যক্ষেত্রের মানচিত্র" },
  description: {
    en: "Stored positions only: police stations, fleet vehicles with a recorded GPS fix, open dispatch incidents, registered CCTV cameras and traffic incidents. Nothing is estimated or live-tracked.",
    bn: "শুধু সংরক্ষিত অবস্থান: থানা, নথিভুক্ত জিপিএস অবস্থানসহ বাহিনীর যানবাহন, খোলা ডিসপ্যাচ ঘটনা, নিবন্ধিত সিসিটিভি ক্যামেরা ও ট্রাফিক ঘটনা। কিছুই অনুমান বা সরাসরি অনুসরণ করা হয় না।",
  },
  layers: { en: "Layers", bn: "স্তর" },
  stations: { en: "Police stations", bn: "থানা" },
  vehicles: { en: "Fleet vehicles (last recorded GPS)", bn: "বাহিনীর যানবাহন (শেষ নথিভুক্ত জিপিএস)" },
  dispatch: { en: "Open dispatch incidents", bn: "খোলা ডিসপ্যাচ ঘটনা" },
  cameras: { en: "CCTV cameras", bn: "সিসিটিভি ক্যামেরা" },
  traffic: { en: "Traffic incidents", bn: "ট্রাফিক ঘটনা" },
  withPosition: { en: "with a position", bn: "অবস্থানসহ" },
  withoutPosition: { en: "without a stored position", bn: "সংরক্ষিত অবস্থান ছাড়া" },
  capped: { en: "only the first {n} records were read", bn: "শুধু প্রথম {n}টি নথি পড়া হয়েছে" },
  loading: { en: "loading…", bn: "লোড হচ্ছে…" },
  failed: { en: "could not be loaded", bn: "লোড করা যায়নি" },
  open: { en: "Open", bn: "খুলুন" },
  selected: { en: "Selected", bn: "নির্বাচিত" },
  pickMarker: { en: "Select a marker to see the record.", bn: "নথি দেখতে একটি চিহ্ন বেছে নিন।" },
  tiles: {
    en: "Base map tiles are fetched from OpenStreetMap.",
    bn: "মানচিত্রের টাইল OpenStreetMap থেকে আনা হয়।",
  },
};

interface LayerState {
  id: LayerId;
  label: { en: string; bn: string };
  type: MapMarker["type"];
  markers: (MapMarker & { href?: string })[];
  withoutPosition: number;
  capped: boolean;
  isPending: boolean;
  error: string | null;
}

export default function GISPage() {
  const { pick } = useI18n();
  const [enabled, setEnabled] = useState<Record<LayerId, boolean>>({
    stations: true,
    vehicles: true,
    dispatch: true,
    cameras: true,
    traffic: false,
  });
  const [selected, setSelected] = useState<(MapMarker & { href?: string }) | null>(null);

  const stations = useStations();
  const vehicles = useQuery({
    queryKey: ["gis", "vehicles"],
    queryFn: () => vehiclesApi.list({ pageSize: LAYER_LIMIT }),
    enabled: enabled.vehicles,
  });
  const dispatch = useQuery({
    queryKey: ["gis", "dispatch"],
    queryFn: () => dispatchApi.incidents({ view: "open", pageSize: LAYER_LIMIT }),
    enabled: enabled.dispatch,
    refetchInterval: 30000,
  });
  const cameras = useQuery({
    queryKey: ["gis", "cameras"],
    queryFn: () => videoApi.cameras({ pageSize: LAYER_LIMIT }),
    enabled: enabled.cameras,
  });
  const traffic = useQuery({
    queryKey: ["gis", "traffic"],
    queryFn: () => trafficIncidentsApi.list({ pageSize: LAYER_LIMIT }),
    enabled: enabled.traffic,
  });

  const layers: LayerState[] = useMemo(() => {
    const has = (lat: number | null | undefined, lng: number | null | undefined) =>
      typeof lat === "number" && typeof lng === "number";
    const build = <T,>(
      id: LayerId,
      label: { en: string; bn: string },
      type: MapMarker["type"],
      q: { data?: T[]; isPending: boolean; error: Error | null },
      total: number | undefined,
      toMarker: (row: T) => (MapMarker & { href?: string }) | null,
    ): LayerState => {
      const rows = q.data ?? [];
      const markers = rows.map(toMarker).filter((m): m is MapMarker & { href?: string } => m !== null);
      return {
        id,
        label,
        type,
        markers,
        withoutPosition: rows.length - markers.length,
        capped: total !== undefined && total > rows.length,
        isPending: q.isPending,
        error: q.error ? q.error.message : null,
      };
    };
    return [
      build("stations", L.stations, "default", { data: stations.data, isPending: stations.isPending, error: stations.error }, undefined, (s) =>
        has(s.latitude, s.longitude)
          ? { id: `st-${s.id}`, lat: s.latitude!, lng: s.longitude!, title: s.name, description: `${s.code} · ${s.district}`, type: "default" }
          : null,
      ),
      build("vehicles", L.vehicles, "vehicle", { data: vehicles.data?.data, isPending: vehicles.isPending, error: vehicles.error }, vehicles.data?.total, (v) =>
        has(v.gpsLatitude, v.gpsLongitude)
          ? {
              id: `veh-${v.id}`,
              lat: v.gpsLatitude!,
              lng: v.gpsLongitude!,
              title: v.registrationNumber,
              description: `${v.type} · ${v.status}${v.currentDriver ? ` · ${v.currentDriver}` : ""}`,
              type: "vehicle",
              status: v.status,
              href: `/vehicles/${v.id}`,
            }
          : null,
      ),
      build("dispatch", L.dispatch, "incident", { data: dispatch.data?.data, isPending: dispatch.isPending, error: dispatch.error }, dispatch.data?.total, (i) =>
        has(i.latitude, i.longitude)
          ? {
              id: `dsp-${i.id}`,
              lat: i.latitude!,
              lng: i.longitude!,
              title: i.incidentNumber,
              description: `${i.locationText} · ${i.status}`,
              type: "incident",
              status: i.status,
              href: "/dispatch",
            }
          : null,
      ),
      build("cameras", L.cameras, "patrol", { data: cameras.data?.data, isPending: cameras.isPending, error: cameras.error }, cameras.data?.total, (c) =>
        has(c.latitude, c.longitude)
          ? {
              id: `cam-${c.id}`,
              lat: c.latitude!,
              lng: c.longitude!,
              title: `${c.code} · ${c.name}`,
              description: `${c.location} · ${c.status}`,
              type: "patrol",
              href: "/video-intelligence",
            }
          : null,
      ),
      build("traffic", L.traffic, "alert", { data: traffic.data?.data, isPending: traffic.isPending, error: traffic.error }, traffic.data?.total, (t) =>
        has(t.latitude, t.longitude)
          ? {
              id: `trf-${t.id}`,
              lat: t.latitude,
              lng: t.longitude,
              title: t.incidentNumber,
              description: t.location,
              type: "alert",
              href: `/accident-reconstruction/${t.id}`,
            }
          : null,
      ),
    ];
  }, [stations, vehicles, dispatch, cameras, traffic]);

  const markers = layers.filter((l) => enabled[l.id]).flatMap((l) => l.markers);
  const byId = useMemo(() => new Map(markers.map((m) => [m.id, m])), [markers]);

  const swatch: Record<LayerId, string> = {
    stations: "bg-[#6b7280]",
    vehicles: "bg-[#3b82f6]",
    dispatch: "bg-[#ef4444]",
    cameras: "bg-[#22c55e]",
    traffic: "bg-[#dc2626]",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title={pick(L.title)} description={pick(L.description)} icon={MapPinned} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <Panel title={pick(L.layers)} className="xl:col-span-1" footer={<p className="text-xs text-foreground-muted">{pick(L.tiles)}</p>}>
            <ul className="space-y-3">
              {layers.map((l) => (
                <li key={l.id}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={enabled[l.id]}
                      onChange={(e) => setEnabled((s) => ({ ...s, [l.id]: e.target.checked }))}
                    />
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${swatch[l.id]}`} />
                    <span className="min-w-0">
                      <span className="text-foreground">{pick(l.label)}</span>
                      {enabled[l.id] && (
                        <span className="block text-xs text-foreground-muted">
                          {l.isPending ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" /> {pick(L.loading)}
                            </span>
                          ) : l.error ? (
                            <span className="inline-flex items-center gap-1 text-error">
                              <AlertTriangle className="h-3 w-3" /> {pick(L.failed)}: {l.error}
                            </span>
                          ) : (
                            <>
                              {l.markers.length} {pick(L.withPosition)}
                              {l.withoutPosition > 0 && ` · ${l.withoutPosition} ${pick(L.withoutPosition)}`}
                              {l.capped && ` · ${pick(L.capped).replace("{n}", String(LAYER_LIMIT))}`}
                            </>
                          )}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="space-y-4 xl:col-span-3">
            <div className="overflow-hidden rounded-lg border border-border">
              <InteractiveMap
                markers={markers}
                center={[KOLKATA_CENTER.lat, KOLKATA_CENTER.lng]}
                zoom={12}
                height="560px"
                onMarkerClick={(m) => setSelected(byId.get(m.id) ?? m)}
              />
            </div>
            <Panel title={pick(L.selected)}>
              {selected ? (
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{selected.title}</p>
                    {selected.description && <p className="text-foreground-muted">{selected.description}</p>}
                    <p className="font-mono text-xs text-foreground-subtle">
                      {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                    </p>
                  </div>
                  {selected.href && (
                    <Link href={selected.href} className="text-accent hover:underline">
                      {pick(L.open)}
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm text-foreground-muted">{pick(L.pickMarker)}</p>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
