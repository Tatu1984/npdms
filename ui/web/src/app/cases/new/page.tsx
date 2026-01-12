"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Briefcase,
  Users,
  Scale,
  MapPin,
  AlertTriangle,
  Check,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LegacySelect as Select } from "@/components/ui/select";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useCreateCase } from "@/hooks/use-cases";
import { type CaseStatus } from "@/lib/db/schema";
import { sanitizeString } from "@/lib/validations";
import { IPCSectionSelector } from "@/components/ui/IPCSectionSelector";
import { LocationPicker, type LocationData } from "@/components/ui/LocationPicker";

// Case form validation schema
const caseFormSchema = z.object({
  linkedFIR: z
    .string()
    .min(1, "FIR number is required")
    .regex(/^[A-Z]{2,4}\/\d{4}\/\d{5}$/, "FIR number format: XXX/YYYY/NNNNN (e.g., KOR/2024/00123)"),
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must be less than 200 characters")
    .transform(sanitizeString),
  category: z.string().min(1, "Please select a case category"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  synopsis: z
    .string()
    .min(50, "Synopsis must be at least 50 characters")
    .max(5000, "Synopsis must be less than 5000 characters")
    .transform(sanitizeString),
  incidentLocation: z
    .string()
    .min(10, "Location must be at least 10 characters")
    .max(500, "Location must be less than 500 characters")
    .transform(sanitizeString),
  incidentDate: z.string().min(1, "Incident date is required"),
  incidentTime: z.string().optional(),
});

const caseCategories = [
  { value: "MURDER", label: "Murder" },
  { value: "ROBBERY", label: "Robbery" },
  { value: "THEFT", label: "Theft" },
  { value: "ASSAULT", label: "Assault" },
  { value: "FRAUD", label: "Fraud" },
  { value: "CYBERCRIME", label: "Cybercrime" },
  { value: "NARCOTICS", label: "Narcotics" },
  { value: "DOMESTIC_VIOLENCE", label: "Domestic Violence" },
  { value: "KIDNAPPING", label: "Kidnapping" },
  { value: "SEXUAL_OFFENCE", label: "Sexual Offence" },
  { value: "PROPERTY_CRIME", label: "Property Crime" },
  { value: "ECONOMIC_OFFENCE", label: "Economic Offence" },
  { value: "OTHER", label: "Other" },
];

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

type CaseFormData = z.infer<typeof caseFormSchema>;

export default function NewCasePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const createCaseMutation = useCreateCase();
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const canCreate = user && hasMinimumRole(user.role, "SI");

  const {
    setValue,
    watch,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      linkedFIR: "",
      title: "",
      category: "",
      priority: "MEDIUM",
      synopsis: "",
      incidentLocation: "",
      incidentDate: "",
      incidentTime: "",
    },
  });

  const formData = watch();

  const [accused, setAccused] = useState([
    { name: "", description: "", status: "ABSCONDING" },
  ]);

  const handleAddAccused = () => {
    setAccused([...accused, { name: "", description: "", status: "ABSCONDING" }]);
  };

  const handleRemoveAccused = (index: number) => {
    setAccused(accused.filter((_, i) => i !== index));
  };

  const handleAccusedChange = (index: number, field: string, value: string) => {
    const updated = [...accused];
    updated[index] = { ...updated[index], [field]: value };
    setAccused(updated);
  };

  const handleLocationChange = (address: string, data?: LocationData) => {
    setValue("incidentLocation", address);
    if (data) {
      setLocationData(data);
    }
  };

  const onSubmit = async (data: CaseFormData) => {
    if (selectedSections.length === 0) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Please select at least one IPC section",
      });
      return;
    }

    try {
      const newCase = await createCaseMutation.mutateAsync({
        firId: data.linkedFIR,
        title: data.title,
        description: data.synopsis,
        status: "INVESTIGATION" as CaseStatus,
        stationId: user?.stationId || "default-station",
        investigatingOfficer: user?.id,
        prosecutingOfficer: undefined,
        courtName: undefined,
        nextHearing: undefined,
      });

      addToast({
        type: "success",
        title: "Case Created",
        message: `Case ${newCase.caseNumber} has been registered successfully`,
      });
      router.push("/cases");
    } catch (_error) {
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to create case. Please try again.",
      });
    }
  };

  if (!canCreate) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-foreground-muted">
              You need Sub-Inspector level or above to create cases.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Register New Case</h1>
            <p className="text-foreground-muted">
              Create a case file from an existing FIR
            </p>
          </div>
          <Button variant="secondary" onClick={() => router.back()}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Case Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Linked FIR Number *"
                        placeholder="e.g., KOR/2024/00123"
                        value={formData.linkedFIR}
                        onChange={(v: string) => setValue("linkedFIR", v)}
                      />
                      {errors.linkedFIR && (
                        <p className="text-xs text-error mt-1">{errors.linkedFIR.message}</p>
                      )}
                    </div>
                    <div>
                      <Select
                        label="Case Category *"
                        value={formData.category}
                        onChange={(v: string) => setValue("category", v)}
                        options={caseCategories}
                      />
                      {errors.category && (
                        <p className="text-xs text-error mt-1">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Case Title *"
                      placeholder="Brief descriptive title of the case"
                      value={formData.title}
                      onChange={(v: string) => setValue("title", v)}
                    />
                    {errors.title && (
                      <p className="text-xs text-error mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <Select
                    label="Priority *"
                    value={formData.priority}
                    onChange={(v: string) => setValue("priority", v as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
                    options={priorities}
                  />

                  <div>
                    <Textarea
                      label="Case Synopsis *"
                      placeholder="Detailed description of the incident and case background..."
                      value={formData.synopsis}
                      onChange={(v: string) => setValue("synopsis", v)}
                      rows={6}
                    />
                    {errors.synopsis && (
                      <p className="text-xs text-error mt-1">{errors.synopsis.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Incident Details with Location Picker */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Incident Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <LocationPicker
                    label="Incident Location *"
                    value={formData.incidentLocation}
                    onChange={handleLocationChange}
                    placeholder="Enter address or click Auto Detect"
                    required
                    error={errors.incidentLocation?.message}
                    showMap={true}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Incident Date *"
                        type="date"
                        value={formData.incidentDate}
                        onChange={(v: string) => setValue("incidentDate", v)}
                      />
                      {errors.incidentDate && (
                        <p className="text-xs text-error mt-1">{errors.incidentDate.message}</p>
                      )}
                    </div>
                    <Input
                      label="Incident Time"
                      type="time"
                      value={formData.incidentTime || ""}
                      onChange={(v: string) => setValue("incidentTime", v)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* IPC Sections - New Searchable Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Applicable Sections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <IPCSectionSelector
                    value={selectedSections}
                    onChange={setSelectedSections}
                    label="Select IPC/Special Act Sections *"
                    required
                    error={selectedSections.length === 0 ? "At least one section is required" : undefined}
                  />
                </CardContent>
              </Card>

              {/* Accused */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Accused Persons
                    </CardTitle>
                    <Button type="button" size="sm" onClick={handleAddAccused}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Accused
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {accused.map((person, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-background-tertiary space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          Accused #{index + 1}
                        </span>
                        {accused.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAccused(index)}
                            className="text-error hover:text-error/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Name (or Unidentified)"
                          value={person.name}
                          onChange={(v: string) =>
                            handleAccusedChange(index, "name", v)
                          }
                        />
                        <Select
                          value={person.status}
                          onChange={(v: string) =>
                            handleAccusedChange(index, "status", v)
                          }
                          options={[
                            { value: "ABSCONDING", label: "Absconding" },
                            { value: "ARRESTED", label: "Arrested" },
                            { value: "BAILED", label: "On Bail" },
                            { value: "WANTED", label: "Wanted" },
                          ]}
                        />
                      </div>
                      <Input
                        placeholder="Description (age, height, identifying marks)"
                        value={person.description}
                        onChange={(v: string) =>
                          handleAccusedChange(index, "description", v)
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Case Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Lead Investigator"
                    value={user?.name || ""}
                    disabled
                  />
                  <div className="p-3 rounded bg-info/10">
                    <p className="text-xs text-info">
                      Case will be assigned to you as the registering officer.
                      Assignment can be changed by SHO later.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Sections Summary */}
              {selectedSections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Selected Sections ({selectedSections.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedSections.map((section) => (
                        <span
                          key={section}
                          className="px-2 py-1 text-xs rounded bg-accent/10 text-accent"
                        >
                          {section}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location Summary */}
              {locationData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    {locationData.city && (
                      <div>
                        <span className="text-foreground-muted">City: </span>
                        <span className="text-foreground">{locationData.city}</span>
                      </div>
                    )}
                    {locationData.state && (
                      <div>
                        <span className="text-foreground-muted">State: </span>
                        <span className="text-foreground">{locationData.state}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-foreground-muted">Coordinates: </span>
                      <span className="text-foreground font-mono text-xs">
                        {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warning */}
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Important</p>
                      <p className="text-sm text-foreground-muted mt-1">
                        Once created, the case will be tracked through the entire
                        judicial process. Ensure all details are accurate.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={createCaseMutation.isPending}>
                {createCaseMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">...</span>
                    Creating Case...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Case
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
