"use client";

import * as React from "react";
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
import { Info } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { DECISION_TYPES, type AIDecisionType, type RegisterModelInput } from "@/lib/api/ai-review";
import { selectClass } from "./shared";

/**
 * Registers a model. It is registered switched off, and stays off until an
 * evaluation of that exact version passes — the API enforces that, and the
 * dialog says so rather than offering a switch here.
 */
export function RegisterModelDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: RegisterModelInput) => void;
  submitting: boolean;
  error: string | null;
}) {
  const { t } = useI18n();
  const [form, setForm] = React.useState({
    modelName: "",
    modelVersion: "",
    decisionType: "COMPLAINT_CATEGORY" as AIDecisionType,
    module: "",
    task: "",
    endpointEnv: "",
    licence: "",
    sourceUrl: "",
    confidenceThreshold: "0.80",
    reviewTimeout: "",
    maxQueueSize: "",
    description: "",
  });

  React.useEffect(() => {
    if (!open) return;
    setForm({
      modelName: "",
      modelVersion: "",
      decisionType: "COMPLAINT_CATEGORY",
      module: "",
      task: "",
      endpointEnv: "",
      licence: "",
      sourceUrl: "",
      confidenceThreshold: "0.80",
      reviewTimeout: "",
      maxQueueSize: "",
      description: "",
    });
  }, [open]);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    onSubmit({
      modelName: form.modelName.trim(),
      modelVersion: form.modelVersion.trim(),
      decisionType: form.decisionType,
      module: form.module.trim() || undefined,
      task: form.task.trim() || undefined,
      endpointEnv: form.endpointEnv.trim() || undefined,
      licence: form.licence.trim() || undefined,
      sourceUrl: form.sourceUrl.trim() || undefined,
      confidenceThreshold: Number(form.confidenceThreshold),
      reviewTimeout: form.reviewTimeout ? Number(form.reviewTimeout) : undefined,
      maxQueueSize: form.maxQueueSize ? Number(form.maxQueueSize) : undefined,
      description: form.description.trim() || undefined,
    });
  };

  const ready = form.modelName.trim() !== "" && form.modelVersion.trim() !== "" && Number(form.confidenceThreshold) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("aiScreen.register.title")}</DialogTitle>
          <DialogDescription>{t("aiScreen.register.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label={t("aiScreen.register.modelName")} value={form.modelName} onChange={set("modelName")} />
          <Input label={t("aiScreen.register.modelVersion")} value={form.modelVersion} onChange={set("modelVersion")} />

          <div>
            <Label htmlFor="ai-decision-type">{t("aiScreen.register.decisionType")}</Label>
            <select
              id="ai-decision-type"
              className={`${selectClass} mt-1.5 w-full`}
              value={form.decisionType}
              onChange={(e) => setForm((f) => ({ ...f, decisionType: e.target.value as AIDecisionType }))}
            >
              {DECISION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t(`aiScreen.types.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <Input label={t("aiScreen.register.module")} value={form.module} onChange={set("module")} />

          <Input label={t("aiScreen.register.task")} value={form.task} onChange={set("task")} />
          <Input
            label={t("aiScreen.register.threshold")}
            hint={t("aiScreen.register.thresholdHint")}
            type="number"
            step="0.01"
            min="0.01"
            max="1"
            value={form.confidenceThreshold}
            onChange={set("confidenceThreshold")}
          />

          <div className="sm:col-span-2">
            <Input
              label={t("aiScreen.register.endpointEnv")}
              hint={t("aiScreen.register.endpointEnvHint")}
              value={form.endpointEnv}
              onChange={set("endpointEnv")}
            />
          </div>

          <Input label={t("aiScreen.register.licence")} value={form.licence} onChange={set("licence")} />
          <Input label={t("aiScreen.register.sourceUrl")} value={form.sourceUrl} onChange={set("sourceUrl")} />

          <Input
            label={t("aiScreen.register.reviewTimeout")}
            type="number"
            min="1"
            value={form.reviewTimeout}
            onChange={set("reviewTimeout")}
          />
          <Input
            label={t("aiScreen.register.maxQueueSize")}
            type="number"
            min="1"
            value={form.maxQueueSize}
            onChange={set("maxQueueSize")}
          />

          <div className="sm:col-span-2">
            <Textarea label={t("aiScreen.register.descriptionField")} value={form.description} onChange={set("description")} />
          </div>
        </div>

        <Alert variant="info">
          <Info />
          <AlertDescription>{t("aiScreen.rule.measured")}</AlertDescription>
        </Alert>

        {error && <p className="text-sm text-danger">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("aiScreen.common.cancel")}
          </Button>
          <Button onClick={submit} disabled={!ready || submitting}>
            {submitting ? t("aiScreen.register.submitting") : t("aiScreen.register.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
