import apiClient from "./client";

/**
 * Phase 06 — traffic incidents and accident reconstruction.
 *
 * Field names mirror the Go models in internal/models/traffic_incident.go.
 * Provenance travels with every timeline entry: MEASURED (an instrument or
 * log), OBSERVED (a person or reviewed footage) or ESTIMATED (derived, with
 * its method). The client never infers it.
 */

export type Provenance = "MEASURED" | "OBSERVED" | "ESTIMATED";
export type CollisionType =
  | "HEAD_ON" | "REAR_END" | "SIDE_IMPACT" | "SIDESWIPE" | "PEDESTRIAN" | "ROLLOVER" | "FIXED_OBJECT" | "OTHER";
export type RoadCondition = "DRY" | "WET" | "WATERLOGGED" | "POTHOLED" | "UNDER_REPAIR" | "OTHER";
export type Weather = "CLEAR" | "RAIN" | "HEAVY_RAIN" | "FOG" | "HAZE" | "OTHER";
export type Lighting = "DAYLIGHT" | "DUSK_DAWN" | "DARK_LIT" | "DARK_UNLIT";
export type VehicleType =
  | "TWO_WHEELER" | "THREE_WHEELER" | "E_RICKSHAW" | "CAR" | "TAXI" | "BUS" | "LCV" | "TRUCK" | "BICYCLE" | "OTHER";
export type PersonRole = "DRIVER" | "PASSENGER" | "PEDESTRIAN" | "CYCLIST" | "OTHER";
export type InjurySeverity = "FATAL" | "GRIEVOUS" | "MINOR" | "NONE";
export type PlateReadSource = "ANPR_SYSTEM" | "CCTV_REVIEW" | "OFFICER";
export type SignalPhaseValue = "RED" | "AMBER" | "GREEN" | "FLASHING" | "OFF";
export type SignalSource = "CONTROLLER_LOG" | "CCTV_REVIEW" | "OFFICER_OBSERVATION" | "WITNESS";
export type Quantity = "SPEED" | "DISTANCE" | "DURATION";
export type ReportStatus = "DRAFT" | "SUBMITTED" | "RETURNED" | "APPROVED";

export const COLLISION_TYPES: CollisionType[] = [
  "HEAD_ON", "REAR_END", "SIDE_IMPACT", "SIDESWIPE", "PEDESTRIAN", "ROLLOVER", "FIXED_OBJECT", "OTHER",
];
export const ROAD_CONDITIONS: RoadCondition[] = ["DRY", "WET", "WATERLOGGED", "POTHOLED", "UNDER_REPAIR", "OTHER"];
export const WEATHERS: Weather[] = ["CLEAR", "RAIN", "HEAVY_RAIN", "FOG", "HAZE", "OTHER"];
export const LIGHTINGS: Lighting[] = ["DAYLIGHT", "DUSK_DAWN", "DARK_LIT", "DARK_UNLIT"];
export const VEHICLE_TYPES: VehicleType[] = [
  "CAR", "TWO_WHEELER", "THREE_WHEELER", "E_RICKSHAW", "TAXI", "BUS", "LCV", "TRUCK", "BICYCLE", "OTHER",
];
export const PERSON_ROLES: PersonRole[] = ["DRIVER", "PASSENGER", "PEDESTRIAN", "CYCLIST", "OTHER"];
export const INJURY_SEVERITIES: InjurySeverity[] = ["FATAL", "GRIEVOUS", "MINOR", "NONE"];
export const PLATE_SOURCES: PlateReadSource[] = ["ANPR_SYSTEM", "CCTV_REVIEW", "OFFICER"];
export const SIGNAL_PHASES: SignalPhaseValue[] = ["RED", "AMBER", "GREEN", "FLASHING", "OFF"];
export const SIGNAL_SOURCES: SignalSource[] = ["CONTROLLER_LOG", "CCTV_REVIEW", "OFFICER_OBSERVATION", "WITNESS"];
export const PROVENANCES: Provenance[] = ["MEASURED", "OBSERVED", "ESTIMATED"];
export const QUANTITY_UNITS: Record<Quantity, string> = { SPEED: "km/h", DISTANCE: "m", DURATION: "s" };

export interface TrafficIncident {
  id: string;
  incidentNumber: string;
  occurredAt: string;
  location: string;
  latitude: number;
  longitude: number;
  stationId: string;
  stationName: string;
  firId: string | null;
  firNumber: string;
  collisionType: CollisionType;
  roadCondition: RoadCondition;
  weather: Weather;
  lighting: Lighting;
  description: string;
  reportedBy: string;
  reportedByName: string;
  vehicleCount: number;
  fatalities: number;
  grievousInjuries: number;
  minorInjuries: number;
  cameraCount: number;
  plateReadCount: number;
  signalPhaseCount: number;
  factCount: number;
  reportStatus: ReportStatus | "NONE";
  createdAt: string;
  updatedAt: string;
}

