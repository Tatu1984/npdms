/**
 * Witness Hooks - React Query + Offline Support
 * Note: Witnesses are managed through cases API endpoints
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Witness } from '../lib/db/schema';
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

interface WitnessFilters {
  firId?: string;
  caseId?: string;
  statementRecorded?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

const witnessApi = {
  list: async (caseId: string, filters: WitnessFilters = {}): Promise<ListResponse<Witness>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE}/cases/${caseId}/witnesses?${params}`, {
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

  get: async (caseId: string, id: string): Promise<Witness> => {
    const response = await fetch(`${API_BASE}/cases/${caseId}/witnesses/${id}`, {
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

  create: async (caseId: string, data: Partial<Witness>): Promise<Witness> => {
    const response = await fetch(`${API_BASE}/cases/${caseId}/witnesses`, {
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

  update: async (caseId: string, id: string, data: Partial<Witness>): Promise<Witness> => {
    const response = await fetch(`${API_BASE}/cases/${caseId}/witnesses/${id}`, {
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

  delete: async (caseId: string, id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/cases/${caseId}/witnesses/${id}`, {
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

export const witnessKeys = {
  all: ['witnesses'] as const,
  lists: () => [...witnessKeys.all, 'list'] as const,
  list: (caseId: string, filters: WitnessFilters) => [...witnessKeys.lists(), caseId, filters] as const,
  details: () => [...witnessKeys.all, 'detail'] as const,
  detail: (caseId: string, id: string) => [...witnessKeys.details(), caseId, id] as const,
};

export function useWitnesses(caseId: string | undefined, filters: WitnessFilters = {}) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: witnessKeys.list(caseId!, filters),
    queryFn: async () => {
      if (!caseId) return { data: [], total: 0, page: 1, pageSize: 20 };

      if (isOnline) {
        try {
          const response = await witnessApi.list(caseId, filters);
          await Promise.all(
            response.data.map((witness) =>
              db.witnesses.put({
                ...witness,
                _pending: false,
                _localOnly: false,
              })
            )
          );
          return response;
        } catch (error) {
          console.error('[useWitnesses] Network error, falling back to IndexedDB:', error);
        }
      }

      let query = db.witnesses.where('caseId').equals(caseId);
      const results = await query.toArray();
      const filtered = results.filter((witness) => {
        if (filters.firId && witness.firId !== filters.firId) return false;
        if (filters.statementRecorded !== undefined && witness.statementRecorded !== filters.statementRecorded) return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          const matchesSearch =
            witness.name.toLowerCase().includes(search) ||
            witness.address.toLowerCase().includes(search) ||
            witness.phone?.toLowerCase().includes(search);
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

export function useWitnessById(caseId: string | undefined, id: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: witnessKeys.detail(caseId!, id!),
    queryFn: async () => {
      if (!caseId || !id) return null;

      if (isOnline) {
        try {
          const witness = await witnessApi.get(caseId, id);
          await db.witnesses.put({
            ...witness,
            _pending: false,
            _localOnly: false,
          });
          return witness;
        } catch (error) {
          console.error('[useWitnessById] Network error, falling back to IndexedDB:', error);
        }
      }

      return (await db.witnesses.get(id)) || null;
    },
    enabled: !!caseId && !!id,
    staleTime: 30000,
    gcTime: 300000,
  });
}

export function useCreateWitness(caseId: string, options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (data: Partial<Witness>) => {
      const tempId = uuidv4();
      const tempWitness: Witness = {
        ...data,
        id: tempId,
        caseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: !isOnline,
        _localOnly: !isOnline,
      } as Witness;

      if (isOnline) {
        try {
          const created = await witnessApi.create(caseId, data);
          await db.witnesses.put({
            ...created,
            _pending: false,
            _localOnly: false,
          });
          return created;
        } catch (error) {
          console.error('[useCreateWitness] Network error, queuing for offline sync:', error);
        }
      }

      await db.witnesses.put(tempWitness);
      await queueCreate(
        'witness',
        tempId,
        data,
        `${API_BASE}/cases/${caseId}/witnesses`,
        options
      );

      return tempWitness;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: witnessKeys.lists() });
    },
  });
}

export function useUpdateWitness(caseId: string, options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Witness> }) => {
      if (isOnline) {
        try {
          const updated = await witnessApi.update(caseId, id, data);
          await db.witnesses.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });
          return updated;
        } catch (error) {
          console.error('[useUpdateWitness] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.witnesses.get(id);
      if (!existing) {
        throw new Error('Witness not found in offline storage');
      }

      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.witnesses.put(updated);
      await queueUpdate(
        'witness',
        id,
        data,
        `${API_BASE}/cases/${caseId}/witnesses/${id}`,
        options
      );

      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: witnessKeys.lists() });
      queryClient.invalidateQueries({ queryKey: witnessKeys.detail(caseId, variables.id) });
    },
  });
}

export function useDeleteWitness(caseId: string, options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await witnessApi.delete(caseId, id);
          await db.witnesses.delete(id);
          return;
        } catch (error) {
          console.error('[useDeleteWitness] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.witnesses.get(id);
      if (existing) {
        await db.witnesses.put({
          ...existing,
          _pending: true,
        });
      }

      await queueDelete(
        'witness',
        id,
        `${API_BASE}/cases/${caseId}/witnesses/${id}`,
        options
      );
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: witnessKeys.lists() });
      queryClient.removeQueries({ queryKey: witnessKeys.detail(caseId, id) });
    },
  });
}
