"use client";

import * as React from "react";
import { Activity, Clapperboard, KeyRound, Loader2, Pencil, PowerOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field, StatusPill } from "@/components/platform/primitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCamera, useCheckCameraHealth, useDecommissionCamera, useHealthChecks } from "@/hooks/use-video";
import { RETENTION_DAYS } from "@/lib/api/video";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { HEALTH_LABEL, OWNER_LABEL, RETENTION_LABEL } from "./labels";
import { LiveCameraPanel, StreamingControls } from "./live-streaming";

export function CameraSheet({
  cameraId,
  onClose,
  canCheck,
  canEdit,
  canDecommission,
  onEdit,
  onRaiseEvent,
}: {
  cameraId: string | null;
  onClose: () => void;
  canCheck: boolean;
  canEdit: boolean;
  canDecommission: boolean;
  onEdit: (id: string) => void;
  onRaiseEvent: (cameraId: string) => void;
}) {
  const { t, pick } = useI18n();
  const camera = useCamera(cameraId);
  const checks = useHealthChecks(cameraId);
  const check = useCheckCameraHealth();
  const decommission = useDecommissionCamera();
  const [decommissionOpen, setDecommissionOpen] = React.useState(false);
  const [note, setNote] = React.useState("");

  const c = camera.data;

  const runCheck = async () => {
    if (!c) return;
    try {
      const result = await check.mutateAsync(c.id);
      if (result.reachable) {
        toast.success(t("video.checkReachability"), t("video.reachableIn", { ms: result.latencyMs ?? 0 }));
      } else {
        toast.warning(t("video.checkReachability"), t("video.unreachableBecause", { error: result.error ?? "" }));
      }
    } catch (err) {
      toast.error(t("video.checkReachability"), err instanceof Error ? err.message : "The check could not run");
    }
  };

  const submitDecommission = async () => {
    if (!c) return;
    try {
      await decommission.mutateAsync({ id: c.id, note });
      toast.success(t("video.decommission"), c.code);
      setDecommissionOpen(false);
      setNote("");
    } catch (err) {
      toast.error(t("video.decommission"), err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  return (
    <>
      <Sheet open={cameraId !== null} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:w-[32rem]">
          {camera.isLoading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-foreground-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading")}
            </div>
          ) : camera.isError || !c ? (
            <div className="p-6 text-sm text-danger">
              {camera.error instanceof Error ? camera.error.message : "Camera could not be loaded"}
            </div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>{c.name}</SheetTitle>
                <SheetDescription>
                  <span className="font-mono">{c.code}</span> · {c.cameraNumber} · {pick(OWNER_LABEL[c.ownerAgency])}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-6">
                <div className="flex flex-wrap items-center gap-2">
                  {c.status === "DECOMMISSIONED" ? (
                    <StatusPill tone="danger">{t("video.decommissioned")}</StatusPill>
                  ) : (
                    <StatusPill tone={HEALTH_LABEL[c.health].tone}>{pick(HEALTH_LABEL[c.health])}</StatusPill>
                  )}
                  {c.maskingRequired && <StatusPill tone="info">{t("video.masking")}</StatusPill>}
                </div>

                {/* Live feed: only what the Edge Agent actually delivered, under a stated purpose. */}
                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{t("liveVideo.sectionTitle")}</h3>
                  <LiveCameraPanel camera={c} />
                  {canEdit && <StreamingControls camera={c} />}
                  {c.streamType !== "NONE" && (
                    <p className="text-xs text-foreground-subtle">
                      {t("video.feedNotPlayable", {
                        type: c.streamType,
                        target: `${c.streamHost}:${c.streamPort}${c.streamPath ?? ""}`,
                      })}
                    </p>
                  )}
                </section>

                {c.status === "DECOMMISSIONED" && c.decommissionNote && (
                  <p className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-sm text-foreground">
                    {c.decommissionNote}
                  </p>
                )}

                <dl className="grid grid-cols-2 gap-3">
                  <Field label={t("video.fieldLocation")} value={c.location} className="col-span-2" />
                  <Field label={t("agency.station")} value={c.stationName} />
                  <Field
                    label={t("video.fieldStreamType")}
                    value={c.streamType === "NONE" ? t("video.noStream") : c.streamType}
                  />
                  {c.latitude !== null && c.longitude !== null && (
                    <Field label={`${t("video.fieldLatitude")}, ${t("video.fieldLongitude")}`} value={`${c.latitude}, ${c.longitude}`} mono className="col-span-2" />
                  )}
                  <Field
                    label={t("video.credentials")}
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-foreground-subtle" />
                        {c.hasCredentials ? t("video.credentialsStored") : t("video.credentialsNone")}
                      </span>
                    }
                    className="col-span-2"
                  />
                  <Field
                    label={t("video.retention")}
                    value={`${pick(RETENTION_LABEL[c.retentionClass])} — ${t("video.retentionDays", { days: RETENTION_DAYS[c.retentionClass] })}`}
                  />
                  <Field label={t("video.colOpenEvents")} value={c.openEvents} />
                </dl>

                <div className="flex flex-col gap-2">
                  {c.status === "ACTIVE" && (
                    <Button variant="outline" onClick={() => onRaiseEvent(c.id)}>
                      <Clapperboard className="h-4 w-4" />
                      {t("video.raiseOnCamera")}
                    </Button>
                  )}
                  {canCheck && c.status === "ACTIVE" && c.streamType !== "NONE" && (
                    <Button variant="outline" onClick={runCheck} disabled={check.isPending}>
                      {check.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                      {t("video.checkReachability")}
                    </Button>
                  )}
                  {canEdit && c.status === "ACTIVE" && (
                    <Button variant="outline" onClick={() => onEdit(c.id)}>
                      <Pencil className="h-4 w-4" />
                      {t("video.edit")}
                    </Button>
                  )}
                  {canDecommission && c.status === "ACTIVE" && (
                    <Button variant="outline" className="text-danger" onClick={() => setDecommissionOpen(true)}>
                      <PowerOff className="h-4 w-4" />
                      {t("video.decommission")}
                    </Button>
                  )}
                </div>

                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{t("video.healthHistory")}</h3>
                  <p className="text-xs text-foreground-subtle">{t("video.reachabilityExplained")}</p>
                  {checks.isLoading ? (
                    <p className="text-sm text-foreground-muted">{t("common.loading")}</p>
                  ) : checks.isError ? (
                    <p className="text-sm text-danger">
                      {checks.error instanceof Error ? checks.error.message : "Checks could not be loaded"}
                    </p>
                  ) : (checks.data?.data ?? []).length === 0 ? (
                    <p className="text-sm text-foreground-muted">{t("video.noHealthChecks")}</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-md border border-border">
                      {checks.data!.data.map((h) => (
                        <li key={h.id} className="flex flex-col gap-0.5 px-3 py-2">
                          <span className={h.reachable ? "text-sm text-success" : "text-sm text-danger"}>
                            {h.reachable
                              ? t("video.reachableIn", { ms: h.latencyMs ?? 0 })
                              : t("video.unreachableBecause", { error: h.error ?? "" })}
                          </span>
                          <span className="text-xs text-foreground-subtle">
                            {formatDateTime(h.checkedAt)}
                            {h.checkedByName && ` · ${t("video.checkedBy", { name: h.checkedByName })}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={decommissionOpen} onOpenChange={setDecommissionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("video.decommissionTitle", { code: c?.code ?? "" })}</DialogTitle>
            <DialogDescription>{t("video.decommissionDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="decommission-note">{t("video.decommissionNote")}</Label>
            <Textarea id="decommission-note" value={note} onChange={(v: string) => setNote(v)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecommissionOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={submitDecommission} disabled={decommission.isPending}>
              {decommission.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("video.decommission")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
