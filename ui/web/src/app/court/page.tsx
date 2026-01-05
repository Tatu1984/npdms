"use client";

import { useState } from "react";
import {
  Gavel,
  Calendar,
  Clock,
  FileText,
  Users,
  Building,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Bell,
  MapPin,
  Briefcase,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/authStore";

const upcomingHearings = [
  {
    id: 1,
    caseNumber: "CASE-2024-00156",
    title: "State vs. Raju Kumar & Others",
    court: "Sessions Court, Koramangala",
    courtRoom: "Court Room 3",
    judge: "Hon. Justice A.K. Sharma",
    date: "2024-02-20",
    time: "10:30 AM",
    type: "ARGUMENTS",
    io: "SI Ramesh Kumar",
    charges: ["IPC 392", "IPC 397"],
    requiredDocuments: ["Chargesheet", "FSL Report", "Witness Statements"],
    priority: "HIGH",
  },
  {
    id: 2,
    caseNumber: "CASE-2024-00150",
    title: "State vs. Vijay Malhotra",
    court: "Magistrate Court, Koramangala",
    courtRoom: "Court Room 1",
    judge: "Hon. Magistrate S.P. Rao",
    date: "2024-02-22",
    time: "11:00 AM",
    type: "BAIL_HEARING",
    io: "SI Priya Sharma",
    charges: ["IPC 304A"],
    priority: "MEDIUM",
  },
  {
    id: 3,
    caseNumber: "CASE-2024-00145",
    title: "State vs. Anand Sharma",
    court: "Sessions Court, Koramangala",
    courtRoom: "Court Room 2",
    judge: "Hon. Justice P.S. Reddy",
    date: "2024-02-25",
    time: "02:00 PM",
    type: "EVIDENCE",
    io: "Inspector Venkatesh",
    charges: ["NDPS 20"],
    requiredDocuments: ["FSL Narcotics Report", "Seizure Memo"],
    priority: "HIGH",
  },
  {
    id: 4,
    caseNumber: "CASE-2024-00135",
    title: "State vs. Mohammed Farooq",
    court: "Sessions Court, Koramangala",
    courtRoom: "Court Room 3",
    judge: "Hon. Justice A.K. Sharma",
    date: "2024-02-28",
    time: "10:00 AM",
    type: "REMAND_EXTENSION",
    io: "SI Anjali Desai",
    charges: ["IPC 420", "IPC 406"],
    priority: "LOW",
  },
];

const recentOrders = [
  {
    id: 1,
    caseNumber: "CASE-2024-00156",
    orderDate: "2024-01-25",
    orderType: "REMAND",
    summary: "Judicial custody extended by 14 days for accused Raju Kumar",
    court: "Sessions Court",
  },
  {
    id: 2,
    caseNumber: "CASE-2024-00148",
    orderDate: "2024-01-24",
    orderType: "BAIL_REJECTED",
    summary: "Anticipatory bail rejected for accused Mohammed Farooq",
    court: "Sessions Court",
  },
  {
    id: 3,
    caseNumber: "CASE-2024-00150",
    orderDate: "2024-01-22",
    orderType: "DIRECTIONS",
    summary: "IO directed to submit FSL report within 7 days",
    court: "Magistrate Court",
  },
];

const courts = [
  { name: "Sessions Court, Koramangala", cases: 45, pending: 12 },
  { name: "Magistrate Court, Koramangala", cases: 78, pending: 23 },
  { name: "High Court of Karnataka", cases: 5, pending: 2 },
  { name: "Family Court, Koramangala", cases: 15, pending: 8 },
];

const hearingTypes = {
  ARGUMENTS: { label: "Arguments", color: "accent" },
  EVIDENCE: { label: "Evidence", color: "info" },
  BAIL_HEARING: { label: "Bail Hearing", color: "warning" },
  REMAND_EXTENSION: { label: "Remand Extension", color: "error" },
  JUDGMENT: { label: "Judgment", color: "success" },
  CHARGESHEET: { label: "Chargesheet", color: "muted" },
};

export default function CourtPage() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayHearings = upcomingHearings.filter(
    (h) => h.date === new Date().toISOString().split("T")[0]
  );

  const thisWeekHearings = upcomingHearings.filter((h) => {
    const hearingDate = new Date(h.date);
    const today = new Date();
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return hearingDate >= today && hearingDate <= weekEnd;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Court Integration</h1>
            <p className="text-foreground-muted">
              Manage court hearings, orders, and case tracking
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              <Bell className="h-4 w-4 mr-2" />
              Set Reminders
            </Button>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{todayHearings.length}</p>
                  <p className="text-xs text-foreground-muted">Today&apos;s Hearings</p>
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
                  <p className="text-2xl font-bold text-foreground">{thisWeekHearings.length}</p>
                  <p className="text-xs text-foreground-muted">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <FileText className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{recentOrders.length}</p>
                  <p className="text-xs text-foreground-muted">Pending Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Gavel className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">143</p>
                  <p className="text-xs text-foreground-muted">Active Court Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Hearings */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Hearings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingHearings.map((hearing) => {
                  const type = hearingTypes[hearing.type as keyof typeof hearingTypes];
                  return (
                    <div
                      key={hearing.id}
                      className="p-4 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-foreground">
                              {hearing.caseNumber}
                            </span>
                            <Badge variant={type.color as any}>{type.label}</Badge>
                            {hearing.priority === "HIGH" && (
                              <Badge variant="error">High Priority</Badge>
                            )}
                          </div>
                          <p className="text-foreground">{hearing.title}</p>
                          <div className="flex items-center gap-4 text-sm text-foreground-muted">
                            <span className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {hearing.court}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {hearing.courtRoom}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-foreground-muted">
                            <Gavel className="h-4 w-4" />
                            {hearing.judge}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-foreground-muted">
                            <Users className="h-4 w-4" />
                            IO: {hearing.io}
                          </div>
                          {hearing.requiredDocuments && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {hearing.requiredDocuments.map((doc) => (
                                <span
                                  key={doc}
                                  className="px-2 py-0.5 text-xs rounded bg-info/10 text-info"
                                >
                                  {doc}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-accent">{hearing.date}</div>
                          <div className="text-foreground-muted">{hearing.time}</div>
                          <Button variant="ghost" size="sm" className="mt-2">
                            Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Court Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-lg bg-background-tertiary"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground text-sm">
                        {order.caseNumber}
                      </span>
                      <span className="text-xs text-foreground-muted">
                        {order.orderDate}
                      </span>
                    </div>
                    <Badge
                      variant={
                        order.orderType === "BAIL_REJECTED"
                          ? "error"
                          : order.orderType === "REMAND"
                          ? "warning"
                          : "info"
                      }
                      className="mb-2"
                    >
                      {order.orderType.replace("_", " ")}
                    </Badge>
                    <p className="text-sm text-foreground-muted">{order.summary}</p>
                  </div>
                ))}
                <Button variant="ghost" className="w-full">
                  View All Orders
                </Button>
              </CardContent>
            </Card>

            {/* Courts Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Courts Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {courts.map((court, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{court.name}</p>
                      <p className="text-xs text-foreground-muted">
                        {court.cases} cases | {court.pending} pending
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-foreground-muted" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                  <div>
                    <p className="font-medium text-warning">Pending Actions</p>
                    <ul className="text-sm text-foreground-muted mt-2 space-y-1">
                      <li>• 3 chargesheet submissions due this week</li>
                      <li>• 2 FSL reports awaited</li>
                      <li>• 1 witness statement pending</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
