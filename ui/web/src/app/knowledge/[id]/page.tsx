"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Download, FileText, Layers, ShieldCheck, ShieldX, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { EmptyState, Field, PageHeader, Panel, PhaseBadge, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { ApiClientError } from "@/lib/api/client";
import knowledgeApi, { CLASSIFICATIONS, CLASSIFICATION_FLOOR, type Classification } from "@/lib/api/knowledge";
import {
  useChecklists,
  useClassifyDocument,
  useKnowledgeDocument,
  useSupersedeDocument,
  useWithdrawDocument,
} from "@/hooks/use-knowledge";
import { ClassificationPill, DocumentDialog, ExtractionPill, StatusBadge, docTitle, selectClass, useOfficer } from "../shared";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeDocumentPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { t, locale } = useI18n();
  const officer = useOfficer();

  const doc = useKnowledgeDocument(id);
  const checklists = useChecklists(id);
  const supersede = useSupersedeDocument(id);
  const withdraw = useWithdrawDocument(id);
  const classify = useClassifyDocument(id);

  const [supersedeOpen, setSupersedeOpen] = React.useState(false);
  const [supersedeError, setSupersedeError] = React.useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const [classifyOpen, setClassifyOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [newClass, setNewClass] = React.useState<Classification>("PUBLIC");
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const [download, setDownload] = React.useState<{ ok: boolean } | null>(null);
  const [downloading, setDownloading] = React.useState(false);

  if (doc.isLoading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-96 w-full" />
      </DashboardLayout>
    );
  }

  if (doc.isError || !doc.data) {
    const notFound = doc.error instanceof ApiClientError && doc.error.code === 404;
    return (
      <DashboardLayout>
        <EmptyState
          icon={FileText}
          title={notFound ? t("knowledgeScreen.detail.notFound") : t("knowledgeScreen.errors.load")}
          description={notFound ? t("knowledgeScreen.detail.notFoundHint") : (doc.error as Error)?.message}
          action={
            <Button variant="outline" onClick={() => router.push("/knowledge")}>
              {t("knowledgeScreen.detail.back")}
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  const d = doc.data;
  const effective = d.status === "EFFECTIVE";

  const runDownload = async () => {
    setDownloading(true);
    try {
      const { blob, filename, recordedHash, receivedHash } = await knowledgeApi.download(d.id);
      const ok = recordedHash === receivedHash && receivedHash === d.sha256;
      setDownload({ ok });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(t("knowledgeScreen.errors.load"), (e as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div>
          <Link href="/knowledge" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t("knowledgeScreen.detail.back")}
          </Link>
        </div>

        <PageHeader
          title={docTitle(d, locale)}
          description={`${d.documentNumber}${d.referenceNumber ? ` · ${d.referenceNumber}` : ""} · ${d.issuingAuthority}`}
          icon={FileText}
          badge={<PhaseBadge phase={11} />}
          breadcrumb={[{ label: t("modules.knowledge"), href: "/knowledge" }, { label: d.documentNumber }]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={runDownload} disabled={downloading}>
                <Download className="h-4 w-4" />
                {t("knowledgeScreen.detail.download")}
              </Button>
              {officer.canFile && effective && (
                <Button
                  onClick={() => {
                    setSupersedeError(null);
                    setSupersedeOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4" />
                  {t("knowledgeScreen.detail.supersede")}
                </Button>
              )}
              {officer.canGovern && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setReason("");
                    setDialogError(null);
                    setNewClass(d.classification);
                    setClassifyOpen(true);
                  }}
                >
                  {t("knowledgeScreen.detail.classify")}
                </Button>
              )}
              {officer.canGovern && effective && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setReason("");
                    setDialogError(null);
                    setWithdrawOpen(true);
                  }}
                >
                  {t("knowledgeScreen.detail.withdraw")}
                </Button>
              )}
            </div>
          }
        />

        {download && (
          <Alert variant={download.ok ? "success" : "danger"}>
            {download.ok ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
            <AlertDescription>
              {t(download.ok ? "knowledgeScreen.detail.downloadChecked" : "knowledgeScreen.detail.downloadMismatch")}
            </AlertDescription>
          </Alert>
        )}

        {d.status === "SUPERSEDED" && d.supersededById && (
          <Alert variant="warning">
            <Layers className="h-4 w-4" />
            <AlertTitle>{t("knowledgeScreen.detail.supersededBy", { number: d.supersededByNumber })}</AlertTitle>
            <AlertDescription>
              <Link className="underline" href={`/knowledge/${d.supersededById}`}>
                {t("knowledgeScreen.detail.openCurrent")}
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title={d.titleBn ? (locale === "bn" ? d.title : d.titleBn) : undefined}>
            <div className="flex flex-wrap gap-2">
              <StatusPill>{t(`knowledgeScreen.types.${d.docType}`)}</StatusPill>
              <StatusBadge value={d.status} />
              <ClassificationPill value={d.classification} />
              <StatusPill>{t("knowledgeScreen.detail.version", { version: d.version })}</StatusPill>
            </div>
            {d.description && <p className="mt-3 whitespace-pre-line text-sm text-foreground">{d.description}</p>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label={t("knowledgeScreen.upload.issuedOn")} value={d.issuedOn.slice(0, 10)} />
              <Field label={t("knowledgeScreen.upload.authority")} value={d.issuingAuthority} />
              <Field label={t("knowledgeScreen.upload.reference")} value={d.referenceNumber ?? "—"} mono />
              <Field label={t("knowledgeScreen.upload.applicableTo")} value={d.applicableTo.length ? d.applicableTo.join(", ") : "—"} />
              <Field
                label={t("knowledgeScreen.upload.classification")}
                value={t("knowledgeScreen.classifications.floor", { rank: CLASSIFICATION_FLOOR[d.classification].rank })}
              />
              <Field label={t("knowledgeScreen.detail.filedBy")} value={`${d.uploadedByName} · ${d.createdAt.slice(0, 10)}`} />
            </div>
            {d.supersedesId && (
              <p className="mt-4 text-sm">
                {t("knowledgeScreen.detail.supersedes", { number: d.supersedesNumber })} —{" "}
                <Link className="text-accent underline" href={`/knowledge/${d.supersedesId}`}>
                  {t("knowledgeScreen.detail.openPrevious")}
                </Link>
              </p>
            )}
          </Panel>

          <Panel title={t("knowledgeScreen.detail.file")}>
            <div className="flex flex-col gap-3">
              <Field label={t("knowledgeScreen.detail.file")} value={`${d.originalFilename} · ${formatBytes(d.fileSize)}`} />
              <Field label="SHA-256" value={<span className="break-all">{d.sha256}</span>} mono />
              <div>
                <p className="text-xs text-foreground-muted">{t("knowledgeScreen.detail.textStatus")}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <ExtractionPill value={d.extractionStatus} />
                  {d.textLength > 0 && (
                    <span className="text-xs text-foreground-muted">{t("knowledgeScreen.detail.characters", { count: d.textLength })}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-foreground-muted" data-testid="extraction-note">
                  {d.extractionNote}
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <Panel title={t("knowledgeScreen.detail.checklistsFromThis")}>
          {(checklists.data ?? []).length === 0 ? (
            <p className="text-sm text-foreground-muted">{t("knowledgeScreen.detail.noChecklists")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(checklists.data ?? []).map((c) => (
                <li key={c.id}>
                  <Link href={`/knowledge/checklists/${c.id}`} className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
                    <ClipboardCheck className="h-4 w-4" />
                    {locale === "bn" && c.titleBn ? c.titleBn : c.title} · {c.sectionRef}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <DocumentDialog
        open={supersedeOpen}
        onOpenChange={setSupersedeOpen}
        current={d}
        submitting={supersede.isPending}
        error={supersedeError}
        onSubmit={(input, file) => {
          setSupersedeError(null);
          supersede.mutate(
            { input, file },
            {
              onSuccess: (next) => {
                setSupersedeOpen(false);
                toast.success(t("knowledgeScreen.upload.filed", { number: next.documentNumber }), next.extractionNote);
                router.push(`/knowledge/${next.id}`);
              },
              onError: (e) => setSupersedeError((e as Error).message),
            },
          );
        }}
      />

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("knowledgeScreen.detail.withdraw")}</DialogTitle>
            <DialogDescription>{d.documentNumber}</DialogDescription>
          </DialogHeader>
          <Textarea id="kd-withdraw-reason" label={t("knowledgeScreen.detail.withdrawReason")} value={reason} onChange={setReason} rows={3} />
          {dialogError && (
            <Alert variant="danger">
              <AlertDescription>{dialogError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={withdraw.isPending}
              onClick={() =>
                withdraw.mutate(reason, {
                  onSuccess: () => {
                    setWithdrawOpen(false);
                    toast.success(t("knowledgeScreen.detail.withdrawn"), d.documentNumber);
                  },
                  onError: (e) => setDialogError((e as Error).message),
                })
              }
            >
              {t("knowledgeScreen.detail.confirmWithdraw")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={classifyOpen} onOpenChange={setClassifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("knowledgeScreen.detail.classify")}</DialogTitle>
            <DialogDescription>{d.documentNumber}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="kd-new-class">{t("knowledgeScreen.upload.classification")}</Label>
              <select
                id="kd-new-class"
                className={selectClass}
                value={newClass}
                onChange={(e) => setNewClass(e.target.value as Classification)}
              >
                {CLASSIFICATIONS.filter((c) => CLASSIFICATION_FLOOR[c].level <= officer.level).map((c) => (
                  <option key={c} value={c}>
                    {t(`knowledgeScreen.classifications.${c}`)} —{" "}
                    {t("knowledgeScreen.classifications.floor", { rank: CLASSIFICATION_FLOOR[c].rank })}
                  </option>
                ))}
              </select>
            </div>
            <Textarea id="kd-class-reason" label={t("knowledgeScreen.detail.classifyReason")} value={reason} onChange={setReason} rows={3} />
          </div>
          {dialogError && (
            <Alert variant="danger">
              <AlertDescription>{dialogError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassifyOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={classify.isPending}
              onClick={() =>
                classify.mutate(
                  { classification: newClass, reason },
                  {
                    onSuccess: () => {
                      setClassifyOpen(false);
                      toast.success(t("knowledgeScreen.detail.classified"), d.documentNumber);
                    },
                    onError: (e) => setDialogError((e as Error).message),
                  },
                )
              }
            >
              {t("knowledgeScreen.detail.confirmClassify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
