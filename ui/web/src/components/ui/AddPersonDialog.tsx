"use client";

import { useState } from "react";
import { User, X } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Select } from "./Select";

interface AddPersonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (person: {
    name: string;
    phone?: string;
    address?: string;
    description?: string;
    status?: string;
  }) => void;
  type: "suspect" | "witness";
}

export function AddPersonDialog({
  isOpen,
  onClose,
  onSubmit,
  type,
}: AddPersonDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(type === "suspect" ? "WANTED" : "PENDING");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    onSubmit({
      name,
      phone: phone || undefined,
      address: address || undefined,
      description: description || undefined,
      status,
    });
    setName("");
    setPhone("");
    setAddress("");
    setDescription("");
    setStatus(type === "suspect" ? "WANTED" : "PENDING");
    setIsSubmitting(false);
  };

  const suspectStatuses = [
    { value: "WANTED", label: "Wanted" },
    { value: "ABSCONDING", label: "Absconding" },
    { value: "ARRESTED", label: "Arrested" },
    { value: "BAILED", label: "On Bail" },
  ];

  const witnessStatuses = [
    { value: "PENDING", label: "Statement Pending" },
    { value: "RECORDED", label: "Statement Recorded" },
    { value: "HOSTILE", label: "Hostile Witness" },
  ];

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
            <User className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Add {type === "suspect" ? "Suspect" : "Witness"}
            </h2>
            <p className="text-sm text-foreground-muted">
              {type === "suspect"
                ? "Register a suspect or accused person"
                : "Register a witness for this case"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Name *"
            placeholder={type === "suspect" ? "Name or 'Unknown'" : "Full name"}
            value={name}
            onChange={(v: string) => setName(v)}
            required
          />

          <Input
            label="Phone"
            placeholder="+91 9876543210"
            value={phone}
            onChange={(v: string) => setPhone(v)}
          />

          <Input
            label="Address"
            placeholder="Known address"
            value={address}
            onChange={(v: string) => setAddress(v)}
          />

          <Select
            label="Status"
            options={type === "suspect" ? suspectStatuses : witnessStatuses}
            value={status}
            onChange={(v: string) => setStatus(v)}
          />

          <Textarea
            label={type === "suspect" ? "Identification Marks" : "Notes"}
            placeholder={
              type === "suspect"
                ? "Physical description, identifying features..."
                : "Relationship to case, relevance..."
            }
            value={description}
            onChange={(v: string) => setDescription(v)}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? "Adding..." : `Add ${type === "suspect" ? "Suspect" : "Witness"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
