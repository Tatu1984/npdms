"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpenCheck,
  CheckCircle2,
  Download,
  FileLock2,
  FilePlus2,
  FileUp,
  History,
  Link2,
  ListChecks,
  Scale,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { EmptyState, Field, PageHeader, Panel, PhaseBadge, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiClientError } from "@/lib/api/client";
import caseFilesApi, {
  CASE_FILE_CATEGORIES,
  type CaseFile,
  type CaseFileCategory,
  type CaseFileEntry,
  type CaseFilePack,
  type MatrixEvidence,
} from "@/lib/api/case-files";
import {
  useAddCharge,
  useAddEntry,
  useAddWitnessFact,
  useCaseFile,
  useCaseFileEntries,
  useCaseFileSources,
  useCompleteness,
  useDecidePack,
  useEvidenceMatrix,
  useLinkEvidence,
  usePack,
  usePacks,
  useRemoveCharge,
  useRemoveEntry,
  useRemoveWitnessFact,
  useSubmitPack,
  useUnlinkEvidence,
  useUploadEntry,
  useVersion,
  useVersions,
  useWitnessMatrix,
} from "@/hooks/use-case-files";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { formatDate, formatDateTime } from "@/lib/utils";
import { caseFileEn } from "@/lib/i18n/dictionaries/case-file.en";
import { CHAIN_TONE, INTEGRITY_TONE, STATUS_TONE, saveBlob, sha256Hex } from "../shared";

type RuleKey = keyof typeof caseFileEn.completeness.rules;
const TABS = ["index", "evidence", "witnesses", "completeness", "versions", "packs"] as const;
type Tab = (typeof TABS)[number];

const selectClass = "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground";

