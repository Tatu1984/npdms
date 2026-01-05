"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  FileText,
  Award,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useAuthStore, hasMinimumRole, getRoleDisplayName } from "@/stores/authStore";

// Mock officer data
const mockOfficer = {
  id: "off-001",
  badgeNumber: "KAR-SI-4567",
  name: "Ramesh Kumar",
  rank: "SI",
  photo: null,
  phone: "+91 9876543210",
  email: "ramesh.kumar@karpolice.gov.in",
  dateOfBirth: "1985-03-15",
  dateOfJoining: "2010-06-01",
  gender: "Male",
  bloodGroup: "B+",

  currentPosting: {
    station: "Koramangala Police Station",
    district: "Bangalore Urban",
    state: "Karnataka",
    since: "2022-01-15",
  },

  address: {
    permanent: "123, 4th Main, Jayanagar 4th Block, Bangalore - 560041",
    current: "45, 2nd Cross, Koramangala 5th Block, Bangalore - 560095",
  },

  emergency: {
    name: "Sunita Kumar",
    relation: "Spouse",
    phone: "+91 9876543211",
  },

  stats: {
    casesAssigned: 45,
    casesResolved: 38,
    pendingCases: 7,
    resolutionRate: 84,
    avgResolutionDays: 12,
    commendations: 3,
    complaints: 0,
  },

  postingHistory: [
    { station: "Koramangala PS", from: "2022-01-15", to: "Present", role: "Investigation Officer" },
    { station: "HSR Layout PS", from: "2018-06-01", to: "2022-01-14", role: "Beat Officer" },
    { station: "Jayanagar PS", from: "2015-03-01", to: "2018-05-31", role: "Beat Officer" },
    { station: "Police Training Academy", from: "2010-06-01", to: "2015-02-28", role: "Trainee → Constable" },
  ],

  trainings: [
    { name: "Cyber Crime Investigation", year: "2023", status: "Completed" },
    { name: "Forensic Evidence Handling", year: "2022", status: "Completed" },
    { name: "Advanced Interrogation", year: "2021", status: "Completed" },
    { name: "Leadership Development", year: "2024", status: "Scheduled" },
  ],

  awards: [
    { title: "Best Investigation Award", year: "2023", from: "District SP" },
    { title: "Appreciation Letter", year: "2022", from: "DGP Office" },
    { title: "Community Service Medal", year: "2020", from: "State Government" },
  ],

  activeCases: [
    { firNumber: "KOR/2024/00123", type: "Theft", status: "UNDER_INVESTIGATION" },
    { firNumber: "KOR/2024/00118", type: "Burglary", status: "UNDER_INVESTIGATION" },
    { firNumber: "KOR/2024/00089", type: "Assault", status: "CHARGESHEET_FILED" },
  ],

  attendance: {
    present: 22,
    leave: 2,
    absent: 0,
    onDuty: 24,
  },

  status: "ON_DUTY",
  lastSeen: "2 min ago",
};

