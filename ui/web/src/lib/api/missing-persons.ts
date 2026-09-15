import apiClient from "./client";

/**
 * Phase 04 — Missing & Vulnerable Persons.
 *
 * Field names mirror the Go models in internal/models/missing_person.go
 * exactly. Nullable columns arrive as `null`.
 */

export type MissingPersonStatus = "REPORTED" | "SEARCHING" | "FOUND" | "CLOSED";
export type MissingPriority = "NORMAL" | "HIGH" | "CRITICAL";
export type Vulnerability = "CHILD" | "ELDERLY" | "DISABILITY" | "MENTAL_HEALTH" | "TRAFFICKING_RISK";
export type Gender = "MALE" | "FEMALE" | "TRANSGENDER" | "UNKNOWN";
export type ClosureOutcome = "TRACED" | "RETURNED" | "DECEASED" | "OTHER";
export type SightingSource = "OFFICER_OBSERVATION" | "PUBLIC_TIP" | "CCTV_REVIEW" | "OTHER";
export type ContactChannel = "IN_PERSON" | "PHONE" | "SMS" | "WHATSAPP" | "EMAIL" | "LETTER";
export type ContactDirection = "OUTBOUND" | "INBOUND";

export const VULNERABILITIES: Vulnerability[] = ["CHILD", "ELDERLY", "DISABILITY", "MENTAL_HEALTH", "TRAFFICKING_RISK"];
export const GENDERS: Gender[] = ["FEMALE", "MALE", "TRANSGENDER", "UNKNOWN"];
export const OUTCOMES: ClosureOutcome[] = ["TRACED", "RETURNED", "DECEASED", "OTHER"];
export const SIGHTING_SOURCES: SightingSource[] = ["OFFICER_OBSERVATION", "PUBLIC_TIP", "CCTV_REVIEW", "OTHER"];
export const CHANNELS: ContactChannel[] = ["PHONE", "IN_PERSON", "SMS", "WHATSAPP", "EMAIL", "LETTER"];

export interface MissingPerson {
  id: string;
  reportNumber: string;
  status: MissingPersonStatus;
  source: "CITIZEN" | "OFFICER";
  priority: MissingPriority;
  vulnerabilities: Vulnerability[];
  personName: string;
  age: number;
  gender: string;
  height: string | null;
  complexion: string | null;
  identifyingMarks: string | null;
  lastSeenLocation: string;
  lastSeenAt: string;
  lastSeenWearing: string | null;
  circumstances: string | null;
  reporterName: string;
  reporterPhone: string;
  reporterRelation: string;
  stationId: string | null;
  stationName: string;
  assignedTo: string | null;
  assignedToName: string;
  firId: string | null;
  firNumber: string;
  lookoutId: string | null;
  lookoutNumber: string;
  registeredBy: string | null;
  registeredByName: string;
  searchStartedBy: string | null;
  searchStartedAt: string | null;
  closureOutcome: ClosureOutcome | null;
  closedAt: string | null;
  closedByName: string;
  closureNote: string | null;
  foundLocation: string | null;
  foundCondition: string | null;
  checklistTotal: number;
  checklistDone: number;
  checklistOverdue: number;
  sightingCount: number;
  verifiedSightings: number;
  lastVerifiedAt: string | null;
  /** True when a child's identifying details were withheld for this viewer. */
  masked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  itemCode: string;
  label: string;
  sequence: number;
  dueAt: string;
  completedAt: string | null;
  completedByName: string;
  note: string | null;
  overdue: boolean;
}

export interface MissingSighting {
  id: string;
  reportId: string;
  reportedBy: string;
  reportedByName: string;
  source: SightingSource;
  location: string;
  latitude: number | null;
  longitude: number | null;
  sightedAt: string;
  details: string;
  decision: "VERIFIED" | "REJECTED" | null;
  decidedByName: string;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
}

export interface MovementPoint {
  kind: "LAST_SEEN" | "VERIFIED_SIGHTING";
  sightingId: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  at: string;
  minutesSincePrevious: number | null;
}

export interface FamilyContact {
  id: string;
  officerId: string;
  officerName: string;
  direction: ContactDirection;
  channel: ContactChannel;
  contactName: string;
  summary: string;
  contactedAt: string;
  createdAt: string;
}

