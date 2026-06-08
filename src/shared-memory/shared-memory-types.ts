/**
 * DevPulse V2 Phase 11.3 — Shared Memory Layer types.
 * In-memory structured DevPulse memory. Intelligence only — no persistence.
 */

export const SHARED_MEMORY_LAYER_PASS_TOKEN = 'DEVPULSE_V2_SHARED_MEMORY_LAYER_V1_PASS';
export const SHARED_MEMORY_LAYER_OWNER_MODULE = 'devpulse_v2_shared_memory_layer';

export type MemoryCategory = 'FACT' | 'DECISION' | 'OBSERVATION' | 'QUESTION_HISTORY';

export interface MemoryRecord {
  memoryId: string;
  category: MemoryCategory;
  title: string;
  summary: string;
  createdAt: number;
  sourceSystem: string;
  phase: number | string;
  tags: string[];
}

export interface SharedMemoryContext {
  lookupPerformed: boolean;
  memoryCount: number;
  recalledCount: number;
  recalledMemories: MemoryRecord[];
  query: string;
}

export interface MemoryRecallResult {
  query: string;
  matches: MemoryRecord[];
  matchCount: number;
}

export const DUPLICATE_SHARED_MEMORY_PATTERNS = [
  'shared_memory',
  'brain_memory',
  'session_memory',
  'ai_memory',
] as const;

export const MEMORY_FEED_SEQUENCE = [
  'Loading Memory',
  'Searching Memory',
  'Memory Context Ready',
] as const;

let memoryIdCounter = 0;

export function nextMemoryId(): string {
  memoryIdCounter += 1;
  return `mem-${memoryIdCounter.toString().padStart(5, '0')}`;
}

export function resetMemoryIdCounterForTests(): void {
  memoryIdCounter = 0;
}
