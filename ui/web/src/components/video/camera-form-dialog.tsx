"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRegisterCamera, useUpdateCamera } from "@/hooks/use-video";
import {
  CAMERA_OWNERS,
  CAMERA_RETENTIONS,
  RETENTION_DAYS,
  STREAM_TYPES,
  type Camera,
  type CameraOwner,
  type CameraRetention,
  type StreamType,
} from "@/lib/api/video";
import { toast } from "@/stores/toastStore";
import { OWNER_LABEL, RETENTION_LABEL, inputClass } from "./labels";
import { EdgeAgentSettingsDialog } from "./live-streaming";
import type { EdgeAgentConfig } from "@/lib/api/video";

interface FormState {
  code: string;
  name: string;
  location: string;
  latitude: string;
  longitude: string;
  ownerAgency: CameraOwner;
  streamType: StreamType;
  streamHost: string;
  streamPort: string;
  streamPath: string;
  credentialUsername: string;
  credentialSecret: string;
  clearCredentials: boolean;
  retentionClass: CameraRetention;
  maskingRequired: boolean;
  enableStreaming: boolean;
}

const blank: FormState = {
  code: "",
  name: "",
  location: "",
  latitude: "",
  longitude: "",
  ownerAgency: "KP",
  streamType: "NONE",
  streamHost: "",
  streamPort: "",
  streamPath: "",
  credentialUsername: "",
  credentialSecret: "",
  clearCredentials: false,
  retentionClass: "STANDARD",
  maskingRequired: false,
  enableStreaming: true,
};

function fromCamera(c: Camera): FormState {
  return {
    code: c.code,
    name: c.name,
    location: c.location,
    latitude: c.latitude?.toString() ?? "",
    longitude: c.longitude?.toString() ?? "",
    ownerAgency: c.ownerAgency,
    streamType: c.streamType,
    streamHost: c.streamHost ?? "",
    streamPort: c.streamPort?.toString() ?? "",
    streamPath: c.streamPath ?? "",
    credentialUsername: "",
    credentialSecret: "",
    clearCredentials: false,
    retentionClass: c.retentionClass,
    maskingRequired: c.maskingRequired,
    enableStreaming: c.streamingEnabled,
  };
}

const orNull = (v: string) => (v.trim() === "" ? null : v.trim());
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

