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

// Demo data for when API and IndexedDB are empty
const DEMO_CASES: Case[] = [
  {
    id: 'demo-case-001',
    caseNumber: 'CASE-2024-00156',
    firId: 'demo-fir-001',
    firNumber: 'KOR/2024/00089',
    title: 'Armed Robbery at Jewellery Store',
    description: 'Armed robbery case involving multiple suspects at ABC Jewellers',
    status: 'INVESTIGATION',
    stationId: 'station-001',
    investigatingOfficer: 'SI Rajesh Kumar',
    courtName: 'Sessions Court, Koramangala',
    nextHearing: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-case-002',
    caseNumber: 'CASE-2024-00157',
    firId: 'demo-fir-002',
    firNumber: 'KOR/2024/00090',
    title: 'Cyber Fraud Investigation',
    description: 'Online banking fraud case with multiple victims',
    status: 'CHARGESHEET',
    stationId: 'station-001',
    investigatingOfficer: 'SI Priya Sharma',
    courtName: 'Magistrate Court, Koramangala',
    nextHearing: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-case-003',
    caseNumber: 'CASE-2024-00158',
    firId: 'demo-fir-003',
    firNumber: 'KOR/2024/00091',
    title: 'Assault Case - Bar Fight',
    description: 'Assault during altercation at local bar',
    status: 'TRIAL',
    stationId: 'station-001',
    investigatingOfficer: 'ASI Vijay Reddy',
    courtName: 'Sessions Court, Koramangala',
    nextHearing: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-case-004',
    caseNumber: 'CASE-2024-00159',
    firId: 'demo-fir-004',
    firNumber: 'KOR/2024/00092',
    title: 'Vehicle Theft - Two Wheeler',
    description: 'Motorcycle theft from residential parking',
    status: 'CLOSED',
    stationId: 'station-001',
    investigatingOfficer: 'SI Rajesh Kumar',
    courtName: undefined,
    nextHearing: undefined,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-case-005',
    caseNumber: 'CASE-2024-00160',
    firId: 'demo-fir-005',
    firNumber: 'KOR/2024/00093',
    title: 'Drug Possession Case',
    description: 'NDPS Act case - possession of controlled substances',
    status: 'INVESTIGATION',
    stationId: 'station-001',
    investigatingOfficer: 'Inspector Anil Desai',
    courtName: 'Sessions Court, Koramangala',
    nextHearing: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
] as Case[];

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
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  get: async (id: string): Promise<Case> => {
    const response = await fetch(`${API_BASE}/cases/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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

      // Try IndexedDB first (createdAt is not indexed, so sort in memory)
      let results = await db.cases.toArray();
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // If no data in IndexedDB, use demo data
      if (results.length === 0) {
        results = DEMO_CASES;
      }

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

export function useCase(idOrNumber: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: caseKeys.detail(idOrNumber!),
    queryFn: async () => {
      if (!idOrNumber) return null;

      // Decode URL-encoded case number
      const decodedId = decodeURIComponent(idOrNumber);

      if (isOnline) {
        try {
          const c = await caseApi.get(decodedId);
          await db.cases.put({ ...c, _pending: false, _localOnly: false });
          return c;
        } catch (error) {
          console.error('[useCase] Network error, falling back to IndexedDB/demo:', error);
        }
      }

      // Offline mode: fetch from IndexedDB first
      let caseData = await db.cases.get(decodedId);

      // If not found by ID, try to find by case number
      if (!caseData) {
        const allCases = await db.cases.toArray();
        caseData = allCases.find(c => c.caseNumber === decodedId || c.id === decodedId);
      }

      // If still not found, check demo data
      if (!caseData) {
        caseData = DEMO_CASES.find(c => c.caseNumber === decodedId || c.id === decodedId);
      }

      return caseData || null;
    },
    enabled: !!idOrNumber,
    staleTime: 30000,
  });
}

export function useCreateCase(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (data: Partial<Case>) => {
      const tempId = uuidv4();
      const caseNumber = data.caseNumber || `CASE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
      const temp: Case = {
        ...data,
        id: tempId,
        caseNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: true,
        _localOnly: true,
      } as Case;

      if (isOnline) {
        try {
          const created = await caseApi.create(data);
          await db.cases.put({ ...created, _pending: false, _localOnly: false });
          return created;
        } catch (error) {
          console.error('[useCreateCase] Network error, saving locally:', error);
        }
      }

      // Offline/Demo: Store in IndexedDB
      await db.cases.put(temp);

      // Only queue for sync if we were online and failed
      if (isOnline) {
        await queueCreate('case', tempId, data, `${API_BASE}/cases`, options);
      }

      return temp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('[useCreateCase] Mutation error:', error.message);
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
    onError: (error: Error) => {
      console.error('[useUpdateCase] Mutation error:', error.message);
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
    onError: (error: Error) => {
      console.error('[useDeleteCase] Mutation error:', error.message);
    },
  });
}
