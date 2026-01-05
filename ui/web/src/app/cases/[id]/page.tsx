"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Briefcase,
  ArrowLeft,
  Edit,
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Link2,
  Plus,
  MapPin,
  Scale,
  Gavel,
  Shield,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

// Mock case data
const mockCase = {
  id: "CASE-2024-00156",
  firNumber: "KOR/2024/00089",
  title: "Armed Robbery at SBI Main Branch",
  status: "UNDER_INVESTIGATION",
  priority: "HIGH",
  category: "ROBBERY",
  ipcSections: ["IPC 392", "IPC 397", "Arms Act 25"],
  registeredDate: "2024-01-15",
  courtNextHearing: "2024-02-20",
  courtName: "Sessions Court, Koramangala",
  caseNumber: "SC/2024/CR/156",
  synopsis: `On 15th January 2024 at approximately 10:30 AM, three armed individuals entered the State Bank of India, Main Branch, Koramangala. The perpetrators were wearing masks and carrying country-made pistols. They held the bank staff and customers at gunpoint while one accomplice accessed the cash counter.

The robbers escaped with approximately Rs. 18.5 lakhs in cash. During the escape, one security guard sustained minor injuries. CCTV footage has been recovered and is being analyzed.

Initial investigation reveals this may be connected to similar incidents in neighboring districts.`,
  investigating: {
    officer: "SI Ramesh Kumar",
    badgeNumber: "KAR-SI-4521",
    team: ["HC Suresh M", "PC Venkatesh R", "PC Anjali S"],
  },
  accused: [
    { name: "Suspect 1 (Unidentified)", status: "ABSCONDING", description: "Male, 25-30 years, 5'8\" height" },
    { name: "Suspect 2 (Unidentified)", status: "ABSCONDING", description: "Male, 30-35 years, 5'10\" height" },
    { name: "Raju Kumar", status: "ARRESTED", description: "Driver of getaway vehicle" },
  ],
  witnesses: [
    { name: "Priya Sharma", type: "EYEWITNESS", statement: "Recorded" },
    { name: "Bank Manager", type: "VICTIM", statement: "Recorded" },
    { name: "Security Guard", type: "VICTIM", statement: "Pending" },
  ],
  evidence: [
    { id: "EVD-001", type: "DIGITAL", description: "CCTV Footage", status: "UNDER_ANALYSIS" },
    { id: "EVD-002", type: "PHYSICAL", description: "Abandoned motorcycle", status: "COLLECTED" },
    { id: "EVD-003", type: "BIOLOGICAL", description: "Blood sample from scene", status: "AT_FSL" },
  ],
  timeline: [
    { date: "2024-01-15 10:30", event: "Incident occurred", type: "incident" },
    { date: "2024-01-15 10:45", event: "FIR registered", type: "fir" },
    { date: "2024-01-15 14:00", event: "Case assigned to SI Ramesh Kumar", type: "assignment" },
    { date: "2024-01-16 09:00", event: "CCTV footage collected", type: "evidence" },
    { date: "2024-01-18 15:30", event: "Getaway vehicle located", type: "evidence" },
    { date: "2024-01-20 11:00", event: "Suspect Raju Kumar arrested", type: "arrest" },
    { date: "2024-01-22 10:00", event: "Chargesheet filed", type: "court" },
    { date: "2024-01-25 14:00", event: "First court hearing", type: "court" },
  ],
};

const statusConfig = {
  REGISTERED: { color: "info", label: "Registered" },
  UNDER_INVESTIGATION: { color: "warning", label: "Under Investigation" },
  CHARGESHEET_FILED: { color: "accent", label: "Chargesheet Filed" },
  IN_COURT: { color: "info", label: "In Court" },
  CONVICTION: { color: "success", label: "Conviction" },
  ACQUITTAL: { color: "error", label: "Acquittal" },
  CLOSED: { color: "muted", label: "Closed" },
};

