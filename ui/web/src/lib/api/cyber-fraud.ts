import apiClient from "./client";

/**
 * Phase 05 — Cybercrime & Financial Fraud API.
 *
 * Field names mirror the Go models in internal/models/cyber_fraud.go. Every
 * amount is integer paise; convert only at the edge of the screen.
 */

export type ComplaintType =
  | "PHISHING"
  | "RANSOMWARE"
  | "IDENTITY_THEFT"
  | "ONLINE_FRAUD"
  | "CYBER_STALKING"
  | "DATA_BREACH"
  | "SOCIAL_ENGINEERING"
  | "CRYPTO_FRAUD"
  | "CHILD_EXPLOITATION"
  | "HACKING"
  | "MALWARE"
  | "OTHER";

export const COMPLAINT_TYPES: ComplaintType[] = [
  "ONLINE_FRAUD",
  "PHISHING",
  "SOCIAL_ENGINEERING",
  "IDENTITY_THEFT",
  "CRYPTO_FRAUD",
  "RANSOMWARE",
  "HACKING",
  "MALWARE",
  "DATA_BREACH",
  "CYBER_STALKING",
  "CHILD_EXPLOITATION",
  "OTHER",
];

export type ComplaintStatus = "REPORTED" | "ANALYZING" | "INVESTIGATING" | "ESCALATED" | "RESOLVED" | "CLOSED";
export const COMPLAINT_STATUSES: ComplaintStatus[] = [
  "REPORTED",
  "ANALYZING",
  "INVESTIGATING",
  "ESCALATED",
  "RESOLVED",
  "CLOSED",
];

export type Platform =
  | "WEBSITE"
  | "MOBILE_APP"
  | "SOCIAL_MEDIA"
  | "EMAIL"
  | "MESSAGING"
  | "BANKING"
  | "ECOMMERCE"
  | "CRYPTO"
  | "OTHER";
