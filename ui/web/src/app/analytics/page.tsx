"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  MapPin,
  Clock,
  FileText,
  Users,
  AlertTriangle,
  Sparkles,
  PieChart,
  Activity,
} from "lucide-react";
import { toast } from "@/stores/toastStore";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LegacySelect as Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import type { MapMarker } from "@/components/ui/Map";

// Dynamic import for map to avoid SSR issues
const InteractiveMap = dynamic(
  () => import("@/components/ui/Map").then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
        <div className="text-foreground-muted">Loading map...</div>
      </div>
    )
  }
);

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

// Mock chart data for FIR trend (last 30 days)
const mockFirTrendData = [
  { date: "Day 1", firs: 6, resolved: 4 },
  { date: "Day 3", firs: 8, resolved: 5 },
  { date: "Day 5", firs: 9, resolved: 6 },
  { date: "Day 7", firs: 7, resolved: 5 },
  { date: "Day 9", firs: 10, resolved: 7 },
  { date: "Day 11", firs: 12, resolved: 8 },
  { date: "Day 13", firs: 8, resolved: 6 },
  { date: "Day 15", firs: 11, resolved: 9 },
  { date: "Day 17", firs: 9, resolved: 7 },
  { date: "Day 19", firs: 13, resolved: 10 },
  { date: "Day 21", firs: 10, resolved: 8 },
  { date: "Day 23", firs: 8, resolved: 6 },
  { date: "Day 25", firs: 14, resolved: 11 },
  { date: "Day 27", firs: 11, resolved: 9 },
  { date: "Day 30", firs: 9, resolved: 7 },
];

// Mock resolution rate data (last 6 months)
const mockResolutionData = [
  { month: "Jul", rate: 62 },
  { month: "Aug", rate: 65 },
  { month: "Sep", rate: 63 },
  { month: "Oct", rate: 67 },
  { month: "Nov", rate: 66 },
  { month: "Dec", rate: 68 },
];

// Mock crime distribution data for pie chart
const mockCrimeDistribution = [
  { name: "Property Crimes", value: 98, color: "#3b82f6" },
  { name: "Crimes Against Person", value: 45, color: "#ef4444" },
  { name: "Economic Offences", value: 38, color: "#f59e0b" },
  { name: "Cyber Crimes", value: 32, color: "#8b5cf6" },
  { name: "Traffic Offences", value: 20, color: "#22c55e" },
  { name: "Others", value: 12, color: "#6b7280" },
];

// Mock hourly crime distribution data
const mockHourlyData = [
  { hour: "12 AM", incidents: 8 },
  { hour: "2 AM", incidents: 12 },
  { hour: "4 AM", incidents: 5 },
  { hour: "6 AM", incidents: 4 },
  { hour: "8 AM", incidents: 7 },
  { hour: "10 AM", incidents: 9 },
  { hour: "12 PM", incidents: 11 },
  { hour: "2 PM", incidents: 10 },
  { hour: "4 PM", incidents: 13 },
  { hour: "6 PM", incidents: 18 },
  { hour: "8 PM", incidents: 22 },
  { hour: "10 PM", incidents: 15 },
];

// Mock hotspot map markers (Bangalore coordinates)
const mockHotspotMarkers: MapMarker[] = [
  {
    id: "hotspot-1",
    lat: 12.9352,
    lng: 77.6245,
    title: "Koramangala 4th Block",
    description: "23 incidents - Theft",
    type: "alert",
    status: "HIGH RISK",
  },
  {
    id: "hotspot-2",
    lat: 12.9116,
    lng: 77.6473,
    title: "HSR Layout",
    description: "18 incidents - Chain Snatching",
    type: "alert",
    status: "HIGH RISK",
  },
  {
    id: "hotspot-3",
    lat: 12.9166,
    lng: 77.6101,
    title: "BTM Layout",
    description: "15 incidents - Vehicle Theft",
    type: "incident",
    status: "MEDIUM RISK",
  },
  {
    id: "hotspot-4",
    lat: 12.9716,
    lng: 77.6412,
    title: "Indiranagar",
    description: "12 incidents - Fraud",
    type: "incident",
    status: "MEDIUM RISK",
  },
  {
    id: "hotspot-5",
    lat: 12.9082,
    lng: 77.5833,
    title: "JP Nagar",
    description: "8 incidents - Burglary",
    type: "default",
    status: "LOW RISK",
  },
];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("month");

  const isDistrictLevel = user && hasMinimumRole(user.role, "SP");
  const _isStateLevel = user && hasMinimumRole(user.role, "DIG");

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
            <Button variant="secondary" onClick={() => toast.info("Action","Exporting analytics report...")}>
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
              {/* FIR Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>FIR Registration Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockFirTrendData}>
                        <defs>
                          <linearGradient id="colorFirs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" style={{ fontSize: "12px" }} />
                        <YAxis style={{ fontSize: "12px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            border: "none",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="firs"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorFirs)"
                          name="FIRs Registered"
                        />
                        <Area
                          type="monotone"
                          dataKey="resolved"
                          stroke="#22c55e"
                          fillOpacity={1}
                          fill="url(#colorResolved)"
                          name="Cases Resolved"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Rate Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Case Resolution Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockResolutionData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="month" style={{ fontSize: "12px" }} />
                        <YAxis domain={[0, 100]} style={{ fontSize: "12px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            border: "none",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                          formatter={(value) => `${value}%`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="rate"
                          stroke="#22c55e"
                          strokeWidth={3}
                          dot={{ fill: "#22c55e", r: 5 }}
                          activeDot={{ r: 7 }}
                          name="Resolution Rate (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
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

              {/* Crime Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Crime Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={mockCrimeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {mockCrimeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            border: "none",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
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
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockHourlyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="hour" style={{ fontSize: "12px" }} />
                      <YAxis style={{ fontSize: "12px" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="incidents" fill="#f59e0b" name="Incidents" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hotspots Tab */}
          <TabsContent value="hotspots" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Interactive Hotspot Map */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Crime Hotspot Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <InteractiveMap
                    markers={mockHotspotMarkers}
                    center={[12.9352, 77.6245]}
                    zoom={12}
                    height="400px"
                    onMarkerClick={(marker) => {
                      toast.info("Action",`Viewing details for ${marker.title}\n${marker.description}`);
                    }}
                  />
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
                          <Button variant="ghost" size="sm" onClick={() => toast.info("Action",`Viewing hotspot details for ${hotspot.area}`)}>
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
                      <Button variant="secondary" size="sm" onClick={() => toast.info("Action",`Deploying patrol to ${prediction.area}`)}>
                        Deploy Patrol
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toast.info("Action",`Viewing detailed analysis for ${prediction.id}`)}>
                        View Analysis
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toast.info("Action",`Dismissed prediction ${prediction.id}`)}>
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
