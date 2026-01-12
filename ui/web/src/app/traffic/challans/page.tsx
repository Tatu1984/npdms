"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Car,
  Search,
  Plus,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  IndianRupee,
  Eye,
  Printer,
  Download,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";

interface Challan {
  id: string;
  challanNumber: string;
  vehicleNumber: string;
  vehicleType: string;
  violationType: {
    code: string;
    name: string;
    category: string;
    severity: string;
  };
  violationLocation: string;
  violationDate: string;
  ownerName: string | null;
  driverName: string | null;
  originalFineAmount: number;
  finalAmount: number;
  status: string;
  paymentDate: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  ISSUED: { label: "Issued", color: "info", icon: Clock },
  PENDING: { label: "Pending", color: "warning", icon: Clock },
  PAID: { label: "Paid", color: "success", icon: CheckCircle },
  DISPUTED: { label: "Disputed", color: "accent", icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", color: "muted", icon: XCircle },
  COURT_REFERRED: { label: "Court Referred", color: "warning", icon: AlertTriangle },
  COMPOUNDED: { label: "Compounded", color: "success", icon: CheckCircle },
  DEFAULTED: { label: "Defaulted", color: "error", icon: XCircle },
};

export default function ChallansPage() {
  const { user } = useAuthStore();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const canCreate = user && hasMinimumRole(user.role, "CONSTABLE");

  useEffect(() => {
    // Simulated data - in production, fetch from API
    // Use setTimeout to avoid synchronous setState warning
    const loadData = () => {
      setChallans([
      {
        id: "1",
        challanNumber: "TRF-2024-00156",
        vehicleNumber: "KA-01-AB-1234",
        vehicleType: "TWO_WHEELER",
        violationType: { code: "SPD001", name: "Over Speeding", category: "SPEEDING", severity: "MAJOR" },
        violationLocation: "MG Road Junction",
        violationDate: "2024-01-08T14:30:00Z",
        ownerName: "John Doe",
        driverName: "John Doe",
        originalFineAmount: 200000,
        finalAmount: 200000,
        status: "PENDING",
        paymentDate: null,
        createdAt: "2024-01-08T15:00:00Z",
      },
      {
        id: "2",
        challanNumber: "TRF-2024-00155",
        vehicleNumber: "KA-05-CD-5678",
        vehicleType: "FOUR_WHEELER",
        violationType: { code: "SIG001", name: "Signal Violation", category: "SIGNAL_VIOLATION", severity: "MODERATE" },
        violationLocation: "Silk Board Junction",
        violationDate: "2024-01-08T11:15:00Z",
        ownerName: "Jane Smith",
        driverName: "Jane Smith",
        originalFineAmount: 100000,
        finalAmount: 100000,
        status: "PAID",
        paymentDate: "2024-01-08T16:00:00Z",
        createdAt: "2024-01-08T12:00:00Z",
      },
      {
        id: "3",
        challanNumber: "TRF-2024-00154",
        vehicleNumber: "KA-03-EF-9012",
        vehicleType: "TWO_WHEELER",
        violationType: { code: "HLM001", name: "No Helmet", category: "SAFETY_VIOLATION", severity: "MINOR" },
        violationLocation: "Electronic City",
        violationDate: "2024-01-08T09:45:00Z",
        ownerName: "Mike Johnson",
        driverName: "Mike Johnson",
        originalFineAmount: 50000,
        finalAmount: 50000,
        status: "PENDING",
        paymentDate: null,
        createdAt: "2024-01-08T10:00:00Z",
      },
      {
        id: "4",
        challanNumber: "TRF-2024-00153",
        vehicleNumber: "KA-02-GH-3456",
        vehicleType: "FOUR_WHEELER",
        violationType: { code: "DRK001", name: "Drunk Driving", category: "DRUNK_DRIVING", severity: "SEVERE" },
        violationLocation: "Koramangala",
        violationDate: "2024-01-07T23:30:00Z",
        ownerName: "Robert Brown",
        driverName: "Robert Brown",
        originalFineAmount: 1000000,
        finalAmount: 1000000,
        status: "DISPUTED",
        paymentDate: null,
        createdAt: "2024-01-08T00:00:00Z",
      },
      {
        id: "5",
        challanNumber: "TRF-2024-00152",
        vehicleNumber: "KA-04-IJ-7890",
        vehicleType: "TWO_WHEELER",
        violationType: { code: "SBT001", name: "No Seat Belt", category: "SAFETY_VIOLATION", severity: "MINOR" },
        violationLocation: "HSR Layout",
        violationDate: "2024-01-07T16:20:00Z",
        ownerName: "Emily White",
        driverName: "Emily White",
        originalFineAmount: 100000,
        finalAmount: 100000,
        status: "DEFAULTED",
        paymentDate: null,
        createdAt: "2024-01-07T17:00:00Z",
      },
      ]);
      setTotalPages(5);
      setIsLoading(false);
    };
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, [page, filterStatus, searchQuery]);

  const filteredChallans = challans.filter((challan) => {
    const matchesSearch =
      challan.challanNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challan.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (challan.ownerName && challan.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === "ALL" || challan.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString();
  };

  const handleCardClick = (status: string) => {
    if (filterStatus === status) {
      setFilterStatus("ALL");
    } else {
      setFilterStatus(status);
    }
  };

  const stats = {
    total: challans.length,
    pending: challans.filter((c) => c.status === "PENDING" || c.status === "ISSUED").length,
    paid: challans.filter((c) => c.status === "PAID").length,
    defaulted: challans.filter((c) => c.status === "DEFAULTED").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Traffic Challans</h1>
            <p className="text-foreground-muted">
              Manage and track traffic violation challans
            </p>
          </div>
          {canCreate && (
            <Link href="/traffic/challans/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Issue Challan
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card
            className={`cursor-pointer transition-all hover:border-accent/50 ${filterStatus === "ALL" ? "border-accent ring-1 ring-accent" : ""}`}
            onClick={() => setFilterStatus("ALL")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Car className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-foreground-muted">Total Challans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-warning/50 ${filterStatus === "PENDING" ? "border-warning ring-1 ring-warning" : ""}`}
            onClick={() => handleCardClick("PENDING")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-xs text-foreground-muted">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-success/50 ${filterStatus === "PAID" ? "border-success ring-1 ring-success" : ""}`}
            onClick={() => handleCardClick("PAID")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.paid}</p>
                  <p className="text-xs text-foreground-muted">Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-error/50 ${filterStatus === "DEFAULTED" ? "border-error ring-1 ring-error" : ""}`}
            onClick={() => handleCardClick("DEFAULTED")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <XCircle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.defaulted}</p>
                  <p className="text-xs text-foreground-muted">Defaulted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by challan number, vehicle number, or owner name..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Status</option>
                <option value="ISSUED">Issued</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="DISPUTED">Disputed</option>
                <option value="DEFAULTED">Defaulted</option>
                <option value="COURT_REFERRED">Court Referred</option>
              </select>
              <Button variant="secondary">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Challans List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
              </CardContent>
            </Card>
          ) : filteredChallans.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Car className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">No challans found</h3>
                <p className="text-foreground-muted">
                  Try adjusting your search or filter criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredChallans.map((challan) => {
              const status = statusConfig[challan.status] || statusConfig.PENDING;
              const StatusIcon = status.icon;

              return (
                <Card key={challan.id} className="hover:border-accent/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-accent/10">
                          <Car className="h-6 w-6 text-accent" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-foreground">{challan.challanNumber}</span>
                            <Badge variant={status.color as any}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                            <Badge variant={challan.violationType.severity === "SEVERE" ? "error" : challan.violationType.severity === "MAJOR" ? "warning" : "muted"}>
                              {challan.violationType.severity}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{challan.vehicleNumber}</span>
                            <span className="text-foreground-muted">({challan.vehicleType.replace("_", " ")})</span>
                          </div>
                          <div className="text-sm text-foreground-muted">
                            <span className="font-medium text-foreground">{challan.violationType.name}</span>
                            {" at "}{challan.violationLocation}
                          </div>
                          {challan.ownerName && (
                            <div className="text-sm text-foreground-muted">
                              Owner: {challan.ownerName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-lg font-bold text-foreground flex items-center gap-1 justify-end">
                          <IndianRupee className="h-4 w-4" />
                          {formatAmount(challan.finalAmount)}
                        </div>
                        <div className="text-sm text-foreground-muted">
                          <div className="flex items-center gap-2 justify-end">
                            <Calendar className="h-4 w-4" />
                            {new Date(challan.violationDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Link href={`/traffic/challans/${challan.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => toast.info("Print", "Opening print dialog...")}>
                            <Printer className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-foreground-muted">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
