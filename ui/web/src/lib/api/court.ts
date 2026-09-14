import apiClient from "./client";

/**
 * Court API — hearings and orders.
 *
 * Field names mirror the Go `models.CourtHearing` and `models.CourtOrder`
 * exactly, including the short JSON names the API uses for hearings: `date`,
 * `time`, `judge`, `io`, and `charges` (the `ipc_sections` column). `date` is a
 * calendar day sent as RFC 3339 midnight UTC; `time` is "HH:MM" text, or ""
 * when no time is recorded.
 */

export type HearingType =
  | "ARGUMENTS"
  | "EVIDENCE"
  | "BAIL_HEARING"
  | "REMAND_EXTENSION"
  | "JUDGMENT"
  | "CHARGESHEET";

export type CourtOrderType = "REMAND" | "BAIL_REJECTED" | "BAIL_GRANTED" | "DIRECTIONS" | "JUDGMENT" | "STAY";

export type CourtPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CourtHearing {
  id: string;
  caseId: string | null;
  caseNumber?: string;
  title: string;
  court: string;
  courtRoom: string;
  judge: string;
  date: string;
  time: string;
  type: HearingType;
  ioId: string | null;
  io?: string;
  charges: string[] | null;
  requiredDocuments: string[] | null;
  priority: CourtPriority;
  createdAt: string;
  updatedAt: string;
}

export interface CourtOrder {
  id: string;
  caseId: string;
  caseNumber?: string;
  orderDate: string;
  orderType: CourtOrderType;
  summary: string;
  court: string;
  judgeName: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * As returned by `GET /court/stats`. `pendingOrders` counts every recorded
 * order — the server has no notion of a pending order. `activeCases` is a
 * constant in the server code, not a count, so it is deliberately not typed.
 */
export interface CourtStats {
  todayHearings: number;
  thisWeekHearings: number;
  pendingOrders: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HearingQuery {
  page?: number;
  pageSize?: number;
  /** Matches hearing title or court. */
  search?: string;
  type?: HearingType;
  priority?: CourtPriority;
  caseId?: string;
}

export interface OrderQuery {
  page?: number;
  pageSize?: number;
  /** Matches order summary or court. */
  search?: string;
  orderType?: CourtOrderType;
  caseId?: string;
}

/** Fields an officer supplies. Identity, joined names and timestamps are the server's. */
export type HearingInput = Partial<
  Omit<CourtHearing, "id" | "caseNumber" | "io" | "createdAt" | "updatedAt">
> &
  Pick<CourtHearing, "title" | "court" | "date" | "type" | "priority">;

export type OrderInput = Omit<CourtOrder, "id" | "caseNumber" | "createdAt" | "updatedAt">;

const params = (query: object) => {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") out[key] = value as string | number;
  }
  return out;
};

export const courtApi = {
  hearings: (query: HearingQuery = {}) =>
    apiClient.get<Paginated<CourtHearing>>("/court/hearings", params(query)),

  hearing: (id: string) => apiClient.get<CourtHearing>(`/court/hearings/${id}`),

  createHearing: (input: HearingInput) => apiClient.post<CourtHearing>("/court/hearings", input),

  /** The API replaces every column, so send the full record with changes applied. */
  updateHearing: (hearing: CourtHearing, changes: Partial<HearingInput>) =>
    apiClient.put<CourtHearing>(`/court/hearings/${hearing.id}`, { ...hearing, ...changes }),

  orders: (query: OrderQuery = {}) => apiClient.get<Paginated<CourtOrder>>("/court/orders", params(query)),

  order: (id: string) => apiClient.get<CourtOrder>(`/court/orders/${id}`),

  createOrder: (input: OrderInput) => apiClient.post<CourtOrder>("/court/orders", input),

  stats: () => apiClient.get<CourtStats>("/court/stats"),
};

export default courtApi;
