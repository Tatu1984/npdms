import apiClient, { ApiClientError } from "./client";

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
  lastSeenLatitude: number | null;
  lastSeenLongitude: number | null;
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
  /** The active primary photograph, if any. */
  primaryPhotoId: string | null;
  photoCount: number;
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
  lastSeenLatitude?: number | null;
  lastSeenLongitude?: number | null;
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
  lastSeenLatitude?: number;
  lastSeenLongitude?: number;
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

/* ------------------------------------------------ photographs, board, map */

export type PhotoSource = "FAMILY" | "FRIEND" | "REPORTING_PERSON" | "OFFICER" | "CCTV_STILL" | "OTHER";
export const PHOTO_SOURCES: PhotoSource[] = ["FAMILY", "FRIEND", "REPORTING_PERSON", "OFFICER", "CCTV_STILL", "OTHER"];
export const PHOTO_MAX_BYTES = 8 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface MissingPersonPhoto {
  id: string;
  reportId: string;
  sha256: string;
  sizeBytes: number;
  contentType: string;
  width: number;
  height: number;
  storageBackend: string;
  locationMetadataRemoved: boolean;
  metadataNote: string;
  source: PhotoSource;
  providedByName: string;
  relationship: string;
  consentRecorded: boolean;
  consentNote: string | null;
  takenOn: string | null;
  isPrimary: boolean;
  qualityNote: string | null;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  retiredAt: string | null;
  retiredByName: string;
  retireReason: string | null;
}

export interface UploadPhotoInput {
  file: File;
  source: PhotoSource;
  providedByName: string;
  relationship: string;
  consentRecorded: boolean;
  consentNote?: string;
  takenOn?: string;
  qualityNote?: string;
  makePrimary?: boolean;
}

export type CheckOutcome = "NO_MATCH" | "POSSIBLE_MATCH" | "SIGHTING";
export const CHECK_OUTCOMES: CheckOutcome[] = ["NO_MATCH", "POSSIBLE_MATCH", "SIGHTING"];

export interface StationCheck {
  id: string;
  reportId: string;
  stationId: string;
  stationName: string;
  stationCode: string;
  outcome: CheckOutcome;
  details: string | null;
  sightingId: string | null;
  sightingDecision: "VERIFIED" | "REJECTED" | null;
  recordedBy: string;
  recordedByName: string;
  recordedByRank: string;
  createdAt: string;
}

export interface RecordStationCheckInput {
  outcome: CheckOutcome;
  details?: string;
  sighting?: RecordSightingInput;
}

export interface BoardStation {
  id: string;
  code: string;
  name: string;
}

/** The broadcast view of an open report. */
export interface BoardEntry {
  id: string;
  reportNumber: string;
  status: MissingPersonStatus;
  priority: MissingPriority;
  vulnerabilities: Vulnerability[];
  personName: string;
  age: number;
  gender: string;
  height: string | null;
  complexion: string | null;
  identifyingMarks: string | null;
  lastSeenWearing: string | null;
  lastSeenLocation: string;
  lastSeenAt: string;
  lastSeenLatitude: number | null;
  lastSeenLongitude: number | null;
  stationId: string | null;
  stationName: string;
  lodgedAt: string;
  primaryPhotoId: string | null;
  photoCount: number;
  verifiedSightings: number;
  checks: StationCheck[];
}

export interface Board {
  data: BoardEntry[];
  stations: BoardStation[];
  serverTime: string;
  viewerStationId: string | null;
}

export interface MapCamera {
  id: string;
  code: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  stationName: string;
}

export interface CameraMatch {
  id: string;
  photoId: string | null;
  cameraId: string | null;
  cameraName: string;
  sourceMedia: string;
  frameTime: string | null;
  latitude: number | null;
  longitude: number | null;
  pointFrom: "CANDIDATE" | "CAMERA" | "NONE";
  similarity: number | null;
  modelVersion: string;
  status: "PENDING" | "CONFIRMED";
  reviewedByName: string;
  reviewedAt: string | null;
  sightingId: string | null;
}

