/**
 * Verification Reality — bounded assessment registry.
 */

import { MAX_REGISTRY_ENTRIES } from './verification-reality-bounds.js';

export interface VerificationRegistryEntry {
  assessmentId: string;
  verificationRealityScore: number;
  verificationStatus: string;
  evidenceChainBreakPoint: string;
  assessedAt: number;
}

const registry = new Map<string, VerificationRegistryEntry>();

export function resetVerificationRealityRegistryForTests(): void {
  registry.clear();
}

export function storeVerificationRegistryEntry(entry: VerificationRegistryEntry): void {
  registry.set(entry.assessmentId, entry);
  if (registry.size > MAX_REGISTRY_ENTRIES) {
    const oldest = [...registry.values()].sort((a, b) => a.assessedAt - b.assessedAt)[0];
    if (oldest) registry.delete(oldest.assessmentId);
  }
}

export function getVerificationRegistryCount(): number {
  return registry.size;
}

export function listVerificationRegistryEntries(): VerificationRegistryEntry[] {
  return [...registry.values()].sort((a, b) => b.assessedAt - a.assessedAt);
}
