/**
 * Canonical Ownership V2 Registration — ownership graph builder.
 */

import type { CanonicalOwnershipEntry, CanonicalOwnershipGraph } from './canonical-ownership-v2-types.js';
import { CANONICAL_OWNERSHIP_V2_ENTRIES } from './ownership-registry-v2.js';

export function buildCanonicalOwnershipGraph(
  entries: readonly CanonicalOwnershipEntry[] = CANONICAL_OWNERSHIP_V2_ENTRIES,
): CanonicalOwnershipGraph {
  const byOwner = new Map<string, CanonicalOwnershipEntry[]>();
  for (const entry of entries) {
    const list = byOwner.get(entry.canonicalOwner) ?? [];
    list.push(entry);
    byOwner.set(entry.canonicalOwner, list);
  }

  const nodes = [...byOwner.entries()].map(([owner, ownerEntries]) => {
    const consumers = new Set<string>();
    const providers = new Set<string>();
    for (const entry of ownerEntries) {
      for (const c of entry.consumes) consumers.add(c);
      for (const p of entry.provides) providers.add(p);
    }
    return {
      readOnly: true as const,
      owner: owner as CanonicalOwnershipEntry['canonicalOwner'],
      capabilities: ownerEntries.map((e) => e.capabilityName),
      consumers: [...consumers],
      providers: [...providers],
    };
  });

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    nodes,
  };
}
