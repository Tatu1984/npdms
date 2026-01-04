"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Award,
  Briefcase,
  Calendar,
  Edit,
  Camera,
  FileText,
  Clock,
  TrendingUp,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore, getRoleDisplayName } from "@/stores/authStore";

// Mock performance data
const mockPerformance = {
  casesHandled: 45,
  casesResolved: 38,
  resolutionRate: 84,
  avgResolutionTime: 12,
  rating: 4.5,
  commendations: 3,
  trainings: [
    { name: "Cyber Crime Investigation", date: "2023-12", status: "Completed" },
    { name: "Forensic Evidence Handling", date: "2023-08", status: "Completed" },
    { name: "Advanced Interview Techniques", date: "2024-02", status: "Scheduled" },
  ],
};

// Mock activity log
const mockActivity = [
  { action: "Updated case diary", case: "KOR/2024/00123", time: "2 hours ago" },
  { action: "Registered new FIR", case: "KOR/2024/00125", time: "5 hours ago" },
  { action: "Acknowledged flash alert", case: null, time: "6 hours ago" },
  { action: "Collected evidence", case: "KOR/2024/00121", time: "1 day ago" },
  { action: "Submitted case for chargesheet", case: "KOR/2024/00089", time: "2 days ago" },
];

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-accent/10 flex items-center justify-center">
                  <User className="h-12 w-12 text-accent" />
                </div>
                <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                    <Badge variant="info" className="mt-1">
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </div>
                  <Button variant="secondary">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-foreground-muted" />
                    <span className="text-foreground">{user.badgeNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-foreground-muted" />
                    <span className="text-foreground">{user.stationName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-foreground-muted" />
                    <span className="text-foreground">+91 9876543210</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-foreground-muted" />
                    <span className="text-foreground">{user.name.toLowerCase().replace(" ", ".")}@karpolice.gov.in</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <User className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Clock className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="training">
              <Award className="h-4 w-4 mr-2" />
              Training
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Full Name</span>
                    <span className="text-foreground">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Badge Number</span>
                    <span className="font-mono text-accent">{user.badgeNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Rank</span>
                    <span className="text-foreground">{getRoleDisplayName(user.role)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Date of Joining</span>
                    <span className="text-foreground">15 May 2019</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Years of Service</span>
                    <span className="text-foreground">4 years, 8 months</span>
                  </div>
                </CardContent>
              </Card>

              {/* Posting Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Current Posting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Station</span>
                    <span className="text-foreground">{user.stationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">District</span>
                    <span className="text-foreground">{user.districtName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">State</span>
                    <span className="text-foreground">{user.stateName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Posted Since</span>
                    <span className="text-foreground">01 Jan 2023</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Reporting To</span>
                    <span className="text-foreground">Insp. Sharma (SHO)</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-accent">{mockPerformance.casesHandled}</p>
                  <p className="text-sm text-foreground-muted">Cases Handled</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-success">{mockPerformance.casesResolved}</p>
                  <p className="text-sm text-foreground-muted">Cases Resolved</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-info">{mockPerformance.resolutionRate}%</p>
                  <p className="text-sm text-foreground-muted">Resolution Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-warning">{mockPerformance.commendations}</p>
                  <p className="text-sm text-foreground-muted">Commendations</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Case Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-foreground">Resolution Rate</span>
                      <span className="text-sm font-medium text-success">{mockPerformance.resolutionRate}%</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success"
                        style={{ width: `${mockPerformance.resolutionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-t border-border">
                    <span className="text-foreground-muted">Average Resolution Time</span>
                    <span className="text-foreground">{mockPerformance.avgResolutionTime} days</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-border">
                    <span className="text-foreground-muted">Cases This Month</span>
                    <span className="text-foreground">8</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-border">
                    <span className="text-foreground-muted">Currently Active</span>
                    <span className="text-foreground">3</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-5xl font-bold text-warning">{mockPerformance.rating}</p>
                    <div className="text-warning mt-2">
                      {"★".repeat(Math.floor(mockPerformance.rating))}
                      {"☆".repeat(5 - Math.floor(mockPerformance.rating))}
                    </div>
                    <p className="text-sm text-foreground-muted mt-2">Based on 12 reviews</p>
                  </div>
                  <div className="space-y-2 mt-4">
                    {[
                      { label: "Investigation Skills", value: 4.5 },
                      { label: "Documentation", value: 4.2 },
                      { label: "Public Interaction", value: 4.8 },
                      { label: "Punctuality", value: 4.5 },
                    ].map((skill, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-foreground-muted">{skill.label}</span>
                        <span className="text-sm text-foreground">{skill.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-3 rounded-lg bg-background-tertiary"
                    >
                      <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground">{activity.action}</p>
                        {activity.case && (
                          <p className="text-sm text-accent font-mono">{activity.case}</p>
                        )}
                        <p className="text-xs text-foreground-muted">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Training & Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPerformance.trainings.map((training, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary"
                    >
                      <div>
                        <p className="font-medium text-foreground">{training.name}</p>
                        <p className="text-sm text-foreground-muted">{training.date}</p>
                      </div>
                      <Badge
                        variant={training.status === "Completed" ? "success" : "info"}
                      >
                        {training.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commendations & Awards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: "Best Investigation Award", year: "2023", from: "District SP" },
                    { title: "Appreciation Letter", year: "2023", from: "DGP Office" },
                    { title: "Community Service Award", year: "2022", from: "Local MLA" },
                  ].map((award, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary"
                    >
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-warning" />
                        <div>
                          <p className="font-medium text-foreground">{award.title}</p>
                          <p className="text-sm text-foreground-muted">From: {award.from}</p>
                        </div>
                      </div>
                      <span className="text-foreground-muted">{award.year}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
