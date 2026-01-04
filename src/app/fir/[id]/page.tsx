"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Share2,
  AlertCircle,
  CheckCircle,
  Users,
  Package,
  History,
  MessageSquare,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useFIRStore } from "@/stores/firStore";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import type { FIRStatus, FIRPriority } from "@/types";

function getStatusBadgeVariant(status: FIRStatus) {
  const variants: Record<FIRStatus, string> = {
    REGISTERED: "registered",
    UNDER_INVESTIGATION: "investigating",
    CHARGESHEET_FILED: "chargesheet",
    COURT_PENDING: "warning",
    CLOSED: "closed",
    TRANSFERRED: "secondary",
  };
  return variants[status] || "secondary";
}

function getPriorityBadgeVariant(priority: FIRPriority) {
  const variants: Record<FIRPriority, string> = {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
    CRITICAL: "critical",
  };
  return variants[priority] || "secondary";
}

// Mock case diary entries
const caseDiaryEntries = [
  {
    id: "1",
    date: "2024-01-16",
    time: "10:30",
    officer: "SI Suresh",
    content:
      "Visited scene of crime. Collected CCTV footage from neighboring shop. Owner Mr. Sharma provided footage from 14:00-15:00 hours. Footage shows suspect entering premises. Face partially visible.",
    nextAction: "Send footage for enhancement. Canvas nearby shops.",
    attachments: ["cctv_footage.mp4"],
  },
  {
    id: "2",
    date: "2024-01-15",
    time: "18:00",
    officer: "Const. Ramesh",
    content:
      "Recorded statements from two witnesses: 1. Mrs. Lakshmi (neighbor) - Saw unknown person near gate 2. Mr. Auto Driver - Dropped person matching description near location.",
    attachments: ["witness_stmt_1.pdf", "witness_stmt_2.pdf"],
  },
  {
    id: "3",
    date: "2024-01-15",
    time: "15:30",
    officer: "SI Suresh",
    content:
      "FIR registered. Initial investigation commenced. Scene visited, photographs taken. Fingerprints lifted from door handle and window frame.",
    attachments: ["scene_photos.zip", "fingerprint_01.jpg"],
  },
];

// Mock similar cases for AI analysis
const similarCases = [
  {
    firNumber: "IND/2024/00098",
    similarity: 85,
    station: "Indiranagar PS",
    description: "Similar MO - theft from parked vehicle in mall parking",
  },
  {
    firNumber: "KOR/2023/02345",
    similarity: 72,
    station: "Koramangala PS",
    description: "Same locality - laptop theft from parked car",
  },
  {
    firNumber: "HSR/2024/00567",
    similarity: 68,
    station: "HSR Layout PS",
    description: "Similar time pattern - evening theft from vehicle",
  },
];

