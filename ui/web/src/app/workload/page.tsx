"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  FileDown,
  Gauge,
  Microscope,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { STATION_METRICS, type StationMetrics } from "@/lib/platform/mock";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, type Action } from "@/components/platform/actions";
import {
  Field,
  PageHeader,
  Panel,
  PhaseBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { AIBadge, AIGovernanceNotice } from "@/components/platform/governance";
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

const BOTTLENECKS = [
  { id: "b1", what: "Cases awaiting a forensic report", count: 130, note: "State FSL turnaround is averaging 26 days against a 15-day norm.", tone: "danger" as const, href: "/forensics" },
  { id: "b2", what: "Court matters without a listed date", count: 44, note: "Pending listing at Bankshall and Alipore.", tone: "warning" as const, href: "/court" },
  { id: "b3", what: "Statements not recorded within 7 days", count: 61, note: "Concentrated in three stations with reduced strength.", tone: "warning" as const, href: "/investigation" },
  { id: "b4", what: "Seized property overdue for return", count: 18, note: "Items away from the malkhana beyond the permitted period.", tone: "warning" as const, href: "/malkhana" },
];

export default function WorkloadPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [tab, setTab] = React.useState("stations");
  const [stationSheet, setStationSheet] = React.useState<StationMetrics | null>(null);
  const [briefOpen, setBriefOpen] = React.useState(false);

  const totalOpen = STATION_METRICS.reduce((s, m) => s + m.openInvestigations, 0);
  const over90 = STATION_METRICS.reduce((s, m) => s + m.backlog90plus, 0);
  const pendingForensics = STATION_METRICS.reduce((s, m) => s + m.pendingForensics, 0);
  const avgResponse =
    STATION_METRICS.reduce((s, m) => s + m.avgResponseMinutes, 0) / STATION_METRICS.length;

  const columns: Column<StationMetrics>[] = [
    {
      id: "station",
      header: "Station",
      sortValue: (m) => m.station,
      cell: (m) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{m.station} PS</p>
          <p className="mt-0.5 text-xs text-foreground-subtle">{m.division} Division</p>
        </div>
      ),
    },
    {
      id: "open",
      header: "Open",
      align: "right",
      sortValue: (m) => m.openInvestigations,
      cell: (m) => <span className="tabular text-sm">{m.openInvestigations}</span>,
    },
    {
      id: "backlog",
      header: "Backlog by age",
      hideBelow: "md",
      sortValue: (m) => m.backlog90plus,
      cell: (m) => <BacklogBar metrics={m} />,
    },
    {
      id: "disposal",
      header: "Disposal",
      align: "right",
      hideBelow: "sm",
      sortValue: (m) => m.disposalRate,
      cell: (m) => (
        <span
          className={`tabular text-sm ${m.disposalRate < 65 ? "text-danger" : m.disposalRate < 72 ? "text-warning" : "text-success"}`}
        >
          {m.disposalRate}%
        </span>
      ),
    },
    {
      id: "response",
      header: "Response",
      align: "right",
      hideBelow: "lg",
      sortValue: (m) => m.avgResponseMinutes,
      cell: (m) => <span className="tabular text-sm">{m.avgResponseMinutes} min</span>,
    },
    {
      id: "load",
      header: "Load per officer",
      align: "right",
      sortValue: (m) => m.openInvestigations / m.officerStrength,
      cell: (m) => {
        const ratio = m.openInvestigations / m.officerStrength;
        return (
          <StatusPill tone={ratio > 2.8 ? "danger" : ratio > 2.4 ? "warning" : "neutral"}>
            {ratio.toFixed(1)}
          </StatusPill>
        );
      },
    },
  ];

  const rowActions = (m: StationMetrics): Action[] => [
    act.label("h", `${m.station} PS`),
    act.run("open", "Station detail", () => setStationSheet(m), { icon: Gauge }),
    act.link("cases", "Open investigations", "/cases", { icon: ClipboardList }),
    act.link("forensics", "Pending forensic requests", "/forensics", { icon: Microscope }),
    act.link("court", "Court matters", "/court", { icon: ClipboardList }),
    act.sep("s"),
    act.link("personnel", "Officer strength", "/personnel", { icon: Users }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.workload")}
          description={t("modules.workloadDesc")}
          icon={Gauge}
          badge={<PhaseBadge phase={8} />}
          breadcrumb={[{ label: t("nav.commandGroup") }, { label: t("modules.workload") }]}
          actions={
            <Button onClick={() => setBriefOpen(true)}>
              <FileDown className="h-4 w-4" />
              Executive brief
            </Button>
          }
          menu={[
            act.link("analytics", "Crime analytics", "/analytics", { icon: BarChart3 }),
            act.link("reports", "Report library", "/reports", { icon: FileDown }),
            act.link("district", "Division comparison", "/district", { icon: BarChart3 }),
          ]}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Open investigations" value={totalOpen} icon={ClipboardList} />
          <StatTile label="Over 90 days" value={over90} icon={AlertTriangle} tone="danger" />
          <StatTile label="Awaiting forensics" value={pendingForensics} icon={Microscope} tone="warning" />
          <StatTile
            label="Mean response"
            value={avgResponse}
            decimals={1}
            unit="min"
            icon={Timer}
            tone="info"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="stations">Stations ({STATION_METRICS.length})</TabsTrigger>
            <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="stations">
            <DataTable
              rows={STATION_METRICS}
              columns={columns}
              rowKey={(m) => m.id}
              onRowSelect={(m) => setStationSheet(m)}
              rowActions={rowActions}
              searchPlaceholder="Search by station or division…"
            />
          </TabsContent>

          <TabsContent value="bottlenecks">
            <div className="flex flex-col gap-3">
              <AIGovernanceNotice />
              {BOTTLENECKS.map((b) => (
                <Panel key={b.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{b.what}</p>
                        <StatusPill tone={b.tone}>{b.count}</StatusPill>
                        <AIBadge compact />
                      </div>
                      <p className="mt-1 text-sm text-foreground-muted">{b.note}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(b.href)}>
                      Open
                    </Button>
                  </div>
                </Panel>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="forecast">
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel
                title="Expected workload, next 30 days"
                description="Projected from the last six months, adjusted for seasonality"
                actions={<AIBadge confidence={0.74} model="workload-forecast" />}
              >
                <div className="flex flex-col gap-3">
                  {[
                    { label: "New FIRs", value: 512, delta: 2 },
                    { label: "Disposals", value: 368, delta: -4 },
                    { label: "Grievances", value: 810, delta: 7 },
                    { label: "Court hearings", value: 214, delta: 1 },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground">{row.label}</span>
                      <span className="flex items-center gap-2">
                        <span className="tabular text-sm font-medium text-foreground">
                          {row.value}
                        </span>
                        <StatusPill tone={row.delta > 0 ? "warning" : "success"}>
                          {row.delta > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(row.delta)}%
                        </StatusPill>
                      </span>
                    </div>
                  ))}
                  <p className="mt-1 text-xs text-foreground-muted">
                    A forecast is a planning aid. It carries no implication about any individual case
                    or officer.
                  </p>
                </div>
              </Panel>

              <Panel title="Strength against load" description="Open investigations per officer">
                <div className="flex flex-col gap-3">
                  {STATION_METRICS.map((m) => {
                    const ratio = m.openInvestigations / m.officerStrength;
                    return (
                      <div key={m.id} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 truncate text-sm text-foreground">
                          {m.station}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min((ratio / 3.5) * 100, 100)}%`,
                              background:
                                ratio > 2.8
                                  ? "var(--danger)"
                                  : ratio > 2.4
                                    ? "var(--warning)"
                                    : "var(--success)",
                            }}
                          />
                        </div>
                        <span className="tabular w-10 shrink-0 text-right text-xs text-foreground-muted">
                          {ratio.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={briefOpen} onOpenChange={setBriefOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Executive brief</DialogTitle>
            <DialogDescription>
              What changed, what needs intervention, and where backlog is growing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-[var(--ai-border)] bg-ai-subtle p-3">
              <AIBadge confidence={0.81} model="executive-brief" />
              <ul className="mt-2 flex flex-col gap-2 text-sm text-foreground-muted">
                <li>
                  <span className="font-medium text-foreground">Jadavpur PS</span> has the highest
                  load per officer (3.0) and the lowest disposal rate (61%). Backlog over 90 days
                  grew by 11 cases this month.
                </li>
                <li>
                  <span className="font-medium text-foreground">Forensic turnaround</span> is the
                  largest single constraint — 130 cases are waiting on the State FSL.
                </li>
                <li>
                  <span className="font-medium text-foreground">Response time</span> improved across
                  South East Division after the patrol reallocation in November.
                </li>
              </ul>
            </div>
            <p className="text-xs text-foreground-muted">
              Figures are operational aggregates. Individual officer performance is not assessed here.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBriefOpen(false)}>
              {t("common.close")}
            </Button>
            <Button onClick={() => { setBriefOpen(false); router.push("/reports"); }}>
              <FileDown className="h-4 w-4" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={stationSheet !== null} onOpenChange={(o) => !o && setStationSheet(null)}>
        <SheetContent className="w-[32rem]">
          {stationSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{stationSheet.station} Police Station</SheetTitle>
                <SheetDescription>{stationSheet.division} Division</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Open investigations" value={stationSheet.openInvestigations} />
                  <Field label="Officer strength" value={stationSheet.officerStrength} />
                  <Field label="Disposal rate" value={`${stationSheet.disposalRate}%`} />
                  <Field label="Mean response" value={`${stationSheet.avgResponseMinutes} min`} />
                  <Field label="Awaiting forensics" value={stationSheet.pendingForensics} />
                  <Field label="Court matters" value={stationSheet.pendingCourt} />
                </dl>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                    Investigation backlog
                  </p>
                  <BacklogBar metrics={stationSheet} className="mt-2" showLegend />
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => router.push("/cases")}>
                    <ClipboardList className="h-4 w-4" />
                    Open investigations
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/forensics")}>
                    <Microscope className="h-4 w-4" />
                    Pending forensic requests
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/personnel")}>
                    <Users className="h-4 w-4" />
                    Officer strength and duty
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

function BacklogBar({
  metrics,
  className,
  showLegend,
}: {
  metrics: StationMetrics;
  className?: string;
  showLegend?: boolean;
}) {
  const bands = [
    { label: "0–30", value: metrics.backlog0to30, color: "var(--success)" },
    { label: "31–60", value: metrics.backlog31to60, color: "var(--info)" },
    { label: "61–90", value: metrics.backlog61to90, color: "var(--warning)" },
    { label: "90+", value: metrics.backlog90plus, color: "var(--danger)" },
  ];
  const total = bands.reduce((s, b) => s + b.value, 0) || 1;

  return (
    <div className={className}>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
        {bands.map((b) => (
          <div
            key={b.label}
            style={{ width: `${(b.value / total) * 100}%`, background: b.color }}
            title={`${b.label} days: ${b.value}`}
          />
        ))}
      </div>
      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-3">
          {bands.map((b) => (
            <span key={b.label} className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
              {b.label} days · {b.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
