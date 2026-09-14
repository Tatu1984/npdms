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

const STATUS_LABEL = {
  active: { en: "Under investigation", bn: "তদন্তাধীন" },
  chargesheet: { en: "Chargesheet stage", bn: "চার্জশিট পর্যায়" },
  "supervisory-review": { en: "Supervisory review", bn: "ঊর্ধ্বতন পর্যালোচনা" },
  closed: { en: "Closed", bn: "সমাপ্ত" },
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
      header: "Case",
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
      header: "Provisions",
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
      header: "Investigating officer",
      hideBelow: "md",
      sortValue: (w) => w.ioName ?? "",
      cell: (w) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{w.ioName || "Unassigned"}</p>
          {w.stationName && (
            <p className="truncate text-xs text-foreground-subtle">{w.stationName}</p>
          )}
        </div>
      ),
    },
    {
      id: "signals",
      header: "Open items",
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
            <span className="text-xs text-foreground-subtle">None</span>
          )}
        </div>
      ),
    },
    {
      id: "progress",
      header: "Progress",
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
      header: "Status",
      sortValue: (w) => w.status,
      cell: (w) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill tone={STATUS_TONE[w.status]}>{pick(STATUS_LABEL[w.status])}</StatusPill>
          <SeverityBadge level={w.priority} />
        </div>
      ),
    },
  ];

  const rowActions = (w: Workspace): Action[] => [
    act.label("hdr", w.caseNumber),
    act.link("open", "Open workspace", `/investigation/${w.id}`, { icon: Brain }),
    act.link("timeline", "Case timeline", `/investigation/${w.id}?tab=timeline`, {
      icon: ClipboardList,
      description: `${w.counts.timeline} entries`,
    }),
    act.link("contradictions", "Contradictions", `/investigation/${w.id}?tab=contradictions`, {
      icon: GitCompareArrows,
      description: `${w.counts.contradictions} recorded`,
    }),
    act.link("gaps", "Investigation gaps", `/investigation/${w.id}?tab=gaps`, {
      icon: ScanSearch,
      description: `${w.counts.gaps} open`,
    }),
    act.sep("s1"),
    act.link("evidence", "Linked evidence", `/investigation/${w.id}?tab=evidence`, {
      icon: ClipboardList,
      description: `${w.counts.evidence} items`,
    }),
    act.run("assign", "Reassign officer", () => setAssignFor(w), { icon: Users }),
    act.sep("s2"),
    act.link("casefile", "Case file & court readiness", `/case-file/${w.id}`, {
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
              New workspace
            </Button>
          }
          menu={[
            act.link("casefiles", "Case files", "/case-file", { icon: ClipboardList }),
            act.link("audit", "Audit trail", "/audit", { icon: ClipboardList }),
          ]}
        />

        <AIGovernanceNotice />

        {isError && (
          <Alert variant="danger">
            <ScanSearch />
            <div>
              <AlertTitle>Could not load workspaces</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "The API did not respond."}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                  {t("common.retry")}
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Active workspaces"
            value={workspaces.filter((w) => w.status !== "closed").length}
            icon={Brain}
            tone="info"
          />
          <StatTile
            label="Recorded contradictions"
            value={totals.contradictions}
            icon={GitCompareArrows}
            tone="danger"
            deltaLabel="awaiting officer decision"
          />
          <StatTile
            label="Open gaps"
            value={totals.gaps}
            icon={ScanSearch}
            tone="warning"
            deltaLabel="identified by the case rules"
          />
          <StatTile
            label="Open tasks"
            value={totals.tasks}
            icon={ListChecks}
            deltaLabel="assigned to officers"
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
            title="No investigation workspaces yet"
            description="Open a workspace against an FIR, GD or case number. The case rules will immediately show what the file is missing."
            icon={FolderPlus}
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                New workspace
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
            searchPlaceholder="Search by case number, title or offence…"
          />
        )}
      </div>

      <CreateWorkspaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        pending={createWorkspace.isPending}
        error={createWorkspace.error}
        onSubmit={async (values) => {
          const created = await createWorkspace.mutateAsync(values);
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
          <DialogTitle>New investigation workspace</DialogTitle>
          <DialogDescription>
            A workspace binds evidence, persons, chronology and tasks to one case record.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ws-case">FIR / GD / case number</Label>
            <Input
              id="ws-case"
              value={caseNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCaseNumber(e.target.value)}
              placeholder="e.g. PS-BHW/2024/0412"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ws-title">Case title</Label>
            <Input
              id="ws-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Short description of the occurrence"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ws-offence">Offence</Label>
            <Input
              id="ws-offence"
              value={offence}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOffence(e.target.value)}
              placeholder="e.g. Robbery with deadly weapon"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ws-sections">Provisions applied</Label>
            <Input
              id="ws-sections"
              value={sections}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSections(e.target.value)}
              placeholder="Comma separated, e.g. BNS 309, BNS 310"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Investigating officer</Label>
            <OfficerPicker
              value={ioId}
              onChange={(id, name) => {
                setIoId(id);
                setIoName(name);
              }}
            />
            {ioName && (
              <p className="text-xs text-foreground-muted">
                Assigning <span className="font-medium text-foreground">{ioName}</span>
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ws-priority">Priority</Label>
            <select
              id="ws-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
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
            Create workspace
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
          <DialogTitle>Reassign investigating officer</DialogTitle>
          <DialogDescription>
            {workspace
              ? `${workspace.caseNumber} · currently ${workspace.ioName || "unassigned"}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>New investigating officer</Label>
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
                Reassigning to <span className="font-medium text-foreground">{officerName}</span>
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="as-reason">Reason for reassignment</Label>
            <Textarea
              id="as-reason"
              rows={3}
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              placeholder="Written to the audit trail"
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
            onClick={async () => {
              await update.mutateAsync({
                ioId: officerId.trim(),
                reassignReason: reason.trim() || undefined,
              });
              onClose();
            }}
          >
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
