import apiClient from "./client";

/**
 * Statute library and Kolkata gazetteer API.
 *
 * Field names mirror the Go `models.LegalAct`, `models.LegalSection`,
 * `models.LegalCorrespondence` and `models.GazetteerPlace` exactly (see
 * internal/models/legal.go). Nullable columns arrive as `null`.
 *
 * Built-in Acts and sections are the published law text (India Code, the
 * Gazette of India, BPR&D correspondence table) and are read-only; SP and above
 * add custom Acts and sections, and every change carries a reason.
 */

export type ActCompleteness = "complete" | "selected";

export interface LegalAct {
  id: string;
  code: string;
  /** How the Act is written on an FIR, e.g. "BNS", "IT Act". */
  citation: string;
  shortName: string;
  name: string;
  year: number | null;
  actNumber: string | null;
  inForceFrom: string | null;
  /** IPC: 2024-07-01. Offences before that date are still charged under the IPC. */
  repealedFrom: string | null;
  source: string;
  sourceUrl: string | null;
  retrievedOn: string | null;
  completeness: ActCompleteness;
  status: "active" | "retired";
  isBuiltin: boolean;
  retiredReason: string | null;
  sectionCount: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalEquivalent {
  /** e.g. "BNS 318(4)" for IPC 420, or "IPC 420" for BNS 318. */
  citation: string;
  subject: string;
}

export interface OffenceClassification {
  /** Sub-section the row applies to, e.g. "318(4)". */
  ref: string;
  offence: string;
  punishment: string;
  cognizable: string;
  bailable: string;
  triableBy: string;
}

export interface LegalSection {
  id: string;
  actId: string;
  actCode: string;
  actShortName: string;
  actRepealed: boolean;
  number: string;
  heading: string;
  description: string | null;
  /** First Schedule of the BNSS, one row per sub-section; empty where the source gives none. */
  classification: OffenceClassification[];
  status: "in_force" | "repealed" | "retired";
  isBuiltin: boolean;
  retiredReason: string | null;
  /** How the section is written on an FIR, with any sub-section typed: "BNS 303(2)". */
  cite: string;
  equivalents: LegalEquivalent[];
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalCorrespondence {
  bnsRef: string;
  bnsSection: string;
  ipcRef: string;
  ipcSections: string[];
  subject: string;
  source: string;
}

export type PlaceKind =
  | "locality"
  | "road"
  | "landmark"
  | "police_station"
  | "rail_station"
  | "metro_station"
  | "pin_code";

export const PLACE_KINDS: PlaceKind[] = [
  "locality",
  "road",
  "landmark",
  "police_station",
  "metro_station",
  "rail_station",
  "pin_code",
];

export interface GazetteerPlace {
  id: string;
  kind: PlaceKind;
  name: string;
  nameBn: string | null;
  pin: string | null;
  latitude: number;
  longitude: number;
  source: "osm" | "officer";
  status: "active" | "retired";
  note: string | null;
  decisionReason: string | null;
  createdByName: string;
  decidedByName: string;
  decidedAt: string | null;
  createdAt: string;
  distanceMeters?: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ActInput {
  code?: string;
  citation: string;
  shortName: string;
  name: string;
  year: number | null;
  actNumber: string | null;
  source: string;
  sourceUrl: string | null;
  completeness: ActCompleteness;
  reason: string;
}

export interface SectionInput {
  number: string;
  heading: string;
  description: string | null;
  reason: string;
}

export interface PlaceInput {
  kind: PlaceKind;
  name: string;
  nameBn: string | null;
  pin: string | null;
  latitude: number;
  longitude: number;
  reason: string;
}

/** Offences committed before this date are charged under the IPC. */
export const BNS_COMMENCEMENT = "2024-07-01";

export const legalApi = {
  acts: (includeRetired = false) =>
    apiClient.get<{ data: LegalAct[] }>("/legal/acts", includeRetired ? { includeRetired: "true" } : undefined).then((r) => r.data),

  act: (id: string) => apiClient.get<LegalAct>(`/legal/acts/${id}`),

  actSections: (id: string, page = 1, pageSize = 50, includeRetired = false) =>
    apiClient.get<Paginated<LegalSection>>(`/legal/acts/${id}/sections`, {
      page,
      pageSize,
      ...(includeRetired ? { includeRetired: "true" } : {}),
    }),

  /** "303", "theft", "IPC 420", "BNS 318(4)". */
  searchSections: (q: string, act?: string, limit = 12) =>
    apiClient
      .get<{ data: LegalSection[] }>("/legal/sections", { q, limit, ...(act ? { act } : {}) })
      .then((r) => r.data),

  correspondence: (query: { ipc?: string; bns?: string }) =>
    apiClient
      .get<{ data: LegalCorrespondence[] }>("/legal/correspondence", {
        ...(query.ipc ? { ipc: query.ipc } : {}),
        ...(query.bns ? { bns: query.bns } : {}),
      })
      .then((r) => r.data),

  createAct: (input: ActInput) => apiClient.post<LegalAct>("/legal/acts", input),
  updateAct: (id: string, input: ActInput) => apiClient.put<LegalAct>(`/legal/acts/${id}`, input),
  retireAct: (id: string, reason: string) => apiClient.post<LegalAct>(`/legal/acts/${id}/retire`, { reason }),

  addSection: (actId: string, input: SectionInput) =>
    apiClient.post<LegalSection>(`/legal/acts/${actId}/sections`, input),
  updateSection: (id: string, input: SectionInput) => apiClient.put<LegalSection>(`/legal/sections/${id}`, input),
  retireSection: (id: string, reason: string) =>
    apiClient.post<LegalSection>(`/legal/sections/${id}/retire`, { reason }),

  searchPlaces: (q: string, limit = 8) =>
    apiClient
      .get<{ data: GazetteerPlace[]; attribution: string }>("/gazetteer/search", { q, limit }),

  nearestPlaces: (lat: number, lng: number, limit = 3) =>
    apiClient
      .get<{ data: GazetteerPlace[]; attribution: string }>("/gazetteer/nearest", { lat, lng, limit })
      .then((r) => r.data),

  officerPlaces: (page = 1, status = "") =>
    apiClient.get<Paginated<GazetteerPlace>>("/gazetteer/places", { page, pageSize: 20, ...(status ? { status } : {}) }),

  addPlace: (input: PlaceInput) => apiClient.post<GazetteerPlace>("/gazetteer/places", input),
  retirePlace: (id: string, reason: string) =>
    apiClient.post<GazetteerPlace>(`/gazetteer/places/${id}/retire`, { reason }),
};

export default legalApi;
