"use client";

import { useState } from "react";
import { Package, User, MapPin, FileText } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { Input } from "./Input";
import { Select } from "./Select";
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import { DatePicker } from "./DatePicker";
import { useTransferEvidence } from "@/hooks/use-evidence";

export interface EvidenceTransferDialogProps {
  evidenceId: string;
  evidenceNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EvidenceTransferDialog({
  evidenceId,
  evidenceNumber,
  isOpen,
  onClose,
  onSuccess,
}: EvidenceTransferDialogProps) {
  const [transferTo, setTransferTo] = useState("");
  const [transferToName, setTransferToName] = useState("");
  const [transferToDesignation, setTransferToDesignation] = useState("");
  const [location, setLocation] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");

  const transferMutation = useTransferEvidence();

  const handleSubmit = async () => {
    if (!transferTo || !location || !transferDate || !reason) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await transferMutation.mutateAsync({
        evidenceId,
        data: {
          transferredTo: transferTo,
          transferredToName: transferToName,
          transferredToDesignation: transferToDesignation,
          location,
          transferDate,
          reason,
          remarks,
        },
      });
      
      // Reset form
      setTransferTo("");
      setTransferToName("");
      setTransferToDesignation("");
      setLocation("");
      setTransferDate("");
      setReason("");
      setRemarks("");
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Transfer failed:", error);
      alert("Failed to transfer evidence. Please try again.");
    }
  };

  const isSubmitting = transferMutation.isPending;

  const transferTypeOptions = [
    { value: "OFFICER", label: "To Officer" },
    { value: "LAB", label: "To Forensic Lab" },
    { value: "COURT", label: "To Court" },
    { value: "STORAGE", label: "To Storage" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Evidence"
      size="lg"
    >
      <div className="space-y-4">
        <div className="p-3 bg-background-tertiary rounded-md">
          <p className="text-sm text-foreground-muted">Evidence Number</p>
          <p className="font-medium text-foreground">{evidenceNumber}</p>
        </div>

        <Select
          label="Transfer Type *"
          options={transferTypeOptions}
          value={transferTo}
          onChange={(value) => setTransferTo(value)}
        />

        <Input
          label="Transfer To (Name/ID) *"
          value={transferToName}
          onChange={(value) => setTransferToName(value)}
          placeholder="Enter name or ID"
          icon={<User className="h-4 w-4" />}
        />

        <Input
          label="Designation"
          value={transferToDesignation}
          onChange={(value) => setTransferToDesignation(value)}
          placeholder="e.g., SI, FSL Officer, etc."
        />

        <Input
          label="Location *"
          value={location}
          onChange={(value) => setLocation(value)}
          placeholder="Enter location"
          icon={<MapPin className="h-4 w-4" />}
        />

        <DatePicker
          label="Transfer Date *"
          value={transferDate}
          onChange={(date) => setTransferDate(date)}
          maxDate={new Date().toISOString().split('T')[0]}
        />

        <Select
          label="Reason for Transfer *"
          options={[
            { value: "FORENSIC_ANALYSIS", label: "Forensic Analysis" },
            { value: "COURT_PRODUCTION", label: "Court Production" },
            { value: "STORAGE", label: "Storage" },
            { value: "RETURN", label: "Return to Owner" },
            { value: "OTHER", label: "Other" },
          ]}
          value={reason}
          onChange={(value) => setReason(value)}
        />

        <Textarea
          label="Remarks"
          value={remarks}
          onChange={(value) => setRemarks(value)}
          placeholder="Additional notes about the transfer..."
          rows={3}
        />
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !transferTo || !location || !transferDate}
          isLoading={isSubmitting}
        >
          <Package className="h-4 w-4 mr-2" />
          Transfer Evidence
        </Button>
      </ModalFooter>
    </Modal>
  );
}
