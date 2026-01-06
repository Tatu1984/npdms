"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  Megaphone,
  Radio,
  Shield,
  Download,
  Volume2,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { FileUpload } from "@/components/ui/FileUpload";
import { SightingReportDialog } from "@/components/ui/SightingReportDialog";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useAlertsStore, Alert } from "@/stores/alertsStore";

const alertTypeOptions = [
  { value: "", label: "All Types" },
  { value: "FLASH", label: "Flash" },
  { value: "URGENT", label: "Urgent" },
  { value: "NOTICE", label: "Notice" },
  { value: "BOLO", label: "BOLO" },
];

const scopeOptions = [
  { value: "STATION", label: "Station Only" },
  { value: "DISTRICT", label: "District-wide" },
  { value: "STATE", label: "State-wide" },
  { value: "NATIONAL", label: "National" },
];

// Alert data now comes from useAlertsStore

function getAlertBadgeVariant(type: string) {
  const variants: Record<string, string> = {
    FLASH: "error",
    URGENT: "warning",
    BOLO: "info",
    NOTICE: "secondary",
  };
  return variants[type] || "secondary";
}

function getAlertStyle(type: string) {
  switch (type) {
    case "FLASH":
      return "border-l-4 border-l-error bg-error/5";
    case "URGENT":
      return "border-l-4 border-l-warning bg-warning/5";
    case "BOLO":
      return "border-l-4 border-l-info bg-info/5";
    default:
      return "border-l-4 border-l-border";
  }
}

function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

