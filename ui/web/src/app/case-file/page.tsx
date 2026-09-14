"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, ChevronRight, FileWarning, Gavel, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { CASE_FILE_DOCS, WORKSPACES, type Workspace } from "@/lib/platform/mock";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, type Action } from "@/components/platform/actions";
import { PageHeader, PhaseBadge, StatTile, StatusPill } from "@/components/platform/primitives";
import { AIGovernanceNotice } from "@/components/platform/governance";
import { Button } from "@/components/ui/button";

export default function CaseFileIndexPage() {
  const router = useRouter();
  const { t, pick } = useI18n();

  const openIssues = CASE_FILE_DOCS.filter((d) => d.issues.length > 0).length;

  const columns: Column<Workspace>[] = [
    {
      id: "case",
      header: "Case",
      sortValue: (w) => w.caseNumber,
      cell: (w) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{pick(w.title)}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">{w.caseNumber}</p>
        </div>
      ),
    },
    {
      id: "court",
      header: "Next court date",
      hideBelow: "sm",
      sortValue: (w) => w.nextCourtDate ?? "9999",
      cell: (w) =>
        w.nextCourtDate ? (
          <span className="text-sm text-warning">{w.nextCourtDate}</span>
        ) : (
          <span className="text-xs text-foreground-subtle">Not listed</span>
        ),
    },
    {
      id: "io",
      header: "Investigating officer",
      hideBelow: "lg",
      sortValue: (w) => w.io.en,
      cell: (w) => <span className="text-sm">{pick(w.io)}</span>,
    },
    {
      id: "readiness",
      header: "Court readiness",
      sortValue: (w) => w.progress,
      cell: (w) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full"
              style={{
                width: `${w.progress}%`,
                background:
                  w.progress > 85 ? "var(--success)" : w.progress > 60 ? "var(--warning)" : "var(--danger)",
              }}
            />
          </div>
          <span className="tabular text-xs text-foreground-muted">{w.progress}%</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Stage",
      sortValue: (w) => w.status,
      cell: (w) => (
        <StatusPill tone={w.status === "chargesheet" ? "success" : "info"}>{w.status}</StatusPill>
      ),
    },
  ];

  const rowActions = (w: Workspace): Action[] => [
    act.label("h", w.caseNumber),
    act.link("open", "Open case file", `/case-file/${w.id}`, { icon: BookOpenCheck }),
    act.link("matrix", "Evidence matrix", `/case-file/${w.id}?tab=evidence`, { icon: ShieldCheck }),
    act.link("completeness", "Completeness check", `/case-file/${w.id}?tab=completeness`, {
      icon: FileWarning,
    }),
    act.sep("s"),
    act.link("investigation", "Investigation workspace", `/investigation/${w.id}`, {
      icon: BookOpenCheck,
    }),
    act.link("court", "Court diary", "/court", { icon: Gavel }),
  ];

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
            <Button onClick={() => router.push(`/case-file/${WORKSPACES[0].id}`)}>
              <BookOpenCheck className="h-4 w-4" />
              Open a case file
              <ChevronRight className="h-4 w-4" />
            </Button>
          }
          menu={[
            act.link("court", "Court diary", "/court", { icon: Gavel }),
            act.link("investigation", "Investigation workspaces", "/investigation", {
              icon: BookOpenCheck,
            }),
            act.link("custody", "Evidence ledger", "/custody", { icon: ShieldCheck }),
          ]}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Case files" value={WORKSPACES.length} icon={BookOpenCheck} />
          <StatTile
            label="Listed for hearing"
            value={WORKSPACES.filter((w) => w.nextCourtDate).length}
            icon={Gavel}
            tone="warning"
          />
          <StatTile label="Documents with issues" value={openIssues} icon={FileWarning} tone="danger" />
          <StatTile
            label="Ready for submission"
            value={WORKSPACES.filter((w) => w.progress > 85).length}
            icon={ShieldCheck}
            tone="success"
          />
        </div>

        <AIGovernanceNotice />

        <DataTable
          rows={WORKSPACES}
          columns={columns}
          rowKey={(w) => w.id}
          rowHref={(w) => `/case-file/${w.id}`}
          rowActions={rowActions}
          searchPlaceholder="Search by case number, title or officer…"
        />
      </div>
    </DashboardLayout>
  );
}
