"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Briefcase,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";

// Mock data for demonstration
const stats = {
  firsToday: 12,
  firsThisMonth: 245,
  pendingCases: 89,
  closedCases: 156,
  officersOnDuty: 24,
  totalOfficers: 32,
  vehiclesActive: 8,
  totalVehicles: 12,
};

const recentFIRs = [
  {
    id: "1",
    firNumber: "KOR/2024/00123",
    complainant: "Rajesh Sharma",
    offence: "Theft",
    status: "UNDER_INVESTIGATION",
    priority: "HIGH",
    time: "2 hours ago",
  },
  {
    id: "2",
    firNumber: "KOR/2024/00122",
    complainant: "Priya Menon",
    offence: "Assault",
    status: "REGISTERED",
    priority: "CRITICAL",
    time: "4 hours ago",
  },
  {
    id: "3",
    firNumber: "KOR/2024/00121",
    complainant: "Mohammed Khan",
    offence: "Fraud",
    status: "UNDER_INVESTIGATION",
    priority: "NORMAL",
    time: "6 hours ago",
  },
];

const alerts = [
  {
    id: "1",
    type: "FLASH",
    title: "Armed suspects spotted near MG Road",
    time: "15 min ago",
  },
  {
    id: "2",
    type: "URGENT",
    title: "VIP movement - Route diversion required",
    time: "1 hour ago",
  },
  {
    id: "3",
    type: "NOTICE",
    title: "Weekly review meeting at 10:00 AM",
    time: "3 hours ago",
  },
];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-foreground-muted">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-foreground-muted mt-1">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-2">
                {trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-error" />
                )}
                <span
                  className={`text-sm ${
                    trend === "up" ? "text-success" : "text-error"
                  }`}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-accent/10">
            <Icon className="h-6 w-6 text-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "REGISTERED":
      return "registered";
    case "UNDER_INVESTIGATION":
      return "investigating";
    case "CHARGESHEET_FILED":
      return "chargesheet";
    case "CLOSED":
      return "closed";
    default:
      return "secondary";
  }
}

function getPriorityBadgeVariant(priority: string) {
  switch (priority) {
    case "LOW":
      return "low";
    case "NORMAL":
      return "normal";
    case "HIGH":
      return "high";
    case "CRITICAL":
      return "critical";
    default:
      return "secondary";
  }
}

function getAlertStyle(type: string) {
  switch (type) {
    case "FLASH":
      return "border-l-4 border-l-error bg-error/5";
    case "URGENT":
      return "border-l-4 border-l-warning bg-warning/5";
    case "NOTICE":
      return "border-l-4 border-l-info bg-info/5";
    default:
      return "";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const isSHOOrAbove = user && hasMinimumRole(user.role, "SHO");
  const isSPOrAbove = user && hasMinimumRole(user.role, "SP");

  const handleGenerateReport = () => {
    addToast({
      type: "info",
      title: "Report Generation",
      message: "Report generation feature coming soon",
    });
  };

  const handleAssignOfficers = () => {
    router.push("/personnel");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-foreground-muted">
            Welcome back, {user?.name}. Here&apos;s your station overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="FIRs Today"
            value={stats.firsToday}
            subtitle={`${stats.firsThisMonth} this month`}
            icon={FileText}
            trend="up"
            trendValue="+8% from yesterday"
          />
          <StatCard
            title="Pending Cases"
            value={stats.pendingCases}
            icon={Briefcase}
            trend="down"
            trendValue="-3 from last week"
          />
          <StatCard
            title="Closed Cases"
            value={stats.closedCases}
            icon={CheckCircle}
            trend="up"
            trendValue="+12 this month"
          />
          {isSHOOrAbove && (
            <StatCard
              title="Officers on Duty"
              value={`${stats.officersOnDuty}/${stats.totalOfficers}`}
              icon={Users}
            />
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent FIRs */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent FIRs
              </CardTitle>
              <Link href="/fir">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFIRs.map((fir) => (
                  <Link href={`/fir/${fir.id}`} key={fir.id}>
                    <div
                      className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary hover:bg-background-tertiary/80 transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-accent">
                            {fir.firNumber}
                          </span>
                          <Badge variant={getPriorityBadgeVariant(fir.priority) as any}>
                            {fir.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground mt-1">
                          {fir.complainant} - {fir.offence}
                        </p>
                        <p className="text-xs text-foreground-muted mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {fir.time}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(fir.status) as any}>
                        {fir.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Alerts
              </CardTitle>
              <Link href="/alerts">
                <Badge variant="error" className="cursor-pointer">{alerts.length}</Badge>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Link href="/alerts" key={alert.id}>
                    <div
                      className={`p-3 rounded-lg ${getAlertStyle(alert.type)} cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <div className="flex items-start justify-between">
                        <Badge
                          variant={
                            alert.type === "FLASH"
                              ? "error"
                              : alert.type === "URGENT"
                              ? "warning"
                              : "info"
                          }
                          className="text-[10px]"
                        >
                          {alert.type}
                        </Badge>
                        <span className="text-xs text-foreground-muted">
                          {alert.time}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-2">{alert.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions for SHO+ */}
        {isSHOOrAbove && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Link href="/fir/new">
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Register New FIR
                  </Button>
                </Link>
                <Button variant="secondary" onClick={handleAssignOfficers}>
                  <Users className="h-4 w-4 mr-2" />
                  Assign Officers
                </Button>
                <Link href="/alerts">
                  <Button variant="secondary">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Issue Alert
                  </Button>
                </Link>
                {isSPOrAbove && (
                  <Button variant="secondary" onClick={handleGenerateReport}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
