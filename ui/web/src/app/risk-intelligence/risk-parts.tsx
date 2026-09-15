"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ApiClientError } from "@/lib/api/client";
import type { RiskArea, RiskBeat, RiskQuery, RiskWeightSet, RiskFactorDefinition } from "@/lib/api/risk";
import {
  useCreateRiskBeat,
  useDeleteRiskBeat,
  usePlaceRiskFIR,
  useRiskFIRs,
  useRiskWeightHistory,
  useSimulateRisk,
  useUnplaceRiskFIR,
  useUpdateRiskWeights,
} from "@/hooks/use-risk";
import { toast } from "@/stores/toastStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Officers see the API's own sentence, never a raw request-binding message
 * such as "Key: 'X' Error:Field validation for 'X' failed on the 'required' tag".
 */
export function officerMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  if (err instanceof ApiClientError && err.code === 429) {
    return "Too many requests in the last minute. Wait a moment and try again.";
  }
  if (!msg || /^Key: '|Error:Field validation|^json: |cannot unmarshal|^invalid character/.test(msg)) {
    return "Some required details are missing or not in the expected form. Check the fields and try again.";
  }
  return msg;
}

const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

export function NumberField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={props.id}>{props.label}</Label>
      <input
        id={props.id}
        type="number"
        inputMode="decimal"
        className={inputClass}
        value={props.value}
        step={props.step}
        min={props.min}
        max={props.max}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  );
}

export function TextField(props: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={props.id}>{props.label}</Label>
      <input id={props.id} className={inputClass} value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    </div>
  );
}

