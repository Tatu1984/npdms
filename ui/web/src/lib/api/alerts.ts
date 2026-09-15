import apiClient from "./client";

/**
 * Alerts API.
 *
 * Field names mirror the Go `models.Alert` JSON exactly: `issuedById` is the
 * issuing officer's id and `issuedBy` their name; `acknowledgedById` and
 * `acknowledgedBy` likewise. `priority` is 1 (highest) to 3. `image` reports the
 * `has_image` flag only — no image storage exists, so there is nothing to show.
 *
 * The issuer and the acknowledging officer are taken from the session by the
 * server; neither is sent from here.
 */

export type AlertType = "FLASH" | "URGENT" | "BOLO" | "NOTICE";
export type AlertScope = "STATION" | "DISTRICT" | "STATE" | "NATIONAL";
export type AlertPriority = 1 | 2 | 3;

export const ALERT_TYPES: AlertType[] = ["FLASH", "URGENT", "BOLO", "NOTICE"];
export const ALERT_SCOPES: AlertScope[] = ["STATION", "DISTRICT", "STATE", "NATIONAL"];

export interface Alert {
  id: string;
  type: AlertType;
  scope: AlertScope;
  title: string;
  description: string;
  issuedAt: string;
  expiresAt: string;
  issuedById: string | null;
  issuedBy?: string;
  acknowledged: boolean;
  acknowledgedById: string | null;
  acknowledgedBy?: string;
  acknowledgedAt: string | null;
  priority: AlertPriority;
  image: boolean;
  stationId: string | null;
  /** The record the platform raised the alert from ("missing_person" → the report). */
  resourceType: string | null;
  resourceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AlertQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: AlertType;
  scope?: AlertScope;
  acknowledged?: boolean;
}

/** What an officer supplies. Issuer, acknowledgement and timestamps are the server's. */
export interface AlertInput {
  type: AlertType;
  scope: AlertScope;
  title: string;
  description: string;
  expiresAt: string;
  priority: AlertPriority;
  stationId?: string | null;
}

export const alertsApi = {
  list: async (query: AlertQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.type) params.type = query.type;
    if (query.scope) params.scope = query.scope;
    if (query.acknowledged !== undefined) params.acknowledged = String(query.acknowledged);
    const result = await apiClient.get<Paginated<Alert>>("/alerts", params);
    return { ...result, data: result.data ?? [] };
  },

  /** Every alert not yet expired, most urgent first. Not paginated by the API. */
  active: async () => (await apiClient.get<Alert[] | null>("/alerts/active")) ?? [],

  /** Unexpired alerts no officer has acknowledged. Not paginated by the API. */
  unacknowledged: async () => (await apiClient.get<Alert[] | null>("/alerts/unacknowledged")) ?? [],

  get: (id: string) => apiClient.get<Alert>(`/alerts/${id}`),

  create: (input: AlertInput) => apiClient.post<Alert>("/alerts", { ...input, image: false }),

  /** The API rewrites type, scope, title, description, expiry, priority and the image flag. */
  update: (alert: Alert, changes: Partial<AlertInput>) =>
    apiClient.put<Alert>(`/alerts/${alert.id}`, { ...alert, ...changes }),

  /** Records the signed-in officer as having acknowledged the alert. */
  acknowledge: (id: string) => apiClient.post<Alert>(`/alerts/${id}/acknowledge`, {}),

  remove: (id: string) => apiClient.delete<{ message: string }>(`/alerts/${id}`),
};

export default alertsApi;
