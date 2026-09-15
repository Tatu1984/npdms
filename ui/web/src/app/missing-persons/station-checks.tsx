"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, CircleHelp, Eye } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  CHECK_OUTCOMES,
  SIGHTING_SOURCES,
  type CheckOutcome,
  type SightingSource,
  type StationCheck,
} from "@/lib/api/missing-persons";
import { useRecordStationCheck, useStationChecks } from "@/hooks/use-missing-persons";
import { Panel, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationPicker, type LocationValue } from "@/components/ui/LocationPicker";
import { SOURCE } from "./labels";
import { errorMessage, Field, formatWhen, nowLocal, selectClass, toApiTime } from "./shared";

export const outcomeTone: Record<CheckOutcome, "neutral" | "warning" | "success"> = {
  NO_MATCH: "neutral",
  POSSIBLE_MATCH: "warning",
  SIGHTING: "success",
};

export const outcomeIcon: Record<CheckOutcome, React.ElementType> = {
  NO_MATCH: CheckCircle2,
  POSSIBLE_MATCH: CircleHelp,
  SIGHTING: Eye,
};

/** An outcome pill, with the sighting's verification state for a SIGHTING. */
export function CheckPill({ check }: { check: StationCheck }) {
  const { t } = useI18n();
  const Icon = outcomeIcon[check.outcome];
  return (
    <StatusPill tone={outcomeTone[check.outcome]}>
      <Icon className="h-3 w-3" />
      {t(`missingBoard.outcome.${check.outcome}`)}
      {check.outcome === "SIGHTING" &&
        ` · ${check.sightingDecision ? t(`missingBoard.sightingState.${check.sightingDecision}`) : t("missingBoard.sightingState.pending")}`}
    </StatusPill>
  );
}

/** Records the viewer's station's check of an open report. */
export function StationCheckDialog({
  open,
  onClose,
  reportId,
  reportNumber,
  personName,
  stationName,
}: {
  open: boolean;
  onClose: () => void;
  reportId: string;
  reportNumber: string;
  personName: string;
  stationName: string;
}) {
  const { t, pick } = useI18n();
  const record = useRecordStationCheck();
  const [outcome, setOutcome] = React.useState<CheckOutcome>("NO_MATCH");
  const [details, setDetails] = React.useState("");
  const [place, setPlace] = React.useState<LocationValue>({ location: "", latitude: null, longitude: null });
  const [when, setWhen] = React.useState("");
  const [source, setSource] = React.useState<SightingSource>("OFFICER_OBSERVATION");
  const [sightingDetails, setSightingDetails] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setOutcome("NO_MATCH");
      setDetails("");
      setPlace({ location: "", latitude: null, longitude: null });
      setWhen(nowLocal());
      setSource("OFFICER_OBSERVATION");
      setSightingDetails("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    setError(null);
    if (outcome === "POSSIBLE_MATCH" && !details.trim()) {
      setError(t("missingBoard.check.detailsMissing"));
      return;
    }
    if (outcome === "SIGHTING" && (!place.location.trim() || !when)) {
      setError(t("missingBoard.check.sightingMissing"));
      return;
    }
    try {
      await record.mutateAsync({
        id: reportId,
        input: {
          outcome,
          details: details.trim() || undefined,
          sighting:
            outcome === "SIGHTING"
              ? {
                  source,
                  location: place.location.trim(),
                  latitude: place.latitude,
                  longitude: place.longitude,
                  sightedAt: toApiTime(when),
                  details: sightingDetails.trim(),
                }
              : undefined,
        },
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("missingBoard.check.title", { station: stationName })}</DialogTitle>
          <DialogDescription>
            {personName} · {reportNumber}. {t("missingBoard.check.description")}
          </DialogDescription>
        </DialogHeader>
        <fieldset className="grid gap-2" data-testid="check-outcomes">
          <legend className="mb-1 text-sm font-medium text-foreground">{t("missingBoard.check.outcome")}</legend>
          {CHECK_OUTCOMES.map((o) => (
            <label
              key={o}
              className={
                outcome === o
                  ? "flex cursor-pointer items-start gap-3 rounded-md border-2 border-accent p-3"
                  : "flex cursor-pointer items-start gap-3 rounded-md border border-border p-3"
              }
            >
              <input type="radio" name="check-outcome" value={o} checked={outcome === o} onChange={() => setOutcome(o)} className="mt-1" />
              <span>
                <span className="block text-sm font-medium text-foreground">{t(`missingBoard.outcome.${o}`)}</span>
                <span className="block text-xs text-foreground-muted">{t(`missingBoard.outcomeHelp.${o}`)}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {outcome === "SIGHTING" && (
          <div className="grid gap-3 rounded-md border border-border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="chk-source" label={t("missingBoard.check.source")}>
                <select id="chk-source" className={selectClass} value={source} onChange={(e) => setSource(e.target.value as SightingSource)}>
                  {SIGHTING_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {pick(SOURCE[s])}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="chk-when" label={t("missingBoard.check.when")}>
                <Input id="chk-when" type="datetime-local" value={when} onChange={(v: string) => setWhen(v)} />
              </Field>
            </div>
            <LocationPicker value={place} onChange={setPlace} label={t("missingBoard.check.place")} mapHeight="240px" />
            <Field id="chk-sdetails" label={t("missingBoard.check.sightingDetails")}>
              <Textarea id="chk-sdetails" rows={2} value={sightingDetails} onChange={(v: string) => setSightingDetails(v)} />
            </Field>
          </div>
        )}

        <Field id="chk-details" label={outcome === "POSSIBLE_MATCH" ? t("missingBoard.check.detailsRequired") : t("missingBoard.check.details")}>
          <Textarea id="chk-details" rows={2} value={details} onChange={(v: string) => setDetails(v)} />
        </Field>

        {error && (
          <Alert variant="danger">
            <AlertTriangle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={record.isPending} data-testid="record-check-submit">
            {record.isPending ? t("missingBoard.check.saving") : t("missingBoard.check.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Every check recorded for a report, newest first. */
export function StationChecksPanel({ reportId, actions }: { reportId: string; actions?: React.ReactNode }) {
  const { t } = useI18n();
  const checks = useStationChecks(reportId);
  return (
    <Panel title={t("missingBoard.check.history")} description={t("missingBoard.check.historyDesc")} actions={actions} bodyClassName="flex flex-col gap-2">
      {checks.isError && <p className="text-sm text-danger">{errorMessage(checks.error)}</p>}
      {checks.isSuccess && checks.data.length === 0 && <p className="text-sm text-foreground-muted">{t("missingBoard.check.none")}</p>}
      {(checks.data ?? []).map((c) => (
        <div key={c.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-3" data-testid="station-check">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{c.stationName}</p>
            <p className="text-xs text-foreground-subtle">
              {t("missingBoard.check.recordedBy", { name: c.recordedByName, rank: c.recordedByRank, when: formatWhen(c.createdAt) })}
            </p>
            {c.details && <p className="mt-1 text-sm text-foreground-muted">{c.details}</p>}
          </div>
          <CheckPill check={c} />
        </div>
      ))}
    </Panel>
  );
}
