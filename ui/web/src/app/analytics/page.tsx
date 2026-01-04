"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  MapPin,
  Clock,
  FileText,
  Users,
  AlertTriangle,
  Sparkles,
  PieChart,
  Activity,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

const timeRanges = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

// Mock stats data
const mockStats = {
  firsTotal: 245,
  firsChange: 12,
  casesResolved: 156,
  resolutionRate: 68,
  avgResolutionTime: 18,
  pendingCases: 89,
  criticalCases: 7,
  officersOnDuty: 24,
};

// Mock crime category data
const mockCrimeCategories = [
  { category: "Property Crimes", count: 98, change: 5, percentage: 40 },
  { category: "Crimes Against Person", count: 45, change: -3, percentage: 18 },
  { category: "Economic Offences", count: 38, change: 8, percentage: 15 },
  { category: "Cyber Crimes", count: 32, change: 12, percentage: 13 },
  { category: "Traffic Offences", count: 20, change: 0, percentage: 8 },
  { category: "Others", count: 12, change: -2, percentage: 6 },
];

// Mock hotspot data
const mockHotspots = [
  { area: "Koramangala 4th Block", incidents: 23, type: "Theft", risk: "HIGH" },
  { area: "HSR Layout", incidents: 18, type: "Chain Snatching", risk: "HIGH" },
  { area: "BTM Layout", incidents: 15, type: "Vehicle Theft", risk: "MEDIUM" },
  { area: "Indiranagar", incidents: 12, type: "Fraud", risk: "MEDIUM" },
  { area: "JP Nagar", incidents: 8, type: "Burglary", risk: "LOW" },
];

// Mock performance data
const mockPerformance = {
  topPerformers: [
    { name: "SI Suresh Patil", casesResolved: 12, rating: 4.8 },
    { name: "ASI Prakash Rao", casesResolved: 9, rating: 4.5 },
    { name: "Const. Ramesh Kumar", casesResolved: 7, rating: 4.3 },
  ],
  teamMetrics: {
    avgResponseTime: "8 mins",
    patrolCoverage: "92%",
    citizenSatisfaction: "4.2/5",
  },
};

