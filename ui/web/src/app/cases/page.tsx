"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Scale,
  FileText,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active Investigation" },
  { value: "PENDING_COURT", label: "Pending Court" },
  { value: "IN_TRIAL", label: "In Trial" },
  { value: "CONVICTED", label: "Convicted" },
  { value: "ACQUITTED", label: "Acquitted" },
  { value: "CLOSED", label: "Closed" },
];

const priorityOptions = [
  { value: "", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

// Mock case data
const mockCases = [
  {
    id: "case-001",
    caseNumber: "CC/2024/KOR/00089",
    firNumber: "KOR/2024/00123",
    title: "State vs Unknown (Theft)",
    complainant: "Rajesh Sharma",
    accused: "Under Investigation",
    status: "ACTIVE",
    priority: "HIGH",
    court: "Metropolitan Magistrate Court III",
    nextHearing: "2024-02-15",
    io: "SI Suresh",
    slaRemaining: 12,
  },
  {
    id: "case-002",
    caseNumber: "CC/2024/KOR/00088",
    firNumber: "KOR/2024/00122",
    title: "State vs Unknown (Assault)",
    complainant: "Priya Menon",
    accused: "Under Investigation",
    status: "ACTIVE",
    priority: "CRITICAL",
    court: null,
    nextHearing: null,
    io: "SI Suresh",
    slaRemaining: 5,
  },
  {
    id: "case-003",
    caseNumber: "CC/2024/KOR/00087",
    firNumber: "KOR/2024/00121",
    title: "State vs Unknown (Cyber Fraud)",
    complainant: "Mohammed Khan",
    accused: "Under Investigation",
    status: "PENDING_COURT",
    priority: "NORMAL",
    court: "Cyber Crime Court",
    nextHearing: "2024-02-10",
    io: "SI Ramesh",
    slaRemaining: 8,
  },
  {
    id: "case-004",
    caseNumber: "CC/2023/KOR/01245",
    firNumber: "KOR/2023/02345",
    title: "State vs Raju (Chain Snatching)",
    complainant: "Anita Desai",
    accused: "Raju @ Kalia",
    status: "IN_TRIAL",
    priority: "HIGH",
    court: "Sessions Court",
    nextHearing: "2024-01-25",
    io: "Insp. Sharma",
    slaRemaining: null,
  },
  {
    id: "case-005",
    caseNumber: "CC/2023/KOR/01100",
    firNumber: "KOR/2023/02100",
    title: "State vs Unknown (Burglary)",
    complainant: "Suresh Reddy",
    accused: "Untraced",
    status: "CLOSED",
    priority: "NORMAL",
    court: null,
    nextHearing: null,
    io: "SI Suresh",
    slaRemaining: null,
  },
];

function getStatusBadgeVariant(status: string) {
  const variants: Record<string, string> = {
    ACTIVE: "investigating",
    PENDING_COURT: "warning",
    IN_TRIAL: "info",
    CONVICTED: "success",
    ACQUITTED: "secondary",
    CLOSED: "closed",
  };
  return variants[status] || "secondary";
}

function getPriorityBadgeVariant(priority: string) {
  const variants: Record<string, string> = {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
    CRITICAL: "critical",
  };
  return variants[priority] || "secondary";
}

export default function CasesPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canAssign = user && hasMinimumRole(user.role, "SHO");

  const filteredCases = mockCases.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (priorityFilter && c.priority !== priorityFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        c.caseNumber.toLowerCase().includes(search) ||
        c.firNumber.toLowerCase().includes(search) ||
        c.title.toLowerCase().includes(search) ||
        c.complainant.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    total: mockCases.length,
    active: mockCases.filter((c) => c.status === "ACTIVE").length,
    pendingCourt: mockCases.filter((c) => c.status === "PENDING_COURT" || c.status === "IN_TRIAL")
      .length,
    critical: mockCases.filter((c) => c.priority === "CRITICAL").length,
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
          <Button variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
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
                  <p className="text-sm text-foreground-muted">Active Investigation</p>
                  <p className="text-2xl font-bold text-info">{stats.active}</p>
                </div>
                <Search className="h-8 w-8 text-info opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Court Pending</p>
                  <p className="text-2xl font-bold text-warning">{stats.pendingCourt}</p>
                </div>
                <Scale className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Critical Priority</p>
                  <p className="text-2xl font-bold text-error">{stats.critical}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-error opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SLA Warnings */}
        {mockCases.filter((c) => c.slaRemaining && c.slaRemaining <= 7).length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">SLA Warnings</p>
                  <p className="text-sm text-foreground-muted">
                    {mockCases.filter((c) => c.slaRemaining && c.slaRemaining <= 7).length} cases
                    approaching SLA deadline. Immediate attention required.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by case number, FIR, title, or complainant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full md:w-48"
              />
              <Select
                options={priorityOptions}
                value={priorityFilter}
                onChange={setPriorityFilter}
                className="w-full md:w-40"
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Complainant</TableHead>
                  <TableHead>Accused</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Next Hearing</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="hover:bg-background-tertiary cursor-pointer">
                    <TableCell>
                      <div>
                        <span className="font-mono text-accent">{caseItem.caseNumber}</span>
                        <p className="text-xs text-foreground-muted">{caseItem.firNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">{caseItem.title}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">{caseItem.complainant}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground-muted">{caseItem.accused}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(caseItem.status) as any}>
                        {caseItem.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(caseItem.priority) as any}>
                        {caseItem.priority}
                      </Badge>
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
                      {caseItem.slaRemaining !== null ? (
                        <span
                          className={`font-medium ${
                            caseItem.slaRemaining <= 5
                              ? "text-error"
                              : caseItem.slaRemaining <= 10
                              ? "text-warning"
                              : "text-success"
                          }`}
                        >
                          {caseItem.slaRemaining} days
                        </span>
                      ) : (
                        <span className="text-foreground-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/cases/${caseItem.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-foreground-muted">
                Showing {filteredCases.length} of {mockCases.length} results
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-foreground-muted">Page 1 of 1</span>
                <Button variant="ghost" size="sm" disabled>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
