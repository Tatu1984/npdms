/**
 * Service Worker Registration
 * Handles PWA installation and background sync setup
 */

import { Workbox } from 'workbox-window';
import { queueManager } from '../sync/queue-manager';

let wb: Workbox | undefined;

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  // Don't register in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[SW] Skipping service worker in development');
    return;
  }

  try {
    wb = new Workbox('/sw.js', { scope: '/' });

    // Service worker activated
    wb.addEventListener('activated', (event) => {
      console.log('[SW] Service worker activated');

      // Start auto-sync when service worker is active
      queueManager.startAutoSync();

      if (event.isUpdate) {
        console.log('[SW] Service worker updated');
        // Optionally show update notification to user
        if (confirm('New version available! Reload to update?')) {
          window.location.reload();
        }
      }
    });

    // Service worker waiting (new version available)
    wb.addEventListener('waiting', () => {
      console.log('[SW] New service worker waiting');
      // Show update available notification
      showUpdateNotification();
    });

    // Service worker controlling the page
    wb.addEventListener('controlling', () => {
      console.log('[SW] Service worker controlling');
      window.location.reload();
    });

    // Message from service worker
    wb.addEventListener('message', (event) => {
      console.log('[SW] Message from service worker:', event.data);

      if (event.data.type === 'CACHE_UPDATED') {
        console.log(`[SW] Cache updated: ${event.data.payload.cacheName}`);
      }

      if (event.data.type === 'BACKGROUND_SYNC_SUCCESS') {
        console.log('[SW] Background sync succeeded:', event.data.payload);
        // Process the queue after background sync
        queueManager.processQueue();
      }

      if (event.data.type === 'BACKGROUND_SYNC_FAILED') {
        console.error('[SW] Background sync failed:', event.data.payload);
      }
    });

    // Register the service worker
    await wb.register();

    console.log('[SW] Service worker registered successfully');

    // Set up background sync if supported
    if ('sync' in wb && 'SyncManager' in window) {
      setupBackgroundSync();
    }
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    console.log('[SW] Service worker unregistered');

    // Stop auto-sync
    queueManager.stopAutoSync();
  } catch (error) {
    console.error('[SW] Service worker unregistration failed:', error);
  }
}

/**
 * Skip waiting and activate new service worker immediately
 */
export function skipWaiting(): void {
  if (wb) {
    wb.addEventListener('controlling', () => {
      window.location.reload();
    });

    wb.messageSkipWaiting();
  }
}

/**
 * Setup background sync
 */
function setupBackgroundSync(): void {
  if (!wb) return;

  // Register a sync event to process the offline queue
  navigator.serviceWorker.ready.then((registration) => {
    if ('sync' in registration) {
      console.log('[SW] Background sync is supported');

      // Listen for online event to trigger sync
      window.addEventListener('online', async () => {
        try {
          await (registration as any).sync.register('sync-offline-queue');
          console.log('[SW] Background sync registered');
        } catch (error) {
          console.error('[SW] Background sync registration failed:', error);
        }
      });
    } else {
      console.log('[SW] Background sync not supported');
      // Fallback to periodic sync
      setInterval(() => {
        if (navigator.onLine) {
          queueManager.processQueue();
        }
      }, 30000); // Every 30 seconds
    }
  });
}

/**
 * Show update notification to user
 */
function showUpdateNotification(): void {
  // Create a custom notification or use browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('NPDMS Update Available', {
      body: 'A new version of NPDMS is available. Click to update.',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'update-notification',
      requireInteraction: true,
    }).onclick = () => {
      skipWaiting();
    };
  } else {
    // Fallback to console or UI notification
    console.log('[SW] Update available - call skipWaiting() to update');
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('[SW] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Check if app can be installed as PWA
 */
export function canInstallPWA(): boolean {
  return 'beforeinstallprompt' in window;
}

/**
 * Show PWA install prompt
 */
let deferredPrompt: any = null;

// Listen for install prompt
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt available');
  });
}

export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[PWA] User ${outcome} the install prompt`);

  deferredPrompt = null;

  return outcome === 'accepted';
}

/**
 * Check if app is running as installed PWA
 */
export function isInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Get service worker registration
 */
export async function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('[SW] Failed to get service worker registration:', error);
    return undefined;
  }
}

/**
 * Send message to service worker
 */
export async function sendMessageToSW(message: any): Promise<void> {
  const registration = await getRegistration();

  if (registration?.active) {
    registration.active.postMessage(message);
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

/**
 * Get cache storage usage
 */
export async function getCacheSize(): Promise<{ usage: number; quota: number }> {
  if (typeof window === 'undefined' || !('storage' in navigator)) {
    return { usage: 0, quota: 0 };
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  } catch (error) {
    console.error('[SW] Failed to get cache size:', error);
    return { usage: 0, quota: 0 };
  }
}
