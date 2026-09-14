"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Clock,
  Gauge,
  MapPin,
  Phone,
  Radio,
  Siren,
  Timer,
  TriangleAlert,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { INCIDENTS, UNITS, type DispatchIncident, type PatrolUnit } from "@/lib/platform/mock";
import {
  Field,
  PageHeader,
  Panel,
  PhaseBadge,
  SeverityBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { AIBadge, AIGovernanceNotice, ConfidenceMeter } from "@/components/platform/governance";
import { act, ActionMenu, type Action } from "@/components/platform/actions";
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
import { AnimatedList, AnimatedListItem, PulseDot } from "@/components/reactbits";

const STATUS_TONE = {
  unassigned: "danger",
  dispatched: "warning",
  "on-scene": "info",
  resolved: "success",
} as const;

export default function DispatchPage() {
  const router = useRouter();
  const { t, pick } = useI18n();

  const [incidents, setIncidents] = React.useState(INCIDENTS);
  const [dispatchFor, setDispatchFor] = React.useState<DispatchIncident | null>(null);
  const [intakeOpen, setIntakeOpen] = React.useState(false);
  const [escalateFor, setEscalateFor] = React.useState<DispatchIncident | null>(null);
  const [unitSheet, setUnitSheet] = React.useState<PatrolUnit | null>(null);

  const assign = (incidentId: string, unit: string) =>
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId ? { ...i, status: "dispatched", assignedUnit: unit, etaMinutes: 5 } : i,
      ),
    );

  const unassigned = incidents.filter((i) => i.status === "unassigned").length;
  const active = incidents.filter((i) => i.status === "dispatched" || i.status === "on-scene").length;
  const availableUnits = UNITS.filter((u) => u.status === "available").length;
  const avgAck = Math.round(
    incidents.filter((i) => i.ackSeconds).reduce((s, i) => s + (i.ackSeconds ?? 0), 0) /
      Math.max(incidents.filter((i) => i.ackSeconds).length, 1),
  );

  const incidentActions = (i: DispatchIncident): Action[] => [
    act.label("h", i.ref),
    act.run("dispatch", i.assignedUnit ? "Reassign unit" : "Dispatch a unit", () => setDispatchFor(i), {
      icon: Radio,
    }),
    act.run("escalate", "Escalate to supervisor", () => setEscalateFor(i), { icon: ArrowUpRight }),
    act.sep("s1"),
    act.link("cctv", "Find nearby cameras", "/video-intelligence", { icon: MapPin }),
    act.link("map", "Show on map", "/gis", { icon: MapPin }),
    act.link("fir", "Register an FIR from this", "/fir/new", { icon: Siren }),
  ];

  return (
    <DashboardLayout ops>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.dispatch")}
          description={t("modules.dispatchDesc")}
          icon={Radio}
          badge={<PhaseBadge phase={7} />}
          breadcrumb={[{ label: t("nav.commandGroup") }, { label: t("modules.dispatch") }]}
          actions={
            <>
              <Button variant="outline" onClick={() => router.push("/video-intelligence")}>
                <MapPin className="h-4 w-4" />
                Camera wall
              </Button>
              <Button onClick={() => setIntakeOpen(true)}>
                <Phone className="h-4 w-4" />
                Log incident
              </Button>
            </>
          }
          menu={[
            act.link("analytics", "Response analytics", "/workload", { icon: Gauge }),
            act.link("units", "Unit register", "/vehicles", { icon: Users }),
            act.link("risk", "Patrol optimisation", "/risk-intelligence", { icon: MapPin }),
          ]}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Awaiting dispatch" value={unassigned} icon={TriangleAlert} tone="danger" />
          <StatTile label="Active incidents" value={active} icon={Siren} tone="warning" />
          <StatTile label="Units available" value={availableUnits} icon={Radio} tone="success" />
          <StatTile label="Mean acknowledgement" value={avgAck} unit="s" icon={Timer} tone="info" />
        </div>

        <AIGovernanceNotice />

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Panel
            title="Incident queue"
            description="Ordered by severity, then by time waiting"
            actions={<PulseDot label="Live" />}
            bodyClassName="p-0"
          >
            <AnimatedList className="divide-y divide-border">
              {incidents.map((i) => (
                <AnimatedListItem key={i.id}>
                  <div className="flex flex-col gap-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{pick(i.type)}</p>
                        <p className="mt-0.5 truncate text-xs text-foreground-subtle">
                          {pick(i.location)} · {i.reportedAt} · via {i.source}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <SeverityBadge level={i.severity} />
                        <StatusPill tone={STATUS_TONE[i.status]}>{i.status}</StatusPill>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs text-foreground-muted">
                        <span className="font-mono">{i.ref}</span>
                        {i.assignedUnit && (
                          <span className="inline-flex items-center gap-1">
                            <Radio className="h-3 w-3" />
                            {i.assignedUnit}
                          </span>
                        )}
                        {i.etaMinutes !== undefined && i.status === "dispatched" && (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <Clock className="h-3 w-3" />
                            ETA {i.etaMinutes} min
                          </span>
                        )}
                        {i.ackSeconds !== undefined && (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Ack {i.ackSeconds}s
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {i.status === "unassigned" ? (
                          <Button size="sm" onClick={() => setDispatchFor(i)}>
                            <Radio className="h-3.5 w-3.5" />
                            Dispatch
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setDispatchFor(i)}>
                            Reassign
                          </Button>
                        )}
                        <ActionMenu size="sm" actions={incidentActions(i)} />
                      </div>
                    </div>
                  </div>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel
              title="Units"
              description="Availability, crew and distance"
              menu={[act.link("fleet", "Open fleet register", "/vehicles", { icon: Users })]}
              bodyClassName="flex flex-col gap-2"
            >
              {UNITS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUnitSheet(u)}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-hover"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium text-foreground">{u.callSign}</p>
                    <p className="truncate text-xs text-foreground-subtle">
                      {u.station} · {u.officers} officers · {u.distanceKm} km
                    </p>
                  </div>
                  <StatusPill
                    tone={u.status === "available" ? "success" : u.status === "engaged" ? "warning" : "neutral"}
                  >
                    {u.status}
                  </StatusPill>
                </button>
              ))}
            </Panel>

            <Panel title="Escalation policy" description="Applied automatically when unacknowledged">
              <ol className="flex flex-col gap-2 text-sm text-foreground-muted">
                {[
                  { at: "T+2 min", what: "Reminder to the assigned unit" },
                  { at: "T+5 min", what: "Notify the duty supervisor" },
                  { at: "T+8 min", what: "Escalate to the divisional control room" },
                ].map((step) => (
                  <li key={step.at} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 font-mono text-xs text-warning">{step.at}</span>
                    <span>{step.what}</span>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        </div>
      </div>

      {/* dispatch recommendation */}
      <Dialog open={dispatchFor !== null} onOpenChange={(o) => !o && setDispatchFor(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Dispatch a unit</DialogTitle>
            <DialogDescription>
              {dispatchFor ? `${dispatchFor.ref} · ${pick(dispatchFor.type)} · ${pick(dispatchFor.location)}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <p className="text-xs text-foreground-muted">
              Recommendation is based on distance, current traffic and unit workload. The dispatcher
              decides.
            </p>
            {UNITS.filter((u) => u.status === "available")
              .sort((a, b) => a.etaMinutes - b.etaMinutes)
              .map((u, i) => (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-medium text-foreground">{u.callSign}</p>
                      {i === 0 && <StatusPill tone="ai">Recommended</StatusPill>}
                      {i === 1 && <StatusPill tone="neutral">Backup</StatusPill>}
                    </div>
                    <p className="mt-0.5 text-xs text-foreground-subtle">
                      {u.type} · {u.station} · {u.distanceKm} km · {u.officers} officers
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-sm text-warning">
                      <Clock className="h-3.5 w-3.5" />
                      {u.etaMinutes} min
                    </span>
                    <Button
                      size="sm"
                      variant={i === 0 ? "default" : "outline"}
                      onClick={() => {
                        if (dispatchFor) assign(dispatchFor.id, u.callSign);
                        setDispatchFor(null);
                      }}
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              ))}
            <div className="flex items-center justify-between rounded-md border border-[var(--ai-border)] bg-ai-subtle px-3 py-2">
              <AIBadge model="eta-engine" />
              <ConfidenceMeter value={0.87} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDispatchFor(null);
                router.push("/vehicles");
              }}
            >
              Browse all units
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* intake */}
      <Dialog open={intakeOpen} onOpenChange={setIntakeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log an incident</DialogTitle>
            <DialogDescription>
              Classification and severity are suggested; the control-room operator confirms them.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="in-what">What is reported</Label>
              <Textarea id="in-what" rows={3} placeholder="Caller's account, in their words" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="in-where">Location</Label>
              <Input id="in-where" placeholder="Address or landmark" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="in-cat">Suggested category</Label>
                <Input id="in-cat" defaultValue="Theft" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="in-sev">Suggested severity</Label>
                <Input id="in-sev" defaultValue="High" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-[var(--ai-border)] bg-ai-subtle px-3 py-2">
              <AIBadge model="incident-classifier" />
              <ConfidenceMeter value={0.79} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntakeOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setIntakeOpen(false)}>Create incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* escalate */}
      <Dialog open={escalateFor !== null} onOpenChange={(o) => !o && setEscalateFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate to supervisor</DialogTitle>
            <DialogDescription>{escalateFor?.ref}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="es-to">Escalate to</Label>
              <Input id="es-to" defaultValue="Divisional control room" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="es-why">Reason</Label>
              <Textarea id="es-why" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setEscalateFor(null)}>
              <BellRing className="h-4 w-4" />
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* unit sheet */}
      <Sheet open={unitSheet !== null} onOpenChange={(o) => !o && setUnitSheet(null)}>
        <SheetContent>
          {unitSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{unitSheet.callSign}</SheetTitle>
                <SheetDescription>
                  {unitSheet.type} · {unitSheet.station}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Status" value={unitSheet.status} />
                  <Field label="Crew" value={`${unitSheet.officers} officers`} />
                  <Field label="Distance" value={`${unitSheet.distanceKm} km`} />
                  <Field label="ETA" value={`${unitSheet.etaMinutes} min`} />
                </dl>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => router.push("/gis")}>
                    <MapPin className="h-4 w-4" />
                    Track on map
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/personnel")}>
                    <Users className="h-4 w-4" />
                    View crew
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
