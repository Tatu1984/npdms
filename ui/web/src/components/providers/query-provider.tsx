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
      // Don't retry on 4xx errors. ApiClientError carries the HTTP status as
      // `code`; checking only `status` let every 404 and 403 retry three times.
      const status = error?.code ?? error?.status;
      // 429 is the exception: the request was valid but throttled, and a read
      // is safe to repeat. Without this a throttled panel stayed empty until
      // the page was reloaded.
      if (status === 429) {
        return failureCount < 3;
      }
      if (status >= 400 && status < 500) {
        return false;
      }

      // Retry up to 3 times for network errors
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex: number, error: any) => {
      // The API's rate-limit window is a minute; back off in steps across it.
      if ((error?.code ?? error?.status) === 429) {
        return 20000 * (attemptIndex + 1);
      }
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

    // Never retry writes automatically. A create is not idempotent: a request
    // that reached the server but failed on the way back would be sent again
    // and record the FIR, warrant or custody transfer twice. The officer sees
    // the error and decides.
    retry: 0,

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
