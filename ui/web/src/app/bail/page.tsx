"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Scale,
  Search,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  User,
  IndianRupee,
  Printer,
  UserCheck,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { LegacySelect as Select } from "@/components/ui/select";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { useAccusedForCase, useBail, useBailStats, useCreateBail } from "@/hooks/use-bail";
import { casesApi } from "@/lib/api/cases";
import type { Bail, BailStatus, BailType } from "@/lib/api/bail";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

const statusConfig = {
  PENDING: { label: "Pending", color: "warning", icon: Clock },
  APPROVED: { label: "Approved", color: "success", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "error", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "error", icon: XCircle },
  RELEASED: { label: "Released", color: "info", icon: UserCheck },
};

const bailTypes = {
  REGULAR: { label: "Regular Bail", color: "info" },
  ANTICIPATORY: { label: "Anticipatory Bail", color: "warning" },
  INTERIM: { label: "Interim Bail", color: "accent" },
};

const bailTypeOptions = [
  { value: "REGULAR", label: "Regular Bail" },
  { value: "ANTICIPATORY", label: "Anticipatory Bail" },
  { value: "INTERIM", label: "Interim Bail" },
];

/** A date input yields YYYY-MM-DD; the API's time.Time fields need RFC 3339. */
const toApiDate = (day: string) => `${day}T00:00:00Z`;

const emptyForm = () => ({
  caseId: "",
  firId: "",
  caseLabel: "",
  accusedId: "",
  charges: "",
  bailType: "REGULAR" as BailType,
  applicationDate: new Date().toISOString().split("T")[0],
  hearingDate: "",
  court: "",
  proposedBailAmount: "",
  lawyer: "",
});

