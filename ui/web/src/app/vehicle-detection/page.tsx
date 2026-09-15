"use client";

import * as React from "react";
import { CarFront, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusPill } from "@/components/platform/primitives";
import { ServiceBanner, SwitchButton } from "@/components/anpr/service-banner";
import { AnalysePanel, AnalysisView, RecentAnalyses } from "@/components/anpr/analyse-panel";
import { HitsPanel } from "@/components/anpr/hits-panel";
import { SearchPanel } from "@/components/anpr/search-panel";
import { WatchlistPanel } from "@/components/anpr/watchlist-panel";
import { MapPanel, PurposeLogPanel } from "@/components/anpr/map-panel";
import { errorText } from "@/components/anpr/shared";
import { useAnprStatus, useHits } from "@/hooks/use-anpr";
import type { Analysis } from "@/lib/api/anpr";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";

type Tab = "analyse" | "hits" | "search" | "watchlist" | "map" | "purposeLog";

export default function VehicleDetectionPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  // Floors mirror the server's (see the AI layer A4 block in main.go).
  const isASI = Boolean(user && hasMinimumRole(user.role, "ASI"));
  const isSI = Boolean(user && hasMinimumRole(user.role, "SI"));
  const isDSP = Boolean(user && hasMinimumRole(user.role, "DSP"));

  const [tab, setTab] = React.useState<Tab>("analyse");
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);
  const status = useAnprStatus();
  const pending = useHits("PENDING", 1, 1);
  const pendingCount = pending.data?.total ?? 0;

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "analyse", label: t("anprScreen.tabs.analyse"), show: true },
    { id: "hits", label: `${t("anprScreen.tabs.hits")}${pendingCount ? ` (${pendingCount})` : ""}`, show: true },
    { id: "search", label: t("anprScreen.tabs.search"), show: true },
    { id: "watchlist", label: t("anprScreen.tabs.watchlist"), show: true },
    { id: "map", label: t("anprScreen.tabs.map"), show: true },
    { id: "purposeLog", label: t("anprScreen.tabs.purposeLog"), show: isDSP },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.vehicleDetection")}
          description={t("modules.vehicleDetectionDesc")}
          icon={CarFront}
          badge={<StatusPill tone="ai">{t("anprScreen.aiBadge")}</StatusPill>}
          breadcrumb={[{ label: t("nav.surveillanceGroup") }, { label: t("modules.vehicleDetection") }]}
          actions={isDSP && status.data ? <SwitchButton status={status.data} /> : undefined}
        />

        {!isASI ? (
          <p className="text-sm text-foreground-muted">{t("anprScreen.common.needsASI")}</p>
        ) : status.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : status.isError || !status.data ? (
          <div className="flex items-center gap-3 text-sm text-danger">
            {t("anprScreen.common.loadFailed")}: {errorText(status.error)}
            <Button size="sm" variant="outline" onClick={() => status.refetch()}>{t("anprScreen.common.retry")}</Button>
          </div>
        ) : (
          <>
            <ServiceBanner status={status.data} />
            <p className="rounded-lg border border-[var(--ai-border)] bg-ai-subtle px-3 py-2 text-xs text-foreground">{t("anprScreen.machineNotice")}</p>

            <div className="flex flex-wrap gap-1 border-b border-border" role="tablist">
              {tabs.filter((x) => x.show).map((x) => (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === x.id}
                  onClick={() => setTab(x.id)}
                  className={
                    tab === x.id
                      ? "-mb-px border-b-2 border-accent px-3 py-2 text-sm font-medium text-accent"
                      : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-foreground-muted hover:text-foreground"
                  }
                >
                  {x.label}
                </button>
              ))}
            </div>

            {tab === "analyse" && (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <AnalysePanel status={status.data} onAnalysis={setAnalysis} />
                  </div>
                  <RecentAnalyses onOpened={setAnalysis} />
                </div>
                {analysis && <AnalysisView analysis={analysis} />}
              </div>
            )}
            {tab === "hits" && <HitsPanel userId={user?.id} canReview={isSI} />}
            {tab === "search" && <SearchPanel />}
            {tab === "watchlist" && <WatchlistPanel canManage={isSI} />}
            {tab === "map" && <MapPanel />}
            {tab === "purposeLog" && isDSP && <PurposeLogPanel />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
