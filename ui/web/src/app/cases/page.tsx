"use client";

import { useEffect, useState } from "react";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useCasesStore, type Case } from "@/stores/casesStore";
import { exportToCSV, exportConfigs } from "@/lib/utils/export";
import { toast } from "@/stores/toastStore";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "INVESTIGATION", label: "Investigation" },
  { value: "CHARGESHEET", label: "Chargesheet" },
  { value: "TRIAL", label: "Trial" },
  { value: "JUDGMENT", label: "Judgment" },
  { value: "CLOSED", label: "Closed" },
  { value: "APPEAL", label: "Appeal" },
];

function getStatusBadgeVariant(status: string) {
  const variants: Record<string, string> = {
    INVESTIGATION: "investigating",
    CHARGESHEET: "chargesheet",
    TRIAL: "info",
    JUDGMENT: "warning",
    CLOSED: "closed",
    APPEAL: "secondary",
  };
  return variants[status] || "secondary";
}

export default function CasesPage() {
  const { user } = useAuthStore();
  const { cases, filters, isLoading, loadCases, setFilters, deleteCase, getFilteredCases } = useCasesStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  const canCreate = user && hasMinimumRole(user.role, "SI");
  const canDelete = user && hasMinimumRole(user.role, "SP");

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setFilters({ ...filters, status: value as Case["status"] | undefined });
    setCurrentPage(1);
  };

  const handleExport = () => {
    const data = getFilteredCases();
    exportToCSV(data, "cases_export", exportConfigs.cases as any);
    toast.success("Export successful", "Cases data exported to CSV");
  };

  const handleDeleteClick = (caseItem: Case) => {
    setCaseToDelete(caseItem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!caseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCase(caseToDelete.id);
      toast.success("Case deleted", `Case ${caseToDelete.caseNumber} has been deleted`);
      setDeleteDialogOpen(false);
      setCaseToDelete(null);
    } catch (error) {
      toast.error("Error", "Failed to delete case");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCases = getFilteredCases();
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: cases.length,
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
                value={filters.status || ""}
                onChange={handleStatusFilter}
                className="w-full md:w-48"
              />
              <Button variant="secondary">
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
              Case Records ({filteredCases.length})
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
                    {paginatedCases.map((caseItem) => (
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
                            {caseItem.firNumber}
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
                            {caseItem.investigatingOfficerName || "-"}
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
                      {Math.min(currentPage * itemsPerPage, filteredCases.length)} of{" "}
                      {filteredCases.length} results
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
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
