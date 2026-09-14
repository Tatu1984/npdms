"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  FileWarning,
  User,
  MapPin,
  Clock,
  Gavel,
  Printer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { useSetWarrantStatus, useWarrant } from "@/hooks/use-warrants";
import type { WarrantStatus } from "@/lib/api/warrants";
import { ApiClientError } from "@/lib/api/client";
import { formatDate, formatDateTime } from "@/lib/utils";

// Dynamic import for map to avoid SSR issues
const InteractiveMap = dynamic(
  () => import("@/components/ui/Map").then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 bg-background-tertiary rounded-lg flex items-center justify-center">
        <div className="text-foreground-muted">Loading map...</div>
      </div>
    ),
  }
);

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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className="text-foreground">{value ?? <span className="text-foreground-muted">Not recorded</span>}</p>
    </div>
  );
}

export default function WarrantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: warrant, isPending, isError, error, refetch } = useWarrant(params.id);
  const setStatus = useSetWarrantStatus();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const canAct = user && hasMinimumRole(user.role, "SI");

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96 gap-3 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading warrant…
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
            {notFound ? "Warrant Not Found" : "Warrant could not be loaded"}
          </h2>
          <p className="text-foreground-muted mb-2">
            {notFound ? "The requested warrant does not exist." : error.message}
          </p>
          <div className="flex gap-2">
            {!notFound && (
              <Button variant="secondary" onClick={() => refetch()}>
                Try again
              </Button>
            )}
            <Link href="/warrant">
              <Button>Back to Warrants</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const typeConfig = warrantTypes[warrant.type];
  const status = statusConfig[warrant.status];
  const StatusIcon = status.icon;
  const hasLocation = warrant.latitude !== null && warrant.longitude !== null;
  const lapsed = warrant.validUntil !== null && new Date(warrant.validUntil) < new Date();

  const changeStatus = async (next: WarrantStatus, done: string) => {
    try {
      await setStatus.mutateAsync({
        id: warrant.id,
        status: next,
        executedBy: next === "EXECUTED" ? user?.id : undefined,
      });
      toast.success(done, `Warrant ${warrant.warrantNumber} has been updated`);
    } catch (err) {
      toast.error("Warrant not updated", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{warrant.warrantNumber}</h1>
                <Badge variant={typeConfig.color as any}>{typeConfig.label}</Badge>
                <Badge variant={status.color as any}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
                {(warrant.priority === "HIGH" || warrant.priority === "CRITICAL") && (
                  <Badge variant="error">{warrant.priority === "CRITICAL" ? "Critical" : "High"} Priority</Badge>
                )}
              </div>
              <p className="text-foreground-muted">Issued for: {warrant.issuedFor}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            {canAct && warrant.status === "ACTIVE" && (
              <Button
                onClick={() => changeStatus("EXECUTED", "Warrant Executed")}
                disabled={setStatus.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Executed
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5" />
                  Warrant Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(warrant.type === "ARREST" || warrant.type === "NBW") && (
                    <div className="flex gap-6">
                      <div className="h-32 w-24 bg-background-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="h-12 w-12 text-foreground-muted" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">{warrant.issuedFor}</h3>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <Field label="Age" value={warrant.age !== null ? `${warrant.age} years` : null} />
                          <Field label="Gender" value={warrant.gender} />
                          <div className="col-span-2">
                            <Field label="Address" value={warrant.address} />
                          </div>
                          <div className="col-span-2">
                            <Field label="Identifying Marks" value={warrant.identifyingMarks} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {warrant.description && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="font-medium text-foreground mb-2">Description</h4>
                      <p className="text-foreground-muted">{warrant.description}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium text-foreground mb-2">Charges</h4>
                    {warrant.charges.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {warrant.charges.map((charge) => (
                          <span key={charge} className="px-3 py-1 text-sm rounded-full bg-error/10 text-error">
                            {charge}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-foreground-muted">No charges recorded</p>
                    )}
                  </div>

                  {warrant.type === "SEARCH" && (warrant.searchPremises || warrant.searchScope) && (
                    <div className="pt-4 border-t border-border grid gap-4">
                      {warrant.searchPremises && <Field label="Premises" value={warrant.searchPremises} />}
                      {warrant.searchScope && <Field label="Search Scope" value={warrant.searchScope} />}
                    </div>
                  )}

                  {warrant.type === "SUMMONS" && (warrant.summonsPurpose || warrant.hearingDate) && (
                    <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
                      <Field label="Purpose" value={warrant.summonsPurpose} />
                      <Field
                        label="Hearing Date"
                        value={warrant.hearingDate ? formatDateTime(warrant.hearingDate) : null}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Linked Case Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {warrant.caseId || warrant.firId ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-background-tertiary rounded-lg">
                      <p className="text-sm text-foreground-muted">FIR Number</p>
                      {warrant.firId ? (
                        <Link href={`/fir/${warrant.firId}`} className="text-accent hover:underline font-mono">
                          {warrant.firNumber || "View FIR"}
                        </Link>
                      ) : (
                        <p className="text-foreground-muted">Not linked</p>
                      )}
                    </div>
                    <div className="p-4 bg-background-tertiary rounded-lg">
                      <p className="text-sm text-foreground-muted">Case Number</p>
                      {warrant.caseId ? (
                        <Link href={`/cases/${warrant.caseId}`} className="text-accent hover:underline font-mono">
                          {warrant.caseNumber || "View case"}
                        </Link>
                      ) : (
                        <p className="text-foreground-muted">Not linked</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground-muted">This warrant is not linked to a case or FIR.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Court Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Issued By" value={warrant.issuedBy || null} />
                <Field label="Judge" value={warrant.judgeName} />
                <Field label="Issue Date" value={formatDate(warrant.issuedDate)} />
                <div>
                  <p className="text-sm text-foreground-muted">Valid Until</p>
                  {warrant.validUntil ? (
                    <p className={`font-medium ${lapsed && warrant.status === "ACTIVE" ? "text-error" : "text-foreground"}`}>
                      {formatDate(warrant.validUntil)}
                      {lapsed && warrant.status === "ACTIVE" && " — validity has lapsed"}
                    </p>
                  ) : (
                    <p className="text-foreground-muted">No expiry recorded</p>
                  )}
                </div>
                {warrant.executedDate && (
                  <div>
                    <p className="text-sm text-foreground-muted">Executed</p>
                    <p className="text-success font-medium">
                      {formatDateTime(warrant.executedDate)}
                      {warrant.executedByName && ` by ${warrant.executedByName}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {warrant.lastKnownLocation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Last Known Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-3">{warrant.lastKnownLocation}</p>
                  {hasLocation ? (
                    <div className="h-48 rounded-lg overflow-hidden">
                      <InteractiveMap
                        markers={[
                          {
                            id: warrant.id,
                            lat: warrant.latitude!,
                            lng: warrant.longitude!,
                            title: "Last Known Location",
                            description: warrant.lastKnownLocation,
                            type: "alert",
                          },
                        ]}
                        center={[warrant.latitude!, warrant.longitude!]}
                        zoom={14}
                        height="192px"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-muted">No coordinates recorded for this location.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {canAct && warrant.status === "ACTIVE" && (
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader>
                  <CardTitle className="text-warning">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => changeStatus("EXECUTED", "Warrant Executed")}
                    disabled={setStatus.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Executed
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-error"
                    onClick={() => setConfirmCancel(true)}
                    disabled={setStatus.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Warrant
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel this warrant?"
        description={`${warrant.warrantNumber} will be marked cancelled. The change is recorded in the audit trail.`}
      >
        <ModalFooter>
          <Button variant="secondary" onClick={() => setConfirmCancel(false)}>
            Keep Active
          </Button>
          <Button
            variant="destructive"
            disabled={setStatus.isPending}
            onClick={async () => {
              await changeStatus("CANCELLED", "Warrant Cancelled");
              setConfirmCancel(false);
            }}
          >
            Cancel Warrant
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
