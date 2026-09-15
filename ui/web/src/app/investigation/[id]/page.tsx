"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Brain,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FileDown,
  GitCompareArrows,
  Link2,
  ListChecks,
  MapPin,
  Pencil,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import {
  bilingual,
  type Contradiction,
  type InvestigationGap,
  type InvestigationTask,
  type Severity,
  type WorkspacePerson,
} from "@/lib/api/investigation";
import {
  useBrief,
  useContradictions,
  useCreateContradiction,
  useCreateGap,
  useCreatePerson,
  useCreateTask,
  useCreateTimelineEntry,
  useDeletePerson,
  useDeleteTimelineEntry,
  useGaps,
  usePersons,
  useRecomputeGaps,
  useReviewContradiction,
  useReviewTimelineEntry,
  useSetGapStatus,
  useTasks,
  useTimeline,
  useUpdatePerson,
  useUpdateTask,
  useUpdateWorkspace,
  useWorkspace,
  useWorkspaceEvidence,
} from "@/hooks/use-investigation";
import {
  AIGovernanceNotice,
  HumanApprovalBar,
  SourceCitations,
} from "@/components/platform/governance";
import {
  EmptyState,
  Field,
  PageHeader,
  Panel,
  PhaseBadge,
  SeverityBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { act, ActionMenu, type Action } from "@/components/platform/actions";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatedList, AnimatedListItem } from "@/components/reactbits";
import { EvidencePicker, OfficerPicker } from "@/components/platform/pickers";
import { toast } from "@/stores/toastStore";
import { useLinkGraph, useLinkEvidence, useUnlinkEvidence, useDeleteTask } from "@/hooks/use-investigation";
import type { LinkGraph as LinkGraphData } from "@/lib/api/investigation";

const TABS = [
  "overview",
  "evidence",
  "timeline",
  "persons",
  "links",
  "contradictions",
  "gaps",
  "tasks",
  "brief",
] as const;

