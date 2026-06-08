/**
 * Runtime observations — seeded DevPulse memory records.
 */

import type { MemoryRecord } from './shared-memory-types.js';
import { getSharedMemoryStore } from './shared-memory-store.js';

const RUNTIME_OBSERVATIONS: Omit<MemoryRecord, 'memoryId'>[] = [
  {
    category: 'OBSERVATION',
    title: 'Cross-System Awareness working',
    summary: 'Cross-System Awareness engine routes relationship, dependency, and impact queries correctly.',
    createdAt: Date.now(),
    sourceSystem: 'cross_system_awareness',
    phase: 11.2,
    tags: ['cross-system', 'awareness', 'routing'],
  },
  {
    category: 'OBSERVATION',
    title: 'Relationship analyzer routed correctly',
    summary: 'Relationship queries route to relationship_engine with structured REPORTS_TO output.',
    createdAt: Date.now(),
    sourceSystem: 'cross_system_awareness',
    phase: 11.2,
    tags: ['relationship', 'analyzer', 'routing'],
  },
  {
    category: 'OBSERVATION',
    title: 'Operator Feed activated',
    summary: 'Operator Feed streams category-specific pipeline stages during brain requests.',
    createdAt: Date.now(),
    sourceSystem: 'operator_feed',
    phase: 11.1,
    tags: ['operator feed', 'feed', 'activated'],
  },
  {
    category: 'OBSERVATION',
    title: 'Brain API reachable at runtime',
    summary: 'POST /api/brain/respond and GET /api/brain/health are active on the founder reality server.',
    createdAt: Date.now(),
    sourceSystem: 'command_center_brain',
    phase: 11.1,
    tags: ['brain', 'api', 'runtime'],
  },
];

export function seedRuntimeObservations(): MemoryRecord[] {
  const store = getSharedMemoryStore();
  const seeded: MemoryRecord[] = [];
  for (const observation of RUNTIME_OBSERVATIONS) {
    const existing = store.searchMemories(observation.title).find((r) => r.title === observation.title);
    if (!existing) seeded.push(store.addMemory(observation));
  }
  return seeded;
}

export function listRuntimeObservations(): MemoryRecord[] {
  return getSharedMemoryStore().listByCategory('OBSERVATION');
}
