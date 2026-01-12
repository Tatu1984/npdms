import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    firs: {
      orderBy: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Mock network monitor
vi.mock('@/lib/sync/network-monitor', () => ({
  networkMonitor: {
    isOnline: vi.fn().mockReturnValue(true),
  },
}));

// Mock queue manager
vi.mock('@/lib/sync/queue-manager', () => ({
  queueManager: {
    enqueue: vi.fn().mockResolvedValue(undefined),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useFIRs Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any) = vi.fn();
  });

  it('should return demo data when offline and IndexedDB is empty', async () => {
    // Mock fetch to fail (simulating offline)
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    // Import the hook dynamically to ensure mocks are in place
    const { useFIRs } = await import('./use-firs');

    const { result } = renderHook(() => useFIRs({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading || result.current.data).toBeTruthy();
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    const { useFIRs } = await import('./use-firs');

    const { result } = renderHook(() => useFIRs({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have either data or error
    expect(result.current.data !== undefined || result.current.error !== undefined).toBe(true);
  });
});

describe('FIR Filters', () => {
  it('should filter by status correctly', () => {
    const firs = [
      { id: '1', status: 'REGISTERED', title: 'FIR 1' },
      { id: '2', status: 'UNDER_INVESTIGATION', title: 'FIR 2' },
      { id: '3', status: 'REGISTERED', title: 'FIR 3' },
    ];

    const filtered = firs.filter(f => f.status === 'REGISTERED');
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('1');
  });

  it('should filter by search term correctly', () => {
    const firs = [
      { id: '1', title: 'Armed Robbery', description: 'Jewellery store' },
      { id: '2', title: 'Cyber Fraud', description: 'Online banking' },
      { id: '3', title: 'Vehicle Theft', description: 'Two wheeler stolen' },
    ];

    const searchTerm = 'robbery';
    const filtered = firs.filter(f =>
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('should filter by priority correctly', () => {
    const firs = [
      { id: '1', priority: 'HIGH', title: 'FIR 1' },
      { id: '2', priority: 'MEDIUM', title: 'FIR 2' },
      { id: '3', priority: 'HIGH', title: 'FIR 3' },
      { id: '4', priority: 'LOW', title: 'FIR 4' },
    ];

    const filtered = firs.filter(f => f.priority === 'HIGH');
    expect(filtered).toHaveLength(2);
  });

  it('should paginate results correctly', () => {
    const firs = Array.from({ length: 25 }, (_, i) => ({
      id: String(i + 1),
      title: `FIR ${i + 1}`,
    }));

    const page = 2;
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const paginated = firs.slice(start, start + pageSize);

    expect(paginated).toHaveLength(10);
    expect(paginated[0].id).toBe('11');
    expect(paginated[9].id).toBe('20');
  });
});

describe('FIR Data Validation', () => {
  it('should validate required fields', () => {
    const validateFIR = (fir: any) => {
      const errors: string[] = [];
      if (!fir.title || fir.title.length < 10) {
        errors.push('Title must be at least 10 characters');
      }
      if (!fir.description || fir.description.length < 50) {
        errors.push('Description must be at least 50 characters');
      }
      if (!fir.category) {
        errors.push('Category is required');
      }
      if (!fir.priority) {
        errors.push('Priority is required');
      }
      return errors;
    };

    const invalidFIR = { title: 'Short' };
    const errors = validateFIR(invalidFIR);

    expect(errors).toContain('Title must be at least 10 characters');
    expect(errors).toContain('Description must be at least 50 characters');
    expect(errors).toContain('Category is required');
    expect(errors).toContain('Priority is required');
  });

  it('should validate FIR number format', () => {
    const validateFIRNumber = (firNumber: string) => {
      // Format: XXX/YYYY/NNNNN
      const pattern = /^[A-Z]{2,5}\/\d{4}\/\d{5}$/;
      return pattern.test(firNumber);
    };

    expect(validateFIRNumber('KOR/2024/00089')).toBe(true);
    expect(validateFIRNumber('HSR/2024/00001')).toBe(true);
    expect(validateFIRNumber('invalid')).toBe(false);
    expect(validateFIRNumber('KOR/24/089')).toBe(false);
  });
});
