/**
 * Self-Evolution Execution V1 — bounded evolution registry.
 */

import type { EvolutionRegistry, EvolutionRegistryEntry } from './self-evolution-execution-v1-types.js';
import { MAX_EVOLUTION_REGISTRY_SIZE } from './self-evolution-execution-v1-bounds.js';

let registryEntries: EvolutionRegistryEntry[] = [];

export function resetEvolutionRegistryForTests(): void {
  registryEntries = [];
}

export function recordEvolutionRegistryEntry(entry: EvolutionRegistryEntry): void {
  registryEntries = [entry, ...registryEntries].slice(0, MAX_EVOLUTION_REGISTRY_SIZE);
}

export function buildEvolutionRegistrySnapshot(): EvolutionRegistry {
  const proposals = registryEntries.filter((e) => e.status === 'PROPOSED').length;
  const experiments = registryEntries.filter((e) => e.status === 'EXPERIMENTING').length;
  const approved = registryEntries.filter((e) => e.status === 'APPROVED').length;
  const rejected = registryEntries.filter((e) => e.status === 'REJECTED').length;
  const promoted = registryEntries.filter((e) => e.status === 'PROMOTED').length;
  const archived = registryEntries.filter((e) => e.status === 'ARCHIVED').length;

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalEntries: registryEntries.length,
    proposals,
    experiments,
    approved,
    rejected,
    promoted,
    archived,
    entries: [...registryEntries],
  };
}

export function loadEvolutionRegistryEntries(): readonly EvolutionRegistryEntry[] {
  return registryEntries;
}
