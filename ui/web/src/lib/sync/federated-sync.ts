/**
 * Federated Edge Sync System
 * Handles hierarchical sync: Station (Edge) -> District -> State -> National
 * Supports delta sync, conflict resolution, and priority-based sync
 */

import { db } from '../db/schema';
import { networkMonitor } from './network-monitor';
import { v4 as uuidv4 } from 'uuid';
import { syncLogger as log } from '../logger';

// ============================================================================
// TYPES
// ============================================================================

export type SyncLevel = 'STATION' | 'DISTRICT' | 'STATE' | 'NATIONAL';
export type SyncDirection = 'PUSH' | 'PULL' | 'BIDIRECTIONAL';
export type ConflictResolution = 'SERVER_WINS' | 'CLIENT_WINS' | 'LATEST_WINS' | 'MANUAL';

export interface SyncConfig {
  level: SyncLevel;
  stationId: string;
  districtId: string;
  stateId: string;
  apiBaseUrl: string;
  syncInterval: number; // ms
  batchSize: number;
  conflictResolution: ConflictResolution;
  priorityResources: string[];
}

export interface SyncDelta {
  id: string;
  resourceType: string;
  resourceId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  version: number;
  timestamp: number;
  stationId: string;
  checksum: string;
}

export interface SyncCheckpoint {
  id: string;
  resourceType: string;
  lastSyncTime: number;
  lastVersion: number;
  direction: SyncDirection;
  level: SyncLevel;
}

export interface ConflictRecord {
  id: string;
  resourceType: string;
  resourceId: string;
  localData: any;
  serverData: any;
  localVersion: number;
  serverVersion: number;
  detectedAt: number;
  resolvedAt?: number;
  resolution?: string;
}

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
  duration: number;
  checkpoint: SyncCheckpoint;
}

// ============================================================================
// FEDERATED SYNC MANAGER
// ============================================================================

class FederatedSyncManager {
  private config: SyncConfig | null = null;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(result: SyncResult) => void> = new Set();

  /**
   * Initialize the sync manager with configuration
   */
  initialize(config: SyncConfig): void {
    this.config = config;
    log.debug(` Initialized for station ${config.stationId} at ${config.level} level`);
  }

  /**
   * Get the API endpoint for a given sync level
   */
  private getEndpoint(level: SyncLevel): string {
    if (!this.config) throw new Error('Sync not initialized');

    switch (level) {
      case 'STATION':
        return `${this.config.apiBaseUrl}/sync/station/${this.config.stationId}`;
      case 'DISTRICT':
        return `${this.config.apiBaseUrl}/sync/district/${this.config.districtId}`;
      case 'STATE':
        return `${this.config.apiBaseUrl}/sync/state/${this.config.stateId}`;
      case 'NATIONAL':
        return `${this.config.apiBaseUrl}/sync/national`;
      default:
        throw new Error(`Unknown sync level: ${level}`);
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get local changes since last sync (delta)
   */
  async getLocalDeltas(resourceType: string, checkpoint: SyncCheckpoint): Promise<SyncDelta[]> {
    if (!this.config) throw new Error('Sync not initialized');

    const deltas: SyncDelta[] = [];
    const table = this.getTable(resourceType);
    if (!table) return deltas;

    // Get items modified after last sync
    const items = await table
      .filter((item: any) => {
        const itemTime = new Date(item.updatedAt || item.createdAt).getTime();
        return itemTime > checkpoint.lastSyncTime || item._pending === true;
      })
      .toArray();

    for (const item of items) {
      deltas.push({
        id: uuidv4(),
        resourceType,
        resourceId: item.id,
        operation: item._deleted ? 'DELETE' : (item._localOnly ? 'CREATE' : 'UPDATE'),
        data: item,
        version: item._version || 1,
        timestamp: new Date(item.updatedAt || item.createdAt).getTime(),
        stationId: this.config.stationId,
        checksum: this.calculateChecksum(item),
      });
    }

    return deltas;
  }

  /**
   * Get the Dexie table for a resource type
   */
  private getTable(resourceType: string) {
    const tables: Record<string, any> = {
      fir: db.firs,
      case: db.cases,
      evidence: db.evidence,
      warrant: db.warrants,
      bail: db.bail,
      forensic: db.forensics,
      personnel: db.personnel,
      vehicle: db.vehicles,
      court_hearing: db.courtHearings,
      court_order: db.courtOrders,
      alert: db.alerts,
      accused: db.accused,
      witness: db.witnesses,
    };
    return tables[resourceType];
  }

  /**
   * Push local changes to server
   */
  async pushDeltas(resourceType: string, deltas: SyncDelta[]): Promise<{ pushed: number; conflicts: ConflictRecord[] }> {
    if (!this.config) throw new Error('Sync not initialized');

    const endpoint = `${this.getEndpoint(this.config.level)}/push`;
    const conflicts: ConflictRecord[] = [];
    let pushed = 0;

    // Send in batches
    for (let i = 0; i < deltas.length; i += this.config.batchSize) {
      const batch = deltas.slice(i, i + this.config.batchSize);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceType,
            deltas: batch,
            stationId: this.config.stationId,
            conflictResolution: this.config.conflictResolution,
          }),
        });

