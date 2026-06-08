/**
 * Shared memory runtime — brain integration helpers.
 */

import { seedArchitectureFacts } from './shared-memory-facts.js';
import { seedFounderDecisions } from './shared-memory-decisions.js';
import { seedRuntimeObservations } from './shared-memory-observations.js';
import { recallRelevantMemories } from './shared-memory-recall.js';
import { getSharedMemoryStore, resetSharedMemoryStoreForTests } from './shared-memory-store.js';
import type { SharedMemoryContext } from './shared-memory-types.js';
import { resetMemoryIdCounterForTests } from './shared-memory-types.js';

let seeded = false;

export function ensureSharedMemorySeeded(): void {
  if (seeded) return;
  seedArchitectureFacts();
  seedFounderDecisions();
  seedRuntimeObservations();
  seeded = true;
}

export function resetSharedMemoryForTests(): void {
  resetMemoryIdCounterForTests();
  resetSharedMemoryStoreForTests();
  seeded = false;
  ensureSharedMemorySeeded();
}

export function processMemoryForRequest(message: string): SharedMemoryContext {
  ensureSharedMemorySeeded();
  const store = getSharedMemoryStore();
  const timestamp = Date.now();

  store.addMemory({
    category: 'QUESTION_HISTORY',
    title: message.slice(0, 80),
    summary: message,
    createdAt: timestamp,
    sourceSystem: 'command_center_brain',
    phase: 11.3,
    tags: ['question', 'user'],
  });

  const recall = recallRelevantMemories(message);

  return {
    lookupPerformed: true,
    memoryCount: store.memoryCount(),
    recalledCount: recall.matchCount,
    recalledMemories: recall.matches.slice(0, 10),
    query: message,
  };
}

export function sharedMemoryKey(): string {
  ensureSharedMemorySeeded();
  return `memory:${getSharedMemoryStore().memoryCount()}`;
}

export class DevPulseV2SharedMemoryLayer {
  static readonly ownerModule = 'devpulse_v2_shared_memory_layer';
  static readonly ownerDomain = 'shared_memory_layer' as const;

  static recall(query: string) {
    ensureSharedMemorySeeded();
    return recallRelevantMemories(query);
  }
}

let singleton: DevPulseV2SharedMemoryLayer | null = null;

export function getDevPulseV2SharedMemoryLayer(): DevPulseV2SharedMemoryLayer {
  if (!singleton) singleton = new DevPulseV2SharedMemoryLayer();
  return singleton;
}
