/**
 * Accused Hooks - React Query + Offline Support
 * Note: Accused are managed through cases API endpoints
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Accused } from '../lib/db/schema';
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

interface AccusedFilters {
  firId?: string;
  caseId?: string;
  arrested?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

const accusedApi = {
  list: async (caseId: string, filters: AccusedFilters = {}): Promise<ListResponse<Accused>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE}/cases/${caseId}/accused?${params}`, {
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

  get: async (caseId: string, id: string): Promise<Accused> => {
    const response = await fetch(`${API_BASE}/cases/${caseId}/accused/${id}`, {
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

  create: async (caseId: string, data: Partial<Accused>): Promise<Accused> => {
    const response = await fetch(`${API_BASE}/cases/${caseId}/accused`, {
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

  update: async (caseId: string, id: string, data: Partial<Accused>): Promise<Accused> => {
    const response = await fetch(`${API_BASE}/cases/${caseId}/accused/${id}`, {
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

  delete: async (caseId: string, id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/cases/${caseId}/accused/${id}`, {
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

export const accusedKeys = {
  all: ['accused'] as const,
  lists: () => [...accusedKeys.all, 'list'] as const,
  list: (caseId: string, filters: AccusedFilters) => [...accusedKeys.lists(), caseId, filters] as const,
  details: () => [...accusedKeys.all, 'detail'] as const,
  detail: (caseId: string, id: string) => [...accusedKeys.details(), caseId, id] as const,
};

export function useAccused(caseId: string | undefined, filters: AccusedFilters = {}) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: accusedKeys.list(caseId!, filters),
    queryFn: async () => {
      if (!caseId) return { data: [], total: 0, page: 1, pageSize: 20 };

      if (isOnline) {
        try {
          const response = await accusedApi.list(caseId, filters);
          await Promise.all(
            response.data.map((accused) =>
              db.accused.put({
                ...accused,
                _pending: false,
                _localOnly: false,
              })
            )
          );
          return response;
        } catch (error) {
          console.error('[useAccused] Network error, falling back to IndexedDB:', error);
        }
      }

      let query = db.accused.where('caseId').equals(caseId);
      const results = await query.toArray();
      const filtered = results.filter((accused) => {
        if (filters.firId && accused.firId !== filters.firId) return false;
        if (filters.arrested !== undefined && accused.arrested !== filters.arrested) return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          const matchesSearch =
            accused.name.toLowerCase().includes(search) ||
            accused.fatherName?.toLowerCase().includes(search) ||
            accused.address?.toLowerCase().includes(search);
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
    enabled: !!caseId,
    staleTime: 30000,
    gcTime: 300000,
  });
}

export function useAccusedById(caseId: string | undefined, id: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: accusedKeys.detail(caseId!, id!),
    queryFn: async () => {
      if (!caseId || !id) return null;

      if (isOnline) {
        try {
          const accused = await accusedApi.get(caseId, id);
          await db.accused.put({
            ...accused,
            _pending: false,
            _localOnly: false,
          });
          return accused;
        } catch (error) {
          console.error('[useAccusedById] Network error, falling back to IndexedDB:', error);
        }
      }

      return (await db.accused.get(id)) || null;
    },
    enabled: !!caseId && !!id,
    staleTime: 30000,
    gcTime: 300000,
  });
}

export function useCreateAccused(caseId: string, options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (data: Partial<Accused>) => {
      const tempId = uuidv4();
      const tempAccused: Accused = {
        ...data,
        id: tempId,
        caseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: !isOnline,
        _localOnly: !isOnline,
      } as Accused;

      if (isOnline) {
        try {
          const created = await accusedApi.create(caseId, data);
          await db.accused.put({
            ...created,
            _pending: false,
            _localOnly: false,
          });
          return created;
        } catch (error) {
          console.error('[useCreateAccused] Network error, queuing for offline sync:', error);
        }
      }

      await db.accused.put(tempAccused);
      await queueCreate(
        'accused',
        tempId,
        data,
        `${API_BASE}/cases/${caseId}/accused`,
        options
      );

      return tempAccused;
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: accusedKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('[useCreateAccused] Mutation error:', error.message);
    },
  });
}

export function useUpdateAccused(caseId: string, options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Accused> }) => {
      if (isOnline) {
        try {
          const updated = await accusedApi.update(caseId, id, data);
          await db.accused.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });
          return updated;
        } catch (error) {
          console.error('[useUpdateAccused] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.accused.get(id);
      if (!existing) {
        throw new Error('Accused not found in offline storage');
      }

      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.accused.put(updated);
      await queueUpdate(
        'accused',
        id,
        data,
        `${API_BASE}/cases/${caseId}/accused/${id}`,
        options
      );

      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: accusedKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accusedKeys.detail(caseId, variables.id) });
    },
    onError: (error: Error) => {
      console.error('[useUpdateAccused] Mutation error:', error.message);
    },
  });
}

export function useDeleteAccused(caseId: string, options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await accusedApi.delete(caseId, id);
          await db.accused.delete(id);
          return;
        } catch (error) {
          console.error('[useDeleteAccused] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.accused.get(id);
      if (existing) {
        await db.accused.put({
          ...existing,
          _pending: true,
        });
      }

      await queueDelete(
        'accused',
        id,
        `${API_BASE}/cases/${caseId}/accused/${id}`,
        options
      );
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: accusedKeys.lists() });
      queryClient.removeQueries({ queryKey: accusedKeys.detail(caseId, id) });
    },
    onError: (error: Error) => {
      console.error('[useDeleteAccused] Mutation error:', error.message);
    },
  });
}
