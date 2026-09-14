"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { Input } from "./input";
import { LegacySelect as Select } from "./select";
import { Button } from "./button";
import { DatePicker } from "./DatePicker";
import { useCreateForensic } from "@/hooks/use-forensics";
import type { ForensicPriority, ForensicType } from "@/lib/api/forensics";
import { toast } from "@/stores/toastStore";

export interface ForensicRequestDialogProps {
  caseId?: string;
  evidenceId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/** A date input yields YYYY-MM-DD; the API's time.Time fields need RFC 3339. */
const toApiDate = (day: string) => `${day}T00:00:00Z`;
const today = () => new Date().toISOString().split("T")[0];

const forensicTypeOptions = [
  { value: "FINGERPRINT", label: "Fingerprint Analysis" },
  { value: "DNA", label: "DNA Analysis" },
  { value: "BALLISTICS", label: "Ballistics" },
  { value: "DIGITAL", label: "Digital Forensics" },
  { value: "NARCOTICS", label: "Narcotics" },
  { value: "DOCUMENT", label: "Document Examination" },
];

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

/**
 * Sends one evidence item to a forensic lab. Evidence is required by the API;
 * the case is carried across when the evidence item is linked to one.
 */
export function ForensicRequestDialog({
  caseId,
  evidenceId,
  isOpen,
  onClose,
  onSuccess,
}: ForensicRequestDialogProps) {
  const [type, setType] = useState<ForensicType | "">("");
  const [lab, setLab] = useState("");
  const [submittedDate, setSubmittedDate] = useState(today);
  const [expectedDate, setExpectedDate] = useState("");
  const [priority, setPriority] = useState<ForensicPriority>("MEDIUM");

  const createMutation = useCreateForensic();

  const reset = () => {
    setType("");
    setLab("");
    setSubmittedDate(today());
    setExpectedDate("");
    setPriority("MEDIUM");
  };

  const handleSubmit = async () => {
    if (!type || !lab.trim() || !evidenceId) {
      toast.warning("Required Fields", "Please fill in all required fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        evidenceId,
        caseId: caseId ?? null,
        type,
        priority,
        lab: lab.trim(),
        submittedDate: toApiDate(submittedDate),
        expectedDate: expectedDate ? toApiDate(expectedDate) : null,
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        "Request not created",
        error instanceof Error ? error.message : "The server rejected the request"
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Forensic Lab Request" size="lg">
      <div className="space-y-4">
        <Select
          label="Test Type *"
          options={forensicTypeOptions}
          value={type}
          onChange={(value: string) => setType(value as ForensicType)}
        />

        <Input
          label="Lab *"
          value={lab}
          onChange={(value: string) => setLab(value)}
          placeholder="e.g., State FSL, Kolkata"
          icon={<FlaskConical className="h-4 w-4" />}
        />

        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Submitted Date *"
            value={submittedDate}
            onChange={(date) => setSubmittedDate(date)}
            maxDate={today()}
          />

          <DatePicker
            label="Expected Completion Date"
            value={expectedDate}
            onChange={(date) => setExpectedDate(date)}
            minDate={submittedDate}
          />
        </div>

        <Select
          label="Priority *"
          options={priorityOptions}
          value={priority}
          onChange={(value: string) => setPriority(value as ForensicPriority)}
        />

        {!evidenceId && (
          <p className="text-sm text-error">Choose an evidence item before sending it to a lab.</p>
        )}
        {evidenceId && !caseId && (
          <p className="text-sm text-foreground-muted">
            This evidence item is not linked to a case, so the request will not be either.
          </p>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending || !type || !lab.trim() || !evidenceId}
          isLoading={createMutation.isPending}
        >
          <FlaskConical className="h-4 w-4 mr-2" />
          Create Request
        </Button>
      </ModalFooter>
    </Modal>
  );
}
