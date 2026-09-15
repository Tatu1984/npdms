import apiClient from "./client";

/**
 * Traffic e-challans.
 *
 * Shapes mirror Go `models.TrafficChallan`, `TrafficViolationType`,
 * `ChallanDefaulter` and `ChallanStats`, which use snake_case JSON. Amounts
 * are integer paise. There is no payment gateway: a payment is recorded by an
 * officer against the receipt reference.
 */

export type ChallanStatus =
  | "ISSUED"
  | "PENDING"
  | "PAID"
  | "DISPUTED"
  | "CANCELLED"
  | "COURT_REFERRED"
  | "COMPOUNDED"
  | "DEFAULTED";

export const VEHICLE_TYPES = [
  "TWO_WHEELER",
  "THREE_WHEELER",
  "FOUR_WHEELER",
  "COMMERCIAL",
  "HEAVY_VEHICLE",
  "TRANSPORT",
  "OTHER",
] as const;
export type ChallanVehicleType = (typeof VEHICLE_TYPES)[number];

export interface ViolationType {
  id: string;
  code: string;
  name: string;
  section: string;
  fine_amount: number;
  compoundable: boolean;
  points_deducted: number;
  license_suspension_days: number;
  vehicle_seizure: boolean;
  category: string;
  severity: string;
  is_active: boolean;
}

export interface Challan {
  id: string;
  challan_number: string;
  violation_type_id: string;
  /** Joined for display: only code, name, section, category and severity are filled. */
  violation_type?: Pick<ViolationType, "code" | "name" | "section" | "category" | "severity">;
  violation_date: string;
  violation_location: string;
  violation_latitude?: number;
  violation_longitude?: number;
  violation_description?: string;
  vehicle_number: string;
  vehicle_type: ChallanVehicleType;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  owner_name?: string;
  owner_phone?: string;
  driver_name?: string;
  driver_license_number?: string;
  driver_phone?: string;
  issuing_officer_id?: string;
  issuing_station_id: string;
  issuing_officer_name?: string;
  issuing_officer_badge?: string;
  original_fine_amount: number;
  discount_amount: number;
  penalty_amount: number;
  final_amount: number;
  payment_due_date?: string;
  payment_date?: string;
  payment_reference?: string;
  status: ChallanStatus;
  dispute_filed: boolean;
  dispute_reason?: string;
  dispute_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ChallanStats {
  total_challans: number;
  total_amount: number;
  collected_amount: number;
  pending_amount: number;
  by_status: Record<string, number>;
  by_violation_type: Record<string, number>;
  top_violations: { violation_type: string; count: number; amount: number }[] | null;
  daily_trend: { date: string; count: number; amount: number; collected: number }[] | null;
}

export interface Defaulter {
  id: string;
  vehicle_number: string;
  owner_name?: string;
  owner_phone?: string;
  total_challans: number;
  total_pending_amount: number;
  oldest_pending_date?: string;
  blacklisted: boolean;
}

export interface Paginated<T> {
  /** The API sends null for an empty page. */
  data: T[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ChallanQuery {
  page?: number;
  pageSize?: number;
  vehicleNumber?: string;
  status?: ChallanStatus;
}

export interface CreateChallanInput {
  violation_type_id: string;
  violation_date: string;
  violation_location: string;
  violation_latitude?: number;
  violation_longitude?: number;
  violation_description?: string;
  vehicle_number: string;
  vehicle_type: ChallanVehicleType;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  owner_name?: string;
  owner_phone?: string;
  driver_name?: string;
  driver_license_number?: string;
  driver_phone?: string;
}

/** Statuses an officer may move a challan to from each status, as the server enforces. */
export const CHALLAN_TRANSITIONS: Partial<Record<ChallanStatus, ChallanStatus[]>> = {
  ISSUED: ["PAID", "COMPOUNDED", "CANCELLED", "COURT_REFERRED", "DEFAULTED"],
  PENDING: ["PAID", "COMPOUNDED", "CANCELLED", "COURT_REFERRED", "DEFAULTED"],
  DEFAULTED: ["PAID", "COMPOUNDED", "COURT_REFERRED"],
  DISPUTED: ["ISSUED", "CANCELLED", "COURT_REFERRED"],
  COURT_REFERRED: ["PAID", "COMPOUNDED", "CANCELLED"],
};

export const DISPUTABLE: ChallanStatus[] = ["ISSUED", "PENDING", "DEFAULTED"];

export const trafficChallansApi = {
  violationTypes: () => apiClient.get<ViolationType[]>("/traffic/violation-types"),
  list: (query: ChallanQuery) => {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") params[k] = v as string | number;
    }
    return apiClient.get<Paginated<Challan>>("/traffic/challans", params);
  },
  get: (id: string) => apiClient.get<Challan>(`/traffic/challans/${id}`),
  create: (input: CreateChallanInput) => apiClient.post<Challan>("/traffic/challans", input),
  setStatus: (id: string, status: ChallanStatus, reference?: string, note?: string) =>
    apiClient.patch<Challan>(`/traffic/challans/${id}/status`, { status, reference, note }),
  dispute: (id: string, reason: string) => apiClient.post<Challan>(`/traffic/challans/${id}/dispute`, { reason }),
  stats: () => apiClient.get<ChallanStats>("/traffic/stats"),
  defaulters: (page: number) => apiClient.get<Paginated<Defaulter>>("/traffic/defaulters", { page, pageSize: 20 }),
};

export default trafficChallansApi;