function errorText(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

function Loading() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function LoadError({ error, retry }: { error: Error; retry: () => void }) {
  const { t } = useI18n();
  return (
    <Alert variant="danger">
      <AlertTitle>{t("caseFileScreen.detail.loadFailed")}</AlertTitle>
      <AlertDescription>
        {error.message}{" "}
        <Button variant="link" className="h-auto p-0" onClick={retry}>
          {t("caseFileScreen.list.retry")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export default function CaseFileDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const id = params.id;
  const { t, pick } = useI18n();
  const user = useAuthStore((s) => s.user);
  const canBuild = Boolean(user && hasMinimumRole(user.role, "SI"));
  const canDecide = Boolean(user && hasMinimumRole(user.role, "INSPECTOR"));

  const file = useCaseFile(id);
  const requested = search.get("tab") as Tab | null;
  const [tab, setTab] = React.useState<Tab>(requested && TABS.includes(requested) ? requested : "index");

  if (file.isPending) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }
  if (file.isError) {
    const notFound = file.error instanceof ApiClientError && (file.error.code === 404 || file.error.code === 400);
    return (
      <DashboardLayout>
        {notFound ? (
          <Panel>
            <EmptyState
              title={t("caseFileScreen.detail.notFound")}
              icon={BookOpenCheck}
              action={
                <Button onClick={() => router.push("/case-file")}>{t("caseFileScreen.detail.back")}</Button>
              }
            />
          </Panel>
        ) : (
          <LoadError error={file.error} retry={() => file.refetch()} />
        )}
      </DashboardLayout>
    );
  }

  const cf = file.data;
  const title = cf.titleBn ? pick({ en: cf.title, bn: cf.titleBn }) : cf.title;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={title}
          description={`${cf.fileNumber} · ${cf.caseNumber}`}
          icon={BookOpenCheck}
          badge={<PhaseBadge phase={12} />}
          breadcrumb={[
            { label: t("modules.caseFile"), href: "/case-file" },
            { label: cf.fileNumber },
          ]}
          actions={
            <Link href={`/investigation/${cf.workspaceId}`}>
              <Button variant="secondary">{t("caseFileScreen.detail.investigation")}</Button>
            </Link>
          }
        />

        <Panel>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <Field label={t("caseFileScreen.list.stage")} value={
              <span className="flex flex-col items-start gap-1">
                <StatusPill tone={STATUS_TONE[cf.status]}>{t(`caseFileScreen.status.${cf.status}`)}</StatusPill>
                {cf.stale && <span className="text-xs text-warning" data-testid="stale-note">{t("caseFileScreen.status.stale")}</span>}
              </span>
            } />
            <Field label={t("caseFileScreen.detail.version")} value={<span data-testid="file-version">v{cf.version}</span>} />
            <Field label={t("caseFileScreen.detail.fir")} value={cf.firNumber || "—"} mono />
            <Field label={t("caseFileScreen.list.io")} value={cf.ioName || "—"} />
            <Field label={t("caseFileScreen.detail.station")} value={cf.stationName || "—"} />
          </div>
          {!canBuild && <p className="mt-3 text-sm text-foreground-muted">{t("caseFileScreen.detail.readOnly")}</p>}
        </Panel>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="index"><ListChecks className="mr-1.5 h-4 w-4" />{t("caseFileScreen.tabs.index")}</TabsTrigger>
            <TabsTrigger value="evidence"><Scale className="mr-1.5 h-4 w-4" />{t("caseFileScreen.tabs.evidence")}</TabsTrigger>
            <TabsTrigger value="witnesses"><Users className="mr-1.5 h-4 w-4" />{t("caseFileScreen.tabs.witnesses")}</TabsTrigger>
            <TabsTrigger value="completeness"><ShieldAlert className="mr-1.5 h-4 w-4" />{t("caseFileScreen.tabs.completeness")}</TabsTrigger>
            <TabsTrigger value="versions"><History className="mr-1.5 h-4 w-4" />{t("caseFileScreen.tabs.versions")}</TabsTrigger>
            <TabsTrigger value="packs"><FileLock2 className="mr-1.5 h-4 w-4" />{t("caseFileScreen.tabs.packs")}</TabsTrigger>
          </TabsList>
          <TabsContent value="index"><IndexTab file={cf} canBuild={canBuild} /></TabsContent>
          <TabsContent value="evidence"><EvidenceTab file={cf} canBuild={canBuild} /></TabsContent>
          <TabsContent value="witnesses"><WitnessTab file={cf} canBuild={canBuild} /></TabsContent>
          <TabsContent value="completeness"><CompletenessTab file={cf} /></TabsContent>
          <TabsContent value="versions"><VersionsTab file={cf} /></TabsContent>
          <TabsContent value="packs">
            <PacksTab file={cf} canBuild={canBuild} canDecide={canDecide} userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

/* ----------------------------------- index ---------------------------------- */

function reference(e: CaseFileEntry) {
  switch (e.sourceKind) {
    case "fir":
      return e.firNumber;
    case "evidence":
      return e.evidenceNumber;
    case "forensic":
      return `${e.forensicStatus}`;
    default:
      return e.originalFilename ?? "";
  }
}

function IndexTab({ file, canBuild }: { file: CaseFile; canBuild: boolean }) {
  const { t } = useI18n();
  const entries = useCaseFileEntries(file.id);
  const [adding, setAdding] = React.useState<"record" | "upload" | null>(null);
  const [removing, setRemoving] = React.useState<CaseFileEntry | null>(null);
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null);

  const download = async (e: CaseFileEntry) => {
    setNotice(null);
    try {
      const r = await caseFilesApi.download(file.id, e.id);
      const ok = r.recordedHash === r.receivedHash;
      setNotice({ ok, text: ok ? t("caseFileScreen.index.downloaded") : t("caseFileScreen.index.mismatch") });
      saveBlob(r.blob, r.filename);
    } catch (err) {
      setNotice({ ok: false, text: errorText(err) });
    }
  };

  return (
    <Panel
      title={t("caseFileScreen.tabs.index")}
      description={t("caseFileScreen.index.serialNote")}
      actions={
        canBuild ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAdding("record")}>
              <FilePlus2 className="h-4 w-4" />
              {t("caseFileScreen.index.add")}
            </Button>
            <Button onClick={() => setAdding("upload")}>
              <FileUp className="h-4 w-4" />
              {t("caseFileScreen.index.upload")}
            </Button>
          </div>
        ) : undefined
      }
    >
      {notice && (
        <p className={`mb-3 text-sm ${notice.ok ? "text-success" : "text-danger"}`} role="status">
          {notice.text}
        </p>
      )}
      {entries.isPending ? (
        <Loading />
      ) : entries.isError ? (
        <LoadError error={entries.error} retry={() => entries.refetch()} />
      ) : entries.data.length === 0 ? (
        <EmptyState title={t("caseFileScreen.index.empty")} icon={ListChecks} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="index-table">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                <th className="py-2 pr-3">{t("caseFileScreen.index.serial")}</th>
                <th className="py-2 pr-3">{t("caseFileScreen.index.document")}</th>
                <th className="py-2 pr-3">{t("caseFileScreen.index.reference")}</th>
                <th className="py-2 pr-3">{t("caseFileScreen.index.digest")}</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {entries.data.map((e) => (
                <tr key={e.id} className="border-b border-border align-top last:border-0" data-testid="index-row">
                  <td className="py-2.5 pr-3 font-mono tabular">{e.serial}</td>
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-foreground-muted">
                      {t(`caseFileScreen.category.${e.category}`)}
                      {e.witnessName && ` · ${t("caseFileScreen.index.witness")}: ${e.witnessName}`}
                      {e.statementSection && ` · ${t("caseFileScreen.index.recordedUnder")} ${e.statementSection}`}
                      {(e.statementDate || e.documentDate) && ` · ${formatDate((e.statementDate || e.documentDate)!)}`}
                    </p>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs">
                    {e.sourceKind === "upload" ? reference(e) : `${t("caseFileScreen.index.recordRef")}: ${reference(e)}`}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-foreground-muted" title={e.sha256 ?? ""}>
                    {e.sha256 ? `${e.sha256.slice(0, 16)}…` : "—"}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    {e.sourceKind === "upload" && (
                      <Button variant="ghost" size="sm" onClick={() => download(e)} aria-label={`${t("caseFileScreen.index.download")} ${e.title}`}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {canBuild && (
                      <Button variant="ghost" size="sm" onClick={() => setRemoving(e)} aria-label={`${t("caseFileScreen.index.remove")} ${e.title}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {adding && <AddEntryDialog file={file} mode={adding} onClose={() => setAdding(null)} />}
      {removing && <RemoveEntryDialog file={file} entry={removing} onClose={() => setRemoving(null)} />}
    </Panel>
  );
}

function AddEntryDialog({ file, mode, onClose }: { file: CaseFile; mode: "record" | "upload"; onClose: () => void }) {
  const { t } = useI18n();
  const sources = useCaseFileSources(file.id);
  const addEntry = useAddEntry(file.id);
  const upload = useUploadEntry(file.id);
  const [category, setCategory] = React.useState<CaseFileCategory>(mode === "record" ? "FIR" : "STATEMENT");
  const [sourceKind, setSourceKind] = React.useState<"fir" | "evidence" | "forensic">("fir");
  const [recordId, setRecordId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [witnessId, setWitnessId] = React.useState("");
  const [section, setSection] = React.useState("");
  const [statementDate, setStatementDate] = React.useState("");
  const [documentDate, setDocumentDate] = React.useState("");
  const [fileObj, setFileObj] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // A FIR record files as FIR; a forensic request files as a forensic report.
  React.useEffect(() => {
    if (mode !== "record") return;
    if (sourceKind === "fir") setCategory("FIR");
    if (sourceKind === "forensic") setCategory("FORENSIC_REPORT");
    setRecordId(sourceKind === "fir" ? sources.data?.firId ?? "" : "");
  }, [sourceKind, mode, sources.data?.firId]);

  const witnesses = (sources.data?.persons ?? []).filter((p) => ["witness", "victim", "complainant"].includes(p.role));
  const busy = addEntry.isPending || upload.isPending;

  const submit = async () => {
    setError(null);
    const statement =
      category === "STATEMENT"
        ? { witnessPersonId: witnessId || undefined, statementSection: section || undefined, statementDate: statementDate || undefined }
        : {};
    try {
      if (mode === "upload") {
        if (!fileObj) {
          setError(t("caseFileScreen.addEntry.file"));
          return;
        }
        await upload.mutateAsync({ input: { category, title, documentDate: documentDate || undefined, ...statement }, file: fileObj });
      } else {
        await addEntry.mutateAsync({
          category,
          title,
          sourceKind,
          firId: sourceKind === "fir" ? recordId || undefined : undefined,
          evidenceId: sourceKind === "evidence" ? recordId || undefined : undefined,
          forensicId: sourceKind === "forensic" ? recordId || undefined : undefined,
          documentDate: documentDate || undefined,
          ...statement,
        });
      }
      onClose();
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "record" ? t("caseFileScreen.addEntry.titleRecord") : t("caseFileScreen.addEntry.titleUpload")}</DialogTitle>
          <DialogDescription>{mode === "record" ? t("caseFileScreen.addEntry.descRecord") : t("caseFileScreen.addEntry.descUpload")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {mode === "record" && (
            <div className="space-y-1.5">
              <Label htmlFor="cf-source">{t("caseFileScreen.addEntry.source")}</Label>
              <select id="cf-source" className={selectClass} value={sourceKind} onChange={(e) => setSourceKind(e.target.value as typeof sourceKind)}>
                <option value="fir">{t("caseFileScreen.addEntry.sourceFir")}</option>
                <option value="evidence">{t("caseFileScreen.addEntry.sourceEvidence")}</option>
                <option value="forensic">{t("caseFileScreen.addEntry.sourceForensic")}</option>
              </select>
              {sourceKind === "fir" ? (
                <p className="text-sm text-foreground-muted" data-testid="fir-source">
                  {sources.data?.firId ? sources.data.firNumber : t("caseFileScreen.addEntry.noFir")}
                </p>
              ) : (
                <select aria-label={t("caseFileScreen.addEntry.source")} className={selectClass} value={recordId} onChange={(e) => setRecordId(e.target.value)}>
                  <option value="">{t("caseFileScreen.addEntry.choose")}</option>
                  {sourceKind === "evidence"
                    ? (sources.data?.evidence ?? []).map((ev) => (
                        <option key={ev.evidenceId} value={ev.evidenceId}>
                          {ev.evidenceNumber} — {ev.description}
                        </option>
                      ))
                    : (sources.data?.forensics ?? []).map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.type} · {f.evidenceNumber} · {f.status}
                        </option>
                      ))}
                </select>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="cf-category">{t("caseFileScreen.addEntry.category")}</Label>
            <select
              id="cf-category"
              className={selectClass}
              value={category}
              disabled={mode === "record" && sourceKind !== "evidence"}
              onChange={(e) => setCategory(e.target.value as CaseFileCategory)}
            >
              {CASE_FILE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`caseFileScreen.category.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <Input label={t("caseFileScreen.addEntry.docTitle")} value={title} onChange={(v: string) => setTitle(v)} />
          {category === "STATEMENT" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="cf-witness">{t("caseFileScreen.addEntry.witness")}</Label>
                <select id="cf-witness" className={selectClass} value={witnessId} onChange={(e) => setWitnessId(e.target.value)}>
                  <option value="">{t("caseFileScreen.addEntry.choose")}</option>
                  {witnesses.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
              <Input label={t("caseFileScreen.addEntry.section")} value={section} onChange={(v: string) => setSection(v)} />
              <Input type="date" label={t("caseFileScreen.addEntry.statementDate")} value={statementDate} onChange={(v: string) => setStatementDate(v)} />
            </>
          )}
          {category !== "STATEMENT" && (
            <Input type="date" label={t("caseFileScreen.addEntry.documentDate")} value={documentDate} onChange={(v: string) => setDocumentDate(v)} />
          )}
          {mode === "upload" && (
            <div className="space-y-1.5">
              <Label htmlFor="cf-file">{t("caseFileScreen.addEntry.file")}</Label>
              <input id="cf-file" type="file" className="block w-full text-sm" onChange={(e) => setFileObj(e.target.files?.[0] ?? null)} />
            </div>
          )}
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>{t("caseFileScreen.addEntry.cancel")}</Button>
          <Button onClick={submit} disabled={busy}>{t("caseFileScreen.addEntry.submit")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoveEntryDialog({ file, entry, onClose }: { file: CaseFile; entry: CaseFileEntry; onClose: () => void }) {
  const { t } = useI18n();
  const remove = useRemoveEntry(file.id);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("caseFileScreen.index.removeTitle")}</DialogTitle>
          <DialogDescription>
            {entry.serial}. {entry.title} — {t("caseFileScreen.index.removeHint")}
          </DialogDescription>
        </DialogHeader>
        <Textarea label={t("caseFileScreen.index.removeReason")} value={reason} onChange={(v: string) => setReason(v)} rows={3} />
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>{t("caseFileScreen.addEntry.cancel")}</Button>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={async () => {
              setError(null);
              try {
                await remove.mutateAsync({ entryId: entry.id, reason });
                onClose();
              } catch (e) {
                setError(errorText(e));
              }
            }}
          >
            {t("caseFileScreen.index.remove")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ evidence matrix ------------------------------ */

function EvidenceChip({ ev }: { ev: MatrixEvidence }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="matrix-evidence">
      <span className="font-mono text-xs">{ev.evidenceNumber}</span>
      <span className="text-sm text-foreground">{ev.description}</span>
      <StatusPill tone={INTEGRITY_TONE[ev.integrityState]}>
        {t("caseFileScreen.evidence.integrity")}: {t(`caseFileScreen.evidence.integrityState.${ev.integrityState}`)}
      </StatusPill>
      <StatusPill tone={CHAIN_TONE[ev.chainState]}>
        {t("caseFileScreen.evidence.chain")}: {t(`caseFileScreen.evidence.chainState.${ev.chainState}`)} ({ev.chainLegs} {t("caseFileScreen.evidence.legs")})
      </StatusPill>
      {ev.note && <span className="text-xs text-foreground-muted">— {ev.note}</span>}
    </div>
  );
}

function EvidenceTab({ file, canBuild }: { file: CaseFile; canBuild: boolean }) {
  const { t } = useI18n();
  const matrix = useEvidenceMatrix(file.id);
  const addCharge = useAddCharge(file.id);
  const removeCharge = useRemoveCharge(file.id);
  const unlink = useUnlinkEvidence(file.id);
  const [section, setSection] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [linking, setLinking] = React.useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Panel title={t("caseFileScreen.tabs.evidence")} description={t("caseFileScreen.evidence.liveNote")}>
      {canBuild && (
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem]">
            <Input label={t("caseFileScreen.evidence.section")} value={section} onChange={(v: string) => setSection(v)} />
          </div>
          <div className="min-w-[14rem] flex-1">
            <Input label={t("caseFileScreen.evidence.description")} value={description} onChange={(v: string) => setDescription(v)} />
          </div>
          <Button
            disabled={addCharge.isPending}
            onClick={() =>
              run(async () => {
                await addCharge.mutateAsync({ section, description });
                setSection("");
                setDescription("");
              })
            }
          >
            {t("caseFileScreen.evidence.addCharge")}
          </Button>
        </div>
      )}
      {error && <p className="mb-3 text-sm text-danger" role="alert">{error}</p>}
      {matrix.isPending ? (
        <Loading />
      ) : matrix.isError ? (
        <LoadError error={matrix.error} retry={() => matrix.refetch()} />
      ) : (
        <div className="space-y-4">
          {matrix.data.rows.length === 0 && <EmptyState title={t("caseFileScreen.evidence.noCharges")} icon={Scale} />}
          {matrix.data.rows.map((row) => (
            <div key={row.charge.id} className="rounded-md border border-border p-3" data-testid="charge-row">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-foreground">{row.charge.section}</p>
                  {row.charge.description && <p className="text-xs text-foreground-muted">{row.charge.description}</p>}
                </div>
                {canBuild && (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setLinking(row.charge.id)}>
                      <Link2 className="h-4 w-4" />
                      {t("caseFileScreen.evidence.link")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => run(() => removeCharge.mutateAsync(row.charge.id))}>
                      {t("caseFileScreen.evidence.removeCharge")}
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-2 space-y-2">
                {row.evidence.length === 0 ? (
                  <p className="text-sm text-warning">{t("caseFileScreen.evidence.noSupport")}</p>
                ) : (
                  row.evidence.map((ev) => (
                    <div key={ev.evidenceId} className="flex items-center justify-between gap-2">
                      <EvidenceChip ev={ev} />
                      {canBuild && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => run(() => unlink.mutateAsync({ chargeId: row.charge.id, evidenceId: ev.evidenceId }))}
                        >
                          {t("caseFileScreen.evidence.unlink")}
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
          {matrix.data.unlinked.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-foreground-subtle">{t("caseFileScreen.evidence.unlinked")}</p>
              <div className="space-y-2">
                {matrix.data.unlinked.map((ev) => (
                  <EvidenceChip key={ev.evidenceId} ev={ev} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {linking && <LinkEvidenceDialog file={file} chargeId={linking} onClose={() => setLinking(null)} />}
    </Panel>
  );
}

function LinkEvidenceDialog({ file, chargeId, onClose }: { file: CaseFile; chargeId: string; onClose: () => void }) {
  const { t } = useI18n();
  const sources = useCaseFileSources(file.id);
  const link = useLinkEvidence(file.id);
  const [evidenceId, setEvidenceId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("caseFileScreen.evidence.link")}</DialogTitle>
          <DialogDescription>{t("caseFileScreen.evidence.chooseEvidence")}</DialogDescription>
        </DialogHeader>
        <select aria-label={t("caseFileScreen.evidence.chooseEvidence")} className={selectClass} value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)}>
          <option value="">{t("caseFileScreen.addEntry.choose")}</option>
          {(sources.data?.evidence ?? []).map((ev) => (
            <option key={ev.evidenceId} value={ev.evidenceId}>
              {ev.evidenceNumber} — {ev.description}
            </option>
          ))}
        </select>
        <Input label={t("caseFileScreen.evidence.note")} value={note} onChange={(v: string) => setNote(v)} />
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>{t("caseFileScreen.addEntry.cancel")}</Button>
          <Button
            disabled={!evidenceId || link.isPending}
            onClick={async () => {
              setError(null);
              try {
                await link.mutateAsync({ chargeId, evidenceId, note });
                onClose();
              } catch (e) {
                setError(errorText(e));
              }
            }}
          >
            {t("caseFileScreen.evidence.link")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- witness matrix ------------------------------ */

function WitnessTab({ file, canBuild }: { file: CaseFile; canBuild: boolean }) {
  const { t, pick } = useI18n();
  const matrix = useWitnessMatrix(file.id);
  const addFact = useAddWitnessFact(file.id);
  const removeFact = useRemoveWitnessFact(file.id);
  const [drafts, setDrafts] = React.useState<Record<string, { fact: string; cite: string }>>({});
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Panel title={t("caseFileScreen.tabs.witnesses")}>
      {error && <p className="mb-3 text-sm text-danger" role="alert">{error}</p>}
      {matrix.isPending ? (
        <Loading />
      ) : matrix.isError ? (
        <LoadError error={matrix.error} retry={() => matrix.refetch()} />
      ) : matrix.data.length === 0 ? (
        <EmptyState title={t("caseFileScreen.witnesses.empty")} icon={Users} />
      ) : (
        <div className="space-y-4">
          {matrix.data.map((row) => {
            const draft = drafts[row.personId] ?? { fact: "", cite: "" };
            const setDraft = (d: Partial<typeof draft>) => setDrafts((all) => ({ ...all, [row.personId]: { ...draft, ...d } }));
            return (
              <div key={row.personId} className="rounded-md border border-border p-3" data-testid="witness-row">
                <p className="font-medium text-foreground">
                  {row.nameBn ? pick({ en: row.name, bn: row.nameBn }) : row.name}{" "}
                  <span className="text-xs text-foreground-muted">({row.role})</span>
                </p>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground-subtle">{t("caseFileScreen.witnesses.facts")}</p>
                    {row.facts.length === 0 ? (
                      <p className="text-sm text-foreground-muted">{t("caseFileScreen.witnesses.noFacts")}</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {row.facts.map((f) => (
                          <li key={f.id} className="flex items-start justify-between gap-2 text-sm">
                            <span>
                              {f.fact}
                              {f.statementEntryId && (
                                <span className="ml-1 text-xs text-foreground-muted">
                                  (№ {row.statements.find((s) => s.entryId === f.statementEntryId)?.serial ?? "—"})
                                </span>
                              )}
                            </span>
                            {canBuild && (
                              <Button variant="ghost" size="sm" onClick={async () => {
                                setError(null);
                                try { await removeFact.mutateAsync(f.id); } catch (e) { setError(errorText(e)); }
                              }}>
                                {t("caseFileScreen.witnesses.removeFact")}
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground-subtle">{t("caseFileScreen.witnesses.statements")}</p>
                    {row.statements.length === 0 ? (
                      <p className="text-sm text-warning">{t("caseFileScreen.witnesses.noStatements")}</p>
                    ) : (
                      <ul className="mt-1 space-y-1 text-sm">
                        {row.statements.map((s) => (
                          <li key={s.entryId}>
                            № {s.serial} · {s.section} · {formatDate(s.date)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {canBuild && (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <div className="min-w-[14rem] flex-1">
                      <Input label={t("caseFileScreen.witnesses.fact")} value={draft.fact} onChange={(v: string) => setDraft({ fact: v })} />
                    </div>
                    <div className="min-w-[12rem]">
                      <Label className="text-xs">{t("caseFileScreen.witnesses.cite")}</Label>
                      <select aria-label={t("caseFileScreen.witnesses.cite")} className={selectClass} value={draft.cite} onChange={(e) => setDraft({ cite: e.target.value })}>
                        <option value="">{t("caseFileScreen.witnesses.none")}</option>
                        {row.statements.map((s) => (
                          <option key={s.entryId} value={s.entryId}>
                            № {s.serial} · {s.section}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      disabled={addFact.isPending}
                      onClick={async () => {
                        setError(null);
                        try {
                          await addFact.mutateAsync({ personId: row.personId, fact: draft.fact, statementEntryId: draft.cite || undefined });
                          setDraft({ fact: "", cite: "" });
                        } catch (e) {
                          setError(errorText(e));
                        }
                      }}
                    >
                      {t("caseFileScreen.witnesses.addFact")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

/* -------------------------------- completeness ------------------------------- */

function CompletenessTab({ file }: { file: CaseFile }) {
  const { t } = useI18n();
  const findings = useCompleteness(file.id);
  return (
    <Panel title={t("caseFileScreen.tabs.completeness")} description={t("caseFileScreen.completeness.intro")}>
      {findings.isPending ? (
        <Loading />
      ) : findings.isError ? (
        <LoadError error={findings.error} retry={() => findings.refetch()} />
      ) : (
        <ul className="space-y-3">
          {findings.data.map((f) => {
            const rule = caseFileEn.completeness.rules[f.rule as RuleKey] ? (f.rule as RuleKey) : null;
            return (
              <li key={f.rule} className="rounded-md border border-border p-3" data-testid={`finding-${f.rule}`} data-open={f.open}>
                <div className="flex flex-wrap items-center gap-2">
                  {f.open ? <ShieldAlert className="h-4 w-4 text-danger" /> : <CheckCircle2 className="h-4 w-4 text-success" />}
                  <p className="font-medium text-foreground">{rule ? t(`caseFileScreen.completeness.rules.${rule}.title`) : f.title}</p>
                  <StatusPill tone={f.open ? (f.blocking ? "danger" : "warning") : "success"}>
                    {f.open ? t("caseFileScreen.completeness.open") : t("caseFileScreen.completeness.closed")}
                  </StatusPill>
                  <StatusPill tone="neutral">
                    {f.blocking ? t("caseFileScreen.completeness.blocking") : t("caseFileScreen.completeness.advisory")}
                  </StatusPill>
                </div>
                <p className="mt-1 text-xs text-foreground-muted">
                  {t("caseFileScreen.completeness.examined")}: {rule ? t(`caseFileScreen.completeness.rules.${rule}.examined`) : f.examined}
                </p>
                {f.details.length > 0 && (
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm" lang="en">
                    {f.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-foreground-subtle">{t("caseFileScreen.completeness.detailsNote")}</p>
    </Panel>
  );
}

/* ---------------------------------- versions --------------------------------- */

function VersionsTab({ file }: { file: CaseFile }) {
  const { t } = useI18n();
  const versions = useVersions(file.id);
  const [viewing, setViewing] = React.useState<number | null>(null);
  const version = useVersion(file.id, viewing);
  return (
    <Panel title={t("caseFileScreen.tabs.versions")} description={t("caseFileScreen.versions.intro")}>
      {versions.isPending ? (
        <Loading />
      ) : versions.isError ? (
        <LoadError error={versions.error} retry={() => versions.refetch()} />
      ) : (
        <ul className="divide-y divide-border">
          {versions.data.map((v) => (
            <li key={v.version} className="flex flex-wrap items-center justify-between gap-2 py-2" data-testid="version-row">
              <div>
                <p className="text-sm text-foreground">
                  <span className="font-mono">v{v.version}</span> — {v.summary}
                </p>
                <p className="text-xs text-foreground-muted">
                  {formatDateTime(v.changedAt)} {v.changedByName && `· ${t("caseFileScreen.versions.by")} ${v.changedByName}`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewing(v.version)}>
                {t("caseFileScreen.versions.view")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>v{viewing}</DialogTitle>
            <DialogDescription>{version.data?.summary}</DialogDescription>
          </DialogHeader>
          {version.isPending ? (
            <Loading />
          ) : version.isError ? (
            <p className="text-sm text-danger">{version.error.message}</p>
          ) : (
            <div className="space-y-2 text-sm" data-testid="version-snapshot">
              <p>
                {version.data.snapshot?.entries.length ?? 0} {t("caseFileScreen.versions.documents")} ·{" "}
                {version.data.snapshot?.charges.length ?? 0} {t("caseFileScreen.versions.charges")} ·{" "}
                {version.data.snapshot?.witnessFacts.length ?? 0} {t("caseFileScreen.versions.facts")}
              </p>
              <ol className="list-decimal space-y-0.5 pl-5">
                {(version.data.snapshot?.entries ?? []).map((e) => (
                  <li key={e.id}>
                    {e.title} <span className="text-xs text-foreground-muted">({t(`caseFileScreen.category.${e.category}`)})</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewing(null)}>{t("caseFileScreen.versions.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

/* ----------------------------------- packs ----------------------------------- */

function PacksTab({ file, canBuild, canDecide, userId }: { file: CaseFile; canBuild: boolean; canDecide: boolean; userId?: string }) {
  const { t } = useI18n();
  const packs = usePacks(file.id);
  const submit = useSubmitPack(file.id);
  const decide = useDecidePack(file.id);
  const [confirming, setConfirming] = React.useState(false);
  const [returning, setReturning] = React.useState<CaseFilePack | null>(null);
  const [reason, setReason] = React.useState("");
  const [viewing, setViewing] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    }
  };

  return (
    <Panel
      title={t("caseFileScreen.tabs.packs")}
      description={t("caseFileScreen.packs.intro")}
      actions={
        canBuild ? (
          <Button onClick={() => setConfirming(true)}>
            <FileLock2 className="h-4 w-4" />
            {t("caseFileScreen.packs.submit")}
          </Button>
        ) : undefined
      }
    >
      {error && <p className="mb-3 text-sm text-danger" role="alert">{error}</p>}
      {packs.isPending ? (
        <Loading />
      ) : packs.isError ? (
        <LoadError error={packs.error} retry={() => packs.refetch()} />
      ) : packs.data.length === 0 ? (
        <EmptyState title={t("caseFileScreen.packs.empty")} icon={FileLock2} />
      ) : (
        <ul className="space-y-3">
          {packs.data.map((p) => (
            <li key={p.id} className="rounded-md border border-border p-3" data-testid="pack-row" data-status={p.status}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-sm font-semibold">{p.packNumber}</p>
                <StatusPill tone={p.status === "APPROVED" ? "success" : p.status === "RETURNED" ? "warning" : "info"}>
                  {t(`caseFileScreen.status.${p.status}`)}
                </StatusPill>
                {p.blockingFindings > 0 && (
                  <StatusPill tone="danger">
                    {p.blockingFindings} {t("caseFileScreen.packs.blocking")}
                  </StatusPill>
                )}
                {p.stale && <span className="text-xs text-warning">{t("caseFileScreen.packs.stale")}</span>}
              </div>
              <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
                <p>{t("caseFileScreen.packs.frozenAt")}: v{p.fileVersion}</p>
                <p>{t("caseFileScreen.packs.submittedBy")}: {p.submittedByName} · {formatDateTime(p.submittedAt)}</p>
                {p.decidedAt && <p>{t("caseFileScreen.packs.decidedBy")}: {p.decidedByName} · {formatDateTime(p.decidedAt)}</p>}
              </div>
              <p className="mt-1 break-all font-mono text-xs text-foreground-muted">
                {t("caseFileScreen.packs.manifestHash")}: {p.manifestSha256}
              </p>
              {p.returnReason && <p className="mt-1 text-sm text-warning">{p.returnReason}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => setViewing(p.id)}>
                  {t("caseFileScreen.packs.viewManifest")}
                </Button>
                {p.status === "SUBMITTED" && canDecide && p.submittedBy !== userId && (
                  <>
                    <Button size="sm" disabled={decide.isPending} onClick={() => run(() => decide.mutateAsync({ packId: p.id, approve: true }))}>
                      {t("caseFileScreen.packs.approve")}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setReason(""); setReturning(p); }}>
                      {t("caseFileScreen.packs.return")}
                    </Button>
                  </>
                )}
                {p.status === "SUBMITTED" && canDecide && p.submittedBy === userId && (
                  <span className="text-xs text-foreground-muted">{t("caseFileScreen.packs.selfNote")}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("caseFileScreen.packs.submit")}</DialogTitle>
            <DialogDescription>{t("caseFileScreen.packs.submitConfirm", { version: file.version })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirming(false)}>{t("caseFileScreen.packs.cancel")}</Button>
            <Button
              disabled={submit.isPending}
              onClick={async () => {
                const ok = await run(() => submit.mutateAsync());
                if (ok) setConfirming(false);
                else setConfirming(false);
              }}
            >
              {t("caseFileScreen.packs.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={returning !== null} onOpenChange={(o) => !o && setReturning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("caseFileScreen.packs.return")}</DialogTitle>
            <DialogDescription>{returning?.packNumber}</DialogDescription>
          </DialogHeader>
          <Textarea label={t("caseFileScreen.packs.returnReason")} value={reason} onChange={(v: string) => setReason(v)} rows={3} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setReturning(null)}>{t("caseFileScreen.packs.cancel")}</Button>
            <Button
              disabled={decide.isPending}
              onClick={async () => {
                if (!returning) return;
                const ok = await run(() => decide.mutateAsync({ packId: returning.id, approve: false, reason }));
                if (ok) setReturning(null);
              }}
            >
              {t("caseFileScreen.packs.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewing && <ManifestDialog file={file} packId={viewing} onClose={() => setViewing(null)} />}
    </Panel>
  );
}

function ManifestDialog({ file, packId, onClose }: { file: CaseFile; packId: string; onClose: () => void }) {
  const { t } = useI18n();
  const pack = usePack(file.id, packId);
  const [computed, setComputed] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (pack.data?.manifestJson) sha256Hex(pack.data.manifestJson).then(setComputed);
  }, [pack.data?.manifestJson]);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{pack.data?.packNumber}</DialogTitle>
          <DialogDescription className="break-all font-mono text-xs">
            {t("caseFileScreen.packs.manifestHash")}: {pack.data?.manifestSha256}
          </DialogDescription>
        </DialogHeader>
        {pack.isPending ? (
          <Loading />
        ) : pack.isError ? (
          <p className="text-sm text-danger">{pack.error.message}</p>
        ) : (
          <>
            {computed && (
              <p className={`text-sm ${computed === pack.data.manifestSha256 ? "text-success" : "text-danger"}`} data-testid="manifest-check">
                {t("caseFileScreen.packs.hashCheck")} {computed.slice(0, 16)}… —{" "}
                {computed === pack.data.manifestSha256 ? t("caseFileScreen.packs.hashMatches") : t("caseFileScreen.packs.hashDiffers")}
              </p>
            )}
            <pre className="max-h-96 overflow-auto rounded-md bg-surface-sunken p-3 text-xs" lang="en" data-testid="manifest-json">
              {pack.data.manifestJson}
            </pre>
          </>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>{t("caseFileScreen.packs.close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
