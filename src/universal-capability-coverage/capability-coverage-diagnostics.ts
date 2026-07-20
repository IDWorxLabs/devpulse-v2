/**
 * Universal Capability Coverage Intelligence V1 — diagnostics.
 */

import type { UniversalCapabilityDescriptor } from './universal-capability-coverage-types.js';
import { rejectFalseCoverage } from './capability-coverage-engine.js';
import type { CapabilityGapEntry } from './universal-capability-coverage-types.js';

export type CapabilityDiagnosisCode =
  | 'capability_missing'
  | 'capability_partial'
  | 'capability_unverified'
  | 'runtime_missing'
  | 'pack_missing'
  | 'dependency_blocked'
  | 'verification_missing'
  | 'production_not_ready'
  | 'coverage_regression'
  | 'false_coverage_detected';

export function diagnoseCapabilityCoverage(
  capabilities: readonly UniversalCapabilityDescriptor[],
  gaps: readonly CapabilityGapEntry[],
): readonly CapabilityDiagnosisCode[] {
  const codes = new Set<CapabilityDiagnosisCode>();

  for (const gap of gaps) {
    if (gap.gapType === 'missing_capability') codes.add('capability_missing');
    if (gap.gapType === 'capability_partial') codes.add('capability_partial');
    if (gap.gapType === 'runtime_missing') codes.add('runtime_missing');
    if (gap.gapType === 'pack_missing') codes.add('pack_missing');
    if (gap.gapType === 'capability_blocked') codes.add('dependency_blocked');
    if (gap.gapType === 'verification_missing') codes.add('verification_missing');
    if (gap.gapType === 'production_not_ready') codes.add('production_not_ready');
  }

  for (const cap of capabilities) {
    if (cap.behavioralCoverage === 0 && cap.maturityLevel !== 'NOT_PRESENT' && cap.maturityLevel !== 'DECLARED') {
      codes.add('capability_unverified');
    }
    if (rejectFalseCoverage(cap)) codes.add('false_coverage_detected');
  }

  return [...codes].sort();
}

export function detectFalseCoverage(capabilities: readonly UniversalCapabilityDescriptor[]): string[] {
  return capabilities.filter(rejectFalseCoverage).map((c) => `false_coverage:${c.capabilityKey}`);
}
