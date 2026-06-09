/**
 * Capability route index — fast lookup by capability, domain, phase, keyword, priority.
 */

import {
  PRIMARY_ROUTE_ENTRIES,
  type CapabilityRouteEntry,
  type FoundationCategory,
} from './capability-routing-table.js';
import type { SelectedCapability } from './general-question-types.js';

export interface CapabilityRouteIndex {
  byCapabilityId: ReadonlyMap<SelectedCapability, CapabilityRouteEntry[]>;
  byDomain: ReadonlyMap<string, CapabilityRouteEntry[]>;
  byPhase: ReadonlyMap<number, CapabilityRouteEntry[]>;
  byKeyword: ReadonlyMap<string, CapabilityRouteEntry[]>;
  byPriority: readonly CapabilityRouteEntry[];
  byFoundationCategory: ReadonlyMap<FoundationCategory, CapabilityRouteEntry[]>;
  routeCount: number;
}

let cachedIndex: CapabilityRouteIndex | null = null;

function appendMap<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}

export function buildCapabilityRouteIndex(): CapabilityRouteIndex {
  const byCapabilityId = new Map<SelectedCapability, CapabilityRouteEntry[]>();
  const byDomain = new Map<string, CapabilityRouteEntry[]>();
  const byPhase = new Map<number, CapabilityRouteEntry[]>();
  const byKeyword = new Map<string, CapabilityRouteEntry[]>();
  const byFoundationCategory = new Map<FoundationCategory, CapabilityRouteEntry[]>();
  const byPriority = [...PRIMARY_ROUTE_ENTRIES].sort((a, b) => a.priority - b.priority);

  for (const route of PRIMARY_ROUTE_ENTRIES) {
    appendMap(byCapabilityId, route.capabilityId, route);
    appendMap(byDomain, route.domain, route);
    appendMap(byPhase, route.phase, route);
    appendMap(byFoundationCategory, route.foundationCategory, route);
    for (const keyword of route.keywords) {
      appendMap(byKeyword, keyword.toLowerCase(), route);
    }
  }

  return {
    byCapabilityId,
    byDomain,
    byPhase,
    byKeyword,
    byPriority,
    byFoundationCategory,
    routeCount: PRIMARY_ROUTE_ENTRIES.length,
  };
}

export function getCapabilityRouteIndex(): CapabilityRouteIndex {
  if (!cachedIndex) cachedIndex = buildCapabilityRouteIndex();
  return cachedIndex;
}

export type CapabilityRouteIndexQuery =
  | { kind: 'capabilityId'; value: SelectedCapability }
  | { kind: 'domain'; value: string }
  | { kind: 'phase'; value: number }
  | { kind: 'keyword'; value: string }
  | { kind: 'foundationCategory'; value: FoundationCategory }
  | { kind: 'priorityOrder' };

export function queryCapabilityRouteIndex(query: CapabilityRouteIndexQuery): CapabilityRouteEntry[] {
  const index = getCapabilityRouteIndex();
  switch (query.kind) {
    case 'capabilityId':
      return [...(index.byCapabilityId.get(query.value) ?? [])];
    case 'domain':
      return [...(index.byDomain.get(query.value) ?? [])];
    case 'phase':
      return [...(index.byPhase.get(query.value) ?? [])];
    case 'keyword':
      return [...(index.byKeyword.get(query.value.toLowerCase()) ?? [])];
    case 'foundationCategory':
      return [...(index.byFoundationCategory.get(query.value) ?? [])];
    case 'priorityOrder':
      return [...index.byPriority];
    default:
      return [];
  }
}

export function validateCapabilityRouteIndex(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const index = getCapabilityRouteIndex();
  if (index.routeCount !== PRIMARY_ROUTE_ENTRIES.length) {
    issues.push(`routeCount mismatch: ${index.routeCount} vs ${PRIMARY_ROUTE_ENTRIES.length}`);
  }
  const priorities = new Set<number>();
  for (const route of PRIMARY_ROUTE_ENTRIES) {
    if (priorities.has(route.priority)) {
      issues.push(`duplicate priority ${route.priority} on route ${route.routeId}`);
    }
    priorities.add(route.priority);
  }
  if (index.byPriority[0]?.priority !== 1) {
    issues.push('priority order does not start at 1');
  }
  return { valid: issues.length === 0, issues };
}

export function resetCapabilityRouteIndexForTests(): void {
  cachedIndex = null;
}
