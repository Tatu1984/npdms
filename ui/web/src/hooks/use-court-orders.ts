/**
 * Court Order Hooks - React Query + Offline Support
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, CourtOrder, OrderType } from '../lib/db/schema';
import {
  queueCreate,
  queueUpdate,
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

interface CourtOrderFilters {
  orderType?: OrderType;
  caseId?: string;
  hearingId?: string;
  courtName?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

const courtOrderApi = {
  list: async (filters: CourtOrderFilters = {}): Promise<ListResponse<CourtOrder>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE}/court/orders?${params}`, {
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

  get: async (id: string): Promise<CourtOrder> => {
    const response = await fetch(`${API_BASE}/court/orders/${id}`, {
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

  create: async (data: Partial<CourtOrder>): Promise<CourtOrder> => {
    const response = await fetch(`${API_BASE}/court/orders`, {
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
};

export const courtOrderKeys = {
  all: ['court-orders'] as const,
  lists: () => [...courtOrderKeys.all, 'list'] as const,
  list: (filters: CourtOrderFilters) => [...courtOrderKeys.lists(), filters] as const,
  details: () => [...courtOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...courtOrderKeys.details(), id] as const,
};

export function useCourtOrders(filters: CourtOrderFilters = {}) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: courtOrderKeys.list(filters),
    queryFn: async () => {
      if (isOnline) {
        try {
          const response = await courtOrderApi.list(filters);
          await Promise.all(
            response.data.map((order) =>
              db.courtOrders.put({
                ...order,
                _pending: false,
                _localOnly: false,
              })
            )
          );
          return response;
        } catch (error) {
          console.error('[useCourtOrders] Network error, falling back to IndexedDB:', error);
        }
      }

      let query = db.courtOrders.orderBy('orderDate').reverse();
      const results = await query.toArray();
      const filtered = results.filter((order) => {
        if (filters.orderType && order.orderType !== filters.orderType) return false;
        if (filters.caseId && order.caseId !== filters.caseId) return false;
        if (filters.hearingId && order.hearingId !== filters.hearingId) return false;
        if (filters.courtName && order.courtName !== filters.courtName) return false;
        if (filters.dateFrom && order.orderDate < filters.dateFrom) return false;
        if (filters.dateTo && order.orderDate > filters.dateTo) return false;
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

export function useCourtOrder(id: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: courtOrderKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;

      if (isOnline) {
        try {
          const order = await courtOrderApi.get(id);
          await db.courtOrders.put({
            ...order,
            _pending: false,
            _localOnly: false,
          });
          return order;
        } catch (error) {
          console.error('[useCourtOrder] Network error, falling back to IndexedDB:', error);
        }
      }

      return (await db.courtOrders.get(id)) || null;
    },
    enabled: !!id,
    staleTime: 30000,
    gcTime: 300000,
  });
}

export function useCreateCourtOrder(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (data: Partial<CourtOrder>) => {
      const tempId = uuidv4();
      const tempOrder: CourtOrder = {
        ...data,
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: !isOnline,
        _localOnly: !isOnline,
      } as CourtOrder;

      if (isOnline) {
        try {
          const created = await courtOrderApi.create(data);
          await db.courtOrders.put({
            ...created,
            _pending: false,
            _localOnly: false,
          });
          return created;
        } catch (error) {
          console.error('[useCreateCourtOrder] Network error, queuing for offline sync:', error);
        }
      }

      await db.courtOrders.put(tempOrder);
      await queueCreate(
        'court-order',
        tempId,
        data,
        `${API_BASE}/court/orders`,
        options
      );

      return tempOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtOrderKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('[useCreateCourtOrder] Mutation error:', error.message);
    },
  });
}
