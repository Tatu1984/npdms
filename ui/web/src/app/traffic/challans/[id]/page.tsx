"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  User,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  IndianRupee,
  FileText,
  Printer,
  ArrowLeft,
  CreditCard,
  Scale,
  Camera,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/stores/toastStore";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

interface ChallanDetails {
  id: string;
  challanNumber: string;
  violationTypeId: string;
  violationType: {
    code: string;
    name: string;
    section: string;
    category: string;
    severity: string;
  };
  violationDate: string;
  violationLocation: string;
  violationDescription: string | null;
  vehicleNumber: string;
  vehicleType: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  driverName: string | null;
  driverLicenseNumber: string | null;
  driverPhone: string | null;
  issuingOfficerName: string | null;
  issuingOfficerBadge: string | null;
  originalFineAmount: number;
  discountAmount: number;
  penaltyAmount: number;
  finalAmount: number;
  paymentDueDate: string;
  status: string;
  paymentDate: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  speedReading: number | null;
  breathAnalyzerReading: number | null;
  licenseSeized: boolean;
  vehicleSeized: boolean;
  disputeFiled: boolean;
  disputeReason: string | null;
  disputeStatus: string | null;
  evidencePhotos: string[];
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  ISSUED: { label: "Issued", color: "info", icon: Clock },
  PENDING: { label: "Pending", color: "warning", icon: Clock },
  PAID: { label: "Paid", color: "success", icon: CheckCircle },
  DISPUTED: { label: "Disputed", color: "accent", icon: Scale },
  CANCELLED: { label: "Cancelled", color: "muted", icon: XCircle },
  COURT_REFERRED: { label: "Court Referred", color: "warning", icon: Scale },
  COMPOUNDED: { label: "Compounded", color: "success", icon: CheckCircle },
  DEFAULTED: { label: "Defaulted", color: "error", icon: XCircle },
};

