/**
 * Universal Production Readiness Verification V1 — regression detection.
 */

import type { UniversalProductionReadinessDescriptor } from './universal-production-readiness-types.js';

export function detectReadinessRegression(
  previous: UniversalProductionReadinessDescriptor | null,
  current: UniversalProductionReadinessDescriptor,
): string[] {
  if (!previous) return [];
  const regressions: string[] = [];
  if (previous.readinessVerdict === 'PRODUCTION_READY' && current.readinessVerdict !== 'PRODUCTION_READY') {
    regressions.push('production_readiness_regression');
  }
  if (current.productionReadinessScore < previous.productionReadinessScore) {
    regressions.push(`readiness_score_decreased:${previous.productionReadinessScore}->${current.productionReadinessScore}`);
  }
  if (current.behavioralReadinessScore < previous.behavioralReadinessScore) {
    regressions.push('behavioral_readiness_regression');
  }
  if (current.capabilityReadinessScore < previous.capabilityReadinessScore) {
    regressions.push('capability_coverage_regression');
  }
  return regressions;
}

export function compareReadinessDecisions(
  a: UniversalProductionReadinessDescriptor,
  b: UniversalProductionReadinessDescriptor,
): boolean {
  return a.fingerprint === b.fingerprint && a.readinessVerdict === b.readinessVerdict;
}
