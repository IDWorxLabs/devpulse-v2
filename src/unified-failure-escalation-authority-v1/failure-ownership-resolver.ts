/**
 * Unified Failure Escalation Authority V1 — canonical ownership resolver.
 */

import { CANONICAL_OWNERSHIP_V2_ENTRIES } from '../canonical-ownership-v2/ownership-registry-v2.js';

const OWNER_BY_SOURCE: Readonly<Record<string, string>> = {
  CQI: 'CQI',
  UVL: 'UVL',
  AFLA: 'AFLA',
  'Product Architect': 'Product Architect Intelligence',
  'Production Readiness': 'Production Readiness Gate',
  'Cloud Execution': 'Cloud Execution Path',
  World2: 'World2',
  'Mobile Runtime': 'Mobile Runtime Validation',
  'Large-Scale Validation': 'Large-Scale Pipeline Integration',
  'Concurrent Execution': 'Large-Scale Pipeline Integration',
  'Self-Evolution': 'Self-Evolution Execution',
  'Validation Runtime Governance': 'Validation Runtime Governance',
  'Capability Audit': 'Capability Audit',
};

export function resolveCanonicalOwnerForFailure(input: {
  sourceSystem: string;
  classification: string;
  capability?: string;
}): string {
  const bySource = OWNER_BY_SOURCE[input.sourceSystem];
  if (bySource) return bySource;

  if (input.capability) {
    const entry = CANONICAL_OWNERSHIP_V2_ENTRIES.find(
      (e) =>
        e.capabilityName.toLowerCase().includes(input.capability!.toLowerCase()) ||
        e.capabilityId.toLowerCase().includes(input.capability!.toLowerCase()),
    );
    if (entry) return entry.canonicalOwner;
  }

  const byClass = CANONICAL_OWNERSHIP_V2_ENTRIES.find((e) =>
    e.category.toLowerCase().includes(input.classification.toLowerCase().split(' ')[0] ?? ''),
  );
  return byClass?.canonicalOwner ?? 'Unified Failure Escalation Authority';
}
