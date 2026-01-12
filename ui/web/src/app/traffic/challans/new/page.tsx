"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Car,
  User,
  MapPin,
  Camera,
  AlertTriangle,
  FileText,
  CheckCircle,
  IndianRupee,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/stores/toastStore";
import { useAuthStore } from "@/stores/authStore";

// Challan form validation schema
const challanFormSchema = z.object({
  violationTypeId: z.string().min(1, "Please select a violation type"),
  violationDate: z.string().min(1, "Violation date is required"),
  violationLocation: z
    .string()
    .min(5, "Location must be at least 5 characters")
    .max(200, "Location must be less than 200 characters"),
  violationDescription: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  vehicleNumber: z
    .string()
    .min(1, "Vehicle number is required")
    .regex(
      /^[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{1,4}$/,
      "Invalid vehicle number format (e.g., KA-01-AB-1234)"
    ),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  vehicleMake: z.string().max(50).optional(),
  vehicleModel: z.string().max(50).optional(),
  vehicleColor: z.string().max(30).optional(),
  ownerName: z.string().max(100).optional(),
  ownerPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  driverName: z.string().max(100).optional(),
  driverLicenseNumber: z
    .string()
    .regex(/^[A-Z]{2}[-\s]?\d{2}[-\s]?\d{11}$/, "Invalid license format")
    .optional()
    .or(z.literal("")),
  driverPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  speedReading: z.string().optional(),
  breathAnalyzerReading: z.string().optional(),
});

type ChallanFormData = z.infer<typeof challanFormSchema>;

interface ViolationType {
  id: string;
  code: string;
  name: string;
  section: string;
  fineAmount: number;
  category: string;
  severity: string;
  pointsDeducted: number;
  licenseSuspensionDays: number;
  vehicleSeizure: boolean;
}

const vehicleTypeOptions = [
  { value: "TWO_WHEELER", label: "Two Wheeler" },
  { value: "THREE_WHEELER", label: "Three Wheeler (Auto)" },
  { value: "FOUR_WHEELER", label: "Four Wheeler (Car)" },
  { value: "COMMERCIAL", label: "Commercial Vehicle" },
  { value: "HEAVY_VEHICLE", label: "Heavy Vehicle (Truck/Bus)" },
  { value: "TRANSPORT", label: "Transport Vehicle" },
  { value: "OTHER", label: "Other" },
];

export default function NewChallanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [selectedViolation, setSelectedViolation] = useState<ViolationType | null>(null);

  const {
    setValue,
    watch,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<ChallanFormData>({
    resolver: zodResolver(challanFormSchema),
    defaultValues: {
      violationTypeId: "",
      violationDate: new Date().toISOString().slice(0, 16),
      violationLocation: "",
      violationDescription: "",
      vehicleNumber: "",
      vehicleType: "FOUR_WHEELER",
      vehicleMake: "",
      vehicleModel: "",
      vehicleColor: "",
      ownerName: "",
      ownerPhone: "",
      driverName: "",
      driverLicenseNumber: "",
      driverPhone: "",
      speedReading: "",
      breathAnalyzerReading: "",
    },
  });

  const formData = watch();

  useEffect(() => {
    // Simulated violation types - in production, fetch from API
    setViolationTypes([
      { id: "1", code: "SPD001", name: "Over Speeding (0-20 km/h over limit)", section: "MV Act Section 183", fineAmount: 200000, category: "SPEEDING", severity: "MODERATE", pointsDeducted: 2, licenseSuspensionDays: 0, vehicleSeizure: false },
      { id: "2", code: "SPD002", name: "Over Speeding (20-40 km/h over limit)", section: "MV Act Section 183", fineAmount: 400000, category: "SPEEDING", severity: "MAJOR", pointsDeducted: 4, licenseSuspensionDays: 0, vehicleSeizure: false },
      { id: "3", code: "SPD003", name: "Over Speeding (40+ km/h over limit)", section: "MV Act Section 183", fineAmount: 600000, category: "SPEEDING", severity: "SEVERE", pointsDeducted: 6, licenseSuspensionDays: 30, vehicleSeizure: false },
      { id: "4", code: "SIG001", name: "Red Light Violation", section: "MV Act Section 119", fineAmount: 100000, category: "SIGNAL_VIOLATION", severity: "MODERATE", pointsDeducted: 3, licenseSuspensionDays: 0, vehicleSeizure: false },
      { id: "5", code: "HLM001", name: "Riding Without Helmet", section: "MV Act Section 129", fineAmount: 100000, category: "SAFETY_VIOLATION", severity: "MINOR", pointsDeducted: 1, licenseSuspensionDays: 0, vehicleSeizure: false },
      { id: "6", code: "SBT001", name: "Driving Without Seat Belt", section: "MV Act Section 138", fineAmount: 100000, category: "SAFETY_VIOLATION", severity: "MINOR", pointsDeducted: 1, licenseSuspensionDays: 0, vehicleSeizure: false },
      { id: "7", code: "DRK001", name: "Drunk Driving", section: "MV Act Section 185", fineAmount: 1000000, category: "DRUNK_DRIVING", severity: "SEVERE", pointsDeducted: 10, licenseSuspensionDays: 180, vehicleSeizure: true },
      { id: "8", code: "LIC001", name: "Driving Without License", section: "MV Act Section 3", fineAmount: 500000, category: "DOCUMENT_VIOLATION", severity: "MAJOR", pointsDeducted: 0, licenseSuspensionDays: 0, vehicleSeizure: true },
      { id: "9", code: "INS001", name: "Driving Without Insurance", section: "MV Act Section 196", fineAmount: 200000, category: "DOCUMENT_VIOLATION", severity: "MODERATE", pointsDeducted: 0, licenseSuspensionDays: 0, vehicleSeizure: false },
      { id: "10", code: "MOB001", name: "Using Mobile While Driving", section: "MV Act Section 177", fineAmount: 500000, category: "DANGEROUS_DRIVING", severity: "MAJOR", pointsDeducted: 4, licenseSuspensionDays: 0, vehicleSeizure: false },
    ]);
  }, []);

  const handleViolationChange = (violationId: string) => {
    setValue("violationTypeId", violationId);
    const violation = violationTypes.find((v) => v.id === violationId);
    setSelectedViolation(violation || null);
  };

  const onSubmit = async (data: ChallanFormData) => {
    setIsSubmitting(true);
    try {
      // In production, send to API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Challan Issued", "Traffic challan has been issued successfully");
      router.push("/traffic/challans");
    } catch (error) {
      toast.error("Error", "Failed to issue challan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Issue Traffic Challan</h1>
          <p className="text-foreground-muted">
            Record a new traffic violation and issue a challan
          </p>
        </div>

        {/* Violation Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Violation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Select
                label="Violation Type *"
                value={formData.violationTypeId}
                onChange={(v: string) => handleViolationChange(v)}
                options={violationTypes.map((vt) => ({
                  value: vt.id,
                  label: `${vt.name} - Rs. ${formatAmount(vt.fineAmount)}`,
                }))}
              />
              {errors.violationTypeId && (
                <p className="text-xs text-error mt-1">{errors.violationTypeId.message}</p>
              )}
            </div>

            {selectedViolation && (
              <div className="p-4 rounded-lg bg-background-tertiary space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-muted">Section</span>
                  <span className="font-medium text-foreground">{selectedViolation.section}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-muted">Fine Amount</span>
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {formatAmount(selectedViolation.fineAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-muted">Severity</span>
                  <span className={`font-medium ${
                    selectedViolation.severity === "SEVERE" ? "text-error" :
                    selectedViolation.severity === "MAJOR" ? "text-warning" :
                    "text-foreground"
                  }`}>{selectedViolation.severity}</span>
                </div>
                {selectedViolation.pointsDeducted > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-muted">Points Deducted</span>
                    <span className="font-medium text-error">{selectedViolation.pointsDeducted}</span>
                  </div>
                )}
                {selectedViolation.licenseSuspensionDays > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-muted">License Suspension</span>
                    <span className="font-medium text-error">{selectedViolation.licenseSuspensionDays} days</span>
                  </div>
                )}
                {selectedViolation.vehicleSeizure && (
                  <div className="p-2 rounded bg-error/10 text-error text-sm font-medium">
                    Vehicle Seizure Required
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Violation Date & Time *"
                  type="datetime-local"
                  value={formData.violationDate}
                  onChange={(v: string) => setValue("violationDate", v)}
                />
                {errors.violationDate && (
                  <p className="text-xs text-error mt-1">{errors.violationDate.message}</p>
                )}
              </div>
              <div>
                <Input
                  label="Location *"
                  placeholder="MG Road Junction, Bengaluru"
                  value={formData.violationLocation}
                  onChange={(v: string) => setValue("violationLocation", v)}
                  icon={<MapPin className="h-4 w-4" />}
                />
                {errors.violationLocation && (
                  <p className="text-xs text-error mt-1">{errors.violationLocation.message}</p>
                )}
              </div>
            </div>

            <Textarea
              label="Description"
              placeholder="Additional details about the violation..."
              value={formData.violationDescription || ""}
              onChange={(v: string) => setValue("violationDescription", v)}
              rows={2}
            />

            {(selectedViolation?.category === "SPEEDING") && (
              <Input
                label="Speed Reading (km/h)"
                type="number"
                placeholder="85"
                value={formData.speedReading || ""}
                onChange={(v: string) => setValue("speedReading", v)}
              />
            )}

            {(selectedViolation?.category === "DRUNK_DRIVING") && (
              <Input
                label="Breath Analyzer Reading (mg/100ml)"
                type="number"
                placeholder="0.08"
                value={formData.breathAnalyzerReading || ""}
                onChange={(v: string) => setValue("breathAnalyzerReading", v)}
              />
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
                <Input
                  label="Vehicle Number *"
                  placeholder="KA-01-AB-1234"
                  value={formData.vehicleNumber}
                  onChange={(v: string) => setValue("vehicleNumber", v.toUpperCase())}
                />
                {errors.vehicleNumber && (
                  <p className="text-xs text-error mt-1">{errors.vehicleNumber.message}</p>
                )}
              </div>
              <Select
                label="Vehicle Type *"
                value={formData.vehicleType}
                onChange={(v: string) => setValue("vehicleType", v)}
                options={vehicleTypeOptions}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Make"
                placeholder="Honda"
                value={formData.vehicleMake || ""}
                onChange={(v: string) => setValue("vehicleMake", v)}
              />
              <Input
                label="Model"
                placeholder="City"
                value={formData.vehicleModel || ""}
                onChange={(v: string) => setValue("vehicleModel", v)}
              />
              <Input
                label="Color"
                placeholder="White"
                value={formData.vehicleColor || ""}
                onChange={(v: string) => setValue("vehicleColor", v)}
              />
            </div>
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
              <Input
                label="Owner Name"
                placeholder="John Doe"
                value={formData.ownerName || ""}
                onChange={(v: string) => setValue("ownerName", v)}
              />
              <div>
                <Input
                  label="Owner Phone"
                  placeholder="9876543210"
                  value={formData.ownerPhone || ""}
                  onChange={(v: string) => setValue("ownerPhone", v)}
                />
                {errors.ownerPhone && (
                  <p className="text-xs text-error mt-1">{errors.ownerPhone.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Driver Name"
                placeholder="John Doe"
                value={formData.driverName || ""}
                onChange={(v: string) => setValue("driverName", v)}
              />
              <div>
                <Input
                  label="Driver License Number"
                  placeholder="KA-0120210012345"
                  value={formData.driverLicenseNumber || ""}
                  onChange={(v: string) => setValue("driverLicenseNumber", v.toUpperCase())}
                />
                {errors.driverLicenseNumber && (
                  <p className="text-xs text-error mt-1">{errors.driverLicenseNumber.message}</p>
                )}
              </div>
              <div>
                <Input
                  label="Driver Phone"
                  placeholder="9876543210"
                  value={formData.driverPhone || ""}
                  onChange={(v: string) => setValue("driverPhone", v)}
                />
                {errors.driverPhone && (
                  <p className="text-xs text-error mt-1">{errors.driverPhone.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary & Submit */}
        {selectedViolation && (
          <Card className="border-accent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Fine Amount</p>
                  <p className="text-3xl font-bold text-foreground flex items-center gap-1">
                    <IndianRupee className="h-6 w-6" />
                    {formatAmount(selectedViolation.fineAmount)}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    Payment due within 15 days
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button onClick={handleFormSubmit(onSubmit)} disabled={isSubmitting}>
                    {isSubmitting ? "Issuing..." : "Issue Challan"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
