/**
 * Court Hearing Hooks - React Query + Offline Support
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, CourtHearing, HearingType, HearingStatus } from '../lib/db/schema';
import {
  queueCreate,
  queueUpdate,
  type QueueOptions,
} from '../lib/sync/queue-manager';
import { networkMonitor } from '../lib/sync/network-monitor';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Demo data for when API and IndexedDB are empty
const DEMO_COURT_HEARINGS: CourtHearing[] = [
  {
    id: 'demo-hearing-001',
    caseId: 'demo-case-001',
    caseNumber: 'CASE-2024-00156',
    type: 'BAIL',
    status: 'SCHEDULED',
    courtName: 'Sessions Court, Bangalore',
    judgeType: 'Sessions Judge',
    judgeName: 'Hon. Justice Ramakrishna',
    hearingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'HIGH',
    agenda: 'Bail hearing for accused Ravi Shankar in armed robbery case',
    prosecutorName: 'Public Prosecutor Anand Kumar',
    defenseLawyer: 'Adv. Suresh Menon',
    remarks: 'Accused has no prior criminal record. Defense likely to argue for bail.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-hearing-002',
    caseId: 'demo-case-003',
    caseNumber: 'CASE-2024-00158',
    type: 'ARGUMENT',
    status: 'COMPLETED',
    courtName: 'Magistrate Court, Bangalore',
    judgeType: 'Magistrate',
    judgeName: 'Hon. Magistrate Vijay Kumar',
    hearingDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'MEDIUM',
    agenda: 'Final arguments in assault case',
    prosecutorName: 'Public Prosecutor Meera Nair',
    defenseLawyer: 'Adv. Rajan Iyer',
    outcome: 'Arguments completed. Judgement reserved for next hearing.',
    nextHearingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-hearing-003',
    caseId: 'demo-case-002',
    caseNumber: 'CASE-2024-00157',
    type: 'EVIDENCE',
    status: 'SCHEDULED',
    courtName: 'High Court, Karnataka',
    judgeType: 'High Court Judge',
    judgeName: 'Hon. Justice Priya Sharma',
    hearingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'HIGH',
    agenda: 'Evidence examination for cyber fraud case - bank documents and digital evidence',
    prosecutorName: 'Special Public Prosecutor Raghav Iyer',
    defenseLawyer: 'Adv. Priya Nair',
    remarks: 'FSL reports to be submitted. Witness examination may follow.',
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-hearing-004',
    caseId: 'demo-case-005',
    caseNumber: 'CASE-2024-00160',
    type: 'BAIL',
    status: 'COMPLETED',
    courtName: 'Sessions Court, Bangalore',
    judgeType: 'Sessions Judge',
    judgeName: 'Hon. Justice Suresh Reddy',
    hearingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'HIGH',
    agenda: 'Bail application for NDPS case accused',
    prosecutorName: 'Public Prosecutor Anil Kumar',
    defenseLawyer: 'Adv. Kamal Hassan',
    outcome: 'Bail rejected due to severity of charges and risk of evidence tampering.',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-hearing-005',
    caseId: 'demo-case-003',
    caseNumber: 'CASE-2024-00158',
    type: 'JUDGMENT',
    status: 'SCHEDULED',
    courtName: 'Magistrate Court, Bangalore',
    judgeType: 'Magistrate',
    judgeName: 'Hon. Magistrate Vijay Kumar',
    hearingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'MEDIUM',
    agenda: 'Pronouncement of judgement in assault case',
    prosecutorName: 'Public Prosecutor Meera Nair',
    defenseLawyer: 'Adv. Rajan Iyer',
    remarks: 'Final judgement to be delivered.',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface CourtHearingFilters {
  type?: HearingType;
  status?: HearingStatus;
  caseId?: string;
  courtName?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

const courtHearingApi = {
  list: async (filters: CourtHearingFilters = {}): Promise<ListResponse<CourtHearing>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE}/court/hearings?${params}`, {
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

  get: async (id: string): Promise<CourtHearing> => {
    const response = await fetch(`${API_BASE}/court/hearings/${id}`, {
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

  create: async (data: Partial<CourtHearing>): Promise<CourtHearing> => {
    const response = await fetch(`${API_BASE}/court/hearings`, {
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

  update: async (id: string, data: Partial<CourtHearing>): Promise<CourtHearing> => {
    const response = await fetch(`${API_BASE}/court/hearings/${id}`, {
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
};

export const courtHearingKeys = {
  all: ['court-hearings'] as const,
  lists: () => [...courtHearingKeys.all, 'list'] as const,
  list: (filters: CourtHearingFilters) => [...courtHearingKeys.lists(), filters] as const,
  details: () => [...courtHearingKeys.all, 'detail'] as const,
  detail: (id: string) => [...courtHearingKeys.details(), id] as const,
};

export function useCourtHearings(filters: CourtHearingFilters = {}) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: courtHearingKeys.list(filters),
    queryFn: async () => {
      if (isOnline) {
        try {
          const response = await courtHearingApi.list(filters);
          await Promise.all(
            response.data.map((hearing) =>
              db.courtHearings.put({
                ...hearing,
                _pending: false,
                _localOnly: false,
              })
            )
          );
          return response;
        } catch (error) {
          console.error('[useCourtHearings] Network error, falling back to IndexedDB:', error);
        }
      }

      let query = db.courtHearings.orderBy('hearingDate').reverse();
      let results = await query.toArray();
      // If no data in IndexedDB, use demo data
      if (results.length === 0) {
        results = DEMO_COURT_HEARINGS;
      }
      const filtered = results.filter((hearing) => {
        if (filters.type && hearing.type !== filters.type) return false;
        if (filters.status && hearing.status !== filters.status) return false;
        if (filters.caseId && hearing.caseId !== filters.caseId) return false;
        if (filters.courtName && hearing.courtName !== filters.courtName) return false;
        if (filters.dateFrom && hearing.hearingDate < filters.dateFrom) return false;
        if (filters.dateTo && hearing.hearingDate > filters.dateTo) return false;
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

export function useCourtHearing(id: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: courtHearingKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;

      if (isOnline) {
        try {
          const hearing = await courtHearingApi.get(id);
          await db.courtHearings.put({
            ...hearing,
            _pending: false,
            _localOnly: false,
          });
          return hearing;
        } catch (error) {
          console.error('[useCourtHearing] Network error, falling back to IndexedDB:', error);
        }
      }

      return (await db.courtHearings.get(id)) || null;
    },
    enabled: !!id,
    staleTime: 30000,
    gcTime: 300000,
  });
}

export function useCreateCourtHearing(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async (data: Partial<CourtHearing>) => {
      const tempId = uuidv4();
      const tempHearing: CourtHearing = {
        ...data,
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: !isOnline,
        _localOnly: !isOnline,
      } as CourtHearing;

      if (isOnline) {
        try {
          const created = await courtHearingApi.create(data);
          await db.courtHearings.put({
            ...created,
            _pending: false,
            _localOnly: false,
          });
          return created;
        } catch (error) {
          console.error('[useCreateCourtHearing] Network error, queuing for offline sync:', error);
        }
      }

      await db.courtHearings.put(tempHearing);
      await queueCreate(
        'court-hearing',
        tempId,
        data,
        `${API_BASE}/court/hearings`,
        options
      );

      return tempHearing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtHearingKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('[useCreateCourtHearing] Mutation error:', error.message);
    },
  });
}

export function useUpdateCourtHearing(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CourtHearing> }) => {
      if (isOnline) {
        try {
          const updated = await courtHearingApi.update(id, data);
          await db.courtHearings.put({
            ...updated,
            _pending: false,
            _localOnly: false,
          });
          return updated;
        } catch (error) {
          console.error('[useUpdateCourtHearing] Network error, queuing for offline sync:', error);
        }
      }

      const existing = await db.courtHearings.get(id);
      if (!existing) {
        throw new Error('Court hearing not found in offline storage');
      }

      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
        _pending: true,
      };

      await db.courtHearings.put(updated);
      await queueUpdate(
        'court-hearing',
        id,
        data,
        `${API_BASE}/court/hearings/${id}`,
        options
      );

      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: courtHearingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courtHearingKeys.detail(variables.id) });
    },
    onError: (error: Error) => {
      console.error('[useUpdateCourtHearing] Mutation error:', error.message);
    },
  });
}
