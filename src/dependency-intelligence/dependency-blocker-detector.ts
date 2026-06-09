/**
 * Dependency blocker detector — blocked capabilities and missing dependencies.
 */

import type { DependencyEdge, DependencyGraph } from './dependency-intelligence-types.js';
import { displayNameFor } from './dependency-intelligence-types.js';

export function findBlockedDependencies(graph: DependencyGraph): DependencyEdge[] {
  return graph.edges.filter((e) => e.blocked);
}

export function findMissingDependencies(graph: DependencyGraph): string[] {
  const missing: string[] = [];
  for (const e of graph.edges) {
    if (e.blocked && e.required) {
      missing.push(
        `${displayNameFor(e.source)} requires ${displayNameFor(e.target)} — ${e.reason}`,
      );
    }
  }
  const capabilityGaps = graph.edges
    .filter((e) => e.entityKind === 'capability' && e.blocked)
    .map((e) => `Capability ${e.source} blocked: missing ${displayNameFor(e.target)}`);
  return [...new Set([...missing, ...capabilityGaps])];
}

export function findBlockedCapabilities(graph: DependencyGraph): string[] {
  return graph.edges
    .filter((e) => e.blocked && (e.entityKind === 'capability' || e.source.includes('execution')))
    .map((e) => `${displayNameFor(e.source)} blocked by ${displayNameFor(e.target)}`);
}

export function blockersForSystem(systemId: string, graph: DependencyGraph): string[] {
  const lower = systemId.toLowerCase();
  return graph.edges
    .filter(
      (e) =>
        e.blocked &&
        (e.source.toLowerCase().includes(lower) ||
          displayNameFor(e.source).toLowerCase().includes(lower)),
    )
    .map((e) => e.reason);
}
