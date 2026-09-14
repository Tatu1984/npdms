"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Brain,
  ChevronRight,
  ClipboardList,
  FileText,
  GitCompareArrows,
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
import { useAuthStore } from "@/stores/authStore";
import {
  GROUP_LABEL,
  GROUP_ORDER,
  MODULES,
  PHASED_MODULES,
} from "@/lib/platform/modules";
import {
  CONTRADICTIONS,
  DASHBOARD_TRENDS,
  GAPS,
  GRIEVANCES,
  INCIDENTS,
  STATION_METRICS,
  VIDEO_EVENTS,
  WORKSPACES,
} from "@/lib/platform/mock";
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

  const openInvestigations = STATION_METRICS.reduce((s, m) => s + m.openInvestigations, 0);
  const awaitingDispatch = INCIDENTS.filter((i) => i.status === "unassigned").length;
  const unreviewedEvents = VIDEO_EVENTS.filter((e) => e.status === "new").length;
  const openGrievances = GRIEVANCES.filter((g) => g.status !== "closed").length;
  const aiFindings = CONTRADICTIONS.length + GAPS.length;

  const maxTrend = Math.max(...DASHBOARD_TRENDS.map((d) => d.firs));

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
            act.link("workload", "Station performance", "/workload", { icon: Gauge }),
            act.link("reports", "Report library", "/reports", { icon: ClipboardList }),
          ]}
        />

        {/* headline numbers — each one is a route */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile
            label="Open investigations"
            value={openInvestigations}
            icon={ClipboardList}
            href="/cases"
            deltaLabel="across five stations"
          />
          <StatTile
            label="AI findings to review"
            value={aiFindings}
            icon={GitCompareArrows}
            tone="ai"
            href="/ai-review"
            deltaLabel="contradictions and gaps"
          />
          <StatTile
            label="Awaiting dispatch"
            value={awaitingDispatch}
            icon={Siren}
            tone="danger"
            href="/dispatch"
          />
          <StatTile
            label="Unreviewed CCTV events"
            value={unreviewedEvents}
            icon={ScanSearch}
            tone="warning"
            href="/video-intelligence"
          />
          <StatTile
            label="Open grievances"
            value={openGrievances}
            icon={Megaphone}
            tone="info"
            href="/grievance"
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
            <AnimatedList className="divide-y divide-border">
              {WORKSPACES.slice(0, 4).map((w) => (
                <AnimatedListItem key={w.id}>
                  <Link
                    href={`/investigation/${w.id}`}
                    className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-hover"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {pick(w.title)}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
                        {w.caseNumber} · {w.station} PS
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {w.counts.contradictions > 0 && (
                          <StatusPill tone="danger">
                            {w.counts.contradictions} contradictions
                          </StatusPill>
                        )}
                        {w.counts.gaps > 0 && (
                          <StatusPill tone="warning">{w.counts.gaps} gaps</StatusPill>
                        )}
                        {w.nextCourtDate && (
                          <StatusPill tone="info">Court {w.nextCourtDate}</StatusPill>
                        )}
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
          </Panel>

          {/* six-month trend */}
          <Panel
            title="Six-month trend"
            description="FIRs registered against disposals"
            menu={[
              act.link("analytics", "Open crime analytics", "/analytics", { icon: Gauge }),
              act.link("reports", "Export report", "/reports", { icon: ClipboardList }),
            ]}
          >
            <div className="flex h-48 items-end gap-3">
              {DASHBOARD_TRENDS.map((d) => (
                <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end justify-center gap-1">
                    <div
                      className="w-1/2 rounded-t bg-accent transition-all"
                      style={{ height: `${(d.firs / maxTrend) * 100}%` }}
                      title={`${d.firs} FIRs`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-success transition-all"
                      style={{ height: `${(d.disposals / maxTrend) * 100}%` }}
                      title={`${d.disposals} disposals`}
                    />
                  </div>
                  <span className="text-[0.65rem] text-foreground-subtle">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <span className="h-2 w-2 rounded-full bg-accent" />
                FIRs registered
              </span>
              <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <span className="h-2 w-2 rounded-full bg-success" />
                Disposals
              </span>
            </div>
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

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
