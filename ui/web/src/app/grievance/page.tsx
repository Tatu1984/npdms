"use client";

import * as React from "react";
import {
  AlertTriangle,
  Building2,
  Clock,
  Copy,
  Globe,
  Inbox,
  Languages,
  Lock,
  Mail,
  Megaphone,
  MessageSquare,
  Phone,
  Send,
  Smartphone,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import {
  COMPLAINT_CATEGORIES,
  type Complaint,
  type ComplaintCategory,
  type ComplaintChannel,
  type ComplaintQuery,
  type ComplaintStatus,
} from "@/lib/api/complaints";
import { useComplaints, useComplaintStats } from "@/hooks/use-complaints";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, type Action } from "@/components/platform/actions";
import { PageHeader, PhaseBadge, StatTile, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IntakeDialog, selectClass } from "./intake-dialog";
import { ComplaintSheet, STATUS_TONE } from "./complaint-sheet";

const CHANNEL_ICON: Record<ComplaintChannel, React.ElementType> = {
  WEB: Globe,
  MOBILE: Smartphone,
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
  CALL_CENTRE: Phone,
  COUNTER: Building2,
};

const STATUSES: ComplaintStatus[] = ["SUBMITTED", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];
const CHANNELS: ComplaintChannel[] = ["WEB", "COUNTER", "CALL_CENTRE", "WHATSAPP", "EMAIL", "MOBILE"];
const PAGE_SIZE = 25;

type Toggle = "open" | "unrouted" | "overdue" | "bengali";

