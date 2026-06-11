/**
 * Launch Verdict Governance — deterministic rule evaluation.
 */

import type { FounderTestV4ReportWithLaunchCouncilFinalization } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  GOVERNANCE_ABANDONMENT_RISK_PUBLIC,
  GOVERNANCE_ADOPTION_CONFIDENCE_PUBLIC,
  GOVERNANCE_CUSTOMER_VALUE_PUBLIC,
  GOVERNANCE_CUSTOMER_VALUE_PUBLIC_BETA,
  GOVERNANCE_INTERNAL_USE_SCORE,
  GOVERNANCE_REALITY_PROOF_PRIVATE_BETA,
  GOVERNANCE_REALITY_PROOF_PUBLIC,
  GOVERNANCE_RETENTION_PUBLIC,
  GOVERNANCE_RETENTION_PUBLIC_BETA,
  GOVERNANCE_TRUST_PRIVATE_BETA,
  GOVERNANCE_TRUST_PUBLIC,
  GOVERNANCE_USER_SUCCESS_PUBLIC,
  GOVERNANCE_USER_SUCCESS_PUBLIC_BETA,
  MAX_GOVERNANCE_RULES,
} from './launch-verdict-governance-bounds.js';
import type {
  FinalLaunchVerdict,
  GovernanceRuleEvaluation,
} from './launch-verdict-governance-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function rule(
  ruleId: string,
  group: GovernanceRuleEvaluation['group'],
  description: string,
  satisfied: boolean,
  detail: string,
): GovernanceRuleEvaluation {
  return {
    ruleId,
    group,
    description,
    outcome: satisfied ? 'SATISFIED' : 'FAILED',
    detail,
  };
}

export function detectImmediateBlockingAuthorities(
  report: FounderTestV4ReportWithLaunchCouncilFinalization,
): string[] {
  const blockers: string[] = [];
  if (report.trustAuthority.blocksLaunchReadiness) blockers.push('Trust Authority');
  if (report.realityProofAuthority.blocksLaunchReadiness) blockers.push('Reality-Proof Authority');
  if (report.realUserRealityAuthority.blocksLaunchReadiness) {
    blockers.push('Real User Reality Authority');
  }
  if (report.launchReadinessAuthority.readinessState === 'BLOCKED') {
    blockers.push('Launch Readiness Authority');
  }
  if (report.adoptionPredictionAuthority.blocksLaunchReadiness) {
    blockers.push('Adoption Prediction Authority');
  }
  return blockers;
}

