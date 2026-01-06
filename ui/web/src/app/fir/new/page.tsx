"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FileText,
  Mic,
  Camera,
  Upload,
  MapPin,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Save,
  Eye,
  Send,
  ArrowLeft,
  Plus,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { useFIRStore } from "@/stores/firStore";
import { useAuthStore } from "@/stores/authStore";
import { sanitizeString } from "@/lib/validations";
import { toast } from "@/stores/toastStore";
import { FileUpload } from "@/components/ui/FileUpload";
import { FIRPreviewDialog } from "@/components/ui/FIRPreviewDialog";

// Validation Schema
const firFormSchema = z.object({
  // Complainant
  complainantName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .transform(sanitizeString),
  complainantFatherName: z.string().max(100).optional().transform(v => v ? sanitizeString(v) : v),
  complainantAddress: z.string()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address must be less than 500 characters")
    .transform(sanitizeString),
  complainantPhone: z.string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number (must be 10 digits starting with 6-9)"),
  complainantAltPhone: z.string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  complainantIdType: z.string().optional(),
  complainantIdNumber: z.string().max(50).optional(),
  complainantAge: z.string()
    .min(1, "Age is required")
    .refine(v => {
      const age = parseInt(v);
      return !isNaN(age) && age > 0 && age < 150;
    }, "Age must be between 1 and 150"),
  complainantGender: z.enum(["Male", "Female", "Other"], {
    message: "Please select a gender"
  }),
  // Incident
  incidentDate: z.string().min(1, "Incident date is required"),
  incidentTime: z.string().optional(),
  incidentTimeApprox: z.boolean().default(false),
  incidentLocation: z.string()
    .min(5, "Location must be at least 5 characters")
    .max(500, "Location must be less than 500 characters")
    .transform(sanitizeString),
  incidentBeat: z.string().max(100).optional().transform(v => v ? sanitizeString(v) : v),
  // Offence
  offenceCategory: z.string().min(1, "Offence category is required"),
  offenceType: z.string().min(1, "Offence type is required"),
  ipcSections: z.array(z.string()).min(1, "At least one IPC section is required"),
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be less than 5000 characters")
    .transform(sanitizeString),
  // Accused
  accusedKnown: z.boolean().default(false),
  accusedDetails: z.string().max(1000).optional().transform(v => v ? sanitizeString(v) : v),
});

type FIRFormData = z.input<typeof firFormSchema>;

const offenceCategories = [
  { value: "", label: "Select Category" },
  { value: "Property Crimes", label: "Property Crimes" },
  { value: "Crimes Against Person", label: "Crimes Against Person" },
  { value: "Economic Offences", label: "Economic Offences" },
  { value: "Cyber Crimes", label: "Cyber Crimes" },
  { value: "Crimes Against Women", label: "Crimes Against Women" },
  { value: "Crimes Against Children", label: "Crimes Against Children" },
  { value: "Drug Offences", label: "Drug Offences" },
  { value: "Traffic Offences", label: "Traffic Offences" },
  { value: "Other", label: "Other" },
];

const offenceTypes: Record<string, { value: string; label: string }[]> = {
  "Property Crimes": [
    { value: "Theft", label: "Theft" },
    { value: "Burglary", label: "Burglary" },
    { value: "Robbery", label: "Robbery" },
    { value: "Chain Snatching", label: "Chain Snatching" },
    { value: "Vehicle Theft", label: "Vehicle Theft" },
    { value: "House Breaking", label: "House Breaking" },
  ],
  "Crimes Against Person": [
    { value: "Assault", label: "Assault" },
    { value: "Murder", label: "Murder" },
    { value: "Attempt to Murder", label: "Attempt to Murder" },
    { value: "Grievous Hurt", label: "Grievous Hurt" },
    { value: "Kidnapping", label: "Kidnapping" },
  ],
  "Economic Offences": [
    { value: "Fraud", label: "Fraud" },
    { value: "Cheating", label: "Cheating" },
    { value: "Forgery", label: "Forgery" },
    { value: "Criminal Breach of Trust", label: "Criminal Breach of Trust" },
  ],
  "Cyber Crimes": [
    { value: "Online Fraud", label: "Online Fraud" },
    { value: "Identity Theft", label: "Identity Theft" },
    { value: "Hacking", label: "Hacking" },
    { value: "Cyber Stalking", label: "Cyber Stalking" },
  ],
};

