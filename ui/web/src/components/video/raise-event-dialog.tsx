"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
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
import { useCameras, useRaiseVideoEvent } from "@/hooks/use-video";
import { VIDEO_EVENT_TYPES, type EventSeverity, type VideoEventType } from "@/lib/api/video";
import { toast } from "@/stores/toastStore";
import { EVENT_TYPE_LABEL, inputClass, localInputToISO, nowLocalInput } from "./labels";

const SEVERITIES: EventSeverity[] = ["low", "medium", "high", "critical"];

export function RaiseEventDialog({
  open,
  onOpenChange,
  initialCameraId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCameraId?: string | null;
}) {
  const { t, pick } = useI18n();
  const cameras = useCameras({ status: "ACTIVE", pageSize: 100 });
  const raise = useRaiseVideoEvent();
  const [cameraId, setCameraId] = React.useState("");
  const [eventType, setEventType] = React.useState<VideoEventType>("SUSPICIOUS_ACTIVITY");
  const [severity, setSeverity] = React.useState<EventSeverity>("medium");
  const [occurredAt, setOccurredAt] = React.useState(nowLocalInput());
  const [description, setDescription] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setCameraId(initialCameraId ?? "");
      setEventType("SUSPICIOUS_ACTIVITY");
      setSeverity("medium");
      setOccurredAt(nowLocalInput());
      setDescription("");
    }
  }, [open, initialCameraId]);

  const submit = async () => {
    if (!cameraId) {
      toast.error(t("video.raiseEvent"), t("video.chooseCamera"));
      return;
    }
    try {
      const e = await raise.mutateAsync({
        cameraId,
        eventType,
        severity,
        occurredAt: localInputToISO(occurredAt),
        description,
      });
      toast.success(t("video.raiseEvent"), `${e.eventNumber} · ${e.cameraCode}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(t("video.raiseEvent"), err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("video.raiseEvent")}</DialogTitle>
          <DialogDescription>{t("video.raiseEventDesc")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ev-camera">{t("video.fieldCamera")}</Label>
            <select id="ev-camera" className={inputClass} value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
              <option value="">{cameras.isLoading ? t("common.loading") : t("video.chooseCamera")}</option>
              {(cameras.data?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            {cameras.isError && (
              <p className="text-xs text-danger">
                {cameras.error instanceof Error ? cameras.error.message : "Cameras could not be loaded"}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ev-type">{t("video.fieldEventType")}</Label>
              <select id="ev-type" className={inputClass} value={eventType} onChange={(e) => setEventType(e.target.value as VideoEventType)}>
                {VIDEO_EVENT_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {pick(EVENT_TYPE_LABEL[v])}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-severity">{t("video.fieldSeverity")}</Label>
              <select id="ev-severity" className={inputClass} value={severity} onChange={(e) => setSeverity(e.target.value as EventSeverity)}>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {t(`severity.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-at">{t("video.fieldOccurredAt")}</Label>
            <input
              id="ev-at"
              type="datetime-local"
              className={inputClass}
              value={occurredAt}
              max={nowLocalInput()}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-desc">{t("video.fieldDescription")}</Label>
            <Textarea id="ev-desc" rows={3} value={description} onChange={(v: string) => setDescription(v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={raise.isPending}>
            {raise.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("video.raiseEvent")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
