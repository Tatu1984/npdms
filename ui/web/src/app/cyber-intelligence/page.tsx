"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  FileUp,
  IndianRupee,
  Link2,
  Network,
  Snowflake,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act } from "@/components/platform/actions";
import { EmptyState, PageHeader, Panel, PhaseBadge, StatTile, StatusPill } from "@/components/platform/primitives";
import { selectClass, statusTone } from "./shared";
import { OfficerPicker, RecordLinkPicker, type RecordLink } from "@/components/platform/pickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import {
  useComplaintClusters,
  useComplaints,
  useFraudDashboard,
  useRegisterComplaint,
} from "@/hooks/use-cyber-fraud";
import {
  COMPLAINT_STATUSES,
  COMPLAINT_TYPES,
  PLATFORMS,
  formatPaise,
  rupeesToPaise,
  type Complaint,
  type ComplaintStatus,
  type ComplaintType,
  type Platform,
  type Priority,
} from "@/lib/api/cyber-fraud";

const PAGE_SIZE = 20;

/** Lakh with two decimals, for stat tiles. */
const lakh = (paise: number) => paise / 100 / 100000;

export default function CyberIntelligencePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuthStore();
  const canRegister = user ? hasMinimumRole(user.role, "SI") : false;

  const [tab, setTab] = React.useState("complaints");
  const [intakeOpen, setIntakeOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [status, setStatus] = React.useState<ComplaintStatus | "">("");
  const [type, setType] = React.useState<ComplaintType | "">("");
  const [page, setPage] = React.useState(1);

  const complaints = useComplaints({
    page,
    pageSize: PAGE_SIZE,
    search: deferredSearch || undefined,
    status: status || undefined,
    type: type || undefined,
  });
  const dashboard = useFraudDashboard();
  const clusters = useComplaintClusters(tab === "clusters");

  const rows = complaints.data?.data ?? [];
  const totalPages = complaints.data?.totalPages ?? 0;

  const columns: Column<Complaint>[] = [
    {
      id: "complaint",
      header: t("fraud.complaints"),
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{c.complainantName}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
            {c.caseNumber}
            {c.ncrpReference && ` · NCRP ${c.ncrpReference}`}
          </p>
        </div>
      ),
    },
    {
      id: "type",
      header: t("fraud.complaintType"),
      hideBelow: "md",
      cell: (c) => <span className="text-sm text-foreground-muted">{t(`fraud.type.${c.type}`)}</span>,
    },
    {
      id: "loss",
      header: t("fraud.reportedLoss"),
      align: "right",
      cell: (c) => <span className="tabular text-sm font-medium">{formatPaise(c.reportedLossPaise)}</span>,
    },
    {
      id: "recovered",
      header: `${t("fraud.frozen")} / ${t("fraud.recovered")}`,
      align: "right",
      hideBelow: "md",
      cell: (c) => (
        <div className="text-right">
          <p className="tabular text-xs text-info">{formatPaise(c.frozenPaise)}</p>
          <p className="tabular text-xs text-success">{formatPaise(c.recoveredPaise)}</p>
        </div>
      ),
    },
    {
      id: "links",
      header: t("fraud.entities"),
      hideBelow: "lg",
      cell: (c) => (
        <div className="flex flex-wrap gap-1">
          <StatusPill>{c.entityCount} {t("fraud.entities").toLowerCase()}</StatusPill>
          {c.linkedComplaints > 0 && (
            <StatusPill tone="warning">
              <Users className="h-3 w-3" />
              {c.linkedComplaints}
            </StatusPill>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: t("common.status"),
      cell: (c) => <StatusPill tone={statusTone[c.status]}>{t(`fraud.status.${c.status}`)}</StatusPill>,
    },
  ];

  const d = dashboard.data;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.cyberIntelligence")}
          description={t("modules.cyberIntelligenceDesc")}
          icon={Link2}
          badge={<PhaseBadge phase={5} />}
          breadcrumb={[{ label: t("nav.investigationGroup") }, { label: t("modules.cyberIntelligence") }]}
          actions={
            canRegister ? (
              <Button onClick={() => setIntakeOpen(true)}>
                <FileUp className="h-4 w-4" />
                {t("fraud.intake")}
              </Button>
            ) : undefined
          }
          menu={[
            act.link("custody", "Evidence register", "/custody", { icon: FileUp }),
            act.link("ip", "Access log", "/ip-tracker", { icon: Network }),
          ]}
        />

        {dashboard.isError ? (
          <Panel>
            <p className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4" />
              {dashboard.error.message}
            </p>
          </Panel>
        ) : !d ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label={t("fraud.reportedLoss")} value={lakh(d.reportedLossPaise)} decimals={2} unit={t("fraud.lakh")} icon={IndianRupee} tone="danger" />
            <StatTile label={t("fraud.frozen")} value={lakh(d.frozenPaise)} decimals={2} unit={t("fraud.lakh")} icon={Snowflake} tone="info" />
            <StatTile label={t("fraud.recovered")} value={lakh(d.recoveredPaise)} decimals={2} unit={t("fraud.lakh")} icon={Banknote} tone="success" />
            <StatTile
              label={t("fraud.linkedComplaints")}
              value={d.linkedComplaints}
              icon={Users}
              tone="warning"
              onClick={() => setTab("clusters")}
            />
          </div>
        )}

        <p className="text-xs text-foreground-muted">{t("fraud.officerRecorded")}</p>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="complaints">
              {t("fraud.complaints")}
              {complaints.data ? ` (${complaints.data.total})` : ""}
            </TabsTrigger>
            <TabsTrigger value="clusters">{t("fraud.clusters")}</TabsTrigger>
            <TabsTrigger value="dashboard">{t("fraud.dashboard")}</TabsTrigger>
          </TabsList>

          <TabsContent value="complaints">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <div className="min-w-[16rem] flex-1">
                  <Input
                    placeholder={t("fraud.searchPlaceholder")}
                    value={search}
                    onChange={(v) => {
                      setSearch(v);
                      setPage(1);
                    }}
                    aria-label={t("common.search")}
                  />
                </div>
                <select
                  aria-label={t("common.status")}
                  className={selectClass}
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as ComplaintStatus | "");
                    setPage(1);
                  }}
                >
                  <option value="">{t("common.all")}</option>
                  {COMPLAINT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`fraud.status.${s}`)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={t("fraud.complaintType")}
                  className={selectClass}
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as ComplaintType | "");
                    setPage(1);
                  }}
                >
                  <option value="">{t("common.all")}</option>
                  {COMPLAINT_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {t(`fraud.type.${ct}`)}
                    </option>
                  ))}
                </select>
              </div>

              {complaints.isPending ? (
                <Skeleton className="h-64 w-full" />
              ) : complaints.isError ? (
                <EmptyState
                  title={t("fraud.loadFailed")}
                  description={complaints.error.message}
                  icon={AlertTriangle}
                  action={
                    <Button size="sm" variant="outline" onClick={() => complaints.refetch()}>
                      {t("common.retry")}
                    </Button>
                  }
                />
              ) : (
                <DataTable
                  rows={rows}
                  columns={columns}
                  rowKey={(c) => c.id}
                  rowHref={(c) => `/cyber-intelligence/${c.id}`}
                  searchable={false}
                  emptyTitle={deferredSearch || status || type ? t("common.noData") : t("fraud.noneRegistered")}
                  rowActions={(c) => [
                    act.label("h", c.caseNumber),
                    act.link("open", t("common.view"), `/cyber-intelligence/${c.id}`, { icon: Link2 }),
                    act.link("network", t("fraud.network"), `/cyber-intelligence/${c.id}?tab=network`, { icon: Network }),
                  ]}
                />
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-foreground-muted">
                  <span>
                    {t("common.showing")} {page} {t("common.of")} {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      {t("common.previous")}
                    </Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      {t("common.next")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clusters">
            <Panel title={t("fraud.clusters")} description={clusters.data?.rule}>
              {clusters.isPending ? (
                <Skeleton className="h-40 w-full" />
              ) : clusters.isError ? (
                <p className="text-sm text-danger">{clusters.error.message}</p>
              ) : clusters.data.data.length === 0 ? (
                <EmptyState title={t("fraud.noClusters")} icon={Users} />
              ) : (
                <div className="flex flex-col gap-3">
                  {clusters.data.data.map((cluster) => (
                    <div
                      key={cluster.complaints.map((c) => c.id).join()}
                      data-testid="cluster"
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {cluster.complaints.length} {t("fraud.complaints").toLowerCase()}
                        </p>
                        <span className="tabular text-sm text-danger">{formatPaise(cluster.reportedLossPaise)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {cluster.sharedEntities.map((e) => (
                          <span
                            key={e.id}
                            className="rounded border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-xs text-foreground"
                          >
                            {t(`fraud.entityType.${e.type}`)}: {e.displayValue}
                          </span>
                        ))}
                      </div>
                      <ul className="mt-2 divide-y divide-border">
                        {cluster.complaints.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => router.push(`/cyber-intelligence/${c.id}`)}
                              className="flex w-full items-center justify-between gap-2 py-1.5 text-left hover:text-accent"
                            >
                              <span className="text-sm">
                                <span className="font-mono text-xs text-foreground-subtle">{c.caseNumber}</span> ·{" "}
                                {c.complainantName}
                              </span>
                              <span className="tabular text-xs">{formatPaise(c.reportedLossPaise)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="dashboard">
            {!d ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <Panel title={t("fraud.freezeRequests")}>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {(["DRAFTED", "SENT", "ACKNOWLEDGED", "FROZEN", "REJECTED"] as const).map((s) => (
                      <React.Fragment key={s}>
                        <dt className="text-foreground-muted">{t(`fraud.freezeStatus.${s}`)}</dt>
                        <dd className="tabular text-right">{d.freezeByStatus[s] ?? 0}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </Panel>
                <Panel title={t("fraud.complaintType")}>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {COMPLAINT_TYPES.filter((ct) => (d.byType[ct] ?? 0) > 0).map((ct) => (
                      <React.Fragment key={ct}>
                        <dt className="text-foreground-muted">{t(`fraud.type.${ct}`)}</dt>
                        <dd className="tabular text-right">{d.byType[ct]}</dd>
                      </React.Fragment>
                    ))}
                    <dt className="font-medium">{t("fraud.openComplaints")}</dt>
                    <dd className="tabular text-right font-medium">
                      {d.openComplaints} / {d.complaints}
                    </dd>
                  </dl>
                </Panel>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <IntakeDialog
        open={intakeOpen}
        onOpenChange={setIntakeOpen}
        onRegistered={(c) => router.push(`/cyber-intelligence/${c.id}`)}
      />
    </DashboardLayout>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

function IntakeDialog({
  open,
  onOpenChange,
  onRegistered,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered: (c: Complaint) => void;
}) {
  const { t } = useI18n();
  const register = useRegisterComplaint();
  const [form, setForm] = React.useState({
    complainantName: "",
    complainantPhone: "",
    complainantEmail: "",
    type: "ONLINE_FRAUD" as ComplaintType,
    platform: "BANKING" as Platform,
    platformName: "",
    priority: "MEDIUM" as Priority,
    incidentDate: today(),
    incidentDescription: "",
    ncrpReference: "",
    helplineReference: "",
    loss: "",
  });
  const [link, setLink] = React.useState<RecordLink | null>(null);
  const [io, setIo] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    const paise = form.loss.trim() === "" ? 0 : rupeesToPaise(form.loss);
    if (paise === null) {
      setError(t("fraud.enterRupees"));
      return;
    }
    try {
      const created = await register.mutateAsync({
        complainantName: form.complainantName,
        complainantPhone: form.complainantPhone || null,
        complainantEmail: form.complainantEmail || null,
        type: form.type,
        platform: form.platform,
        platformName: form.platformName || null,
        priority: form.priority,
        incidentDate: `${form.incidentDate}T00:00:00Z`,
        incidentDescription: form.incidentDescription,
        ncrpReference: form.ncrpReference || null,
        helplineReference: form.helplineReference || null,
        reportedLossPaise: paise,
        firId: link ? (link.kind === "case" ? link.firId : link.id) : null,
        investigatingOfficer: io,
      });
      toast.success(t("fraud.register"), created.caseNumber);
      onOpenChange(false);
      onRegistered(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The complaint was not registered");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("fraud.intakeTitle")}</DialogTitle>
          <DialogDescription>{t("fraud.intakeHint")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cy-name">{t("fraud.complainant")} *</Label>
              <Input id="cy-name" value={form.complainantName} onChange={set("complainantName")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cy-phone">{t("fraud.complainantPhone")}</Label>
              <Input id="cy-phone" value={form.complainantPhone} onChange={set("complainantPhone")} placeholder="+91 98300 00000" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cy-email">{t("fraud.complainantEmail")}</Label>
              <Input id="cy-email" value={form.complainantEmail} onChange={set("complainantEmail")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cy-date">{t("fraud.incidentDate")} *</Label>
              <Input id="cy-date" type="date" value={form.incidentDate} onChange={set("incidentDate")} max={today()} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cy-type">{t("fraud.complaintType")} *</Label>
              <select id="cy-type" className={selectClass} value={form.type} onChange={(e) => set("type")(e.target.value)}>
                {COMPLAINT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {t(`fraud.type.${ct}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cy-platform">{t("fraud.platform")} *</Label>
              <select id="cy-platform" className={selectClass} value={form.platform} onChange={(e) => set("platform")(e.target.value)}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {t(`fraud.platformType.${p}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cy-platform-name">{t("fraud.platformName")}</Label>
              <Input id="cy-platform-name" value={form.platformName} onChange={set("platformName")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cy-priority">{t("common.priority")}</Label>
              <select id="cy-priority" className={selectClass} value={form.priority} onChange={(e) => set("priority")(e.target.value)}>
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cy-ncrp">{t("fraud.ncrp")}</Label>
              <Input id="cy-ncrp" value={form.ncrpReference} onChange={set("ncrpReference")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cy-1930">{t("fraud.helpline")}</Label>
              <Input id="cy-1930" value={form.helplineReference} onChange={set("helplineReference")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cy-loss">{t("fraud.lossAmount")}</Label>
              <Input id="cy-loss" inputMode="decimal" value={form.loss} onChange={set("loss")} placeholder="0" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cy-narrative">{t("fraud.narrative")} *</Label>
            <Textarea id="cy-narrative" rows={4} value={form.incidentDescription} onChange={set("incidentDescription")} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("fraud.linkRecord")}</Label>
            <RecordLinkPicker value={link} onChange={setLink} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("fraud.ioOptional")}</Label>
            <OfficerPicker value={io ?? undefined} onChange={(id) => setIo(id)} />
          </div>
          {error && (
            <p role="alert" className="rounded-md border border-danger/40 bg-danger-subtle px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={register.isPending}>
            {t("fraud.register")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
