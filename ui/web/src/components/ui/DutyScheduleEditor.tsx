"use client";

import { useState } from "react";
import { Clock, Users, X, Plus } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { LegacySelect as Select } from "./select";
import { Button } from "./button";
import { DatePicker } from "./DatePicker";
import { usePersonnel } from "@/hooks/use-personnel";

export interface DutyScheduleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (schedule: DutySchedule) => void;
  date?: string;
}

export interface ShiftAssignment {
  shift: string;
  officers: string[]; // Personnel IDs
}

export interface DutySchedule {
  date: string;
  shifts: ShiftAssignment[];
}

const shiftOptions = [
  { value: "Day (0600-1400)", label: "Day Shift (06:00 - 14:00)" },
  { value: "Evening (1400-2200)", label: "Evening Shift (14:00 - 22:00)" },
  { value: "Night (2200-0600)", label: "Night Shift (22:00 - 06:00)" },
];

export function DutyScheduleEditor({
  isOpen,
  onClose,
  onSave,
  date: initialDate,
}: DutyScheduleEditorProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [shifts, setShifts] = useState<ShiftAssignment[]>([
    { shift: "Day (0600-1400)", officers: [] },
    { shift: "Evening (1400-2200)", officers: [] },
    { shift: "Night (2200-0600)", officers: [] },
  ]);

  const { data: personnelData } = usePersonnel({});
  const availablePersonnel = personnelData?.data || [];

  const handleAddOfficer = (shiftIndex: number) => {
    // Find first available officer not already assigned
    const assignedIds = shifts.flatMap(s => s.officers);
    const available = availablePersonnel.find(p => !assignedIds.includes(p.id));
    
    if (available) {
      const newShifts = [...shifts];
      newShifts[shiftIndex].officers.push(available.id);
      setShifts(newShifts);
    }
  };

  const handleRemoveOfficer = (shiftIndex: number, officerIndex: number) => {
    const newShifts = [...shifts];
    newShifts[shiftIndex].officers.splice(officerIndex, 1);
    setShifts(newShifts);
  };

  const handleShiftChange = (shiftIndex: number, newShift: string) => {
    const newShifts = [...shifts];
    newShifts[shiftIndex].shift = newShift;
    setShifts(newShifts);
  };

  const handleSave = () => {
    const schedule: DutySchedule = {
      date: selectedDate,
      shifts: shifts.filter(s => s.officers.length > 0),
    };
    onSave?.(schedule);
    onClose();
  };

  const getOfficerName = (id: string) => {
    return availablePersonnel.find(p => p.id === id)?.name || id;
  };

  const getAvailableOfficers = (shiftIndex: number) => {
    const assignedIds = shifts.flatMap((s, idx) => idx === shiftIndex ? [] : s.officers);
    return availablePersonnel.filter(p => !assignedIds.includes(p.id));
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Duty Schedule"
      size="xl"
    >
      <div className="space-y-6">
        <DatePicker
          label="Schedule Date"
          value={selectedDate}
          onChange={(date) => setSelectedDate(date)}
        />

        <div className="space-y-4">
          {shifts.map((shift, shiftIndex) => (
            <div key={shiftIndex} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-foreground-muted" />
                  <Select
                    options={shiftOptions}
                    value={shift.shift}
                    onChange={(value: string) => handleShiftChange(shiftIndex, value)}
                    className="w-64"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddOfficer(shiftIndex)}
                  disabled={getAvailableOfficers(shiftIndex).length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Officer
                </Button>
              </div>

              <div className="space-y-2">
                {shift.officers.length === 0 ? (
                  <p className="text-sm text-foreground-muted italic">No officers assigned</p>
                ) : (
                  shift.officers.map((officerId, officerIndex) => (
                    <div
                      key={officerIndex}
                      className="flex items-center justify-between p-2 bg-background-tertiary rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-foreground-muted" />
                        <span className="text-sm text-foreground">{getOfficerName(officerId)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOfficer(shiftIndex, officerIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-background-tertiary rounded-md">
          <p className="text-sm text-foreground-muted">
            Total Officers Assigned: {shifts.reduce((sum, s) => sum + s.officers.length, 0)}
          </p>
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Clock className="h-4 w-4 mr-2" />
          Save Schedule
        </Button>
      </ModalFooter>
    </Modal>
  );
}
