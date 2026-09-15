"use client";

import * as React from "react";
import { CheckCircle2, PlugZap, Power } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSetAnprSwitch } from "@/hooks/use-anpr";
import type { ANPRStatus } from "@/lib/api/anpr";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { errorText, textareaClass } from "./shared";

/**
 * What the module can do right now: the switch, the detection service and the
 * models it runs. "Not connected" is a state, shown plainly — never an error
 * screen and never replaced by placeholder output.
 */
export function ServiceBanner({ status }: { status: ANPRStatus }) {
  const { t } = useI18n();
  const { service, switch: sw } = status;
  const classLabel = (c: string) => {
    const key = `anprScreen.classes.${c}`;
    return (t as (k: string) => string)(key) === key ? c : (t as (k: string) => string)(key);
  };

  return (
    <div className="flex flex-col gap-2" data-testid="anpr-service-banner">
      {!service.connected && (
        <div className="rounded-lg border border-warning/40 bg-warning-subtle p-3 text-sm" data-testid="service-not-connected">
          <p className="flex items-center gap-2 font-semibold text-warning">
            <PlugZap className="h-4 w-4" /> {t("anprScreen.service.notConnectedTitle")}
          </p>
          <p className="mt-1 text-foreground">{t("anprScreen.service.notConnectedBody")}</p>
          {service.reason && (
            <p className="mt-1 text-xs text-foreground-muted">
              {t("anprScreen.service.reason")}: {service.reason}
            </p>
          )}
        </div>
      )}
      {!sw.enabled && (
        <div className="rounded-lg border border-border bg-surface-sunken p-3 text-sm" data-testid="module-switched-off">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <Power className="h-4 w-4" /> {t("anprScreen.service.offTitle")}
          </p>
          <p className="mt-1 text-foreground-muted">
            {sw.updatedBy
              ? t("anprScreen.service.offBody", { name: sw.updatedByName, when: formatDateTime(sw.updatedAt), note: sw.note })
              : t("anprScreen.service.offInstall")}
          </p>
        </div>
      )}
      {service.connected && (
        <details className="rounded-lg border border-border bg-surface p-3 text-sm">
          <summary className="flex cursor-pointer items-center gap-2 font-medium text-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" /> {t("anprScreen.service.connectedTitle")}
            {service.versions && <span className="text-xs font-normal text-foreground-muted">· {service.versions.pipeline}</span>}
          </summary>
          <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-foreground-subtle">{t("anprScreen.service.detects")}</dt>
              <dd className="text-foreground">{(service.vehicleClasses ?? []).map(classLabel).join(", ")}</dd>
            </div>
            <div>
              <dt className="text-foreground-subtle">{t("anprScreen.service.notDetected")}</dt>
              <dd className="text-foreground">{(service.unsupportedVehicleClasses ?? []).map(classLabel).join(", ")}</dd>
            </div>
            <div>
              <dt className="text-foreground-subtle">{t("anprScreen.service.colour")}</dt>
              <dd className="text-foreground">{service.colour}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-foreground-subtle">{t("anprScreen.service.models")}</dt>
              <dd>
                <ul className="mt-1 flex flex-col gap-0.5 text-foreground">
                  {(service.models ?? []).map((m) => (
                    <li key={m.key}>
                      {m.version} — {m.licence} {t("anprScreen.service.licence")} ·{" "}
                      <span className="font-mono text-foreground-muted">{m.sha256.slice(0, 12)}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </details>
      )}
    </div>
  );
}

export function SwitchButton({ status }: { status: ANPRStatus }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const setSwitch = useSetAnprSwitch();
  const turningOn = !status.switch.enabled;

  const save = async () => {
    try {
      await setSwitch.mutateAsync({ enabled: turningOn, note });
      setOpen(false);
      setNote("");
      toast.success(turningOn ? t("anprScreen.service.switchTitleOn") : t("anprScreen.service.switchTitleOff"));
    } catch (e) {
      toast.error(t("anprScreen.service.switchSave"), errorText(e));
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} data-testid="anpr-switch">
        <Power className="h-4 w-4" />
        {turningOn ? t("anprScreen.service.switchOn") : t("anprScreen.service.switchOff")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{turningOn ? t("anprScreen.service.switchTitleOn") : t("anprScreen.service.switchTitleOff")}</DialogTitle>
            <DialogDescription>{t("anprScreen.machineNotice")}</DialogDescription>
          </DialogHeader>
          <label className="text-xs font-medium text-foreground-muted" htmlFor="anpr-switch-note">
            {t("anprScreen.service.switchNote")}
          </label>
          <textarea id="anpr-switch-note" className={textareaClass} value={note} onChange={(e) => setNote(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("anprScreen.common.cancel")}
            </Button>
            <Button onClick={save} disabled={note.trim().length < 10 || setSwitch.isPending}>
              {t("anprScreen.service.switchSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
