/**
 * Case Hooks - React Query + Offline Support
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Case, CaseStatus } from '../lib/db/schema';
import { queueCreate, queueUpdate, queueDelete, type QueueOptions } from '../lib/sync/queue-manager';
import { networkMonitor } from '../lib/sync/network-monitor';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface CaseFilters {
  status?: CaseStatus;
  firId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

const caseApi = {
  list: async (filters: CaseFilters = {}): Promise<ListResponse<Case>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    const response = await fetch(`${API_BASE}/cases?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  get: async (id: string): Promise<Case> => {
    const response = await fetch(`${API_BASE}/cases/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  create: async (data: Partial<Case>): Promise<Case> => {
    const response = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  update: async (id: string, data: Partial<Case>): Promise<Case> => {
    const response = await fetch(`${API_BASE}/cases/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/cases/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
};

export const caseKeys = {
  all: ['cases'] as const,
  lists: () => [...caseKeys.all, 'list'] as const,
  list: (filters: CaseFilters) => [...caseKeys.lists(), filters] as const,
  details: () => [...caseKeys.all, 'detail'] as const,
  detail: (id: string) => [...caseKeys.details(), id] as const,
};

export function useCases(filters: CaseFilters = {}) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: caseKeys.list(filters),
    queryFn: async () => {
      if (isOnline) {
        try {
          const response = await caseApi.list(filters);
          await Promise.all(
            response.data.map((c) => db.cases.put({ ...c, _pending: false, _localOnly: false }))
          );
          return response;
        } catch (error) {
          console.error('[useCases] Network error, using IndexedDB:', error);
        }
      }

      const results = await db.cases.orderBy('createdAt').reverse().toArray();
      const filtered = results.filter((c) => {
        if (filters.status && c.status !== filters.status) return false;
        if (filters.firId && c.firId !== filters.firId) return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          if (!c.caseNumber.toLowerCase().includes(search) &&
              !c.title?.toLowerCase().includes(search)) return false;
        }
        return true;
      });

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const start = (page - 1) * pageSize;
      return {
        data: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
      };
    },
    staleTime: 30000,
  });
}

export function useCase(id: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: caseKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;
      if (isOnline) {
        try {
          const c = await caseApi.get(id);
          await db.cases.put({ ...c, _pending: false, _localOnly: false });
          return c;
        } catch (error) {
          console.error('[useCase] Network error:', error);
        }
      }
      return (await db.cases.get(id)) || null;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useCreateCase(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (data: Partial<Case>) => {
      const tempId = uuidv4();
      const temp: Case = {
        ...data,
        id: tempId,
        caseNumber: `TEMP-${tempId.slice(0, 8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: !isOnline,
        _localOnly: !isOnline,
      } as Case;

      if (isOnline) {
        try {
          const created = await caseApi.create(data);
          await db.cases.put({ ...created, _pending: false, _localOnly: false });
          return created;
        } catch (error) {
          console.error('[useCreateCase] Network error:', error);
        }
      }

      await db.cases.put(temp);
      await queueCreate('case', tempId, data, `${API_BASE}/cases`, options);
      return temp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
    },
  });
}

export function useUpdateCase(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Case> }) => {
      if (isOnline) {
        try {
          const updated = await caseApi.update(id, data);
          await db.cases.put({ ...updated, _pending: false, _localOnly: false });
          return updated;
        } catch (error) {
          console.error('[useUpdateCase] Network error:', error);
        }
      }

      const existing = await db.cases.get(id);
      if (!existing) throw new Error('Case not found');

      const updated = { ...existing, ...data, updatedAt: new Date().toISOString(), _pending: true };
      await db.cases.put(updated);
      await queueUpdate('case', id, data, `${API_BASE}/cases/${id}`, options);
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(variables.id) });
    },
  });
}

export function useDeleteCase(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await caseApi.delete(id);
          await db.cases.delete(id);
          return;
        } catch (error) {
          console.error('[useDeleteCase] Network error:', error);
        }
      }

      const existing = await db.cases.get(id);
      if (existing) await db.cases.put({ ...existing, _pending: true });
      await queueDelete('case', id, `${API_BASE}/cases/${id}`, options);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.removeQueries({ queryKey: caseKeys.detail(id) });
    },
  });
}
