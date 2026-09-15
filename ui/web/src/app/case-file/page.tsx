"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Gavel, Search, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { act } from "@/components/platform/actions";
import { EmptyState, PageHeader, Panel, PhaseBadge, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCaseFiles, useCreateCaseFile } from "@/hooks/use-case-files";
import investigationApi from "@/lib/api/investigation";
import type { CaseFileStatus } from "@/lib/api/case-files";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { formatDate } from "@/lib/utils";
import { STATUS_TONE } from "./shared";

const PAGE_SIZE = 20;

export default function CaseFileIndexPage() {
  const router = useRouter();
  const { t, pick } = useI18n();
  const user = useAuthStore((s) => s.user);
  const canBuild = Boolean(user && hasMinimumRole(user.role, "SI"));

  const [search, setSearch] = React.useState("");
  const deferred = React.useDeferredValue(search.trim());
  const [status, setStatus] = React.useState<CaseFileStatus | "">("");
  const [page, setPage] = React.useState(1);
  const files = useCaseFiles({ search: deferred || undefined, status: status || undefined, page, pageSize: PAGE_SIZE });

  const [creating, setCreating] = React.useState(false);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.caseFile")}
          description={t("modules.caseFileDesc")}
          icon={BookOpenCheck}
          badge={<PhaseBadge phase={12} />}
          breadcrumb={[{ label: t("nav.investigationGroup") }, { label: t("modules.caseFile") }]}
          actions={
            canBuild ? (
              <Button onClick={() => setCreating(true)}>
                <BookOpenCheck className="h-4 w-4" />
                {t("caseFileScreen.list.open")}
              </Button>
            ) : undefined
          }
          menu={[
            act.link("investigation", "Investigation workspaces", "/investigation", { icon: BookOpenCheck }),
            act.link("custody", "Evidence register", "/custody", { icon: ShieldCheck }),
            act.link("court", "Court diary", "/court", { icon: Gavel }),
          ]}
        />

        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[16rem] flex-1">
              <Input
                aria-label={t("caseFileScreen.list.search")}
                placeholder={t("caseFileScreen.list.search")}
                value={search}
                onChange={(v: string) => {
                  setSearch(v);
                  setPage(1);
                }}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <select
              aria-label={t("caseFileScreen.list.stage")}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as CaseFileStatus | "");
                setPage(1);
              }}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="">{t("caseFileScreen.list.allStatuses")}</option>
              {(["DRAFT", "SUBMITTED", "APPROVED", "RETURNED"] as CaseFileStatus[]).map((s) => (
                <option key={s} value={s}>
                  {t(`caseFileScreen.status.${s}`)}
                </option>
              ))}
            </select>
          </div>
        </Panel>

        {files.isPending ? (
          <Panel>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Panel>
        ) : files.isError ? (
          <Alert variant="danger">
            <AlertTitle>{t("caseFileScreen.list.loadFailed")}</AlertTitle>
            <AlertDescription>
              {files.error.message}{" "}
              <Button variant="link" className="h-auto p-0" onClick={() => files.refetch()}>
                {t("caseFileScreen.list.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : files.data.data.length === 0 ? (
          <Panel>
            <EmptyState title={t("caseFileScreen.list.empty")} description={t("caseFileScreen.list.emptyHint")} icon={BookOpenCheck} />
          </Panel>
        ) : (
          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="case-file-table">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                    <th className="py-2 pr-3">{t("caseFileScreen.list.files")}</th>
                    <th className="py-2 pr-3">{t("caseFileScreen.list.io")}</th>
                    <th className="py-2 pr-3">{t("caseFileScreen.list.documents")}</th>
                    <th className="py-2 pr-3">{t("caseFileScreen.list.version")}</th>
                    <th className="py-2 pr-3">{t("caseFileScreen.list.stage")}</th>
                    <th className="py-2">{t("caseFileScreen.list.updated")}</th>
                  </tr>
                </thead>
                <tbody>
                  {files.data.data.map((f) => (
                    <tr key={f.id} className="border-b border-border last:border-0 hover:bg-surface-sunken">
                      <td className="py-2.5 pr-3">
                        <Link href={`/case-file/${f.id}`} className="font-medium text-foreground hover:underline">
                          {f.titleBn ? pick({ en: f.title, bn: f.titleBn }) : f.title}
                        </Link>
                        <p className="font-mono text-xs text-foreground-subtle">
                          {f.fileNumber} · {f.caseNumber}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3">{f.ioName || "—"}</td>
                      <td className="py-2.5 pr-3 tabular">{f.entryCount}</td>
                      <td className="py-2.5 pr-3 tabular">v{f.version}</td>
                      <td className="py-2.5 pr-3">
                        <StatusPill tone={STATUS_TONE[f.status]}>{t(`caseFileScreen.status.${f.status}`)}</StatusPill>
                        {f.stale && <p className="mt-1 text-xs text-warning">{t("caseFileScreen.list.staleNote")}</p>}
                      </td>
                      <td className="py-2.5 text-foreground-muted">{formatDate(f.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {files.data.totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-sm text-foreground-muted">
                <span>
                  {page} / {files.data.totalPages} · {files.data.total}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    ‹
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= files.data.totalPages} onClick={() => setPage(page + 1)}>
                    ›
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        )}
      </div>

      <CreateCaseFileDialog open={creating} onOpenChange={setCreating} onCreated={(id) => router.push(`/case-file/${id}`)} />
    </DashboardLayout>
  );
}

function CreateCaseFileDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const { t, pick } = useI18n();
  const [query, setQuery] = React.useState("");
  const deferred = React.useDeferredValue(query.trim());
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const create = useCreateCaseFile();
  const workspaces = useQuery({
    queryKey: ["investigation", "picker", deferred],
    queryFn: () => investigationApi.list({ search: deferred || undefined, pageSize: 8 }),
    enabled: open,
  });

  const close = () => {
    setQuery("");
    setWorkspaceId("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("caseFileScreen.create.title")}</DialogTitle>
          <DialogDescription>{t("caseFileScreen.create.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            label={t("caseFileScreen.create.investigation")}
            placeholder={t("caseFileScreen.create.searchInvestigation")}
            value={query}
            onChange={(v: string) => setQuery(v)}
            icon={<Search className="h-4 w-4" />}
          />
          <div className="max-h-56 overflow-y-auto rounded-md border border-border" role="listbox">
            {workspaces.isPending ? (
              <p className="p-3 text-sm text-foreground-muted">…</p>
            ) : workspaces.isError ? (
              <p className="p-3 text-sm text-danger">{workspaces.error.message}</p>
            ) : (workspaces.data?.data ?? []).length === 0 ? (
              <p className="p-3 text-sm text-foreground-muted">{t("caseFileScreen.create.noMatch")}</p>
            ) : (
              (workspaces.data?.data ?? []).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  role="option"
                  aria-selected={workspaceId === w.id}
                  onClick={() => setWorkspaceId(w.id)}
                  className={`block w-full border-b border-border p-3 text-left last:border-0 hover:bg-surface-sunken ${
                    workspaceId === w.id ? "bg-surface-sunken" : ""
                  }`}
                >
                  <span className="block font-mono text-xs text-foreground-subtle">{w.caseNumber}</span>
                  <span className="block text-sm text-foreground">{w.titleBn ? pick({ en: w.title, bn: w.titleBn }) : w.title}</span>
                </button>
              ))
            )}
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={close}>
            {t("caseFileScreen.create.cancel")}
          </Button>
          <Button
            disabled={!workspaceId || create.isPending}
            onClick={async () => {
              setError(null);
              try {
                const cf = await create.mutateAsync(workspaceId);
                close();
                onCreated(cf.id);
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              }
            }}
          >
            {t("caseFileScreen.create.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
