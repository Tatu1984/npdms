"use client";

import * as React from "react";
import {
  Activity,
  Camera,
  Clapperboard,
  Eye,
  Info,
  Pencil,
  Plus,
  ScanSearch,
  Search,
  Video,
  VideoOff,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { EmptyState, PageHeader, Panel, PhaseBadge, StatTile, StatusPill } from "@/components/platform/primitives";
import { act, ActionMenu, type Action } from "@/components/platform/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCameras, useCameraStats, useCheckCameraHealth, useVideoEventStats } from "@/hooks/use-video";
import {
  CAMERA_OWNERS,
  type Camera as CameraRecord,
  type CameraHealth,
  type CameraOwner,
  type CameraStatus,
} from "@/lib/api/video";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { HEALTH_LABEL, OWNER_LABEL, inputClass } from "@/components/video/labels";
import { CameraFormDialog } from "@/components/video/camera-form-dialog";
import { CameraSheet } from "@/components/video/camera-sheet";
import { RaiseEventDialog } from "@/components/video/raise-event-dialog";
import { EventsPanel } from "@/components/video/events-panel";
import { PurposeLogPanel } from "@/components/video/purpose-log-panel";

const PAGE_SIZE = 20;
type Tab = "cameras" | "events" | "purpose-log";

/** Opens a dialog once the details sheet has finished closing, so two modal layers never overlap. */
const afterSheetCloses = (open: () => void) => window.setTimeout(open, 250);

export default function VideoIntelligencePage() {
  const { t, pick } = useI18n();
  const { user } = useAuthStore();
  // Floors mirror the server's (see the Phase 03 block in main.go).
  const canCheck = Boolean(user && hasMinimumRole(user.role, "ASI"));
  const canSearch = canCheck;
  const canTriage = Boolean(user && hasMinimumRole(user.role, "SI"));
  const canManage = Boolean(user && hasMinimumRole(user.role, "SHO"));
  const canGovern = Boolean(user && hasMinimumRole(user.role, "DSP"));

  const [tab, setTab] = React.useState<Tab>("cameras");
  const [searchText, setSearchText] = React.useState("");
  const search = React.useDeferredValue(searchText.trim());
  const [health, setHealth] = React.useState<"" | CameraHealth>("");
  const [owner, setOwner] = React.useState<"" | CameraOwner>("");
  const [status, setStatus] = React.useState<"" | CameraStatus>("ACTIVE");
  const [page, setPage] = React.useState(1);

  const [sheetId, setSheetId] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CameraRecord | null>(null);
  const [raiseOpen, setRaiseOpen] = React.useState(false);
  const [raiseCamera, setRaiseCamera] = React.useState<string | null>(null);

  const cameras = useCameras({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    health: health || undefined,
    ownerAgency: owner || undefined,
    status: status || undefined,
  });
  const cameraStats = useCameraStats();
  const eventStats = useVideoEventStats();
  const check = useCheckCameraHealth();

  const rows = cameras.data?.data ?? [];
  const totalPages = cameras.data?.totalPages ?? 0;
  const filtered = Boolean(search || health || owner || status !== "ACTIVE");

  const openEdit = (c: CameraRecord) => {
    setEditing(c);
    setFormOpen(true);
  };
  const openRaise = (cameraId: string | null) => {
    setRaiseCamera(cameraId);
    setRaiseOpen(true);
  };
  const runCheck = async (c: CameraRecord) => {
    try {
      const result = await check.mutateAsync(c.id);
      if (result.reachable) toast.success(c.code, t("video.reachableIn", { ms: result.latencyMs ?? 0 }));
      else toast.warning(c.code, t("video.unreachableBecause", { error: result.error ?? "" }));
    } catch (err) {
      toast.error(c.code, err instanceof Error ? err.message : "The check could not run");
    }
  };

  const cameraActions = (c: CameraRecord): Action[] => {
    const actions: Action[] = [
      act.label("h", c.code),
      act.run("details", t("video.details"), () => setSheetId(c.id), { icon: Eye }),
    ];
    if (c.status === "ACTIVE") {
      actions.push(act.run("raise", t("video.raiseOnCamera"), () => openRaise(c.id), { icon: Clapperboard }));
      if (canCheck && c.streamType !== "NONE") {
        actions.push(act.run("check", t("video.checkReachability"), () => runCheck(c), { icon: Activity }));
      }
      if (canManage) actions.push(act.run("edit", t("video.edit"), () => openEdit(c), { icon: Pencil }));
    }
    return actions;
  };

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "cameras", label: t("video.tabCameras"), show: true },
    { id: "events", label: t("video.tabEvents"), show: true },
    { id: "purpose-log", label: t("video.tabPurposeLog"), show: canGovern },
  ];

  const stat = (v: number | undefined) => (cameraStats.isError ? 0 : v ?? 0);

  return (
    <DashboardLayout ops>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.videoIntelligence")}
          description={t("modules.videoIntelligenceDesc")}
          icon={Video}
          badge={<PhaseBadge phase={3} />}
          breadcrumb={[{ label: t("nav.surveillanceGroup") }, { label: t("modules.videoIntelligence") }]}
          actions={
            <>
              <Button variant="outline" onClick={() => openRaise(null)}>
                <Clapperboard className="h-4 w-4" />
                {t("video.raiseEvent")}
              </Button>
              {canManage && (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {t("video.registerCamera")}
                </Button>
              )}
            </>
          }
        />

        <p className="flex items-start gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2 text-xs text-foreground-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("video.layerNote")}
        </p>

        {cameraStats.isError && (
          <p className="text-sm text-danger">
            {cameraStats.error instanceof Error ? cameraStats.error.message : "Statistics could not be loaded"}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label={t("video.statActive")} value={stat(cameraStats.data?.active)} icon={Camera} />
          <StatTile label={t("video.statReachable")} value={stat(cameraStats.data?.reachable)} icon={Video} tone="success" />
          <StatTile label={t("video.statUnreachable")} value={stat(cameraStats.data?.unreachable)} icon={VideoOff} tone="danger" />
          <StatTile label={t("video.statUnchecked")} value={stat(cameraStats.data?.unchecked)} icon={Activity} />
          <StatTile
            label={t("video.statAwaitingTriage")}
            value={eventStats.data?.raised ?? 0}
            icon={ScanSearch}
            tone="warning"
            onClick={() => setTab("events")}
          />
        </div>

        <div className="flex gap-1 self-start rounded-md border border-border p-0.5 text-sm" role="tablist">
          {tabs
            .filter((x) => x.show)
            .map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={tab === x.id}
                onClick={() => setTab(x.id)}
                className={cn(
                  "rounded px-3 py-1.5 transition-colors",
                  tab === x.id ? "bg-accent-subtle text-accent" : "text-foreground-muted hover:bg-surface-hover",
                )}
              >
                {x.label}
              </button>
            ))}
        </div>

        {tab === "cameras" && (
          <Panel title={t("video.tabCameras")} bodyClassName="flex flex-col gap-3 p-0">
            <div className="grid gap-2 px-4 pt-4 md:grid-cols-[1fr_auto_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                <Input
                  aria-label={t("video.searchCameras")}
                  placeholder={t("video.searchCameras")}
                  value={searchText}
                  onChange={(v: string) => {
                    setSearchText(v);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <select aria-label={t("video.allHealth")} className={inputClass} value={health} onChange={(e) => { setHealth(e.target.value as "" | CameraHealth); setPage(1); }}>
                <option value="">{t("video.allHealth")}</option>
                {(Object.keys(HEALTH_LABEL) as CameraHealth[]).map((h) => (
                  <option key={h} value={h}>
                    {pick(HEALTH_LABEL[h])}
                  </option>
                ))}
              </select>
              <select aria-label={t("video.allOwners")} className={inputClass} value={owner} onChange={(e) => { setOwner(e.target.value as "" | CameraOwner); setPage(1); }}>
                <option value="">{t("video.allOwners")}</option>
                {CAMERA_OWNERS.map((o) => (
                  <option key={o} value={o}>
                    {pick(OWNER_LABEL[o])}
                  </option>
                ))}
              </select>
              <select aria-label={t("video.allStatuses")} className={inputClass} value={status} onChange={(e) => { setStatus(e.target.value as "" | CameraStatus); setPage(1); }}>
                <option value="">{t("video.allStatuses")}</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DECOMMISSIONED">{t("video.decommissioned")}</option>
              </select>
            </div>

            {cameras.isLoading ? (
              <div className="flex flex-col gap-2 px-4 pb-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : cameras.isError ? (
              <div className="flex items-center justify-between gap-3 px-4 pb-4 text-sm">
                <span className="text-danger">
                  {cameras.error instanceof Error ? cameras.error.message : "Cameras could not be loaded"}
                </span>
                <Button size="sm" variant="outline" onClick={() => cameras.refetch()}>
                  {t("common.retry")}
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <div className="px-4 pb-4">
                <EmptyState
                  icon={Camera}
                  title={filtered ? t("video.noCamerasMatch") : t("video.noCameras")}
                  description={filtered ? undefined : t("video.noCamerasHint")}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                    <tr>
                      <th className="px-4 py-2 font-medium">{t("video.colCamera")}</th>
                      <th className="px-4 py-2 font-medium">{t("video.colLocation")}</th>
                      <th className="px-4 py-2 font-medium">{t("video.colStream")}</th>
                      <th className="px-4 py-2 font-medium">{t("video.colHealth")}</th>
                      <th className="px-4 py-2 text-right font-medium">{t("video.colOpenEvents")}</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-hover">
                        <td className="px-4 py-2">
                          <button type="button" onClick={() => setSheetId(c.id)} className="text-left">
                            <span className="block font-mono text-xs text-accent hover:underline">{c.code}</span>
                            <span className="block text-foreground">{c.name}</span>
                          </button>
                        </td>
                        <td className="px-4 py-2 text-foreground-muted">
                          {c.location}
                          <span className="block text-xs text-foreground-subtle">
                            {c.stationName} · {pick(OWNER_LABEL[c.ownerAgency])}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-foreground-muted">
                          {c.streamType === "NONE" ? (
                            t("video.noStream")
                          ) : (
                            <>
                              {c.streamType}
                              <span className="block font-mono text-xs text-foreground-subtle">
                                {c.streamHost}:{c.streamPort}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {c.status === "DECOMMISSIONED" ? (
                            <StatusPill tone="danger">{t("video.decommissioned")}</StatusPill>
                          ) : (
                            <>
                              <StatusPill tone={HEALTH_LABEL[c.health].tone}>{pick(HEALTH_LABEL[c.health])}</StatusPill>
                              {c.streamType !== "NONE" && (
                                <span className="mt-0.5 block text-xs text-foreground-subtle">
                                  {c.lastCheckedAt
                                    ? t("video.lastChecked", { when: formatDateTime(c.lastCheckedAt) })
                                    : t("video.neverChecked")}
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-foreground">{c.openEvents}</td>
                        <td className="px-2 py-2 text-right">
                          <ActionMenu size="sm" actions={cameraActions(c)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2 text-xs text-foreground-muted">
                <span>
                  {page} / {totalPages}
                </span>
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  ‹
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  ›
                </Button>
              </div>
            )}
          </Panel>
        )}

        {tab === "events" && (
          <EventsPanel
            userId={user?.id}
            canSearch={canSearch}
            canTriage={canTriage}
            canSetRetention={canManage}
            canPurge={canGovern}
          />
        )}

        {tab === "purpose-log" && canGovern && <PurposeLogPanel />}
      </div>

      <CameraSheet
        cameraId={sheetId}
        onClose={() => setSheetId(null)}
        canCheck={canCheck}
        canEdit={canManage}
        canDecommission={canGovern}
        onEdit={(id) => {
          const c = rows.find((r) => r.id === id);
          setSheetId(null);
          if (c) afterSheetCloses(() => openEdit(c));
        }}
        onRaiseEvent={(id) => {
          setSheetId(null);
          afterSheetCloses(() => openRaise(id));
        }}
      />
      <CameraFormDialog open={formOpen} onOpenChange={setFormOpen} camera={editing} />
      <RaiseEventDialog open={raiseOpen} onOpenChange={setRaiseOpen} initialCameraId={raiseCamera} />
    </DashboardLayout>
  );
}
