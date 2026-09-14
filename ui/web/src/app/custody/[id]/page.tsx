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
  Lock,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Upload,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import custodyApi, { type VerificationResult } from "@/lib/api/custody";
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
import { IntegrityBadge } from "../page";

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
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
            <AlertTitle>Evidence not available</AlertTitle>
            <AlertDescription>
              {item.error instanceof Error ? item.error.message : "This item could not be loaded."}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => router.push("/custody")}
              >
                Back to the register
              </Button>
            </AlertDescription>
          </div>
        </Alert>
      </DashboardLayout>
    );
  }

  const e = item.data;
  const hasFile = Boolean(e.file.objectKey);

  const screenMenu: Action[] = [
    act.link("investigation", "Investigation workspaces", "/investigation", {
      icon: ClipboardList,
    }),
    act.link("malkhana", "Seized property register", "/malkhana", { icon: ClipboardList }),
    act.link("audit", "Platform audit trail", "/audit", { icon: Fingerprint }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={e.description}
          description={`${e.evidenceNumber} · ${e.evidenceType}`}
          icon={ShieldCheck}
          badge={<PhaseBadge phase={2} />}
          breadcrumb={[
            { label: t("modules.custody"), href: "/custody" },
            { label: e.evidenceNumber },
          ]}
          actions={
            <>
              {hasFile ? (
                <Button variant="outline" onClick={() => setVerifyOpen(true)}>
                  <ScanLine className="h-4 w-4" />
                  Verify integrity
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Attach file
                </Button>
              )}
              <Button onClick={() => setTransferOpen(true)}>
                <ArrowLeftRight className="h-4 w-4" />
                Record transfer
              </Button>
            </>
          }
          menu={screenMenu}
        />

        {e.integrityState === "broken" && (
          <Alert variant="danger">
            <ShieldAlert />
            <div>
              <AlertTitle>Integrity mismatch detected</AlertTitle>
              <AlertDescription>
                The stored file no longer matches the digest recorded when it was registered. Do not
                rely on this item until the discrepancy is investigated, and record what is found.
                The access log below shows everyone who has handled it.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {!hasFile && (
          <Alert variant="warning">
            <ShieldQuestion />
            <div>
              <AlertTitle>No file attached</AlertTitle>
              <AlertDescription>
                This item is registered but carries no file, so there is nothing to verify. Its
                integrity reads as <em>not yet verified</em> rather than intact.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="custody">Chain of custody ({chain.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="access">Access log</TabsTrigger>
            <TabsTrigger value="court">Court verification</TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------------ details */}
          <TabsContent value="details">
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="Evidence record" className="lg:col-span-2">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Evidence number" value={e.evidenceNumber} mono />
                  <Field label="Type" value={e.evidenceType} />
                  <Field label="Collected by" value={e.collectedByName || "—"} />
                  <Field label="Place of collection" value={e.collectionLocation || "—"} />
                  <Field label="Storage location" value={e.storageLocation || "—"} />
                  <Field label="Seal number" value={e.sealNumber || "—"} mono />
                  <Field label="Condition" value={e.condition || "—"} />
                  <Field label="Currently held by" value={e.currentHolder || "—"} />
                  <Field
                    label="Registered"
                    value={new Date(e.createdAt).toLocaleString("en-IN")}
                    className="sm:col-span-2"
                  />
                </dl>
              </Panel>

              <div className="flex flex-col gap-4">
                <Panel title="Integrity">
                  <div className="flex flex-col gap-3">
                    <IntegrityBadge state={e.integrityState} />

                    {hasFile ? (
                      <>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                            {e.file.hashAlgorithm ?? "SHA-256"}
                          </p>
                          <p className="mt-1 break-all font-mono text-xs text-foreground">
                            {e.file.sha256}
                          </p>
                        </div>
                        <dl className="grid grid-cols-2 gap-3">
                          <Field label="File" value={e.file.originalFilename || "—"} />
                          <Field label="Size" value={formatBytes(e.file.fileSize)} />
                          <Field label="Stored in" value={e.file.storageBackend || "—"} />
                          <Field
                            label="Uploaded"
                            value={
                              e.file.uploadedAt
                                ? new Date(e.file.uploadedAt).toLocaleString("en-IN")
                                : "—"
                            }
                          />
                        </dl>

                        <Button variant="outline" size="sm" onClick={() => setVerifyOpen(true)}>
                          <ScanLine className="h-3.5 w-3.5" />
                          Verify integrity
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(custodyApi.downloadUrl(id), "_blank")}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download the file
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => setUploadOpen(true)}>
                        <Upload className="h-3.5 w-3.5" />
                        Attach the file
                      </Button>
                    )}

                    <p className="rounded-md border border-border bg-surface-sunken px-2.5 py-2 text-xs text-foreground-muted">
                      The digest was taken as the file streamed into storage. Verification re-reads
                      the stored bytes and recomputes it — it measures the file as it is now.
                    </p>

                    {e.blockchainAnchorTx ? (
                      <Field label="Anchored" value={e.blockchainAnchorTx} mono />
                    ) : (
                      <p className="text-xs text-foreground-subtle">
                        External anchoring is a later phase. The record is already tamper-evident
                        without it.
                      </p>
                    )}
                  </div>
                </Panel>

                {(history.data ?? []).length > 0 && (
                  <Panel title="Verification history" bodyClassName="flex flex-col gap-2">
                    {(history.data ?? []).slice(0, 6).map((check) => (
                      <div key={check.id} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <StatusPill tone={check.matched ? "success" : "danger"}>
                            {check.matched ? "Match" : "Mismatch"}
                          </StatusPill>
                          {check.note && (
                            <p className="mt-1 truncate text-xs text-foreground-muted">
                              {check.note}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-foreground-subtle">
                          {new Date(check.createdAt).toLocaleDateString("en-IN")}
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
              title="Chain of custody"
              description="Every movement is signed, and carries the file's digest at that moment"
              actions={
                <Button size="sm" onClick={() => setTransferOpen(true)}>
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Record transfer
                </Button>
              }
              bodyClassName="p-0"
            >
              {chain.isLoading ? (
                <div className="p-4">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <ol className="divide-y divide-border">
                  {(chain.data ?? []).map((event, i) => (
                    <li key={event.id} className="flex gap-4 p-4">
                      <div className="flex flex-col items-center">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent">
                          {event.sequenceNumber}
                        </span>
                        {i < (chain.data ?? []).length - 1 && (
                          <span className="mt-1 w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {event.fromName || event.fromLocation || "Origin"} →{" "}
                            {event.toName || event.toLocation}
                          </p>
                          <StatusPill tone={event.sealIntact ? "success" : "danger"}>
                            {event.sealIntact ? "Seal intact" : "Seal broken"}
                          </StatusPill>
                        </div>
                        {event.purpose && (
                          <p className="mt-1 text-sm text-foreground-muted">{event.purpose}</p>
                        )}
                        {event.conditionNote && (
                          <p className="mt-1 text-xs text-foreground-muted">
                            {event.conditionNote}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-foreground-subtle">
                          {event.signedByName ? `Signed by ${event.signedByName} · ` : ""}
                          {new Date(event.transferDate).toLocaleString("en-IN")}
                          {event.sealNumber ? ` · seal ${event.sealNumber}` : ""}
                        </p>
                        {event.signature && (
                          <p className="mt-1 break-all font-mono text-[0.65rem] text-foreground-subtle">
                            signature {event.signature.slice(0, 32)}…
                            {event.hashAtTransfer
                              ? ` · file ${event.hashAtTransfer.slice(0, 16)}…`
                              : ""}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </TabsContent>

          {/* ------------------------------------------------------- access */}
          <TabsContent value="access">
            <Panel
              title="Access log"
              description="Who viewed, downloaded, verified or moved this item — including attempts that failed"
              bodyClassName="p-0"
            >
              {accessLog.isLoading ? (
                <div className="p-4">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (accessLog.data ?? []).length === 0 ? (
                <p className="p-6 text-center text-sm text-foreground-muted">
                  Nothing recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[38rem] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-sunken">
                        {["When", "Who", "Action", "Purpose", "Outcome"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-foreground-subtle"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(accessLog.data ?? []).map((entry) => (
                        <tr key={entry.id} className="border-b border-border last:border-0">
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
                              {entry.action === "transferred" && (
                                <ArrowLeftRight className="h-3 w-3" />
                              )}
                              {entry.action === "verified" && <ScanLine className="h-3 w-3" />}
                              {entry.action === "uploaded" && <Upload className="h-3 w-3" />}
                              {entry.action}
                            </StatusPill>
                          </td>
                          <td className="px-4 py-2.5 text-foreground-muted">
                            {entry.purpose || "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusPill
                              tone={entry.outcome === "success" ? "success" : "danger"}
                            >
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
            <Panel
              title="Court verification"
              description="What an authorised court or forensic user sees — identity and integrity, with nothing about the investigation"
            >
              {court.isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : court.data ? (
                <div className="flex flex-col gap-4">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Field label="Evidence number" value={court.data.evidenceNumber} mono />
                    <Field label="Type" value={court.data.evidenceType} />
                    <Field
                      label="Captured"
                      value={
                        court.data.capturedAt
                          ? new Date(court.data.capturedAt).toLocaleString("en-IN")
                          : "—"
                      }
                    />
                    <Field label="Captured by" value={court.data.capturedBy || "—"} />
                    <Field label="Custody movements" value={court.data.custodyEvents} />
                    <Field
                      label="Seal intact throughout"
                      value={
                        <StatusPill tone={court.data.sealIntact ? "success" : "danger"}>
                          {court.data.sealIntact ? "Yes" : "No"}
                        </StatusPill>
                      }
                    />
                    <Field
                      label="Integrity"
                      value={<IntegrityBadge state={court.data.integrityState} />}
                      className="sm:col-span-2"
                    />
                  </dl>

                  {court.data.sha256 && (
                    <div className="rounded-md border border-border bg-surface-sunken p-3">
                      <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                        {court.data.hashAlgorithm} — compare against your copy
                      </p>
                      <p className="mt-1 break-all font-mono text-xs">{court.data.sha256}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setVerifyOpen(true)}>
                      <ScanLine className="h-4 w-4" />
                      Verify now
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/court")}>
                      <FileCheck2 className="h-4 w-4" />
                      Attach to a court submission
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
          if (!open) setResult(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify integrity</DialogTitle>
            <DialogDescription>
              {e.evidenceNumber} — the stored file is read again and its digest recomputed.
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="flex flex-col gap-3">
              <Alert variant={result.matched ? "success" : "danger"}>
                {result.matched ? <ShieldCheck /> : <ShieldAlert />}
                <div>
                  <AlertTitle>{result.matched ? "Match" : "Mismatch"}</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </div>
              </Alert>
              <div className="rounded-md border border-border bg-surface-sunken p-3">
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                  Recorded at registration
                </p>
                <p className="mt-1 break-all font-mono text-xs">{result.expectedHash || "—"}</p>
              </div>
              <div className="rounded-md border border-border bg-surface-sunken p-3">
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                  Computed just now
                </p>
                <p className="mt-1 break-all font-mono text-xs">{result.computedHash || "—"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground-muted">
              This reads the whole file, so a large export may take a moment. The result is kept
              whatever it shows.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVerifyOpen(false);
                setResult(null);
              }}
            >
              {t("common.close")}
            </Button>
            {!result && (
              <Button
                isLoading={verify.isPending}
                disabled={verify.isPending}
                onClick={async () => setResult(await verify.mutateAsync(undefined))}
              >
                <ScanLine className="h-4 w-4" />
                Verify
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
        onSubmit={async (body) => {
          await transfer.mutateAsync(body);
          setTransferOpen(false);
          setTab("custody");
        }}
      />

      {/* ------------------------------------------------------ upload ---- */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        evidenceNumber={e.evidenceNumber}
        pending={attach.isPending}
        error={attach.error}
        onUpload={async (file) => {
          await attach.mutateAsync(file);
          setUploadOpen(false);
        }}
      />
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidenceNumber: string;
  currentHolder?: string;
  onSubmit: (body: {
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
  const [purpose, setPurpose] = React.useState("");
  const [sealNumber, setSealNumber] = React.useState("");
  const [sealIntact, setSealIntact] = React.useState(true);
  const [conditionNote, setConditionNote] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setToLocation("");
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
          <DialogTitle>Record custody transfer</DialogTitle>
          <DialogDescription>
            {evidenceNumber}
            {currentHolder ? ` — currently with ${currentHolder}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="tr-to">Transfer to</Label>
            <Input
              id="tr-to"
              value={toLocation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToLocation(e.target.value)}
              placeholder="Officer, laboratory or court"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tr-purpose">Purpose</Label>
            <Textarea
              id="tr-purpose"
              rows={2}
              value={purpose}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPurpose(e.target.value)}
              placeholder="Why the item is moving"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tr-seal">Seal number</Label>
            <Input
              id="tr-seal"
              value={sealNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSealNumber(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground-muted">
            <input
              type="checkbox"
              checked={sealIntact}
              onChange={(e) => setSealIntact(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Seal verified intact at handover
          </label>
          {!sealIntact && (
            <div className="grid gap-1.5">
              <Label htmlFor="tr-cond">Condition note</Label>
              <Textarea
                id="tr-cond"
                rows={2}
                value={conditionNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setConditionNote(e.target.value)
                }
                placeholder="A broken seal is recorded against the item — describe what was found"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!toLocation.trim() || !purpose.trim() || pending}
            isLoading={pending}
            onClick={() =>
              onSubmit({
                toLocation: toLocation.trim(),
                purpose: purpose.trim(),
                sealNumber: sealNumber.trim() || undefined,
                sealIntact,
                conditionNote: conditionNote.trim() || undefined,
              })
            }
          >
            Sign and record
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
          <DialogTitle>Attach the file</DialogTitle>
          <DialogDescription>
            {evidenceNumber} — the SHA-256 is computed by the server as the file is stored. A file
            can be attached once; a correction is registered as a new item with its own history.
          </DialogDescription>
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
              <p className="text-sm text-foreground">No file chosen</p>
            )}
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Browse files
            </Button>
            <input
              ref={inputRef}
              type="file"
              hidden
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFile(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </div>

          {error instanceof Error && (
            <p className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {error.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!file || pending}
            isLoading={pending}
            onClick={() => file && onUpload(file)}
          >
            <Lock className="h-4 w-4" />
            Store and hash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
