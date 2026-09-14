"use client";

import { Suspense, useDeferredValue, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Save, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SectionPicker } from "@/components/ui/SectionPicker";
import { useCreateCase } from "@/hooks/use-cases";
import { useFIR, useFIRs } from "@/hooks/use-firs";
import { useOfficers } from "@/hooks/use-investigation";
import { toast } from "@/stores/toastStore";
import type { FIR } from "@/lib/api/firs";
import type { CasePriority } from "@/lib/api/cases";
import { formatDate } from "@/lib/utils";

const caseCategories = [
  { value: "", label: "Select Category" },
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

function FIRPicker({ onPick }: { onPick: (fir: FIR) => void }) {
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.trim());
  const results = useFIRs({ search: search || undefined, pageSize: 8 });

  return (
    <div className="space-y-2">
      <Input
        label="FIR *"
        placeholder="Search by FIR number, complainant or description"
        value={query}
        onChange={(v: string) => setQuery(v)}
        icon={<Search className="h-4 w-4" />}
      />
      <div className="rounded-lg border border-border divide-y divide-border max-h-64 overflow-y-auto">
        {results.isPending ? (
          <p className="p-3 text-sm text-foreground-muted">Searching the FIR register…</p>
        ) : results.isError ? (
          <p className="p-3 text-sm text-error">FIRs could not be loaded: {results.error.message}</p>
        ) : results.data.data.length === 0 ? (
          <p className="p-3 text-sm text-foreground-muted">No matching FIRs</p>
        ) : (
          results.data.data.map((fir) => (
            <button
              key={fir.id}
              type="button"
              className="w-full text-left p-3 hover:bg-background-tertiary"
              onClick={() => onPick(fir)}
            >
              <span className="font-mono text-sm text-foreground">{fir.firNumber}</span>
              <span className="text-xs text-foreground-muted ml-2">{fir.status.replace(/_/g, " ")}</span>
              <span className="block text-xs text-foreground-muted">
                {fir.complainantName} · {formatDate(fir.incidentDate)} · {fir.ipcSections.join(", ")}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function NewCaseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createCase = useCreateCase();
  const officers = useOfficers();

  const [fir, setFir] = useState<FIR | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<CasePriority>("MEDIUM");
  const [synopsis, setSynopsis] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [investigatingOfficer, setInvestigatingOfficer] = useState("");

  // /cases/new?firId=… (from an FIR's detail page) preselects that FIR.
  const preselectedId = searchParams.get("firId") ?? "";
  const preselected = useFIR(preselectedId);

  const pick = (chosen: FIR) => {
    setFir(chosen);
    // Start from what the FIR records; the officer can change any of it.
    setSections((current) => (current.length > 0 ? current : chosen.ipcSections));
    setPriority(chosen.priority);
    setInvestigatingOfficer((current) => current || chosen.investigatingOfficer || "");
  };

  useEffect(() => {
    if (preselected.data && !fir) pick(preselected.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselected.data]);

  const officerOptions = [
    { value: "", label: "Assign later" },
    ...(officers.data ?? []).map((o) => ({
      value: o.id,
      label: `${o.roleLabel} ${o.name}${o.stationName ? ` · ${o.stationName}` : ""} (${o.openCases} open)`,
    })),
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fir) {
      toast.error("Validation Error", "Choose the FIR this case is registered on");
      return;
    }
    if (title.trim().length < 5) {
      toast.error("Validation Error", "Case title must be at least 5 characters");
      return;
    }
    if (sections.length === 0) {
      toast.error("Validation Error", "Select at least one section");
      return;
    }
    try {
      const created = await createCase.mutateAsync({
        firId: fir.id,
        title: title.trim(),
        category: category || null,
        priority,
        synopsis: synopsis.trim() || null,
        ipcSections: sections,
        investigatingOfficer: investigatingOfficer || null,
      });
      toast.success("Case Registered", `${created.caseNumber} has been registered on FIR ${fir.firNumber}`);
      router.push(`/cases/${created.id}`);
    } catch (err) {
      toast.error("Case not registered", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" onClick={() => router.back()} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Register New Case</h1>
          <p className="text-foreground-muted">A case is opened on a registered FIR; its number is issued by the server</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                FIR
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fir ? (
                <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <Link href={`/fir/${fir.id}`} className="font-mono text-accent hover:underline">
                      {fir.firNumber}
                    </Link>
                    <Badge variant="secondary" className="ml-2">
                      {fir.status.replace(/_/g, " ")}
                    </Badge>
                    <p className="text-sm text-foreground-muted mt-1">
                      {fir.complainantName} · {formatDate(fir.incidentDate)} · {fir.incidentLocation}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFir(null)}>
                    Change
                  </Button>
                </div>
              ) : preselectedId && preselected.isPending ? (
                <p className="flex items-center gap-2 text-sm text-foreground-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading FIR…
                </p>
              ) : (
                <>
                  {preselectedId && preselected.isError && (
                    <p className="text-sm text-error mb-2">
                      The linked FIR could not be loaded ({preselected.error.message}). Choose it from the register.
                    </p>
                  )}
                  <FIRPicker onPick={pick} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Case Title *"
                placeholder="e.g. Chain snatching on Rashbehari Avenue"
                value={title}
                onChange={(v: string) => setTitle(v)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Category" options={caseCategories} value={category} onChange={setCategory} />
                <Select
                  label="Priority"
                  options={priorities}
                  value={priority}
                  onChange={(v: string) => setPriority(v as CasePriority)}
                />
              </div>
              <Textarea
                label="Synopsis"
                placeholder="Brief facts of the case"
                rows={5}
                value={synopsis}
                onChange={(v: string) => setSynopsis(v)}
              />
              <SectionPicker value={sections} onChange={setSections} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Investigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                label="Investigating Officer"
                options={officerOptions}
                value={investigatingOfficer}
                onChange={setInvestigatingOfficer}
              />
              {officers.isError && (
                <p className="text-xs text-error">Officer directory could not be loaded; assign the IO later.</p>
              )}
              <p className="text-xs text-foreground-muted">
                Accused and witnesses are added from the case page once it is registered.
              </p>
            </CardContent>
          </Card>
          <Button type="submit" className="w-full" disabled={createCase.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createCase.isPending ? "Registering..." : "Register Case"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function NewCasePage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center gap-3 text-foreground-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        }
      >
        <NewCaseForm />
      </Suspense>
    </DashboardLayout>
  );
}
