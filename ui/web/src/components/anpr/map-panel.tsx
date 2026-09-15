"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPinned } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { EmptyState, Panel, StatusPill } from "@/components/platform/primitives";
import { useAnprAccessLog, useReadsMap } from "@/hooks/use-anpr";
import { formatDateTime } from "@/lib/utils";
import { Pager, errorText } from "./shared";

const InteractiveMap = dynamic(() => import("@/components/ui/Map").then((mod) => mod.InteractiveMap), {
  ssr: false,
  loading: () => <div className="h-96 rounded-lg bg-background-tertiary" />,
});

const KOLKATA: [number, number] = [22.5485, 88.3622];

/** Counts of reads and hits at registered camera locations. No plates are shown here. */
export function MapPanel() {
  const { t } = useI18n();
  const map = useReadsMap();
  const cams = map.data?.cameras ?? [];

  return (
    <Panel title={t("anprScreen.map.title")} description={t("anprScreen.map.description")}>
      {map.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : map.isError ? (
        <p className="text-sm text-danger">{errorText(map.error)}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3" data-testid="anpr-map">
          <div className="lg:col-span-2">
            <InteractiveMap
              markers={cams.map((c) => ({
                id: c.cameraId,
                lat: c.latitude,
                lng: c.longitude,
                title: `${c.code} · ${c.name}`,
                description: t("anprScreen.map.marker", { reads: c.reads, pending: c.pendingHits, confirmed: c.confirmedHits }),
                type: c.pendingHits + c.confirmedHits > 0 ? ("alert" as const) : ("vehicle" as const),
              }))}
              center={cams[0] ? [cams[0].latitude, cams[0].longitude] : KOLKATA}
              zoom={12}
              height="420px"
            />
          </div>
          <div className="flex flex-col gap-2">
            {cams.length === 0 ? (
              <EmptyState icon={MapPinned} title={t("anprScreen.map.empty")} />
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border" data-testid="anpr-map-cameras">
                {cams.map((c) => (
                  <li key={c.cameraId} className="px-3 py-2 text-sm">
                    <p className="font-medium text-foreground">{c.code} · {c.name}</p>
                    <p className="flex flex-wrap gap-1 pt-1 text-xs">
                      <StatusPill tone="info">{t("anprScreen.search.results", { total: c.reads })}</StatusPill>
                      {c.pendingHits > 0 && <StatusPill tone="warning">{c.pendingHits} {t("anprScreen.hits.status.PENDING")}</StatusPill>}
                      {c.confirmedHits > 0 && <StatusPill tone="danger">{c.confirmedHits} {t("anprScreen.hits.status.CONFIRMED")}</StatusPill>}
                    </p>
                    {c.lastReadAt && <p className="text-xs text-foreground-subtle">{formatDateTime(c.lastReadAt)}</p>}
                  </li>
                ))}
              </ul>
            )}
            {(map.data?.readsWithoutCamera ?? 0) > 0 && (
              <p className="text-xs text-foreground-muted">{t("anprScreen.map.withoutCamera", { count: map.data?.readsWithoutCamera ?? 0 })}</p>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

/** The append-only record of submissions, snapshots, searches and analyses opened. */
export function PurposeLogPanel() {
  const { t } = useI18n();
  const [page, setPage] = React.useState(1);
  const log = useAnprAccessLog(page, true);
  const rows = log.data?.data ?? [];
  return (
    <Panel title={t("anprScreen.log.title")} bodyClassName="p-0">
      {log.isLoading ? (
        <div className="p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : log.isError ? (
        <p className="p-4 text-sm text-danger">{errorText(log.error)}</p>
      ) : rows.length === 0 ? (
        <div className="p-4"><EmptyState title={t("anprScreen.log.empty")} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-foreground-muted">{formatDateTime(e.accessedAt)}</td>
                  <td className="px-2 py-2">{e.actorName}{e.actorBadge ? ` (${e.actorBadge})` : ""}</td>
                  <td className="px-2 py-2"><StatusPill>{t(`anprScreen.log.types.${e.accessType}` as const)}</StatusPill></td>
                  <td className="px-2 py-2">{e.purpose}</td>
                  <td className="px-2 py-2 font-mono text-xs">{e.analysisNumber}</td>
                  <td className="px-4 py-2 text-xs text-foreground-muted">
                    {e.resultCount != null ? t("anprScreen.log.results", { count: e.resultCount }) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-4 py-2"><Pager page={page} pages={log.data?.totalPages ?? 0} onPage={setPage} /></div>
    </Panel>
  );
}
