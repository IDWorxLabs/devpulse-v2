/**
 * Feature Reality Validation Authority V1 — scoring and verdicts.
 */

import {
  FEATURE_REALITY_MIN_LAUNCH_SCORE,
  FEATURE_REALITY_V1_PASS_TOKEN,
} from './feature-reality-validation-registry.js';
import type {
  FeatureRealityAssessment,
  FeatureRealityCheck,
  FeatureRealityScores,
  FeatureRealityVerdict,
} from './feature-reality-validation-types.js';

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreCategory(checks: FeatureRealityCheck[], categories: string[]): number {
  const relevant = checks.filter((check) => categories.includes(check.category));
  if (relevant.length === 0) return 100;
  const passed = relevant.filter((check) => check.passed).length;
  return clampScore((passed / relevant.length) * 100);
}

export function computeFeatureRealityScores(checks: FeatureRealityCheck[]): FeatureRealityScores {
  const featureCoverageScore = scoreCategory(checks, ['discoverability']);
  const featureExecutionScore = scoreCategory(checks, ['execution', 'edit', 'delete']);
  const persistenceScore = scoreCategory(checks, ['persistence']);
  const recoveryScore = scoreCategory(checks, ['recovery']);
  const featureUxScore = scoreCategory(checks, ['ux']);

  const weightedSum =
    featureCoverageScore * 1.1 +
    featureExecutionScore * 1.3 +
    persistenceScore * 1.2 +
    recoveryScore * 1 +
    featureUxScore * 1;

  return {
    featureCoverageScore,
    featureExecutionScore,
    persistenceScore,
    recoveryScore,
    featureUxScore,
    overallFeatureScore: clampScore(weightedSum / 5.6),
  };
}

export function deriveFeatureRealityVerdict(input: {
  scores: FeatureRealityScores;
  checks: FeatureRealityCheck[];
}): FeatureRealityVerdict {
  const criticalFailures = input.checks.filter((check) => check.critical && !check.passed);
  if (criticalFailures.length > 0 || input.scores.overallFeatureScore < 60) {
    return 'FEATURE_FAIL';
  }
  if (input.scores.overallFeatureScore >= 95) return 'FEATURE_EXCELLENT';
  if (input.scores.overallFeatureScore >= 85) return 'FEATURE_GOOD';
  if (input.scores.overallFeatureScore >= FEATURE_REALITY_MIN_LAUNCH_SCORE) {
    return 'FEATURE_ACCEPTABLE';
  }
  return 'FEATURE_NEEDS_IMPROVEMENT';
}

export function resolveFeatureRealityLaunchBlock(input: {
  verdict: FeatureRealityVerdict;
  scores: FeatureRealityScores;
}): { blocks: boolean; reason: string | null } {
  if (input.verdict === 'FEATURE_FAIL') {
    return {
      blocks: true,
      reason: 'Feature Reality Validation failed (FEATURE_FAIL).',
    };
  }
  if (input.scores.overallFeatureScore < FEATURE_REALITY_MIN_LAUNCH_SCORE) {
    return {
      blocks: true,
      reason: `Overall Feature Score ${input.scores.overallFeatureScore} is below launch minimum ${FEATURE_REALITY_MIN_LAUNCH_SCORE}.`,
    };
  }
  return { blocks: false, reason: null };
}

export function buildFeatureRealityAssessment(input: {
  previewUrl: string;
  contractId: string;
  checks: FeatureRealityCheck[];
  reportMarkdown: string;
}): FeatureRealityAssessment {
  const scores = computeFeatureRealityScores(input.checks);
  const verdict = deriveFeatureRealityVerdict({ scores, checks: input.checks });
  const launchBlock = resolveFeatureRealityLaunchBlock({ verdict, scores });
  const failedChecks = input.checks.filter((check) => !check.passed);
  const passed =
    verdict !== 'FEATURE_FAIL' &&
    scores.overallFeatureScore >= FEATURE_REALITY_MIN_LAUNCH_SCORE &&
    failedChecks.filter((check) => check.critical).length === 0;

  return {
    readOnly: true,
    passed,
    verdict,
    passToken: passed ? FEATURE_REALITY_V1_PASS_TOKEN : 'FEATURE_REALITY_V1_FAIL',
    scores,
    checks: input.checks,
    failedChecks,
    blocksLaunchReadiness: launchBlock.blocks,
    blocksLaunchReadinessReason: launchBlock.reason,
    previewUrl: input.previewUrl,
    contractId: input.contractId,
    generatedAt: new Date().toISOString(),
    reportMarkdown: input.reportMarkdown,
  };
}
