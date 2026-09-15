"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Car, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, PageHeader, Panel } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useDefaulters } from "@/hooks/use-legacy-registers";
import { formatDate } from "@/lib/utils";
import { TL, rupees } from "../labels";

export default function DefaultersPage() {
  const { pick } = useI18n();
  const [page, setPage] = useState(1);
  const defaulters = useDefaulters(page);
  const rows = defaulters.data?.data ?? [];
  const totalPages = defaulters.data?.totalPages ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={pick(TL.defaulters)}
          description={pick(TL.defaultersDescription)}
          icon={Car}
          breadcrumb={[{ label: pick(TL.title), href: "/traffic" }, { label: pick(TL.defaulters) }]}
        />
        <Panel>
          {defaulters.isPending ? (
            <div className="flex items-center justify-center gap-3 py-12 text-foreground-muted">
              <Loader2 className="h-5 w-5 animate-spin" /> {pick(TL.loading)}
            </div>
          ) : defaulters.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title={pick(TL.loadFailed)}
              description={defaulters.error.message}
              action={
                <Button variant="secondary" onClick={() => defaulters.refetch()}>
                  {pick(TL.retry)}
                </Button>
              }
            />
          ) : rows.length === 0 ? (
            <EmptyState icon={Car} title={pick(TL.noDefaulters)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                    <th className="py-2 pr-3">{pick(TL.vehicle)}</th>
                    <th className="py-2 pr-3">{pick(TL.owner)}</th>
                    <th className="py-2 pr-3 text-right">{pick(TL.pendingChallans)}</th>
                    <th className="py-2 pr-3 text-right">{pick(TL.pendingAmount)}</th>
                    <th className="py-2 pr-3">{pick(TL.oldest)}</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 font-mono">{d.vehicle_number}</td>
                      <td className="py-2 pr-3">{[d.owner_name, d.owner_phone].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="py-2 pr-3 text-right">{d.total_challans}</td>
                      <td className="py-2 pr-3 text-right">{rupees(d.total_pending_amount)}</td>
                      <td className="py-2 pr-3 text-foreground-muted">{d.oldest_pending_date ? formatDate(d.oldest_pending_date) : "—"}</td>
                      <td className="py-2 text-right">
                        <Link href={`/search?q=${encodeURIComponent(d.vehicle_number)}`} className="text-accent hover:underline">
                          {pick(TL.viewChallans)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-foreground-muted">
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
      </div>
    </DashboardLayout>
  );
}
