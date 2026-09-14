"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  Plus,
  Scale,
  Gavel,
  Loader2,
  Package,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LegacySelect as Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { SectionPicker } from "@/components/ui/SectionPicker";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import {
  useAddCaseAccused,
  useAddCaseWitness,
  useCase,
  useCaseAccused,
  useCaseWitnesses,
  useUpdateCase,
} from "@/hooks/use-cases";
import { useOfficers } from "@/hooks/use-investigation";
import { toast } from "@/stores/toastStore";
import { ApiClientError } from "@/lib/api/client";
import {
  ACCUSED_STATUSES,
  CASE_STATUSES,
  type AccusedStatus,
  type Case,
  type CasePriority,
  type CaseStatus,
} from "@/lib/api/cases";
import { formatDate } from "@/lib/utils";

const statusConfig: Record<CaseStatus, { color: string; label: string }> = {
  REGISTERED: { color: "info", label: "Registered" },
  UNDER_INVESTIGATION: { color: "warning", label: "Under Investigation" },
  CHARGESHEET_FILED: { color: "accent", label: "Chargesheet Filed" },
  IN_COURT: { color: "info", label: "In Court" },
  CONVICTION: { color: "success", label: "Conviction" },
  ACQUITTAL: { color: "error", label: "Acquittal" },
  CLOSED: { color: "muted", label: "Closed" },
};

const priorityConfig: Record<CasePriority, { color: string; label: string }> = {
  LOW: { color: "success", label: "Low" },
  MEDIUM: { color: "info", label: "Medium" },
  HIGH: { color: "warning", label: "High" },
  CRITICAL: { color: "error", label: "Critical" },
};

const accusedStatusLabel: Record<AccusedStatus, string> = {
  ABSCONDING: "Absconding",
  ARRESTED: "Arrested",
  IN_CUSTODY: "In Custody",
  ON_BAIL: "On Bail",
  RELEASED: "Released",
};

