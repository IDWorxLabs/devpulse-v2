/**
 * Universal Capability Coverage Intelligence V1 — gap analysis.
 */

import type {
  CapabilityGapEntry,
  CapabilityMaturityLevel,
  UniversalCapabilityDescriptor,
} from './universal-capability-coverage-types.js';

export function analyzeCapabilityGaps(
  capabilities: readonly UniversalCapabilityDescriptor[],
): CapabilityGapEntry[] {
  const gaps: CapabilityGapEntry[] = [];

  for (const cap of capabilities) {
    if (cap.maturityLevel === 'NOT_PRESENT') {
      gaps.push({
        capabilityKey: cap.capabilityKey,
        gapType: 'missing_capability',
        detail: 'Capability not present in engineering surface',
        maturityLevel: cap.maturityLevel,
      });
    }
    if (cap.supportClassification === 'PARTIALLY_IMPLEMENTED') {
      gaps.push({
        capabilityKey: cap.capabilityKey,
        gapType: 'capability_partial',
        detail: 'Capability partially implemented',
        maturityLevel: cap.maturityLevel,
      });
    }
    if (
      cap.supportClassification === 'BLOCKED_BY_DEPENDENCY' ||
      cap.supportClassification === 'NOT_IMPLEMENTED'
    ) {
      gaps.push({
        capabilityKey: cap.capabilityKey,
        gapType: 'capability_blocked',
        detail: cap.supportClassification,
        maturityLevel: cap.maturityLevel,
      });
    }
    if (cap.dimensionScores.runtimeCoverage === 0 && cap.maturityLevel !== 'NOT_PRESENT') {
      gaps.push({
        capabilityKey: cap.capabilityKey,
        gapType: 'runtime_missing',
        detail: 'No executable runtime',
        maturityLevel: cap.maturityLevel,
      });
    }
    if (cap.dimensionScores.behavioralCoverage === 0 && cap.maturityLevel !== 'NOT_PRESENT' && cap.maturityLevel !== 'DECLARED') {
      gaps.push({
        capabilityKey: cap.capabilityKey,
        gapType: 'verification_missing',
        detail: 'No B8 behavioral verification evidence',
        maturityLevel: cap.maturityLevel,
      });
    }
    if (cap.supportingPacks.length === 0 && cap.providedBy.includes('B7') && cap.maturityLevel === 'DECLARED') {
      gaps.push({
        capabilityKey: cap.capabilityKey,
        gapType: 'pack_missing',
        detail: 'No materialized capability pack',
        maturityLevel: cap.maturityLevel,
      });
    }
    if (!cap.productionReadiness && cap.maturityLevel === 'BEHAVIORALLY_VERIFIED') {
      gaps.push({
        capabilityKey: cap.capabilityKey,
        gapType: 'production_not_ready',
        detail: 'Behavior verified but not production ready',
        maturityLevel: cap.maturityLevel,
      });
    }
  }

  return gaps.sort((a, b) => a.capabilityKey.localeCompare(b.capabilityKey));
}

export function gapCountByType(gaps: readonly CapabilityGapEntry[], type: string): number {
  return gaps.filter((g) => g.gapType === type).length;
}

export function unsupportedCapabilities(
  capabilities: readonly UniversalCapabilityDescriptor[],
): UniversalCapabilityDescriptor[] {
  return capabilities.filter((c) => c.supportClassification === 'NOT_IMPLEMENTED');
}

export function unverifiedCapabilities(
  capabilities: readonly UniversalCapabilityDescriptor[],
): UniversalCapabilityDescriptor[] {
  return capabilities.filter(
    (c) => c.behavioralCoverage === 0 && c.maturityLevel !== 'NOT_PRESENT' && c.maturityLevel !== 'DECLARED',
  );
}