export interface PathPoint {
  kind: "LAST_SEEN" | "VERIFIED_SIGHTING" | "CONFIRMED_MATCH";
  refId: string | null;
  label: string;
  latitude: number;
  longitude: number;
  at: string;
}

export interface SearchMap {
  lastSeen: { location: string; latitude: number | null; longitude: number | null; at: string };
  sightings: MissingSighting[];
  cameraMatches: { available: boolean; error?: string; data: CameraMatch[] };
  cameras: MapCamera[];
  path: PathPoint[];
}

const API_BASE = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const bearer = () => (typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null);

/**
 * A request the JSON client cannot make (multipart, image bytes). On 401 the
 * session is renewed through the client once and the request retried.
 */
async function rawFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = () => {
    const token = bearer();
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const csrf = apiClient.getCsrfToken();
    if (init.method && init.method !== "GET" && csrf) headers.set("X-CSRF-Token", csrf);
    return fetch(`${API_BASE()}${path}`, { ...init, headers });
  };
  let response = await send();
  if (response.status === 401) {
    await apiClient.get("/me").catch(() => undefined);
    response = await send();
  }
  return response;
}

async function problem(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return new ApiClientError(body?.message ?? `${fallback} (status ${response.status})`, response.status, body?.error ?? "error");
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

  board: () => apiClient.get<Board>("/missing-persons/board"),
  photos: (id: string, includeRetired = false) =>
    unwrap(apiClient.get<{ data: MissingPersonPhoto[] | null }>(`/missing-persons/${id}/photos`, includeRetired ? { includeRetired: "true" } : undefined)),
  /** Multipart upload; the server checks the bytes, removes location data and hashes what it stores. */
  uploadPhoto: async (id: string, input: UploadPhotoInput) => {
    const form = new FormData();
    form.append("file", input.file);
    form.append("source", input.source);
    form.append("providedByName", input.providedByName);
    form.append("relationship", input.relationship);
    form.append("consentRecorded", String(input.consentRecorded));
    if (input.consentNote) form.append("consentNote", input.consentNote);
    if (input.takenOn) form.append("takenOn", input.takenOn);
    if (input.qualityNote) form.append("qualityNote", input.qualityNote);
    if (input.makePrimary) form.append("makePrimary", "true");
    const response = await rawFetch(`/missing-persons/${id}/photos`, { method: "POST", body: form });
    if (!response.ok) throw await problem(response, "Upload failed");
    return (await response.json()) as MissingPersonPhoto;
  },
  /** Image bytes with the officer's credentials, as a Blob for an object URL. */
  photoBlob: async (id: string, photoId: string, variant: "image" | "thumbnail") => {
    const response = await rawFetch(`/missing-persons/${id}/photos/${photoId}/${variant}`);
    if (!response.ok) throw await problem(response, "Photograph could not be loaded");
    return response.blob();
  },
  setPrimaryPhoto: (id: string, photoId: string) =>
    apiClient.post<MissingPersonPhoto>(`/missing-persons/${id}/photos/${photoId}/primary`, {}),
  retirePhoto: (id: string, photoId: string, reason: string) =>
    apiClient.post<MissingPersonPhoto>(`/missing-persons/${id}/photos/${photoId}/retire`, { reason }),
  stationChecks: (id: string) => unwrap(apiClient.get<{ data: StationCheck[] | null }>(`/missing-persons/${id}/station-checks`)),
  recordStationCheck: (id: string, input: RecordStationCheckInput) =>
    apiClient.post<StationCheck>(`/missing-persons/${id}/station-checks`, input),
  searchMap: (id: string) => apiClient.get<SearchMap>(`/missing-persons/${id}/map`),
};

export default missingPersonsApi;
