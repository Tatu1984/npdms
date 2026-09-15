"use client";

import * as React from "react";
import { AlertTriangle, Check, Copy, Eye, KeyRound, Loader2, Radio, RefreshCw, Square, VideoOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field, StatusPill, type StatusTone } from "@/components/platform/primitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDisableStreaming,
  useEnableStreaming,
  useEndLiveViewing,
  useRotateIngestToken,
  useStartLiveViewing,
} from "@/hooks/use-video";
import {
  LIVE_VIEW_MASKED_MIN_ROLE,
  LIVE_VIEW_MIN_ROLE,
  MIN_PURPOSE_LENGTH,
  type Camera,
  type EdgeAgentConfig,
  type LiveStatus,
  type LiveViewSession,
} from "@/lib/api/video";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { formatDateTime } from "@/lib/utils";
import { HlsPlayer } from "./hls-player";

export const LIVE_STATUS_TONE: Record<LiveStatus, StatusTone> = {
  ONLINE: "success",
  CONNECTING: "warning",
  STOPPED: "neutral",
  OFFLINE: "neutral",
};

/** The honest state of a camera's live feed. */
export function LiveStatusPill({ camera }: { camera: Pick<Camera, "streamingEnabled" | "liveStatus" | "status"> }) {
  const { t } = useI18n();
  if (camera.status !== "ACTIVE" || !camera.streamingEnabled) {
    return <StatusPill tone="neutral">{t("liveVideo.status.notEnabled")}</StatusPill>;
  }
  return (
    <StatusPill tone={LIVE_STATUS_TONE[camera.liveStatus]}>
      {camera.liveStatus === "ONLINE" && <Radio className="mr-1 inline h-3 w-3" />}
      {t(`liveVideo.status.${camera.liveStatus}`)}
    </StatusPill>
  );
}

/** What the viewer's rank allows for this camera, per the server's floors. */
export function useLiveViewPermission() {
  const { user } = useAuthStore();
  return React.useCallback(
    (camera: Pick<Camera, "maskingRequired">): "ok" | "rank" | "masked" => {
      if (!user || !hasMinimumRole(user.role, LIVE_VIEW_MIN_ROLE)) return "rank";
      if (camera.maskingRequired && !hasMinimumRole(user.role, LIVE_VIEW_MASKED_MIN_ROLE)) return "masked";
      return "ok";
    },
    [user],
  );
}

/* ------------------------------------------------------ one-time settings -- */

function CopyRow({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(label, t("liveVideo.copyFailed"));
    }
  };
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium text-foreground-muted">{label}</span>
      <div className="flex items-center gap-2">
        <code
          className={
            secret
              ? "flex-1 select-all break-all rounded-md border border-warning/40 bg-warning-subtle px-2 py-1.5 font-mono text-xs text-foreground"
              : "flex-1 select-all break-all rounded-md border border-border bg-surface-sunken px-2 py-1.5 font-mono text-xs text-foreground"
          }
        >
          {value}
        </code>
        <Button type="button" size="sm" variant="outline" onClick={copy} aria-label={`${t("liveVideo.copy")} ${label}`}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t("liveVideo.copied") : t("liveVideo.copy")}
        </Button>
      </div>
    </div>
  );
}

/**
 * The Edge Agent settings, shown exactly once. The token is never stored in
 * plain text, so the panel makes copying it the obvious next step and asks
 * before it is dismissed.
 */
