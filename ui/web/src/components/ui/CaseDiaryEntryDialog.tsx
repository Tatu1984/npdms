"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";

interface CaseDiaryEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: {
    content: string;
    nextAction: string;
    officer: string;
  }) => void;
  officerName: string;
}

export function CaseDiaryEntryDialog({
  isOpen,
  onClose,
  onSubmit,
  officerName,
}: CaseDiaryEntryDialogProps) {
  const [content, setContent] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    onSubmit({
      content,
      nextAction,
      officer: officerName,
    });
    setContent("");
    setNextAction("");
    setIsSubmitting(false);
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
          <div className="p-2 rounded-full bg-accent/10">
            <MessageSquare className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Add Case Diary Entry
            </h2>
            <p className="text-sm text-foreground-muted">
              Recording as {officerName}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Textarea
            label="Investigation Notes *"
            placeholder="Describe actions taken, findings, and observations..."
            value={content}
            onChange={(v: string) => setContent(v)}
            rows={5}
            required
          />

          <Input
            label="Next Action"
            placeholder="What steps need to be taken next?"
            value={nextAction}
            onChange={(v: string) => setNextAction(v)}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!content.trim() || isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Entry"}
          </Button>
        </div>
      </div>
    </div>
  );
}
