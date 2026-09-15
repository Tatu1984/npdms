"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSearch,
  Lock,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  Radio,
  Pencil,
  Route,
  ScanFace,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { ApiClientError } from "@/lib/api/client";
import {
  CHANNELS,
  OUTCOMES,
  SIGHTING_SOURCES,
  VULNERABILITIES,
  type ChecklistItem,
  type ClosureOutcome,
  type ContactChannel,
  type ContactDirection,
  type MissingPerson,
  type MissingSighting,
  type SightingSource,
  type Vulnerability,
} from "@/lib/api/missing-persons";
import {
  useCloseMissingPerson,
  useCompleteChecklistItem,
  useDecideMissingSighting,
  useFamilyContacts,
  useIssueMissingLookout,
  useMissingChecklist,
  useMissingPerson,
  useMissingSightings,
  useMovement,
  useRecordFamilyContact,
  useRecordMissingSighting,
  useStartSearch,
  useUpdateMissingPerson,
  useMissingBoard,
} from "@/hooks/use-missing-persons";
import { LocationPicker, type LocationValue } from "@/components/ui/LocationPicker";
import { PhotoGallery } from "../photos";
import { SearchMapPanel } from "../search-map";
import { StationCheckDialog, StationChecksPanel } from "../station-checks";
import { BoardCard } from "../board-card";
import { EmptyState, Field as InfoField, PageHeader, Panel, PhaseBadge, StatTile, StatusPill } from "@/components/platform/primitives";
import { act } from "@/components/platform/actions";
import { OfficerPicker } from "@/components/platform/pickers";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { CHANNEL, GENDER, L, OUTCOME, PRIORITY, SOURCE, STATUS, VULNERABILITY } from "../labels";
import { errorMessage, Field, formatWhen, nowLocal, selectClass, toApiTime } from "../shared";
import { FaceMatchingPanel } from "@/components/face-recognition/FaceMatchingPanel";

type DialogKind = null | "edit" | "close" | "lookout" | "start" | "sighting" | "contact";

