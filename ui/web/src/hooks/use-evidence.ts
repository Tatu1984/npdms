/**
 * Evidence Hooks - React Query + Offline Support
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Evidence, EvidenceStatus, EvidenceType } from '../lib/db/schema';
import { queueCreate, queueUpdate, queueDelete, type QueueOptions } from '../lib/sync/queue-manager';
import { networkMonitor } from '../lib/sync/network-monitor';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface ListResponse<T> { data: T[]; total: number; page: number; pageSize: number; }
interface EvidenceFilters { status?: EvidenceStatus; type?: EvidenceType; caseId?: string; firId?: string; search?: string; page?: number; pageSize?: number; }

const evidenceApi = {
  list: async (filters: EvidenceFilters = {}): Promise<ListResponse<Evidence>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined) params.append(key, String(value)); });
    const response = await fetch(`${API_BASE}/evidence?${params}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  get: async (id: string): Promise<Evidence> => {
    const response = await fetch(`${API_BASE}/evidence/${id}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  create: async (data: Partial<Evidence>): Promise<Evidence> => {
    const response = await fetch(`${API_BASE}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  update: async (id: string, data: Partial<Evidence>): Promise<Evidence> => {
    const response = await fetch(`${API_BASE}/evidence/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/evidence/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
};

export const evidenceKeys = {
  all: ['evidence'] as const,
  lists: () => [...evidenceKeys.all, 'list'] as const,
  list: (filters: EvidenceFilters) => [...evidenceKeys.lists(), filters] as const,
  details: () => [...evidenceKeys.all, 'detail'] as const,
  detail: (id: string) => [...evidenceKeys.details(), id] as const,
};

export function useEvidence(filters: EvidenceFilters = {}) {
  const isOnline = networkMonitor.isOnline();
  return useQuery({
    queryKey: evidenceKeys.list(filters),
    queryFn: async () => {
      if (isOnline) {
        try {
          const response = await evidenceApi.list(filters);
          await Promise.all(response.data.map((e) => db.evidence.put({ ...e, _pending: false, _localOnly: false })));
          return response;
        } catch (error) { console.error('[useEvidence] Network error:', error); }
      }
      const results = await db.evidence.orderBy('collectedDate').reverse().toArray();
      const filtered = results.filter((e) => {
        if (filters.status && e.status !== filters.status) return false;
        if (filters.type && e.type !== filters.type) return false;
        if (filters.caseId && e.caseId !== filters.caseId) return false;
        if (filters.firId && e.firId !== filters.firId) return false;
        if (filters.search && !e.evidenceNumber.toLowerCase().includes(filters.search.toLowerCase())) return false;
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

export function useEvidenceItem(id: string | undefined) {
  const isOnline = networkMonitor.isOnline();
  return useQuery({
    queryKey: evidenceKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;
      if (isOnline) {
        try {
          const e = await evidenceApi.get(id);
          await db.evidence.put({ ...e, _pending: false, _localOnly: false });
          return e;
        } catch (error) { console.error('[useEvidenceItem] Network error:', error); }
      }
      return (await db.evidence.get(id)) || null;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useCreateEvidence(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();
  return useMutation({
    mutationFn: async (data: Partial<Evidence>) => {
      const tempId = uuidv4();
      const temp: Evidence = { ...data, id: tempId, evidenceNumber: `TEMP-${tempId.slice(0, 8)}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _pending: !isOnline, _localOnly: !isOnline } as Evidence;
      if (isOnline) {
        try {
          const created = await evidenceApi.create(data);
          await db.evidence.put({ ...created, _pending: false, _localOnly: false });
          return created;
        } catch (error) { console.error('[useCreateEvidence] Network error:', error); }
      }
      await db.evidence.put(temp);
      await queueCreate('evidence', tempId, data, `${API_BASE}/evidence`, options);
      return temp;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: evidenceKeys.lists() }); },
  });
}

export function useUpdateEvidence(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Evidence> }) => {
      if (isOnline) {
        try {
          const updated = await evidenceApi.update(id, data);
          await db.evidence.put({ ...updated, _pending: false, _localOnly: false });
          return updated;
        } catch (error) { console.error('[useUpdateEvidence] Network error:', error); }
      }
      const existing = await db.evidence.get(id);
      if (!existing) throw new Error('Evidence not found');
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString(), _pending: true };
      await db.evidence.put(updated);
      await queueUpdate('evidence', id, data, `${API_BASE}/evidence/${id}`, options);
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: evidenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evidenceKeys.detail(variables.id) });
    },
  });
}

export function useDeleteEvidence(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await evidenceApi.delete(id);
          await db.evidence.delete(id);
          return;
        } catch (error) { console.error('[useDeleteEvidence] Network error:', error); }
      }
      const existing = await db.evidence.get(id);
      if (existing) await db.evidence.put({ ...existing, _pending: true });
      await queueDelete('evidence', id, `${API_BASE}/evidence/${id}`, options);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: evidenceKeys.lists() });
      queryClient.removeQueries({ queryKey: evidenceKeys.detail(id) });
    },
  });
}
