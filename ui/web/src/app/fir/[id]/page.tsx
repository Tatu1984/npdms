"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  User,
  MapPin,
  Calendar,
  Clock,
  Phone,
  Edit,
  Printer,
  Briefcase,
  Loader2,
  AlertTriangle,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SectionPicker } from "@/components/ui/SectionPicker";
import { useFIR, useFIRTimeline, useSetFIRStatus, useUpdateFIR } from "@/hooks/use-firs";
import { useOfficers } from "@/hooks/use-investigation";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { ApiClientError } from "@/lib/api/client";
import type { FIR, FIRPriority, FIRStatus } from "@/lib/api/firs";
import { formatDate, formatDateTime } from "@/lib/utils";

const statusBadge: Record<FIRStatus, string> = {
  DRAFT: "secondary",
  REGISTERED: "registered",
  UNDER_INVESTIGATION: "investigating",
  CHARGESHEET_FILED: "chargesheet",
  CLOSED: "closed",
  TRANSFERRED: "transferred",
};

const priorityBadge: Record<FIRPriority, string> = {
  LOW: "low",
  MEDIUM: "normal",
  HIGH: "high",
  CRITICAL: "critical",
};

const statusOptions: { value: FIRStatus; label: string }[] = [
  { value: "REGISTERED", label: "Registered" },
  { value: "UNDER_INVESTIGATION", label: "Under Investigation" },
  { value: "CHARGESHEET_FILED", label: "Chargesheet Filed" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "CLOSED", label: "Closed" },
];

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-foreground-muted">{label}</p>
      <div className="text-foreground">{value ?? <span className="text-foreground-muted">Not recorded</span>}</div>
    </div>
  );
}

type EditForm = {
  complainantName: string;
  complainantPhone: string;
  complainantAddress: string;
  incidentLocation: string;
  incidentDescription: string;
  ipcSections: string[];
  priority: FIRPriority;
  investigatingOfficer: string;
};

const toEditForm = (fir: FIR): EditForm => ({
  complainantName: fir.complainantName,
  complainantPhone: fir.complainantPhone ?? "",
  complainantAddress: fir.complainantAddress ?? "",
  incidentLocation: fir.incidentLocation,
  incidentDescription: fir.incidentDescription,
  ipcSections: fir.ipcSections,
  priority: fir.priority,
  investigatingOfficer: fir.investigatingOfficer ?? "",
});

