"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Car, ClipboardList, Loader2, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, PageHeader, Panel, StatTile, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useI18n } from "@/lib/i18n";
import { useChallans, useChallanStats } from "@/hooks/use-legacy-registers";
import type { ChallanStatus } from "@/lib/api/traffic-challans";
import { formatDateTime } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, TL, rupees } from "./labels";

const PAGE_SIZE = 20;
const STATUSES = Object.keys(STATUS_LABEL) as ChallanStatus[];

export default function TrafficChallansPage() {
  const { user } = useAuthStore();
  const { pick } = useI18n();
  const canIssue = Boolean(user && hasMinimumRole(user.role, "CONSTABLE"));

  const [vehicle, setVehicle] = useState("");
  const deferredVehicle = useDeferredValue(vehicle.trim().toUpperCase().replace(/\s+/g, ""));
  const [status, setStatus] = useState<"" | ChallanStatus>("");
  const [page, setPage] = useState(1);

  const stats = useChallanStats();
  const challans = useChallans({
    page,
    pageSize: PAGE_SIZE,
    vehicleNumber: deferredVehicle || undefined,
    status: status || undefined,
  });

  const rows = challans.data?.data ?? [];
  const totalPages = challans.data?.totalPages ?? 0;
  const top = stats.data?.top_violations ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={pick(TL.title)}
          description={pick(TL.description)}
          icon={ClipboardList}
          actions={
            <>
              <Link href="/traffic/defaulters">
                <Button variant="secondary">
                  <Car className="mr-2 h-4 w-4" />
                  {pick(TL.defaulters)}
                </Button>
              </Link>
              {canIssue && (
                <Link href="/traffic/challans/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {pick(TL.issue)}
                  </Button>
                </Link>
              )}
            </>
          }
        />

        {stats.isError ? (
          <p className="text-sm text-error">{stats.error.message}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label={pick(TL.total)} value={stats.data?.total_challans ?? 0} />
            <StatTile label={pick(TL.totalAmount)} value={(stats.data?.total_amount ?? 0) / 100} unit="₹" />
            <StatTile label={pick(TL.collected)} value={(stats.data?.collected_amount ?? 0) / 100} unit="₹" tone="success" />
            <StatTile label={pick(TL.pending)} value={(stats.data?.pending_amount ?? 0) / 100} unit="₹" tone="warning" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Panel title={pick(TL.register)} className="xl:col-span-2" bodyClassName="space-y-4 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[14rem] flex-1">
                <Input
                  placeholder={pick(TL.searchVehicle)}
                  value={vehicle}
                  onChange={(v: string) => {
                    setVehicle(v);
                    setPage(1);
                  }}
                />
              </div>
              <select
                aria-label={pick(TL.status)}
                className="h-10 rounded-md border border-border bg-background-secondary px-3 text-sm text-foreground"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "" | ChallanStatus);
                  setPage(1);
                }}
              >
                <option value="">{pick(TL.allStatuses)}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {pick(STATUS_LABEL[s])}
                  </option>
                ))}
              </select>
            </div>

            {challans.isPending ? (
              <div className="flex items-center justify-center gap-3 py-12 text-foreground-muted">
                <Loader2 className="h-5 w-5 animate-spin" /> {pick(TL.loading)}
              </div>
            ) : challans.isError ? (
              <EmptyState
                icon={AlertTriangle}
                title={pick(TL.loadFailed)}
                description={challans.error.message}
                action={
                  <Button variant="secondary" onClick={() => challans.refetch()}>
                    {pick(TL.retry)}
                  </Button>
                }
              />
            ) : rows.length === 0 ? (
              <EmptyState icon={ClipboardList} title={pick(TL.empty)} description={pick(TL.emptyBody)} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                      <th className="py-2 pr-3">{pick(TL.number)}</th>
                      <th className="py-2 pr-3">{pick(TL.vehicle)}</th>
                      <th className="py-2 pr-3">{pick(TL.violation)}</th>
                      <th className="py-2 pr-3">{pick(TL.date)}</th>
                      <th className="py-2 pr-3 text-right">{pick(TL.amount)}</th>
                      <th className="py-2">{pick(TL.status)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c.id} className="border-b border-border/60 align-top">
                        <td className="py-2 pr-3">
                          <Link href={`/traffic/challans/${c.id}`} className="font-mono text-accent hover:underline">
                            {c.challan_number}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 font-mono">{c.vehicle_number}</td>
                        <td className="py-2 pr-3">
                          {c.violation_type?.name}
                          <div className="text-xs text-foreground-subtle">{c.violation_location}</div>
                        </td>
                        <td className="whitespace-nowrap py-2 pr-3 text-foreground-muted">{formatDateTime(c.violation_date)}</td>
                        <td className="py-2 pr-3 text-right">{rupees(c.final_amount)}</td>
                        <td className="py-2">
                          <StatusPill tone={STATUS_TONE[c.status]}>{pick(STATUS_LABEL[c.status])}</StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-foreground-muted">
                <span>
                  {pick(TL.page)} {page} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    {pick(TL.prev)}
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    {pick(TL.next)}
                  </Button>
                </div>
              </div>
            )}
          </Panel>

          <Panel title={pick(TL.topViolations)}>
            {top.length === 0 ? (
              <p className="text-sm text-foreground-muted">{pick(TL.emptyBody)}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {top.map((v) => (
                  <li key={v.violation_type} className="flex items-center justify-between gap-3">
                    <span className="text-foreground">{v.violation_type}</span>
                    <span className="text-foreground-muted">
                      {v.count} · {rupees(v.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
}
