"use client";

import { useState, useEffect } from "react";
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
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useForensicsStore, ForensicRequest } from "@/stores/forensicsStore";

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
  const { requests, loadRequests, createRequest, setSelectedRequest, selectedRequest, getStats } = useForensicsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new request
  const [formData, setFormData] = useState({
    evidenceId: "",
    caseNumber: "",
    type: "FINGERPRINT" as ForensicRequest["type"],
    priority: "MEDIUM" as ForensicRequest["priority"],
    lab: "",
    expectedDate: "",
  });

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const canSubmit = user && hasMinimumRole(user.role, "SI");

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.evidenceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || req.type === filterType;
    const matchesStatus = filterStatus === "ALL" || req.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = getStats();

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createRequest({
        evidenceId: formData.evidenceId,
        caseNumber: formData.caseNumber,
        type: formData.type,
        priority: formData.priority,
        status: "PENDING",
        submittedDate: new Date().toISOString().split("T")[0],
        lab: formData.lab,
        expectedDate: formData.expectedDate,
      });

      // Reset form
      setFormData({
        evidenceId: "",
        caseNumber: "",
        type: "FINGERPRINT",
        priority: "MEDIUM",
        lab: "",
        expectedDate: "",
      });
      setIsNewRequestModalOpen(false);
    } catch (error) {
      console.error("Failed to create request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (request: ForensicRequest) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  const handleDownloadReport = (request: ForensicRequest) => {
    // Simulate report download
    alert(`Downloading report for ${request.id}...`);
    console.log("Downloading report for:", request);
  };

  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
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
            <Button onClick={() => setIsNewRequestModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New FSL Request
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:border-accent/50 transition-colors"
            onClick={() => handleStatusFilter("ALL")}
          >
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
          <Card
            className="cursor-pointer hover:border-accent/50 transition-colors"
            onClick={() => handleStatusFilter("PENDING")}
          >
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
          <Card
            className="cursor-pointer hover:border-accent/50 transition-colors"
            onClick={() => handleStatusFilter("IN_PROGRESS")}
          >
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
          <Card
            className="cursor-pointer hover:border-accent/50 transition-colors"
            onClick={() => handleStatusFilter("COMPLETED")}
          >
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
                const count = requests.filter((r) => r.type === key).length;
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
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(request)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {request.status === "COMPLETED" && (
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadReport(request)}>
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

      {/* New FSL Request Modal */}
      <Modal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
        title="New FSL Request"
        description="Submit evidence for forensic lab analysis"
        size="lg"
      >
        <form onSubmit={handleCreateRequest}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Evidence ID <span className="text-error">*</span>
                </label>
                <Input
                  required
                  value={formData.evidenceId}
                  onChange={(value: string) => setFormData({ ...formData, evidenceId: value })}
                  placeholder="EVD-2024-KOR-XXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Case Number <span className="text-error">*</span>
                </label>
                <Input
                  required
                  value={formData.caseNumber}
                  onChange={(value: string) => setFormData({ ...formData, caseNumber: value })}
                  placeholder="CASE-2024-XXXXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Analysis Type <span className="text-error">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as ForensicRequest["type"] })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="FINGERPRINT">Fingerprint Analysis</option>
                  <option value="DNA">DNA Analysis</option>
                  <option value="BALLISTICS">Ballistics</option>
                  <option value="DIGITAL">Digital Forensics</option>
                  <option value="NARCOTICS">Narcotics</option>
                  <option value="DOCUMENT">Document Examination</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Priority <span className="text-error">*</span>
                </label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as ForensicRequest["priority"] })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Laboratory <span className="text-error">*</span>
                </label>
                <select
                  required
                  value={formData.lab}
                  onChange={(e) => setFormData({ ...formData, lab: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="">Select Laboratory</option>
                  <option value="FSL Bangalore">FSL Bangalore</option>
                  <option value="FSL Delhi">FSL Delhi</option>
                  <option value="FSL Mumbai">FSL Mumbai</option>
                  <option value="Cyber Forensics Lab">Cyber Forensics Lab</option>
                  <option value="Document Examination Lab">Document Examination Lab</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Expected Date
                </label>
                <Input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(value: string) => setFormData({ ...formData, expectedDate: value })}
                />
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsNewRequestModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Forensic Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedRequest.id}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={
                      forensicTypes[selectedRequest.type as keyof typeof forensicTypes].color as any
                    }
                  >
                    {forensicTypes[selectedRequest.type as keyof typeof forensicTypes].label}
                  </Badge>
                  <Badge
                    variant={
                      statusConfig[selectedRequest.status as keyof typeof statusConfig].color as any
                    }
                  >
                    {statusConfig[selectedRequest.status as keyof typeof statusConfig].label}
                  </Badge>
                  {selectedRequest.priority === "HIGH" && (
                    <Badge variant="error">High Priority</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground-muted">Evidence ID</p>
                <p className="text-foreground font-medium">{selectedRequest.evidenceId}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Case Number</p>
                <p className="text-foreground font-medium">{selectedRequest.caseNumber}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Laboratory</p>
                <p className="text-foreground font-medium">{selectedRequest.lab}</p>
              </div>
              {selectedRequest.analyst && (
                <div>
                  <p className="text-sm text-foreground-muted">Analyst</p>
                  <p className="text-foreground font-medium">{selectedRequest.analyst}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground-muted">Submitted Date</p>
                <p className="text-foreground font-medium">{selectedRequest.submittedDate}</p>
              </div>
              {selectedRequest.completedDate ? (
                <div>
                  <p className="text-sm text-foreground-muted">Completed Date</p>
                  <p className="text-success font-medium">{selectedRequest.completedDate}</p>
                </div>
              ) : selectedRequest.expectedDate ? (
                <div>
                  <p className="text-sm text-foreground-muted">Expected Date</p>
                  <p className="text-foreground font-medium">{selectedRequest.expectedDate}</p>
                </div>
              ) : null}
            </div>

            {selectedRequest.progress !== undefined && (
              <div>
                <div className="flex items-center justify-between text-sm text-foreground-muted mb-2">
                  <span>Analysis Progress</span>
                  <span className="font-medium text-foreground">{selectedRequest.progress}%</span>
                </div>
                <div className="h-3 bg-background-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${selectedRequest.progress}%` }}
                  />
                </div>
              </div>
            )}

            {selectedRequest.devices && selectedRequest.devices.length > 0 && (
              <div>
                <p className="text-sm text-foreground-muted mb-2">Devices/Items</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.devices.map((device) => (
                    <span
                      key={device}
                      className="px-3 py-1 text-sm rounded-lg bg-background-tertiary text-foreground"
                    >
                      {device}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedRequest.items && selectedRequest.items.length > 0 && (
              <div>
                <p className="text-sm text-foreground-muted mb-2">Items</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.items.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 text-sm rounded-lg bg-background-tertiary text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedRequest.summary && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm font-medium text-success mb-1">Summary</p>
                <p className="text-foreground">{selectedRequest.summary}</p>
                {selectedRequest.findings && (
                  <>
                    <p className="text-sm font-medium text-success mt-3 mb-1">Findings</p>
                    <p className="text-foreground">{selectedRequest.findings}</p>
                  </>
                )}
              </div>
            )}

            <ModalFooter>
              <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
              {selectedRequest.status === "COMPLETED" && (
                <Button onClick={() => handleDownloadReport(selectedRequest)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              )}
            </ModalFooter>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
