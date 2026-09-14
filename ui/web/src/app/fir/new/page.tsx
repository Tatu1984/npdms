"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, MapPin, Send } from "lucide-react";
import { toast } from "@/stores/toastStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SectionPicker } from "@/components/ui/SectionPicker";
import { useCreateFIR } from "@/hooks/use-firs";
import { useOfficers } from "@/hooks/use-investigation";
import { useAuthStore } from "@/stores/authStore";
import type { FIRPriority } from "@/lib/api/firs";

const MIN_DESCRIPTION = 50;

const idTypes = [
  { value: "", label: "Select ID Type" },
  { value: "Aadhaar", label: "Aadhaar Card" },
  { value: "PAN", label: "PAN Card" },
  { value: "Voter ID", label: "Voter ID" },
  { value: "Passport", label: "Passport" },
  { value: "Driving License", label: "Driving License" },
];

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

type Errors = Partial<Record<"complainantName" | "complainantPhone" | "incidentDate" | "incidentLocation" | "incidentDescription" | "sections", string>>;

const emptyForm = () => ({
  complainantName: "",
  complainantPhone: "",
  complainantAddress: "",
  complainantIdType: "",
  complainantIdNumber: "",
  incidentDate: new Date().toISOString().split("T")[0],
  incidentTime: "",
  incidentLocation: "",
  incidentDescription: "",
  sections: [] as string[],
  priority: "MEDIUM" as FIRPriority,
  investigatingOfficer: "",
});

function validate(form: ReturnType<typeof emptyForm>): Errors {
  const errors: Errors = {};
  if (form.complainantName.trim().length < 2) errors.complainantName = "Name must be at least 2 characters";
  if (form.complainantPhone && !/^[6-9]\d{9}$/.test(form.complainantPhone))
    errors.complainantPhone = "10 digits starting with 6-9";
  if (!form.incidentDate) errors.incidentDate = "Incident date is required";
  else if (form.incidentDate > new Date().toISOString().split("T")[0])
    errors.incidentDate = "Incident date cannot be in the future";
  if (form.incidentLocation.trim().length < 5) errors.incidentLocation = "Location must be at least 5 characters";
  if (form.incidentDescription.trim().length < MIN_DESCRIPTION)
    errors.incidentDescription = `Description must be at least ${MIN_DESCRIPTION} characters`;
  if (form.sections.length === 0) errors.sections = "Select at least one section";
  return errors;
}