export default function MissingPersonDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { pick, t } = useI18n();
  const { user } = useAuthStore();
  const id = params.id;

  const report = useMissingPerson(id);
  const loaded = report.isSuccess;
  const checklist = useMissingChecklist(id, loaded);
  const sightings = useMissingSightings(id, loaded);
  const movement = useMovement(id, loaded);
  const contacts = useFamilyContacts(id, loaded);

  const [tab, setTab] = React.useState(searchParams.get("tab") ?? "overview");
  const [dialog, setDialog] = React.useState<DialogKind>(null);
  const [completing, setCompleting] = React.useState<ChecklistItem | null>(null);
  const [rejecting, setRejecting] = React.useState<MissingSighting | null>(null);
  const [checking, setChecking] = React.useState(false);

  const canSI = Boolean(user && hasMinimumRole(user.role, "SI"));
  const canASI = Boolean(user && hasMinimumRole(user.role, "ASI"));
  const restricted = report.error instanceof ApiClientError && report.error.code === 403;
  // A child's record refused to this officer: the broadcast view still applies.
  const board = useMissingBoard(restricted);
  const myStationId = user?.stationId ?? null;

  if (report.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const broadcastEntry = restricted ? board.data?.data.find((e) => e.id === id) : undefined;
  if (restricted && broadcastEntry && board.data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-5">
          <PageHeader
            title={broadcastEntry.personName}
            description={`${broadcastEntry.reportNumber} · ${broadcastEntry.stationName}`}
            icon={Radio}
            badge={<PhaseBadge phase={4} />}
            breadcrumb={[{ label: pick(L.back), href: "/missing-persons" }, { label: broadcastEntry.reportNumber }]}
          />
          <Alert variant="info">
            <Lock />
            <AlertDescription>{pick(L.broadcastOnly)}</AlertDescription>
          </Alert>
          <BoardCard
            entry={broadcastEntry}
            stations={board.data.stations}
            myStation={board.data.viewerStationId}
            now={board.dataUpdatedAt}
            onCheck={canASI && board.data.viewerStationId ? () => setChecking(true) : undefined}
          />
          <StationChecksPanel reportId={id} />
        </div>
        {checking && (
          <StationCheckDialog
            open
            onClose={() => setChecking(false)}
            reportId={id}
            reportNumber={broadcastEntry.reportNumber}
            personName={broadcastEntry.personName}
            stationName={board.data.stations.find((s) => s.id === board.data?.viewerStationId)?.name ?? ""}
          />
        )}
      </DashboardLayout>
    );
  }

  if (report.isError && !(restricted && board.isLoading)) {
    const code = report.error instanceof ApiClientError ? report.error.code : 0;
    return (
      <DashboardLayout>
        <EmptyState
          icon={code === 403 ? Lock : FileSearch}
          title={code === 403 ? pick(L.restricted) : code === 404 ? pick(L.notFound) : pick(L.loadFailed)}
          description={errorMessage(report.error) ?? undefined}
          action={
            <div className="flex gap-2">
              {code !== 403 && code !== 404 && (
                <Button variant="outline" onClick={() => report.refetch()}>
                  {pick(L.retry)}
                </Button>
              )}
              <Link href="/missing-persons">
                <Button>{pick(L.back)}</Button>
              </Link>
            </div>
          }
        />
      </DashboardLayout>
    );
  }

  if (!report.data) {
    return (
      <DashboardLayout>
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  const p = report.data as MissingPerson;
  const canCheckHere = canASI && (p.status === "REPORTED" || p.status === "SEARCHING") && Boolean(myStationId) && p.stationId !== myStationId;
  const open = p.status === "REPORTED" || p.status === "SEARCHING";
  const hoursSince = Math.max(0, Math.round((Date.now() - new Date(p.lastSeenAt).getTime()) / 3_600_000));
  const pendingDecisions = (sightings.data ?? []).filter((s) => !s.decision).length;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={p.personName}
          description={`${p.reportNumber} · ${p.stationName || "—"} · ${pick(L.age)} ${p.age}`}
          icon={FileSearch}
          badge={<PhaseBadge phase={4} />}
          breadcrumb={[{ label: pick(L.back), href: "/missing-persons" }, { label: p.reportNumber }]}
          actions={
            <>
              {canCheckHere && (
                <Button variant="outline" onClick={() => setChecking(true)} data-testid="detail-record-check">
                  <Radio className="h-4 w-4" />
                  {t("missingBoard.board.recordCheck")}
                </Button>
              )}
              {p.status === "REPORTED" && canASI && (
                <Button onClick={() => setDialog("start")}>
                  <ShieldCheck className="h-4 w-4" />
                  {pick(L.startSearch)}
                </Button>
              )}
              {open && (
                <Button variant="outline" onClick={() => setDialog("sighting")}>
                  <ScanFace className="h-4 w-4" />
                  {pick(L.recordSighting)}
                </Button>
              )}
              <Button variant="outline" onClick={() => setDialog("contact")}>
                <MessageSquare className="h-4 w-4" />
                {pick(L.logContact)}
              </Button>
            </>
          }
          menu={[
            ...(open && canSI
              ? [
                  act.run("edit", pick(L.edit), () => setDialog("edit"), { icon: Pencil }),
                  ...(p.status === "SEARCHING" && !p.lookoutId
                    ? [act.run("lookout", pick(L.issueLookout), () => setDialog("lookout"), { icon: ScanFace })]
                    : []),
                  act.run("close", pick(L.close), () => setDialog("close"), { icon: CheckCircle2 }),
                  act.sep("s1"),
                ]
              : []),
            ...(p.lookoutId ? [act.link("lookout-open", pick(L.viewLookout), `/lookout/${p.lookoutId}`, { icon: ScanFace })] : []),
            act.link("audit", pick(L.audit), "/audit", { icon: ClipboardCheck }),
          ]}
        />

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={STATUS[p.status].tone}>{pick(STATUS[p.status])}</StatusPill>
          <StatusPill tone={PRIORITY[p.priority].tone}>{pick(PRIORITY[p.priority])}</StatusPill>
          {p.vulnerabilities.map((v) => (
            <StatusPill key={v} tone="warning">
              {pick(VULNERABILITY[v])}
            </StatusPill>
          ))}
        </div>

        {p.status === "REPORTED" && (
          <Alert variant="warning">
            <AlertTriangle />
            <div>
              <AlertTitle>{pick(STATUS.REPORTED)}</AlertTitle>
              <AlertDescription>{pick(L.startSearchDesc)}</AlertDescription>
            </div>
          </Alert>
        )}

        <PhotoGallery person={p} canUpload={canASI} canRetire={canSI} />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">{pick(L.overview)}</TabsTrigger>
            <TabsTrigger value="checklist">
              {pick(L.checklist)} ({p.checklistDone}/{p.checklistTotal})
            </TabsTrigger>
            <TabsTrigger value="sightings">
              {pick(L.sightings)} ({p.sightingCount})
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapIcon className="mr-1 h-3.5 w-3.5" />
              {t("missingBoard.map.tab")}
            </TabsTrigger>
            <TabsTrigger value="movement">{pick(L.movement)}</TabsTrigger>
            <TabsTrigger value="checks">{pick(L.stationChecks)}</TabsTrigger>
            <TabsTrigger value="family">{pick(L.family)}</TabsTrigger>
            <TabsTrigger value="face-matching" data-testid="tab-face-matching">
              {pick({ en: "Face matching", bn: "মুখ মিলানো" })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="face-matching">
            {tab === "face-matching" && <FaceMatchingPanel reportId={id} open={open} />}
          </TabsContent>

          <TabsContent value="overview">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label={pick(L.hoursSince)} value={hoursSince} icon={Clock} tone={p.priority === "CRITICAL" ? "danger" : "warning"} />
                <StatTile
                  label={pick(L.stepsDone)}
                  value={p.checklistDone}
                  unit={`/ ${p.checklistTotal}`}
                  icon={ClipboardCheck}
                  tone={p.checklistOverdue > 0 ? "danger" : "default"}
                  deltaLabel={p.checklistOverdue > 0 ? `${p.checklistOverdue} ${pick(L.overdueSteps)}` : undefined}
                />
                <StatTile label={pick(L.verified)} value={p.verifiedSightings} icon={CheckCircle2} tone="success" />
                <StatTile label={pick(L.awaitingDecision)} value={pendingDecisions} icon={ScanFace} tone="warning" />
              </div>

              <Panel title={pick(L.profile)}>
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoField label={pick(L.reportNumber)} value={p.reportNumber} mono />
                  <InfoField label={pick(L.ageSex)} value={`${p.age} · ${GENDER[p.gender] ? pick(GENDER[p.gender]) : p.gender}`} />
                  <InfoField label={pick(L.station)} value={p.stationName || "—"} />
                  <InfoField label={pick(L.lastSeen)} value={p.lastSeenLocation} />
                  <InfoField label={pick(L.lastSeenTime)} value={formatWhen(p.lastSeenAt)} />
                  <InfoField label={pick(L.filedBy)} value={p.source === "CITIZEN" ? pick(L.filedCitizen) : pick(L.filedStation)} />
                  {p.masked ? (
                    <InfoField label={pick(L.masked)} value={pick(L.maskedDesc)} className="sm:col-span-2 lg:col-span-3" />
                  ) : (
                    <>
                      <InfoField label={pick(L.height)} value={p.height || pick(L.notRecorded)} />
                      <InfoField label={pick(L.complexion)} value={p.complexion || pick(L.notRecorded)} />
                      <InfoField label={pick(L.marks)} value={p.identifyingMarks || pick(L.notRecorded)} />
                      <InfoField label={pick(L.wearing)} value={p.lastSeenWearing || pick(L.notRecorded)} className="sm:col-span-2" />
                      <InfoField label={pick(L.circumstances)} value={p.circumstances || pick(L.notRecorded)} className="sm:col-span-2 lg:col-span-3" />
                      <InfoField label={pick(L.informantLabel)} value={`${p.reporterName} (${p.reporterRelation}) · ${p.reporterPhone}`} className="sm:col-span-2" />
                    </>
                  )}
                  <InfoField label={pick(L.assignOfficer)} value={p.assignedToName || pick(L.unassigned)} />
                  <InfoField
                    label={pick(L.firLabel)}
                    value={p.firId ? <Link className="text-accent hover:underline" href={`/fir/${p.firId}`}>{p.firNumber}</Link> : "—"}
                  />
                  <InfoField
                    label={pick(L.lookoutLabel)}
                    value={p.lookoutId ? <Link className="text-accent hover:underline" href={`/lookout/${p.lookoutId}`}>{p.lookoutNumber}</Link> : "—"}
                  />
                  {p.registeredByName && <InfoField label={pick(L.registeredBy)} value={p.registeredByName} />}
                </dl>
              </Panel>

              {!open && (
                <Panel title={pick(L.closure)}>
                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoField label={pick(L.outcome)} value={p.closureOutcome ? pick(OUTCOME[p.closureOutcome]) : "—"} />
                    <InfoField label={pick(L.closedBy)} value={`${p.closedByName || "—"}${p.closedAt ? ` · ${formatWhen(p.closedAt)}` : ""}`} />
                    {p.foundLocation && <InfoField label={pick(L.foundLocation)} value={p.foundLocation} />}
                    {p.foundCondition && <InfoField label={pick(L.foundCondition)} value={p.foundCondition} />}
                    <InfoField label={pick(L.closureNote)} value={p.closureNote} className="sm:col-span-2 lg:col-span-3" />
                  </dl>
                </Panel>
              )}
            </div>
          </TabsContent>

          <TabsContent value="checklist">
            <Panel title={pick(L.checklist)} bodyClassName="flex flex-col gap-2">
              {p.status === "REPORTED" && <p className="text-sm text-foreground-muted">{pick(L.checklistNotStarted)}</p>}
              {!open && <p className="text-sm text-foreground-muted">{pick(L.checklistFrozen)}</p>}
              {checklist.isError && <p className="text-sm text-danger">{errorMessage(checklist.error)}</p>}
              {(checklist.data ?? []).map((item) => (
                <div
                  key={item.id}
                  data-testid={`checklist-${item.itemCode}`}
                  className={
                    item.overdue
                      ? "flex flex-wrap items-start justify-between gap-3 rounded-md border border-danger/40 bg-danger-subtle p-3"
                      : "flex flex-wrap items-start justify-between gap-3 rounded-md border border-border p-3"
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className={item.completedAt ? "text-sm text-foreground-muted line-through" : "text-sm text-foreground"}>{item.label}</p>
                    <p className="mt-0.5 text-xs text-foreground-subtle">
                      {item.completedAt
                        ? `${pick(L.done)} ${formatWhen(item.completedAt)} ${pick(L.by)} ${item.completedByName}${item.note ? ` — ${item.note}` : ""}`
                        : `${pick(L.due)} ${formatWhen(item.dueAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.overdue && <StatusPill tone="danger">{pick(L.overdueSteps)}</StatusPill>}
                    {!item.completedAt && p.status === "SEARCHING" && canASI && (
                      <Button size="sm" variant="outline" onClick={() => setCompleting(item)}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {pick(L.markDone)}
                      </Button>
                    )}
                    {item.completedAt && <CheckCircle2 className="h-4 w-4 text-success" />}
                  </div>
                </div>
              ))}
            </Panel>
          </TabsContent>

          <TabsContent value="sightings">
            <div className="flex flex-col gap-3">
              <Alert variant="info">
                <ShieldCheck />
                <AlertDescription>{pick(L.sightingRule)}</AlertDescription>
              </Alert>
              {sightings.isError && <p className="text-sm text-danger">{errorMessage(sightings.error)}</p>}
              {(sightings.data ?? []).length === 0 && sightings.isSuccess && (
                <p className="text-sm text-foreground-muted">{pick(L.noSightings)}</p>
              )}
              {(sightings.data ?? []).map((s) => (
                <SightingCard
                  key={s.id}
                  reportId={p.id}
                  sighting={s}
                  open={open}
                  canDecide={canASI}
                  isOwn={s.reportedBy === user?.id}
                  onReject={() => setRejecting(s)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="movement">
            <Panel title={pick(L.movement)} description={pick(L.movementDesc)}>
              {movement.isError && <p className="text-sm text-danger">{errorMessage(movement.error)}</p>}
              <ol className="flex flex-col gap-3">
                {(movement.data ?? []).map((pt, i) => (
                  <li key={`${pt.kind}-${pt.sightingId ?? "origin"}`} className="flex gap-3" data-testid="movement-point">
                    <span
                      className={
                        pt.kind === "LAST_SEEN"
                          ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning-subtle text-xs font-semibold text-warning"
                          : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-subtle text-xs font-semibold text-success"
                      }
                    >
                      {i === 0 ? <MapPin className="h-3.5 w-3.5" /> : i}
                    </span>
                    <div className="flex-1 rounded-md border border-border p-3">
                      <p className="text-sm text-foreground">{pt.location}</p>
                      <p className="text-xs text-foreground-subtle">
                        {pt.kind === "LAST_SEEN" ? pick(L.origin) : pick(L.verifiedSighting)} · {formatWhen(pt.at)}
                        {pt.minutesSincePrevious !== null && ` · ${pt.minutesSincePrevious} ${pick(L.minutesLater)}`}
                        {pt.latitude !== null && pt.longitude !== null && ` · ${pt.latitude.toFixed(5)}, ${pt.longitude.toFixed(5)}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              {movement.isSuccess && (movement.data ?? []).length <= 1 && (
                <p className="mt-3 text-sm text-foreground-muted">{pick(L.movementEmpty)}</p>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="map">
            {tab === "map" && <SearchMapPanel person={p} canSetPoint={canSI} />}
          </TabsContent>

          <TabsContent value="checks">
            <StationChecksPanel
              reportId={p.id}
              actions={
                canCheckHere ? (
                  <Button size="sm" variant="outline" onClick={() => setChecking(true)}>
                    <Radio className="h-3.5 w-3.5" />
                    {t("missingBoard.board.recordCheck")}
                  </Button>
                ) : undefined
              }
            />
          </TabsContent>

          <TabsContent value="family">
            <Panel
              title={pick(L.family)}
              actions={
                <Button size="sm" variant="outline" onClick={() => setDialog("contact")}>
                  <MessageSquare className="h-3.5 w-3.5" />
                  {pick(L.logContact)}
                </Button>
              }
              bodyClassName="flex flex-col gap-2"
            >
              {contacts.isError && <p className="text-sm text-danger">{errorMessage(contacts.error)}</p>}
              {contacts.isSuccess && (contacts.data ?? []).length === 0 && (
                <p className="text-sm text-foreground-muted">{pick(L.noContacts)}</p>
              )}
              {(contacts.data ?? []).map((c) => (
                <div key={c.id} className="rounded-md border border-border p-3" data-testid="family-contact">
                  <p className="text-sm text-foreground">{c.summary}</p>
                  <p className="mt-1 text-xs text-foreground-subtle">
                    {formatWhen(c.contactedAt)} · {pick(CHANNEL[c.channel])} ·{" "}
                    {c.direction === "OUTBOUND" ? pick(L.outbound) : pick(L.inbound)} · {c.contactName} · {c.officerName}
                  </p>
                </div>
              ))}
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <StartSearchDialog open={dialog === "start"} onClose={() => setDialog(null)} person={p} />
      <EditDialog open={dialog === "edit"} onClose={() => setDialog(null)} person={p} />
      <CloseDialog open={dialog === "close"} onClose={() => setDialog(null)} person={p} />
      <LookoutDialog open={dialog === "lookout"} onClose={() => setDialog(null)} person={p} />
      <SightingDialog open={dialog === "sighting"} onClose={() => setDialog(null)} person={p} />
      <ContactDialog open={dialog === "contact"} onClose={() => setDialog(null)} person={p} />
      <CompleteItemDialog item={completing} onClose={() => setCompleting(null)} person={p} />
      <RejectDialog sighting={rejecting} onClose={() => setRejecting(null)} person={p} />
      {checking && (
        <StationCheckDialog
          open
          onClose={() => setChecking(false)}
          reportId={p.id}
          reportNumber={p.reportNumber}
          personName={p.personName}
          stationName={user?.stationName ?? ""}
        />
      )}
    </DashboardLayout>
  );
}

function SightingCard({
  reportId,
  sighting: s,
  open,
  canDecide,
  isOwn,
  onReject,
}: {
  reportId: string;
  sighting: MissingSighting;
  open: boolean;
  canDecide: boolean;
  isOwn: boolean;
  onReject: () => void;
}) {
  const { pick } = useI18n();
  const decide = useDecideMissingSighting();
  return (
    <Panel>
      <div className="flex flex-col gap-2" data-testid="sighting">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{s.location}</p>
            <p className="mt-0.5 text-xs text-foreground-subtle">
              {formatWhen(s.sightedAt)} · {pick(SOURCE[s.source])} · {pick(L.reportedBy)} {s.reportedByName}
              {s.latitude !== null && s.longitude !== null && ` · ${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)}`}
            </p>
          </div>
          <StatusPill tone={s.decision === "VERIFIED" ? "success" : s.decision === "REJECTED" ? "danger" : "warning"}>
            {s.decision === "VERIFIED"
              ? `${pick(L.verifiedBy)} ${s.decidedByName}`
              : s.decision === "REJECTED"
                ? `${pick(L.rejectedBy)} ${s.decidedByName}`
                : pick(L.pending)}
          </StatusPill>
        </div>
        {s.details && <p className="text-sm text-foreground-muted">{s.details}</p>}
        {s.decisionNote && <p className="text-xs text-foreground-subtle">{s.decisionNote}</p>}
        {!s.decision && open && canDecide && (
          isOwn ? (
            <p className="text-xs text-foreground-subtle">{pick(L.ownSighting)}</p>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onReject}>
                <XCircle className="h-3.5 w-3.5" />
                {pick(L.reject)}
              </Button>
              <Button
                size="sm"
                disabled={decide.isPending}
                onClick={() => decide.mutate({ id: reportId, sightingId: s.id, verify: true, note: "" })}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {pick(L.verify)}
              </Button>
            </div>
          )
        )}
        {decide.isError && <p className="text-sm text-danger">{errorMessage(decide.error)}</p>}
      </div>
    </Panel>
  );
}

/* --------------------------------------------------------------- dialogs */

function ErrorLine({ error }: { error: unknown }) {
  const msg = typeof error === "string" ? error : errorMessage(error);
  if (!msg) return null;
  return (
    <Alert variant="danger">
      <AlertTriangle />
      <AlertDescription>{msg}</AlertDescription>
    </Alert>
  );
}

function Shell({
  open,
  onClose,
  title,
  description,
  children,
  onConfirm,
  pending,
  confirmLabel,
  error,
  destructive,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onConfirm: () => void;
  pending: boolean;
  confirmLabel: string;
  error: unknown;
  destructive?: boolean;
}) {
  const { pick } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children && <div className="grid gap-3">{children}</div>}
        <ErrorLine error={error} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {pick(L.cancel)}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={pending}>
            {pending ? pick(L.saving) : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Runs a mutation and closes on success; failures stay visible in the dialog. */
function useDialogSubmit(onClose: () => void) {
  const [error, setError] = React.useState<unknown>(null);
  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      onClose();
    } catch (err) {
      setError(err);
    }
  };
  return { error, setError, run };
}

function StartSearchDialog({ open, onClose, person }: { open: boolean; onClose: () => void; person: MissingPerson }) {
  const { pick } = useI18n();
  const start = useStartSearch();
  const { error, setError, run } = useDialogSubmit(onClose);
  React.useEffect(() => setError(null), [open, setError]);
  return (
    <Shell
      open={open}
      onClose={onClose}
      title={pick(L.startSearch)}
      description={pick(L.startSearchDesc)}
      onConfirm={() => run(() => start.mutateAsync(person.id))}
      pending={start.isPending}
      confirmLabel={pick(L.confirm)}
      error={error}
    />
  );
}

function EditDialog({ open, onClose, person }: { open: boolean; onClose: () => void; person: MissingPerson }) {
  const { pick } = useI18n();
  const update = useUpdateMissingPerson();
  const { error, setError, run } = useDialogSubmit(onClose);
  const [form, setForm] = React.useState({ height: "", complexion: "", identifyingMarks: "", lastSeenWearing: "", circumstances: "" });
  const [flags, setFlags] = React.useState<Vulnerability[]>([]);
  const [officer, setOfficer] = React.useState<{ id: string; name: string } | null>(null);

  React.useEffect(() => {
    if (open) {
      setError(null);
      setForm({
        height: person.height ?? "",
        complexion: person.complexion ?? "",
        identifyingMarks: person.identifyingMarks ?? "",
        lastSeenWearing: person.lastSeenWearing ?? "",
        circumstances: person.circumstances ?? "",
      });
      setFlags(person.vulnerabilities);
      setOfficer(person.assignedTo ? { id: person.assignedTo, name: person.assignedToName } : null);
    }
  }, [open, person, setError]);

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));
  const toggle = (v: Vulnerability, on: boolean) => setFlags((prev) => (on ? [...prev.filter((x) => x !== v), v] : prev.filter((x) => x !== v)));

  return (
    <Shell
      open={open}
      onClose={onClose}
      title={pick(L.edit)}
      description={person.reportNumber}
      pending={update.isPending}
      confirmLabel={pick(L.save)}
      error={error}
      onConfirm={() =>
        run(() =>
          update.mutateAsync({
            id: person.id,
            input: {
              ...(person.masked ? {} : form),
              vulnerabilities: flags,
              ...(officer && officer.id !== person.assignedTo ? { assignedTo: officer.id } : {}),
            },
          }),
        )
      }
    >
      {!person.masked && (
        <>
          <Field id="ed-height" label={pick(L.height)}>
            <Input id="ed-height" value={form.height} onChange={set("height")} />
          </Field>
          <Field id="ed-complexion" label={pick(L.complexion)}>
            <Input id="ed-complexion" value={form.complexion} onChange={set("complexion")} />
          </Field>
          <Field id="ed-marks" label={pick(L.marks)}>
            <Input id="ed-marks" value={form.identifyingMarks} onChange={set("identifyingMarks")} />
          </Field>
          <Field id="ed-wearing" label={pick(L.wearing)}>
            <Input id="ed-wearing" value={form.lastSeenWearing} onChange={set("lastSeenWearing")} />
          </Field>
          <Field id="ed-circ" label={pick(L.circumstances)}>
            <Textarea id="ed-circ" rows={2} value={form.circumstances} onChange={set("circumstances")} />
          </Field>
        </>
      )}
      <div className="grid gap-2">
        <Label>{pick(L.vulnerabilities)}</Label>
        <div className="flex flex-wrap gap-4">
          {VULNERABILITIES.map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <Checkbox aria-label={pick(VULNERABILITY[v])} checked={flags.includes(v)} onCheckedChange={(c) => toggle(v, c === true)} />
              {pick(VULNERABILITY[v])}
            </label>
          ))}
        </div>
        <p className="text-xs text-foreground-subtle">{pick(L.vulnerabilityHint)}</p>
      </div>
      <div className="grid gap-1.5">
        <Label>{pick(L.assignOfficer)}</Label>
        <OfficerPicker value={officer?.id} onChange={(oid, name) => setOfficer({ id: oid, name })} />
      </div>
    </Shell>
  );
}

function CloseDialog({ open, onClose, person }: { open: boolean; onClose: () => void; person: MissingPerson }) {
  const { pick } = useI18n();
  const close = useCloseMissingPerson();
  const { error, setError, run } = useDialogSubmit(onClose);
  const [outcome, setOutcome] = React.useState<ClosureOutcome>("TRACED");
  const [note, setNote] = React.useState("");
  const [foundLocation, setFoundLocation] = React.useState("");
  const [foundCondition, setFoundCondition] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setError(null);
      setOutcome("TRACED");
      setNote("");
      setFoundLocation("");
      setFoundCondition("");
    }
  }, [open, setError]);
  const found = outcome === "TRACED" || outcome === "RETURNED";
  return (
    <Shell
      open={open}
      onClose={onClose}
      title={pick(L.close)}
      description={pick(L.closeDesc)}
      pending={close.isPending}
      confirmLabel={pick(L.close)}
      error={error}
      destructive
      onConfirm={() =>
        run(() =>
          close.mutateAsync({
            id: person.id,
            input: { outcome, note, foundLocation: found && foundLocation ? foundLocation : null, foundCondition: found && foundCondition ? foundCondition : null },
          }),
        )
      }
    >
      <Field id="cl-outcome" label={`${pick(L.outcome)} *`}>
        <select id="cl-outcome" className={selectClass} value={outcome} onChange={(e) => setOutcome(e.target.value as ClosureOutcome)}>
          {OUTCOMES.map((o) => (
            <option key={o} value={o}>
              {pick(OUTCOME[o])}
            </option>
          ))}
        </select>
      </Field>
      {found && (
        <>
          <Field id="cl-where" label={pick(L.foundLocation)}>
            <Input id="cl-where" value={foundLocation} onChange={(v: string) => setFoundLocation(v)} />
          </Field>
          <Field id="cl-cond" label={pick(L.foundCondition)}>
            <Input id="cl-cond" value={foundCondition} onChange={(v: string) => setFoundCondition(v)} />
          </Field>
        </>
      )}
      <Field id="cl-note" label={`${pick(L.closureNote)} *`}>
        <Textarea id="cl-note" rows={3} value={note} onChange={(v: string) => setNote(v)} />
      </Field>
    </Shell>
  );
}

