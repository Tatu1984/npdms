"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const reportConfigs: Record<string, ReportConfig> = {
  daily_crime_summary: {
    id: "daily_crime_summary",
    name: "Daily Crime Summary",
    description: "Overview of crimes registered on a specific date",
    icon: <Calendar className="h-5 w-5" />,
  },
  fir_status: {
    id: "fir_status",
    name: "FIR Status Report",
    description: "Status breakdown of all FIRs in a period",
    icon: <FileText className="h-5 w-5" />,
  },
  pending_investigation: {
    id: "pending_investigation",
    name: "Pending Investigation Report",
    description: "Cases pending investigation with officer workload",
    icon: <Clock className="h-5 w-5" />,
  },
  crime_statistics: {
    id: "crime_statistics",
    name: "Crime Statistics Report",
    description: "Comprehensive crime statistics by category",
    icon: <PieChart className="h-5 w-5" />,
  },
  officer_workload: {
    id: "officer_workload",
    name: "Officer Workload Analysis",
    description: "Detailed workload analysis for officers",
    icon: <Users className="h-5 w-5" />,
  },
  monthly_trends: {
    id: "monthly_trends",
    name: "Monthly Trends",
    description: "Month-over-month crime trend analysis",
    icon: <TrendingUp className="h-5 w-5" />,
  },
};

