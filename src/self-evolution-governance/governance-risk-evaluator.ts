/**
 * Self Evolution Governance — risk evaluator.
 */

import type { GovernanceRiskEvaluation, SelfEvolutionGovernanceInput } from './self-evolution-governance-types.js';
import { getCachedRiskEvaluation, setCachedRiskEvaluation } from './governance-cache.js';

let riskReviewCount = 0;

export function evaluateGovernanceRisk(input: SelfEvolutionGovernanceInput): GovernanceRiskEvaluation {
  const cacheKey = [input.evolutionRequest, input.riskScore ?? 0, input.trustImpact, input.world2Impact].join('|');
  const cached = getCachedRiskEvaluation(cacheKey);
  if (cached) return cached;

  riskReviewCount += 1;

  const factors: string[] = [];
  let riskScore = input.riskScore ?? 20;

  if (input.trustImpact) { riskScore += 15; factors.push('trust_impact'); }
  if (input.world2Impact) { riskScore += 20; factors.push('world2_impact'); }
  if (input.signals?.includes('architecture:critical')) { riskScore += 15; factors.push('architecture_impact'); }
  if (input.signals?.includes('dependency:high')) { riskScore += 10; factors.push('dependency_impact'); }
  riskScore = Math.min(100, Math.round(riskScore));
  if (riskScore >= 50) factors.push('blast_radius');

  let riskLevel: GovernanceRiskEvaluation['riskLevel'] = 'LOW';
  if (riskScore >= 85) riskLevel = 'CRITICAL';
  else if (riskScore >= 65) riskLevel = 'HIGH';
  else if (riskScore >= 35) riskLevel = 'MEDIUM';

  const result: GovernanceRiskEvaluation = { riskLevel, riskScore, factors: [...new Set(factors)] };
  setCachedRiskEvaluation(cacheKey, result);
  return result;
}

export function getRiskReviewCount(): number {
  return riskReviewCount;
}

export function resetRiskEvaluatorForTests(): void {
  riskReviewCount = 0;
}