function LookoutDialog({ open, onClose, person }: { open: boolean; onClose: () => void; person: MissingPerson }) {
  const { pick } = useI18n();
  const issue = useIssueMissingLookout();
  const { error, setError, run } = useDialogSubmit(onClose);
  React.useEffect(() => setError(null), [open, setError]);
  return (
    <Shell
      open={open}
      onClose={onClose}
      title={pick(L.issueLookout)}
      description={pick(L.lookoutDesc)}
      pending={issue.isPending}
      confirmLabel={pick(L.issueLookout)}
      error={error}
      onConfirm={() => run(() => issue.mutateAsync(person.id))}
    />
  );
}

function SightingDialog({ open, onClose, person }: { open: boolean; onClose: () => void; person: MissingPerson }) {
  const { pick } = useI18n();
  const record = useRecordMissingSighting();
  const { error, setError, run } = useDialogSubmit(onClose);
  const [source, setSource] = React.useState<SightingSource>("OFFICER_OBSERVATION");
  const [place, setPlace] = React.useState<LocationValue>({ location: "", latitude: null, longitude: null });
  const [sightedAt, setSightedAt] = React.useState("");
  const [details, setDetails] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setError(null);
      setSource("OFFICER_OBSERVATION");
      setPlace({ location: "", latitude: null, longitude: null });
      setSightedAt(nowLocal());
      setDetails("");
    }
  }, [open, setError]);
  return (
    <Shell
      open={open}
      onClose={onClose}
      title={pick(L.recordSighting)}
      description={pick(L.sightingRule)}
      pending={record.isPending}
      confirmLabel={pick(L.recordSighting)}
      error={error}
      onConfirm={() => {
        if (!place.location.trim() || !sightedAt) {
          setError(pick(L.requiredMissing));
          return;
        }
        void run(() =>
          record.mutateAsync({
            id: person.id,
            input: {
              source,
              location: place.location,
              sightedAt: toApiTime(sightedAt),
              latitude: place.latitude,
              longitude: place.longitude,
              details,
            },
          }),
        );
      }}
    >
      <Field id="sg-source" label={`${pick(L.source)} *`}>
        <select id="sg-source" className={selectClass} value={source} onChange={(e) => setSource(e.target.value as SightingSource)}>
          {SIGHTING_SOURCES.map((s) => (
            <option key={s} value={s}>
              {pick(SOURCE[s])}
            </option>
          ))}
        </select>
      </Field>
      <LocationPicker value={place} onChange={setPlace} label={`${pick(L.location)} *`} mapHeight="240px" />
      <Field id="sg-time" label={`${pick(L.sightedAt)} *`}>
        <Input id="sg-time" type="datetime-local" value={sightedAt} onChange={(v: string) => setSightedAt(v)} />
      </Field>
      <Field id="sg-details" label={pick(L.details)}>
        <Textarea id="sg-details" rows={2} value={details} onChange={(v: string) => setDetails(v)} />
      </Field>
    </Shell>
  );
}

