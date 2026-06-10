/**
 * Recovery Hardening — recovery authority builder.
 */

import type {
  DisasterRecoveryReadinessAnalysis,
  EscalationReadinessAnalysis,
  FailureContainmentAnalysis,
  RecoveryHardeningInput,
  RecoveryRiskLevel,
  RecoveryState,
  ResetReadinessAnalysis,
  RollbackReadinessAnalysis,
  UnifiedRecoveryHardeningAuthority,
} from './recovery-hardening-types.js';
import { resolveRecoveryRiskLevel, resolveRecoveryState } from './recovery-hardening-types.js';
import { getCachedRecoveryAuthority, setCachedRecoveryAuthority } from './recovery-hardening-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedRecoveryHardeningAuthority(
  requestId: string,
  rollback: RollbackReadinessAnalysis,
  containment: FailureContainmentAnalysis,
  reset: ResetReadinessAnalysis,
  escalation: EscalationReadinessAnalysis,
  disaster: DisasterRecoveryReadinessAnalysis,
  input: RecoveryHardeningInput,
): UnifiedRecoveryHardeningAuthority {
  const cacheKey = [
    requestId,
    rollback.rollbackReadinessScore,
    containment.containmentScore,
    escalation.escalationReadinessScore,
    disaster.disasterRecoveryScore,
  ].join('|');

  const cached = getCachedRecoveryAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const reliabilityFactor = input.reliabilityScore ?? 75;
  const performanceFactor = input.performanceScore ?? 75;
  const securityFactor = input.securityScore ?? 75;
  const privacyFactor = input.privacyScore ?? 75;
  const trustFactor = input.trustScore ?? 75;

  const recoveryScore = Math.max(0, Math.min(100, Math.round(
    rollback.rollbackReadinessScore * 0.25
      + containment.containmentScore * 0.2
      + reset.resetReadinessScore * 0.15
      + escalation.escalationReadinessScore * 0.2
      + disaster.disasterRecoveryScore * 0.2,
  )));

  const adjustedScore = Math.max(0, Math.min(100, Math.round(
    recoveryScore * 0.6
      + reliabilityFactor * 0.1
      + performanceFactor * 0.05
      + securityFactor * 0.1
      + privacyFactor * 0.05
      + trustFactor * 0.1,
  )));

  const riskLevel: RecoveryRiskLevel = resolveRecoveryRiskLevel(adjustedScore);
  const state: RecoveryState = resolveRecoveryState(adjustedScore, input.governanceBlocked);
  const confidence = Math.min(100, Math.round(
    (adjustedScore + rollback.rollbackReadinessScore + containment.containmentScore) / 3,
  ));

  const authority: UnifiedRecoveryHardeningAuthority = {
    authorityId: `recovery-hardening-authority-${authorityCounter}`,
    recoveryScore: adjustedScore,
    rollbackReadinessScore: rollback.rollbackReadinessScore,
    containmentScore: containment.containmentScore,
    escalationReadinessScore: escalation.escalationReadinessScore,
    resetReadinessScore: reset.resetReadinessScore,
    disasterRecoveryScore: disaster.disasterRecoveryScore,
    riskLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedRecoveryAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetRecoveryAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
