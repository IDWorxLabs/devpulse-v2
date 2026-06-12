/**
 * Adaptive AutoFix Intelligence — deterministic repeated-failure evolution analysis.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithLaunchCouncilFinalization } from '../founder-testing-mode/founder-testing-v4-types.js';
import type { LaunchVerdictGovernanceAssessment } from '../launch-verdict-governance/launch-verdict-governance-types.js';
import {
  ADAPTIVE_AUTOFIX_CACHE_KEY_PREFIX,
  AUTOFIX_READY_SCORE,
  CAPABILITY_GAP_BLOCK_THRESHOLD,
  EVOLUTION_REQUIRED_GAP_THRESHOLD,
  EVOLUTION_REQUIRED_SCORE,
  LIMITED_AUTOFIX_SCORE,
  MAX_CAPABILITY_GAPS,
  MAX_FAILURE_RECORDS,
  MAX_MISSING_CAPABILITIES,
} from './adaptive-autofix-bounds.js';
import { detectCapabilityGaps } from './adaptive-autofix-capability-detector.js';
import { recordAdaptiveAutofixFailures } from './adaptive-autofix-failure-history.js';
import { planAdaptiveEvolution, sumEstimatedFailureReduction } from './adaptive-autofix-evolution-planner.js';
import { detectRepeatedFailurePatterns } from './adaptive-autofix-pattern-detector.js';
import { buildAdaptiveAutofixReportMarkdown } from './adaptive-autofix-report-builder.js';
import type {
  AdaptiveAutoFixAssessment,
  AdaptiveAutofixReadinessState,
  FailureCategory,
} from './adaptive-autofix-types.js';

export type FounderTestV4ReportForAdaptiveAutofix = FounderTestV4ReportWithLaunchCouncilFinalization & {
  launchVerdictGovernance: LaunchVerdictGovernanceAssessment;
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function deriveReadinessState(input: {
  adaptiveAutoFixScore: number;
  evolutionRequiredCount: number;
  capabilityGapCount: number;
  triggeredAdaptiveAutofix: boolean;
}): AdaptiveAutofixReadinessState {
  if (
    input.triggeredAdaptiveAutofix &&
    (input.evolutionRequiredCount >= EVOLUTION_REQUIRED_GAP_THRESHOLD ||
      input.capabilityGapCount >= CAPABILITY_GAP_BLOCK_THRESHOLD)
  ) {
    return 'BLOCKED';
  }
  if (input.triggeredAdaptiveAutofix || input.evolutionRequiredCount > 0) {
    return 'EVOLUTION_REQUIRED';
  }
  if (input.adaptiveAutoFixScore >= AUTOFIX_READY_SCORE) {
    return 'AUTOFIX_READY';
  }
  if (input.adaptiveAutoFixScore >= LIMITED_AUTOFIX_SCORE) {
    return 'LIMITED_AUTOFIX';
  }
  if (input.adaptiveAutoFixScore >= EVOLUTION_REQUIRED_SCORE) {
    return 'EVOLUTION_REQUIRED';
  }
  return 'BLOCKED';
}

function stableCacheKey(report: FounderTestV4ReportForAdaptiveAutofix, score: number): string {
  const digest = createHash('sha256')
    .update(
      [
        report.launchVerdictGovernance.cacheKey,
        report.selfEvolutionAuthority.cacheKey,
        report.gapDetectionAuthority.cacheKey,
        report.launchCouncilFinalization.cacheKey,
        score,
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${ADAPTIVE_AUTOFIX_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessAdaptiveAutofixIntelligence(
  report: FounderTestV4ReportForAdaptiveAutofix,
): AdaptiveAutoFixAssessment {
  const failureRecords = detectRepeatedFailurePatterns(report).slice(0, MAX_FAILURE_RECORDS);
  recordAdaptiveAutofixFailures(failureRecords);
  const capabilityGaps = detectCapabilityGaps(failureRecords).slice(0, MAX_CAPABILITY_GAPS);
  const recommendations = planAdaptiveEvolution({ failures: failureRecords, gaps: capabilityGaps });
  const repeatedFailureCount = failureRecords.reduce(
    (total, record) => total + record.repeatedFailureCount,
    0,
  );
  const capabilityGapCount = capabilityGaps.length;
  const evolutionRequiredCount = recommendations.filter(
    (item) => item.implementationPriority === 'CRITICAL' || item.implementationPriority === 'HIGH',
  ).length;
  const triggeredAdaptiveAutofix = failureRecords.length > 0;
  const estimatedFailureReduction = sumEstimatedFailureReduction(recommendations);
  const adaptiveAutoFixScore = clamp(
    100 -
      capabilityGapCount * 8 -
      evolutionRequiredCount * 6 -
      (triggeredAdaptiveAutofix ? 10 : 0) +
      Math.min(20, estimatedFailureReduction / 5),
  );
  const missingCapabilities = [
    ...new Set(capabilityGaps.map((gap) => gap.missingCapability)),
    ...report.selfEvolutionAuthority.requiredEvolutions,
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => gap.severity === 'CRITICAL')
      .map((gap) => gap.title),
  ].slice(0, MAX_MISSING_CAPABILITIES);
  const failureCategories = [...new Set(failureRecords.map((record) => record.failureCategory))] as FailureCategory[];
  const autofixReadiness = deriveReadinessState({
    adaptiveAutoFixScore,
    evolutionRequiredCount,
    capabilityGapCount,
    triggeredAdaptiveAutofix,
  });
  const blocksLaunchReadiness =
    autofixReadiness === 'BLOCKED' ||
    (triggeredAdaptiveAutofix && capabilityGapCount >= CAPABILITY_GAP_BLOCK_THRESHOLD);

  const assessment: AdaptiveAutoFixAssessment = {
    readOnly: true,
    advisoryOnly: true,
    adaptiveAutoFixScore,
    repeatedFailureCount,
    capabilityGapCount,
    evolutionRequiredCount,
    estimatedFailureReduction,
    autofixReadiness,
    missingCapabilities,
    recommendations,
    blocksLaunchReadiness,
    triggeredAdaptiveAutofix,
    failureCategories,
    failureRecords,
    capabilityGaps,
    cacheKey: stableCacheKey(report, adaptiveAutoFixScore),
  };

  return assessment;
}

export function buildAdaptiveAutofixIntelligenceArtifacts(report: FounderTestV4ReportForAdaptiveAutofix): {
  adaptiveAutofixIntelligence: AdaptiveAutoFixAssessment;
  adaptiveAutofixIntelligenceReportMarkdown: string;
} {
  const adaptiveAutofixIntelligence = assessAdaptiveAutofixIntelligence(report);
  return {
    adaptiveAutofixIntelligence,
    adaptiveAutofixIntelligenceReportMarkdown: buildAdaptiveAutofixReportMarkdown(
      adaptiveAutofixIntelligence,
      report.generatedAt,
    ),
  };
}
