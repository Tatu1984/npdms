import apiClient from "./client";

/**
 * Phase 08 — Station Workload API.
 *
 * Field names mirror the Go models in internal/models/workload.go. Every figure
 * arrives with the definition of what it counts. Nothing here is estimated,
 * scored or forecast, and officer figures are assigned load, not performance.
 */

export type ScopeLevel = "station" | "district" | "all";

export interface WorkloadScope {
  level: ScopeLevel;
  label: string;
  stationIds: string[] | null;
  from: string | null;
  to: string | null;
}

export interface WorkloadQuery {
  stationId?: string;
  district?: string;
  /** YYYY-MM-DD, inclusive. */
  from?: string;
  /** YYYY-MM-DD, exclusive. */
  to?: string;
}

export interface WorkloadMetric {
  key: string;
  label: string;
  count: number;
  definition: string;
  href: string;
  attention: boolean;
}

export interface WorkloadSummary {
  scope: WorkloadScope;
  metrics: WorkloadMetric[];
  generatedAt: string;
}

export interface AgeBands {
  days0to30: number;
  days31to90: number;
  days91to180: number;
  days181plus: number;
  total: number;
}

export type BacklogStageKey = "investigation" | "forensic" | "court" | "tasks";

export interface BacklogStage {
  stage: BacklogStageKey;
  label: string;
  definition: string;
  ageFrom: string;
  href: string;
  bands: AgeBands;
}

export interface WorkloadBacklog {
  scope: WorkloadScope;
  stages: BacklogStage[];
  totals: AgeBands;
  bottleneck: BacklogStageKey | null;
  rule: string;
  reason: string;
}

export interface StationWorkload {
  stationId: string;
  code: string;
  name: string;
  district: string;
  openInvestigations: number;
  pendingForensics: number;
  inCourt: number;
  openTasks: number;
  over90Days: number;
  rosterStrength: number;
  available: number;
  perAvailableOfficer: number | null;
  backlog: AgeBands;
}

export interface StationComparison {
  scope: WorkloadScope;
  data: StationWorkload[];
  definitions: Record<string, string>;
}

export interface OfficerWorkload {
  userId: string;
  name: string;
  rank: string;
  badge: string;
  stationCode: string;
  firsAsIO: number;
  casesAsIO: number;
  casesInCourt: number;
  workspacesAsIO: number;
  openTasks: number;
  overdueTasks: number;
  pendingForensics: number;
  hearingsNext14Days: number;
}

export interface OfficerWorkloadResponse {
  scope: WorkloadScope;
  data: OfficerWorkload[];
  notice: string;
}

export interface SLAItem {
  module: string;
  id: string;
  ref: string;
  title: string;
  since: string;
  daysOver: number;
  band: "" | "approaching-60" | "past-60" | "past-90";
  href: string;
}

export interface SLARule {
  key: string;
  label: string;
  rule: string;
  source: string;
  limits: string;
  breaches: number;
  items: SLAItem[];
}

export interface WorkloadSLA {
  scope: WorkloadScope;
  rules: SLARule[];
}

export type TrendInterval = "week" | "month";

export interface TrendSeries {
  key: string;
  label: string;
  definition: string;
  values: number[];
}

export interface WorkloadTrends {
  scope: WorkloadScope;
  interval: TrendInterval;
  buckets: string[];
  series: TrendSeries[];
  notShown: string[];
}

export interface WorkloadScopeOption {
  stationId: string;
  code: string;
  name: string;
  district: string;
}

export interface WorkloadScopes {
  canCompare: boolean;
  ownStation: string | null;
  stations: WorkloadScopeOption[];
  districts: string[];
}

function params(query: WorkloadQuery, extra: Record<string, string> = {}) {
  const out: Record<string, string> = { ...extra };
  if (query.stationId) out.stationId = query.stationId;
  if (query.district) out.district = query.district;
  if (query.from) out.from = query.from;
  if (query.to) out.to = query.to;
  return out;
}

export const workloadApi = {
  scopes: () => apiClient.get<WorkloadScopes>("/workload/scopes"),
  summary: (q: WorkloadQuery) => apiClient.get<WorkloadSummary>("/workload/summary", params(q)),
  backlog: (q: WorkloadQuery) => apiClient.get<WorkloadBacklog>("/workload/backlog", params(q)),
  sla: (q: WorkloadQuery) => apiClient.get<WorkloadSLA>("/workload/sla", params(q)),
  officers: (q: WorkloadQuery) => apiClient.get<OfficerWorkloadResponse>("/workload/officers", params(q)),
  stations: (q: WorkloadQuery) => apiClient.get<StationComparison>("/workload/stations", params(q)),
  trends: (q: WorkloadQuery, interval: TrendInterval) =>
    apiClient.get<WorkloadTrends>("/workload/trends", params(q, { interval })),
};

export default workloadApi;
