/**
 * Evidence Intelligence — evidence source registry.
 */

import type { EvidenceSourceId, EvidenceSourceRegistration } from './evidence-intelligence-types.js';
import { getCachedEvidenceSource, setCachedEvidenceSource } from './evidence-intelligence-cache.js';

const DEFAULT_SOURCES: readonly { sourceId: EvidenceSourceId; label: string }[] = [
  { sourceId: 'AUTONOMOUS_TESTING', label: 'Autonomous Testing' },
  { sourceId: 'AUTONOMOUS_FIXING', label: 'Autonomous Fixing' },
  { sourceId: 'AUTONOMOUS_VERIFICATION', label: 'Autonomous Verification' },
  { sourceId: 'AUTONOMOUS_COMPLETION_ENGINE', label: 'Autonomous Completion Engine' },
  { sourceId: 'VERIFICATION_STRATEGY_CORE', label: 'Verification Strategy Core' },
  { sourceId: 'VERIFICATION_INTELLIGENCE', label: 'Verification Intelligence' },
  { sourceId: 'VERIFICATION_INTEGRATION', label: 'Verification Integration' },
  { sourceId: 'MULTI_PROJECT_VERIFICATION', label: 'Multi Project Verification' },
  { sourceId: 'MULTI_PROJECT_MONITORING', label: 'Multi Project Monitoring' },
  { sourceId: 'SELF_EVOLUTION_GOVERNANCE', label: 'Self Evolution Governance' },
  { sourceId: 'UNIFIED_TRUST_RUNTIME', label: 'Unified Trust Runtime' },
  { sourceId: 'WORLD2', label: 'World 2' },
  { sourceId: 'TRUST_ENGINE', label: 'Trust Engine' },
];

const sourceRegistry = new Map<EvidenceSourceId, EvidenceSourceRegistration>();
let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  const now = Date.now();
  for (const entry of DEFAULT_SOURCES) {
    sourceRegistry.set(entry.sourceId, {
      sourceId: entry.sourceId,
      label: entry.label,
      registeredAt: now,
      active: true,
    });
  }
  initialized = true;
}

export function registerEvidenceSource(sourceId: EvidenceSourceId, label?: string): EvidenceSourceRegistration {
  ensureInitialized();
  const existing = sourceRegistry.get(sourceId);
  if (existing) return existing;

  const registration: EvidenceSourceRegistration = {
    sourceId,
    label: label ?? sourceId,
    registeredAt: Date.now(),
    active: true,
  };
  sourceRegistry.set(sourceId, registration);
  return registration;
}

export function getEvidenceSource(sourceId: EvidenceSourceId): EvidenceSourceRegistration | undefined {
  ensureInitialized();
  const cached = getCachedEvidenceSource(sourceId);
  if (cached) return cached;

  const source = sourceRegistry.get(sourceId);
  if (source) setCachedEvidenceSource(sourceId, source);
  return source;
}

export function listEvidenceSources(): EvidenceSourceRegistration[] {
  ensureInitialized();
  return [...sourceRegistry.values()];
}

export function getEvidenceSourceCount(): number {
  ensureInitialized();
  return sourceRegistry.size;
}

export function isKnownEvidenceSource(sourceId: string): sourceId is EvidenceSourceId {
  ensureInitialized();
  return sourceRegistry.has(sourceId as EvidenceSourceId);
}

export function listKnownEvidenceSourceIds(): EvidenceSourceId[] {
  ensureInitialized();
  return [...sourceRegistry.keys()];
}

export function resetEvidenceSourceRegistryForTests(): void {
  sourceRegistry.clear();
  initialized = false;
}
