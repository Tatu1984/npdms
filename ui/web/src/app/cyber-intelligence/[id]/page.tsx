"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Link2,
  Network as NetworkIcon,
  Pencil,
  Plus,
  Snowflake,
  Trash2,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { EmptyState, Field, PageHeader, Panel, PhaseBadge, StatTile, StatusPill } from "@/components/platform/primitives";
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
import { ApiClientError } from "@/lib/api/client";
import {
  useComplaint,
  useComplaintEntities,
  useDraftFreeze,
  useFraudNetwork,
  useFreezeRequests,
  useRecordEntity,
  useRecordRecovery,
  useRecordTransaction,
  useRecoveries,
  useRemoveEntity,
  useSetComplaintStatus,
  useTransactions,
  useTransitionFreeze,
  useUpdateComplaint,
} from "@/hooks/use-cyber-fraud";
import {
  COMPLAINT_STATUSES,
  COMPLAINT_TYPES,
  ENTITY_ROLES,
  ENTITY_TYPES,
  MONEY_BEARING,
  PLATFORMS,
  formatPaise,
  rupeesToPaise,
  type Complaint,
  type ComplaintEntity,
  type ComplaintStatus,
  type ComplaintType,
  type EntityRole,
  type EntityType,
  type FreezeRequest,
  type Network,
  type Platform,
  type Priority,
} from "@/lib/api/cyber-fraud";
import { formatDate, formatDateTime } from "@/lib/utils";
import { freezeTone, selectClass, statusTone } from "../shared";

const TABS = ["overview", "entities", "trail", "freezes", "recoveries", "network"] as const;
type Tab = (typeof TABS)[number];

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-danger/40 bg-danger-subtle px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}

