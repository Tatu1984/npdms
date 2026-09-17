import apiClient from "./client";

/**
 * Where officers went in the platform, and for how long.
 *
 * Deliberately separate from the audit trail. The audit trail records what was
 * done and is hash-chained; this records what was looked at, which is the only
 * way to see misuse that changes nothing. Detail is kept 90 days and then
 * reduced to monthly totals per module.
 */

export interface ModuleTotal {
  module: string;
  seconds: number;
  visits: number;
}

export interface PageVisit {
  path: string;
  module: string;
  openedAt: string;
  seconds: number;
  ipAddress?: string;
}

export interface ActivitySummary {
  since: string;
  totalSeconds: number;
  modules: ModuleTotal[];
  recent: PageVisit[];
  /** What survives the 90-day cull. Totals only — a day cannot be rebuilt. */
  archivedMonthly: ModuleTotal[];
}

export interface ActivityReport {
  data: ActivitySummary;
  retention: { detailDays: number; note: string };
}

export const activityApi = {
  mine: (days = 7) => apiClient.get<ActivityReport>(`/me/activity?days=${days}`),

  forOfficer: (officerId: string, days = 7) =>
    apiClient.get<ActivityReport>(`/officers/${officerId}/activity?days=${days}`),

  rollUp: () =>
    apiClient.post<{ rolledVisits: number; monthsTouched: number; message: string }>(
      "/activity/roll-up",
      {},
    ),
};

export default activityApi;
