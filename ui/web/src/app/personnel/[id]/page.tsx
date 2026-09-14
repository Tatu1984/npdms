"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Edit,
  Briefcase,
  AlertTriangle,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { DutyAssignmentDialog } from "@/components/ui/DutyAssignmentDialog";
import { useAuthStore, hasMinimumRole, getRoleDisplayName } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useAssignDuty, usePersonnelById, useUpdatePersonnel } from "@/hooks/use-personnel";
import type { Personnel, PersonnelRank, PersonnelStatus } from "@/lib/api/personnel";
import { ApiClientError } from "@/lib/api/client";
import { formatDate, formatDateTime } from "@/lib/utils";

const rankOptions: Array<{ value: PersonnelRank; label: string }> = [
  { value: "CONSTABLE", label: "Constable" },
  { value: "HEAD_CONSTABLE", label: "Head Constable" },
  { value: "ASI", label: "Assistant Sub-Inspector" },
  { value: "SI", label: "Sub-Inspector" },
  { value: "INSPECTOR", label: "Inspector" },
  { value: "SHO", label: "Station House Officer" },
  { value: "DSP", label: "Deputy SP" },
  { value: "SP", label: "Superintendent of Police" },
  { value: "DIG", label: "Deputy Inspector General" },
  { value: "IG", label: "Inspector General" },
  { value: "DGP", label: "Director General of Police" },
];

const statusOptions: Array<{ value: PersonnelStatus; label: string }> = [
  { value: "ON_DUTY", label: "On Duty" },
  { value: "OFF_DUTY", label: "Off Duty" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "TRAINING", label: "Training" },
  { value: "SUSPENDED", label: "Suspended" },
];

