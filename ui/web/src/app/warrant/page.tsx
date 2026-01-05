"use client";

import { useState } from "react";
import {
  FileWarning,
  Search,
  Plus,
  Filter,
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
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";

const mockWarrants = [
  {
    id: "WAR-2024-00045",
    type: "ARREST",
    status: "ACTIVE",
    issuedFor: "Rajesh Kumar Singh",
    caseNumber: "CASE-2024-00156",
    firNumber: "KOR/2024/00089",
    issuedBy: "Sessions Court, Koramangala",
    issuedDate: "2024-01-20",
    validUntil: "2024-04-20",
    charges: ["IPC 392", "IPC 397"],
    lastKnownLocation: "Marathahalli, Bangalore",
    priority: "HIGH",
  },
  {
    id: "WAR-2024-00044",
    type: "SEARCH",
    status: "EXECUTED",
    issuedFor: "Premises at 45, MG Road",
    caseNumber: "CASE-2024-00148",
    firNumber: "KOR/2024/00075",
    issuedBy: "Magistrate Court, Koramangala",
    issuedDate: "2024-01-18",
    validUntil: "2024-01-25",
    executedDate: "2024-01-19",
    charges: ["NDPS Act 20"],
    priority: "MEDIUM",
  },
  {
    id: "WAR-2024-00043",
    type: "ARREST",
    status: "EXPIRED",
    issuedFor: "Unknown Male (Alias: Chotu)",
    caseNumber: "CASE-2024-00140",
    firNumber: "KOR/2024/00068",
    issuedBy: "Sessions Court, Koramangala",
    issuedDate: "2024-01-10",
    validUntil: "2024-01-17",
    charges: ["IPC 379"],
    lastKnownLocation: "Electronic City",
    priority: "LOW",
  },
  {
    id: "WAR-2024-00042",
    type: "SUMMONS",
    status: "ACTIVE",
    issuedFor: "Priya Sharma (Witness)",
    caseNumber: "CASE-2024-00156",
    firNumber: "KOR/2024/00089",
    issuedBy: "Sessions Court, Koramangala",
    issuedDate: "2024-01-22",
    validUntil: "2024-02-15",
    hearingDate: "2024-02-20",
    priority: "MEDIUM",
  },
  {
    id: "WAR-2024-00041",
    type: "NBW",
    status: "ACTIVE",
    issuedFor: "Mohammed Farooq",
    caseNumber: "CASE-2024-00135",
    firNumber: "KOR/2024/00060",
    issuedBy: "Sessions Court, Koramangala",
    issuedDate: "2024-01-15",
    validUntil: "2024-07-15",
    charges: ["IPC 420", "IPC 406"],
    lastKnownLocation: "Unknown - Fled jurisdiction",
    priority: "HIGH",
  },
];

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

export default function WarrantPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const canCreate = user && hasMinimumRole(user.role, "SI");

  const filteredWarrants = mockWarrants.filter((warrant) => {
    const matchesSearch =
      warrant.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warrant.issuedFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warrant.caseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || warrant.type === filterType;
    const matchesStatus = filterStatus === "ALL" || warrant.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: mockWarrants.length,
    active: mockWarrants.filter((w) => w.status === "ACTIVE").length,
    executed: mockWarrants.filter((w) => w.status === "EXECUTED").length,
    expired: mockWarrants.filter((w) => w.status === "EXPIRED").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Warrant Management</h1>
            <p className="text-foreground-muted">
              Track and manage arrest warrants, search warrants, and summons
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => toast.info("Warrant Request", "Opening warrant request form...")}>
              <Plus className="h-4 w-4 mr-2" />
              New Warrant Request
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <FileWarning className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-foreground-muted">Total Warrants</p>
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
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  <p className="text-xs text-foreground-muted">Active</p>
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
                  <p className="text-2xl font-bold text-foreground">{stats.executed}</p>
                  <p className="text-xs text-foreground-muted">Executed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <AlertTriangle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.expired}</p>
                  <p className="text-xs text-foreground-muted">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by warrant ID, name, or case number..."
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
                <option value="ARREST">Arrest Warrant</option>
                <option value="SEARCH">Search Warrant</option>
                <option value="SUMMONS">Summons</option>
                <option value="NBW">Non-Bailable</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="EXECUTED">Executed</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Warrant List */}
        <div className="space-y-4">
          {filteredWarrants.map((warrant) => {
            const typeConfig = warrantTypes[warrant.type as keyof typeof warrantTypes];
            const status = statusConfig[warrant.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;

            return (
              <Card key={warrant.id} className="hover:border-accent/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-${typeConfig.color}/10`}>
                        <FileWarning className={`h-6 w-6 text-${typeConfig.color}`} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground">{warrant.id}</span>
                          <Badge variant={typeConfig.color as any}>{typeConfig.label}</Badge>
                          <Badge variant={status.color as any}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          {warrant.priority === "HIGH" && (
                            <Badge variant="error">High Priority</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-foreground-muted" />
                          <span className="text-foreground">{warrant.issuedFor}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-foreground-muted">
                          <span>Case: {warrant.caseNumber}</span>
                          <span>FIR: {warrant.firNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground-muted">
                          <Gavel className="h-4 w-4" />
                          <span>{warrant.issuedBy}</span>
                        </div>
                        {warrant.charges && (
                          <div className="flex items-center gap-2">
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
                          Issued: {warrant.issuedDate}
                        </div>
                        <div className="mt-1">
                          Valid Until: {warrant.validUntil}
                        </div>
                        {warrant.executedDate && (
                          <div className="mt-1 text-success">
                            Executed: {warrant.executedDate}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => toast.info("Warrant Details", `Viewing warrant ${warrant.id}`)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toast.success("Print Ready", `Warrant ${warrant.id} sent to printer`)}>
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
        </div>

        {filteredWarrants.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileWarning className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No warrants found</h3>
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
