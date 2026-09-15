"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, BellRing, FileSearch, Radio, Search, ShieldAlert } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import type { BoardEntry } from "@/lib/api/missing-persons";
import { useMissingBoard } from "@/hooks/use-missing-persons";
import { EmptyState, PageHeader, PhaseBadge } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { BoardCard } from "../board-card";
import { StationCheckDialog } from "../station-checks";
import { errorMessage } from "../shared";

export default function MissingPersonsBoardPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const board = useMissingBoard();
  const canCheck = Boolean(user && hasMinimumRole(user.role, "ASI"));

  const [search, setSearch] = React.useState("");
  const [uncheckedOnly, setUncheckedOnly] = React.useState(false);
  const [vulnerableOnly, setVulnerableOnly] = React.useState(false);
  const [checking, setChecking] = React.useState<BoardEntry | null>(null);
  const [now, setNow] = React.useState(() => Date.now());

  // Reports present when the board first loaded; anything later is "new".
  const [initial, setInitial] = React.useState<Set<string> | null>(null);
  const [acknowledged, setAcknowledged] = React.useState<Set<string>>(new Set());
  const entries = React.useMemo(() => board.data?.data ?? [], [board.data]);
  React.useEffect(() => {
    if (board.data && initial === null) setInitial(new Set(board.data.data.map((e) => e.id)));
  }, [board.data, initial]);
  const newIds = initial ? entries.filter((e) => !initial.has(e.id)).map((e) => e.id) : [];
  const unseen = newIds.filter((id) => !acknowledged.has(id));

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  React.useEffect(() => setNow(Date.now()), [board.dataUpdatedAt]);

  const stations = board.data?.stations ?? [];
  const myStation = board.data?.viewerStationId ?? null;
  const myStationName = stations.find((s) => s.id === myStation)?.name ?? user?.stationName ?? "";
  const q = search.trim().toLowerCase();
  const shown = entries.filter((e) => {
    if (vulnerableOnly && e.vulnerabilities.length === 0) return false;
    if (uncheckedOnly && (!myStation || e.checks.some((c) => c.stationId === myStation) || e.stationId === myStation)) return false;
    if (!q) return true;
    return [e.personName, e.reportNumber, e.lastSeenLocation, e.stationName].some((v) => v.toLowerCase().includes(q));
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("missingBoard.board.title")}
          description={t("missingBoard.board.description")}
          icon={Radio}
          badge={<PhaseBadge phase={4} />}
          breadcrumb={[{ label: t("modules.missingPersons"), href: "/missing-persons" }, { label: t("missingBoard.board.open") }]}
          actions={
            <Link href="/missing-persons">
              <Button variant="outline">
                <FileSearch className="h-4 w-4" />
                {t("missingBoard.board.back")}
              </Button>
            </Link>
          }
        />

        <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted" data-testid="board-live">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-600" />
            </span>
            {t("missingBoard.board.live")}
          </span>
          {board.dataUpdatedAt > 0 && (
            <span>{t("missingBoard.board.updated", { time: new Date(board.dataUpdatedAt).toLocaleTimeString("en-IN") })}</span>
          )}
          {board.isError && board.data && <span className="text-danger">{t("missingBoard.board.refreshFailed")}</span>}
          {board.data && <span>{t("missingBoard.board.count", { n: entries.length })}</span>}
        </div>

        {unseen.length > 0 && (
          <Alert variant="warning" data-testid="new-report-banner">
            <BellRing />
            <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
              <AlertTitle className="mb-0">{t("missingBoard.board.newBanner", { n: unseen.length })}</AlertTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setUncheckedOnly(false);
                    setVulnerableOnly(false);
                    document.getElementById(`board-${unseen[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  {t("missingBoard.board.showNew")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAcknowledged(new Set(newIds))}>
                  {t("missingBoard.board.dismiss")}
                </Button>
              </div>
            </div>
          </Alert>
        )}

        <Alert variant="info">
          <ShieldAlert />
          <div>
            <AlertTitle>{t("missingBoard.board.broadcastTitle")}</AlertTitle>
            <AlertDescription>
              {t("missingBoard.board.broadcastNote")} {t("missingBoard.board.pollingNote")}
            </AlertDescription>
          </div>
        </Alert>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[16rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
            <Input aria-label={t("missingBoard.board.search")} placeholder={t("missingBoard.board.search")} value={search} onChange={(v: string) => setSearch(v)} className="pl-9" />
          </div>
          {myStation && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={uncheckedOnly} onCheckedChange={(c) => setUncheckedOnly(c === true)} aria-label={t("missingBoard.board.uncheckedOnly")} />
              {t("missingBoard.board.uncheckedOnly")}
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={vulnerableOnly} onCheckedChange={(c) => setVulnerableOnly(c === true)} aria-label={t("missingBoard.board.vulnerableOnly")} />
            {t("missingBoard.board.vulnerableOnly")}
          </label>
        </div>

        {board.isLoading ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : board.isError && !board.data ? (
          <Alert variant="danger">
            <AlertTriangle />
            <div>
              <AlertTitle>{t("missingBoard.board.loadFailed")}</AlertTitle>
              <AlertDescription>{errorMessage(board.error)}</AlertDescription>
            </div>
          </Alert>
        ) : entries.length === 0 ? (
          <EmptyState icon={Radio} title={t("missingBoard.board.empty")} description={t("missingBoard.board.emptyDesc")} />
        ) : shown.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("missingBoard.board.noMatchFilter")}</p>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2" data-testid="board-list">
            {shown.map((entry) => (
              <li key={entry.id} id={`board-${entry.id}`}>
                <BoardCard
                  entry={entry}
                  stations={stations}
                  myStation={myStation}
                  isNew={newIds.includes(entry.id)}
                  now={now}
                  onCheck={canCheck && myStation ? () => setChecking(entry) : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {checking && (
        <StationCheckDialog
          open
          onClose={() => setChecking(null)}
          reportId={checking.id}
          reportNumber={checking.reportNumber}
          personName={checking.personName}
          stationName={myStationName}
        />
      )}
    </DashboardLayout>
  );
}

