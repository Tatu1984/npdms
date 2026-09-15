"use client";

import * as React from "react";
import { KeyRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  COMPLAINT_CATEGORIES,
  OFFICER_CHANNELS,
  needsSourceReference,
  type ComplaintCategory,
  type ComplaintChannel,
} from "@/lib/api/complaints";
import { useRecordComplaint } from "@/hooks/use-complaints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/stores/toastStore";

export const selectClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const blank = {
  channel: "COUNTER" as ComplaintChannel,
  sourceReference: "",
  category: "OTHER" as ComplaintCategory,
  isAnonymous: false,
  name: "",
  phone: "",
  email: "",
  address: "",
  subject: "",
  description: "",
  location: "",
};

export function IntakeDialog({
  open,
  onOpenChange,
  onRecorded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded: (complaintId: string) => void;
}) {
  const { t } = useI18n();
  const record = useRecordComplaint();
  const [form, setForm] = React.useState(blank);
  const [error, setError] = React.useState<string | null>(null);
  const [issued, setIssued] = React.useState<{ number: string; code: string; id: string } | null>(null);

  const set = <K extends keyof typeof blank>(key: K, value: (typeof blank)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const close = () => {
    setForm(blank);
    setError(null);
    setIssued(null);
    onOpenChange(false);
  };

  const submit = async () => {
    setError(null);
    try {
      const res = await record.mutateAsync({
        channel: form.channel,
        sourceReference: needsSourceReference(form.channel) ? form.sourceReference : null,
        category: form.category,
        isAnonymous: form.isAnonymous,
        complainantName: form.isAnonymous ? null : form.name,
        complainantPhone: form.isAnonymous ? null : form.phone,
        complainantEmail: form.isAnonymous ? null : form.email || null,
        complainantAddress: form.isAnonymous ? null : form.address || null,
        subject: form.subject,
        description: form.description,
        incidentLocation: form.location || null,
      });
      toast.success(t("grievanceScreen.intake.recorded", { number: res.complaint.trackingNumber }));
      if (res.accessCode) {
        setIssued({ number: res.complaint.trackingNumber, code: res.accessCode, id: res.complaint.id });
        return;
      }
      onRecorded(res.complaint.id);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {issued ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("grievanceScreen.intake.accessCodeTitle")}</DialogTitle>
              <DialogDescription>{t("grievanceScreen.intake.accessCodeBody")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 rounded-md border border-border bg-surface-sunken p-4 text-center">
              <p className="font-mono text-sm text-foreground-muted">{issued.number}</p>
              <p className="flex items-center justify-center gap-2 font-mono text-2xl tracking-widest text-foreground" data-testid="access-code">
                <KeyRound className="h-5 w-5 text-accent" />
                {issued.code}
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  onRecorded(issued.id);
                  close();
                }}
              >
                {t("grievanceScreen.intake.done")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("grievanceScreen.intake.title")}</DialogTitle>
              <DialogDescription>{t("grievanceScreen.intake.description")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="in-channel">{t("grievanceScreen.intake.channel")}</Label>
                  <select
                    id="in-channel"
                    className={selectClass}
                    value={form.channel}
                    onChange={(e) => set("channel", e.target.value as ComplaintChannel)}
                  >
                    {OFFICER_CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {t(`grievanceScreen.channels.${c}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="in-category">{t("grievanceScreen.intake.category")}</Label>
                  <select
                    id="in-category"
                    className={selectClass}
                    value={form.category}
                    onChange={(e) => set("category", e.target.value as ComplaintCategory)}
                  >
                    {COMPLAINT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t(`grievanceScreen.categories.${c}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {needsSourceReference(form.channel) && (
                <div className="grid gap-1.5">
                  <Label htmlFor="in-source">{t("grievanceScreen.intake.sourceReference")}</Label>
                  <Input id="in-source" value={form.sourceReference} onChange={(v: string) => set("sourceReference", v)} />
                  <p className="text-xs text-foreground-subtle">{t("grievanceScreen.intake.sourceReferenceHint")}</p>
                </div>
              )}
              <label className="flex items-start gap-2 rounded-md border border-border px-3 py-2">
                <Checkbox
                  id="in-anon"
                  checked={form.isAnonymous}
                  onCheckedChange={(v) => set("isAnonymous", v === true)}
                  className="mt-0.5"
                />
                <span>
                  <span className="text-sm text-foreground">{t("grievanceScreen.intake.anonymous")}</span>
                  <span className="block text-xs text-foreground-subtle">{t("grievanceScreen.intake.anonymousHint")}</span>
                </span>
              </label>
              {!form.isAnonymous && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="in-name">{t("grievanceScreen.intake.name")}</Label>
                    <Input id="in-name" value={form.name} onChange={(v: string) => set("name", v)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="in-phone">{t("grievanceScreen.intake.phone")}</Label>
                    <Input id="in-phone" inputMode="tel" value={form.phone} onChange={(v: string) => set("phone", v)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="in-email">{t("grievanceScreen.intake.email")}</Label>
                    <Input id="in-email" type="email" value={form.email} onChange={(v: string) => set("email", v)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="in-address">{t("grievanceScreen.intake.address")}</Label>
                    <Input id="in-address" value={form.address} onChange={(v: string) => set("address", v)} />
                  </div>
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="in-subject">{t("grievanceScreen.intake.subject")}</Label>
                <Input id="in-subject" value={form.subject} onChange={(v: string) => set("subject", v)} className="font-bengali" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="in-details">{t("grievanceScreen.intake.details")}</Label>
                <Textarea
                  id="in-details"
                  rows={4}
                  value={form.description}
                  onChange={(v: string) => set("description", v)}
                  className="font-bengali"
                />
                <p className="text-xs text-foreground-subtle">{t("grievanceScreen.intake.detailsHint")}</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="in-location">{t("grievanceScreen.intake.location")}</Label>
                <Input id="in-location" value={form.location} onChange={(v: string) => set("location", v)} />
              </div>
              {error && (
                <Alert variant="danger">
                  <AlertTitle>{t("common.error")}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close}>
                {t("common.cancel")}
              </Button>
              <Button onClick={submit} disabled={record.isPending}>
                {t("grievanceScreen.intake.submit")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
