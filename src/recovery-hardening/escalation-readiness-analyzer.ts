/**
 * Recovery Hardening — escalation readiness analyzer.
 */

import type { EscalationReadinessAnalysis, RecoveryHardeningInput } from './recovery-hardening-types.js';
import { resolveRecoveryRiskLevel } from './recovery-hardening-types.js';
import { getCachedEscalationAnalysis, setCachedEscalationAnalysis } from './recovery-hardening-cache.js';

let escalationAnalysisCount = 0;

export function analyzeEscalationReadiness(input: RecoveryHardeningInput): EscalationReadinessAnalysis {
  const cacheKey = [
    input.missingCapabilityEscalationWeak,
    input.threeFailureEscalationRuleWeak,
    input.trustDegradationEscalationWeak,
    input.operatorFeedEscalationWeak,
  ].join('|');

  const cached = getCachedEscalationAnalysis(cacheKey);
  if (cached) return cached;

  escalationAnalysisCount += 1;
  const escalationWarnings: string[] = [];
  const escalationGaps: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingCapabilityEscalationWeak, 'missing_capability_escalation_weak', 'missing_capability_escalation'],
    [input.selfEvolutionGovernanceWeak, 'self_evolution_governance_weak', 'self_evolution_governance'],
    [input.threeFailureEscalationRuleWeak, 'three_failure_escalation_rule_weak', 'three_failure_escalation_rule'],
    [input.founderReviewEscalationWeak, 'founder_review_escalation_weak', 'founder_review_escalation'],
    [input.trustDegradationEscalationWeak, 'trust_degradation_escalation_weak', 'trust_degradation_escalation'],
    [input.securityPrivacyEscalationWeak, 'security_privacy_escalation_weak', 'security_privacy_escalation'],
    [input.recoveryRecommendationRoutingWeak, 'recovery_recommendation_routing_weak', 'recovery_recommendation_routing'],
    [input.notificationEscalationWeak, 'notification_escalation_weak', 'notification_escalation'],
    [input.operatorFeedEscalationWeak, 'operator_feed_escalation_weak', 'operator_feed_escalation'],
  ];

  for (const [flag, warning, gap] of checks) {
    if (flag === true) {
      escalationWarnings.push(warning);
      escalationGaps.push(gap);
      penalty += 8;
    }
  }

  const escalationReadinessScore = Math.max(0, Math.min(100, Math.round(90 - penalty)));

  const result: EscalationReadinessAnalysis = {
    escalationReadinessScore,
    escalationRiskLevel: resolveRecoveryRiskLevel(escalationReadinessScore),
    escalationWarnings,
    escalationGaps,
  };

  setCachedEscalationAnalysis(cacheKey, result);
  return result;
}

export function getEscalationAnalysisCount(): number {
  return escalationAnalysisCount;
}

export function resetEscalationReadinessAnalyzerForTests(): void {
  escalationAnalysisCount = 0;
}