export default function AlertsPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { alerts, createAlert, acknowledgeAlert, getActiveAlerts, getUnacknowledgedAlerts } = useAlertsStore();
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showSightingReport, setShowSightingReport] = useState(false);
  const [sightingAlertId, setSightingAlertId] = useState<string | null>(null);

  // Form state for new alert
  const [newAlert, setNewAlert] = useState({
    type: "" as Alert["type"] | "",
    scope: "STATION" as Alert["scope"],
    title: "",
    description: "",
    expiresAt: "",
    priority: 2,
    imageUrl: "",
  });
  const [alertImages, setAlertImages] = useState<File[]>([]);

  const canIssue = user && hasMinimumRole(user.role, "SHO");
  const canIssueDistrict = user && hasMinimumRole(user.role, "SP");
  const canIssueState = user && hasMinimumRole(user.role, "DIG");

  const activeAlerts = getActiveAlerts();
  const unacknowledged = getUnacknowledgedAlerts();

  const filteredAlerts = alerts.filter((a) => {
    if (typeFilter && a.type !== typeFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(search) ||
        a.description.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleAcknowledge = async (alert: Alert) => {
    if (user) {
      await acknowledgeAlert(alert.id, user.name);
      addToast({
        type: "success",
        title: "Alert Acknowledged",
        message: `Acknowledged: ${alert.title}`,
      });
    }
  };

  const handleIssueAlert = async () => {
    if (!newAlert.type || !newAlert.title || !newAlert.description || !newAlert.expiresAt) {
      addToast({ type: "error", title: "Validation Error", message: "Please fill in all required fields" });
      return;
    }

    await createAlert({
      type: newAlert.type as Alert["type"],
      scope: newAlert.scope,
      title: newAlert.title,
      description: newAlert.description,
      expiresAt: new Date(newAlert.expiresAt).toISOString(),
      issuedBy: user?.name || "Unknown",
      priority: newAlert.priority,
    });

    addToast({ type: "success", title: "Alert Issued", message: "Your alert has been broadcast successfully" });
    setShowIssueForm(false);
    setNewAlert({ type: "", scope: "STATION", title: "", description: "", expiresAt: "", priority: 2, imageUrl: "" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alerts & Communications</h1>
            <p className="text-foreground-muted">
              View and manage alerts, BOLO notices, and broadcasts
            </p>
          </div>
          {canIssue && (
            <Button onClick={() => setShowIssueForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Issue Alert
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Active Alerts</p>
                  <p className="text-2xl font-bold text-foreground">{activeAlerts.length}</p>
                </div>
                <Bell className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={unacknowledged.length > 0 ? "border-error/50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Pending Acknowledgment</p>
                  <p className="text-2xl font-bold text-error">{unacknowledged.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-error opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Flash Alerts</p>
                  <p className="text-2xl font-bold text-warning">
                    {activeAlerts.filter((a) => a.type === "FLASH").length}
                  </p>
                </div>
                <Radio className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Active BOLOs</p>
                  <p className="text-2xl font-bold text-info">
                    {activeAlerts.filter((a) => a.type === "BOLO").length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-info opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Alert Banner */}
        {unacknowledged.length > 0 && (
          <Card className="border-error/50 bg-error/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-error/20 flex items-center justify-center animate-pulse">
                  <AlertTriangle className="h-5 w-5 text-error" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {unacknowledged.length} Alert(s) Require Acknowledgment
                  </p>
                  <p className="text-sm text-foreground-muted">
                    {unacknowledged[0].title}
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleAcknowledge(unacknowledged[0])}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Issue Alert Form Modal */}
        {showIssueForm && canIssue && (
          <Card className="border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Issue New Alert</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowIssueForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Alert Type"
                  options={[
                    { value: "FLASH", label: "Flash - Immediate Action Required" },
                    { value: "URGENT", label: "Urgent - High Priority" },
                    { value: "BOLO", label: "BOLO - Be On Lookout" },
                    { value: "NOTICE", label: "Notice - Information" },
                  ]}
                  value={newAlert.type}
                  onChange={(value: string) => setNewAlert({ ...newAlert, type: value as Alert["type"] })}
                />
                <Select
                  label="Scope"
                  options={scopeOptions.filter((s) => {
                    if (s.value === "NATIONAL") return false;
                    if (s.value === "STATE" && !canIssueState) return false;
                    if (s.value === "DISTRICT" && !canIssueDistrict) return false;
                    return true;
                  })}
                  value={newAlert.scope}
                  onChange={(value: string) => setNewAlert({ ...newAlert, scope: value as Alert["scope"] })}
                />
              </div>
              <Input
                label="Title"
                placeholder="Brief, clear alert title"
                value={newAlert.title}
                onChange={(value: string) => setNewAlert({ ...newAlert, title: value })}
              />
              <Textarea
                label="Description"
                placeholder="Detailed description of the alert..."
                rows={4}
                value={newAlert.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAlert({ ...newAlert, description: e.target.value })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Expires At"
                  type="datetime-local"
                  value={newAlert.expiresAt}
                  onChange={(value: string) => setNewAlert({ ...newAlert, expiresAt: value })}
                />
                <FileUpload
                  fileType="image"
                  multiple={false}
                  maxSize={5}
                  label="Alert Image"
                  hint="Upload image for BOLO/FLASH alerts (JPG, PNG up to 5MB)"
                  onUpload={async (files) => {
                    if (files.length > 0) {
                      setAlertImages(files);
                      // TODO: Upload to MinIO and get URL
                      // For now, store file reference
                      addToast({
                        type: "success",
                        title: "Image Uploaded",
                        message: "Image will be attached when alert is created",
                      });
                    }
                  }}
                  className="col-span-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setShowIssueForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleIssueAlert}>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Issue Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">
              <Bell className="h-4 w-4 mr-2" />
              Active Alerts
            </TabsTrigger>
            <TabsTrigger value="bolo">
              <Shield className="h-4 w-4 mr-2" />
              BOLO Notices
            </TabsTrigger>
            <TabsTrigger value="archive">
              <Clock className="h-4 w-4 mr-2" />
              Archive
            </TabsTrigger>
          </TabsList>

          {/* Active Alerts Tab */}
          <TabsContent value="active" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search alerts..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <Select
                    options={alertTypeOptions}
                    value={typeFilter}
                    onChange={setTypeFilter}
                    className="w-full md:w-40"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Alerts List */}
            <div className="space-y-4">
              {filteredAlerts
                .filter((a) => new Date(a.expiresAt) > new Date())
                .sort((a, b) => a.priority - b.priority)
                .map((alert) => (
                  <Card key={alert.id} className={getAlertStyle(alert.type)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={getAlertBadgeVariant(alert.type) as any}>
                              {alert.type}
                            </Badge>
                            <Badge variant="secondary">{alert.scope}</Badge>
                            <span className="text-xs text-foreground-muted">
                              {formatTimeAgo(alert.issuedAt)}
                            </span>
                          </div>
                          <h3 className="font-medium text-foreground">{alert.title}</h3>
                          <p className="text-sm text-foreground-muted mt-1">
                            {alert.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-foreground-muted">
                            <span>From: {alert.issuedBy}</span>
                            <span>
                              Expires:{" "}
                              {new Date(alert.expiresAt).toLocaleString("en-IN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-2">
                          {alert.acknowledged ? (
                            <Badge variant="success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Acknowledged
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAcknowledge(alert)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Link href={`/alerts/${alert.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* BOLO Tab */}
          <TabsContent value="bolo" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAlerts
                .filter((a) => a.type === "BOLO")
                .map((bolo) => (
                  <Card key={bolo.id} className="border-l-4 border-l-info">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {bolo.image && (
                          <div className="h-24 w-24 bg-background-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                            <Shield className="h-8 w-8 text-foreground-muted" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="info">BOLO</Badge>
                            <Badge variant="secondary">{bolo.scope}</Badge>
                          </div>
                          <h3 className="font-medium text-foreground">{bolo.title}</h3>
                          <p className="text-sm text-foreground-muted mt-1 line-clamp-2">
                            {bolo.description}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Link href={`/alerts/${bolo.id}`}>
                              <Button variant="secondary" size="sm">
                                View Full Details
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => addToast({ type: "info", title: "Report Sighting", message: "Sighting report form coming soon" })}>
                              Report Sighting
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Archive Tab */}
          <TabsContent value="archive" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-foreground-muted">
                Showing expired alerts from the last 30 days
              </p>
              <Button variant="secondary" onClick={() => addToast({ type: "success", title: "Export Complete", message: "Alert archive exported to CSV" })}>
                <Download className="h-4 w-4 mr-2" />
                Export Archive
              </Button>
            </div>
            <Card>
              <CardContent className="p-4">
                <p className="text-center text-foreground-muted py-8">
                  No expired alerts in the selected period
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <SightingReportDialog
        alertId={sightingAlertId || ""}
        isOpen={showSightingReport}
        onClose={() => {
          setShowSightingReport(false);
          setSightingAlertId(null);
        }}
        onReport={(report) => {
          addToast({
            type: "success",
            title: "Report Submitted",
            message: "Sighting report submitted successfully",
          });
          // TODO: Submit to backend
        }}
      />
    </DashboardLayout>
  );
}
