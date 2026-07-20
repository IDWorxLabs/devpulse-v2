/**
 * Universal Synchronization Pack — workspace materializer.
 */

import type { GeneratedWorkspaceFile } from '../../code-generation-engine/code-generation-engine-types.js';
import { UNIVERSAL_SYNCHRONIZATION_PACK_DESCRIPTOR } from './synchronization-pack-descriptor.js';

export function materializeSynchronizationPack(
  configuration: Readonly<Record<string, unknown>>,
): GeneratedWorkspaceFile[] {
  const maxQueueSize = Number(configuration.maxQueueSize ?? 500);
  const retryBaseDelayMs = Number(configuration.retryBaseDelayMs ?? 1000);
  const retryMaxAttempts = Number(configuration.retryMaxAttempts ?? 5);
  const conflictStrategy = String(configuration.conflictStrategy ?? 'last-write-wins');
  const backgroundSyncIntervalMs = Number(configuration.backgroundSyncIntervalMs ?? 15000);

  return [
    {
      relativePath: 'src/universal-capability-packs/synchronization/synchronization-runtime.ts',
      content: generateSelfContainedSynchronizationRuntime({
        maxQueueSize,
        retryBaseDelayMs,
        retryMaxAttempts,
        conflictStrategy,
        backgroundSyncIntervalMs,
      }),
    },
    {
      relativePath: 'src/universal-capability-packs/synchronization/synchronization-pack.json',
      content: `${JSON.stringify(
        {
          packId: UNIVERSAL_SYNCHRONIZATION_PACK_DESCRIPTOR.packId,
          version: UNIVERSAL_SYNCHRONIZATION_PACK_DESCRIPTOR.packVersion,
          maxQueueSize,
          retryBaseDelayMs,
          retryMaxAttempts,
          conflictStrategy,
          backgroundSyncIntervalMs,
        },
        null,
        2,
      )}\n`,
    },
  ];
}

function generateSelfContainedSynchronizationRuntime(config: {
  maxQueueSize: number;
  retryBaseDelayMs: number;
  retryMaxAttempts: number;
  conflictStrategy: string;
  backgroundSyncIntervalMs: number;
}): string {
  return `/** Universal Synchronization Pack runtime — self-contained generated artifact */
export type SyncConnectivity = 'online' | 'offline' | 'unknown';
export type ConflictStrategy = 'last-write-wins' | 'manual' | 'reject-incoming';

export interface SyncOperation {
  operationId: string;
  entityType: string;
  entityId: string;
  mutationKind: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  baseVersion: number;
  enqueuedAt: number;
  attemptCount: number;
}

export interface SyncHealthSnapshot {
  connectivity: SyncConnectivity;
  queuedCount: number;
  conflictCount: number;
  lastFlushAt: number | null;
  lastError: string | null;
  healthy: boolean;
}

const MAX_QUEUE_SIZE = ${config.maxQueueSize};
const RETRY_BASE_DELAY_MS = ${config.retryBaseDelayMs};
const RETRY_MAX_ATTEMPTS = ${config.retryMaxAttempts};
const CONFLICT_STRATEGY = '${config.conflictStrategy}' as ConflictStrategy;
const BACKGROUND_SYNC_INTERVAL_MS = ${config.backgroundSyncIntervalMs};

export function detectConnectivity(): SyncConnectivity {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine ? 'online' : 'offline';
  }
  return 'unknown';
}

export function computeRetryDelayMs(attemptCount: number): number {
  const capped = Math.min(Math.max(0, attemptCount), RETRY_MAX_ATTEMPTS);
  return RETRY_BASE_DELAY_MS * Math.pow(2, capped);
}

export class SynchronizationEngine {
  private queue: SyncOperation[] = [];
  private unresolvedConflicts = 0;
  private connectivity: SyncConnectivity = detectConnectivity();
  private lastFlushAt: number | null = null;
  private lastError: string | null = null;
  private versions = new Map<string, number>();
  private timer: ReturnType<typeof setInterval> | null = null;

  startBackgroundSync(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.connectivity = detectConnectivity();
      if (this.connectivity !== 'offline') this.flush();
    }, BACKGROUND_SYNC_INTERVAL_MS);
  }

  stopBackgroundSync(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  enqueue(input: {
    operationId: string;
    entityType: string;
    entityId: string;
    mutationKind: SyncOperation['mutationKind'];
    payload?: Record<string, unknown>;
  }): SyncOperation | null {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      this.lastError = 'sync_queue_full';
      return null;
    }
    const key = input.entityType + ':' + input.entityId;
    const baseVersion = this.versions.get(key) ?? 0;
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

  flush(remoteVersions: Record<string, number> = {}): { flushed: number; conflicts: number; deferred: number } {
    this.connectivity = detectConnectivity();
    if (this.connectivity === 'offline') {
      return { flushed: 0, conflicts: 0, deferred: this.queue.length };
    }
    let flushed = 0;
    let conflicts = 0;
    const remaining: SyncOperation[] = [];
    for (const op of this.queue) {
      const key = op.entityType + ':' + op.entityId;
      const remoteVersion = remoteVersions[key] ?? op.baseVersion;
      if (remoteVersion > op.baseVersion) {
        conflicts += 1;
        if (CONFLICT_STRATEGY === 'manual') {
          this.unresolvedConflicts += 1;
          remaining.push({ ...op, attemptCount: op.attemptCount + 1 });
          continue;
        }
        if (CONFLICT_STRATEGY === 'reject-incoming') {
          this.versions.set(key, op.baseVersion + 1);
          flushed += 1;
          continue;
        }
        // last-write-wins: remote wins when newer; still acknowledge local flush bookkeeping
        this.versions.set(key, remoteVersion + 1);
        flushed += 1;
        continue;
      }
      this.versions.set(key, op.baseVersion + 1);
      flushed += 1;
    }
    this.queue = remaining.filter((op) => op.attemptCount < RETRY_MAX_ATTEMPTS);
    this.lastFlushAt = Date.now();
    return { flushed, conflicts, deferred: this.queue.length };
  }

  health(): SyncHealthSnapshot {
    return {
      connectivity: this.connectivity,
      queuedCount: this.queue.length,
      conflictCount: this.unresolvedConflicts,
      lastFlushAt: this.lastFlushAt,
      lastError: this.lastError,
      healthy: this.lastError === null && this.unresolvedConflicts === 0,
    };
  }
}

export const synchronizationEngine = new SynchronizationEngine();
export const SYNCHRONIZATION_PACK_MARKER = 'universal-synchronization-pack-v1';
`;
}