export interface IncidentVehicle {
  id: string;
  incidentId: string;
  registrationNumber: string;
  vehicleType: VehicleType;
  description: string;
  driverName: string | null;
  createdByName: string;
  createdAt: string;
}

export interface IncidentPerson {
  id: string;
  incidentId: string;
  name: string | null;
  role: PersonRole;
  vehicleId: string | null;
  vehicleRegistration: string;
  injurySeverity: InjurySeverity;
  hospital: string | null;
  createdByName: string;
  createdAt: string;
}

export interface IncidentCamera {
  id: string;
  incidentId: string;
  cameraRef: string;
  cameraName: string;
  distanceM: number | null;
  footageFrom: string;
  footageTo: string;
  coversIncident: boolean;
  notes: string;
  createdByName: string;
  createdAt: string;
}

export interface PlateRead {
  id: string;
  incidentId: string;
  registrationNumber: string;
  readAt: string;
  location: string;
  cameraRef: string | null;
  source: PlateReadSource;
  sourceDetail: string;
  matchedVehicleId: string | null;
  createdByName: string;
  createdAt: string;
}

export interface SignalPhase {
  id: string;
  incidentId: string;
  signalRef: string;
  approach: string;
  phase: SignalPhaseValue;
  phaseFrom: string;
  phaseTo: string | null;
  source: SignalSource;
  sourceDetail: string;
  activeAtIncident: boolean;
  createdByName: string;
  createdAt: string;
}

export interface TrafficFact {
  id: string;
  incidentId: string;
  occurredAt: string;
  description: string;
  provenance: Provenance;
  source: string;
  method: string | null;
  vehicleId: string | null;
  vehicleRegistration: string;
  quantity: Quantity | null;
  value: number | null;
  valueLow: number | null;
  valueHigh: number | null;
  unit: string | null;
  createdByName: string;
  createdAt: string;
}

export type TimelineKind = "FACT" | "PLATE_READ" | "SIGNAL_PHASE";

export interface TimelineItem {
  kind: TimelineKind;
  recordId: string;
  at: string;
  summary: string;
  provenance: Provenance;
  source: string;
  method: string | null;
  fact?: TrafficFact;
}

export interface ReportContent {
  incident: TrafficIncident;
  vehicles: IncidentVehicle[];
  persons: IncidentPerson[];
  cameras: IncidentCamera[];
  plateReads: PlateRead[];
  signalPhases: SignalPhase[];
  timeline: TimelineItem[];
  measuredFacts: number;
  observedFacts: number;
  estimatedFacts: number;
}

