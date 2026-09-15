"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeftRight, Boxes, Clock, IndianRupee, PackagePlus, ShieldAlert, Warehouse } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { EmptyState, PageHeader, Panel, PhaseBadge, StatTile, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import {
  PROPERTY_CATEGORIES,
  type Attention,
  type PropertyCategory,
  type PropertyQuery,
  type PropertyStatus,
} from "@/lib/api/malkhana";
import { useMalkhanaDashboard, useMalkhanaLocations, useMalkhanaStations, useProperties } from "@/hooks/use-malkhana";
import { LocationDialog, RegisterDialog, fieldClass, formatRupees, officerMessage } from "./parts";

const PAGE_SIZE = 20;

const STATUS_TONE = { IN_MALKHANA: "success", MOVED_OUT: "info", DISPOSED: "neutral" } as const;

export default function MalkhanaPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const canRegister = Boolean(user && hasMinimumRole(user.role, "ASI"));
  const canAddLocation = Boolean(user && hasMinimumRole(user.role, "SI"));
  const wide = Boolean(user && hasMinimumRole(user.role, "DSP"));

  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [status, setStatus] = React.useState<PropertyStatus | "">("");
  const [category, setCategory] = React.useState<PropertyCategory | "">("");
  const [attention, setAttention] = React.useState<Attention | "">("");
  const [stationId, setStationId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [locationOpen, setLocationOpen] = React.useState(false);

  React.useEffect(() => {
    const h = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(h);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, status, category, attention, stationId]);

  const scopeStation = wide ? stationId || undefined : undefined;
  const query: PropertyQuery = {
    page,
    pageSize: PAGE_SIZE,
    search: debounced || undefined,
    status: status || undefined,
    category: category || undefined,
    attention: attention || undefined,
    stationId: scopeStation,
  };
  const items = useProperties(query);
  const dashboard = useMalkhanaDashboard(scopeStation);
  const stations = useMalkhanaStations(wide);
  const locations = useMalkhanaLocations(scopeStation);
  // DSP and above work across stations; registration needs a chosen station.
  const registerStation = wide ? stationId || undefined : undefined;
  const d = dashboard.data;

  const toggleAttention = (a: Attention) => setAttention((cur) => (cur === a ? "" : a));

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.malkhana")}
          description={t("modules.malkhanaDesc")}
          icon={Boxes}
          badge={<PhaseBadge phase={14} />}
          breadcrumb={[{ label: t("nav.evidenceGroup") }, { label: t("modules.malkhana") }]}
          actions={
            <>
              {canAddLocation && (!wide || stationId) && (
                <Button variant="outline" onClick={() => setLocationOpen(true)}>
                  <Warehouse className="h-4 w-4" />
                  {t("malkhanaScreen.actions.addLocation")}
                </Button>
              )}
              {canRegister && (!wide || stationId) && (
                <Button onClick={() => setRegisterOpen(true)} data-testid="register-property">
                  <PackagePlus className="h-4 w-4" />
                  {t("malkhanaScreen.actions.register")}
                </Button>
              )}
            </>
          }
        />

        <Alert variant="info">
          <ShieldAlert />
          <div>
            <AlertTitle>{t("malkhanaScreen.ledgerTitle")}</AlertTitle>
            <AlertDescription>{t("malkhanaScreen.ledgerBody")}</AlertDescription>
          </div>
        </Alert>

        {wide && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-xs text-foreground-muted">
              {t("malkhanaScreen.filters.station")}
              <select className={`${fieldClass} min-w-[16rem]`} value={stationId} onChange={(e) => setStationId(e.target.value)} data-testid="station-filter">
                <option value="">—</option>
                {(stations.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {dashboard.isError ? (
          <Alert variant="danger">
            <AlertDescription>{officerMessage(dashboard.error)}</AlertDescription>
          </Alert>
        ) : !d ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6" data-testid="malkhana-stats">
            <StatTile label={t("malkhanaScreen.stats.total")} value={d.total} icon={Boxes} onClick={() => { setStatus(""); setAttention(""); }} />
            <StatTile label={t("malkhanaScreen.stats.inMalkhana")} value={d.inMalkhana} icon={Warehouse} tone="success" onClick={() => setStatus("IN_MALKHANA")} />
            <StatTile label={t("malkhanaScreen.stats.movedOut")} value={d.movedOut} icon={ArrowLeftRight} tone="info" onClick={() => setStatus("MOVED_OUT")} />
            <StatTile label={t("malkhanaScreen.stats.sealBroken")} value={d.sealBroken} icon={AlertTriangle} tone={d.sealBroken > 0 ? "danger" : "default"} onClick={() => toggleAttention("SEAL_BROKEN")} />
            <StatTile label={t("malkhanaScreen.stats.overdue")} value={d.overdueMovements} icon={Clock} tone={d.overdueMovements > 0 ? "warning" : "default"} onClick={() => toggleAttention("OVERDUE")} />
            <StatTile label={t("malkhanaScreen.stats.reviewDue", { days: d.reviewPeriodDays })} value={d.reviewDue} icon={Clock} tone={d.reviewDue > 0 ? "warning" : "default"} onClick={() => toggleAttention("REVIEW_DUE")} />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <Panel
            title={t("modules.malkhana")}
            bodyClassName="p-0"
            footer={
              items.data && items.data.totalPages > 1 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">
                    {t("malkhanaScreen.table.page", { page: items.data.page, pages: items.data.totalPages })}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      {t("malkhanaScreen.table.prev")}
                    </Button>
                    <Button size="sm" variant="outline" disabled={page >= items.data.totalPages} onClick={() => setPage((p) => p + 1)}>
                      {t("malkhanaScreen.table.next")}
                    </Button>
                  </div>
                </div>
              ) : undefined
            }
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
              <div className="min-w-[14rem] flex-1">
                <Input value={search} onChange={setSearch} placeholder={t("malkhanaScreen.filters.search")} data-testid="malkhana-search" />
              </div>
              <select className={`${fieldClass} w-auto`} value={status} onChange={(e) => setStatus(e.target.value as PropertyStatus | "")} aria-label={t("malkhanaScreen.filters.status")}>
                <option value="">{t("malkhanaScreen.filters.allStatuses")}</option>
                {(["IN_MALKHANA", "MOVED_OUT", "DISPOSED"] as const).map((s) => (
                  <option key={s} value={s}>{t(`malkhanaScreen.status.${s}`)}</option>
                ))}
              </select>
              <select className={`${fieldClass} w-auto`} value={category} onChange={(e) => setCategory(e.target.value as PropertyCategory | "")} aria-label={t("malkhanaScreen.filters.category")}>
                <option value="">{t("malkhanaScreen.filters.allCategories")}</option>
                {PROPERTY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`malkhanaScreen.category.${c}`)}</option>
                ))}
              </select>
              <select className={`${fieldClass} w-auto`} value={attention} onChange={(e) => setAttention(e.target.value as Attention | "")} aria-label={t("malkhanaScreen.filters.attention")}>
                <option value="">{t("malkhanaScreen.filters.none")}</option>
                {(["SEAL_BROKEN", "OVERDUE", "REVIEW_DUE"] as const).map((a) => (
                  <option key={a} value={a}>{t(`malkhanaScreen.attention.${a}`)}</option>
                ))}
              </select>
            </div>

            {items.isLoading ? (
              <div className="flex flex-col gap-2 p-3">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : items.isError ? (
              <div className="p-4">
                <Alert variant="danger">
                  <AlertDescription className="flex items-center justify-between gap-3">
                    {officerMessage(items.error)}
                    <Button size="sm" variant="outline" onClick={() => items.refetch()}>{t("malkhanaScreen.actions.retry")}</Button>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (items.data?.data ?? []).length === 0 ? (
              <div className="p-4">
                <EmptyState title={t("malkhanaScreen.table.empty")} description={t("malkhanaScreen.table.emptyBody")} icon={Boxes} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="malkhana-table">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                      <th className="px-3 py-2">{t("malkhanaScreen.table.property")}</th>
                      <th className="hidden px-3 py-2 lg:table-cell">{t("malkhanaScreen.table.record")}</th>
                      <th className="hidden px-3 py-2 sm:table-cell">{t("malkhanaScreen.table.category")}</th>
                      <th className="hidden px-3 py-2 md:table-cell">{t("malkhanaScreen.table.storage")}</th>
                      <th className="px-3 py-2">{t("malkhanaScreen.table.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.data!.data.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                        <td className="px-3 py-2">
                          <Link href={`/malkhana/${p.id}`} className="block min-w-0">
                            <span className="block truncate font-medium text-foreground">{p.description}</span>
                            <span className="font-mono text-xs text-accent">{p.propertyNumber}</span>
                          </Link>
                        </td>
                        <td className="hidden px-3 py-2 font-mono text-xs lg:table-cell">
                          {p.caseNumber || "—"}
                          {p.firNumber && <span className="block text-foreground-subtle">FIR {p.firNumber}</span>}
                        </td>
                        <td className="hidden px-3 py-2 sm:table-cell">
                          <StatusPill tone={p.category === "NARCOTICS" || p.category === "ARMS" ? "warning" : "neutral"}>
                            {t(`malkhanaScreen.category.${p.category}`)}
                          </StatusPill>
                        </td>
                        <td className="hidden px-3 py-2 md:table-cell">
                          <span className="block text-xs text-foreground">{p.locationLabel || (p.openMovement ? p.openMovement.destination : "—")}</span>
                          <span className="font-mono text-[0.7rem] text-foreground-subtle">{p.sealNumber}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col items-start gap-1">
                            <StatusPill tone={STATUS_TONE[p.status]}>{t(`malkhanaScreen.status.${p.status}`)}</StatusPill>
                            {p.sealState === "BROKEN" && p.status !== "DISPOSED" && (
                              <StatusPill tone="danger">{t("malkhanaScreen.seal.BROKEN")}</StatusPill>
                            )}
                            {p.movementOverdue && <StatusPill tone="warning">{t("malkhanaScreen.attention.OVERDUE")}</StatusPill>}
                            {p.reviewDue && <StatusPill tone="warning">{t("malkhanaScreen.attention.REVIEW_DUE")}</StatusPill>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <div className="flex flex-col gap-4">
            {d && (
              <Panel title={t("malkhanaScreen.stats.valueHeld")}>
                <p className="flex items-center gap-1.5 text-2xl font-semibold text-foreground" data-testid="value-held">
                  <IndianRupee className="h-5 w-5 text-foreground-subtle" />
                  {formatRupees(d.valueHeldPaise).replace("₹", "")}
                </p>
                {d.valueUnrecordedItems > 0 && (
                  <p className="mt-1 text-xs text-foreground-muted">
                    {t("malkhanaScreen.stats.valueUnrecorded", { count: d.valueUnrecordedItems })}
                  </p>
                )}
                {d.byCategory.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1 text-sm">
                    {d.byCategory.map((c) => (
                      <li key={c.key} className="flex justify-between gap-2">
                        <span className="text-foreground-muted">{t(`malkhanaScreen.category.${c.key as PropertyCategory}`)}</span>
                        <span className="tabular-nums text-foreground">{c.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}
            <Panel title={t("malkhanaScreen.locations.title")} description={t("malkhanaScreen.locations.description")}>
              {locations.isLoading ? (
                <Skeleton className="h-16" />
              ) : locations.isError ? (
                <p className="text-sm text-danger">{officerMessage(locations.error)}</p>
              ) : (locations.data ?? []).length === 0 ? (
                <p className="text-sm text-foreground-muted">{t("malkhanaScreen.locations.none")}</p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm" data-testid="location-list">
                  {locations.data!.map((l) => (
                    <li key={l.id} className="flex justify-between gap-2">
                      <span className="truncate text-foreground">{wide && !stationId ? `${l.stationName} · ` : ""}{l.label}</span>
                      <span className="shrink-0 tabular-nums text-foreground-muted">{t("malkhanaScreen.locations.held", { count: l.itemsHeld })}</span>
                    </li>
                  ))}
                </ul>
              )}
              {d && d.byMovementType.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
                  {d.byMovementType.map((m) => (
                    <li key={m.key} className="flex justify-between gap-2">
                      <span className="text-foreground-muted">{t(`malkhanaScreen.movementType.${m.key as "COURT_PRODUCTION"}`)}</span>
                      <span className="tabular-nums text-foreground">{m.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </div>

      <RegisterDialog open={registerOpen} onOpenChange={setRegisterOpen} stationId={registerStation} />
      <LocationDialog open={locationOpen} onOpenChange={setLocationOpen} stationId={registerStation} />
    </DashboardLayout>
  );
}