export default function FIRDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const { firs, loadFIRs, selectedFIR, setSelectedFIR } = useFIRStore();
  const [activeTab, setActiveTab] = useState("details");

  const canEdit = user && hasMinimumRole(user.role, "SI");
  const canTransfer = user && hasMinimumRole(user.role, "SHO");

  useEffect(() => {
    if (firs.length === 0) {
      loadFIRs();
    }
  }, [firs.length, loadFIRs]);

  useEffect(() => {
    if (firs.length > 0 && params.id) {
      const fir = firs.find((f) => f.id === params.id);
      if (fir) {
        setSelectedFIR(fir);
      }
    }
  }, [firs, params.id, setSelectedFIR]);

  if (!selectedFIR) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
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
                  {selectedFIR.firNumber}
                </h1>
                <Badge variant={getStatusBadgeVariant(selectedFIR.status) as any}>
                  {selectedFIR.status.replace(/_/g, " ")}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(selectedFIR.priority) as any}>
                  {selectedFIR.priority}
                </Badge>
              </div>
              <p className="text-foreground-muted">
                {selectedFIR.offenceType} - {selectedFIR.stationName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="ghost">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {canEdit && (
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Case Summary Card */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-foreground-muted">FIR Number</p>
                <p className="font-mono text-accent">{selectedFIR.firNumber}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Registered On</p>
                <p className="text-foreground">
                  {new Date(selectedFIR.registeredAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Station</p>
                <p className="text-foreground">{selectedFIR.stationName}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Investigating Officer</p>
                <p className="text-foreground">
                  {selectedFIR.investigatingOfficerName || "Unassigned"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="diary">
              <History className="h-4 w-4 mr-2" />
              Case Diary
            </TabsTrigger>
            <TabsTrigger value="persons">
              <Users className="h-4 w-4 mr-2" />
              Persons
            </TabsTrigger>
            <TabsTrigger value="evidence">
              <Package className="h-4 w-4 mr-2" />
              Evidence
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Complainant */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Complainant Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-foreground-muted">Name</p>
                      <p className="text-foreground font-medium">{selectedFIR.complainantName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Phone</p>
                      <p className="text-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {selectedFIR.complainantPhone}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-foreground-muted">Address</p>
                      <p className="text-foreground">{selectedFIR.complainantAddress}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Incident */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Incident Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-foreground-muted">Date & Time</p>
                        <p className="text-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(selectedFIR.incidentDate).toLocaleDateString("en-IN")}
                          {selectedFIR.incidentTime && ` at ${selectedFIR.incidentTime}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-foreground-muted">Location</p>
                        <p className="text-foreground">{selectedFIR.incidentLocation}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Offence</p>
                      <p className="text-foreground">
                        {selectedFIR.offenceCategory} - {selectedFIR.offenceType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">IPC Sections</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFIR.ipcSections.map((section) => (
                          <Badge key={section} variant="secondary">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Description</p>
                      <p className="text-foreground mt-1">{selectedFIR.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* AI Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-accent" />
                      AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">
                        Similar Cases Detected ({similarCases.length})
                      </p>
                      <div className="space-y-2">
                        {similarCases.map((c) => (
                          <div
                            key={c.firNumber}
                            className="p-3 rounded-md bg-background-tertiary hover:bg-background-secondary cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm text-accent">{c.firNumber}</span>
                              <Badge variant="info" className="text-xs">
                                {c.similarity}% match
                              </Badge>
                            </div>
                            <p className="text-xs text-foreground-muted mt-1">{c.station}</p>
                            <p className="text-xs text-foreground mt-1">{c.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-foreground-muted">
                        <AlertCircle className="h-3 w-3" />
                        AI suggestions are advisory. Verify before action.
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1">
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Link Cases
                      </Button>
                      <Button variant="ghost" size="sm">
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {canTransfer && (
                      <Button variant="secondary" className="w-full justify-start">
                        Transfer Case
                      </Button>
                    )}
                    <Button variant="secondary" className="w-full justify-start">
                      Request Assistance
                    </Button>
                    <Button variant="secondary" className="w-full justify-start">
                      Escalate
                    </Button>
                    {canEdit && (
                      <>
                        <Button variant="secondary" className="w-full justify-start">
                          Close Case
                        </Button>
                        <Button variant="secondary" className="w-full justify-start">
                          File Chargesheet
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Case Diary Tab */}
          <TabsContent value="diary" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Case Diary Entries</h3>
              {canEdit && (
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {caseDiaryEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">{entry.officer}</p>
                        <p className="text-sm text-foreground-muted">
                          {new Date(entry.date).toLocaleDateString("en-IN")} at {entry.time}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                    <p className="text-foreground mb-3">{entry.content}</p>
                    {entry.nextAction && (
                      <div className="p-2 rounded-md bg-info/10 mb-3">
                        <p className="text-sm text-info">
                          <strong>Next Action:</strong> {entry.nextAction}
                        </p>
                      </div>
                    )}
                    {entry.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.attachments.map((file) => (
                          <Badge key={file} variant="secondary" className="cursor-pointer">
                            {file}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Persons Tab */}
          <TabsContent value="persons" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Complainant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{selectedFIR.complainantName}</p>
                      <p className="text-sm text-foreground-muted">{selectedFIR.complainantPhone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Accused/Suspects</CardTitle>
                  <Button variant="secondary" size="sm">
                    Add Suspect
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground-muted text-sm">No suspects identified yet</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Witnesses</CardTitle>
                  <Button variant="secondary" size="sm">
                    Add Witness
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-3 rounded-md bg-background-tertiary">
                      <User className="h-5 w-5 text-foreground-muted" />
                      <div>
                        <p className="font-medium text-foreground">Mrs. Lakshmi</p>
                        <p className="text-xs text-foreground-muted">Neighbor - Statement recorded</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-md bg-background-tertiary">
                      <User className="h-5 w-5 text-foreground-muted" />
                      <div>
                        <p className="font-medium text-foreground">Auto Driver (Name TBD)</p>
                        <p className="text-xs text-foreground-muted">
                          Eyewitness - Statement recorded
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Evidence Tab */}
          <TabsContent value="evidence" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Evidence Registry</h3>
              {canEdit && (
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Add Evidence
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="info">Physical</Badge>
                    <Badge variant="warning">At Lab</Badge>
                  </div>
                  <p className="font-medium text-foreground">Fingerprint Sample</p>
                  <p className="text-sm text-foreground-muted">
                    Collected from door handle at scene
                  </p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-foreground-muted">
                      EVD-2024-KOR-00123-001 | Collected: 15 Jan 2024
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="info">Digital</Badge>
                    <Badge variant="success">In Vault</Badge>
                  </div>
                  <p className="font-medium text-foreground">CCTV Footage</p>
                  <p className="text-sm text-foreground-muted">
                    Footage from Sharma Stores (2.3 GB)
                  </p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-foreground-muted">
                      EVD-2024-KOR-00123-002 | Collected: 16 Jan 2024
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
              <div className="space-y-6">
                {[
                  {
                    date: "16 Jan 2024",
                    time: "10:30",
                    title: "Scene Investigation",
                    description: "CCTV footage collected from nearby shop",
                    icon: CheckCircle,
                    iconColor: "text-success",
                  },
                  {
                    date: "15 Jan 2024",
                    time: "18:00",
                    title: "Witness Statements",
                    description: "Recorded statements from 2 witnesses",
                    icon: Users,
                    iconColor: "text-info",
                  },
                  {
                    date: "15 Jan 2024",
                    time: "15:30",
                    title: "FIR Registered",
                    description: "Initial investigation commenced",
                    icon: FileText,
                    iconColor: "text-accent",
                  },
                  {
                    date: "15 Jan 2024",
                    time: "14:30",
                    title: "Incident Occurred",
                    description: "Theft reported at Forum Mall parking",
                    icon: AlertCircle,
                    iconColor: "text-error",
                  },
                ].map((event, index) => (
                  <div key={index} className="relative pl-10">
                    <div
                      className={`absolute left-0 top-0 h-8 w-8 rounded-full bg-background-secondary border border-border flex items-center justify-center`}
                    >
                      <event.icon className={`h-4 w-4 ${event.iconColor}`} />
                    </div>
                    <div className="p-4 rounded-lg bg-background-secondary">
                      <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
                        <span>{event.date}</span>
                        <span>•</span>
                        <span>{event.time}</span>
                      </div>
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="text-sm text-foreground-muted">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