function getStatusBadge(status: string) {
  switch (status) {
    case "ON_DUTY":
      return <Badge variant="success">On Duty</Badge>;
    case "OFF_DUTY":
      return <Badge variant="secondary">Off Duty</Badge>;
    case "ON_LEAVE":
      return <Badge variant="warning">On Leave</Badge>;
    case "SUSPENDED":
      return <Badge variant="error">Suspended</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function OfficerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");

  const canEdit = user && hasMinimumRole(user.role, "SHO");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="h-8 w-8 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">
                    {mockOfficer.name}
                  </h1>
                  {getStatusBadge(mockOfficer.status)}
                </div>
                <div className="flex items-center gap-4 text-foreground-muted">
                  <span className="font-mono text-accent">{mockOfficer.badgeNumber}</span>
                  <span>|</span>
                  <span>{getRoleDisplayName(mockOfficer.rank as any)}</span>
                </div>
              </div>
            </div>
          </div>
          {canEdit && (
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">{mockOfficer.stats.casesAssigned}</p>
              <p className="text-sm text-foreground-muted">Cases Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success">{mockOfficer.stats.casesResolved}</p>
              <p className="text-sm text-foreground-muted">Resolved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-warning">{mockOfficer.stats.pendingCases}</p>
              <p className="text-sm text-foreground-muted">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-info">{mockOfficer.stats.resolutionRate}%</p>
              <p className="text-sm text-foreground-muted">Resolution Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{mockOfficer.stats.commendations}</p>
              <p className="text-sm text-foreground-muted">Commendations</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <User className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="cases">
              <FileText className="h-4 w-4 mr-2" />
              Cases
            </TabsTrigger>
            <TabsTrigger value="career">
              <Briefcase className="h-4 w-4 mr-2" />
              Career
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Full Name</span>
                    <span className="text-foreground">{mockOfficer.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Badge Number</span>
                    <span className="font-mono text-accent">{mockOfficer.badgeNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Rank</span>
                    <span className="text-foreground">{getRoleDisplayName(mockOfficer.rank as any)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Date of Birth</span>
                    <span className="text-foreground">{mockOfficer.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Gender</span>
                    <span className="text-foreground">{mockOfficer.gender}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-foreground-muted">Blood Group</span>
                    <Badge variant="error">{mockOfficer.bloodGroup}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 py-2 border-b border-border">
                    <Phone className="h-4 w-4 text-foreground-muted" />
                    <span className="text-foreground">{mockOfficer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 py-2 border-b border-border">
                    <Mail className="h-4 w-4 text-foreground-muted" />
                    <span className="text-foreground">{mockOfficer.email}</span>
                  </div>
                  <div className="py-2 border-b border-border">
                    <div className="flex items-center gap-2 text-foreground-muted mb-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">Permanent Address</span>
                    </div>
                    <p className="text-foreground text-sm">{mockOfficer.address.permanent}</p>
                  </div>
                  <div className="py-2">
                    <div className="flex items-center gap-2 text-foreground-muted mb-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">Current Address</span>
                    </div>
                    <p className="text-foreground text-sm">{mockOfficer.address.current}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Current Posting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Current Posting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Station</span>
                    <span className="text-foreground">{mockOfficer.currentPosting.station}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">District</span>
                    <span className="text-foreground">{mockOfficer.currentPosting.district}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">State</span>
                    <span className="text-foreground">{mockOfficer.currentPosting.state}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-foreground-muted">Posted Since</span>
                    <span className="text-foreground">{mockOfficer.currentPosting.since}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="border-error/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-error">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Name</span>
                    <span className="text-foreground">{mockOfficer.emergency.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Relationship</span>
                    <span className="text-foreground">{mockOfficer.emergency.relation}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-foreground-muted">Phone</span>
                    <span className="text-foreground">{mockOfficer.emergency.phone}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cases Tab */}
          <TabsContent value="cases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockOfficer.activeCases.map((caseItem, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary hover:bg-background-secondary cursor-pointer"
                    >
                      <div>
                        <span className="font-mono text-accent">{caseItem.firNumber}</span>
                        <p className="text-sm text-foreground-muted">{caseItem.type}</p>
                      </div>
                      <Badge variant="investigating">{caseItem.status.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Career Tab */}
          <TabsContent value="career" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Posting History */}
              <Card>
                <CardHeader>
                  <CardTitle>Posting History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockOfficer.postingHistory.map((posting, index) => (
                      <div key={index} className="relative pl-6 pb-4 border-l-2 border-border last:pb-0">
                        <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-accent" />
                        <p className="font-medium text-foreground">{posting.station}</p>
                        <p className="text-sm text-foreground-muted">{posting.role}</p>
                        <p className="text-xs text-foreground-muted">{posting.from} - {posting.to}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trainings */}
              <Card>
                <CardHeader>
                  <CardTitle>Training & Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockOfficer.trainings.map((training, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary"
                      >
                        <div>
                          <p className="font-medium text-foreground">{training.name}</p>
                          <p className="text-sm text-foreground-muted">{training.year}</p>
                        </div>
                        <Badge variant={training.status === "Completed" ? "success" : "info"}>
                          {training.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Awards */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Awards & Commendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockOfficer.awards.map((award, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-warning/5 border border-warning/20"
                      >
                        <Award className="h-6 w-6 text-warning mb-2" />
                        <p className="font-medium text-foreground">{award.title}</p>
                        <p className="text-sm text-foreground-muted">From: {award.from}</p>
                        <p className="text-xs text-foreground-muted">{award.year}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Case Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-foreground">Resolution Rate</span>
                      <span className="text-success font-medium">{mockOfficer.stats.resolutionRate}%</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success"
                        style={{ width: `${mockOfficer.stats.resolutionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-t border-border">
                    <span className="text-foreground-muted">Avg. Resolution Time</span>
                    <span className="text-foreground">{mockOfficer.stats.avgResolutionDays} days</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-border">
                    <span className="text-foreground-muted">Complaints Filed</span>
                    <span className="text-success">{mockOfficer.stats.complaints}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>This Month&apos;s Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-success/10 text-center">
                      <p className="text-2xl font-bold text-success">{mockOfficer.attendance.present}</p>
                      <p className="text-sm text-foreground-muted">Present</p>
                    </div>
                    <div className="p-4 rounded-lg bg-warning/10 text-center">
                      <p className="text-2xl font-bold text-warning">{mockOfficer.attendance.leave}</p>
                      <p className="text-sm text-foreground-muted">Leave</p>
                    </div>
                    <div className="p-4 rounded-lg bg-error/10 text-center">
                      <p className="text-2xl font-bold text-error">{mockOfficer.attendance.absent}</p>
                      <p className="text-sm text-foreground-muted">Absent</p>
                    </div>
                    <div className="p-4 rounded-lg bg-info/10 text-center">
                      <p className="text-2xl font-bold text-info">{mockOfficer.attendance.onDuty}</p>
                      <p className="text-sm text-foreground-muted">Total Days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
