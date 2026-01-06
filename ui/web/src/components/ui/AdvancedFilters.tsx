"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { Input } from "./Input";
import { Select } from "./Select";
import { DatePicker } from "./DatePicker";
import { Button } from "./Button";

export interface AdvancedFilterOptions {
  dateFrom?: string;
  dateTo?: string;
  stationId?: string;
  investigatingOfficer?: string;
  priority?: string;
  category?: string;
  [key: string]: any;
}

export interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: AdvancedFilterOptions) => void;
  onReset: () => void;
  resourceType: 'fir' | 'case' | 'evidence' | 'warrant' | 'bail';
  currentFilters?: AdvancedFilterOptions;
}

export function AdvancedFilters({
  isOpen,
  onClose,
  onApply,
  onReset,
  resourceType,
  currentFilters = {},
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<AdvancedFilterOptions>(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    onReset();
    onClose();
  };

  const priorityOptions = [
    { value: "", label: "All Priorities" },
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "CRITICAL", label: "Critical" },
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    { value: "VIOLENT", label: "Violent" },
    { value: "PROPERTY", label: "Property" },
    { value: "CYBER", label: "Cyber" },
    { value: "ECONOMIC", label: "Economic" },
    { value: "NARCOTICS", label: "Narcotics" },
    { value: "SEXUAL", label: "Sexual" },
    { value: "ORGANIZED", label: "Organized" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Advanced Filters"
      size="lg"
    >
      <div className="space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Date From"
            value={filters.dateFrom || ""}
            onChange={(date) => setFilters({ ...filters, dateFrom: date })}
            maxDate={filters.dateTo || new Date().toISOString().split('T')[0]}
          />
          <DatePicker
            label="Date To"
            value={filters.dateTo || ""}
            onChange={(date) => setFilters({ ...filters, dateTo: date })}
            minDate={filters.dateFrom}
            maxDate={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Priority */}
        {(resourceType === 'fir' || resourceType === 'warrant') && (
          <Select
            label="Priority"
            options={priorityOptions}
            value={filters.priority || ""}
            onChange={(value) => setFilters({ ...filters, priority: value })}
          />
        )}

        {/* Category */}
        {resourceType === 'fir' && (
          <Select
            label="Crime Category"
            options={categoryOptions}
            value={filters.category || ""}
            onChange={(value) => setFilters({ ...filters, category: value })}
          />
        )}

        {/* Investigating Officer */}
        {(resourceType === 'fir' || resourceType === 'case') && (
          <Input
            label="Investigating Officer"
            value={filters.investigatingOfficer || ""}
            onChange={(value) => setFilters({ ...filters, investigatingOfficer: value })}
            placeholder="Enter officer name or ID"
          />
        )}

        {/* Station */}
        <Input
          label="Station ID"
          value={filters.stationId || ""}
          onChange={(value) => setFilters({ ...filters, stationId: value })}
          placeholder="Enter station ID"
        />

        {/* Active Filters Display */}
        {Object.keys(filters).filter(key => filters[key]).length > 0 && (
          <div className="p-3 bg-background-tertiary rounded-md">
            <p className="text-sm font-medium text-foreground mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters)
                .filter(([_, value]) => value)
                .map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-background-secondary rounded text-xs"
                  >
                    {key}: {String(value)}
                    <button
                      onClick={() => setFilters({ ...filters, [key]: undefined })}
                      className="hover:text-error"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={handleReset}>
          Reset All
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleApply}>
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </ModalFooter>
    </Modal>
  );
}