/** The documented weighted sum for one area, every factor shown. */
export function FactorTable({ area }: { area: RiskArea }) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid={`factors-${area.id}`}>
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
            <th className="py-2 pr-3 font-medium">{t("riskScreen.table.factor")}</th>
            <th className="py-2 pr-3 text-right font-medium">{t("riskScreen.table.raw")}</th>
            <th className="py-2 pr-3 text-right font-medium">{t("riskScreen.table.weight")}</th>
            <th className="py-2 text-right font-medium">{t("riskScreen.table.contribution")}</th>
          </tr>
        </thead>
        <tbody>
          {area.factors.map((f) => (
            <tr key={f.key} className="border-b border-border/60 align-top" data-factor={f.key}>
              <td className="py-2 pr-3">
                <p className="text-foreground">{f.label}</p>
                <p className="text-xs text-foreground-muted">{f.description}</p>
                {!f.attributable && (
                  <p className="text-xs text-warning">{t("riskScreen.table.notAttributable")}</p>
                )}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums" data-cell="raw">{f.raw}</td>
              <td className="py-2 pr-3 text-right tabular-nums" data-cell="weight">× {f.weight}</td>
              <td className="py-2 text-right tabular-nums font-medium" data-cell="contribution">{f.contribution.toFixed(2)}</td>
            </tr>
          ))}
          <tr>
            <td className="py-2 pr-3 font-semibold text-foreground" colSpan={3}>{t("riskScreen.table.total")}</td>
            <td className="py-2 text-right text-base font-semibold tabular-nums" data-cell="score">{area.score.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function SimulationDialog({
  open,
  onOpenChange,
  query,
  areas,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  query: RiskQuery;
  areas: RiskArea[];
}) {
  const { t } = useI18n();
  const simulate = useSimulateRisk();
  const [units, setUnits] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    if (!open) {
      setUnits({});
      simulate.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const run = async () => {
    const allocations = areas.map((a) => ({ areaId: a.id, units: Number(units[a.id] || 0) }));
    if (allocations.some((al) => !Number.isInteger(al.units) || al.units < 0 || al.units > 100)) {
      toast.error(t("riskScreen.simulation.title"), "Units must be whole numbers from 0 to 100.");
      return;
    }
    try {
      await simulate.mutateAsync({ q: query, allocations });
    } catch (err) {
      toast.error(t("riskScreen.simulation.title"), officerMessage(err));
    }
  };
  const r = simulate.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("riskScreen.simulation.title")}</DialogTitle>
          <DialogDescription>{t("riskScreen.simulation.description")}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                <th className="py-2 pr-2 font-medium">{t("riskScreen.table.area")}</th>
                <th className="py-2 pr-2 text-right font-medium">{t("riskScreen.table.total")}</th>
                <th className="py-2 pr-2 text-right font-medium">{t("riskScreen.simulation.units")}</th>
                {r && <th className="py-2 pr-2 text-right font-medium">{t("riskScreen.simulation.share")}</th>}
                {r && <th className="py-2 text-right font-medium">{t("riskScreen.simulation.covered")}</th>}
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => {
                const row = r?.rows.find((x) => x.areaId === a.id);
                return (
                  <tr key={a.id} className="border-b border-border/60">
                    <td className="py-1.5 pr-2 text-foreground">{a.name}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{a.score.toFixed(2)}</td>
                    <td className="py-1.5 pr-2 text-right">
                      <input
                        aria-label={`${t("riskScreen.simulation.units")} — ${a.name}`}
                        type="number"
                        min="0"
                        max="100"
                        className="h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-sm"
                        value={units[a.id] ?? ""}
                        placeholder="0"
                        onChange={(e) => setUnits({ ...units, [a.id]: e.target.value })}
                      />
                    </td>
                    {r && <td className="py-1.5 pr-2 text-right tabular-nums">{row ? `${row.share.toFixed(2)}%` : "—"}</td>}
                    {r && <td className="py-1.5 text-right">{row?.covered ? "✓" : "—"}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {r && (
          <div className="rounded-md border border-border bg-surface-sunken p-3 text-sm" data-testid="simulation-result">
            <p className="font-medium text-foreground">
              {t("riskScreen.simulation.result", {
                covered: r.coveredScore.toFixed(2),
                total: r.totalScore.toFixed(2),
                percent: r.coveragePercent.toFixed(2),
                areas: r.areasCovered,
                scoring: r.areasWithScore,
                units: r.unitsAllocated,
              })}
            </p>
            {r.uncoveredScoringAreas.length > 0 && (
              <p className="mt-1 text-foreground-muted">
                {t("riskScreen.simulation.uncovered", { list: r.uncoveredScoringAreas.join(", ") })}
              </p>
            )}
            <p className="mt-2 text-xs text-foreground-muted">{r.method}</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
          <Button onClick={run} disabled={simulate.isPending || areas.length === 0}>
            {t("riskScreen.simulation.run")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WeightsDialog({
  open,
  onOpenChange,
  factors,
  current,
  canEdit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  factors: RiskFactorDefinition[];
  current: RiskWeightSet;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const update = useUpdateRiskWeights();
  const history = useRiskWeightHistory(open);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [reason, setReason] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setValues(Object.fromEntries(factors.map((f) => [f.key, String(current.weights[f.key] ?? 0)])));
      setReason("");
    }
  }, [open, factors, current]);

  const save = async () => {
    const weights: Record<string, number> = {};
    for (const f of factors) {
      const v = Number(values[f.key]);
      if (values[f.key] === "" || !Number.isFinite(v) || v < 0 || v > 100) {
        toast.error(t("riskScreen.weights.title"), `${f.label}: enter a weight from 0 to 100.`);
        return;
      }
      weights[f.key] = v;
    }
    try {
      const ws = await update.mutateAsync({ weights, reason });
      toast.success(t("riskScreen.weights.title"), t("riskScreen.weights.saved", { version: ws.version }));
      onOpenChange(false);
    } catch (err) {
      toast.error(t("riskScreen.weights.title"), officerMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{canEdit ? t("riskScreen.weights.edit") : t("riskScreen.weights.history")}</DialogTitle>
          <DialogDescription>{canEdit ? t("riskScreen.weights.reasonHint") : t("riskScreen.weights.onlySP")}</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
          {canEdit && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                {factors.map((f) => (
                  <NumberField
                    key={f.key}
                    id={`w-${f.key}`}
                    label={f.label}
                    value={values[f.key] ?? ""}
                    step="0.25"
                    min="0"
                    max="100"
                    onChange={(v) => setValues({ ...values, [f.key]: v })}
                  />
                ))}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="w-reason">{t("riskScreen.weights.reason")}</Label>
                <textarea
                  id="w-reason"
                  className="min-h-20 rounded-md border border-border bg-background p-2 text-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground-subtle">{t("riskScreen.weights.history")}</p>
            <ul className="mt-2 flex flex-col gap-2" data-testid="weight-history">
              {history.isPending && <li className="text-sm text-foreground-muted">…</li>}
              {history.isError && <li className="text-sm text-danger">{officerMessage(history.error)}</li>}
              {history.data?.data.map((w) => (
                <li key={w.version} className="rounded-md border border-border p-2 text-sm">
                  <p className="text-xs text-foreground-muted">
                    {t("riskScreen.weights.by", {
                      version: w.version,
                      name: w.createdByName,
                      date: new Date(w.createdAt).toLocaleString("en-IN"),
                    })}
                  </p>
                  <p className="text-foreground">{w.reason}</p>
                  <p className="text-xs text-foreground-muted tabular-nums">
                    {factors.map((f) => `${f.label} ${w.weights[f.key] ?? 0}`).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
          {canEdit && (
            <Button onClick={save} disabled={update.isPending}>
              {t("riskScreen.weights.save")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateBeatDialog({
  open,
  onOpenChange,
  stations,
  defaultStation,
  canChooseStation,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  stations: { id: string; name: string }[];
  defaultStation?: string;
  canChooseStation: boolean;
}) {
  const { t } = useI18n();
  const create = useCreateRiskBeat();
  const empty = { stationId: defaultStation ?? "", name: "", description: "", latitude: "", longitude: "", radius: "500" };
  const [form, setForm] = React.useState(empty);
  React.useEffect(() => {
    if (open) setForm({ ...empty, stationId: defaultStation ?? stations[0]?.id ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = async () => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    const radius = Number(form.radius);
    if (!form.name.trim() || form.latitude === "" || form.longitude === "" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error(t("riskScreen.beats.create"), "Enter a beat name and a centre latitude and longitude.");
      return;
    }
    try {
      const beat = await create.mutateAsync({
        stationId: canChooseStation ? form.stationId || undefined : undefined,
        name: form.name,
        description: form.description,
        latitude: lat,
        longitude: lng,
        radiusMeters: Math.round(radius),
      });
      toast.success(t("riskScreen.beats.create"), t("riskScreen.beats.created", { name: beat.name }));
      onOpenChange(false);
    } catch (err) {
      toast.error(t("riskScreen.beats.create"), officerMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("riskScreen.beats.create")}</DialogTitle>
          <DialogDescription>{t("riskScreen.placement.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {canChooseStation && (
            <div className="grid gap-1.5">
              <Label htmlFor="b-station">{t("riskScreen.beats.station")}</Label>
              <select
                id="b-station"
                className={inputClass}
                value={form.stationId}
                onChange={(e) => setForm({ ...form, stationId: e.target.value })}
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <TextField id="b-name" label={t("riskScreen.beats.name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <TextField id="b-desc" label={t("riskScreen.beats.description")} value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <div className="grid grid-cols-3 gap-3">
            <NumberField id="b-lat" label={t("riskScreen.beats.latitude")} value={form.latitude} step="0.0001" onChange={(v) => setForm({ ...form, latitude: v })} />
            <NumberField id="b-lng" label={t("riskScreen.beats.longitude")} value={form.longitude} step="0.0001" onChange={(v) => setForm({ ...form, longitude: v })} />
            <NumberField id="b-radius" label={t("riskScreen.beats.radius")} value={form.radius} min="50" max="10000" onChange={(v) => setForm({ ...form, radius: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={create.isPending}>
            {t("riskScreen.beats.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BeatList({ beats }: { beats: RiskBeat[] }) {
  const { t } = useI18n();
  const remove = useDeleteRiskBeat();
  const [confirm, setConfirm] = React.useState<RiskBeat | null>(null);
  if (beats.length === 0) return <p className="text-sm text-foreground-muted">{t("riskScreen.beats.none")}</p>;
  return (
    <>
      <ul className="flex flex-col divide-y divide-border">
        {beats.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 py-2" data-beat={b.name}>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{b.name}</p>
              <p className="text-xs text-foreground-muted">
                {b.stationName} · {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)} · {b.radiusMeters} m ·{" "}
                {t("riskScreen.beats.placed", { count: b.placedFirs })}
              </p>
            </div>
            <Button variant="ghost" size="sm" aria-label={`${t("riskScreen.beats.delete")} ${b.name}`} onClick={() => setConfirm(b)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("riskScreen.beats.delete")}</DialogTitle>
            <DialogDescription>{confirm ? t("riskScreen.beats.deleteConfirm", { name: confirm.name }) : ""}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={async () => {
                if (!confirm) return;
                try {
                  await remove.mutateAsync(confirm.id);
                  toast.success(t("riskScreen.beats.delete"), t("riskScreen.beats.removed", { name: confirm.name }));
                  setConfirm(null);
                } catch (err) {
                  toast.error(t("riskScreen.beats.delete"), officerMessage(err));
                }
              }}
            >
              {t("riskScreen.beats.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PlacementPanel({
  stationId,
  from,
  to,
  beats,
}: {
  stationId?: string;
  from?: string;
  to?: string;
  beats: RiskBeat[];
}) {
  const { t } = useI18n();
  const [unplaced, setUnplaced] = React.useState(true);
  const firs = useRiskFIRs(stationId, from, to, unplaced);
  const place = usePlaceRiskFIR();
  const unplace = useUnplaceRiskFIR();
  const [choice, setChoice] = React.useState<Record<string, string>>({});
  const stationBeats = beats.filter((b) => b.stationId === stationId);

  if (!stationId) return <p className="text-sm text-foreground-muted">{t("riskScreen.placement.chooseStation")}</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-foreground-muted">{t("riskScreen.placement.description")}</p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={unplaced} onChange={(e) => setUnplaced(e.target.checked)} />
        {t("riskScreen.placement.unplacedOnly")}
      </label>
      {firs.isPending && <p className="text-sm text-foreground-muted">…</p>}
      {firs.isError && <p className="text-sm text-danger">{officerMessage(firs.error)}</p>}
      {firs.data && firs.data.data.length === 0 && (
        <p className="text-sm text-foreground-muted">{t("riskScreen.placement.none")}</p>
      )}
      <ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
        {firs.data?.data.map((f) => (
          <li key={f.firId} className="flex flex-wrap items-center justify-between gap-2 py-2" data-fir={f.firNumber}>
            <div className="min-w-0">
              <p className="font-mono text-sm text-foreground">{f.firNumber}</p>
              <p className="text-xs text-foreground-muted">
                {f.incidentDate.slice(0, 10)} {f.incidentTime} · {f.incidentLocation}
              </p>
              {f.beatId && <p className="text-xs text-success">{t("riskScreen.placement.placedIn", { beat: f.beatName })}</p>}
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label={`${t("riskScreen.placement.beat")} ${f.firNumber}`}
                className="h-8 rounded-md border border-border bg-background px-2 text-sm"
                value={choice[f.firId] ?? f.beatId ?? ""}
                onChange={(e) => setChoice({ ...choice, [f.firId]: e.target.value })}
              >
                <option value="">—</option>
                {stationBeats.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <Button
                size="sm"
                disabled={place.isPending || !(choice[f.firId] ?? f.beatId)}
                onClick={async () => {
                  const beatId = choice[f.firId] ?? f.beatId;
                  if (!beatId) return;
                  try {
                    await place.mutateAsync({ firId: f.firId, beatId });
                    const beat = stationBeats.find((b) => b.id === beatId);
                    toast.success(t("riskScreen.placement.title"), t("riskScreen.placement.done", { number: f.firNumber, beat: beat?.name ?? "" }));
                  } catch (err) {
                    toast.error(t("riskScreen.placement.title"), officerMessage(err));
                  }
                }}
              >
                {t("riskScreen.placement.place")}
              </Button>
              {f.beatId && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={unplace.isPending}
                  onClick={async () => {
                    try {
                      await unplace.mutateAsync(f.firId);
                      toast.success(t("riskScreen.placement.title"), t("riskScreen.placement.removedDone", { number: f.firNumber }));
                    } catch (err) {
                      toast.error(t("riskScreen.placement.title"), officerMessage(err));
                    }
                  }}
                >
                  {t("riskScreen.placement.remove")}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
