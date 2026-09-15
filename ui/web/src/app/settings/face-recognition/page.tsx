"use client";

import * as React from "react";
import { FlaskConical, Power, ScanFace, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Panel, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AuthorisationSummary, DemoTag, FRStatusBanner } from "@/components/face-recognition/FRStatusBanner";
import {
  useFRAuthorisations,
  useFRStatus,
  useRecordAuthorisation,
  useRevokeAuthorisation,
  useUpdateFRSettings,
} from "@/hooks/use-face-recognition";
import { useI18n } from "@/lib/i18n";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import type { Role } from "@/types";

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export default function FaceRecognitionSettingsPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? "CONSTABLE") as Role;
  const canSP = Boolean(user && hasMinimumRole(role, "SP"));
  const isAdmin = role === "DGP";
  const status = useFRStatus();
  const auths = useFRAuthorisations();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("faceRecognitionScreen.settings.title")}
          description={t("faceRecognitionScreen.settings.description")}
          icon={ScanFace}
          breadcrumb={[{ label: "Settings", href: "/settings" }, { label: t("faceRecognitionScreen.settings.cardTitle") }]}
        />
        {status.isLoading && <Skeleton className="h-24 w-full" />}
        {status.isError && <p className="text-sm text-danger">{message(status.error)}</p>}
        {status.data && <FRStatusBanner status={status.data} />}

        <div className="grid gap-5 lg:grid-cols-2">
          {status.data && canSP && <SwitchPanel />}
          {status.data && <ServicePanel />}
          {canSP && <OrderForm />}
          {isAdmin && <DemoForm />}
        </div>

        <Panel title={t("faceRecognitionScreen.settings.list")}>
          {auths.isError && <p className="text-sm text-danger">{message(auths.error)}</p>}
          <div className="flex flex-col gap-3">
            {(auths.data?.data ?? []).map((a) => (
              <AuthorisationRow key={a.id} id={a.id} canRevoke={a.active && (canSP || isAdmin)}>
                <div className="flex flex-wrap items-center gap-2">
                  {a.kind === "DEMO" ? <DemoTag /> : <StatusPill tone="info">{t("faceRecognitionScreen.authorisation.order")}</StatusPill>}
                  <StatusPill tone={a.active ? "success" : "neutral"}>
                    {a.revokedAt
                      ? t("faceRecognitionScreen.authorisation.revoked")
                      : a.active
                        ? t("faceRecognitionScreen.authorisation.active")
                        : t("faceRecognitionScreen.authorisation.expired")}
                  </StatusPill>
                  <span className="text-xs text-foreground-muted">
                    {t("faceRecognitionScreen.authorisation.recordedBy")} {a.recordedByName} · {new Date(a.recordedAt).toLocaleString("en-IN")}
                  </span>
                </div>
                <AuthorisationSummary a={a} />
                {a.scopeNote && <p className="text-xs text-foreground-muted">{a.scopeNote}</p>}
                {a.revocationReason && (
                  <p className="text-xs text-foreground-muted">
                    {t("faceRecognitionScreen.authorisation.revoked")}: {a.revocationReason} ({a.revokedByName})
                  </p>
                )}
              </AuthorisationRow>
            ))}
          </div>
        </Panel>
      </div>
    </DashboardLayout>
  );
}

function AuthorisationRow({ id, canRevoke, children }: { id: string; canRevoke: boolean; children: React.ReactNode }) {
  const { t } = useI18n();
  const revoke = useRevokeAuthorisation();
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border p-3" data-testid="fr-authorisation">
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
      {canRevoke && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const reason = window.prompt(t("faceRecognitionScreen.settings.revokeReason"));
            if (reason) revoke.mutate({ id, reason });
          }}
        >
          {t("faceRecognitionScreen.settings.revoke")}
        </Button>
      )}
      {revoke.isError && <p className="w-full text-xs text-danger">{message(revoke.error)}</p>}
    </div>
  );
}

