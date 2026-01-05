"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Package,
  Camera,
  Upload,
  MapPin,
  FileText,
  Shield,
  AlertTriangle,
  Check,
  X,
  Fingerprint,
  Microscope,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { useAuthStore } from "@/stores/authStore";
import { sanitizeString } from "@/lib/validations";
import { toast } from "@/stores/toastStore";

// Validation Schema
const evidenceFormSchema = z.object({
  linkedFIR: z.string()
    .min(1, "FIR number is required")
    .regex(/^[A-Z]{2,5}\/\d{4}\/\d{4,6}$/, "Invalid FIR format (e.g., KOR/2024/00123)")
    .transform(sanitizeString),
  evidenceType: z.enum(["PHYSICAL", "DIGITAL", "DOCUMENTARY", "BIOLOGICAL", "TRACE", "TESTIMONIAL"], {
    message: "Please select an evidence type"
  }),
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be less than 2000 characters")
    .transform(sanitizeString),
  collectionLocation: z.string()
    .min(5, "Collection location must be at least 5 characters")
    .max(500, "Location must be less than 500 characters")
    .transform(sanitizeString),
  collectionDate: z.string().min(1, "Collection date is required"),
  collectionTime: z.string().min(1, "Collection time is required"),
  collectedBy: z.string().optional(),
  storageLocation: z.enum(["MALKHANA", "FSL", "COURT", "DIGITAL_VAULT"]),
  containerType: z.string().max(100).optional().transform(v => v ? sanitizeString(v) : v),
  sealNumber: z.string()
    .max(50)
    .optional()
    .transform(v => v ? sanitizeString(v) : v),
  weight: z.string().max(50).optional(),
  dimensions: z.string().max(100).optional(),
  condition: z.string().max(100).optional().transform(v => v ? sanitizeString(v) : v),
  remarks: z.string().max(1000).optional().transform(v => v ? sanitizeString(v) : v),
  requiresForensic: z.boolean().default(false),
  forensicType: z.string().optional(),
});

type EvidenceFormData = z.input<typeof evidenceFormSchema>;

const evidenceTypes = [
  { value: "", label: "Select Type" },
  { value: "PHYSICAL", label: "Physical Evidence" },
  { value: "DIGITAL", label: "Digital Evidence" },
  { value: "DOCUMENTARY", label: "Documentary Evidence" },
  { value: "BIOLOGICAL", label: "Biological Evidence" },
  { value: "TRACE", label: "Trace Evidence" },
  { value: "TESTIMONIAL", label: "Testimonial Evidence" },
];

const storageLocations = [
  { value: "MALKHANA", label: "Station Malkhana" },
  { value: "FSL", label: "Forensic Science Lab" },
  { value: "COURT", label: "Court Registry" },
  { value: "DIGITAL_VAULT", label: "Digital Evidence Vault" },
];

