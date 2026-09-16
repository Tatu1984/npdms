"use client";

import * as React from "react";
import { AlertTriangle, Brain, Inbox, PlugZap } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable, type Column } from "@/components/platform/data-table";
import { EmptyState, PageHeader, StatTile, StatusPill } from "@/components/platform/primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { DECISION_PRIORITIES, DECISION_TYPES, type AIDecision, type AIDecisionPriority, type AIDecisionType } from "@/lib/api/ai-review";
import { useAIGateway, useAIMyAssignments, useAIQueue, useAIStats } from "@/hooks/use-ai-review";
import {
  ConfidenceMeter,
  DecisionStatusPill,
  DecisionTypePill,
  PriorityPill,
  age,
  isOverdue,
  pct,
  selectClass,
  stamp,
  useAIOfficer,
} from "@/components/ai/shared";
import { DecisionDialog } from "@/components/ai/DecisionDialog";

const PAGE_SIZE = 20;

/**
 * The officer's review queue.
 *
 * Every row is a lead awaiting a decision. Opening one shows the model, its
 * confidence against its own threshold, and the record text it relied on, so
 * the officer checks the suggestion against the record rather than the score.
 */
export default function AIReviewPage() {
  const { t } = useI18n();
  const { canOversee } = useAIOfficer();

  const [tab, setTab] = React.useState("queue");
  const [type, setType] = React.useState<AIDecisionType | "">("");
  const [priority, setPriority] = React.useState<AIDecisionPriority | "">("");
  const [page, setPage] = React.useState(1);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const queue = useAIQueue({ type: type || undefined, priority: priority || undefined, page, pageSize: PAGE_SIZE });
  const assignments = useAIMyAssignments();
  const stats = useAIStats();
  // Only DSP and above may read the gateway; others see the queue's own
  // explanation of why nothing is waiting.
  const gateway = useAIGateway(canOversee);
  const gatewayNote = canOversee && gateway.data?.note ? gateway.data.note : null;

  const columns: Column<AIDecision>[] = [
    {
      id: "suggestion",
      header: t("aiScreen.decision.suggests"),
      searchValue: (d) => `${d.prediction} ${d.sourceReference ?? ""} ${d.modelName}`,
      sortValue: (d) => d.prediction,
      cell: (d) => (
        <div className="min-w-0 max-w-md">
          <p className="truncate text-sm font-medium text-foreground">{d.prediction}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
            {d.sourceType}
            {d.sourceReference ? ` · ${d.sourceReference}` : ""}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            <DecisionTypePill value={d.type} />
            <DecisionStatusPill value={d.status} />
          </div>
        </div>
      ),
    },
    {
      id: "priority",
      header: t("aiScreen.decision.priority"),
      hideBelow: "sm",
      sortValue: (d) => DECISION_PRIORITIES.indexOf(d.priority),
      cell: (d) => <PriorityPill value={d.priority} />,
    },
    {
      id: "model",
      header: t("aiScreen.decision.model"),
      hideBelow: "md",
      sortValue: (d) => d.modelName,
      cell: (d) => (
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-foreground">{d.modelName}</p>
          <p className="font-mono text-xs text-foreground-subtle">{d.modelVersion}</p>
        </div>
      ),
    },
    {
      id: "confidence",
      header: t("aiScreen.decision.confidence"),
      hideBelow: "md",
      sortValue: (d) => d.confidence,
      cell: (d) => <ConfidenceMeter confidence={d.confidence} threshold={d.confidenceThreshold} />,
    },
    {
      id: "age",
      header: t("aiScreen.decision.raised"),
      align: "right",
      sortValue: (d) => d.createdAt,
      cell: (d) => (
        <div className="text-right">
          <p className="text-xs text-foreground">{age(d.createdAt)}</p>
          {d.dueBy ? (
            isOverdue(d.dueBy) && d.status === "PENDING" ? (
              <StatusPill tone="danger">{t("aiScreen.decision.overdue")}</StatusPill>
            ) : (
              <p className="text-xs text-foreground-subtle">{stamp(d.dueBy)}</p>
            )
          ) : (
            <p className="text-xs text-foreground-subtle">{t("aiScreen.decision.noDue")}</p>
          )}
        </div>
      ),
    },
  ];

  const rows = queue.data?.decisions ?? [];
  const pagination = queue.data?.pagination;
  const assigned = assignments.data ?? [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader title={t("aiScreen.queue.title")} description={t("aiScreen.queue.description")} icon={Brain} />

        <Alert variant="ai">
          <Brain />
          <AlertDescription>{t("aiScreen.rule.lead")}</AlertDescription>
        </Alert>

        {gatewayNote && (
          <Alert variant="warning">
            <PlugZap />
            <div>
              <AlertTitle>{t("aiScreen.gateway.notConnected")}</AlertTitle>
              <AlertDescription>{gatewayNote}</AlertDescription>
            </div>
          </Alert>
        )}

        {stats.data && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label={t("aiScreen.queue.pendingCount")} value={stats.data.pendingCount} tone="info" />
            <StatTile label={t("aiScreen.queue.reviewedTotal")} value={stats.data.totalReviewed30Days} tone="default" />
            <StatTile label={t("aiScreen.queue.totalDecisions")} value={stats.data.totalDecisions} tone="default" />
            <StatTile
              label={t("aiScreen.queue.avgConfidence")}
              value={stats.data.avgConfidence * 100}
              unit="%"
              decimals={1}
              tone="ai"
            />
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="queue">{t("aiScreen.queue.allPending")}</TabsTrigger>
            <TabsTrigger value="mine">
              {t("aiScreen.queue.myAssignments")} ({assigned.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            {queue.isLoading && <Skeleton className="h-64 w-full" />}
            {queue.isError && (
              <Alert variant="danger">
                <AlertTriangle />
                <div>
                  <AlertTitle>{t("aiScreen.queue.loadFailed")}</AlertTitle>
                  <AlertDescription>{queue.error instanceof Error ? queue.error.message : ""}</AlertDescription>
                </div>
              </Alert>
            )}
            {queue.data && rows.length === 0 && (
              <EmptyState icon={Inbox} title={t("aiScreen.queue.empty")} description={t("aiScreen.queue.emptyBody")} />
            )}
            {rows.length > 0 && (
              <>
                <DataTable
                  rows={rows}
                  columns={columns}
                  rowKey={(d) => d.id}
                  onRowSelect={(d) => setOpenId(d.id)}
                  toolbar={
                    <div className="flex flex-wrap gap-2">
                      <select
                        aria-label={t("aiScreen.queue.filterType")}
                        className={selectClass}
                        value={type}
                        onChange={(e) => {
                          setType(e.target.value as AIDecisionType | "");
                          setPage(1);
                        }}
                      >
                        <option value="">{t("aiScreen.queue.filterType")} — {t("aiScreen.queue.all")}</option>
                        {DECISION_TYPES.map((value) => (
                          <option key={value} value={value}>
                            {t(`aiScreen.types.${value}`)}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label={t("aiScreen.queue.filterPriority")}
                        className={selectClass}
                        value={priority}
                        onChange={(e) => {
                          setPriority(e.target.value as AIDecisionPriority | "");
                          setPage(1);
                        }}
                      >
                        <option value="">{t("aiScreen.queue.filterPriority")} — {t("aiScreen.queue.all")}</option>
                        {DECISION_PRIORITIES.map((value) => (
                          <option key={value} value={value}>
                            {t(`aiScreen.priority.${value}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  }
                />
                {pagination && pagination.total_pages > 1 && (
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      {t("aiScreen.queue.previous")}
                    </Button>
                    <span className="text-xs text-foreground-muted">
                      {pagination.page} / {pagination.total_pages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= pagination.total_pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      {t("aiScreen.queue.next")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="mine">
            {assignments.isLoading && <Skeleton className="h-40 w-full" />}
            {assignments.data && assigned.length === 0 && (
              <EmptyState
                icon={Inbox}
                title={t("aiScreen.queue.noAssignments")}
                description={t("aiScreen.queue.noAssignmentsBody")}
              />
            )}
            {assigned.length > 0 && (
              <DataTable rows={assigned} columns={columns} rowKey={(d) => d.id} onRowSelect={(d) => setOpenId(d.id)} />
            )}
          </TabsContent>
        </Tabs>

      </div>

      <DecisionDialog decisionId={openId} open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)} />
    </DashboardLayout>
  );
}
