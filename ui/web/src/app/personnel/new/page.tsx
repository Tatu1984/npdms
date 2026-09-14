"use client";

import { useDeferredValue, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Search, Check, X, AlertTriangle, UserCheck, Info, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useCreatePersonnel, usePersonnel } from "@/hooks/use-personnel";
import { useOfficers } from "@/hooks/use-investigation";
import type { Officer } from "@/lib/api/investigation";
import type { PersonnelRank, PersonnelStatus } from "@/lib/api/personnel";

const ranks: Array<{ value: PersonnelRank; label: string }> = [
  { value: "CONSTABLE", label: "Constable" },
  { value: "HEAD_CONSTABLE", label: "Head Constable" },
  { value: "ASI", label: "Assistant Sub-Inspector" },
  { value: "SI", label: "Sub-Inspector" },
  { value: "INSPECTOR", label: "Inspector" },
  { value: "SHO", label: "Station House Officer" },
  { value: "DSP", label: "Deputy SP" },
  { value: "SP", label: "Superintendent of Police" },
  { value: "DIG", label: "Deputy Inspector General" },
  { value: "IG", label: "Inspector General" },
  { value: "DGP", label: "Director General of Police" },
];

const statuses: Array<{ value: PersonnelStatus; label: string }> = [
  { value: "OFF_DUTY", label: "Off Duty" },
  { value: "ON_DUTY", label: "On Duty" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "TRAINING", label: "Training" },
];

const shiftOptions = [
  { value: "", label: "No shift" },
  { value: "Day (0600-1400)", label: "Day Shift (06:00 - 14:00)" },
  { value: "Evening (1400-2200)", label: "Evening Shift (14:00 - 22:00)" },
  { value: "Night (2200-0600)", label: "Night Shift (22:00 - 06:00)" },
  { value: "Full Day (0800-2000)", label: "Full Day (08:00 - 20:00)" },
  { value: "On Call", label: "On Call" },
];

/** A date input yields YYYY-MM-DD; the API's time.Time fields need RFC 3339. */
const toApiDate = (day: string) => `${day}T00:00:00Z`;

const isRank = (role: string): role is PersonnelRank => ranks.some((r) => r.value === role);

