import apiClient from "./client";

/**
 * Phase 09 — citizen complaint register.
 *
 * Field names mirror the Go models in internal/models/complaint.go. Nullable
 * columns arrive as `null`.
 */

export type ComplaintChannel = "WEB" | "MOBILE" | "WHATSAPP" | "EMAIL" | "CALL_CENTRE" | "COUNTER";
export type ComplaintCategory =
  | "THEFT"
  | "FRAUD"
  | "ASSAULT"
  | "CYBER_CRIME"
  | "MISSING_PERSON"
  | "DOMESTIC_VIOLENCE"
  | "TRAFFIC"
  | "NOISE_COMPLAINT"
  | "DRUG_RELATED"
  | "OTHER";
export type ComplaintStatus =
  | "SUBMITTED"
  | "ACKNOWLEDGED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REJECTED";
export type ComplaintPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TextScript = "LATIN" | "BENGALI" | "MIXED";

export const COMPLAINT_CATEGORIES: ComplaintCategory[] = [
  "THEFT",
  "FRAUD",
  "ASSAULT",
  "CYBER_CRIME",
  "MISSING_PERSON",
  "DOMESTIC_VIOLENCE",
  "TRAFFIC",
  "NOISE_COMPLAINT",
  "DRUG_RELATED",
  "OTHER",
];
export const OFFICER_CHANNELS: ComplaintChannel[] = ["COUNTER", "CALL_CENTRE", "WHATSAPP", "EMAIL", "MOBILE"];
export const COMPLAINT_PRIORITIES: ComplaintPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

/** Channels an officer enters on behalf of a system the platform does not receive from. */
export const needsSourceReference = (c: ComplaintChannel) =>
  c === "MOBILE" || c === "WHATSAPP" || c === "EMAIL" || c === "CALL_CENTRE";

