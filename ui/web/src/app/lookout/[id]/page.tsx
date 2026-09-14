"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  User,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import {
  useLookout,
  useLookoutSightings,
  useReportSighting,
  useResolveLookout,
  useVerifySighting,
} from "@/hooks/use-lookouts";
import { ApiClientError } from "@/lib/api/client";
import type { Lookout, LookoutSighting } from "@/lib/api/lookouts";
import { formatDateTime } from "@/lib/utils";
import { lookoutStatusConfig, lookoutTypeLabel, priorityVariant } from "../labels";

const InteractiveMap = dynamic(() => import("@/components/ui/Map").then((mod) => mod.InteractiveMap), {
  ssr: false,
  loading: () => <div className="h-64 bg-background-tertiary rounded-lg" />,
});

const message = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

export default function LookoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const lookout = useLookout(params.id);
  const sightings = useLookoutSightings(params.id);
  const verify = useVerifySighting();
  const [showReport, setShowReport] = useState(false);
  const [showResolve, setShowResolve] = useState(false);

  // Role floors match the routes: resolve SI+, verify ASI+, report any officer.
  const canResolve = Boolean(user && hasMinimumRole(user.role, "SI"));
  const canVerify = Boolean(user && hasMinimumRole(user.role, "ASI"));

  if (lookout.isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96 gap-3 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading notice…
        </div>
      </DashboardLayout>
    );
  }

  if (lookout.isError) {
    const notFound = lookout.error instanceof ApiClientError && lookout.error.code === 404;
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-2">
          <AlertTriangle className="h-12 w-12 text-warning mb-2" />
          <h2 className="text-xl font-bold text-foreground">{notFound ? "Notice Not Found" : "Notice could not be loaded"}</h2>
          <p className="text-foreground-muted mb-2">
            {notFound ? "The requested lookout notice does not exist." : lookout.error.message}
          </p>
          <div className="flex gap-2">
            {!notFound && (
              <Button variant="secondary" onClick={() => lookout.refetch()}>
                Try again
              </Button>
            )}
            <Link href="/lookout">
              <Button>Back to Notices</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const l = lookout.data;
  const active = l.status === "ACTIVE";
  const located = (sightings.data ?? []).filter((s) => s.latitude !== null && s.longitude !== null);
  const detailEntries = Object.entries(l.details);

  const verifySighting = async (s: LookoutSighting) => {
    try {
      await verify.mutateAsync({ id: l.id, sightingId: s.id });
      toast.success("Sighting Verified", `Sighting at ${s.location} verified`);
    } catch (err) {
      toast.error("Sighting not verified", message(err, "The server rejected the request"));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground font-mono">{l.lookoutNumber}</h1>
                <Badge variant="secondary">{lookoutTypeLabel[l.type]}</Badge>
                <Badge variant={priorityVariant[l.priority]}>{l.priority}</Badge>
                <Badge variant={lookoutStatusConfig[l.status].variant}>{lookoutStatusConfig[l.status].label}</Badge>
              </div>
              <p className="text-foreground-muted">{l.subject}</p>
            </div>
          </div>
          {active && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowReport(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Report Sighting
              </Button>
              {canResolve && (
                <Button onClick={() => setShowResolve(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
              )}
            </div>
          )}
        </div>

        {!active && (
          <Card className="border-success/40 bg-success/5">
            <CardContent className="p-4 text-sm">
              <p className="font-medium text-foreground">
                {lookoutStatusConfig[l.status].label} {l.resolvedAt && `on ${formatDateTime(l.resolvedAt)}`}
                {l.resolvedByName && ` by ${l.resolvedByName}`}
              </p>
              {l.resolutionNote && <p className="text-foreground-muted">{l.resolutionNote}</p>}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Subject
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-lg font-semibold text-foreground">{l.subject}</p>
                  <p className="text-foreground-muted whitespace-pre-line">{l.description}</p>
                </div>
                {detailEntries.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border">
                    {detailEntries.map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-foreground-muted">{key}</p>
                        <p className="text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Sightings ({l.sightingCount}, {l.verifiedCount} verified)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sightings.isPending ? (
                  <p className="text-foreground-muted flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading sightings…
                  </p>
                ) : sightings.isError ? (
                  <div className="space-y-2">
                    <p className="text-error">Sightings could not be loaded: {sightings.error.message}</p>
                    <Button variant="secondary" size="sm" onClick={() => sightings.refetch()}>
                      Try again
                    </Button>
                  </div>
                ) : sightings.data.length === 0 ? (
                  <p className="text-foreground-muted">No sightings have been reported.</p>
                ) : (
                  sightings.data.map((s) => {
                    const ownReport = user?.id === s.reportedBy;
                    return (
                      <div key={s.id} className="p-4 rounded-lg bg-background-tertiary" data-testid="sighting">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{s.location}</p>
                            <p className="text-sm text-foreground-muted flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Sighted {formatDateTime(s.sightedAt)} · reported by {s.reportedByName}
                            </p>
                            {s.latitude !== null && s.longitude !== null && (
                              <p className="text-xs text-foreground-muted font-mono">
                                {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
                              </p>
                            )}
                            {s.details && <p className="text-sm text-foreground mt-1">{s.details}</p>}
                          </div>
                          <div className="text-right">
                            {s.verifiedAt ? (
                              <Badge variant="success">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified by {s.verifiedByName}
                              </Badge>
                            ) : (
                              <>
                                <Badge variant="warning">Unverified</Badge>
                                {canVerify && (
                                  <div className="mt-2">
                                    {ownReport ? (
                                      <p className="text-xs text-foreground-muted max-w-[14rem]">
                                        You reported this sighting; another officer must verify it.
                                      </p>
                                    ) : (
                                      <Button size="sm" onClick={() => verifySighting(s)} disabled={verify.isPending}>
                                        Verify
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {located.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sighting Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  <InteractiveMap
                    markers={located.map((s) => ({
                      id: s.id,
                      lat: s.latitude!,
                      lng: s.longitude!,
                      title: s.location,
                      description: `${formatDateTime(s.sightedAt)}${s.verifiedAt ? " · verified" : " · unverified"}`,
                      type: "alert" as const,
                    }))}
                    center={[located[0].latitude!, located[0].longitude!]}
                    zoom={13}
                    height="280px"
                  />
                  {located.length < (sightings.data?.length ?? 0) && (
                    <p className="text-xs text-foreground-muted mt-2">Sightings without coordinates are not shown on the map.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Field label="Issued" value={`${formatDateTime(l.issuedAt)} by ${l.issuedByName}`} />
                <Field label="Station" value={l.stationName} />
                <div>
                  <p className="text-foreground-muted">Linked FIR</p>
                  {l.firId ? (
                    <Link href={`/fir/${l.firId}`} className="text-accent hover:underline font-mono">
                      {l.firNumber || "View FIR"}
                    </Link>
                  ) : (
                    <p className="text-foreground-muted">None</p>
                  )}
                </div>
                {l.lastSightedAt && <Field label="Last Sighted" value={formatDateTime(l.lastSightedAt)} />}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showReport && <ReportSightingDialog lookout={l} onClose={() => setShowReport(false)} />}
      {showResolve && <ResolveDialog lookout={l} onClose={() => setShowResolve(false)} />}
    </DashboardLayout>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-foreground-muted">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}

function ReportSightingDialog({ lookout, onClose }: { lookout: Lookout; onClose: () => void }) {
  const report = useReportSighting();
  const [form, setForm] = useState({ location: "", sightedAt: "", latitude: "", longitude: "", details: "" });

  const submit = async () => {
    if (!form.location.trim() || !form.sightedAt) {
      toast.error("Validation Error", "Location and time of sighting are required");
      return;
    }
    const hasLat = form.latitude.trim() !== "";
    const hasLng = form.longitude.trim() !== "";
    if (hasLat !== hasLng) {
      toast.error("Validation Error", "Give both latitude and longitude, or neither");
      return;
    }
    const latitude = hasLat ? Number(form.latitude) : null;
    const longitude = hasLng ? Number(form.longitude) : null;
    if ((latitude !== null && Number.isNaN(latitude)) || (longitude !== null && Number.isNaN(longitude))) {
      toast.error("Validation Error", "Coordinates must be numbers");
      return;
    }
    try {
      await report.mutateAsync({
        id: lookout.id,
        input: {
          location: form.location.trim(),
          sightedAt: new Date(form.sightedAt).toISOString(),
          latitude,
          longitude,
          details: form.details.trim(),
        },
      });
      toast.success("Sighting Reported", "Awaiting verification by another officer");
      onClose();
    } catch (err) {
      toast.error("Sighting not reported", message(err, "The server rejected the request"));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Report Sighting" description={`${lookout.lookoutNumber} — ${lookout.subject}`}>
      <div className="space-y-4">
        <Input
          label="Location *"
          placeholder="Where the subject was seen"
          value={form.location}
          onChange={(v: string) => setForm({ ...form, location: v })}
        />
        <Input
          label="Sighted At *"
          type="datetime-local"
          value={form.sightedAt}
          onChange={(v: string) => setForm({ ...form, sightedAt: v })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Latitude" placeholder="22.5726" value={form.latitude} onChange={(v: string) => setForm({ ...form, latitude: v })} />
          <Input label="Longitude" placeholder="88.3639" value={form.longitude} onChange={(v: string) => setForm({ ...form, longitude: v })} />
        </div>
        <Textarea
          label="Details"
          placeholder="What was seen, direction of travel, companions"
          value={form.details}
          onChange={(v: string) => setForm({ ...form, details: v })}
          rows={3}
        />
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={report.isPending}>
          {report.isPending ? "Reporting…" : "Report Sighting"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function ResolveDialog({ lookout, onClose }: { lookout: Lookout; onClose: () => void }) {
  const resolve = useResolveLookout();
  const [status, setStatus] = useState<"LOCATED" | "CLOSED">("LOCATED");
  const [note, setNote] = useState("");

  const submit = async () => {
    if (!note.trim()) {
      toast.error("Validation Error", "Record how the notice was resolved");
      return;
    }
    try {
      const updated = await resolve.mutateAsync({ id: lookout.id, input: { status, note: note.trim() } });
      toast.success("Notice Resolved", `${updated.lookoutNumber} marked ${lookoutStatusConfig[updated.status].label.toLowerCase()}`);
      onClose();
    } catch (err) {
      toast.error("Notice not resolved", message(err, "The server rejected the request"));
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Resolve Notice"
      description="A resolved notice accepts no further sightings. The resolution is recorded in the audit trail."
    >
      <div className="space-y-4">
        <Select
          label="Outcome *"
          value={status}
          onChange={(v: string) => setStatus(v as "LOCATED" | "CLOSED")}
          options={[
            { value: "LOCATED", label: "Located — subject found" },
            { value: "CLOSED", label: "Closed — withdrawn or no longer sought" },
          ]}
        />
        <Textarea label="Resolution Note *" value={note} onChange={(v: string) => setNote(v)} rows={3} />
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={resolve.isPending}>
          {resolve.isPending ? "Saving…" : "Resolve Notice"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