export default function NewPersonnelPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const createPersonnel = useCreatePersonnel();

  const [accountSearch, setAccountSearch] = useState("");
  const deferredSearch = useDeferredValue(accountSearch.trim());
  const [account, setAccount] = useState<Officer | null>(null);
  const [formData, setFormData] = useState({
    badgeNumber: "",
    rank: "" as PersonnelRank | "",
    status: "OFF_DUTY" as PersonnelStatus,
    joiningDate: "",
    currentDuty: "",
    shift: "",
  });

  // Mirrors the API: creating a service record needs SHO or above.
  const canCreate = user && hasMinimumRole(user.role, "SHO");

  const officers = useOfficers(deferredSearch || undefined);

  // A user account should carry one service record. The API does not enforce
  // this, so check before linking.
  const existing = usePersonnel(
    // Search by account name: the record's badge need not match the account's.
    account ? { search: account.name, pageSize: 50 } : { pageSize: 1 }
  );
  const alreadyLinked = Boolean(account && existing.data?.data.some((p) => p.userId === account.id));

  const pickAccount = (officer: Officer) => {
    setAccount(officer);
    setFormData((f) => ({
      ...f,
      badgeNumber: officer.badgeNumber ?? "",
      rank: isRank(officer.role) ? officer.role : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      addToast({ type: "error", title: "Validation Error", message: "Choose the officer's user account" });
      return;
    }
    if (!account.stationId) {
      addToast({
        type: "error",
        title: "No station on account",
        message: "This user account has no posting station. Set one on the account first.",
      });
      return;
    }
    if (!formData.badgeNumber.trim() || !formData.rank || !formData.joiningDate) {
      addToast({ type: "error", title: "Validation Error", message: "Please fill in all required fields" });
      return;
    }

    try {
      const created = await createPersonnel.mutateAsync({
        userId: account.id,
        badgeNumber: formData.badgeNumber.trim(),
        rank: formData.rank,
        status: formData.status,
        stationId: account.stationId,
        joiningDate: toApiDate(formData.joiningDate),
        currentDuty: formData.currentDuty.trim() || null,
        shift: formData.shift || null,
      });
      addToast({
        type: "success",
        title: "Service Record Created",
        message: `${created.name} is on the roster with badge ${created.badgeNumber}`,
      });
      router.push(`/personnel/${created.id}`);
    } catch (error) {
      addToast({
        type: "error",
        title: "Service record not created",
        message: error instanceof Error ? error.message : "The server rejected the request",
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
            <p className="text-foreground-muted">You need SHO level or above to add personnel.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add Officer to Roster</h1>
            <p className="text-foreground-muted">Create a service record for an officer who already has a user account</p>
          </div>
          <Button variant="secondary" onClick={() => router.back()}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* User Account */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    User Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {account ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="font-medium text-foreground">{account.name}</p>
                          <p className="text-sm text-foreground-muted">
                            {[account.roleLabel, account.badgeNumber, account.stationName].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setAccount(null)}>
                          Change
                        </Button>
                      </div>
                      {alreadyLinked && (
                        <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          This account already has a service record on the roster.
                        </div>
                      )}
                      {!account.stationId && (
                        <div className="flex items-start gap-2 rounded-lg bg-error/10 p-3 text-sm text-error">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          This account has no posting station, which a service record requires.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        label="Officer *"
                        placeholder="Search by name, badge number or username"
                        value={accountSearch}
                        onChange={setAccountSearch}
                        icon={<Search className="h-4 w-4" />}
                      />
                      <div className="rounded-lg border border-border divide-y divide-border max-h-64 overflow-y-auto">
                        {officers.isPending ? (
                          <p className="p-3 text-sm text-foreground-muted">Searching accounts…</p>
                        ) : officers.isError ? (
                          <p className="p-3 text-sm text-error">Accounts could not be loaded: {officers.error.message}</p>
                        ) : officers.data.length === 0 ? (
                          <p className="p-3 text-sm text-foreground-muted">No active accounts match</p>
                        ) : (
                          officers.data.map((officer) => (
                            <button
                              key={officer.id}
                              type="button"
                              className="w-full text-left p-3 hover:bg-background-tertiary"
                              onClick={() => pickAccount(officer)}
                            >
                              <span className="text-sm text-foreground">{officer.name}</span>
                              <span className="block text-xs text-foreground-muted">
                                {[officer.roleLabel, officer.badgeNumber, officer.stationName].filter(Boolean).join(" · ")}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Service Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Badge Number *"
                      placeholder="e.g. KP-SI-0421"
                      value={formData.badgeNumber}
                      onChange={(v: string) => setFormData({ ...formData, badgeNumber: v })}
                    />
                    <Select
                      label="Rank *"
                      value={formData.rank}
                      onChange={(v: string) => setFormData({ ...formData, rank: v as PersonnelRank })}
                      options={[{ value: "", label: "Select rank" }, ...ranks]}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Date of Joining *"
                      type="date"
                      value={formData.joiningDate}
                      onChange={(v: string) => setFormData({ ...formData, joiningDate: v })}
                    />
                    <Select
                      label="Initial Status"
                      value={formData.status}
                      onChange={(v: string) => setFormData({ ...formData, status: v as PersonnelStatus })}
                      options={statuses}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Current Duty"
                      placeholder="e.g. Station Duty"
                      value={formData.currentDuty}
                      onChange={(v: string) => setFormData({ ...formData, currentDuty: v })}
                    />
                    <Select
                      label="Shift"
                      value={formData.shift}
                      onChange={(v: string) => setFormData({ ...formData, shift: v })}
                      options={shiftOptions}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    What this records
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-foreground-muted">
                  <p>
                    A service record links an existing user account to the station roster: badge, rank, posting,
                    joining date and duty.
                  </p>
                  <p>
                    Name, phone and email come from the user account and are not edited here. Officers without an
                    account need one created by an administrator first.
                  </p>
                  <p>
                    Posting station:{" "}
                    <span className="text-foreground">
                      {account ? account.stationName || "none on account" : "taken from the chosen account"}
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full"
                disabled={createPersonnel.isPending || !account || !account.stationId || alreadyLinked}
              >
                {createPersonnel.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Add to Roster
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