const shiftOptions = [
  { value: "", label: "No shift" },
  { value: "Day (0600-1400)", label: "Day Shift (06:00 - 14:00)" },
  { value: "Evening (1400-2200)", label: "Evening Shift (14:00 - 22:00)" },
  { value: "Night (2200-0600)", label: "Night Shift (22:00 - 06:00)" },
  { value: "Full Day (0800-2000)", label: "Full Day (08:00 - 20:00)" },
  { value: "On Call", label: "On Call" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "ON_DUTY":
      return <Badge variant="success">On Duty</Badge>;
    case "OFF_DUTY":
      return <Badge variant="secondary">Off Duty</Badge>;
    case "ON_LEAVE":
      return <Badge variant="warning">On Leave</Badge>;
    case "TRAINING":
      return <Badge variant="info">Training</Badge>;
    case "SUSPENDED":
      return <Badge variant="error">Suspended</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-2 ${last ? "" : "border-b border-border"}`}>
      <span className="text-foreground-muted">{label}</span>
      <span className="text-foreground text-right">{children}</span>
    </div>
  );
}

const notRecorded = <span className="text-foreground-muted">Not recorded</span>;

type EditForm = {
  badgeNumber: string;
  rank: PersonnelRank;
  status: PersonnelStatus;
  currentDuty: string;
  shift: string;
  leaveType: string;
  leaveUntil: string;
};

const formFrom = (p: Personnel): EditForm => ({
  badgeNumber: p.badgeNumber,
  rank: p.rank,
  status: p.status,
  currentDuty: p.currentDuty ?? "",
  shift: p.shift ?? "",
  leaveType: p.leaveType ?? "",
  leaveUntil: p.leaveUntil ? p.leaveUntil.slice(0, 10) : "",
});

export default function OfficerDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { data: officer, isPending, isError, error, refetch } = usePersonnelById(params.id);
  const updatePersonnel = useUpdatePersonnel();
  const assignDuty = useAssignDuty();

  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [requestedEdit, setRequestedEdit] = useState(searchParams.get("edit") === "true");
  const [dutyDialogOpen, setDutyDialogOpen] = useState(false);

  // Mirrors the API: update and assign-duty need SHO or above.
  const canEdit = user && hasMinimumRole(user.role, "SHO");

  // Open the editor once the record arrives when linked with ?edit=true.
  if (requestedEdit && officer && canEdit && !editForm) {
    setEditForm(formFrom(officer));
    setRequestedEdit(false);
  }

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 gap-3 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading officer details…
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiClientError && error.code === 404;
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-2">
          <AlertTriangle className="h-12 w-12 text-warning mb-2" />
          <h2 className="text-xl font-bold text-foreground">
            {notFound ? "Officer Not Found" : "Officer could not be loaded"}
          </h2>
          <p className="text-foreground-muted mb-2">
            {notFound ? "There is no personnel record with this id." : error.message}
          </p>
          <div className="flex gap-2">
            {!notFound && (
              <Button variant="secondary" onClick={() => refetch()}>
                Try again
              </Button>
            )}
            <Link href="/personnel">
              <Button>Back to Personnel</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isEditMode = editForm !== null;

  const handleSave = async () => {
    if (!editForm) return;
    if (!editForm.badgeNumber.trim()) {
      addToast({ type: "error", title: "Validation Error", message: "Badge number is required" });
      return;
    }
    try {
      const updated = await updatePersonnel.mutateAsync({
        person: officer,
        changes: {
          badgeNumber: editForm.badgeNumber.trim(),
          rank: editForm.rank,
          status: editForm.status,
          currentDuty: editForm.currentDuty.trim() || null,
          shift: editForm.shift || null,
          leaveType: editForm.leaveType.trim() || null,
          leaveUntil: editForm.leaveUntil ? `${editForm.leaveUntil}T00:00:00Z` : null,
        },
      });
      setEditForm(null);
      addToast({
        type: "success",
        title: "Service Record Updated",
        message: `${updated.name}'s record has been saved`,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Record not updated",
        message: err instanceof Error ? err.message : "The server rejected the request",
      });
    }
  };

  const handleDutyAssignment = async (duty: string, shift: string) => {
    try {
      await assignDuty.mutateAsync({ id: officer.id, duty, shift });
      addToast({ type: "success", title: "Duty Assigned", message: `${officer.name} assigned to ${duty} (${shift})` });
      setDutyDialogOpen(false);
    } catch (err) {
      addToast({
        type: "error",
        title: "Assignment Failed",
        message: err instanceof Error ? err.message : "The server rejected the request",
      });
    }
  };

  const yearsOfService = Math.max(
    0,
    Math.floor((Date.now() - new Date(officer.joiningDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="h-8 w-8 text-accent" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{officer.name}</h1>
                  {getStatusBadge(officer.status)}
                </div>
                <div className="flex items-center gap-4 text-foreground-muted">
                  <span className="font-mono text-accent">{officer.badgeNumber}</span>
                  <span>|</span>
                  <span>{getRoleDisplayName(officer.rank as any) ?? officer.rank}</span>
                </div>
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <Button variant="secondary" onClick={() => setEditForm(null)} disabled={updatePersonnel.isPending}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={updatePersonnel.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updatePersonnel.isPending ? "Saving…" : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => setDutyDialogOpen(true)}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Assign Duty
                  </Button>
                  <Button onClick={() => setEditForm(formFrom(officer))}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Record
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">{officer.assignedCases}</p>
              <p className="text-sm text-foreground-muted">Assigned Cases (recorded)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{yearsOfService}</p>
              <p className="text-sm text-foreground-muted">Years of Service</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold text-foreground truncate">{officer.currentDuty || "—"}</p>
              <p className="text-sm text-foreground-muted">Current Duty</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold text-foreground truncate">{officer.shift || "—"}</p>
              <p className="text-sm text-foreground-muted">Shift</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Record */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Service Record
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editForm ? (
                <>
                  <Input
                    label="Badge Number *"
                    value={editForm.badgeNumber}
                    onChange={(v: string) => setEditForm({ ...editForm, badgeNumber: v })}
                  />
                  <Select
                    label="Rank"
                    value={editForm.rank}
                    onChange={(v: string) => setEditForm({ ...editForm, rank: v as PersonnelRank })}
                    options={rankOptions}
                  />
                  <Select
                    label="Status"
                    value={editForm.status}
                    onChange={(v: string) => setEditForm({ ...editForm, status: v as PersonnelStatus })}
                    options={statusOptions}
                  />
                </>
              ) : (
                <>
                  <Row label="Badge Number">
                    <span className="font-mono text-accent">{officer.badgeNumber}</span>
                  </Row>
                  <Row label="Rank">{getRoleDisplayName(officer.rank as any) ?? officer.rank}</Row>
                  <Row label="Status">{getStatusBadge(officer.status)}</Row>
                  <Row label="Record Updated" last>
                    {formatDateTime(officer.updatedAt)}
                  </Row>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact — read from the user account */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 py-2 border-b border-border">
                <Phone className="h-4 w-4 text-foreground-muted" />
                <span className="text-foreground">{officer.phone || notRecorded}</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <Mail className="h-4 w-4 text-foreground-muted" />
                <span className="text-foreground">{officer.email || notRecorded}</span>
              </div>
              <p className="text-xs text-foreground-muted">Held on the officer&apos;s user account.</p>
            </CardContent>
          </Card>

          {/* Posting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Current Posting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Row label="Station">{officer.stationName || notRecorded}</Row>
              <Row label="Date of Joining" last>
                {formatDate(officer.joiningDate)}
              </Row>
            </CardContent>
          </Card>

          {/* Duty & Leave */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Duty &amp; Leave
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editForm ? (
                <>
                  <Input
                    label="Current Duty"
                    value={editForm.currentDuty}
                    onChange={(v: string) => setEditForm({ ...editForm, currentDuty: v })}
                  />
                  <Select
                    label="Shift"
                    value={editForm.shift}
                    onChange={(v: string) => setEditForm({ ...editForm, shift: v })}
                    options={
                      editForm.shift && !shiftOptions.some((o) => o.value === editForm.shift)
                        ? [...shiftOptions, { value: editForm.shift, label: editForm.shift }]
                        : shiftOptions
                    }
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Leave Type"
                      placeholder="e.g. Earned Leave"
                      value={editForm.leaveType}
                      onChange={(v: string) => setEditForm({ ...editForm, leaveType: v })}
                    />
                    <Input
                      label="Leave Until"
                      type="date"
                      value={editForm.leaveUntil}
                      onChange={(v: string) => setEditForm({ ...editForm, leaveUntil: v })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Row label="Current Duty">{officer.currentDuty || notRecorded}</Row>
                  <Row label="Shift">{officer.shift || notRecorded}</Row>
                  <Row label="Leave Type">{officer.leaveType || notRecorded}</Row>
                  <Row label="Leave Until" last>
                    {officer.leaveUntil ? (
                      <span className="flex items-center gap-2 justify-end">
                        <Calendar className="h-4 w-4 text-foreground-muted" />
                        {formatDate(officer.leaveUntil)}
                      </span>
                    ) : (
                      notRecorded
                    )}
                  </Row>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DutyAssignmentDialog
        isOpen={dutyDialogOpen}
        onClose={() => setDutyDialogOpen(false)}
        onAssign={handleDutyAssignment}
        officerName={officer.name}
      />
    </DashboardLayout>
  );
}
