"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Edit,
  Printer,
  Share2,
  Clock,
  MapPin,
  User,
  FileText,
  Shield,
  AlertTriangle,
  Check,
  ArrowRight,
  Microscope,
  Camera,
  Download,
  Loader2,
  Eye,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useEvidenceItem, useUpdateEvidence, useTransferEvidence } from "@/hooks/use-evidence";
import { toast } from "@/stores/toastStore";

function getStatusBadge(status: string) {
  switch (status) {
    case "COLLECTED":
      return <Badge variant="info">Collected</Badge>;
    case "UNDER_ANALYSIS":
      return <Badge variant="warning">Under Analysis</Badge>;
    case "PRESERVED":
      return <Badge variant="success">Preserved</Badge>;
    case "SUBMITTED":
      return <Badge variant="secondary">Submitted</Badge>;
    case "DESTROYED":
      return <Badge variant="closed">Destroyed</Badge>;
    default:
      return <Badge variant="secondary">{status.replace(/_/g, " ")}</Badge>;
  }
}

export default function EvidenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("details");

  const evidenceId = params.id as string;
  const { data: evidence, isLoading, error } = useEvidenceItem(evidenceId);
  const updateEvidenceMutation = useUpdateEvidence();
  const transferEvidenceMutation = useTransferEvidence();

  const canEdit = user && hasMinimumRole(user.role, "SI");
  const canTransfer = user && hasMinimumRole(user.role, "HEAD_CONSTABLE");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-foreground-muted">Loading evidence details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !evidence) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-error mx-auto mb-4" />
            <p className="text-error mb-4">
              {error ? `Error: ${error.message}` : "Evidence not found"}
            </p>
            <Button onClick={() => router.push("/evidence")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Evidence List
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground font-mono">
                  {evidence.evidenceNumber}
                </h1>
                {getStatusBadge(evidence.status)}
              </div>
              <p className="text-foreground-muted">
                Case ID: {evidence.caseId}
                {evidence.firId && ` | FIR: ${evidence.firId}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => toast.success("Print Ready", "Evidence label sent to printer")}>
              <Printer className="h-4 w-4 mr-2" />
              Print Label
            </Button>
            {canTransfer && (
              <Button variant="secondary" onClick={() => toast.info("Transfer Evidence", "Opening transfer form...")}>
                <Share2 className="h-4 w-4 mr-2" />
                Transfer
              </Button>
            )}
            {canEdit && (
              <Button onClick={() => toast.success("Edit Mode", "You can now edit evidence details")}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">
              <Package className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="custody">
              <Shield className="h-4 w-4 mr-2" />
              Chain of Custody
            </TabsTrigger>
            <TabsTrigger value="forensic">
              <Microscope className="h-4 w-4 mr-2" />
              Forensic
            </TabsTrigger>
            <TabsTrigger value="photos">
              <Camera className="h-4 w-4 mr-2" />
              Photos
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Evidence Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Evidence Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Evidence Number</span>
                    <span className="font-mono text-accent">{evidence.evidenceNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Type</span>
                    <Badge variant="info">{evidence.type}</Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Case ID</span>
                    <span className="font-mono text-accent">{evidence.caseId}</span>
                  </div>
                  {evidence.firId && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-foreground-muted">Linked FIR</span>
                      <span className="font-mono">{evidence.firId}</span>
                    </div>
                  )}
                  <div className="py-2">
                    <span className="text-foreground-muted block mb-2">Description</span>
                    <p className="text-foreground">{evidence.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Collection & Storage */}
              <Card>
                <CardHeader>
                  <CardTitle>Collection & Storage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Collected By</span>
                    <span className="text-foreground">{evidence.collectedBy}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Collected From</span>
                    <span className="text-foreground">{evidence.collectedFrom}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Collection Date</span>
                    <span className="text-foreground">
                      {new Date(evidence.collectedDate).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Current Location</span>
                    <span className="text-foreground">{evidence.location}</span>
                  </div>
                  {evidence.hasPhoto && (
                    <div className="flex justify-between py-2">
                      <span className="text-foreground-muted">Photos</span>
                      <Badge variant="success">Available</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chain of Custody */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Chain of Custody
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-background-tertiary">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {evidence.chainOfCustody}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Report */}
              {evidence.analysisReport && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Microscope className="h-5 w-5" />
                      Analysis Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-info/10 border border-info/20">
                      <p className="text-foreground whitespace-pre-wrap">
                        {evidence.analysisReport}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Chain of Custody Tab */}
          <TabsContent value="custody" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Chain of Custody
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-background-tertiary">
                  <p className="text-foreground whitespace-pre-wrap">
                    {evidence.chainOfCustody}
                  </p>
                </div>

                {canTransfer && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button onClick={() => toast.info("Record Transfer", "Opening transfer record form...")}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Record New Transfer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forensic Tab */}
          <TabsContent value="forensic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Microscope className="h-5 w-5" />
                  Forensic Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evidence.analysisReport ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-info/10 border border-info/20">
                      <h4 className="font-medium text-foreground mb-2">Analysis Report</h4>
                      <p className="text-foreground whitespace-pre-wrap">
                        {evidence.analysisReport}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => toast.success("Download", "Downloading analysis report...")}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                      <Button variant="secondary" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Report
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Microscope className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                    <p className="text-foreground-muted">No forensic analysis report available</p>
                    <Button className="mt-4" onClick={() => toast.info("Request Analysis", "Opening forensic analysis request form...")}>Request Analysis</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Evidence Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evidence.hasPhoto && evidence.photoUrl ? (
                  <div className="space-y-4">
                    <div className="aspect-video rounded-lg bg-background-tertiary border border-border overflow-hidden">
                      <img
                        src={evidence.photoUrl}
                        alt="Evidence photo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => toast.success("Download", "Downloading photo...")}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Photo
                      </Button>
                      <Button variant="secondary" onClick={() => window.open(evidence.photoUrl, "_blank")}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Camera className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                    <p className="text-foreground-muted mb-4">No photos available for this evidence</p>
                    {canEdit && (
                      <div className="aspect-square w-32 mx-auto rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-accent transition-colors cursor-pointer">
                        <Camera className="h-8 w-8 text-foreground-muted mb-2" />
                        <p className="text-sm text-foreground-muted">Add Photo</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
