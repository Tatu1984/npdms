"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  TrendingUp,
  Download,
  Filter,
  Eye,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface Payment {
  id: string;
  transactionId: string;
  challanId: string;
  challanNumber: string;
  vehicleNumber: string;
  amount: number;
  gatewayFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentGateway: string;
  status: string;
  initiatedAt: string;
  completedAt: string | null;
  receiptNumber: string | null;
}

const paymentMethodLabels: Record<string, string> = {
  UPI: "UPI",
  DEBIT_CARD: "Debit Card",
  CREDIT_CARD: "Credit Card",
  NET_BANKING: "Net Banking",
  WALLET: "Wallet",
  CASH: "Cash",
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  SUCCESS: { label: "Success", color: "success", icon: CheckCircle },
  PENDING: { label: "Pending", color: "warning", icon: Clock },
  FAILED: { label: "Failed", color: "error", icon: XCircle },
  REFUNDED: { label: "Refunded", color: "info", icon: IndianRupee },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterMethod, setFilterMethod] = useState("ALL");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  useEffect(() => {
    // Simulated data - in production, fetch from API
    setPayments([
      {
        id: "1",
        transactionId: "TXN-2024-00456",
        challanId: "ch-1",
        challanNumber: "TRF-2024-00150",
        vehicleNumber: "KA-01-AB-1234",
        amount: 200000,
        gatewayFee: 500,
        totalAmount: 200500,
        paymentMethod: "UPI",
        paymentGateway: "Razorpay",
        status: "SUCCESS",
        initiatedAt: "2024-01-08T14:30:00Z",
        completedAt: "2024-01-08T14:30:45Z",
        receiptNumber: "RCP-2024-00456",
      },
      {
        id: "2",
        transactionId: "TXN-2024-00455",
        challanId: "ch-2",
        challanNumber: "TRF-2024-00149",
        vehicleNumber: "KA-05-CD-5678",
        amount: 100000,
        gatewayFee: 250,
        totalAmount: 100250,
        paymentMethod: "DEBIT_CARD",
        paymentGateway: "Razorpay",
        status: "SUCCESS",
        initiatedAt: "2024-01-08T12:15:00Z",
        completedAt: "2024-01-08T12:15:30Z",
        receiptNumber: "RCP-2024-00455",
      },
      {
        id: "3",
        transactionId: "TXN-2024-00454",
        challanId: "ch-3",
        challanNumber: "TRF-2024-00148",
        vehicleNumber: "KA-03-EF-9012",
        amount: 500000,
        gatewayFee: 1250,
        totalAmount: 501250,
        paymentMethod: "NET_BANKING",
        paymentGateway: "PayU",
        status: "FAILED",
        initiatedAt: "2024-01-08T10:45:00Z",
        completedAt: null,
        receiptNumber: null,
      },
      {
        id: "4",
        transactionId: "TXN-2024-00453",
        challanId: "ch-4",
        challanNumber: "TRF-2024-00147",
        vehicleNumber: "KA-02-GH-3456",
        amount: 1000000,
        gatewayFee: 2500,
        totalAmount: 1002500,
        paymentMethod: "CREDIT_CARD",
        paymentGateway: "Razorpay",
        status: "REFUNDED",
        initiatedAt: "2024-01-07T16:20:00Z",
        completedAt: "2024-01-07T16:21:00Z",
        receiptNumber: "RCP-2024-00453",
      },
      {
        id: "5",
        transactionId: "TXN-2024-00452",
        challanId: "ch-5",
        challanNumber: "TRF-2024-00146",
        vehicleNumber: "KA-04-IJ-7890",
        amount: 50000,
        gatewayFee: 0,
        totalAmount: 50000,
        paymentMethod: "CASH",
        paymentGateway: "Counter",
        status: "SUCCESS",
        initiatedAt: "2024-01-07T11:00:00Z",
        completedAt: "2024-01-07T11:00:00Z",
        receiptNumber: "RCP-2024-00452",
      },
    ]);
    setIsLoading(false);
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.challanNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || payment.status === filterStatus;
    const matchesMethod = filterMethod === "ALL" || payment.paymentMethod === filterMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString();
  };

  const stats = {
    total: payments.length,
    successful: payments.filter((p) => p.status === "SUCCESS").length,
    totalCollected: payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + p.amount, 0),
    failed: payments.filter((p) => p.status === "FAILED").length,
  };

  const handleCardClick = (status: string) => {
    if (filterStatus === status) {
      setFilterStatus("ALL");
    } else {
      setFilterStatus(status);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment Tracking</h1>
            <p className="text-foreground-muted">
              Monitor and track challan payment transactions
            </p>
          </div>
          <Button variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
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
                  <CreditCard className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-foreground-muted">Total Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-success/50 ${filterStatus === "SUCCESS" ? "border-success ring-1 ring-success" : ""}`}
            onClick={() => handleCardClick("SUCCESS")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.successful}</p>
                  <p className="text-xs text-foreground-muted">Successful</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <TrendingUp className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground flex items-center gap-1">
                    <IndianRupee className="h-5 w-5" />
                    {formatAmount(stats.totalCollected)}
                  </p>
                  <p className="text-xs text-foreground-muted">Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-error/50 ${filterStatus === "FAILED" ? "border-error ring-1 ring-error" : ""}`}
            onClick={() => handleCardClick("FAILED")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <XCircle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.failed}</p>
                  <p className="text-xs text-foreground-muted">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by transaction ID, challan, or vehicle..."
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
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background-tertiary">
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Transaction ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Challan</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Vehicle</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Method</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <CreditCard className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                        <p className="text-foreground-muted">No payments found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => {
                      const status = statusConfig[payment.status] || statusConfig.PENDING;
                      const StatusIcon = status.icon;

                      return (
                        <tr key={payment.id} className="border-b border-border hover:bg-background-tertiary">
                          <td className="py-3 px-4">
                            <span className="font-medium text-foreground">{payment.transactionId}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Link href={`/traffic/challans/${payment.challanId}`} className="text-accent hover:underline">
                              {payment.challanNumber}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-foreground">{payment.vehicleNumber}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 font-medium text-foreground">
                              <IndianRupee className="h-3 w-3" />
                              {formatAmount(payment.amount)}
                            </div>
                            {payment.gatewayFee > 0 && (
                              <div className="text-xs text-foreground-muted">
                                +{formatAmount(payment.gatewayFee)} fee
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="muted">
                              {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={status.color as any}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-foreground-muted">
                            {new Date(payment.initiatedAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
