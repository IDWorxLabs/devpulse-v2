/**
 * Unified Trust Runtime — trust source registry.
 */

import type { TrustSourceId, TrustSourceRegistration } from './trust-runtime-types.js';
import { getCachedSourceLookup, setCachedSourceLookup } from './trust-runtime-cache.js';

const DEFAULT_SOURCES: readonly { sourceId: TrustSourceId; label: string }[] = [
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
  { sourceId: 'WORLD2', label: 'World 2' },
  { sourceId: 'TRUST_ENGINE', label: 'Trust Engine' },
];

const sourceRegistry = new Map<TrustSourceId, TrustSourceRegistration>();
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

export function registerTrustSource(sourceId: TrustSourceId, label?: string): TrustSourceRegistration {
  ensureInitialized();
  const existing = sourceRegistry.get(sourceId);
  if (existing) return existing;

  const registration: TrustSourceRegistration = {
    sourceId,
    label: label ?? sourceId,
    registeredAt: Date.now(),
    active: true,
  };
  sourceRegistry.set(sourceId, registration);
  return registration;
}

export function getTrustSource(sourceId: TrustSourceId): TrustSourceRegistration | undefined {
  ensureInitialized();
  const cached = getCachedSourceLookup(sourceId);
  if (cached) return cached;

  const source = sourceRegistry.get(sourceId);
  if (source) setCachedSourceLookup(sourceId, source);
  return source;
}

export function listTrustSources(): TrustSourceRegistration[] {
  ensureInitialized();
  return [...sourceRegistry.values()];
}

export function getTrustSourceCount(): number {
  ensureInitialized();
  return sourceRegistry.size;
}

export function isKnownTrustSource(sourceId: string): sourceId is TrustSourceId {
  ensureInitialized();
  return sourceRegistry.has(sourceId as TrustSourceId);
}

export function resetTrustSourceRegistryForTests(): void {
  sourceRegistry.clear();
  initialized = false;
}
