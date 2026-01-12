// User & Auth Types
export type Role =
  | "CONSTABLE"
  | "HEAD_CONSTABLE"
  | "ASI"
  | "SI"
  | "INSPECTOR"
  | "SHO"
  | "DSP"
  | "SP"
  | "DIG"
  | "IG"
  | "DGP"
  | "ADMIN";

export interface User {
  id: string;
  name: string;
  badgeNumber: string;
  role: Role;
  stationId: string;
  stationName: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  avatar?: string;
}

// FIR Types
export type FIRStatus =
  | "REGISTERED"
  | "UNDER_INVESTIGATION"
  | "PENDING"
  | "CHARGESHEET_FILED"
  | "COURT_PENDING"
  | "CLOSED"
  | "TRANSFERRED";

export type FIRPriority = "LOW" | "MEDIUM" | "NORMAL" | "HIGH" | "CRITICAL";

export interface FIR {
  id: string;
  firNumber: string;
  stationId: string;
  stationName: string;

  // Complainant
  complainantName: string;
  complainantPhone: string;
  complainantAddress: string;

  // Incident
  incidentDate: string;
  incidentTime?: string;
  incidentLocation: string;

  // Offence
  offenceCategory: string;
  offenceType: string;
  ipcSections: string[];
  description: string;

  // Status
  status: FIRStatus;
  priority: FIRPriority;

  // Assignment
  investigatingOfficer?: string;
  investigatingOfficerName?: string;

  // Related cases
  linkedCases?: string[];

  // Dates
  registeredAt: string;
  registeredBy: string;
  updatedAt: string;
}

// Case Types
export interface CaseDiaryEntry {
  id: string;
  caseId: string;
  date: string;
  time: string;
  officerId: string;
  officerName: string;
  content: string;
  nextAction?: string;
  attachments: string[];
}

// Evidence Types
export type EvidenceType = "PHYSICAL" | "DIGITAL" | "DOCUMENTARY";
export type EvidenceStatus = "COLLECTED" | "IN_CUSTODY" | "AT_LAB" | "RETURNED" | "DISPOSED";

export interface Evidence {
  id: string;
  evidenceNumber: string;
  firId: string;
  type: EvidenceType;
  category: string;
  description: string;
  collectedBy: string;
  collectedAt: string;
  location: string;
  status: EvidenceStatus;
  currentCustodian: string;
  integrityVerified: boolean;
}

// Personnel Types
export interface Officer {
  id: string;
  name: string;
  badgeNumber: string;
  rank: string;
  stationId: string;
  status: "ON_DUTY" | "OFF_DUTY" | "ON_LEAVE" | "SUSPENDED";
  phone: string;
  assignedCases: number;
}

// Alert Types
export type AlertType = "FLASH" | "URGENT" | "NOTICE";
export type AlertScope = "STATION" | "DISTRICT" | "STATE" | "NATIONAL";

export interface Alert {
  id: string;
  type: AlertType;
  scope: AlertScope;
  title: string;
  description: string;
  issuedAt: string;
  expiresAt?: string;
  acknowledged: boolean;
}

// Stats Types
export interface StationStats {
  firsToday: number;
  firsThisMonth: number;
  pendingCases: number;
  closedCases: number;
  officersOnDuty: number;
  totalOfficers: number;
  vehiclesActive: number;
  totalVehicles: number;
}

// Sync Types
export type SyncStatus = "ONLINE" | "OFFLINE" | "SYNCING" | "ERROR";

export interface SyncState {
  status: SyncStatus;
  lastSyncTime: string | null;
  pendingChanges: number;
}