export interface MissingPersonStats {
  reported: number;
  searching: number;
  critical: number;
  vulnerable: number;
  overdueChecklist: number;
  unverifiedSightings: number;
  foundLast30Days: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MissingPersonQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: MissingPersonStatus;
  priority?: MissingPriority;
  vulnerable?: boolean;
  overdue?: boolean;
}

export interface RegisterMissingPersonInput {
  personName: string;
  age: number;
  gender: Gender;
  height?: string | null;
  complexion?: string | null;
  identifyingMarks?: string | null;
  lastSeenLocation: string;
  lastSeenAt: string;
  lastSeenWearing?: string | null;
  circumstances?: string | null;
  vulnerabilities: Vulnerability[];
  reporterName: string;
  reporterPhone: string;
  reporterRelation: string;
  assignedTo?: string | null;
  firId?: string | null;
}

export interface UpdateMissingPersonInput {
  height?: string;
  complexion?: string;
  identifyingMarks?: string;
  lastSeenWearing?: string;
  circumstances?: string;
  vulnerabilities?: Vulnerability[];
  assignedTo?: string;
  firId?: string;
}

export interface RecordSightingInput {
  source: SightingSource;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  sightedAt: string;
  details?: string;
}

export interface RecordContactInput {
  direction: ContactDirection;
  channel: ContactChannel;
  contactName: string;
  summary: string;
  contactedAt: string;
}

export interface CloseInput {
  outcome: ClosureOutcome;
  note: string;
  foundLocation?: string | null;
  foundCondition?: string | null;
}

const unwrap = async <T>(p: Promise<{ data: T[] | null }>) => (await p).data ?? [];

export const missingPersonsApi = {
  list: (query: MissingPersonQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.priority) params.priority = query.priority;
    if (query.vulnerable) params.vulnerable = "true";
    if (query.overdue) params.overdue = "true";
    return apiClient.get<Paginated<MissingPerson>>("/missing-persons", params);
  },
  stats: () => apiClient.get<MissingPersonStats>("/missing-persons/stats"),
  get: (id: string) => apiClient.get<MissingPerson>(`/missing-persons/${id}`),
  register: (input: RegisterMissingPersonInput) => apiClient.post<MissingPerson>("/missing-persons", input),
  update: (id: string, input: UpdateMissingPersonInput) => apiClient.patch<MissingPerson>(`/missing-persons/${id}`, input),
  startSearch: (id: string) => apiClient.post<MissingPerson>(`/missing-persons/${id}/start-search`, {}),
  checklist: (id: string) => unwrap(apiClient.get<{ data: ChecklistItem[] | null }>(`/missing-persons/${id}/checklist`)),
  completeItem: (id: string, itemCode: string, note: string) =>
    apiClient.post<ChecklistItem>(`/missing-persons/${id}/checklist/${itemCode}/complete`, { note }),
  sightings: (id: string) => unwrap(apiClient.get<{ data: MissingSighting[] | null }>(`/missing-persons/${id}/sightings`)),
  recordSighting: (id: string, input: RecordSightingInput) =>
    apiClient.post<MissingSighting>(`/missing-persons/${id}/sightings`, input),
  verifySighting: (id: string, sightingId: string, note: string) =>
    apiClient.post<MissingSighting>(`/missing-persons/${id}/sightings/${sightingId}/verify`, { note }),
  rejectSighting: (id: string, sightingId: string, note: string) =>
    apiClient.post<MissingSighting>(`/missing-persons/${id}/sightings/${sightingId}/reject`, { note }),
  movement: (id: string) => unwrap(apiClient.get<{ data: MovementPoint[] | null }>(`/missing-persons/${id}/movement`)),
  contacts: (id: string) => unwrap(apiClient.get<{ data: FamilyContact[] | null }>(`/missing-persons/${id}/family-contacts`)),
  recordContact: (id: string, input: RecordContactInput) =>
    apiClient.post<FamilyContact>(`/missing-persons/${id}/family-contacts`, input),
  close: (id: string, input: CloseInput) => apiClient.post<MissingPerson>(`/missing-persons/${id}/close`, input),
  issueLookout: (id: string) => apiClient.post<MissingPerson>(`/missing-persons/${id}/lookout`, {}),
};

export default missingPersonsApi;
