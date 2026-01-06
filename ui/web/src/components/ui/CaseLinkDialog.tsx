"use client";

import { useState, useEffect } from "react";
import { Link as LinkIcon, Search, X } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { useCases } from "@/hooks/use-cases";

export interface CaseLinkDialogProps {
  firId: string;
  isOpen: boolean;
  onClose: () => void;
  onLink: (caseIds: string[]) => void;
  existingLinks?: string[];
}

export function CaseLinkDialog({
  firId,
  isOpen,
  onClose,
  onLink,
  existingLinks = [],
}: CaseLinkDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCases, setSelectedCases] = useState<string[]>(existingLinks);
  const { data: casesData } = useCases({});

  const availableCases = casesData?.data || [];
  const filteredCases = availableCases.filter((c) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        c.caseNumber.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const toggleCase = (caseId: string) => {
    setSelectedCases((prev) =>
      prev.includes(caseId)
        ? prev.filter((id) => id !== caseId)
        : [...prev, caseId]
    );
  };

  const handleLink = () => {
    onLink(selectedCases);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedCases(existingLinks);
    }
  }, [isOpen, existingLinks]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Related Cases"
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Search Cases"
          value={searchQuery}
          onChange={(value) => setSearchQuery(value)}
          placeholder="Search by case number, title..."
          icon={<Search className="h-4 w-4" />}
        />

        <div className="border border-border rounded-md max-h-96 overflow-y-auto">
          {filteredCases.length === 0 ? (
            <div className="p-8 text-center text-foreground-muted">
              No cases found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCases.map((c) => {
                const isSelected = selectedCases.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleCase(c.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-accent/10 border-l-4 border-l-accent"
                        : "hover:bg-background-tertiary"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {c.caseNumber}
                          </span>
                          <Badge variant={c.status === "ACTIVE" ? "success" : "secondary"}>
                            {c.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground font-medium mb-1">
                          {c.title}
                        </p>
                        {c.description && (
                          <p className="text-xs text-foreground-muted line-clamp-2">
                            {c.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="ml-4 p-1 bg-accent rounded-full">
                          <LinkIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedCases.length > 0 && (
          <div className="p-3 bg-background-tertiary rounded-md">
            <p className="text-sm font-medium text-foreground mb-2">
              Selected Cases ({selectedCases.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedCases.map((caseId) => {
                const c = availableCases.find((c) => c.id === caseId);
                return c ? (
                  <Badge
                    key={caseId}
                    variant="accent"
                    className="flex items-center gap-1"
                  >
                    {c.caseNumber}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCase(caseId);
                      }}
                      className="ml-1 hover:text-error"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleLink} disabled={selectedCases.length === 0}>
          <LinkIcon className="h-4 w-4 mr-2" />
          Link {selectedCases.length} Case{selectedCases.length !== 1 ? "s" : ""}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