export const PLATFORMS: Platform[] = [
  "BANKING",
  "MOBILE_APP",
  "MESSAGING",
  "SOCIAL_MEDIA",
  "WEBSITE",
  "ECOMMERCE",
  "EMAIL",
  "CRYPTO",
  "OTHER",
];

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Complaint {
  id: string;
  caseNumber: string;
  firId: string | null;
  firNumber: string;
  type: ComplaintType;
  status: ComplaintStatus;
  priority: Priority;
  complainantName: string;
  complainantPhone: string | null;
  complainantEmail: string | null;
  incidentDate: string;
  incidentDescription: string;
  platform: Platform;
  platformName: string | null;
  ncrpReference: string | null;
  helplineReference: string | null;
  reportedLossPaise: number;
  stationId: string | null;
  stationName: string;
  investigatingOfficer: string | null;
  ioName: string;
  registeredBy: string | null;
  registeredByName: string;
  reportedAt: string;
  resolvedAt: string | null;
  entityCount: number;
  frozenPaise: number;
  recoveredPaise: number;
  linkedComplaints: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintInput {
  type: ComplaintType;
  priority: Priority;
  complainantName: string;
  complainantPhone: string | null;
  complainantEmail: string | null;
  incidentDate: string;
  incidentDescription: string;
  platform: Platform;
  platformName: string | null;
  ncrpReference: string | null;
  helplineReference: string | null;
  reportedLossPaise: number;
  firId: string | null;
  investigatingOfficer: string | null;
}

export type EntityType = "PHONE" | "UPI" | "BANK_ACCOUNT" | "WALLET" | "URL" | "EMAIL";
export const ENTITY_TYPES: EntityType[] = ["UPI", "BANK_ACCOUNT", "PHONE", "WALLET", "URL", "EMAIL"];
export const MONEY_BEARING: EntityType[] = ["UPI", "BANK_ACCOUNT", "WALLET"];

export type EntityRole = "SUSPECT_CONTACT" | "BENEFICIARY" | "INFRASTRUCTURE" | "VICTIM_OWN";
export const ENTITY_ROLES: EntityRole[] = ["BENEFICIARY", "SUSPECT_CONTACT", "INFRASTRUCTURE", "VICTIM_OWN"];

export interface Entity {
  id: string;
  type: EntityType;
  valueNormalized: string;
  displayValue: string;
  ifsc: string | null;
  provider: string | null;
  complaintCount: number;
  createdAt: string;
}

export interface ComplaintEntity {
  id: string;
  complaintId: string;
  entity: Entity;
  role: EntityRole;
  note: string | null;
  recordedByName: string;
  createdAt: string;
  otherComplaints: number;
}

export interface RecordEntityInput {
  type: EntityType;
  value: string;
  ifsc?: string | null;
  provider?: string | null;
  role: EntityRole;
  note?: string | null;
}

export interface Transaction {
  id: string;
  complaintId: string;
  from: Entity;
  to: Entity;
  amountPaise: number;
  reference: string | null;
  occurredAt: string;
  note: string | null;
  recordedByName: string;
  createdAt: string;
}

export interface RecordTransactionInput {
  fromEntityId: string;
  toEntityId: string;
  amountPaise: number;
  reference?: string | null;
  occurredAt: string;
  note?: string | null;
}

export type FreezeStatus = "DRAFTED" | "SENT" | "ACKNOWLEDGED" | "FROZEN" | "REJECTED";

export interface FreezeRequest {
  id: string;
  requestNumber: string;
  complaintId: string;
  caseNumber: string;
  entity: Entity;
  addressee: string;
  amountRequestedPaise: number;
  grounds: string;
  status: FreezeStatus;
  sentAt: string | null;
  sentByName: string;
  sentVia: string | null;
  acknowledgedAt: string | null;
  acknowledgementRef: string | null;
  amountFrozenPaise: number | null;
  resolvedAt: string | null;
  resolvedByName: string;
  rejectionReason: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftFreezeInput {
  entityId: string;
  addressee: string;
  amountRequestedPaise: number;
  grounds: string;
}

export type FreezeTransition =
  | { action: "send"; sentVia: string }
  | { action: "acknowledge"; acknowledgementRef?: string | null }
  | { action: "frozen"; amountFrozenPaise: number }
  | { action: "reject"; rejectionReason: string };

export interface Recovery {
  id: string;
  complaintId: string;
  freezeRequestId: string | null;
  freezeRequestNumber: string;
  amountPaise: number;
  recoveredOn: string;
  reference: string | null;
  note: string | null;
  recordedByName: string;
  createdAt: string;
}

export interface RecordRecoveryInput {
  amountPaise: number;
  recoveredOn: string;
  freezeRequestId?: string | null;
  reference?: string | null;
  note?: string | null;
}

export interface Dashboard {
  complaints: number;
  openComplaints: number;
  reportedLossPaise: number;
  frozenPaise: number;
  recoveredPaise: number;
  freezeByStatus: Partial<Record<FreezeStatus, number>>;
  byType: Partial<Record<ComplaintType, number>>;
  linkedComplaints: number;
}

export interface NetworkNode {
  id: string;
  kind: "complaint" | "entity";
  label: string;
  sublabel: string;
  type: string;
  focus: boolean;
}

export interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  kind: "named" | "transfer";
  label: string;
  amountPaise?: number;
}

export interface Network {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface Cluster {
  complaints: {
    id: string;
    caseNumber: string;
    complainantName: string;
    reportedLossPaise: number;
    reportedAt: string;
  }[];
  sharedEntities: Entity[];
  reportedLossPaise: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ComplaintQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ComplaintStatus;
  type?: ComplaintType;
}

type DataOf<T> = { data: T };

export const cyberFraudApi = {
  list: (q: ComplaintQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (q.page) params.page = q.page;
    if (q.pageSize) params.pageSize = q.pageSize;
    if (q.search) params.search = q.search;
    if (q.status) params.status = q.status;
    if (q.type) params.type = q.type;
    return apiClient.get<Paginated<Complaint>>("/cyber-crime", params);
  },
  dashboard: () => apiClient.get<Dashboard>("/cyber-crime/dashboard"),
  clusters: () => apiClient.get<{ data: Cluster[]; rule: string }>("/cyber-crime/clusters"),
  searchEntities: (type: EntityType | "", q: string) => {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (q) params.q = q;
    return apiClient.get<DataOf<Entity[]>>("/cyber-crime/entities", params).then((r) => r.data);
  },
  get: (id: string) => apiClient.get<Complaint>(`/cyber-crime/${id}`),
  register: (input: ComplaintInput) => apiClient.post<Complaint>("/cyber-crime", input),
  update: (id: string, input: ComplaintInput) => apiClient.put<Complaint>(`/cyber-crime/${id}`, input),
  setStatus: (id: string, status: ComplaintStatus) =>
    apiClient.patch<Complaint>(`/cyber-crime/${id}/status`, { status }),
  network: (id: string) => apiClient.get<Network>(`/cyber-crime/${id}/network`),

  entities: (id: string) =>
    apiClient.get<DataOf<ComplaintEntity[]>>(`/cyber-crime/${id}/entities`).then((r) => r.data),
  recordEntity: (id: string, input: RecordEntityInput) =>
    apiClient.post<ComplaintEntity>(`/cyber-crime/${id}/entities`, input),
  removeEntity: (id: string, linkId: string) => apiClient.delete<void>(`/cyber-crime/${id}/entities/${linkId}`),

  transactions: (id: string) =>
    apiClient.get<DataOf<Transaction[]>>(`/cyber-crime/${id}/transactions`).then((r) => r.data),
  recordTransaction: (id: string, input: RecordTransactionInput) =>
    apiClient.post<Transaction>(`/cyber-crime/${id}/transactions`, input),

  freezeRequests: (id: string) =>
    apiClient.get<DataOf<FreezeRequest[]>>(`/cyber-crime/${id}/freeze-requests`).then((r) => r.data),
  draftFreeze: (id: string, input: DraftFreezeInput) =>
    apiClient.post<FreezeRequest>(`/cyber-crime/${id}/freeze-requests`, input),
  transitionFreeze: (id: string, freezeId: string, step: FreezeTransition) =>
    apiClient.post<FreezeRequest>(`/cyber-crime/${id}/freeze-requests/${freezeId}/transition`, step),

  recoveries: (id: string) =>
    apiClient.get<DataOf<Recovery[]>>(`/cyber-crime/${id}/recoveries`).then((r) => r.data),
  recordRecovery: (id: string, input: RecordRecoveryInput) =>
    apiClient.post<Recovery>(`/cyber-crime/${id}/recoveries`, input),
};

/** ₹ with Indian digit grouping, paise shown only when present. */
export function formatPaise(paise: number): string {
  const rupees = Math.trunc(paise / 100);
  const rest = Math.abs(paise % 100);
  return `₹${rupees.toLocaleString("en-IN")}${rest ? `.${String(rest).padStart(2, "0")}` : ""}`;
}

/** Parses a rupee amount typed by an officer into paise, or null when invalid. */
export function rupeesToPaise(input: string): number | null {
  const v = input.replace(/[,₹\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  const [whole, frac = ""] = v.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

export default cyberFraudApi;
