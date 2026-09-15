"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, CarFront, FileText, Plus, Route, ShieldAlert, Siren, TrafficCone, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, type Action } from "@/components/platform/actions";
import { EmptyState, PageHeader, PhaseBadge, StatTile, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RecordLink } from "@/components/platform/pickers";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { useRegisterIncident, useTrafficIncidents, useTrafficIncidentStats } from "@/hooks/use-traffic-incidents";
import type { ReportStatus, TrafficIncident } from "@/lib/api/traffic-incidents";
import {
  IncidentFields,
  emptyIncidentForm,
  errorMessage,
  formatWhen,
  incidentFormToInput,
  selectClass,
} from "./shared";

const PAGE_SIZE = 20;
const REPORT_FILTERS: (ReportStatus | "NONE")[] = ["NONE", "DRAFT", "SUBMITTED", "RETURNED", "APPROVED"];

function reportTone(status: TrafficIncident["reportStatus"]) {
  switch (status) {
    case "APPROVED":
      return "success" as const;
    case "SUBMITTED":
      return "info" as const;
    case "RETURNED":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export default function AccidentReconstructionPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuthStore();
  const canRecord = Boolean(user && hasMinimumRole(user.role, "ASI"));

  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const search = React.useDeferredValue(searchInput.trim());
  const [reportStatus, setReportStatus] = React.useState<ReportStatus | "NONE" | "">("");
  const [fatalOnly, setFatalOnly] = React.useState(false);

  const query = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    reportStatus: reportStatus || undefined,
    fatal: fatalOnly || undefined,
  };
  const incidents = useTrafficIncidents(query);
  const stats = useTrafficIncidentStats();
  const rows = incidents.data?.data ?? [];
  const totalPages = incidents.data?.totalPages ?? 0;

  React.useEffect(() => setPage(1), [search, reportStatus, fatalOnly]);

  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyIncidentForm);
  const [firLink, setFirLink] = React.useState<RecordLink | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const register = useRegisterIncident();

  const openRegister = () => {
    setForm(emptyIncidentForm());
    setFirLink(null);
    setFormError(null);
    setRegisterOpen(true);
  };

  const submitRegister = async () => {
    setFormError(null);
    try {
      const created = await register.mutateAsync(incidentFormToInput(form));
      setRegisterOpen(false);
      router.push(`/accident-reconstruction/${created.id}`);
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const columns: Column<TrafficIncident>[] = [
    {
      id: "incident",
      header: t("accidentScreen.list.incident"),
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{a.location}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">{a.incidentNumber}</p>
        </div>
      ),
    },
    {
      id: "when",
      header: t("accidentScreen.list.when"),
      hideBelow: "sm",
      cell: (a) => <span className="text-sm">{formatWhen(a.occurredAt)}</span>,
    },
    {
      id: "vehicles",
      header: t("accidentScreen.list.vehicles"),
      hideBelow: "md",
      cell: (a) => (
        <StatusPill>
          <CarFront className="h-3 w-3" />
          {a.vehicleCount}
        </StatusPill>
      ),
    },
    {
      id: "casualties",
      header: t("accidentScreen.list.casualties"),
      cell: (a) =>
        a.fatalities + a.grievousInjuries + a.minorInjuries === 0 ? (
          <span className="text-xs text-foreground-subtle">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {a.fatalities > 0 && (
              <StatusPill tone="danger">
                {a.fatalities} {t("accidentScreen.enums.severity.FATAL")}
              </StatusPill>
            )}
            {a.grievousInjuries > 0 && (
              <StatusPill tone="warning">
                {a.grievousInjuries} {t("accidentScreen.enums.severity.GRIEVOUS")}
              </StatusPill>
            )}
            {a.minorInjuries > 0 && (
              <StatusPill>
                {a.minorInjuries} {t("accidentScreen.enums.severity.MINOR")}
              </StatusPill>
            )}
          </div>
        ),
    },
    {
      id: "attached",
      header: t("accidentScreen.list.evidence"),
      hideBelow: "lg",
      cell: (a) => (
        <div className="flex flex-wrap gap-1">
          <span title={t("accidentScreen.sections.cameras")}>
            <StatusPill>
              <Camera className="h-3 w-3" />
              {a.cameraCount}
            </StatusPill>
          </span>
          <span title={t("accidentScreen.sections.plateReads")}>
            <StatusPill>
              <CarFront className="h-3 w-3" />
              {a.plateReadCount}
            </StatusPill>
          </span>
          <span title={t("accidentScreen.sections.signals")}>
            <StatusPill>
              <TrafficCone className="h-3 w-3" />
              {a.signalPhaseCount}
            </StatusPill>
          </span>
          <span title={t("accidentScreen.sections.facts")}>
            <StatusPill>
              <Route className="h-3 w-3" />
              {a.factCount}
            </StatusPill>
          </span>
        </div>
      ),
    },
    {
      id: "report",
      header: t("accidentScreen.list.report"),
      cell: (a) => (
        <StatusPill tone={reportTone(a.reportStatus)}>{t(`accidentScreen.report.status.${a.reportStatus}`)}</StatusPill>
      ),
    },
  ];

  const rowActions = (a: TrafficIncident): Action[] => {
    const actions: Action[] = [
      act.label("h", a.incidentNumber),
      act.link("open", t("accidentScreen.list.open"), `/accident-reconstruction/${a.id}`, { icon: Route }),
    ];
    if (a.firId) {
      actions.push(act.link("fir", t("accidentScreen.list.linkedFir"), `/fir/${a.firId}`, { icon: FileText }));
    }
    return actions;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.accidentReconstruction")}
          description={t("modules.accidentReconstructionDesc")}
          icon={Siren}
          badge={<PhaseBadge phase={6} />}
          breadcrumb={[{ label: t("nav.trafficGroup") }, { label: t("modules.accidentReconstruction") }]}
          actions={
            canRecord ? (
              <Button onClick={openRegister}>
                <Plus className="h-4 w-4" />
                {t("accidentScreen.register")}
              </Button>
            ) : undefined
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label={t("accidentScreen.stats.total")} value={stats.data?.total ?? 0} icon={Siren} />
          <StatTile label={t("accidentScreen.stats.fatalities")} value={stats.data?.fatalities ?? 0} icon={Users} tone="danger" />
          <StatTile label={t("accidentScreen.stats.grievous")} value={stats.data?.grievousInjuries ?? 0} icon={Users} tone="warning" />
          <StatTile label={t("accidentScreen.stats.awaiting")} value={stats.data?.awaitingApproval ?? 0} icon={FileText} tone="info" />
          <StatTile label={t("accidentScreen.stats.withoutReport")} value={stats.data?.withoutReport ?? 0} icon={FileText} />
        </div>

        <Alert variant="info">
          <Route />
          <AlertDescription>{t("accidentScreen.laterLayer")}</AlertDescription>
        </Alert>

        {incidents.isError && (
          <Alert variant="danger">
            <ShieldAlert />
            <div>
              <AlertTitle>{t("accidentScreen.loadFailed")}</AlertTitle>
              <AlertDescription>
                {errorMessage(incidents.error)}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => incidents.refetch()}>
                  {t("accidentScreen.retry")}
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              aria-label={t("accidentScreen.list.search")}
              placeholder={t("accidentScreen.list.search")}
              value={searchInput}
              onChange={(v: string) => setSearchInput(v)}
            />
          </div>
          <select
            aria-label={t("accidentScreen.list.report")}
            value={reportStatus}
            onChange={(e) => setReportStatus(e.target.value as ReportStatus | "NONE" | "")}
            className={`${selectClass} sm:w-56`}
          >
            <option value="">{t("accidentScreen.list.filterAll")}</option>
            {REPORT_FILTERS.map((s) => (
              <option key={s} value={s}>
                {t(`accidentScreen.report.status.${s}`)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={fatalOnly} onChange={(e) => setFatalOnly(e.target.checked)} />
            {t("accidentScreen.list.fatalOnly")}
          </label>
        </div>

        {incidents.isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : rows.length === 0 && !incidents.isError ? (
          <EmptyState
            icon={Siren}
            title={t("accidentScreen.list.empty")}
            description={t("accidentScreen.list.emptyDesc")}
            action={
              canRecord ? (
                <Button onClick={openRegister}>
                  <Plus className="h-4 w-4" />
                  {t("accidentScreen.register")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(a) => a.id}
              rowHref={(a) => `/accident-reconstruction/${a.id}`}
              rowActions={rowActions}
              searchable={false}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-foreground-muted">
                <span>{t("accidentScreen.list.page", { page, pages: totalPages })}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    {t("accidentScreen.list.previous")}
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    {t("accidentScreen.list.next")}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("accidentScreen.registerTitle")}</DialogTitle>
            <DialogDescription>{t("accidentScreen.registerDesc")}</DialogDescription>
          </DialogHeader>
          <IncidentFields form={form} setForm={setForm} firLink={firLink} setFirLink={setFirLink} />
          {formError && (
            <Alert variant="danger">
              <ShieldAlert />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              {t("accidentScreen.cancel")}
            </Button>
            <Button onClick={submitRegister} disabled={register.isPending}>
              {register.isPending ? t("accidentScreen.saving") : t("accidentScreen.register")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
