"use client";

import { useState } from "react";
import {
  Microscope,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Fingerprint,
  Dna,
  Target,
  HardDrive,
  Beaker,
  Calendar,
  ArrowRight,
  Download,
  Eye,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

const mockForensicRequests = [
  {
    id: "FSL-2024-00234",
    evidenceId: "EVD-2024-KOR-00156",
    caseNumber: "CASE-2024-00156",
    type: "FINGERPRINT",
    status: "COMPLETED",
    priority: "HIGH",
    submittedDate: "2024-01-16",
    completedDate: "2024-01-23",
    lab: "FSL Bangalore",
    analyst: "Dr. Priya Nair",
    summary: "3 fingerprint matches found. Matched with accused Raju Kumar.",
    findings: "Positive match with NAFIS database",
  },
  {
    id: "FSL-2024-00233",
    evidenceId: "EVD-2024-KOR-00157",
    caseNumber: "CASE-2024-00156",
    type: "DNA",
    status: "IN_PROGRESS",
    priority: "HIGH",
    submittedDate: "2024-01-18",
    expectedDate: "2024-02-01",
    lab: "FSL Bangalore",
    analyst: "Dr. Ramesh Kumar",
    progress: 65,
  },
  {
    id: "FSL-2024-00232",
    evidenceId: "EVD-2024-KOR-00145",
    caseNumber: "CASE-2024-00145",
    type: "NARCOTICS",
    status: "COMPLETED",
    priority: "MEDIUM",
    submittedDate: "2024-01-14",
    completedDate: "2024-01-20",
    lab: "FSL Bangalore",
    analyst: "Dr. Suresh Menon",
    summary: "Substance confirmed as Methamphetamine. Net weight: 245g",
    findings: "NDPS Act applicable",
  },
  {
    id: "FSL-2024-00231",
    evidenceId: "EVD-2024-KOR-00148",
    caseNumber: "CASE-2024-00148",
    type: "DIGITAL",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    submittedDate: "2024-01-15",
    expectedDate: "2024-01-30",
    lab: "Cyber Forensics Lab",
    analyst: "Er. Vikram Singh",
    progress: 40,
    devices: ["1x Laptop", "2x Mobile Phones", "1x Hard Disk"],
  },
  {
    id: "FSL-2024-00230",
    evidenceId: "EVD-2024-KOR-00140",
    caseNumber: "CASE-2024-00140",
    type: "BALLISTICS",
    status: "PENDING",
    priority: "LOW",
    submittedDate: "2024-01-22",
    expectedDate: "2024-02-05",
    lab: "FSL Bangalore",
    items: ["2x Cartridge cases", "1x Bullet fragment"],
  },
  {
    id: "FSL-2024-00229",
    evidenceId: "EVD-2024-KOR-00135",
    caseNumber: "CASE-2024-00135",
    type: "DOCUMENT",
    status: "COMPLETED",
    priority: "MEDIUM",
    submittedDate: "2024-01-10",
    completedDate: "2024-01-17",
    lab: "Document Examination Lab",
    analyst: "Dr. Anjali Sharma",
    summary: "Signature found to be forged. Document is not authentic.",
    findings: "Forgery confirmed",
  },
];

const forensicTypes = {
  FINGERPRINT: { label: "Fingerprint", icon: Fingerprint, color: "info" },
  DNA: { label: "DNA Analysis", icon: Dna, color: "accent" },
  BALLISTICS: { label: "Ballistics", icon: Target, color: "error" },
  DIGITAL: { label: "Digital Forensics", icon: HardDrive, color: "warning" },
  NARCOTICS: { label: "Narcotics", icon: Beaker, color: "error" },
  DOCUMENT: { label: "Document Exam", icon: FileText, color: "muted" },
};

const statusConfig = {
  PENDING: { label: "Pending", color: "muted" },
  IN_PROGRESS: { label: "In Progress", color: "warning" },
  COMPLETED: { label: "Completed", color: "success" },
  INCONCLUSIVE: { label: "Inconclusive", color: "info" },
};

export default function ForensicsPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const canSubmit = user && hasMinimumRole(user.role, "SI");

  const filteredRequests = mockForensicRequests.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.evidenceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || req.type === filterType;
    const matchesStatus = filterStatus === "ALL" || req.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: mockForensicRequests.length,
    pending: mockForensicRequests.filter((r) => r.status === "PENDING").length,
    inProgress: mockForensicRequests.filter((r) => r.status === "IN_PROGRESS").length,
    completed: mockForensicRequests.filter((r) => r.status === "COMPLETED").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Forensic Lab Integration</h1>
            <p className="text-foreground-muted">
              Track forensic analysis requests and receive lab reports
            </p>
          </div>
          {canSubmit && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New FSL Request
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Microscope className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-foreground-muted">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/10">
                  <Clock className="h-5 w-5 text-foreground-muted" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-xs text-foreground-muted">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Beaker className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                  <p className="text-xs text-foreground-muted">In Analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                  <p className="text-xs text-foreground-muted">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Types Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-4">
              {Object.entries(forensicTypes).map(([key, config]) => {
                const Icon = config.icon;
                const count = mockForensicRequests.filter((r) => r.type === key).length;
                return (
                  <div
                    key={key}
                    className="text-center p-4 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-colors cursor-pointer"
                    onClick={() => setFilterType(key)}
                  >
                    <div className={`p-3 rounded-full bg-${config.color}/10 w-fit mx-auto mb-2`}>
                      <Icon className={`h-6 w-6 text-${config.color}`} />
                    </div>
                    <p className="text-sm font-medium text-foreground">{config.label}</p>
                    <p className="text-xs text-foreground-muted">{count} requests</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by FSL ID, case number, or evidence ID..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Types</option>
                {Object.entries(forensicTypes).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const typeConfig = forensicTypes[request.type as keyof typeof forensicTypes];
            const status = statusConfig[request.status as keyof typeof statusConfig];
            const TypeIcon = typeConfig.icon;

            return (
              <Card key={request.id} className="hover:border-accent/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-${typeConfig.color}/10`}>
                        <TypeIcon className={`h-6 w-6 text-${typeConfig.color}`} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground">{request.id}</span>
                          <Badge variant={typeConfig.color as any}>{typeConfig.label}</Badge>
                          <Badge variant={status.color as any}>{status.label}</Badge>
                          {request.priority === "HIGH" && (
                            <Badge variant="error">High Priority</Badge>
                          )}
                        </div>
                        <div className="text-sm text-foreground-muted">
                          Evidence: {request.evidenceId} | Case: {request.caseNumber}
                        </div>
                        <div className="text-sm text-foreground-muted">
                          Lab: {request.lab}
                          {request.analyst && ` | Analyst: ${request.analyst}`}
                        </div>
                        {request.progress !== undefined && (
                          <div className="w-64">
                            <div className="flex items-center justify-between text-xs text-foreground-muted mb-1">
                              <span>Analysis Progress</span>
                              <span>{request.progress}%</span>
                            </div>
                            <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent rounded-full transition-all"
                                style={{ width: `${request.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {request.summary && (
                          <div className="p-3 rounded bg-success/10 border border-success/20">
                            <p className="text-sm text-foreground">{request.summary}</p>
                            {request.findings && (
                              <p className="text-xs text-success mt-1">
                                Finding: {request.findings}
                              </p>
                            )}
                          </div>
                        )}
                        {request.devices && (
                          <div className="flex flex-wrap gap-1">
                            {request.devices.map((device) => (
                              <span
                                key={device}
                                className="px-2 py-0.5 text-xs rounded bg-background-tertiary text-foreground-muted"
                              >
                                {device}
                              </span>
                            ))}
                          </div>
                        )}
                        {request.items && (
                          <div className="flex flex-wrap gap-1">
                            {request.items.map((item) => (
                              <span
                                key={item}
                                className="px-2 py-0.5 text-xs rounded bg-background-tertiary text-foreground-muted"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-sm text-foreground-muted">
                        <div className="flex items-center gap-2 justify-end">
                          <Calendar className="h-4 w-4" />
                          Submitted: {request.submittedDate}
                        </div>
                        {request.completedDate ? (
                          <div className="text-success mt-1">
                            Completed: {request.completedDate}
                          </div>
                        ) : request.expectedDate ? (
                          <div className="mt-1">
                            Expected: {request.expectedDate}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {request.status === "COMPLETED" && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Report
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Microscope className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No requests found</h3>
              <p className="text-foreground-muted">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
