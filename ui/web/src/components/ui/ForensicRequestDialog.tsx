"use client";

import { useState } from "react";
import { FlaskConical, FileText, Calendar } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { Input } from "./input";
import { LegacySelect as Select } from "./select";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { DatePicker } from "./DatePicker";
import { useCreateForensic } from "@/hooks/use-forensics";
import { toast } from "@/stores/toastStore";
import { useAuthStore } from "@/stores/authStore";

export interface ForensicRequestDialogProps {
  caseId?: string;
  evidenceId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ForensicRequestDialog({
  caseId,
  evidenceId,
  isOpen,
  onClose,
  onSuccess,
}: ForensicRequestDialogProps) {
  const [type, setType] = useState("");
  const [labName, setLabName] = useState("");
  const [labRefNumber, setLabRefNumber] = useState("");
  const [requestedDate, setRequestedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");

  const createMutation = useCreateForensic();
  const { user } = useAuthStore();

  const handleSubmit = async () => {
    if (!type || !labName || !caseId) {
      toast.warning("Required Fields", "Please fill in all required fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        type: type as any,
        caseId,
        evidenceId,
        labName,
        labRefNumber,
        requestedDate,
        expectedDate,
        priority: priority as any,
        requestedBy: user?.name || "Unknown Officer",
        status: "REQUESTED",
        description,
      });

      // Reset form
      setType("");
      setLabName("");
      setLabRefNumber("");
      setRequestedDate(new Date().toISOString().split('T')[0]);
      setExpectedDate("");
      setPriority("MEDIUM");
      setDescription("");

      toast.success("Request Created", "Forensic request has been submitted");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Request failed:", error);
      toast.error("Request Failed", "Failed to create forensic request. Please try again.");
    }
  };

  const forensicTypeOptions = [
    { value: "FINGERPRINT", label: "Fingerprint Analysis" },
    { value: "DNA", label: "DNA Analysis" },
    { value: "BALLISTIC", label: "Ballistic Analysis" },
    { value: "TOXICOLOGY", label: "Toxicology" },
    { value: "DIGITAL_FORENSICS", label: "Digital Forensics" },
    { value: "AUTOPSY", label: "Autopsy" },
    { value: "HANDWRITING", label: "Handwriting Analysis" },
  ];

  const priorityOptions = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "CRITICAL", label: "Critical" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Forensic Lab Request"
      size="lg"
    >
      <div className="space-y-4">
        <Select
          label="Test Type *"
          options={forensicTypeOptions}
          value={type}
          onChange={(value: string) => setType(value)}
        />

        <Input
          label="Lab Name *"
          value={labName}
          onChange={(value: string) => setLabName(value)}
          placeholder="e.g., FSL Bangalore, CFSL Delhi"
          icon={<FlaskConical className="h-4 w-4" />}
        />

        <Input
          label="Lab Reference Number"
          value={labRefNumber}
          onChange={(value: string) => setLabRefNumber(value)}
          placeholder="Optional - will be assigned by lab"
        />

        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Requested Date *"
            value={requestedDate}
            onChange={(date) => setRequestedDate(date)}
            maxDate={new Date().toISOString().split('T')[0]}
          />

          <DatePicker
            label="Expected Completion Date"
            value={expectedDate}
            onChange={(date) => setExpectedDate(date)}
            minDate={requestedDate}
          />
        </div>

        <Select
          label="Priority *"
          options={priorityOptions}
          value={priority}
          onChange={(value: string) => setPriority(value)}
        />

        <Textarea
          label="Description / Instructions"
          value={description}
          onChange={(value: string) => setDescription(value)}
          placeholder="Describe what needs to be analyzed or any specific instructions..."
          rows={4}
        />

        {caseId && (
          <div className="p-3 bg-background-tertiary rounded-md">
            <p className="text-sm text-foreground-muted">Case ID</p>
            <p className="font-medium text-foreground">{caseId}</p>
          </div>
        )}

        {evidenceId && (
          <div className="p-3 bg-background-tertiary rounded-md">
            <p className="text-sm text-foreground-muted">Evidence ID</p>
            <p className="font-medium text-foreground">{evidenceId}</p>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending || !type || !labName || !caseId}
          isLoading={createMutation.isPending}
        >
          <FlaskConical className="h-4 w-4 mr-2" />
          Create Request
        </Button>
      </ModalFooter>
    </Modal>
  );
}
