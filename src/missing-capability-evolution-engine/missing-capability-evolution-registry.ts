/**
 * Missing Capability Evolution Engine — authority registry and evolved capability store.
 */

import type { EvolvedCapabilityRecord, CapabilityReuseIndexEntry } from './missing-capability-evolution-types.js';
import {
  MISSING_CAPABILITY_EVOLUTION_ENGINE_OWNER_MODULE,
  MISSING_CAPABILITY_EVOLUTION_ENGINE_PASS_TOKEN,
} from './missing-capability-evolution-types.js';

const evolvedRegistry = new Map<string, EvolvedCapabilityRecord>();
const reuseIndex = new Map<string, CapabilityReuseIndexEntry>();

export function getDevPulseV2MissingCapabilityEvolutionEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  enforcementAuthority: true;
} {
  return {
    ownerModule: MISSING_CAPABILITY_EVOLUTION_ENGINE_OWNER_MODULE,
    passToken: MISSING_CAPABILITY_EVOLUTION_ENGINE_PASS_TOKEN,
    phase: 10,
    enforcementAuthority: true,
  };
}

export function registerMissingCapabilityEvolutionEngineWithLaunchAuthority(): {
  passToken: string;
  readOnly: true;
} {
  return { passToken: MISSING_CAPABILITY_EVOLUTION_ENGINE_PASS_TOKEN, readOnly: true };
}

export function registerMissingCapabilityEvolutionEngineWithCapabilityPlanning(): {
  connected: true;
  readOnly: true;
} {
  return { connected: true, readOnly: true };
}

export function registerMissingCapabilityEvolutionEngineWithAutonomousDebugging(): {
  connected: true;
  readOnly: true;
} {
  return { connected: true, readOnly: true };
}

export function registerMissingCapabilityEvolutionEngineWithLivePreviewGate(): {
  connected: true;
  readOnly: true;
} {
  return { connected: true, readOnly: true };
}

export function registerMissingCapabilityEvolutionEngineWithMissingCapabilityEscalation(): {
  passToken: string;
  readOnly: true;
} {
  return { passToken: MISSING_CAPABILITY_EVOLUTION_ENGINE_PASS_TOKEN, readOnly: true };
}

export function resetMissingCapabilityEvolutionRegistryForTests(): void {
  evolvedRegistry.clear();
  reuseIndex.clear();
}

export function listEvolvedCapabilities(): readonly EvolvedCapabilityRecord[] {
  return [...evolvedRegistry.values()];
}

export function getEvolvedCapabilityRecord(capabilityId: string): EvolvedCapabilityRecord | null {
  return evolvedRegistry.get(capabilityId) ?? null;
}

export function registerEvolvedCapabilityRecord(record: EvolvedCapabilityRecord): void {
  evolvedRegistry.set(record.capabilityId, record);
}

export function listCapabilityReuseIndex(): readonly CapabilityReuseIndexEntry[] {
  return [...reuseIndex.values()];
}

export function getCapabilityReuseIndexEntry(capabilityId: string): CapabilityReuseIndexEntry | null {
  return reuseIndex.get(capabilityId) ?? null;
}

export function registerCapabilityReuseIndexEntry(entry: CapabilityReuseIndexEntry): void {
  reuseIndex.set(entry.capabilityId, entry);
}

export function searchCapabilityReuseIndex(query: string): CapabilityReuseIndexEntry[] {
  const lower = query.toLowerCase();
  return listCapabilityReuseIndex().filter(
    (entry) =>
      entry.capabilityKeywords.some((k) => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) ||
      entry.promptPatterns.some((p) => lower.includes(p.toLowerCase())) ||
      entry.requirementPatterns.some((p) => lower.includes(p.toLowerCase())),
  );
}

export function findExistingEvolvedCapability(capabilityName: string): EvolvedCapabilityRecord | null {
  const lower = capabilityName.toLowerCase();
  for (const record of evolvedRegistry.values()) {
    if (
      record.name.toLowerCase() === lower ||
      record.capabilityId.includes(lower.replace(/[^a-z0-9]+/g, '-'))
    ) {
      if (record.status === 'VALIDATED_EVOLVED' || record.status === 'EVOLVED_WITH_LIMITATIONS') {
        return record;
      }
    }
  }
  const indexMatches = searchCapabilityReuseIndex(lower);
  if (indexMatches.length > 0) {
    return getEvolvedCapabilityRecord(indexMatches[0]!.capabilityId);
  }
  return null;
}
