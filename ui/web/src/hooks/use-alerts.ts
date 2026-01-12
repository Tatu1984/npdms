/**
 * Alert Hooks - React Query + Offline Support
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Alert, AlertType, AlertScope } from '../lib/db/schema';
import { queueCreate, queueUpdate, type QueueOptions } from '../lib/sync/queue-manager';
import { networkMonitor } from '../lib/sync/network-monitor';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Demo data for when API and IndexedDB are empty
const DEMO_ALERTS: Alert[] = [
  {
    id: 'demo-alert-001',
    type: 'BOLO',
    scope: 'STATE',
    title: 'Armed Robbery Suspect - Ravi Shankar',
    description: 'Suspect in armed robbery case at ABC Jewellers. Last seen wearing blue shirt, jeans. Height: 5\'10", Age: 32, Scar on left cheek.',
    issuedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    issuedBy: 'SI Rajesh Kumar',
    priority: 1,
    acknowledged: false,
    hasImage: true,
    imageUrl: '',
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-alert-002',
    type: 'URGENT',
    scope: 'DISTRICT',
    title: 'Missing Child - Priya Sharma (12 years)',
    description: 'Missing from Indiranagar area since yesterday evening. Last seen wearing school uniform. Height: 4\'5", slim build.',
    issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    issuedBy: 'Inspector Anil Desai',
    priority: 1,
    acknowledged: false,
    hasImage: true,
    imageUrl: '',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-alert-003',
    type: 'NOTICE',
    scope: 'DISTRICT',
    title: 'Stolen Vehicle - Honda City (KA-01-MN-4567)',
    description: 'White Honda City sedan stolen from JP Nagar residential parking. Vehicle has custom alloy wheels.',
    issuedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    issuedBy: 'SI Priya Sharma',
    priority: 2,
    acknowledged: true,
    acknowledgedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    acknowledgedBy: 'Traffic Control Room',
    hasImage: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-alert-004',
    type: 'BOLO',
    scope: 'NATIONAL',
    title: 'Inter-State Drug Trafficking Network',
    description: 'Be on lookout for members of drug trafficking network operating between Karnataka and Tamil Nadu. Key suspect: Sunil Kumar.',
    issuedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    issuedBy: 'DCP Narcotics',
    priority: 1,
    acknowledged: true,
    acknowledgedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    acknowledgedBy: 'All Station Heads',
    hasImage: true,
    imageUrl: '',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-alert-005',
    type: 'FLASH',
    scope: 'STATION',
    title: 'VIP Movement - CM Visit to Koramangala',
    description: 'Chief Minister visiting Koramangala area tomorrow for inauguration. Enhanced security deployment required.',
    issuedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    issuedBy: 'ACP Traffic',
    priority: 1,
    acknowledged: false,
    hasImage: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface ListResponse<T> { data: T[]; total: number; page: number; pageSize: number; }
interface AlertFilters { type?: AlertType; scope?: AlertScope; acknowledged?: boolean; active?: boolean; page?: number; pageSize?: number; }

const alertApi = {
  list: async (filters: AlertFilters = {}): Promise<ListResponse<Alert>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined) params.append(key, String(value)); });
    const response = await fetch(`${API_BASE}/alerts?${params}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  get: async (id: string): Promise<Alert> => {
    const response = await fetch(`${API_BASE}/alerts/${id}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  create: async (data: Partial<Alert>): Promise<Alert> => {
    const response = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  acknowledge: async (id: string): Promise<Alert> => {
    const response = await fetch(`${API_BASE}/alerts/${id}/acknowledge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};

export const alertKeys = {
  all: ['alerts'] as const,
  lists: () => [...alertKeys.all, 'list'] as const,
  list: (filters: AlertFilters) => [...alertKeys.lists(), filters] as const,
  details: () => [...alertKeys.all, 'detail'] as const,
  detail: (id: string) => [...alertKeys.details(), id] as const,
  active: () => [...alertKeys.all, 'active'] as const,
};

export function useAlerts(filters: AlertFilters = {}) {
  const isOnline = networkMonitor.isOnline();
  return useQuery({
    queryKey: alertKeys.list(filters),
    queryFn: async () => {
      if (isOnline) {
        try {
          const response = await alertApi.list(filters);
          await Promise.all(response.data.map((a) => db.alerts.put({ ...a, _pending: false, _localOnly: false })));
          return response;
        } catch (error) { console.error('[useAlerts] Network error:', error); }
      }
      let results = await db.alerts.orderBy('issuedAt').reverse().toArray();
      // If no data in IndexedDB, use demo data
      if (results.length === 0) {
        results = DEMO_ALERTS;
      }
      const now = new Date().toISOString();
      const filtered = results.filter((a) => {
        if (filters.type && a.type !== filters.type) return false;
        if (filters.scope && a.scope !== filters.scope) return false;
        if (filters.acknowledged !== undefined && a.acknowledged !== filters.acknowledged) return false;
        if (filters.active && a.expiresAt < now) return false;
        return true;
      });
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const start = (page - 1) * pageSize;
      return { data: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize };
    },
    staleTime: 10000, // Refresh alerts more frequently
  });
}

export function useAlert(id: string | undefined) {
  const isOnline = networkMonitor.isOnline();
  return useQuery({
    queryKey: alertKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;
      if (isOnline) {
        try {
          const a = await alertApi.get(id);
          await db.alerts.put({ ...a, _pending: false, _localOnly: false });
          return a;
        } catch (error) { console.error('[useAlert] Network error:', error); }
      }
      return (await db.alerts.get(id)) || null;
    },
    enabled: !!id,
    staleTime: 10000,
  });
}

export function useCreateAlert(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();
  return useMutation({
    mutationFn: async (data: Partial<Alert>) => {
      const tempId = uuidv4();
      const temp: Alert = { ...data, id: tempId, issuedAt: new Date().toISOString(), acknowledged: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _pending: !isOnline, _localOnly: !isOnline } as Alert;
      if (isOnline) {
        try {
          const created = await alertApi.create(data);
          await db.alerts.put({ ...created, _pending: false, _localOnly: false });
          return created;
        } catch (error) { console.error('[useCreateAlert] Network error:', error); }
      }
      await db.alerts.put(temp);
      await queueCreate('alert', tempId, data, `${API_BASE}/alerts`, options);
      return temp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
      queryClient.invalidateQueries({ queryKey: alertKeys.active() });
    },
    onError: (error: Error) => {
      console.error('[useCreateAlert] Mutation error:', error.message);
    },
  });
}

export function useAcknowledgeAlert(options?: QueueOptions) {
  const queryClient = useQueryClient();
  const isOnline = networkMonitor.isOnline();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          const updated = await alertApi.acknowledge(id);
          await db.alerts.put({ ...updated, _pending: false, _localOnly: false });
          return updated;
        } catch (error) { console.error('[useAcknowledgeAlert] Network error:', error); }
      }
      const existing = await db.alerts.get(id);
      if (!existing) throw new Error('Alert not found');
      const updated = { ...existing, acknowledged: true, acknowledgedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _pending: true };
      await db.alerts.put(updated);
      await queueUpdate('alert', id, { acknowledged: true }, `${API_BASE}/alerts/${id}/acknowledge`, options);
      return updated;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
      queryClient.invalidateQueries({ queryKey: alertKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: alertKeys.active() });
    },
    onError: (error: Error) => {
      console.error('[useAcknowledgeAlert] Mutation error:', error.message);
    },
  });
}

export function useActiveAlerts() {
  return useAlerts({ active: true, acknowledged: false });
}
