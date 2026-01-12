"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Car,
  MapPin,
  Calendar,
  FileText,
  Flag,
  Eye,
  Edit,
  Clock,
  AlertTriangle,
  CheckCircle,
  Camera,
  Phone,
  Printer,
  Share2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLookoutStore } from "@/stores/lookoutStore";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";

function getTypeBadgeVariant(type: string) {
  const variants: Record<string, string> = {
    WANTED: "error",
    MISSING: "warning",
    STOLEN_VEHICLE: "info",
    SUSPECT: "secondary",
    WITNESS: "success",
  };
  return variants[type] || "secondary";
}

function getPriorityBadgeVariant(priority: string) {
  const variants: Record<string, string> = {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
    CRITICAL: "critical",
  };
  return variants[priority] || "secondary";
}

export default function LookoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { lookouts, sightings, reportSighting, updateLookout } = useLookoutStore();

  const lookout = lookouts.find((l) => l.id === params.id);
  const lookoutSightings = sightings.filter((s) => s.lookoutId === lookout?.lookoutId);

  const canEdit = user && hasMinimumRole(user.role, "SI");
  const canClose = user && hasMinimumRole(user.role, "SHO");

  if (!lookout) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertTriangle className="h-12 w-12 text-warning mb-4" />
          <h2 className="text-xl font-bold text-foreground">Lookout Not Found</h2>
          <p className="text-foreground-muted mb-4">The requested lookout notice does not exist.</p>
          <Link href="/lookout">
            <Button>Back to Lookouts</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const handleReportSighting = async () => {
    if (user) {
      await reportSighting({
        lookoutId: lookout.lookoutId,
        reportedBy: user.name,
        location: "Location to be specified",
        details: "Sighting reported from detail page",
      });
      toast.success("Sighting Reported", "Your sighting has been recorded and will be verified");
    }
  };

  const handleMarkLocated = async () => {
    await updateLookout(lookout.id, { status: "LOCATED" });
    toast.success("Status Updated", `${lookout.name} has been marked as located`);
  };

  const handleCloseLookout = async () => {
    await updateLookout(lookout.id, { status: "CLOSED" });
    toast.success("Lookout Closed", `Lookout ${lookout.lookoutId} has been closed`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{lookout.name}</h1>
                <Badge variant={getTypeBadgeVariant(lookout.type) as any}>
                  {lookout.type.replace(/_/g, " ")}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(lookout.priority) as any}>
                  {lookout.priority}
                </Badge>
                <Badge variant={lookout.status === "ACTIVE" ? "warning" : lookout.status === "LOCATED" ? "success" : "secondary"}>
                  {lookout.status}
                </Badge>
              </div>
              <p className="text-foreground-muted font-mono">{lookout.lookoutId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { toast.info("Print", "Opening print dialog..."); window.print(); }}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="secondary" onClick={() => toast.success("Shared", "Lookout notice shared to nearby stations")}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {canEdit && (
              <Button onClick={() => toast.info("Edit Lookout", "Edit form opening...")}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo and Details */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="h-48 w-36 bg-background-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                    {lookout.type === "STOLEN_VEHICLE" ? (
                      <Car className="h-16 w-16 text-foreground-muted" />
                    ) : (
                      <User className="h-16 w-16 text-foreground-muted" />
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
                      <p className="text-foreground-muted">{lookout.description}</p>
                    </div>
                    {lookout.type !== "STOLEN_VEHICLE" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-foreground-muted">Age</p>
                          <p className="text-foreground font-medium">{lookout.details?.age || "Unknown"} years</p>
                        </div>
                        <div>
                          <p className="text-sm text-foreground-muted">Gender</p>
                          <p className="text-foreground font-medium">{lookout.details?.gender || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-foreground-muted">Height</p>
                          <p className="text-foreground font-medium">{lookout.details?.height || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-foreground-muted">Identifying Marks</p>
                          <p className="text-foreground font-medium">{lookout.details?.identifyingMarks || "None recorded"}</p>
                        </div>
                      </div>
                    )}
                    {lookout.type === "STOLEN_VEHICLE" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-foreground-muted">Vehicle Number</p>
                          <p className="text-foreground font-medium font-mono">{lookout.details?.vehicleNumber || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-foreground-muted">Vehicle Type</p>
                          <p className="text-foreground font-medium">{lookout.details?.vehicleType || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-foreground-muted">Color</p>
                          <p className="text-foreground font-medium">{lookout.details?.vehicleColor || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-foreground-muted">Make/Model</p>
                          <p className="text-foreground font-medium">{lookout.details?.vehicleMake || "Unknown"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Linked FIR */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Linked Case Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
                  <div>
                    <p className="text-foreground font-medium">FIR: {lookout.linkedFIR}</p>
                    <p className="text-sm text-foreground-muted">PS Koramangala</p>
                  </div>
                  <Link href={`/fir/${lookout.linkedFIR}`}>
                    <Button variant="secondary" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View FIR
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Sightings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Sightings ({lookoutSightings.length})
                  </span>
                  <Button size="sm" onClick={handleReportSighting}>
                    <Flag className="h-4 w-4 mr-1" />
                    Report Sighting
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lookoutSightings.length > 0 ? (
                  <div className="space-y-4">
                    {lookoutSightings.map((sighting) => (
                      <div key={sighting.id} className="p-4 bg-background-tertiary rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-foreground-muted" />
                              <span className="font-medium text-foreground">{sighting.location}</span>
                              {sighting.verified ? (
                                <Badge variant="success">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="warning">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground-muted">{sighting.details}</p>
                            <p className="text-xs text-foreground-muted mt-2">
                              Reported by {sighting.reportedBy} on{" "}
                              {new Date(sighting.time).toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground-muted">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No sightings reported yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={handleReportSighting}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report Sighting
                </Button>
                {lookout.status === "ACTIVE" && canClose && (
                  <>
                    <Button variant="secondary" className="w-full" onClick={handleMarkLocated}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Located
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={handleCloseLookout}>
                      Close Lookout
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Last Known Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Last Known Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground mb-2">{lookout.details?.lastKnownLocation || "Not specified"}</p>
                <div className="h-32 bg-background-tertiary rounded-lg flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-foreground-muted" />
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-accent"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Lookout Issued</p>
                      <p className="text-xs text-foreground-muted">
                        {new Date(lookout.issuedAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  {lookoutSightings.map((sighting, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="h-2 w-2 mt-2 rounded-full bg-warning"></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Sighting Reported</p>
                        <p className="text-xs text-foreground-muted">
                          {sighting.location} - {new Date(sighting.time).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            {lookout.type === "MISSING" && (
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <Phone className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">If found, contact:</p>
                  <p className="text-lg font-bold text-foreground mt-2">PS Koramangala</p>
                  <p className="text-foreground-muted">+91 80-2553-0000</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
