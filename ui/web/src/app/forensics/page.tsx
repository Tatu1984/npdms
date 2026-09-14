"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Eye,
  Loader2,
  Play,
} from "lucide-react";
import { toast } from "@/stores/toastStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import {
  useCompleteForensic,
  useCreateForensic,
  useForensics,
  useForensicStats,
  useUpdateForensic,
} from "@/hooks/use-forensics";
import type { Forensic, ForensicPriority, ForensicStatus, ForensicType } from "@/lib/api/forensics";
import { casesApi } from "@/lib/api/cases";
import { evidenceApi } from "@/lib/api/evidence-register";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;
/** The evidence list endpoint takes no search or case filter, so the picker searches one large page. */
const EVIDENCE_PICKER_SIZE = 100;

const forensicTypes: Record<ForensicType, { label: string; icon: typeof Microscope; color: string; wrap: string; text: string }> = {
  FINGERPRINT: { label: "Fingerprint", icon: Fingerprint, color: "info", wrap: "bg-info/10", text: "text-info" },
  DNA: { label: "DNA Analysis", icon: Dna, color: "accent", wrap: "bg-accent/10", text: "text-accent" },
  BALLISTICS: { label: "Ballistics", icon: Target, color: "error", wrap: "bg-error/10", text: "text-error" },
  DIGITAL: { label: "Digital Forensics", icon: HardDrive, color: "warning", wrap: "bg-warning/10", text: "text-warning" },
  NARCOTICS: { label: "Narcotics", icon: Beaker, color: "error", wrap: "bg-error/10", text: "text-error" },
  DOCUMENT: { label: "Document Exam", icon: FileText, color: "muted", wrap: "bg-muted/10", text: "text-foreground-muted" },
};
const TYPE_KEYS = Object.keys(forensicTypes) as ForensicType[];

const statusConfig: Record<ForensicStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "muted" },
  IN_PROGRESS: { label: "In Progress", color: "warning" },
  COMPLETED: { label: "Completed", color: "success" },
  INCONCLUSIVE: { label: "Inconclusive", color: "info" },
};

/** A date input yields YYYY-MM-DD; the API's time.Time fields need RFC 3339. */
const toApiDate = (day: string) => `${day}T00:00:00Z`;
const today = () => new Date().toISOString().split("T")[0];
/** The API has no request number column; the stored id is the only reference. */
const reference = (f: Forensic) => f.requestNumber || `FSL-${f.id.slice(0, 8).toUpperCase()}`;

const emptyForm = () => ({
  evidenceId: "",
  evidenceLabel: "",
  caseId: "",
  caseLabel: "",
  caseFromEvidence: false,
  type: "FINGERPRINT" as ForensicType,
  priority: "MEDIUM" as ForensicPriority,
  lab: "",
  submittedDate: today(),
  expectedDate: "",
});

