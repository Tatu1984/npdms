"use client";

import { useState } from "react";
import {
  Scale,
  Search,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Gavel,
  IndianRupee,
  Eye,
  Printer,
  UserCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";

const mockBailApplications = [
  {
    id: "BAIL-2024-00089",
    accused: "Raju Kumar",
    caseNumber: "CASE-2024-00156",
    firNumber: "KOR/2024/00089",
    charges: ["IPC 392", "IPC 397"],
    status: "APPROVED",
    bailType: "REGULAR",
    applicationDate: "2024-01-22",
    hearingDate: "2024-01-25",
    approvalDate: "2024-01-25",
    court: "Sessions Court, Koramangala",
    judge: "Hon. Justice A.K. Sharma",
    bailAmount: 50000,
    suretyAmount: 100000,
    conditions: [
      "Report to police station every Sunday",
      "Do not leave jurisdiction without permission",
      "Surrender passport",
    ],
    sureties: [
      { name: "Suresh Kumar", relation: "Brother", verified: true },
    ],
  },
  {
    id: "BAIL-2024-00088",
    accused: "Mohammed Farooq",
    caseNumber: "CASE-2024-00135",
    firNumber: "KOR/2024/00060",
    charges: ["IPC 420", "IPC 406"],
    status: "REJECTED",
    bailType: "ANTICIPATORY",
    applicationDate: "2024-01-20",
    hearingDate: "2024-01-24",
    rejectionDate: "2024-01-24",
    rejectionReason: "Flight risk - accused has fled jurisdiction",
    court: "Sessions Court, Koramangala",
    judge: "Hon. Justice P.S. Reddy",
  },
  {
    id: "BAIL-2024-00087",
    accused: "Vijay Malhotra",
    caseNumber: "CASE-2024-00150",
    firNumber: "KOR/2024/00082",
    charges: ["IPC 304A"],
    status: "PENDING",
    bailType: "REGULAR",
    applicationDate: "2024-01-23",
    hearingDate: "2024-01-28",
    court: "Magistrate Court, Koramangala",
    proposedBailAmount: 25000,
    lawyer: "Adv. Ramesh Verma",
  },
  {
    id: "BAIL-2024-00086",
    accused: "Anand Sharma",
    caseNumber: "CASE-2024-00145",
    firNumber: "KOR/2024/00077",
    charges: ["NDPS 20"],
    status: "CANCELLED",
    bailType: "REGULAR",
    applicationDate: "2024-01-15",
    approvalDate: "2024-01-18",
    cancellationDate: "2024-01-22",
    cancellationReason: "Violation of bail conditions - failed to report",
    court: "Sessions Court, Koramangala",
    bailAmount: 100000,
  },
  {
    id: "BAIL-2024-00085",
    accused: "Priya Gupta",
    caseNumber: "CASE-2024-00142",
    firNumber: "KOR/2024/00072",
    charges: ["IPC 420"],
    status: "RELEASED",
    bailType: "INTERIM",
    applicationDate: "2024-01-12",
    approvalDate: "2024-01-12",
    releaseDate: "2024-01-12",
    court: "Magistrate Court, Koramangala",
    bailAmount: 10000,
    validUntil: "2024-02-12",
  },
];

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

export default function BailPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedBail, setSelectedBail] = useState<typeof mockBailApplications[0] | null>(null);

  const canProcess = user && hasMinimumRole(user.role, "SI");

  const filteredApplications = mockBailApplications.filter((bail) => {
    const matchesSearch =
      bail.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bail.accused.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bail.caseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || bail.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockBailApplications.length,
    pending: mockBailApplications.filter((b) => b.status === "PENDING").length,
    approved: mockBailApplications.filter((b) => b.status === "APPROVED" || b.status === "RELEASED").length,
    rejected: mockBailApplications.filter((b) => b.status === "REJECTED" || b.status === "CANCELLED").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bail Processing</h1>
            <p className="text-foreground-muted">
              Manage bail applications, approvals, and surety verification
            </p>
          </div>
          {canProcess && (
            <Button onClick={() => toast.info("New Application", "Opening bail application form...")}>
              <Plus className="h-4 w-4 mr-2" />
              Record New Application
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Scale className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-foreground-muted">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
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
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                  <p className="text-xs text-foreground-muted">Approved/Released</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <XCircle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                  <p className="text-xs text-foreground-muted">Rejected/Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by bail ID, accused name, or case..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
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

            {/* List */}
            <div className="space-y-3">
              {filteredApplications.map((bail) => {
                const status = statusConfig[bail.status as keyof typeof statusConfig];
                const type = bailTypes[bail.bailType as keyof typeof bailTypes];
                const StatusIcon = status.icon;

                return (
                  <Card
                    key={bail.id}
                    className={`cursor-pointer transition-colors ${
                      selectedBail?.id === bail.id
                        ? "border-accent"
                        : "hover:border-accent/50"
                    }`}
                    onClick={() => setSelectedBail(bail)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-foreground">{bail.id}</span>
                            <Badge variant={type.color as any}>{type.label}</Badge>
                            <Badge variant={status.color as any}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-foreground-muted" />
                            <span className="text-foreground">{bail.accused}</span>
                          </div>
                          <div className="text-sm text-foreground-muted">
                            {bail.caseNumber} | {bail.firNumber}
                          </div>
                          <div className="flex items-center gap-2">
                            {bail.charges.map((charge) => (
                              <span
                                key={charge}
                                className="px-2 py-0.5 text-xs rounded bg-background-tertiary text-foreground-muted"
                              >
                                {charge}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right text-sm text-foreground-muted">
                          <div>Applied: {bail.applicationDate}</div>
                          {bail.hearingDate && <div>Hearing: {bail.hearingDate}</div>}
                          {bail.bailAmount && (
                            <div className="flex items-center gap-1 justify-end mt-2 text-foreground">
                              <IndianRupee className="h-3 w-3" />
                              {bail.bailAmount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          <div>
            {selectedBail ? (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Bail Details</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toast.success("Print Ready", `Bail order ${selectedBail?.id} sent to printer`)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground-muted">Bail ID</p>
                    <p className="font-medium text-foreground">{selectedBail.id}</p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground-muted">Accused</p>
                    <p className="font-medium text-foreground">{selectedBail.accused}</p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground-muted">Court</p>
                    <p className="text-foreground">{selectedBail.court}</p>
                  </div>

                  {selectedBail.judge && (
                    <div>
                      <p className="text-sm text-foreground-muted">Judge</p>
                      <p className="text-foreground">{selectedBail.judge}</p>
                    </div>
                  )}

                  {selectedBail.bailAmount && (
                    <div>
                      <p className="text-sm text-foreground-muted">Bail Amount</p>
                      <p className="text-lg font-bold text-foreground flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {selectedBail.bailAmount.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedBail.suretyAmount && (
                    <div>
                      <p className="text-sm text-foreground-muted">Surety Amount</p>
                      <p className="text-foreground flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {selectedBail.suretyAmount.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedBail.conditions && (
                    <div>
                      <p className="text-sm text-foreground-muted mb-2">Bail Conditions</p>
                      <ul className="space-y-1">
                        {selectedBail.conditions.map((condition, i) => (
                          <li
                            key={i}
                            className="text-sm text-foreground flex items-start gap-2"
                          >
                            <span className="text-accent">•</span>
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedBail.sureties && (
                    <div>
                      <p className="text-sm text-foreground-muted mb-2">Sureties</p>
                      {selectedBail.sureties.map((surety, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-background-tertiary"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{surety.name}</p>
                              <p className="text-sm text-foreground-muted">{surety.relation}</p>
                            </div>
                            {surety.verified && (
                              <Badge variant="success">Verified</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedBail.rejectionReason && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                      <p className="text-sm text-error font-medium">Rejection Reason</p>
                      <p className="text-sm text-foreground-muted mt-1">
                        {selectedBail.rejectionReason}
                      </p>
                    </div>
                  )}

                  {selectedBail.cancellationReason && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                      <p className="text-sm text-error font-medium">Cancellation Reason</p>
                      <p className="text-sm text-foreground-muted mt-1">
                        {selectedBail.cancellationReason}
                      </p>
                    </div>
                  )}

                  {selectedBail.status === "PENDING" && canProcess && (
                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1" variant="secondary" onClick={() => toast.info("Add Surety", "Opening surety verification form...")}>
                        Add Surety
                      </Button>
                      <Button className="flex-1" onClick={() => toast.success("Status Updated", `Bail ${selectedBail.id} status updated to APPROVED`)}>
                        Update Status
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Scale className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                  <p className="text-foreground-muted">
                    Select a bail application to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
