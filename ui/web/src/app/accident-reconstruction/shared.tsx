"use client";

import * as React from "react";
import { Eye, Gauge, Sigma } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RecordLinkPicker, type RecordLink } from "@/components/platform/pickers";
import {
  COLLISION_TYPES,
  LIGHTINGS,
  ROAD_CONDITIONS,
  WEATHERS,
  type IncidentInput,
  type Provenance,
  type TrafficFact,
  type TrafficIncident,
} from "@/lib/api/traffic-incidents";

/**
 * Converts a datetime-local value (local time) to RFC 3339 for the API. An
 * empty field is sent as null so the API reports the time as missing, rather
 * than failing to parse an empty string.
 */
export function localToApi(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

/** Converts an API timestamp to a datetime-local value in the viewer's time zone. */
export function apiToLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatWhen(value: string | null | undefined, withSeconds = false): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: withSeconds ? "medium" : "short",
  });
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const selectClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function NativeSelect<T extends string>({
  id,
  value,
  options,
  onChange,
  label,
  allowEmpty,
}: {
  id: string;
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (value: T | "") => void;
  label: string;
  allowEmpty?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T | "")} className={selectClass}>
        {allowEmpty !== undefined && <option value="">{allowEmpty}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Provenance marker. The three kinds differ in shape as well as colour, so an
 * estimate cannot be mistaken for a measurement in print or by a colour-blind
 * reader: measured is solid, observed is outlined, estimated is dashed and
 * prefixed with ≈.
 */
export function ProvenanceBadge({ provenance, className }: { provenance: Provenance; className?: string }) {
  const { t } = useI18n();
  const Icon = provenance === "MEASURED" ? Gauge : provenance === "OBSERVED" ? Eye : Sigma;
  return (
    <span
      title={t(`accidentScreen.provenance.${provenance}Hint`)}
      data-provenance={provenance}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
        provenance === "MEASURED" && "border border-success bg-success text-white",
        provenance === "OBSERVED" && "border border-info bg-info-subtle text-info",
        provenance === "ESTIMATED" && "border border-dashed border-warning bg-warning-subtle italic text-warning",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {provenance === "ESTIMATED" && "≈ "}
      {t(`accidentScreen.provenance.${provenance}`)}
    </span>
  );
}

/** A fact's value: a point for measured and observed, a range only for estimates. */
export function FactValue({ fact }: { fact: TrafficFact }) {
  if (!fact.quantity) return null;
  if (fact.valueLow !== null && fact.valueHigh !== null) {
    return (
      <span className="font-mono text-sm italic text-warning">
        ≈ {fact.valueLow}–{fact.valueHigh} {fact.unit}
      </span>
    );
  }
  return (
    <span className={cn("font-mono text-sm", fact.provenance === "ESTIMATED" && "italic text-warning")}>
      {fact.provenance === "ESTIMATED" ? "≈ " : ""}
      {fact.value} {fact.unit}
    </span>
  );
}

/** Form state: the time is a datetime-local string until it is sent. */
export type IncidentForm = Omit<IncidentInput, "occurredAt"> & { occurredAt: string };

export function incidentFormToInput(form: IncidentForm): IncidentInput {
  return { ...form, occurredAt: localToApi(form.occurredAt) };
}

export function emptyIncidentForm(): IncidentForm {
  return {
    occurredAt: "",
    location: "",
    latitude: null,
    longitude: null,
    firId: null,
    collisionType: "SIDE_IMPACT",
    roadCondition: "DRY",
    weather: "CLEAR",
    lighting: "DAYLIGHT",
    description: "",
  };
}

export function incidentToForm(i: TrafficIncident): IncidentForm {
  return {
    occurredAt: apiToLocal(i.occurredAt),
    location: i.location,
    latitude: i.latitude,
    longitude: i.longitude,
    firId: i.firId,
    collisionType: i.collisionType,
    roadCondition: i.roadCondition,
    weather: i.weather,
    lighting: i.lighting,
    description: i.description,
  };
}

/** Incident fields, used by both registration and editing. occurredAt is a datetime-local value here. */
export function IncidentFields({
  form,
  setForm,
  firLink,
  setFirLink,
}: {
  form: IncidentForm;
  setForm: (f: IncidentForm) => void;
  firLink: RecordLink | null;
  setFirLink: (l: RecordLink | null) => void;
}) {
  const { t } = useI18n();
  const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="ti-loc">{t("accidentScreen.fields.location")}</Label>
        <Input
          id="ti-loc"
          value={form.location}
          onChange={(v: string) => setForm({ ...form, location: v })}
          placeholder={t("accidentScreen.fields.locationHint")}
        />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="ti-when">{t("accidentScreen.fields.occurredAt")}</Label>
        <Input
          id="ti-when"
          type="datetime-local"
          step={1}
          value={form.occurredAt}
          onChange={(v: string) => setForm({ ...form, occurredAt: v })}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ti-lat">{t("accidentScreen.fields.latitude")}</Label>
        <Input
          id="ti-lat"
          inputMode="decimal"
          value={form.latitude === null ? "" : String(form.latitude)}
          onChange={(v: string) => setForm({ ...form, latitude: num(v) })}
          placeholder="22.5147"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ti-lng">{t("accidentScreen.fields.longitude")}</Label>
        <Input
          id="ti-lng"
          inputMode="decimal"
          value={form.longitude === null ? "" : String(form.longitude)}
          onChange={(v: string) => setForm({ ...form, longitude: num(v) })}
          placeholder="88.4017"
        />
      </div>
      <NativeSelect
        id="ti-collision"
        label={t("accidentScreen.fields.collisionType")}
        value={form.collisionType}
        options={COLLISION_TYPES.map((v) => ({ value: v, label: t(`accidentScreen.enums.collision.${v}`) }))}
        onChange={(v) => v && setForm({ ...form, collisionType: v })}
      />
      <NativeSelect
        id="ti-road"
        label={t("accidentScreen.fields.roadCondition")}
        value={form.roadCondition}
        options={ROAD_CONDITIONS.map((v) => ({ value: v, label: t(`accidentScreen.enums.road.${v}`) }))}
        onChange={(v) => v && setForm({ ...form, roadCondition: v })}
      />
      <NativeSelect
        id="ti-weather"
        label={t("accidentScreen.fields.weather")}
        value={form.weather}
        options={WEATHERS.map((v) => ({ value: v, label: t(`accidentScreen.enums.weather.${v}`) }))}
        onChange={(v) => v && setForm({ ...form, weather: v })}
      />
      <NativeSelect
        id="ti-light"
        label={t("accidentScreen.fields.lighting")}
        value={form.lighting}
        options={LIGHTINGS.map((v) => ({ value: v, label: t(`accidentScreen.enums.lighting.${v}`) }))}
        onChange={(v) => v && setForm({ ...form, lighting: v })}
      />
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="ti-desc">{t("accidentScreen.fields.description")}</Label>
        <Textarea
          id="ti-desc"
          rows={3}
          value={form.description}
          onChange={(v: string) => setForm({ ...form, description: v })}
        />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label>{t("accidentScreen.fields.fir")}</Label>
        <RecordLinkPicker
          value={firLink}
          onChange={(link) => {
            setFirLink(link);
            setForm({ ...form, firId: link ? (link.kind === "fir" ? link.id : link.firId) : null });
          }}
        />
      </div>
    </div>
  );
}