export default function ForensicsPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const search = useDeferredValue(searchQuery.trim());
  const [filterType, setFilterType] = useState<"ALL" | ForensicType>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | ForensicStatus>("ALL");
  const [page, setPage] = useState(1);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [evidenceSearch, setEvidenceSearch] = useState("");
  const [caseSearch, setCaseSearch] = useState("");
  const deferredCaseSearch = useDeferredValue(caseSearch.trim());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analyst, setAnalyst] = useState("");
  const [result, setResult] = useState({ summary: "", findings: "" });

  const requests = useForensics({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    type: filterType === "ALL" ? undefined : filterType,
    status: filterStatus === "ALL" ? undefined : filterStatus,
  });
  const stats = useForensicStats();
  const createRequest = useCreateForensic();
  const updateRequest = useUpdateForensic();
  const completeRequest = useCompleteForensic();

  const evidence = useQuery({
    queryKey: ["evidence", "register", EVIDENCE_PICKER_SIZE],
    queryFn: () => evidenceApi.list({ pageSize: EVIDENCE_PICKER_SIZE }),
  });
  const evidenceById = useMemo(
    () => new Map((evidence.data?.data ?? []).map((e) => [e.id, e])),
    [evidence.data]
  );
  const evidenceMatches = useMemo(() => {
    const q = evidenceSearch.trim().toLowerCase();
    return (evidence.data?.data ?? [])
      .filter((e) => !q || e.evidenceNumber.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
      .slice(0, 8);
  }, [evidence.data, evidenceSearch]);

  const caseResults = useQuery({
    queryKey: ["cases", "picker", deferredCaseSearch],
    queryFn: () => casesApi.list({ search: deferredCaseSearch || undefined, pageSize: 8 }),
    enabled: isNewRequestModalOpen && Boolean(formData.evidenceId) && !formData.caseId,
  });

  const canSubmit = user && hasMinimumRole(user.role, "SI");
  const rows = requests.data?.data ?? [];
  const totalPages = requests.data?.totalPages ?? 0;
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const evidenceLabel = (id: string) => evidenceById.get(id)?.evidenceNumber ?? `Evidence ${id.slice(0, 8)}`;

  const closeNewModal = () => {
    setIsNewRequestModalOpen(false);
    setFormData(emptyForm());
    setEvidenceSearch("");
    setCaseSearch("");
  };

  const closeDetails = () => {
    setSelectedId(null);
    setAnalyst("");
    setResult({ summary: "", findings: "" });
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.evidenceId || !formData.lab.trim()) {
      toast.error("Validation Error", "Choose an evidence item and a lab");
      return;
    }
    if (formData.expectedDate && formData.expectedDate < formData.submittedDate) {
      toast.error("Validation Error", "Expected date cannot be before the submitted date");
      return;
    }

    try {
      const created = await createRequest.mutateAsync({
        evidenceId: formData.evidenceId,
        caseId: formData.caseId || null,
        type: formData.type,
        priority: formData.priority,
        lab: formData.lab.trim(),
        submittedDate: toApiDate(formData.submittedDate),
        expectedDate: formData.expectedDate ? toApiDate(formData.expectedDate) : null,
      });
      toast.success("Request Recorded", `${reference(created)} sent to ${created.lab}`);
      closeNewModal();
    } catch (error) {
      toast.error("Request not created", error instanceof Error ? error.message : "The server rejected the request");
    }
  };

  const handleStartAnalysis = async (request: Forensic) => {
    if (!analyst.trim()) {
      toast.error("Validation Error", "Enter the analyst handling this request");
      return;
    }
    try {
      await updateRequest.mutateAsync({
        forensic: request,
        changes: { status: "IN_PROGRESS", analyst: analyst.trim() },
      });
      toast.success("Analysis Started", `${reference(request)} is with ${analyst.trim()}`);
      setAnalyst("");
    } catch (error) {
      toast.error("Request not updated", error instanceof Error ? error.message : "The server rejected the request");
    }
  };

  const handleComplete = async (request: Forensic) => {
    if (!result.summary.trim() || !result.findings.trim()) {
      toast.error("Validation Error", "Both a summary and the findings are required");
      return;
    }
    try {
      await completeRequest.mutateAsync({
        id: request.id,
        summary: result.summary.trim(),
        findings: result.findings.trim(),
      });
      toast.success("Findings Recorded", `${reference(request)} marked completed`);
      setResult({ summary: "", findings: "" });
    } catch (error) {
      toast.error("Findings not recorded", error instanceof Error ? error.message : "The server rejected the request");
    }
  };

  const setStatusFilter = (status: "ALL" | ForensicStatus) => {
    setFilterStatus(status);
    setPage(1);
  };

  const statCards: Array<{
    key: "ALL" | ForensicStatus;
    label: string;
    value: number | undefined;
    icon: typeof Microscope;
    wrap: string;
    iconColor: string;
  }> = [
    { key: "ALL", label: "Total Requests", value: stats.data?.total, icon: Microscope, wrap: "bg-accent/10", iconColor: "text-accent" },
    { key: "PENDING", label: "Pending", value: stats.data?.pending, icon: Clock, wrap: "bg-muted/10", iconColor: "text-foreground-muted" },
    { key: "IN_PROGRESS", label: "In Analysis", value: stats.data?.inProgress, icon: Beaker, wrap: "bg-warning/10", iconColor: "text-warning" },
    { key: "COMPLETED", label: "Completed", value: stats.data?.completed, icon: CheckCircle, wrap: "bg-success/10", iconColor: "text-success" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Forensic Lab Integration</h1>
            <p className="text-foreground-muted">Track forensic analysis requests and record lab findings</p>
          </div>
          {canSubmit && (
            <Button onClick={() => setIsNewRequestModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New FSL Request
            </Button>
          )}
        </div>

        {/* Stats — counts come from the server, not from the page of rows loaded */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ key, label, value, icon: Icon, wrap, iconColor }) => (
            <Card
              key={key}
              className={`cursor-pointer hover:border-accent/50 transition-colors ${
                filterStatus === key ? "border-accent ring-1 ring-accent" : ""
              }`}
              onClick={() => setStatusFilter(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${wrap}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.isError ? "—" : value ?? <Loader2 className="h-5 w-5 animate-spin" />}
                    </p>
                    <p className="text-xs text-foreground-muted">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analysis Types Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {TYPE_KEYS.map((key) => {
                const config = forensicTypes[key];
                const Icon = config.icon;
                return (
                  <div
                    key={key}
                    className={`text-center p-4 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-colors cursor-pointer ${
                      filterType === key ? "ring-1 ring-accent" : ""
                    }`}
                    onClick={() => {
                      setFilterType((current) => (current === key ? "ALL" : key));
                      setPage(1);
                    }}
                  >
                    <div className={`p-3 rounded-full ${config.wrap} w-fit mx-auto mb-2`}>
                      <Icon className={`h-6 w-6 ${config.text}`} />
                    </div>
                    <p className="text-sm font-medium text-foreground">{config.label}</p>
                    <p className="text-xs text-foreground-muted">
                      {filterType === key ? "Filtering" : "Filter"}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[16rem]">
                <Input
                  placeholder="Search by lab..."
                  value={searchQuery}
                  onChange={(v: string) => {
                    setSearchQuery(v);
                    setPage(1);
                  }}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as "ALL" | ForensicType);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Types</option>
                {TYPE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {forensicTypes[key].label}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setStatusFilter(e.target.value as "ALL" | ForensicStatus)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="INCONCLUSIVE">Inconclusive</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {requests.isPending ? (
          <Card>
            <CardContent className="p-12 flex items-center justify-center gap-3 text-foreground-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading forensic requests…
            </CardContent>
          </Card>
        ) : requests.isError ? (
          <Card className="border-error/30">
            <CardContent className="p-12 text-center space-y-3">
              <AlertTriangle className="h-12 w-12 text-error mx-auto" />
              <h3 className="text-lg font-medium text-foreground">Forensic requests could not be loaded</h3>
              <p className="text-foreground-muted">{requests.error.message}</p>
              <Button variant="secondary" onClick={() => requests.refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Microscope className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No requests found</h3>
              <p className="text-foreground-muted">
                {search || filterType !== "ALL" || filterStatus !== "ALL"
                  ? "Try adjusting your search or filter criteria"
                  : "No evidence has been sent for forensic analysis yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((request) => {
              const typeConfig = forensicTypes[request.type];
              const status = statusConfig[request.status];
              const TypeIcon = typeConfig.icon;

              return (
                <Card key={request.id} className="hover:border-accent/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${typeConfig.wrap}`}>
                          <TypeIcon className={`h-6 w-6 ${typeConfig.text}`} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-bold text-foreground">{reference(request)}</span>
                            <Badge variant={typeConfig.color as any}>{typeConfig.label}</Badge>
                            <Badge variant={status.color as any}>{status.label}</Badge>
                            {(request.priority === "HIGH" || request.priority === "CRITICAL") && (
                              <Badge variant="error">
                                {request.priority === "CRITICAL" ? "Critical" : "High"} Priority
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-foreground-muted">
                            Evidence: {evidenceLabel(request.evidenceId)}
                            {request.caseNumber && ` | Case: ${request.caseNumber}`}
                          </div>
                          <div className="text-sm text-foreground-muted">
                            Lab: {request.lab}
                            {request.analyst && ` | Analyst: ${request.analyst}`}
                          </div>
                          {request.progress !== null && (
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
                                <p className="text-xs text-success mt-1">Finding: {request.findings}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-sm text-foreground-muted">
                          <div className="flex items-center gap-2 justify-end">
                            <Calendar className="h-4 w-4" />
                            Submitted: {formatDate(request.submittedDate)}
                          </div>
                          {request.completedDate ? (
                            <div className="text-success mt-1">Completed: {formatDate(request.completedDate)}</div>
                          ) : request.expectedDate ? (
                            <div className="mt-1">Expected: {formatDate(request.expectedDate)}</div>
                          ) : null}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedId(request.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-foreground-muted">
                <span>
                  Page {page} of {totalPages} · {requests.data?.total} requests
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New FSL Request Modal */}
      <Modal
        isOpen={isNewRequestModalOpen}
        onClose={closeNewModal}
        title="New FSL Request"
        description="Send an evidence item for forensic lab analysis"
        size="lg"
      >
        <form onSubmit={handleCreateRequest}>
          <div className="space-y-4">
            {/* Evidence */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Evidence <span className="text-error">*</span>
              </label>
              {formData.evidenceId ? (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-foreground font-mono text-sm">{formData.evidenceLabel}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, evidenceId: "", evidenceLabel: "", caseId: "", caseLabel: "", caseFromEvidence: false })}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Search by evidence number or description"
                    value={evidenceSearch}
                    onChange={setEvidenceSearch}
                    icon={<Search className="h-4 w-4" />}
                  />
                  <div className="rounded-lg border border-border divide-y divide-border max-h-48 overflow-y-auto">
                    {evidence.isPending ? (
                      <p className="p-3 text-sm text-foreground-muted">Loading evidence register…</p>
                    ) : evidence.isError ? (
                      <p className="p-3 text-sm text-error">Evidence could not be loaded: {evidence.error.message}</p>
                    ) : evidenceMatches.length === 0 ? (
                      <p className="p-3 text-sm text-foreground-muted">No matching evidence</p>
                    ) : (
                      evidenceMatches.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full text-left p-3 hover:bg-background-tertiary"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              evidenceId: item.id,
                              evidenceLabel: `${item.evidenceNumber} · ${item.description}`,
                              caseId: item.caseId ?? "",
                              caseLabel: item.caseId ? "Linked to the evidence item's case" : "",
                              caseFromEvidence: Boolean(item.caseId),
                            })
                          }
                        >
                          <span className="font-mono text-sm text-foreground">{item.evidenceNumber}</span>
                          <span className="block text-xs text-foreground-muted">{item.description}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Case — carried from the evidence item where it has one, otherwise chosen from the register */}
            {formData.evidenceId && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Case</label>
                {formData.caseId ? (
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="text-foreground font-mono text-sm">{formData.caseLabel}</span>
                    {!formData.caseFromEvidence && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, caseId: "", caseLabel: "" })}
                      >
                        Change
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search by case number or title (optional)"
                      value={caseSearch}
                      onChange={setCaseSearch}
                      icon={<Search className="h-4 w-4" />}
                    />
                    <div className="rounded-lg border border-border divide-y divide-border max-h-40 overflow-y-auto">
                      {caseResults.isPending ? (
                        <p className="p-3 text-sm text-foreground-muted">Searching cases…</p>
                      ) : caseResults.isError ? (
                        <p className="p-3 text-sm text-error">Cases could not be loaded: {caseResults.error.message}</p>
                      ) : caseResults.data.data.length === 0 ? (
                        <p className="p-3 text-sm text-foreground-muted">No matching cases</p>
                      ) : (
                        caseResults.data.data.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full text-left p-3 hover:bg-background-tertiary"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                caseId: c.id,
                                caseLabel: [c.caseNumber, c.title].filter(Boolean).join(" · "),
                              })
                            }
                          >
                            <span className="font-mono text-sm text-foreground">{c.caseNumber}</span>
                            <span className="block text-xs text-foreground-muted">{c.title}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Analysis Type <span className="text-error">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ForensicType })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  {TYPE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {forensicTypes[key].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Priority <span className="text-error">*</span>
                </label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as ForensicPriority })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <Input
              label="Laboratory *"
              placeholder="e.g., State FSL, Kolkata"
              value={formData.lab}
              onChange={(value: string) => setFormData({ ...formData, lab: value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Submitted Date *"
                type="date"
                value={formData.submittedDate}
                onChange={(value: string) => setFormData({ ...formData, submittedDate: value })}
              />
              <Input
                label="Expected Date"
                type="date"
                value={formData.expectedDate}
                onChange={(value: string) => setFormData({ ...formData, expectedDate: value })}
              />
            </div>
          </div>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={closeNewModal} disabled={createRequest.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRequest.isPending}>
              {createRequest.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={selected !== null} onClose={closeDetails} title="Forensic Request Details" size="lg">
        {selected && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-foreground">{reference(selected)}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={forensicTypes[selected.type].color as any}>{forensicTypes[selected.type].label}</Badge>
                <Badge variant={statusConfig[selected.status].color as any}>{statusConfig[selected.status].label}</Badge>
                {(selected.priority === "HIGH" || selected.priority === "CRITICAL") && (
                  <Badge variant="error">{selected.priority === "CRITICAL" ? "Critical" : "High"} Priority</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground-muted">Evidence</p>
                <p className="text-foreground font-medium">{evidenceLabel(selected.evidenceId)}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Case Number</p>
                <p className="text-foreground font-medium">{selected.caseNumber || "Not linked"}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Laboratory</p>
                <p className="text-foreground font-medium">{selected.lab}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Analyst</p>
                <p className="text-foreground font-medium">{selected.analyst || "Not assigned"}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Submitted Date</p>
                <p className="text-foreground font-medium">{formatDate(selected.submittedDate)}</p>
              </div>
              {selected.completedDate ? (
                <div>
                  <p className="text-sm text-foreground-muted">Completed Date</p>
                  <p className="text-success font-medium">{formatDate(selected.completedDate)}</p>
                </div>
              ) : selected.expectedDate ? (
                <div>
                  <p className="text-sm text-foreground-muted">Expected Date</p>
                  <p className="text-foreground font-medium">{formatDate(selected.expectedDate)}</p>
                </div>
              ) : null}
            </div>

            {selected.progress !== null && (
              <div>
                <div className="flex items-center justify-between text-sm text-foreground-muted mb-2">
                  <span>Analysis Progress</span>
                  <span className="font-medium text-foreground">{selected.progress}%</span>
                </div>
                <div className="h-3 bg-background-tertiary rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${selected.progress}%` }} />
                </div>
              </div>
            )}

            {selected.summary && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm font-medium text-success mb-1">Summary</p>
                <p className="text-foreground">{selected.summary}</p>
                {selected.findings && (
                  <>
                    <p className="text-sm font-medium text-success mt-3 mb-1">Findings</p>
                    <p className="text-foreground">{selected.findings}</p>
                  </>
                )}
              </div>
            )}

            {canSubmit && selected.status === "PENDING" && (
              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground">Start analysis</p>
                <Input label="Analyst *" placeholder="Name of the examining analyst" value={analyst} onChange={setAnalyst} />
                <Button onClick={() => handleStartAnalysis(selected)} disabled={updateRequest.isPending}>
                  <Play className="h-4 w-4 mr-2" />
                  {updateRequest.isPending ? "Saving..." : "Mark In Progress"}
                </Button>
              </div>
            )}

            {canSubmit && (selected.status === "PENDING" || selected.status === "IN_PROGRESS") && (
              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground">Record lab findings</p>
                <Textarea
                  label="Summary *"
                  placeholder="Summary of the lab report"
                  value={result.summary}
                  onChange={(v: string) => setResult({ ...result, summary: v })}
                  rows={2}
                />
                <Textarea
                  label="Findings *"
                  placeholder="Findings as stated in the lab report"
                  value={result.findings}
                  onChange={(v: string) => setResult({ ...result, findings: v })}
                  rows={3}
                />
                <Button onClick={() => handleComplete(selected)} disabled={completeRequest.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {completeRequest.isPending ? "Recording..." : "Record Findings"}
                </Button>
              </div>
            )}

            <ModalFooter>
              <Button variant="ghost" onClick={closeDetails}>
                Close
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
