"use client";

import { useState } from "react";
import {
  FileSearch,
  Search,
  Filter,
  Clock,
  User,
  FileText,
  Shield,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

const mockAuditLogs = [
  {
    id: "AUD-2024-00456",
    timestamp: "2024-01-25 14:32:15",
    user: "SI Ramesh Kumar",
    userId: "USR-4521",
    action: "UPDATE",
    resource: "FIR",
    resourceId: "KOR/2024/00089",
    description: "Updated FIR status from 'Registered' to 'Under Investigation'",
    ipAddress: "192.168.1.45",
    userAgent: "Chrome/120.0 Windows",
    success: true,
  },
  {
    id: "AUD-2024-00455",
    timestamp: "2024-01-25 14:28:00",
    user: "HC Suresh M",
    userId: "USR-5234",
    action: "VIEW",
    resource: "EVIDENCE",
    resourceId: "EVD-2024-KOR-00156",
    description: "Viewed evidence details and chain of custody",
    ipAddress: "192.168.1.52",
    userAgent: "Firefox/121.0 Linux",
    success: true,
  },
  {
    id: "AUD-2024-00454",
    timestamp: "2024-01-25 14:15:30",
    user: "SI Priya Sharma",
    userId: "USR-4523",
    action: "CREATE",
    resource: "CASE",
    resourceId: "CASE-2024-00157",
    description: "Created new case from FIR KOR/2024/00095",
    ipAddress: "192.168.1.48",
    userAgent: "Safari/17.0 macOS",
    success: true,
  },
  {
    id: "AUD-2024-00453",
    timestamp: "2024-01-25 13:45:00",
    user: "Unknown",
    userId: "USR-0000",
    action: "LOGIN_FAILED",
    resource: "AUTH",
    resourceId: "N/A",
    description: "Failed login attempt with invalid credentials",
    ipAddress: "103.45.67.89",
    userAgent: "Chrome/119.0 Windows",
    success: false,
    failureReason: "Invalid password - 3rd attempt",
  },
  {
    id: "AUD-2024-00452",
    timestamp: "2024-01-25 13:30:00",
    user: "Inspector Venkatesh",
    userId: "USR-3421",
    action: "DELETE",
    resource: "DOCUMENT",
    resourceId: "DOC-2024-00234",
    description: "Deleted draft report (authorized deletion)",
    ipAddress: "192.168.1.35",
    userAgent: "Edge/120.0 Windows",
    success: true,
  },
  {
    id: "AUD-2024-00451",
    timestamp: "2024-01-25 12:00:00",
    user: "SHO Rajendra Singh",
    userId: "USR-2341",
    action: "APPROVE",
    resource: "BAIL",
    resourceId: "BAIL-2024-00089",
    description: "Approved bail surety verification",
    ipAddress: "192.168.1.20",
    userAgent: "Chrome/120.0 Android",
    success: true,
  },
  {
    id: "AUD-2024-00450",
    timestamp: "2024-01-25 11:30:00",
    user: "System",
    userId: "SYSTEM",
    action: "SYNC",
    resource: "DATABASE",
    resourceId: "DB-MAIN",
    description: "Automated daily backup completed",
    ipAddress: "127.0.0.1",
    userAgent: "SystemAgent/1.0",
    success: true,
  },
  {
    id: "AUD-2024-00449",
    timestamp: "2024-01-25 10:15:00",
    user: "HC Anjali S",
    userId: "USR-5678",
    action: "EXPORT",
    resource: "REPORT",
    resourceId: "RPT-2024-0045",
    description: "Exported monthly crime statistics report",
    ipAddress: "192.168.1.55",
    userAgent: "Chrome/120.0 Windows",
    success: true,
  },
];

const actionConfig = {
  CREATE: { label: "Create", color: "success", icon: Plus },
  UPDATE: { label: "Update", color: "info", icon: Edit },
  DELETE: { label: "Delete", color: "error", icon: Trash2 },
  VIEW: { label: "View", color: "muted", icon: Eye },
  LOGIN: { label: "Login", color: "success", icon: CheckCircle },
  LOGIN_FAILED: { label: "Login Failed", color: "error", icon: XCircle },
  LOGOUT: { label: "Logout", color: "muted", icon: XCircle },
  APPROVE: { label: "Approve", color: "success", icon: CheckCircle },
  REJECT: { label: "Reject", color: "error", icon: XCircle },
  EXPORT: { label: "Export", color: "warning", icon: Download },
  SYNC: { label: "Sync", color: "accent", icon: RefreshCw },
};

const resourceConfig = {
  FIR: { label: "FIR", color: "info" },
  CASE: { label: "Case", color: "accent" },
  EVIDENCE: { label: "Evidence", color: "warning" },
  PERSONNEL: { label: "Personnel", color: "success" },
  AUTH: { label: "Authentication", color: "error" },
  BAIL: { label: "Bail", color: "info" },
  WARRANT: { label: "Warrant", color: "error" },
  DOCUMENT: { label: "Document", color: "muted" },
  REPORT: { label: "Report", color: "accent" },
  DATABASE: { label: "Database", color: "success" },
};

export default function AuditPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterResource, setFilterResource] = useState("ALL");
  const [filterSuccess, setFilterSuccess] = useState("ALL");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const canViewAll = user && hasMinimumRole(user.role, "DSP");

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    const matchesResource = filterResource === "ALL" || log.resource === filterResource;
    const matchesSuccess =
      filterSuccess === "ALL" ||
      (filterSuccess === "SUCCESS" && log.success) ||
      (filterSuccess === "FAILED" && !log.success);
    return matchesSearch && matchesAction && matchesResource && matchesSuccess;
  });

  const stats = {
    total: mockAuditLogs.length,
    successful: mockAuditLogs.filter((l) => l.success).length,
    failed: mockAuditLogs.filter((l) => !l.success).length,
    critical: mockAuditLogs.filter((l) => l.action === "DELETE" || l.action === "LOGIN_FAILED").length,
  };

  if (!canViewAll) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
            <p className="text-foreground-muted">
              Audit logs are only accessible to DSP level and above.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-foreground-muted">
              Track all system activities and user actions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => alert("Exporting audit logs to CSV...")}>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <FileSearch className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-foreground-muted">Total Events</p>
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
                  <p className="text-2xl font-bold text-foreground">{stats.successful}</p>
                  <p className="text-xs text-foreground-muted">Successful</p>
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
                  <p className="text-2xl font-bold text-foreground">{stats.failed}</p>
                  <p className="text-xs text-foreground-muted">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.critical}</p>
                  <p className="text-xs text-foreground-muted">Critical Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[250px]">
                <Input
                  placeholder="Search logs by ID, user, description..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Actions</option>
                {Object.entries(actionConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={filterResource}
                onChange={(e) => setFilterResource(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Resources</option>
                {Object.entries(resourceConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={filterSuccess}
                onChange={(e) => setFilterSuccess(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Results</option>
                <option value="SUCCESS">Successful</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log) => {
                    const action = actionConfig[log.action as keyof typeof actionConfig] || {
                      label: log.action,
                      color: "muted",
                      icon: FileText,
                    };
                    const resource = resourceConfig[log.resource as keyof typeof resourceConfig] || {
                      label: log.resource,
                      color: "muted",
                    };
                    const ActionIcon = action.icon;

                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-background-secondary transition-colors ${
                          !log.success ? "bg-error/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-foreground-muted" />
                            <div>
                              <p className="text-sm text-foreground">{log.timestamp}</p>
                              <p className="text-xs text-foreground-muted">{log.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-foreground-muted" />
                            <div>
                              <p className="text-sm text-foreground">{log.user}</p>
                              <p className="text-xs text-foreground-muted">{log.userId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={action.color as any}>
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {action.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <Badge variant={resource.color as any}>{resource.label}</Badge>
                            <p className="text-xs text-foreground-muted mt-1">{log.resourceId}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-sm text-foreground truncate">{log.description}</p>
                          {log.failureReason && (
                            <p className="text-xs text-error mt-1">{log.failureReason}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {log.success ? (
                            <Badge variant="success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="error">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-foreground-muted">{log.ipAddress}</p>
                          <p className="text-xs text-foreground-muted truncate max-w-[150px]">
                            {log.userAgent}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-muted">
            Showing {filteredLogs.length} of {mockAuditLogs.length} entries
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled>
              Previous
            </Button>
            <Button variant="secondary" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
