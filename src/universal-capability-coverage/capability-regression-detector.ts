/**
 * Universal Capability Coverage Intelligence V1 — coverage regression detection.
 */

import type {
  CapabilityCoverageRegression,
  CapabilityMaturityLevel,
  UniversalCapabilityDescriptor,
} from './universal-capability-coverage-types.js';
import { maturityIndex } from './capability-maturity-classifier.js';

export function detectCoverageRegressions(
  previous: readonly UniversalCapabilityDescriptor[],
  current: readonly UniversalCapabilityDescriptor[],
): CapabilityCoverageRegression[] {
  const regressions: CapabilityCoverageRegression[] = [];
  const prevByKey = new Map(previous.map((c) => [c.capabilityKey, c]));

  for (const curr of current) {
    const prev = prevByKey.get(curr.capabilityKey);
    if (!prev) continue;

    if (maturityIndex(curr.maturityLevel) < maturityIndex(prev.maturityLevel)) {
      regressions.push({
        capabilityKey: curr.capabilityKey,
        regressionType: 'capability_regression',
        previousMaturity: prev.maturityLevel,
        currentMaturity: curr.maturityLevel,
        detail: `Maturity regressed ${prev.maturityLevel} → ${curr.maturityLevel}`,
      });
    }
    if (curr.behavioralCoverage < prev.behavioralCoverage) {
      regressions.push({
        capabilityKey: curr.capabilityKey,
        regressionType: 'verification_regression',
        previousMaturity: prev.maturityLevel,
        currentMaturity: curr.maturityLevel,
        detail: `Behavioral coverage ${prev.behavioralCoverage}% → ${curr.behavioralCoverage}%`,
      });
    }
    if (curr.dimensionScores.runtimeCoverage < prev.dimensionScores.runtimeCoverage) {
      regressions.push({
        capabilityKey: curr.capabilityKey,
        regressionType: 'runtime_regression',
        previousMaturity: prev.maturityLevel,
        currentMaturity: curr.maturityLevel,
        detail: 'Runtime coverage decreased',
      });
    }
    if (prev.productionReadiness && !curr.productionReadiness) {
      regressions.push({
        capabilityKey: curr.capabilityKey,
        regressionType: 'production_readiness_regression',
        previousMaturity: prev.maturityLevel,
        currentMaturity: curr.maturityLevel,
        detail: 'Production readiness lost',
      });
    }
    if (prev.supportingPacks.length > 0 && curr.supportingPacks.length === 0) {
      regressions.push({
        capabilityKey: curr.capabilityKey,
        regressionType: 'pack_regression',
        previousMaturity: prev.maturityLevel,
        currentMaturity: curr.maturityLevel,
        detail: 'Pack support removed',
      });
    }
  }

  for (const prev of previous) {
    if (!current.some((c) => c.capabilityKey === prev.capabilityKey)) {
      regressions.push({
        capabilityKey: prev.capabilityKey,
        regressionType: 'capability_loss',
        previousMaturity: prev.maturityLevel,
        currentMaturity: 'NOT_PRESENT' as CapabilityMaturityLevel,
        detail: 'Capability removed from snapshot',
      });
    }
  }

  return regressions;
}

export function coverageSilentlyDecreased(
  previous: readonly UniversalCapabilityDescriptor[],
  current: readonly UniversalCapabilityDescriptor[],
): boolean {
  return detectCoverageRegressions(previous, current).length > 0;
}