export interface IncidentReport {
  id: string;
  incidentId: string;
  reportNumber: string;
  status: ReportStatus;
  findings: string;
  draftedBy: string;
  draftedByName: string;
  snapshot: ReportContent | null;
  snapshotSha256: string | null;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedByName: string;
  reviewedAt: string | null;
  returnReason: string | null;
  recordChangedSinceSnapshot: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Everything the incident screen shows, in one response. */
export interface IncidentWorkspace extends ReportContent {
  priorChallans: PriorChallan[];
  reports: IncidentReport[];
}

export interface TrafficIncidentStats {
  total: number;
  fatalities: number;
  grievousInjuries: number;
  awaitingApproval: number;
  withoutReport: number;
  approved: number;
}

export interface PriorChallan {
  challanNumber: string;
  vehicleNumber: string;
  violationDate: string;
  location: string;
  status: string;
  finalAmount: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TrafficIncidentQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  reportStatus?: ReportStatus | "NONE";
  fatal?: boolean;
  from?: string;
  to?: string;
}

export interface IncidentInput {
  occurredAt: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  firId: string | null;
  collisionType: CollisionType;
  roadCondition: RoadCondition;
  weather: Weather;
  lighting: Lighting;
  description: string;
}

export interface VehicleInput {
  registrationNumber: string;
  vehicleType: VehicleType;
  description: string;
  driverName: string | null;
}

export interface PersonInput {
  name: string | null;
  role: PersonRole;
  vehicleId: string | null;
  injurySeverity: InjurySeverity;
  hospital: string | null;
}

export interface CameraInput {
  cameraRef: string;
  cameraName: string;
  distanceM: number | null;
  footageFrom: string | null;
  footageTo: string | null;
  notes: string;
}

export interface PlateReadInput {
  registrationNumber: string;
  readAt: string | null;
  location: string;
  cameraRef: string | null;
  source: PlateReadSource;
  sourceDetail: string;
}

export interface SignalPhaseInput {
  signalRef: string;
  approach: string;
  phase: SignalPhaseValue;
  phaseFrom: string | null;
  phaseTo: string | null;
  source: SignalSource;
  sourceDetail: string;
}

export interface FactInput {
  occurredAt: string | null;
  description: string;
  provenance: Provenance;
  source: string;
  method: string | null;
  vehicleId: string | null;
  quantity: Quantity | null;
  value: number | null;
  valueLow: number | null;
  valueHigh: number | null;
}

export type ChildKind = "vehicles" | "persons" | "cameras" | "plate-reads" | "signal-phases" | "facts";

const base = (id: string) => `/traffic-incidents/${id}`;
const listOf = <T,>(path: string) => apiClient.get<{ data: T[] }>(path).then((r) => r.data ?? []);

export const trafficIncidentsApi = {
  list: (query: TrafficIncidentQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.reportStatus) params.reportStatus = query.reportStatus;
    if (query.fatal) params.fatal = "true";
    if (query.from) params.from = query.from;
    if (query.to) params.to = query.to;
    return apiClient.get<Paginated<TrafficIncident>>("/traffic-incidents", params);
  },
  stats: () => apiClient.get<TrafficIncidentStats>("/traffic-incidents/stats"),
  get: (id: string) => apiClient.get<TrafficIncident>(base(id)),
  workspace: (id: string) => apiClient.get<IncidentWorkspace>(`${base(id)}/workspace`),
  register: (input: IncidentInput) => apiClient.post<TrafficIncident>("/traffic-incidents", input),
  update: (id: string, input: IncidentInput) => apiClient.put<TrafficIncident>(base(id), input),

  vehicles: (id: string) => listOf<IncidentVehicle>(`${base(id)}/vehicles`),
  addVehicle: (id: string, input: VehicleInput) => apiClient.post<IncidentVehicle>(`${base(id)}/vehicles`, input),
  persons: (id: string) => listOf<IncidentPerson>(`${base(id)}/persons`),
  addPerson: (id: string, input: PersonInput) => apiClient.post<IncidentPerson>(`${base(id)}/persons`, input),
  cameras: (id: string) => listOf<IncidentCamera>(`${base(id)}/cameras`),
  addCamera: (id: string, input: CameraInput) => apiClient.post<IncidentCamera>(`${base(id)}/cameras`, input),
  plateReads: (id: string) => listOf<PlateRead>(`${base(id)}/plate-reads`),
  addPlateRead: (id: string, input: PlateReadInput) => apiClient.post<PlateRead>(`${base(id)}/plate-reads`, input),
  signalPhases: (id: string) => listOf<SignalPhase>(`${base(id)}/signal-phases`),
  addSignalPhase: (id: string, input: SignalPhaseInput) =>
    apiClient.post<SignalPhase>(`${base(id)}/signal-phases`, input),
  facts: (id: string) => listOf<TrafficFact>(`${base(id)}/facts`),
  addFact: (id: string, input: FactInput) => apiClient.post<TrafficFact>(`${base(id)}/facts`, input),
  remove: (id: string, kind: ChildKind, recordId: string) => apiClient.delete<void>(`${base(id)}/${kind}/${recordId}`),

  timeline: (id: string) => listOf<TimelineItem>(`${base(id)}/timeline`),
  priorChallans: (id: string) => listOf<PriorChallan>(`${base(id)}/prior-challans`),

  draft: (id: string) => apiClient.get<ReportContent>(`${base(id)}/report-draft`),
  reports: (id: string) => listOf<IncidentReport>(`${base(id)}/reports`),
  createReport: (id: string, findings: string) =>
    apiClient.post<IncidentReport>(`${base(id)}/reports`, { findings }),
  updateReport: (id: string, reportId: string, findings: string) =>
    apiClient.put<IncidentReport>(`${base(id)}/reports/${reportId}`, { findings }),
  submitReport: (id: string, reportId: string) =>
    apiClient.post<IncidentReport>(`${base(id)}/reports/${reportId}/submit`, {}),
  approveReport: (id: string, reportId: string) =>
    apiClient.post<IncidentReport>(`${base(id)}/reports/${reportId}/approve`, {}),
  returnReport: (id: string, reportId: string, reason: string) =>
    apiClient.post<IncidentReport>(`${base(id)}/reports/${reportId}/return`, { reason }),
};

export default trafficIncidentsApi;
