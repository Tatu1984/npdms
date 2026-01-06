"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AdvancedFilters } from "@/components/ui/AdvancedFilters";
import { useFIRStore } from "@/stores/firStore";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { exportToCSV, exportConfigs } from "@/lib/utils/export";
import { toast } from "@/stores/toastStore";
import type { FIR, FIRStatus, FIRPriority } from "@/types";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "REGISTERED", label: "Registered" },
  { value: "UNDER_INVESTIGATION", label: "Under Investigation" },
  { value: "CHARGESHEET_FILED", label: "Chargesheet Filed" },
  { value: "COURT_PENDING", label: "Court Pending" },
  { value: "CLOSED", label: "Closed" },
  { value: "TRANSFERRED", label: "Transferred" },
];

const priorityOptions = [
  { value: "", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

function getStatusBadgeVariant(status: FIRStatus) {
  const variants: Record<FIRStatus, string> = {
    REGISTERED: "registered",
    UNDER_INVESTIGATION: "investigating",
    CHARGESHEET_FILED: "chargesheet",
    COURT_PENDING: "warning",
    CLOSED: "closed",
    TRANSFERRED: "secondary",
  };
  return variants[status] || "secondary";
}

function getPriorityBadgeVariant(priority: FIRPriority) {
  const variants: Record<FIRPriority, string> = {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
    CRITICAL: "critical",
  };
  return variants[priority] || "secondary";
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeString: string) {
  return new Date(timeString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FIRListPage() {
  const { user } = useAuthStore();
  const { firs, filters, isLoading, loadFIRs, setFilters, deleteFIR, getFilteredFIRs } = useFIRStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [firToDelete, setFirToDelete] = useState<FIR | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const itemsPerPage = 10;

  const canCreateFIR = user && hasMinimumRole(user.role, "CONSTABLE");
  const canEditFIR = user && hasMinimumRole(user.role, "SI");
  const canDeleteFIR = user && hasMinimumRole(user.role, "SP");

  useEffect(() => {
    loadFIRs();
  }, [loadFIRs]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setFilters({ ...filters, status: value as FIRStatus | undefined });
    setCurrentPage(1);
  };

  const handlePriorityFilter = (value: string) => {
    setFilters({ ...filters, priority: value as FIRPriority | undefined });
    setCurrentPage(1);
  };

  const handleExport = () => {
    const data = getFilteredFIRs();
    exportToCSV(data, "fir_export", exportConfigs.firs as any);
    toast.success("Export successful", "FIR data exported to CSV");
  };

  const handleDeleteClick = (fir: FIR) => {
    setFirToDelete(fir);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!firToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFIR(firToDelete.id);
      toast.success("FIR deleted", `FIR ${firToDelete.firNumber} has been deleted`);
      setDeleteDialogOpen(false);
      setFirToDelete(null);
    } catch (error) {
      toast.error("Error", "Failed to delete FIR");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFIRs = getFilteredFIRs();
  const totalPages = Math.ceil(filteredFIRs.length / itemsPerPage);
  const paginatedFIRs = filteredFIRs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">FIR Management</h1>
            <p className="text-foreground-muted">
              View and manage First Information Reports
            </p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Total FIRs</p>
                  <p className="text-2xl font-bold text-foreground">{firs.length}</p>
                </div>
                <FileText className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Under Investigation</p>
                  <p className="text-2xl font-bold text-info">
                    {firs.filter((f) => f.status === "UNDER_INVESTIGATION").length}
                  </p>
                </div>
                <Search className="h-8 w-8 text-info opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Critical Priority</p>
                  <p className="text-2xl font-bold text-error">
                    {firs.filter((f) => f.priority === "CRITICAL").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-error opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Closed</p>
                  <p className="text-2xl font-bold text-success">
                    {firs.filter((f) => f.status === "CLOSED").length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by FIR number, complainant, or offence..."
                  value={searchQuery}
                  onChange={(v: string) => handleSearch(v)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Select
                options={statusOptions}
                value={filters.status || ""}
                onChange={handleStatusFilter}
                className="w-full md:w-48"
              />
              <Select
                options={priorityOptions}
                value={filters.priority || ""}
                onChange={handlePriorityFilter}
                className="w-full md:w-40"
              />
              <Button variant="secondary" onClick={() => setShowAdvancedFilters(true)}>
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
              <Button variant="secondary" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FIR Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              FIR Records ({filteredFIRs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>FIR Number</TableHead>
                      <TableHead>Complainant</TableHead>
                      <TableHead>Offence</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IO</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFIRs.map((fir) => (
                      <TableRow key={fir.id} className="hover:bg-background-tertiary cursor-pointer">
                        <TableCell>
                          <span className="font-mono text-accent">{fir.firNumber}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{fir.complainantName}</p>
                            <p className="text-xs text-foreground-muted">{fir.complainantPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-foreground">{fir.offenceType}</p>
                            <p className="text-xs text-foreground-muted">{fir.ipcSections.join(", ")}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-foreground">{formatDate(fir.incidentDate)}</p>
                            {fir.incidentTime && (
                              <p className="text-xs text-foreground-muted">{fir.incidentTime}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(fir.priority) as any}>
                            {fir.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(fir.status) as any}>
                            {fir.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground-muted">
                            {fir.investigatingOfficerName || "Unassigned"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/fir/${fir.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canEditFIR && (
                              <Link href={`/fir/${fir.id}?edit=true`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            {canDeleteFIR && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(fir)}
                              >
                                <Trash2 className="h-4 w-4 text-error" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-foreground-muted">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredFIRs.length)} of{" "}
                      {filteredFIRs.length} results
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
                        disabled={currentPage === totalPages}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setFirToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete FIR"
        message={`Are you sure you want to delete FIR ${firToDelete?.firNumber}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApply={(advancedFilters) => {
          setFilters({ ...filters, ...advancedFilters });
          setCurrentPage(1);
        }}
        onReset={() => {
          setFilters({ search: filters.search, status: filters.status, priority: filters.priority });
          setCurrentPage(1);
        }}
        resourceType="fir"
        currentFilters={filters}
      />
    </DashboardLayout>
  );
}
