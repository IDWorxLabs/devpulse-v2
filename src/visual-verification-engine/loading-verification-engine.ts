/**
 * Loading verification engine — verifies loading, readiness, error, and empty states.
 */

import type { UiInspectionReport } from '../ui-inspection-engine/types.js';
import type { VerificationResult, VerificationTarget } from './types.js';

let loadingCounter = 0;

export function resetLoadingVerificationCounterForTests(): void {
  loadingCounter = 0;
}

export function verifyLoadingTargets(
  targets: VerificationTarget[],
  inspectionReport: UiInspectionReport | null,
): VerificationResult[] {
  const loadingTargets = targets.filter(
    (t) => t.targetType === 'LOADING_TARGET' || t.targetType === 'ERROR_STATE_TARGET',
  );
  if (!inspectionReport || loadingTargets.length === 0) return [];

  const results: VerificationResult[] = [];

  for (const target of loadingTargets) {
    loadingCounter += 1;
    const loading = inspectionReport.loadingStructures.find(
      (l) => l.structureId === target.targetName || `${l.structureId}-errors` === target.targetName,
    );
    const issueClassifications: string[] = [];

    if (!loading) {
      issueClassifications.push('missing-loading-structure');
    } else if (target.targetType === 'ERROR_STATE_TARGET') {
      if (loading.errorStates.length === 0) issueClassifications.push('error-state-not-exposed');
    } else {
      if (loading.loadingIndicators.length === 0) issueClassifications.push('missing-loading-indicator');
      if (loading.readinessIndicators.length === 0) issueClassifications.push('missing-readiness-indicator');
      if (loading.emptyStates.length === 0) issueClassifications.push('empty-state-not-exposed');
    }

    const status =
      issueClassifications.length === 0
        ? 'VERIFIED'
        : issueClassifications.length <= 1
          ? 'PARTIALLY_VERIFIED'
          : 'VERIFICATION_REQUIRED';

    results.push({
      resultId: `vload-${loadingCounter.toString().padStart(3, '0')}`,
      targetId: target.targetId,
      targetType: target.targetType,
      status,
      observedState: loading
        ? `indicators=${loading.loadingIndicators.length}, readiness=${loading.readinessIndicators.length}, empty=${loading.emptyStates.length}, errors=${loading.errorStates.length}`
        : 'loading structure not found',
      expectedState: 'loading indicators, readiness indicators, and state surfaces exposed',
      issueClassifications,
      verificationOnly: true,
    });
  }

  return results;
}
