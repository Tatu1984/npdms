"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  ClipboardList,
  FolderPlus,
  GitCompareArrows,
  ListChecks,
  Plus,
  ScanSearch,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { bilingual, type Workspace } from "@/lib/api/investigation";
import { useCreateWorkspace, useUpdateWorkspace, useWorkspaces } from "@/hooks/use-investigation";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, type Action } from "@/components/platform/actions";
import {
  EmptyState,
  PageHeader,
  PhaseBadge,
  SeverityBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { AIGovernanceNotice } from "@/components/platform/governance";
import { Button } from "@/components/ui/button";
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
import { OfficerPicker } from "@/components/platform/pickers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const STATUS_TONE = {
  active: "info",
  chargesheet: "success",
  "supervisory-review": "warning",
  closed: "neutral",
} as const;


export default function InvestigationPage() {
  const router = useRouter();
  const { t, pick } = useI18n();

  const { data, isLoading, isError, error, refetch } = useWorkspaces({ pageSize: 100 });
  const createWorkspace = useCreateWorkspace();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [assignFor, setAssignFor] = React.useState<Workspace | null>(null);

  const workspaces = data?.data ?? [];

  const totals = React.useMemo(
    () =>
      workspaces.reduce(
        (acc, w) => ({
          contradictions: acc.contradictions + w.counts.contradictions,
          gaps: acc.gaps + w.counts.gaps,
          tasks: acc.tasks + w.counts.openTasks,
        }),
        { contradictions: 0, gaps: 0, tasks: 0 },
      ),
    [workspaces],
  );

  const columns: Column<Workspace>[] = [
    {
      id: "case",
      header: t("investigationScreen.list.colCase"),
      sortValue: (w) => w.caseNumber,
      cell: (w) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {pick(bilingual(w.title, w.titleBn))}
          </p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
            {w.caseNumber}
            {w.firNumber ? ` · ${w.firNumber}` : ""}
          </p>
        </div>
      ),
    },
    {
      id: "sections",
      header: t("investigationScreen.list.colProvisions"),
      hideBelow: "lg",
      sortValue: (w) => w.sections.join(" "),
      cell: (w) => (
        <div className="flex flex-wrap gap-1">
          {w.sections.length === 0 ? (
            <span className="text-xs text-foreground-subtle">—</span>
          ) : (
            w.sections.map((s) => (
              <span
                key={s}
                className="rounded border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.65rem] text-foreground-muted"
              >
                {s}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      id: "io",
      header: t("investigationScreen.list.colIo"),
      hideBelow: "md",
      sortValue: (w) => w.ioName ?? "",
      cell: (w) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{w.ioName || t("investigationScreen.list.unassigned")}</p>
          {w.stationName && (
            <p className="truncate text-xs text-foreground-subtle">{w.stationName}</p>
          )}
        </div>
      ),
    },
    {
      id: "signals",
      header: t("investigationScreen.list.colOpenItems"),
      sortValue: (w) => w.counts.contradictions * 10 + w.counts.gaps,
      cell: (w) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {w.counts.contradictions > 0 && (
            <StatusPill tone="danger">
              <GitCompareArrows className="h-3 w-3" />
              {w.counts.contradictions}
            </StatusPill>
          )}
          {w.counts.gaps > 0 && (
            <StatusPill tone="warning">
              <ScanSearch className="h-3 w-3" />
              {w.counts.gaps}
            </StatusPill>
          )}
          {w.counts.openTasks > 0 && (
            <StatusPill tone="info">
              <ListChecks className="h-3 w-3" />
              {w.counts.openTasks}
            </StatusPill>
          )}
          {w.counts.contradictions + w.counts.gaps + w.counts.openTasks === 0 && (
            <span className="text-xs text-foreground-subtle">{t("investigationScreen.list.none")}</span>
          )}
        </div>
      ),
    },
    {
      id: "progress",
      header: t("investigationScreen.list.colProgress"),
      sortValue: (w) => w.progress,
      cell: (w) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full rounded-full bg-accent" style={{ width: `${w.progress}%` }} />
          </div>
          <span className="tabular text-xs text-foreground-muted">{w.progress}%</span>
        </div>
      ),
    },
    {
      id: "status",
      header: t("investigationScreen.list.colStatus"),
      sortValue: (w) => w.status,
      cell: (w) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill tone={STATUS_TONE[w.status]}>{t(`investigationScreen.status.${w.status}`)}</StatusPill>
          <SeverityBadge level={w.priority} />
        </div>
      ),
    },
  ];

  const rowActions = (w: Workspace): Action[] => [
    act.label("hdr", w.caseNumber),
    act.link("open", t("investigationScreen.list.openWorkspace"), `/investigation/${w.id}`, { icon: Brain }),
    act.link("timeline", t("investigationScreen.list.caseTimeline"), `/investigation/${w.id}?tab=timeline`, {
      icon: ClipboardList,
      description: t("investigationScreen.list.nEntries", { n: w.counts.timeline }),
    }),
    act.link("contradictions", t("investigationScreen.list.contradictions"), `/investigation/${w.id}?tab=contradictions`, {
      icon: GitCompareArrows,
      description: t("investigationScreen.list.nRecorded", { n: w.counts.contradictions }),
    }),
    act.link("gaps", t("investigationScreen.list.investigationGaps"), `/investigation/${w.id}?tab=gaps`, {
      icon: ScanSearch,
      description: t("investigationScreen.list.nOpen", { n: w.counts.gaps }),
    }),
    act.sep("s1"),
    act.link("evidence", t("investigationScreen.list.linkedEvidence"), `/investigation/${w.id}?tab=evidence`, {
      icon: ClipboardList,
      description: t("investigationScreen.list.nItems", { n: w.counts.evidence }),
    }),
    act.run("assign", t("investigationScreen.list.reassignOfficer"), () => setAssignFor(w), { icon: Users }),
    act.sep("s2"),
    act.link("casefile", t("investigationScreen.list.caseFile"), `/case-file/${w.id}`, {
      icon: ClipboardList,
    }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.investigation")}
          description={t("modules.investigationDesc")}
          icon={Brain}
          badge={<PhaseBadge phase={1} />}
          breadcrumb={[
            { label: t("nav.investigationGroup") },
            { label: t("modules.investigation") },
          ]}
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("investigationScreen.list.newWorkspace")}
            </Button>
          }
          menu={[
            act.link("casefiles", t("investigationScreen.list.caseFiles"), "/case-file", { icon: ClipboardList }),
            act.link("audit", t("investigationScreen.list.auditTrail"), "/audit", { icon: ClipboardList }),
          ]}
        />

        <AIGovernanceNotice />

        {isError && (
          <Alert variant="danger">
            <ScanSearch />
            <div>
              <AlertTitle>{t("investigationScreen.list.couldNotLoad")}</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : t("investigationScreen.list.apiNoResponse")}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                  {t("common.retry")}
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label={t("investigationScreen.list.activeWorkspaces")}
            value={workspaces.filter((w) => w.status !== "closed").length}
            icon={Brain}
            tone="info"
          />
          <StatTile
            label={t("investigationScreen.list.recordedContradictions")}
            value={totals.contradictions}
            icon={GitCompareArrows}
            tone="danger"
            deltaLabel={t("investigationScreen.list.awaitingDecision")}
          />
          <StatTile
            label={t("investigationScreen.list.openGaps")}
            value={totals.gaps}
            icon={ScanSearch}
            tone="warning"
            deltaLabel={t("investigationScreen.list.identifiedByRules")}
          />
          <StatTile
            label={t("investigationScreen.list.openTasks")}
            value={totals.tasks}
            icon={ListChecks}
            deltaLabel={t("investigationScreen.list.assignedToOfficers")}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <EmptyState
            title={t("investigationScreen.list.emptyTitle")}
            description={t("investigationScreen.list.emptyDesc")}
            icon={FolderPlus}
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("investigationScreen.list.newWorkspace")}
              </Button>
            }
          />
        ) : (
          <DataTable
            rows={workspaces}
            columns={columns}
            rowKey={(w) => w.id}
            rowHref={(w) => `/investigation/${w.id}`}
            rowActions={rowActions}
            searchPlaceholder={t("investigationScreen.list.searchPlaceholder")}
          />
        )}
      </div>

      <CreateWorkspaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        pending={createWorkspace.isPending}
        error={createWorkspace.error}
        onSubmit={async (values) => {
          // A rejected create stays in the dialog, where its error is shown.
          const created = await createWorkspace.mutateAsync(values).catch(() => null);
          if (!created) return;
          setCreateOpen(false);
          router.push(`/investigation/${created.id}`);
        }}
      />

      <ReassignDialog workspace={assignFor} onClose={() => setAssignFor(null)} />
    </DashboardLayout>
  );
}

