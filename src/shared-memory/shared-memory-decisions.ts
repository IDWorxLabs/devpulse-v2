/**
 * Founder decisions — seeded DevPulse memory records.
 */

import type { MemoryRecord } from './shared-memory-types.js';
import { getSharedMemoryStore } from './shared-memory-store.js';

const FOUNDER_DECISIONS: Omit<MemoryRecord, 'memoryId'>[] = [
  {
    category: 'DECISION',
    title: 'Use chat-first UI',
    summary: 'Command Center uses chat-first layout with fixed input and welcome empty state.',
    createdAt: Date.now(),
    sourceSystem: 'command_center_runtime_shell',
    phase: 11.1,
    tags: ['ui', 'chat-first', 'command center'],
  },
  {
    category: 'DECISION',
    title: 'Keep roadmap order',
    summary: 'DevPulse phases proceed in constitutional order — no skipping foundation phases.',
    createdAt: Date.now(),
    sourceSystem: 'command_center_brain',
    phase: 11.1,
    tags: ['roadmap', 'order', 'phases'],
  },
  {
    category: 'DECISION',
    title: 'No duplicate systems',
    summary: 'Each DevPulse domain has a single owner in the ownership registry — no parallel brains.',
    createdAt: Date.now(),
    sourceSystem: 'foundation',
    phase: 1,
    tags: ['ownership', 'duplicate', 'registry'],
  },
  {
    category: 'DECISION',
    title: 'Intelligence only — no execution from Brain',
    summary: 'Command Center Brain thinks and explains — it does not execute, modify files, or deploy.',
    createdAt: Date.now(),
    sourceSystem: 'command_center_brain',
    phase: 11.1,
    tags: ['intelligence', 'no execution', 'brain'],
  },
];

export function seedFounderDecisions(): MemoryRecord[] {
  const store = getSharedMemoryStore();
  const seeded: MemoryRecord[] = [];
  for (const decision of FOUNDER_DECISIONS) {
    const existing = store.searchMemories(decision.title).find((r) => r.title === decision.title);
    if (!existing) seeded.push(store.addMemory(decision));
  }
  return seeded;
}

export function listFounderDecisions(): MemoryRecord[] {
  return getSharedMemoryStore().listByCategory('DECISION');
}
