/**
 * Self Evolution Governance — readiness evaluator with stall governance.
 */

import type {
  GovernanceBoundaryValidation,
  GovernanceReadinessEvaluation,
  GovernanceRiskEvaluation,
  GovernanceRollbackValidation,
  GovernanceSelfModificationValidation,
  GovernanceStallValidation,
  GovernanceTrustEvaluation,
  SelfEvolutionGovernanceInput,
} from './self-evolution-governance-types.js';
import { getCachedReadinessEvaluation, setCachedReadinessEvaluation } from './governance-cache.js';

let readinessEvaluationCount = 0;

/** Stall governance — integrates with Phase 21.1 escalation and 21.5 verification. */
export function validateGovernanceStallProtection(input: SelfEvolutionGovernanceInput): GovernanceStallValidation {
  const progressMonitoringPresent = input.hasProgressMonitoring === true
    || (input.signals ?? []).includes('progress:monitoring')
    || (input.signals ?? []).includes('escalation:integrated');

  const stallHandlingPresent = input.hasStallHandling === true
    || (input.signals ?? []).includes('stall:handling')
    || (input.signals ?? []).includes('escalation:integrated');

  const bottleneckRecoveryPresent = input.hasBottleneckRecovery === true
    || (input.signals ?? []).includes('bottleneck:recovery')
    || (input.signals ?? []).includes('escalation:integrated');

  const escalationPathPresent = input.hasEscalationPath === true
    || (input.signals ?? []).includes('escalation:path')
    || (input.signals ?? []).includes('escalation:integrated');

  const complete = progressMonitoringPresent && stallHandlingPresent
    && bottleneckRecoveryPresent && escalationPathPresent;

  return {
    progressMonitoringPresent,
    stallHandlingPresent,
    bottleneckRecoveryPresent,
    escalationPathPresent,
    complete,
  };
}

export function evaluateGovernanceReadiness(
  input: SelfEvolutionGovernanceInput,
  boundaries: GovernanceBoundaryValidation,
  risk: GovernanceRiskEvaluation,
  trust: GovernanceTrustEvaluation,
  rollback: GovernanceRollbackValidation,
  selfModification: GovernanceSelfModificationValidation,
  stall: GovernanceStallValidation,
): GovernanceReadinessEvaluation {
  const cacheKey = [
    input.evolutionRequest,
    boundaries.compliant,
    risk.riskLevel,
    trust.trustScore,
    rollback.valid,
    stall.complete,
  ].join('|');

  const cached = getCachedReadinessEvaluation(cacheKey);
  if (cached) return cached;

  readinessEvaluationCount += 1;

  const reasons: string[] = [];
  let state: GovernanceReadinessEvaluation['state'] = 'READY';
  let canProceed = true;

  const readinessScore = Math.round(
    (trust.trustScore + (100 - risk.riskScore) + (boundaries.compliant ? 100 : 0) + (stall.complete ? 100 : 50)) / 4,
  );

  if (!boundaries.compliant || risk.riskLevel === 'CRITICAL' || selfModification.state === 'SELF_MODIFICATION_BLOCKED' && input.signals?.some((s) => s.startsWith('selfmod:'))) {
    if (!boundaries.compliant) reasons.push('boundary_violation');
    if (risk.riskLevel === 'CRITICAL') reasons.push('critical_risk');
    if (input.signals?.some((s) => s.startsWith('selfmod:'))) reasons.push('self_modification_attempt');
    state = 'BLOCKED';
    canProceed = false;
  } else if (!stall.complete || !rollback.valid || trust.trustScore < 60) {
    state = 'REQUIRES_REVIEW';
    canProceed = false;
    if (!stall.complete) reasons.push('missing_stall_governance');
    if (!rollback.valid) reasons.push('rollback_review');
    if (trust.trustScore < 60) reasons.push('trust_review');
  }

  const result: GovernanceReadinessEvaluation = {
    state,
    readinessScore,
    canProceed,
    reasons,
  };

  setCachedReadinessEvaluation(cacheKey, result);
  return result;
}

export function getReadinessEvaluationCount(): number {
  return readinessEvaluationCount;
}

export function resetReadinessEvaluatorForTests(): void {
  readinessEvaluationCount = 0;
}
