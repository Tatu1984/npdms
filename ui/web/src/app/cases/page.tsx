"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Download,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Scale,
  Info,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useCases } from "@/hooks/use-cases";
import type { Case, CaseStatus } from "@/lib/api/cases";
import { exportToCSV } from "@/lib/utils/export";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

const statusBadge: Record<CaseStatus, { variant: string; label: string }> = {
  REGISTERED: { variant: "registered", label: "Registered" },
  UNDER_INVESTIGATION: { variant: "investigating", label: "Under Investigation" },
  CHARGESHEET_FILED: { variant: "chargesheet", label: "Chargesheet Filed" },
  IN_COURT: { variant: "warning", label: "In Court" },
  CONVICTION: { variant: "success", label: "Conviction" },
  ACQUITTAL: { variant: "secondary", label: "Acquittal" },
  CLOSED: { variant: "closed", label: "Closed" },
};

const exportColumns: { key: keyof Case; header: string }[] = [
  { key: "caseNumber", header: "Case Number" },
  { key: "firNumber", header: "FIR Number" },
  { key: "title", header: "Title" },
  { key: "status", header: "Status" },
  { key: "priority", header: "Priority" },
  { key: "ipcSections", header: "Sections" },
  { key: "ioName", header: "IO" },
  { key: "courtName", header: "Court" },
  { key: "nextHearingDate", header: "Next Hearing" },
  { key: "createdAt", header: "Registered At" },
];

export default function CasesPage() {
  const { user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const canCreate = user && hasMinimumRole(user.role, "SI");

  const cases = useCases({ page: currentPage, pageSize: PAGE_SIZE });
  const rows = cases.data?.data ?? [];
  const totalRecords = cases.data?.total ?? 0;
  const totalPages = cases.data?.totalPages ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Case Tracking</h1>
            <p className="text-foreground-muted">Monitor and manage case progress from registration to disposal</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => exportToCSV(rows, "cases_page", exportColumns)}
              disabled={rows.length === 0}
              title="Exports the cases shown on this page"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Page
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Briefcase className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {cases.isError ? "—" : cases.data ? totalRecords : <Loader2 className="h-5 w-5 animate-spin" />}
                  </p>
                  <p className="text-xs text-foreground-muted">Total Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-3">
            <CardContent className="p-4 flex items-start gap-3 text-sm text-foreground-muted">
              <Info className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <p>
                The case register lists the most recent cases first. Search, status filters and per-status counts
                need server support that the cases API does not provide yet, so they are not shown here rather than
                computed from a single page.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Cases ({totalRecords})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cases.isPending ? (
              <div className="flex items-center justify-center gap-3 py-12 text-foreground-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading cases…
              </div>
            ) : cases.isError ? (
              <div className="py-12 text-center space-y-3">
                <AlertTriangle className="h-10 w-10 text-error mx-auto" />
                <p className="text-error">Cases could not be loaded</p>
                <p className="text-sm text-foreground-muted">{cases.error.message}</p>
                <Button variant="secondary" onClick={() => cases.refetch()}>
                  Try again
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <div className="py-12 text-center text-foreground-muted">No cases have been registered yet</div>
            ) : (
              <>
                <div className="overflow-x-auto">
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
                      {rows.map((c) => (
                        <TableRow key={c.id} className="hover:bg-background-tertiary">
                          <TableCell>
                            <Link href={`/cases/${c.id}`} className="font-mono text-accent hover:underline">
                              {c.caseNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-foreground">{c.title}</p>
                            {c.ipcSections.length > 0 && (
                              <p className="text-xs text-foreground-muted">{c.ipcSections.join(", ")}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Link href={`/fir/${c.firId}`} className="font-mono text-sm text-accent hover:underline">
                              {c.firNumber || "View FIR"}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge[c.status]?.variant as any}>
                              {statusBadge[c.status]?.label ?? c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground-muted">{c.courtName || "—"}</TableCell>
                          <TableCell className="text-foreground-muted">
                            {c.nextHearingDate ? formatDate(c.nextHearingDate) : "—"}
                          </TableCell>
                          <TableCell className="text-foreground-muted">{c.ioName || "Unassigned"}</TableCell>
                          <TableCell className="text-right">
                            <Link href={`/cases/${c.id}`} aria-label={`View ${c.caseNumber}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-foreground-muted">
                      Page {currentPage} of {totalPages} · {totalRecords} cases
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
