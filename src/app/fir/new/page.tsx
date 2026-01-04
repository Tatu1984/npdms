"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useFIRStore } from "@/stores/firStore";
import { useAuthStore } from "@/stores/authStore";

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
  const { createFIR, isLoading } = useFIRStore();

  const [inputMode, setInputMode] = useState<"type" | "voice" | "scan" | "upload">("type");
  const [formData, setFormData] = useState({
    // Complainant
    complainantName: "",
    complainantFatherName: "",
    complainantAddress: "",
    complainantPhone: "",
    complainantAltPhone: "",
    complainantIdType: "",
    complainantIdNumber: "",
    complainantAge: "",
    complainantGender: "",
    // Incident
    incidentDate: new Date().toISOString().split("T")[0],
    incidentTime: "",
    incidentTimeApprox: false,
    incidentLocation: "",
    incidentBeat: "",
    // Offence
    offenceCategory: "",
    offenceType: "",
    ipcSections: [] as string[],
    description: "",
    // Accused
    accusedKnown: false,
    accusedDetails: "",
  });

  const [propertyItems, setPropertyItems] = useState<PropertyItem[]>([]);
  const [attachments, setAttachments] = useState<{ name: string; size: string; status: string }[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
    if (selectedSuggestions.includes(section)) {
      setSelectedSuggestions((prev) => prev.filter((s) => s !== section));
      handleInputChange(
        "ipcSections",
        formData.ipcSections.filter((s) => s !== section)
      );
    } else {
      setSelectedSuggestions((prev) => [...prev, section]);
      handleInputChange("ipcSections", [...formData.ipcSections, section]);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await createFIR({
        stationId: user?.stationId || "",
        stationName: user?.stationName || "",
        complainantName: formData.complainantName,
        complainantPhone: formData.complainantPhone,
        complainantAddress: formData.complainantAddress,
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime,
        incidentLocation: formData.incidentLocation,
        offenceCategory: formData.offenceCategory,
        offenceType: formData.offenceType,
        ipcSections: formData.ipcSections,
        description: formData.description,
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

  const suggestions = formData.offenceType ? ipcSectionSuggestions[formData.offenceType] || [] : [];
  const totalPropertyValue = propertyItems.reduce(
    (sum, item) => sum + (parseFloat(item.estimatedValue) || 0),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
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
                variant={inputMode === "type" ? "default" : "secondary"}
                onClick={() => setInputMode("type")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Type
              </Button>
              <Button
                variant={inputMode === "voice" ? "default" : "secondary"}
                onClick={() => setInputMode("voice")}
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice
              </Button>
              <Button
                variant={inputMode === "scan" ? "default" : "secondary"}
                onClick={() => setInputMode("scan")}
              >
                <Camera className="h-4 w-4 mr-2" />
                Scan Handwritten
              </Button>
              <Button
                variant={inputMode === "upload" ? "default" : "secondary"}
                onClick={() => setInputMode("upload")}
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
                  <Input
                    label="Name *"
                    value={formData.complainantName}
                    onChange={(e) => handleInputChange("complainantName", e.target.value)}
                    placeholder="Full name of complainant"
                    required
                  />
                  <Input
                    label="Father's/Husband's Name"
                    value={formData.complainantFatherName}
                    onChange={(e) => handleInputChange("complainantFatherName", e.target.value)}
                    placeholder="Father's or husband's name"
                  />
                </div>
                <Textarea
                  label="Address *"
                  value={formData.complainantAddress}
                  onChange={(e) => handleInputChange("complainantAddress", e.target.value)}
                  placeholder="Complete residential address"
                  rows={2}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Phone *"
                    type="tel"
                    value={formData.complainantPhone}
                    onChange={(e) => handleInputChange("complainantPhone", e.target.value)}
                    placeholder="+91 9876543210"
                    required
                  />
                  <Input
                    label="Alternate Phone"
                    type="tel"
                    value={formData.complainantAltPhone}
                    onChange={(e) => handleInputChange("complainantAltPhone", e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select
                    label="ID Type"
                    options={idTypes}
                    value={formData.complainantIdType}
                    onChange={(v) => handleInputChange("complainantIdType", v)}
                  />
                  <Input
                    label="ID Number"
                    value={formData.complainantIdNumber}
                    onChange={(e) => handleInputChange("complainantIdNumber", e.target.value)}
                    placeholder="ID number"
                  />
                  <Input
                    label="Age *"
                    type="number"
                    value={formData.complainantAge}
                    onChange={(e) => handleInputChange("complainantAge", e.target.value)}
                    placeholder="Age"
                    required
                  />
                  <Select
                    label="Gender *"
                    options={genderOptions}
                    value={formData.complainantGender}
                    onChange={(v) => handleInputChange("complainantGender", v)}
                  />
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
                  <Input
                    label="Date of Incident *"
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => handleInputChange("incidentDate", e.target.value)}
                    required
                  />
                  <Input
                    label="Time of Incident"
                    type="time"
                    value={formData.incidentTime}
                    onChange={(e) => handleInputChange("incidentTime", e.target.value)}
                  />
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-foreground-muted">
                      <input
                        type="checkbox"
                        checked={formData.incidentTimeApprox}
                        onChange={(e) => handleInputChange("incidentTimeApprox", e.target.checked)}
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
                      value={formData.incidentLocation}
                      onChange={(e) => handleInputChange("incidentLocation", e.target.value)}
                      placeholder="Address or landmark"
                      required
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-8"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    label="Beat/Area"
                    value={formData.incidentBeat}
                    onChange={(e) => handleInputChange("incidentBeat", e.target.value)}
                    placeholder="Select or enter beat"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Offence Category *"
                    options={offenceCategories}
                    value={formData.offenceCategory}
                    onChange={(v) => {
                      handleInputChange("offenceCategory", v);
                      handleInputChange("offenceType", "");
                    }}
                  />
                  <Select
                    label="Offence Type *"
                    options={[
                      { value: "", label: "Select Type" },
                      ...(offenceTypes[formData.offenceCategory] || []),
                    ]}
                    value={formData.offenceType}
                    onChange={(v) => handleInputChange("offenceType", v)}
                    disabled={!formData.offenceCategory}
                  />
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
              </CardContent>
            </Card>

            {/* Incident Description */}
            <Card>
              <CardHeader>
                <CardTitle>Incident Description *</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Provide a detailed description of the incident as narrated by the complainant..."
                  rows={6}
                  required
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-foreground-muted">
                    Characters: {formData.description.length}/500 minimum recommended
                  </span>
                  {formData.description.length >= 500 && (
                    <Badge variant="success" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Minimum met
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Involved */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Property Involved</CardTitle>
                <Button variant="secondary" size="sm" onClick={addPropertyItem}>
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
                    {propertyItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-3 p-3 rounded-lg bg-background-tertiary"
                      >
                        <div className="col-span-3">
                          <Input
                            placeholder="Item name"
                            value={item.item}
                            onChange={(e) => updatePropertyItem(item.id, "item", e.target.value)}
                          />
                        </div>
                        <div className="col-span-5">
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) =>
                              updatePropertyItem(item.id, "description", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="Est. Value (₹)"
                            value={item.estimatedValue}
                            onChange={(e) =>
                              updatePropertyItem(item.id, "estimatedValue", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <Button
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
                          Total Estimated Value: ₹{totalPropertyValue.toLocaleString("en-IN")}
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
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" className="w-full">
                    <Camera className="h-4 w-4 mr-1" />
                    Photo
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full">
                    <Upload className="h-4 w-4 mr-1" />
                    Document
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full">
                    <Mic className="h-4 w-4 mr-1" />
                    Audio
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full">
                    <Upload className="h-4 w-4 mr-1" />
                    Video
                  </Button>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-md bg-background-tertiary"
                      >
                        <span className="text-sm text-foreground">{file.name}</span>
                        <span className="text-xs text-foreground-muted">{file.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="p-3 rounded-md bg-background-tertiary">
                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="rounded mt-0.5" />
                    <span className="text-foreground-muted">
                      I verify that the above information is recorded accurately as stated by the
                      complainant.
                    </span>
                  </label>
                </div>
                <Button className="w-full" onClick={handleSubmit} isLoading={isSaving}>
                  <Send className="h-4 w-4 mr-2" />
                  Register FIR
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button variant="ghost" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
