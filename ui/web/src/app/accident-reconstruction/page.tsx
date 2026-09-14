"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CarFront,
  FileText,
  Gauge,
  MapPin,
  Plus,
  Route,
  Siren,
  TrafficCone,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { ACCIDENTS, type AccidentCase } from "@/lib/platform/mock";
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
import {
  AIBadge,
  AIGovernanceNotice,
  ConfidenceMeter,
  SourceCitations,
} from "@/components/platform/governance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const COLLISION_TIMELINE = [
  { at: "18:32:11", what: "Vehicle A (WB-06-BC-2210) enters frame northbound", source: "TR-EMB-044", measured: true },
  { at: "18:32:14", what: "Vehicle B (WB-19-AA-8841) enters from the service road", source: "TR-EMB-044", measured: true },
  { at: "18:32:16", what: "Signal phase for the service road shows red", source: "Signal controller log", measured: true },
  { at: "18:32:17", what: "Vehicles converge in lane 2", source: "TR-EMB-044", measured: true },
  { at: "18:32:18", what: "Impact", source: "TR-EMB-044", measured: true },
  { at: "18:32:18", what: "Closing speed estimated at 46–54 km/h", source: "Camera calibration", measured: false },
];

export default function AccidentReconstructionPage() {
  const router = useRouter();
  const { t, pick } = useI18n();

  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [detailFor, setDetailFor] = React.useState<AccidentCase | null>(null);
  const [reportFor, setReportFor] = React.useState<AccidentCase | null>(null);

  const fatal = ACCIDENTS.reduce((s, a) => s + a.casualties.fatal, 0);
  const grievous = ACCIDENTS.reduce((s, a) => s + a.casualties.grievous, 0);
  const reconstructing = ACCIDENTS.filter((a) => a.status === "reconstructing").length;

  const columns: Column<AccidentCase>[] = [
    {
      id: "ref",
      header: "Incident",
      sortValue: (a) => a.refNumber,
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{pick(a.location)}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">{a.refNumber}</p>
        </div>
      ),
    },
    {
      id: "when",
      header: "When",
      hideBelow: "sm",
      sortValue: (a) => a.at,
      cell: (a) => (
        <span className="text-sm">
          {new Date(a.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      ),
    },
    {
      id: "vehicles",
      header: "Vehicles",
      hideBelow: "md",
      sortValue: (a) => a.vehicles.join(" "),
      cell: (a) => (
        <div className="flex flex-wrap gap-1">
          {a.vehicles.map((v) => (
            <span
              key={v}
              className="rounded border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.65rem]"
            >
              {v}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "casualties",
      header: "Casualties",
      sortValue: (a) => a.casualties.fatal * 10 + a.casualties.grievous,
      cell: (a) => (
        <div className="flex flex-wrap gap-1">
          {a.casualties.fatal > 0 && <StatusPill tone="danger">{a.casualties.fatal} fatal</StatusPill>}
          {a.casualties.grievous > 0 && (
            <StatusPill tone="warning">{a.casualties.grievous} grievous</StatusPill>
          )}
          {a.casualties.minor > 0 && <StatusPill>{a.casualties.minor} minor</StatusPill>}
        </div>
      ),
    },
    {
      id: "evidence",
      header: "Evidence found",
      hideBelow: "lg",
      sortValue: (a) => a.camerasFound + a.anprHits,
      cell: (a) => (
        <div className="flex flex-wrap gap-1">
          <StatusPill><Camera className="h-3 w-3" />{a.camerasFound}</StatusPill>
          <StatusPill><CarFront className="h-3 w-3" />{a.anprHits} ANPR</StatusPill>
          {a.signalDataAvailable && <StatusPill tone="info"><TrafficCone className="h-3 w-3" />Signal</StatusPill>}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (a) => a.status,
      cell: (a) => (
        <StatusPill
          tone={a.status === "approved" ? "success" : a.status === "draft-report" ? "info" : "warning"}
        >
          {a.status}
        </StatusPill>
      ),
    },
  ];

  const rowActions = (a: AccidentCase): Action[] => [
    act.label("h", a.refNumber),
    act.run("open", "Open reconstruction", () => setDetailFor(a), { icon: Route }),
    act.run("report", "Generate accident report", () => setReportFor(a), { icon: FileText }),
    act.sep("s1"),
    act.link("cctv", "Correlated cameras", "/video-intelligence", { icon: Camera }),
    act.link("map", "Show on map", "/gis", { icon: MapPin }),
    act.link("vehicles", "Vehicle records", "/vehicles", { icon: CarFront }),
    act.sep("s2"),
    act.link("fir", "Linked FIR", "/fir", { icon: Siren }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.accidentReconstruction")}
          description={t("modules.accidentReconstructionDesc")}
          icon={Siren}
          badge={<PhaseBadge phase={6} />}
          breadcrumb={[
            { label: t("nav.trafficGroup") },
            { label: t("modules.accidentReconstruction") },
          ]}
          actions={
            <Button onClick={() => setRegisterOpen(true)}>
              <Plus className="h-4 w-4" />
              Register incident
            </Button>
          }
          menu={[
            act.link("challans", "Traffic challans", "/traffic/challans", { icon: TrafficCone }),
            act.link("hotspots", "Accident hotspots", "/traffic/hotspots", { icon: MapPin }),
            act.link("video", "Camera network", "/video-intelligence", { icon: Camera }),
          ]}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Incidents" value={ACCIDENTS.length} icon={Siren} />
          <StatTile label="Under reconstruction" value={reconstructing} icon={Route} tone="warning" />
          <StatTile label="Fatalities" value={fatal} icon={Users} tone="danger" />
          <StatTile label="Grievous injuries" value={grievous} icon={Users} tone="warning" />
        </div>

        <AIGovernanceNotice />

        <DataTable
          rows={ACCIDENTS}
          columns={columns}
          rowKey={(a) => a.id}
          onRowSelect={(a) => setDetailFor(a)}
          rowActions={rowActions}
          searchPlaceholder="Search by reference, location or registration mark…"
        />
      </div>

      {/* register */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Register a traffic incident</DialogTitle>
            <DialogDescription>
              Nearby cameras and ANPR detections are correlated automatically once the location and
              time are set.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="ai-loc">Location</Label>
              <Input id="ai-loc" placeholder="Junction, road or landmark" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ai-when">Date and time</Label>
              <Input id="ai-when" type="datetime-local" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ai-veh">Vehicles involved</Label>
              <Input id="ai-veh" placeholder="WB-06-BC-2210, WB-19-AA-8841" />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="ai-cas">Casualties</Label>
              <Input id="ai-cas" placeholder="Fatal / grievous / minor" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setRegisterOpen(false); setDetailFor(ACCIDENTS[0]); }}>
              Register and correlate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* report */}
      <Dialog open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate accident report</DialogTitle>
            <DialogDescription>
              {reportFor?.refNumber} — a draft for the investigating officer to approve.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 text-sm text-foreground-muted">
            {[
              "Chronology from camera and signal data",
              "Vehicles and registered owners",
              "CCTV and ANPR references",
              "Witness statements attached",
              "Measured values and estimated values, marked separately",
              "Outstanding evidence",
            ].map((line) => (
              <label key={line} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="accent-[var(--accent)]" />
                {line}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setReportFor(null); router.push("/reports"); }}>
              Generate draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* reconstruction sheet */}
      <Sheet open={detailFor !== null} onOpenChange={(o) => !o && setDetailFor(null)}>
        <SheetContent className="w-[36rem]">
          {detailFor && (
            <>
              <SheetHeader>
                <SheetTitle>{pick(detailFor.location)}</SheetTitle>
                <SheetDescription>
                  {detailFor.refNumber} ·{" "}
                  {new Date(detailFor.at).toLocaleString("en-IN")}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Vehicles" value={detailFor.vehicles.join(", ")} mono />
                  <Field label="Cameras correlated" value={detailFor.camerasFound} />
                  <Field label="ANPR detections" value={detailFor.anprHits} />
                  <Field
                    label="Signal data"
                    value={detailFor.signalDataAvailable ? "Available" : "Not available"}
                  />
                </dl>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                    Trajectory
                  </p>
                  <TrajectoryDiagram />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                      Collision timeline
                    </p>
                    <AIBadge confidence={0.84} model="collision-reconstructor" compact />
                  </div>
                  <ol className="mt-2 flex flex-col gap-2">
                    {COLLISION_TIMELINE.map((e, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="w-16 shrink-0 font-mono text-xs text-foreground-subtle">
                          {e.at}
                        </span>
                        <span className="flex-1">
                          <span className="text-foreground">{e.what}</span>
                          <span className="ml-1.5">
                            <StatusPill tone={e.measured ? "success" : "warning"}>
                              {e.measured ? "measured" : "estimated"}
                            </StatusPill>
                          </span>
                          <span className="mt-0.5 block text-xs text-foreground-subtle">
                            {e.source}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <SourceCitations
                  sources={[
                    { id: "a1", label: "TR-EMB-044", type: "cctv", locator: "18:32:11" },
                    { id: "a2", label: "Signal controller log", type: "document", locator: "phase 3" },
                    { id: "a3", label: "ANPR detections", type: "document" },
                  ]}
                />

                <ConfidenceMeter value={0.84} />

                <div className="flex flex-col gap-2">
                  <Button onClick={() => { setReportFor(detailFor); setDetailFor(null); }}>
                    <FileText className="h-4 w-4" />
                    Generate accident report
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/video-intelligence")}>
                    <Camera className="h-4 w-4" />
                    Review correlated footage
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/vehicles")}>
                    <CarFront className="h-4 w-4" />
                    Open vehicle records
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

/** Two converging paths with the impact point marked. */
function TrajectoryDiagram() {
  return (
    <svg viewBox="0 0 320 160" className="mt-2 w-full rounded-md border border-border bg-surface-sunken" role="img">
      <title>Vehicle trajectories and point of impact</title>
      <line x1="0" y1="80" x2="320" y2="80" stroke="var(--border-strong)" strokeDasharray="6 6" strokeWidth="1" />
      <line x1="200" y1="160" x2="200" y2="0" stroke="var(--border-strong)" strokeDasharray="6 6" strokeWidth="1" />

      <path d="M20 70 L182 70" stroke="var(--info)" strokeWidth="2.5" fill="none" markerEnd="url(#arrowA)" />
      <path d="M210 150 L210 92" stroke="var(--warning)" strokeWidth="2.5" fill="none" markerEnd="url(#arrowB)" />

      <defs>
        <marker id="arrowA" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--info)" />
        </marker>
        <marker id="arrowB" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--warning)" />
        </marker>
      </defs>

      <circle cx="197" cy="79" r="9" fill="none" stroke="var(--danger)" strokeWidth="2" />
      <text x="197" y="83" textAnchor="middle" className="fill-[var(--danger)] text-[9px] font-bold">
        ×
      </text>

      <text x="24" y="62" className="fill-[var(--info)] text-[9px] font-medium">Vehicle A</text>
      <text x="216" y="146" className="fill-[var(--warning)] text-[9px] font-medium">Vehicle B</text>
      <text x="197" y="104" textAnchor="middle" className="fill-[var(--danger)] text-[8px]">
        impact 18:32:18
      </text>
    </svg>
  );
}