export default function BailPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const search = useDeferredValue(searchQuery.trim());
  const [filterStatus, setFilterStatus] = useState<"ALL" | BailStatus>("ALL");
  const [page, setPage] = useState(1);
  const [selectedBail, setSelectedBail] = useState<Bail | null>(null);
  const [showNewBailModal, setShowNewBailModal] = useState(false);
  const [newBail, setNewBail] = useState(emptyForm);
  const [caseSearch, setCaseSearch] = useState("");
  const deferredCaseSearch = useDeferredValue(caseSearch.trim());

  const applications = useBail({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: filterStatus === "ALL" ? undefined : filterStatus,
  });
  const stats = useBailStats();
  const createBail = useCreateBail();

  const caseResults = useQuery({
    queryKey: ["cases", "picker", deferredCaseSearch],
    queryFn: () => casesApi.list({ search: deferredCaseSearch || undefined, pageSize: 8 }),
    enabled: showNewBailModal && !newBail.caseId,
  });
  const accusedOptions = useAccusedForCase(showNewBailModal ? newBail.caseId : null);

  const canProcess = user && hasMinimumRole(user.role, "SI");
  const rows = applications.data?.data ?? [];
  const totalPages = applications.data?.totalPages ?? 0;
  // The side panel shows the row as it is in the latest page, not a stale copy.
  const selected = selectedBail ? rows.find((b) => b.id === selectedBail.id) ?? selectedBail : null;

  const selectStatus = (status: "ALL" | BailStatus) => {
    setFilterStatus(status);
    setPage(1);
  };

  const closeModal = () => {
    setShowNewBailModal(false);
    setNewBail(emptyForm());
    setCaseSearch("");
  };

  const handleCreateBail = async () => {
    if (!newBail.caseId || !newBail.accusedId || !newBail.court || !newBail.applicationDate) {
      toast.error("Validation Error", "Please fill in all required fields");
      return;
    }
    if (newBail.hearingDate && newBail.hearingDate < newBail.applicationDate) {
      toast.error("Validation Error", "Hearing date cannot be before the application date");
      return;
    }
    const proposed = newBail.proposedBailAmount ? Number(newBail.proposedBailAmount) : null;
    if (proposed !== null && (!Number.isInteger(proposed) || proposed < 0)) {
      toast.error("Validation Error", "Proposed bail amount must be a whole number of rupees");
      return;
    }

    try {
      const bail = await createBail.mutateAsync({
        caseId: newBail.caseId,
        firId: newBail.firId || null,
        accusedId: newBail.accusedId,
        charges: newBail.charges.split(",").map((c) => c.trim()).filter(Boolean),
        bailType: newBail.bailType,
        applicationDate: toApiDate(newBail.applicationDate),
        hearingDate: newBail.hearingDate ? toApiDate(newBail.hearingDate) : null,
        court: newBail.court,
        proposedBailAmount: proposed,
        lawyer: newBail.lawyer || null,
      });
      toast.success("Application Recorded", `Bail application ${bail.applicationNumber} has been recorded`);
      closeModal();
    } catch (error) {
      toast.error("Application not recorded", error instanceof Error ? error.message : "The server rejected the request");
    }
  };

  const statCards: Array<{
    label: string;
    value: number | undefined;
    icon: typeof Scale;
    /** Only a card that corresponds to exactly one status can act as a filter. */
    filter?: "ALL" | BailStatus;
    /** Literal class names: Tailwind cannot see names assembled at runtime. */
    card: string;
    selected: string;
    iconWrap: string;
    iconColor: string;
  }> = [
    { label: "Total Applications", value: stats.data?.total, icon: Scale, filter: "ALL", card: "cursor-pointer hover:border-accent/50", selected: "border-accent ring-1 ring-accent", iconWrap: "bg-accent/10", iconColor: "text-accent" },
    { label: "Pending", value: stats.data?.pending, icon: Clock, filter: "PENDING", card: "cursor-pointer hover:border-warning/50", selected: "border-warning ring-1 ring-warning", iconWrap: "bg-warning/10", iconColor: "text-warning" },
    { label: "Approved/Released", value: stats.data?.approved, icon: CheckCircle, card: "", selected: "", iconWrap: "bg-success/10", iconColor: "text-success" },
    { label: "Rejected/Cancelled", value: stats.data?.rejected, icon: XCircle, card: "", selected: "", iconWrap: "bg-error/10", iconColor: "text-error" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bail Processing</h1>
            <p className="text-foreground-muted">Record bail applications and the court&apos;s decisions on them</p>
          </div>
          {canProcess && (
            <Button onClick={() => setShowNewBailModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record New Application
            </Button>
          )}
        </div>

        {/* Stats — counts come from the server, not from the page of rows loaded */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, filter, card, selected: selectedClass, iconWrap, iconColor }) => (
            <Card
              key={label}
              className={`transition-all ${card} ${filter && filterStatus === filter ? selectedClass : ""}`}
              onClick={filter ? () => selectStatus(filterStatus === filter ? "ALL" : filter) : undefined}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${iconWrap}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.isError ? "—" : value ?? <Loader2 className="h-5 w-5 animate-spin" />}
                    </p>
                    <p className="text-xs text-foreground-muted">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[16rem]">
                    <Input
                      placeholder="Search by application number..."
                      value={searchQuery}
                      onChange={(v: string) => {
                        setSearchQuery(v);
                        setPage(1);
                      }}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => selectStatus(e.target.value as "ALL" | BailStatus)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="RELEASED">Released</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {applications.isPending ? (
              <Card>
                <CardContent className="p-12 flex items-center justify-center gap-3 text-foreground-muted">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading bail applications…
                </CardContent>
              </Card>
            ) : applications.isError ? (
              <Card className="border-error/30">
                <CardContent className="p-12 text-center space-y-3">
                  <AlertTriangle className="h-12 w-12 text-error mx-auto" />
                  <h3 className="text-lg font-medium text-foreground">Bail applications could not be loaded</h3>
                  <p className="text-foreground-muted">{applications.error.message}</p>
                  <Button variant="secondary" onClick={() => applications.refetch()}>
                    Try again
                  </Button>
                </CardContent>
              </Card>
            ) : rows.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Scale className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No bail applications found</h3>
                  <p className="text-foreground-muted">
                    {search || filterStatus !== "ALL"
                      ? "Try adjusting your search or filter criteria"
                      : "No bail applications have been recorded yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rows.map((bail) => {
                  const status = statusConfig[bail.status];
                  const type = bailTypes[bail.bailType];
                  const StatusIcon = status.icon;
                  const amount = bail.bailAmount ?? bail.proposedBailAmount;

                  return (
                    <Card
                      key={bail.id}
                      className={`cursor-pointer transition-colors ${
                        selected?.id === bail.id ? "border-accent" : "hover:border-accent/50"
                      }`}
                      onClick={() => setSelectedBail(bail)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-bold text-foreground">{bail.applicationNumber}</span>
                              <Badge variant={type.color as any}>{type.label}</Badge>
                              <Badge variant={status.color as any}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-foreground-muted" />
                              <span className="text-foreground">
                                {bail.accused || <span className="text-foreground-muted">Accused not linked</span>}
                              </span>
                            </div>
                            {(bail.caseNumber || bail.firNumber) && (
                              <div className="text-sm text-foreground-muted">
                                {[bail.caseNumber, bail.firNumber].filter(Boolean).join(" | ")}
                              </div>
                            )}
                            {bail.charges && bail.charges.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2">
                                {bail.charges.map((charge) => (
                                  <span
                                    key={charge}
                                    className="px-2 py-0.5 text-xs rounded bg-background-tertiary text-foreground-muted"
                                  >
                                    {charge}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm text-foreground-muted">
                            <div>Applied: {formatDate(bail.applicationDate)}</div>
                            {bail.hearingDate && <div>Hearing: {formatDate(bail.hearingDate)}</div>}
                            {amount !== null && (
                              <div className="flex items-center gap-1 justify-end mt-2 text-foreground">
                                <IndianRupee className="h-3 w-3" />
                                {amount.toLocaleString("en-IN")}
                                {bail.bailAmount === null && <span className="text-foreground-muted">(proposed)</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between text-sm text-foreground-muted">
                    <span>
                      Page {page} of {totalPages} · {applications.data?.total} applications
                    </span>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detail Panel — read-only summary; decisions are recorded on the full record */}
          <div>
            {selected ? (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Bail Details</span>
                    <Button variant="ghost" size="sm" onClick={() => window.print()}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href={`/bail/${selected.id}`} className="block">
                    <Button className="w-full" variant="secondary">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {canProcess && (selected.status === "PENDING" || selected.status === "APPROVED")
                        ? "Open to Record Decision"
                        : "View Full Details"}
                    </Button>
                  </Link>

                  <div>
                    <p className="text-sm text-foreground-muted">Application Number</p>
                    <p className="font-medium text-foreground">{selected.applicationNumber}</p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground-muted">Accused</p>
                    <p className="font-medium text-foreground">{selected.accused || "Not linked"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground-muted">Court</p>
                    <p className="text-foreground">{selected.court}</p>
                  </div>

                  {selected.judge && (
                    <div>
                      <p className="text-sm text-foreground-muted">Judge</p>
                      <p className="text-foreground">{selected.judge}</p>
                    </div>
                  )}

                  {selected.bailAmount !== null && (
                    <div>
                      <p className="text-sm text-foreground-muted">Bail Amount</p>
                      <p className="text-lg font-bold text-foreground flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {selected.bailAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}

                  {selected.suretyAmount !== null && (
                    <div>
                      <p className="text-sm text-foreground-muted">Surety Amount</p>
                      <p className="text-foreground flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {selected.suretyAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}

                  {selected.conditions && selected.conditions.length > 0 && (
                    <div>
                      <p className="text-sm text-foreground-muted mb-2">Bail Conditions</p>
                      <ul className="space-y-1">
                        {selected.conditions.map((condition, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-accent">•</span>
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.rejectionReason && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                      <p className="text-sm text-error font-medium">Rejection Reason</p>
                      <p className="text-sm text-foreground-muted mt-1">{selected.rejectionReason}</p>
                    </div>
                  )}

                  {selected.cancellationReason && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                      <p className="text-sm text-error font-medium">Cancellation Reason</p>
                      <p className="text-sm text-foreground-muted mt-1">{selected.cancellationReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Scale className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                  <p className="text-foreground-muted">Select a bail application to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* New Bail Application Modal */}
      <Modal
        isOpen={showNewBailModal}
        onClose={closeModal}
        title="Record New Bail Application"
        description="Record a bail application submitted to court against a case"
        size="lg"
      >
        <div className="space-y-4">
          {/* Case — the accused list depends on it */}
          {newBail.caseId ? (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-foreground font-mono text-sm">{newBail.caseLabel}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewBail({ ...newBail, caseId: "", firId: "", caseLabel: "", accusedId: "" })}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                label="Case *"
                placeholder="Search by case number or title"
                value={caseSearch}
                onChange={setCaseSearch}
                icon={<Search className="h-4 w-4" />}
              />
              <div className="rounded-lg border border-border divide-y divide-border max-h-48 overflow-y-auto">
                {caseResults.isPending ? (
                  <p className="p-3 text-sm text-foreground-muted">Searching cases…</p>
                ) : caseResults.isError ? (
                  <p className="p-3 text-sm text-error">Cases could not be loaded: {caseResults.error.message}</p>
                ) : caseResults.data.data.length === 0 ? (
                  <p className="p-3 text-sm text-foreground-muted">No matching cases</p>
                ) : (
                  caseResults.data.data.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left p-3 hover:bg-background-tertiary"
                      onClick={() =>
                        setNewBail({
                          ...newBail,
                          caseId: c.id,
                          firId: c.firId,
                          accusedId: "",
                          caseLabel: [c.caseNumber, c.firNumber && `FIR ${c.firNumber}`, c.title]
                            .filter(Boolean)
                            .join(" · "),
                        })
                      }
                    >
                      <span className="font-mono text-sm text-foreground">{c.caseNumber}</span>
                      <span className="block text-xs text-foreground-muted">{c.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {newBail.caseId && (
            <div className="space-y-1">
              {accusedOptions.isPending ? (
                <p className="text-sm text-foreground-muted">Loading accused recorded against this case…</p>
              ) : accusedOptions.isError ? (
                <p className="text-sm text-error">Accused could not be loaded: {accusedOptions.error.message}</p>
              ) : accusedOptions.data.length === 0 ? (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-foreground">
                  No accused are recorded against this case. A bail application must name an accused from the case
                  record —{" "}
                  <Link href={`/cases/${newBail.caseId}`} className="text-accent hover:underline">
                    add the accused on the case
                  </Link>{" "}
                  first.
                </div>
              ) : (
                <Select
                  label="Accused *"
                  value={newBail.accusedId}
                  onChange={(v: string) => setNewBail({ ...newBail, accusedId: v })}
                  options={[
                    { value: "", label: "Select accused" },
                    ...accusedOptions.data.map((a) => ({
                      value: a.id,
                      label: a.alias ? `${a.name} (alias ${a.alias})` : a.name,
                    })),
                  ]}
                />
              )}
            </div>
          )}

          <Select
            label="Bail Type *"
            value={newBail.bailType}
            onChange={(v: string) => setNewBail({ ...newBail, bailType: v as BailType })}
            options={bailTypeOptions}
          />

          <Input
            label="Charges (comma separated)"
            placeholder="BNS 303, BNS 318"
            value={newBail.charges}
            onChange={(v: string) => setNewBail({ ...newBail, charges: v })}
          />

          <Input
            label="Court *"
            placeholder="City Sessions Court, Calcutta"
            value={newBail.court}
            onChange={(v: string) => setNewBail({ ...newBail, court: v })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Application Date *"
              type="date"
              value={newBail.applicationDate}
              onChange={(v: string) => setNewBail({ ...newBail, applicationDate: v })}
            />
            <Input
              label="Hearing Date"
              type="date"
              value={newBail.hearingDate}
              onChange={(v: string) => setNewBail({ ...newBail, hearingDate: v })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Proposed Bail Amount (₹)"
              type="number"
              placeholder="50000"
              value={newBail.proposedBailAmount}
              onChange={(v: string) => setNewBail({ ...newBail, proposedBailAmount: v })}
            />
            <Input
              label="Lawyer"
              placeholder="Adv. Name"
              value={newBail.lawyer}
              onChange={(v: string) => setNewBail({ ...newBail, lawyer: v })}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleCreateBail} disabled={createBail.isPending || !newBail.accusedId}>
            {createBail.isPending ? "Recording..." : "Record Application"}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
