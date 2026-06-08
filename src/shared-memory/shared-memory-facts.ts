/**
 * Architecture facts — seeded DevPulse memory records.
 */

import type { MemoryRecord } from './shared-memory-types.js';
import { getSharedMemoryStore } from './shared-memory-store.js';

const ARCHITECTURE_FACTS: Omit<MemoryRecord, 'memoryId'>[] = [
  {
    category: 'FACT',
    title: 'World 2 runtime not connected',
    summary: 'World 2 planning foundations exist but execution runtime has not been implemented.',
    createdAt: Date.now(),
    sourceSystem: 'world2_foundation',
    phase: 9,
    tags: ['world 2', 'world2', 'runtime', 'planning'],
  },
  {
    category: 'FACT',
    title: 'Trust Engine exists',
    summary: 'Trust Engine Expansion (Phase 10.2) aggregates trust signals for founder review.',
    createdAt: Date.now(),
    sourceSystem: 'trust_engine',
    phase: 10.2,
    tags: ['trust engine', 'trust', 'aggregation'],
  },
  {
    category: 'FACT',
    title: 'Operator Feed exists',
    summary: 'Operator Feed surfaces pipeline activity in the Command Center — informational only.',
    createdAt: Date.now(),
    sourceSystem: 'operator_feed',
    phase: 10.3,
    tags: ['operator feed', 'feed', 'visibility'],
  },
  {
    category: 'FACT',
    title: 'Governance Stack foundation complete',
    summary: 'Governance provides verification, evidence ledger, and founder approval gates.',
    createdAt: Date.now(),
    sourceSystem: 'governance_stack',
    phase: 6,
    tags: ['governance', 'verification', 'approval'],
  },
  {
    category: 'FACT',
    title: 'Command Center Brain is local intelligence only',
    summary: 'Unified Command Center Brain provides local intelligence — no external AI, no execution.',
    createdAt: Date.now(),
    sourceSystem: 'command_center_brain',
    phase: 11.1,
    tags: ['command center brain', 'brain', 'intelligence'],
  },
];

export function seedArchitectureFacts(): MemoryRecord[] {
  const store = getSharedMemoryStore();
  const seeded: MemoryRecord[] = [];
  for (const fact of ARCHITECTURE_FACTS) {
    const existing = store.searchMemories(fact.title).find((r) => r.title === fact.title);
    if (!existing) seeded.push(store.addMemory(fact));
  }
  return seeded;
}

export function listArchitectureFacts(): MemoryRecord[] {
  return getSharedMemoryStore().listByCategory('FACT');
}