export function evaluateGovernanceRules(
  report: FounderTestV4ReportWithLaunchCouncilFinalization,
): GovernanceRuleEvaluation[] {
  const finalization = report.launchCouncilFinalization;
  const reality = report.realityProofAuthority;
  const realUser = report.realUserRealityAuthority;
  const trust = report.trustAuthority;
  const promise = report.promiseFulfillment;
  const userSuccess = report.userSuccessAuthority;
  const customerValue = report.customerValueAuthority;
  const adoption = report.adoptionPredictionAuthority;
  const readiness = report.launchReadinessAuthority;

  const rules: GovernanceRuleEvaluation[] = [
    rule(
      'A1',
      'REALITY',
      'Public launch requires reality proof score >= 80',
      reality.realityProofScore >= GOVERNANCE_REALITY_PROOF_PUBLIC,
      `realityProofScore=${reality.realityProofScore}`,
    ),
    rule(
      'A2',
      'REALITY',
      'Reality-Proof Authority must not block launch',
      !reality.blocksLaunchReadiness,
      `blocks=${reality.blocksLaunchReadiness}`,
    ),
    rule(
      'A3',
      'REALITY',
      'Public launch requires real user evidence',
      realUser.realUserEvidenceCount > 0 && !realUser.noRealUserEvidence,
      `realUserEvidenceCount=${realUser.realUserEvidenceCount}; noRealUser=${realUser.noRealUserEvidence}`,
    ),
    rule(
      'A4',
      'REALITY',
      'Private beta requires reality proof score >= 55',
      reality.realityProofScore >= GOVERNANCE_REALITY_PROOF_PRIVATE_BETA,
      `realityProofScore=${reality.realityProofScore}`,
    ),
    rule(
      'B1',
      'TRUST',
      'No critical trust failures for public launch',
      trust.criticalTrustFailures === 0,
      `criticalTrustFailures=${trust.criticalTrustFailures}`,
    ),
    rule(
      'B2',
      'TRUST',
      'No contradicted promises for public launch',
      promise.contradictedCount === 0,
      `contradictedCount=${promise.contradictedCount}`,
    ),
    rule(
      'B3',
      'TRUST',
      'Public launch requires trust score >= 75',
      trust.trustScore >= GOVERNANCE_TRUST_PUBLIC && !trust.blocksLaunchReadiness,
      `trustScore=${trust.trustScore}; blocks=${trust.blocksLaunchReadiness}`,
    ),
    rule(
      'B4',
      'TRUST',
      'Private beta requires trust score >= 55',
      trust.trustScore >= GOVERNANCE_TRUST_PRIVATE_BETA,
      `trustScore=${trust.trustScore}`,
    ),
    rule(
      'C1',
      'USER',
      'Public beta requires user success >= 60',
      userSuccess.userSuccessScore >= GOVERNANCE_USER_SUCCESS_PUBLIC_BETA &&
        !userSuccess.blocksLaunchReadiness,
      `userSuccessScore=${userSuccess.userSuccessScore}`,
    ),
    rule(
      'C2',
      'USER',
      'Public beta requires customer value >= 60',
      customerValue.customerValueScore >= GOVERNANCE_CUSTOMER_VALUE_PUBLIC_BETA &&
        !customerValue.blocksLaunchReadiness,
      `customerValueScore=${customerValue.customerValueScore}`,
    ),
    rule(
      'C3',
      'USER',
      'Public beta requires retention prediction >= 60',
      adoption.retentionPredictionScore >= GOVERNANCE_RETENTION_PUBLIC_BETA,
      `retentionPredictionScore=${adoption.retentionPredictionScore}`,
    ),
    rule(
      'C4',
      'USER',
      'Public launch requires user success >= 70',
      userSuccess.userSuccessScore >= GOVERNANCE_USER_SUCCESS_PUBLIC,
      `userSuccessScore=${userSuccess.userSuccessScore}`,
    ),
    rule(
      'C5',
      'USER',
      'Public launch requires customer value >= 70',
      customerValue.customerValueScore >= GOVERNANCE_CUSTOMER_VALUE_PUBLIC,
      `customerValueScore=${customerValue.customerValueScore}`,
    ),
    rule(
      'C6',
      'USER',
      'Public launch requires retention prediction >= 65',
      adoption.retentionPredictionScore >= GOVERNANCE_RETENTION_PUBLIC,
      `retentionPredictionScore=${adoption.retentionPredictionScore}`,
    ),
    rule(
      'C7',
      'USER',
      'Public launch requires adoption evidence confidence >= 55',
      adoption.evidenceConfidenceScore >= GOVERNANCE_ADOPTION_CONFIDENCE_PUBLIC,
      `evidenceConfidenceScore=${adoption.evidenceConfidenceScore}`,
    ),
    rule(
      'C8',
      'USER',
      'Public launch requires abandonment risk <= 70',
      adoption.abandonmentRiskScore <= GOVERNANCE_ABANDONMENT_RISK_PUBLIC,
      `abandonmentRiskScore=${adoption.abandonmentRiskScore}`,
    ),
    rule(
      'D1',
      'READINESS',
      'Council position BLOCKED forces governance BLOCKED',
      finalization.councilPosition !== 'BLOCKED',
      `councilPosition=${finalization.councilPosition}`,
    ),
    rule(
      'D2',
      'READINESS',
      'Council position UNKNOWN forces governance UNKNOWN eligibility cap',
      finalization.councilPosition !== 'UNKNOWN',
      `councilPosition=${finalization.councilPosition}`,
    ),
    rule(
      'D3',
      'READINESS',
      'Launch Readiness must not be in BLOCKED state for public launch',
      readiness.readinessState !== 'BLOCKED',
      `readinessState=${readiness.readinessState}`,
    ),
    rule(
      'D4',
      'READINESS',
      'Launch confidence supports internal use (>= 50)',
      readiness.launchConfidenceScore >= GOVERNANCE_INTERNAL_USE_SCORE,
      `launchConfidenceScore=${readiness.launchConfidenceScore}`,
    ),
  ];

  return rules.slice(0, MAX_GOVERNANCE_RULES);
}

function rulesSatisfied(evaluations: GovernanceRuleEvaluation[], ruleIds: readonly string[]): boolean {
  return ruleIds.every((id) => evaluations.find((entry) => entry.ruleId === id)?.outcome === 'SATISFIED');
}

