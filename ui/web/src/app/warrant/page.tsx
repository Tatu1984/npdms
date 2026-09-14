"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileWarning,
  Search,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  MapPin,
  Gavel,
  Eye,
  Printer,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { LegacySelect as Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { useCreateWarrant, useWarrants, useWarrantStats } from "@/hooks/use-warrants";
import { casesApi } from "@/lib/api/cases";
import type { WarrantPriority, WarrantStatus, WarrantType } from "@/lib/api/warrants";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

const warrantTypes = {
  ARREST: { label: "Arrest Warrant", color: "error" },
  SEARCH: { label: "Search Warrant", color: "warning" },
  SUMMONS: { label: "Summons", color: "info" },
  NBW: { label: "Non-Bailable Warrant", color: "error" },
};

const statusConfig = {
  ACTIVE: { label: "Active", color: "warning", icon: Clock },
  EXECUTED: { label: "Executed", color: "success", icon: CheckCircle },
  EXPIRED: { label: "Expired", color: "muted", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "error", icon: XCircle },
};

const warrantTypeOptions = [
  { value: "ARREST", label: "Arrest Warrant" },
  { value: "SEARCH", label: "Search Warrant" },
  { value: "SUMMONS", label: "Summons" },
  { value: "NBW", label: "Non-Bailable Warrant" },
];

const priorityOptions = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

/** A date input yields YYYY-MM-DD; the API's time.Time fields need RFC 3339. */
const toApiDate = (day: string) => `${day}T00:00:00Z`;

const emptyForm = () => ({
  type: "ARREST" as WarrantType,
  issuedFor: "",
  caseId: "",
  firId: "",
  caseLabel: "",
  issuedBy: "",
  judgeName: "",
  issuedDate: new Date().toISOString().split("T")[0],
  validUntil: "",
  charges: "",
  lastKnownLocation: "",
  priority: "MEDIUM" as WarrantPriority,
  description: "",
});

export default function WarrantPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const search = useDeferredValue(searchQuery.trim());
  const [filterType, setFilterType] = useState<"ALL" | WarrantType>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | WarrantStatus>("ALL");
  const [page, setPage] = useState(1);
  const [showNewWarrantModal, setShowNewWarrantModal] = useState(false);
  const [newWarrant, setNewWarrant] = useState(emptyForm);
  const [caseSearch, setCaseSearch] = useState("");
  const deferredCaseSearch = useDeferredValue(caseSearch.trim());

  const warrants = useWarrants({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    type: filterType === "ALL" ? undefined : filterType,
    status: filterStatus === "ALL" ? undefined : filterStatus,
  });
  const stats = useWarrantStats();
  const createWarrant = useCreateWarrant();

  const caseResults = useQuery({
    queryKey: ["cases", "picker", deferredCaseSearch],
    queryFn: () => casesApi.list({ search: deferredCaseSearch || undefined, pageSize: 8 }),
    enabled: showNewWarrantModal && !newWarrant.caseId,
  });

  const canCreate = user && hasMinimumRole(user.role, "SI");
  const rows = warrants.data?.data ?? [];
  const totalPages = warrants.data?.totalPages ?? 0;

  const setStatusFilter = (status: "ALL" | WarrantStatus) => {
    setFilterStatus((current) => (current === status ? "ALL" : status));
    setPage(1);
  };

  const closeModal = () => {
    setShowNewWarrantModal(false);
    setNewWarrant(emptyForm());
    setCaseSearch("");
  };

  const handleCreateWarrant = async () => {
    if (!newWarrant.issuedFor || !newWarrant.caseId || !newWarrant.issuedBy || !newWarrant.validUntil) {
      toast.error("Validation Error", "Please fill in all required fields");
      return;
    }
    if (newWarrant.validUntil < newWarrant.issuedDate) {
      toast.error("Validation Error", "Valid Until cannot be before the issue date");
      return;
    }

    try {
      const warrant = await createWarrant.mutateAsync({
        type: newWarrant.type,
        issuedFor: newWarrant.issuedFor,
        caseId: newWarrant.caseId,
        firId: newWarrant.firId || null,
        issuedBy: newWarrant.issuedBy,
        judgeName: newWarrant.judgeName || null,
        issuedDate: toApiDate(newWarrant.issuedDate),
        validUntil: toApiDate(newWarrant.validUntil),
        charges: newWarrant.charges.split(",").map((c) => c.trim()).filter(Boolean),
        lastKnownLocation: newWarrant.lastKnownLocation || null,
        priority: newWarrant.priority,
        description: newWarrant.description || null,
      });
      toast.success("Warrant Created", `Warrant ${warrant.warrantNumber} has been recorded`);
      closeModal();
    } catch (error) {
      toast.error("Warrant not created", error instanceof Error ? error.message : "The server rejected the request");
    }
  };

  const statCards: Array<{
    key: "ALL" | WarrantStatus;
    label: string;
    value: number | undefined;
    icon: typeof FileWarning;
    /** Literal class names: Tailwind cannot see names assembled at runtime. */
    card: string;
    selected: string;
    iconWrap: string;
    iconColor: string;
  }> = [
    { key: "ALL", label: "Total Warrants", value: stats.data?.total, icon: FileWarning, card: "hover:border-accent/50", selected: "border-accent ring-1 ring-accent", iconWrap: "bg-accent/10", iconColor: "text-accent" },
    { key: "ACTIVE", label: "Active", value: stats.data?.active, icon: Clock, card: "hover:border-warning/50", selected: "border-warning ring-1 ring-warning", iconWrap: "bg-warning/10", iconColor: "text-warning" },
    { key: "EXECUTED", label: "Executed", value: stats.data?.executed, icon: CheckCircle, card: "hover:border-success/50", selected: "border-success ring-1 ring-success", iconWrap: "bg-success/10", iconColor: "text-success" },
    { key: "EXPIRED", label: "Expired", value: stats.data?.expired, icon: AlertTriangle, card: "hover:border-error/50", selected: "border-error ring-1 ring-error", iconWrap: "bg-error/10", iconColor: "text-error" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Warrant Management</h1>
            <p className="text-foreground-muted">
              Track and manage arrest warrants, search warrants, and summons
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowNewWarrantModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Warrant
            </Button>
          )}
        </div>

        {/* Stats — counts come from the server, not from the page of rows loaded */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ key, label, value, icon: Icon, card, selected, iconWrap, iconColor }) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${card} ${filterStatus === key ? selected : ""}`}
              onClick={() => (key === "ALL" ? (setFilterStatus("ALL"), setPage(1)) : setStatusFilter(key))}
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

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[16rem]">
                <Input
                  placeholder="Search by warrant number or name..."
                  value={searchQuery}
                  onChange={(v: string) => {
                    setSearchQuery(v);
                    setPage(1);
                  }}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as "ALL" | WarrantType);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Types</option>
                <option value="ARREST">Arrest Warrant</option>
                <option value="SEARCH">Search Warrant</option>
                <option value="SUMMONS">Summons</option>
                <option value="NBW">Non-Bailable</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as "ALL" | WarrantStatus);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="EXECUTED">Executed</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Warrant List */}
        {warrants.isPending ? (
          <Card>
            <CardContent className="p-12 flex items-center justify-center gap-3 text-foreground-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading warrants…
            </CardContent>
          </Card>
        ) : warrants.isError ? (
          <Card className="border-error/30">
            <CardContent className="p-12 text-center space-y-3">
              <AlertTriangle className="h-12 w-12 text-error mx-auto" />
              <h3 className="text-lg font-medium text-foreground">Warrants could not be loaded</h3>
              <p className="text-foreground-muted">{warrants.error.message}</p>
              <Button variant="secondary" onClick={() => warrants.refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileWarning className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No warrants found</h3>
              <p className="text-foreground-muted">
                {search || filterType !== "ALL" || filterStatus !== "ALL"
                  ? "Try adjusting your search or filter criteria"
                  : "No warrants have been recorded yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((warrant) => {
              const typeConfig = warrantTypes[warrant.type];
              const status = statusConfig[warrant.status];
              const StatusIcon = status.icon;

              return (
                <Card key={warrant.id} className="hover:border-accent/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-${typeConfig.color}/10`}>
                          <FileWarning className={`h-6 w-6 text-${typeConfig.color}`} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-bold text-foreground">{warrant.warrantNumber}</span>
                            <Badge variant={typeConfig.color as any}>{typeConfig.label}</Badge>
                            <Badge variant={status.color as any}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                            {(warrant.priority === "HIGH" || warrant.priority === "CRITICAL") && (
                              <Badge variant="error">
                                {warrant.priority === "CRITICAL" ? "Critical" : "High"} Priority
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-foreground-muted" />
                            <span className="text-foreground">{warrant.issuedFor}</span>
                          </div>
                          {(warrant.caseNumber || warrant.firNumber) && (
                            <div className="flex items-center gap-4 text-sm text-foreground-muted">
                              {warrant.caseNumber && <span>Case: {warrant.caseNumber}</span>}
                              {warrant.firNumber && <span>FIR: {warrant.firNumber}</span>}
                            </div>
                          )}
                          {warrant.issuedBy && (
                            <div className="flex items-center gap-2 text-sm text-foreground-muted">
                              <Gavel className="h-4 w-4" />
                              <span>{warrant.issuedBy}</span>
                            </div>
                          )}
                          {warrant.charges.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              {warrant.charges.map((charge) => (
                                <span
                                  key={charge}
                                  className="px-2 py-0.5 text-xs rounded bg-background-tertiary text-foreground-muted"
                                >
                                  {charge}
                                </span>
                              ))}
                            </div>
                          )}
                          {warrant.lastKnownLocation && (
                            <div className="flex items-center gap-2 text-sm text-foreground-muted">
                              <MapPin className="h-4 w-4" />
                              <span>Last Known: {warrant.lastKnownLocation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-sm text-foreground-muted">
                          <div className="flex items-center gap-2 justify-end">
                            <Calendar className="h-4 w-4" />
                            Issued: {formatDate(warrant.issuedDate)}
                          </div>
                          {warrant.validUntil && (
                            <div className="mt-1">Valid Until: {formatDate(warrant.validUntil)}</div>
                          )}
                          {warrant.executedDate && (
                            <div className="mt-1 text-success">Executed: {formatDate(warrant.executedDate)}</div>
                          )}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Link href={`/warrant/${warrant.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-foreground-muted">
                <span>
                  Page {page} of {totalPages} · {warrants.data?.total} warrants
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

      {/* Record Warrant Modal */}
      <Modal
        isOpen={showNewWarrantModal}
        onClose={closeModal}
        title="Record Warrant"
        description="Record a warrant issued by a court against a case"
        size="lg"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">
              Warrant Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Warrant Type *"
                value={newWarrant.type}
                onChange={(v: string) => setNewWarrant({ ...newWarrant, type: v as WarrantType })}
                options={warrantTypeOptions}
              />
              <Select
                label="Priority *"
                value={newWarrant.priority}
                onChange={(v: string) => setNewWarrant({ ...newWarrant, priority: v as WarrantPriority })}
                options={priorityOptions}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">
              Subject Information
            </h3>
            <Input
              label="Issued For (Person/Premises) *"
              placeholder="Name of accused or address of premises"
              value={newWarrant.issuedFor}
              onChange={(v: string) => setNewWarrant({ ...newWarrant, issuedFor: v })}
            />
            <Input
              label="Last Known Location"
              placeholder="Address or area"
              value={newWarrant.lastKnownLocation}
              onChange={(v: string) => setNewWarrant({ ...newWarrant, lastKnownLocation: v })}
              icon={<MapPin className="h-4 w-4" />}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">
              Case Reference
            </h3>
            {newWarrant.caseId ? (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-foreground font-mono text-sm">{newWarrant.caseLabel}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewWarrant({ ...newWarrant, caseId: "", firId: "", caseLabel: "" })}
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
                          setNewWarrant({
                            ...newWarrant,
                            caseId: c.id,
                            firId: c.firId,
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
            <Input
              label="Charges (comma separated)"
              placeholder="BNS 309, BNS 310"
              value={newWarrant.charges}
              onChange={(v: string) => setNewWarrant({ ...newWarrant, charges: v })}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">
              Court Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Issuing Court *"
                placeholder="Court of the Chief Metropolitan Magistrate, Kolkata"
                value={newWarrant.issuedBy}
                onChange={(v: string) => setNewWarrant({ ...newWarrant, issuedBy: v })}
                icon={<Gavel className="h-4 w-4" />}
              />
              <Input
                label="Judge / Magistrate"
                value={newWarrant.judgeName}
                onChange={(v: string) => setNewWarrant({ ...newWarrant, judgeName: v })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Issue Date *"
                type="date"
                value={newWarrant.issuedDate}
                onChange={(v: string) => setNewWarrant({ ...newWarrant, issuedDate: v })}
              />
              <Input
                label="Valid Until *"
                type="date"
                value={newWarrant.validUntil}
                onChange={(v: string) => setNewWarrant({ ...newWarrant, validUntil: v })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">
              Additional Notes
            </h3>
            <Textarea
              label="Description / Notes"
              placeholder="Additional details about the warrant..."
              value={newWarrant.description}
              onChange={(v: string) => setNewWarrant({ ...newWarrant, description: v })}
              rows={3}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleCreateWarrant} disabled={createWarrant.isPending}>
            {createWarrant.isPending ? "Recording..." : "Record Warrant"}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
