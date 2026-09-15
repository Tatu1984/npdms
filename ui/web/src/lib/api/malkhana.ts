import apiClient from "./client";

/**
 * Phase 14 — Malkhana / seized property API.
 *
 * Shapes mirror internal/models/malkhana.go. Money is integer paise. The custody
 * record is the hash-chained audit trail; nothing here claims external anchoring.
 */

export type PropertyCategory =
  | "CASH"
  | "JEWELLERY"
  | "NARCOTICS"
  | "ARMS"
  | "VEHICLE"
  | "ELECTRONICS"
  | "DOCUMENTS"
  | "OTHER";
export type PropertyStatus = "IN_MALKHANA" | "MOVED_OUT" | "DISPOSED";
export type SealState = "INTACT" | "BROKEN";
export type MovementType = "FORENSIC_EXAMINATION" | "COURT_PRODUCTION" | "INTER_STATION" | "INTERIM_CUSTODY";
export type DisposalType = "RETURNED_TO_OWNER" | "AUCTIONED" | "DESTROYED" | "CONFISCATED";
export type Attention = "SEAL_BROKEN" | "OVERDUE" | "REVIEW_DUE";

export const PROPERTY_CATEGORIES: PropertyCategory[] = [
  "CASH",
  "JEWELLERY",
  "NARCOTICS",
  "ARMS",
  "VEHICLE",
  "ELECTRONICS",
  "DOCUMENTS",
  "OTHER",
];
export const MOVEMENT_TYPES: MovementType[] = ["FORENSIC_EXAMINATION", "COURT_PRODUCTION", "INTER_STATION", "INTERIM_CUSTODY"];
export const DISPOSAL_TYPES: DisposalType[] = ["RETURNED_TO_OWNER", "AUCTIONED", "DESTROYED", "CONFISCATED"];

export interface MalkhanaLocation {
  id: string;
  stationId: string;
  stationName: string;
  room: string;
  rack: string;
  shelf: string;
  label: string;
  notes: string | null;
  active: boolean;
  itemsHeld: number;
  createdAt: string;
}

export interface PropertyMovement {
  id: string;
  itemId: string;
  propertyNumber: string;
  movementType: MovementType;
  destination: string;
  destinationStationId: string | null;
  destinationStationName: string;
  courtHearingId: string | null;
  hearingDate: string | null;
  purpose: string;
  authorityRef: string;
  handedTo: string;
  expectedReturnAt: string;
  movedOutAt: string;
  movedOutByName: string;
  sealNumberOut: string;
  returnedAt: string | null;
  receivedBackByName: string;
  returnedByName: string | null;
  sealNumberBack: string | null;
  sealIntactBack: boolean | null;
  returnNote: string | null;
  overdue: boolean;
}

export interface PropertyItem {
  id: string;
  propertyNumber: string;
  stationId: string;
  stationName: string;
  stationCode: string;
  firId: string | null;
  firNumber: string;
  caseId: string | null;
  caseNumber: string;
  evidenceId: string | null;
  evidenceNumber: string;
  category: PropertyCategory;
  description: string;
  quantity: number;
  unit: string;
  weightGrams: number | null;
  valuePaise: number | null;
  seizedAt: string;
  seizedPlace: string;
  seizedBy: string;
  seizedByName: string;
  seizureMemoRef: string;
  status: PropertyStatus;
  locationId: string | null;
  locationLabel: string;
  sealNumber: string;
  sealState: SealState;
  sealBrokenAt: string | null;
  depositedAt: string;
  depositedByName: string;
  disposalType: DisposalType | null;
  disposalOrderId: string | null;
  disposalWitnessName: string;
  disposalNote: string | null;
  disposedAt: string | null;
  disposedByName: string;
  openMovement: PropertyMovement | null;
  heldDays: number;
  reviewDue: boolean;
  reviewPeriodDays: number;
  movementOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertySealCheck {
  id: string;
  itemId: string;
  checkedByName: string;
  checkedAt: string;
  sealNumber: string;
  sealState: SealState;
  context: "DEPOSIT" | "VERIFICATION" | "MOVEMENT_OUT" | "MOVEMENT_BACK" | "RESEAL";
  note: string | null;
}

export interface PropertyEvent {
  id: string;
  eventType: string;
  actorName: string;
  occurredAt: string;
  summary: string;
  details: Record<string, unknown>;
}

export interface ForwardingLetterItem {
  propertyNumber: string;
  description: string;
  category: PropertyCategory;
  quantity: number;
  unit: string;
  weightGrams: number | null;
  sealNumber: string;
  seizedAt: string;
  seizureMemoRef: string;
}

export interface ForwardingLetter {
  reference: string;
  date: string;
  stationName: string;
  stationCode: string;
  laboratory: string;
  caseNumber: string;
  firNumber: string;
  signedByName: string;
  signedByRank: string;
  purpose: string;
  handedTo: string;
  items: ForwardingLetterItem[];
}

export interface PropertyLabel {
  propertyNumber: string;
  verifyUrl: string;
  qrPng: string;
  stationName: string;
  category: PropertyCategory;
  sealNumber: string;
  locationLabel: string;
  caseNumber: string;
  firNumber: string;
}

export interface MalkhanaCount {
  key: string;
  label: string;
  count: number;
  valuePaise: number;
}

export interface MalkhanaDashboard {
  total: number;
  inMalkhana: number;
  movedOut: number;
  disposed: number;
  sealBroken: number;
  overdueMovements: number;
  reviewDue: number;
  reviewPeriodDays: number;
  valueHeldPaise: number;
  valueUnrecordedItems: number;
  byCategory: MalkhanaCount[];
  byLocation: MalkhanaCount[];
  byMovementType: MalkhanaCount[];
}

export interface MalkhanaStation {
  id: string;
  name: string;
  code: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PropertyQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PropertyStatus;
  category?: PropertyCategory;
  attention?: Attention;
  stationId?: string;
  caseId?: string;
  firId?: string;
}

export interface RegisterPropertyInput {
  stationId?: string;
  firId?: string | null;
  caseId?: string | null;
  evidenceId?: string | null;
  category: PropertyCategory;
  description: string;
  quantity: number;
  unit: string;
  weightGrams?: number | null;
  valuePaise?: number | null;
  seizedAt: string;
  seizedPlace: string;
  seizedBy?: string | null;
  seizureMemoRef: string;
  locationId: string;
  sealNumber: string;
}

export interface MoveOutInput {
  movementType: MovementType;
  destination: string;
  destinationStationId?: string | null;
  courtHearingId?: string | null;
  purpose: string;
  authorityRef: string;
  handedTo: string;
  expectedReturnAt: string;
  sealNumber: string;
}

export interface ReturnInput {
  returnedBy: string;
  sealNumber: string;
  sealIntact: boolean;
  note?: string | null;
  locationId: string;
}

export interface DisposeInput {
  disposalType: DisposalType;
  courtOrderId: string;
  witnessId?: string | null;
  note: string;
}

function params(q: PropertyQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== "") out[k] = v as string | number;
  });
  return out;
}

