/**
 * Universal Synchronization Pack — testable domain-neutral runtime.
 *
 * Models offline-first change tracking, online/offline detection, conflict detection,
 * retry policies, and sync health — without any product-domain vocabulary.
 */

export type SyncConnectivity = 'online' | 'offline' | 'unknown';

export type ConflictStrategy = 'last-write-wins' | 'manual' | 'reject-incoming';

export interface SyncOperation {
  readonly operationId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly mutationKind: 'create' | 'update' | 'delete';
  readonly payload: Readonly<Record<string, unknown>>;
  readonly baseVersion: number;
  readonly enqueuedAt: number;
  readonly attemptCount: number;
}

export interface SyncConflict {
  readonly operationId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly localVersion: number;
  readonly remoteVersion: number;
  readonly strategy: ConflictStrategy;
  readonly resolved: boolean;
  readonly winner: 'local' | 'remote' | 'unresolved';
}

export interface SyncHealthSnapshot {
  readonly connectivity: SyncConnectivity;
  readonly queuedCount: number;
  readonly conflictCount: number;
  readonly lastFlushAt: number | null;
  readonly lastError: string | null;
  readonly healthy: boolean;
}

export interface SynchronizationConfig {
  readonly maxQueueSize: number;
  readonly retryBaseDelayMs: number;
  readonly retryMaxAttempts: number;
  readonly conflictStrategy: ConflictStrategy;
  readonly backgroundSyncIntervalMs: number;
}

export const DEFAULT_SYNC_CONFIG: SynchronizationConfig = {
  maxQueueSize: 500,
  retryBaseDelayMs: 1000,
  retryMaxAttempts: 5,
  conflictStrategy: 'last-write-wins',
  backgroundSyncIntervalMs: 15000,
};

export function detectConnectivity(navigatorOnline?: boolean | null): SyncConnectivity {
  if (typeof navigatorOnline === 'boolean') return navigatorOnline ? 'online' : 'offline';
  return 'unknown';
}

export function computeRetryDelayMs(attemptCount: number, config: SynchronizationConfig): number {
  const attempt = Math.max(0, attemptCount);
  const capped = Math.min(attempt, config.retryMaxAttempts);
  return config.retryBaseDelayMs * 2 ** capped;
}

export function shouldRetry(attemptCount: number, config: SynchronizationConfig): boolean {
  return attemptCount < config.retryMaxAttempts;
}

export function detectVersionConflict(localVersion: number, remoteVersion: number): boolean {
  return Number.isFinite(localVersion) && Number.isFinite(remoteVersion) && remoteVersion > localVersion;
}

export function resolveConflict(input: {
  localVersion: number;
  remoteVersion: number;
  strategy: ConflictStrategy;
}): { winner: 'local' | 'remote' | 'unresolved'; resolved: boolean } {
  if (!detectVersionConflict(input.localVersion, input.remoteVersion)) {
    return { winner: 'local', resolved: true };
  }
  if (input.strategy === 'last-write-wins') {
    return {
      winner: input.remoteVersion >= input.localVersion ? 'remote' : 'local',
      resolved: true,
    };
  }
  if (input.strategy === 'reject-incoming') {
    return { winner: 'local', resolved: true };
  }
  return { winner: 'unresolved', resolved: false };
}

export class SynchronizationEngine {
  private readonly queue: SyncOperation[] = [];
  private readonly conflicts: SyncConflict[] = [];
  private connectivity: SyncConnectivity = 'unknown';
  private lastFlushAt: number | null = null;
  private lastError: string | null = null;
  private versions = new Map<string, number>();

  constructor(private readonly config: SynchronizationConfig = DEFAULT_SYNC_CONFIG) {}

  setConnectivity(state: SyncConnectivity): void {
    this.connectivity = state;
  }

  getConnectivity(): SyncConnectivity {
    return this.connectivity;
  }

  entityKey(entityType: string, entityId: string): string {
    return `${entityType}:${entityId}`;
  }

  getVersion(entityType: string, entityId: string): number {
    return this.versions.get(this.entityKey(entityType, entityId)) ?? 0;
  }

  enqueue(input: {
    operationId: string;
    entityType: string;
    entityId: string;
    mutationKind: SyncOperation['mutationKind'];
    payload?: Readonly<Record<string, unknown>>;
  }): SyncOperation | null {
    if (this.queue.length >= this.config.maxQueueSize) {
      this.lastError = 'sync_queue_full';
      return null;
    }
    const baseVersion = this.getVersion(input.entityType, input.entityId);
    const op: SyncOperation = {
      operationId: input.operationId,
      entityType: input.entityType,
      entityId: input.entityId,
      mutationKind: input.mutationKind,
      payload: input.payload ?? {},
      baseVersion,
      enqueuedAt: Date.now(),
      attemptCount: 0,
    };
    this.queue.push(op);
    this.lastError = null;
    return op;
  }

  listQueued(): readonly SyncOperation[] {
    return [...this.queue];
  }

  listConflicts(): readonly SyncConflict[] {
    return [...this.conflicts];
  }

  /**
   * Flush queued operations when online. `remoteVersions` maps entityKey → remote version.
   * Applies conflict strategy; successful ops bump local version and leave the queue.
   */
  flush(remoteVersions: Readonly<Record<string, number>> = {}): {
    flushed: number;
    conflicts: number;
    deferred: number;
  } {
    if (this.connectivity === 'offline') {
      return { flushed: 0, conflicts: 0, deferred: this.queue.length };
    }
    let flushed = 0;
    let conflicts = 0;
    const remaining: SyncOperation[] = [];
    for (const op of this.queue) {
      const key = this.entityKey(op.entityType, op.entityId);
      const remoteVersion = remoteVersions[key] ?? op.baseVersion;
      if (detectVersionConflict(op.baseVersion, remoteVersion)) {
        const resolution = resolveConflict({
          localVersion: op.baseVersion,
          remoteVersion,
          strategy: this.config.conflictStrategy,
        });
        this.conflicts.push({
          operationId: op.operationId,
          entityType: op.entityType,
          entityId: op.entityId,
          localVersion: op.baseVersion,
          remoteVersion,
          strategy: this.config.conflictStrategy,
          resolved: resolution.resolved,
          winner: resolution.winner,
        });
        conflicts += 1;
        if (!resolution.resolved || resolution.winner === 'remote') {
          remaining.push({ ...op, attemptCount: op.attemptCount + 1 });
          continue;
        }
      }
      if (!shouldRetry(op.attemptCount, this.config) && op.attemptCount > 0) {
        remaining.push(op);
        this.lastError = `retry_exhausted:${op.operationId}`;
        continue;
      }
      this.versions.set(key, Math.max(op.baseVersion, remoteVersion) + 1);
      flushed += 1;
    }
    this.queue.length = 0;
    this.queue.push(...remaining.filter((op) => shouldRetry(op.attemptCount, this.config)));
    this.lastFlushAt = Date.now();
    return { flushed, conflicts, deferred: this.queue.length };
  }

  health(): SyncHealthSnapshot {
    return {
      connectivity: this.connectivity,
      queuedCount: this.queue.length,
      conflictCount: this.conflicts.filter((c) => !c.resolved).length,
      lastFlushAt: this.lastFlushAt,
      lastError: this.lastError,
      healthy:
        this.lastError === null &&
        this.conflicts.filter((c) => !c.resolved).length === 0 &&
        (this.connectivity !== 'offline' || this.queue.length < this.config.maxQueueSize),
    };
  }
}
