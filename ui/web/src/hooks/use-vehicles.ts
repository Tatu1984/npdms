/**
 * Vehicle Hooks - React Query + Offline Support
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Vehicle, VehicleType, VehicleStatus } from '../lib/db/schema';
import {
  queueCreate,
  queueUpdate,
  queueDelete,
  type QueueOptions,
} from '../lib/sync/queue-manager';
import { networkMonitor } from '../lib/sync/network-monitor';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Demo data for when API and IndexedDB are empty
const DEMO_VEHICLES: Vehicle[] = [
  {
    id: 'demo-vehicle-001',
    vehicleNumber: 'KA-01-P-1234',
    type: 'PATROL_CAR',
    make: 'Mahindra',
    model: 'Scorpio',
    year: 2022,
    stationId: 'station-001',
    status: 'AVAILABLE',
    fuelType: 'DIESEL',
    lastServiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    nextServiceDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    currentMileage: 45000,
    gpsEnabled: true,
    latitude: 12.9352,
    longitude: 77.6245,
    lastLocationUpdate: new Date().toISOString(),
    createdAt: new Date('2022-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-vehicle-002',
    vehicleNumber: 'KA-01-P-5678',
    type: 'PATROL_CAR',
    make: 'Toyota',
    model: 'Innova',
    year: 2021,
    stationId: 'station-001',
    status: 'ALLOCATED',
    allocatedTo: 'demo-personnel-001',
    allocatedToName: 'SI Rajesh Kumar',
    allocatedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    fuelType: 'DIESEL',
    lastServiceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    nextServiceDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    currentMileage: 62000,
    gpsEnabled: true,
    latitude: 12.9278,
    longitude: 77.6271,
    lastLocationUpdate: new Date().toISOString(),
    createdAt: new Date('2021-06-20').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-vehicle-003',
    vehicleNumber: 'KA-01-P-9012',
    type: 'MOTORCYCLE',
    make: 'Royal Enfield',
    model: 'Classic 350',
    year: 2023,
    stationId: 'station-001',
    status: 'AVAILABLE',
    fuelType: 'PETROL',
    lastServiceDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    nextServiceDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
    currentMileage: 12000,
    gpsEnabled: false,
    createdAt: new Date('2023-03-10').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-vehicle-004',
    vehicleNumber: 'KA-01-P-3456',
    type: 'PATROL_CAR',
    make: 'Maruti',
    model: 'Gypsy',
    year: 2019,
    stationId: 'station-001',
    status: 'MAINTENANCE',
    fuelType: 'PETROL',
    lastServiceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    nextServiceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    currentMileage: 85000,
    gpsEnabled: true,
    createdAt: new Date('2019-08-25').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-vehicle-005',
    vehicleNumber: 'KA-01-P-7890',
    type: 'VAN',
    make: 'Force',
    model: 'Traveller',
    year: 2020,
    stationId: 'station-001',
    status: 'ALLOCATED',
    allocatedTo: 'demo-personnel-003',
    allocatedToName: 'Inspector Anil Desai',
    allocatedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    fuelType: 'DIESEL',
    lastServiceDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    currentMileage: 55000,
    gpsEnabled: true,
    latitude: 12.9341,
    longitude: 77.6130,
    lastLocationUpdate: new Date().toISOString(),
    createdAt: new Date('2020-11-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface VehicleFilters {
  type?: VehicleType;
  status?: VehicleStatus;
  stationId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

const vehicleApi = {
  list: async (filters: VehicleFilters = {}): Promise<ListResponse<Vehicle>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE}/vehicles?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  get: async (id: string): Promise<Vehicle> => {
    const response = await fetch(`${API_BASE}/vehicles/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  create: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  update: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  allocate: async (id: string, personnelId: string): Promise<Vehicle> => {
    const response = await fetch(`${API_BASE}/vehicles/${id}/allocate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ personnelId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  returnVehicle: async (id: string): Promise<Vehicle> => {
    const response = await fetch(`${API_BASE}/vehicles/${id}/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  },
};

export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (filters: VehicleFilters) => [...vehicleKeys.lists(), filters] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
};

export function useVehicles(filters: VehicleFilters = {}) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: async () => {
      if (isOnline) {
        try {
          const response = await vehicleApi.list(filters);
          await Promise.all(
            response.data.map((vehicle) =>
              db.vehicles.put({
                ...vehicle,
                _pending: false,
                _localOnly: false,
              })
            )
          );
          return response;
        } catch (error) {
          console.error('[useVehicles] Network error, falling back to IndexedDB:', error);
        }
      }

      let query = db.vehicles.orderBy('vehicleNumber');
      let results = await query.toArray();
      // If no data in IndexedDB, use demo data
      if (results.length === 0) {
        results = DEMO_VEHICLES;
      }
      const filtered = results.filter((vehicle) => {
        if (filters.type && vehicle.type !== filters.type) return false;
        if (filters.status && vehicle.status !== filters.status) return false;
        if (filters.stationId && vehicle.stationId !== filters.stationId) return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          const matchesSearch =
            vehicle.vehicleNumber.toLowerCase().includes(search) ||
            vehicle.make?.toLowerCase().includes(search) ||
            vehicle.model?.toLowerCase().includes(search);
          if (!matchesSearch) return false;
        }
        return true;
      });

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedData = filtered.slice(start, end);

      return {
        data: paginatedData,
        total: filtered.length,
        page,
        pageSize,
      };
    },
    staleTime: 30000,
    gcTime: 300000,
  });
}

export function useVehicle(id: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: vehicleKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;

      if (isOnline) {
        try {
          const vehicle = await vehicleApi.get(id);
          await db.vehicles.put({
            ...vehicle,
            _pending: false,
            _localOnly: false,
          });
          return vehicle;
        } catch (error) {
          console.error('[useVehicle] Network error, falling back to IndexedDB:', error);
        }
      }

      return (await db.vehicles.get(id)) || null;
    },
    enabled: !!id,
    staleTime: 30000,
    gcTime: 300000,
  });
}

export function useCreateVehicle(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (data: Partial<Vehicle>) => {
      const tempId = uuidv4();
      const tempVehicle: Vehicle = {
        ...data,
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: !isOnline,
        _localOnly: !isOnline,
      } as Vehicle;

      if (isOnline) {
        try {
          const created = await vehicleApi.create(data);
          await db.vehicles.put({
            ...created,
            _pending: false,
            _localOnly: false,
          });
          return created;
        } catch (error) {
          console.error('[useCreateVehicle] Network error, queuing for offline sync:', error);
        }
      }

      await db.vehicles.put(tempVehicle);
      await queueCreate(
        'vehicle',
        tempId,
        data,
        `${API_BASE}/vehicles`,
        options
      );

      return tempVehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('[useCreateVehicle] Mutation error:', error.message);
    },
  });
}

export function useUpdateVehicle(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vehicle> }) => {
      if (isOnline) {
        try {
          const updated = await vehicleApi.update(id, data);
          await db.vehicles.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });
          return updated;
        } catch (error) {
          console.error('[useUpdateVehicle] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.vehicles.get(id);
      if (!existing) {
        throw new Error('Vehicle not found in offline storage');
      }

      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.vehicles.put(updated);
      await queueUpdate(
        'vehicle',
        id,
        data,
        `${API_BASE}/vehicles/${id}`,
        options
      );

      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('[useUpdateVehicle] Mutation error:', error.message);
    },
  });
}

export function useAllocateVehicle(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, personnelId }: { id: string; personnelId: string }) => {
      if (isOnline) {
        try {
          const updated = await vehicleApi.allocate(id, personnelId);
          await db.vehicles.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });
          return updated;
        } catch (error) {
          console.error('[useAllocateVehicle] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.vehicles.get(id);
      if (!existing) {
        throw new Error('Vehicle not found in offline storage');
      }

      const updated = {
        ...existing,
        allocatedTo: personnelId,
        allocatedDate: new Date().toISOString(),
        status: 'ALLOCATED' as VehicleStatus,
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.vehicles.put(updated);
      await queueUpdate(
        'vehicle',
        id,
        { allocatedTo: personnelId, status: 'ALLOCATED' },
        `${API_BASE}/vehicles/${id}/allocate`,
        options
      );

      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('[useAllocateVehicle] Mutation error:', error.message);
    },
  });
}

export function useReturnVehicle(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          const updated = await vehicleApi.returnVehicle(id);
          await db.vehicles.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });
          return updated;
        } catch (error) {
          console.error('[useReturnVehicle] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.vehicles.get(id);
      if (!existing) {
        throw new Error('Vehicle not found in offline storage');
      }

      const updated = {
        ...existing,
        allocatedTo: undefined,
        allocatedToName: undefined,
        allocatedDate: undefined,
        status: 'AVAILABLE' as VehicleStatus,
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.vehicles.put(updated);
      await queueUpdate(
        'vehicle',
        id,
        { status: 'AVAILABLE' },
        `${API_BASE}/vehicles/${id}/return`,
        options
      );

      return updated;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(id) });
    },
    onError: (error: Error) => {
      console.error('[useReturnVehicle] Mutation error:', error.message);
    },
  });
}

export function useDeleteVehicle(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await vehicleApi.delete(id);
          await db.vehicles.delete(id);
          return;
        } catch (error) {
          console.error('[useDeleteVehicle] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.vehicles.get(id);
      if (existing) {
        await db.vehicles.put({
          ...existing,
          _pending: true,
        });
      }

      await queueDelete(
        'vehicle',
        id,
        `${API_BASE}/vehicles/${id}`,
        options
      );
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      queryClient.removeQueries({ queryKey: vehicleKeys.detail(id) });
    },
    onError: (error: Error) => {
      console.error('[useDeleteVehicle] Mutation error:', error.message);
    },
  });
}