export function EdgeAgentSettingsDialog({
  config,
  code,
  onClose,
}: {
  config: EdgeAgentConfig | null;
  code: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const close = () => {
    if (window.confirm(t("liveVideo.closeWithoutCopy"))) onClose();
  };
  return (
    <Dialog open={config !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("liveVideo.edgeTitle", { code })}</DialogTitle>
          <DialogDescription>{t("liveVideo.edgeSteps")}</DialogDescription>
        </DialogHeader>
        {config && (
          <div className="grid gap-3">
            <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-subtle px-3 py-2 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              {t("liveVideo.edgeWarning")}
            </p>
            <CopyRow label={t("liveVideo.ingestUrl")} value={config.ingestUrl} />
            <CopyRow label={t("liveVideo.token")} value={config.ingestToken} secret />
            <CopyRow label={t("liveVideo.cameraId")} value={config.cameraId} />
            <CopyRow label={t("liveVideo.publishUrl")} value={config.publishUrl} />
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>{t("liveVideo.done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------- streaming management -- */

/** Enable, rotate and turn off streaming for one camera (SHO and above). */
export function StreamingControls({ camera }: { camera: Camera }) {
  const { t } = useI18n();
  const enable = useEnableStreaming();
  const rotate = useRotateIngestToken();
  const disable = useDisableStreaming();
  const [confirm, setConfirm] = React.useState<"enable" | "rotate" | "disable" | null>(null);
  const [reason, setReason] = React.useState("");
  const [issued, setIssued] = React.useState<EdgeAgentConfig | null>(null);

  if (camera.status !== "ACTIVE") return null;

  const run = async () => {
    try {
      if (confirm === "enable") setIssued((await enable.mutateAsync(camera.id)).edgeAgent);
      if (confirm === "rotate") setIssued((await rotate.mutateAsync(camera.id)).edgeAgent);
      if (confirm === "disable") {
        await disable.mutateAsync({ id: camera.id, reason });
        toast.success(t("liveVideo.disabled"), camera.code);
      }
      setConfirm(null);
      setReason("");
    } catch (err) {
      toast.error(camera.code, err instanceof Error ? err.message : "The server rejected the request");
    }
  };
  const pending = enable.isPending || rotate.isPending || disable.isPending;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {!camera.streamingEnabled ? (
          <Button variant="outline" onClick={() => setConfirm("enable")}>
            <Radio className="h-4 w-4" />
            {t("liveVideo.enable")}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => setConfirm("rotate")}>
              <RefreshCw className="h-4 w-4" />
              {t("liveVideo.rotate")}
            </Button>
            <Button variant="outline" className="text-danger" onClick={() => setConfirm("disable")}>
              <VideoOff className="h-4 w-4" />
              {t("liveVideo.disable")}
            </Button>
          </>
        )}
      </div>

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm === "enable" && t("liveVideo.enableTitle", { code: camera.code })}
              {confirm === "rotate" && t("liveVideo.rotateTitle")}
              {confirm === "disable" && t("liveVideo.disableTitle", { code: camera.code })}
            </DialogTitle>
            <DialogDescription>
              {confirm === "enable" && t("liveVideo.enableDesc")}
              {confirm === "rotate" && t("liveVideo.rotateDesc")}
              {confirm === "disable" && t("liveVideo.disableDesc")}
            </DialogDescription>
          </DialogHeader>
          {confirm === "disable" && (
            <div className="grid gap-1.5">
              <Label htmlFor="disable-reason">{t("liveVideo.disableReason")}</Label>
              <Textarea id="disable-reason" value={reason} onChange={(v: string) => setReason(v)} rows={3} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant={confirm === "disable" ? "destructive" : "default"}
              onClick={run}
              disabled={pending || (confirm === "disable" && reason.trim() === "")}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirm === "enable" && t("liveVideo.enable")}
              {confirm === "rotate" && t("liveVideo.rotate")}
              {confirm === "disable" && t("liveVideo.disable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EdgeAgentSettingsDialog config={issued} code={camera.code} onClose={() => setIssued(null)} />
    </>
  );
}

/* ------------------------------------------------------- viewing sessions -- */

/** The purpose last stated on this page, offered again for the next session. */
let lastPurpose = "";

/**
 * A purpose-logged live viewing session held by one screen. The session is
 * ended when the screen goes away, so the purpose log shows when viewing
 * stopped rather than when the session idled out.
 */
export function useLiveViewing() {
  const start = useStartLiveViewing();
  const end = useEndLiveViewing();
  const [session, setSession] = React.useState<LiveViewSession | null>(null);
  const sessionRef = React.useRef<LiveViewSession | null>(null);
  sessionRef.current = session;
  const endMutate = end.mutate;

  React.useEffect(
    () => () => {
      if (sessionRef.current) endMutate(sessionRef.current.id);
    },
    [endMutate],
  );

  const begin = React.useCallback(
    async (purpose: string, cameraIds: string[]) => {
      const previous = sessionRef.current;
      const created = await start.mutateAsync({ purpose, cameraIds });
      lastPurpose = purpose;
      setSession(created);
      if (previous) endMutate(previous.id);
      return created;
    },
    [start, endMutate],
  );

  const stop = React.useCallback(() => {
    if (sessionRef.current) endMutate(sessionRef.current.id);
    setSession(null);
  }, [endMutate]);

  /** The server refused playback (session ended, streaming off): forget it. */
  const lost = React.useCallback(() => setSession(null), []);

  const covers = React.useCallback((id: string) => Boolean(session?.cameraIds.includes(id)), [session]);

  return { session, begin, stop, lost, covers, starting: start.isPending };
}

/** Asks for the purpose before any live video is shown. */
export function LivePurposeDialog({
  open,
  onOpenChange,
  codes,
  pending,
  onStart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codes: string[];
  pending: boolean;
  onStart: (purpose: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [purpose, setPurpose] = React.useState("");
  React.useEffect(() => {
    if (open) setPurpose(lastPurpose);
  }, [open]);

  const submit = async () => {
    if (purpose.trim().length < MIN_PURPOSE_LENGTH) {
      toast.error(t("liveVideo.purposeTitle"), t("video.purposeTooShort", { n: MIN_PURPOSE_LENGTH }));
      return;
    }
    try {
      await onStart(purpose.trim());
      onOpenChange(false);
    } catch (err) {
      toast.error(t("liveVideo.purposeTitle"), err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("liveVideo.purposeTitle")}</DialogTitle>
          <DialogDescription>{t("liveVideo.purposeDesc", { idle: 15, max: 8 })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="live-purpose">{t("liveVideo.purposeLabel")}</Label>
          <Textarea
            id="live-purpose"
            value={purpose}
            onChange={(v: string) => setPurpose(v)}
            rows={3}
            placeholder={t("liveVideo.purposePlaceholder")}
          />
          <p className="text-xs text-foreground-subtle">{t("liveVideo.purposeCameras", { codes: codes.join(", ") })}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            {t("liveVideo.startViewing")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------------------------- one camera, inline -- */

/**
 * The live panel for one camera: its honest status, and — under a stated
 * purpose — the player. Used on the camera details sheet and the map.
 */
export function LiveCameraPanel({ camera, compact }: { camera: Camera; compact?: boolean }) {
  const { t } = useI18n();
  const permission = useLiveViewPermission()(camera);
  const viewing = useLiveViewing();
  const [asking, setAsking] = React.useState(false);
  const watching = viewing.covers(camera.id);

  const streaming = camera.status === "ACTIVE" && camera.streamingEnabled && camera.liveUrl;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <LiveStatusPill camera={camera} />
        {streaming && (
          <span className="text-xs text-foreground-subtle">
            {camera.lastSegmentAt
              ? t("liveVideo.lastVideo", { when: formatDateTime(camera.lastSegmentAt) })
              : t("liveVideo.noVideoYet")}
          </span>
        )}
      </div>

      {!streaming ? (
        !compact && (
          <p className="rounded-md border border-border bg-surface-sunken px-3 py-2 text-sm text-foreground-muted">
            {t("liveVideo.notEnabledBody")}
          </p>
        )
      ) : (
        <>
          <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-black">
            {watching && camera.liveAvailable ? (
              <HlsPlayer src={camera.liveUrl!} active onFatal={() => viewing.lost()} />
            ) : (
              <div className="grid h-full place-items-center px-4 text-center text-xs text-white/70">
                {camera.liveStatus !== "ONLINE"
                  ? t(`liveVideo.statusHint.${camera.liveStatus}`)
                  : permission === "rank"
                    ? t("liveVideo.rankRequired")
                    : permission === "masked"
                      ? t("liveVideo.maskedRankRequired")
                      : t("liveVideo.player.idle")}
              </div>
            )}
          </div>
          {permission === "ok" && (
            <div className="flex flex-wrap items-center gap-2">
              {watching ? (
                <>
                  <Button size="sm" variant="outline" onClick={viewing.stop}>
                    <Square className="h-3.5 w-3.5" />
                    {t("liveVideo.stopViewing")}
                  </Button>
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground-subtle">
                    {t("liveVideo.sessionActive", { purpose: viewing.session?.purpose ?? "" })}
                  </span>
                </>
              ) : (
                <Button size="sm" onClick={() => setAsking(true)} disabled={camera.liveStatus !== "ONLINE"}>
                  <Eye className="h-3.5 w-3.5" />
                  {t("liveVideo.watchLive")}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {!compact && camera.ingestKey && camera.streamingEnabled && (
        <dl className="grid grid-cols-2 gap-3">
          <Field
            label={t("liveVideo.cameraIdField")}
            value={
              <span className="inline-flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-foreground-subtle" />
                {camera.ingestKey}
              </span>
            }
            mono
            className="col-span-2"
          />
          {camera.streamingEnabledAt && (
            <Field label={t("liveVideo.statStreaming")} value={formatDateTime(camera.streamingEnabledAt)} />
          )}
          {camera.tokenRotatedAt && (
            <Field label={t("liveVideo.token")} value={t("liveVideo.tokenRotatedAt", { when: formatDateTime(camera.tokenRotatedAt) })} />
          )}
        </dl>
      )}

      <LivePurposeDialog
        open={asking}
        onOpenChange={setAsking}
        codes={[camera.code]}
        pending={viewing.starting}
        onStart={async (purpose) => {
          await viewing.begin(purpose, [camera.id]);
        }}
      />
    </div>
  );
}