const ipcSectionSuggestions: Record<string, { section: string; description: string; confidence: number }[]> = {
  Theft: [
    { section: "IPC 379", description: "Theft", confidence: 95 },
    { section: "IPC 411", description: "Dishonestly receiving stolen property", confidence: 60 },
  ],
  Assault: [
    { section: "IPC 323", description: "Voluntarily causing hurt", confidence: 90 },
    { section: "IPC 504", description: "Intentional insult with intent to provoke breach of peace", confidence: 70 },
  ],
  Fraud: [
    { section: "IPC 420", description: "Cheating and dishonestly inducing delivery of property", confidence: 95 },
    { section: "IT Act 66D", description: "Punishment for cheating by personation using computer resource", confidence: 80 },
  ],
  Robbery: [
    { section: "IPC 392", description: "Robbery", confidence: 95 },
    { section: "IPC 397", description: "Robbery with attempt to cause death or grievous hurt", confidence: 45 },
  ],
};

const idTypes = [
  { value: "", label: "Select ID Type" },
  { value: "Aadhaar", label: "Aadhaar Card" },
  { value: "PAN", label: "PAN Card" },
  { value: "Voter ID", label: "Voter ID" },
  { value: "Passport", label: "Passport" },
  { value: "Driving License", label: "Driving License" },
];