export function deriveVerdictEligibility(
  report: FounderTestV4ReportWithLaunchCouncilFinalization,
  evaluations: GovernanceRuleEvaluation[],
): FinalLaunchVerdict {
  const finalization = report.launchCouncilFinalization;

  if (finalization.councilPosition === 'UNKNOWN') {
    return 'UNKNOWN';
  }

  if (rulesSatisfied(evaluations, ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C4', 'C5', 'C6', 'C7', 'C8', 'D3'])) {
    return 'READY_FOR_PUBLIC_LAUNCH';
  }

  if (
    rulesSatisfied(evaluations, ['A4', 'B4', 'C1', 'C2', 'C3']) &&
    finalization.councilPosition !== 'NOT_READY'
  ) {
    return 'READY_FOR_PUBLIC_BETA';
  }

  if (rulesSatisfied(evaluations, ['A4', 'B4', 'D4']) && finalization.councilPosition !== 'NOT_READY') {
    return 'READY_FOR_PRIVATE_BETA';
  }

  if (rulesSatisfied(evaluations, ['D4'])) {
    return 'READY_FOR_INTERNAL_USE';
  }

  return 'NOT_READY';
}

export function deriveFinalLaunchVerdict(input: {
  report: FounderTestV4ReportWithLaunchCouncilFinalization;
  evaluations: GovernanceRuleEvaluation[];
  blockingAuthorities: string[];
  eligibility: FinalLaunchVerdict;
}): FinalLaunchVerdict {
  const { report, evaluations, blockingAuthorities, eligibility } = input;
  const finalization = report.launchCouncilFinalization;

  if (blockingAuthorities.length > 0) {
    return 'BLOCKED';
  }

  if (finalization.councilPosition === 'BLOCKED') {
    return 'BLOCKED';
  }

  if (finalization.councilPosition === 'UNKNOWN') {
    return 'UNKNOWN';
  }

  if (!rulesSatisfied(evaluations, ['D1', 'D3'])) {
    return 'BLOCKED';
  }

  return eligibility;
}

export function collectRequiredEvidenceMissing(
  report: FounderTestV4ReportWithLaunchCouncilFinalization,
  evaluations: GovernanceRuleEvaluation[],
  finalVerdict: FinalLaunchVerdict,
): string[] {
  const missing: string[] = [];
  const failedPublicRules = evaluations.filter(
    (entry) => entry.outcome === 'FAILED' && ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C4', 'C5', 'C6', 'C7', 'C8'].includes(entry.ruleId),
  );

  for (const failed of failedPublicRules) {
    missing.push(`${failed.ruleId}: ${failed.description} — ${failed.detail}`);
  }

  if (report.realUserRealityAuthority.noRealUserEvidence) {
    missing.push('Real User Reality evidence is missing — public launch cannot be earned.');
  }
  if (report.adoptionPredictionAuthority.evidenceConfidenceScore < GOVERNANCE_ADOPTION_CONFIDENCE_PUBLIC) {
    missing.push(
      `Adoption prediction evidence confidence (${report.adoptionPredictionAuthority.evidenceConfidenceScore}/100) is below public launch threshold.`,
    );
  }
  if (finalVerdict !== 'READY_FOR_PUBLIC_LAUNCH' && failedPublicRules.length > 0) {
    missing.push('Public launch evidence requirements are not fully satisfied.');
  }

  return [...new Set(missing)];
}

export function calculateGovernanceScore(evaluations: GovernanceRuleEvaluation[]): number {
  const evaluated = evaluations.filter((entry) => entry.outcome !== 'SKIPPED');
  if (evaluated.length === 0) return 0;
  const satisfied = evaluated.filter((entry) => entry.outcome === 'SATISFIED').length;
  return clamp((satisfied / evaluated.length) * 100);
}

export function calculateGovernanceConfidence(
  report: FounderTestV4ReportWithLaunchCouncilFinalization,
): number {
  const finalization = report.launchCouncilFinalization;
  const realUserEvidence = report.realUserRealityAuthority.noRealUserEvidence
    ? 25
    : clamp(50 + report.realUserRealityAuthority.realUserEvidenceCount * 5);

  return clamp(
    finalization.councilConfidence * 0.3 +
      report.realityProofAuthority.realityProofScore * 0.25 +
      report.adoptionPredictionAuthority.evidenceConfidenceScore * 0.25 +
      realUserEvidence * 0.2,
  );
}

export function isBlockingRule(rule: GovernanceRuleEvaluation): boolean {
  return (
    rule.outcome === 'FAILED' &&
    ['A2', 'B1', 'B2', 'D1', 'D3'].includes(rule.ruleId)
  );
}

export function countRuleOutcomes(evaluations: GovernanceRuleEvaluation[]): {
  satisfiedRuleCount: number;
  failedRuleCount: number;
  blockingRuleCount: number;
} {
  const satisfiedRuleCount = evaluations.filter((entry) => entry.outcome === 'SATISFIED').length;
  const failedRuleCount = evaluations.filter((entry) => entry.outcome === 'FAILED').length;
  const blockingRuleCount = evaluations.filter((entry) => isBlockingRule(entry)).length;
  return { satisfiedRuleCount, failedRuleCount, blockingRuleCount };
}
