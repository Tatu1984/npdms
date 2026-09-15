"use client";

import * as React from "react";
import { AlertTriangle, Eye, Loader2, Maximize2, Pause, Play, Radio, Square } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, Panel } from "@/components/platform/primitives";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLiveCameras } from "@/hooks/use-video";
import { MAX_LIVE_VIEW_CAMERAS, type Camera } from "@/lib/api/video";
import { formatDateTime } from "@/lib/utils";
import { HlsPlayer, useOnScreen, usePageVisible } from "./hls-player";
import { LivePurposeDialog, LiveStatusPill, useLiveViewPermission, useLiveViewing } from "./live-streaming";

/**
 * The live wall: every camera whose Edge Agent streams, with its honest status.
 *
 * Nothing plays until the officer states a purpose, which opens one viewing
 * session over the cameras they may watch (recorded once). A tile then plays
 * only while it is on screen, the tab is visible, the camera is live and the
 * wall is not paused; the focused view plays one camera at full size.
 */
export function LiveWall({ onOpenCamera }: { onOpenCamera: (id: string) => void }) {
  const { t } = useI18n();
  const [asking, setAsking] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [focus, setFocus] = React.useState<Camera | null>(null);
  const live = useLiveCameras({ paused: asking });
  const permission = useLiveViewPermission();
  const viewing = useLiveViewing();
  const pageVisible = usePageVisible();

  const cameras = live.data?.data ?? [];
  const media = live.data?.media;
  const watchable = cameras.filter((c) => permission(c) === "ok");
  const sessionIds = watchable.slice(0, MAX_LIVE_VIEW_CAMERAS);
  const uncovered = viewing.session ? sessionIds.filter((c) => !viewing.covers(c.id)) : [];
  const anyAllowed = cameras.length === 0 || watchable.length > 0;
  const rankBlocked = cameras.length > 0 && cameras.every((c) => permission(c) === "rank");

  // Keep the focused camera's status fresh from the poll.
  const focused = focus ? (cameras.find((c) => c.id === focus.id) ?? focus) : null;

  return (
    <Panel
      title={t("liveVideo.wallTitle")}
      description={t("liveVideo.wallDesc")}
      actions={
        cameras.length > 0 && !rankBlocked ? (
          viewing.session ? (
            <div className="flex flex-wrap items-center gap-2">
              {uncovered.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={viewing.starting}
                  onClick={() => viewing.begin(viewing.session!.purpose, sessionIds.map((c) => c.id)).catch(() => setAsking(true))}
                >
                  {t("liveVideo.includeNew", { n: uncovered.length })}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setPaused((p) => !p)}>
                {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {paused ? t("liveVideo.resumeAll") : t("liveVideo.pauseAll")}
              </Button>
              <Button size="sm" variant="outline" onClick={viewing.stop}>
                <Square className="h-3.5 w-3.5" />
                {t("liveVideo.stopViewing")}
              </Button>
            </div>
          ) : (
            anyAllowed && (
              <Button size="sm" onClick={() => setAsking(true)} disabled={watchable.length === 0}>
                <Eye className="h-3.5 w-3.5" />
                {t("liveVideo.startViewing")}
              </Button>
            )
          )
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3">
        {media && !media.configured && (
          <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-subtle px-3 py-2 text-sm text-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span>
              <span className="font-medium">{t("liveVideo.mediaNotConfigured")}</span>
              {media.message && <span className="block text-xs text-foreground-muted">{media.message}</span>}
            </span>
          </p>
        )}
        {rankBlocked && <p className="text-sm text-foreground-muted">{t("liveVideo.rankRequired")}</p>}
        {viewing.session && (
          <p className="text-xs text-foreground-subtle">
            {t("liveVideo.sessionActive", { purpose: viewing.session.purpose })}
          </p>
        )}
        {watchable.length > MAX_LIVE_VIEW_CAMERAS && (
          <p className="text-xs text-foreground-subtle">{t("liveVideo.capped", { n: MAX_LIVE_VIEW_CAMERAS })}</p>
        )}

        {live.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="aspect-video w-full" />
            ))}
          </div>
        ) : live.isError ? (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-danger">{live.error instanceof Error ? live.error.message : "Live cameras could not be loaded"}</span>
            <Button size="sm" variant="outline" onClick={() => live.refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : cameras.length === 0 ? (
          <EmptyState icon={Radio} title={t("liveVideo.noLiveCameras")} description={t("liveVideo.noLiveCamerasHint")} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cameras.map((c) => (
              <LiveTile
                key={c.id}
                camera={c}
                permission={permission(c)}
                inSession={viewing.covers(c.id)}
                hasSession={Boolean(viewing.session)}
                play={!paused && pageVisible && focus === null}
                onFocus={() => setFocus(c)}
                onDetails={() => onOpenCamera(c.id)}
                onLost={viewing.lost}
              />
            ))}
          </div>
        )}
      </div>

      <LivePurposeDialog
        open={asking}
        onOpenChange={setAsking}
        codes={sessionIds.map((c) => c.code)}
        pending={viewing.starting}
        onStart={async (purpose) => {
          await viewing.begin(purpose, sessionIds.map((c) => c.id));
        }}
      />

      <Dialog open={focused !== null} onOpenChange={(o) => !o && setFocus(null)}>
        <DialogContent className="max-w-5xl">
          {focused && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-accent">{focused.code}</span>
                  {focused.name}
                  <LiveStatusPill camera={focused} />
                </DialogTitle>
                <DialogDescription>
                  {focused.location} · {focused.stationName}
                </DialogDescription>
              </DialogHeader>
              <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
                {viewing.covers(focused.id) && focused.liveAvailable ? (
                  <HlsPlayer src={focused.liveUrl!} active={pageVisible} onFatal={viewing.lost} />
                ) : (
                  <div className="grid h-full place-items-center px-4 text-center text-sm text-white/70">
                    {focused.liveStatus !== "ONLINE"
                      ? t(`liveVideo.statusHint.${focused.liveStatus}`)
                      : viewing.session
                        ? t("liveVideo.notInSession")
                        : t("liveVideo.sessionEnded")}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

function LiveTile({
  camera,
  permission,
  inSession,
  hasSession,
  play,
  onFocus,
  onDetails,
  onLost,
}: {
  camera: Camera;
  permission: "ok" | "rank" | "masked";
  inSession: boolean;
  hasSession: boolean;
  play: boolean;
  onFocus: () => void;
  onDetails: () => void;
  onLost: () => void;
}) {
  const { t } = useI18n();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const onScreen = useOnScreen(ref);
  const canPlay = inSession && camera.liveAvailable && Boolean(camera.liveUrl);
  const active = canPlay && onScreen && play;

  let placeholder: string;
  if (camera.liveStatus !== "ONLINE") placeholder = t(`liveVideo.statusHint.${camera.liveStatus}`);
  else if (permission === "masked") placeholder = t("liveVideo.maskedRankRequired");
  else if (permission === "rank") placeholder = t("liveVideo.rankRequired");
  else if (hasSession && !inSession) placeholder = t("liveVideo.notInSession");
  else placeholder = t("liveVideo.player.idle");

  return (
    <div ref={ref} className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="relative aspect-video w-full bg-black">
        {canPlay ? (
          <HlsPlayer src={camera.liveUrl!} active={active} controls={false} onFatal={onLost} />
        ) : (
          <div className="grid h-full place-items-center px-4 text-center text-xs text-white/70">
            {camera.liveStatus === "CONNECTING" && <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />}
            {placeholder}
          </div>
        )}
        <div className="absolute left-2 top-2">
          <LiveStatusPill camera={camera} />
        </div>
        {canPlay && (
          <button
            type="button"
            onClick={onFocus}
            className="absolute right-2 top-2 rounded bg-black/60 p-1.5 text-white hover:bg-black/80"
            aria-label={t("liveVideo.openFocus")}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 px-3 py-2">
        <button type="button" onClick={onDetails} className="min-w-0 text-left">
          <span className="block font-mono text-xs text-accent hover:underline">{camera.code}</span>
          <span className="block truncate text-sm text-foreground">{camera.name}</span>
          <span className="block truncate text-xs text-foreground-subtle">
            {camera.lastSegmentAt
              ? t("liveVideo.lastVideo", { when: formatDateTime(camera.lastSegmentAt) })
              : t("liveVideo.noVideoYet")}
          </span>
        </button>
      </div>
    </div>
  );
}
