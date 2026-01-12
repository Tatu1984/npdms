/**
 * Forensic Hooks - React Query + Offline Support
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Forensic, ForensicType, ForensicStatus } from '../lib/db/schema';
import {
  queueCreate,
  queueUpdate,
  queueDelete,
  type QueueOptions,
} from '../lib/sync/queue-manager';
import { networkMonitor } from '../lib/sync/network-monitor';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Demo data for when API and IndexedDB are empty
const DEMO_FORENSICS: Forensic[] = [
  {
    id: 'demo-forensic-001',
    requestNumber: 'FSL/2024/00234',
    caseId: 'demo-case-001',
    evidenceId: 'demo-evidence-002',
    type: 'DIGITAL_FORENSICS',
    status: 'IN_PROGRESS',
    requestedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    requestedBy: 'SI Rajesh Kumar',
    priority: 'HIGH',
    description: 'Digital forensic analysis of CCTV footage to identify robbery suspects',
    labName: 'FSL Bangalore - Digital Division',
    labRefNumber: 'FSL-DIG-2024-00234',
    expectedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Assigned to Dr. Ramesh Iyer',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-forensic-002',
    requestNumber: 'FSL/2024/00235',
    caseId: 'demo-case-005',
    evidenceId: 'demo-evidence-004',
    type: 'TOXICOLOGY',
    status: 'COMPLETED',
    requestedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    requestedBy: 'Inspector Anil Desai',
    priority: 'HIGH',
    description: 'Chemical analysis of seized narcotic substance for NDPS case',
    labName: 'FSL Bangalore - Narcotics Division',
    labRefNumber: 'FSL-TOX-2024-00235',
    completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    findings: 'Sample confirmed as Cannabis (Marijuana). Purity: 78%. Weight: 50 grams.',
    reportFile: '/reports/fsl-234-narcotics.pdf',
    notes: 'Analyzed by Dr. Priya Nair',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-forensic-003',
    requestNumber: 'FSL/2024/00236',
    caseId: 'demo-case-003',
    evidenceId: 'demo-evidence-005',
    type: 'FINGERPRINT',
    status: 'REPORTED',
    requestedDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    requestedBy: 'ASI Vijay Reddy',
    priority: 'MEDIUM',
    description: 'Fingerprint analysis from beer bottle used as weapon in assault case',
    labName: 'FSL Bangalore - Fingerprint Bureau',
    labRefNumber: 'FSL-FP-2024-00236',
    completedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    findings: '3 distinct fingerprint patterns identified. Match found with accused Vikram Singh (90% confidence).',
    reportFile: '/reports/fsl-236-fingerprint.pdf',
    notes: 'Analyzed by Mr. Suresh Kumar',
    createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-forensic-004',
    requestNumber: 'FSL/2024/00237',
    caseId: 'demo-case-002',
    type: 'HANDWRITING',
    status: 'REQUESTED',
    requestedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    requestedBy: 'SI Priya Sharma',
    priority: 'MEDIUM',
    description: 'Document examination for fraudulent bank documents in cyber fraud case',
    labName: 'FSL Bangalore - Document Division',
    expectedDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface ForensicFilters {
  type?: ForensicType;
  status?: ForensicStatus;
  caseId?: string;
  evidenceId?: string;
  page?: number;
  pageSize?: number;
}

const forensicApi = {
  list: async (filters: ForensicFilters = {}): Promise<ListResponse<Forensic>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE}/forensics?${params}`, {
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

  get: async (id: string): Promise<Forensic> => {
    const response = await fetch(`${API_BASE}/forensics/${id}`, {
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

  create: async (data: Partial<Forensic>): Promise<Forensic> => {
    const response = await fetch(`${API_BASE}/forensics`, {
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

  update: async (id: string, data: Partial<Forensic>): Promise<Forensic> => {
    const response = await fetch(`${API_BASE}/forensics/${id}`, {
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

  complete: async (id: string, findings: string): Promise<Forensic> => {
    const response = await fetch(`${API_BASE}/forensics/${id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ findings }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  getStats: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/forensics/stats`, {
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

export const forensicKeys = {
  all: ['forensics'] as const,
  lists: () => [...forensicKeys.all, 'list'] as const,
  list: (filters: ForensicFilters) => [...forensicKeys.lists(), filters] as const,
  details: () => [...forensicKeys.all, 'detail'] as const,
  detail: (id: string) => [...forensicKeys.details(), id] as const,
  stats: () => [...forensicKeys.all, 'stats'] as const,
};

export function useForensics(filters: ForensicFilters = {}) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: forensicKeys.list(filters),
    queryFn: async () => {
      if (isOnline) {
        try {
          const response = await forensicApi.list(filters);
          await Promise.all(
            response.data.map((forensic) =>
              db.forensics.put({
                ...forensic,
                _pending: false,
                _localOnly: false,
              })
            )
          );
          return response;
        } catch (error) {
          console.error('[useForensics] Network error, falling back to IndexedDB:', error);
        }
      }

      let query = db.forensics.orderBy('requestedDate').reverse();
      let results = await query.toArray();
      // If no data in IndexedDB, use demo data
      if (results.length === 0) {
        results = DEMO_FORENSICS;
      }
      const filtered = results.filter((forensic) => {
        if (filters.type && forensic.type !== filters.type) return false;
        if (filters.status && forensic.status !== filters.status) return false;
        if (filters.caseId && forensic.caseId !== filters.caseId) return false;
        if (filters.evidenceId && forensic.evidenceId !== filters.evidenceId) return false;
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

export function useForensic(id: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: forensicKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;

      if (isOnline) {
        try {
          const forensic = await forensicApi.get(id);
          await db.forensics.put({
            ...forensic,
            _pending: false,
            _localOnly: false,
          });
          return forensic;
        } catch (error) {
          console.error('[useForensic] Network error, falling back to IndexedDB:', error);
        }
      }

      return (await db.forensics.get(id)) || null;
    },
    enabled: !!id,
    staleTime: 30000,
    gcTime: 300000,
  });
}

export function useForensicStats() {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: forensicKeys.stats(),
    queryFn: async () => {
      if (isOnline) {
        try {
          return await forensicApi.getStats();
        } catch (error) {
          console.error('[useForensicStats] Network error:', error);
        }
      }

      const allForensics = await db.forensics.toArray();
      const stats = {
        total: allForensics.length,
        byType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        pending: allForensics.filter((f) => f._pending).length,
      };

      allForensics.forEach((forensic) => {
        stats.byType[forensic.type] = (stats.byType[forensic.type] || 0) + 1;
        stats.byStatus[forensic.status] = (stats.byStatus[forensic.status] || 0) + 1;
      });

      return stats;
    },
    staleTime: 60000,
  });
}

export function useCreateForensic(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (data: Partial<Forensic>) => {
      const tempId = uuidv4();
      const tempForensic: Forensic = {
        ...data,
        id: tempId,
        requestNumber: `TEMP-${tempId.slice(0, 8)}`,
        requestedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: !isOnline,
        _localOnly: !isOnline,
      } as Forensic;

      if (isOnline) {
        try {
          const created = await forensicApi.create(data);
          await db.forensics.put({
            ...created,
            _pending: false,
            _localOnly: false,
          });
          return created;
        } catch (error) {
          console.error('[useCreateForensic] Network error, queuing for offline sync:', error);
        }
      }

      await db.forensics.put(tempForensic);
      await queueCreate(
        'forensic',
        tempId,
        data,
        `${API_BASE}/forensics`,
        options
      );

      return tempForensic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forensicKeys.lists() });
      queryClient.invalidateQueries({ queryKey: forensicKeys.stats() });
    },
    onError: (error: Error) => {
      console.error('[useCreateForensic] Mutation error:', error.message);
    },
  });
}

export function useUpdateForensic(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Forensic> }) => {
      if (isOnline) {
        try {
          const updated = await forensicApi.update(id, data);
          await db.forensics.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });
          return updated;
        } catch (error) {
          console.error('[useUpdateForensic] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.forensics.get(id);
      if (!existing) {
        throw new Error('Forensic request not found in offline storage');
      }

      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.forensics.put(updated);
      await queueUpdate(
        'forensic',
        id,
        data,
        `${API_BASE}/forensics/${id}`,
        options
      );

      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: forensicKeys.lists() });
      queryClient.invalidateQueries({ queryKey: forensicKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: forensicKeys.stats() });
    },
    onError: (error: Error) => {
      console.error('[useUpdateForensic] Mutation error:', error.message);
    },
  });
}

export function useCompleteForensic(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, findings }: { id: string; findings: string }) => {
      if (isOnline) {
        try {
          const updated = await forensicApi.complete(id, findings);
          await db.forensics.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });
          return updated;
        } catch (error) {
          console.error('[useCompleteForensic] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.forensics.get(id);
      if (!existing) {
        throw new Error('Forensic request not found in offline storage');
      }

      const updated = {
        ...existing,
        status: 'COMPLETED' as ForensicStatus,
        findings,
        completedDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.forensics.put(updated);
      await queueUpdate(
        'forensic',
        id,
        { status: 'COMPLETED', findings },
        `${API_BASE}/forensics/${id}/complete`,
        options
      );

      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: forensicKeys.lists() });
      queryClient.invalidateQueries({ queryKey: forensicKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: forensicKeys.stats() });
    },
    onError: (error: Error) => {
      console.error('[useCompleteForensic] Mutation error:', error.message);
    },
  });
}
