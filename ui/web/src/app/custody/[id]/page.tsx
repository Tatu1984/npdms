"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  ClipboardList,
  Download,
  Eye,
  FileCheck2,
  FileUp,
  Fingerprint,
  FlaskConical,
  Lock,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Upload,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import custodyApi, { type SignatureStatus, type VerificationResult } from "@/lib/api/custody";
import {
  useAccessLog,
  useAttachEvidenceFile,
  useCourtVerification,
  useCustodyChain,
  useEvidenceItem,
  useTransferCustody,
  useVerificationHistory,
  useVerifyEvidence,
} from "@/hooks/use-custody";
import {
  Field,
  PageHeader,
  Panel,
  PhaseBadge,
  StatusPill,
} from "@/components/platform/primitives";
import { act, type Action } from "@/components/platform/actions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IntegrityBadge } from "../integrity-badge";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { OfficerPicker } from "@/components/platform/pickers";
import { ForensicRequestDialog } from "@/components/ui/ForensicRequestDialog";
import { casesApi } from "@/lib/api/cases";
import { firsApi } from "@/lib/api/firs";
import { toast } from "@/stores/toastStore";
import { custodyKeys } from "@/hooks/use-custody";

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const signatureTone: Record<SignatureStatus, "success" | "danger" | "warning"> = {
  valid: "success",
  invalid: "danger",
  legacy: "warning",
  unsigned: "warning",
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function EvidenceDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();

  const id = params.id;
  const [tab, setTab] = React.useState(search.get("tab") ?? "details");

  const item = useEvidenceItem(id);
  const chain = useCustodyChain(id, tab === "custody" || tab === "details");
  const accessLog = useAccessLog(id, tab === "access");
  const history = useVerificationHistory(id, tab === "details");
  const court = useCourtVerification(id, tab === "court");

  const verify = useVerifyEvidence(id);
  const transfer = useTransferCustody(id);
  const attach = useAttachEvidenceFile(id);

  const [verifyOpen, setVerifyOpen] = React.useState(search.get("verify") === "1");
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [downloadOpen, setDownloadOpen] = React.useState(false);
  const [forensicOpen, setForensicOpen] = React.useState(false);

  const caseId = item.data?.caseId;
  const firId = item.data?.firId;
  const linkedCase = useQuery({
    queryKey: ["cases", "detail", caseId],
    queryFn: () => casesApi.get(caseId!),
    enabled: Boolean(caseId),
  });
  const linkedFir = useQuery({
    queryKey: ["firs", "detail", firId],
    queryFn: () => firsApi.get(firId!),
    enabled: Boolean(firId),
  });
  const [result, setResult] = React.useState<VerificationResult | null>(null);

  if (item.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (item.isError || !item.data) {
    return (
      <DashboardLayout>
        <Alert variant="danger">
          <ShieldAlert />
          <div>
            <AlertTitle>{t("custodyScreen.detail.notAvailable")}</AlertTitle>
            <AlertDescription>
              {errorMessage(item.error, t("custodyScreen.detail.notLoaded"))}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push("/custody")}>
                {t("custodyScreen.detail.back")}
              </Button>
            </AlertDescription>
          </div>
        </Alert>
      </DashboardLayout>
    );
  }

  const e = item.data;
  const hasFile = Boolean(e.file.objectKey);
  const legs = chain.data ?? [];
  const invalidLegs = legs.filter((leg) => leg.signatureStatus === "invalid").length;
  const unverifiableLegs = legs.filter(
    (leg) => leg.signatureStatus === "legacy" || leg.signatureStatus === "unsigned",
  ).length;

  const screenMenu: Action[] = [
    act.link("investigation", t("custodyScreen.list.workspaces"), "/investigation", { icon: ClipboardList }),
    act.link("malkhana", t("custodyScreen.list.seizedProperty"), "/malkhana", { icon: ClipboardList }),
    act.link("audit", t("custodyScreen.list.auditTrail"), "/audit", { icon: Fingerprint }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={e.description}
          description={`${e.evidenceNumber} · ${t(`custodyScreen.types.${e.evidenceType}`)}`}
          icon={ShieldCheck}
          badge={<PhaseBadge phase={2} />}
          breadcrumb={[{ label: t("modules.custody"), href: "/custody" }, { label: e.evidenceNumber }]}
          actions={
            <>
              {hasFile ? (
                <Button variant="outline" onClick={() => setVerifyOpen(true)}>
                  <ScanLine className="h-4 w-4" />
                  {t("custodyScreen.verify.title")}
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4" />
                  {t("custodyScreen.detail.attachFile")}
                </Button>
              )}
              <Button variant="outline" onClick={() => setForensicOpen(true)}>
                <FlaskConical className="h-4 w-4" />
                {t("custodyScreen.detail.requestForensic")}
              </Button>
              <Button
                onClick={() => {
                  transfer.reset();
                  setTransferOpen(true);
                }}
              >
                <ArrowLeftRight className="h-4 w-4" />
                {t("custodyScreen.detail.recordTransfer")}
              </Button>
            </>
          }
          menu={screenMenu}
        />

        {e.integrityState === "broken" && (
          <Alert variant="danger">
            <ShieldAlert />
            <div>
              <AlertTitle>{t("custodyScreen.detail.brokenTitle")}</AlertTitle>
              <AlertDescription>{t("custodyScreen.detail.brokenBody")}</AlertDescription>
            </div>
          </Alert>
        )}

        {invalidLegs > 0 && (
          <Alert variant="danger">
            <ShieldAlert />
            <div>
              <AlertTitle>{t("custodyScreen.chain.brokenTitle", { n: invalidLegs })}</AlertTitle>
              <AlertDescription>{t("custodyScreen.signature.explainInvalid")}</AlertDescription>
            </div>
          </Alert>
        )}

        {!hasFile && (
          <Alert variant="warning">
            <ShieldQuestion />
            <div>
              <AlertTitle>{t("custodyScreen.detail.noFileTitle")}</AlertTitle>
              <AlertDescription>{t("custodyScreen.detail.noFileBody")}</AlertDescription>
            </div>
          </Alert>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="details">{t("custodyScreen.detail.tabDetails")}</TabsTrigger>
            <TabsTrigger value="custody">{t("custodyScreen.detail.tabCustody", { n: legs.length })}</TabsTrigger>
            <TabsTrigger value="access">{t("custodyScreen.detail.tabAccess")}</TabsTrigger>
            <TabsTrigger value="court">{t("custodyScreen.detail.tabCourt")}</TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------------ details */}
          <TabsContent value="details">
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title={t("custodyScreen.detail.record")} className="lg:col-span-2">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("custodyScreen.detail.number")} value={e.evidenceNumber} mono />
                  <Field label={t("custodyScreen.register.type")} value={t(`custodyScreen.types.${e.evidenceType}`)} />
                  <Field label={t("custodyScreen.detail.collectedBy")} value={e.collectedByName || "—"} />
                  <Field label={t("custodyScreen.register.collectedAt")} value={e.collectionLocation || "—"} />
                  <Field label={t("custodyScreen.register.storage")} value={e.storageLocation || "—"} />
                  <Field label={t("custodyScreen.register.seal")} value={e.sealNumber || "—"} mono />
                  <Field label={t("custodyScreen.detail.condition")} value={e.condition || "—"} />
                  <Field label={t("custodyScreen.detail.heldBy")} value={e.currentHolder || "—"} />
                  <Field
                    label={t("custodyScreen.detail.case")}
                    value={
                      caseId ? (
                        <Link href={`/cases/${caseId}`} className="font-mono text-accent hover:underline">
                          {linkedCase.data?.caseNumber ?? t("custodyScreen.detail.viewCase")}
                        </Link>
                      ) : (
                        t("custodyScreen.detail.notLinked")
                      )
                    }
                  />
                  <Field
                    label={t("custodyScreen.detail.fir")}
                    value={
                      firId ? (
                        <Link href={`/fir/${firId}`} className="font-mono text-accent hover:underline">
                          {linkedFir.data?.firNumber ?? t("custodyScreen.detail.viewFir")}
                        </Link>
                      ) : (
                        t("custodyScreen.detail.notLinked")
                      )
                    }
                  />
                  <Field
                    label={t("custodyScreen.detail.registered")}
                    value={new Date(e.createdAt).toLocaleString("en-IN")}
                    className="sm:col-span-2"
                  />
                </dl>
              </Panel>

              <div className="flex flex-col gap-4">
                <Panel title={t("custodyScreen.detail.integrity")}>
                  <div className="flex flex-col gap-3">
                    <IntegrityBadge state={e.integrityState} />

                    {hasFile ? (
                      <>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                            {e.file.hashAlgorithm ?? "SHA-256"}
                          </p>
                          <p data-testid="recorded-sha256" className="mt-1 break-all font-mono text-xs text-foreground">
                            {e.file.sha256}
                          </p>
                        </div>
                        <dl className="grid grid-cols-2 gap-3">
                          <Field label={t("custodyScreen.detail.fileName")} value={e.file.originalFilename || "—"} />
                          <Field label={t("custodyScreen.detail.size")} value={formatBytes(e.file.fileSize)} />
                          <Field label={t("custodyScreen.detail.storedIn")} value={e.file.storageBackend || "—"} />
                          <Field
                            label={t("custodyScreen.detail.uploaded")}
                            value={e.file.uploadedAt ? new Date(e.file.uploadedAt).toLocaleString("en-IN") : "—"}
                          />
                        </dl>

                        <Button variant="outline" size="sm" onClick={() => setVerifyOpen(true)}>
                          <ScanLine className="h-3.5 w-3.5" />
                          {t("custodyScreen.verify.title")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDownloadOpen(true)}>
                          <Download className="h-3.5 w-3.5" />
                          {t("custodyScreen.detail.download")}
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => setUploadOpen(true)}>
                        <Upload className="h-3.5 w-3.5" />
                        {t("custodyScreen.upload.title")}
                      </Button>
                    )}

                    <p className="rounded-md border border-border bg-surface-sunken px-2.5 py-2 text-xs text-foreground-muted">
                      {t("custodyScreen.detail.digestNote")}
                    </p>

                    {e.blockchainAnchorTx ? (
                      <Field label={t("custodyScreen.detail.anchored")} value={e.blockchainAnchorTx} mono />
                    ) : (
                      <p className="text-xs text-foreground-subtle">{t("custodyScreen.detail.anchoringLater")}</p>
                    )}
                  </div>
                </Panel>

                {(history.data ?? []).length > 0 && (
                  <Panel title={t("custodyScreen.detail.history")} bodyClassName="flex flex-col gap-2">
                    {(history.data ?? []).slice(0, 6).map((check) => (
                      <div key={check.id} data-testid="verification-check" className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <StatusPill tone={check.matched ? "success" : "danger"}>
                            {check.matched ? t("custodyScreen.detail.match") : t("custodyScreen.detail.mismatch")}
                          </StatusPill>
                          {!check.matched && check.computedHash && (
                            <p className="mt-1 break-all font-mono text-[0.65rem] text-danger">
                              {check.computedHash.slice(0, 24)}…
                            </p>
                          )}
                          {check.note && <p className="mt-1 truncate text-xs text-foreground-muted">{check.note}</p>}
                        </div>
                        <span className="shrink-0 text-xs text-foreground-subtle">
                          {new Date(check.createdAt).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </Panel>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ------------------------------------------------------ custody */}
          <TabsContent value="custody">
            <Panel
              title={t("custodyScreen.chain.title")}
              description={t("custodyScreen.chain.description")}
              actions={
                <Button size="sm" onClick={() => setTransferOpen(true)}>
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  {t("custodyScreen.detail.recordTransfer")}
                </Button>
              }
              bodyClassName="p-0"
            >
              {chain.isLoading ? (
                <div className="p-4">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : chain.isError ? (
                <p className="p-6 text-sm text-danger">{errorMessage(chain.error, t("custodyScreen.detail.notLoaded"))}</p>
              ) : (
                <>
                  {unverifiableLegs > 0 && (
                    <p className="border-b border-border px-4 py-2 text-xs text-warning">
                      {t("custodyScreen.chain.unverifiedNote", { n: unverifiableLegs })}
                    </p>
                  )}
                  <ol className="divide-y divide-border">
                    {legs.map((event, i) => (
                      <li key={event.id} data-testid="custody-leg" className="flex gap-4 p-4">
                        <div className="flex flex-col items-center">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent">
                            {event.sequenceNumber}
                          </span>
                          {i < legs.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {event.fromName || event.fromLocation || t("custodyScreen.chain.origin")} →{" "}
                              {event.toName || event.toLocation}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              <StatusPill tone={signatureTone[event.signatureStatus]}>
                                {t(`custodyScreen.signature.${event.signatureStatus}`)}
                              </StatusPill>
                              <StatusPill tone={event.sealIntact ? "success" : "danger"}>
                                {event.sealIntact ? t("custodyScreen.chain.sealIntact") : t("custodyScreen.chain.sealBroken")}
                              </StatusPill>
                            </div>
                          </div>
                          {event.purpose && <p className="mt-1 text-sm text-foreground-muted">{event.purpose}</p>}
                          {event.conditionNote && (
                            <p className="mt-1 text-xs text-foreground-muted">{event.conditionNote}</p>
                          )}
                          <p className="mt-1 text-xs text-foreground-subtle">
                            {event.signedByName ? `${t("custodyScreen.chain.signedBy", { name: event.signedByName })} · ` : ""}
                            {new Date(event.transferDate).toLocaleString("en-IN")}
                            {event.sealNumber ? ` · ${t("custodyScreen.chain.seal", { seal: event.sealNumber })}` : ""}
                          </p>
                          {event.signature && (
                            <p className="mt-1 break-all font-mono text-[0.65rem] text-foreground-subtle">
                              {t("custodyScreen.chain.signature")} {event.signature.slice(0, 32)}…
                              {event.hashAtTransfer
                                ? ` · ${t("custodyScreen.chain.file")} ${event.hashAtTransfer.slice(0, 16)}…`
                                : ""}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </Panel>
          </TabsContent>

          {/* ------------------------------------------------------- access */}
          <TabsContent value="access">
            <Panel
              title={t("custodyScreen.access.title")}
              description={t("custodyScreen.access.description")}
              bodyClassName="p-0"
            >
              {accessLog.isLoading ? (
                <div className="p-4">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : accessLog.isError ? (
                <p className="p-6 text-sm text-danger">
                  {errorMessage(accessLog.error, t("custodyScreen.detail.notLoaded"))}
                </p>
              ) : (accessLog.data ?? []).length === 0 ? (
                <p className="p-6 text-center text-sm text-foreground-muted">{t("custodyScreen.access.empty")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[38rem] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-sunken">
                        {(["when", "who", "action", "purpose", "outcome"] as const).map((h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-foreground-subtle"
                          >
                            {t(`custodyScreen.access.${h}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(accessLog.data ?? []).map((entry) => (
                        <tr key={entry.id} data-testid="access-entry" className="border-b border-border last:border-0">
                          <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">
                            {new Date(entry.createdAt).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-2.5">{entry.actorName || "—"}</td>
                          <td className="px-4 py-2.5">
                            <StatusPill
                              tone={
                                entry.action === "downloaded"
                                  ? "warning"
                                  : entry.action === "transferred"
                                    ? "info"
                                    : "neutral"
                              }
                            >
                              {entry.action === "viewed" && <Eye className="h-3 w-3" />}
                              {entry.action === "downloaded" && <Download className="h-3 w-3" />}
                              {entry.action === "transferred" && <ArrowLeftRight className="h-3 w-3" />}
                              {entry.action === "verified" && <ScanLine className="h-3 w-3" />}
                              {entry.action === "uploaded" && <Upload className="h-3 w-3" />}
                              {entry.action === "court_verified" && <FileCheck2 className="h-3 w-3" />}
                              {entry.action}
                            </StatusPill>
                          </td>
                          <td className="px-4 py-2.5 text-foreground-muted">{entry.purpose || "—"}</td>
                          <td className="px-4 py-2.5">
                            <StatusPill tone={entry.outcome === "success" ? "success" : "danger"}>
                              {entry.outcome}
                            </StatusPill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </TabsContent>

          {/* -------------------------------------------------------- court */}
          <TabsContent value="court">
            <Panel title={t("custodyScreen.court.title")} description={t("custodyScreen.court.description")}>
              {court.isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : court.isError ? (
                <p className="text-sm text-danger">{errorMessage(court.error, t("custodyScreen.detail.notLoaded"))}</p>
              ) : court.data ? (
                <div className="flex flex-col gap-4">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("custodyScreen.detail.number")} value={court.data.evidenceNumber} mono />
                    <Field label={t("custodyScreen.register.type")} value={court.data.evidenceType} />
                    <Field
                      label={t("custodyScreen.court.captured")}
                      value={court.data.capturedAt ? new Date(court.data.capturedAt).toLocaleString("en-IN") : "—"}
                    />
                    <Field label={t("custodyScreen.court.capturedBy")} value={court.data.capturedBy || "—"} />
                    <Field label={t("custodyScreen.court.movements")} value={court.data.custodyEvents} />
                    <Field
                      label={t("custodyScreen.court.sealThroughout")}
                      value={
                        <StatusPill tone={court.data.sealIntact ? "success" : "danger"}>
                          {court.data.sealIntact ? t("custodyScreen.court.yes") : t("custodyScreen.court.no")}
                        </StatusPill>
                      }
                    />
                    <Field
                      label={t("custodyScreen.court.signaturesIntact")}
                      value={
                        <span data-testid="court-signatures" className="flex flex-wrap gap-1.5">
                          {court.data.chainIntact ? (
                            <StatusPill tone="success">{t("custodyScreen.court.allValid")}</StatusPill>
                          ) : (
                            <>
                              {court.data.invalidLegs > 0 && (
                                <StatusPill tone="danger">
                                  {t("custodyScreen.court.invalidLegs", { n: court.data.invalidLegs })}
                                </StatusPill>
                              )}
                              {court.data.unverifiedLegs > 0 && (
                                <StatusPill tone="warning">
                                  {t("custodyScreen.court.unverifiedLegs", { n: court.data.unverifiedLegs })}
                                </StatusPill>
                              )}
                            </>
                          )}
                        </span>
                      }
                    />
                    <Field
                      label={t("custodyScreen.detail.integrity")}
                      value={<IntegrityBadge state={court.data.integrityState} />}
                    />
                  </dl>

                  {court.data.sha256 && (
                    <div className="rounded-md border border-border bg-surface-sunken p-3">
                      <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                        {t("custodyScreen.court.compare", { algorithm: court.data.hashAlgorithm || "SHA-256" })}
                      </p>
                      <p className="mt-1 break-all font-mono text-xs">{court.data.sha256}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setVerifyOpen(true)} disabled={!hasFile}>
                      <ScanLine className="h-4 w-4" />
                      {t("custodyScreen.court.verifyNow")}
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/court")}>
                      <FileCheck2 className="h-4 w-4" />
                      {t("custodyScreen.court.courtDiary")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      {/* ------------------------------------------------------ verify ---- */}
      <Dialog
        open={verifyOpen}
        onOpenChange={(open) => {
          setVerifyOpen(open);
          if (!open) {
            setResult(null);
            verify.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("custodyScreen.verify.title")}</DialogTitle>
            <DialogDescription>{t("custodyScreen.verify.description", { number: e.evidenceNumber })}</DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="flex flex-col gap-3" data-testid="verify-result">
              <Alert variant={result.matched ? "success" : "danger"}>
                {result.matched ? <ShieldCheck /> : <ShieldAlert />}
                <div>
                  <AlertTitle>{result.matched ? t("custodyScreen.detail.match") : t("custodyScreen.detail.mismatch")}</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </div>
              </Alert>
              <div className="rounded-md border border-border bg-surface-sunken p-3">
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">{t("custodyScreen.verify.recorded")}</p>
                <p data-testid="expected-hash" className="mt-1 break-all font-mono text-xs">{result.expectedHash || "—"}</p>
              </div>
              <div className="rounded-md border border-border bg-surface-sunken p-3">
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">{t("custodyScreen.verify.computed")}</p>
                <p data-testid="computed-hash" className="mt-1 break-all font-mono text-xs">{result.computedHash || "—"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground-muted">{t("custodyScreen.verify.intro")}</p>
          )}

          {verify.isError && (
            <p role="alert" className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {t("custodyScreen.verify.failed")}: {errorMessage(verify.error, "")}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVerifyOpen(false);
                setResult(null);
                verify.reset();
              }}
            >
              {t("common.close")}
            </Button>
            {!result && (
              <Button
                isLoading={verify.isPending}
                disabled={verify.isPending || !hasFile}
                onClick={async () => {
                  try {
                    setResult(await verify.mutateAsync(undefined));
                  } catch {
                    // shown in the dialog
                  }
                }}
              >
                <ScanLine className="h-4 w-4" />
                {t("custodyScreen.verify.run")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- transfer ---- */}
      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        evidenceNumber={e.evidenceNumber}
        currentHolder={e.currentHolder}
        pending={transfer.isPending}
        error={transfer.error}
        onSubmit={async (body) => {
          try {
            await transfer.mutateAsync(body);
          } catch {
            return; // shown in the dialog
          }
          setTransferOpen(false);
          setTab("custody");
        }}
      />

      <ForensicRequestDialog
        evidenceId={e.id}
        caseId={e.caseId}
        isOpen={forensicOpen}
        onClose={() => setForensicOpen(false)}
        onSuccess={() =>
          toast.success(
            t("custodyScreen.detail.forensicRecorded"),
            t("custodyScreen.detail.forensicSent", { number: e.evidenceNumber }),
          )
        }
      />

      {/* ------------------------------------------------------ upload ---- */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) attach.reset();
        }}
        evidenceNumber={e.evidenceNumber}
        pending={attach.isPending}
        error={attach.error}
        onUpload={async (file) => {
          try {
            await attach.mutateAsync(file);
          } catch {
            return; // shown in the dialog
          }
          setUploadOpen(false);
          // The digest the server just computed is on the details tab.
          setTab("details");
        }}
      />

      <DownloadDialog open={downloadOpen} onOpenChange={setDownloadOpen} evidenceId={e.id} />
    </DashboardLayout>
  );
}

function TransferDialog({
  open,
  onOpenChange,
  evidenceNumber,
  currentHolder,
  onSubmit,
  pending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidenceNumber: string;
  currentHolder?: string;
  error: unknown;
  onSubmit: (body: {
    toUserId?: string;
    toLocation: string;
    purpose: string;
    sealNumber?: string;
    sealIntact?: boolean;
    conditionNote?: string;
  }) => Promise<void>;
  pending: boolean;
}) {
  const { t } = useI18n();
  const [toLocation, setToLocation] = React.useState("");
  const [toOfficer, setToOfficer] = React.useState<{ id: string; name: string } | null>(null);
  const [purpose, setPurpose] = React.useState("");
  const [sealNumber, setSealNumber] = React.useState("");
  const [sealIntact, setSealIntact] = React.useState(true);
  const [conditionNote, setConditionNote] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setToLocation("");
      setToOfficer(null);
      setPurpose("");
      setSealNumber("");
      setSealIntact(true);
      setConditionNote("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("custodyScreen.transfer.title")}</DialogTitle>
          <DialogDescription>
            {evidenceNumber}
            {currentHolder ? ` — ${t("custodyScreen.transfer.currentlyWith", { holder: currentHolder })}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("custodyScreen.transfer.officer")}</Label>
            {toOfficer ? (
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span className="text-foreground">{toOfficer.name}</span>
                <button type="button" className="text-xs text-accent hover:underline" onClick={() => setToOfficer(null)}>
                  {t("custodyScreen.transfer.change")}
                </button>
              </div>
            ) : (
              <OfficerPicker
                onChange={(id, name) => setToOfficer({ id, name })}
                emptyLabel={t("custodyScreen.transfer.officerEmpty")}
              />
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tr-to">{t("custodyScreen.transfer.destination")}</Label>
            <Input
              id="tr-to"
              value={toLocation}
              onChange={(v: string) => setToLocation(v)}
              placeholder={
                toOfficer ? t("custodyScreen.transfer.destinationOfficer") : t("custodyScreen.transfer.destinationPlace")
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tr-purpose">{t("custodyScreen.transfer.purpose")}</Label>
            <Textarea
              id="tr-purpose"
              rows={2}
              value={purpose}
              onChange={(v: string) => setPurpose(v)}
              placeholder={t("custodyScreen.transfer.purposePlaceholder")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tr-seal">{t("custodyScreen.transfer.seal")}</Label>
            <Input id="tr-seal" value={sealNumber} onChange={(v: string) => setSealNumber(v)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground-muted">
            <input
              type="checkbox"
              checked={sealIntact}
              onChange={(event) => setSealIntact(event.target.checked)}
              className="accent-[var(--accent)]"
            />
            {t("custodyScreen.transfer.sealVerified")}
          </label>
          {!sealIntact && (
            <div className="grid gap-1.5">
              <Label htmlFor="tr-cond">{t("custodyScreen.transfer.conditionNote")}</Label>
              <Textarea
                id="tr-cond"
                rows={2}
                value={conditionNote}
                onChange={(v: string) => setConditionNote(v)}
                placeholder={t("custodyScreen.transfer.conditionPlaceholder")}
              />
            </div>
          )}
          {error instanceof Error && (
            <p role="alert" className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {error.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={(!toLocation.trim() && !toOfficer) || !purpose.trim() || pending}
            isLoading={pending}
            onClick={() =>
              onSubmit({
                toUserId: toOfficer?.id,
                toLocation: toLocation.trim() || (toOfficer ? toOfficer.name : ""),
                purpose: purpose.trim(),
                sealNumber: sealNumber.trim() || undefined,
                sealIntact,
                conditionNote: conditionNote.trim() || undefined,
              })
            }
          >
            {t("custodyScreen.transfer.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({
  open,
  onOpenChange,
  evidenceNumber,
  onUpload,
  pending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidenceNumber: string;
  onUpload: (file: File) => Promise<void>;
  pending: boolean;
  error: unknown;
}) {
  const { t } = useI18n();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (open) setFile(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("custodyScreen.upload.title")}</DialogTitle>
          <DialogDescription>{t("custodyScreen.upload.description", { number: evidenceNumber })}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-sunken px-4 py-8 text-center">
            <FileUp className="h-6 w-6 text-foreground-subtle" />
            {file ? (
              <>
                <p className="text-sm text-foreground">{file.name}</p>
                <p className="text-xs text-foreground-muted">{formatBytes(file.size)}</p>
              </>
            ) : (
              <p className="text-sm text-foreground">{t("custodyScreen.upload.noFile")}</p>
            )}
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              {t("custodyScreen.upload.browse")}
            </Button>
            <input
              ref={inputRef}
              type="file"
              hidden
              data-testid="evidence-file-input"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFile(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </div>

          {error instanceof Error && (
            <p role="alert" className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {error.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!file || pending} isLoading={pending} onClick={() => file && onUpload(file)}>
            <Lock className="h-4 w-4" />
            {t("custodyScreen.upload.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Downloads with the officer's credentials, records the purpose in the access
 * log, and recomputes the SHA-256 of the copy received so a corrupted or
 * substituted copy is caught on arrival rather than in court.
 */
function DownloadDialog({
  open,
  onOpenChange,
  evidenceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidenceId: string;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [purpose, setPurpose] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);
  const [outcome, setOutcome] = React.useState<{ recorded: string | null; received: string } | null>(null);

  React.useEffect(() => {
    if (open) {
      setPurpose("");
      setFailure(null);
      setOutcome(null);
    }
  }, [open]);

  const run = async () => {
    setPending(true);
    setFailure(null);
    try {
      const { blob, filename, recordedHash, receivedHash } = await custodyApi.download(
        evidenceId,
        purpose.trim() || undefined,
      );
      setOutcome({ recorded: recordedHash, received: receivedHash });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      qc.invalidateQueries({ queryKey: custodyKeys.accessLog(evidenceId) });
    } catch (error) {
      setFailure(errorMessage(error, t("custodyScreen.download.failed")));
    } finally {
      setPending(false);
    }
  };

  const matched = outcome !== null && outcome.recorded === outcome.received;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("custodyScreen.download.title")}</DialogTitle>
          <DialogDescription>{t("custodyScreen.download.description")}</DialogDescription>
        </DialogHeader>

        {outcome ? (
          <div className="flex flex-col gap-3" data-testid="download-result">
            <Alert variant={matched ? "success" : "danger"}>
              {matched ? <ShieldCheck /> : <ShieldAlert />}
              <div>
                <AlertTitle>{matched ? t("custodyScreen.download.matched") : t("custodyScreen.download.mismatched")}</AlertTitle>
              </div>
            </Alert>
            <div className="rounded-md border border-border bg-surface-sunken p-3">
              <p className="text-xs uppercase tracking-wide text-foreground-subtle">{t("custodyScreen.download.recorded")}</p>
              <p className="mt-1 break-all font-mono text-xs">{outcome.recorded ?? "—"}</p>
            </div>
            <div className="rounded-md border border-border bg-surface-sunken p-3">
              <p className="text-xs uppercase tracking-wide text-foreground-subtle">{t("custodyScreen.download.received")}</p>
              <p data-testid="received-hash" className="mt-1 break-all font-mono text-xs">{outcome.received}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-1.5">
            <Label htmlFor="dl-purpose">{t("custodyScreen.download.purpose")}</Label>
            <Input
              id="dl-purpose"
              value={purpose}
              onChange={(v: string) => setPurpose(v)}
              placeholder={t("custodyScreen.download.purposePlaceholder")}
            />
          </div>
        )}

        {failure && (
          <p role="alert" className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
            {failure}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
          {!outcome && (
            <Button isLoading={pending} disabled={pending} onClick={run}>
              <Download className="h-4 w-4" />
              {t("custodyScreen.download.submit")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