const errorText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);
const localNow = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const { t } = useI18n();
  const { user } = useAuthStore();
  const canRecord = user ? hasMinimumRole(user.role, "ASI") : false;
  const canManage = user ? hasMinimumRole(user.role, "SI") : false;

  const initialTab = (TABS as readonly string[]).includes(search.get("tab") ?? "") ? (search.get("tab") as Tab) : "overview";
  const [tab, setTab] = React.useState<Tab>(initialTab);

  const complaint = useComplaint(id);
  const entities = useComplaintEntities(id);
  const transactions = useTransactions(id);
  const freezes = useFreezeRequests(id);
  const recoveries = useRecoveries(id);
  const network = useFraudNetwork(id, tab === "network");

  const [dialog, setDialog] = React.useState<
    | null
    | { kind: "edit" }
    | { kind: "status" }
    | { kind: "entity" }
    | { kind: "remove"; link: ComplaintEntity }
    | { kind: "transfer" }
    | { kind: "freeze" }
    | { kind: "transition"; freeze: FreezeRequest; action: "send" | "acknowledge" | "frozen" | "reject" }
    | { kind: "recovery" }
  >(null);
  const close = () => setDialog(null);

  if (complaint.isPending) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (complaint.isError) {
    const notFound = complaint.error instanceof ApiClientError && complaint.error.code === 404;
    return (
      <DashboardLayout>
        <EmptyState
          title={notFound ? t("fraud.notFound") : t("fraud.notLoaded")}
          description={notFound ? t("fraud.notFoundHint") : complaint.error.message}
          icon={AlertTriangle}
          action={
            <Link href="/cyber-intelligence">
              <Button size="sm" variant="outline">
                {t("common.back")}
              </Button>
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  const c = complaint.data;
  const moneyEntities = (entities.data ?? []).filter((l) => MONEY_BEARING.includes(l.entity.type));
  const uniqueMoney = Array.from(new Map(moneyEntities.map((l) => [l.entity.id, l.entity])).values());

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={`${c.caseNumber} · ${c.complainantName}`}
          description={t(`fraud.type.${c.type}`)}
          icon={Link2}
          badge={
            <div className="flex items-center gap-2">
              <PhaseBadge phase={5} />
              <StatusPill tone={statusTone[c.status]}>{t(`fraud.status.${c.status}`)}</StatusPill>
            </div>
          }
          breadcrumb={[
            { label: t("modules.cyberIntelligence"), href: "/cyber-intelligence" },
            { label: c.caseNumber },
          ]}
          actions={
            canManage ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialog({ kind: "status" })}>
                  {t("fraud.changeStatus")}
                </Button>
                <Button variant="outline" onClick={() => setDialog({ kind: "edit" })}>
                  <Pencil className="h-4 w-4" />
                  {t("fraud.editComplaint")}
                </Button>
              </div>
            ) : undefined
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label={t("fraud.reportedLoss")} value={c.reportedLossPaise / 100} icon={Banknote} tone="danger" unit="₹" />
          <StatTile label={t("fraud.frozen")} value={c.frozenPaise / 100} icon={Snowflake} tone="info" unit="₹" />
          <StatTile label={t("fraud.recovered")} value={c.recoveredPaise / 100} icon={Banknote} tone="success" unit="₹" />
          <StatTile label={t("fraud.linkedComplaints")} value={c.linkedComplaints} icon={Users} tone="warning" onClick={() => setTab("network")} />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">{t("fraud.overview")}</TabsTrigger>
            <TabsTrigger value="entities">
              {t("fraud.entities")} ({entities.data?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="trail">
              {t("fraud.moneyTrail")} ({transactions.data?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="freezes">
              {t("fraud.freezeRequests")} ({freezes.data?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="recoveries">
              {t("fraud.recoveries")} ({recoveries.data?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="network">{t("fraud.network")}</TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------- overview */}
          <TabsContent value="overview">
            <Panel>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label={t("fraud.complainant")} value={c.complainantName} />
                <Field label={t("fraud.complainantPhone")} value={c.complainantPhone ?? "—"} mono />
                <Field label={t("fraud.complainantEmail")} value={c.complainantEmail ?? "—"} />
                <Field label={t("fraud.incidentDate")} value={formatDate(c.incidentDate)} />
                <Field label={t("fraud.platform")} value={`${t(`fraud.platformType.${c.platform}`)}${c.platformName ? ` · ${c.platformName}` : ""}`} />
                <Field label={t("common.priority")} value={c.priority} />
                <Field label={t("fraud.ncrp")} value={c.ncrpReference ?? "—"} mono />
                <Field label={t("fraud.helpline")} value={c.helplineReference ?? "—"} mono />
                <Field
                  label="FIR"
                  value={c.firId ? <Link className="text-accent hover:underline" href={`/fir/${c.firId}`}>{c.firNumber || "View FIR"}</Link> : "—"}
                />
                <Field label={t("fraud.investigatingOfficer")} value={c.ioName || "—"} />
                <Field label={t("fraud.registeredBy")} value={c.registeredByName || "—"} />
                <Field label={t("fraud.station")} value={c.stationName || "—"} />
              </dl>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">{t("fraud.narrative")}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{c.incidentDescription}</p>
              </div>
            </Panel>
          </TabsContent>

          {/* ---------------------------------------------------- entities */}
          <TabsContent value="entities">
            <Panel
              title={t("fraud.entities")}
              description={t("fraud.officerRecorded")}
              actions={
                canRecord ? (
                  <Button size="sm" onClick={() => setDialog({ kind: "entity" })}>
                    <Plus className="h-3.5 w-3.5" />
                    {t("fraud.recordEntity")}
                  </Button>
                ) : undefined
              }
            >
              {entities.isPending ? (
                <Skeleton className="h-32 w-full" />
              ) : entities.isError ? (
                <p className="text-sm text-danger">{entities.error.message}</p>
              ) : entities.data.length === 0 ? (
                <EmptyState title={t("fraud.noEntities")} icon={Link2} />
              ) : (
                <ul className="divide-y divide-border">
                  {entities.data.map((l) => (
                    <li key={l.id} data-testid="entity-row" className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <div className="min-w-0">
                        <p className="font-mono text-sm text-foreground">{l.entity.displayValue}</p>
                        <p className="text-xs text-foreground-subtle">
                          {t(`fraud.entityType.${l.entity.type}`)} · {t(`fraud.entityRole.${l.role}`)}
                          {l.entity.provider && ` · ${l.entity.provider}`}
                          {l.note && ` · ${l.note}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {l.otherComplaints > 0 && (
                          <StatusPill tone="warning">
                            <Users className="h-3 w-3" />
                            {t("fraud.otherComplaints", { n: l.otherComplaints })}
                          </StatusPill>
                        )}
                        {canManage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Remove ${l.entity.displayValue}`}
                            onClick={() => setDialog({ kind: "remove", link: l })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </TabsContent>

          {/* ------------------------------------------------------- trail */}
          <TabsContent value="trail">
            <Panel
              title={t("fraud.moneyTrail")}
              actions={
                canRecord ? (
                  <Button size="sm" onClick={() => setDialog({ kind: "transfer" })} disabled={uniqueMoney.length < 2}>
                    <Plus className="h-3.5 w-3.5" />
                    {t("fraud.recordTransfer")}
                  </Button>
                ) : undefined
              }
            >
              {uniqueMoney.length < 2 && (
                <p className="mb-2 text-xs text-foreground-muted">{t("fraud.needTwoAccounts")}</p>
              )}
              {transactions.isPending ? (
                <Skeleton className="h-32 w-full" />
              ) : transactions.isError ? (
                <p className="text-sm text-danger">{transactions.error.message}</p>
              ) : transactions.data.length === 0 ? (
                <EmptyState title={t("fraud.noTransfers")} icon={ArrowRight} />
              ) : (
                <ol className="flex flex-col gap-2">
                  {transactions.data.map((tx, i) => (
                    <li key={tx.id} data-testid="transfer-row" className="rounded-md border border-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-foreground-subtle">
                          #{i + 1} · {formatDateTime(tx.occurredAt)}
                          {tx.reference && ` · ${tx.reference}`}
                        </span>
                        <span className="tabular text-sm font-semibold">{formatPaise(tx.amountPaise)}</span>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-sm">
                        {tx.from.displayValue}
                        <ArrowRight className="h-3.5 w-3.5 text-foreground-subtle" />
                        {tx.to.displayValue}
                      </p>
                      {tx.note && <p className="mt-1 text-xs text-foreground-muted">{tx.note}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </TabsContent>

          {/* ----------------------------------------------------- freezes */}
          <TabsContent value="freezes">
            <Panel
              title={t("fraud.freezeRequests")}
              description={t("fraud.sendingNotTransmitting")}
              actions={
                canManage ? (
                  <Button size="sm" onClick={() => setDialog({ kind: "freeze" })} disabled={uniqueMoney.length === 0}>
                    <Snowflake className="h-3.5 w-3.5" />
                    {t("fraud.draftFreeze")}
                  </Button>
                ) : undefined
              }
            >
              {freezes.isPending ? (
                <Skeleton className="h-32 w-full" />
              ) : freezes.isError ? (
                <p className="text-sm text-danger">{freezes.error.message}</p>
              ) : freezes.data.length === 0 ? (
                <EmptyState title={t("fraud.noFreezes")} icon={Snowflake} />
              ) : (
                <div className="flex flex-col gap-3">
                  {freezes.data.map((f) => (
                    <div key={f.id} data-testid="freeze-row" className="rounded-md border border-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-mono text-sm font-semibold">{f.requestNumber}</p>
                          <p className="text-xs text-foreground-subtle">
                            {f.addressee} · {f.entity.displayValue}
                          </p>
                        </div>
                        <StatusPill tone={freezeTone[f.status]}>{t(`fraud.freezeStatus.${f.status}`)}</StatusPill>
                      </div>
                      <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                        <Field label={t("fraud.requested")} value={formatPaise(f.amountRequestedPaise)} />
                        {f.amountFrozenPaise !== null && <Field label={t("fraud.frozen")} value={formatPaise(f.amountFrozenPaise)} />}
                        {f.sentAt && <Field label={t("fraud.sentVia")} value={`${f.sentVia} · ${formatDateTime(f.sentAt)} · ${f.sentByName}`} />}
                        {f.acknowledgedAt && (
                          <Field label={t("fraud.acknowledgementRef")} value={`${f.acknowledgementRef ?? "—"} · ${formatDateTime(f.acknowledgedAt)}`} />
                        )}
                        {f.rejectionReason && <Field label={t("fraud.rejectionReason")} value={f.rejectionReason} />}
                      </dl>
                      <p className="mt-2 text-xs text-foreground-muted">{f.grounds}</p>
                      {canManage && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {f.status === "DRAFTED" && (
                            <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "transition", freeze: f, action: "send" })}>
                              {t("fraud.freezeAction.send")}
                            </Button>
                          )}
                          {f.status === "SENT" && (
                            <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "transition", freeze: f, action: "acknowledge" })}>
                              {t("fraud.freezeAction.acknowledge")}
                            </Button>
                          )}
                          {(f.status === "SENT" || f.status === "ACKNOWLEDGED") && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "transition", freeze: f, action: "frozen" })}>
                                {t("fraud.freezeAction.frozen")}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "transition", freeze: f, action: "reject" })}>
                                {t("fraud.freezeAction.reject")}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </TabsContent>

          {/* -------------------------------------------------- recoveries */}
          <TabsContent value="recoveries">
            <Panel
              title={t("fraud.recoveries")}
              actions={
                canManage ? (
                  <Button size="sm" onClick={() => setDialog({ kind: "recovery" })} disabled={c.reportedLossPaise === 0}>
                    <Banknote className="h-3.5 w-3.5" />
                    {t("fraud.recordRecovery")}
                  </Button>
                ) : undefined
              }
            >
              {recoveries.isPending ? (
                <Skeleton className="h-24 w-full" />
              ) : recoveries.isError ? (
                <p className="text-sm text-danger">{recoveries.error.message}</p>
              ) : recoveries.data.length === 0 ? (
                <EmptyState title={t("fraud.noRecoveries")} icon={Banknote} />
              ) : (
                <ul className="divide-y divide-border">
                  {recoveries.data.map((r) => (
                    <li key={r.id} data-testid="recovery-row" className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="text-sm">
                        {formatDate(r.recoveredOn)}
                        {r.freezeRequestNumber && ` · ${r.freezeRequestNumber}`}
                        {r.reference && ` · ${r.reference}`}
                      </span>
                      <span className="tabular text-sm font-semibold text-success">{formatPaise(r.amountPaise)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </TabsContent>

          {/* ----------------------------------------------------- network */}
          <TabsContent value="network">
            <Panel title={t("fraud.network")} description={t("fraud.networkNote")}>
              {network.isPending ? (
                <Skeleton className="h-72 w-full" />
              ) : network.isError ? (
                <p className="text-sm text-danger">{network.error.message}</p>
              ) : network.data.nodes.length <= 1 ? (
                <EmptyState title={t("fraud.noEntities")} icon={NetworkIcon} />
              ) : (
                <FraudNetworkGraph network={network.data} />
              )}
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      {dialog?.kind === "edit" && <EditComplaintDialog complaint={c} onClose={close} />}
      {dialog?.kind === "status" && <StatusDialog complaint={c} onClose={close} />}
      {dialog?.kind === "entity" && <EntityDialog complaintId={c.id} onClose={close} />}
      {dialog?.kind === "remove" && <RemoveEntityDialog complaintId={c.id} link={dialog.link} onClose={close} />}
      {dialog?.kind === "transfer" && <TransferDialog complaintId={c.id} accounts={uniqueMoney} onClose={close} />}
      {dialog?.kind === "freeze" && <FreezeDialog complaint={c} accounts={uniqueMoney} onClose={close} />}
      {dialog?.kind === "transition" && (
        <TransitionDialog complaintId={c.id} freeze={dialog.freeze} action={dialog.action} onClose={close} />
      )}
      {dialog?.kind === "recovery" && (
        <RecoveryDialog complaint={c} frozen={(freezes.data ?? []).filter((f) => f.status === "FROZEN")} onClose={close} />
      )}
    </DashboardLayout>
  );
}

/* ------------------------------------------------------------- dialogs */

function DialogShell({
  title,
  description,
  children,
  error,
  submitLabel,
  pending,
  onSubmit,
  onClose,
  destructive,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  error: string | null;
  submitLabel: string;
  pending: boolean;
  onSubmit: () => void;
  onClose: () => void;
  destructive?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-3">
          {children}
          <ErrorLine message={error} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onSubmit} disabled={pending}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditComplaintDialog({ complaint: c, onClose }: { complaint: Complaint; onClose: () => void }) {
  const { t } = useI18n();
  const update = useUpdateComplaint();
  const [error, setError] = React.useState<string | null>(null);
  const [f, setF] = React.useState({
    complainantName: c.complainantName,
    complainantPhone: c.complainantPhone ?? "",
    complainantEmail: c.complainantEmail ?? "",
    type: c.type,
    platform: c.platform,
    platformName: c.platformName ?? "",
    priority: c.priority,
    incidentDate: c.incidentDate.slice(0, 10),
    incidentDescription: c.incidentDescription,
    ncrpReference: c.ncrpReference ?? "",
    helplineReference: c.helplineReference ?? "",
    loss: String(c.reportedLossPaise / 100),
  });
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError(null);
    const paise = rupeesToPaise(f.loss || "0");
    if (paise === null) return setError(t("fraud.enterRupees"));
    try {
      await update.mutateAsync({
        id: c.id,
        input: {
          complainantName: f.complainantName,
          complainantPhone: f.complainantPhone || null,
          complainantEmail: f.complainantEmail || null,
          type: f.type as ComplaintType,
          platform: f.platform as Platform,
          platformName: f.platformName || null,
          priority: f.priority as Priority,
          incidentDate: `${f.incidentDate}T00:00:00Z`,
          incidentDescription: f.incidentDescription,
          ncrpReference: f.ncrpReference || null,
          helplineReference: f.helplineReference || null,
          reportedLossPaise: paise,
          firId: c.firId,
          investigatingOfficer: c.investigatingOfficer,
        },
      });
      toast.success(t("fraud.editComplaint"), c.caseNumber);
      onClose();
    } catch (e) {
      setError(errorText(e, "The complaint was not updated"));
    }
  };

  return (
    <DialogShell title={t("fraud.editComplaint")} description={c.caseNumber} error={error} submitLabel={t("common.save")} pending={update.isPending} onSubmit={submit} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="ed-name">{t("fraud.complainant")}</Label>
          <Input id="ed-name" value={f.complainantName} onChange={set("complainantName")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ed-phone">{t("fraud.complainantPhone")}</Label>
          <Input id="ed-phone" value={f.complainantPhone} onChange={set("complainantPhone")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ed-type">{t("fraud.complaintType")}</Label>
          <select id="ed-type" className={selectClass} value={f.type} onChange={(e) => set("type")(e.target.value)}>
            {COMPLAINT_TYPES.map((ct) => (
              <option key={ct} value={ct}>
                {t(`fraud.type.${ct}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ed-platform">{t("fraud.platform")}</Label>
          <select id="ed-platform" className={selectClass} value={f.platform} onChange={(e) => set("platform")(e.target.value)}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {t(`fraud.platformType.${p}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ed-ncrp">{t("fraud.ncrp")}</Label>
          <Input id="ed-ncrp" value={f.ncrpReference} onChange={set("ncrpReference")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ed-1930">{t("fraud.helpline")}</Label>
          <Input id="ed-1930" value={f.helplineReference} onChange={set("helplineReference")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ed-loss">{t("fraud.lossAmount")}</Label>
          <Input id="ed-loss" inputMode="decimal" value={f.loss} onChange={set("loss")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ed-date">{t("fraud.incidentDate")}</Label>
          <Input id="ed-date" type="date" value={f.incidentDate} onChange={set("incidentDate")} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ed-narrative">{t("fraud.narrative")}</Label>
        <Textarea id="ed-narrative" rows={3} value={f.incidentDescription} onChange={set("incidentDescription")} />
      </div>
    </DialogShell>
  );
}

function StatusDialog({ complaint: c, onClose }: { complaint: Complaint; onClose: () => void }) {
  const { t } = useI18n();
  const setStatus = useSetComplaintStatus();
  const [status, setValue] = React.useState<ComplaintStatus>(c.status);
  const [error, setError] = React.useState<string | null>(null);
  const submit = async () => {
    setError(null);
    try {
      await setStatus.mutateAsync({ id: c.id, status });
      toast.success(t("fraud.changeStatus"), t(`fraud.status.${status}`));
      onClose();
    } catch (e) {
      setError(errorText(e, "The status was not changed"));
    }
  };
  return (
    <DialogShell title={t("fraud.changeStatus")} description={c.caseNumber} error={error} submitLabel={t("common.save")} pending={setStatus.isPending} onSubmit={submit} onClose={onClose}>
      <div className="grid gap-1.5">
        <Label htmlFor="st-status">{t("common.status")}</Label>
        <select id="st-status" className={selectClass} value={status} onChange={(e) => setValue(e.target.value as ComplaintStatus)}>
          {COMPLAINT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`fraud.status.${s}`)}
            </option>
          ))}
        </select>
      </div>
    </DialogShell>
  );
}

function EntityDialog({ complaintId, onClose }: { complaintId: string; onClose: () => void }) {
  const { t } = useI18n();
  const record = useRecordEntity();
  const [type, setType] = React.useState<EntityType>("UPI");
  const [role, setRole] = React.useState<EntityRole>("BENEFICIARY");
  const [value, setValue] = React.useState("");
  const [ifsc, setIfsc] = React.useState("");
  const [provider, setProvider] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      const link = await record.mutateAsync({
        id: complaintId,
        input: {
          type,
          value,
          role,
          ifsc: type === "BANK_ACCOUNT" ? ifsc : null,
          provider: provider || null,
          note: note || null,
        },
      });
      toast.success(
        t("fraud.recordEntity"),
        link.otherComplaints > 0
          ? `${link.entity.displayValue} — ${t("fraud.otherComplaints", { n: link.otherComplaints })}`
          : link.entity.displayValue,
      );
      onClose();
    } catch (e) {
      setError(errorText(e, "The entity was not recorded"));
    }
  };

  return (
    <DialogShell title={t("fraud.recordEntity")} description={t("fraud.officerRecorded")} error={error} submitLabel={t("fraud.recordEntity")} pending={record.isPending} onSubmit={submit} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="en-type">{t("fraud.entityKind")}</Label>
          <select id="en-type" className={selectClass} value={type} onChange={(e) => setType(e.target.value as EntityType)}>
            {ENTITY_TYPES.map((et) => (
              <option key={et} value={et}>
                {t(`fraud.entityType.${et}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="en-role">{t("fraud.role")}</Label>
          <select id="en-role" className={selectClass} value={role} onChange={(e) => setRole(e.target.value as EntityRole)}>
            {ENTITY_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`fraud.entityRole.${r}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="en-value">{t("fraud.value")} *</Label>
          <Input
            id="en-value"
            value={value}
            onChange={setValue}
            placeholder={
              type === "UPI" ? "name@bank" : type === "BANK_ACCOUNT" ? "Account number" : type === "PHONE" ? "+91 98300 00000" : type === "URL" ? "https://" : ""
            }
          />
        </div>
        {type === "BANK_ACCOUNT" && (
          <div className="grid gap-1.5">
            <Label htmlFor="en-ifsc">{t("fraud.ifsc")} *</Label>
            <Input id="en-ifsc" value={ifsc} onChange={setIfsc} placeholder="HDFC0001234" />
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="en-provider">{t("fraud.provider")}</Label>
          <Input id="en-provider" value={provider} onChange={setProvider} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="en-note">{t("fraud.note")}</Label>
        <Input id="en-note" value={note} onChange={setNote} />
      </div>
    </DialogShell>
  );
}

function RemoveEntityDialog({ complaintId, link, onClose }: { complaintId: string; link: ComplaintEntity; onClose: () => void }) {
  const { t } = useI18n();
  const remove = useRemoveEntity();
  const [error, setError] = React.useState<string | null>(null);
  const submit = async () => {
    setError(null);
    try {
      await remove.mutateAsync({ id: complaintId, linkId: link.id });
      toast.success(t("common.delete"), link.entity.displayValue);
      onClose();
    } catch (e) {
      setError(errorText(e, "The entity was not removed"));
    }
  };
  return (
    <DialogShell
      title={t("fraud.removeTitle", { value: link.entity.displayValue })}
      description={`${t(`fraud.entityRole.${link.role}`)}. ${t("fraud.removeHint")}`}
      error={error}
      submitLabel={t("common.delete")}
      pending={remove.isPending}
      onSubmit={submit}
      onClose={onClose}
      destructive
    />
  );
}

type Account = ComplaintEntity["entity"];

function AccountSelect({ id, value, onChange, accounts, label }: { id: string; value: string; onChange: (v: string) => void; accounts: Account[]; label: string }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label} *</Label>
      <select id={id} className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {t(`fraud.entityType.${a.type}`)}: {a.displayValue}
          </option>
        ))}
      </select>
    </div>
  );
}

function TransferDialog({ complaintId, accounts, onClose }: { complaintId: string; accounts: Account[]; onClose: () => void }) {
  const { t } = useI18n();
  const record = useRecordTransaction();
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [when, setWhen] = React.useState(localNow());
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const paise = rupeesToPaise(amount);
    if (!from || !to) return setError(t("fraud.chooseAccounts"));
    if (paise === null || paise <= 0) return setError(t("fraud.enterRupees"));
    try {
      await record.mutateAsync({
        id: complaintId,
        input: { fromEntityId: from, toEntityId: to, amountPaise: paise, reference: reference || null, occurredAt: new Date(when).toISOString(), note: note || null },
      });
      toast.success(t("fraud.recordTransfer"), formatPaise(paise));
      onClose();
    } catch (e) {
      setError(errorText(e, "The transfer was not recorded"));
    }
  };

  return (
    <DialogShell title={t("fraud.recordTransfer")} error={error} submitLabel={t("fraud.recordTransfer")} pending={record.isPending} onSubmit={submit} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <AccountSelect id="tx-from" label={t("fraud.from")} value={from} onChange={setFrom} accounts={accounts} />
        <AccountSelect id="tx-to" label={t("fraud.to")} value={to} onChange={setTo} accounts={accounts} />
        <div className="grid gap-1.5">
          <Label htmlFor="tx-amount">{t("fraud.amount")} *</Label>
          <Input id="tx-amount" inputMode="decimal" value={amount} onChange={setAmount} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tx-when">{t("fraud.occurredAt")} *</Label>
          <Input id="tx-when" type="datetime-local" value={when} onChange={setWhen} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tx-ref">{t("fraud.utr")}</Label>
          <Input id="tx-ref" value={reference} onChange={setReference} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tx-note">{t("fraud.note")}</Label>
          <Input id="tx-note" value={note} onChange={setNote} />
        </div>
      </div>
    </DialogShell>
  );
}

function FreezeDialog({ complaint: c, accounts, onClose }: { complaint: Complaint; accounts: Account[]; onClose: () => void }) {
  const { t } = useI18n();
  const draft = useDraftFreeze();
  const [entityId, setEntityId] = React.useState("");
  const [addressee, setAddressee] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [grounds, setGrounds] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const paise = rupeesToPaise(amount);
    if (!entityId) return setError(t("fraud.chooseAccount"));
    if (paise === null || paise <= 0) return setError(t("fraud.enterRupees"));
    try {
      const f = await draft.mutateAsync({ id: c.id, input: { entityId, addressee, amountRequestedPaise: paise, grounds } });
      toast.success(t("fraud.draftFreeze"), f.requestNumber);
      onClose();
    } catch (e) {
      setError(errorText(e, "The freeze request was not drafted"));
    }
  };

  return (
    <DialogShell
      title={t("fraud.draftFreeze")}
      description={`${t("fraud.reportedLoss")}: ${formatPaise(c.reportedLossPaise)}`}
      error={error}
      submitLabel={t("fraud.draftFreeze")}
      pending={draft.isPending}
      onSubmit={submit}
      onClose={onClose}
    >
      <AccountSelect id="fz-account" label={t("fraud.account")} value={entityId} onChange={setEntityId} accounts={accounts} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="fz-addressee">{t("fraud.addressee")} *</Label>
          <Input id="fz-addressee" value={addressee} onChange={setAddressee} placeholder="Nodal officer, bank or intermediary" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fz-amount">{t("fraud.amount")} *</Label>
          <Input id="fz-amount" inputMode="decimal" value={amount} onChange={setAmount} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="fz-grounds">{t("fraud.grounds")} *</Label>
        <Textarea id="fz-grounds" rows={3} value={grounds} onChange={setGrounds} />
      </div>
    </DialogShell>
  );
}

function TransitionDialog({
  complaintId,
  freeze: f,
  action,
  onClose,
}: {
  complaintId: string;
  freeze: FreezeRequest;
  action: "send" | "acknowledge" | "frozen" | "reject";
  onClose: () => void;
}) {
  const { t } = useI18n();
  const transition = useTransitionFreeze();
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      if (action === "frozen") {
        const paise = rupeesToPaise(text);
        if (paise === null || paise <= 0) return setError(t("fraud.enterRupees"));
        await transition.mutateAsync({ id: complaintId, freezeId: f.id, step: { action, amountFrozenPaise: paise } });
      } else if (action === "send") {
        await transition.mutateAsync({ id: complaintId, freezeId: f.id, step: { action, sentVia: text } });
      } else if (action === "acknowledge") {
        await transition.mutateAsync({ id: complaintId, freezeId: f.id, step: { action, acknowledgementRef: text || null } });
      } else {
        await transition.mutateAsync({ id: complaintId, freezeId: f.id, step: { action, rejectionReason: text } });
      }
      toast.success(t(`fraud.freezeAction.${action}`), f.requestNumber);
      onClose();
    } catch (e) {
      setError(errorText(e, "The freeze request was not updated"));
    }
  };

  const field = {
    send: { id: "fz-sent-via", label: t("fraud.sentVia"), placeholder: "Email to nodal officer, NCRP portal, letter…" },
    acknowledge: { id: "fz-ack-ref", label: t("fraud.acknowledgementRef"), placeholder: "" },
    frozen: { id: "fz-frozen", label: t("fraud.amountFrozen"), placeholder: `≤ ${formatPaise(f.amountRequestedPaise)}` },
    reject: { id: "fz-reason", label: t("fraud.rejectionReason"), placeholder: "" },
  }[action];

  return (
    <DialogShell
      title={t(`fraud.freezeAction.${action}`)}
      description={`${f.requestNumber} · ${f.addressee} · ${formatPaise(f.amountRequestedPaise)}${action === "send" ? ` — ${t("fraud.sendingNotTransmitting")}` : ""}`}
      error={error}
      submitLabel={t(`fraud.freezeAction.${action}`)}
      pending={transition.isPending}
      onSubmit={submit}
      onClose={onClose}
    >
      <div className="grid gap-1.5">
        <Label htmlFor={field.id}>{field.label}</Label>
        <Input id={field.id} value={text} onChange={setText} placeholder={field.placeholder} inputMode={action === "frozen" ? "decimal" : undefined} />
      </div>
    </DialogShell>
  );
}

function RecoveryDialog({ complaint: c, frozen, onClose }: { complaint: Complaint; frozen: FreezeRequest[]; onClose: () => void }) {
  const { t } = useI18n();
  const record = useRecordRecovery();
  const [amount, setAmount] = React.useState("");
  const [on, setOn] = React.useState(new Date().toISOString().slice(0, 10));
  const [freezeId, setFreezeId] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const paise = rupeesToPaise(amount);
    if (paise === null || paise <= 0) return setError(t("fraud.enterRupees"));
    try {
      await record.mutateAsync({
        id: c.id,
        input: { amountPaise: paise, recoveredOn: `${on}T00:00:00Z`, freezeRequestId: freezeId || null, reference: reference || null },
      });
      toast.success(t("fraud.recordRecovery"), formatPaise(paise));
      onClose();
    } catch (e) {
      setError(errorText(e, "The recovery was not recorded"));
    }
  };

  return (
    <DialogShell
      title={t("fraud.recordRecovery")}
      description={`${t("fraud.reportedLoss")} ${formatPaise(c.reportedLossPaise)} · ${t("fraud.recovered")} ${formatPaise(c.recoveredPaise)}`}
      error={error}
      submitLabel={t("fraud.recordRecovery")}
      pending={record.isPending}
      onSubmit={submit}
      onClose={onClose}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="rc-amount">{t("fraud.amount")} *</Label>
          <Input id="rc-amount" inputMode="decimal" value={amount} onChange={setAmount} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rc-on">{t("fraud.recoveredOn")} *</Label>
          <Input id="rc-on" type="date" value={on} onChange={setOn} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rc-freeze">{t("fraud.againstFreeze")}</Label>
          <select id="rc-freeze" className={selectClass} value={freezeId} onChange={(e) => setFreezeId(e.target.value)}>
            <option value="">—</option>
            {frozen.map((f) => (
              <option key={f.id} value={f.id}>
                {f.requestNumber} · {formatPaise(f.amountFrozenPaise ?? 0)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rc-ref">{t("fraud.utr")}</Label>
          <Input id="rc-ref" value={reference} onChange={setReference} />
        </div>
      </div>
    </DialogShell>
  );
}

/* ------------------------------------------------------------- network */

const nodeColour: Record<string, string> = {
  complaint: "var(--accent)",
  UPI: "var(--warning)",
  BANK_ACCOUNT: "var(--danger)",
  WALLET: "var(--danger)",
  PHONE: "var(--info)",
  URL: "var(--foreground-muted)",
  EMAIL: "var(--foreground-muted)",
};

/**
 * Three rings, all from stored rows: the complaint at the centre, the entities
 * it names around it, and other complaints naming those entities outside.
 * Solid lines are "names"; dashed arrows are recorded transfers.
 */
function FraudNetworkGraph({ network }: { network: Network }) {
  const { t } = useI18n();
  const focus = network.nodes.find((n) => n.focus) ?? network.nodes[0];
  const entities = network.nodes.filter((n) => n.kind === "entity");
  const others = network.nodes.filter((n) => n.kind === "complaint" && n.id !== focus.id);

  const width = 720;
  const height = Math.max(420, 200 + Math.max(entities.length, others.length) * 18);
  const cx = width / 2;
  const cy = height / 2;
  const inner = Math.min(cx, cy) * 0.42;
  const outer = Math.min(cx, cy) * 0.86;

  const pos = new Map<string, { x: number; y: number }>();
  pos.set(focus.id, { x: cx, y: cy });
  entities.forEach((n, i) => {
    const a = (2 * Math.PI * i) / Math.max(entities.length, 1) - Math.PI / 2;
    pos.set(n.id, { x: cx + inner * Math.cos(a), y: cy + inner * Math.sin(a) });
  });
  others.forEach((n, i) => {
    const a = (2 * Math.PI * i) / Math.max(others.length, 1) - Math.PI / 2 + 0.3;
    pos.set(n.id, { x: cx + outer * Math.cos(a), y: cy + outer * Math.sin(a) });
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[36rem]" role="img" aria-label={t("fraud.network")} data-testid="fraud-network">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--danger)" />
          </marker>
        </defs>
        {network.edges.map((e) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          return e.kind === "transfer" ? (
            <g key={e.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="5 4" markerEnd="url(#arrow)" />
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" fontSize="10" fill="var(--danger)">
                {formatPaise(e.amountPaise ?? 0)}
              </text>
            </g>
          ) : (
            <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border-strong)" strokeWidth={1} />
          );
        })}
        {network.nodes.map((n) => {
          const p = pos.get(n.id)!;
          const colour = n.kind === "complaint" ? nodeColour.complaint : nodeColour[n.type] ?? "var(--foreground-muted)";
          return (
            <g key={n.id} data-kind={n.kind}>
              <circle cx={p.x} cy={p.y} r={n.focus ? 14 : 9} fill={`color-mix(in oklab, ${colour} 20%, var(--surface))`} stroke={colour} strokeWidth={n.focus ? 2.5 : 1.5} />
              <text x={p.x} y={p.y + (n.focus ? 28 : 22)} textAnchor="middle" fontSize="11" fill="var(--foreground)" className="font-mono">
                {n.label.length > 28 ? `${n.label.slice(0, 27)}…` : n.label}
              </text>
              {n.sublabel && (
                <text x={p.x} y={p.y + (n.focus ? 41 : 35)} textAnchor="middle" fontSize="10" fill="var(--foreground-subtle)">
                  {n.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-foreground-muted">{t("fraud.networkNote")}</p>
    </div>
  );
}
