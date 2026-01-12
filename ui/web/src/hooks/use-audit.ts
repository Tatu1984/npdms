/**
 * Audit Log Hooks - React Query + Offline Support
 * Note: Audit logs are read-only, no mutations needed
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { networkMonitor } from '../lib/sync/network-monitor';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Demo data for when API is unavailable
const DEMO_AUDIT_LOGS = [
  {
    id: 'demo-audit-001',
    userId: 'demo-personnel-001',
    userName: 'SI Rajesh Kumar',
    action: 'CREATE',
    resourceType: 'FIR',
    resourceId: 'demo-fir-001',
    details: { firNumber: 'KOR/2024/00089', title: 'Armed Robbery at Jewellery Store' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-audit-002',
    userId: 'demo-personnel-002',
    userName: 'SI Priya Sharma',
    action: 'UPDATE',
    resourceType: 'CASE',
    resourceId: 'demo-case-002',
    details: { status: 'CHARGESHEET_FILED', previousStatus: 'UNDER_INVESTIGATION' },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-audit-003',
    userId: 'demo-personnel-003',
    userName: 'Inspector Anil Desai',
    action: 'CREATE',
    resourceType: 'WARRANT',
    resourceId: 'demo-warrant-001',
    details: { warrantNumber: 'WRN/2024/00045', type: 'ARREST', accusedName: 'Ravi Shankar' },
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-audit-004',
    userId: 'demo-personnel-001',
    userName: 'SI Rajesh Kumar',
    action: 'CREATE',
    resourceType: 'EVIDENCE',
    resourceId: 'demo-evidence-001',
    details: { evidenceNumber: 'EVD/2024/00145', type: 'PHYSICAL', description: 'Gold jewellery recovered' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-audit-005',
    userId: 'demo-personnel-004',
    userName: 'ASI Vijay Reddy',
    action: 'UPDATE',
    resourceType: 'WARRANT',
    resourceId: 'demo-warrant-004',
    details: { status: 'EXECUTED', previousStatus: 'PENDING' },
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Android 11; Mobile)',
    timestamp: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-audit-006',
    userId: 'demo-personnel-003',
    userName: 'Inspector Anil Desai',
    action: 'LOGIN',
    resourceType: 'AUTH',
    resourceId: 'session-12345',
    details: { loginMethod: 'password', station: 'Koramangala PS' },
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-audit-007',
    userId: 'demo-personnel-002',
    userName: 'SI Priya Sharma',
    action: 'CREATE',
    resourceType: 'FORENSIC',
    resourceId: 'demo-forensic-004',
    details: { requestNumber: 'FSL/2024/00237', type: 'DOCUMENT', caseId: 'demo-case-002' },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-audit-008',
    userId: 'demo-personnel-001',
    userName: 'SI Rajesh Kumar',
    action: 'VIEW',
    resourceType: 'CASE',
    resourceId: 'demo-case-001',
    details: { caseNumber: 'CASE-2024-00156' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0)',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

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
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
      if (isOnline) {
        try {
          return await auditApi.list(filters);
        } catch (error) {
          console.error('[useAuditLogs] Network error, using demo data:', error);
        }
      }

      // Offline or API unavailable - return demo data
      let filtered = [...DEMO_AUDIT_LOGS];
      if (filters.userId) filtered = filtered.filter(a => a.userId === filters.userId);
      if (filters.resourceType) filtered = filtered.filter(a => a.resourceType === filters.resourceType);
      if (filters.resourceId) filtered = filtered.filter(a => a.resourceId === filters.resourceId);
      if (filters.action) filtered = filtered.filter(a => a.action === filters.action);
      if (filters.dateFrom) filtered = filtered.filter(a => a.timestamp >= filters.dateFrom!);
      if (filters.dateTo) filtered = filtered.filter(a => a.timestamp <= filters.dateTo!);

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
