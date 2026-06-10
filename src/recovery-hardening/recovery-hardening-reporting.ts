/**
 * Recovery Hardening — reporting.
 */

import type {
  RecoveryHardeningEvaluation,
  RecoveryHardeningRecord,
  RecoveryHardeningReport,
} from './recovery-hardening-types.js';
import { getRecoveryHardeningCacheStats } from './recovery-hardening-cache.js';
import { getRecoveryHardeningHistorySize } from './recovery-hardening-history.js';

let reportCount = 0;

export function generateRecoveryHardeningReport(
  record: RecoveryHardeningRecord,
  evaluation: RecoveryHardeningEvaluation,
  rollbackGaps: string[],
  containmentGaps: string[],
  resetGaps: string[],
  escalationGaps: string[],
  disasterRecoveryGaps: string[],
  missingSignals: string[],
): RecoveryHardeningReport {
  reportCount += 1;
  const cache = getRecoveryHardeningCacheStats();
  const recommendations: string[] = [];

  if (rollbackGaps.length > 0) recommendations.push('Strengthen git checkpoint and rollback guidance before risky changes');
  if (containmentGaps.length > 0) recommendations.push('Improve failure containment boundaries across workspaces and execution paths');
  if (resetGaps.length > 0) recommendations.push('Ensure reset functions exist for modules, caches, histories, and registries');
  if (escalationGaps.length > 0) recommendations.push('Prepare escalation routing for trust, security, and recovery failures');
  if (disasterRecoveryGaps.length > 0) recommendations.push('Define disaster recovery checkpoint, backup, and incident response strategy');
  if (missingSignals.length > 0) recommendations.push('Collect missing recovery signals before expansion');
  if (evaluation.state === 'READY' || evaluation.state === 'ACCEPTABLE') {
    recommendations.push('Continue monitoring recovery readiness');
  } else {
    recommendations.push('Require recovery review before expansion');
  }

  return {
    recoveryScore: record.recoveryScore,
    rollbackReadinessScore: record.rollbackReadinessScore,
    containmentScore: record.containmentScore,
    resetReadinessScore: evaluation.resetReadinessScore,
    escalationReadinessScore: record.escalationReadinessScore,
    disasterRecoveryScore: evaluation.disasterRecoveryScore,
    riskLevel: record.riskLevel,
    state: record.state,
    confidence: record.confidence,
    rollbackGaps: [...rollbackGaps],
    containmentGaps: [...containmentGaps],
    resetGaps: [...resetGaps],
    escalationGaps: [...escalationGaps],
    disasterRecoveryGaps: [...disasterRecoveryGaps],
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getRecoveryHardeningHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetRecoveryHardeningReportingForTests(): void {
  reportCount = 0;
}
