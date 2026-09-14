"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { useFIRCounts, useFIRs } from "@/hooks/use-firs";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { exportToCSV } from "@/lib/utils/export";
import type { FIR, FIRPriority, FIRStatus } from "@/lib/api/firs";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "REGISTERED", label: "Registered" },
  { value: "UNDER_INVESTIGATION", label: "Under Investigation" },
  { value: "CHARGESHEET_FILED", label: "Chargesheet Filed" },
  { value: "CLOSED", label: "Closed" },
  { value: "TRANSFERRED", label: "Transferred" },
];

const priorityOptions = [
  { value: "", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const firStatusBadge: Record<FIRStatus, string> = {
  DRAFT: "secondary",
  REGISTERED: "registered",
  UNDER_INVESTIGATION: "investigating",
  CHARGESHEET_FILED: "chargesheet",
  CLOSED: "closed",
  TRANSFERRED: "transferred",
};

const firPriorityBadge: Record<FIRPriority, string> = {
  LOW: "low",
  MEDIUM: "normal",
  HIGH: "high",
  CRITICAL: "critical",
};

/** Columns exported are the fields the register holds, nothing inferred. */
const exportColumns: { key: keyof FIR; header: string }[] = [
  { key: "firNumber", header: "FIR Number" },
  { key: "stationName", header: "Station" },
  { key: "complainantName", header: "Complainant" },
  { key: "incidentDate", header: "Incident Date" },
  { key: "incidentLocation", header: "Incident Location" },
  { key: "ipcSections", header: "Sections" },
  { key: "status", header: "Status" },
  { key: "priority", header: "Priority" },
  { key: "ioName", header: "IO" },
  { key: "createdAt", header: "Registered At" },
];

export default function FIRListPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const search = useDeferredValue(searchQuery.trim());
  const [statusFilter, setStatusFilter] = useState<FIRStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<FIRPriority | "">("");
  const [currentPage, setCurrentPage] = useState(1);

  const canCreateFIR = user && hasMinimumRole(user.role, "CONSTABLE");
  const canEditFIR = user && hasMinimumRole(user.role, "SI");

  const firs = useFIRs({
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });
  const { counts, isError: countsFailed } = useFIRCounts([
    "UNDER_INVESTIGATION",
    "CHARGESHEET_FILED",
    "CLOSED",
  ]);

  const rows = firs.data?.data ?? [];
  const totalRecords = firs.data?.total ?? 0;
  const totalPages = firs.data?.totalPages ?? 0;

  const statCard = (label: string, value: number | undefined, tone: string, icon: React.ReactNode) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground-muted">{label}</p>
            <p className={`text-2xl font-bold ${tone}`}>
              {countsFailed ? "—" : value ?? <Loader2 className="h-5 w-5 animate-spin" />}
            </p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">FIR Management</h1>
            <p className="text-foreground-muted">View and manage First Information Reports</p>
          </div>
          {canCreateFIR && (
            <Link href="/fir/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Register New FIR
              </Button>
            </Link>
          )}
        </div>

        {/* Stats — totals across the whole register, counted by the server */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statCard("Total FIRs", counts.ALL, "text-foreground", <FileText className="h-8 w-8 text-accent opacity-50" />)}
          {statCard(
            "Under Investigation",
            counts.UNDER_INVESTIGATION,
            "text-info",
            <Search className="h-8 w-8 text-info opacity-50" />
          )}
          {statCard(
            "Chargesheet Filed",
            counts.CHARGESHEET_FILED,
            "text-warning",
            <Clock className="h-8 w-8 text-warning opacity-50" />
          )}
          {statCard("Closed", counts.CLOSED, "text-success", <FileText className="h-8 w-8 text-success opacity-50" />)}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by FIR number, complainant, or incident description..."
                  value={searchQuery}
                  onChange={(v: string) => {
                    setSearchQuery(v);
                    setCurrentPage(1);
                  }}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(v: string) => {
                  setStatusFilter(v as FIRStatus | "");
                  setCurrentPage(1);
                }}
                className="w-full md:w-48"
              />
              <Select
                options={priorityOptions}
                value={priorityFilter}
                onChange={(v: string) => {
                  setPriorityFilter(v as FIRPriority | "");
                  setCurrentPage(1);
                }}
                className="w-full md:w-40"
              />
              <Button
                variant="secondary"
                onClick={() => exportToCSV(rows, "fir_register_page", exportColumns)}
                disabled={rows.length === 0}
                title="Exports the FIRs shown on this page"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FIR Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              FIR Records ({totalRecords})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {firs.isPending ? (
              <div className="flex items-center justify-center gap-3 py-12 text-foreground-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading FIRs…
              </div>
            ) : firs.isError ? (
              <div className="py-12 text-center space-y-3">
                <AlertTriangle className="h-10 w-10 text-error mx-auto" />
                <p className="text-error">FIRs could not be loaded</p>
                <p className="text-sm text-foreground-muted">{firs.error.message}</p>
                <Button variant="secondary" onClick={() => firs.refetch()}>
                  Try again
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <div className="py-12 text-center text-foreground-muted">
                {search || statusFilter || priorityFilter
                  ? "No FIRs match these filters"
                  : "No FIRs have been registered yet"}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>FIR Number</TableHead>
                        <TableHead>Complainant</TableHead>
                        <TableHead>Sections</TableHead>
                        <TableHead>Incident</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IO</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((fir) => (
                        <TableRow key={fir.id} className="hover:bg-background-tertiary">
                          <TableCell>
                            <Link href={`/fir/${fir.id}`} className="font-mono text-accent hover:underline">
                              {fir.firNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-foreground">{fir.complainantName}</p>
                            {fir.complainantPhone && (
                              <p className="text-xs text-foreground-muted">{fir.complainantPhone}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-foreground">
                              {fir.ipcSections.length > 0 ? fir.ipcSections.join(", ") : "—"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-foreground">{formatDate(fir.incidentDate)}</p>
                            <p className="text-xs text-foreground-muted">
                              {fir.incidentTime && `${fir.incidentTime.slice(0, 5)} · `}
                              {fir.incidentLocation}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={firPriorityBadge[fir.priority] as any}>{fir.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={firStatusBadge[fir.status] as any}>
                              {fir.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-foreground-muted">{fir.ioName || "Unassigned"}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/fir/${fir.id}`} aria-label={`View ${fir.firNumber}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {canEditFIR && (
                                <Link href={`/fir/${fir.id}?edit=true`} aria-label={`Edit ${fir.firNumber}`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-foreground-muted">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, totalRecords)}{" "}
                      of {totalRecords} results
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-foreground-muted">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