export default function NewFIRPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const createFIR = useCreateFIR();
  const officers = useOfficers();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [verified, setVerified] = useState(false);

  const set = <K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const officerOptions = [
    { value: "", label: "Assign later" },
    ...(officers.data ?? []).map((o) => ({
      value: o.id,
      label: `${o.roleLabel} ${o.name}${o.stationName ? ` · ${o.stationName}` : ""} (${o.openCases} open)`,
    })),
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Validation Error", "Correct the highlighted fields");
      return;
    }
    if (!verified) {
      toast.warning("Verification Required", "Confirm the information is recorded as stated by the complainant.");
      return;
    }
    try {
      const fir = await createFIR.mutateAsync({
        complainantName: form.complainantName.trim(),
        complainantPhone: form.complainantPhone || null,
        complainantAddress: form.complainantAddress.trim() || null,
        complainantIdType: form.complainantIdType || null,
        complainantIdNumber: form.complainantIdNumber.trim() || null,
        incidentDate: `${form.incidentDate}T00:00:00Z`,
        incidentTime: form.incidentTime || null,
        incidentLocation: form.incidentLocation.trim(),
        incidentDescription: form.incidentDescription.trim(),
        ipcSections: form.sections,
        priority: form.priority,
        investigatingOfficer: form.investigatingOfficer || null,
      });
      toast.success("FIR Registered", `FIR ${fir.firNumber} has been registered`);
      router.push(`/fir/${fir.id}`);
    } catch (err) {
      toast.error("FIR not registered", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  const descriptionLength = form.incidentDescription.trim().length;

  return (
    <DashboardLayout>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" onClick={() => router.back()} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Register New FIR</h1>
            <p className="text-foreground-muted">
              The FIR number is issued by the server under your station&apos;s code on registration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Complainant Details */}
            <Card>
              <CardHeader>
                <CardTitle>Complainant Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Name *"
                  placeholder="Full name of complainant"
                  value={form.complainantName}
                  onChange={(v: string) => set("complainantName", v)}
                  error={errors.complainantName}
                />
                <Textarea
                  label="Address"
                  placeholder="Residential address"
                  rows={2}
                  value={form.complainantAddress}
                  onChange={(v: string) => set("complainantAddress", v)}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="9876543210"
                    value={form.complainantPhone}
                    onChange={(v: string) => set("complainantPhone", v.replace(/\D/g, "").slice(0, 10))}
                    error={errors.complainantPhone}
                  />
                  <Select
                    label="ID Type"
                    options={idTypes}
                    value={form.complainantIdType}
                    onChange={(v: string) => set("complainantIdType", v)}
                  />
                  <Input
                    label="ID Number"
                    placeholder="ID number"
                    value={form.complainantIdNumber}
                    onChange={(v: string) => set("complainantIdNumber", v)}
                    disabled={!form.complainantIdType}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date of Incident *"
                    type="date"
                    value={form.incidentDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(v: string) => set("incidentDate", v)}
                    error={errors.incidentDate}
                  />
                  <Input
                    label="Time of Incident"
                    type="time"
                    value={form.incidentTime}
                    onChange={(v: string) => set("incidentTime", v)}
                  />
                </div>
                <Input
                  label="Incident Location *"
                  placeholder="Address or landmark, e.g. Gariahat Road near Rashbehari crossing"
                  value={form.incidentLocation}
                  onChange={(v: string) => set("incidentLocation", v)}
                  icon={<MapPin className="h-4 w-4" />}
                  error={errors.incidentLocation}
                />
                <SectionPicker value={form.sections} onChange={(s) => set("sections", s)} error={errors.sections} />
              </CardContent>
            </Card>

            {/* Incident Description */}
            <Card>
              <CardHeader>
                <CardTitle>Incident Description *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  placeholder="The incident as narrated by the complainant..."
                  rows={8}
                  value={form.incidentDescription}
                  onChange={(v: string) => set("incidentDescription", v)}
                  error={!!errors.incidentDescription}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground-muted">
                    Characters: {descriptionLength}/{MIN_DESCRIPTION} minimum
                  </span>
                  {descriptionLength >= MIN_DESCRIPTION && (
                    <Badge variant="success" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Minimum met
                    </Badge>
                  )}
                </div>
                {errors.incidentDescription && <p className="text-sm text-error">{errors.incidentDescription}</p>}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registration Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-foreground-muted">Station</span>
                  <span className="text-foreground font-medium text-right">{user?.stationName || "Your station"}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-foreground-muted">Recording Officer</span>
                  <span className="text-foreground font-medium text-right">{user?.name}</span>
                </div>
                {user?.badgeNumber && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-foreground-muted">Badge Number</span>
                    <span className="text-foreground font-mono">{user.badgeNumber}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Handling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Priority"
                  options={priorityOptions}
                  value={form.priority}
                  onChange={(v: string) => set("priority", v as FIRPriority)}
                />
                <Select
                  label="Investigating Officer"
                  options={officerOptions}
                  value={form.investigatingOfficer}
                  onChange={(v: string) => set("investigatingOfficer", v)}
                />
                {officers.isError && (
                  <p className="text-xs text-error">Officer directory could not be loaded; assign the IO later.</p>
                )}
                <p className="text-xs text-foreground-muted">
                  Evidence is registered against the FIR from the evidence register after registration.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="p-3 rounded-md bg-background-tertiary">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="rounded mt-0.5"
                      checked={verified}
                      onChange={(e) => setVerified(e.target.checked)}
                    />
                    <span className="text-foreground-muted">
                      I verify that the above information is recorded accurately as stated by the complainant.
                    </span>
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={!verified || createFIR.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  {createFIR.isPending ? "Registering..." : "Register FIR"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
