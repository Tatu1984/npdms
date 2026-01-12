/**
 * Personnel Hooks - React Query + Offline Support
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Personnel, PersonnelRank, DutyStatus } from '../lib/db/schema';
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
const DEMO_PERSONNEL: Personnel[] = [
  {
    id: 'demo-personnel-001',
    userId: 'user-001',
    badgeNumber: 'KPS-2019-1234',
    name: 'Rajesh Kumar',
    rank: 'SI',
    stationId: 'station-001',
    stationName: 'Koramangala Police Station',
    designation: 'Investigation Officer',
    email: 'rajesh.kumar@ksp.gov.in',
    phone: '+91 98765 43210',
    dutyStatus: 'ON_DUTY',
    currentAssignment: 'Investigation - Armed Robbery Case',
    joiningDate: new Date('2019-06-15').toISOString(),
    experience: 5,
    specializations: ['Criminal Investigation', 'Robbery Cases'],
    casesAssigned: 12,
    emergencyContact: '+91 98765 11111',
    emergencyContactName: 'Ramesh Kumar (Brother)',
    createdAt: new Date('2019-06-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-personnel-002',
    userId: 'user-002',
    badgeNumber: 'KPS-2017-0892',
    name: 'Priya Sharma',
    rank: 'SI',
    stationId: 'station-001',
    stationName: 'Koramangala Police Station',
    designation: 'Cyber Crime Cell',
    email: 'priya.sharma@ksp.gov.in',
    phone: '+91 87654 32109',
    dutyStatus: 'ON_DUTY',
    currentAssignment: 'Investigation - Cyber Fraud Cases',
    joiningDate: new Date('2017-08-20').toISOString(),
    experience: 7,
    specializations: ['Cyber Crime', 'Digital Forensics'],
    casesAssigned: 8,
    emergencyContact: '+91 87654 22222',
    emergencyContactName: 'Anita Sharma (Mother)',
    createdAt: new Date('2017-08-20').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-personnel-003',
    userId: 'user-003',
    badgeNumber: 'KPS-2015-0456',
    name: 'Anil Desai',
    rank: 'INSPECTOR',
    stationId: 'station-001',
    stationName: 'Koramangala Police Station',
    designation: 'Station House Officer',
    email: 'anil.desai@ksp.gov.in',
    phone: '+91 76543 21098',
    dutyStatus: 'ON_DUTY',
    currentAssignment: 'Station Administration',
    joiningDate: new Date('2015-04-10').toISOString(),
    experience: 10,
    specializations: ['Administration', 'Law & Order'],
    casesAssigned: 5,
    emergencyContact: '+91 76543 33333',
    emergencyContactName: 'Sunita Desai (Wife)',
    createdAt: new Date('2015-04-10').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-personnel-004',
    userId: 'user-004',
    badgeNumber: 'KPS-2020-2345',
    name: 'Vijay Reddy',
    rank: 'ASI',
    stationId: 'station-001',
    stationName: 'Koramangala Police Station',
    designation: 'Beat Officer',
    email: 'vijay.reddy@ksp.gov.in',
    phone: '+91 65432 10987',
    dutyStatus: 'ON_LEAVE',
    currentAssignment: 'Beat Patrol - Sector 5',
    joiningDate: new Date('2020-01-15').toISOString(),
    experience: 4,
    specializations: ['Beat Patrol', 'Community Policing'],
    casesAssigned: 3,
    emergencyContact: '+91 65432 44444',
    emergencyContactName: 'Kavitha Reddy (Sister)',
    createdAt: new Date('2020-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-personnel-005',
    userId: 'user-005',
    badgeNumber: 'KPS-2021-3456',
    name: 'Meera Nair',
    rank: 'CONSTABLE',
    stationId: 'station-001',
    stationName: 'Koramangala Police Station',
    designation: 'Front Desk Officer',
    email: 'meera.nair@ksp.gov.in',
    phone: '+91 54321 09876',
    dutyStatus: 'ON_DUTY',
    currentAssignment: 'Front Desk - Public Relations',
    joiningDate: new Date('2021-07-01').toISOString(),
    experience: 3,
    specializations: ['Public Relations', 'Documentation'],
    casesAssigned: 0,
    emergencyContact: '+91 54321 55555',
    emergencyContactName: 'Gopinath Nair (Father)',
    createdAt: new Date('2021-07-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-personnel-006',
    userId: 'user-006',
    badgeNumber: 'KPS-2018-1567',
    name: 'Suresh Rao',
    rank: 'HEAD_CONSTABLE',
    stationId: 'station-001',
    stationName: 'Koramangala Police Station',
    designation: 'Traffic Control',
    email: 'suresh.rao@ksp.gov.in',
    phone: '+91 43210 98765',
    dutyStatus: 'ON_DUTY',
    currentAssignment: 'Traffic Management Training',
    joiningDate: new Date('2018-03-25').toISOString(),
    experience: 6,
    specializations: ['Traffic Control', 'VIP Security'],
    casesAssigned: 2,
    emergencyContact: '+91 43210 66666',
    emergencyContactName: 'Lakshmi Rao (Wife)',
    createdAt: new Date('2018-03-25').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface PersonnelFilters {
  rank?: PersonnelRank;
  dutyStatus?: DutyStatus;
  stationId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

const personnelApi = {
  list: async (filters: PersonnelFilters = {}): Promise<ListResponse<Personnel>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE}/personnel?${params}`, {
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

  get: async (id: string): Promise<Personnel> => {
    const response = await fetch(`${API_BASE}/personnel/${id}`, {
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

  create: async (data: Partial<Personnel>): Promise<Personnel> => {
    const response = await fetch(`${API_BASE}/personnel`, {
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

  update: async (id: string, data: Partial<Personnel>): Promise<Personnel> => {
    const response = await fetch(`${API_BASE}/personnel/${id}`, {
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

  assignDuty: async (id: string, assignment: string): Promise<Personnel> => {
    const response = await fetch(`${API_BASE}/personnel/${id}/assign-duty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ assignment }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/personnel/${id}`, {
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

export const personnelKeys = {
  all: ['personnel'] as const,
  lists: () => [...personnelKeys.all, 'list'] as const,
  list: (filters: PersonnelFilters) => [...personnelKeys.lists(), filters] as const,
  details: () => [...personnelKeys.all, 'detail'] as const,
  detail: (id: string) => [...personnelKeys.details(), id] as const,
};

export function usePersonnel(filters: PersonnelFilters = {}) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: personnelKeys.list(filters),
    queryFn: async () => {
      // Try API first if online
      if (isOnline) {
        try {
          const response = await personnelApi.list(filters);
          if (response.data && response.data.length > 0) {
            await Promise.all(
              response.data.map((personnel) =>
                db.personnel.put({
                  ...personnel,
                  _pending: false,
                  _localOnly: false,
                })
              )
            );
            return response;
          }
        } catch (error) {
          console.warn('[usePersonnel] API unavailable, using local data:', error);
        }
      }

      // Fallback to IndexedDB
      let results: Personnel[] = [];
      try {
        const query = db.personnel.orderBy('name');
        results = await query.toArray();
      } catch (error) {
        console.warn('[usePersonnel] IndexedDB error, using demo data:', error);
      }

      // If no data in IndexedDB, use demo data
      if (!results || results.length === 0) {
        console.log('[usePersonnel] Using demo personnel data');
        results = DEMO_PERSONNEL;
      }

      const filtered = results.filter((personnel) => {
        if (filters.rank && personnel.rank !== filters.rank) return false;
        if (filters.dutyStatus && personnel.dutyStatus !== filters.dutyStatus) return false;
        if (filters.stationId && personnel.stationId !== filters.stationId) return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          const matchesSearch =
            personnel.name.toLowerCase().includes(search) ||
            personnel.badgeNumber.toLowerCase().includes(search) ||
            personnel.email?.toLowerCase().includes(search);
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
    retry: false, // Don't retry failed queries, use fallback instead
  });
}

export function usePersonnelById(id: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: personnelKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;

      if (isOnline) {
        try {
          const personnel = await personnelApi.get(id);
          await db.personnel.put({
            ...personnel,
            _pending: false,
            _localOnly: false,
          });
          return personnel;
        } catch (error) {
          console.error('[usePersonnelById] Network error, falling back to IndexedDB:', error);
        }
      }

      return (await db.personnel.get(id)) || null;
    },
    enabled: !!id,
    staleTime: 30000,
    gcTime: 300000,
  });
}

export function useCreatePersonnel(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (data: Partial<Personnel>) => {
      const tempId = uuidv4();
      const tempPersonnel: Personnel = {
        ...data,
        id: tempId,
        badgeNumber: `TEMP-${tempId.slice(0, 8)}`,
        joiningDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: !isOnline,
        _localOnly: !isOnline,
      } as Personnel;

      if (isOnline) {
        try {
          const created = await personnelApi.create(data);
          await db.personnel.put({
            ...created,
            _pending: false,
            _localOnly: false,
          });
          return created;
        } catch (error) {
          console.error('[useCreatePersonnel] Network error, queuing for offline sync:', error);
        }
      }

      await db.personnel.put(tempPersonnel);
      await queueCreate(
        'personnel',
        tempId,
        data,
        `${API_BASE}/personnel`,
        options
      );

      return tempPersonnel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personnelKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('[useCreatePersonnel] Mutation error:', error.message);
    },
  });
}

export function useUpdatePersonnel(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Personnel> }) => {
      if (isOnline) {
        try {
          const updated = await personnelApi.update(id, data);
          await db.personnel.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });
          return updated;
        } catch (error) {
          console.error('[useUpdatePersonnel] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.personnel.get(id);
      if (!existing) {
        throw new Error('Personnel not found in offline storage');
      }

      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.personnel.put(updated);
      await queueUpdate(
        'personnel',
        id,
        data,
        `${API_BASE}/personnel/${id}`,
        options
      );

      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: personnelKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personnelKeys.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('[useUpdatePersonnel] Mutation error:', error.message);
    },
  });
}

export function useAssignDuty(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, assignment }: { id: string; assignment: string }) => {
      if (isOnline) {
        try {
          const updated = await personnelApi.assignDuty(id, assignment);
          await db.personnel.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });
          return updated;
        } catch (error) {
          console.error('[useAssignDuty] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.personnel.get(id);
      if (!existing) {
        throw new Error('Personnel not found in offline storage');
      }

      const updated = {
        ...existing,
        currentAssignment: assignment,
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.personnel.put(updated);
      await queueUpdate(
        'personnel',
        id,
        { currentAssignment: assignment },
        `${API_BASE}/personnel/${id}/assign-duty`,
        options
      );

      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: personnelKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personnelKeys.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('[useAssignDuty] Mutation error:', error.message);
    },
  });
}

export function useDeletePersonnel(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await personnelApi.delete(id);
          await db.personnel.delete(id);
          return;
        } catch (error) {
          console.error('[useDeletePersonnel] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.personnel.get(id);
      if (existing) {
        await db.personnel.put({
          ...existing,
          _pending: true,
        });
      }

      await queueDelete(
        'personnel',
        id,
        `${API_BASE}/personnel/${id}`,
        options
      );
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: personnelKeys.lists() });
      queryClient.removeQueries({ queryKey: personnelKeys.detail(id) });
    },
    onError: (error: Error) => {
      console.error('[useDeletePersonnel] Mutation error:', error.message);
    },
  });
}
