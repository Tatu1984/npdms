'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type AccessLog,
  type AccessAction,
  type IPGeolocation,
  getIPGeolocation,
  parseUserAgent,
  generateSessionId,
} from '@/lib/services/ip-tracker';

// Re-export types for consumers
export type { AccessLog, AccessAction, IPGeolocation };

interface AccessLogState {
  logs: AccessLog[];
  currentSessionId: string | null;
  isLogging: boolean;

  // Actions
  logAccess: (params: LogAccessParams) => Promise<void>;
  getLogs: (filters?: LogFilters) => AccessLog[];
  getLogById: (id: string) => AccessLog | undefined;
  clearLogs: () => void;
  exportLogs: (filters?: LogFilters) => string;
  startSession: () => string;
  endSession: () => void;

  // Stats
  getStats: () => AccessLogStats;
  getRecentActivity: (userId?: string, limit?: number) => AccessLog[];
  getSuspiciousActivity: () => AccessLog[];
}

interface LogAccessParams {
  userId: string;
  userName: string;
  userRole: string;
  userBadge?: string;
  stationId?: string;
  stationName?: string;
  action: AccessAction;
  resource?: string;
  resourceId?: string;
  description: string;
  ipAddress?: string;
  success?: boolean;
  errorMessage?: string;
}

interface LogFilters {
  userId?: string;
  action?: AccessAction;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
  success?: boolean;
  search?: string;
}

interface AccessLogStats {
  totalLogs: number;
  todayLogs: number;
  uniqueUsers: number;
  uniqueIPs: number;
  failedLogins: number;
  suspiciousActivities: number;
  byAction: Record<string, number>;
  byCountry: Record<string, number>;
  byDevice: Record<string, number>;
}