export default function FIRDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("details");

  const { data: fir, isPending, isError, error, refetch } = useFIR(params.id);
  const timeline = useFIRTimeline(params.id);
  const updateFIR = useUpdateFIR();
  const setStatus = useSetFIRStatus();

  const canEdit = user && hasMinimumRole(user.role, "SI");
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [nextStatus, setNextStatus] = useState<FIRStatus | null>(null);
  const officers = useOfficers();

  // /fir/{id}?edit=true, linked from the register, opens the editor once loaded.
  useEffect(() => {
    if (fir && canEdit && searchParams.get("edit") === "true" && editForm === null) {
      setEditForm(toEditForm(fir));
      router.replace(`/fir/${fir.id}`);
    }
  }, [fir, canEdit, searchParams, editForm, router]);

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 gap-3 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading FIR…
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiClientError && error.code === 404;
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-2 text-center">
          <AlertTriangle className="h-12 w-12 text-warning mb-2" />
          <h2 className="text-xl font-bold text-foreground">{notFound ? "FIR Not Found" : "FIR could not be loaded"}</h2>
          <p className="text-foreground-muted mb-2">{notFound ? "The requested FIR does not exist." : error.message}</p>
          <div className="flex gap-2">
            {!notFound && (
              <Button variant="secondary" onClick={() => refetch()}>
                Try again
              </Button>
            )}
            <Link href="/fir">
              <Button>Back to FIR Register</Button>
            </Link>
          </div>
        </div>
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
    if (editForm.complainantName.trim().length < 2 || editForm.incidentLocation.trim().length < 5) {
      toast.error("Validation Error", "Complainant name and incident location are required");
      return;
    }
    if (editForm.complainantPhone && !/^[6-9]\d{9}$/.test(editForm.complainantPhone)) {
      toast.error("Validation Error", "Phone must be 10 digits starting with 6-9");
      return;
    }
    if (editForm.ipcSections.length === 0) {
      toast.error("Validation Error", "Select at least one section");
      return;
    }
    try {
      await updateFIR.mutateAsync({
        fir,
        changes: {
          complainantName: editForm.complainantName.trim(),
          complainantPhone: editForm.complainantPhone || null,
          complainantAddress: editForm.complainantAddress.trim() || null,
          incidentLocation: editForm.incidentLocation.trim(),
          incidentDescription: editForm.incidentDescription.trim(),
          ipcSections: editForm.ipcSections,
          priority: editForm.priority,
          investigatingOfficer: editForm.investigatingOfficer || null,
        },
      });
      toast.success("FIR Updated", `${fir.firNumber} has been updated`);
      setEditForm(null);
    } catch (err) {
      toast.error("FIR not updated", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  const confirmStatus = async () => {
    if (!nextStatus) return;
    try {
      await setStatus.mutateAsync({ id: fir.id, status: nextStatus });
      toast.success("Status Changed", `${fir.firNumber} is now ${nextStatus.replace(/_/g, " ").toLowerCase()}`);
      setNextStatus(null);
    } catch (err) {
      toast.error("Status not changed", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  const entries = timeline.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground font-mono">{fir.firNumber}</h1>
                <Badge variant={statusBadge[fir.status] as any}>{fir.status.replace(/_/g, " ")}</Badge>
                <Badge variant={priorityBadge[fir.priority] as any}>{fir.priority}</Badge>
              </div>
              <p className="text-foreground-muted">
                {fir.ipcSections.join(", ")}
                {fir.stationName && ` — ${fir.stationName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            {canEdit && (
              <Button onClick={() => setEditForm(toEditForm(fir))}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Field label="FIR Number" value={<span className="font-mono text-accent">{fir.firNumber}</span>} />
              <Field label="Registered On" value={formatDateTime(fir.createdAt)} />
              <Field label="Registered By" value={fir.registeredByName || null} />
              <Field label="Investigating Officer" value={fir.ioName || "Unassigned"} />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Complainant Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <Field label="Name" value={<span className="font-medium">{fir.complainantName}</span>} />
                    <Field
                      label="Phone"
                      value={
                        fir.complainantPhone ? (
                          <span className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {fir.complainantPhone}
                          </span>
                        ) : null
                      }
                    />
                    <div className="col-span-2">
                      <Field label="Address" value={fir.complainantAddress} />
                    </div>
                    <Field label="ID Type" value={fir.complainantIdType} />
                    <Field label="ID Number" value={fir.complainantIdNumber} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Incident Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field
                        label="Date & Time"
                        value={
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(fir.incidentDate)}
                            {fir.incidentTime && ` at ${fir.incidentTime.slice(0, 5)}`}
                          </span>
                        }
                      />
                      <Field label="Location" value={fir.incidentLocation} />
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Sections</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {fir.ipcSections.map((section) => (
                          <Badge key={section} variant="secondary">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Description</p>
                      <p className="text-foreground mt-1 whitespace-pre-line">{fir.incidentDescription}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {canEdit && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {statusOptions
                        .filter((o) => o.value !== fir.status)
                        .map((o) => (
                          <Button
                            key={o.value}
                            variant="secondary"
                            className="w-full justify-start"
                            onClick={() => setNextStatus(o.value)}
                            disabled={setStatus.isPending}
                          >
                            Mark {o.label}
                          </Button>
                        ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Follow-up</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link href={`/cases/new?firId=${fir.id}`} className="block">
                      <Button variant="secondary" className="w-full justify-start">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Register Case from this FIR
                      </Button>
                    </Link>
                    <Link href="/evidence/new" className="block">
                      <Button variant="secondary" className="w-full justify-start">
                        <Package className="h-4 w-4 mr-2" />
                        Register Evidence
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            {timeline.isPending ? (
              <div className="flex items-center gap-3 text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading timeline…
              </div>
            ) : timeline.isError ? (
              <div className="space-y-2">
                <p className="text-error">Timeline could not be loaded: {timeline.error.message}</p>
                <Button variant="secondary" size="sm" onClick={() => timeline.refetch()}>
                  Try again
                </Button>
              </div>
            ) : entries.length === 0 ? (
              <p className="text-foreground-muted">No audit entries are recorded for this FIR.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-6">
                  {entries.map((event) => (
                    <div key={event.id} className="relative pl-10">
                      <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-background-secondary border border-border flex items-center justify-center">
                        <Clock className="h-4 w-4 text-accent" />
                      </div>
                      <div className="p-4 rounded-lg bg-background-secondary">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted mb-1">
                          <span>{formatDateTime(event.timestamp)}</span>
                          <span>•</span>
                          <span>{event.user}</span>
                        </div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        {event.description && <p className="text-sm text-foreground-muted">{event.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-foreground-muted mt-4">From the hash-chained audit trail.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit */}
      <Modal
        isOpen={editForm !== null}
        onClose={() => setEditForm(null)}
        title={`Edit ${fir.firNumber}`}
        description="Changes are recorded in the audit trail. The incident date and time are fixed at registration."
        size="lg"
      >
        {editForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Complainant Name *"
                value={editForm.complainantName}
                onChange={(v: string) => setEditForm({ ...editForm, complainantName: v })}
              />
              <Input
                label="Complainant Phone"
                type="tel"
                value={editForm.complainantPhone}
                onChange={(v: string) =>
                  setEditForm({ ...editForm, complainantPhone: v.replace(/\D/g, "").slice(0, 10) })
                }
              />
            </div>
            <Textarea
              label="Complainant Address"
              rows={2}
              value={editForm.complainantAddress}
              onChange={(v: string) => setEditForm({ ...editForm, complainantAddress: v })}
            />
            <Input
              label="Incident Location *"
              value={editForm.incidentLocation}
              onChange={(v: string) => setEditForm({ ...editForm, incidentLocation: v })}
            />
            <Textarea
              label="Incident Description"
              rows={5}
              value={editForm.incidentDescription}
              onChange={(v: string) => setEditForm({ ...editForm, incidentDescription: v })}
            />
            <SectionPicker
              value={editForm.ipcSections}
              onChange={(s) => setEditForm({ ...editForm, ipcSections: s })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Priority"
                options={priorityOptions}
                value={editForm.priority}
                onChange={(v: string) => setEditForm({ ...editForm, priority: v as FIRPriority })}
              />
              <Select
                label="Investigating Officer"
                options={officerOptions}
                value={editForm.investigatingOfficer}
                onChange={(v: string) => setEditForm({ ...editForm, investigatingOfficer: v })}
              />
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditForm(null)}>
            Cancel
          </Button>
          <Button onClick={saveEdit} disabled={updateFIR.isPending}>
            {updateFIR.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Status confirmation */}
      <Modal
        isOpen={nextStatus !== null}
        onClose={() => setNextStatus(null)}
        title="Change FIR status?"
        description={
          nextStatus
            ? `${fir.firNumber} will move from ${fir.status.replace(/_/g, " ")} to ${nextStatus.replace(/_/g, " ")}. The change is recorded in the audit trail.`
            : undefined
        }
      >
        <ModalFooter>
          <Button variant="secondary" onClick={() => setNextStatus(null)}>
            Cancel
          </Button>
          <Button onClick={confirmStatus} disabled={setStatus.isPending}>
            {setStatus.isPending ? "Saving..." : "Confirm"}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
