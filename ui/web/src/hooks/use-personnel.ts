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
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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
      if (isOnline) {
        try {
          const response = await personnelApi.list(filters);
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
        } catch (error) {
          console.error('[usePersonnel] Network error, falling back to IndexedDB:', error);
        }
      }

      let query = db.personnel.orderBy('name');
      const results = await query.toArray();
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
  });
}
