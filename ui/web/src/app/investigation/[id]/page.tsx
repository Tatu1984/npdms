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
  useCreatePerson,
  useCreateTask,
  useCreateTimelineEntry,
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
import { EvidencePicker } from "@/components/platform/pickers";
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
  if (origin === "derived") {
    return (
      <StatusPill tone="info">
        <ScanSearch className="h-3 w-3" />
        Case rule
      </StatusPill>
    );
  }
  if (origin === "ai") {
    return <StatusPill tone="ai">AI suggestion</StatusPill>;
  }
  return <StatusPill tone="neutral">Officer</StatusPill>;
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
  const links = useLinkGraph(id, tab === "links");

  const [personDialog, setPersonDialog] = React.useState(false);
  const [personSheet, setPersonSheet] = React.useState<WorkspacePerson | null>(null);
  const [timelineDialog, setTimelineDialog] = React.useState(false);
  const [contradictionDialog, setContradictionDialog] = React.useState(false);
  const [contradictionSheet, setContradictionSheet] = React.useState<Contradiction | null>(null);
  const [gapSheet, setGapSheet] = React.useState<InvestigationGap | null>(null);
  const [taskDialog, setTaskDialog] = React.useState<{ gapId?: string; contradictionId?: string } | null>(
    null,
  );
  const [evidenceDialog, setEvidenceDialog] = React.useState(false);

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
            <AlertTitle>Workspace not available</AlertTitle>
            <AlertDescription>
              {workspace.error instanceof Error
                ? workspace.error.message
                : "This workspace could not be loaded."}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => router.push("/investigation")}
              >
                Back to workspaces
              </Button>
            </AlertDescription>
          </div>
        </Alert>
      </DashboardLayout>
    );
  }

  const ws = workspace.data;

  const screenMenu: Action[] = [
    act.run("recompute", "Re-run case rules", () => recompute.mutate(), {
      icon: RefreshCw,
      description: "Refresh the gap list from the record",
    }),
    act.sep("s1"),
    act.link("casefile", "Case file & court readiness", `/case-file/${ws.id}`, {
      icon: ClipboardList,
    }),
    act.link("custody", "Evidence custody ledger", "/custody", { icon: ShieldCheck }),
    act.link("audit", "Audit trail", "/audit", { icon: ClipboardList }),
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
                Add to timeline
              </Button>
              <Button onClick={() => setTab("brief")}>
                <FileDown className="h-4 w-4" />
                Case brief
              </Button>
            </>
          }
          menu={screenMenu}
        />

        <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Offence" value={pick(bilingual(ws.offence, ws.offenceBn)) || "—"} />
          <Field label="Provisions" value={ws.sections.join(", ") || "—"} mono />
          <Field label="Investigating officer" value={ws.ioName || "Unassigned"} />
          <Field label="Supervisory officer" value={ws.supervisorName || "—"} />
          <Field label="Registered on" value={new Date(ws.registeredOn).toLocaleDateString("en-IN")} />
          <Field
            label="Next court date"
            value={
              ws.nextCourtDate ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-warning" />
                  {new Date(ws.nextCourtDate).toLocaleDateString("en-IN")}
                </span>
              ) : (
                "Not listed"
              )
            }
          />
          <Field label="Priority" value={<SeverityBadge level={ws.priority} />} />
          <Field
            label="Progress"
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
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence ({ws.counts.evidence})</TabsTrigger>
            <TabsTrigger value="timeline">Timeline ({ws.counts.timeline})</TabsTrigger>
            <TabsTrigger value="persons">Persons ({ws.counts.persons})</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="contradictions">
              Contradictions ({ws.counts.contradictions})
            </TabsTrigger>
            <TabsTrigger value="gaps">Gaps ({ws.counts.gaps})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({ws.counts.openTasks})</TabsTrigger>
            <TabsTrigger value="brief">Brief</TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------- overview */}
          <TabsContent value="overview">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                <StatTile
                  label="Evidence linked"
                  value={ws.counts.evidence}
                  icon={ShieldCheck}
                  onClick={() => setTab("evidence")}
                />
                <StatTile
                  label="Persons"
                  value={ws.counts.persons}
                  icon={Users}
                  onClick={() => setTab("persons")}
                />
                <StatTile
                  label="Contradictions"
                  value={ws.counts.contradictions}
                  icon={GitCompareArrows}
                  tone="danger"
                  onClick={() => setTab("contradictions")}
                />
                <StatTile
                  label="Open gaps"
                  value={ws.counts.gaps}
                  icon={ScanSearch}
                  tone="warning"
                  onClick={() => setTab("gaps")}
                />
                <StatTile
                  label="Vehicles"
                  value={ws.counts.vehicles}
                  icon={Link2}
                  onClick={() => setTab("links")}
                />
                <StatTile
                  label="Locations"
                  value={ws.counts.locations}
                  icon={MapPin}
                  onClick={() => setTab("links")}
                />
              </div>

              <Alert variant="info">
                <ScanSearch />
                <div>
                  <AlertTitle>Gaps come from case rules, not a model</AlertTitle>
                  <AlertDescription>
                    Every open gap below is a plain check over the record — a missing statement, an
                    unexplained interval, evidence that was never attached. Each states what it
                    looked at, and closes on its own when the condition is resolved.
                  </AlertDescription>
                </div>
              </Alert>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel
                  title="Open gaps"
                  description="What this file is missing"
                  actions={
                    <Button variant="ghost" size="sm" onClick={() => setTab("gaps")}>
                      {t("common.viewAll")}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  }
                  bodyClassName="flex flex-col gap-2"
                >
                  {gaps.isLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (gaps.data ?? []).length === 0 ? (
                    <p className="py-4 text-center text-sm text-foreground-muted">
                      No open gaps — the record satisfies every case rule.
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
                              Due {new Date(g.dueBy).toLocaleDateString("en-IN")}
                            </span>
                          )}
                        </span>
                        <SeverityBadge level={g.severity} />
                      </button>
                    ))
                  )}
                </Panel>

                <Panel
                  title="Recorded contradictions"
                  description="Discrepancies an officer flagged between sources"
                  actions={
                    <Button variant="ghost" size="sm" onClick={() => setTab("contradictions")}>
                      {t("common.viewAll")}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  }
                  bodyClassName="flex flex-col gap-2"
                >
                  {(contradictions.data ?? []).length === 0 ? (
                    <p className="py-4 text-center text-sm text-foreground-muted">
                      None recorded.
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
              title="Linked evidence"
              description="Items from the evidence register attached to this investigation"
              actions={
                <Button size="sm" onClick={() => setEvidenceDialog(true)}>
                  <Link2 className="h-3.5 w-3.5" />
                  Attach evidence
                </Button>
              }
              menu={[
                act.link("register", "Open evidence register", "/evidence", { icon: ShieldCheck }),
                act.link("custody", "Custody ledger", "/custody", { icon: ShieldCheck }),
              ]}
              bodyClassName="flex flex-col gap-2"
            >
              {(evidence.data ?? []).length === 0 ? (
                <EmptyState
                  title="No evidence attached yet"
                  description="Attaching evidence closes the no-evidence gap and adds the item to the case file."
                  icon={Link2}
                  action={
                    <Button size="sm" onClick={() => setEvidenceDialog(true)}>
                      <Link2 className="h-4 w-4" />
                      Attach evidence
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
                        {e.description || "Evidence item"}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
                        {e.evidenceNumber || e.evidenceId}
                        {e.note ? ` · ${e.note}` : ""}
                      </p>
                    </div>
                    <ActionMenu
                      size="sm"
                      actions={[
                        act.link("open", "Open in custody ledger", "/custody", {
                          icon: ShieldCheck,
                        }),
                        act.sep("s"),
                        act.run(
                          "unlink",
                          "Detach from this case",
                          () => unlinkEvidence.mutate(e.evidenceId),
                          { icon: Trash2, destructive: true, description: "The register entry is kept" },
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
              title="Case chronology"
              description="Entries recorded by the investigating team, each with its sources"
              actions={
                <Button size="sm" onClick={() => setTimelineDialog(true)}>
                  <CalendarClock className="h-3.5 w-3.5" />
                  Add entry
                </Button>
              }
              bodyClassName="p-0"
            >
              {timeline.isLoading ? (
                <div className="p-4">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (timeline.data ?? []).length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="No chronology yet"
                    description="Add what happened and when. A chronology makes unexplained intervals and conflicting accounts visible."
                    icon={CalendarClock}
                    action={
                      <Button size="sm" onClick={() => setTimelineDialog(true)}>
                        Add the first entry
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
                                    act.run("remove", "Remove entry", () => deleteEntry.mutate(entry.id), {
                                      icon: Trash2,
                                      destructive: true,
                                    }),
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
                                  reviewTimeline.mutate({ entryId: entry.id, state: "accepted" })
                                }
                                onReject={() =>
                                  reviewTimeline.mutate({ entryId: entry.id, state: "rejected" })
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
                  Add person
                </Button>
              </div>

              {(persons.data ?? []).length === 0 ? (
                <EmptyState
                  title="No persons recorded"
                  description="Add the complainant, witnesses, suspects and accused as they are identified."
                  icon={Users}
                  action={
                    <Button size="sm" onClick={() => setPersonDialog(true)}>
                      Add the first person
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
                              alias {p.aliases.join(", ")}
                            </p>
                          )}
                        </div>
                        <StatusPill
                          tone={
                            p.role === "accused" ? "danger" : p.role === "suspect" ? "warning" : "info"
                          }
                        >
                          {p.role}
                        </StatusPill>
                      </div>

                      <dl className="grid grid-cols-2 gap-2">
                        <Field label="Age" value={p.age ?? "—"} />
                        <Field label="Statements" value={p.statementsCount} />
                        <Field label="Phone" value={p.phone ?? "—"} mono />
                        <Field label="Vehicles" value={p.vehicles.join(", ") || "—"} mono />
                      </dl>

                      {p.role === "witness" && p.statementsCount === 0 && (
                        <p className="rounded-md border border-warning/25 bg-warning-subtle px-2.5 py-1.5 text-xs text-foreground-muted">
                          No statement recorded under BNSS 180 — this holds a gap open.
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
                              "Record a statement taken",
                              () =>
                                updatePerson.mutate({
                                  personId: p.id,
                                  statementsCount: p.statementsCount + 1,
                                }),
                              { icon: ClipboardList, description: "Increments the statement count" },
                            ),
                            act.run("profile", "Open profile", () => setPersonSheet(p), {
                              icon: Users,
                            }),
                            act.sep("s"),
                            act.link("lookout", "Add to lookout register", "/lookout", {
                              icon: AlertTriangle,
                            }),
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
              title="Relationships on this case"
              description="Assembled from what has been recorded — persons and their phones, vehicles, attached evidence, and the places events occurred"
              menu={[
                act.link("networks", "Open the graph workspace", "/networks", { icon: Link2 }),
                act.link("cyber", "Financial network", "/cyber-intelligence", { icon: Link2 }),
              ]}
            >
              {links.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : !links.data || links.data.nodes.length <= 1 ? (
                <EmptyState
                  title="Nothing to connect yet"
                  description="Add persons with phone numbers or vehicles, record where events occurred, or attach evidence. Connections appear as the record grows."
                  icon={Link2}
                  action={
                    <Button size="sm" onClick={() => setPersonDialog(true)}>
                      <UserPlus className="h-4 w-4" />
                      Add a person
                    </Button>
                  }
                />
              ) : (
                <>
                  <RelationshipGraph graph={links.data} />
                  <p className="mt-3 text-xs text-foreground-muted">
                    Every node is a record someone entered and every line a reference between two of
                    them. Nothing here is inferred — this is the case as recorded, drawn out.
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
                  Record a contradiction
                </Button>
              </div>

              {(contradictions.data ?? []).length === 0 ? (
                <EmptyState
                  title="No contradictions recorded"
                  description="When two sources disagree — a statement against CCTV, an alibi against tower data — record it here as an investigative lead."
                  icon={GitCompareArrows}
                  action={
                    <Button size="sm" onClick={() => setContradictionDialog(true)}>
                      Record the first one
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
                        decidedBy={ws.ioName}
                        onAccept={() =>
                          reviewContradiction.mutate({ contradictionId: c.id, state: "accepted" })
                        }
                        onReject={() =>
                          reviewContradiction.mutate({ contradictionId: c.id, state: "rejected" })
                        }
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setContradictionSheet(c)}>
                          Examine
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTaskDialog({ contradictionId: c.id })}
                        >
                          <ListChecks className="h-3.5 w-3.5" />
                          Raise a task
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
                  Derived from the record by deterministic checks. A gap closes by itself once its
                  condition no longer holds.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={recompute.isPending}
                  onClick={() => recompute.mutate()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Re-run case rules
                </Button>
              </div>

              {(gaps.data ?? []).length === 0 ? (
                <EmptyState
                  title="No open gaps"
                  description="Every case rule is satisfied by the current record."
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
                            Due {new Date(g.dueBy).toLocaleDateString("en-IN")}
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
                            Create task
                          </Button>
                          <ActionMenu
                            size="sm"
                            actions={[
                              act.run(
                                "dismiss",
                                "Dismiss — not applicable",
                                () => setGapStatus.mutate({ gapId: g.id, status: "dismissed" }),
                                {
                                  icon: Trash2,
                                  description: "Stays dismissed across future rule runs",
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
              title="Investigation tasks"
              description="Raised against gaps and contradictions, or directly by an officer"
              actions={
                <Button size="sm" onClick={() => setTaskDialog({})}>
                  <ListChecks className="h-3.5 w-3.5" />
                  New task
                </Button>
              }
              bodyClassName="flex flex-col gap-2"
            >
              {(tasks.data ?? []).length === 0 ? (
                <EmptyState
                  title="No tasks yet"
                  description="Raise a task from a gap, or create one directly."
                  icon={ListChecks}
                  action={
                    <Button size="sm" onClick={() => setTaskDialog({})}>
                      Create a task
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
                        {task.assigneeName || "Unassigned"}
                        {task.dueDate
                          ? ` · due ${new Date(task.dueDate).toLocaleDateString("en-IN")}`
                          : ""}
                        {task.gapId ? " · raised from a gap" : ""}
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
                        {task.status}
                      </StatusPill>
                      <ActionMenu size="sm" actions={taskActions(task, updateTask.mutate, deleteTask.mutate)} />
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
                  <AlertTitle>A compilation, not a narrative</AlertTitle>
                  <AlertDescription>
                    The brief is assembled from what has been recorded on this file. Nothing here is
                    generated prose — every line traces to an entry an officer made.
                  </AlertDescription>
                </div>
              </Alert>

              {brief.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : brief.data ? (
                <Panel title="Case brief" description={`Assembled ${new Date(brief.data.generatedAt).toLocaleString("en-IN")}`}>
                  <div className="flex flex-col gap-5">
                    <BriefSection title="Chronology" empty="No timeline entries recorded.">
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

                    <BriefSection title="Persons" empty="No persons recorded.">
                      {brief.data.persons.map((p) => (
                        <li key={p.id} className="flex gap-3 text-sm">
                          <span className="w-32 shrink-0 text-xs uppercase tracking-wide text-foreground-subtle">
                            {p.role}
                          </span>
                          <span className="text-foreground-muted">
                            {pick(bilingual(p.name, p.nameBn))} · {p.statementsCount} statement(s)
                          </span>
                        </li>
                      ))}
                    </BriefSection>

                    <BriefSection title="Outstanding gaps" empty="No open gaps.">
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

                    <BriefSection title="Investigative leads" empty="No contradictions recorded.">
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

                    <BriefSection title="Open tasks" empty="No open tasks.">
                      {brief.data.openTasks.map((task) => (
                        <li key={task.id} className="flex gap-3 text-sm">
                          <span className="w-32 shrink-0 text-xs text-foreground-subtle">
                            {task.assigneeName || "Unassigned"}
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

      <AddPersonDialog id={id} open={personDialog} onOpenChange={setPersonDialog} />
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
        onAttach={async (evidenceId, note) => {
          await linkEvidence.mutateAsync({ evidenceId, note });
          setEvidenceDialog(false);
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
                  {personSheet.role}
                  {personSheet.address ? ` · ${personSheet.address}` : ""}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Age" value={personSheet.age ?? "—"} />
                  <Field label="Phone" value={personSheet.phone ?? "—"} mono />
                  <Field label="Statements recorded" value={personSheet.statementsCount} />
                  <Field label="Aliases" value={personSheet.aliases.join(", ") || "—"} />
                </dl>
                {personSheet.riskNote && (
                  <p className="rounded-md border border-warning/25 bg-warning-subtle px-3 py-2 text-sm text-foreground-muted">
                    {personSheet.riskNote}
                  </p>
                )}
                <Button
                  onClick={() => {
                    updatePerson.mutate({
                      personId: personSheet.id,
                      statementsCount: personSheet.statementsCount + 1,
                    });
                    setPersonSheet(null);
                  }}
                >
                  <ClipboardList className="h-4 w-4" />
                  Record a statement taken
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
                <SheetDescription>An investigative lead, not a conclusion</SheetDescription>
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
                  onAccept={() =>
                    reviewContradiction.mutate({
                      contradictionId: contradictionSheet.id,
                      state: "accepted",
                    })
                  }
                  onReject={() =>
                    reviewContradiction.mutate({
                      contradictionId: contradictionSheet.id,
                      state: "rejected",
                    })
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
                  Raise a task
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
                <SheetDescription>{gapSheet.kind} gap</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <p className="text-sm text-foreground-muted">
                  {pick(bilingual(gapSheet.detail, gapSheet.detailBn))}
                </p>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Severity" value={<SeverityBadge level={gapSheet.severity} />} />
                  <Field label="Raised by" value={<OriginTag origin={gapSheet.origin} />} />
                  <Field
                    label="Due by"
                    value={gapSheet.dueBy ? new Date(gapSheet.dueBy).toLocaleDateString("en-IN") : "—"}
                  />
                </dl>
                {gapSheet.ruleKey && (
                  <p className="rounded-md border border-info/25 bg-info-subtle px-3 py-2 text-xs text-foreground-muted">
                    Raised by case rule <span className="font-mono">{gapSheet.ruleKey}</span>. It
                    closes on its own once the condition described above is resolved.
                  </p>
                )}
                <Button
                  onClick={() => {
                    setTaskDialog({ gapId: gapSheet.id });
                    setGapSheet(null);
                  }}
                >
                  <ListChecks className="h-4 w-4" />
                  Create a task to close this
                </Button>
                {gapSheet.kind === "forensic" && (
                  <Button variant="outline" onClick={() => router.push("/forensics")}>
                    Open forensics register
                  </Button>
                )}
                {gapSheet.kind === "witness" && (
                  <Button variant="outline" onClick={() => { setGapSheet(null); setTab("persons"); }}>
                    Go to persons
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

function taskActions(
  task: InvestigationTask,
  update: (vars: { taskId: string; status?: InvestigationTask["status"] }) => void,
  onDelete?: (taskId: string) => void,
): Action[] {
  const out: Action[] = [];
  if (task.status !== "in-progress" && task.status !== "done") {
    out.push(
      act.run("start", "Mark in progress", () => update({ taskId: task.id, status: "in-progress" }), {
        icon: ListChecks,
      }),
    );
  }
  if (task.status !== "done") {
    out.push(
      act.run("done", "Mark complete", () => update({ taskId: task.id, status: "done" }), {
        icon: ListChecks,
        description: "Re-runs the case rules",
      }),
    );
    out.push(
      act.run("block", "Mark blocked", () => update({ taskId: task.id, status: "blocked" }), {
        icon: AlertTriangle,
      }),
    );
  } else {
    out.push(
      act.run("reopen", "Reopen", () => update({ taskId: task.id, status: "open" }), {
        icon: RefreshCw,
      }),
    );
  }
  out.push(act.sep("s"));
  out.push(act.link("officer", "Personnel directory", "/personnel", { icon: Users }));
  if (onDelete) {
    out.push(
      act.run("delete", "Delete task", () => onDelete(task.id), {
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alreadyLinked: string[];
  onAttach: (evidenceId: string, note?: string) => Promise<void>;
  pending: boolean;
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
          <DialogTitle>Attach evidence to this case</DialogTitle>
          <DialogDescription>
            Choose from the evidence register. Attaching an item closes the no-evidence gap and
            brings it into the case file.
          </DialogDescription>
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
              Attaching <span className="font-medium text-foreground">{label}</span>
            </p>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="ev-note">Note</Label>
            <Input
              id="ev-note"
              value={note}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
              placeholder="Optional — why this item matters to the case"
            />
          </div>
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
            Attach
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

function AddPersonDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const create = useCreatePerson(id);
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<WorkspacePerson["role"]>("witness");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setName("");
      setRole("witness");
      setPhone("");
      setAddress("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a person to the case</DialogTitle>
          <DialogDescription>
            Adding a witness opens a gap until a statement is recorded against them.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-role">Role</Label>
            <select
              id="p-role"
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspacePerson["role"])}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="complainant">Complainant</option>
              <option value="victim">Victim</option>
              <option value="witness">Witness</option>
              <option value="suspect">Suspect</option>
              <option value="accused">Accused</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-phone">Phone</Label>
            <Input
              id="p-phone"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-address">Address</Label>
            <Input
              id="p-address"
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
            />
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
            disabled={!name.trim() || create.isPending}
            isLoading={create.isPending}
            onClick={async () => {
              await create.mutateAsync({
                name: name.trim(),
                role,
                phone: phone.trim() || undefined,
                address: address.trim() || undefined,
              });
              onOpenChange(false);
            }}
          >
            Add person
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
          <DialogTitle>Add a timeline entry</DialogTitle>
          <DialogDescription>
            What happened, when, and what shows it. Intervals longer than an hour between entries
            are flagged as gaps.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="tl-at">When it occurred</Label>
            <Input
              id="tl-at"
              type="datetime-local"
              value={occurredAt}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOccurredAt(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tl-title">What happened</Label>
            <Input
              id="tl-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tl-kind">Kind</Label>
            <select
              id="tl-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="incident">Incident</option>
              <option value="movement">Movement</option>
              <option value="communication">Communication</option>
              <option value="transaction">Transaction</option>
              <option value="detection">Detection</option>
              <option value="report">Report</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tl-where">Where it happened</Label>
            <Input
              id="tl-where"
              value={location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
              placeholder="Address or landmark — distinct places give the case its location count"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tl-detail">Detail</Label>
            <Textarea
              id="tl-detail"
              rows={2}
              value={detail}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDetail(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tl-src">Source</Label>
              <Input
                id="tl-src"
                value={sourceLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceLabel(e.target.value)}
                placeholder="e.g. Showroom DVR CH-01"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tl-loc">Locator</Label>
              <Input
                id="tl-loc"
                value={sourceLocator}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceLocator(e.target.value)}
                placeholder="Timestamp, page or row"
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
              await create.mutateAsync({
                occurredAt,
                title: title.trim(),
                detail: detail.trim() || undefined,
                kind: kind as never,
                location: location.trim() || undefined,
                sources: sourceLabel.trim()
                  ? [{ label: sourceLabel.trim(), locator: sourceLocator.trim() || undefined }]
                  : undefined,
              });
              onOpenChange(false);
            }}
          >
            Add entry
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
          <DialogTitle>Record a contradiction</DialogTitle>
          <DialogDescription>
            Two sources that disagree. This is recorded as an investigative lead and stays pending
            until an officer accepts it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="cd-title">What conflicts</Label>
            <Input
              id="cd-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="e.g. Timing conflict between witness account and CCTV"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cd-al">First source</Label>
              <Input
                id="cd-al"
                value={aLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setALabel(e.target.value)}
                placeholder="Witness — name"
              />
              <Textarea
                rows={3}
                value={aClaim}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAClaim(e.target.value)}
                placeholder="What it says"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cd-bl">Second source</Label>
              <Input
                id="cd-bl"
                value={bLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBLabel(e.target.value)}
                placeholder="CCTV / CDR / document"
              />
              <Textarea
                rows={3}
                value={bClaim}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBClaim(e.target.value)}
                placeholder="What it says"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cd-sev">Severity</Label>
            <select
              id="cd-sev"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
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
              });
              onOpenChange(false);
            }}
          >
            Record
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

  React.useEffect(() => {
    if (context) {
      setTitle("");
      setDueDate("");
      setPriority("medium");
    }
  }, [context]);

  return (
    <Dialog open={context !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New investigation task</DialogTitle>
          <DialogDescription>
            {context?.gapId
              ? "Raised against a gap. Completing it re-runs the case rules; the gap closes only if its condition is actually resolved."
              : "Appears in the assigned officer's worklist."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="tk-title">Task</Label>
            <Input
              id="tk-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="What must be done"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tk-due">Due by</Label>
              <Input
                id="tk-due"
                type="date"
                value={dueDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tk-pri">Priority</Label>
              <select
                id="tk-pri"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Severity)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
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
                gapId: context?.gapId,
                contradictionId: context?.contradictionId,
              });
              onClose();
            }}
          >
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
