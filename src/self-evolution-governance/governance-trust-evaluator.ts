/**
 * Self Evolution Governance — trust evaluator.
 */

import type { GovernanceTrustEvaluation, SelfEvolutionGovernanceInput } from './self-evolution-governance-types.js';
import { getCachedTrustEvaluation, setCachedTrustEvaluation } from './governance-cache.js';

let trustReviewCount = 0;

export function evaluateGovernanceTrust(input: SelfEvolutionGovernanceInput): GovernanceTrustEvaluation {
  const cacheKey = [input.evolutionRequest, input.trustImpact, input.verificationDecision ?? ''].join('|');
  const cached = getCachedTrustEvaluation(cacheKey);
  if (cached) return cached;

  trustReviewCount += 1;

  const trustFindings: string[] = [];
  let trustScore = 80;

  const verificationSatisfied = input.verificationDecision === 'VERIFIED'
    || (input.signals?.includes('verification:satisfied') ?? false);
  const rolloutSatisfied = input.signals?.includes('rollout:satisfied') ?? true;
  const rollbackSatisfied = (input.rollbackCheckpoints?.length ?? 0) > 0
    && (input.recoveryPath?.length ?? 0) > 0;

  if (!verificationSatisfied) { trustScore -= 20; trustFindings.push('verification_not_satisfied'); }
  if (!rolloutSatisfied) { trustScore -= 10; trustFindings.push('rollout_not_satisfied'); }
  if (!rollbackSatisfied) { trustScore -= 15; trustFindings.push('rollback_not_satisfied'); }
  if (input.trustImpact) { trustScore -= 20; trustFindings.push('trust_impact'); }
  if (input.world2Impact) { trustScore -= 15; trustFindings.push('world2_governance'); }

  const result: GovernanceTrustEvaluation = {
    trustScore: Math.max(0, Math.min(100, trustScore)),
    trustFindings,
    verificationSatisfied,
    rolloutSatisfied,
    rollbackSatisfied,
  };

  setCachedTrustEvaluation(cacheKey, result);
  return result;
}

export function getTrustReviewCount(): number {
  return trustReviewCount;
}

export function resetTrustEvaluatorForTests(): void {
  trustReviewCount = 0;
}