// Mock AI predictions
const mockPredictions = [
  {
    id: "pred-001",
    type: "HIGH_RISK",
    area: "Forum Mall Area",
    time: "Evening (6-9 PM)",
    risk: 78,
    crimeType: "Theft",
    basis: "Historical pattern, weekend, pay day",
    recommendation: "Increase patrol frequency",
  },
  {
    id: "pred-002",
    type: "EMERGING",
    area: "HSR Layout",
    time: "Night (9 PM - 12 AM)",
    risk: 65,
    crimeType: "Chain Snatching",
    basis: "Recent incident cluster",
    recommendation: "Deploy mobile unit",
  },
  {
    id: "pred-003",
    type: "PATTERN",
    area: "Tech Parks",
    time: "Weekdays (5-7 PM)",
    risk: 55,
    crimeType: "Vehicle Theft",
    basis: "Parking lot vulnerability",
    recommendation: "Coordinate with security",
  },
];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("month");

  const isDistrictLevel = user && hasMinimumRole(user.role, "SP");
  const isStateLevel = user && hasMinimumRole(user.role, "DIG");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics & Intelligence</h1>
            <p className="text-foreground-muted">
              Crime statistics, performance metrics, and predictive insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              options={timeRanges}
              value={timeRange}
              onChange={setTimeRange}
              className="w-40"
            />
            <Button variant="secondary">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Total FIRs</p>
                  <p className="text-3xl font-bold text-foreground">{mockStats.firsTotal}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">+{mockStats.firsChange}%</span>
                    <span className="text-xs text-foreground-muted">vs last month</span>
                  </div>
                </div>
                <FileText className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Resolution Rate</p>
                  <p className="text-3xl font-bold text-success">{mockStats.resolutionRate}%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">+5%</span>
                    <span className="text-xs text-foreground-muted">improvement</span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Avg Resolution Time</p>
                  <p className="text-3xl font-bold text-info">{mockStats.avgResolutionTime}d</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingDown className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">-2 days</span>
                    <span className="text-xs text-foreground-muted">faster</span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-info opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Critical Cases</p>
                  <p className="text-3xl font-bold text-error">{mockStats.criticalCases}</p>
                  <p className="text-xs text-foreground-muted mt-1">Require immediate attention</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-error opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="crime">
              <PieChart className="h-4 w-4 mr-2" />
              Crime Analysis
            </TabsTrigger>
            <TabsTrigger value="hotspots">
              <MapPin className="h-4 w-4 mr-2" />
              Hotspots
            </TabsTrigger>
            <TabsTrigger value="predictions">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Predictions
            </TabsTrigger>
            {isDistrictLevel && (
              <TabsTrigger value="performance">
                <Users className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* FIR Trend Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>FIR Registration Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-foreground-muted mx-auto mb-2" />
                      <p className="text-foreground-muted">FIR Trend Chart</p>
                      <p className="text-sm text-foreground-muted">Last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Rate Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Case Resolution Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Activity className="h-12 w-12 text-foreground-muted mx-auto mb-2" />
                      <p className="text-foreground-muted">Resolution Rate Chart</p>
                      <p className="text-sm text-foreground-muted">Monthly comparison</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Table */}
            <Card>
              <CardHeader>
                <CardTitle>Station Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-background-tertiary text-center">
                    <p className="text-2xl font-bold text-foreground">{mockStats.casesResolved}</p>
                    <p className="text-sm text-foreground-muted">Cases Resolved</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background-tertiary text-center">
                    <p className="text-2xl font-bold text-foreground">{mockStats.pendingCases}</p>
                    <p className="text-sm text-foreground-muted">Pending Cases</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background-tertiary text-center">
                    <p className="text-2xl font-bold text-foreground">{mockStats.officersOnDuty}</p>
                    <p className="text-sm text-foreground-muted">Officers On Duty</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background-tertiary text-center">
                    <p className="text-2xl font-bold text-foreground">8 min</p>
                    <p className="text-sm text-foreground-muted">Avg Response Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crime Analysis Tab */}
          <TabsContent value="crime" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Crime Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Crime Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCrimeCategories.map((cat, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">{cat.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{cat.count}</span>
                            {cat.change !== 0 && (
                              <span
                                className={`text-xs ${
                                  cat.change > 0 ? "text-error" : "text-success"
                                }`}
                              >
                                {cat.change > 0 ? "+" : ""}
                                {cat.change}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Crime Distribution Pie Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Crime Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 text-foreground-muted mx-auto mb-2" />
                      <p className="text-foreground-muted">Crime Distribution Chart</p>
                      <p className="text-sm text-foreground-muted">By category</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Crime Time Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Crime by Time of Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-background-tertiary rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-foreground-muted mx-auto mb-2" />
                    <p className="text-foreground-muted">Hourly Crime Distribution</p>
                    <p className="text-sm text-foreground-muted">Peak hours: 6-9 PM, 12-2 AM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hotspots Tab */}
          <TabsContent value="hotspots" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Map Placeholder */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Crime Hotspot Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 bg-background-tertiary rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-foreground-muted mx-auto mb-2" />
                      <p className="text-foreground-muted">Interactive Hotspot Map</p>
                      <p className="text-sm text-foreground-muted">
                        Showing {mockHotspots.length} identified hotspots
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hotspot List */}
            <Card>
              <CardHeader>
                <CardTitle>Identified Hotspots</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Area</TableHead>
                      <TableHead>Incidents (30d)</TableHead>
                      <TableHead>Primary Crime Type</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockHotspots.map((hotspot, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <span className="font-medium text-foreground">{hotspot.area}</span>
                        </TableCell>
                        <TableCell>{hotspot.incidents}</TableCell>
                        <TableCell>{hotspot.type}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              hotspot.risk === "HIGH"
                                ? "error"
                                : hotspot.risk === "MEDIUM"
                                ? "warning"
                                : "success"
                            }
                          >
                            {hotspot.risk}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <MapPin className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">AI-Powered Crime Prediction</p>
                    <p className="text-sm text-foreground-muted">
                      Based on historical patterns, environmental factors, and real-time data.
                      Advisory only - human judgment required.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {mockPredictions.map((prediction) => (
                <Card key={prediction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant={
                              prediction.type === "HIGH_RISK"
                                ? "error"
                                : prediction.type === "EMERGING"
                                ? "warning"
                                : "info"
                            }
                          >
                            {prediction.type.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-sm text-foreground-muted">
                            Risk Score: {prediction.risk}%
                          </span>
                        </div>
                        <h3 className="font-medium text-foreground">
                          {prediction.crimeType} - {prediction.area}
                        </h3>
                        <p className="text-sm text-foreground-muted mt-1">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Peak time: {prediction.time}
                        </p>
                        <p className="text-sm text-foreground-muted mt-1">
                          Basis: {prediction.basis}
                        </p>
                        <div className="mt-3 p-2 rounded-md bg-info/10">
                          <p className="text-sm text-info">
                            <strong>Recommendation:</strong> {prediction.recommendation}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="h-16 w-16 rounded-full bg-background-tertiary flex items-center justify-center">
                          <span
                            className={`text-xl font-bold ${
                              prediction.risk >= 70
                                ? "text-error"
                                : prediction.risk >= 50
                                ? "text-warning"
                                : "text-info"
                            }`}
                          >
                            {prediction.risk}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="secondary" size="sm">
                        Deploy Patrol
                      </Button>
                      <Button variant="ghost" size="sm">
                        View Analysis
                      </Button>
                      <Button variant="ghost" size="sm">
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          {isDistrictLevel && (
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-accent">
                      {mockPerformance.teamMetrics.avgResponseTime}
                    </p>
                    <p className="text-sm text-foreground-muted">Avg Response Time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-success">
                      {mockPerformance.teamMetrics.patrolCoverage}
                    </p>
                    <p className="text-sm text-foreground-muted">Patrol Coverage</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-info">
                      {mockPerformance.teamMetrics.citizenSatisfaction}
                    </p>
                    <p className="text-sm text-foreground-muted">Citizen Satisfaction</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performers This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Officer</TableHead>
                        <TableHead>Cases Resolved</TableHead>
                        <TableHead>Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPerformance.topPerformers.map((officer, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge variant={index === 0 ? "warning" : "secondary"}>
                              #{index + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{officer.name}</TableCell>
                          <TableCell>{officer.casesResolved}</TableCell>
                          <TableCell>
                            <span className="text-warning">
                              {"★".repeat(Math.floor(officer.rating))}
                            </span>
                            <span className="text-foreground-muted ml-1">{officer.rating}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