export default function ChallanDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [challan, setChallan] = useState<ChallanDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user && hasMinimumRole(user.role, "SI");

  useEffect(() => {
    // Simulated data - in production, fetch from API
    setChallan({
      id: params.id as string,
      challanNumber: "TRF-2024-00156",
      violationTypeId: "1",
      violationType: {
        code: "SPD001",
        name: "Over Speeding (20-40 km/h over limit)",
        section: "MV Act Section 183",
        category: "SPEEDING",
        severity: "MAJOR",
      },
      violationDate: "2024-01-08T14:30:00Z",
      violationLocation: "MG Road Junction, Bengaluru",
      violationDescription: "Vehicle was traveling at 85 km/h in a 60 km/h zone",
      vehicleNumber: "KA-01-AB-1234",
      vehicleType: "FOUR_WHEELER",
      vehicleMake: "Honda",
      vehicleModel: "City",
      vehicleColor: "White",
      ownerName: "John Doe",
      ownerPhone: "9876543210",
      driverName: "John Doe",
      driverLicenseNumber: "KA-0120210012345",
      driverPhone: "9876543210",
      issuingOfficerName: "SI Rajesh Kumar",
      issuingOfficerBadge: "KP-12345",
      originalFineAmount: 400000,
      discountAmount: 0,
      penaltyAmount: 0,
      finalAmount: 400000,
      paymentDueDate: "2024-01-23T23:59:59Z",
      status: "PENDING",
      paymentDate: null,
      paymentMethod: null,
      paymentReference: null,
      speedReading: 85,
      breathAnalyzerReading: null,
      licenseSeized: false,
      vehicleSeized: false,
      disputeFiled: false,
      disputeReason: null,
      disputeStatus: null,
      evidencePhotos: [],
      createdAt: "2024-01-08T15:00:00Z",
    });
    setIsLoading(false);
  }, [params.id]);

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString();
  };

  const handleFileDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error("Validation Error", "Please provide a reason for the dispute");
      return;
    }

    setIsSubmitting(true);
    try {
      // In production, send to API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Dispute Filed", "Your dispute has been filed successfully");
      setShowDisputeModal(false);
      setChallan((prev) => prev ? { ...prev, status: "DISPUTED", disputeFiled: true, disputeReason } : null);
    } catch (error) {
      toast.error("Error", "Failed to file dispute");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = () => {
    toast.info("Payment", "Redirecting to payment gateway...");
    // In production, redirect to payment gateway
  };

  if (isLoading || !challan) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[challan.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const daysRemaining = Math.ceil((new Date(challan.paymentDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{challan.challanNumber}</h1>
                <Badge variant={status.color as any}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-foreground-muted">
                Issued on {new Date(challan.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Payment Due Warning */}
        {challan.status === "PENDING" && daysRemaining <= 5 && daysRemaining > 0 && (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium text-warning">Payment Due Soon</p>
              <p className="text-sm text-foreground-muted">
                {daysRemaining} day{daysRemaining > 1 ? "s" : ""} remaining to pay. Late payment may incur additional penalties.
              </p>
            </div>
          </div>
        )}

        {challan.status === "PENDING" && daysRemaining <= 0 && (
          <div className="p-4 rounded-lg bg-error/10 border border-error/20 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-error" />
            <div>
              <p className="font-medium text-error">Payment Overdue</p>
              <p className="text-sm text-foreground-muted">
                Payment is overdue. Additional penalties may apply.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Violation Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Violation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-background-tertiary">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-foreground">{challan.violationType.name}</p>
                      <p className="text-sm text-foreground-muted">{challan.violationType.section}</p>
                    </div>
                    <Badge variant={challan.violationType.severity === "SEVERE" ? "error" : challan.violationType.severity === "MAJOR" ? "warning" : "muted"}>
                      {challan.violationType.severity}
                    </Badge>
                  </div>
                  {challan.violationDescription && (
                    <p className="text-sm text-foreground mt-2">{challan.violationDescription}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-foreground-muted">Date & Time</p>
                    <p className="font-medium text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(challan.violationDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted">Location</p>
                    <p className="font-medium text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {challan.violationLocation}
                    </p>
                  </div>
                </div>

                {challan.speedReading && (
                  <div>
                    <p className="text-sm text-foreground-muted">Speed Reading</p>
                    <p className="font-medium text-foreground">{challan.speedReading} km/h</p>
                  </div>
                )}

                {challan.breathAnalyzerReading && (
                  <div>
                    <p className="text-sm text-foreground-muted">Breath Analyzer Reading</p>
                    <p className="font-medium text-foreground">{challan.breathAnalyzerReading} mg/100ml</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-foreground-muted">Vehicle Number</p>
                    <p className="text-xl font-bold text-foreground">{challan.vehicleNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted">Vehicle Type</p>
                    <p className="font-medium text-foreground">{challan.vehicleType.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {challan.vehicleMake && (
                    <div>
                      <p className="text-sm text-foreground-muted">Make</p>
                      <p className="font-medium text-foreground">{challan.vehicleMake}</p>
                    </div>
                  )}
                  {challan.vehicleModel && (
                    <div>
                      <p className="text-sm text-foreground-muted">Model</p>
                      <p className="font-medium text-foreground">{challan.vehicleModel}</p>
                    </div>
                  )}
                  {challan.vehicleColor && (
                    <div>
                      <p className="text-sm text-foreground-muted">Color</p>
                      <p className="font-medium text-foreground">{challan.vehicleColor}</p>
                    </div>
                  )}
                </div>

                {(challan.licenseSeized || challan.vehicleSeized) && (
                  <div className="p-3 rounded-lg bg-error/10 space-y-1">
                    {challan.licenseSeized && (
                      <p className="text-sm font-medium text-error">License Seized</p>
                    )}
                    {challan.vehicleSeized && (
                      <p className="text-sm font-medium text-error">Vehicle Seized</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner/Driver Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Owner / Driver Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-foreground-muted">Owner Name</p>
                    <p className="font-medium text-foreground">{challan.ownerName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted">Owner Phone</p>
                    <p className="font-medium text-foreground">{challan.ownerPhone || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-foreground-muted">Driver Name</p>
                    <p className="font-medium text-foreground">{challan.driverName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted">License Number</p>
                    <p className="font-medium text-foreground">{challan.driverLicenseNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted">Driver Phone</p>
                    <p className="font-medium text-foreground">{challan.driverPhone || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dispute Details */}
            {challan.disputeFiled && (
              <Card className="border-warning">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Dispute Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground-muted">Dispute Status</p>
                    <Badge variant="warning">{challan.disputeStatus || "Under Review"}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted">Reason</p>
                    <p className="text-foreground">{challan.disputeReason}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Card */}
            <Card className="border-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-muted">Fine Amount</p>
                  <p className="text-3xl font-bold text-foreground flex items-center gap-1">
                    <IndianRupee className="h-6 w-6" />
                    {formatAmount(challan.finalAmount)}
                  </p>
                </div>

                {challan.discountAmount > 0 && (
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Original Amount</span>
                      <span className="text-foreground">{formatAmount(challan.originalFineAmount)}</span>
                    </div>
                    <div className="flex justify-between text-success">
                      <span>Discount</span>
                      <span>-{formatAmount(challan.discountAmount)}</span>
                    </div>
                  </div>
                )}

                {challan.penaltyAmount > 0 && (
                  <div className="text-sm flex justify-between text-error">
                    <span>Late Penalty</span>
                    <span>+{formatAmount(challan.penaltyAmount)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-foreground-muted">Payment Due Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(challan.paymentDueDate).toLocaleDateString()}
                  </p>
                </div>

                {challan.status === "PAID" && challan.paymentDate && (
                  <div className="p-3 rounded-lg bg-success/10">
                    <p className="text-sm font-medium text-success flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Paid on {new Date(challan.paymentDate).toLocaleDateString()}
                    </p>
                    {challan.paymentReference && (
                      <p className="text-xs text-foreground-muted mt-1">
                        Ref: {challan.paymentReference}
                      </p>
                    )}
                  </div>
                )}

                {(challan.status === "PENDING" || challan.status === "ISSUED") && (
                  <div className="space-y-2">
                    <Button className="w-full" onClick={handlePayment}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Now
                    </Button>
                    {!challan.disputeFiled && (
                      <Button variant="secondary" className="w-full" onClick={() => setShowDisputeModal(true)}>
                        <Scale className="h-4 w-4 mr-2" />
                        File Dispute
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Officer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Issuing Officer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-foreground-muted">Name</p>
                  <p className="font-medium text-foreground">{challan.issuingOfficerName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Badge Number</p>
                  <p className="font-medium text-foreground">{challan.issuingOfficerBadge || "-"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      <Modal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        title="File Dispute"
        description="Provide the reason for disputing this challan"
        size="md"
      >
        <Textarea
          label="Dispute Reason *"
          placeholder="Explain why you are disputing this challan..."
          value={disputeReason}
          onChange={setDisputeReason}
          rows={4}
        />

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDisputeModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleFileDispute} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Dispute"}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