function ContactDialog({ open, onClose, person }: { open: boolean; onClose: () => void; person: MissingPerson }) {
  const { pick } = useI18n();
  const record = useRecordFamilyContact();
  const { error, setError, run } = useDialogSubmit(onClose);
  const [direction, setDirection] = React.useState<ContactDirection>("OUTBOUND");
  const [channel, setChannel] = React.useState<ContactChannel>("PHONE");
  const [contactName, setContactName] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [contactedAt, setContactedAt] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setError(null);
      setDirection("OUTBOUND");
      setChannel("PHONE");
      setContactName(person.masked ? "" : person.reporterName);
      setSummary("");
      setContactedAt(nowLocal());
    }
  }, [open, person, setError]);
  return (
    <Shell
      open={open}
      onClose={onClose}
      title={pick(L.logContact)}
      description={person.reportNumber}
      pending={record.isPending}
      confirmLabel={pick(L.save)}
      error={error}
      onConfirm={() => {
        if (!contactName.trim() || !summary.trim() || !contactedAt) {
          setError(pick(L.requiredMissing));
          return;
        }
        void run(() =>
          record.mutateAsync({ id: person.id, input: { direction, channel, contactName, summary, contactedAt: toApiTime(contactedAt) } }),
        );
      }}
    >
      <Field id="fc-direction" label={`${pick(L.direction)} *`}>
        <select id="fc-direction" className={selectClass} value={direction} onChange={(e) => setDirection(e.target.value as ContactDirection)}>
          <option value="OUTBOUND">{pick(L.outbound)}</option>
          <option value="INBOUND">{pick(L.inbound)}</option>
        </select>
      </Field>
      <Field id="fc-channel" label={`${pick(L.channel)} *`}>
        <select id="fc-channel" className={selectClass} value={channel} onChange={(e) => setChannel(e.target.value as ContactChannel)}>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {pick(CHANNEL[c])}
            </option>
          ))}
        </select>
      </Field>
      <Field id="fc-name" label={`${pick(L.contactName)} *`}>
        <Input id="fc-name" value={contactName} onChange={(v: string) => setContactName(v)} />
      </Field>
      <Field id="fc-when" label={`${pick(L.contactedAt)} *`}>
        <Input id="fc-when" type="datetime-local" value={contactedAt} onChange={(v: string) => setContactedAt(v)} />
      </Field>
      <Field id="fc-summary" label={`${pick(L.summary)} *`}>
        <Textarea id="fc-summary" rows={3} value={summary} onChange={(v: string) => setSummary(v)} />
      </Field>
    </Shell>
  );
}