function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    caseNumber: string;
    title: string;
    offence?: string;
    sections?: string[];
    priority?: "low" | "medium" | "high" | "critical";
    ioId?: string;
  }) => Promise<void>;
  pending: boolean;
  error: unknown;
}) {
  const { t } = useI18n();
  const [caseNumber, setCaseNumber] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [offence, setOffence] = React.useState("");
  const [sections, setSections] = React.useState("");
  const [priority, setPriority] = React.useState<"low" | "medium" | "high" | "critical">("medium");
  const [ioId, setIoId] = React.useState("");
  const [ioName, setIoName] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setCaseNumber("");
      setTitle("");
      setOffence("");
      setSections("");
      setPriority("medium");
      setIoId("");
      setIoName("");
    }
  }, [open]);

  const valid = caseNumber.trim().length > 0 && title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("investigationScreen.create.title")}</DialogTitle>
          <DialogDescription>{t("investigationScreen.create.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ws-case">{t("investigationScreen.create.caseNumber")}</Label>
            <Input
              id="ws-case"
              value={caseNumber}
              onChange={(v: string) => setCaseNumber(v)}
              placeholder={t("investigationScreen.create.caseNumberHint")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ws-title">{t("investigationScreen.create.caseTitle")}</Label>
            <Input
              id="ws-title"
              value={title}
              onChange={(v: string) => setTitle(v)}
              placeholder={t("investigationScreen.create.caseTitleHint")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ws-offence">{t("investigationScreen.create.offence")}</Label>
            <Input
              id="ws-offence"
              value={offence}
              onChange={(v: string) => setOffence(v)}
              placeholder={t("investigationScreen.create.offenceHint")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ws-sections">{t("investigationScreen.create.provisions")}</Label>
            <Input
              id="ws-sections"
              value={sections}
              onChange={(v: string) => setSections(v)}
              placeholder={t("investigationScreen.create.provisionsHint")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("investigationScreen.create.io")}</Label>
            <OfficerPicker
              value={ioId}
              onChange={(id, name) => {
                setIoId(id);
                setIoName(name);
              }}
            />
            {ioName && (
              <p className="text-xs text-foreground-muted">
                {t("investigationScreen.create.assigning")} <span className="font-medium text-foreground">{ioName}</span>
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ws-priority">{t("investigationScreen.create.priority")}</Label>
            <select
              id="ws-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="low">{t("investigationScreen.priority.low")}</option>
              <option value="medium">{t("investigationScreen.priority.medium")}</option>
              <option value="high">{t("investigationScreen.priority.high")}</option>
              <option value="critical">{t("investigationScreen.priority.critical")}</option>
            </select>
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
            disabled={!valid || pending}
            isLoading={pending}
            onClick={() =>
              onSubmit({
                caseNumber: caseNumber.trim(),
                title: title.trim(),
                offence: offence.trim() || undefined,
                sections: sections
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                priority,
                ioId: ioId || undefined,
              })
            }
          >
            {t("investigationScreen.create.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReassignDialog({
  workspace,
  onClose,
}: {
  workspace: Workspace | null;
  onClose: () => void;
}) {
  const { t, pick } = useI18n();
  const update = useUpdateWorkspace(workspace?.id ?? "");
  const [reason, setReason] = React.useState("");
  const [officerId, setOfficerId] = React.useState("");
  const [officerName, setOfficerName] = React.useState("");

  React.useEffect(() => {
    if (workspace) {
      setReason("");
      setOfficerId(workspace.ioId ?? "");
      setOfficerName("");
    }
  }, [workspace]);

  return (
    <Dialog open={workspace !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("investigationScreen.reassign.title")}</DialogTitle>
          <DialogDescription>
            {workspace
              ? `${workspace.caseNumber} · ${t("investigationScreen.reassign.currently")} ${workspace.ioName || t("investigationScreen.reassign.unassigned")}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("investigationScreen.reassign.newIo")}</Label>
            <OfficerPicker
              value={officerId}
              excludeId={workspace?.ioId}
              stationId={workspace?.stationId}
              onChange={(id, name) => {
                setOfficerId(id);
                setOfficerName(name);
              }}
            />
            {officerName && (
              <p className="text-xs text-foreground-muted">
                {t("investigationScreen.reassign.reassigningTo")} <span className="font-medium text-foreground">{officerName}</span>
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="as-reason">{t("investigationScreen.reassign.reason")}</Label>
            <Textarea
              id="as-reason"
              rows={3}
              value={reason}
              onChange={(v: string) => setReason(v)}
              placeholder={t("investigationScreen.reassign.reasonHint")}
            />
          </div>
          {update.error instanceof Error && (
            <p className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {update.error.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            isLoading={update.isPending}
            disabled={!officerId.trim() || update.isPending}
            onClick={() =>
              update
                .mutateAsync({ ioId: officerId.trim(), reassignReason: reason.trim() || undefined })
                .then(onClose, () => undefined)
            }
          >
            {t("investigationScreen.reassign.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
