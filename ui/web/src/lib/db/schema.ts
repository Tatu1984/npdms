import Dexie, { Table } from 'dexie';

// ============================================================================
// TYPE DEFINITIONS (matching backend models)
// ============================================================================

// FIR Types
export type FIRStatus = 'REGISTERED' | 'UNDER_INVESTIGATION' | 'PENDING' | 'CLOSED' | 'TRANSFERRED' | 'CHARGESHEET_FILED' | 'COURT_PENDING';
export type FIRPriority = 'LOW' | 'MEDIUM' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type CrimeCategory = 'VIOLENT' | 'PROPERTY' | 'CYBER' | 'ECONOMIC' | 'NARCOTICS' | 'SEXUAL' | 'ORGANIZED' | 'OTHER';

export interface FIR {
  id: string;
  firNumber: string;
  title: string;
  description: string;
  crimeCategory: CrimeCategory;
  ipcSections: string[];
  status: FIRStatus;
  priority: FIRPriority;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  latitude?: number;
  longitude?: number;
  // Complainant info
  reportedBy: string;
  reporterContact: string;
  reporterAddress: string;
  complainantName?: string;
  complainantPhone?: string;
  complainantAddress?: string;
  // Station & Officer
  stationId: string;
  stationName?: string;
  offenceType?: string;
  offenceCategory?: string;
  investigatingOfficer?: string;
  investigatingOfficerName?: string;
  linkedCases?: string[];
  registeredBy?: string;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean; // Offline sync flag
  _localOnly?: boolean; // Not synced to server yet
}

// Case Types
export type CaseStatus = 'ACTIVE' | 'INVESTIGATION' | 'CHARGESHEET' | 'TRIAL' | 'CLOSED' | 'ACQUITTED' | 'CONVICTED';

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  firId: string;
  firNumber?: string;
  stationId: string;
  investigatingOfficer?: string;
  prosecutingOfficer?: string;
  courtName?: string;
  nextHearing?: string;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

// Evidence Types
export type EvidenceType = 'PHYSICAL' | 'DIGITAL' | 'DOCUMENTARY' | 'TESTIMONIAL' | 'PHOTOGRAPHIC' | 'FORENSIC';
export type EvidenceStatus = 'COLLECTED' | 'UNDER_ANALYSIS' | 'PRESERVED' | 'SUBMITTED' | 'DESTROYED';

