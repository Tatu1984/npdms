"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ClipboardCheck, FileSearch, FileText, Info, Layers, Plus, Search, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { DataTable, type Column } from "@/components/platform/data-table";
import { EmptyState, PageHeader, PhaseBadge, StatTile, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import knowledgeApi, { DOC_TYPES, type DocStatus, type DocType, type KnowledgeSearchHit } from "@/lib/api/knowledge";
import {
  useChecklists,
  useCreateChecklist,
  useKnowledgeCapabilities,
  useKnowledgeSearch,
  useKnowledgeStats,
  useUploadDocument,
} from "@/hooks/use-knowledge";
import {
  ClassificationPill,
  DocumentDialog,
  ExtractionPill,
  Snippet,
  StatusBadge,
  docTitle,
  selectClass,
  useOfficer,
} from "./shared";

const PAGE_SIZE = 20;

export default function KnowledgePage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const officer = useOfficer();

  const [tab, setTab] = React.useState("library");
  const [queryText, setQueryText] = React.useState("");
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<DocType | "">("");
  const [status, setStatus] = React.useState<DocStatus | "">("");
  const [page, setPage] = React.useState(1);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [checklistOpen, setChecklistOpen] = React.useState(false);

  // Debounce typing so a search is one request, not one per keystroke.
  React.useEffect(() => {
    const id = setTimeout(() => {
      setQ(queryText.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [queryText]);

  const search = useKnowledgeSearch({ q, type: type || undefined, status: status || undefined, page, pageSize: PAGE_SIZE });
  const stats = useKnowledgeStats();
  const caps = useKnowledgeCapabilities();
  const upload = useUploadDocument();

  const columns: Column<KnowledgeSearchHit>[] = [
    {
      id: "document",
      header: t("knowledgeScreen.columns.document"),
      cell: (d) => (
        <div className="min-w-0 max-w-xl">
          <p className="truncate text-sm font-medium text-foreground">{docTitle(d, locale)}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
            {d.documentNumber}
            {d.referenceNumber ? ` · ${d.referenceNumber}` : ""} · {d.issuingAuthority}
          </p>
          {q && d.matchedIn.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {d.matchedIn.map((m) => (
                <StatusPill key={m} tone="info">
                  {t(
                    m === "title"
                      ? "knowledgeScreen.search.matchedTitle"
                      : m === "text"
                        ? "knowledgeScreen.search.matchedText"
                        : "knowledgeScreen.search.matchedMetadata",
                  )}
                </StatusPill>
              ))}
            </div>
          )}
          {q && <Snippet text={d.snippet} />}
        </div>
      ),
    },
    {
      id: "type",
      header: t("knowledgeScreen.columns.type"),
      hideBelow: "sm",
      cell: (d) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill>{t(`knowledgeScreen.types.${d.docType}`)}</StatusPill>
          <StatusBadge value={d.status} />
        </div>
      ),
    },
    {
      id: "issued",
      header: t("knowledgeScreen.columns.issued"),
      hideBelow: "md",
      cell: (d) => <span className="tabular text-sm">{d.issuedOn.slice(0, 10)}</span>,
    },
    {
      id: "classification",
      header: t("knowledgeScreen.columns.classification"),
      hideBelow: "lg",
      cell: (d) => <ClassificationPill value={d.classification} />,
    },
    {
      id: "text",
      header: t("knowledgeScreen.columns.text"),
      hideBelow: "lg",
      cell: (d) => <ExtractionPill value={d.extractionStatus} />,
    },
  ];

  const rows = search.data?.data ?? [];
  const total = search.data?.total ?? 0;
  const totalPages = search.data?.totalPages ?? 0;
  const filtered = Boolean(q || type || status);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.knowledge")}
          description={t("knowledgeScreen.header.description")}
          icon={Search}
          badge={<PhaseBadge phase={11} />}
          breadcrumb={[{ label: t("nav.knowledgeGroup") }, { label: t("modules.knowledge") }]}
          actions={
            officer.canFile ? (
              <Button
                onClick={() => {
                  setUploadError(null);
                  setUploadOpen(true);
                }}
              >
                <Upload className="h-4 w-4" />
                {t("knowledgeScreen.header.add")}
              </Button>
            ) : undefined
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label={t("knowledgeScreen.stats.effective")} value={stats.data?.effective ?? 0} icon={BookOpen} tone="success" />
          <StatTile label={t("knowledgeScreen.stats.superseded")} value={stats.data?.superseded ?? 0} icon={Layers} tone="warning" />
          <StatTile label={t("knowledgeScreen.stats.textSearchable")} value={stats.data?.textSearchable ?? 0} icon={FileSearch} />
          <StatTile label={t("knowledgeScreen.stats.metadataOnly")} value={stats.data?.metadataOnly ?? 0} icon={FileText} />
        </div>

        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("knowledgeScreen.answering.title")}</AlertTitle>
          <AlertDescription>{t("knowledgeScreen.answering.body")}</AlertDescription>
        </Alert>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="library">{t("knowledgeScreen.tabs.library")}</TabsTrigger>
            <TabsTrigger value="checklists">{t("knowledgeScreen.tabs.checklists")}</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex flex-col gap-3 pt-3">
            <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
              <Input
                id="kd-search"
                aria-label={t("knowledgeScreen.search.placeholder")}
                placeholder={t("knowledgeScreen.search.placeholder")}
                value={queryText}
                onChange={setQueryText}
                icon={<Search className="h-4 w-4" />}
              />
              <select
                aria-label={t("knowledgeScreen.columns.type")}
                className={selectClass}
                value={type}
                onChange={(e) => {
                  setType(e.target.value as DocType | "");
                  setPage(1);
                }}
              >
                <option value="">{t("knowledgeScreen.search.allTypes")}</option>
                {DOC_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {t(`knowledgeScreen.types.${d}`)}
                  </option>
                ))}
              </select>
              <select
                aria-label={t("knowledgeScreen.search.allStatuses")}
                className={selectClass}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as DocStatus | "");
                  setPage(1);
                }}
              >
                <option value="">{t("knowledgeScreen.search.allStatuses")}</option>
                {(["EFFECTIVE", "SUPERSEDED", "WITHDRAWN"] as DocStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {t(`knowledgeScreen.statuses.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            {caps.data && (
              <p className="text-xs text-foreground-subtle">
                <span className="font-medium">{t("knowledgeScreen.search.howItWorks")}:</span> {caps.data.searchNote}
              </p>
            )}

            {search.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : search.isError ? (
              <Alert variant="danger">
                <AlertTitle>{t("knowledgeScreen.errors.load")}</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span>{(search.error as Error).message}</span>
                  <Button variant="outline" size="sm" onClick={() => search.refetch()}>
                    {t("knowledgeScreen.errors.retry")}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                title={t(filtered ? "knowledgeScreen.search.empty" : "knowledgeScreen.search.emptyRepository")}
                description={t(filtered ? "knowledgeScreen.search.emptyHint" : "knowledgeScreen.search.emptyRepositoryHint")}
              />
            ) : (
              <>
                <p className="text-xs text-foreground-muted">{t("knowledgeScreen.search.results", { count: total })}</p>
                <DataTable rows={rows} columns={columns} rowKey={(d) => d.id} rowHref={(d) => `/knowledge/${d.id}`} searchable={false} />
                {totalPages > 1 && (
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      ‹
                    </Button>
                    <span className="tabular text-xs text-foreground-muted">
                      {page} / {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      ›
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="checklists" className="pt-3">
            <ChecklistsTab canCreate={officer.canFile} onCreate={() => setChecklistOpen(true)} />
          </TabsContent>
        </Tabs>
      </div>

      <DocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        submitting={upload.isPending}
        error={uploadError}
        onSubmit={(input, file) => {
          setUploadError(null);
          upload.mutate(
            { input, file },
            {
              onSuccess: (doc) => {
                setUploadOpen(false);
                toast.success(t("knowledgeScreen.upload.filed", { number: doc.documentNumber }), doc.extractionNote);
                router.push(`/knowledge/${doc.id}`);
              },
              onError: (e) => setUploadError((e as Error).message),
            },
          );
        }}
      />

      <ChecklistDialog open={checklistOpen} onOpenChange={setChecklistOpen} />
    </DashboardLayout>
  );
}

function ChecklistsTab({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  const { t, locale } = useI18n();
  const checklists = useChecklists();
  const list = checklists.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      {canCreate && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            {t("knowledgeScreen.checklists.create")}
          </Button>
        </div>
      )}
      {checklists.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : checklists.isError ? (
        <Alert variant="danger">
          <AlertTitle>{t("knowledgeScreen.errors.load")}</AlertTitle>
          <AlertDescription>{(checklists.error as Error).message}</AlertDescription>
        </Alert>
      ) : list.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title={t("knowledgeScreen.checklists.empty")} description={t("knowledgeScreen.checklists.emptyHint")} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/knowledge/checklists/${c.id}`}
              className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
            >
              <p className="text-sm font-medium text-foreground">{locale === "bn" && c.titleBn ? c.titleBn : c.title}</p>
              <p className="mt-1 text-xs text-foreground-muted">
                {t("knowledgeScreen.checklists.follows", { number: c.documentNumber, section: c.sectionRef })}
              </p>
              <div className="mt-2 flex gap-2">
                <StatusPill>{t("knowledgeScreen.checklists.stepsCount", { count: c.steps.length })}</StatusPill>
                {c.documentStatus !== "EFFECTIVE" && <StatusBadge value={c.documentStatus} />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const create = useCreateChecklist();
  const [docQuery, setDocQuery] = React.useState("");
  const [docs, setDocs] = React.useState<KnowledgeSearchHit[]>([]);
  const [source, setSource] = React.useState<KnowledgeSearchHit | null>(null);
  const [sectionRef, setSectionRef] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [titleBn, setTitleBn] = React.useState("");
  const [steps, setSteps] = React.useState([{ text: "", textBn: "" }]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setDocQuery("");
    setSource(null);
    setSectionRef("");
    setTitle("");
    setTitleBn("");
    setSteps([{ text: "", textBn: "" }]);
    setError(null);
  }, [open]);

  // Only effective documents can carry a checklist, so only those are offered.
  React.useEffect(() => {
    if (!open || source) return;
    const id = setTimeout(() => {
      knowledgeApi
        .search({ q: docQuery.trim() || undefined, status: "EFFECTIVE", pageSize: 8 })
        .then((r) => setDocs(r.data))
        .catch((e) => setError((e as Error).message));
    }, 300);
    return () => clearTimeout(id);
  }, [docQuery, open, source]);

  const submit = () => {
    if (!source) {
      setError(t("knowledgeScreen.checklists.sourcePlaceholder"));
      return;
    }
    setError(null);
    create.mutate(
      { documentId: source.id, sectionRef, title, titleBn, steps },
      {
        onSuccess: (c) => {
          onOpenChange(false);
          toast.success(t("knowledgeScreen.checklists.created"), c.title);
          router.push(`/knowledge/checklists/${c.id}`);
        },
        onError: (e) => setError((e as Error).message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("knowledgeScreen.checklists.createTitle")}</DialogTitle>
          <DialogDescription>{t("knowledgeScreen.checklists.createDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <Label>{t("knowledgeScreen.checklists.source")}</Label>
            {source ? (
              <div className="mt-1 flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <span className="truncate text-sm">
                  {source.documentNumber} — {source.title}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSource(null)}>
                  {t("knowledgeScreen.checklists.changeSource")}
                </Button>
              </div>
            ) : (
              <div className="mt-1 flex flex-col gap-2">
                <Input
                  id="cl-doc-search"
                  placeholder={t("knowledgeScreen.checklists.sourcePlaceholder")}
                  value={docQuery}
                  onChange={setDocQuery}
                  icon={<Search className="h-4 w-4" />}
                />
                <div className="max-h-40 overflow-y-auto rounded-md border border-border">
                  {docs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-background-tertiary"
                      onClick={() => setSource(d)}
                    >
                      <span className="font-mono text-xs text-foreground-subtle">{d.documentNumber}</span> {d.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Input
            id="cl-section"
            label={t("knowledgeScreen.checklists.section")}
            placeholder={t("knowledgeScreen.checklists.sectionPlaceholder")}
            value={sectionRef}
            onChange={setSectionRef}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="cl-title" label={t("knowledgeScreen.checklists.titleEn")} value={title} onChange={setTitle} />
            <Input id="cl-title-bn" label={t("knowledgeScreen.checklists.titleBn")} value={titleBn} onChange={setTitleBn} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("knowledgeScreen.checklists.steps")}</Label>
            {steps.map((s, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <Input
                  id={`cl-step-${i + 1}`}
                  placeholder={t("knowledgeScreen.checklists.stepPlaceholder", { n: i + 1 })}
                  value={s.text}
                  onChange={(v) => setSteps((all) => all.map((x, j) => (j === i ? { ...x, text: v } : x)))}
                />
                <Input
                  id={`cl-step-bn-${i + 1}`}
                  placeholder={t("knowledgeScreen.checklists.stepBnPlaceholder", { n: i + 1 })}
                  value={s.textBn}
                  onChange={(v) => setSteps((all) => all.map((x, j) => (j === i ? { ...x, textBn: v } : x)))}
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setSteps((all) => [...all, { text: "", textBn: "" }])}
            >
              <Plus className="h-4 w-4" />
              {t("knowledgeScreen.checklists.addStep")}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="danger">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {t("knowledgeScreen.checklists.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
