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

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface BailFilters {
  type?: BailType;
  status?: BailStatus;
  caseId?: string;
  page?: number;
  pageSize?: number;
}

const bailApi = {
  list: async (filters: BailFilters = {}): Promise<ListResponse<Bail>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE}/bail?${params}`, {
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

  getById: async (id: string): Promise<Bail> => {
    const response = await fetch(`${API_BASE}/bail/${id}`, {
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

  create: async (data: Partial<Bail>): Promise<Bail> => {
    const response = await fetch(`${API_BASE}/bail`, {
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

  update: async (id: string, data: Partial<Bail>): Promise<Bail> => {
    const response = await fetch(`${API_BASE}/bail/${id}`, {
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

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/bail/${id}`, {
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

      if (isOnline) {
        try {
          const created = await bailApi.create(data);
          await db.bail.put({
            ...created,
            _pending: false,
            _localOnly: false,
          });
          return created;
        } catch (error) {
          console.error('[useCreateBail] Network error, queuing for offline sync:', error);
        }
      }

      await db.bail.put(bail);
      await queueCreate(
        'bail',
        id,
        data,
        `${API_BASE}/bail`,
        options
      );

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
          const updated = await bailApi.update(id, data);
          await db.bail.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });
          return updated;
        } catch (error) {
          console.error('[useUpdateBail] Network error, queuing for offline sync:', error);
        }
      }

      await db.bail.put(updated);
      await queueUpdate(
        'bail',
        id,
        data,
        `${API_BASE}/bail/${id}`,
        options
      );

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
          return;
        } catch (error) {
          console.error('[useDeleteBail] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.bail.get(id);
      if (existing) {
        await db.bail.put({
          ...existing,
          _pending: true,
        });
      }

      await queueDelete(
        'bail',
        id,
        `${API_BASE}/bail/${id}`,
        options
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bailKeys.lists() });
    },
  });
}
