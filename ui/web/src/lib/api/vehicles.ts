import apiClient from "./client";

/**
 * Police fleet vehicles API.
 *
 * Field names mirror the Go `models.Vehicle` exactly. `currentDriver` is the
 * driver's name joined from users; `currentDriverId` is the stored reference.
 * Nullable columns arrive as `null`, so optional fields are typed `| null`.
 */

export type VehicleType = "Patrol" | "Gypsy" | "PCR" | "Bus";
export type VehicleStatus = "ON_DUTY" | "AVAILABLE" | "MAINTENANCE" | "RESERVED";

export const VEHICLE_TYPES: VehicleType[] = ["Patrol", "Gypsy", "PCR", "Bus"];
export const VEHICLE_STATUSES: VehicleStatus[] = ["ON_DUTY", "AVAILABLE", "MAINTENANCE", "RESERVED"];

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: VehicleType;
  make: string;
  status: VehicleStatus;
  currentDriverId: string | null;
  currentDriver?: string | null;
  fuelLevel: number;
  odometerReading: number;
  lastService: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  currentDuty: string | null;
  maintenanceNote: string | null;
  reservedFor: string | null;
  stationId: string;
  stationName?: string;
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

export interface VehicleQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: VehicleStatus;
  type?: VehicleType;
  stationId?: string;
}

/** Fields an officer supplies. Id, driver name, station name and timestamps are the server's. */
export type VehicleInput = Partial<
  Omit<Vehicle, "id" | "currentDriver" | "stationName" | "createdAt" | "updatedAt">
> &
  Pick<Vehicle, "registrationNumber" | "type" | "make" | "lastService" | "stationId">;

export const vehiclesApi = {
  list: (query: VehicleQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.type) params.type = query.type;
    if (query.stationId) params.stationId = query.stationId;
    return apiClient.get<Paginated<Vehicle>>("/vehicles", params);
  },

  get: (id: string) => apiClient.get<Vehicle>(`/vehicles/${id}`),

  /**
   * There is no stats endpoint. Counts are read from the `total` of a one-row
   * page per status, so they cover the whole fleet, not the page on screen.
   * `status` is NOT NULL and constrained to these four values, so their sum is
   * the fleet total.
   */
  counts: async () => {
    const pages = await Promise.all(VEHICLE_STATUSES.map((status) => vehiclesApi.list({ status, pageSize: 1 })));
    const counts = { total: 0 } as { total: number } & Record<VehicleStatus, number>;
    VEHICLE_STATUSES.forEach((status, i) => {
      counts[status] = pages[i].total;
      counts.total += pages[i].total;
    });
    return counts;
  },

  create: (input: VehicleInput) => apiClient.post<Vehicle>("/vehicles", input),

  /** The API replaces every column, so send the full record with changes applied. */
  update: (vehicle: Vehicle, changes: Partial<VehicleInput>) =>
    apiClient.put<Vehicle>(`/vehicles/${vehicle.id}`, { ...vehicle, ...changes }),

  /** Sets the driver and duty and puts the vehicle ON_DUTY. */
  allocate: (id: string, driverId: string, duty: string) =>
    apiClient.post<Vehicle>(`/vehicles/${id}/allocate`, { driverId, duty }),

  /** Clears driver, duty and position and makes the vehicle AVAILABLE. */
  release: (id: string) => apiClient.post<Vehicle>(`/vehicles/${id}/return`),

  remove: (id: string) => apiClient.delete<{ message: string }>(`/vehicles/${id}`),
};

export default vehiclesApi;
