"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, PageHeader, Panel } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { useI18n } from "@/lib/i18n";
import { useCreateChallan, useViolationTypes } from "@/hooks/use-legacy-registers";
import { VEHICLE_TYPES, type ChallanVehicleType } from "@/lib/api/traffic-challans";
import { TL, VEHICLE_TYPE_LABEL, rupees } from "../../labels";

const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function IssueChallanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { pick } = useI18n();
  const canIssue = Boolean(user && hasMinimumRole(user.role, "CONSTABLE"));
  const types = useViolationTypes();
  const create = useCreateChallan();

  const [form, setForm] = useState({
    violationTypeId: "",
    when: nowLocal(),
    location: "",
    latitude: "",
    longitude: "",
    description: "",
    vehicleNumber: "",
    vehicleType: "FOUR_WHEELER" as ChallanVehicleType,
    vehicleMake: "",
    vehicleModel: "",
    vehicleColor: "",
    ownerName: "",
    ownerPhone: "",
    driverName: "",
    driverLicence: "",
    driverPhone: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const selected = (types.data ?? []).find((t) => t.id === form.violationTypeId);
  const opt = (v: string) => (v.trim() ? v.trim() : undefined);

  const submit = async () => {
    if (!form.violationTypeId || !form.when || !form.location.trim() || !form.vehicleNumber.trim()) {
      toast.error(pick(TL.failed), pick(TL.required));
      return;
    }
    if (Boolean(form.latitude.trim()) !== Boolean(form.longitude.trim())) {
      toast.error(pick(TL.failed), pick(TL.coordsPair));
      return;
    }
    try {
      const challan = await create.mutateAsync({
        violation_type_id: form.violationTypeId,
        violation_date: new Date(form.when).toISOString(),
        violation_location: form.location.trim(),
        violation_latitude: form.latitude.trim() ? Number(form.latitude) : undefined,
        violation_longitude: form.longitude.trim() ? Number(form.longitude) : undefined,
        violation_description: opt(form.description),
        vehicle_number: form.vehicleNumber,
        vehicle_type: form.vehicleType,
        vehicle_make: opt(form.vehicleMake),
        vehicle_model: opt(form.vehicleModel),
        vehicle_color: opt(form.vehicleColor),
        owner_name: opt(form.ownerName),
        owner_phone: opt(form.ownerPhone),
        driver_name: opt(form.driverName),
        driver_license_number: opt(form.driverLicence),
        driver_phone: opt(form.driverPhone),
      });
      toast.success(pick(TL.issued), `${challan.challan_number} · ${challan.vehicle_number}`);
      router.push(`/traffic/challans/${challan.id}`);
    } catch (err) {
      toast.error(pick(TL.failed), err instanceof Error ? err.message : "");
    }
  };

  if (!canIssue) {
    return (
      <DashboardLayout>
        <EmptyState icon={ClipboardList} title={pick(TL.issueTitle)} description={pick(TL.issueRestricted)} />
      </DashboardLayout>
    );
  }

  const selectClass = "h-10 w-full rounded-md border border-border bg-background-secondary px-3 text-sm text-foreground";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={pick(TL.issueTitle)}
          description={pick(TL.issueDescription)}
          icon={ClipboardList}
          breadcrumb={[{ label: pick(TL.title), href: "/traffic" }, { label: pick(TL.issue) }]}
        />

        <Panel title={pick(TL.violationDetails)} bodyClassName="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground md:col-span-2">
            {pick(TL.violation)} *
            <select
              className={selectClass}
              value={form.violationTypeId}
              onChange={(e) => set("violationTypeId")(e.target.value)}
              disabled={types.isPending}
            >
              <option value="">{types.isPending ? pick(TL.loading) : pick(TL.chooseViolation)}</option>
              {(types.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} · {t.name} · {t.section} · {rupees(t.fine_amount)}
                </option>
              ))}
            </select>
            {types.isError && <span className="text-xs text-error">{types.error.message}</span>}
          </label>
          {selected && (
            <p className="text-sm text-foreground-muted md:col-span-2">
              {pick(TL.fine)}: {rupees(selected.fine_amount)} · {pick(TL.section)} {selected.section}
              {selected.vehicle_seizure ? ` · ${pick(TL.seizure)}` : ""}
            </p>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {pick(TL.date)} *
            <input type="datetime-local" className={selectClass} value={form.when} onChange={(e) => set("when")(e.target.value)} />
          </label>
          <Input label={`${pick(TL.location)} *`} placeholder="Gariahat crossing, Kolkata 700019" value={form.location} onChange={set("location")} />
          <Input label={pick(TL.latitude)} placeholder="22.5184" value={form.latitude} onChange={set("latitude")} />
          <Input label={pick(TL.longitude)} placeholder="88.3656" value={form.longitude} onChange={set("longitude")} />
          <div className="md:col-span-2">
            <Textarea label={pick(TL.details)} value={form.description} onChange={set("description")} rows={2} />
          </div>
        </Panel>

        <Panel title={pick(TL.vehicleDetails)} bodyClassName="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
          <Input label={`${pick(TL.vehicle)} *`} placeholder="WB 06 AB 1234" value={form.vehicleNumber} onChange={set("vehicleNumber")} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {pick(TL.type)} *
            <select className={selectClass} value={form.vehicleType} onChange={(e) => set("vehicleType")(e.target.value)}>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {pick(VEHICLE_TYPE_LABEL[t])}
                </option>
              ))}
            </select>
          </label>
          <Input label={pick(TL.make)} placeholder="Maruti Suzuki" value={form.vehicleMake} onChange={set("vehicleMake")} />
          <Input label={pick(TL.model)} value={form.vehicleModel} onChange={set("vehicleModel")} />
          <Input label={pick(TL.colour)} value={form.vehicleColor} onChange={set("vehicleColor")} />
          <div />
          <Input label={pick(TL.owner)} value={form.ownerName} onChange={set("ownerName")} />
          <Input label={`${pick(TL.owner)} · ${pick(TL.phone)}`} value={form.ownerPhone} onChange={set("ownerPhone")} />
          <div />
          <Input label={pick(TL.driver)} value={form.driverName} onChange={set("driverName")} />
          <Input label={pick(TL.licence)} placeholder="WB0620190012345" value={form.driverLicence} onChange={set("driverLicence")} />
          <Input label={`${pick(TL.driver)} · ${pick(TL.phone)}`} value={form.driverPhone} onChange={set("driverPhone")} />
        </Panel>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => router.push("/traffic")}>
            {pick(TL.cancel)}
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {create.isPending ? pick(TL.issuing) : pick(TL.issue)}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
