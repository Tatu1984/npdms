/**
 * FIR Hooks - React Query + Offline Support
 * Blueprint for all resource hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { db, FIR, FIRStatus, FIRPriority } from '../lib/db/schema';
import {
  queueCreate,
  queueUpdate,
  queueDelete,
  type QueueOptions,
} from '../lib/sync/queue-manager';
import { networkMonitor } from '../lib/sync/network-monitor';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// API CLIENT (will be replaced with real API calls)
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface FIRFilters {
  status?: FIRStatus;
  priority?: FIRPriority;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  caseId?: string;
  stationId?: string;
  page?: number;
  pageSize?: number;
}

// FIR API methods
const firApi = {
  list: async (filters: FIRFilters = {}): Promise<ListResponse<FIR>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE}/firs?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth token from localStorage/cookies
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  get: async (id: string): Promise<FIR> => {
    const response = await fetch(`${API_BASE}/firs/${id}`, {
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

  create: async (data: Partial<FIR>): Promise<FIR> => {
    const response = await fetch(`${API_BASE}/firs`, {
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

  update: async (id: string, data: Partial<FIR>): Promise<FIR> => {
    const response = await fetch(`${API_BASE}/firs/${id}`, {
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

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/firs/${id}`, {
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

  updateStatus: async (id: string, status: FIRStatus): Promise<FIR> => {
    const response = await fetch(`${API_BASE}/firs/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  getStats: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/firs/stats`, {
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
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const firKeys = {
  all: ['firs'] as const,
  lists: () => [...firKeys.all, 'list'] as const,
  list: (filters: FIRFilters) => [...firKeys.lists(), filters] as const,
  details: () => [...firKeys.all, 'detail'] as const,
  detail: (id: string) => [...firKeys.details(), id] as const,
  stats: () => [...firKeys.all, 'stats'] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch FIRs with filters (offline-first)
 */
export function useFIRs(filters: FIRFilters = {}) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: firKeys.list(filters),
    queryFn: async () => {
      // Try to fetch from server if online
      if (isOnline) {
        try {
          const response = await firApi.list(filters);

          // Sync to IndexedDB
          await Promise.all(
            response.data.map((fir) =>
              db.firs.put({
                ...fir,
                _pending: false,
                _localOnly: false,
              })
            )
          );

          return response;
        } catch (error) {
          console.error('[useFIRs] Network error, falling back to IndexedDB:', error);
          // Fall through to offline mode
        }
      }

      // Offline mode: fetch from IndexedDB
      let query = db.firs.orderBy('registeredAt').reverse();

      // Apply filters
      const results = await query.toArray();
      const filtered = results.filter((fir) => {
        if (filters.status && fir.status !== filters.status) return false;
        if (filters.priority && fir.priority !== filters.priority) return false;
        if (filters.stationId && fir.stationId !== filters.stationId) return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          const matchesSearch =
            fir.firNumber.toLowerCase().includes(search) ||
            fir.title?.toLowerCase().includes(search) ||
            fir.description.toLowerCase().includes(search);
          if (!matchesSearch) return false;
        }
        if (filters.dateFrom && fir.incidentDate < filters.dateFrom) return false;
        if (filters.dateTo && fir.incidentDate > filters.dateTo) return false;
        return true;
      });

      // Pagination
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
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes (formerly cacheTime)
  });
}

/**
 * Fetch single FIR by ID (offline-first)
 */
export function useFIR(id: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: firKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;

      // Try to fetch from server if online
      if (isOnline) {
        try {
          const fir = await firApi.get(id);

          // Sync to IndexedDB
          await db.firs.put({
            ...fir,
            _pending: false,
            _localOnly: false,
          });

          return fir;
        } catch (error) {
          console.error('[useFIR] Network error, falling back to IndexedDB:', error);
        }
      }

      // Offline mode: fetch from IndexedDB
      return (await db.firs.get(id)) || null;
    },
    enabled: !!id,
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Fetch FIR statistics
 */
