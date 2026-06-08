/**
 * Shared Memory Store — central in-memory store. READ / STORE / RECALL only.
 */

import type { MemoryCategory, MemoryRecord } from './shared-memory-types.js';
import { nextMemoryId } from './shared-memory-types.js';

export class SharedMemoryStore {
  private readonly records = new Map<string, MemoryRecord>();

  addMemory(input: Omit<MemoryRecord, 'memoryId'> & { memoryId?: string }): MemoryRecord {
    const record: MemoryRecord = {
      memoryId: input.memoryId ?? nextMemoryId(),
      category: input.category,
      title: input.title,
      summary: input.summary,
      createdAt: input.createdAt,
      sourceSystem: input.sourceSystem,
      phase: input.phase,
      tags: [...input.tags],
    };
    this.records.set(record.memoryId, record);
    return record;
  }

  getMemory(memoryId: string): MemoryRecord | undefined {
    return this.records.get(memoryId);
  }

  listMemories(): MemoryRecord[] {
    return [...this.records.values()].sort((a, b) => a.createdAt - b.createdAt);
  }

  listByCategory(category: MemoryCategory): MemoryRecord[] {
    return this.listMemories().filter((r) => r.category === category);
  }

  searchMemories(query: string): MemoryRecord[] {
    const lower = query.toLowerCase().trim();
    if (!lower) return [];
    return this.listMemories().filter((record) => {
      const haystack = [
        record.title,
        record.summary,
        record.sourceSystem,
        record.category,
        ...record.tags,
      ]
        .join(' ')
        .toLowerCase();
      return lower.split(/\s+/).some((token) => token.length > 1 && haystack.includes(token));
    });
  }

  memoryCount(): number {
    return this.records.size;
  }

  clearForTests(): void {
    this.records.clear();
  }
}

let storeSingleton: SharedMemoryStore | null = null;

export function getSharedMemoryStore(): SharedMemoryStore {
  if (!storeSingleton) storeSingleton = new SharedMemoryStore();
  return storeSingleton;
}

export function resetSharedMemoryStoreForTests(): SharedMemoryStore {
  storeSingleton = new SharedMemoryStore();
  return storeSingleton;
}
