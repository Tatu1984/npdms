"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Calendar,
  Info,
  Lightbulb,
  MapPinned,
  Radio,
  Route,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { RISK_AREAS, type RiskArea } from "@/lib/platform/mock";
import { act, ActionMenu, type Action } from "@/components/platform/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function scoreTone(score: number) {
  if (score >= 70) return { color: "var(--danger)", label: "Elevated" };
  if (score >= 55) return { color: "var(--warning)", label: "Moderate" };
  return { color: "var(--success)", label: "Low" };
}

export default function RiskIntelligencePage() {
  const router = useRouter();
  const { t, pick } = useI18n();

  const [areaSheet, setAreaSheet] = React.useState<RiskArea | null>(null);
  const [simOpen, setSimOpen] = React.useState(false);
  const [patrolFor, setPatrolFor] = React.useState<RiskArea | null>(null);

  const elevated = RISK_AREAS.filter((a) => a.score >= 70).length;
  const rising = RISK_AREAS.filter((a) => a.trend === "rising").length;

  const areaActions = (a: RiskArea): Action[] => [
    act.label("h", pick(a.area)),
    act.run("open", "Open risk breakdown", () => setAreaSheet(a), { icon: Info }),
    act.run("patrol", "Act on the recommendation", () => setPatrolFor(a), { icon: Route }),
    act.sep("s"),
    act.link("map", "Show on map", "/gis", { icon: MapPinned }),
    act.link("dispatch", "Dispatch console", "/dispatch", { icon: Radio }),
    act.link("grievance", "Complaints from this locality", "/grievance", { icon: Users }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.riskIntelligence")}
          description={t("modules.riskIntelligenceDesc")}
          icon={MapPinned}
          badge={<PhaseBadge phase={10} />}
          breadcrumb={[{ label: t("nav.citizenGroup") }, { label: t("modules.riskIntelligence") }]}
          actions={
            <Button onClick={() => setSimOpen(true)}>
              <Sparkles className="h-4 w-4" />
              Resource simulation
            </Button>
          }
          menu={[
            act.link("map", "Map view", "/gis", { icon: MapPinned }),
            act.link("analytics", "Crime analytics", "/analytics", { icon: BarChart3 }),
            act.link("dispatch", "Patrol deployment", "/dispatch", { icon: Radio }),
          ]}
        />

        <Alert variant="info">
          <Info />
          <div>
            <AlertTitle>This scores places, not people</AlertTitle>
            <AlertDescription>
              The model identifies areas that may warrant additional public-safety attention, using
              incident, complaint, traffic and emergency-call history. It makes no assessment of any
              individual and produces no watchlist.
            </AlertDescription>
          </div>
        </Alert>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Areas monitored" value={RISK_AREAS.length} icon={MapPinned} />
          <StatTile label="Elevated score" value={elevated} icon={TrendingUp} tone="danger" />
          <StatTile label="Rising trend" value={rising} icon={TrendingUp} tone="warning" />
          <StatTile label="Recommendations open" value={RISK_AREAS.length} icon={Lightbulb} tone="info" />
        </div>

        <AIGovernanceNotice />

        <div className="grid gap-3 md:grid-cols-2">
          {RISK_AREAS.map((a) => {
            const tone = scoreTone(a.score);
            return (
              <div key={a.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{pick(a.area)}</p>
                    <p className="mt-0.5 text-xs text-foreground-subtle">{a.division} Division</p>
                  </div>
                  <ActionMenu size="sm" actions={areaActions(a)} />
                </div>

                <div className="flex items-center gap-3">
                  <ScoreDial score={a.score} color={tone.color} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: tone.color }}>
                      {tone.label}
                    </p>
                    <StatusPill
                      tone={a.trend === "rising" ? "danger" : a.trend === "falling" ? "success" : "neutral"}
                    >
                      {a.trend === "rising" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : a.trend === "falling" ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : null}
                      {a.trend}
                    </StatusPill>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                    Contributing factors
                  </p>
                  {a.factors.map((f) => (
                    <div key={f.label.en} className="flex items-center gap-2">
                      <span className="w-8 shrink-0 tabular text-right text-xs text-foreground-muted">
                        {f.weight}%
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${f.weight}%` }}
                        />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-xs text-foreground-muted">
                        {pick(f.label)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                  <AIBadge compact />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAreaSheet(a)}>
                      {t("ai.explainTitle")}
                    </Button>
                    <Button size="sm" onClick={() => setPatrolFor(a)}>
                      <Route className="h-3.5 w-3.5" />
                      Act
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* simulation */}
      <Dialog open={simOpen} onOpenChange={setSimOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Resource simulation</DialogTitle>
            <DialogDescription>
              Model the effect of a deployment change before committing to it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rs-area">Area</Label>
              <Input id="rs-area" defaultValue="Gariahat market perimeter" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="rs-units">Additional units</Label>
                <Input id="rs-units" type="number" defaultValue={2} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rs-hours">Hours of deployment</Label>
                <Input id="rs-hours" defaultValue="18:00 – 21:00" />
              </div>
            </div>
            <div className="rounded-md border border-[var(--ai-border)] bg-ai-subtle p-3">
              <div className="flex items-center justify-between">
                <AIBadge confidence={0.68} model="deployment-simulator" />
                <span className="text-xs text-foreground-muted">Projection, not a guarantee</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Projected score" value="72 → 61" />
                <Field label="Response time" value="7.4 → 6.1 min" />
                <Field label="Coverage gap" value="Reduced by 22%" />
                <Field label="Cost" value="6 officer-hours / day" />
              </dl>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSimOpen(false)}>
              {t("common.close")}
            </Button>
            <Button onClick={() => { setSimOpen(false); router.push("/dispatch"); }}>
              Take to deployment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* act on recommendation */}
      <Dialog open={patrolFor !== null} onOpenChange={(o) => !o && setPatrolFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Act on the recommendation</DialogTitle>
            <DialogDescription>{patrolFor ? pick(patrolFor.area) : ""}</DialogDescription>
          </DialogHeader>
          {patrolFor && (
            <div className="flex flex-col gap-3">
              <p className="rounded-md border border-border bg-surface-sunken px-3 py-2 text-sm text-foreground-muted">
                {pick(patrolFor.recommendation)}
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="rp-action">Action to record</Label>
                <Input id="rp-action" defaultValue="Additional evening foot patrol" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rp-owner">Assign to</Label>
                <Input id="rp-owner" placeholder="Officer-in-charge or division" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rp-review">Review after</Label>
                <Input id="rp-review" type="date" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPatrolFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setPatrolFor(null); router.push("/dispatch"); }}>
              Record and deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* explainability sheet */}
      <Sheet open={areaSheet !== null} onOpenChange={(o) => !o && setAreaSheet(null)}>
        <SheetContent className="w-[32rem]">
          {areaSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{pick(areaSheet.area)}</SheetTitle>
                <SheetDescription>
                  {areaSheet.division} Division · score {areaSheet.score}/100
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <div className="flex items-center gap-4">
                  <ScoreDial score={areaSheet.score} color={scoreTone(areaSheet.score).color} size={88} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: scoreTone(areaSheet.score).color }}>
                      {scoreTone(areaSheet.score).label}
                    </p>
                    <p className="text-xs text-foreground-muted">Trend: {areaSheet.trend}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                    {t("ai.explainTitle")}
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    The score is the weighted sum below. No factor is hidden and none derives from
                    personal characteristics.
                  </p>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {areaSheet.factors.map((f) => (
                      <li key={f.label.en} className="flex items-center gap-3">
                        <span className="w-10 shrink-0 tabular text-right text-sm font-medium text-foreground">
                          {f.weight}%
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${f.weight}%` }} />
                        </div>
                        <span className="min-w-0 flex-[1.4] truncate text-sm text-foreground-muted">
                          {pick(f.label)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-md border border-border bg-surface-sunken p-3">
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-subtle">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Recommendation
                  </p>
                  <p className="mt-1.5 text-sm text-foreground">{pick(areaSheet.recommendation)}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => { setPatrolFor(areaSheet); setAreaSheet(null); }}>
                    <Route className="h-4 w-4" />
                    Act on this recommendation
                  </Button>
                  <Button variant="outline" onClick={() => { setAreaSheet(null); setSimOpen(true); }}>
                    <Sparkles className="h-4 w-4" />
                    Simulate a deployment change
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/analytics")}>
                    <Calendar className="h-4 w-4" />
                    Compare with previous periods
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

function ScoreDial({ score, color, size = 64 }: { score: number; color: string; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Risk score ${score} of 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        className="fill-[var(--foreground)] font-semibold"
        style={{ fontSize: size / 3.6 }}
      >
        {score}
      </text>
    </svg>
  );
}
