"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel, StatusPill } from "@/components/platform/primitives";
import { useVideoAccessLog } from "@/hooks/use-video";
import { formatDateTime } from "@/lib/utils";

/** The append-only record of every event search and every event opened. */
export function PurposeLogPanel() {
  const { t } = useI18n();
  const [page, setPage] = React.useState(1);
  const log = useVideoAccessLog(page, true);
  const rows = log.data?.data ?? [];
  const totalPages = log.data?.totalPages ?? 0;

  return (
    <Panel title={t("video.tabPurposeLog")} description={t("video.purposeLogDesc")} bodyClassName="p-0">
      {log.isLoading ? (
        <div className="flex items-center gap-2 p-4 text-sm text-foreground-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading")}
        </div>
      ) : log.isError ? (
        <div className="flex items-center justify-between gap-3 p-4 text-sm">
          <span className="text-danger">{log.error instanceof Error ? log.error.message : "The log could not be loaded"}</span>
          <Button size="sm" variant="outline" onClick={() => log.refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-4">
          <EmptyState title={t("video.noAccess")} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
              <tr>
                <th className="px-4 py-2 font-medium">{t("video.colWhen")}</th>
                <th className="px-4 py-2 font-medium">{t("video.colOfficer")}</th>
                <th className="px-4 py-2 font-medium">{t("video.colAccess")}</th>
                <th className="px-4 py-2 font-medium">{t("video.colPurpose")}</th>
                <th className="px-4 py-2 font-medium">{t("video.colResult")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-foreground-muted">{formatDateTime(a.accessedAt)}</td>
                  <td className="px-4 py-2 text-foreground">
                    {a.actorName}
                    {a.actorBadge && <span className="block font-mono text-xs text-foreground-subtle">{a.actorBadge}</span>}
                  </td>
                  <td className="px-4 py-2">
                    <StatusPill tone={a.accessType === "SEARCH" ? "info" : "neutral"}>
                      {a.accessType === "SEARCH" ? t("video.accessSearch") : t("video.accessView")}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-2 text-foreground">{a.purpose}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-foreground-muted">
                    {a.accessType === "SEARCH" ? t("video.results", { n: a.resultCount ?? 0 }) : a.eventNumber || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2 text-xs text-foreground-muted">
          <span>
            {page} / {totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ‹
          </Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            ›
          </Button>
        </div>
      )}
    </Panel>
  );
}