export default function GrievancePage() {
  const { t } = useI18n();

  const [intakeOpen, setIntakeOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search);
  const [status, setStatus] = React.useState<ComplaintStatus | "">("");
  const [category, setCategory] = React.useState<ComplaintCategory | "">("");
  const [channel, setChannel] = React.useState<ComplaintChannel | "">("");
  const [toggles, setToggles] = React.useState<Record<Toggle, boolean>>({
    open: true,
    unrouted: false,
    overdue: false,
    bengali: false,
  });
  const [page, setPage] = React.useState(1);

  // Any filter change returns to the first page.
  React.useEffect(() => setPage(1), [deferredSearch, status, category, channel, toggles]);

  const query: ComplaintQuery = {
    page,
    pageSize: PAGE_SIZE,
    search: deferredSearch.trim() || undefined,
    status: status || undefined,
    category: category || undefined,
    channel: channel || undefined,
    open: toggles.open,
    unrouted: toggles.unrouted,
    overdue: toggles.overdue,
    script: toggles.bengali ? "NON_LATIN" : undefined,
  };
  const list = useComplaints(query);
  const stats = useComplaintStats();

  const rows = list.data?.data ?? [];
  const totalPages = Math.max(1, list.data?.totalPages ?? 1);

  const flip = (key: Toggle) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  const turnOn = (key: Toggle) => setToggles((prev) => ({ ...prev, [key]: true }));

  const columns: Column<Complaint>[] = [
    {
      id: "complaint",
      header: t("grievanceScreen.list.complaint"),
      cell: (c) => {
        const Icon = CHANNEL_ICON[c.channel];
        return (
          <div className="flex min-w-0 items-start gap-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground-subtle" aria-label={t(`grievanceScreen.channels.${c.channel}`)} />
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground font-bengali">{c.subject}</p>
              <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
                {c.trackingNumber} ·{" "}
                {c.isAnonymous ? (
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    {t("grievanceScreen.list.anonymous")}
                  </span>
                ) : (
                  c.complainantName
                )}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "category",
      header: t("grievanceScreen.list.category"),
      hideBelow: "md",
      cell: (c) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill>{t(`grievanceScreen.categories.${c.category}`)}</StatusPill>
          {(c.priority === "URGENT" || c.priority === "HIGH") && (
            <StatusPill tone="danger">{t(`grievanceScreen.priorities.${c.priority}`)}</StatusPill>
          )}
        </div>
      ),
    },
    {
      id: "station",
      header: t("grievanceScreen.list.station"),
      hideBelow: "lg",
      cell: (c) => (
        <span className={c.stationName ? "text-sm" : "text-sm text-foreground-subtle"}>
          {c.stationName || t("grievanceScreen.list.notRouted")}
        </span>
      ),
    },
    {
      id: "status",
      header: t("grievanceScreen.list.status"),
      cell: (c) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill tone={STATUS_TONE[c.status]}>{t(`grievanceScreen.statuses.${c.status}`)}</StatusPill>
          {c.duplicateOf && (
            <StatusPill tone="warning">
              <Copy className="h-3 w-3" />
              {t("grievanceScreen.list.duplicate")}
            </StatusPill>
          )}
          {c.pendingResponses > 0 && (
            <StatusPill tone="info">
              <Send className="h-3 w-3" />
              {c.pendingResponses}
            </StatusPill>
          )}
        </div>
      ),
    },
    {
      id: "age",
      header: t("grievanceScreen.list.age"),
      align: "right",
      cell: (c) => (
        <span
          className={`inline-flex items-center gap-1 text-sm ${c.acknowledgeOverdue || c.resolutionOverdue ? "text-danger" : "text-foreground-muted"}`}
        >
          {(c.acknowledgeOverdue || c.resolutionOverdue) && <AlertTriangle className="h-3.5 w-3.5" />}
          {t("grievanceScreen.list.days", { n: c.ageDays })}
        </span>
      ),
    },
  ];

  const rowActions = (c: Complaint): Action[] => [
    act.label("h", c.trackingNumber),
    act.run("open", t("common.view"), () => setSelected(c.id), { icon: Megaphone }),
    act.link("fir", t("grievanceScreen.actions.registerFir"), "/fir/new", { icon: Building2 }),
  ];

  const toggleButton = (key: Toggle, label: string) => (
    <Button key={key} size="sm" variant={toggles[key] ? "default" : "outline"} aria-pressed={toggles[key]} onClick={() => flip(key)}>
      {label}
    </Button>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.grievance")}
          description={t("modules.grievanceDesc")}
          icon={Megaphone}
          badge={<PhaseBadge phase={9} />}
          breadcrumb={[{ label: t("nav.citizenGroup") }, { label: t("modules.grievance") }]}
          actions={
            <Button onClick={() => setIntakeOpen(true)}>
              <Inbox className="h-4 w-4" />
              {t("grievanceScreen.header.record")}
            </Button>
          }
          menu={[act.link("portal", t("grievanceScreen.header.portal"), "/citizen", { icon: Globe })]}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {stats.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : stats.data ? (
            <>
              <StatTile label={t("grievanceScreen.stats.open")} value={stats.data.open} icon={Megaphone} />
              <StatTile
                label={t("grievanceScreen.stats.unrouted")}
                value={stats.data.unrouted}
                icon={Building2}
                tone="warning"
                onClick={() => turnOn("unrouted")}
              />
              <StatTile
                label={t("grievanceScreen.stats.overdue")}
                value={stats.data.acknowledgeOverdue + stats.data.resolutionOverdue}
                icon={Clock}
                tone="danger"
                onClick={() => turnOn("overdue")}
              />
              <StatTile label={t("grievanceScreen.stats.awaitingApproval")} value={stats.data.awaitingApproval} icon={Send} tone="info" />
              <StatTile
                label={t("grievanceScreen.stats.bengali")}
                value={stats.data.bengaliOrMixed}
                icon={Languages}
                onClick={() => turnOn("bengali")}
              />
            </>
          ) : (
            <Alert variant="danger" className="col-span-full">
              <AlertDescription>{stats.error instanceof Error ? stats.error.message : t("common.error")}</AlertDescription>
            </Alert>
          )}
        </div>

        {stats.data && (
          <Alert>
            <Clock />
            <div>
              <AlertTitle>{t("grievanceScreen.standards.title")}</AlertTitle>
              <AlertDescription>
                {t("grievanceScreen.standards.body", {
                  hours: stats.data.acknowledgeWithinHours,
                  days: stats.data.resolveWithinDays,
                })}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[16rem] flex-1">
              <Input
                aria-label={t("grievanceScreen.filters.search")}
                placeholder={t("grievanceScreen.filters.search")}
                value={search}
                onChange={(v: string) => setSearch(v)}
                className="font-bengali"
              />
            </div>
            <select
              aria-label={t("grievanceScreen.list.status")}
              className={`${selectClass} w-auto`}
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplaintStatus | "")}
            >
              <option value="">{t("grievanceScreen.filters.allStatuses")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`grievanceScreen.statuses.${s}`)}
                </option>
              ))}
            </select>
            <select
              aria-label={t("grievanceScreen.list.category")}
              className={`${selectClass} w-auto`}
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory | "")}
            >
              <option value="">{t("grievanceScreen.filters.allCategories")}</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`grievanceScreen.categories.${c}`)}
                </option>
              ))}
            </select>
            <select
              aria-label={t("grievanceScreen.intake.channel")}
              className={`${selectClass} w-auto`}
              value={channel}
              onChange={(e) => setChannel(e.target.value as ComplaintChannel | "")}
            >
              <option value="">{t("grievanceScreen.filters.allChannels")}</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {t(`grievanceScreen.channels.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {toggleButton("open", t("grievanceScreen.filters.openOnly"))}
            {toggleButton("unrouted", t("grievanceScreen.filters.unrouted"))}
            {toggleButton("overdue", t("grievanceScreen.filters.overdue"))}
            {toggleButton("bengali", t("grievanceScreen.filters.bengali"))}
          </div>
        </div>

        {list.isError ? (
          <Alert variant="danger">
            <AlertTitle>{t("grievanceScreen.list.loadFailed")}</AlertTitle>
            <AlertDescription>
              {list.error instanceof Error ? list.error.message : String(list.error)}{" "}
              <Button variant="link" className="h-auto p-0" onClick={() => list.refetch()}>
                {t("common.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : list.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(c) => c.id}
              onRowSelect={(c) => setSelected(c.id)}
              rowActions={rowActions}
              searchable={false}
              emptyTitle={t("grievanceScreen.list.empty")}
              emptyDescription={t("grievanceScreen.list.emptyHint")}
            />
            <div className="flex items-center justify-between text-sm text-foreground-muted">
              <span>{t("grievanceScreen.list.page", { page, pages: totalPages, total: list.data?.total ?? 0 })}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t("common.previous")}
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t("common.next")}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <IntakeDialog open={intakeOpen} onOpenChange={setIntakeOpen} onRecorded={(id) => setSelected(id)} />
      <ComplaintSheet id={selected} onClose={() => setSelected(null)} onOpen={(id) => setSelected(id)} />
    </DashboardLayout>
  );
}
