"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Scale,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AdvancedFilters } from "@/components/ui/AdvancedFilters";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useCases, useDeleteCase } from "@/hooks/use-cases";
import { type Case, type CaseStatus } from "@/lib/db/schema";
import { exportToCSV, exportConfigs } from "@/lib/utils/export";
import { toast } from "@/stores/toastStore";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INVESTIGATION", label: "Investigation" },
  { value: "CHARGESHEET", label: "Chargesheet" },
  { value: "TRIAL", label: "Trial" },
  { value: "CLOSED", label: "Closed" },
  { value: "ACQUITTED", label: "Acquitted" },
  { value: "CONVICTED", label: "Convicted" },
];

function getStatusBadgeVariant(status: string) {
  const variants: Record<string, string> = {
    ACTIVE: "info",
    INVESTIGATION: "investigating",
    CHARGESHEET: "chargesheet",
    TRIAL: "warning",
    CLOSED: "closed",
    ACQUITTED: "success",
    CONVICTED: "error",
  };
  return variants[status] || "secondary";
}

export default function CasesPage() {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null);
  const itemsPerPage = 10;

  const canCreate = user && hasMinimumRole(user.role, "SI");
  const canDelete = user && hasMinimumRole(user.role, "SP");

  // Fetch cases with filters using React Query
  const { data: casesData, isLoading, error } = useCases({
    search: searchQuery,
    status: statusFilter,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  // Delete case mutation
  const deleteCaseMutation = useDeleteCase();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as CaseStatus | undefined);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const data = casesData?.data || [];
    exportToCSV(data, "cases_export", exportConfigs.cases as any);
    toast.success("Export successful", "Cases data exported to CSV");
  };

  const handleDeleteClick = (caseItem: Case) => {
    setCaseToDelete(caseItem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!caseToDelete) return;
    try {
      await deleteCaseMutation.mutateAsync(caseToDelete.id);
      toast.success("Case deleted", `Case ${caseToDelete.caseNumber} has been deleted`);
      setDeleteDialogOpen(false);
      setCaseToDelete(null);
    } catch (_error) {
      toast.error("Error", "Failed to delete case");
    }
  };

  // Extract data from React Query response
  const cases = casesData?.data || [];
  const totalPages = casesData ? Math.ceil(casesData.total / itemsPerPage) : 0;

  const stats = {
    total: casesData?.total || 0,
    investigation: cases.filter((c) => c.status === "INVESTIGATION").length,
    trial: cases.filter((c) => c.status === "TRIAL" || c.status === "CHARGESHEET").length,
    closed: cases.filter((c) => c.status === "CLOSED").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Case Tracking</h1>
            <p className="text-foreground-muted">
              Monitor and manage case progress from registration to disposal
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {canCreate && (
              <Link href="/cases/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Case
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Total Cases</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Briefcase className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Under Investigation</p>
                  <p className="text-2xl font-bold text-info">{stats.investigation}</p>
                </div>
                <Search className="h-8 w-8 text-info opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">In Court</p>
                  <p className="text-2xl font-bold text-warning">{stats.trial}</p>
                </div>
                <Scale className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Closed</p>
                  <p className="text-2xl font-bold text-success">{stats.closed}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-success opacity-50" />
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
                  placeholder="Search by case number, FIR, or title..."
                  value={searchQuery}
                  onChange={(v: string) => handleSearch(v)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Select
                options={statusOptions}
                value={statusFilter || ""}
                onChange={handleStatusFilter}
                className="w-full md:w-48"
              />
              <Button variant="secondary" onClick={() => setShowAdvancedFilters(true)}>
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cases Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Case Records ({casesData?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Cases</h3>
                  <p className="text-foreground-muted">Failed to load cases. Please try again.</p>
                </div>
              </div>
            ) : cases.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 text-foreground-muted mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Cases Found</h3>
                  <p className="text-foreground-muted">No cases match your current filters.</p>
                </div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>FIR</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Court</TableHead>
                      <TableHead>Next Hearing</TableHead>
                      <TableHead>IO</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((caseItem) => (
                      <TableRow key={caseItem.id} className="hover:bg-background-tertiary">
                        <TableCell>
                          <span className="font-mono text-accent">{caseItem.caseNumber}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{caseItem.title}</span>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/fir/${caseItem.firId}`}
                            className="font-mono text-accent hover:underline"
                          >
                            {caseItem.firNumber || caseItem.firId}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(caseItem.status) as any}>
                            {caseItem.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground-muted">
                            {caseItem.courtName || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {caseItem.nextHearing ? (
                            <span className="text-foreground">
                              {new Date(caseItem.nextHearing).toLocaleDateString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-foreground-muted">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground-muted">
                            {caseItem.investigatingOfficer || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/cases/${caseItem.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(caseItem)}
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
                      {Math.min(currentPage * itemsPerPage, casesData?.total || 0)} of{" "}
                      {casesData?.total || 0} results
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
          setCaseToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Case"
        message={`Are you sure you want to delete case ${caseToDelete?.caseNumber}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteCaseMutation.isPending}
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApply={(advancedFilters) => {
          setStatusFilter(advancedFilters.status as CaseStatus | undefined);
          setCurrentPage(1);
          setShowAdvancedFilters(false);
          toast.success("Filters Applied", "Advanced filters applied successfully");
        }}
        onReset={() => {
          setStatusFilter(undefined);
          setSearchQuery("");
          setCurrentPage(1);
          toast.info("Filters Reset", "All filters have been reset");
        }}
        resourceType="case"
      />
    </DashboardLayout>
  );
}
