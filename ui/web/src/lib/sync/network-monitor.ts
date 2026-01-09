/**
 * Network Status Monitor
 * Tracks online/offline status and provides utilities for network-aware operations
 */

import { networkLogger as log } from '../logger';

export type NetworkStatus = 'online' | 'offline' | 'slow';

export interface NetworkInfo {
  status: NetworkStatus;
  effectiveType?: string;
  downlink?: number; // Mbps
  rtt?: number; // ms
  saveData?: boolean;
}

type NetworkStatusCallback = (info: NetworkInfo) => void;

class NetworkMonitor {
  private listeners: Set<NetworkStatusCallback> = new Set();
  private currentStatus: NetworkStatus = 'online';
  private networkInfo: NetworkInfo = { status: 'online' };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialize network monitoring
   */
  private initialize(): void {
    // Set initial status
    this.updateStatus();

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Listen for connection changes (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', this.handleConnectionChange);
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    log.debug(' Online');
    this.updateStatus();
    this.notifyListeners();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    log.debug(' Offline');
    this.updateStatus();
    this.notifyListeners();
  };

  /**
   * Handle connection change
   */
  private handleConnectionChange = (): void => {
    log.debug(' Connection changed');
    this.updateStatus();
    this.notifyListeners();
  };

  /**
   * Update network status
   */
  private updateStatus(): void {
    if (!navigator.onLine) {
      this.currentStatus = 'offline';
      this.networkInfo = { status: 'offline' };
      return;
    }

    // Get connection info if available
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      const downlink = connection.downlink;
      const rtt = connection.rtt;
      const saveData = connection.saveData;

      // Determine if connection is slow
      const isSlow =
        effectiveType === 'slow-2g' ||
        effectiveType === '2g' ||
        (rtt && rtt > 500) ||
        (downlink && downlink < 0.5);

      this.currentStatus = isSlow ? 'slow' : 'online';
      this.networkInfo = {
        status: this.currentStatus,
        effectiveType,
        downlink,
        rtt,
        saveData,
      };
    } else {
      this.currentStatus = 'online';
      this.networkInfo = { status: 'online' };
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.networkInfo);
      } catch (error) {
        log.error(' Error in listener:', error);
      }
    });
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  /**
   * Get detailed network info
   */
  getInfo(): NetworkInfo {
    return { ...this.networkInfo };
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.currentStatus !== 'offline';
  }

  /**
   * Check if offline
   */
  isOffline(): boolean {
    return this.currentStatus === 'offline';
  }

  /**
   * Check if connection is slow
   */
  isSlow(): boolean {
    return this.currentStatus === 'slow';
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: NetworkStatusCallback): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Wait for online status
   */
  async waitForOnline(timeout?: number): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const unsubscribe = this.subscribe((info) => {
        if (info.status !== 'offline') {
          if (timeoutId) clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          resolve(false);
        }, timeout);
      }
    });
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.removeEventListener('change', this.handleConnectionChange);
    }

    this.listeners.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const networkMonitor = new NetworkMonitor();

// ============================================================================
// REACT HOOK
// ============================================================================

import { useEffect, useState } from 'react';

/**
 * React hook for network status
 */
export function useNetworkStatus(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(
    networkMonitor.getInfo()
  );

  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe((info) => {
      setNetworkInfo(info);
    });

    return unsubscribe;
  }, []);

  return networkInfo;
}

/**
 * React hook for simple online/offline status
 */
export function useOnlineStatus(): boolean {
  const networkInfo = useNetworkStatus();
  return networkInfo.status !== 'offline';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Perform an action only when online
 */
export async function whenOnline<T>(
  action: () => Promise<T>,
  options: { timeout?: number; fallback?: T } = {}
): Promise<T> {
  const isOnline = await networkMonitor.waitForOnline(options.timeout);

  if (!isOnline) {
    if (options.fallback !== undefined) {
      return options.fallback;
    }
    throw new Error('Network timeout: Could not establish online connection');
  }

  return await action();
}

/**
 * Retry an action with exponential backoff
 */
export async function retryWithBackoff<T>(
  action: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        onRetry?.(attempt + 1, lastError);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Increase delay with exponential backoff
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Execute action with network-aware timeout
 */
export async function withNetworkTimeout<T>(
  action: () => Promise<T>,
  timeoutMs?: number
): Promise<T> {
  // Use longer timeout for slow connections
  const networkInfo = networkMonitor.getInfo();
  const defaultTimeout = networkInfo.status === 'slow' ? 30000 : 10000;
  const timeout = timeoutMs || defaultTimeout;

  return Promise.race([
    action(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    ),
  ]);
}
