/**
 * Sync Status Component
 * Displays network status and pending sync operations
 */

'use client';

import { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/lib/sync/network-monitor';
import { queueManager } from '@/lib/sync/queue-manager';
import { WifiOff, Wifi, Cloud, CloudOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export function SyncStatus() {
  const networkInfo = useNetworkStatus();
  const [queueStats, setQueueStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    failed: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Update queue stats periodically
  useEffect(() => {
    const updateStats = async () => {
      const stats = await queueManager.getStats();
      setQueueStats({
        total: stats.total,
        pending: stats.pending,
        inProgress: stats.inProgress,
        failed: stats.failed,
      });
      setIsProcessing(stats.inProgress > 0);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Retry failed items
  const handleRetry = async () => {
    await queueManager.retryFailed();
  };

  // Clear failed items
  const handleClearFailed = async () => {
    await queueManager.clearFailed();
  };

  // Get status color
  const getStatusColor = () => {
    if (networkInfo.status === 'offline') return 'text-red-500 bg-red-50';
    if (queueStats.failed > 0) return 'text-orange-500 bg-orange-50';
    if (queueStats.pending > 0 || isProcessing) return 'text-blue-500 bg-blue-50';
    if (networkInfo.status === 'slow') return 'text-yellow-500 bg-yellow-50';
    return 'text-green-500 bg-green-50';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (networkInfo.status === 'offline') {
      return <WifiOff className="h-4 w-4" />;
    }
    if (queueStats.failed > 0) {
      return <AlertCircle className="h-4 w-4" />;
    }
    if (isProcessing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (queueStats.pending > 0) {
      return <CloudOff className="h-4 w-4" />;
    }
    if (networkInfo.status === 'slow') {
      return <Wifi className="h-4 w-4" />;
    }
    return <CheckCircle2 className="h-4 w-4" />;
  };

  // Get status text
  const getStatusText = () => {
    if (networkInfo.status === 'offline') {
      return `Offline${queueStats.pending > 0 ? ` (${queueStats.pending} pending)` : ''}`;
    }
    if (queueStats.failed > 0) {
      return `${queueStats.failed} sync failed`;
    }
    if (isProcessing) {
      return 'Syncing...';
    }
    if (queueStats.pending > 0) {
      return `${queueStats.pending} pending`;
    }
    if (networkInfo.status === 'slow') {
      return 'Slow connection';
    }
    return 'All synced';
  };

  // Don't show if everything is synced and online
  const shouldShow =
    networkInfo.status !== 'online' ||
    queueStats.pending > 0 ||
    queueStats.failed > 0 ||
    isProcessing;

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg border ${getStatusColor()} transition-all`}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>

        {/* Show retry button for failed items */}
        {queueStats.failed > 0 && (
          <div className="flex gap-2 ml-2 pl-2 border-l border-current/20">
            <button
              onClick={handleRetry}
              className="text-xs px-2 py-1 rounded bg-current/10 hover:bg-current/20 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleClearFailed}
              className="text-xs px-2 py-1 rounded bg-current/10 hover:bg-current/20 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Detailed stats tooltip */}
      {queueStats.total > 0 && (
        <div className="mt-2 text-xs text-gray-600 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div className="font-semibold mb-2">Sync Queue</div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span>Pending:</span>
              <span className="font-mono">{queueStats.pending}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>In Progress:</span>
              <span className="font-mono">{queueStats.inProgress}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Failed:</span>
              <span className="font-mono text-red-600">{queueStats.failed}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-gray-200">
              <span className="font-semibold">Total:</span>
              <span className="font-mono font-semibold">{queueStats.total}</span>
            </div>
          </div>

          {/* Network info */}
          {networkInfo.effectiveType && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="font-semibold mb-1">Network</div>
              <div className="space-y-1">
                <div className="flex justify-between gap-4">
                  <span>Type:</span>
                  <span className="font-mono">{networkInfo.effectiveType}</span>
                </div>
                {networkInfo.downlink && (
                  <div className="flex justify-between gap-4">
                    <span>Speed:</span>
                    <span className="font-mono">{networkInfo.downlink.toFixed(1)} Mbps</span>
                  </div>
                )}
                {networkInfo.rtt && (
                  <div className="flex justify-between gap-4">
                    <span>Latency:</span>
                    <span className="font-mono">{networkInfo.rtt} ms</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Offline Banner Component
 * Shows a prominent banner when offline
 */
export function OfflineBanner() {
  const networkInfo = useNetworkStatus();

  if (networkInfo.status !== 'offline') return null;

  return (
    <div className="bg-red-500 text-white px-4 py-2 text-center">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          You are currently offline. Changes will be synced when connection is restored.
        </span>
      </div>
    </div>
  );
}

/**
 * Pending Indicator Badge
 * Shows a badge for items with pending changes
 */
export function PendingBadge({ isPending }: { isPending?: boolean }) {
  if (!isPending) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      <CloudOff className="h-3 w-3" />
      Pending sync
    </span>
  );
}
