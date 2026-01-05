/**
 * Bail Hooks - React Query + Offline Support
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Bail, BailType, BailStatus } from '../lib/db/schema';
import { queueCreate, queueUpdate, queueDelete, type QueueOptions } from '../lib/sync/queue-manager';
import { networkMonitor } from '../lib/sync/network-monitor';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface ListResponse<T> { data: T[]; total: number; page: number; pageSize: number; }
interface BailFilters { type?: BailType; status?: BailStatus; caseId?: string; page?: number; pageSize?: number; }

const bailApi = {
  list: async (filters: BailFilters = {}): Promise<ListResponse<Bail>> => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.caseId) params.append('caseId', filters.caseId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const res = await fetch(`${API_BASE}/bail?${params}`);
    if (!res.ok) throw new Error('Failed to fetch bail records');
    return res.json();
  },

  getById: async (id: string): Promise<Bail> => {
    const res = await fetch(`${API_BASE}/bail/${id}`);
    if (!res.ok) throw new Error('Bail record not found');
    return res.json();
  },

  create: async (data: Omit<Bail, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bail> => {
    const res = await fetch(`${API_BASE}/bail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create bail record');
    return res.json();
  },

  update: async (id: string, data: Partial<Bail>): Promise<Bail> => {
    const res = await fetch(`${API_BASE}/bail/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update bail record');
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/bail/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete bail record');
  },
};

export const bailKeys = {
  all: ['bail'] as const,
  lists: () => [...bailKeys.all, 'list'] as const,
  list: (filters: BailFilters) => [...bailKeys.lists(), filters] as const,
  details: () => [...bailKeys.all, 'detail'] as const,
  detail: (id: string) => [...bailKeys.details(), id] as const,
};

export function useBail(filters: BailFilters = {}) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: bailKeys.list(filters),
    queryFn: async () => {
      if (isOnline) {
        try {
          const response = await bailApi.list(filters);
          await Promise.all(response.data.map(bail =>
            db.bail.put({ ...bail, _pending: false, _localOnly: false })
          ));
          return response;
        } catch (error) {
          console.error('[useBail] Network error, using IndexedDB:', error);
        }
      }

      const results = await db.bail.orderBy('applicationDate').reverse().toArray();
      let filtered = results.filter(b => !b._localOnly || b._pending);

      if (filters.type) filtered = filtered.filter(b => b.type === filters.type);
      if (filters.status) filtered = filtered.filter(b => b.status === filters.status);
      if (filters.caseId) filtered = filtered.filter(b => b.caseId === filters.caseId);

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + pageSize);

      return { data: paginated, total: filtered.length, page, pageSize };
    },
    staleTime: 30000,
  });
}

export function useBailById(id: string) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: bailKeys.detail(id),
    queryFn: async () => {
      if (isOnline) {
        try {
          const bail = await bailApi.getById(id);
          await db.bail.put({ ...bail, _pending: false, _localOnly: false });
          return bail;
        } catch (error) {
          console.error('[useBailById] Network error, using IndexedDB:', error);
        }
      }

      const bail = await db.bail.get(id);
      if (!bail) throw new Error('Bail record not found');
      return bail;
    },
    enabled: !!id,
  });
}

export function useCreateBail(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (data: Omit<Bail, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = uuidv4();
      const now = new Date();
      const bail: Bail = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
        _pending: !isOnline,
        _localOnly: !isOnline,
      };

      await db.bail.add(bail);

      if (isOnline) {
        try {
          const created = await bailApi.create(data);
          await db.bail.put({ ...created, _pending: false, _localOnly: false });
          return created;
        } catch (error) {
          await queueCreate('bail', id, data, options);
          throw error;
        }
      } else {
        await queueCreate('bail', id, data, options);
      }

      return bail;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bailKeys.lists() });
    },
  });
}

export function useUpdateBail(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Bail> }) => {
      const existing = await db.bail.get(id);
      if (!existing) throw new Error('Bail record not found');

      const updated = { ...existing, ...data, updatedAt: new Date(), _pending: !isOnline };
      await db.bail.put(updated);

      if (isOnline) {
        try {
          const result = await bailApi.update(id, data);
          await db.bail.put({ ...result, _pending: false });
          return result;
        } catch (error) {
          await queueUpdate('bail', id, data, options);
          throw error;
        }
      } else {
        await queueUpdate('bail', id, data, options);
      }

      return updated;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: bailKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bailKeys.detail(id) });
    },
  });
}

export function useDeleteBail(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await bailApi.delete(id);
          await db.bail.delete(id);
        } catch (error) {
          await queueDelete('bail', id, options);
          throw error;
        }
      } else {
        const bail = await db.bail.get(id);
        if (bail?._localOnly) {
          await db.bail.delete(id);
        } else {
          await queueDelete('bail', id, options);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bailKeys.lists() });
    },
  });
}
