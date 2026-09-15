"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Brain,
  ChevronRight,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  Megaphone,
  Radio,
  ScanSearch,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import {
  GROUP_LABEL,
  GROUP_ORDER,
  MODULES,
  PHASED_MODULES,
} from "@/lib/platform/modules";
import { useVideoEventStats } from "@/hooks/use-video";
import { useWorkspaces } from "@/hooks/use-investigation";
import { useDispatchStats } from "@/hooks/use-dispatch";
import { useComplaintStats } from "@/hooks/use-complaints";
import { useUnacknowledgedAlerts } from "@/hooks/use-alerts";
import { useWorkloadTrends } from "@/hooks/use-workload";
import { bilingual } from "@/lib/api/investigation";
import { act } from "@/components/platform/actions";
import {
  PageHeader,
  Panel,
  PhaseBadge,
  SeverityBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { AIGovernanceNotice } from "@/components/platform/governance";
import { Button } from "@/components/ui/button";
import { AnimatedList, AnimatedListItem, GradientText } from "@/components/reactbits";

export default function DashboardPage() {
  const router = useRouter();
  const { t, pick } = useI18n();
  const user = useAuthStore((s) => s.user);

  // Every figure below comes from the API; a panel the officer's rank cannot
  // read shows a dash rather than a made-up number.
  const canSeeWorkload = !!user && hasMinimumRole(user.role, "SHO");
  const activeWorkspaces = useWorkspaces({ status: "active", pageSize: 1 });
  const myWorkspaces = useWorkspaces({ mine: true, pageSize: 4 });
  const dispatchStats = useDispatchStats();
  const complaintStats = useComplaintStats();
  const unacknowledged = useUnacknowledgedAlerts();
  const videoEventStats = useVideoEventStats();

  const sixMonthsAgo = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5, 1);
    return d.toISOString().slice(0, 10);
  }, []);
  const trends = useWorkloadTrends({ from: sixMonthsAgo }, "month", canSeeWorkload);
  const firSeries = trends.data?.series.find((x) => x.key === "firsRegistered");
  const caseSeries = trends.data?.series.find((x) => x.key === "casesRegistered");
  const trendBuckets = trends.data?.buckets ?? [];
  const maxTrend = Math.max(1, ...(firSeries?.values ?? []), ...(caseSeries?.values ?? []));

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={`${greeting()}, ${user?.name?.split(" ")[0] ?? "Officer"}`}
          description="Operational picture across investigation, evidence, surveillance, traffic and citizen services."
          icon={LayoutDashboard}
          actions={
            <>
              <Button variant="outline" onClick={() => router.push("/fir/new")}>
                <FileText className="h-4 w-4" />
                Register FIR
              </Button>
              <Button onClick={() => router.push("/investigation")}>
                <Brain className="h-4 w-4" />
                Investigation Copilot
              </Button>
            </>
          }
          menu={[
            act.link("dispatch", "Dispatch console", "/dispatch", { icon: Radio }),
            act.link("workload", "Station workload", "/workload", { icon: Gauge }),
          ]}
        />

        {/* headline numbers — each one is a route */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile
            label="Active investigations"
            value={activeWorkspaces.data?.total ?? 0}
            icon={ClipboardList}
            href="/investigation"
            deltaLabel={activeWorkspaces.isError ? "not available" : "investigation workspaces"}
          />
          <StatTile
            label="Alerts to acknowledge"
            value={unacknowledged.data?.length ?? 0}
            icon={Bell}
            tone="warning"
            href="/alerts"
            deltaLabel={unacknowledged.isError ? "not available" : "issued and not yet acknowledged"}
          />
          <StatTile
            label="Awaiting dispatch"
            value={dispatchStats.data?.awaitingDispatch ?? 0}
            icon={Siren}
            tone="danger"
            href="/dispatch"
            deltaLabel={dispatchStats.isError ? "not available" : `${dispatchStats.data?.active ?? 0} active`}
          />
          <StatTile
            label="CCTV events awaiting triage"
            value={videoEventStats.data?.raised ?? 0}
            icon={ScanSearch}
            tone="warning"
            href="/video-intelligence"
            deltaLabel={videoEventStats.isError ? "not available" : undefined}
          />
          <StatTile
            label="Open grievances"
            value={complaintStats.data?.open ?? 0}
            icon={Megaphone}
            tone="info"
            href="/grievance"
            deltaLabel={complaintStats.isError ? "not available" : `${complaintStats.data?.unrouted ?? 0} not yet routed`}
          />
        </div>

        <AIGovernanceNotice />

        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          {/* active workspaces */}
          <Panel
            title="Your investigation workspaces"
            description="Cases where you are the investigating or supervisory officer"
            actions={
              <Button variant="ghost" size="sm" onClick={() => router.push("/investigation")}>
                {t("common.viewAll")}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            }
            bodyClassName="p-0"
          >
            {myWorkspaces.isPending ? (
              <p className="p-4 text-sm text-foreground-muted">Loading workspaces…</p>
            ) : myWorkspaces.isError ? (
              <p className="p-4 text-sm text-foreground-muted">Workspaces could not be loaded.</p>
            ) : myWorkspaces.data.data.length === 0 ? (
              <p className="p-4 text-sm text-foreground-muted">
                You are not the investigating or supervisory officer on any workspace.
              </p>
            ) : (
              <AnimatedList className="divide-y divide-border">
                {myWorkspaces.data.data.map((w) => (
                  <AnimatedListItem key={w.id}>
                    <Link
                      href={`/investigation/${w.id}`}
                      className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-hover"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {pick(bilingual(w.title, w.titleBn))}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
                          {w.caseNumber}
                          {w.stationName ? ` · ${w.stationName}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {w.counts.contradictions > 0 && (
                            <StatusPill tone="danger">{w.counts.contradictions} contradictions</StatusPill>
                          )}
                          {w.counts.gaps > 0 && <StatusPill tone="warning">{w.counts.gaps} gaps</StatusPill>}
                          {w.nextCourtDate && <StatusPill tone="info">Court {w.nextCourtDate}</StatusPill>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <SeverityBadge level={w.priority} />
                        <ArrowRight className="h-4 w-4 text-foreground-subtle" />
                      </div>
                    </Link>
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            )}
          </Panel>

          {/* six-month trend */}
          <Panel
            title="Six-month trend"
            description="FIRs and cases registered per month, from the station workload records"
            menu={[act.link("workload", "Open station workload", "/workload", { icon: Gauge })]}
          >
            {!canSeeWorkload ? (
              <p className="text-sm text-foreground-muted">
                Station trends are available to the Officer-in-Charge and above.
              </p>
            ) : trends.isPending ? (
              <p className="text-sm text-foreground-muted">Loading trend…</p>
            ) : trends.isError ? (
              <p className="text-sm text-foreground-muted">The trend could not be loaded.</p>
            ) : (
              <>
                {/* Pixel heights: percentage heights collapse to zero inside these flex columns. */}
                <div className="flex h-48 items-end gap-3">
                  {trendBuckets.map((bucket, i) => {
                    const firs = firSeries?.values[i] ?? 0;
                    const cases = caseSeries?.values[i] ?? 0;
                    return (
                      <div key={bucket} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="flex h-40 w-full items-end justify-center gap-1">
                          <div
                            className="w-1/2 rounded-t bg-accent transition-all"
                            style={{ height: `${Math.round((firs / maxTrend) * TREND_BAR_PX)}px` }}
                            title={`${firs} FIRs registered`}
                          />
                          <div
                            className="w-1/2 rounded-t bg-success transition-all"
                            style={{ height: `${Math.round((cases / maxTrend) * TREND_BAR_PX)}px` }}
                            title={`${cases} cases registered`}
                          />
                        </div>
                        <span className="text-[0.65rem] text-foreground-subtle">
                          {new Date(bucket).toLocaleDateString("en-IN", { month: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    FIRs registered
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Cases registered
                  </span>
                </div>
              </>
            )}
          </Panel>
        </div>

        {/* the fourteen modules, grouped */}
        <Panel
          title={
            <>
              The platform, in <GradientText>fourteen phased modules</GradientText>
            </>
          }
          description="One platform consuming authorised data from the systems Kolkata Police already operates"
          bodyClassName="flex flex-col gap-5"
        >
          {GROUP_ORDER.filter((g) => g !== "core").map((group) => {
            const items = MODULES.filter((m) => m.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                  {t(GROUP_LABEL[group])}
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((m) => (
                    <Link
                      key={m.id}
                      href={m.href}
                      className="group flex flex-col gap-2 rounded-lg border border-border bg-surface p-3.5 transition-colors hover:border-accent/50 hover:bg-surface-hover"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-accent">
                          <m.icon className="h-4 w-4" />
                        </span>
                        <div className="flex items-center gap-1.5">
                          {m.phase !== undefined && <PhaseBadge phase={m.phase} />}
                          {m.aiAssisted && <StatusPill tone="ai">AI</StatusPill>}
                          {m.chainAnchored && (
                            <StatusPill tone="success">
                              <ShieldCheck className="h-3 w-3" />
                            </StatusPill>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground group-hover:text-accent">
                        {t(m.nameKey)}
                      </p>
                      <p className="line-clamp-2 text-xs text-foreground-muted">{t(m.descKey)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </Panel>

        {/* delivery roadmap */}
        <Panel
          title="Delivery phases"
          description="Each phase ships on the same platform — shared identity, audit, evidence and integration layers"
          bodyClassName="p-0"
        >
          <ol className="divide-y divide-border">
            {PHASED_MODULES.map((m) => (
              <li key={m.id}>
                <Link
                  href={m.href}
                  className="flex items-center gap-4 p-3.5 transition-colors hover:bg-surface-hover"
                >
                  <PhaseBadge phase={m.phase ?? 0} />
                  <m.icon className="h-4 w-4 shrink-0 text-foreground-subtle" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">{t(m.nameKey)}</span>
                    <span className="block truncate text-xs text-foreground-subtle">
                      {t(m.descKey)}
                    </span>
                  </span>
                  <StatusPill tone={m.status === "live" ? "success" : "info"}>{m.status}</StatusPill>
                  <ChevronRight className="h-4 w-4 shrink-0 text-foreground-subtle" />
                </Link>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </DashboardLayout>
  );
}

/** Height in pixels of the tallest bar in the six-month trend (h-40). */
const TREND_BAR_PX = 160;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
