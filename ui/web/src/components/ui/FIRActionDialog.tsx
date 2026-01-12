"use client";

import { useState, useMemo } from "react";
import { ArrowRightLeft, FileCheck, XCircle, X } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { LegacySelect as Select } from "./select";

type ActionType = "transfer" | "close" | "chargesheet";

interface FIRActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    reason: string;
    targetStation?: string;
    courtName?: string;
  }) => void;
  actionType: ActionType;
  firNumber: string;
}

const stations = [
  { value: "Indiranagar PS", label: "Indiranagar PS" },
  { value: "HSR Layout PS", label: "HSR Layout PS" },
  { value: "BTM Layout PS", label: "BTM Layout PS" },
  { value: "Whitefield PS", label: "Whitefield PS" },
  { value: "JP Nagar PS", label: "JP Nagar PS" },
  { value: "Jayanagar PS", label: "Jayanagar PS" },
];

const courts = [
  { value: "Magistrate Court, Bengaluru", label: "Magistrate Court, Bengaluru" },
  { value: "Sessions Court, Bengaluru", label: "Sessions Court, Bengaluru" },
  { value: "City Civil Court, Bengaluru", label: "City Civil Court, Bengaluru" },
  { value: "High Court of Karnataka", label: "High Court of Karnataka" },
];

const closureReasons = [
  { value: "UNTRACED", label: "Untraced - No leads found" },
  { value: "FALSE_COMPLAINT", label: "False Complaint" },
  { value: "MISTAKE_OF_FACT", label: "Mistake of Fact" },
  { value: "LACK_OF_EVIDENCE", label: "Lack of Evidence" },
  { value: "COMPROMISED", label: "Compromised between parties" },
  { value: "REFERRED_TO_COURT", label: "Referred to Court (B Report)" },
];

export function FIRActionDialog({
  isOpen,
  onClose,
  onSubmit,
  actionType,
  firNumber,
}: FIRActionDialogProps) {
  const [reason, setReason] = useState("");
  const [targetStation, setTargetStation] = useState("");
  const [courtName, setCourtName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    onSubmit({
      reason: reason || notes,
      targetStation: targetStation || undefined,
      courtName: courtName || undefined,
    });
    setReason("");
    setTargetStation("");
    setCourtName("");
    setNotes("");
    setIsSubmitting(false);
  };

  const getIcon = () => {
    switch (actionType) {
      case "transfer":
        return ArrowRightLeft;
      case "close":
        return XCircle;
      case "chargesheet":
        return FileCheck;
    }
  };

  const getTitle = () => {
    switch (actionType) {
      case "transfer":
        return "Transfer Case";
      case "close":
        return "Close Case";
      case "chargesheet":
        return "File Chargesheet";
    }
  };

  const getDescription = () => {
    switch (actionType) {
      case "transfer":
        return `Transfer ${firNumber} to another police station`;
      case "close":
        return `Close ${firNumber} with final report`;
      case "chargesheet":
        return `Submit chargesheet for ${firNumber}`;
    }
  };

  const Icon = useMemo(() => getIcon(), [actionType]);

  const canSubmit = () => {
    switch (actionType) {
      case "transfer":
        return targetStation && notes;
      case "close":
        return reason && notes;
      case "chargesheet":
        return courtName && notes;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background-secondary border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-full ${
            actionType === "close" ? "bg-error/10" :
            actionType === "chargesheet" ? "bg-success/10" : "bg-accent/10"
          }`}>
            <Icon className={`h-6 w-6 ${
              actionType === "close" ? "text-error" :
              actionType === "chargesheet" ? "text-success" : "text-accent"
            }`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {getTitle()}
            </h2>
            <p className="text-sm text-foreground-muted">
              {getDescription()}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {actionType === "transfer" && (
            <Select
              label="Transfer To *"
              options={stations}
              value={targetStation}
              onChange={(v: string) => setTargetStation(v)}
            />
          )}

          {actionType === "close" && (
            <Select
              label="Closure Reason *"
              options={closureReasons}
              value={reason}
              onChange={(v: string) => setReason(v)}
            />
          )}

          {actionType === "chargesheet" && (
            <Select
              label="Court *"
              options={courts}
              value={courtName}
              onChange={(v: string) => setCourtName(v)}
            />
          )}

          <Textarea
            label={actionType === "transfer" ? "Transfer Reason *" : "Remarks *"}
            placeholder={
              actionType === "transfer"
                ? "Reason for transferring the case..."
                : actionType === "close"
                ? "Final remarks and summary..."
                : "Chargesheet summary and accused details..."
            }
            value={notes}
            onChange={(v: string) => setNotes(v)}
            rows={4}
          />

          {actionType === "close" && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-sm text-warning">
                This action will close the case permanently. Ensure all required
                documentation is complete before proceeding.
              </p>
            </div>
          )}

          {actionType === "chargesheet" && (
            <div className="p-3 rounded-lg bg-info/10 border border-info/30">
              <p className="text-sm text-info">
                Filing chargesheet will move this case to court proceedings phase.
                Ensure all evidence and witness statements are properly documented.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || isSubmitting}
            variant={actionType === "close" ? "secondary" : "default"}
          >
            {isSubmitting ? "Processing..." : getTitle()}
          </Button>
        </div>
      </div>
    </div>
  );
}
