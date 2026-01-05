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
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

// Mock evidence data
const mockEvidence = {
  id: "evd-001",
  evidenceNumber: "EVD-2024-KOR-00123-001",
  linkedFIR: "KOR/2024/00123",
  caseNumber: "CC/2024/KOR/00089",
  type: "PHYSICAL",
  description: "Blood-stained knife recovered from crime scene. Approximately 15cm blade length with wooden handle. Visible fingerprints on handle.",
  status: "AT_FSL",
  collectionDetails: {
    location: "123, 4th Cross, Koramangala 4th Block, Bangalore",
    date: "2024-01-15",
    time: "14:30",
    collectedBy: "HC Mohan Singh",
    badgeNumber: "KAR-HC-3456",
    witnesses: ["Ramesh Kumar (Complainant)", "Const. Vijay"],
  },
  physicalDetails: {
    containerType: "Sealed Evidence Bag",
    sealNumber: "SEAL-2024-KOR-0045",
    weight: "250g",
    dimensions: "18cm x 4cm x 2cm",
    condition: "Good - Minor rust on blade",
  },
  currentLocation: {
    type: "FSL",
    name: "Regional Forensic Science Laboratory",
    address: "Madiwala, Bangalore",
    receivedDate: "2024-01-16",
    expectedReturn: "2024-02-15",
  },
  forensicRequest: {
    type: "FINGERPRINT",
    requestDate: "2024-01-16",
    status: "IN_PROGRESS",
    priority: "HIGH",
    requestedBy: "SI Ramesh Kumar",
  },
  chainOfCustody: [
    {
      id: 1,
      action: "COLLECTED",
      from: null,
      to: "HC Mohan Singh",
      location: "Crime Scene",
      timestamp: "2024-01-15 14:30",
      remarks: "Collected from kitchen floor",
      verified: true,
    },
    {
      id: 2,
      action: "DEPOSITED",
      from: "HC Mohan Singh",
      to: "Station Malkhana",
      location: "Koramangala PS",
      timestamp: "2024-01-15 16:45",
      remarks: "Sealed and logged",
      verified: true,
    },
    {
      id: 3,
      action: "TRANSFERRED",
      from: "Station Malkhana",
      to: "FSL",
      location: "Regional FSL, Madiwala",
      timestamp: "2024-01-16 10:30",
      remarks: "For fingerprint analysis",
      verified: true,
    },
  ],
  photos: [
    { id: 1, name: "evidence_front.jpg", size: "2.4 MB" },
    { id: 2, name: "evidence_back.jpg", size: "2.1 MB" },
    { id: 3, name: "evidence_detail.jpg", size: "1.8 MB" },
  ],
};

