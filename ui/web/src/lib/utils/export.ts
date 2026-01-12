// Export utilities for CSV/Excel export

import { toast } from "@/stores/toastStore";

export function exportToCSV<T>(
  data: T[],
  filename: string,
  columns: { key: keyof T; header: string }[]
): void {
  if (data.length === 0) {
    toast.warning("No Data", "No data available to export");
    return;
  }

  // Create header row
  const headers = columns.map((col) => col.header);

  // Create data rows
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = (item as Record<string, unknown>)[col.key as string];
      // Handle different types
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      // Escape commas and quotes
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Predefined export configurations for each module
export const exportConfigs = {
  firs: [
    { key: "firNumber" as const, header: "FIR Number" },
    { key: "complainantName" as const, header: "Complainant" },
    { key: "complainantPhone" as const, header: "Phone" },
    { key: "incidentDate" as const, header: "Incident Date" },
    { key: "offenceType" as const, header: "Offence Type" },
    { key: "status" as const, header: "Status" },
    { key: "priority" as const, header: "Priority" },
    { key: "investigatingOfficerName" as const, header: "IO" },
    { key: "registeredAt" as const, header: "Registered At" },
  ],
  cases: [
    { key: "caseNumber" as const, header: "Case Number" },
    { key: "firNumber" as const, header: "FIR Number" },
    { key: "title" as const, header: "Title" },
    { key: "status" as const, header: "Status" },
    { key: "courtName" as const, header: "Court" },
    { key: "nextHearing" as const, header: "Next Hearing" },
    { key: "investigatingOfficerName" as const, header: "IO" },
    { key: "createdAt" as const, header: "Created At" },
  ],
  evidence: [
    { key: "evidenceNumber" as const, header: "Evidence ID" },
    { key: "firNumber" as const, header: "FIR Number" },
    { key: "type" as const, header: "Type" },
    { key: "category" as const, header: "Category" },
    { key: "status" as const, header: "Status" },
    { key: "currentCustodian" as const, header: "Custodian" },
    { key: "collectedBy" as const, header: "Collected By" },
    { key: "collectedAt" as const, header: "Collected At" },
  ],
  personnel: [
    { key: "badgeNumber" as const, header: "Badge Number" },
    { key: "name" as const, header: "Name" },
    { key: "rank" as const, header: "Rank" },
    { key: "status" as const, header: "Status" },
    { key: "phone" as const, header: "Phone" },
    { key: "email" as const, header: "Email" },
    { key: "stationName" as const, header: "Station" },
    { key: "currentDuty" as const, header: "Current Duty" },
  ],
  vehicles: [
    { key: "registrationNumber" as const, header: "Reg Number" },
    { key: "type" as const, header: "Type" },
    { key: "make" as const, header: "Make" },
    { key: "status" as const, header: "Status" },
    { key: "currentDriver" as const, header: "Driver" },
    { key: "fuelLevel" as const, header: "Fuel %" },
    { key: "odometerReading" as const, header: "Odometer" },
    { key: "currentDuty" as const, header: "Current Assignment" },
  ],
  alerts: [
    { key: "type" as const, header: "Type" },
    { key: "scope" as const, header: "Scope" },
    { key: "title" as const, header: "Title" },
    { key: "issuedBy" as const, header: "Issued By" },
    { key: "issuedAt" as const, header: "Issued At" },
    { key: "expiresAt" as const, header: "Expires At" },
    { key: "acknowledged" as const, header: "Acknowledged" },
  ],
  armoury: [
    { key: "weaponId" as const, header: "Weapon ID" },
    { key: "type" as const, header: "Type" },
    { key: "make" as const, header: "Make" },
    { key: "serialNumber" as const, header: "Serial Number" },
    { key: "status" as const, header: "Status" },
    { key: "assignedTo" as const, header: "Assigned To" },
    { key: "condition" as const, header: "Condition" },
  ],
  lookout: [
    { key: "lookoutId" as const, header: "Lookout ID" },
    { key: "type" as const, header: "Type" },
    { key: "name" as const, header: "Name/ID" },
    { key: "description" as const, header: "Description" },
    { key: "priority" as const, header: "Priority" },
    { key: "status" as const, header: "Status" },
    { key: "linkedFIR" as const, header: "Linked FIR" },
    { key: "issuedBy" as const, header: "Issued By" },
    { key: "issuedAt" as const, header: "Issued At" },
  ],
};
