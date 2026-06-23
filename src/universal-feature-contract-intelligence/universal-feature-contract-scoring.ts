/**
 * Universal Feature Contract Intelligence V1 — scoring and verdicts.
 */

import { computeContractCompletenessScore } from './universal-feature-contract-builder.js';
import {
  UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE_V1_PASS_TOKEN,
  UNIVERSAL_FEATURE_REALITY_MIN_LAUNCH_SCORE,
} from './universal-feature-contract-registry.js';
import type {
  UniversalFeatureContract,
  UniversalFeatureContractAssessment,
  UniversalFeatureRealityCheck,
  UniversalFeatureRealityScores,
  UniversalFeatureRealityVerdict,
} from './universal-feature-contract-types.js';
import type { FeatureRealityValidationPlan } from './universal-feature-contract-types.js';

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreCategory(checks: UniversalFeatureRealityCheck[], categories: string[]): number {
  const relevant = checks.filter((check) => categories.includes(check.category));
  if (relevant.length === 0) return 100;
  const passed = relevant.filter((check) => check.passed).length;
  return clampScore((passed / relevant.length) * 100);
}

export function computeUniversalFeatureRealityScores(input: {
  contract: UniversalFeatureContract;
  checks: UniversalFeatureRealityCheck[];
}): UniversalFeatureRealityScores {
  const contractCompletenessScore = computeContractCompletenessScore(input.contract);
  const featureCoverageScore = scoreCategory(input.checks, ['discoverability']);
  const executionScore = scoreCategory(input.checks, ['execution', 'edit', 'delete']);
  const workflowScore = scoreCategory(input.checks, ['workflow']);
  const persistenceScore = scoreCategory(input.checks, ['persistence']);

  const weightedSum =
    contractCompletenessScore * 0.8 +
    featureCoverageScore * 1.1 +
    executionScore * 1.3 +
    workflowScore * 1 +
    persistenceScore * 1.2;

  return {
    contractCompletenessScore,
    featureCoverageScore,
    executionScore,
    workflowScore,
    persistenceScore,
    overallFeatureRealityScore: clampScore(weightedSum / 5.4),
  };
}

export function deriveUniversalFeatureRealityVerdict(input: {
  scores: UniversalFeatureRealityScores;
  checks: UniversalFeatureRealityCheck[];
}): UniversalFeatureRealityVerdict {
  const criticalFailures = input.checks.filter((check) => check.critical && !check.passed);
  if (criticalFailures.length > 0 || input.scores.overallFeatureRealityScore < 60) {
    return 'FEATURE_REALITY_FAIL';
  }
  if (input.scores.overallFeatureRealityScore >= 95) return 'FEATURE_REALITY_EXCELLENT';
  if (input.scores.overallFeatureRealityScore >= 85) return 'FEATURE_REALITY_GOOD';
  if (input.scores.overallFeatureRealityScore >= UNIVERSAL_FEATURE_REALITY_MIN_LAUNCH_SCORE) {
    return 'FEATURE_REALITY_ACCEPTABLE';
  }
  return 'FEATURE_REALITY_NEEDS_IMPROVEMENT';
}

export function resolveUniversalFeatureLaunchBlock(input: {
  verdict: UniversalFeatureRealityVerdict;
  scores: UniversalFeatureRealityScores;
}): { blocks: boolean; reason: string | null } {
  if (input.verdict === 'FEATURE_REALITY_FAIL') {
    return {
      blocks: true,
      reason: 'Universal Feature Contract validation failed (FEATURE_REALITY_FAIL).',
    };
  }
  if (input.scores.overallFeatureRealityScore < UNIVERSAL_FEATURE_REALITY_MIN_LAUNCH_SCORE) {
    return {
      blocks: true,
      reason: `Overall Feature Reality Score ${input.scores.overallFeatureRealityScore} is below launch minimum ${UNIVERSAL_FEATURE_REALITY_MIN_LAUNCH_SCORE}.`,
    };
  }
  return { blocks: false, reason: null };
}

export function buildUniversalFeatureContractAssessment(input: {
  previewUrl: string;
  contract: UniversalFeatureContract;
  plan: FeatureRealityValidationPlan;
  checks: UniversalFeatureRealityCheck[];
  reportMarkdown: string;
}): UniversalFeatureContractAssessment {
  const scores = computeUniversalFeatureRealityScores({
    contract: input.contract,
    checks: input.checks,
  });
  const verdict = deriveUniversalFeatureRealityVerdict({ scores, checks: input.checks });
  const launchBlock = resolveUniversalFeatureLaunchBlock({ verdict, scores });
  const failedChecks = input.checks.filter((check) => !check.passed);
  const passed =
    verdict !== 'FEATURE_REALITY_FAIL' &&
    scores.overallFeatureRealityScore >= UNIVERSAL_FEATURE_REALITY_MIN_LAUNCH_SCORE &&
    failedChecks.filter((check) => check.critical).length === 0;

  return {
    readOnly: true,
    passed,
    verdict,
    passToken: passed
      ? UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE_V1_PASS_TOKEN
      : 'UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE_V1_FAIL',
    scores,
    contract: input.contract,
    plan: input.plan,
    checks: input.checks,
    failedChecks,
    blocksLaunchReadiness: launchBlock.blocks,
    blocksLaunchReadinessReason: launchBlock.reason,
    previewUrl: input.previewUrl,
    contractId: input.contract.contractId,
    generatedAt: new Date().toISOString(),
    reportMarkdown: input.reportMarkdown,
  };
}