const genderOptions = [
  { value: "", label: "Select Gender" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

interface PropertyItem {
  id: string;
  item: string;
  description: string;
  estimatedValue: string;
}

export default function NewFIRPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createFIR } = useFIRStore();

  const [inputMode, setInputMode] = useState<"type" | "voice" | "scan" | "upload">("type");
  const [propertyItems, setPropertyItems] = useState<PropertyItem[]>([]);
  const [attachments, setAttachments] = useState<{ name: string; size: string; status: string }[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FIRFormData>({
    resolver: zodResolver(firFormSchema),
    defaultValues: {
      complainantName: "",
      complainantFatherName: "",
      complainantAddress: "",
      complainantPhone: "",
      complainantAltPhone: "",
      complainantIdType: "",
      complainantIdNumber: "",
      complainantAge: "",
      complainantGender: undefined,
      incidentDate: new Date().toISOString().split("T")[0],
      incidentTime: "",
      incidentTimeApprox: false,
      incidentLocation: "",
      incidentBeat: "",
      offenceCategory: "",
      offenceType: "",
      ipcSections: [],
      description: "",
      accusedKnown: false,
      accusedDetails: "",
    },
  });

  const offenceCategory = watch("offenceCategory");
  const offenceType = watch("offenceType");
  const description = watch("description") || "";
  const ipcSections = watch("ipcSections") || [];

  const addPropertyItem = () => {
    setPropertyItems((prev) => [
      ...prev,
      { id: `prop-${Date.now()}`, item: "", description: "", estimatedValue: "" },
    ]);
  };

  const updatePropertyItem = (id: string, field: string, value: string) => {
    setPropertyItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removePropertyItem = (id: string) => {
    setPropertyItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleIPCSection = (section: string) => {
    const currentSections = ipcSections;
    if (currentSections.includes(section)) {
      setSelectedSuggestions((prev) => prev.filter((s) => s !== section));
      setValue("ipcSections", currentSections.filter((s) => s !== section));
    } else {
      setSelectedSuggestions((prev) => [...prev, section]);
      setValue("ipcSections", [...currentSections, section]);
    }
  };

  const onSubmit = async (data: FIRFormData) => {
    if (!verificationChecked) {
      alert("Please verify the information accuracy before submitting.");
      return;
    }

    setIsSaving(true);
    try {
      await createFIR({
        stationId: user?.stationId || "",
        stationName: user?.stationName || "",
        complainantName: data.complainantName,
        complainantPhone: data.complainantPhone,
        complainantAddress: data.complainantAddress,
        incidentDate: data.incidentDate,
        incidentTime: data.incidentTime || "",
        incidentLocation: data.incidentLocation,
        offenceCategory: data.offenceCategory,
        offenceType: data.offenceType,
        ipcSections: data.ipcSections,
        description: data.description,
        status: "REGISTERED",
        priority: "NORMAL",
        registeredBy: user?.id || "",
      });
      router.push("/fir");
    } catch (error) {
      console.error("Error creating FIR:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const suggestions = offenceType ? ipcSectionSuggestions[offenceType] || [] : [];
  const totalPropertyValue = propertyItems.reduce(
    (sum, item) => sum + (parseFloat(item.estimatedValue) || 0),
    0
  );

  // Helper to show field error
  const FieldError = ({ name }: { name: keyof FIRFormData }) => {
    const error = errors[name];
    if (!error) return null;
    return <p className="text-sm text-red-500 mt-1">{error.message}</p>;
  };

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Register New FIR</h1>
              <p className="text-foreground-muted">
                FIR Number will be auto-generated upon registration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background-tertiary">
            <span className="text-xs text-foreground-muted">Auto-saved: Just now</span>
          </div>
        </div>

        {/* Input Mode Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Input Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={inputMode === "type" ? "default" : "secondary"}
                onClick={() => setInputMode("type")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Type
              </Button>
              <Button
                type="button"
                variant={inputMode === "voice" ? "default" : "secondary"}
                onClick={() => {
                  setInputMode("voice");
                  toast.info("Voice Input", "Voice recognition feature coming soon");
                }}
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice
              </Button>
              <Button
                type="button"
                variant={inputMode === "scan" ? "default" : "secondary"}
                onClick={() => {
                  setInputMode("scan");
                  toast.info("Document Scanning", "Handwritten document scanning coming soon");
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Scan Handwritten
              </Button>
              <Button
                type="button"
                variant={inputMode === "upload" ? "default" : "secondary"}
                onClick={() => {
                  setInputMode("upload");
                  toast.info("Document Upload", "Document upload and parsing coming soon");
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Complainant Details */}
            <Card>
              <CardHeader>
                <CardTitle>Complainant Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Name *"
                      {...register("complainantName")}
                      placeholder="Full name of complainant"
                      error={!!errors.complainantName}
                    />
                    <FieldError name="complainantName" />
                  </div>
                  <div>
                    <Input
                      label="Father's/Husband's Name"
                      {...register("complainantFatherName")}
                      placeholder="Father's or husband's name"
                    />
                    <FieldError name="complainantFatherName" />
                  </div>
                </div>
                <div>
                  <Textarea
                    label="Address *"
                    {...register("complainantAddress")}
                    placeholder="Complete residential address"
                    rows={2}
                    error={!!errors.complainantAddress}
                  />
                  <FieldError name="complainantAddress" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Phone *"
                      type="tel"
                      {...register("complainantPhone")}
                      placeholder="9876543210"
                      error={!!errors.complainantPhone}
                    />
                    <FieldError name="complainantPhone" />
                  </div>
                  <div>
                    <Input
                      label="Alternate Phone"
                      type="tel"
                      {...register("complainantAltPhone")}
                      placeholder="9876543210"
                    />
                    <FieldError name="complainantAltPhone" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select
                    label="ID Type"
                    options={idTypes}
                    value={watch("complainantIdType") || ""}
                    onChange={(v: string) => setValue("complainantIdType", v)}
                  />
                  <div>
                    <Input
                      label="ID Number"
                      {...register("complainantIdNumber")}
                      placeholder="ID number"
                    />
                  </div>
                  <div>
                    <Input
                      label="Age *"
                      type="number"
                      {...register("complainantAge")}
                      placeholder="Age"
                      error={!!errors.complainantAge}
                    />
                    <FieldError name="complainantAge" />
                  </div>
                  <div>
                    <Select
                      label="Gender *"
                      options={genderOptions}
                      value={watch("complainantGender") || ""}
                      onChange={(v: string) => setValue("complainantGender", v as "Male" | "Female" | "Other")}
                      error={!!errors.complainantGender}
                    />
                    <FieldError name="complainantGender" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incident Details */}
            <Card>
              <CardHeader>
                <CardTitle>Incident Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      label="Date of Incident *"
                      type="date"
                      {...register("incidentDate")}
                      error={!!errors.incidentDate}
                    />
                    <FieldError name="incidentDate" />
                  </div>
                  <div>
                    <Input
                      label="Time of Incident"
                      type="time"
                      {...register("incidentTime")}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-foreground-muted">
                      <input
                        type="checkbox"
                        {...register("incidentTimeApprox")}
                        className="rounded"
                      />
                      Approximate time
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      label="Location *"
                      {...register("incidentLocation")}
                      placeholder="Address or landmark"
                      error={!!errors.incidentLocation}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-8"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                    <FieldError name="incidentLocation" />
                  </div>
                  <div>
                    <Input
                      label="Beat/Area"
                      {...register("incidentBeat")}
                      placeholder="Select or enter beat"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Offence Category *"
                      options={offenceCategories}
                      value={offenceCategory || ""}
                      onChange={(v: string) => {
                        setValue("offenceCategory", v);
                        setValue("offenceType", "");
                      }}
                      error={!!errors.offenceCategory}
                    />
                    <FieldError name="offenceCategory" />
                  </div>
                  <div>
                    <Select
                      label="Offence Type *"
                      options={[
                        { value: "", label: "Select Type" },
                        ...(offenceTypes[offenceCategory] || []),
                      ]}
                      value={offenceType || ""}
                      onChange={(v: string) => setValue("offenceType", v)}
                      disabled={!offenceCategory}
                      error={!!errors.offenceType}
                    />
                    <FieldError name="offenceType" />
                  </div>
                </div>

                {/* AI IPC Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-4 rounded-lg bg-background-tertiary border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium text-foreground">
                        AI Suggested IPC Sections
                      </span>
                    </div>
                    <div className="space-y-2">
                      {suggestions.map((suggestion) => (
                        <label
                          key={suggestion.section}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-background-secondary cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSuggestions.includes(suggestion.section)}
                            onChange={() => toggleIPCSection(suggestion.section)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-foreground">
                              {suggestion.section}
                            </span>
                            <span className="text-sm text-foreground-muted ml-2">
                              - {suggestion.description}
                            </span>
                          </div>
                          <Badge variant="info" className="text-xs">
                            {suggestion.confidence}% match
                          </Badge>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
                      <AlertCircle className="h-3 w-3" />
                      AI suggestions are advisory. Officer must verify applicability.
                    </div>
                  </div>
                )}
                {errors.ipcSections && (
                  <p className="text-sm text-red-500">{errors.ipcSections.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Incident Description */}
            <Card>
              <CardHeader>
                <CardTitle>Incident Description *</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register("description")}
                  placeholder="Provide a detailed description of the incident as narrated by the complainant..."
                  rows={6}
                  error={!!errors.description}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-foreground-muted">
                    Characters: {description.length}/50 minimum required
                  </span>
                  {description.length >= 50 && (
                    <Badge variant="success" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Minimum met
                    </Badge>
                  )}
                </div>
                <FieldError name="description" />
              </CardContent>
            </Card>

            {/* Property Involved */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Property Involved</CardTitle>
                <Button type="button" variant="secondary" size="sm" onClick={addPropertyItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                {propertyItems.length === 0 ? (
                  <p className="text-sm text-foreground-muted py-4 text-center">
                    No property items added. Click &quot;Add Item&quot; to add stolen/damaged property.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {propertyItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-3 p-3 rounded-lg bg-background-tertiary"
                      >
                        <div className="col-span-3">
                          <Input
                            placeholder="Item name"
                            value={item.item}
                            onChange={(v: string) => updatePropertyItem(item.id, "item", v)}
                          />
                        </div>
                        <div className="col-span-5">
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(v: string) =>
                              updatePropertyItem(item.id, "description", v)
                            }
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="Est. Value"
                            value={item.estimatedValue}
                            onChange={(v: string) =>
                              updatePropertyItem(item.id, "estimatedValue", v)
                            }
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePropertyItem(item.id)}
                          >
                            <X className="h-4 w-4 text-error" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {propertyItems.length > 0 && (
                      <div className="flex justify-end pt-2 border-t border-border">
                        <span className="text-sm font-medium text-foreground">
                          Total Estimated Value: Rs.{totalPropertyValue.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Station</span>
                  <span className="text-foreground font-medium">{user?.stationName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Recording Officer</span>
                  <span className="text-foreground font-medium">{user?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Badge Number</span>
                  <span className="text-foreground font-mono">{user?.badgeNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Date</span>
                  <span className="text-foreground">
                    {new Date().toLocaleDateString("en-IN")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Initial Evidence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  fileType="image"
                  multiple
                  maxSize={10}
                  label="Photos"
                  hint="Upload evidence photos (JPG, PNG up to 10MB each)"
                  onUpload={async (files) => {
                    // TODO: Upload to MinIO and store URLs
                    console.log("Uploading photos:", files);
                    toast.success("Photos Uploaded", `${files.length} photo(s) uploaded successfully`);
                  }}
                />
                <FileUpload
                  fileType="document"
                  multiple
                  maxSize={20}
                  label="Documents"
                  hint="Upload documents (PDF, DOC, DOCX up to 20MB each)"
                  onUpload={async (files) => {
                    // TODO: Upload to MinIO and store URLs
                    console.log("Uploading documents:", files);
                    toast.success("Documents Uploaded", `${files.length} document(s) uploaded successfully`);
                  }}
                />
                <FileUpload
                  fileType="audio"
                  multiple
                  maxSize={50}
                  label="Audio Recordings"
                  hint="Upload audio files (MP3, WAV up to 50MB each)"
                  onUpload={async (files) => {
                    // TODO: Upload to MinIO and store URLs
                    console.log("Uploading audio:", files);
                    toast.success("Audio Uploaded", `${files.length} audio file(s) uploaded successfully`);
                  }}
                />
                <FileUpload
                  fileType="video"
                  multiple
                  maxSize={100}
                  label="Videos"
                  hint="Upload video files (MP4, AVI up to 100MB each)"
                  onUpload={async (files) => {
                    // TODO: Upload to MinIO and store URLs
                    console.log("Uploading videos:", files);
                    toast.success("Videos Uploaded", `${files.length} video(s) uploaded successfully`);
                  }}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="p-3 rounded-md bg-background-tertiary">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="rounded mt-0.5"
                      checked={verificationChecked}
                      onChange={(e) => setVerificationChecked(e.target.checked)}
                    />
                    <span className="text-foreground-muted">
                      I verify that the above information is recorded accurately as stated by the
                      complainant.
                    </span>
                  </label>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isSaving || isSubmitting}
                  disabled={!verificationChecked}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Register FIR
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" className="w-full" onClick={() => toast.success("Draft Saved", "Your FIR draft has been saved locally")}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setShowPreview(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <FIRPreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        firData={{
          ...watch(),
          propertyItems,
          stationName: user?.stationName || "Koramangala",
          registeredBy: user?.name || "Current User",
        }}
      />
    </DashboardLayout>
  );
}