const genderOptions = [
  { value: "", label: "Not recorded" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Transgender", label: "Transgender" },
];

const idTypes = [
  { value: "", label: "Not recorded" },
  { value: "Aadhaar", label: "Aadhaar Card" },
  { value: "PAN", label: "PAN Card" },
  { value: "Voter ID", label: "Voter ID" },
  { value: "Passport", label: "Passport" },
  { value: "Driving License", label: "Driving License" },
];

const witnessTypes = [
  { value: "", label: "Not recorded" },
  { value: "EYEWITNESS", label: "Eyewitness" },
  { value: "VICTIM", label: "Victim" },
  { value: "SEIZURE", label: "Seizure witness" },
  { value: "EXPERT", label: "Expert" },
  { value: "OTHER", label: "Other" },
];

const toApiDate = (day: string) => `${day}T00:00:00Z`;

const emptyAccused = () => ({
  name: "",
  alias: "",
  age: "",
  gender: "",
  address: "",
  idType: "",
  idNumber: "",
  status: "ABSCONDING" as AccusedStatus,
  arrestDate: "",
  description: "",
});

const emptyWitness = () => ({
  name: "",
  phone: "",
  address: "",
  witnessType: "",
  statementRecorded: false,
  statementDate: "",
  statementText: "",
});

type EditForm = {
  title: string;
  synopsis: string;
  status: CaseStatus;
  priority: CasePriority;
  ipcSections: string[];
  investigatingOfficer: string;
  courtName: string;
  courtCaseNumber: string;
  nextHearingDate: string;
};

const toEditForm = (c: Case): EditForm => ({
  title: c.title,
  synopsis: c.synopsis ?? "",
  status: c.status,
  priority: c.priority,
  ipcSections: c.ipcSections,
  investigatingOfficer: c.investigatingOfficer ?? "",
  courtName: c.courtName ?? "",
  courtCaseNumber: c.courtCaseNumber ?? "",
  nextHearingDate: c.nextHearingDate ? c.nextHearingDate.split("T")[0] : "",
});

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "accused" | "court">("overview");

  const { data: currentCase, isPending, isError, error, refetch } = useCase(params.id);
  const accused = useCaseAccused(params.id);
  const witnesses = useCaseWitnesses(params.id);
  const updateCase = useUpdateCase();
  const addAccused = useAddCaseAccused();
  const addWitness = useAddCaseWitness();
  const officers = useOfficers();

  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [accusedForm, setAccusedForm] = useState<ReturnType<typeof emptyAccused> | null>(null);
  const [witnessForm, setWitnessForm] = useState<ReturnType<typeof emptyWitness> | null>(null);

  const canEdit = user && hasMinimumRole(user.role, "SI");

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12 gap-3 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading case…
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiClientError && error.code === 404;
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-error mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              {notFound ? "Case Not Found" : "Case could not be loaded"}
            </h2>
            <p className="text-foreground-muted mb-4">{notFound ? "The requested case does not exist." : error.message}</p>
            <div className="flex justify-center gap-2">
              {!notFound && (
                <Button variant="secondary" onClick={() => refetch()}>
                  Try again
                </Button>
              )}
              <Link href="/cases">
                <Button>Back to Cases</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const officerOptions = [
    { value: "", label: "Unassigned" },
    ...(officers.data ?? []).map((o) => ({
      value: o.id,
      label: `${o.roleLabel} ${o.name}${o.stationName ? ` · ${o.stationName}` : ""} (${o.openCases} open)`,
    })),
  ];

  const saveEdit = async () => {
    if (!editForm) return;
    if (editForm.title.trim().length < 5) {
      toast.error("Validation Error", "Case title must be at least 5 characters");
      return;
    }
    try {
      await updateCase.mutateAsync({
        current: currentCase,
        changes: {
          title: editForm.title.trim(),
          synopsis: editForm.synopsis.trim() || null,
          status: editForm.status,
          priority: editForm.priority,
          ipcSections: editForm.ipcSections,
          investigatingOfficer: editForm.investigatingOfficer || null,
          courtName: editForm.courtName.trim() || null,
          courtCaseNumber: editForm.courtCaseNumber.trim() || null,
          nextHearingDate: editForm.nextHearingDate ? toApiDate(editForm.nextHearingDate) : null,
        },
      });
      toast.success("Case Updated", `${currentCase.caseNumber} has been updated`);
      setEditForm(null);
    } catch (err) {
      toast.error("Case not updated", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  const saveAccused = async () => {
    if (!accusedForm) return;
    if (accusedForm.name.trim().length < 2) {
      toast.error("Validation Error", "Name must be at least 2 characters");
      return;
    }
    const age = accusedForm.age ? Number(accusedForm.age) : null;
    if (age !== null && (!Number.isInteger(age) || age < 7 || age > 120)) {
      toast.error("Validation Error", "Age must be a whole number between 7 and 120");
      return;
    }
    try {
      const added = await addAccused.mutateAsync({
        caseId: currentCase.id,
        input: {
          firId: currentCase.firId,
          name: accusedForm.name.trim(),
          alias: accusedForm.alias.trim() || null,
          age,
          gender: accusedForm.gender || null,
          address: accusedForm.address.trim() || null,
          idType: accusedForm.idType || null,
          idNumber: accusedForm.idNumber.trim() || null,
          status: accusedForm.status,
          arrestDate: accusedForm.arrestDate ? toApiDate(accusedForm.arrestDate) : null,
          description: accusedForm.description.trim() || null,
        },
      });
      toast.success("Accused Added", `${added.name} has been added to ${currentCase.caseNumber}`);
      setAccusedForm(null);
    } catch (err) {
      toast.error("Accused not added", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  const saveWitness = async () => {
    if (!witnessForm) return;
    if (witnessForm.name.trim().length < 2) {
      toast.error("Validation Error", "Name must be at least 2 characters");
      return;
    }
    if (witnessForm.phone && !/^[6-9]\d{9}$/.test(witnessForm.phone)) {
      toast.error("Validation Error", "Phone must be 10 digits starting with 6-9");
      return;
    }
    try {
      const added = await addWitness.mutateAsync({
        caseId: currentCase.id,
        input: {
          firId: currentCase.firId,
          name: witnessForm.name.trim(),
          phone: witnessForm.phone || null,
          address: witnessForm.address.trim() || null,
          witnessType: witnessForm.witnessType || null,
          statementRecorded: witnessForm.statementRecorded,
          statementDate:
            witnessForm.statementRecorded && witnessForm.statementDate ? toApiDate(witnessForm.statementDate) : null,
          statementText: witnessForm.statementRecorded ? witnessForm.statementText.trim() || null : null,
        },
      });
      toast.success("Witness Added", `${added.name} has been added to ${currentCase.caseNumber}`);
      setWitnessForm(null);
    } catch (err) {
      toast.error("Witness not added", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  const accusedRows = accused.data ?? [];
  const witnessRows = witnesses.data ?? [];
  const status = statusConfig[currentCase.status];
  const priority = priorityConfig[currentCase.priority];

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "accused", label: "Accused & Witnesses", icon: Users },
    { id: "court", label: "Court", icon: Gavel },
  ] as const;

  const count = (q: { isPending: boolean; isError: boolean; data?: unknown[] }) =>
    q.isError ? "—" : q.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : q.data?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground font-mono">{currentCase.caseNumber}</h1>
                <Badge variant={status?.color as any}>{status?.label ?? currentCase.status}</Badge>
                <Badge variant={priority?.color as any}>{priority?.label ?? currentCase.priority} Priority</Badge>
              </div>
              <p className="text-foreground-muted mt-1">{currentCase.title}</p>
              <p className="text-sm text-foreground-muted mt-1">
                FIR:{" "}
                <Link href={`/fir/${currentCase.firId}`} className="font-mono text-accent hover:underline">
                  {currentCase.firNumber || "View FIR"}
                </Link>{" "}
                | Registered: {formatDate(currentCase.createdAt)}
              </p>
            </div>
          </div>
          {canEdit && (
            <Button onClick={() => setEditForm(toEditForm(currentCase))}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Case
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <Users className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{count(accused)}</p>
                  <p className="text-xs text-foreground-muted">Accused</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{count(witnesses)}</p>
                  <p className="text-xs text-foreground-muted">Witnesses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {currentCase.nextHearingDate ? formatDate(currentCase.nextHearingDate) : "Not Set"}
                  </p>
                  <p className="text-xs text-foreground-muted">Next Hearing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-border overflow-x-auto">
          <nav className="flex gap-4" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-foreground-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeTab === "overview" && (
            <>
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Case Synopsis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground-muted whitespace-pre-line">
                      {currentCase.synopsis || "No synopsis recorded."}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5" />
                      Applicable Sections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentCase.ipcSections.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {currentCase.ipcSections.map((section) => (
                          <Badge key={section} variant="muted" className="text-sm">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-foreground-muted">No sections recorded.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Investigation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-background-tertiary">
                      <p className="text-sm text-foreground-muted">Investigating Officer</p>
                      <p className="font-medium text-foreground">{currentCase.ioName || "Unassigned"}</p>
                    </div>
                    {currentCase.category && (
                      <div>
                        <p className="text-sm text-foreground-muted">Category</p>
                        <p className="text-foreground">{currentCase.category.replace(/_/g, " ")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Follow-up</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link href="/evidence/new" className="block">
                      <Button variant="secondary" className="w-full justify-start">
                        <Package className="h-4 w-4 mr-2" />
                        Register Evidence
                      </Button>
                    </Link>
                    <Link href="/court" className="block">
                      <Button variant="secondary" className="w-full justify-start">
                        <Gavel className="h-4 w-4 mr-2" />
                        Court Diary
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === "accused" && (
            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Accused Persons</CardTitle>
                    {canEdit && (
                      <Button size="sm" onClick={() => setAccusedForm(emptyAccused())}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Accused
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {accused.isPending ? (
                    <p className="flex items-center gap-2 text-foreground-muted">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading accused…
                    </p>
                  ) : accused.isError ? (
                    <p className="text-error">Accused could not be loaded: {accused.error.message}</p>
                  ) : accusedRows.length === 0 ? (
                    <p className="text-foreground-muted">No accused recorded on this case.</p>
                  ) : (
                    <div className="space-y-4">
                      {accusedRows.map((person) => (
                        <div
                          key={person.id}
                          className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-background-tertiary"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {person.name}
                              {person.alias && <span className="text-foreground-muted"> alias {person.alias}</span>}
                            </p>
                            <p className="text-sm text-foreground-muted">
                              {[
                                person.age !== null && `${person.age} yrs`,
                                person.gender,
                                person.address,
                                person.arrestDate && `arrested ${formatDate(person.arrestDate)}`,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "No further details recorded"}
                            </p>
                            {person.description && <p className="text-sm text-foreground-muted">{person.description}</p>}
                          </div>
                          <Badge
                            variant={
                              person.status === "ABSCONDING" ? "error" : person.status === "ARRESTED" || person.status === "IN_CUSTODY" ? "success" : "warning"
                            }
                          >
                            {accusedStatusLabel[person.status] ?? person.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Witnesses</CardTitle>
                    {canEdit && (
                      <Button size="sm" onClick={() => setWitnessForm(emptyWitness())}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Witness
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {witnesses.isPending ? (
                    <p className="flex items-center gap-2 text-foreground-muted">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading witnesses…
                    </p>
                  ) : witnesses.isError ? (
                    <p className="text-error">Witnesses could not be loaded: {witnesses.error.message}</p>
                  ) : witnessRows.length === 0 ? (
                    <p className="text-foreground-muted">No witnesses recorded on this case.</p>
                  ) : (
                    <div className="space-y-4">
                      {witnessRows.map((w) => (
                        <div
                          key={w.id}
                          className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-background-tertiary"
                        >
                          <div>
                            <p className="font-medium text-foreground">{w.name}</p>
                            <p className="text-sm text-foreground-muted">
                              {[w.witnessType?.replace(/_/g, " ").toLowerCase(), w.phone, w.address].filter(Boolean).join(" · ") ||
                                "No further details recorded"}
                            </p>
                          </div>
                          <Badge variant={w.statementRecorded ? "success" : "warning"}>
                            Statement: {w.statementRecorded ? `Recorded${w.statementDate ? ` ${formatDate(w.statementDate)}` : ""}` : "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "court" && (
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Court Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-lg bg-background-tertiary">
                      <p className="text-sm text-foreground-muted">Court Name</p>
                      <p className="font-medium text-foreground mt-1">{currentCase.courtName || "Not assigned"}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background-tertiary">
                      <p className="text-sm text-foreground-muted">Court Case Number</p>
                      <p className="font-medium text-foreground mt-1">{currentCase.courtCaseNumber || "Not recorded"}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <p className="text-sm text-accent">Next Hearing</p>
                      <p className="font-bold text-accent mt-1">
                        {currentCase.nextHearingDate ? formatDate(currentCase.nextHearingDate) : "Not scheduled"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground-muted">
                    Hearings and orders are recorded in the{" "}
                    <Link href="/court" className="text-accent hover:underline">
                      court diary
                    </Link>
                    .
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Edit case */}
      <Modal
        isOpen={editForm !== null}
        onClose={() => setEditForm(null)}
        title={`Edit ${currentCase.caseNumber}`}
        description="Changes are recorded in the audit trail."
        size="lg"
      >
        {editForm && (
          <div className="space-y-4">
            <Input
              label="Case Title *"
              value={editForm.title}
              onChange={(v: string) => setEditForm({ ...editForm, title: v })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                options={CASE_STATUSES.map((s) => ({ value: s, label: statusConfig[s].label }))}
                value={editForm.status}
                onChange={(v: string) => setEditForm({ ...editForm, status: v as CaseStatus })}
              />
              <Select
                label="Priority"
                options={(Object.keys(priorityConfig) as CasePriority[]).map((p) => ({
                  value: p,
                  label: priorityConfig[p].label,
                }))}
                value={editForm.priority}
                onChange={(v: string) => setEditForm({ ...editForm, priority: v as CasePriority })}
              />
            </div>
            <Textarea
              label="Synopsis"
              rows={4}
              value={editForm.synopsis}
              onChange={(v: string) => setEditForm({ ...editForm, synopsis: v })}
            />
            <SectionPicker
              value={editForm.ipcSections}
              onChange={(s) => setEditForm({ ...editForm, ipcSections: s })}
            />
            <Select
              label="Investigating Officer"
              options={officerOptions}
              value={editForm.investigatingOfficer}
              onChange={(v: string) => setEditForm({ ...editForm, investigatingOfficer: v })}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Court"
                placeholder="e.g. City Sessions Court, Calcutta"
                value={editForm.courtName}
                onChange={(v: string) => setEditForm({ ...editForm, courtName: v })}
              />
              <Input
                label="Court Case Number"
                value={editForm.courtCaseNumber}
                onChange={(v: string) => setEditForm({ ...editForm, courtCaseNumber: v })}
              />
              <Input
                label="Next Hearing"
                type="date"
                value={editForm.nextHearingDate}
                onChange={(v: string) => setEditForm({ ...editForm, nextHearingDate: v })}
              />
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditForm(null)}>
            Cancel
          </Button>
          <Button onClick={saveEdit} disabled={updateCase.isPending}>
            {updateCase.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add accused */}
      <Modal
        isOpen={accusedForm !== null}
        onClose={() => setAccusedForm(null)}
        title="Add Accused"
        description={`Recorded against ${currentCase.caseNumber} and its FIR.`}
        size="lg"
      >
        {accusedForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name *"
                value={accusedForm.name}
                onChange={(v: string) => setAccusedForm({ ...accusedForm, name: v })}
              />
              <Input
                label="Alias"
                value={accusedForm.alias}
                onChange={(v: string) => setAccusedForm({ ...accusedForm, alias: v })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Age"
                type="number"
                value={accusedForm.age}
                onChange={(v: string) => setAccusedForm({ ...accusedForm, age: v })}
              />
              <Select
                label="Gender"
                options={genderOptions}
                value={accusedForm.gender}
                onChange={(v: string) => setAccusedForm({ ...accusedForm, gender: v })}
              />
              <Select
                label="Status *"
                options={ACCUSED_STATUSES.map((s) => ({ value: s, label: accusedStatusLabel[s] }))}
                value={accusedForm.status}
                onChange={(v: string) => setAccusedForm({ ...accusedForm, status: v as AccusedStatus })}
              />
            </div>
            <Textarea
              label="Address"
              rows={2}
              value={accusedForm.address}
              onChange={(v: string) => setAccusedForm({ ...accusedForm, address: v })}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="ID Type"
                options={idTypes}
                value={accusedForm.idType}
                onChange={(v: string) => setAccusedForm({ ...accusedForm, idType: v })}
              />
              <Input
                label="ID Number"
                value={accusedForm.idNumber}
                disabled={!accusedForm.idType}
                onChange={(v: string) => setAccusedForm({ ...accusedForm, idNumber: v })}
              />
              <Input
                label="Arrest Date"
                type="date"
                value={accusedForm.arrestDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(v: string) => setAccusedForm({ ...accusedForm, arrestDate: v })}
              />
            </div>
            <Textarea
              label="Description"
              placeholder="Physical description, role in the offence"
              rows={2}
              value={accusedForm.description}
              onChange={(v: string) => setAccusedForm({ ...accusedForm, description: v })}
            />
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setAccusedForm(null)}>
            Cancel
          </Button>
          <Button onClick={saveAccused} disabled={addAccused.isPending}>
            {addAccused.isPending ? "Adding..." : "Add Accused"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add witness */}
      <Modal
        isOpen={witnessForm !== null}
        onClose={() => setWitnessForm(null)}
        title="Add Witness"
        description={`Recorded against ${currentCase.caseNumber} and its FIR.`}
        size="lg"
      >
        {witnessForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Name *"
                value={witnessForm.name}
                onChange={(v: string) => setWitnessForm({ ...witnessForm, name: v })}
              />
              <Input
                label="Phone"
                type="tel"
                value={witnessForm.phone}
                onChange={(v: string) => setWitnessForm({ ...witnessForm, phone: v.replace(/\D/g, "").slice(0, 10) })}
              />
              <Select
                label="Type"
                options={witnessTypes}
                value={witnessForm.witnessType}
                onChange={(v: string) => setWitnessForm({ ...witnessForm, witnessType: v })}
              />
            </div>
            <Textarea
              label="Address"
              rows={2}
              value={witnessForm.address}
              onChange={(v: string) => setWitnessForm({ ...witnessForm, address: v })}
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="rounded"
                checked={witnessForm.statementRecorded}
                onChange={(e) => setWitnessForm({ ...witnessForm, statementRecorded: e.target.checked })}
              />
              Statement recorded (BNSS 180)
            </label>
            {witnessForm.statementRecorded && (
              <div className="space-y-4">
                <Input
                  label="Statement Date"
                  type="date"
                  value={witnessForm.statementDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(v: string) => setWitnessForm({ ...witnessForm, statementDate: v })}
                />
                <Textarea
                  label="Statement"
                  rows={4}
                  value={witnessForm.statementText}
                  onChange={(v: string) => setWitnessForm({ ...witnessForm, statementText: v })}
                />
              </div>
            )}
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setWitnessForm(null)}>
            Cancel
          </Button>
          <Button onClick={saveWitness} disabled={addWitness.isPending}>
            {addWitness.isPending ? "Adding..." : "Add Witness"}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
