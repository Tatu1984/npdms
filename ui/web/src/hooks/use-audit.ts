/**
 * Audit Log Hooks - React Query + Offline Support
 * Note: Audit logs are read-only, no mutations needed
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { networkMonitor } from '../lib/sync/network-monitor';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  createdAt: string;
}

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface AuditFilters {
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

const auditApi = {
  list: async (filters: AuditFilters = {}): Promise<ListResponse<AuditLog>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE}/audit/logs?${params}`, {
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

  get: async (id: string): Promise<AuditLog> => {
    const response = await fetch(`${API_BASE}/audit/${id}`, {
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

  getByResource: async (resourceType: string, resourceId: string): Promise<AuditLog[]> => {
    const response = await fetch(`${API_BASE}/audit/${resourceType}/${resourceId}`, {
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
};

export const auditKeys = {
  all: ['audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filters: AuditFilters) => [...auditKeys.lists(), filters] as const,
  details: () => [...auditKeys.all, 'detail'] as const,
  detail: (id: string) => [...auditKeys.details(), id] as const,
  byResource: (resourceType: string, resourceId: string) => 
    [...auditKeys.all, 'resource', resourceType, resourceId] as const,
};

export function useAuditLogs(filters: AuditFilters = {}) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: async () => {
      if (!isOnline) {
        // Audit logs are server-only, cannot be cached offline
        throw new Error('Audit logs require network connection');
      }

      return await auditApi.list(filters);
    },
    enabled: isOnline,
    staleTime: 10000, // 10 seconds - audit logs should be fresh
    gcTime: 60000, // 1 minute
  });
}

export function useAuditLog(id: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: auditKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;
      if (!isOnline) {
        throw new Error('Audit logs require network connection');
      }

      return await auditApi.get(id);
    },
    enabled: !!id && isOnline,
    staleTime: 10000,
    gcTime: 60000,
  });
}

export function useAuditLogsByResource(resourceType: string | undefined, resourceId: string | undefined) {
  const isOnline = networkMonitor.isOnline();

  return useQuery({
    queryKey: auditKeys.byResource(resourceType!, resourceId!),
    queryFn: async () => {
      if (!resourceType || !resourceId) return [];
      if (!isOnline) {
        throw new Error('Audit logs require network connection');
      }

      return await auditApi.getByResource(resourceType, resourceId);
    },
    enabled: !!resourceType && !!resourceId && isOnline,
    staleTime: 10000,
    gcTime: 60000,
  });
}
