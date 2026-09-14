"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Scale,
  User,
  Clock,
  Gavel,
  Printer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  IndianRupee,
  Shield,
  UserCheck,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { useAccusedForCase, useBailById, useSetBailStatus, useUpdateBail } from "@/hooks/use-bail";
import { ApiClientError } from "@/lib/api/client";
import { formatDate, formatDateTime } from "@/lib/utils";

const bailTypes = {
  REGULAR: { label: "Regular Bail", color: "info" },
  ANTICIPATORY: { label: "Anticipatory Bail", color: "warning" },
  INTERIM: { label: "Interim Bail", color: "secondary" },
};

const statusConfig = {
  PENDING: { label: "Pending", color: "warning", icon: Clock },
  APPROVED: { label: "Granted", color: "success", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "error", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "muted", icon: XCircle },
  RELEASED: { label: "Released", color: "info", icon: UserCheck },
};

/** A date input yields YYYY-MM-DD; the API's time.Time fields need RFC 3339. */
const toApiDate = (day: string) => `${day}T00:00:00Z`;

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className="text-foreground">{value ?? <span className="text-foreground-muted">Not recorded</span>}</p>
    </div>
  );
}

type Dialog = null | "grant" | "reject" | "cancel" | "release";

export default function BailDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: bail, isPending, isError, error, refetch } = useBailById(params.id);
  const accused = useAccusedForCase(bail?.accusedId ? bail.caseId : null);
  const updateBail = useUpdateBail();
  const setStatus = useSetBailStatus();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState("");
  const [order, setOrder] = useState({
    judge: "",
    bailAmount: "",
    suretyAmount: "",
    conditions: "",
    validUntil: "",
    orderSummary: "",
  });

  const canEdit = user && hasMinimumRole(user.role, "SI");
  const busy = updateBail.isPending || setStatus.isPending;

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96 gap-3 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading bail application…
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiClientError && error.code === 404;
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-2">
          <AlertTriangle className="h-12 w-12 text-warning mb-2" />
          <h2 className="text-xl font-bold text-foreground">
            {notFound ? "Application Not Found" : "Bail application could not be loaded"}
          </h2>
          <p className="text-foreground-muted mb-2">
            {notFound ? "The requested bail application does not exist." : error.message}
          </p>
          <div className="flex gap-2">
            {!notFound && (
              <Button variant="secondary" onClick={() => refetch()}>
                Try again
              </Button>
            )}
            <Link href="/bail">
              <Button>Back to Bail Applications</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const typeConfig = bailTypes[bail.bailType];
  const status = statusConfig[bail.status];
  const StatusIcon = status.icon;
  const accusedRecord = accused.data?.find((a) => a.id === bail.accusedId);
  const charges = bail.charges ?? [];
  const conditions = bail.conditions ?? [];

  // Built only from dates stored on the record — nothing is inferred.
  const timeline = [
    { date: bail.applicationDate, event: "Application filed", details: `${typeConfig.label} application before ${bail.court}` },
    bail.hearingDate && { date: bail.hearingDate, event: "Hearing listed", details: "Hearing date recorded" },
    bail.approvalDate && { date: bail.approvalDate, event: "Bail granted", details: bail.judge ? `Order by ${bail.judge}` : "Grant recorded" },
    bail.rejectionDate && { date: bail.rejectionDate, event: "Bail rejected", details: bail.rejectionReason ?? "Rejection recorded" },
    bail.releaseDate && { date: bail.releaseDate, event: "Released", details: "Release recorded" },
    bail.cancellationDate && { date: bail.cancellationDate, event: "Bail cancelled", details: bail.cancellationReason ?? "Cancellation recorded" },
  ]
    .filter((e): e is { date: string; event: string; details: string } => Boolean(e))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const closeDialog = () => {
    setDialog(null);
    setReason("");
  };

  const openGrant = () => {
    setOrder({
      judge: bail.judge ?? "",
      bailAmount: bail.bailAmount?.toString() ?? bail.proposedBailAmount?.toString() ?? "",
      suretyAmount: bail.suretyAmount?.toString() ?? "",
      conditions: conditions.join("\n"),
      validUntil: bail.validUntil?.split("T")[0] ?? "",
      orderSummary: bail.orderSummary ?? "",
    });
    setDialog("grant");
  };

  const parseAmount = (value: string, label: string): number | null | false => {
    if (!value) return null;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) {
      toast.error("Validation Error", `${label} must be a whole number of rupees`);
      return false;
    }
    return n;
  };

  const recordGrant = async () => {
    const bailAmount = parseAmount(order.bailAmount, "Bail amount");
    const suretyAmount = parseAmount(order.suretyAmount, "Surety amount");
    if (bailAmount === false || suretyAmount === false) return;

    // Two writes: the order's particulars, then the status (which stamps the
    // approval date server-side). If the second fails the particulars are kept
    // and the application stays pending — the officer is told which.
    try {
      await updateBail.mutateAsync({
        bail,
        changes: {
          judge: order.judge || null,
          bailAmount,
          suretyAmount,
          conditions: order.conditions.split("\n").map((c) => c.trim()).filter(Boolean),
          validUntil: order.validUntil ? toApiDate(order.validUntil) : null,
          orderSummary: order.orderSummary || null,
        },
      });
    } catch (err) {
      toast.error("Order not recorded", err instanceof Error ? err.message : "The server rejected the request");
      return;
    }
    try {
      await setStatus.mutateAsync({ id: bail.id, status: "APPROVED" });
      toast.success("Bail Granted", `${bail.applicationNumber} recorded as granted`);
      closeDialog();
    } catch (err) {
      toast.error(
        "Order saved, status not changed",
        err instanceof Error ? err.message : "The application is still pending"
      );
    }
  };

  const recordStatus = async (next: "REJECTED" | "CANCELLED" | "RELEASED", done: string) => {
    if (next !== "RELEASED" && !reason.trim()) {
      toast.error("Validation Error", "Record the reason given by the court");
      return;
    }
    try {
      await setStatus.mutateAsync({ id: bail.id, status: next, reason: reason.trim() || undefined });
      toast.success(done, `${bail.applicationNumber} has been updated`);
      closeDialog();
    } catch (err) {
      toast.error("Status not changed", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{bail.applicationNumber}</h1>
                <Badge variant={typeConfig.color as any}>{typeConfig.label}</Badge>
                <Badge variant={status.color as any}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-foreground-muted">Accused: {bail.accused || "Not linked"}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Accused
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bail.accusedId ? (
                  <div className="flex gap-6">
                    <div className="h-24 w-24 bg-background-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="h-10 w-10 text-foreground-muted" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <Field label="Name" value={bail.accused || accusedRecord?.name} />
                      {accused.isPending && bail.caseId ? (
                        <p className="text-sm text-foreground-muted">Loading accused record…</p>
                      ) : accused.isError ? (
                        <p className="text-sm text-error">Accused record could not be loaded</p>
                      ) : (
                        <>
                          <Field label="Age" value={accusedRecord?.age != null ? `${accusedRecord.age} years` : null} />
                          <Field label="Gender" value={accusedRecord?.gender} />
                          <Field label="Custody Status" value={accusedRecord?.status} />
                          <div className="col-span-2">
                            <Field label="Address" value={accusedRecord?.address} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground-muted">This application is not linked to an accused record.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Charges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {charges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {charges.map((charge) => (
                      <span key={charge} className="px-3 py-1 text-sm rounded-full bg-error/10 text-error">
                        {charge}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground-muted">No charges recorded</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Case Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bail.caseId || bail.firId ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-background-tertiary rounded-lg">
                      <p className="text-sm text-foreground-muted">FIR Number</p>
                      {bail.firId ? (
                        <Link href={`/fir/${bail.firId}`} className="text-accent hover:underline font-mono">
                          {bail.firNumber || "View FIR"}
                        </Link>
                      ) : (
                        <p className="text-foreground-muted">Not linked</p>
                      )}
                    </div>
                    <div className="p-4 bg-background-tertiary rounded-lg">
                      <p className="text-sm text-foreground-muted">Case Number</p>
                      {bail.caseId ? (
                        <Link href={`/cases/${bail.caseId}`} className="text-accent hover:underline font-mono">
                          {bail.caseNumber || "View case"}
                        </Link>
                      ) : (
                        <p className="text-foreground-muted">Not linked</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground-muted">This application is not linked to a case or FIR.</p>
                )}
              </CardContent>
            </Card>

            {(conditions.length > 0 || bail.orderSummary || bail.validUntil) && (
              <Card className="border-success/30 bg-success/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    Court Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conditions.length > 0 && (
                    <ul className="space-y-2">
                      {conditions.map((condition, index) => (
                        <li key={index} className="flex items-start gap-2 text-foreground">
                          <div className="h-2 w-2 mt-2 rounded-full bg-success flex-shrink-0"></div>
                          {condition}
                        </li>
                      ))}
                    </ul>
                  )}
                  {bail.validUntil && <Field label="Valid Until" value={formatDate(bail.validUntil)} />}
                  {bail.orderSummary && (
                    <div className="pt-4 border-t border-success/20">
                      <p className="text-sm text-foreground-muted">Order Summary</p>
                      <p className="text-foreground">{bail.orderSummary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {bail.rejectionReason && (
              <Card className="border-error/30 bg-error/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-error">
                    <XCircle className="h-5 w-5" />
                    Rejection Reason
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{bail.rejectionReason}</p>
                </CardContent>
              </Card>
            )}

            {bail.cancellationReason && (
              <Card className="border-error/30 bg-error/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-error">
                    <XCircle className="h-5 w-5" />
                    Cancellation Reason
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{bail.cancellationReason}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Application Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border"></div>
                  <div className="space-y-6">
                    {timeline.map((entry) => (
                      <div key={entry.event} className="relative pl-8">
                        <div className="absolute left-0 top-0 h-4 w-4 rounded-full bg-accent border-2 border-background"></div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{entry.event}</span>
                            <span className="text-xs text-foreground-muted">{formatDate(entry.date)}</span>
                          </div>
                          <p className="text-sm text-foreground-muted">{entry.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Court Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Court" value={bail.court} />
                <Field label="Judge" value={bail.judge} />
                <Field label="Application Date" value={formatDate(bail.applicationDate)} />
                <Field label="Hearing Date" value={bail.hearingDate ? formatDate(bail.hearingDate) : null} />
                <Field label="Last Updated" value={formatDateTime(bail.updatedAt)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Bail Amount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-muted">Proposed Amount</p>
                  <p className="text-2xl font-bold text-foreground">
                    {bail.proposedBailAmount !== null ? rupees(bail.proposedBailAmount) : "—"}
                  </p>
                </div>
                {bail.bailAmount !== null && (
                  <div>
                    <p className="text-sm text-foreground-muted">Granted Amount</p>
                    <p className="text-2xl font-bold text-success">{rupees(bail.bailAmount)}</p>
                  </div>
                )}
                {bail.suretyAmount !== null && (
                  <Field label="Surety Amount" value={rupees(bail.suretyAmount)} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Legal Counsel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-foreground">
                  {bail.lawyer ?? <span className="text-foreground-muted font-normal">Not recorded</span>}
                </p>
              </CardContent>
            </Card>

            {bail.status === "PENDING" && canEdit && (
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader>
                  <CardTitle className="text-warning">Record Court Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" onClick={openGrant} disabled={busy}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Record Bail Granted
                  </Button>
                  <Button variant="secondary" className="w-full text-error" onClick={() => setDialog("reject")} disabled={busy}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Record Bail Rejected
                  </Button>
                </CardContent>
              </Card>
            )}

            {bail.status === "APPROVED" && canEdit && (
              <Card className="border-success/30 bg-success/5">
                <CardHeader>
                  <CardTitle className="text-success">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" onClick={() => setDialog("release")} disabled={busy}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Mark as Released
                  </Button>
                  <Button variant="secondary" className="w-full text-error" onClick={() => setDialog("cancel")} disabled={busy}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Record Bail Cancelled
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={dialog === "grant"}
        onClose={closeDialog}
        title="Record bail granted"
        description="Enter the particulars of the court's order. They are saved to the application before its status changes."
        size="lg"
      >
        <div className="space-y-4">
          <Input label="Judge / Magistrate" value={order.judge} onChange={(v: string) => setOrder({ ...order, judge: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bail Amount (₹)"
              type="number"
              value={order.bailAmount}
              onChange={(v: string) => setOrder({ ...order, bailAmount: v })}
            />
            <Input
              label="Surety Amount (₹)"
              type="number"
              value={order.suretyAmount}
              onChange={(v: string) => setOrder({ ...order, suretyAmount: v })}
            />
          </div>
          <Textarea
            label="Conditions (one per line)"
            rows={4}
            value={order.conditions}
            onChange={(v: string) => setOrder({ ...order, conditions: v })}
          />
          <Input
            label="Valid Until"
            type="date"
            value={order.validUntil}
            onChange={(v: string) => setOrder({ ...order, validUntil: v })}
          />
          <Textarea
            label="Order Summary"
            rows={3}
            value={order.orderSummary}
            onChange={(v: string) => setOrder({ ...order, orderSummary: v })}
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={closeDialog}>
            Cancel
          </Button>
          <Button onClick={recordGrant} disabled={busy}>
            {busy ? "Recording..." : "Record Grant"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={dialog === "reject" || dialog === "cancel"}
        onClose={closeDialog}
        title={dialog === "reject" ? "Record bail rejected" : "Record bail cancelled"}
        description={`${bail.applicationNumber} — record the reason given by the court. The change is recorded in the audit trail.`}
      >
        <Textarea
          label="Reason *"
          rows={4}
          value={reason}
          onChange={(v: string) => setReason(v)}
        />
        <ModalFooter>
          <Button variant="secondary" onClick={closeDialog}>
            Go Back
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() =>
              dialog === "reject"
                ? recordStatus("REJECTED", "Bail Rejected")
                : recordStatus("CANCELLED", "Bail Cancelled")
            }
          >
            {dialog === "reject" ? "Record Rejection" : "Record Cancellation"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={dialog === "release"}
        onClose={closeDialog}
        title="Mark as released?"
        description={`${bail.accused || "The accused"} will be recorded as released on bail today under ${bail.applicationNumber}.`}
      >
        <ModalFooter>
          <Button variant="secondary" onClick={closeDialog}>
            Go Back
          </Button>
          <Button disabled={busy} onClick={() => recordStatus("RELEASED", "Release Recorded")}>
            Mark Released
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
