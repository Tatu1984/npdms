import apiClient from "./client";

/**
 * Phase 07 — Dispatch API.
 *
 * Field names mirror the Go models (internal/models/dispatch.go). Nullable
 * columns arrive as null. Units are a view over the fleet and personnel
 * registers: a unit's `id` is the vehicle id, or the officer's user id.
 */

export type IncidentSource = "CONTROL_ROOM" | "PHONE_100" | "PHONE_112" | "APP" | "WALK_IN" | "OFFICER";
export type IncidentSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type IncidentStatus = "NEW" | "CLASSIFIED" | "DISPATCHED" | "ON_SCENE" | "CLEARED" | "CLOSED";
export type IncidentOutcome =
  | "RESOLVED_ON_SCENE"
  | "FIR_REGISTERED"
  | "REFERRED"
  | "FALSE_ALARM"
  | "NO_TRACE"
  | "DUPLICATE"
  | "OTHER";
export type UnitKind = "VEHICLE" | "OFFICER";
export type AssignmentStatus = "ASSIGNED" | "ACKNOWLEDGED" | "ON_SCENE" | "CLEARED" | "CANCELLED";
export type UnitAvailability = "AVAILABLE" | "ENGAGED" | "UNAVAILABLE";
export type PositionSource = "VEHICLE_GPS" | "STATION" | "NONE";

export const INCIDENT_SOURCES: IncidentSource[] = ["PHONE_112", "PHONE_100", "CONTROL_ROOM", "APP", "WALK_IN", "OFFICER"];
export const SEVERITIES: IncidentSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
export const OUTCOMES: IncidentOutcome[] = [
  "RESOLVED_ON_SCENE",
  "FIR_REGISTERED",
  "REFERRED",
  "FALSE_ALARM",
  "NO_TRACE",
  "DUPLICATE",
  "OTHER",
];

export interface DispatchAssignment {
  id: string;
  incidentId: string;
  unitKind: UnitKind;
  vehicleId: string | null;
  vehicleNumber: string;
  vehicleType: string;
  officerId: string | null;
  officerName: string;
  officerBadge: string;
  status: AssignmentStatus;
  assignedByName: string;
  assignedAt: string;
  /** Straight-line distance at the moment of assignment; not a route. */
  distanceKm: number | null;
  acknowledgedAt: string | null;
  acknowledgedByName: string;
  onSceneAt: string | null;
  onSceneByName: string;
  onSceneAlertedAt: string | null;
  clearedAt: string | null;
  clearedByName: string;
  cancelledAt: string | null;
  cancelledByName: string;
  cancelReason: string | null;
  ackOverdue: boolean;
  onSceneOverdue: boolean;
}

export interface DispatchIncident {
  id: string;
  incidentNumber: string;
  source: IncidentSource;
  callerName: string | null;
  callerPhone: string | null;
  description: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  stationId: string;
  stationName: string;
  receivedAt: string;
  incidentType: string | null;
  severity: IncidentSeverity | null;
  classifiedBy: string | null;
  classifiedByName: string;
  classifiedAt: string | null;
  status: IncidentStatus;
  escalationLevel: number;
  outcome: IncidentOutcome | null;
  outcomeNote: string | null;
  firId: string | null;
  firNumber: string;
  closedByName: string;
  closedAt: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  activeUnits: number;
  waitingMinutes: number | null;
  overdue: boolean;
  assignments?: DispatchAssignment[];
}

export interface DispatchEvent {
  id: string;
  incidentId: string;
  assignmentId: string | null;
  eventType: string;
  level: number | null;
  detail: string;
  /** null when a stated escalation rule raised the event. */
  actorId: string | null;
  actorName: string;
  occurredAt: string;
}

export interface DispatchUnit {
  kind: UnitKind;
  id: string;
  label: string;
  detail: string;
  stationId: string;
  stationName: string;
  crewName: string;
  availability: UnitAvailability;
  reason: string;
  engagedIncidentId: string | null;
  engagedIncident: string;
  latitude: number | null;
  longitude: number | null;
  positionSource: PositionSource;
  distanceKm: number | null;
}

