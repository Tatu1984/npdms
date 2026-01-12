"use client";

import { useState } from "react";
import { MapPin, Camera, Calendar, User } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { DatePicker } from "./DatePicker";
import { FileUpload } from "./FileUpload";
import { toast } from "@/stores/toastStore";

export interface SightingReportDialogProps {
  alertId: string;
  isOpen: boolean;
  onClose: () => void;
  onReport: (report: SightingReport) => void;
}

export interface SightingReport {
  location: string;
  latitude?: number;
  longitude?: number;
  sightingDate: string;
  sightingTime: string;
  reporterName: string;
  reporterPhone: string;
  description: string;
  photos?: File[];
}

export function SightingReportDialog({
  alertId,
  isOpen,
  onClose,
  onReport,
}: SightingReportDialogProps) {
  const [location, setLocation] = useState("");
  const [sightingDate, setSightingDate] = useState(new Date().toISOString().split('T')[0]);
  const [sightingTime, setSightingTime] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const handleSubmit = () => {
    if (!location || !sightingDate || !reporterName || !reporterPhone) {
      toast.warning("Required Fields", "Please fill in all required fields");
      return;
    }

    onReport({
      location,
      sightingDate,
      sightingTime: sightingTime || new Date().toTimeString().slice(0, 5),
      reporterName,
      reporterPhone,
      description,
      photos,
    });

    // Reset form
    setLocation("");
    setSightingDate(new Date().toISOString().split('T')[0]);
    setSightingTime("");
    setReporterName("");
    setReporterPhone("");
    setDescription("");
    setPhotos([]);
    
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Sighting"
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Location *"
          value={location}
          onChange={(value: string) => setLocation(value)}
          placeholder="Where was the sighting?"
          icon={<MapPin className="h-4 w-4" />}
        />

        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Sighting Date *"
            value={sightingDate}
            onChange={(date) => setSightingDate(date)}
            maxDate={new Date().toISOString().split('T')[0]}
          />

          <Input
            label="Sighting Time"
            type="time"
            value={sightingTime}
            onChange={(value: string) => setSightingTime(value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Reporter Name *"
            value={reporterName}
            onChange={(value: string) => setReporterName(value)}
            placeholder="Your name"
            icon={<User className="h-4 w-4" />}
          />

          <Input
            label="Reporter Phone *"
            value={reporterPhone}
            onChange={(value: string) => setReporterPhone(value)}
            placeholder="9876543210"
            type="tel"
          />
        </div>

        <Textarea
          label="Description"
          value={description}
          onChange={(value: string) => setDescription(value)}
          placeholder="Describe what you saw..."
          rows={4}
        />

        <FileUpload
          fileType="image"
          multiple
          maxSize={5}
          label="Photos"
          hint="Upload photos of the sighting (optional)"
          onUpload={async (files) => {
            setPhotos(files);
          }}
        />
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!location || !sightingDate || !reporterName || !reporterPhone}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Submit Report
        </Button>
      </ModalFooter>
    </Modal>
  );
}