/** Officer-driven status changes the API accepts, per current status. */
export const STATUS_TRANSITIONS: Partial<Record<ComplaintStatus, ComplaintStatus[]>> = {
  SUBMITTED: ["REJECTED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "RESOLVED", "REJECTED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
};

export const OPEN_STATUSES: ComplaintStatus[] = ["SUBMITTED", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS"];

export interface Complaint {
  id: string;
  trackingNumber: string;
  channel: ComplaintChannel;
  sourceReference: string | null;
  recordedBy: string | null;
  recordedByName: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  textScript: TextScript;
  isAnonymous: boolean;
  complainantName: string | null;
  complainantPhone: string | null;
  complainantEmail: string | null;
  complainantAddress: string | null;
  subject: string;
  description: string;
  incidentDate: string | null;
  incidentLocation: string | null;
  stationId: string | null;
  stationName: string;
  assignedTo: string | null;
  assignedToName: string;
  firId: string | null;
  firNumber: string;
  categorisedByName: string;
  categorisedAt: string | null;
  duplicateOf: string | null;
  duplicateOfNumber: string;
  duplicateLinkedByName: string;
  duplicateLinkedAt: string | null;
  duplicateNote: string | null;
  linkedDuplicates: number;
  rejectionReason: string | null;
  pendingResponses: number;
  approvedResponses: number;
  submittedAt: string;
  acknowledgedAt: string | null;
  assignedAt: string | null;
  resolvedAt: string | null;
  updatedAt: string;
  ageDays: number;
  acknowledgeOverdue: boolean;
  resolutionOverdue: boolean;
}

export interface ComplaintRouting {
  id: string;
  fromStationId: string | null;
  fromStationName: string;
  toStationId: string;
  toStationName: string;
  toUnit: string | null;
  reason: string;
  routedByName: string;
  routedAt: string;
}

export interface ComplaintResponse {
  id: string;
  complaintId: string;
  body: string;
  status: "DRAFT" | "APPROVED" | "REJECTED";
  draftedBy: string;
  draftedByName: string;
  draftedAt: string;
  reviewedByName: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface ComplaintHistoryEntry {
  id: string;
  status: ComplaintStatus;
  message: string;
  isPublic: boolean;
  updatedByName: string;
  createdAt: string;
}

export interface ComplaintDetail extends Complaint {
  history: ComplaintHistoryEntry[];
  routings: ComplaintRouting[];
  responses: ComplaintResponse[];
}

export interface DuplicateCandidate {
  id: string;
  trackingNumber: string;
  subject: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  submittedAt: string;
  rule: "SAME_PHONE" | "SAME_SOURCE_REFERENCE";
}

export interface ComplaintStats {
  open: number;
  unrouted: number;
  acknowledgeOverdue: number;
  resolutionOverdue: number;
  awaitingApproval: number;
  bengaliOrMixed: number;
  linkedDuplicates: number;
  acknowledgeWithinHours: number;
  resolveWithinDays: number;
  duplicateWindowDays: number;
}

export interface RoutingTarget {
  id: string;
  code: string;
  name: string;
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
  category?: ComplaintCategory;
  channel?: ComplaintChannel;
  priority?: ComplaintPriority;
  /** LATIN, BENGALI, MIXED, or NON_LATIN for Bengali and mixed together. */
  script?: TextScript | "NON_LATIN";
  unrouted?: boolean;
  overdue?: boolean;
  open?: boolean;
}

export interface ComplaintIntake {
  channel: ComplaintChannel;
  sourceReference?: string | null;
  category: ComplaintCategory;
  isAnonymous: boolean;
  complainantName?: string | null;
  complainantPhone?: string | null;
  complainantEmail?: string | null;
  complainantAddress?: string | null;
  subject: string;
  description: string;
  incidentDate?: string | null;
  incidentLocation?: string | null;
}

/* ------------------------------------------------------------------ public */

export interface PublicComplaintView {
  trackingNumber: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  subject: string;
  submittedAt: string;
  lastUpdatedAt: string;
  stationName: string;
  handledWithRelated: boolean;
  rejectionReason: string | null;
  history: { status: ComplaintStatus; message: string; at: string }[];
  responses: { body: string; issuedAt: string }[];
}

export interface PublicSubmitResult {
  trackingNumber: string;
  /** Only for anonymous complaints; shown once and never retrievable again. */
  accessCode?: string;
}

export const complaintsApi = {
  list: (query: ComplaintQuery = {}) => {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === "" || v === false) continue;
      params[k] = v === true ? "true" : (v as string | number);
    }
    return apiClient.get<Paginated<Complaint>>("/complaints", params);
  },
  stats: () => apiClient.get<ComplaintStats>("/complaints/stats"),
  routingTargets: () => apiClient.get<{ data: RoutingTarget[] }>("/complaints/routing-targets"),
  get: (id: string) => apiClient.get<ComplaintDetail>(`/complaints/${id}`),
  duplicateCandidates: (id: string) =>
    apiClient.get<{ data: DuplicateCandidate[]; windowDays: number }>(`/complaints/${id}/duplicate-candidates`),

  record: (input: ComplaintIntake) =>
    apiClient.post<{ complaint: Complaint; accessCode: string | null }>("/complaints", input),
  categorise: (id: string, category: ComplaintCategory, priority: ComplaintPriority) =>
    apiClient.post<Complaint>(`/complaints/${id}/categorise`, { category, priority }),
  route: (id: string, body: { stationId: string; unit?: string | null; assignedTo?: string | null; reason: string }) =>
    apiClient.post<Complaint>(`/complaints/${id}/route`, body),
  setStatus: (id: string, body: { status: ComplaintStatus; reason?: string | null; note?: string | null }) =>
    apiClient.post<Complaint>(`/complaints/${id}/status`, body),
  addNote: (id: string, note: string) => apiClient.post<void>(`/complaints/${id}/notes`, { note }),
  linkDuplicate: (id: string, originalId: string, note: string) =>
    apiClient.post<Complaint>(`/complaints/${id}/link-duplicate`, { originalId, note }),
  linkFIR: (id: string, firId: string) => apiClient.post<Complaint>(`/complaints/${id}/link-fir`, { firId }),
  draftResponse: (id: string, body: string) =>
    apiClient.post<ComplaintResponse>(`/complaints/${id}/responses`, { body }),
  reviewResponse: (id: string, responseId: string, approve: boolean, note?: string | null) =>
    apiClient.post<ComplaintResponse>(`/complaints/${id}/responses/${responseId}/review`, { approve, note }),
};

export default complaintsApi;

/* ------------------------------------------------------------ citizen side */

const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export class PublicApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "PublicApiError";
  }
}

/**
 * The citizen portal talks to the unauthenticated /public routes directly:
 * it must never attach an officer's session, and a 401 must not redirect a
 * member of the public to the officer sign-in page.
 */
async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PUBLIC_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "omit",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new PublicApiError(data?.message || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export interface PublicComplaintSubmission {
  category: ComplaintCategory;
  isAnonymous: boolean;
  complainantName?: string;
  complainantPhone?: string;
  complainantEmail?: string;
  complainantAddress?: string;
  subject: string;
  description: string;
  incidentDate?: string;
  incidentLocation?: string;
}

export const publicComplaintsApi = {
  submit: (input: PublicComplaintSubmission) => publicPost<PublicSubmitResult>("/public/complaints", input),
  track: (trackingNumber: string, secret: { phone?: string; accessCode?: string }) =>
    publicPost<PublicComplaintView>("/public/complaints/track", { trackingNumber, ...secret }),
};
