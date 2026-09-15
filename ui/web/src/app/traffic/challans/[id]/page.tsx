"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ClipboardList, Gavel, Loader2, Scale } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, Field, PageHeader, Panel, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { useI18n } from "@/lib/i18n";
import { ApiClientError } from "@/lib/api/client";
import { useChallan, useDisputeChallan, useSetChallanStatus } from "@/hooks/use-legacy-registers";
import { CHALLAN_TRANSITIONS, DISPUTABLE, type ChallanStatus } from "@/lib/api/traffic-challans";
import { formatDate, formatDateTime } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, TL, VEHICLE_TYPE_LABEL, rupees } from "../../labels";

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { pick } = useI18n();
  const canAct = Boolean(user && hasMinimumRole(user.role, "SI"));

  const challan = useChallan(id);
  const setStatus = useSetChallanStatus(id);
  const dispute = useDisputeChallan(id);

  const [dialog, setDialog] = useState<null | "status" | "dispute">(null);
  const [next, setNext] = useState<ChallanStatus | "">("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const close = () => {
    setDialog(null);
    setNext("");
    setReference("");
    setNote("");
  };

  if (challan.isPending) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center gap-3 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" /> {pick(TL.loading)}
        </div>
      </DashboardLayout>
    );
  }

  if (challan.isError) {
    // A malformed id (400) is as absent as an unknown one (404).
    const notFound = challan.error instanceof ApiClientError && (challan.error.code === 404 || challan.error.code === 400);
    return (
      <DashboardLayout>
        <EmptyState
          icon={AlertTriangle}
          title={notFound ? pick(TL.notFound) : pick(TL.loadFailed)}
          description={notFound ? pick(TL.notFoundBody) : challan.error.message}
          action={
            <Link href="/traffic">
              <Button variant="secondary">{pick(TL.backToRegister)}</Button>
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  const c = challan.data;
  const options = CHALLAN_TRANSITIONS[c.status] ?? [];
  const canDispute = DISPUTABLE.includes(c.status);
  const needsReference = next === "PAID" || next === "COMPOUNDED";

  const saveStatus = async () => {
    if (!next) return;
    try {
      await setStatus.mutateAsync({
        status: next,
        reference: needsReference ? reference.trim() : undefined,
        note: needsReference ? undefined : note.trim(),
      });
      toast.success(pick(TL.saved), `${c.challan_number} · ${pick(STATUS_LABEL[next])}`);
      close();
    } catch (err) {
      toast.error(pick(TL.failed), err instanceof Error ? err.message : "");
    }
  };

  const saveDispute = async () => {
    try {
      await dispute.mutateAsync(note.trim());
      toast.success(pick(TL.saved), `${c.challan_number} · ${pick(STATUS_LABEL.DISPUTED)}`);
      close();
    } catch (err) {
      toast.error(pick(TL.failed), err instanceof Error ? err.message : "");
    }
  };

  const joinOpt = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" · ") || null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={c.challan_number}
          description={`${c.vehicle_number} · ${c.violation_type?.name ?? ""}`}
          icon={ClipboardList}
          breadcrumb={[{ label: pick(TL.title), href: "/traffic" }, { label: c.challan_number }]}
          badge={<StatusPill tone={STATUS_TONE[c.status]}>{pick(STATUS_LABEL[c.status])}</StatusPill>}
          actions={
            canAct && (
              <>
                {canDispute && (
                  <Button variant="secondary" onClick={() => setDialog("dispute")}>
                    <Scale className="mr-2 h-4 w-4" />
                    {pick(TL.recordDispute)}
                  </Button>
                )}
                {options.length > 0 && (
                  <Button onClick={() => setDialog("status")}>
                    <Gavel className="mr-2 h-4 w-4" />
                    {pick(TL.changeStatus)}
                  </Button>
                )}
              </>
            )
          }
        />

        {!canAct && <p className="text-sm text-foreground-muted">{pick(TL.actionsRestricted)}</p>}
        {canAct && options.length === 0 && !canDispute && <p className="text-sm text-foreground-muted">{pick(TL.noActions)}</p>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel title={pick(TL.violationDetails)} className="lg:col-span-2">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={pick(TL.violation)} value={c.violation_type?.name} />
              <Field label={pick(TL.section)} value={c.violation_type?.section} />
              <Field label={pick(TL.date)} value={formatDateTime(c.violation_date)} />
              <Field label={pick(TL.location)} value={c.violation_location} />
              {c.violation_latitude !== undefined && c.violation_longitude !== undefined && (
                <Field label="GPS" value={`${c.violation_latitude}, ${c.violation_longitude}`} mono />
              )}
              <Field
                label={pick(TL.issuedBy)}
                value={joinOpt(c.issuing_officer_name, c.issuing_officer_badge)}
              />
              {c.violation_description && (
                <Field label={pick(TL.details)} value={c.violation_description} className="sm:col-span-2" />
              )}
              {c.dispute_filed && (
                <Field
                  label={pick(TL.disputeReason)}
                  value={joinOpt(c.dispute_reason, c.dispute_date ? formatDate(c.dispute_date) : undefined)}
                  className="sm:col-span-2"
                />
              )}
            </dl>
          </Panel>

          <Panel title={pick(TL.fine)}>
            <dl className="space-y-3">
              <Field label={pick(TL.original)} value={rupees(c.original_fine_amount)} />
              {c.discount_amount > 0 && <Field label={pick(TL.discount)} value={rupees(c.discount_amount)} />}
              {c.penalty_amount > 0 && <Field label={pick(TL.penalty)} value={rupees(c.penalty_amount)} />}
              <Field label={pick(TL.finalAmount)} value={<span className="font-semibold">{rupees(c.final_amount)}</span>} />
              {c.payment_due_date && <Field label={pick(TL.due)} value={formatDate(c.payment_due_date)} />}
              {c.payment_date && <Field label={pick(TL.paidOn)} value={formatDateTime(c.payment_date)} />}
              {c.payment_reference && <Field label={pick(TL.reference)} value={c.payment_reference} mono />}
            </dl>
          </Panel>

          <Panel title={pick(TL.vehicleDetails)} className="lg:col-span-3">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={pick(TL.vehicle)} value={c.vehicle_number} mono />
              <Field label={pick(TL.type)} value={pick(VEHICLE_TYPE_LABEL[c.vehicle_type])} />
              <Field label={pick(TL.make)} value={joinOpt(c.vehicle_make, c.vehicle_model, c.vehicle_color)} />
              <Field label={pick(TL.owner)} value={joinOpt(c.owner_name, c.owner_phone)} />
              <Field label={pick(TL.driver)} value={joinOpt(c.driver_name, c.driver_phone)} />
              <Field label={pick(TL.licence)} value={c.driver_license_number} mono />
            </dl>
          </Panel>
        </div>
      </div>

      <Modal isOpen={dialog === "status"} onClose={close} title={pick(TL.changeStatus)} description={c.challan_number}>
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {pick(TL.newStatus)}
            <select
              className="h-10 rounded-md border border-border bg-background-secondary px-3 text-sm text-foreground"
              value={next}
              onChange={(e) => setNext(e.target.value as ChallanStatus | "")}
            >
              <option value="">—</option>
              {options.map((s) => (
                <option key={s} value={s}>
                  {pick(STATUS_LABEL[s])}
                </option>
              ))}
            </select>
          </label>
          {next && needsReference && (
            <Input label={`${pick(TL.referenceRequired)} *`} value={reference} onChange={(v: string) => setReference(v)} />
          )}
          {next && !needsReference && (
            <Textarea label={`${pick(TL.note)} *`} value={note} onChange={(v: string) => setNote(v)} rows={3} />
          )}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={close}>
            {pick(TL.cancel)}
          </Button>
          <Button onClick={saveStatus} disabled={!next || setStatus.isPending}>
            {setStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pick(TL.save)}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={dialog === "dispute"} onClose={close} title={pick(TL.recordDispute)} description={c.challan_number}>
        <Textarea label={`${pick(TL.disputeReason)} *`} value={note} onChange={(v: string) => setNote(v)} rows={4} />
        <ModalFooter>
          <Button variant="secondary" onClick={close}>
            {pick(TL.cancel)}
          </Button>
          <Button onClick={saveDispute} disabled={dispute.isPending}>
            {dispute.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pick(TL.recordDispute)}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