export const malkhanaApi = {
  dashboard: (stationId?: string) =>
    apiClient.get<MalkhanaDashboard>("/malkhana/dashboard", stationId ? { stationId } : undefined),
  stations: () => apiClient.get<{ data: MalkhanaStation[] }>("/malkhana/stations").then((r) => r.data),
  locations: (stationId?: string) =>
    apiClient
      .get<{ data: MalkhanaLocation[] }>("/malkhana/locations", stationId ? { stationId } : undefined)
      .then((r) => r.data),
  createLocation: (input: { stationId?: string; room: string; rack: string; shelf?: string; notes?: string | null }) =>
    apiClient.post<MalkhanaLocation>("/malkhana/locations", input),

  list: (q: PropertyQuery) => apiClient.get<Paginated<PropertyItem>>("/malkhana/items", params(q)),
  get: (id: string) => apiClient.get<PropertyItem>(`/malkhana/items/${id}`),
  byNumber: (number: string) => apiClient.get<PropertyItem>(`/malkhana/items/by-number/${encodeURIComponent(number)}`),
  register: (input: RegisterPropertyInput) => apiClient.post<PropertyItem>("/malkhana/items", input),
  label: (id: string) => apiClient.get<PropertyLabel>(`/malkhana/items/${id}/label`),
  sealChecks: (id: string) =>
    apiClient.get<{ data: PropertySealCheck[] }>(`/malkhana/items/${id}/seal-checks`).then((r) => r.data),
  movements: (id: string) =>
    apiClient.get<{ data: PropertyMovement[] }>(`/malkhana/items/${id}/movements`).then((r) => r.data),
  events: (id: string) => apiClient.get<{ data: PropertyEvent[] }>(`/malkhana/items/${id}/events`).then((r) => r.data),

  verifySeal: (id: string, input: { sealNumber: string; intact: boolean; note?: string | null }) =>
    apiClient.post<PropertyItem>(`/malkhana/items/${id}/seal-checks`, input),
  reseal: (id: string, input: { reason: string; newSealNumber: string }) =>
    apiClient.post<PropertyItem>(`/malkhana/items/${id}/reseal`, input),
  relocate: (id: string, input: { locationId: string; reason: string }) =>
    apiClient.post<PropertyItem>(`/malkhana/items/${id}/relocate`, input),
  moveOut: (id: string, input: MoveOutInput) => apiClient.post<PropertyMovement>(`/malkhana/items/${id}/movements`, input),
  returnMovement: (id: string, movementId: string, input: ReturnInput) =>
    apiClient.post<PropertyMovement>(`/malkhana/items/${id}/movements/${movementId}/return`, input),
  forwardingLetter: (id: string, movementId: string) =>
    apiClient.get<ForwardingLetter>(`/malkhana/items/${id}/movements/${movementId}/forwarding-letter`),
  dispose: (id: string, input: DisposeInput) => apiClient.post<PropertyItem>(`/malkhana/items/${id}/dispose`, input),
};

export default malkhanaApi;
