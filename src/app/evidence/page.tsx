"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Filter,
  Plus,
  Eye,
  Download,
  FileText,
  Camera,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Clock,
  Link as LinkIcon,
  Shield,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "PHYSICAL", label: "Physical" },
  { value: "DIGITAL", label: "Digital" },
  { value: "DOCUMENTARY", label: "Documentary" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "COLLECTED", label: "Collected" },
  { value: "IN_CUSTODY", label: "In Custody" },
  { value: "AT_LAB", label: "At Lab" },
  { value: "RETURNED", label: "Returned" },
  { value: "DISPOSED", label: "Disposed" },
];

// Mock evidence data
const mockEvidence = [
  {
    id: "evd-001",
    evidenceNumber: "EVD-2024-KOR-00123-001",
    firNumber: "KOR/2024/00123",
    type: "PHYSICAL",
    category: "Fingerprint Sample",
    description: "Fingerprint lifted from door handle at scene",
    collectedBy: "SI Suresh",
    collectedAt: "2024-01-15T15:45:00Z",
    location: "Crime Scene - Door Handle",
    status: "AT_LAB",
    currentCustodian: "FSL Bangalore",
    integrityVerified: true,
    hash: "sha256:a3b4c5d6...",
  },
  {
    id: "evd-002",
    evidenceNumber: "EVD-2024-KOR-00123-002",
    firNumber: "KOR/2024/00123",
    type: "DIGITAL",
    category: "CCTV Footage",
    description: "Footage from Sharma Stores (14:00-15:00 hours)",
    collectedBy: "SI Suresh",
    collectedAt: "2024-01-16T10:30:00Z",
    location: "Sharma Stores",
    status: "IN_CUSTODY",
    currentCustodian: "Evidence Vault",
    integrityVerified: true,
    hash: "sha256:d4e5f6g7...",
    fileSize: "2.3 GB",
  },
  {
    id: "evd-003",
    evidenceNumber: "EVD-2024-KOR-00123-003",
    firNumber: "KOR/2024/00123",
    type: "PHYSICAL",
    category: "Broken Lock",
    description: "Broken padlock from main gate",
    collectedBy: "Const. Ramesh",
    collectedAt: "2024-01-15T16:00:00Z",
    location: "Main Gate",
    status: "IN_CUSTODY",
    currentCustodian: "Station Malkhana",
    integrityVerified: true,
    sealNumber: "KOR-2024-0456",
  },
  {
    id: "evd-004",
    evidenceNumber: "EVD-2024-KOR-00122-001",
    firNumber: "KOR/2024/00122",
    type: "DOCUMENTARY",
    category: "Witness Statement",
    description: "Written statement of Mrs. Lakshmi",
    collectedBy: "Const. Ramesh",
    collectedAt: "2024-01-15T18:00:00Z",
    location: "Police Station",
    status: "IN_CUSTODY",
    currentCustodian: "Case File",
    integrityVerified: true,
  },
  {
    id: "evd-005",
    evidenceNumber: "EVD-2024-KOR-00121-001",
    firNumber: "KOR/2024/00121",
    type: "DIGITAL",
    category: "Bank Statement",
    description: "Transaction records showing fraudulent transfer",
    collectedBy: "SI Suresh",
    collectedAt: "2024-01-14T14:00:00Z",
    location: "Received via email from bank",
    status: "IN_CUSTODY",
    currentCustodian: "Digital Evidence Server",
    integrityVerified: true,
    hash: "sha256:h8i9j0k1...",
  },
];

// Mock chain of custody entries
const mockChainOfCustody = [
  {
    evidenceId: "evd-001",
    entries: [
      {
        action: "COLLECTED",
        date: "2024-01-15T15:45:00Z",
        officer: "SI Suresh",
        location: "Crime Scene",
        gps: "12.9352, 77.6245",
        verified: true,
      },
      {
        action: "SEALED",
        date: "2024-01-15T16:30:00Z",
        officer: "SI Suresh",
        location: "PS Koramangala",
        sealNumber: "KOR-2024-0455",
        witness: "HC Mohan",
        verified: true,
      },
      {
        action: "TRANSFERRED",
        date: "2024-01-16T09:00:00Z",
        officer: "HC Mohan",
        to: "FSL Courier",
        receiptNumber: "FSL-BLR-2024-00234",
        verified: true,
      },
      {
        action: "RECEIVED",
        date: "2024-01-16T14:00:00Z",
        officer: "FSL Bangalore",
        location: "FSL Laboratory",
        labRef: "FSL-BLR-FP-2024-0089",
        verified: true,
      },
    ],
  },
];

// Mock forensic requests
const mockForensicRequests = [
  {
    id: "fsl-001",
    requestId: "FSL-0089",
    evidenceNumber: "EVD-2024-KOR-00123-001",
    testType: "Fingerprint Analysis",
    status: "IN_PROGRESS",
    eta: "2024-01-25",
    lab: "FSL Bangalore",
  },
  {
    id: "fsl-002",
    requestId: "FSL-0090",
    evidenceNumber: "EVD-2024-KOR-00123-002",
    testType: "Video Enhancement",
    status: "PENDING",
    eta: "2024-01-30",
    lab: "Cyber Forensics Lab",
  },
];