export interface DispatchStats {
  awaitingDispatch: number;
  active: number;
  awaitingClosure: number;
  closedToday: number;
  overdueAcknowledgements: number;
  overdueOnScene: number;
  unitsAvailable: number;
  unitsEngaged: number;
}

export interface EscalationStep {
  level: number;
  afterMinutes: number;
  action: string;
}

export interface SeverityDefinition {
  severity: IncidentSeverity;
  meaning: string;
  onSceneMinutes: number;
}

export interface DispatchPolicy {
  acknowledgementLadder: EscalationStep[];
  severities: SeverityDefinition[];
  recommendation: string;
  notification: string;
}

export interface ResponseInterval {
  samples: number;
  medianSeconds: number | null;
  p90Seconds: number | null;
}

export interface DispatchAnalyticsRow {
  stationId: string | null;
  stationName: string;
  incidents: number;
  callToDispatch: ResponseInterval;
  dispatchToAcknowledge: ResponseInterval;
  acknowledgeToScene: ResponseInterval;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type IncidentView = "queue" | "active" | "open" | "closed";

export interface IncidentQuery {
  view?: IncidentView;
  severity?: IncidentSeverity;
  stationId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateIncidentInput {
  source: IncidentSource;
  callerName?: string | null;
  callerPhone?: string | null;
  description: string;
  locationText: string;
  latitude?: number | null;
  longitude?: number | null;
  receivedAt?: string;
}

export const dispatchApi = {
  policy: () => apiClient.get<DispatchPolicy>("/dispatch/policy"),

  stats: () => apiClient.get<DispatchStats>("/dispatch/stats"),

  incidents: (query: IncidentQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.view) params.view = query.view;
    if (query.severity) params.severity = query.severity;
    if (query.stationId) params.stationId = query.stationId;
    if (query.search) params.search = query.search;
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    return apiClient.get<Paginated<DispatchIncident>>("/dispatch/incidents", params);
  },

  incident: (id: string) => apiClient.get<DispatchIncident>(`/dispatch/incidents/${id}`),

  events: (id: string) =>
    apiClient.get<{ data: DispatchEvent[] }>(`/dispatch/incidents/${id}/events`).then((r) => r.data),

  /** With an incident, available units come back ranked by straight-line distance to it. */
  units: (incidentId?: string) =>
    apiClient
      .get<{ data: DispatchUnit[] }>("/dispatch/units", incidentId ? { incidentId } : undefined)
      .then((r) => r.data),

  intake: (input: CreateIncidentInput) => apiClient.post<DispatchIncident>("/dispatch/incidents", input),

  classify: (id: string, incidentType: string, severity: IncidentSeverity) =>
    apiClient.post<DispatchIncident>(`/dispatch/incidents/${id}/classify`, { incidentType, severity }),

  assign: (id: string, kind: UnitKind, unitId: string) =>
    apiClient.post<DispatchAssignment>(`/dispatch/incidents/${id}/assign`, { kind, id: unitId }),

  acknowledge: (assignmentId: string) =>
    apiClient.post<DispatchAssignment>(`/dispatch/assignments/${assignmentId}/acknowledge`, {}),

  onScene: (assignmentId: string) =>
    apiClient.post<DispatchAssignment>(`/dispatch/assignments/${assignmentId}/on-scene`, {}),

  clear: (assignmentId: string) =>
    apiClient.post<DispatchAssignment>(`/dispatch/assignments/${assignmentId}/clear`, {}),

  standDown: (assignmentId: string, reason: string) =>
    apiClient.post<DispatchAssignment>(`/dispatch/assignments/${assignmentId}/cancel`, { reason }),

  escalate: (id: string, reason: string) =>
    apiClient.post<DispatchIncident>(`/dispatch/incidents/${id}/escalate`, { reason }),

  close: (id: string, outcome: IncidentOutcome, note: string, firId?: string | null) =>
    apiClient.post<DispatchIncident>(`/dispatch/incidents/${id}/close`, { outcome, note, firId: firId ?? null }),

  analytics: (from: string, to: string, stationId?: string) => {
    const params: Record<string, string> = { from, to };
    if (stationId) params.stationId = stationId;
    return apiClient.get<{ from: string; to: string; data: DispatchAnalyticsRow[] }>("/dispatch/analytics", params);
  },
};

export default dispatchApi;
