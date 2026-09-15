"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  CornerDownLeft,
  FileText,
  Gavel,
  History,
  MoveRight,
  QrCode,
  ShieldCheck,
  Stamp,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { EmptyState, Field, PageHeader, Panel, PhaseBadge, StatusPill } from "@/components/platform/primitives";
import { act, type Action } from "@/components/platform/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { ApiClientError } from "@/lib/api/client";
import { useProperty, usePropertyEvents, usePropertyMovements, usePropertySealChecks } from "@/hooks/use-malkhana";
import {
  DisposeDialog,
  MoveOutDialog,
  RelocateDialog,
  ResealDialog,
  ReturnDialog,
  SealCheckDialog,
  formatDay,
  formatRupees,
  formatWhen,
  officerMessage,
} from "../parts";

const STATUS_TONE = { IN_MALKHANA: "success", MOVED_OUT: "info", DISPOSED: "neutral" } as const;

type Dialogs = "seal" | "reseal" | "relocate" | "move" | "return" | "dispose" | null;

export default function PropertyPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuthStore();
  const atLeast = (r: Parameters<typeof hasMinimumRole>[1]) => Boolean(user && hasMinimumRole(user.role, r));

  const item = useProperty(id);
  const sealChecks = usePropertySealChecks(id);
  const movements = usePropertyMovements(id);
  const events = usePropertyEvents(id);

  const [dialog, setDialog] = React.useState<Dialogs>(null);
  const close = (open: boolean) => {
    if (!open) setDialog(null);
  };

  if (item.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (item.isError || !item.data) {
    const notFound = item.error instanceof ApiClientError && item.error.code === 404;
    return (
      <DashboardLayout>
        <EmptyState
          title={notFound ? t("malkhanaScreen.item.notFound") : t("malkhanaScreen.item.loadFailed")}
          description={notFound ? t("malkhanaScreen.item.notFoundBody") : officerMessage(item.error)}
          icon={Boxes}
          action={
            <div className="flex gap-2">
              {!notFound && (
                <Button variant="outline" onClick={() => item.refetch()}>
                  {t("malkhanaScreen.actions.retry")}
                </Button>
              )}
              <Link href="/malkhana" className={buttonVariants({ variant: "outline" })}>
                {t("malkhanaScreen.actions.back")}
              </Link>
            </div>
          }
        />
      </DashboardLayout>
    );
  }

  const p = item.data;
  const open = p.openMovement;
  const inMalkhana = p.status === "IN_MALKHANA";
  const disposed = p.status === "DISPOSED";
  const broken = p.sealState === "BROKEN" && !disposed;

  const menu: Action[] = [
    act.link("label", t("malkhanaScreen.actions.printLabel"), `/malkhana/${p.id}/label`, { icon: QrCode }),
    ...(p.caseId ? [act.link("case", p.caseNumber || "Case", `/cases/${p.caseId}`, { icon: FileText })] : []),
    ...(p.firId ? [act.link("fir", `FIR ${p.firNumber}`, `/fir/${p.firId}`, { icon: FileText })] : []),
    ...(p.evidenceId
      ? [act.link("evidence", t("malkhanaScreen.item.evidence"), `/custody/${p.evidenceId}`, { icon: ShieldCheck })]
      : []),
    ...(p.caseId ? [act.link("court", "Court diary", "/court", { icon: Gavel })] : []),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={p.description}
          description={`${p.propertyNumber} · ${t(`malkhanaScreen.category.${p.category}`)} · ${p.stationName}`}
          icon={Boxes}
          badge={<PhaseBadge phase={14} />}
          breadcrumb={[{ label: t("modules.malkhana"), href: "/malkhana" }, { label: p.propertyNumber }]}
          menu={menu}
          actions={
            <div className="flex flex-wrap gap-2" data-testid="item-actions">
              <Link href={`/malkhana/${p.id}/label`} className={buttonVariants({ variant: "outline" })}>
                <QrCode className="h-4 w-4" />
                {t("malkhanaScreen.actions.printLabel")}
              </Link>
              {inMalkhana && atLeast("ASI") && (
                <Button variant="outline" onClick={() => setDialog("seal")}>
                  <Stamp className="h-4 w-4" />
                  {t("malkhanaScreen.actions.verifySeal")}
                </Button>
              )}
              {broken && atLeast("SHO") && (
                <Button variant="outline" onClick={() => setDialog("reseal")}>
                  <ShieldCheck className="h-4 w-4" />
                  {t("malkhanaScreen.actions.reseal")}
                </Button>
              )}
              {inMalkhana && atLeast("SI") && (
                <Button variant="outline" onClick={() => setDialog("relocate")}>
                  <ArrowLeftRight className="h-4 w-4" />
                  {t("malkhanaScreen.actions.relocate")}
                </Button>
              )}
              {inMalkhana && !broken && atLeast("ASI") && (
                <Button onClick={() => setDialog("move")}>
                  <MoveRight className="h-4 w-4" />
                  {t("malkhanaScreen.actions.moveOut")}
                </Button>
              )}
              {open && atLeast("ASI") && (
                <Button onClick={() => setDialog("return")}>
                  <CornerDownLeft className="h-4 w-4" />
                  {t("malkhanaScreen.actions.returnBack")}
                </Button>
              )}
              {inMalkhana && atLeast("SHO") && (
                <Button variant="destructive" onClick={() => setDialog("dispose")}>
                  <Trash2 className="h-4 w-4" />
                  {t("malkhanaScreen.actions.dispose")}
                </Button>
              )}
            </div>
          }
        />

        {broken && (
          <Alert variant="danger" data-testid="seal-broken-banner">
            <AlertTriangle />
            <div>
              <AlertTitle>{t("malkhanaScreen.item.sealBrokenTitle")}</AlertTitle>
              <AlertDescription>{t("malkhanaScreen.item.sealBrokenBody")}</AlertDescription>
            </div>
          </Alert>
        )}
        {open?.overdue && (
          <Alert variant="warning" data-testid="overdue-banner">
            <AlertTriangle />
            <div>
              <AlertTitle>{t("malkhanaScreen.item.overdueTitle")}</AlertTitle>
              <AlertDescription>
                {t("malkhanaScreen.item.overdueBody", { destination: open.destination, date: formatWhen(open.expectedReturnAt) })}
              </AlertDescription>
            </div>
          </Alert>
        )}
        {disposed && (
          <Alert variant="default" data-testid="disposed-banner">
            <Trash2 />
            <div>
              <AlertTitle>{t("malkhanaScreen.item.disposedTitle")}</AlertTitle>
              <AlertDescription>
                {t("malkhanaScreen.item.disposedBody", {
                  type: p.disposalType ? t(`malkhanaScreen.disposalType.${p.disposalType}`) : "",
                  date: formatWhen(p.disposedAt),
                  officer: p.disposedByName,
                })}
                {p.disposalWitnessName && ` ${t("malkhanaScreen.item.witness")}: ${p.disposalWitnessName}.`}
                {p.disposalNote && ` ${p.disposalNote}`}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title={t("malkhanaScreen.item.summary")}>
            <dl className="grid grid-cols-2 gap-3">
              <Field
                label={t("malkhanaScreen.table.status")}
                value={<StatusPill tone={STATUS_TONE[p.status]}>{t(`malkhanaScreen.status.${p.status}`)}</StatusPill>}
              />
              <Field label={t("malkhanaScreen.table.category")} value={t(`malkhanaScreen.category.${p.category}`)} />
              <Field label={t("malkhanaScreen.item.quantity")} value={`${p.quantity} ${p.unit}`} />
              <Field
                label={t("malkhanaScreen.item.weight")}
                value={p.weightGrams ? `${p.weightGrams} g` : t("malkhanaScreen.item.notRecorded")}
              />
              <Field
                label={t("malkhanaScreen.item.value")}
                value={p.valuePaise !== null ? formatRupees(p.valuePaise) : t("malkhanaScreen.item.notRecorded")}
              />
              <Field
                label={t("malkhanaScreen.table.record")}
                mono
                value={[p.caseNumber, p.firNumber && `FIR ${p.firNumber}`].filter(Boolean).join(" · ") || "—"}
              />
            </dl>
          </Panel>
          <Panel title={t("malkhanaScreen.item.seizure")}>
            <dl className="grid grid-cols-2 gap-3">
              <Field label={t("malkhanaScreen.item.seizedAt")} value={formatWhen(p.seizedAt)} />
              <Field label={t("malkhanaScreen.item.seizedBy")} value={p.seizedByName} />
              <Field className="col-span-2" label={t("malkhanaScreen.item.seizedPlace")} value={p.seizedPlace} />
              <Field label={t("malkhanaScreen.item.memo")} mono value={p.seizureMemoRef} />
              <Field label={t("malkhanaScreen.item.depositedAt")} value={`${formatDay(p.depositedAt)} · ${p.depositedByName}`} />
            </dl>
          </Panel>
          <Panel title={t("malkhanaScreen.item.storage")}>
            <dl className="grid grid-cols-2 gap-3">
              <Field
                className="col-span-2"
                label={t("malkhanaScreen.item.location")}
                value={p.locationLabel || (open ? `${t("malkhanaScreen.item.locationOut")} — ${open.destination}` : "—")}
              />
              <Field label={t("malkhanaScreen.item.seal")} mono value={p.sealNumber} />
              <Field
                label={t("malkhanaScreen.table.status")}
                value={
                  <StatusPill tone={p.sealState === "INTACT" ? "success" : "danger"}>
                    {t(`malkhanaScreen.seal.${p.sealState}`)}
                  </StatusPill>
                }
              />
              <Field
                className="col-span-2"
                label={t("malkhanaScreen.item.held", { days: p.heldDays })}
                value={
                  p.reviewDue ? (
                    <StatusPill tone="warning">{t("malkhanaScreen.item.reviewDue", { days: p.reviewPeriodDays })}</StatusPill>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
          </Panel>
        </div>

        <Panel title={t("malkhanaScreen.item.movements")}>
          {movements.isLoading ? (
            <Skeleton className="h-16" />
          ) : movements.isError ? (
            <p className="text-sm text-danger">{officerMessage(movements.error)}</p>
          ) : (movements.data ?? []).length === 0 ? (
            <p className="text-sm text-foreground-muted">{t("malkhanaScreen.item.noMovements")}</p>
          ) : (
            <ul className="flex flex-col gap-3" data-testid="movement-list">
              {movements.data!.map((m) => (
                <li key={m.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {t(`malkhanaScreen.movementType.${m.movementType}`)} → {m.destination}
                      </p>
                      <p className="text-xs text-foreground-muted">{m.purpose}</p>
                      {m.hearingDate && (
                        <p className="text-xs text-foreground-muted">
                          {t("malkhanaScreen.item.hearing", { date: formatDay(m.hearingDate) })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {m.returnedAt ? (
                        <StatusPill tone={m.sealIntactBack ? "success" : "danger"}>
                          {t("malkhanaScreen.item.returned")} ·{" "}
                          {m.sealIntactBack ? t("malkhanaScreen.seal.INTACT") : t("malkhanaScreen.seal.BROKEN")}
                        </StatusPill>
                      ) : (
                        <StatusPill tone={m.overdue ? "warning" : "info"}>
                          {m.overdue ? t("malkhanaScreen.attention.OVERDUE") : t("malkhanaScreen.item.notReturned")}
                        </StatusPill>
                      )}
                      {m.movementType === "FORENSIC_EXAMINATION" && (
                        <Link
                          href={`/malkhana/${p.id}/letter/${m.id}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {t("malkhanaScreen.actions.letter")}
                        </Link>
                      )}
                    </div>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <Field label={t("malkhanaScreen.item.out")} value={`${formatWhen(m.movedOutAt)} · ${m.movedOutByName}`} />
                    <Field label={t("malkhanaScreen.item.authority")} mono value={m.authorityRef} />
                    <Field label={t("malkhanaScreen.item.handedTo")} value={m.handedTo} />
                    <Field label={t("malkhanaScreen.item.sealOut")} mono value={m.sealNumberOut} />
                    <Field label={t("malkhanaScreen.item.expected")} value={formatWhen(m.expectedReturnAt)} />
                    {m.returnedAt && (
                      <>
                        <Field
                          label={t("malkhanaScreen.item.returned")}
                          value={`${formatWhen(m.returnedAt)} · ${m.receivedBackByName}`}
                        />
                        <Field label={t("malkhanaScreen.item.sealBack")} mono value={m.sealNumberBack} />
                        {m.returnNote && <Field label={t("malkhanaScreen.back.note")} value={m.returnNote} />}
                      </>
                    )}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={t("malkhanaScreen.item.sealHistory")}>
            {sealChecks.isLoading ? (
              <Skeleton className="h-16" />
            ) : sealChecks.isError ? (
              <p className="text-sm text-danger">{officerMessage(sealChecks.error)}</p>
            ) : (sealChecks.data ?? []).length === 0 ? (
              <p className="text-sm text-foreground-muted">{t("malkhanaScreen.item.noSealChecks")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border text-sm" data-testid="seal-history">
                {sealChecks.data!.map((c) => (
                  <li key={c.id} className="flex flex-col gap-0.5 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={c.sealState === "INTACT" ? "success" : "danger"}>
                        {t(`malkhanaScreen.seal.${c.sealState}`)}
                      </StatusPill>
                      <span className="text-xs text-foreground-muted">{t(`malkhanaScreen.checkContext.${c.context}`)}</span>
                      <span className="font-mono text-xs text-foreground">{c.sealNumber}</span>
                    </div>
                    <span className="text-xs text-foreground-subtle">
                      {formatWhen(c.checkedAt)} · {c.checkedByName}
                    </span>
                    {c.note && <span className="text-xs text-foreground-muted">{c.note}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel
            title={
              <span className="flex items-center gap-1.5">
                <History className="h-4 w-4" />
                {t("malkhanaScreen.item.history")}
              </span>
            }
            description={t("malkhanaScreen.ledgerBody")}
          >
            {events.isLoading ? (
              <Skeleton className="h-16" />
            ) : events.isError ? (
              <p className="text-sm text-danger">{officerMessage(events.error)}</p>
            ) : (events.data ?? []).length === 0 ? (
              <p className="text-sm text-foreground-muted">{t("malkhanaScreen.item.noHistory")}</p>
            ) : (
              <ol className="flex flex-col gap-2 text-sm" data-testid="property-history">
                {events.data!.map((e) => (
                  <li key={e.id} className="border-l-2 border-border pl-3">
                    <p className="text-foreground">{e.summary}</p>
                    <p className="text-xs text-foreground-subtle">
                      {formatWhen(e.occurredAt)} · {e.actorName}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>

      <SealCheckDialog item={p} open={dialog === "seal"} onOpenChange={close} />
      <ResealDialog item={p} open={dialog === "reseal"} onOpenChange={close} />
      <RelocateDialog item={p} open={dialog === "relocate"} onOpenChange={close} />
      <MoveOutDialog item={p} open={dialog === "move"} onOpenChange={close} />
      <ReturnDialog item={p} open={dialog === "return"} onOpenChange={close} />
      <DisposeDialog item={p} open={dialog === "dispose"} onOpenChange={close} />
    </DashboardLayout>
  );
}