function CompleteItemDialog({ item, onClose, person }: { item: ChecklistItem | null; onClose: () => void; person: MissingPerson }) {
  const { pick } = useI18n();
  const complete = useCompleteChecklistItem();
  const { error, setError, run } = useDialogSubmit(onClose);
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    setError(null);
    setNote("");
  }, [item, setError]);
  return (
    <Shell
      open={item !== null}
      onClose={onClose}
      title={pick(L.markDone)}
      description={item?.label}
      pending={complete.isPending}
      confirmLabel={pick(L.markDone)}
      error={error}
      onConfirm={() => item && run(() => complete.mutateAsync({ id: person.id, itemCode: item.itemCode, note }))}
    >
      <Field id="ci-note" label={pick(L.noteOptional)}>
        <Textarea id="ci-note" rows={2} value={note} onChange={(v: string) => setNote(v)} />
      </Field>
    </Shell>
  );
}

function RejectDialog({ sighting, onClose, person }: { sighting: MissingSighting | null; onClose: () => void; person: MissingPerson }) {
  const { pick } = useI18n();
  const decide = useDecideMissingSighting();
  const { error, setError, run } = useDialogSubmit(onClose);
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    setError(null);
    setNote("");
  }, [sighting, setError]);
  return (
    <Shell
      open={sighting !== null}
      onClose={onClose}
      title={pick(L.rejectTitle)}
      description={pick(L.rejectDesc)}
      pending={decide.isPending}
      confirmLabel={pick(L.reject)}
      error={error}
      destructive
      onConfirm={() => sighting && run(() => decide.mutateAsync({ id: person.id, sightingId: sighting.id, verify: false, note }))}
    >
      <Field id="rj-note" label={`${pick(L.decisionNote)} *`}>
        <Textarea id="rj-note" rows={2} value={note} onChange={(v: string) => setNote(v)} />
      </Field>
    </Shell>
  );
}
