/**
 * Service Worker Registration Component
 * Registers the PWA service worker and starts auto-sync
 */

'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/sw/register';
import { queueManager } from '@/lib/sync/queue-manager';

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker().then(() => {
      console.log('[App] Service worker registered');

      // Start auto-sync
      queueManager.startAutoSync();
      console.log('[App] Auto-sync started');
    }).catch((error) => {
      console.error('[App] Service worker registration failed:', error);
    });

    // Cleanup on unmount
    return () => {
      queueManager.stopAutoSync();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