function getTypeIcon(type: string) {
  switch (type) {
    case "PHYSICAL":
      return <Package className="h-4 w-4" />;
    case "DIGITAL":
      return <HardDrive className="h-4 w-4" />;
    case "DOCUMENTARY":
      return <FileText className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

function getStatusBadgeVariant(status: string) {
  const variants: Record<string, string> = {
    COLLECTED: "info",
    IN_CUSTODY: "success",
    AT_LAB: "warning",
    RETURNED: "secondary",
    DISPOSED: "closed",
  };
  return variants[status] || "secondary";
}

export default function EvidencePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("registry");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const canAddEvidence = user && hasMinimumRole(user.role, "CONSTABLE");
  const canTransfer = user && hasMinimumRole(user.role, "SI");

  const filteredEvidence = mockEvidence.filter((e) => {
    if (typeFilter && e.type !== typeFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        e.evidenceNumber.toLowerCase().includes(search) ||
        e.firNumber.toLowerCase().includes(search) ||
        e.category.toLowerCase().includes(search) ||
        e.description.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    total: mockEvidence.length,
    physical: mockEvidence.filter((e) => e.type === "PHYSICAL").length,
    digital: mockEvidence.filter((e) => e.type === "DIGITAL").length,
    atLab: mockEvidence.filter((e) => e.status === "AT_LAB").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Evidence Management</h1>
            <p className="text-foreground-muted">
              Track chain of custody and manage physical and digital evidence
            </p>
          </div>
          {canAddEvidence && (
            <Link href="/evidence/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Register Evidence
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Total Evidence</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Physical</p>
                  <p className="text-2xl font-bold text-info">{stats.physical}</p>
                </div>
                <Package className="h-8 w-8 text-info opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Digital</p>
                  <p className="text-2xl font-bold text-success">{stats.digital}</p>
                </div>
                <HardDrive className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">At Lab</p>
                  <p className="text-2xl font-bold text-warning">{stats.atLab}</p>
                </div>
                <Clock className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="registry">
              <Package className="h-4 w-4 mr-2" />
              Evidence Registry
            </TabsTrigger>
            <TabsTrigger value="chain">
              <LinkIcon className="h-4 w-4 mr-2" />
              Chain of Custody
            </TabsTrigger>
            <TabsTrigger value="forensic">
              <Shield className="h-4 w-4 mr-2" />
              Forensic Requests
            </TabsTrigger>
          </TabsList>

          {/* Registry Tab */}
          <TabsContent value="registry" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by evidence number, FIR, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <Select
                    options={typeOptions}
                    value={typeFilter}
                    onChange={setTypeFilter}
                    className="w-full md:w-40"
                  />
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    className="w-full md:w-40"
                  />
                  <Button variant="secondary">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Evidence Registry ({filteredEvidence.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evidence ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>FIR</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Custodian</TableHead>
                      <TableHead>Integrity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvidence.map((evidence) => (
                      <TableRow key={evidence.id} className="hover:bg-background-tertiary">
                        <TableCell>
                          <span className="font-mono text-accent text-sm">
                            {evidence.evidenceNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(evidence.type)}
                            <span className="text-foreground">{evidence.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{evidence.category}</span>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/fir/${evidence.firNumber}`}
                            className="font-mono text-accent hover:underline"
                          >
                            {evidence.firNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(evidence.status) as any}>
                            {evidence.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground-muted">{evidence.currentCustodian}</span>
                        </TableCell>
                        <TableCell>
                          {evidence.integrityVerified ? (
                            <div className="flex items-center gap-1 text-success">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-warning">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">Pending</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canTransfer && (
                              <Button variant="ghost" size="sm">
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chain of Custody Tab */}
          <TabsContent value="chain" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chain of Custody Viewer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select
                    label="Select Evidence"
                    options={[
                      { value: "", label: "Select evidence to view chain" },
                      ...mockEvidence.map((e) => ({
                        value: e.id,
                        label: `${e.evidenceNumber} - ${e.category}`,
                      })),
                    ]}
                    value="evd-001"
                    onChange={() => {}}
                  />
                </div>

                {/* Chain visualization */}
                <div className="relative mt-6">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                  <div className="space-y-6">
                    {mockChainOfCustody[0].entries.map((entry, index) => (
                      <div key={index} className="relative pl-10">
                        <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-success/20 border border-success flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-success" />
                        </div>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <Badge variant="success" className="mb-2">
                                  {entry.action}
                                </Badge>
                                <p className="font-medium text-foreground">{entry.officer}</p>
                                <p className="text-sm text-foreground-muted">{entry.location}</p>
                                <p className="text-xs text-foreground-muted mt-1">
                                  {new Date(entry.date).toLocaleString("en-IN")}
                                </p>
                              </div>
                              <div className="text-right text-xs text-foreground-muted">
                                {entry.gps && <p>GPS: {entry.gps}</p>}
                                {entry.sealNumber && <p>Seal: {entry.sealNumber}</p>}
                                {entry.receiptNumber && <p>Receipt: {entry.receiptNumber}</p>}
                                {entry.labRef && <p>Lab Ref: {entry.labRef}</p>}
                              </div>
                            </div>
                            {entry.verified && (
                              <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 text-success text-xs">
                                <CheckCircle className="h-3 w-3" />
                                Biometric Verified
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Export Chain Report
                  </Button>
                  <Button variant="secondary">
                    <FileText className="h-4 w-4 mr-2" />
                    Print for Court
                  </Button>
                  <Button variant="ghost">
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Integrity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forensic Requests Tab */}
          <TabsContent value="forensic" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Forensic Lab Requests</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Lab</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockForensicRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <span className="font-mono text-accent">{request.requestId}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{request.evidenceNumber}</span>
                        </TableCell>
                        <TableCell>{request.testType}</TableCell>
                        <TableCell>{request.lab}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "IN_PROGRESS"
                                ? "info"
                                : request.status === "PENDING"
                                ? "warning"
                                : "success"
                            }
                          >
                            {request.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(request.eta).toLocaleDateString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