function SwitchPanel() {
  const { t } = useI18n();
  const status = useFRStatus();
  const update = useUpdateFRSettings();
  const st = status.data!;
  const [threshold, setThreshold] = React.useState(String(st.config.matchThreshold));
  const [fps, setFps] = React.useState(String(st.config.sampleFps));
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  const save = async (enabled?: boolean) => {
    setErr(null);
    try {
      await update.mutateAsync({ enabled, matchThreshold: Number(threshold), sampleFps: Number(fps), reason });
      setReason("");
    } catch (e) {
      setErr(message(e));
    }
  };

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Power className="h-4 w-4" />
          {t("faceRecognitionScreen.settings.switchTitle")}
        </span>
      }
    >
      <div className="grid gap-3">
        <div className="flex items-center gap-2">
          <StatusPill tone={st.switchOn ? "success" : "neutral"}>{t(`faceRecognitionScreen.mode.${st.mode}`)}</StatusPill>
          {st.switchReason && <span className="text-xs text-foreground-muted">{st.switchReason}</span>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="fr-threshold">{t("faceRecognitionScreen.settings.threshold")}</Label>
            <Input id="fr-threshold" type="number" step="0.01" min="0.30" max="0.95" value={threshold} onChange={setThreshold} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fr-fps">{t("faceRecognitionScreen.settings.sampleFps")}</Label>
            <Input id="fr-fps" type="number" step="0.1" min="0.2" max="2" value={fps} onChange={setFps} />
          </div>
        </div>
        <p className="text-xs text-foreground-subtle">{t("faceRecognitionScreen.settings.thresholdHint")}</p>
        <div className="grid gap-1.5">
          <Label htmlFor="fr-switch-reason">{t("faceRecognitionScreen.settings.reason")}</Label>
          <Input id="fr-switch-reason" value={reason} onChange={setReason} />
        </div>
        {err && <p className="text-sm text-danger" role="alert" data-testid="fr-settings-error">{err}</p>}
        <div className="flex flex-wrap gap-2">
          {st.switchOn ? (
            <Button variant="outline" disabled={!reason.trim() || update.isPending} onClick={() => save(false)}>
              {t("faceRecognitionScreen.settings.switchOff")}
            </Button>
          ) : (
            <Button disabled={!reason.trim() || update.isPending} onClick={() => save(true)} data-testid="fr-switch-on">
              {t("faceRecognitionScreen.settings.switchOn")}
            </Button>
          )}
          <Button variant="secondary" disabled={!reason.trim() || update.isPending} onClick={() => save(undefined)}>
            {t("faceRecognitionScreen.settings.save")}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function ServicePanel() {
  const { t } = useI18n();
  const svc = useFRStatus().data!.service;
  const models = svc.models;
  return (
    <Panel title={t("faceRecognitionScreen.settings.serviceTitle")}>
      <div className="space-y-2 text-sm">
        <p>
          <StatusPill tone={svc.reachable ? "success" : "warning"}>
            {svc.reachable ? t("faceRecognitionScreen.service.connected") : svc.configured ? t("faceRecognitionScreen.service.unreachable") : t("faceRecognitionScreen.service.notConnected")}
          </StatusPill>
        </p>
        {!svc.reachable && <p className="text-foreground-muted">{svc.message}</p>}
        {models &&
          [models.detector, models.recognizer].map(
            (m) =>
              m && (
                <div key={m.name} className="rounded border border-border p-2">
                  <p className="font-medium">
                    {m.name} <span className="font-mono text-xs">{m.version}</span>
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {t("faceRecognitionScreen.settings.licence")}: {m.licence} ·{" "}
                    <a className="text-accent hover:underline" href={m.source} target="_blank" rel="noreferrer">
                      OpenCV Zoo
                    </a>
                  </p>
                  <p className="break-all font-mono text-[11px] text-foreground-subtle">SHA-256 {m.sha256}</p>
                </div>
              ),
          )}
      </div>
    </Panel>
  );
}

function OrderForm() {
  const { t } = useI18n();
  const record = useRecordAuthorisation();
  const [reference, setReference] = React.useState("");
  const [authority, setAuthority] = React.useState("");
  const [date, setDate] = React.useState("");
  const [until, setUntil] = React.useState(inDays(180));
  const [note, setNote] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const submit = async () => {
    setErr(null);
    try {
      await record.mutateAsync({
        kind: "ORDER",
        orderReference: reference,
        issuingAuthority: authority,
        orderDate: date,
        validUntil: until,
        scope: ["MISSING_PERSONS"],
        scopeNote: note,
      });
      setReference("");
      setAuthority("");
      setNote("");
    } catch (e) {
      setErr(message(e));
    }
  };
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          {t("faceRecognitionScreen.settings.recordOrder")}
        </span>
      }
      description={t("faceRecognitionScreen.settings.recordOrderBody")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="fr-ref">{t("faceRecognitionScreen.authorisation.reference")}</Label>
          <Input id="fr-ref" value={reference} onChange={setReference} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fr-authority">{t("faceRecognitionScreen.authorisation.authority")}</Label>
          <Input id="fr-authority" value={authority} onChange={setAuthority} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fr-date">{t("faceRecognitionScreen.authorisation.date")}</Label>
          <Input id="fr-date" type="date" value={date} onChange={setDate} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fr-until">{t("faceRecognitionScreen.authorisation.validUntil")}</Label>
          <Input id="fr-until" type="date" value={until} onChange={setUntil} />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="fr-scope-note">
            {t("faceRecognitionScreen.authorisation.scope")}: MISSING_PERSONS · {t("faceRecognitionScreen.settings.scopeNote")}
          </Label>
          <Textarea id="fr-scope-note" rows={2} value={note} onChange={setNote} />
        </div>
      </div>
      {err && <p className="mt-2 text-sm text-danger" role="alert">{err}</p>}
      <Button className="mt-3" onClick={submit} disabled={!reference.trim() || !authority.trim() || !date || !until || record.isPending} data-testid="fr-record-order">
        {t("faceRecognitionScreen.settings.record")}
      </Button>
    </Panel>
  );
}

function DemoForm() {
  const { t } = useI18n();
  const record = useRecordAuthorisation();
  const [until, setUntil] = React.useState(inDays(30));
  const [err, setErr] = React.useState<string | null>(null);
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          {t("faceRecognitionScreen.settings.recordDemo")}
        </span>
      }
      description={t("faceRecognitionScreen.settings.recordDemoBody")}
    >
      <div className="grid gap-1.5 sm:max-w-xs">
        <Label htmlFor="fr-demo-until">{t("faceRecognitionScreen.authorisation.validUntil")}</Label>
        <Input id="fr-demo-until" type="date" value={until} onChange={setUntil} />
      </div>
      {err && <p className="mt-2 text-sm text-danger" role="alert">{err}</p>}
      <Button
        className="mt-3"
        variant="secondary"
        disabled={record.isPending}
        onClick={() => record.mutateAsync({ kind: "DEMO", validUntil: until, scope: ["MISSING_PERSONS"] }).catch((e) => setErr(message(e)))}
        data-testid="fr-record-demo"
      >
        {t("faceRecognitionScreen.settings.record")}
      </Button>
    </Panel>
  );
}