const priorityConfig = {
  LOW: { color: "success", label: "Low" },
  MEDIUM: { color: "info", label: "Medium" },
  HIGH: { color: "warning", label: "High" },
  CRITICAL: { color: "error", label: "Critical" },
};

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "accused" | "evidence" | "timeline" | "court">("overview");

  const canEdit = user && hasMinimumRole(user.role, "SI");

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "accused", label: "Accused & Witnesses", icon: Users },
    { id: "evidence", label: "Evidence", icon: Shield },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "court", label: "Court", icon: Gavel },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{mockCase.id}</h1>
                <Badge variant={statusConfig[mockCase.status as keyof typeof statusConfig]?.color as any}>
                  {statusConfig[mockCase.status as keyof typeof statusConfig]?.label}
                </Badge>
                <Badge variant={priorityConfig[mockCase.priority as keyof typeof priorityConfig]?.color as any}>
                  {mockCase.priority} Priority
                </Badge>
              </div>
              <p className="text-foreground-muted mt-1">{mockCase.title}</p>
              <p className="text-sm text-foreground-muted mt-1">
                FIR: {mockCase.firNumber} | Registered: {mockCase.registeredDate}
              </p>
            </div>
          </div>
          {canEdit && (
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Case
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <Users className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{mockCase.accused.length}</p>
                  <p className="text-xs text-foreground-muted">Accused</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Shield className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{mockCase.evidence.length}</p>
                  <p className="text-xs text-foreground-muted">Evidence Items</p>
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
                  <p className="text-2xl font-bold text-foreground">{mockCase.witnesses.length}</p>
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
                  <p className="text-sm font-bold text-foreground">{mockCase.courtNextHearing}</p>
                  <p className="text-xs text-foreground-muted">Next Hearing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
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

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeTab === "overview" && (
            <>
              <div className="lg:col-span-2 space-y-6">
                {/* Synopsis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Case Synopsis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground-muted whitespace-pre-line">{mockCase.synopsis}</p>
                  </CardContent>
                </Card>

                {/* IPC Sections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5" />
                      Applicable Sections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {mockCase.ipcSections.map((section) => (
                        <Badge key={section} variant="muted" className="text-sm">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Investigating Team */}
                <Card>
                  <CardHeader>
                    <CardTitle>Investigating Team</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-background-tertiary">
                      <p className="font-medium text-foreground">{mockCase.investigating.officer}</p>
                      <p className="text-sm text-foreground-muted">{mockCase.investigating.badgeNumber}</p>
                      <Badge variant="accent" className="mt-2">Lead Investigator</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground-muted">Team Members</p>
                      {mockCase.investigating.team.map((member) => (
                        <div key={member} className="text-sm text-foreground">{member}</div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Court Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gavel className="h-5 w-5" />
                      Court Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-foreground-muted">Court</p>
                      <p className="text-foreground">{mockCase.courtName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Case Number</p>
                      <p className="text-foreground">{mockCase.caseNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Next Hearing</p>
                      <p className="text-foreground font-medium">{mockCase.courtNextHearing}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === "accused" && (
            <div className="lg:col-span-3 space-y-6">
              {/* Accused */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Accused Persons</CardTitle>
                    {canEdit && (
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Accused
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCase.accused.map((person, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary"
                      >
                        <div>
                          <p className="font-medium text-foreground">{person.name}</p>
                          <p className="text-sm text-foreground-muted">{person.description}</p>
                        </div>
                        <Badge
                          variant={person.status === "ARRESTED" ? "success" : "error"}
                        >
                          {person.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Witnesses */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Witnesses</CardTitle>
                    {canEdit && (
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Witness
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCase.witnesses.map((witness, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary"
                      >
                        <div>
                          <p className="font-medium text-foreground">{witness.name}</p>
                          <p className="text-sm text-foreground-muted">{witness.type}</p>
                        </div>
                        <Badge variant={witness.statement === "Recorded" ? "success" : "warning"}>
                          Statement: {witness.statement}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "evidence" && (
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Evidence Items</CardTitle>
                    {canEdit && (
                      <Button size="sm" onClick={() => router.push("/evidence/new")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Evidence
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCase.evidence.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary cursor-pointer hover:bg-background-secondary transition-colors"
                        onClick={() => router.push(`/evidence/${item.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-accent/10">
                            <Shield className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{item.id}</p>
                            <p className="text-sm text-foreground-muted">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="muted">{item.type}</Badge>
                          <Badge
                            variant={
                              item.status === "COLLECTED"
                                ? "success"
                                : item.status === "AT_FSL"
                                ? "warning"
                                : "info"
                            }
                          >
                            {item.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Case Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-6">
                      {mockCase.timeline.map((event, index) => (
                        <div key={index} className="relative pl-10">
                          <div
                            className={`absolute left-2 w-5 h-5 rounded-full border-2 border-background ${
                              event.type === "incident"
                                ? "bg-error"
                                : event.type === "arrest"
                                ? "bg-success"
                                : event.type === "court"
                                ? "bg-accent"
                                : "bg-info"
                            }`}
                          />
                          <div className="p-4 rounded-lg bg-background-tertiary">
                            <p className="text-xs text-foreground-muted">{event.date}</p>
                            <p className="font-medium text-foreground mt-1">{event.event}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "court" && (
            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Court Proceedings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-4 rounded-lg bg-background-tertiary">
                      <p className="text-sm text-foreground-muted">Court Name</p>
                      <p className="font-medium text-foreground mt-1">{mockCase.courtName}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background-tertiary">
                      <p className="text-sm text-foreground-muted">Case Number</p>
                      <p className="font-medium text-foreground mt-1">{mockCase.caseNumber}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <p className="text-sm text-accent">Next Hearing</p>
                      <p className="font-bold text-accent mt-1">{mockCase.courtNextHearing}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-4">Hearing History</h4>
                    <div className="space-y-3">
                      {mockCase.timeline
                        .filter((e) => e.type === "court")
                        .map((hearing, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary"
                          >
                            <div>
                              <p className="font-medium text-foreground">{hearing.event}</p>
                              <p className="text-sm text-foreground-muted">{hearing.date}</p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-success" />
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