/** A derived row came from a deterministic rule, not a model. */
function OriginTag({ origin }: { origin: string }) {
  const { t } = useI18n();
  if (origin === "derived") {
    return (
      <StatusPill tone="info">
        <ScanSearch className="h-3 w-3" />
        {t("investigationScreen.origin.rule")}
      </StatusPill>
    );
  }
  if (origin === "ai") {
    return <StatusPill tone="ai">{t("investigationScreen.origin.ai")}</StatusPill>;
  }
  return <StatusPill tone="neutral">{t("investigationScreen.origin.officer")}</StatusPill>;
}

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { t, pick } = useI18n();

  const id = params.id;
  const requested = search.get("tab");
  const [tab, setTab] = React.useState<string>(
    requested && (TABS as readonly string[]).includes(requested) ? requested : "overview",
  );

  const workspace = useWorkspace(id);
  const persons = usePersons(id);
  const timeline = useTimeline(id);
  const contradictions = useContradictions(id);
  const gaps = useGaps(id);
  const tasks = useTasks(id);
  const evidence = useWorkspaceEvidence(id);
  const brief = useBrief(id, tab === "brief");

  const recompute = useRecomputeGaps(id);
  const reviewTimeline = useReviewTimelineEntry(id);
  const reviewContradiction = useReviewContradiction(id);
  const setGapStatus = useSetGapStatus(id);
  const updateTask = useUpdateTask(id);
  const updatePerson = useUpdatePerson(id);
  const deleteEntry = useDeleteTimelineEntry(id);
  const linkEvidence = useLinkEvidence(id);
  const unlinkEvidence = useUnlinkEvidence(id);
  const deleteTask = useDeleteTask(id);
  const deletePerson = useDeletePerson(id);
  const links = useLinkGraph(id, tab === "links");

  const [personDialog, setPersonDialog] = React.useState(false);
  const [editPerson, setEditPerson] = React.useState<WorkspacePerson | null>(null);
  const [personSheetId, setPersonSheetId] = React.useState<string | null>(null);
  const [editWorkspace, setEditWorkspace] = React.useState(false);
  const [confirm, setConfirm] = React.useState<ConfirmRequest | null>(null);
  const [timelineDialog, setTimelineDialog] = React.useState(false);
  const [contradictionDialog, setContradictionDialog] = React.useState(false);
  const [contradictionSheetId, setContradictionSheetId] = React.useState<string | null>(null);
  const [gapSheet, setGapSheet] = React.useState<InvestigationGap | null>(null);
  const [taskDialog, setTaskDialog] = React.useState<{ gapId?: string; contradictionId?: string } | null>(
    null,
  );
  const [evidenceDialog, setEvidenceDialog] = React.useState(false);
  const [gapDialog, setGapDialog] = React.useState(false);

  if (workspace.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (workspace.isError || !workspace.data) {
    return (
      <DashboardLayout>
        <Alert variant="danger">
          <AlertTriangle />
          <div>
            <AlertTitle>{t("investigationScreen.workspace.notAvailable")}</AlertTitle>
            <AlertDescription>
              {workspace.error instanceof Error
                ? workspace.error.message
                : t("investigationScreen.workspace.notAvailableDesc")}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => router.push("/investigation")}
              >
                {t("investigationScreen.workspace.back")}
              </Button>
            </AlertDescription>
          </div>
        </Alert>
      </DashboardLayout>
    );
  }

  const ws = workspace.data;
  // Sheets read the current row from the query, so a review or edit made while
  // the sheet is open shows at once instead of the stale copy it opened with.
  const personSheet = (persons.data ?? []).find((p) => p.id === personSheetId) ?? null;
  const setPersonSheet = (p: WorkspacePerson | null) => setPersonSheetId(p?.id ?? null);
  const contradictionSheet =
    (contradictions.data ?? []).find((c) => c.id === contradictionSheetId) ?? null;
  const setContradictionSheet = (c: Contradiction | null) => setContradictionSheetId(c?.id ?? null);

  /** Runs a mutation from a menu, reporting a failure instead of swallowing it. */
  const report = (label: string) => ({
    onError: (err: unknown) =>
      toast.error(label, err instanceof Error ? err.message : t("investigationScreen.errors.rejected")),
  });

  const screenMenu: Action[] = [
    act.run("edit", t("investigationScreen.workspace.editWorkspace"), () => setEditWorkspace(true), {
      icon: Pencil,
      description: t("investigationScreen.workspace.editWorkspaceDesc"),
    }),
    act.run("recompute", t("investigationScreen.workspace.rerunRules"), () => recompute.mutate(undefined, report(t("investigationScreen.errors.rulesNotRun"))), {
      icon: RefreshCw,
      description: t("investigationScreen.workspace.rerunRulesDesc"),
    }),
    act.sep("s1"),
    act.link("casefile", t("investigationScreen.list.caseFile"), `/case-file/${ws.id}`, {
      icon: ClipboardList,
    }),
    act.link("custody", t("investigationScreen.workspace.custodyLedger"), "/custody", { icon: ShieldCheck }),
    act.link("audit", t("investigationScreen.list.auditTrail"), "/audit", { icon: ClipboardList }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={pick(bilingual(ws.title, ws.titleBn))}
          description={`${ws.caseNumber}${ws.firNumber ? ` · ${ws.firNumber}` : ""}${
            ws.stationName ? ` · ${ws.stationName}` : ""
          }`}
          icon={Brain}
          badge={<PhaseBadge phase={1} />}
          breadcrumb={[
            { label: t("modules.investigation"), href: "/investigation" },
            { label: ws.caseNumber },
          ]}
          actions={
            <>
              <Button variant="outline" onClick={() => setTimelineDialog(true)}>
                <CalendarClock className="h-4 w-4" />
                {t("investigationScreen.workspace.addToTimeline")}
              </Button>
              <Button onClick={() => setTab("brief")}>
                <FileDown className="h-4 w-4" />
                {t("investigationScreen.workspace.caseBrief")}
              </Button>
            </>
          }
          menu={screenMenu}
        />

        <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("investigationScreen.workspace.offence")} value={pick(bilingual(ws.offence, ws.offenceBn)) || "—"} />
          <Field label={t("investigationScreen.workspace.provisions")} value={ws.sections.join(", ") || "—"} mono />
          <Field label={t("investigationScreen.workspace.io")} value={ws.ioName || t("investigationScreen.workspace.unassigned")} />
          <Field label={t("investigationScreen.workspace.supervisor")} value={ws.supervisorName || "—"} />
          <Field label={t("investigationScreen.workspace.registeredOn")} value={new Date(ws.registeredOn).toLocaleDateString("en-IN")} />
          <Field
            label={t("investigationScreen.workspace.nextCourtDate")}
            value={
              ws.nextCourtDate ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-warning" />
                  {new Date(ws.nextCourtDate).toLocaleDateString("en-IN")}
                </span>
              ) : (
                t("investigationScreen.workspace.notListed")
              )
            }
          />
          <Field label={t("investigationScreen.workspace.priority")} value={<SeverityBadge level={ws.priority} />} />
          <Field
            label={t("investigationScreen.workspace.progress")}
            value={
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-sunken">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${ws.progress}%` }}
                  />
                </span>
                <span className="tabular text-xs">{ws.progress}%</span>
              </span>
            }
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">{t("investigationScreen.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="evidence">{t("investigationScreen.tabs.evidence")} ({ws.counts.evidence})</TabsTrigger>
            <TabsTrigger value="timeline">{t("investigationScreen.tabs.timeline")} ({ws.counts.timeline})</TabsTrigger>
            <TabsTrigger value="persons">{t("investigationScreen.tabs.persons")} ({ws.counts.persons})</TabsTrigger>
            <TabsTrigger value="links">{t("investigationScreen.tabs.links")}</TabsTrigger>
            <TabsTrigger value="contradictions">
              {t("investigationScreen.tabs.contradictions")} ({ws.counts.contradictions})
            </TabsTrigger>
            <TabsTrigger value="gaps">{t("investigationScreen.tabs.gaps")} ({ws.counts.gaps})</TabsTrigger>
            <TabsTrigger value="tasks">{t("investigationScreen.tabs.tasks")} ({ws.counts.openTasks})</TabsTrigger>
            <TabsTrigger value="brief">{t("investigationScreen.tabs.brief")}</TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------- overview */}
          <TabsContent value="overview">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                <StatTile
                  label={t("investigationScreen.overview.evidenceLinked")}
                  value={ws.counts.evidence}
                  icon={ShieldCheck}
                  onClick={() => setTab("evidence")}
                />
                <StatTile
                  label={t("investigationScreen.overview.persons")}
                  value={ws.counts.persons}
                  icon={Users}
                  onClick={() => setTab("persons")}
                />
                <StatTile
                  label={t("investigationScreen.overview.contradictions")}
                  value={ws.counts.contradictions}
                  icon={GitCompareArrows}
                  tone="danger"
                  onClick={() => setTab("contradictions")}
                />
                <StatTile
                  label={t("investigationScreen.overview.openGaps")}
                  value={ws.counts.gaps}
                  icon={ScanSearch}
                  tone="warning"
                  onClick={() => setTab("gaps")}
                />
                <StatTile
                  label={t("investigationScreen.overview.vehicles")}
                  value={ws.counts.vehicles}
                  icon={Link2}
                  onClick={() => setTab("links")}
                />
                <StatTile
                  label={t("investigationScreen.overview.locations")}
                  value={ws.counts.locations}
                  icon={MapPin}
                  onClick={() => setTab("links")}
                />
              </div>

              <Alert variant="info">
                <ScanSearch />
                <div>
                  <AlertTitle>{t("investigationScreen.overview.rulesTitle")}</AlertTitle>
                  <AlertDescription>{t("investigationScreen.overview.rulesDesc")}</AlertDescription>
                </div>
              </Alert>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel
                  title={t("investigationScreen.overview.openGaps")}
                  description={t("investigationScreen.overview.openGapsDesc")}
                  actions={
                    <Button variant="ghost" size="sm" onClick={() => setTab("gaps")}>
                      {t("common.viewAll")}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  }
                  bodyClassName="flex flex-col gap-2"
                >
                  {gaps.isPending ? (
                    <Skeleton className="h-24 w-full" />
                  ) : gaps.isError ? (
                    <PanelError error={gaps.error} onRetry={() => gaps.refetch()} />
                  ) : (gaps.data ?? []).length === 0 ? (
                    <p className="py-4 text-center text-sm text-foreground-muted">
                      {t("investigationScreen.overview.noOpenGaps")}
                    </p>
                  ) : (
                    (gaps.data ?? []).slice(0, 4).map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGapSheet(g)}
                        className="flex w-full items-start justify-between gap-3 rounded-md border border-border p-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-hover"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-foreground">
                            {pick(bilingual(g.title, g.titleBn))}
                          </span>
                          {g.dueBy && (
                            <span className="mt-0.5 block text-xs text-warning">
                              {t("investigationScreen.overview.due")} {new Date(g.dueBy).toLocaleDateString("en-IN")}
                            </span>
                          )}
                        </span>
                        <SeverityBadge level={g.severity} />
                      </button>
                    ))
                  )}
                </Panel>

                <Panel
                  title={t("investigationScreen.overview.recordedContradictions")}
                  description={t("investigationScreen.overview.recordedContradictionsDesc")}
                  actions={
                    <Button variant="ghost" size="sm" onClick={() => setTab("contradictions")}>
                      {t("common.viewAll")}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  }
                  bodyClassName="flex flex-col gap-2"
                >
                  {contradictions.isPending ? (
                <PanelLoading />
              ) : contradictions.isError ? (
                <PanelError error={contradictions.error} onRetry={() => contradictions.refetch()} />
              ) : (contradictions.data ?? []).length === 0 ? (
                    <p className="py-4 text-center text-sm text-foreground-muted">
                      {t("investigationScreen.overview.noneRecorded")}
                    </p>
                  ) : (
                    (contradictions.data ?? []).slice(0, 3).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setContradictionSheet(c)}
                        className="flex w-full items-start justify-between gap-3 rounded-md border border-border p-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-hover"
                      >
                        <span className="min-w-0 truncate text-sm text-foreground">
                          {pick(bilingual(c.title, c.titleBn))}
                        </span>
                        <SeverityBadge level={c.severity} />
                      </button>
                    ))
                  )}
                </Panel>
              </div>
            </div>
          </TabsContent>

          {/* ---------------------------------------------------- evidence */}
          <TabsContent value="evidence">
            <Panel
              title={t("investigationScreen.evidence.title")}
              description={t("investigationScreen.evidence.description")}
              actions={
                <Button size="sm" onClick={() => setEvidenceDialog(true)}>
                  <Link2 className="h-3.5 w-3.5" />
                  {t("investigationScreen.evidence.attach")}
                </Button>
              }
              menu={[
                act.link("register", t("investigationScreen.evidence.openRegister"), "/custody", { icon: ShieldCheck }),
              ]}
              bodyClassName="flex flex-col gap-2"
            >
              {evidence.isPending ? (
                <PanelLoading />
              ) : evidence.isError ? (
                <PanelError error={evidence.error} onRetry={() => evidence.refetch()} />
              ) : (evidence.data ?? []).length === 0 ? (
                <EmptyState
                  title={t("investigationScreen.evidence.emptyTitle")}
                  description={t("investigationScreen.evidence.emptyDesc")}
                  icon={Link2}
                  action={
                    <Button size="sm" onClick={() => setEvidenceDialog(true)}>
                      <Link2 className="h-4 w-4" />
                      {t("investigationScreen.evidence.attach")}
                    </Button>
                  }
                />
              ) : (
                (evidence.data ?? []).map((e) => (
                  <div
                    key={e.evidenceId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        {e.description || t("investigationScreen.evidence.item")}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
                        {e.evidenceNumber || e.evidenceId}
                        {e.note ? ` · ${e.note}` : ""}
                      </p>
                    </div>
                    <ActionMenu
                      size="sm"
                      actions={[
                        act.link("open", t("investigationScreen.evidence.openInLedger"), `/custody/${e.evidenceId}`, {
                          icon: ShieldCheck,
                        }),
                        act.sep("s"),
                        act.run(
                          "unlink",
                          t("investigationScreen.evidence.detach"),
                          () =>
                            setConfirm({
                              title: t("investigationScreen.evidence.confirmDetachTitle"),
                              description: `${e.evidenceNumber ? `${e.evidenceNumber} — ` : ""}${t("investigationScreen.evidence.confirmDetachDesc")}`,
                              confirmLabel: t("investigationScreen.evidence.confirmDetach"),
                              run: () => unlinkEvidence.mutateAsync(e.evidenceId),
                            }),
                          { icon: Trash2, destructive: true, description: t("investigationScreen.evidence.detachDesc") },
                        ),
                      ]}
                    />
                  </div>
                ))
              )}
            </Panel>
          </TabsContent>

          {/* ---------------------------------------------------- timeline */}
          <TabsContent value="timeline">
            <Panel
              title={t("investigationScreen.timeline.title")}
              description={t("investigationScreen.timeline.description")}
              actions={
                <Button size="sm" onClick={() => setTimelineDialog(true)}>
                  <CalendarClock className="h-3.5 w-3.5" />
                  {t("investigationScreen.timeline.addEntry")}
                </Button>
              }
              bodyClassName="p-0"
            >
              {timeline.isPending ? (
                <div className="p-4">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : timeline.isError ? (
                <div className="p-4">
                  <PanelError error={timeline.error} onRetry={() => timeline.refetch()} />
                </div>
              ) : (timeline.data ?? []).length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title={t("investigationScreen.timeline.emptyTitle")}
                    description={t("investigationScreen.timeline.emptyDesc")}
                    icon={CalendarClock}
                    action={
                      <Button size="sm" onClick={() => setTimelineDialog(true)}>
                        {t("investigationScreen.timeline.addFirst")}
                      </Button>
                    }
                  />
                </div>
              ) : (
                <AnimatedList className="divide-y divide-border">
                  {(timeline.data ?? []).map((entry) => {
                    const at = new Date(entry.occurredAt);
                    return (
                      <AnimatedListItem key={entry.id}>
                        <div className="flex gap-4 p-4">
                          <div className="flex w-16 shrink-0 flex-col items-end">
                            <span className="tabular text-sm font-semibold text-foreground">
                              {at.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </span>
                            <span className="text-[0.65rem] text-foreground-subtle">
                              {at.toLocaleDateString("en-IN")}
                            </span>
                          </div>

                          <div className="relative flex-1 border-l border-border pl-4">
                            <span
                              className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface"
                              style={{
                                background:
                                  entry.reviewState === "accepted"
                                    ? "var(--success)"
                                    : entry.reviewState === "rejected"
                                      ? "var(--danger)"
                                      : "var(--warning)",
                              }}
                            />
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {pick(bilingual(entry.title, entry.titleBn))}
                              </p>
                              <div className="flex items-center gap-2">
                                <OriginTag origin={entry.origin} />
                                <ActionMenu
                                  size="sm"
                                  actions={[
                                    act.run(
                                      "remove",
                                      t("investigationScreen.timeline.remove"),
                                      () =>
                                        setConfirm({
                                          title: t("investigationScreen.timeline.confirmRemoveTitle"),
                                          description: `"${entry.title}" — ${t("investigationScreen.timeline.confirmRemoveDesc")}`,
                                          confirmLabel: t("investigationScreen.timeline.confirmRemove"),
                                          run: () => deleteEntry.mutateAsync(entry.id),
                                        }),
                                      { icon: Trash2, destructive: true },
                                    ),
                                  ]}
                                />
                              </div>
                            </div>
                            {entry.detail && (
                              <p className="mt-1 text-sm text-foreground-muted">
                                {pick(bilingual(entry.detail, entry.detailBn))}
                              </p>
                            )}
                            {entry.location && (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs text-foreground-subtle">
                                <MapPin className="h-3 w-3" />
                                {entry.location}
                              </p>
                            )}
                            {entry.sources.length > 0 && (
                              <SourceCitations
                                className="mt-2"
                                sources={entry.sources.map((s) => ({
                                  id: s.id,
                                  label: s.label,
                                  type: s.type,
                                  locator: s.locator,
                                }))}
                              />
                            )}
                            {entry.reviewState === "pending" && (
                              <HumanApprovalBar
                                className="mt-2"
                                state="pending"
                                onAccept={() =>
                                  reviewTimeline.mutate({ entryId: entry.id, state: "accepted" }, report(t("investigationScreen.errors.reviewNotSaved")))
                                }
                                onReject={() =>
                                  reviewTimeline.mutate({ entryId: entry.id, state: "rejected" }, report(t("investigationScreen.errors.reviewNotSaved")))
                                }
                              />
                            )}
                          </div>
                        </div>
                      </AnimatedListItem>
                    );
                  })}
                </AnimatedList>
              )}
            </Panel>
          </TabsContent>

          {/* ----------------------------------------------------- persons */}
          <TabsContent value="persons">
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setPersonDialog(true)}>
                  <UserPlus className="h-3.5 w-3.5" />
                  {t("investigationScreen.persons.add")}
                </Button>
              </div>

              {persons.isPending ? (
                <PanelLoading />
              ) : persons.isError ? (
                <PanelError error={persons.error} onRetry={() => persons.refetch()} />
              ) : (persons.data ?? []).length === 0 ? (
                <EmptyState
                  title={t("investigationScreen.persons.emptyTitle")}
                  description={t("investigationScreen.persons.emptyDesc")}
                  icon={Users}
                  action={
                    <Button size="sm" onClick={() => setPersonDialog(true)}>
                      {t("investigationScreen.persons.addFirst")}
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {(persons.data ?? []).map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {pick(bilingual(p.name, p.nameBn))}
                          </p>
                          {p.aliases.length > 0 && (
                            <p className="mt-0.5 truncate text-xs text-foreground-subtle">
                              {t("investigationScreen.persons.alias")} {p.aliases.join(", ")}
                            </p>
                          )}
                        </div>
                        <StatusPill
                          tone={
                            p.role === "accused" ? "danger" : p.role === "suspect" ? "warning" : "info"
                          }
                        >
                          {t(`investigationScreen.roles.${p.role}`)}
                        </StatusPill>
                      </div>

                      <dl className="grid grid-cols-2 gap-2">
                        <Field label={t("investigationScreen.persons.age")} value={p.age ?? "—"} />
                        <Field label={t("investigationScreen.persons.statements")} value={p.statementsCount} />
                        <Field label={t("investigationScreen.persons.phone")} value={p.phone ?? "—"} mono />
                        <Field label={t("investigationScreen.persons.vehicles")} value={p.vehicles.join(", ") || "—"} mono />
                      </dl>

                      {p.role === "witness" && p.statementsCount === 0 && (
                        <p className="rounded-md border border-warning/25 bg-warning-subtle px-2.5 py-1.5 text-xs text-foreground-muted">
                          {t("investigationScreen.persons.noStatement")}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                        <Button variant="outline" size="sm" onClick={() => setPersonSheet(p)}>
                          {t("common.details")}
                        </Button>
                        <ActionMenu
                          size="sm"
                          actions={[
                            act.run(
                              "statement",
                              t("investigationScreen.persons.recordStatement"),
                              () =>
                                updatePerson.mutate(
                                  { personId: p.id, statementsCount: p.statementsCount + 1 },
                                  report(t("investigationScreen.errors.statementNotRecorded")),
                                ),
                              { icon: ClipboardList, description: t("investigationScreen.persons.recordStatementDesc") },
                            ),
                            act.run("edit", t("investigationScreen.persons.editDetails"), () => setEditPerson(p), { icon: Pencil }),
                            act.run("profile", t("investigationScreen.persons.openProfile"), () => setPersonSheet(p), {
                              icon: Users,
                            }),
                            act.sep("s"),
                            act.link("lookout", t("investigationScreen.persons.addToLookout"), "/lookout", {
                              icon: AlertTriangle,
                            }),
                            act.run(
                              "remove",
                              t("investigationScreen.persons.remove"),
                              () =>
                                setConfirm({
                                  title: `${p.name} — ${t("investigationScreen.persons.confirmRemoveTitle")}`,
                                  description: t("investigationScreen.persons.confirmRemoveDesc"),
                                  confirmLabel: t("investigationScreen.persons.confirmRemove"),
                                  run: () => deletePerson.mutateAsync(p.id),
                                }),
                              { icon: Trash2, destructive: true },
                            ),
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* -------------------------------------------------------- links */}
          <TabsContent value="links">
            <Panel
              title={t("investigationScreen.links.title")}
              description={t("investigationScreen.links.description")}
              menu={[
                act.link("networks", t("investigationScreen.links.graphWorkspace"), "/networks", { icon: Link2 }),
                act.link("cyber", t("investigationScreen.links.financialNetwork"), "/cyber-intelligence", { icon: Link2 }),
              ]}
            >
              {links.isPending ? (
                <Skeleton className="h-72 w-full" />
              ) : links.isError ? (
                <PanelError error={links.error} onRetry={() => links.refetch()} />
              ) : !links.data || links.data.nodes.length <= 1 ? (
                <EmptyState
                  title={t("investigationScreen.links.emptyTitle")}
                  description={t("investigationScreen.links.emptyDesc")}
                  icon={Link2}
                  action={
                    <Button size="sm" onClick={() => setPersonDialog(true)}>
                      <UserPlus className="h-4 w-4" />
                      {t("investigationScreen.links.addPerson")}
                    </Button>
                  }
                />
              ) : (
                <>
                  <RelationshipGraph graph={links.data} />
                  <p className="mt-3 text-xs text-foreground-muted">
                    {t("investigationScreen.links.footnote")}
                  </p>
                </>
              )}
            </Panel>
          </TabsContent>

          {/* --------------------------------------------- contradictions */}
          <TabsContent value="contradictions">
            <div className="flex flex-col gap-3">
              <AIGovernanceNotice />
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setContradictionDialog(true)}>
                  <GitCompareArrows className="h-3.5 w-3.5" />
                  {t("investigationScreen.contradictions.record")}
                </Button>
              </div>

              {contradictions.isPending ? (
                <PanelLoading />
              ) : contradictions.isError ? (
                <PanelError error={contradictions.error} onRetry={() => contradictions.refetch()} />
              ) : (contradictions.data ?? []).length === 0 ? (
                <EmptyState
                  title={t("investigationScreen.contradictions.emptyTitle")}
                  description={t("investigationScreen.contradictions.emptyDesc")}
                  icon={GitCompareArrows}
                  action={
                    <Button size="sm" onClick={() => setContradictionDialog(true)}>
                      {t("investigationScreen.contradictions.recordFirst")}
                    </Button>
                  }
                />
              ) : (
                (contradictions.data ?? []).map((c) => (
                  <Panel key={c.id}>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GitCompareArrows className="h-4 w-4 text-danger" />
                          <p className="text-sm font-semibold text-foreground">
                            {pick(bilingual(c.title, c.titleBn))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <SeverityBadge level={c.severity} />
                          <OriginTag origin={c.origin} />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {[
                          { label: c.statementALabel, claim: c.statementAClaim },
                          { label: c.statementBLabel, claim: c.statementBClaim },
                        ].map((side, i) => (
                          <div key={i} className="rounded-md border border-border bg-surface-sunken p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                              {side.label}
                            </p>
                            <p className="mt-1.5 text-sm text-foreground">{side.claim}</p>
                          </div>
                        ))}
                      </div>

                      {c.sources.length > 0 && (
                        <SourceCitations
                          sources={c.sources.map((s) => ({
                            id: s.id,
                            label: s.label,
                            type: s.type,
                            locator: s.locator,
                          }))}
                        />
                      )}

                      <HumanApprovalBar
                        state={c.reviewState}
                        decidedBy={c.reviewedByName}
                        decidedAt={c.reviewedAt ? new Date(c.reviewedAt).toLocaleString("en-IN") : undefined}
                        onAccept={() =>
                          reviewContradiction.mutate({ contradictionId: c.id, state: "accepted" }, report(t("investigationScreen.errors.reviewNotSaved")))
                        }
                        onReject={() =>
                          reviewContradiction.mutate({ contradictionId: c.id, state: "rejected" }, report(t("investigationScreen.errors.reviewNotSaved")))
                        }
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setContradictionSheet(c)}>
                          {t("investigationScreen.contradictions.examine")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTaskDialog({ contradictionId: c.id })}
                        >
                          <ListChecks className="h-3.5 w-3.5" />
                          {t("investigationScreen.contradictions.raiseTask")}
                        </Button>
                      </div>
                    </div>
                  </Panel>
                ))
              )}
            </div>
          </TabsContent>

          {/* -------------------------------------------------------- gaps */}
          <TabsContent value="gaps">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-foreground-muted">
                  {t("investigationScreen.gaps.intro")}
                </p>
                <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setGapDialog(true)}>
                  <ScanSearch className="h-3.5 w-3.5" />
                  {t("investigationScreen.gaps.record")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={recompute.isPending}
                  onClick={() => recompute.mutate(undefined, report(t("investigationScreen.errors.rulesNotRun")))}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t("investigationScreen.workspace.rerunRules")}
                </Button>
                </div>
              </div>

              {gaps.isPending ? (
                <PanelLoading />
              ) : gaps.isError ? (
                <PanelError error={gaps.error} onRetry={() => gaps.refetch()} />
              ) : (gaps.data ?? []).length === 0 ? (
                <EmptyState
                  title={t("investigationScreen.gaps.emptyTitle")}
                  description={t("investigationScreen.gaps.emptyDesc")}
                  icon={ScanSearch}
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {(gaps.data ?? []).map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ScanSearch className="h-4 w-4 shrink-0 text-warning" />
                          <p className="text-sm font-medium text-foreground">
                            {pick(bilingual(g.title, g.titleBn))}
                          </p>
                        </div>
                        <SeverityBadge level={g.severity} />
                      </div>

                      <p className="text-sm text-foreground-muted">
                        {pick(bilingual(g.detail, g.detailBn))}
                      </p>

                      <div className="flex items-center gap-2">
                        <OriginTag origin={g.origin} />
                        {g.dueBy && (
                          <span className="text-xs text-warning">
                            {t("investigationScreen.overview.due")} {new Date(g.dueBy).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                        <Button variant="outline" size="sm" onClick={() => setGapSheet(g)}>
                          {t("common.details")}
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => setTaskDialog({ gapId: g.id })}>
                            <ListChecks className="h-3.5 w-3.5" />
                            {t("investigationScreen.gaps.createTask")}
                          </Button>
                          <ActionMenu
                            size="sm"
                            actions={[
                              act.run(
                                "dismiss",
                                t("investigationScreen.gaps.dismiss"),
                                () =>
                                  setConfirm({
                                    title: t("investigationScreen.gaps.confirmDismissTitle"),
                                    description: t("investigationScreen.gaps.confirmDismissDesc"),
                                    confirmLabel: t("investigationScreen.gaps.confirmDismiss"),
                                    run: () => setGapStatus.mutateAsync({ gapId: g.id, status: "dismissed" }),
                                  }),
                                {
                                  icon: Trash2,
                                  description: t("investigationScreen.gaps.dismissDesc"),
                                },
                              ),
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ------------------------------------------------------- tasks */}
          <TabsContent value="tasks">
            <Panel
              title={t("investigationScreen.tasks.title")}
              description={t("investigationScreen.tasks.description")}
              actions={
                <Button size="sm" onClick={() => setTaskDialog({})}>
                  <ListChecks className="h-3.5 w-3.5" />
                  {t("investigationScreen.tasks.new")}
                </Button>
              }
              bodyClassName="flex flex-col gap-2"
            >
              {tasks.isPending ? (
                <PanelLoading />
              ) : tasks.isError ? (
                <PanelError error={tasks.error} onRetry={() => tasks.refetch()} />
              ) : (tasks.data ?? []).length === 0 ? (
                <EmptyState
                  title={t("investigationScreen.tasks.emptyTitle")}
                  description={t("investigationScreen.tasks.emptyDesc")}
                  icon={ListChecks}
                  action={
                    <Button size="sm" onClick={() => setTaskDialog({})}>
                      {t("investigationScreen.tasks.create")}
                    </Button>
                  }
                />
              ) : (
                (tasks.data ?? []).map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        {pick(bilingual(task.title, task.titleBn))}
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-subtle">
                        {task.assigneeName || t("investigationScreen.tasks.unassigned")}
                        {task.dueDate
                          ? ` · ${t("investigationScreen.tasks.due")} ${new Date(task.dueDate).toLocaleDateString("en-IN")}`
                          : ""}
                        {task.gapId ? ` · ${t("investigationScreen.tasks.fromGap")}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge level={task.priority} />
                      <StatusPill
                        tone={
                          task.status === "done"
                            ? "success"
                            : task.status === "blocked"
                              ? "danger"
                              : task.status === "in-progress"
                                ? "info"
                                : "neutral"
                        }
                      >
                        {t(`investigationScreen.taskStatus.${task.status}`)}
                      </StatusPill>
                      <ActionMenu
                        size="sm"
                        actions={taskActions(
                          t,
                          task,
                          (vars) => updateTask.mutate(vars, report(t("investigationScreen.errors.taskNotUpdated"))),
                          (taskId) =>
                            setConfirm({
                              title: t("investigationScreen.tasks.confirmDeleteTitle"),
                              description: `"${task.title}" — ${t("investigationScreen.tasks.confirmDeleteDesc")}`,
                              confirmLabel: t("investigationScreen.tasks.confirmDelete"),
                              run: () => deleteTask.mutateAsync(taskId),
                            }),
                        )}
                      />
                    </div>
                  </div>
                ))
              )}
            </Panel>
          </TabsContent>

          {/* ------------------------------------------------------- brief */}
          <TabsContent value="brief">
            <div className="flex flex-col gap-4">
              <Alert variant="info">
                <ClipboardList />
                <div>
                  <AlertTitle>{t("investigationScreen.brief.title")}</AlertTitle>
                  <AlertDescription>{t("investigationScreen.brief.description")}</AlertDescription>
                </div>
              </Alert>

              {brief.isPending ? (
                <Skeleton className="h-64 w-full" />
              ) : brief.isError ? (
                <PanelError error={brief.error} onRetry={() => brief.refetch()} />
              ) : brief.data ? (
                <Panel title={t("investigationScreen.brief.panel")} description={`${t("investigationScreen.brief.assembled")} ${new Date(brief.data.generatedAt).toLocaleString("en-IN")}`}>
                  <div className="flex flex-col gap-5">
                    <BriefSection title={t("investigationScreen.brief.chronology")} empty={t("investigationScreen.brief.noChronology")}>
                      {brief.data.timeline.map((e) => (
                        <li key={e.id} className="flex gap-3 text-sm">
                          <span className="w-32 shrink-0 font-mono text-xs text-foreground-subtle">
                            {new Date(e.occurredAt).toLocaleString("en-IN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                          <span className="text-foreground-muted">
                            {pick(bilingual(e.title, e.titleBn))}
                          </span>
                        </li>
                      ))}
                    </BriefSection>

                    <BriefSection title={t("investigationScreen.brief.persons")} empty={t("investigationScreen.brief.noPersons")}>
                      {brief.data.persons.map((p) => (
                        <li key={p.id} className="flex gap-3 text-sm">
                          <span className="w-32 shrink-0 text-xs uppercase tracking-wide text-foreground-subtle">
                            {t(`investigationScreen.roles.${p.role}`)}
                          </span>
                          <span className="text-foreground-muted">
                            {pick(bilingual(p.name, p.nameBn))} · {p.statementsCount} {t("investigationScreen.brief.statementsSuffix")}
                          </span>
                        </li>
                      ))}
                    </BriefSection>

                    <BriefSection title={t("investigationScreen.brief.gaps")} empty={t("investigationScreen.brief.noGaps")}>
                      {brief.data.gaps.map((g) => (
                        <li key={g.id} className="flex gap-3 text-sm">
                          <span className="w-32 shrink-0 text-xs uppercase tracking-wide text-warning">
                            {g.severity}
                          </span>
                          <span className="text-foreground-muted">
                            {pick(bilingual(g.title, g.titleBn))}
                          </span>
                        </li>
                      ))}
                    </BriefSection>

                    <BriefSection title={t("investigationScreen.brief.leads")} empty={t("investigationScreen.brief.noLeads")}>
                      {brief.data.contradictions.map((c) => (
                        <li key={c.id} className="flex gap-3 text-sm">
                          <span className="w-32 shrink-0 text-xs uppercase tracking-wide text-danger">
                            {c.reviewState}
                          </span>
                          <span className="text-foreground-muted">
                            {pick(bilingual(c.title, c.titleBn))}
                          </span>
                        </li>
                      ))}
                    </BriefSection>

                    <BriefSection title={t("investigationScreen.brief.tasks")} empty={t("investigationScreen.brief.noTasks")}>
                      {brief.data.openTasks.map((task) => (
                        <li key={task.id} className="flex gap-3 text-sm">
                          <span className="w-32 shrink-0 text-xs text-foreground-subtle">
                            {task.assigneeName || t("investigationScreen.tasks.unassigned")}
                          </span>
                          <span className="text-foreground-muted">
                            {pick(bilingual(task.title, task.titleBn))}
                          </span>
                        </li>
                      ))}
                    </BriefSection>
                  </div>
                </Panel>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <PersonDialog id={id} open={personDialog} onOpenChange={setPersonDialog} />
      <PersonDialog
        id={id}
        person={editPerson}
        open={editPerson !== null}
        onOpenChange={(o) => !o && setEditPerson(null)}
      />
      <EditWorkspaceDialog workspace={ws} open={editWorkspace} onOpenChange={setEditWorkspace} />
      <ConfirmActionDialog request={confirm} onClose={() => setConfirm(null)} />
      <RecordGapDialog id={id} open={gapDialog} onOpenChange={setGapDialog} />
      <AddTimelineDialog id={id} open={timelineDialog} onOpenChange={setTimelineDialog} />
      <AddContradictionDialog
        id={id}
        open={contradictionDialog}
        onOpenChange={setContradictionDialog}
      />
      <AddTaskDialog id={id} context={taskDialog} onClose={() => setTaskDialog(null)} />

      <AttachEvidenceDialog
        open={evidenceDialog}
        onOpenChange={setEvidenceDialog}
        alreadyLinked={(evidence.data ?? []).map((e) => e.evidenceId)}
        pending={linkEvidence.isPending}
        error={linkEvidence.error}
        onAttach={async (evidenceId, note) => {
          await linkEvidence.mutateAsync({ evidenceId, note }).then(() => setEvidenceDialog(false), () => undefined);
        }}
      />

      {/* person sheet */}
      <Sheet open={personSheet !== null} onOpenChange={(o) => !o && setPersonSheet(null)}>
        <SheetContent>
          {personSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{pick(bilingual(personSheet.name, personSheet.nameBn))}</SheetTitle>
                <SheetDescription>
                  {t(`investigationScreen.roles.${personSheet.role}`)}
                  {personSheet.address ? ` · ${personSheet.address}` : ""}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <dl className="grid grid-cols-2 gap-3">
                  <Field label={t("investigationScreen.persons.age")} value={personSheet.age ?? "—"} />
                  <Field label={t("investigationScreen.persons.phone")} value={personSheet.phone ?? "—"} mono />
                  <Field label={t("investigationScreen.persons.statementsRecorded")} value={personSheet.statementsCount} />
                  <Field label={t("investigationScreen.persons.aliases")} value={personSheet.aliases.join(", ") || "—"} />
                  <Field label={t("investigationScreen.persons.vehicles")} value={personSheet.vehicles.join(", ") || "—"} mono />
                  <Field label={t("investigationScreen.persons.gender")} value={personSheet.gender ? t(`investigationScreen.genders.${personSheet.gender as "female" | "male" | "transgender"}`) : "—"} />
                </dl>
                {personSheet.riskNote && (
                  <p className="rounded-md border border-warning/25 bg-warning-subtle px-3 py-2 text-sm text-foreground-muted">
                    {personSheet.riskNote}
                  </p>
                )}
                <Button
                  onClick={() =>
                    updatePerson.mutate(
                      { personId: personSheet.id, statementsCount: personSheet.statementsCount + 1 },
                      report(t("investigationScreen.errors.statementNotRecorded")),
                    )
                  }
                >
                  <ClipboardList className="h-4 w-4" />
                  {t("investigationScreen.persons.recordStatement")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditPerson(personSheet);
                    setPersonSheet(null);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  {t("investigationScreen.persons.editDetails")}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* contradiction sheet */}
      <Sheet
        open={contradictionSheet !== null}
        onOpenChange={(o) => !o && setContradictionSheet(null)}
      >
        <SheetContent className="w-[32rem]">
          {contradictionSheet && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {pick(bilingual(contradictionSheet.title, contradictionSheet.titleBn))}
                </SheetTitle>
                <SheetDescription>{t("investigationScreen.contradictions.lead")}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                {[
                  {
                    label: contradictionSheet.statementALabel,
                    claim: contradictionSheet.statementAClaim,
                  },
                  {
                    label: contradictionSheet.statementBLabel,
                    claim: contradictionSheet.statementBClaim,
                  },
                ].map((side, i) => (
                  <div key={i} className="rounded-md border border-border bg-surface-sunken p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                      {side.label}
                    </p>
                    <p className="mt-1.5 text-sm text-foreground">{side.claim}</p>
                  </div>
                ))}
                <HumanApprovalBar
                  state={contradictionSheet.reviewState}
                  decidedBy={contradictionSheet.reviewedByName}
                  decidedAt={
                    contradictionSheet.reviewedAt
                      ? new Date(contradictionSheet.reviewedAt).toLocaleString("en-IN")
                      : undefined
                  }
                  onAccept={() =>
                    reviewContradiction.mutate(
                      { contradictionId: contradictionSheet.id, state: "accepted" },
                      report(t("investigationScreen.errors.reviewNotSaved")),
                    )
                  }
                  onReject={() =>
                    reviewContradiction.mutate(
                      { contradictionId: contradictionSheet.id, state: "rejected" },
                      report(t("investigationScreen.errors.reviewNotSaved")),
                    )
                  }
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setTaskDialog({ contradictionId: contradictionSheet.id });
                    setContradictionSheet(null);
                  }}
                >
                  <ListChecks className="h-4 w-4" />
                  {t("investigationScreen.contradictions.raiseTask")}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* gap sheet */}
      <Sheet open={gapSheet !== null} onOpenChange={(o) => !o && setGapSheet(null)}>
        <SheetContent>
          {gapSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{pick(bilingual(gapSheet.title, gapSheet.titleBn))}</SheetTitle>
                <SheetDescription>{t(`investigationScreen.gapKinds.${gapSheet.kind}`)}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <p className="text-sm text-foreground-muted">
                  {pick(bilingual(gapSheet.detail, gapSheet.detailBn))}
                </p>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label={t("investigationScreen.gaps.severity")} value={<SeverityBadge level={gapSheet.severity} />} />
                  <Field label={t("investigationScreen.gaps.raisedBy")} value={<OriginTag origin={gapSheet.origin} />} />
                  <Field
                    label={t("investigationScreen.gaps.dueBy")}
                    value={gapSheet.dueBy ? new Date(gapSheet.dueBy).toLocaleDateString("en-IN") : "—"}
                  />
                </dl>
                {gapSheet.ruleKey && (
                  <p className="rounded-md border border-info/25 bg-info-subtle px-3 py-2 text-xs text-foreground-muted">
                    {t("investigationScreen.gaps.raisedByRule")} <span className="font-mono">{gapSheet.ruleKey}</span>. 
                    {t("investigationScreen.gaps.closesOnItsOwn")}
                  </p>
                )}
                <Button
                  onClick={() => {
                    setTaskDialog({ gapId: gapSheet.id });
                    setGapSheet(null);
                  }}
                >
                  <ListChecks className="h-4 w-4" />
                  {t("investigationScreen.gaps.createTaskToClose")}
                </Button>
                {gapSheet.kind === "forensic" && (
                  <Button variant="outline" onClick={() => router.push("/forensics")}>
                    {t("investigationScreen.gaps.openForensics")}
                  </Button>
                )}
                {gapSheet.kind === "witness" && (
                  <Button variant="outline" onClick={() => { setGapSheet(null); setTab("persons"); }}>
                    {t("investigationScreen.gaps.goToPersons")}
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

function PanelLoading() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

/** A panel whose data failed to load says so; it never shows as empty. */
function PanelError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <Alert variant="danger">
      <AlertTriangle />
      <div>
        <AlertTitle>{t("investigationScreen.errors.panelTitle")}</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : t("investigationScreen.errors.rejected")}
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            {t("common.retry")}
          </Button>
        </AlertDescription>
      </div>
    </Alert>
  );
}

function taskActions(
  t: ReturnType<typeof useI18n>["t"],
  task: InvestigationTask,
  update: (vars: { taskId: string; status?: InvestigationTask["status"] }) => void,
  onDelete?: (taskId: string) => void,
): Action[] {
  const out: Action[] = [];
  if (task.status !== "in-progress" && task.status !== "done") {
    out.push(
      act.run("start", t("investigationScreen.tasks.start"), () => update({ taskId: task.id, status: "in-progress" }), {
        icon: ListChecks,
      }),
    );
  }
  if (task.status !== "done") {
    out.push(
      act.run("done", t("investigationScreen.tasks.complete"), () => update({ taskId: task.id, status: "done" }), {
        icon: ListChecks,
        description: t("investigationScreen.tasks.completeDesc"),
      }),
    );
    out.push(
      act.run("block", t("investigationScreen.tasks.block"), () => update({ taskId: task.id, status: "blocked" }), {
        icon: AlertTriangle,
      }),
    );
  } else {
    out.push(
      act.run("reopen", t("investigationScreen.tasks.reopen"), () => update({ taskId: task.id, status: "open" }), {
        icon: RefreshCw,
      }),
    );
  }
  out.push(act.sep("s"));
  out.push(act.link("officer", t("investigationScreen.tasks.personnel"), "/personnel", { icon: Users }));
  if (onDelete) {
    out.push(
      act.run("delete", t("investigationScreen.tasks.delete"), () => onDelete(task.id), {
        icon: Trash2,
        destructive: true,
      }),
    );
  }
  return out;
}

/**
 * Draws the recorded relationships. The case sits at the centre and everything
 * referencing it radiates outward, grouped by kind so a reader can see at a
 * glance what sort of material the case rests on.
 */
function RelationshipGraph({ graph }: { graph: LinkGraphData }) {
  const centre = graph.nodes.find((n) => n.type === "case") ?? graph.nodes[0];
  const others = graph.nodes.filter((n) => n.id !== centre.id);

  const width = 620;
  const height = Math.max(340, 120 + others.length * 26);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 72;

  const colour: Record<string, string> = {
    person: "var(--accent)",
    phone: "var(--info)",
    vehicle: "var(--warning)",
    location: "var(--success)",
    evidence: "var(--ai)",
    case: "var(--insignia)",
  };

  const placed = others.map((node, i) => {
    const angle = (i / others.length) * Math.PI * 2 - Math.PI / 2;
    return {
      node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
  const position = new Map(placed.map((p) => [p.node.id, p]));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto w-full"
        style={{ maxWidth: width, height }}
        role="img"
        aria-label={`Relationships recorded on ${centre.label}`}
      >
        <title>Relationships recorded on {centre.label}</title>

        {graph.edges.map((edge, i) => {
          const from = edge.from === centre.id ? { x: cx, y: cy } : position.get(edge.from);
          const to = edge.to === centre.id ? { x: cx, y: cy } : position.get(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--border-strong)"
              strokeWidth="1.25"
            />
          );
        })}

        <circle cx={cx} cy={cy} r="40" fill="var(--insignia-subtle)" stroke="var(--insignia)" strokeWidth="2" />
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-[var(--insignia)] text-[9px] font-semibold">
          {centre.label.length > 18 ? `${centre.label.slice(0, 17)}…` : centre.label}
        </text>
        <text x={cx} y={cy + 11} textAnchor="middle" className="fill-[var(--foreground-muted)] text-[7.5px]">
          case
        </text>

        {placed.map(({ node, x, y }) => (
          <g key={node.id}>
            <circle
              cx={x}
              cy={y}
              r="30"
              fill="var(--surface)"
              stroke={colour[node.type] ?? "var(--border-strong)"}
              strokeWidth="1.75"
            />
            <text x={x} y={y - 2} textAnchor="middle" className="fill-[var(--foreground)] text-[7.5px] font-medium">
              {node.label.length > 15 ? `${node.label.slice(0, 14)}…` : node.label}
            </text>
            <text x={x} y={y + 9} textAnchor="middle" className="fill-[var(--foreground-subtle)] text-[7px]">
              {node.role || node.type}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {Object.entries(colour)
          .filter(([type]) => graph.nodes.some((n) => n.type === type))
          .map(([type, value]) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: value }} />
              {type}
            </span>
          ))}
      </div>
    </div>
  );
}

function AttachEvidenceDialog({
  open,
  onOpenChange,
  alreadyLinked,
  onAttach,
  pending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alreadyLinked: string[];
  onAttach: (evidenceId: string, note?: string) => Promise<void>;
  pending: boolean;
  error: unknown;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setSelected("");
      setLabel("");
      setNote("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("investigationScreen.evidence.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("investigationScreen.evidence.dialogDesc")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <EvidencePicker
            value={selected}
            alreadyLinked={alreadyLinked}
            onChange={(id, chosenLabel) => {
              setSelected(id);
              setLabel(chosenLabel);
            }}
          />
          {selected && (
            <p className="text-xs text-foreground-muted">
              {t("investigationScreen.evidence.attaching")} <span className="font-medium text-foreground">{label}</span>
            </p>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="ev-note">{t("investigationScreen.evidence.note")}</Label>
            <Input
              id="ev-note"
              value={note}
              onChange={(v: string) => setNote(v)}
              placeholder={t("investigationScreen.evidence.noteHint")}
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
            disabled={!selected || pending}
            isLoading={pending}
            onClick={() => onAttach(selected, note.trim() || undefined)}
          >
            {t("investigationScreen.evidence.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BriefSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children);
  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-foreground-subtle">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">{items}</ul>
      )}
    </section>
  );
}

/* --------------------------------- dialogs -------------------------------- */

/** Adds a person, or edits one when `person` is given. */
function PersonDialog({
  id,
  person,
  open,
  onOpenChange,
}: {
  id: string;
  person?: WorkspacePerson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const create = useCreatePerson(id);
  const update = useUpdatePerson(id);
  const editing = Boolean(person);
  const mutation = editing ? update : create;
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<WorkspacePerson["role"]>("witness");
  const [phone, setPhone] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [aliases, setAliases] = React.useState("");
  const [vehicles, setVehicles] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(person?.name ?? "");
      setRole(person?.role ?? "witness");
      setPhone(person?.phone ?? "");
      setAge(person?.age != null ? String(person.age) : "");
      setGender(person?.gender ?? "");
      setAliases(person?.aliases.join(", ") ?? "");
      setVehicles(person?.vehicles.join(", ") ?? "");
      setAddress(person?.address ?? "");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, person?.id]);

  const list = (v: string) =>
    v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  const ageValue = age.trim() === "" ? undefined : Number(age);
  const ageInvalid = ageValue !== undefined && (!Number.isInteger(ageValue) || ageValue < 0 || ageValue > 120);

  const submit = async () => {
    setError(null);
    const body = {
      name: name.trim(),
      role,
      phone: phone.trim() || undefined,
      age: ageValue,
      gender: gender || undefined,
      aliases: list(aliases),
      vehicles: list(vehicles),
      address: address.trim() || undefined,
    };
    try {
      if (person) {
        await update.mutateAsync({ personId: person.id, ...body });
      } else {
        await create.mutateAsync(body);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("investigationScreen.errors.rejected"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("investigationScreen.persons.editTitle") : t("investigationScreen.persons.addTitle")}</DialogTitle>
          <DialogDescription>
            {editing ? t("investigationScreen.persons.editDesc") : t("investigationScreen.persons.addDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="p-name">{t("investigationScreen.persons.name")}</Label>
            <Input id="p-name" value={name} onChange={(v: string) => setName(v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="p-role">{t("investigationScreen.persons.role")}</Label>
              <select
                id="p-role"
                value={role}
                onChange={(e) => setRole(e.target.value as WorkspacePerson["role"])}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="complainant">{t("investigationScreen.roles.complainant")}</option>
                <option value="victim">{t("investigationScreen.roles.victim")}</option>
                <option value="witness">{t("investigationScreen.roles.witness")}</option>
                <option value="suspect">{t("investigationScreen.roles.suspect")}</option>
                <option value="accused">{t("investigationScreen.roles.accused")}</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-gender">{t("investigationScreen.persons.gender")}</Label>
              <select
                id="p-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{t("investigationScreen.persons.notRecorded")}</option>
                <option value="female">{t("investigationScreen.genders.female")}</option>
                <option value="male">{t("investigationScreen.genders.male")}</option>
                <option value="transgender">{t("investigationScreen.genders.transgender")}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="p-phone">{t("investigationScreen.persons.phone")}</Label>
              <Input id="p-phone" value={phone} onChange={(v: string) => setPhone(v)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-age">{t("investigationScreen.persons.age")}</Label>
              <Input
                id="p-age"
                inputMode="numeric"
                value={age}
                onChange={(v: string) => setAge(v)}
                error={ageInvalid ? t("investigationScreen.persons.ageError") : undefined}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-aliases">{t("investigationScreen.persons.aliases")}</Label>
            <Input
              id="p-aliases"
              value={aliases}
              onChange={(v: string) => setAliases(v)}
              placeholder={t("investigationScreen.persons.aliasesHint")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-vehicles">{t("investigationScreen.persons.vehicles")}</Label>
            <Input
              id="p-vehicles"
              value={vehicles}
              onChange={(v: string) => setVehicles(v)}
              placeholder={t("investigationScreen.persons.vehiclesHint")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-address">{t("investigationScreen.persons.address")}</Label>
            <Input id="p-address" value={address} onChange={(v: string) => setAddress(v)} />
          </div>
          {error && (
            <p className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!name.trim() || ageInvalid || mutation.isPending}
            isLoading={mutation.isPending}
            onClick={submit}
          >
            {editing ? t("common.save") : t("investigationScreen.persons.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** An officer-raised gap: closed by the officer, or by completing a task raised against it. */
function RecordGapDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const create = useCreateGap(id);
  const [title, setTitle] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [kind, setKind] = React.useState<InvestigationGap["kind"]>("document");
  const [severity, setSeverity] = React.useState<Severity>("medium");
  const [dueBy, setDueBy] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDetail("");
      setKind("document");
      setSeverity("medium");
      setDueBy("");
      create.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("investigationScreen.gaps.recordTitle")}</DialogTitle>
          <DialogDescription>{t("investigationScreen.gaps.recordDesc")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="gp-title">{t("investigationScreen.gaps.title")}</Label>
            <Input
              id="gp-title"
              value={title}
              onChange={(v: string) => setTitle(v)}
              placeholder={t("investigationScreen.gaps.titleHint")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="gp-detail">{t("investigationScreen.gaps.detail")}</Label>
            <Textarea id="gp-detail" rows={2} value={detail} onChange={(v: string) => setDetail(v)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="gp-kind">{t("investigationScreen.gaps.kind")}</Label>
              <select
                id="gp-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as InvestigationGap["kind"])}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(["document", "witness", "forensic", "timeline", "digital", "seizure"] as const).map((k) => (
                  <option key={k} value={k}>
                    {t(`investigationScreen.gapKinds.${k}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="gp-sev">{t("investigationScreen.gaps.severity")}</Label>
              <select
                id="gp-sev"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="low">{t("investigationScreen.priority.low")}</option>
                <option value="medium">{t("investigationScreen.priority.medium")}</option>
                <option value="high">{t("investigationScreen.priority.high")}</option>
                <option value="critical">{t("investigationScreen.priority.critical")}</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="gp-due">{t("investigationScreen.gaps.dueBy")}</Label>
              <Input id="gp-due" type="date" value={dueBy} onChange={(v: string) => setDueBy(v)} />
            </div>
          </div>
          {create.error instanceof Error && (
            <p className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {create.error.message}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!title.trim() || create.isPending}
            isLoading={create.isPending}
            onClick={() =>
              create
                .mutateAsync({
                  title: title.trim(),
                  detail: detail.trim() || undefined,
                  kind,
                  severity,
                  dueBy: dueBy || undefined,
                })
                .then(() => onOpenChange(false), () => undefined)
            }
          >
            {t("investigationScreen.gaps.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ConfirmRequest = {
  title: string;
  description: string;
  confirmLabel: string;
  run: () => Promise<unknown>;
};

/** Every destructive action on this screen passes through here first. */
function ConfirmActionDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  const { t } = useI18n();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setError(null);
    setPending(false);
  }, [request]);

  return (
    <Dialog open={request !== null} onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{request?.title}</DialogTitle>
          <DialogDescription>{request?.description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            isLoading={pending}
            onClick={async () => {
              if (!request) return;
              setPending(true);
              setError(null);
              try {
                await request.run();
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : t("investigationScreen.errors.rejected"));
              } finally {
                setPending(false);
              }
            }}
          >
            {request?.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const WORKSPACE_STATUSES = ["active", "supervisory-review", "chargesheet", "closed"] as const;

function EditWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
}: {
  workspace: { id: string; title: string; offence?: string; sections: string[]; status: string; priority: Severity; nextCourtDate?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const update = useUpdateWorkspace(workspace.id);
  const [title, setTitle] = React.useState("");
  const [offence, setOffence] = React.useState("");
  const [sections, setSections] = React.useState("");
  const [status, setStatus] = React.useState(workspace.status);
  const [priority, setPriority] = React.useState<Severity>(workspace.priority);
  const [court, setCourt] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle(workspace.title);
      setOffence(workspace.offence ?? "");
      setSections(workspace.sections.join(", "));
      setStatus(workspace.status);
      setPriority(workspace.priority);
      setCourt(workspace.nextCourtDate ? workspace.nextCourtDate.slice(0, 10) : "");
      setError(null);
    }
    // Keyed on the id, not the object: a background refetch replaces the object
    // and would otherwise wipe what the officer is typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workspace.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("investigationScreen.edit.title")}</DialogTitle>
          <DialogDescription>{t("investigationScreen.edit.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="we-title">{t("investigationScreen.edit.caseTitle")}</Label>
            <Input id="we-title" value={title} onChange={(v: string) => setTitle(v)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="we-offence">{t("investigationScreen.edit.offence")}</Label>
            <Input id="we-offence" value={offence} onChange={(v: string) => setOffence(v)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="we-sections">{t("investigationScreen.edit.provisions")}</Label>
            <Input
              id="we-sections"
              value={sections}
              onChange={(v: string) => setSections(v)}
              placeholder={t("investigationScreen.create.provisionsHint")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="we-status">{t("investigationScreen.edit.status")}</Label>
              <select
                id="we-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {WORKSPACE_STATUSES.map((o) => (
                  <option key={o} value={o}>
                    {t(`investigationScreen.status.${o}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="we-priority">{t("investigationScreen.edit.priority")}</Label>
              <select
                id="we-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Severity)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="low">{t("investigationScreen.priority.low")}</option>
                <option value="medium">{t("investigationScreen.priority.medium")}</option>
                <option value="high">{t("investigationScreen.priority.high")}</option>
                <option value="critical">{t("investigationScreen.priority.critical")}</option>
              </select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="we-court">{t("investigationScreen.edit.nextCourtDate")}</Label>
            <Input id="we-court" type="date" value={court} onChange={(v: string) => setCourt(v)} />
          </div>
          {error && (
            <p className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!title.trim() || update.isPending}
            isLoading={update.isPending}
            onClick={async () => {
              setError(null);
              try {
                await update.mutateAsync({
                  title: title.trim(),
                  offence: offence.trim(),
                  sections: sections
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                  status: status as never,
                  priority,
                  nextCourtDate: court,
                });
                onOpenChange(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : t("investigationScreen.errors.rejected"));
              }
            }}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTimelineDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const create = useCreateTimelineEntry(id);
  const [occurredAt, setOccurredAt] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [kind, setKind] = React.useState("incident");
  const [location, setLocation] = React.useState("");
  const [sourceLabel, setSourceLabel] = React.useState("");
  const [sourceLocator, setSourceLocator] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setOccurredAt("");
      setTitle("");
      setDetail("");
      setKind("incident");
      setLocation("");
      setSourceLabel("");
      setSourceLocator("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("investigationScreen.timeline.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("investigationScreen.timeline.dialogDesc")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="tl-at">{t("investigationScreen.timeline.when")}</Label>
            <Input
              id="tl-at"
              type="datetime-local"
              value={occurredAt}
              onChange={(v: string) => setOccurredAt(v)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tl-title">{t("investigationScreen.timeline.what")}</Label>
            <Input
              id="tl-title"
              value={title}
              onChange={(v: string) => setTitle(v)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tl-kind">{t("investigationScreen.timeline.kind")}</Label>
            <select
              id="tl-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="incident">{t("investigationScreen.kinds.incident")}</option>
              <option value="movement">{t("investigationScreen.kinds.movement")}</option>
              <option value="communication">{t("investigationScreen.kinds.communication")}</option>
              <option value="transaction">{t("investigationScreen.kinds.transaction")}</option>
              <option value="detection">{t("investigationScreen.kinds.detection")}</option>
              <option value="report">{t("investigationScreen.kinds.report")}</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tl-where">{t("investigationScreen.timeline.where")}</Label>
            <Input
              id="tl-where"
              value={location}
              onChange={(v: string) => setLocation(v)}
              placeholder={t("investigationScreen.timeline.whereHint")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tl-detail">{t("investigationScreen.timeline.detail")}</Label>
            <Textarea
              id="tl-detail"
              rows={2}
              value={detail}
              onChange={(v: string) => setDetail(v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tl-src">{t("investigationScreen.timeline.source")}</Label>
              <Input
                id="tl-src"
                value={sourceLabel}
                onChange={(v: string) => setSourceLabel(v)}
                placeholder={t("investigationScreen.timeline.sourceHint")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tl-loc">{t("investigationScreen.timeline.locator")}</Label>
              <Input
                id="tl-loc"
                value={sourceLocator}
                onChange={(v: string) => setSourceLocator(v)}
                placeholder={t("investigationScreen.timeline.locatorHint")}
              />
            </div>
          </div>
          {create.error instanceof Error && (
            <p className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {create.error.message}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!occurredAt || !title.trim() || create.isPending}
            isLoading={create.isPending}
            onClick={async () => {
              // datetime-local has no zone; send the instant on the officer's clock.
              await create.mutateAsync({
                occurredAt: new Date(occurredAt).toISOString(),
                title: title.trim(),
                detail: detail.trim() || undefined,
                kind: kind as never,
                location: location.trim() || undefined,
                sources: sourceLabel.trim()
                  ? [{ label: sourceLabel.trim(), locator: sourceLocator.trim() || undefined }]
                  : undefined,
              }).then(() => onOpenChange(false), () => undefined);
            }}
          >
            {t("investigationScreen.timeline.addEntry")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddContradictionDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const create = useCreateContradiction(id);
  const [title, setTitle] = React.useState("");
  const [aLabel, setALabel] = React.useState("");
  const [aClaim, setAClaim] = React.useState("");
  const [bLabel, setBLabel] = React.useState("");
  const [bClaim, setBClaim] = React.useState("");
  const [severity, setSeverity] = React.useState<Severity>("medium");

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setALabel("");
      setAClaim("");
      setBLabel("");
      setBClaim("");
      setSeverity("medium");
    }
  }, [open]);

  const valid = [title, aLabel, aClaim, bLabel, bClaim].every((v) => v.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("investigationScreen.contradictions.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("investigationScreen.contradictions.dialogDesc")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="cd-title">{t("investigationScreen.contradictions.what")}</Label>
            <Input
              id="cd-title"
              value={title}
              onChange={(v: string) => setTitle(v)}
              placeholder={t("investigationScreen.contradictions.whatHint")}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cd-al">{t("investigationScreen.contradictions.first")}</Label>
              <Input
                id="cd-al"
                value={aLabel}
                onChange={(v: string) => setALabel(v)}
                placeholder={t("investigationScreen.contradictions.firstHint")}
              />
              <Textarea
                rows={3}
                value={aClaim}
                onChange={(v: string) => setAClaim(v)}
                placeholder={t("investigationScreen.contradictions.claimHint")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cd-bl">{t("investigationScreen.contradictions.second")}</Label>
              <Input
                id="cd-bl"
                value={bLabel}
                onChange={(v: string) => setBLabel(v)}
                placeholder={t("investigationScreen.contradictions.secondHint")}
              />
              <Textarea
                rows={3}
                value={bClaim}
                onChange={(v: string) => setBClaim(v)}
                placeholder={t("investigationScreen.contradictions.claimHint")}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cd-sev">{t("investigationScreen.contradictions.severity")}</Label>
            <select
              id="cd-sev"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="low">{t("investigationScreen.priority.low")}</option>
              <option value="medium">{t("investigationScreen.priority.medium")}</option>
              <option value="high">{t("investigationScreen.priority.high")}</option>
              <option value="critical">{t("investigationScreen.priority.critical")}</option>
            </select>
          </div>
          {create.error instanceof Error && (
            <p className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {create.error.message}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!valid || create.isPending}
            isLoading={create.isPending}
            onClick={async () => {
              await create.mutateAsync({
                title: title.trim(),
                statementALabel: aLabel.trim(),
                statementAClaim: aClaim.trim(),
                statementBLabel: bLabel.trim(),
                statementBClaim: bClaim.trim(),
                severity,
              }).then(() => onOpenChange(false), () => undefined);
            }}
          >
            {t("investigationScreen.contradictions.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTaskDialog({
  id,
  context,
  onClose,
}: {
  id: string;
  context: { gapId?: string; contradictionId?: string } | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const create = useCreateTask(id);
  const [title, setTitle] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [priority, setPriority] = React.useState<Severity>("medium");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [assigneeName, setAssigneeName] = React.useState("");

  React.useEffect(() => {
    if (context) {
      setTitle("");
      setDueDate("");
      setPriority("medium");
      setAssigneeId("");
      setAssigneeName("");
      create.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  return (
    <Dialog open={context !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("investigationScreen.tasks.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {context?.gapId ? t("investigationScreen.tasks.dialogDescGap") : t("investigationScreen.tasks.dialogDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="tk-title">{t("investigationScreen.tasks.task")}</Label>
            <Input
              id="tk-title"
              value={title}
              onChange={(v: string) => setTitle(v)}
              placeholder={t("investigationScreen.tasks.taskHint")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tk-due">{t("investigationScreen.tasks.dueBy")}</Label>
              <Input
                id="tk-due"
                type="date"
                value={dueDate}
                onChange={(v: string) => setDueDate(v)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tk-pri">{t("investigationScreen.tasks.priority")}</Label>
              <select
                id="tk-pri"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Severity)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="low">{t("investigationScreen.priority.low")}</option>
                <option value="medium">{t("investigationScreen.priority.medium")}</option>
                <option value="high">{t("investigationScreen.priority.high")}</option>
                <option value="critical">{t("investigationScreen.priority.critical")}</option>
              </select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("investigationScreen.tasks.assignTo")}</Label>
            <OfficerPicker
              value={assigneeId}
              onChange={(officerId, name) => {
                setAssigneeId(officerId);
                setAssigneeName(name);
              }}
            />
            {assigneeName && (
              <p className="text-xs text-foreground-muted">
                {t("investigationScreen.tasks.assigning")} <span className="font-medium text-foreground">{assigneeName}</span>
              </p>
            )}
          </div>
          {create.error instanceof Error && (
            <p className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {create.error.message}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!title.trim() || create.isPending}
            isLoading={create.isPending}
            onClick={async () => {
              await create.mutateAsync({
                title: title.trim(),
                dueDate: dueDate || undefined,
                priority,
                assigneeId: assigneeId || undefined,
                gapId: context?.gapId,
                contradictionId: context?.contradictionId,
              }).then(() => onClose(), () => undefined);
            }}
          >
            {t("investigationScreen.tasks.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