// Demo/mock access logs for initial data
const DEMO_LOGS: AccessLog[] = [
  {
    id: 'log-001',
    userId: 'user-001',
    userName: 'SI Rajesh Kumar',
    userRole: 'SI',
    userBadge: 'KAR-SI-1234',
    stationId: 'station-001',
    stationName: 'Koramangala PS',
    action: 'LOGIN',
    description: 'User logged in successfully',
    ipAddress: '103.21.125.77',
    geolocation: {
      ip: '103.21.125.77',
      city: 'Bangalore',
      region: 'Karnataka',
      regionCode: 'KA',
      country: 'India',
      countryCode: 'IN',
      latitude: 12.9716,
      longitude: 77.5946,
      timezone: 'Asia/Kolkata',
      isp: 'Airtel',
      formattedAddress: 'Koramangala, Bangalore, Karnataka, India',
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    deviceType: 'desktop',
    browser: 'Chrome',
    os: 'Windows 10/11',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sessionId: 'sess_001',
    success: true,
  },
  {
    id: 'log-002',
    userId: 'user-002',
    userName: 'ASI Priya Sharma',
    userRole: 'ASI',
    userBadge: 'KAR-ASI-5678',
    stationId: 'station-001',
    stationName: 'Koramangala PS',
    action: 'VIEW',
    resource: 'FIR',
    resourceId: 'KOR/2024/00089',
    description: 'Viewed FIR details',
    ipAddress: '49.37.142.88',
    geolocation: {
      ip: '49.37.142.88',
      city: 'Bangalore',
      region: 'Karnataka',
      regionCode: 'KA',
      country: 'India',
      countryCode: 'IN',
      latitude: 12.9352,
      longitude: 77.6245,
      timezone: 'Asia/Kolkata',
      isp: 'Jio',
      formattedAddress: 'HSR Layout, Bangalore, Karnataka, India',
    },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
    deviceType: 'mobile',
    browser: 'Safari',
    os: 'iOS',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    sessionId: 'sess_002',
    success: true,
  },
  {
    id: 'log-003',
    userId: 'unknown',
    userName: 'Unknown',
    userRole: 'Unknown',
    action: 'LOGIN_FAILED',
    description: 'Failed login attempt - invalid credentials',
    ipAddress: '185.220.101.45',
    geolocation: {
      ip: '185.220.101.45',
      city: 'Frankfurt',
      region: 'Hesse',
      regionCode: 'HE',
      country: 'Germany',
      countryCode: 'DE',
      latitude: 50.1109,
      longitude: 8.6821,
      timezone: 'Europe/Berlin',
      isp: 'Tor Exit Node',
      proxy: true,
      tor: true,
      formattedAddress: 'Frankfurt, Hesse, Germany (TOR Exit)',
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0',
    deviceType: 'desktop',
    browser: 'Firefox',
    os: 'Windows 10/11',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    success: false,
    errorMessage: 'Invalid username or password',
  },
  {
    id: 'log-004',
    userId: 'user-003',
    userName: 'Inspector Anil Desai',
    userRole: 'INSPECTOR',
    userBadge: 'KAR-INS-9012',
    stationId: 'station-001',
    stationName: 'Koramangala PS',
    action: 'EXPORT',
    resource: 'Cases',
    description: 'Exported case records to CSV',
    ipAddress: '117.193.225.12',
    geolocation: {
      ip: '117.193.225.12',
      city: 'Bangalore',
      region: 'Karnataka',
      regionCode: 'KA',
      country: 'India',
      countryCode: 'IN',
      latitude: 12.9165,
      longitude: 77.6101,
      timezone: 'Asia/Kolkata',
      isp: 'BSNL',
      formattedAddress: 'BTM Layout, Bangalore, Karnataka, India',
    },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    deviceType: 'desktop',
    browser: 'Safari',
    os: 'macOS',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    sessionId: 'sess_003',
    success: true,
  },
  {
    id: 'log-005',
    userId: 'user-001',
    userName: 'SI Rajesh Kumar',
    userRole: 'SI',
    userBadge: 'KAR-SI-1234',
    stationId: 'station-001',
    stationName: 'Koramangala PS',
    action: 'CREATE',
    resource: 'FIR',
    resourceId: 'KOR/2024/00095',
    description: 'Created new FIR',
    ipAddress: '103.21.125.77',
    geolocation: {
      ip: '103.21.125.77',
      city: 'Bangalore',
      region: 'Karnataka',
      regionCode: 'KA',
      country: 'India',
      countryCode: 'IN',
      latitude: 12.9716,
      longitude: 77.5946,
      timezone: 'Asia/Kolkata',
      isp: 'Airtel',
      formattedAddress: 'Koramangala, Bangalore, Karnataka, India',
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    deviceType: 'desktop',
    browser: 'Chrome',
    os: 'Windows 10/11',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    sessionId: 'sess_001',
    success: true,
  },
];

export const useAccessLogStore = create<AccessLogState>()(
  persist(
    (set, get) => ({
      logs: DEMO_LOGS,
      currentSessionId: null,
      isLogging: false,

      startSession: () => {
        const sessionId = generateSessionId();
        set({ currentSessionId: sessionId });
        return sessionId;
      },

      endSession: () => {
        set({ currentSessionId: null });
      },

      logAccess: async (params: LogAccessParams) => {
        set({ isLogging: true });

        try {
          // Get IP geolocation if IP provided
          let geolocation: IPGeolocation | null = null;
          if (params.ipAddress) {
            geolocation = await getIPGeolocation(params.ipAddress);
          }

          // Parse user agent
          const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'Server';
          const { deviceType, browser, os } = parseUserAgent(userAgent);

          const log: AccessLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            userId: params.userId,
            userName: params.userName,
            userRole: params.userRole,
            userBadge: params.userBadge,
            stationId: params.stationId,
            stationName: params.stationName,
            action: params.action,
            resource: params.resource,
            resourceId: params.resourceId,
            description: params.description,
            ipAddress: params.ipAddress || 'Unknown',
            geolocation,
            userAgent,
            deviceType,
            browser,
            os,
            timestamp: new Date().toISOString(),
            sessionId: get().currentSessionId || undefined,
            success: params.success ?? true,
            errorMessage: params.errorMessage,
          };

          set((state) => ({
            logs: [log, ...state.logs].slice(0, 10000), // Keep last 10000 logs
            isLogging: false,
          }));
        } catch (error) {
          console.error('Error logging access:', error);
          set({ isLogging: false });
        }
      },

      getLogs: (filters?: LogFilters) => {
        let logs = get().logs;

        if (filters) {
          if (filters.userId) {
            logs = logs.filter((log) => log.userId === filters.userId);
          }
          if (filters.action) {
            logs = logs.filter((log) => log.action === filters.action);
          }
          if (filters.startDate) {
            logs = logs.filter((log) => log.timestamp >= filters.startDate!);
          }
          if (filters.endDate) {
            logs = logs.filter((log) => log.timestamp <= filters.endDate!);
          }
          if (filters.ipAddress) {
            logs = logs.filter((log) => log.ipAddress.includes(filters.ipAddress!));
          }
          if (filters.success !== undefined) {
            logs = logs.filter((log) => log.success === filters.success);
          }
          if (filters.search) {
            const search = filters.search.toLowerCase();
            logs = logs.filter(
              (log) =>
                log.userName.toLowerCase().includes(search) ||
                log.description.toLowerCase().includes(search) ||
                log.ipAddress.includes(search) ||
                log.geolocation?.city?.toLowerCase().includes(search) ||
                log.geolocation?.country?.toLowerCase().includes(search)
            );
          }
        }

        return logs;
      },

      getLogById: (id: string) => {
        return get().logs.find((log) => log.id === id);
      },

      clearLogs: () => {
        set({ logs: [] });
      },

      exportLogs: (filters?: LogFilters) => {
        const logs = get().getLogs(filters);
        const headers = [
          'Timestamp',
          'User',
          'Role',
          'Action',
          'Description',
          'IP Address',
          'Location',
          'Country',
          'Device',
          'Browser',
          'Status',
        ];

        const rows = logs.map((log) => [
          log.timestamp,
          log.userName,
          log.userRole,
          log.action,
          log.description,
          log.ipAddress,
          log.geolocation?.formattedAddress || 'Unknown',
          log.geolocation?.country || 'Unknown',
          log.deviceType,
          log.browser,
          log.success ? 'Success' : 'Failed',
        ]);

        return [headers, ...rows].map((row) => row.join(',')).join('\n');
      },

      getStats: () => {
        const logs = get().logs;
        const today = new Date().toISOString().split('T')[0];

        const stats: AccessLogStats = {
          totalLogs: logs.length,
          todayLogs: logs.filter((log) => log.timestamp.startsWith(today)).length,
          uniqueUsers: new Set(logs.map((log) => log.userId)).size,
          uniqueIPs: new Set(logs.map((log) => log.ipAddress)).size,
          failedLogins: logs.filter((log) => log.action === 'LOGIN_FAILED').length,
          suspiciousActivities: logs.filter(
            (log) =>
              log.geolocation?.proxy ||
              log.geolocation?.vpn ||
              log.geolocation?.tor ||
              (log.action === 'LOGIN_FAILED' && !log.success)
          ).length,
          byAction: {},
          byCountry: {},
          byDevice: {},
        };

        logs.forEach((log) => {
          // Count by action
          stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

          // Count by country
          const country = log.geolocation?.country || 'Unknown';
          stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;

          // Count by device
          stats.byDevice[log.deviceType] = (stats.byDevice[log.deviceType] || 0) + 1;
        });

        return stats;
      },

      getRecentActivity: (userId?: string, limit = 10) => {
        let logs = get().logs;
        if (userId) {
          logs = logs.filter((log) => log.userId === userId);
        }
        return logs.slice(0, limit);
      },

      getSuspiciousActivity: () => {
        return get().logs.filter(
          (log) =>
            log.geolocation?.proxy ||
            log.geolocation?.vpn ||
            log.geolocation?.tor ||
            log.action === 'LOGIN_FAILED' ||
            // Multiple failed attempts from same IP
            (log.geolocation?.countryCode && log.geolocation.countryCode !== 'IN')
        );
      },
    }),
    {
      name: 'npdms-access-logs',
      partialize: (state) => ({
        logs: state.logs.slice(0, 1000), // Persist only last 1000 logs
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);

// Hook for logging with current user context
export function useAccessLogger() {
  const { logAccess, startSession, endSession } = useAccessLogStore();

  const log = async (
    action: AccessAction,
    description: string,
    options?: {
      resource?: string;
      resourceId?: string;
      success?: boolean;
      errorMessage?: string;
    }
  ) => {
    // Get user from auth store
    const authState = JSON.parse(localStorage.getItem('npdms-auth') || '{}');
    const user = authState?.state?.user;

    if (!user) {
      console.warn('No user context for access logging');
      return;
    }

    // Get client IP (in demo mode, we'll use a placeholder)
    const ipAddress = '127.0.0.1'; // In production, this would come from the server

    await logAccess({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userBadge: user.badgeNumber,
      stationId: user.stationId,
      stationName: user.stationName,
      action,
      description,
      ipAddress,
      ...options,
    });
  };

  return { log, startSession, endSession };
}
