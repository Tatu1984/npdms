/**
 * React Query Provider
 * Configures QueryClient with offline-first settings
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode, lazy, Suspense } from 'react';

// Lazy load devtools to avoid bundling in production
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then((mod) => ({
          default: mod.ReactQueryDevtools,
        }))
      )
    : null;

// Default options for React Query
const defaultOptions = {
  queries: {
    // Stale time: how long data is considered fresh
    staleTime: 30000, // 30 seconds

    // GC time: how long unused data stays in cache
    gcTime: 300000, // 5 minutes (formerly cacheTime)

    // Retry logic
    retry: (failureCount: number, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }

      // Retry up to 3 times for network errors
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex: number) => {
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },

    // Refetch settings
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,

    // Network mode: offlineFirst
    // This allows queries to run even when offline, using cached data
    networkMode: 'offlineFirst' as const,
  },
  mutations: {
    // Network mode for mutations
    networkMode: 'offlineFirst' as const,

    // Retry mutations on failure
    retry: 1,

    // Retry delay
    retryDelay: 1000,

    // On error, log to console
    onError: (error: any) => {
      console.error('[Mutation Error]:', error);
    },
  },
};

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient instance (only once per app)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions,
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show devtools in development */}
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}

/**
 * Export query client for use outside of React components
 */
export { QueryClient };