function getStatusBadge(status: string) {
  switch (status) {
    case "AT_MALKHANA":
      return <Badge variant="info">At Malkhana</Badge>;
    case "AT_FSL":
      return <Badge variant="warning">At FSL</Badge>;
    case "AT_COURT":
      return <Badge variant="secondary">At Court</Badge>;
    case "RETURNED":
      return <Badge variant="success">Returned</Badge>;
    case "DISPOSED":
      return <Badge variant="error">Disposed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function EvidenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("details");

  const canEdit = user && hasMinimumRole(user.role, "SI");
  const canTransfer = user && hasMinimumRole(user.role, "HEAD_CONSTABLE");

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
                  {mockEvidence.evidenceNumber}
                </h1>
                {getStatusBadge(mockEvidence.status)}
              </div>
              <p className="text-foreground-muted">
                Linked to FIR: {mockEvidence.linkedFIR}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              <Printer className="h-4 w-4 mr-2" />
              Print Label
            </Button>
            {canTransfer && (
              <Button variant="secondary">
                <Share2 className="h-4 w-4 mr-2" />
                Transfer
              </Button>
            )}
            {canEdit && (
              <Button>
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
                    <span className="font-mono text-accent">{mockEvidence.evidenceNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Type</span>
                    <Badge variant="info">{mockEvidence.type}</Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Linked FIR</span>
                    <span className="font-mono text-accent">{mockEvidence.linkedFIR}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Case Number</span>
                    <span className="font-mono">{mockEvidence.caseNumber}</span>
                  </div>
                  <div className="py-2">
                    <span className="text-foreground-muted block mb-2">Description</span>
                    <p className="text-foreground">{mockEvidence.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Physical Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Physical Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Container</span>
                    <span className="text-foreground">{mockEvidence.physicalDetails.containerType}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Seal Number</span>
                    <span className="font-mono text-foreground">{mockEvidence.physicalDetails.sealNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Weight</span>
                    <span className="text-foreground">{mockEvidence.physicalDetails.weight}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Dimensions</span>
                    <span className="text-foreground">{mockEvidence.physicalDetails.dimensions}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-foreground-muted">Condition</span>
                    <span className="text-foreground">{mockEvidence.physicalDetails.condition}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Collection Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Collection Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="py-2 border-b border-border">
                    <span className="text-foreground-muted block mb-1">Location</span>
                    <p className="text-foreground">{mockEvidence.collectionDetails.location}</p>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Date & Time</span>
                    <span className="text-foreground">
                      {mockEvidence.collectionDetails.date} at {mockEvidence.collectionDetails.time}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Collected By</span>
                    <span className="text-foreground">{mockEvidence.collectionDetails.collectedBy}</span>
                  </div>
                  <div className="py-2">
                    <span className="text-foreground-muted block mb-2">Witnesses</span>
                    <div className="space-y-1">
                      {mockEvidence.collectionDetails.witnesses.map((witness, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <User className="h-4 w-4 text-foreground-muted" />
                          <span className="text-foreground">{witness}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Current Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="font-medium text-warning">
                        {mockEvidence.currentLocation.type}
                      </span>
                    </div>
                    <p className="text-foreground font-medium">
                      {mockEvidence.currentLocation.name}
                    </p>
                    <p className="text-sm text-foreground-muted">
                      {mockEvidence.currentLocation.address}
                    </p>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Received Date</span>
                    <span className="text-foreground">{mockEvidence.currentLocation.receivedDate}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-foreground-muted">Expected Return</span>
                    <span className="text-foreground">{mockEvidence.currentLocation.expectedReturn}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chain of Custody Tab */}
          <TabsContent value="custody" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Chain of Custody Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {mockEvidence.chainOfCustody.map((entry, index) => (
                    <div key={entry.id} className="flex gap-4 pb-8 last:pb-0">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          entry.verified ? "bg-success/20" : "bg-warning/20"
                        }`}>
                          {entry.verified ? (
                            <Check className="h-5 w-5 text-success" />
                          ) : (
                            <Clock className="h-5 w-5 text-warning" />
                          )}
                        </div>
                        {index < mockEvidence.chainOfCustody.length - 1 && (
                          <div className="w-0.5 flex-1 bg-border mt-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={entry.action === "COLLECTED" ? "success" : "info"}>
                            {entry.action}
                          </Badge>
                          <span className="text-sm text-foreground-muted">
                            {entry.timestamp}
                          </span>
                        </div>
                        <div className="p-4 rounded-lg bg-background-tertiary">
                          <div className="flex items-center gap-2 text-sm">
                            {entry.from && (
                              <>
                                <span className="text-foreground-muted">From:</span>
                                <span className="text-foreground">{entry.from}</span>
                                <ArrowRight className="h-4 w-4 text-foreground-muted" />
                              </>
                            )}
                            <span className="text-foreground-muted">To:</span>
                            <span className="text-foreground">{entry.to}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm mt-2">
                            <MapPin className="h-4 w-4 text-foreground-muted" />
                            <span className="text-foreground-muted">{entry.location}</span>
                          </div>
                          {entry.remarks && (
                            <p className="text-sm text-foreground-muted mt-2 italic">
                              &quot;{entry.remarks}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {canTransfer && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button>
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
                  Forensic Analysis Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mockEvidence.forensicRequest ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-info/10 border border-info/20">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="warning">{mockEvidence.forensicRequest.status}</Badge>
                        <Badge variant="error">Priority: {mockEvidence.forensicRequest.priority}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-foreground-muted text-sm">Analysis Type</span>
                          <p className="text-foreground font-medium">{mockEvidence.forensicRequest.type}</p>
                        </div>
                        <div>
                          <span className="text-foreground-muted text-sm">Request Date</span>
                          <p className="text-foreground">{mockEvidence.forensicRequest.requestDate}</p>
                        </div>
                        <div>
                          <span className="text-foreground-muted text-sm">Requested By</span>
                          <p className="text-foreground">{mockEvidence.forensicRequest.requestedBy}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-background-tertiary">
                      <h4 className="font-medium text-foreground mb-2">Analysis Progress</h4>
                      <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-warning w-1/2" />
                      </div>
                      <p className="text-sm text-foreground-muted mt-2">
                        Fingerprint extraction in progress. Expected completion: 2024-02-10
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Microscope className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                    <p className="text-foreground-muted">No forensic analysis requested</p>
                    <Button className="mt-4">Request Analysis</Button>
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mockEvidence.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg bg-background-tertiary flex flex-col items-center justify-center border border-border hover:border-accent transition-colors cursor-pointer"
                    >
                      <Camera className="h-8 w-8 text-foreground-muted mb-2" />
                      <p className="text-sm text-foreground">{photo.name}</p>
                      <p className="text-xs text-foreground-muted">{photo.size}</p>
                    </div>
                  ))}
                  <div className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-accent transition-colors cursor-pointer">
                    <Camera className="h-8 w-8 text-foreground-muted mb-2" />
                    <p className="text-sm text-foreground-muted">Add Photo</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
