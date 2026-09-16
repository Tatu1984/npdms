"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useI18n } from "@/lib/i18n";
import type { AIModelConfig, RecordEvaluationInput } from "@/lib/api/ai-review";
import { selectClass } from "./shared";

/**
 * Records one measurement of one model version.
 *
 * Whether it passed is the API's decision — measured against the stated
 * threshold — so this form does not show a pass/fail control. The record is
 * appended and cannot be edited afterwards.
 */
export function RecordEvaluationDialog({
  open,
  onOpenChange,
  models,
  preselected,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: AIModelConfig[];
  preselected?: string;
  onSubmit: (input: RecordEvaluationInput) => void;
  submitting: boolean;
  error: string | null;
}) {
  const { t } = useI18n();
  const [modelName, setModelName] = React.useState(preselected ?? "");
  const [form, setForm] = React.useState({
    modelVersion: "",
    dataset: "",
    datasetSize: "",
    datasetSha256: "",
    metric: "",
    threshold: "",
    measured: "",
    limitations: "",
    notes: "",
  });

  const selected = models.find((m) => m.modelName === modelName);

  React.useEffect(() => {
    if (!open) return;
    const initial = preselected ?? models[0]?.modelName ?? "";
    setModelName(initial);
    const model = models.find((m) => m.modelName === initial);
    setForm({
      modelVersion: model?.modelVersion ?? "",
      dataset: "",
      datasetSize: "",
      datasetSha256: "",
      metric: "",
      threshold: model ? String(model.confidenceThreshold) : "",
      measured: "",
      limitations: "",
      notes: "",
    });
  }, [open, preselected, models]);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const pickModel = (name: string) => {
    setModelName(name);
    const model = models.find((m) => m.modelName === name);
    if (model) {
      setForm((f) => ({ ...f, modelVersion: model.modelVersion, threshold: String(model.confidenceThreshold) }));
    }
  };

  const submit = () =>
    onSubmit({
      modelName,
      modelVersion: form.modelVersion.trim(),
      dataset: form.dataset.trim(),
      datasetSize: Number(form.datasetSize),
      datasetSha256: form.datasetSha256.trim() || undefined,
      metric: form.metric.trim(),
      threshold: Number(form.threshold),
      measured: Number(form.measured),
      limitations: form.limitations.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });

  const ready =
    modelName !== "" &&
    form.modelVersion.trim() !== "" &&
    form.dataset.trim() !== "" &&
    Number(form.datasetSize) > 0 &&
    form.metric.trim() !== "" &&
    Number(form.threshold) > 0 &&
    form.measured.trim() !== "";

  const versionMismatch = Boolean(selected && form.modelVersion.trim() && selected.modelVersion !== form.modelVersion.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("aiScreen.evaluations.recordTitle")}</DialogTitle>
          <DialogDescription>{t("aiScreen.evaluations.recordBody")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="ai-eval-model">{t("aiScreen.evaluations.forModel")}</Label>
            <select
              id="ai-eval-model"
              className={`${selectClass} mt-1.5 w-full`}
              value={modelName}
              onChange={(e) => pickModel(e.target.value)}
            >
              {models.map((model) => (
                <option key={model.modelName} value={model.modelName}>
                  {model.modelName}
                </option>
              ))}
            </select>
          </div>
          <Input label={t("aiScreen.registry.version")} value={form.modelVersion} onChange={set("modelVersion")} />

          <Input label={t("aiScreen.evaluations.dataset")} value={form.dataset} onChange={set("dataset")} />
          <Input label={t("aiScreen.evaluations.size")} type="number" min="1" value={form.datasetSize} onChange={set("datasetSize")} />

          <Input label={t("aiScreen.evaluations.metric")} value={form.metric} onChange={set("metric")} />
          <Input
            label={t("aiScreen.evaluations.threshold")}
            type="number"
            step="0.01"
            min="0.01"
            max="1"
            value={form.threshold}
            onChange={set("threshold")}
          />

          <Input
            label={t("aiScreen.evaluations.measured")}
            type="number"
            step="0.001"
            min="0"
            max="1"
            value={form.measured}
            onChange={set("measured")}
          />
          <Input label={t("aiScreen.evaluations.datasetSha")} value={form.datasetSha256} onChange={set("datasetSha256")} />

          <div className="sm:col-span-2">
            <Textarea label={t("aiScreen.evaluations.limitations")} value={form.limitations} onChange={set("limitations")} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label={t("aiScreen.evaluations.notes")} value={form.notes} onChange={set("notes")} />
          </div>
        </div>

        {versionMismatch && (
          <Alert variant="warning">
            <Info />
            <AlertDescription>
              {t("aiScreen.gateway.versionMismatchBody", {
                running: form.modelVersion.trim(),
                registered: selected?.modelVersion ?? "",
              })}
            </AlertDescription>
          </Alert>
        )}

        <Alert variant="info">
          <Info />
          <AlertDescription>{t("aiScreen.rule.appendOnly")}</AlertDescription>
        </Alert>

        {error && <p className="text-sm text-danger">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("aiScreen.common.cancel")}
          </Button>
          <Button onClick={submit} disabled={!ready || submitting}>
            {submitting ? t("aiScreen.evaluations.submitting") : t("aiScreen.evaluations.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
