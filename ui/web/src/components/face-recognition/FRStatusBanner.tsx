"use client";

import * as React from "react";
import { FlaskConical, PlugZap, ScanFace, ShieldAlert, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusPill } from "@/components/platform/primitives";
import { useI18n } from "@/lib/i18n";
import type { FRAuthorisation, FRStatus } from "@/lib/api/face-recognition";

/** The "Demo — synthetic faces" marker shown on everything produced under DEMO. */
export function DemoTag() {
  const { t } = useI18n();
  return (
    <StatusPill tone="ai" className="gap-1">
      <FlaskConical className="h-3 w-3" />
      {t("faceRecognitionScreen.demoLabel")}
    </StatusPill>
  );
}

export function AuthorisationSummary({ a }: { a: FRAuthorisation }) {
  const { t } = useI18n();
  if (a.kind === "DEMO") {
    return (
      <p className="text-sm text-foreground-muted">
        {t("faceRecognitionScreen.authorisation.demoKind")} · {t("faceRecognitionScreen.authorisation.validUntil")} {a.validUntil} ·{" "}
        {t("faceRecognitionScreen.authorisation.recordedBy")} {a.recordedByName}
      </p>
    );
  }
  return (
    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2" data-testid="fr-order-summary">
      <div>
        <dt className="text-xs text-foreground-subtle">{t("faceRecognitionScreen.authorisation.reference")}</dt>
        <dd className="font-mono text-foreground">{a.orderReference}</dd>
      </div>
      <div>
        <dt className="text-xs text-foreground-subtle">{t("faceRecognitionScreen.authorisation.authority")}</dt>
        <dd className="text-foreground">{a.issuingAuthority}</dd>
      </div>
      <div>
        <dt className="text-xs text-foreground-subtle">{t("faceRecognitionScreen.authorisation.date")}</dt>
        <dd className="text-foreground">{a.orderDate}</dd>
      </div>
      <div>
        <dt className="text-xs text-foreground-subtle">{t("faceRecognitionScreen.authorisation.scope")}</dt>
        <dd className="text-foreground">
          {a.scope.join(", ")} · {t("faceRecognitionScreen.authorisation.validUntil")} {a.validUntil}
        </dd>
      </div>
    </dl>
  );
}

/**
 * Service connection, mode and the authorisation in force. When the service is
 * not connected this is the whole story: nothing else about face matching can run.
 */
export function FRStatusBanner({ status }: { status: FRStatus }) {
  const { t } = useI18n();
  const svc = status.service;
  if (!svc.configured || !svc.reachable) {
    return (
      <Alert variant="warning" data-testid="fr-service-not-connected">
        <PlugZap />
        <div>
          <AlertTitle>
            {svc.configured ? t("faceRecognitionScreen.service.unreachable") : t("faceRecognitionScreen.service.notConnected")}
          </AlertTitle>
          <AlertDescription>{svc.configured ? svc.message : t("faceRecognitionScreen.service.notConnectedBody")}</AlertDescription>
        </div>
      </Alert>
    );
  }
  const auth = status.mode === "LIVE" ? status.activeOrder : status.mode === "DEMO" ? status.activeDemo : status.activeOrder ?? status.activeDemo;
  return (
    <div className="flex flex-col gap-2">
      <Alert variant={status.mode === "LIVE" ? "info" : status.mode === "DEMO" ? "ai" : "default"} data-testid={`fr-mode-${status.mode}`}>
        {status.mode === "OFF" ? <ShieldAlert /> : status.mode === "DEMO" ? <FlaskConical /> : <ShieldCheck />}
        <div className="flex w-full flex-col gap-2">
          <AlertTitle className="flex flex-wrap items-center gap-2">
            {t(`faceRecognitionScreen.mode.${status.mode}`)}
            <span className="inline-flex items-center gap-1 text-xs font-normal text-foreground-muted">
              <ScanFace className="h-3 w-3" />
              {t("faceRecognitionScreen.service.model")} {svc.modelVersion} · {t("faceRecognitionScreen.candidate.threshold")}{" "}
              {status.config.matchThreshold.toFixed(2)}
            </span>
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            {status.mode === "OFF" && <span>{auth ? t("faceRecognitionScreen.offBody") : t("faceRecognitionScreen.authorisation.none")}</span>}
            {status.mode === "DEMO" && <span>{t("faceRecognitionScreen.demoBody")}</span>}
            {auth && <AuthorisationSummary a={auth} />}
            {status.mode === "LIVE" && status.activeDemo && (
              <span className="flex flex-wrap items-center gap-2 text-xs">
                <DemoTag />
                {t("faceRecognitionScreen.authorisation.demoKind")} · {t("faceRecognitionScreen.authorisation.validUntil")} {status.activeDemo.validUntil}
              </span>
            )}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
