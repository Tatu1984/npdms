/**
 * Warrant Hooks - React Query + Offline Support
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Warrant, WarrantStatus, WarrantType, FIRPriority } from '../lib/db/schema';
import { queueCreate, queueUpdate, queueDelete, type QueueOptions } from '../lib/sync/queue-manager';
import { networkMonitor } from '../lib/sync/network-monitor';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface ListResponse<T> { data: T[]; total: number; page: number; pageSize: number; }
interface WarrantFilters { status?: WarrantStatus; type?: WarrantType; priority?: FIRPriority; caseId?: string; search?: string; page?: number; pageSize?: number; }

const warrantApi = {
  list: async (filters: WarrantFilters = {}): Promise<ListResponse<Warrant>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined) params.append(key, String(value)); });
    const response = await fetch(`${API_BASE}/warrants?${params}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  get: async (id: string): Promise<Warrant> => {
    const response = await fetch(`${API_BASE}/warrants/${id}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  create: async (data: Partial<Warrant>): Promise<Warrant> => {
    const response = await fetch(`${API_BASE}/warrants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  update: async (id: string, data: Partial<Warrant>): Promise<Warrant> => {
    const response = await fetch(`${API_BASE}/warrants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  updateStatus: async (id: string, status: WarrantStatus): Promise<Warrant> => {
    const response = await fetch(`${API_BASE}/warrants/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};

export const warrantKeys = {
  all: ['warrants'] as const,
  lists: () => [...warrantKeys.all, 'list'] as const,
  list: (filters: WarrantFilters) => [...warrantKeys.lists(), filters] as const,
  details: () => [...warrantKeys.all, 'detail'] as const,
  detail: (id: string) => [...warrantKeys.details(), id] as const,
};

export function useWarrants(filters: WarrantFilters = {}) {
  const isOnline = networkMonitor.isOnline();
  return useQuery({
    queryKey: warrantKeys.list(filters),
    queryFn: async () => {
      if (isOnline) {
        try {
          const response = await warrantApi.list(filters);
          await Promise.all(response.data.map((w) => db.warrants.put({ ...w, _pending: false, _localOnly: false })));
          return response;
        } catch (error) { console.error('[useWarrants] Network error:', error); }
      }
      const results = await db.warrants.orderBy('issuedDate').reverse().toArray();
      const filtered = results.filter((w) => {
        if (filters.status && w.status !== filters.status) return false;
        if (filters.type && w.type !== filters.type) return false;
        if (filters.priority && w.priority !== filters.priority) return false;
        if (filters.caseId && w.caseId !== filters.caseId) return false;
        if (filters.search && !w.warrantNumber.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
      });
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const start = (page - 1) * pageSize;
      return { data: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize };
    },
    staleTime: 30000,
  });
}

export function useWarrant(id: string | undefined) {
  const isOnline = networkMonitor.isOnline();
  return useQuery({
    queryKey: warrantKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;
      if (isOnline) {
        try {
          const w = await warrantApi.get(id);
          await db.warrants.put({ ...w, _pending: false, _localOnly: false });
          return w;
        } catch (error) { console.error('[useWarrant] Network error:', error); }
      }
      return (await db.warrants.get(id)) || null;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useCreateWarrant(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();
  return useMutation({
    mutationFn: async (data: Partial<Warrant>) => {
      const tempId = uuidv4();
      const temp: Warrant = { ...data, id: tempId, warrantNumber: `TEMP-${tempId.slice(0, 8)}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _pending: !isOnline, _localOnly: !isOnline } as Warrant;
      if (isOnline) {
        try {
          const created = await warrantApi.create(data);
          await db.warrants.put({ ...created, _pending: false, _localOnly: false });
          return created;
        } catch (error) { console.error('[useCreateWarrant] Network error:', error); }
      }
      await db.warrants.put(temp);
      await queueCreate('warrant', tempId, data, `${API_BASE}/warrants`, options);
      return temp;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: warrantKeys.lists() }); },
    onError: (error: Error) => {
      console.error('[useCreateWarrant] Mutation error:', error.message);
    },
  });
}

export function useUpdateWarrant(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Warrant> }) => {
      if (isOnline) {
        try {
          const updated = await warrantApi.update(id, data);
          await db.warrants.put({ ...updated, _pending: false, _localOnly: false });
          return updated;
        } catch (error) { console.error('[useUpdateWarrant] Network error:', error); }
      }
      const existing = await db.warrants.get(id);
      if (!existing) throw new Error('Warrant not found');
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString(), _pending: true };
      await db.warrants.put(updated);
      await queueUpdate('warrant', id, data, `${API_BASE}/warrants/${id}`, options);
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: warrantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warrantKeys.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('[useUpdateWarrant] Mutation error:', error.message);
    },
  });
}

export function useUpdateWarrantStatus(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: WarrantStatus }) => {
      if (isOnline) {
        try {
          const updated = await warrantApi.updateStatus(id, status);
          await db.warrants.put({ ...updated, _pending: false, _localOnly: false });
          return updated;
        } catch (error) { console.error('[useUpdateWarrantStatus] Network error:', error); }
      }
      const existing = await db.warrants.get(id);
      if (!existing) throw new Error('Warrant not found');
      const updated = { ...existing, status, updatedAt: new Date().toISOString(), _pending: true };
      await db.warrants.put(updated);
      await queueUpdate('warrant', id, { status }, `${API_BASE}/warrants/${id}/status`, options);
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: warrantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warrantKeys.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('[useUpdateWarrantStatus] Mutation error:', error.message);
    },
  });
}