export default function NewEvidencePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceFormSchema),
    defaultValues: {
      linkedFIR: "",
      evidenceType: undefined,
      description: "",
      collectionLocation: "",
      collectionDate: new Date().toISOString().split("T")[0],
      collectionTime: new Date().toTimeString().slice(0, 5),
      collectedBy: user?.name || "",
      storageLocation: "MALKHANA",
      containerType: "",
      sealNumber: "",
      weight: "",
      dimensions: "",
      condition: "",
      remarks: "",
      requiresForensic: false,
      forensicType: "",
    },
  });

  const requiresForensic = watch("requiresForensic");
  const forensicType = watch("forensicType");

  const onSubmit = async (data: EvidenceFormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate evidence number
    const evidenceNumber = `EVD-${new Date().getFullYear()}-${user?.stationId?.substring(0, 3).toUpperCase() || "KOR"}-${String(Math.floor(Math.random() * 10000)).padStart(5, "0")}`;

    alert(`Evidence registered successfully!\nEvidence Number: ${evidenceNumber}`);
    router.push("/evidence");
  };

  const handleFileUpload = () => {
    // Simulate file upload
    const fileName = `evidence_photo_${Date.now()}.jpg`;
    setUploadedFiles([...uploadedFiles, fileName]);
  };

  // Helper to show field error
  const FieldError = ({ name }: { name: keyof EvidenceFormData }) => {
    const error = errors[name];
    if (!error) return null;
    return <p className="text-sm text-red-500 mt-1">{error.message}</p>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Register New Evidence</h1>
            <p className="text-foreground-muted">
              Document and register evidence with chain of custody
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Evidence Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Linked FIR Number *"
                        placeholder="e.g., KOR/2024/00123"
                        {...register("linkedFIR")}
                        error={!!errors.linkedFIR}
                      />
                      <FieldError name="linkedFIR" />
                    </div>
                    <div>
                      <Select
                        label="Evidence Type *"
                        value={watch("evidenceType") || ""}
                        onChange={(v: string) => setValue("evidenceType", v as EvidenceFormData["evidenceType"])}
                        options={evidenceTypes}
                        error={!!errors.evidenceType}
                      />
                      <FieldError name="evidenceType" />
                    </div>
                  </div>

                  <div>
                    <Textarea
                      label="Description *"
                      placeholder="Detailed description of the evidence item..."
                      {...register("description")}
                      rows={4}
                      error={!!errors.description}
                    />
                    <FieldError name="description" />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Input
                        label="Container/Package Type"
                        placeholder="e.g., Sealed envelope"
                        {...register("containerType")}
                      />
                    </div>
                    <div>
                      <Input
                        label="Seal Number"
                        placeholder="e.g., SEAL-2024-001"
                        {...register("sealNumber")}
                      />
                    </div>
                    <div>
                      <Input
                        label="Weight (if applicable)"
                        placeholder="e.g., 250g"
                        {...register("weight")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Dimensions"
                        placeholder="e.g., 10cm x 5cm x 3cm"
                        {...register("dimensions")}
                      />
                    </div>
                    <div>
                      <Input
                        label="Condition"
                        placeholder="e.g., Good, Damaged, Partial"
                        {...register("condition")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collection Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Collection Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Input
                      label="Collection Location *"
                      placeholder="Address or location where evidence was collected"
                      {...register("collectionLocation")}
                      icon={<MapPin className="h-4 w-4" />}
                      error={!!errors.collectionLocation}
                    />
                    <FieldError name="collectionLocation" />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Input
                        label="Collection Date *"
                        type="date"
                        {...register("collectionDate")}
                        error={!!errors.collectionDate}
                      />
                      <FieldError name="collectionDate" />
                    </div>
                    <div>
                      <Input
                        label="Collection Time *"
                        type="time"
                        {...register("collectionTime")}
                        error={!!errors.collectionTime}
                      />
                      <FieldError name="collectionTime" />
                    </div>
                    <div>
                      <Input
                        label="Collected By"
                        {...register("collectedBy")}
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <Select
                      label="Storage Location *"
                      value={watch("storageLocation")}
                      onChange={(v: string) => setValue("storageLocation", v as EvidenceFormData["storageLocation"])}
                      options={storageLocations}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Forensic Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Microscope className="h-5 w-5" />
                    Forensic Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requiresForensic"
                      {...register("requiresForensic")}
                      className="h-4 w-4 rounded border-border"
                    />
                    <label htmlFor="requiresForensic" className="text-foreground">
                      Requires Forensic Analysis
                    </label>
                  </div>

                  {requiresForensic && (
                    <div className="p-4 rounded-lg bg-info/10 border border-info/20">
                      <p className="text-sm text-info mb-3">
                        Select the type of forensic analysis required
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "fingerprint", label: "Fingerprint Analysis", icon: Fingerprint },
                          { id: "dna", label: "DNA Analysis", icon: Microscope },
                          { id: "ballistic", label: "Ballistic Analysis", icon: Shield },
                          { id: "digital", label: "Digital Forensics", icon: FileText },
                        ].map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setValue("forensicType", type.id)}
                            className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                              forensicType === type.id
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border bg-background-secondary text-foreground-muted hover:text-foreground"
                            }`}
                          >
                            <type.icon className="h-4 w-4" />
                            <span className="text-sm">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Textarea
                      label="Additional Remarks"
                      placeholder="Any additional notes or observations..."
                      {...register("remarks")}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Photo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Evidence Photos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    onClick={handleFileUpload}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
                  >
                    <Upload className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
                    <p className="text-sm text-foreground-muted">
                      Click to upload photos
                    </p>
                    <p className="text-xs text-foreground-muted mt-1">
                      JPG, PNG up to 10MB each
                    </p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded bg-background-tertiary"
                        >
                          <span className="text-sm text-foreground truncate">
                            {file}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
                            }
                            className="text-error hover:text-error/80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chain of Custody Notice */}
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Chain of Custody</p>
                      <p className="text-sm text-foreground-muted mt-1">
                        This registration will create the first entry in the chain of
                        custody. All subsequent transfers must be documented.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Biometric Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5" />
                    Collector Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4 rounded-lg bg-background-tertiary">
                    <Fingerprint className="h-12 w-12 text-foreground-muted mx-auto mb-2" />
                    <p className="text-sm text-foreground-muted">
                      Biometric verification required
                    </p>
                    <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => toast.success("Identity Verified", "Biometric verification successful")}>
                      Verify Identity
                    </Button>
                  </div>
                  <div className="mt-4 p-3 rounded bg-success/10">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">
                        Demo Mode: Auto-verified
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                <Check className="h-4 w-4 mr-2" />
                Register Evidence
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