export interface Evidence {
  id: string;
  evidenceNumber: string;
  type: EvidenceType;
  status: EvidenceStatus;
  description: string;
  collectedDate: string;
  collectedBy: string;
  collectedFrom: string;
  chainOfCustody: string;
  location: string;
  caseId: string;
  firId?: string;
  hasPhoto: boolean;
  photoUrl?: string;
  analysisReport?: string;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

// Warrant Types
export type WarrantType = 'ARREST' | 'SEARCH' | 'SUMMONS' | 'NBW';
export type WarrantStatus = 'ACTIVE' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED';

export interface Warrant {
  id: string;
  warrantNumber: string;
  type: WarrantType;
  status: WarrantStatus;
  issuedFor: string;
  issuedBy: string;
  issuedByDesignation: string;
  issuedDate: string;
  validUntil?: string;
  caseId?: string;
  firId?: string;
  accusedId?: string;
  executionAddress?: string;
  executedBy?: string;
  executedAt?: string;
  executionRemarks?: string;
  priority: FIRPriority;
  courtName?: string;
  judgeOrder?: string;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

// Bail Types
export type BailType = 'REGULAR' | 'ANTICIPATORY' | 'INTERIM' | 'DEFAULT';
export type BailStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface Bail {
  id: string;
  applicationNumber: string;
  type: BailType;
  status: BailStatus;
  caseId: string;
  accusedId: string;
  accusedName: string;
  applicationDate: string;
  hearingDate?: string;
  bailAmount?: number;
  suretyAmount?: number;
  conditions?: string[];
  approvedBy?: string;
  approvedDate?: string;
  rejectedReason?: string;
  courtName?: string;
  lawyerName?: string;
  prosecutorName?: string;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

// Forensic Types
export type ForensicType = 'FINGERPRINT' | 'DNA' | 'BALLISTIC' | 'TOXICOLOGY' | 'DIGITAL_FORENSICS' | 'AUTOPSY' | 'HANDWRITING';
export type ForensicStatus = 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REPORTED';

export interface Forensic {
  id: string;
  requestNumber: string;
  type: ForensicType;
  status: ForensicStatus;
  caseId: string;
  evidenceId?: string;
  requestedBy: string;
  requestedDate: string;
  labName: string;
  labRefNumber?: string;
  expectedDate?: string;
  completedDate?: string;
  findings?: string;
  reportFile?: string;
  notes?: string;
  description?: string;
  priority: FIRPriority;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

// Personnel Types
export type PersonnelRank = 'CONSTABLE' | 'HEAD_CONSTABLE' | 'ASI' | 'SI' | 'INSPECTOR' | 'SHO' | 'DSP' | 'SP' | 'DIG' | 'IG' | 'SECRETARY' | 'DGP';
export type DutyStatus = 'ON_DUTY' | 'OFF_DUTY' | 'ON_LEAVE' | 'SUSPENDED' | 'RETIRED';

export interface Personnel {
  id: string;
  userId: string;
  badgeNumber: string;
  name: string;
  rank: PersonnelRank;
  designation: string;
  stationId: string;
  stationName?: string;
  phone: string;
  email: string;
  status?: string;  // For display
  dutyStatus: DutyStatus;
  currentAssignment?: string;
  currentDuty?: string;
  joiningDate: string;
  experience: number;
  specializations: string[];
  casesAssigned: number;
  emergencyContact: string;
  emergencyContactName: string;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

// Vehicle Types
export type VehicleType = 'PATROL_CAR' | 'MOTORCYCLE' | 'VAN' | 'TRUCK' | 'AMBULANCE' | 'DRONE';
export type VehicleStatus = 'AVAILABLE' | 'ALLOCATED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  type: VehicleType;
  status: VehicleStatus;
  make: string;
  model: string;
  year: number;
  stationId: string;
  allocatedTo?: string;
  allocatedToName?: string;
  allocatedDate?: string;
  fuelType: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  currentMileage?: number;
  gpsEnabled: boolean;
  latitude?: number;
  longitude?: number;
  lastLocationUpdate?: string;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

// Court Types
export type HearingType = 'INITIAL' | 'BAIL' | 'EVIDENCE' | 'ARGUMENT' | 'JUDGMENT' | 'APPEAL';
export type HearingStatus = 'SCHEDULED' | 'COMPLETED' | 'ADJOURNED' | 'CANCELLED';

export interface CourtHearing {
  id: string;
  caseId: string;
  caseNumber?: string;
  type: HearingType;
  status: HearingStatus;
  hearingDate: string;
  courtName: string;
  judgeType: string;
  judgeName: string;
  prosecutorName?: string;
  defenseLawyer?: string;
  attendingOfficer?: string;
  priority: FIRPriority;
  agenda?: string;
  outcome?: string;
  nextHearingDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

export type OrderType = 'BAIL' | 'CUSTODY' | 'INJUNCTION' | 'SUMMONS' | 'WARRANT' | 'JUDGMENT';

export interface CourtOrder {
  id: string;
  caseId: string;
  hearingId?: string;
  orderType: OrderType;
  orderDate: string;
  courtName: string;
  judgeName: string;
  orderSummary: string;
  fullText?: string;
  validUntil?: string;
  complianceStatus?: string;
  orderFile?: string;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

// Alert Types
export type AlertType = 'FLASH' | 'URGENT' | 'BOLO' | 'NOTICE';
export type AlertScope = 'STATION' | 'DISTRICT' | 'STATE' | 'NATIONAL';

export interface Alert {
  id: string;
  type: AlertType;
  scope: AlertScope;
  title: string;
  description: string;
  issuedAt: string;
  expiresAt: string;
  issuedBy: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  priority: 1 | 2 | 3;
  hasImage: boolean;
  imageUrl?: string;
  stationId?: string;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

// Accused Types
export interface Accused {
  id: string;
  firId: string;
  caseId?: string;
  name: string;
  fatherName?: string;
  age?: number;
  gender?: string;
  address?: string;
  phone?: string;
  identificationMarks?: string;
  arrested: boolean;
  arrestDate?: string;
  custody?: string;
  bail?: boolean;
  photoUrl?: string;
  fingerprints?: boolean;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

// Witness Types
export interface Witness {
  id: string;
  firId: string;
  caseId?: string;
  name: string;
  age?: number;
  gender?: string;
  address: string;
  phone: string;
  occupation?: string;
  statementRecorded: boolean;
  statementDate?: string;
  statementText?: string;
  isProtected: boolean;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _localOnly?: boolean;
}

// Offline Queue Types
export type MutationType = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface OfflineQueueItem {
  id: string;
  mutationType: MutationType;
  resourceType: string; // 'fir', 'case', 'evidence', etc.
  resourceId: string;
  payload: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: SyncStatus;
  error?: string;
  createdAt: string;
}

// Federated Sync Types
export type SyncLevel = 'STATION' | 'DISTRICT' | 'STATE' | 'NATIONAL';
export type SyncDirection = 'PUSH' | 'PULL' | 'BIDIRECTIONAL';

export interface SyncCheckpoint {
  id: string;
  resourceType: string;
  lastSyncTime: number;
  lastVersion: number;
  direction: SyncDirection;
  level: SyncLevel;
}

export interface SyncConflict {
  id: string;
  resourceType: string;
  resourceId: string;
  localData: any;
  serverData: any;
  localVersion: number;
  serverVersion: number;
  detectedAt: number;
  resolvedAt?: number;
  resolution?: string;
}

// ============================================================================
// DEXIE DATABASE SCHEMA
// ============================================================================

export class NPDMSDatabase extends Dexie {
  // Table declarations
  firs!: Table<FIR, string>;
  cases!: Table<Case, string>;
  evidence!: Table<Evidence, string>;
  warrants!: Table<Warrant, string>;
  bail!: Table<Bail, string>;
  forensics!: Table<Forensic, string>;
  personnel!: Table<Personnel, string>;
  vehicles!: Table<Vehicle, string>;
  courtHearings!: Table<CourtHearing, string>;
  courtOrders!: Table<CourtOrder, string>;
  alerts!: Table<Alert, string>;
  accused!: Table<Accused, string>;
  witnesses!: Table<Witness, string>;
  offlineQueue!: Table<OfflineQueueItem, string>;
  syncCheckpoints!: Table<SyncCheckpoint, string>;
  syncConflicts!: Table<SyncConflict, string>;

  constructor() {
    super('npdms');

    // Schema version 1
    this.version(1).stores({
      // FIRs - searchable by number, status, priority, category, date
      firs: 'id, firNumber, status, priority, crimeCategory, incidentDate, stationId, investigatingOfficer, registeredAt, [stationId+status], [_pending+_localOnly]',

      // Cases - searchable by number, status, FIR, court, dates
      cases: 'id, caseNumber, status, firId, stationId, investigatingOfficer, prosecutingOfficer, courtName, nextHearing, [firId+status], [_pending+_localOnly]',

      // Evidence - searchable by number, type, status, case, FIR
      evidence: 'id, evidenceNumber, type, status, caseId, firId, collectedDate, collectedBy, [caseId+status], [firId+status], [_pending+_localOnly]',

      // Warrants - searchable by number, type, status, case, accused
      warrants: 'id, warrantNumber, type, status, caseId, firId, accusedId, priority, issuedDate, validUntil, [status+type], [caseId+status], [_pending+_localOnly]',

      // Bail - searchable by application number, status, case, accused
      bail: 'id, applicationNumber, type, status, caseId, accusedId, applicationDate, hearingDate, [caseId+status], [accusedId+status], [_pending+_localOnly]',

      // Forensics - searchable by request number, type, status, case
      forensics: 'id, requestNumber, type, status, caseId, evidenceId, requestedDate, completedDate, priority, [caseId+status], [status+priority], [_pending+_localOnly]',

      // Personnel - searchable by badge, rank, station, duty status
      personnel: 'id, userId, badgeNumber, rank, stationId, dutyStatus, joiningDate, [stationId+dutyStatus], [rank+stationId], [_pending+_localOnly]',

      // Vehicles - searchable by number, type, status, station, allocated officer
      vehicles: 'id, vehicleNumber, type, status, stationId, allocatedTo, lastServiceDate, nextServiceDate, [stationId+status], [status+type], [_pending+_localOnly]',

      // Court Hearings - searchable by case, date, status, type
      courtHearings: 'id, caseId, type, status, hearingDate, courtName, attendingOfficer, priority, [caseId+status], [hearingDate+status], [_pending+_localOnly]',

      // Court Orders - searchable by case, hearing, order type, date
      courtOrders: 'id, caseId, hearingId, orderType, orderDate, courtName, [caseId+orderType], [orderDate+orderType], [_pending+_localOnly]',

      // Alerts - searchable by type, scope, priority, expiry, acknowledged
      alerts: 'id, type, scope, priority, issuedAt, expiresAt, acknowledged, stationId, [scope+acknowledged], [expiresAt+acknowledged], [_pending+_localOnly]',

      // Accused - searchable by FIR, case, arrested status
      accused: 'id, firId, caseId, name, arrested, arrestDate, [firId+arrested], [caseId+arrested], [_pending+_localOnly]',

      // Witnesses - searchable by FIR, case, statement recorded
      witnesses: 'id, firId, caseId, name, statementRecorded, statementDate, [firId+statementRecorded], [caseId+statementRecorded], [_pending+_localOnly]',

      // Offline Queue - searchable by status, resource type, timestamp
      offlineQueue: 'id, status, resourceType, resourceId, timestamp, retries, [status+resourceType], [timestamp+status]',

      // Federated Sync - checkpoints and conflicts
      syncCheckpoints: 'id, resourceType, level, lastSyncTime, [resourceType+level]',
      syncConflicts: 'id, resourceType, resourceId, detectedAt, resolvedAt, [resourceType+resolvedAt]',
    });
  }
}

// ============================================================================
// DATABASE INSTANCE (Singleton)
// ============================================================================

export const db = new NPDMSDatabase();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all data from IndexedDB (use with caution)
 */
export async function clearAllData() {
  await db.delete();
  window.location.reload();
}

/**
 * Get database size estimate
 */
export async function getDatabaseSize(): Promise<{ usage: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { usage: 0, quota: 0 };
}

/**
 * Get count of pending offline items
 */
export async function getPendingCount(): Promise<number> {
  const firs = await db.firs.where('_pending').equals(1).count();
  const cases = await db.cases.where('_pending').equals(1).count();
  const evidence = await db.evidence.where('_pending').equals(1).count();
  const warrants = await db.warrants.where('_pending').equals(1).count();
  const bail = await db.bail.where('_pending').equals(1).count();
  const forensics = await db.forensics.where('_pending').equals(1).count();
  const personnel = await db.personnel.where('_pending').equals(1).count();
  const vehicles = await db.vehicles.where('_pending').equals(1).count();
  const hearings = await db.courtHearings.where('_pending').equals(1).count();
  const orders = await db.courtOrders.where('_pending').equals(1).count();
  const alerts = await db.alerts.where('_pending').equals(1).count();

  return firs + cases + evidence + warrants + bail + forensics + personnel + vehicles + hearings + orders + alerts;
}

/**
 * Export all data as JSON (for backup)
 */
export async function exportData(): Promise<string> {
  const data = {
    firs: await db.firs.toArray(),
    cases: await db.cases.toArray(),
    evidence: await db.evidence.toArray(),
    warrants: await db.warrants.toArray(),
    bail: await db.bail.toArray(),
    forensics: await db.forensics.toArray(),
    personnel: await db.personnel.toArray(),
    vehicles: await db.vehicles.toArray(),
    courtHearings: await db.courtHearings.toArray(),
    courtOrders: await db.courtOrders.toArray(),
    alerts: await db.alerts.toArray(),
    accused: await db.accused.toArray(),
    witnesses: await db.witnesses.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON (for restore)
 */
export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);

  await db.transaction('rw', [
    db.firs,
    db.cases,
    db.evidence,
    db.warrants,
    db.bail,
    db.forensics,
    db.personnel,
    db.vehicles,
    db.courtHearings,
    db.courtOrders,
    db.alerts,
    db.accused,
    db.witnesses,
  ], async () => {
    if (data.firs) await db.firs.bulkPut(data.firs);
    if (data.cases) await db.cases.bulkPut(data.cases);
    if (data.evidence) await db.evidence.bulkPut(data.evidence);
    if (data.warrants) await db.warrants.bulkPut(data.warrants);
    if (data.bail) await db.bail.bulkPut(data.bail);
    if (data.forensics) await db.forensics.bulkPut(data.forensics);
    if (data.personnel) await db.personnel.bulkPut(data.personnel);
    if (data.vehicles) await db.vehicles.bulkPut(data.vehicles);
    if (data.courtHearings) await db.courtHearings.bulkPut(data.courtHearings);
    if (data.courtOrders) await db.courtOrders.bulkPut(data.courtOrders);
    if (data.alerts) await db.alerts.bulkPut(data.alerts);
    if (data.accused) await db.accused.bulkPut(data.accused);
    if (data.witnesses) await db.witnesses.bulkPut(data.witnesses);
  });
}
