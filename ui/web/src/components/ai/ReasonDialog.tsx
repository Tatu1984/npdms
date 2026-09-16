"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useI18n } from "@/lib/i18n";

/**
 * Confirms a change that the API records against the officer's name and will
 * not accept without a reason: switching a module, or retiring a model.
 *
 * The reason is the point of the dialog, so it is the only field, and the
 * confirming button stays disabled until something is written in it.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  body,
  warning,
  reasonLabel,
  reasonRequiredMessage,
  confirmLabel,
  confirmingLabel,
  destructive,
  submitting,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  /** Stated plainly when the change cannot be undone. */
  warning?: string;
  reasonLabel: string;
  reasonRequiredMessage: string;
  confirmLabel: string;
  confirmingLabel: string;
  destructive?: boolean;
  submitting: boolean;
  /** What the API said if it turned the change down. */
  error: string | null;
  onConfirm: (reason: string) => void;
}) {
  const { t } = useI18n();
  const [reason, setReason] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setReason("");
    setTouched(false);
  }, [open]);

  const empty = reason.trim() === "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>

        {warning && (
          <Alert variant="warning">
            <AlertTriangle />
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        )}

        <Textarea
          label={reasonLabel}
          value={reason}
          onChange={(value) => {
            setReason(value);
            setTouched(true);
          }}
          error={touched && empty ? reasonRequiredMessage : undefined}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("aiScreen.common.cancel")}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={empty || submitting}
            onClick={() => onConfirm(reason.trim())}
          >
            {submitting ? confirmingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