export function useFIRStats() {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: firKeys.stats(),
    queryFn: async () => {
      if (isOnline) {
        try {
          return await firApi.getStats();
        } catch (error) {
          console.error('[useFIRStats] Network error:', error);
        }
      }

      // Offline fallback: calculate stats from IndexedDB
      const allFirs = await db.firs.toArray();
      const stats = {
        total: allFirs.length,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        pending: allFirs.filter((f) => f._pending).length,
      };

      allFirs.forEach((fir) => {
        stats.byStatus[fir.status] = (stats.byStatus[fir.status] || 0) + 1;
        stats.byPriority[fir.priority] = (stats.byPriority[fir.priority] || 0) + 1;
      });

      return stats;
    },
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create FIR mutation (offline-capable)
 */
export function useCreateFIR(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (data: Partial<FIR>) => {
      const tempId = uuidv4();
      const tempFir: FIR = {
        ...data,
        id: tempId,
        firNumber: `TEMP-${tempId.slice(0, 8)}`, // Temporary FIR number
        registeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: !isOnline,
        _localOnly: !isOnline,
      } as FIR;

      if (isOnline) {
        // Online: Create on server
        try {
          const created = await firApi.create(data);

          // Sync to IndexedDB
          await db.firs.put({
            ...created,
            _pending: false,
            _localOnly: false,
          });

          return created;
        } catch (error) {
          console.error('[useCreateFIR] Network error, queuing for offline sync:', error);
          // Fall through to offline mode
        }
      }

      // Offline: Store in IndexedDB and queue
      await db.firs.put(tempFir);

      await queueCreate(
        'fir',
        tempId,
        data,
        `${API_BASE}/firs`,
        options
      );

      return tempFir;
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: firKeys.lists() });
      queryClient.invalidateQueries({ queryKey: firKeys.stats() });
    },
    onError: (error: Error) => {
      console.error('[useCreateFIR] Mutation error:', error.message);
    },
  });
}

/**
 * Update FIR mutation (offline-capable)
 */
export function useUpdateFIR(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FIR> }) => {
      if (isOnline) {
        // Online: Update on server
        try {
          const updated = await firApi.update(id, data);

          // Sync to IndexedDB
          await db.firs.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });

          return updated;
        } catch (error) {
          console.error('[useUpdateFIR] Network error, queuing for offline sync:', error);
        }
      }

      // Offline: Update in IndexedDB and queue
      const existing = await db.firs.get(id);
      if (!existing) {
        throw new Error('FIR not found in offline storage');
      }

      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.firs.put(updated);

      await queueUpdate(
        'fir',
        id,
        data,
        `${API_BASE}/firs/${id}`,
        options
      );

      return updated;
    },
    onSuccess: (data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: firKeys.lists() });
      queryClient.invalidateQueries({ queryKey: firKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: firKeys.stats() });
    },
    onError: (error: Error) => {
      console.error('[useUpdateFIR] Mutation error:', error.message);
    },
  });
}

/**
 * Update FIR status mutation (offline-capable)
 */
export function useUpdateFIRStatus(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FIRStatus }) => {
      if (isOnline) {
        try {
          const updated = await firApi.updateStatus(id, status);

          await db.firs.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });

          return updated;
        } catch (error) {
          console.error('[useUpdateFIRStatus] Network error, queuing for offline sync:', error);
        }
      }

      // Offline
      const existing = await db.firs.get(id);
      if (!existing) {
        throw new Error('FIR not found in offline storage');
      }

      const updated = {
        ...existing,
        status,
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.firs.put(updated);

      await queueUpdate(
        'fir',
        id,
        { status },
        `${API_BASE}/firs/${id}/status`,
        options
      );

      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: firKeys.lists() });
      queryClient.invalidateQueries({ queryKey: firKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: firKeys.stats() });
    },
    onError: (error: Error) => {
      console.error('[useUpdateFIRStatus] Mutation error:', error.message);
    },
  });
}

/**
 * Delete FIR mutation (offline-capable)
 */
export function useDeleteFIR(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await firApi.delete(id);
          await db.firs.delete(id);
          return;
        } catch (error) {
          console.error('[useDeleteFIR] Network error, queuing for offline sync:', error);
        }
      }

      // Offline: Mark as deleted and queue
      const existing = await db.firs.get(id);
      if (existing) {
        await db.firs.put({
          ...existing,
          _pending: true,
        });
      }

      await queueDelete(
        'fir',
        id,
        `${API_BASE}/firs/${id}`,
        options
      );
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: firKeys.lists() });
      queryClient.removeQueries({ queryKey: firKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: firKeys.stats() });
    },
    onError: (error: Error) => {
      console.error('[useDeleteFIR] Mutation error:', error.message);
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Get filtered FIRs from query data (for client-side filtering)
 */
export function useFilteredFIRs(filters: FIRFilters = {}) {
  const { data, ...query } = useFIRs(filters);

  return {
    firs: data?.data || [],
    total: data?.total || 0,
    ...query,
  };
}

/**
 * Check if FIR has pending changes
 */
export function useFIRPendingStatus(id: string | undefined) {
  return useQuery({
    queryKey: ['fir-pending', id],
    queryFn: async () => {
      if (!id) return false;
      const fir = await db.firs.get(id);
      return fir?._pending || false;
    },
    enabled: !!id,
  });
}
