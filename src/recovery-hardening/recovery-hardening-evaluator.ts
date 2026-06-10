/**
 * Recovery Hardening — recovery hardening evaluator.
 */

import type {
  RecoveryHardeningEvaluation,
  UnifiedRecoveryHardeningAuthority,
} from './recovery-hardening-types.js';
import { getCachedRecoveryEvaluation, setCachedRecoveryEvaluation } from './recovery-hardening-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<RecoveryHardeningEvaluation['state'], number> = {
  READY: 95,
  ACCEPTABLE: 80,
  WATCH: 65,
  DEGRADED: 45,
  UNSAFE: 25,
  BLOCKED: 0,
};

export function evaluateRecoveryHardening(
  authority: UnifiedRecoveryHardeningAuthority,
): RecoveryHardeningEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.recoveryScore,
    authority.state,
    authority.riskLevel,
  ].join('|');

  const cached = getCachedRecoveryEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: RecoveryHardeningEvaluation = {
    recoveryScore: authority.recoveryScore,
    rollbackReadinessScore: authority.rollbackReadinessScore,
    containmentScore: authority.containmentScore,
    escalationReadinessScore: authority.escalationReadinessScore,
    resetReadinessScore: authority.resetReadinessScore,
    disasterRecoveryScore: authority.disasterRecoveryScore,
    state: authority.state,
    riskLevel: authority.riskLevel,
    confidence: authority.confidence,
    hardeningReadiness: Math.round((STATE_READINESS[authority.state] + authority.confidence) / 2),
  };

  setCachedRecoveryEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetRecoveryHardeningEvaluatorForTests(): void {
  evaluationCount = 0;
}
