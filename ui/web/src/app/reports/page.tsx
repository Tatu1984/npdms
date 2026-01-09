"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Clock,
  Calendar,
  FileSpreadsheet,
  FileJson,
  FilePdf,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ReportType {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
}

interface DailySummary {
  totalFIRs: number;
  totalCases: number;
  casesInvestigating: number;
  casesClosed: number;
  arrestsMade: number;
  topCrimeTypes: { crimeType: string; count: number }[];
}

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadFormat, setDownloadFormat] = useState<string>("pdf");

  const reportTypes: ReportType[] = [
    {
      id: "daily_crime_summary",
      name: "Daily Crime Summary",
      description: "Overview of crimes registered on a specific date",
      category: "daily",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      id: "fir_status",
      name: "FIR Status Report",
      description: "Status breakdown of all FIRs in a period",
      category: "fir",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: "pending_investigation",
      name: "Pending Investigation",
      description: "Cases pending investigation with officer workload",
      category: "investigation",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: "crime_statistics",
      name: "Crime Statistics",
      description: "Comprehensive crime statistics by category",
      category: "statistics",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      id: "officer_workload",
      name: "Officer Workload Analysis",
      description: "Detailed workload analysis for officers",
      category: "personnel",
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: "monthly_trends",
      name: "Monthly Trends",
      description: "Month-over-month crime trend analysis",
      category: "trends",
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  useEffect(() => {
    // Simulated data - in production, fetch from API
    setDailySummary({
      totalFIRs: 45,
      totalCases: 156,
      casesInvestigating: 89,
      casesClosed: 67,
      arrestsMade: 12,
      topCrimeTypes: [
        { crimeType: "Theft", count: 15 },
        { crimeType: "Assault", count: 8 },
        { crimeType: "Fraud", count: 6 },
        { crimeType: "Burglary", count: 5 },
        { crimeType: "Cyber Crime", count: 4 },
      ],
    });
    setIsLoading(false);
  }, [selectedDate]);

  const handleDownloadReport = async (reportType: string, format: string) => {
    try {
      const params = new URLSearchParams({
        format,
        from_date: fromDate,
        to_date: toDate,
      });

      // In production, this would download the file
      window.open(
        `/api/v1/reports/download/${reportType}?${params.toString()}`,
        "_blank"
      );
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "daily": return "bg-blue-500/10 text-blue-500";
      case "fir": return "bg-purple-500/10 text-purple-500";
      case "investigation": return "bg-orange-500/10 text-orange-500";
      case "statistics": return "bg-green-500/10 text-green-500";
      case "personnel": return "bg-pink-500/10 text-pink-500";
      case "trends": return "bg-cyan-500/10 text-cyan-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Reports & Analytics
            </h1>
            <p className="text-foreground-muted">
              Generate, view, and export various reports and statistics
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-foreground-muted" />
                <span className="text-sm font-medium text-foreground">Date Range:</span>
              </div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
              <span className="text-foreground-muted">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm font-medium text-foreground">Format:</span>
                <select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {dailySummary?.totalFIRs || 0}
                  </p>
                  <p className="text-xs text-foreground-muted">FIRs Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {dailySummary?.totalCases || 0}
                  </p>
                  <p className="text-xs text-foreground-muted">Active Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {dailySummary?.casesInvestigating || 0}
                  </p>
                  <p className="text-xs text-foreground-muted">Under Investigation</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <FileText className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {dailySummary?.casesClosed || 0}
                  </p>
                  <p className="text-xs text-foreground-muted">Cases Closed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <Users className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {dailySummary?.arrestsMade || 0}
                  </p>
                  <p className="text-xs text-foreground-muted">Arrests Made</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Available Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-lg border border-border hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(report.category)}`}>
                      {report.icon}
                    </div>
                    <Badge variant="muted" className="text-xs">
                      {report.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {report.name}
                  </h3>
                  <p className="text-sm text-foreground-muted mb-4">
                    {report.description}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/reports/${report.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDownloadReport(report.id, downloadFormat)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Crime Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Top Crime Types Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailySummary?.topCrimeTypes.map((crime, index) => (
                  <div key={crime.crimeType} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">
                          {crime.crimeType}
                        </span>
                        <span className="text-sm text-foreground-muted">
                          {crime.count} cases
                        </span>
                      </div>
                      <div className="w-full bg-background-tertiary rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full"
                          style={{
                            width: `${
                              (crime.count /
                                (dailySummary?.topCrimeTypes[0]?.count || 1)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Formats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Formats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    downloadFormat === "pdf"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                  onClick={() => setDownloadFormat("pdf")}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FilePdf className="h-6 w-6 text-red-500" />
                    <span className="font-semibold text-foreground">PDF</span>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Best for printing and sharing official documents
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    downloadFormat === "excel"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                  onClick={() => setDownloadFormat("excel")}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FileSpreadsheet className="h-6 w-6 text-green-500" />
                    <span className="font-semibold text-foreground">Excel</span>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Best for data analysis and spreadsheet operations
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    downloadFormat === "csv"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                  onClick={() => setDownloadFormat("csv")}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-6 w-6 text-blue-500" />
                    <span className="font-semibold text-foreground">CSV</span>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Universal format for data import/export
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    downloadFormat === "json"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                  onClick={() => setDownloadFormat("json")}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FileJson className="h-6 w-6 text-yellow-500" />
                    <span className="font-semibold text-foreground">JSON</span>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Best for API integrations and programmatic access
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recently Generated Reports
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">
                      Report Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">
                      Period
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">
                      Format
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">
                      Generated At
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-background-tertiary">
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">
                        Daily Crime Summary
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="info">daily_crime_summary</Badge>
                    </td>
                    <td className="py-3 px-4 text-foreground-muted">
                      2024-01-08
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="muted">PDF</Badge>
                    </td>
                    <td className="py-3 px-4 text-foreground-muted">
                      Today, 09:30 AM
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-background-tertiary">
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">
                        FIR Status Report
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="info">fir_status</Badge>
                    </td>
                    <td className="py-3 px-4 text-foreground-muted">
                      Dec 2024
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="muted">Excel</Badge>
                    </td>
                    <td className="py-3 px-4 text-foreground-muted">
                      Yesterday, 04:15 PM
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-background-tertiary">
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">
                        Officer Workload Analysis
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="info">officer_workload</Badge>
                    </td>
                    <td className="py-3 px-4 text-foreground-muted">
                      Q4 2024
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="muted">PDF</Badge>
                    </td>
                    <td className="py-3 px-4 text-foreground-muted">
                      Jan 5, 2025
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
