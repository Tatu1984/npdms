"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  Users,
  Scale,
  MapPin,
  Calendar,
  AlertTriangle,
  Check,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useCasesStore } from "@/stores/casesStore";

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
  { value: "OTHER", label: "Other" },
];

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const commonIPCSections = [
  { value: "IPC 302", label: "IPC 302 - Murder" },
  { value: "IPC 304", label: "IPC 304 - Culpable Homicide" },
  { value: "IPC 307", label: "IPC 307 - Attempt to Murder" },
  { value: "IPC 376", label: "IPC 376 - Rape" },
  { value: "IPC 379", label: "IPC 379 - Theft" },
  { value: "IPC 392", label: "IPC 392 - Robbery" },
  { value: "IPC 397", label: "IPC 397 - Robbery with Attempt to Cause Death" },
  { value: "IPC 406", label: "IPC 406 - Criminal Breach of Trust" },
  { value: "IPC 420", label: "IPC 420 - Cheating" },
  { value: "IPC 498A", label: "IPC 498A - Cruelty by Husband" },
  { value: "NDPS 20", label: "NDPS Act Section 20" },
  { value: "NDPS 22", label: "NDPS Act Section 22" },
  { value: "IT Act 66", label: "IT Act Section 66" },
  { value: "Arms Act 25", label: "Arms Act Section 25" },
];

export default function NewCasePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { createCase } = useCasesStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const canCreate = user && hasMinimumRole(user.role, "SI");

  const [formData, setFormData] = useState({
    linkedFIR: "",
    title: "",
    category: "",
    priority: "MEDIUM",
    synopsis: "",
    incidentLocation: "",
    incidentDate: "",
    incidentTime: "",
    assignedOfficer: user?.name || "",
  });

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

  const toggleSection = (section: string) => {
    if (selectedSections.includes(section)) {
      setSelectedSections(selectedSections.filter((s) => s !== section));
    } else {
      setSelectedSections([...selectedSections, section]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newCase = await createCase({
        firId: formData.linkedFIR,
        firNumber: formData.linkedFIR,
        title: formData.title,
        description: formData.synopsis,
        status: "INVESTIGATION",
        accused: accused.filter(a => a.name).map((a, index) => ({
          id: `acc-${Date.now()}-${index}`,
          name: a.name,
          identificationMarks: a.description,
          status: a.status as "WANTED" | "ARRESTED" | "ABSCONDING" | "BAILED" | "CONVICTED",
        })),
        witnesses: [],
        investigatingOfficer: user?.id,
        investigatingOfficerName: formData.assignedOfficer,
      });

      addToast({
        type: "success",
        title: "Case Created",
        message: `Case ${newCase.caseNumber} has been registered successfully`,
      });
      router.push("/cases");
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to create case. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
                    <Input
                      label="Linked FIR Number *"
                      placeholder="e.g., KOR/2024/00123"
                      value={formData.linkedFIR}
                      onChange={(v: string) =>
                        setFormData({ ...formData, linkedFIR: v })
                      }
                      required
                    />
                    <Select
                      label="Case Category *"
                      value={formData.category}
                      onChange={(v: string) =>
                        setFormData({ ...formData, category: v })
                      }
                      options={caseCategories}
                      required
                    />
                  </div>

                  <Input
                    label="Case Title *"
                    placeholder="Brief descriptive title of the case"
                    value={formData.title}
                    onChange={(v: string) =>
                      setFormData({ ...formData, title: v })
                    }
                    required
                  />

                  <Select
                    label="Priority *"
                    value={formData.priority}
                    onChange={(v: string) =>
                      setFormData({ ...formData, priority: v })
                    }
                    options={priorities}
                    required
                  />

                  <Textarea
                    label="Case Synopsis *"
                    placeholder="Detailed description of the incident and case background..."
                    value={formData.synopsis}
                    onChange={(v: string) =>
                      setFormData({ ...formData, synopsis: v })
                    }
                    rows={6}
                    required
                  />
                </CardContent>
              </Card>

              {/* Incident Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Incident Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Incident Location *"
                    placeholder="Address where the incident occurred"
                    value={formData.incidentLocation}
                    onChange={(v: string) =>
                      setFormData({ ...formData, incidentLocation: v })
                    }
                    icon={<MapPin className="h-4 w-4" />}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Incident Date *"
                      type="date"
                      value={formData.incidentDate}
                      onChange={(v: string) =>
                        setFormData({ ...formData, incidentDate: v })
                      }
                      required
                    />
                    <Input
                      label="Incident Time"
                      type="time"
                      value={formData.incidentTime}
                      onChange={(v: string) =>
                        setFormData({ ...formData, incidentTime: v })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* IPC Sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Applicable Sections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-muted mb-4">
                    Select all applicable IPC/Special Act sections
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {commonIPCSections.map((section) => (
                      <button
                        key={section.value}
                        type="button"
                        onClick={() => toggleSection(section.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                          selectedSections.includes(section.value)
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-background-secondary text-foreground-muted hover:text-foreground"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selectedSections.includes(section.value)
                              ? "border-accent bg-accent"
                              : "border-foreground-muted"
                          }`}
                        >
                          {selectedSections.includes(section.value) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm">{section.label}</span>
                      </button>
                    ))}
                  </div>
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
                    value={formData.assignedOfficer}
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
                    <CardTitle>Selected Sections</CardTitle>
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
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
