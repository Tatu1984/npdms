"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Car,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle,
  MapPin,
  Users,
  FileText,
  Plus,
  Search,
  BarChart3,
  Map,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

interface ChallanStats {
  totalChallans: number;
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  byStatus: Record<string, number>;
  topViolations: { violationType: string; count: number; amount: number }[];
  dailyTrend: { date: string; count: number; amount: number; collected: number }[];
}

interface Hotspot {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  totalChallans: number;
  challansLast30Days: number;
  mostCommonViolation: string;
}

export default function TrafficDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ChallanStats | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [recentChallans, setRecentChallans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canCreate = user && hasMinimumRole(user.role, "CONSTABLE");

  useEffect(() => {
    // Simulated data - in production, fetch from API
    const loadData = () => {
      setStats({
      totalChallans: 15847,
      totalAmount: 47541000,
      collectedAmount: 35890000,
      pendingAmount: 11651000,
      byStatus: {
        PAID: 12500,
        PENDING: 2800,
        DEFAULTED: 450,
        DISPUTED: 97,
      },
      topViolations: [
        { violationType: "Over Speeding", count: 4521, amount: 13563000 },
        { violationType: "Signal Violation", count: 3245, amount: 6490000 },
        { violationType: "No Helmet", count: 2890, amount: 5780000 },
        { violationType: "Drunk Driving", count: 1450, amount: 7250000 },
        { violationType: "No Seat Belt", count: 1876, amount: 3752000 },
      ],
      dailyTrend: [
        { date: "2024-01-01", count: 245, amount: 735000, collected: 650000 },
        { date: "2024-01-02", count: 312, amount: 936000, collected: 820000 },
        { date: "2024-01-03", count: 287, amount: 861000, collected: 750000 },
        { date: "2024-01-04", count: 198, amount: 594000, collected: 520000 },
        { date: "2024-01-05", count: 356, amount: 1068000, collected: 950000 },
      ],
    });

    setHotspots([
      { id: "1", locationName: "MG Road Junction", latitude: 12.9716, longitude: 77.5946, totalChallans: 2345, challansLast30Days: 187, mostCommonViolation: "Signal Violation" },
      { id: "2", locationName: "Silk Board Junction", latitude: 12.9172, longitude: 77.6227, totalChallans: 1987, challansLast30Days: 156, mostCommonViolation: "Over Speeding" },
      { id: "3", locationName: "Electronic City Flyover", latitude: 12.8456, longitude: 77.6603, totalChallans: 1654, challansLast30Days: 142, mostCommonViolation: "Lane Violation" },
    ]);

    setRecentChallans([
      { id: "1", challanNumber: "TRF-2024-00156", vehicleNumber: "KA-01-AB-1234", violationType: "Over Speeding", amount: 2000, status: "PENDING", date: "2024-01-08" },
      { id: "2", challanNumber: "TRF-2024-00155", vehicleNumber: "KA-05-CD-5678", violationType: "Signal Violation", amount: 1000, status: "PAID", date: "2024-01-08" },
      { id: "3", challanNumber: "TRF-2024-00154", vehicleNumber: "KA-03-EF-9012", violationType: "No Helmet", amount: 500, status: "PENDING", date: "2024-01-08" },
      { id: "4", challanNumber: "TRF-2024-00153", vehicleNumber: "KA-02-GH-3456", violationType: "Drunk Driving", amount: 10000, status: "DISPUTED", date: "2024-01-07" },
      ]);

      setIsLoading(false);
    };
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(2)} L`;
    }
    return amount.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "success";
      case "PENDING": return "warning";
      case "DISPUTED": return "info";
      case "DEFAULTED": return "error";
      default: return "muted";
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
            <h1 className="text-2xl font-bold text-foreground">Traffic Management</h1>
            <p className="text-foreground-muted">
              Issue challans, track payments, and monitor traffic violations
            </p>
          </div>
          <div className="flex gap-3">
            {canCreate && (
              <Link href="/traffic/challans/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Issue Challan
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.totalChallans.toLocaleString()}
                  </p>
                  <p className="text-xs text-foreground-muted">Total Challans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <IndianRupee className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(stats?.collectedAmount || 0)}
                  </p>
                  <p className="text-xs text-foreground-muted">Amount Collected</p>
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
                    {formatCurrency(stats?.pendingAmount || 0)}
                  </p>
                  <p className="text-xs text-foreground-muted">Pending Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <AlertTriangle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.byStatus?.DEFAULTED || 0}
                  </p>
                  <p className="text-xs text-foreground-muted">Defaulters</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-4 gap-4">
          <Link href="/traffic/challans">
            <Card className="cursor-pointer hover:border-accent/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <Search className="h-5 w-5 text-foreground-muted" />
                <span className="font-medium text-foreground">Search Challans</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/traffic/defaulters">
            <Card className="cursor-pointer hover:border-accent/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-foreground-muted" />
                <span className="font-medium text-foreground">Defaulter List</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/traffic/hotspots">
            <Card className="cursor-pointer hover:border-accent/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <Map className="h-5 w-5 text-foreground-muted" />
                <span className="font-medium text-foreground">Violation Hotspots</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/traffic/payments">
            <Card className="cursor-pointer hover:border-accent/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <IndianRupee className="h-5 w-5 text-foreground-muted" />
                <span className="font-medium text-foreground">Payment Tracking</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Violations */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Violations (This Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topViolations.map((violation, index) => (
                  <div key={violation.violationType} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{violation.violationType}</span>
                        <span className="text-sm text-foreground-muted">{violation.count} cases</span>
                      </div>
                      <div className="w-full bg-background-tertiary rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full"
                          style={{ width: `${(violation.count / (stats?.topViolations[0]?.count || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {formatCurrency(violation.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hotspots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Violation Hotspots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hotspots.map((hotspot) => (
                  <div key={hotspot.id} className="p-3 rounded-lg bg-background-tertiary">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{hotspot.locationName}</span>
                      <Badge variant="error">{hotspot.challansLast30Days}</Badge>
                    </div>
                    <p className="text-xs text-foreground-muted">
                      Most common: {hotspot.mostCommonViolation}
                    </p>
                  </div>
                ))}
                <Link href="/traffic/hotspots">
                  <Button variant="secondary" className="w-full">
                    View All Hotspots
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Challans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Recent Challans
              </span>
              <Link href="/traffic/challans">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Challan #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Vehicle</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Violation</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentChallans.map((challan) => (
                    <tr key={challan.id} className="border-b border-border hover:bg-background-tertiary">
                      <td className="py-3 px-4">
                        <span className="font-medium text-foreground">{challan.challanNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-foreground">{challan.vehicleNumber}</td>
                      <td className="py-3 px-4 text-foreground">{challan.violationType}</td>
                      <td className="py-3 px-4">
                        <span className="text-foreground flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {challan.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(challan.status) as any}>
                          {challan.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-foreground-muted">{challan.date}</td>
                      <td className="py-3 px-4">
                        <Link href={`/traffic/challans/${challan.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
