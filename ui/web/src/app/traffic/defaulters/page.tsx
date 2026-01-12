"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  Car,
  IndianRupee,
  Calendar,
  Bell,
  Ban,
  Eye,
  Mail,
  Phone,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/stores/toastStore";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

interface Defaulter {
  id: string;
  vehicleNumber: string;
  ownerName: string | null;
  ownerPhone: string | null;
  totalChallans: number;
  totalPendingAmount: number;
  oldestPendingDate: string | null;
  blacklisted: boolean;
  blacklistDate: string | null;
  noticeSent: boolean;
  noticeDate: string | null;
  courtNoticeSent: boolean;
}

export default function DefaultersPage() {
  const { user } = useAuthStore();
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const canManage = user && hasMinimumRole(user.role, "SI");

  useEffect(() => {
    // Simulated data - in production, fetch from API
    const loadData = () => {
      setDefaulters([
      {
        id: "1",
        vehicleNumber: "KA-01-AB-1234",
        ownerName: "John Doe",
        ownerPhone: "9876543210",
        totalChallans: 5,
        totalPendingAmount: 1500000,
        oldestPendingDate: "2023-10-15",
        blacklisted: true,
        blacklistDate: "2024-01-05",
        noticeSent: true,
        noticeDate: "2023-11-20",
        courtNoticeSent: true,
      },
      {
        id: "2",
        vehicleNumber: "KA-05-CD-5678",
        ownerName: "Jane Smith",
        ownerPhone: "9876543211",
        totalChallans: 3,
        totalPendingAmount: 800000,
        oldestPendingDate: "2023-11-20",
        blacklisted: false,
        blacklistDate: null,
        noticeSent: true,
        noticeDate: "2023-12-10",
        courtNoticeSent: false,
      },
      {
        id: "3",
        vehicleNumber: "KA-03-EF-9012",
        ownerName: "Mike Johnson",
        ownerPhone: "9876543212",
        totalChallans: 2,
        totalPendingAmount: 400000,
        oldestPendingDate: "2023-12-05",
        blacklisted: false,
        blacklistDate: null,
        noticeSent: false,
        noticeDate: null,
        courtNoticeSent: false,
      },
      {
        id: "4",
        vehicleNumber: "KA-02-GH-3456",
        ownerName: "Robert Brown",
        ownerPhone: null,
        totalChallans: 7,
        totalPendingAmount: 2500000,
        oldestPendingDate: "2023-08-10",
        blacklisted: true,
        blacklistDate: "2023-12-01",
        noticeSent: true,
        noticeDate: "2023-09-15",
        courtNoticeSent: true,
      },
      ]);
      setTotalPages(3);
      setIsLoading(false);
    };
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, [page]);

  const filteredDefaulters = defaulters.filter((d) =>
    d.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.ownerName && d.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString();
  };

  const handleSendNotice = (defaulter: Defaulter) => {
    toast.success("Notice Sent", `Notice sent to ${defaulter.ownerName || defaulter.vehicleNumber}`);
  };

  const handleBlacklist = (defaulter: Defaulter) => {
    toast.warning("Blacklisted", `Vehicle ${defaulter.vehicleNumber} has been blacklisted`);
  };

  const totalStats = {
    total: defaulters.length,
    blacklisted: defaulters.filter((d) => d.blacklisted).length,
    totalAmount: defaulters.reduce((sum, d) => sum + d.totalPendingAmount, 0),
    noticePending: defaulters.filter((d) => !d.noticeSent).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Challan Defaulters</h1>
            <p className="text-foreground-muted">
              Track vehicles with pending traffic challans
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <AlertTriangle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalStats.total}</p>
                  <p className="text-xs text-foreground-muted">Total Defaulters</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <IndianRupee className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatAmount(totalStats.totalAmount)}
                  </p>
                  <p className="text-xs text-foreground-muted">Pending Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Ban className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalStats.blacklisted}</p>
                  <p className="text-xs text-foreground-muted">Blacklisted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Mail className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalStats.noticePending}</p>
                  <p className="text-xs text-foreground-muted">Notice Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <Input
              placeholder="Search by vehicle number or owner name..."
              value={searchQuery}
              onChange={setSearchQuery}
              icon={<Search className="h-4 w-4" />}
            />
          </CardContent>
        </Card>

        {/* Defaulters List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
              </CardContent>
            </Card>
          ) : filteredDefaulters.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Car className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">No defaulters found</h3>
                <p className="text-foreground-muted">
                  All vehicles have cleared their challans
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDefaulters.map((defaulter) => (
              <Card key={defaulter.id} className={defaulter.blacklisted ? "border-error" : "hover:border-accent/50 transition-colors"}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${defaulter.blacklisted ? "bg-error/10" : "bg-warning/10"}`}>
                        <Car className={`h-6 w-6 ${defaulter.blacklisted ? "text-error" : "text-warning"}`} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-foreground">{defaulter.vehicleNumber}</span>
                          {defaulter.blacklisted && (
                            <Badge variant="error">Blacklisted</Badge>
                          )}
                          {defaulter.courtNoticeSent && (
                            <Badge variant="warning">Court Notice Sent</Badge>
                          )}
                        </div>
                        {defaulter.ownerName && (
                          <p className="text-foreground">{defaulter.ownerName}</p>
                        )}
                        {defaulter.ownerPhone && (
                          <p className="text-sm text-foreground-muted flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {defaulter.ownerPhone}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-foreground-muted">
                          <span>{defaulter.totalChallans} pending challans</span>
                          {defaulter.oldestPendingDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Oldest: {new Date(defaulter.oldestPendingDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-sm text-foreground-muted">Pending Amount</p>
                        <p className="text-2xl font-bold text-error flex items-center gap-1 justify-end">
                          <IndianRupee className="h-5 w-5" />
                          {formatAmount(defaulter.totalPendingAmount)}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Link href={`/traffic/vehicle/${defaulter.vehicleNumber}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        {canManage && !defaulter.noticeSent && (
                          <Button variant="secondary" size="sm" onClick={() => handleSendNotice(defaulter)}>
                            <Bell className="h-4 w-4 mr-1" />
                            Send Notice
                          </Button>
                        )}
                        {canManage && !defaulter.blacklisted && (
                          <Button variant="secondary" size="sm" onClick={() => handleBlacklist(defaulter)}>
                            <Ban className="h-4 w-4 mr-1" />
                            Blacklist
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
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
