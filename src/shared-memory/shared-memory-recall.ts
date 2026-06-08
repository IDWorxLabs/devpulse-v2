/**
 * Memory recall engine — keyword matching only. No AI.
 */

import type { MemoryCategory, MemoryRecallResult, MemoryRecord } from './shared-memory-types.js';
import { getSharedMemoryStore } from './shared-memory-store.js';

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

function scoreRecord(record: MemoryRecord, tokens: string[]): number {
  const haystack = [record.title, record.summary, ...record.tags, record.sourceSystem]
    .join(' ')
    .toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 1;
  }
  return score;
}

export function recallRelevantMemories(query: string): MemoryRecallResult {
  const store = getSharedMemoryStore();
  const tokens = tokenize(query);
  const all = store.listMemories();

  if (tokens.length === 0) {
    return { query, matches: [], matchCount: 0 };
  }

  const scored = all
    .map((record) => ({ record, score: scoreRecord(record, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.record.createdAt - b.record.createdAt);

  const matches = scored.map((entry) => entry.record);
  return { query, matches, matchCount: matches.length };
}

export function recallByCategory(category: MemoryCategory): MemoryRecord[] {
  return getSharedMemoryStore().listByCategory(category);
}

export function formatMemoryRecord(record: MemoryRecord): string {
  return [
    `• [${record.category}] ${record.title}`,
    `  Summary: ${record.summary}`,
    `  Source: ${record.sourceSystem} | Phase: ${record.phase}`,
    `  Tags: ${record.tags.join(', ')}`,
  ].join('\n');
}

export function formatMemoryRecallResponse(message: string, recall: MemoryRecallResult): string {
  const lower = message.toLowerCase();
  let heading = 'Shared Memory Recall';
  let records = recall.matches;

  if (lower.includes('decision')) {
    heading = 'Recorded Founder Decisions';
    records = recallByCategory('DECISION');
  } else if (lower.includes('observation') && (lower.includes('operator feed') || lower.includes('feed'))) {
    heading = 'Observations About Operator Feed';
    records = recallByCategory('OBSERVATION').filter(
      (r) => r.tags.some((t) => t.includes('feed') || t.includes('operator')),
    );
  } else if (lower.includes('remember') || lower.includes('memory')) {
    heading = 'DevPulse Shared Memory';
    if (records.length === 0) records = recall.matches;
  }

  if (records.length === 0) {
    return [
      heading,
      '',
      'No matching memories found in the in-memory store for this query.',
      '',
      `Memory count in store: ${getSharedMemoryStore().memoryCount()}`,
      '',
      'Shared memory is informational only — no execution, persistence, or file modification.',
    ].join('\n');
  }

  const lines = records.map(formatMemoryRecord);
  return [
    heading,
    '',
    `Memories found: ${records.length}`,
    '',
    ...lines,
    '',
    `Total memory count in store: ${getSharedMemoryStore().memoryCount()}`,
    '',
    'Shared memory is in-memory only — exists while runtime is active. Intelligence only.',
  ].join('\n');
}

export function isMemoryRecallQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('what do you remember') ||
    lower.includes('what decisions have been recorded') ||
    lower.includes('what observations exist') ||
    lower.includes('what do we remember') ||
    lower.includes('memory about') ||
    lower.includes('remember about')
  );
}
