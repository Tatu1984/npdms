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

// Demo data for when API and IndexedDB are empty
const DEMO_EVIDENCE: Evidence[] = [
  {
    id: 'demo-evidence-001',
    evidenceNumber: 'EVD/2024/00145',
    firId: 'demo-fir-001',
    caseId: 'demo-case-001',
    type: 'PHYSICAL',
    description: 'Gold jewellery recovered from suspect - 250 grams gold chain and 2 rings',
    collectedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    collectedBy: 'SI Rajesh Kumar',
    collectedFrom: 'Koramangala, 5th Block',
    status: 'PRESERVED',
    location: 'Koramangala PS Evidence Room - Locker B-12',
    chainOfCustody: 'Collected by SI Rajesh Kumar on scene. Stored in evidence locker.',
    hasPhoto: true,
    photoUrl: '',
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-evidence-002',
    evidenceNumber: 'EVD/2024/00146',
    firId: 'demo-fir-001',
    caseId: 'demo-case-001',
    type: 'DIGITAL',
    description: 'CCTV footage from ABC Jewellers showing robbery in progress',
    collectedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    collectedBy: 'ASI Vijay Reddy',
    collectedFrom: 'ABC Jewellers, 100ft Road',
    status: 'UNDER_ANALYSIS',
    location: 'FSL Bangalore - Digital Division',
    chainOfCustody: 'Retrieved by ASI Vijay Reddy. Sent to FSL for analysis.',
    hasPhoto: false,
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-evidence-003',
    evidenceNumber: 'EVD/2024/00147',
    firId: 'demo-fir-002',
    caseId: 'demo-case-002',
    type: 'DOCUMENTARY',
    description: 'Bank statements showing fraudulent transactions - 12 pages',
    collectedDate: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString(),
    collectedBy: 'SI Priya Sharma',
    collectedFrom: 'ICICI Bank, HSR Layout',
    status: 'PRESERVED',
    location: 'Koramangala PS Evidence Room - Document Safe D-05',
    chainOfCustody: 'Obtained from bank with proper authorization. Stored in document safe.',
    hasPhoto: true,
    photoUrl: '',
    createdAt: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-evidence-004',
    evidenceNumber: 'EVD/2024/00148',
    firId: 'demo-fir-005',
    caseId: 'demo-case-005',
    type: 'FORENSIC',
    description: 'Cannabis sample - 50 grams seized from accused',
    collectedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    collectedBy: 'Inspector Anil Desai',
    collectedFrom: 'Near Forum Mall, Koramangala',
    status: 'UNDER_ANALYSIS',
    location: 'FSL Bangalore - Narcotics Division',
    chainOfCustody: 'Seized during arrest. Sent to FSL for chemical analysis.',
    hasPhoto: true,
    photoUrl: '',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-evidence-005',
    evidenceNumber: 'EVD/2024/00149',
    firId: 'demo-fir-003',
    caseId: 'demo-case-003',
    type: 'PHYSICAL',
    description: 'Broken beer bottle used as weapon - fingerprints collected',
    collectedDate: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
    collectedBy: 'ASI Vijay Reddy',
    collectedFrom: 'Blue Moon Bar, Indiranagar',
    status: 'SUBMITTED',
    location: 'Court of Sessions - Exhibit Box C-234',
    chainOfCustody: 'Collected from scene. FSL analysis completed. Submitted to court.',
    hasPhoto: true,
    photoUrl: '',
    createdAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface ListResponse<T> { data: T[]; total: number; page: number; pageSize: number; }
interface EvidenceFilters { status?: EvidenceStatus; type?: EvidenceType; caseId?: string; firId?: string; search?: string; page?: number; pageSize?: number; }

const evidenceApi = {
  list: async (filters: EvidenceFilters = {}): Promise<ListResponse<Evidence>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined) params.append(key, String(value)); });
    const response = await fetch(`${API_BASE}/evidence?${params}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  get: async (id: string): Promise<Evidence> => {
    const response = await fetch(`${API_BASE}/evidence/${id}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  create: async (data: Partial<Evidence>): Promise<Evidence> => {
    const response = await fetch(`${API_BASE}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  update: async (id: string, data: Partial<Evidence>): Promise<Evidence> => {
    const response = await fetch(`${API_BASE}/evidence/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/evidence/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
  transfer: async (id: string, data: {
    transferredTo: string;
    transferredToName?: string;
    transferredToDesignation?: string;
    location: string;
    transferDate: string;
    reason: string;
    remarks?: string;
  }): Promise<any> => {
    const response = await fetch(`${API_BASE}/evidence/${id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
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
      let results = await db.evidence.orderBy('collectedDate').reverse().toArray();
      // If no data in IndexedDB, use demo data
      if (results.length === 0) {
        results = DEMO_EVIDENCE;
      }
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
    onError: (error: Error) => {
      console.error('[useCreateEvidence] Mutation error:', error.message);
    },
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
    onError: (error: Error) => {
      console.error('[useUpdateEvidence] Mutation error:', error.message);
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
    onError: (error: Error) => {
      console.error('[useDeleteEvidence] Mutation error:', error.message);
    },
  });
}

export function useTransferEvidence(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();
  return useMutation({
    mutationFn: async ({ evidenceId, data }: { evidenceId: string; data: any }) => {
      if (isOnline) {
        try {
          const result = await evidenceApi.transfer(evidenceId, data);
          // Refresh evidence item
          const updated = await evidenceApi.get(evidenceId);
          await db.evidence.put({ ...updated, _pending: false, _localOnly: false });
          return result;
        } catch (error) {
          console.error('[useTransferEvidence] Network error:', error);
          throw error;
        }
      }
      throw new Error('Transfer requires network connection');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: evidenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evidenceKeys.detail(variables.evidenceId) });
    },
    onError: (error: Error) => {
      console.error('[useTransferEvidence] Mutation error:', error.message);
    },
  });
}
