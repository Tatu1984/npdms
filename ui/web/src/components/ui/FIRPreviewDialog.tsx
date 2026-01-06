"use client";

import { FileText, Download, Printer } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { Button } from "./Button";

export interface FIRPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  firData: any; // FIR form data
}

export function FIRPreviewDialog({
  isOpen,
  onClose,
  firData,
}: FIRPreviewDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate PDF and download
    // TODO: Implement PDF generation
    alert("PDF download feature coming soon");
  };

  if (!isOpen || !firData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="FIR Preview"
      size="xl"
    >
      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="text-center border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-foreground">FIRST INFORMATION REPORT</h2>
          <p className="text-sm text-foreground-muted mt-1">Police Station: {firData.stationName || "Koramangala"}</p>
        </div>

        {/* FIR Number */}
        <div className="bg-background-tertiary p-3 rounded-md">
          <p className="text-sm text-foreground-muted">FIR Number</p>
          <p className="text-lg font-semibold text-foreground">{firData.firNumber || "Pending Assignment"}</p>
        </div>

        {/* Complainant Details */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Complainant Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-foreground-muted">Name</p>
              <p className="text-foreground">{firData.complainantName}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Father's Name</p>
              <p className="text-foreground">{firData.complainantFatherName || "N/A"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Phone</p>
              <p className="text-foreground">{firData.complainantPhone}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Address</p>
              <p className="text-foreground">{firData.complainantAddress}</p>
            </div>
          </div>
        </div>

        {/* Incident Details */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Incident Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-foreground-muted">Date & Time</p>
              <p className="text-foreground">
                {firData.incidentDate} at {firData.incidentTime}
              </p>
            </div>
            <div>
              <p className="text-foreground-muted">Location</p>
              <p className="text-foreground">{firData.incidentLocation}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Description</p>
              <p className="text-foreground whitespace-pre-wrap">{firData.description}</p>
            </div>
          </div>
        </div>

        {/* IPC Sections */}
        {firData.ipcSections && firData.ipcSections.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">IPC Sections</h3>
            <div className="flex flex-wrap gap-2">
              {firData.ipcSections.map((section: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-accent/10 text-accent rounded-md text-sm"
                >
                  {section}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Property Details */}
        {firData.propertyItems && firData.propertyItems.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Property Details</h3>
            <div className="space-y-2">
              {firData.propertyItems.map((item: any, index: number) => (
                <div key={index} className="p-2 bg-background-tertiary rounded text-sm">
                  <p className="font-medium">{item.description}</p>
                  <p className="text-foreground-muted">Value: ₹{item.estimatedValue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-4 mt-6">
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-foreground-muted">Registered By</p>
              <p className="text-foreground">{firData.registeredBy || "Current User"}</p>
            </div>
            <div className="text-right">
              <p className="text-foreground-muted">Date</p>
              <p className="text-foreground">{new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="secondary" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
