import { db, OfflineQueueItem, MutationType, SyncStatus } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// OFFLINE QUEUE MANAGER
// ============================================================================

export interface MutationPayload {
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
}

export interface QueueOptions {
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  onSuccess?: (item: OfflineQueueItem) => void;
  onError?: (item: OfflineQueueItem, error: Error) => void;
}

class OfflineQueueManager {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 5000;
  private readonly PROCESS_INTERVAL = 10000; // Check every 10 seconds

  /**
   * Add a mutation to the offline queue
   */
  async addToQueue(
    mutationType: MutationType,
    resourceType: string,
    resourceId: string,
    payload: MutationPayload,
    options: QueueOptions = {}
  ): Promise<string> {
    const item: OfflineQueueItem = {
      id: uuidv4(),
      mutationType,
      resourceType,
      resourceId,
      payload,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: options.maxRetries || this.DEFAULT_MAX_RETRIES,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    await db.offlineQueue.add(item);
    console.log(`[Queue] Added ${mutationType} ${resourceType} (${resourceId}) to queue`);

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue(options);
    }

    return item.id;
  }

  /**
   * Process all pending items in the queue
   */
  async processQueue(options: QueueOptions = {}): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('[Queue] Already processing, skipping...');
      return;
    }

    // Check if online
    if (!navigator.onLine) {
      console.log('[Queue] Offline, skipping queue processing');
      return;
    }

    this.isProcessing = true;

    try {
      // Get all pending items, ordered by timestamp (FIFO)
      const pendingItems = await db.offlineQueue
        .where('status')
        .equals('PENDING')
        .sortBy('timestamp');

      if (pendingItems.length === 0) {
        console.log('[Queue] No pending items to process');
        return;
      }

      console.log(`[Queue] Processing ${pendingItems.length} pending items...`);

      // Process items sequentially to maintain order
      for (const item of pendingItems) {
        await this.processItem(item, options);
      }

      console.log('[Queue] Finished processing queue');
    } catch (error) {
      console.error('[Queue] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single queue item
   */
  private async processItem(
    item: OfflineQueueItem,
    options: QueueOptions
  ): Promise<void> {
    try {
      // Update status to IN_PROGRESS
      await db.offlineQueue.update(item.id, { status: 'IN_PROGRESS' });

      const payload = item.payload as MutationPayload;

      // Execute the mutation
      const response = await fetch(payload.endpoint, {
        method: payload.method,
        headers: {
          'Content-Type': 'application/json',
          ...payload.headers,
        },
        body: payload.data ? JSON.stringify(payload.data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Success - remove from queue
      await db.offlineQueue.delete(item.id);

      // Update the local resource with server data
      await this.updateLocalResource(item, responseData);

      console.log(
        `[Queue] ✓ Successfully synced ${item.mutationType} ${item.resourceType} (${item.resourceId})`
      );

      options.onSuccess?.(item);
    } catch (error) {
      console.error(
        `[Queue] ✗ Failed to sync ${item.mutationType} ${item.resourceType} (${item.resourceId}):`,
        error
      );

      // Increment retry count
      const newRetries = item.retries + 1;

      if (newRetries >= item.maxRetries) {
        // Max retries exceeded - mark as FAILED
        await db.offlineQueue.update(item.id, {
          status: 'FAILED',
          retries: newRetries,
          error: error instanceof Error ? error.message : String(error),
        });

        console.error(
          `[Queue] ✗ Max retries (${item.maxRetries}) exceeded for ${item.resourceType} (${item.resourceId})`
        );

        options.onError?.(item, error instanceof Error ? error : new Error(String(error)));
      } else {
        // Retry later
        await db.offlineQueue.update(item.id, {
          status: 'PENDING',
          retries: newRetries,
          error: error instanceof Error ? error.message : String(error),
        });

        console.log(
          `[Queue] Retry ${newRetries}/${item.maxRetries} for ${item.resourceType} (${item.resourceId})`
        );
      }
    }
  }

  /**
   * Update local IndexedDB resource with server response
   */
  private async updateLocalResource(
    item: OfflineQueueItem,
    serverData: any
  ): Promise<void> {
    const { resourceType, resourceId, mutationType } = item;

    try {
      switch (resourceType) {
        case 'fir':
          if (mutationType === 'DELETE') {
            await db.firs.delete(resourceId);
          } else {
            await db.firs.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'case':
          if (mutationType === 'DELETE') {
            await db.cases.delete(resourceId);
          } else {
            await db.cases.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'evidence':
          if (mutationType === 'DELETE') {
            await db.evidence.delete(resourceId);
          } else {
            await db.evidence.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'warrant':
          if (mutationType === 'DELETE') {
            await db.warrants.delete(resourceId);
          } else {
            await db.warrants.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'bail':
          if (mutationType === 'DELETE') {
            await db.bail.delete(resourceId);
          } else {
            await db.bail.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'forensic':
          if (mutationType === 'DELETE') {
            await db.forensics.delete(resourceId);
          } else {
            await db.forensics.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'personnel':
          if (mutationType === 'DELETE') {
            await db.personnel.delete(resourceId);
          } else {
            await db.personnel.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'vehicle':
          if (mutationType === 'DELETE') {
            await db.vehicles.delete(resourceId);
          } else {
            await db.vehicles.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'court_hearing':
          if (mutationType === 'DELETE') {
            await db.courtHearings.delete(resourceId);
          } else {
            await db.courtHearings.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'court_order':
          if (mutationType === 'DELETE') {
            await db.courtOrders.delete(resourceId);
          } else {
            await db.courtOrders.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'alert':
          if (mutationType === 'DELETE') {
            await db.alerts.delete(resourceId);
          } else {
            await db.alerts.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'accused':
          if (mutationType === 'DELETE') {
            await db.accused.delete(resourceId);
          } else {
            await db.accused.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        case 'witness':
          if (mutationType === 'DELETE') {
            await db.witnesses.delete(resourceId);
          } else {
            await db.witnesses.put({
              ...serverData,
              _pending: false,
              _localOnly: false,
            });
          }
          break;

        default:
          console.warn(`[Queue] Unknown resource type: ${resourceType}`);
      }
    } catch (error) {
      console.error(`[Queue] Failed to update local resource:`, error);
    }
  }

  /**
   * Start automatic queue processing
   */
  startAutoSync(): void {
    if (this.processingInterval) {
      console.log('[Queue] Auto-sync already running');
      return;
    }

    console.log('[Queue] Starting auto-sync...');

    // Process immediately
    this.processQueue();

    // Process periodically
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.PROCESS_INTERVAL);

    // Process when online event fires
    window.addEventListener('online', this.handleOnline);
  }

  /**
   * Stop automatic queue processing
   */
  stopAutoSync(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('[Queue] Auto-sync stopped');
    }

    window.removeEventListener('online', this.handleOnline);
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('[Queue] Network online - processing queue');
    this.processQueue();
  };

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    byResourceType: Record<string, number>;
  }> {
    const allItems = await db.offlineQueue.toArray();

    const stats = {
      total: allItems.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      byResourceType: {} as Record<string, number>,
    };

    allItems.forEach((item) => {
      // Count by status
      switch (item.status) {
        case 'PENDING':
          stats.pending++;
          break;
        case 'IN_PROGRESS':
          stats.inProgress++;
          break;
        case 'COMPLETED':
          stats.completed++;
          break;
        case 'FAILED':
          stats.failed++;
          break;
      }

      // Count by resource type
      stats.byResourceType[item.resourceType] =
        (stats.byResourceType[item.resourceType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear all completed items from queue
   */
  async clearCompleted(): Promise<number> {
    const completed = await db.offlineQueue.where('status').equals('COMPLETED').toArray();
    const count = completed.length;

    await db.offlineQueue.where('status').equals('COMPLETED').delete();

    console.log(`[Queue] Cleared ${count} completed items`);
    return count;
  }

  /**
   * Clear all failed items from queue
   */
  async clearFailed(): Promise<number> {
    const failed = await db.offlineQueue.where('status').equals('FAILED').toArray();
    const count = failed.length;

    await db.offlineQueue.where('status').equals('FAILED').delete();

    console.log(`[Queue] Cleared ${count} failed items`);
    return count;
  }

  /**
   * Retry all failed items
   */
  async retryFailed(): Promise<void> {
    const failed = await db.offlineQueue.where('status').equals('FAILED').toArray();

    console.log(`[Queue] Retrying ${failed.length} failed items...`);

    for (const item of failed) {
      await db.offlineQueue.update(item.id, {
        status: 'PENDING',
        retries: 0,
        error: undefined,
      });
    }

    // Process the queue
    await this.processQueue();
  }

  /**
   * Delete a specific item from the queue
   */
  async deleteItem(itemId: string): Promise<void> {
    await db.offlineQueue.delete(itemId);
    console.log(`[Queue] Deleted item ${itemId}`);
  }

  /**
   * Get all queue items
   */
  async getAllItems(): Promise<OfflineQueueItem[]> {
    return await db.offlineQueue.toArray();
  }

  /**
   * Get pending queue items
   */
  async getPendingItems(): Promise<OfflineQueueItem[]> {
    return await db.offlineQueue.where('status').equals('PENDING').sortBy('timestamp');
  }

  /**
   * Get failed queue items
   */
  async getFailedItems(): Promise<OfflineQueueItem[]> {
    return await db.offlineQueue.where('status').equals('FAILED').sortBy('timestamp');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const queueManager = new OfflineQueueManager();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Add a CREATE mutation to the queue
 */
export async function queueCreate(
  resourceType: string,
  resourceId: string,
  data: any,
  endpoint: string,
  options?: QueueOptions
): Promise<string> {
  return await queueManager.addToQueue(
    'CREATE',
    resourceType,
    resourceId,
    {
      endpoint,
      method: 'POST',
      data,
    },
    options
  );
}

/**
 * Add an UPDATE mutation to the queue
 */
export async function queueUpdate(
  resourceType: string,
  resourceId: string,
  data: any,
  endpoint: string,
  options?: QueueOptions
): Promise<string> {
  return await queueManager.addToQueue(
    'UPDATE',
    resourceType,
    resourceId,
    {
      endpoint,
      method: 'PUT',
      data,
    },
    options
  );
}

/**
 * Add a PATCH mutation to the queue
 */
export async function queuePatch(
  resourceType: string,
  resourceId: string,
  data: any,
  endpoint: string,
  options?: QueueOptions
): Promise<string> {
  return await queueManager.addToQueue(
    'UPDATE',
    resourceType,
    resourceId,
    {
      endpoint,
      method: 'PATCH',
      data,
    },
    options
  );
}

/**
 * Add a DELETE mutation to the queue
 */
export async function queueDelete(
  resourceType: string,
  resourceId: string,
  endpoint: string,
  options?: QueueOptions
): Promise<string> {
  return await queueManager.addToQueue(
    'DELETE',
    resourceType,
    resourceId,
    {
      endpoint,
      method: 'DELETE',
    },
    options
  );
}