export default function ReportTypePage() {
  const params = useParams();
  const router = useRouter();
  const reportType = params.type as string;
  const config = reportConfigs[reportType];

  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadFormat, setDownloadFormat] = useState("pdf");

  useEffect(() => {
    if (!config) {
      router.push("/reports");
      return;
    }
    fetchReportData();
  }, [reportType, fromDate, toDate]);

  const fetchReportData = async () => {
    setIsLoading(true);
    // Simulated data - in production, fetch from API
    setTimeout(() => {
      switch (reportType) {
        case "daily_crime_summary":
          setReportData({
            date: toDate,
            totalFIRs: 45,
            totalCases: 156,
            casesInvestigating: 89,
            casesClosed: 67,
            topCrimeTypes: [
              { crimeType: "Theft", count: 15 },
              { crimeType: "Assault", count: 8 },
              { crimeType: "Fraud", count: 6 },
              { crimeType: "Burglary", count: 5 },
              { crimeType: "Cyber Crime", count: 4 },
            ],
          });
          break;
        case "fir_status":
          setReportData({
            totalFIRs: 1245,
            byStatus: {
              REGISTERED: 245,
              UNDER_INVESTIGATION: 456,
              CHARGESHEET_FILED: 234,
              CLOSED_SOLVED: 187,
              CLOSED_UNSOLVED: 123,
            },
            avgInvestigationDays: 45,
            overdueCount: 89,
          });
          break;
        case "pending_investigation":
          setReportData({
            totalPending: 456,
            averageAge: 32.5,
            overduePercentage: 18.4,
            byOfficer: [
              { officerName: "SI Rajesh Kumar", caseCount: 28, oldestDays: 67 },
              { officerName: "SI Priya Sharma", caseCount: 24, oldestDays: 45 },
              { officerName: "ASI Amit Singh", caseCount: 21, oldestDays: 56 },
              { officerName: "HC Deepak Verma", caseCount: 19, oldestDays: 34 },
              { officerName: "SI Neha Patel", caseCount: 17, oldestDays: 41 },
            ],
          });
          break;
        case "crime_statistics":
          setReportData({
            totalCrimes: 2456,
            solveRate: 67.8,
            byCategory: [
              { category: "Property Crime", count: 845, percentage: 34.4, solveRate: 45.2 },
              { category: "Violent Crime", count: 456, percentage: 18.6, solveRate: 78.5 },
              { category: "Cyber Crime", count: 378, percentage: 15.4, solveRate: 32.1 },
              { category: "Financial Crime", count: 312, percentage: 12.7, solveRate: 56.8 },
              { category: "Drug Offenses", count: 234, percentage: 9.5, solveRate: 89.3 },
              { category: "Other", count: 231, percentage: 9.4, solveRate: 54.2 },
            ],
          });
          break;
        case "officer_workload":
          setReportData({
            totalOfficers: 145,
            avgCasesPerOfficer: 12.4,
            officers: [
              { officerName: "SI Rajesh Kumar", rank: "SI", activeCases: 28, closedCases: 45, totalFIRsRegistered: 67, avgCaseClosureTime: 34.5, oldestActiveCase: 67 },
              { officerName: "SI Priya Sharma", rank: "SI", activeCases: 24, closedCases: 52, totalFIRsRegistered: 72, avgCaseClosureTime: 28.3, oldestActiveCase: 45 },
              { officerName: "Inspector Amit Singh", rank: "Inspector", activeCases: 15, closedCases: 78, totalFIRsRegistered: 89, avgCaseClosureTime: 22.1, oldestActiveCase: 32 },
              { officerName: "SI Neha Patel", rank: "SI", activeCases: 21, closedCases: 38, totalFIRsRegistered: 54, avgCaseClosureTime: 31.7, oldestActiveCase: 41 },
              { officerName: "ASI Deepak Verma", rank: "ASI", activeCases: 19, closedCases: 34, totalFIRsRegistered: 48, avgCaseClosureTime: 36.2, oldestActiveCase: 56 },
            ],
          });
          break;
        case "monthly_trends":
          setReportData({
            months: [
              { month: "Sep 2024", total: 234, solved: 156, pending: 78 },
              { month: "Oct 2024", total: 267, solved: 178, pending: 89 },
              { month: "Nov 2024", total: 289, solved: 201, pending: 88 },
              { month: "Dec 2024", total: 312, solved: 215, pending: 97 },
              { month: "Jan 2025", total: 245, solved: 167, pending: 78 },
            ],
            trendDirection: "up",
            percentageChange: 12.4,
          });
          break;
        default:
          setReportData(null);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleDownload = (format: string) => {
    const params = new URLSearchParams({
      format,
      from_date: fromDate,
      to_date: toDate,
    });
    window.open(
      `/api/v1/reports/download/${reportType}?${params.toString()}`,
      "_blank"
    );
  };

  if (!config) {
    return null;
  }

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-foreground-muted">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p>No data available for this report</p>
        </div>
      );
    }

    switch (reportType) {
      case "daily_crime_summary":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{reportData.totalFIRs}</p>
                  <p className="text-sm text-foreground-muted">FIRs Registered</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{reportData.totalCases}</p>
                  <p className="text-sm text-foreground-muted">Total Cases</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-warning">{reportData.casesInvestigating}</p>
                  <p className="text-sm text-foreground-muted">Under Investigation</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-success">{reportData.casesClosed}</p>
                  <p className="text-sm text-foreground-muted">Cases Closed</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Top Crime Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.topCrimeTypes?.map((crime: any, index: number) => (
                    <div key={crime.crimeType} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground">{crime.crimeType}</span>
                          <span className="text-sm text-foreground-muted">{crime.count} cases</span>
                        </div>
                        <div className="w-full bg-background-tertiary rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full"
                            style={{ width: `${(crime.count / reportData.topCrimeTypes[0].count) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "fir_status":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{reportData.totalFIRs}</p>
                  <p className="text-sm text-foreground-muted">Total FIRs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-warning">{reportData.avgInvestigationDays}</p>
                  <p className="text-sm text-foreground-muted">Avg. Investigation Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-error">{reportData.overdueCount}</p>
                  <p className="text-sm text-foreground-muted">Overdue Cases</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-success">{reportData.byStatus?.CLOSED_SOLVED || 0}</p>
                  <p className="text-sm text-foreground-muted">Solved Cases</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>FIRs by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Count</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Percentage</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Distribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.byStatus || {}).map(([status, count]: [string, any]) => (
                        <tr key={status} className="border-b border-border">
                          <td className="py-3 px-4">
                            <Badge variant={status.includes("CLOSED") ? "success" : status === "REGISTERED" ? "info" : "warning"}>
                              {status.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">{count}</td>
                          <td className="py-3 px-4 text-foreground-muted">
                            {((count / reportData.totalFIRs) * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-full bg-background-tertiary rounded-full h-2">
                              <div
                                className="bg-accent h-2 rounded-full"
                                style={{ width: `${(count / reportData.totalFIRs) * 100}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "pending_investigation":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-warning">{reportData.totalPending}</p>
                  <p className="text-sm text-foreground-muted">Total Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{reportData.averageAge?.toFixed(1)}</p>
                  <p className="text-sm text-foreground-muted">Average Age (days)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-error">{reportData.overduePercentage?.toFixed(1)}%</p>
                  <p className="text-sm text-foreground-muted">Overdue Percentage</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Workload by Officer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Officer</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Pending Cases</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Oldest Case (days)</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.byOfficer?.map((officer: any) => (
                        <tr key={officer.officerName} className="border-b border-border hover:bg-background-tertiary">
                          <td className="py-3 px-4 font-medium text-foreground">{officer.officerName}</td>
                          <td className="py-3 px-4 text-foreground">{officer.caseCount}</td>
                          <td className="py-3 px-4 text-foreground">{officer.oldestDays}</td>
                          <td className="py-3 px-4">
                            {officer.oldestDays > 60 ? (
                              <Badge variant="error">Critical</Badge>
                            ) : officer.oldestDays > 30 ? (
                              <Badge variant="warning">Attention Needed</Badge>
                            ) : (
                              <Badge variant="success">On Track</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "crime_statistics":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{reportData.totalCrimes}</p>
                  <p className="text-sm text-foreground-muted">Total Crimes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-success">{reportData.solveRate?.toFixed(1)}%</p>
                  <p className="text-sm text-foreground-muted">Overall Solve Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-accent">{reportData.byCategory?.length || 0}</p>
                  <p className="text-sm text-foreground-muted">Crime Categories</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Crimes by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Category</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Count</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Percentage</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Solve Rate</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Distribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.byCategory?.map((cat: any) => (
                        <tr key={cat.category} className="border-b border-border hover:bg-background-tertiary">
                          <td className="py-3 px-4 font-medium text-foreground">{cat.category}</td>
                          <td className="py-3 px-4 text-foreground">{cat.count}</td>
                          <td className="py-3 px-4 text-foreground-muted">{cat.percentage?.toFixed(1)}%</td>
                          <td className="py-3 px-4">
                            <Badge variant={cat.solveRate > 70 ? "success" : cat.solveRate > 50 ? "warning" : "error"}>
                              {cat.solveRate?.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-full bg-background-tertiary rounded-full h-2">
                              <div
                                className="bg-accent h-2 rounded-full"
                                style={{ width: `${cat.percentage}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "officer_workload":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{reportData.totalOfficers}</p>
                  <p className="text-sm text-foreground-muted">Total Officers</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-accent">{reportData.avgCasesPerOfficer?.toFixed(1)}</p>
                  <p className="text-sm text-foreground-muted">Avg Cases/Officer</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-success">{reportData.officers?.length || 0}</p>
                  <p className="text-sm text-foreground-muted">Active Investigators</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Officer Workload Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Officer</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Rank</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Active</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Closed</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">FIRs Registered</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Avg Closure (days)</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Oldest Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.officers?.map((officer: any) => (
                        <tr key={officer.officerName} className="border-b border-border hover:bg-background-tertiary">
                          <td className="py-3 px-4 font-medium text-foreground">{officer.officerName}</td>
                          <td className="py-3 px-4">
                            <Badge variant="muted">{officer.rank}</Badge>
                          </td>
                          <td className="py-3 px-4 text-foreground">{officer.activeCases}</td>
                          <td className="py-3 px-4 text-success">{officer.closedCases}</td>
                          <td className="py-3 px-4 text-foreground">{officer.totalFIRsRegistered}</td>
                          <td className="py-3 px-4 text-foreground">{officer.avgCaseClosureTime?.toFixed(1)}</td>
                          <td className="py-3 px-4">
                            {officer.oldestActiveCase > 60 ? (
                              <span className="text-error">{officer.oldestActiveCase} days</span>
                            ) : (
                              <span className="text-foreground">{officer.oldestActiveCase} days</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "monthly_trends":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">
                    {reportData.months?.[reportData.months.length - 1]?.total || 0}
                  </p>
                  <p className="text-sm text-foreground-muted">This Month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {reportData.trendDirection === "up" ? (
                      <TrendingUp className="h-6 w-6 text-error" />
                    ) : (
                      <TrendingUp className="h-6 w-6 text-success transform rotate-180" />
                    )}
                    <p className="text-3xl font-bold text-foreground">
                      {reportData.percentageChange?.toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-sm text-foreground-muted">Change from Last Month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-success">
                    {reportData.months?.[reportData.months.length - 1]?.solved || 0}
                  </p>
                  <p className="text-sm text-foreground-muted">Cases Solved</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Month</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Total Cases</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Solved</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Pending</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Solve Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.months?.map((month: any) => (
                        <tr key={month.month} className="border-b border-border hover:bg-background-tertiary">
                          <td className="py-3 px-4 font-medium text-foreground">{month.month}</td>
                          <td className="py-3 px-4 text-foreground">{month.total}</td>
                          <td className="py-3 px-4 text-success">{month.solved}</td>
                          <td className="py-3 px-4 text-warning">{month.pending}</td>
                          <td className="py-3 px-4">
                            <Badge variant={((month.solved / month.total) * 100) > 70 ? "success" : "warning"}>
                              {((month.solved / month.total) * 100).toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-12 text-foreground-muted">
            Report content not available
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/reports">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                {config.icon}
                {config.name}
              </h1>
              <p className="text-foreground-muted">{config.description}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={fetchReportData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                className={`px-3 py-2 text-sm ${downloadFormat === "pdf" ? "bg-accent text-white" : "bg-background text-foreground hover:bg-background-tertiary"}`}
                onClick={() => setDownloadFormat("pdf")}
              >
                PDF
              </button>
              <button
                className={`px-3 py-2 text-sm ${downloadFormat === "excel" ? "bg-accent text-white" : "bg-background text-foreground hover:bg-background-tertiary"}`}
                onClick={() => setDownloadFormat("excel")}
              >
                Excel
              </button>
              <button
                className={`px-3 py-2 text-sm ${downloadFormat === "csv" ? "bg-accent text-white" : "bg-background text-foreground hover:bg-background-tertiary"}`}
                onClick={() => setDownloadFormat("csv")}
              >
                CSV
              </button>
            </div>
            <Button onClick={() => handleDownload(downloadFormat)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-foreground-muted" />
                <span className="text-sm font-medium text-foreground">Filters:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-muted">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-muted">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={fetchReportData}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {renderReportContent()}
      </div>
    </DashboardLayout>
  );
}