/** Registers a camera, or edits one when `camera` is given. */
export function CameraFormDialog({
  open,
  onOpenChange,
  camera,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camera?: Camera | null;
}) {
  const { t, pick } = useI18n();
  const editing = Boolean(camera);
  const [form, setForm] = React.useState<FormState>(blank);
  const register = useRegisterCamera();
  const update = useUpdateCamera();
  const pending = register.isPending || update.isPending;
  // One-time Edge Agent settings from a registration. Kept outside the form
  // dialog so closing the form cannot take the token with it.
  const [issued, setIssued] = React.useState<{ config: EdgeAgentConfig; code: string } | null>(null);

  React.useEffect(() => {
    if (open) setForm(camera ? fromCamera(camera) : blank);
  }, [open, camera]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const hasStream = form.streamType !== "NONE";

  const submit = async () => {
    const shared = {
      name: form.name,
      location: form.location,
      latitude: numOrNull(form.latitude),
      longitude: numOrNull(form.longitude),
      ownerAgency: form.ownerAgency,
      streamType: form.streamType,
      streamHost: hasStream ? orNull(form.streamHost) : null,
      streamPort: hasStream ? numOrNull(form.streamPort) : null,
      streamPath: hasStream ? orNull(form.streamPath) : null,
      credentialUsername: hasStream ? orNull(form.credentialUsername) : null,
      credentialSecret: hasStream && form.credentialSecret !== "" ? form.credentialSecret : null,
      retentionClass: form.retentionClass,
      maskingRequired: form.maskingRequired,
    };
    try {
      if (camera) {
        const saved = await update.mutateAsync({
          id: camera.id,
          input: { ...shared, clearCredentials: form.clearCredentials },
        });
        toast.success(t("video.editCamera"), `${saved.code} — ${saved.name}`);
      } else {
        const saved = await register.mutateAsync({ ...shared, code: form.code, enableStreaming: form.enableStreaming });
        toast.success(t("video.registerCamera"), `${saved.cameraNumber} · ${saved.code}`);
        // Shown once the form has finished closing, so two modal layers never overlap.
        const edgeAgent = saved.edgeAgent;
        if (edgeAgent) window.setTimeout(() => setIssued({ config: edgeAgent, code: saved.code }), 250);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(camera ? t("video.editCamera") : t("video.registerCamera"),
        err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  return (
    <>
    <EdgeAgentSettingsDialog config={issued?.config ?? null} code={issued?.code ?? ""} onClose={() => setIssued(null)} />
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("video.editCamera") : t("video.registerCamera")}</DialogTitle>
          <DialogDescription>{t("video.registerCameraDesc")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {!editing && (
            <div className="grid gap-1.5">
              <Label htmlFor="cam-code">{t("video.fieldCode")}</Label>
              <Input id="cam-code" value={form.code} onChange={(v: string) => set("code", v)} placeholder="KP-ESP-014" />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="cam-name">{t("video.fieldName")}</Label>
            <Input id="cam-name" value={form.name} onChange={(v: string) => set("name", v)} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="cam-location">{t("video.fieldLocation")}</Label>
            <Input id="cam-location" value={form.location} onChange={(v: string) => set("location", v)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cam-lat">{t("video.fieldLatitude")}</Label>
            <Input id="cam-lat" type="number" step="any" value={form.latitude} onChange={(v: string) => set("latitude", v)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cam-lng">{t("video.fieldLongitude")}</Label>
            <Input id="cam-lng" type="number" step="any" value={form.longitude} onChange={(v: string) => set("longitude", v)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cam-owner">{t("video.fieldOwner")}</Label>
            <select
              id="cam-owner"
              className={inputClass}
              value={form.ownerAgency}
              onChange={(e) => set("ownerAgency", e.target.value as CameraOwner)}
            >
              {CAMERA_OWNERS.map((o) => (
                <option key={o} value={o}>
                  {pick(OWNER_LABEL[o])}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cam-stream">{t("video.fieldStreamType")}</Label>
            <select
              id="cam-stream"
              className={inputClass}
              value={form.streamType}
              onChange={(e) => set("streamType", e.target.value as StreamType)}
            >
              {STREAM_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s === "NONE" ? t("video.noStream") : s}
                </option>
              ))}
            </select>
          </div>

          {hasStream && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="cam-host">{t("video.fieldHost")}</Label>
                <Input id="cam-host" value={form.streamHost} onChange={(v: string) => set("streamHost", v)} placeholder="10.20.4.17" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cam-port">{t("video.fieldPort")}</Label>
                <Input id="cam-port" type="number" value={form.streamPort} onChange={(v: string) => set("streamPort", v)} placeholder="554" />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="cam-path">{t("video.fieldPath")}</Label>
                <Input id="cam-path" value={form.streamPath} onChange={(v: string) => set("streamPath", v)} placeholder="/Streaming/Channels/101" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cam-user">{t("video.fieldUsername")}</Label>
                <Input
                  id="cam-user"
                  value={form.credentialUsername}
                  onChange={(v: string) => set("credentialUsername", v)}
                  disabled={form.clearCredentials}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cam-secret">{t("video.fieldSecret")}</Label>
                <Input
                  id="cam-secret"
                  type="password"
                  value={form.credentialSecret}
                  onChange={(v: string) => set("credentialSecret", v)}
                  disabled={form.clearCredentials}
                  autoComplete="new-password"
                />
                {editing && camera?.hasCredentials && (
                  <p className="text-xs text-foreground-subtle">{t("video.secretKeepHint")}</p>
                )}
              </div>
              {editing && camera?.hasCredentials && (
                <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
                  <Checkbox
                    checked={form.clearCredentials}
                    onCheckedChange={(v) => set("clearCredentials", v === true)}
                  />
                  {t("video.clearCredentials")}
                </label>
              )}
            </>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="cam-retention">{t("video.retention")}</Label>
            <select
              id="cam-retention"
              className={inputClass}
              value={form.retentionClass}
              onChange={(e) => set("retentionClass", e.target.value as CameraRetention)}
            >
              {CAMERA_RETENTIONS.map((r) => (
                <option key={r} value={r}>
                  {pick(RETENTION_LABEL[r])} — {t("video.retentionDays", { days: RETENTION_DAYS[r] })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-1">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={form.maskingRequired}
                onCheckedChange={(v) => set("maskingRequired", v === true)}
              />
              {t("video.masking")}
            </label>
            <p className="text-xs text-foreground-subtle">{t("video.maskingHint")}</p>
          </div>
          {!editing && (
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={form.enableStreaming}
                  onCheckedChange={(v) => set("enableStreaming", v === true)}
                />
                {t("liveVideo.registerStreaming")}
              </label>
              <p className="text-xs text-foreground-subtle">{t("liveVideo.registerStreamingHint")}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? t("common.save") : t("video.registerCamera")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