        if (!response.ok) {
          throw new Error(`Push failed: ${response.statusText}`);
        }

        const result = await response.json();
        pushed += result.accepted || batch.length;

        // Handle conflicts
        if (result.conflicts) {
          conflicts.push(...result.conflicts);
        }

        // Mark local items as synced
        for (const delta of batch) {
          const table = this.getTable(resourceType);
          if (table && !result.conflicts?.find((c: ConflictRecord) => c.resourceId === delta.resourceId)) {
            await table.update(delta.resourceId, {
              _pending: false,
              _localOnly: false,
              _syncedAt: Date.now(),
            });
          }
        }
      } catch (error) {
        log.error(` Push batch failed:`, error);
      }
    }

    return { pushed, conflicts };
  }

  /**
   * Pull server changes
   */
  async pullDeltas(resourceType: string, checkpoint: SyncCheckpoint): Promise<{ pulled: number; conflicts: ConflictRecord[] }> {
    if (!this.config) throw new Error('Sync not initialized');

    const endpoint = `${this.getEndpoint(this.config.level)}/pull`;
    const conflicts: ConflictRecord[] = [];
    let pulled = 0;

    try {
      const response = await fetch(`${endpoint}?resourceType=${resourceType}&since=${checkpoint.lastSyncTime}&version=${checkpoint.lastVersion}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Pull failed: ${response.statusText}`);
      }

      const result = await response.json();
      const deltas: SyncDelta[] = result.deltas || [];

      for (const delta of deltas) {
        const table = this.getTable(resourceType);
        if (!table) continue;

        // Check for conflicts
        const localItem = await table.get(delta.resourceId);
        if (localItem && localItem._pending) {
          // Conflict detected
          const conflict = await this.handleConflict(resourceType, delta.resourceId, localItem, delta.data);
          if (conflict) {
            conflicts.push(conflict);
            continue;
          }
        }

        // Apply server change
        if (delta.operation === 'DELETE') {
          await table.delete(delta.resourceId);
        } else {
          await table.put({
            ...delta.data,
            _pending: false,
            _localOnly: false,
            _syncedAt: Date.now(),
            _version: delta.version,
          });
        }
        pulled++;
      }
    } catch (error) {
      log.error(` Pull failed:`, error);
    }

    return { pulled, conflicts };
  }

  /**
   * Handle conflict between local and server versions
   */
  private async handleConflict(
    resourceType: string,
    resourceId: string,
    localData: any,
    serverData: any
  ): Promise<ConflictRecord | null> {
    if (!this.config) return null;

    const conflict: ConflictRecord = {
      id: uuidv4(),
      resourceType,
      resourceId,
      localData,
      serverData,
      localVersion: localData._version || 1,
      serverVersion: serverData._version || 1,
      detectedAt: Date.now(),
    };

    // Auto-resolve based on strategy
    switch (this.config.conflictResolution) {
      case 'SERVER_WINS':
        const serverTable = this.getTable(resourceType);
        if (serverTable) {
          await serverTable.put({
            ...serverData,
            _pending: false,
            _localOnly: false,
            _syncedAt: Date.now(),
          });
        }
        conflict.resolution = 'server';
        conflict.resolvedAt = Date.now();
        return null; // No conflict to report

      case 'CLIENT_WINS':
        // Keep local, will be pushed on next sync
        conflict.resolution = 'client';
        conflict.resolvedAt = Date.now();
        return null;

      case 'LATEST_WINS':
        const localTime = new Date(localData.updatedAt || localData.createdAt).getTime();
        const serverTime = new Date(serverData.updatedAt || serverData.createdAt).getTime();
        if (serverTime > localTime) {
          const latestTable = this.getTable(resourceType);
          if (latestTable) {
            await latestTable.put({
              ...serverData,
              _pending: false,
              _syncedAt: Date.now(),
            });
          }
          conflict.resolution = 'server (latest)';
        } else {
          conflict.resolution = 'client (latest)';
        }
        conflict.resolvedAt = Date.now();
        return null;

      case 'MANUAL':
      default:
        // Store conflict for manual resolution
        await db.syncConflicts.add(conflict);
        return conflict;
    }
  }

  /**
   * Perform full sync for a resource type
   */
  async syncResource(resourceType: string): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let pushed = 0;
    let pulled = 0;
    let conflicts = 0;

    try {
      // Get or create checkpoint
      let checkpoint = await db.syncCheckpoints.get({
        resourceType,
        level: this.config?.level || 'STATION',
      });

      if (!checkpoint) {
        checkpoint = {
          id: uuidv4(),
          resourceType,
          lastSyncTime: 0,
          lastVersion: 0,
          direction: 'BIDIRECTIONAL',
          level: this.config?.level || 'STATION',
        };
        await db.syncCheckpoints.add(checkpoint);
      }

      // Push local changes first
      const localDeltas = await this.getLocalDeltas(resourceType, checkpoint);
      if (localDeltas.length > 0) {
        const pushResult = await this.pushDeltas(resourceType, localDeltas);
        pushed = pushResult.pushed;
        conflicts += pushResult.conflicts.length;
      }

      // Then pull server changes
      const pullResult = await this.pullDeltas(resourceType, checkpoint);
      pulled = pullResult.pulled;
      conflicts += pullResult.conflicts.length;

      // Update checkpoint
      checkpoint.lastSyncTime = Date.now();
      checkpoint.lastVersion++;
      await db.syncCheckpoints.put(checkpoint);

      return {
        success: true,
        pushed,
        pulled,
        conflicts,
        errors,
        duration: Date.now() - startTime,
        checkpoint,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);
      log.error(` Sync failed for ${resourceType}:`, error);

      return {
        success: false,
        pushed,
        pulled,
        conflicts,
        errors,
        duration: Date.now() - startTime,
        checkpoint: {
          id: '',
          resourceType,
          lastSyncTime: 0,
          lastVersion: 0,
          direction: 'BIDIRECTIONAL',
          level: this.config?.level || 'STATION',
        },
      };
    }
  }

  /**
   * Perform full sync for all resource types
   */
  async syncAll(): Promise<Map<string, SyncResult>> {
    if (!this.config) throw new Error('Sync not initialized');
    if (this.isSyncing) {
      log.debug(' Sync already in progress');
      return new Map();
    }
    if (!networkMonitor.isOnline()) {
      log.debug(' Offline, skipping sync');
      return new Map();
    }

    this.isSyncing = true;
    const results = new Map<string, SyncResult>();

    const resourceTypes = [
      ...this.config.priorityResources, // Priority resources first
      'fir', 'case', 'evidence', 'warrant', 'bail', 'forensic',
      'personnel', 'vehicle', 'court_hearing', 'court_order', 'alert', 'accused', 'witness',
    ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    log.debug(` Starting sync for ${resourceTypes.length} resource types...`);

    for (const resourceType of resourceTypes) {
      try {
        const result = await this.syncResource(resourceType);
        results.set(resourceType, result);

        // Notify listeners
        this.listeners.forEach(listener => listener(result));

        console.log(
          `[FederatedSync] ${resourceType}: pushed=${result.pushed}, pulled=${result.pulled}, conflicts=${result.conflicts}`
        );
      } catch (error) {
        log.error(` Failed to sync ${resourceType}:`, error);
      }
    }

    this.isSyncing = false;
    log.debug(' Sync complete');

    return results;
  }

  /**
   * Start automatic sync
   */
  startAutoSync(): void {
    if (!this.config) {
      console.error('[FederatedSync] Cannot start auto-sync: not initialized');
      return;
    }

    if (this.syncInterval) {
      log.debug(' Auto-sync already running');
      return;
    }

    log.debug(` Starting auto-sync every ${this.config.syncInterval / 1000}s`);

    // Sync immediately
    this.syncAll();

    // Sync periodically
    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, this.config.syncInterval);

    // Sync when coming online
    networkMonitor.subscribe((info) => {
      if (info.status !== 'offline') {
        log.debug(' Online - triggering sync');
        this.syncAll();
      }
    });
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      log.debug(' Auto-sync stopped');
    }
  }

  /**
   * Subscribe to sync results
   */
  subscribe(callback: (result: SyncResult) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Get pending conflicts for manual resolution
   */
  async getPendingConflicts(): Promise<ConflictRecord[]> {
    return await db.syncConflicts
      .filter(c => !c.resolvedAt)
      .toArray();
  }

  /**
   * Resolve a conflict manually
   */
  async resolveConflict(conflictId: string, useServer: boolean): Promise<void> {
    const conflict = await db.syncConflicts.get(conflictId);
    if (!conflict) throw new Error('Conflict not found');

    const table = this.getTable(conflict.resourceType);
    if (!table) throw new Error('Unknown resource type');

    const data = useServer ? conflict.serverData : conflict.localData;
    await table.put({
      ...data,
      _pending: !useServer, // If using local, mark as pending for next sync
      _syncedAt: useServer ? Date.now() : undefined,
    });

    await db.syncConflicts.update(conflictId, {
      resolvedAt: Date.now(),
      resolution: useServer ? 'server (manual)' : 'client (manual)',
    });
  }

  /**
   * Get sync statistics
   */
  async getStats(): Promise<{
    pendingSync: number;
    conflicts: number;
    lastSyncTime: number;
    checkpoints: SyncCheckpoint[];
  }> {
    const pendingItems = await db.offlineQueue
      .where('status')
      .equals('PENDING')
      .count();

    const conflicts = await db.syncConflicts
      .filter(c => !c.resolvedAt)
      .count();

    const checkpoints = await db.syncCheckpoints.toArray();
    const lastSyncTime = Math.max(0, ...checkpoints.map(c => c.lastSyncTime));

    return {
      pendingSync: pendingItems,
      conflicts,
      lastSyncTime,
      checkpoints,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const federatedSync = new FederatedSyncManager();

// ============================================================================
// REACT HOOK
// ============================================================================

import { useEffect, useState, useCallback } from 'react';

export interface FederatedSyncState {
  isSyncing: boolean;
  lastResult: SyncResult | null;
  pendingConflicts: number;
  pendingSync: number;
}

export function useFederatedSync(): FederatedSyncState & {
  sync: () => Promise<void>;
  resolveConflict: (id: string, useServer: boolean) => Promise<void>;
} {
  const [state, setState] = useState<FederatedSyncState>({
    isSyncing: false,
    lastResult: null,
    pendingConflicts: 0,
    pendingSync: 0,
  });

  useEffect(() => {
    const unsubscribe = federatedSync.subscribe((result) => {
      setState(prev => ({
        ...prev,
        lastResult: result,
        isSyncing: false,
      }));
    });

    // Update stats periodically
    const updateStats = async () => {
      const stats = await federatedSync.getStats();
      setState(prev => ({
        ...prev,
        pendingConflicts: stats.conflicts,
        pendingSync: stats.pendingSync,
      }));
    };

    updateStats();
    const interval = setInterval(updateStats, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const sync = useCallback(async () => {
    setState(prev => ({ ...prev, isSyncing: true }));
    await federatedSync.syncAll();
  }, []);

  const resolveConflict = useCallback(async (id: string, useServer: boolean) => {
    await federatedSync.resolveConflict(id, useServer);
    const stats = await federatedSync.getStats();
    setState(prev => ({ ...prev, pendingConflicts: stats.conflicts }));
  }, []);

  return { ...state, sync, resolveConflict };
}
