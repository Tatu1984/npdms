import apiClient from "./client";

/**
 * Phase 10 — Public Safety Risk & Hotspots API.
 *
 * Shapes mirror internal/models/risk.go. These responses describe places and
 * never carry a person, phone or vehicle.
 */

export type RiskLevel = "station" | "beat";
export type RiskShift = "all" | "day" | "night";

export interface RiskFactorDefinition {
  key: string;
  label: string;
  description: string;
  beatAttributable: boolean;
}

export interface RiskWeightSet {
  version: number;
  weights: Record<string, number>;
  reason: string;
  createdByName: string;
  createdAt: string;
}

export interface RiskFactorScore {
  key: string;
  label: string;
  description: string;
  raw: number;
  weight: number;
  contribution: number;
  attributable: boolean;
}

export interface RiskArea {
  id: string;
  level: RiskLevel;
  name: string;
  stationId: string;
  stationName: string;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
  score: number;
  factors: RiskFactorScore[];
  firCount: number;
  previousFirCount: number;
  change: number;
  coverage: { placed: number; stationTotal: number } | null;
}

export interface RiskPeriod {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  days: number;
  shift: RiskShift;
  shiftLabel: string;
}

export interface RiskAreasResponse {
  level: RiskLevel;
  period: RiskPeriod;
  weightSet: RiskWeightSet;
  formula: string;
  areas: RiskArea[];
  notes: string[];
}

export interface RiskRecommendation {
  rank: number;
  areaId: string;
  areaName: string;
  stationName: string;
  score: number;
  topFactor: string;
  topFactorContribution: number;
  reasoning: string;
}

export interface RiskRecommendationsResponse {
  rule: string;
  period: RiskPeriod;
  weightVersion: number;
  areasConsidered: number;
  recommendations: RiskRecommendation[];
}

export interface RiskSimulationRow {
  areaId: string;
  areaName: string;
  score: number;
  share: number;
  units: number;
  covered: boolean;
}

export interface RiskSimulationResponse {
  method: string;
  period: RiskPeriod;
  weightVersion: number;
  rows: RiskSimulationRow[];
  totalScore: number;
  coveredScore: number;
  coveragePercent: number;
  unitsAllocated: number;
  areasCovered: number;
  areasWithScore: number;
  uncoveredScoringAreas: string[];
}

export interface RiskBeat {
  id: string;
  stationId: string;
  stationName: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  placedFirs: number;
  createdByName: string;
  createdAt: string;
}

export interface RiskPlaceableFIR {
  firId: string;
  firNumber: string;
  stationId: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  beatId: string | null;
  beatName: string;
}

export interface RiskQuery {
  level: RiskLevel;
  from?: string;
  to?: string;
  shift: RiskShift;
  stationId?: string;
}

const params = (q: RiskQuery, extra: Record<string, string | number> = {}) => {
  const p: Record<string, string | number> = { level: q.level, shift: q.shift, ...extra };
  if (q.from) p.from = q.from;
  if (q.to) p.to = q.to;
  if (q.stationId) p.stationId = q.stationId;
  return p;
};

export const riskApi = {
  factors: () =>
    apiClient.get<{ factors: RiskFactorDefinition[]; weightSet: RiskWeightSet }>("/risk/factors"),
  weightHistory: () => apiClient.get<{ data: RiskWeightSet[] }>("/risk/weights/history"),
  updateWeights: (weights: Record<string, number>, reason: string) =>
    apiClient.post<RiskWeightSet>("/risk/weights", { weights, reason }),
  areas: (q: RiskQuery) => apiClient.get<RiskAreasResponse>("/risk/areas", params(q)),
  recommendations: (q: RiskQuery, top: number) =>
    apiClient.get<RiskRecommendationsResponse>("/risk/recommendations", params(q, { top })),
  simulate: (q: RiskQuery, allocations: { areaId: string; units: number }[]) =>
    apiClient.post<RiskSimulationResponse>("/risk/simulate", { ...q, allocations }),
  beats: (stationId?: string) =>
    apiClient.get<{ data: RiskBeat[] }>("/risk/beats", stationId ? { stationId } : undefined),
  createBeat: (input: {
    stationId?: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  }) => apiClient.post<RiskBeat>("/risk/beats", input),
  deleteBeat: (id: string) => apiClient.delete<void>(`/risk/beats/${id}`),
  firs: (stationId: string, from: string | undefined, to: string | undefined, unplaced: boolean) => {
    const p: Record<string, string> = { stationId, unplaced: String(unplaced) };
    if (from) p.from = from;
    if (to) p.to = to;
    return apiClient.get<{ data: RiskPlaceableFIR[] }>("/risk/firs", p);
  },
  place: (firId: string, beatId: string) => apiClient.post<void>("/risk/placements", { firId, beatId }),
  unplace: (firId: string) => apiClient.delete<void>(`/risk/placements/${firId}`),
};

export default riskApi;
