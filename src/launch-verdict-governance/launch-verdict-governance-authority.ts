/**
 * Launch Verdict Governance — final launch verdict permission layer.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithLaunchCouncilFinalization } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  LAUNCH_VERDICT_GOVERNANCE_CACHE_KEY_PREFIX,
  MAX_BLOCKING_AUTHORITIES,
  MAX_GOVERNANCE_REASONING,
  MAX_GOVERNANCE_RECOMMENDATIONS,
  MAX_MISSING_EVIDENCE,
} from './launch-verdict-governance-bounds.js';
import { recordLaunchVerdictGovernanceAssessment } from './launch-verdict-governance-history.js';
import { buildLaunchVerdictGovernanceReportMarkdown } from './launch-verdict-governance-report-builder.js';
import {
  calculateGovernanceConfidence,
  calculateGovernanceScore,
  collectRequiredEvidenceMissing,
  countRuleOutcomes,
  deriveFinalLaunchVerdict,
  deriveVerdictEligibility,
  detectImmediateBlockingAuthorities,
  evaluateGovernanceRules,
} from './launch-verdict-governance-rules.js';
import type {
  FinalLaunchVerdict,
  LaunchVerdictGovernanceAssessment,
} from './launch-verdict-governance-types.js';

function buildGovernanceReasoning(input: {
  finalLaunchVerdict: FinalLaunchVerdict;
  verdictEligibility: FinalLaunchVerdict;
  blockingAuthorities: string[];
  requiredEvidenceMissing: string[];
  governanceScore: number;
  governanceConfidence: number;
  report: FounderTestV4ReportWithLaunchCouncilFinalization;
}): string[] {
  const reasoning: string[] = [
    `Governance verdict ${input.finalLaunchVerdict} — only Launch Verdict Governance may declare a final launch verdict.`,
    `Highest earned eligibility without blockers: ${input.verdictEligibility.replaceAll('_', ' ')}.`,
    `Governance score ${input.governanceScore}/100; governance confidence ${input.governanceConfidence}/100 (separate from verdict).`,
    `Council position: ${input.report.launchCouncilFinalization.councilPosition}; Launch Readiness recommendation (advisory): ${input.report.launchReadinessAuthority.recommendation.replaceAll('_', ' ')}.`,
  ];

  if (input.blockingAuthorities.length > 0) {
    reasoning.push(
      `BLOCKED because launch-gate authorities block readiness: ${input.blockingAuthorities.slice(0, 4).join(', ')}.`,
    );
  }

  if (input.finalLaunchVerdict === 'READY_FOR_PUBLIC_LAUNCH') {
    reasoning.push('Public launch earned through governance-backed real user, trust, reality, and adoption evidence.');
  } else if (input.finalLaunchVerdict !== 'BLOCKED' && input.finalLaunchVerdict !== 'UNKNOWN') {
    reasoning.push(
      `Public launch not earned — ${input.requiredEvidenceMissing.length} missing evidence signal(s) prevent escalation.`,
    );
  }

  if (input.report.launchCouncilFinalization.councilPosition === 'READY_WITH_CAUTION') {
    reasoning.push('Council position READY_WITH_CAUTION — governance permits only earned verdict levels.');
  }

  return reasoning.slice(0, MAX_GOVERNANCE_REASONING);
}

function buildRecommendations(input: {
  finalLaunchVerdict: FinalLaunchVerdict;
  requiredEvidenceMissing: string[];
  blockingAuthorities: string[];
}): string[] {
  const recommendations: string[] = [];

  if (input.finalLaunchVerdict === 'BLOCKED') {
    recommendations.push('Resolve blocking authorities before any launch permission is granted.');
    for (const blocker of input.blockingAuthorities.slice(0, 3)) {
      recommendations.push(`Address blocker: ${blocker}`);
    }
  }

  if (input.finalLaunchVerdict !== 'READY_FOR_PUBLIC_LAUNCH') {
    recommendations.push('Public launch has not been earned — do not declare READY_FOR_PUBLIC_LAUNCH outside governance.');
  }

  for (const missing of input.requiredEvidenceMissing.slice(0, 3)) {
    recommendations.push(`Close evidence gap: ${missing}`);
  }

  recommendations.push('No authority may declare a launch. Launches must be earned through governance-backed evidence.');

  return [...new Set(recommendations)].slice(0, MAX_GOVERNANCE_RECOMMENDATIONS);
}

function stableCacheKey(report: FounderTestV4ReportWithLaunchCouncilFinalization): string {
  const digest = createHash('sha256')
    .update(
      [
        report.launchCouncilFinalization.cacheKey,
        report.launchReadinessAuthority.cacheKey,
        report.realityProofAuthority.cacheKey,
        report.realUserRealityAuthority.cacheKey,
        report.trustAuthority.cacheKey,
        report.adoptionPredictionAuthority.cacheKey,
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${LAUNCH_VERDICT_GOVERNANCE_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessLaunchVerdictGovernance(
  report: FounderTestV4ReportWithLaunchCouncilFinalization,
): LaunchVerdictGovernanceAssessment {
  const ruleEvaluations = evaluateGovernanceRules(report);
  const blockingAuthorities = detectImmediateBlockingAuthorities(report).slice(0, MAX_BLOCKING_AUTHORITIES);
  const verdictEligibility = deriveVerdictEligibility(report, ruleEvaluations);
  const finalLaunchVerdict = deriveFinalLaunchVerdict({
    report,
    evaluations: ruleEvaluations,
    blockingAuthorities,
    eligibility: verdictEligibility,
  });
  const requiredEvidenceMissing = collectRequiredEvidenceMissing(
    report,
    ruleEvaluations,
    finalLaunchVerdict,
  ).slice(0, MAX_MISSING_EVIDENCE);
  const governanceScore = calculateGovernanceScore(ruleEvaluations);
  const governanceConfidence = calculateGovernanceConfidence(report);
  const { satisfiedRuleCount, failedRuleCount, blockingRuleCount } = countRuleOutcomes(ruleEvaluations);
  const satisfiedRules = ruleEvaluations
    .filter((entry) => entry.outcome === 'SATISFIED')
    .map((entry) => `${entry.ruleId}: ${entry.description}`);
  const failedRules = ruleEvaluations
    .filter((entry) => entry.outcome === 'FAILED')
    .map((entry) => `${entry.ruleId}: ${entry.description}`);

  const governanceReasoning = buildGovernanceReasoning({
    finalLaunchVerdict,
    verdictEligibility,
    blockingAuthorities,
    requiredEvidenceMissing,
    governanceScore,
    governanceConfidence,
    report,
  });

  const recommendations = buildRecommendations({
    finalLaunchVerdict,
    requiredEvidenceMissing,
    blockingAuthorities,
  });

  const assessment: LaunchVerdictGovernanceAssessment = {
    readOnly: true,
    advisoryOnly: true,
    governanceScore,
    governanceConfidence,
    finalLaunchVerdict,
    verdictEligibility,
    blockingRuleCount,
    satisfiedRuleCount,
    failedRuleCount,
    requiredEvidenceMissing,
    blockingAuthorities,
    governanceReasoning,
    recommendations,
    ruleEvaluations,
    satisfiedRules,
    failedRules,
    cacheKey: stableCacheKey(report),
  };

  recordLaunchVerdictGovernanceAssessment(assessment);
  return assessment;
}

export function buildLaunchVerdictGovernanceArtifacts(
  report: FounderTestV4ReportWithLaunchCouncilFinalization,
): {
  launchVerdictGovernance: LaunchVerdictGovernanceAssessment;
  launchVerdictGovernanceReportMarkdown: string;
} {
  const launchVerdictGovernance = assessLaunchVerdictGovernance(report);
  const launchVerdictGovernanceReportMarkdown = buildLaunchVerdictGovernanceReportMarkdown(
    launchVerdictGovernance,
    report,
  );
  return { launchVerdictGovernance, launchVerdictGovernanceReportMarkdown };
}

export function isGovernedPublicLaunchVerdict(verdict: FinalLaunchVerdict): boolean {
  return verdict === 'READY_FOR_PUBLIC_LAUNCH';
}
