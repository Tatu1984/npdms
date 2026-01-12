"use client";

import { useState } from "react";
import { Shield, Clock, MapPin } from "lucide-react";
import { Button } from "./button";
import { LegacySelect as Select } from "./select";

interface DutyAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (duty: string, shift: string) => void;
  officerName: string;
}

const dutyOptions = [
  { value: "Patrol - Beat A", label: "Patrol - Beat A (Koramangala 4th Block)" },
  { value: "Patrol - Beat B", label: "Patrol - Beat B (Koramangala 5th-8th Block)" },
  { value: "Patrol - Beat C", label: "Patrol - Beat C (HSR Layout Sector 1-3)" },
  { value: "Patrol - Beat D", label: "Patrol - Beat D (BTM Layout 1st Stage)" },
  { value: "Station Duty", label: "Station Duty" },
  { value: "PCR Mobile", label: "PCR Mobile Response" },
  { value: "Traffic Control", label: "Traffic Control" },
  { value: "VIP Security", label: "VIP Security" },
  { value: "Investigation", label: "Investigation Duty" },
  { value: "Court Escort", label: "Court Escort" },
  { value: "Special Assignment", label: "Special Assignment" },
];

const shiftOptions = [
  { value: "Day (0600-1400)", label: "Day Shift (06:00 - 14:00)" },
  { value: "Evening (1400-2200)", label: "Evening Shift (14:00 - 22:00)" },
  { value: "Night (2200-0600)", label: "Night Shift (22:00 - 06:00)" },
  { value: "Full Day (0800-2000)", label: "Full Day (08:00 - 20:00)" },
  { value: "On Call", label: "On Call" },
];

export function DutyAssignmentDialog({
  isOpen,
  onClose,
  onAssign,
  officerName,
}: DutyAssignmentDialogProps) {
  const [duty, setDuty] = useState("");
  const [shift, setShift] = useState("");

  if (!isOpen) return null;

  const handleAssign = () => {
    if (duty && shift) {
      onAssign(duty, shift);
      setDuty("");
      setShift("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-background-secondary border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-accent/10">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Assign Duty
            </h2>
            <p className="text-sm text-foreground-muted">
              Assigning duty to {officerName}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground-muted mb-4">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">Select duty assignment</span>
          </div>

          <Select
            label="Duty Assignment"
            options={dutyOptions}
            value={duty}
            onChange={(v: string) => setDuty(v)}
          />

          <div className="flex items-center gap-2 text-foreground-muted">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Select shift timing</span>
          </div>

          <Select
            label="Shift"
            options={shiftOptions}
            value={shift}
            onChange={(v: string) => setShift(v)}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!duty || !shift}>
            <Shield className="h-4 w-4 mr-2" />
            Assign Duty
          </Button>
        </div>
      </div>
    </div>
  );
}
