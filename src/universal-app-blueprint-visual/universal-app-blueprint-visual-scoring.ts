/**
 * Universal App Blueprint Visual Validation Authority V1 — scoring and verdicts.
 */

import { BLUEPRINT_VISUAL_MIN_LAUNCH_SCORE } from './universal-app-blueprint-visual-registry.js';
import { UNIVERSAL_APP_BLUEPRINT_VISUAL_V1_PASS_TOKEN } from './universal-app-blueprint-visual-registry.js';
import type {
  BlueprintVisualAssessment,
  BlueprintVisualCheck,
  BlueprintVisualScores,
  BlueprintVisualVerdict,
} from './universal-app-blueprint-visual-types.js';

const CATEGORY_WEIGHTS: Record<string, number> = {
  launch: 1.2,
  welcome: 1,
  auth: 1.1,
  navigation: 1.3,
  home: 1.2,
  search: 0.9,
  notifications: 0.9,
  profile: 0.9,
  settings: 0.9,
  help: 0.8,
  feedback: 0.8,
  empty: 1,
  error: 1,
  loading: 1,
  ai: 0.9,
  legal: 0.8,
  responsive: 1.2,
  accessibility: 1.1,
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreCategory(checks: BlueprintVisualCheck[], categories: string[]): number {
  const relevant = checks.filter((check) => categories.includes(check.category));
  if (relevant.length === 0) return 0;
  const passed = relevant.filter((check) => check.passed).length;
  return clampScore((passed / relevant.length) * 100);
}

export function computeBlueprintVisualScores(checks: BlueprintVisualCheck[]): BlueprintVisualScores {
  const visualStructureScore = scoreCategory(checks, [
    'launch',
    'welcome',
    'home',
    'empty',
    'error',
    'loading',
    'legal',
  ]);
  const navigationScore = scoreCategory(checks, ['navigation']);
  const responsivenessScore = scoreCategory(checks, ['responsive']);
  const accessibilityScore = scoreCategory(checks, ['accessibility']);
  const userExperienceScore = scoreCategory(checks, [
    'welcome',
    'auth',
    'navigation',
    'home',
    'search',
    'notifications',
    'profile',
    'settings',
    'help',
    'feedback',
    'ai',
  ]);

  let weightedSum = 0;
  let weightTotal = 0;
  for (const check of checks) {
    const weight = CATEGORY_WEIGHTS[check.category] ?? 1;
    weightedSum += (check.passed ? 100 : 0) * weight;
    weightTotal += weight;
  }
  const overallBlueprintScore = weightTotal > 0 ? clampScore(weightedSum / weightTotal) : 0;

  return {
    visualStructureScore,
    navigationScore,
    responsivenessScore,
    accessibilityScore,
    userExperienceScore,
    overallBlueprintScore,
  };
}

export function deriveBlueprintVisualVerdict(input: {
  scores: BlueprintVisualScores;
  checks: BlueprintVisualCheck[];
}): BlueprintVisualVerdict {
  const criticalFailures = input.checks.filter((check) => check.critical && !check.passed);
  if (criticalFailures.length > 0 || input.scores.overallBlueprintScore < 60) {
    return 'BLUEPRINT_FAIL';
  }
  if (input.scores.overallBlueprintScore >= 95) return 'BLUEPRINT_EXCELLENT';
  if (input.scores.overallBlueprintScore >= 85) return 'BLUEPRINT_GOOD';
  if (input.scores.overallBlueprintScore >= BLUEPRINT_VISUAL_MIN_LAUNCH_SCORE) {
    return 'BLUEPRINT_ACCEPTABLE';
  }
  return 'BLUEPRINT_NEEDS_IMPROVEMENT';
}

export function resolveBlueprintVisualLaunchBlock(input: {
  verdict: BlueprintVisualVerdict;
  scores: BlueprintVisualScores;
}): { blocks: boolean; reason: string | null } {
  if (input.verdict === 'BLUEPRINT_FAIL') {
    return {
      blocks: true,
      reason: 'Universal App Blueprint visual validation failed (BLUEPRINT_FAIL).',
    };
  }
  if (input.scores.overallBlueprintScore < BLUEPRINT_VISUAL_MIN_LAUNCH_SCORE) {
    return {
      blocks: true,
      reason: `Overall Blueprint Score ${input.scores.overallBlueprintScore} is below launch minimum ${BLUEPRINT_VISUAL_MIN_LAUNCH_SCORE}.`,
    };
  }
  return { blocks: false, reason: null };
}

export function buildBlueprintVisualAssessment(input: {
  previewUrl: string;
  checks: BlueprintVisualCheck[];
  viewportEvidence: string[];
  reportMarkdown: string;
}): BlueprintVisualAssessment {
  const scores = computeBlueprintVisualScores(input.checks);
  const verdict = deriveBlueprintVisualVerdict({ scores, checks: input.checks });
  const launchBlock = resolveBlueprintVisualLaunchBlock({ verdict, scores });
  const failedChecks = input.checks.filter((check) => !check.passed);
  const passed =
    verdict !== 'BLUEPRINT_FAIL' &&
    scores.overallBlueprintScore >= BLUEPRINT_VISUAL_MIN_LAUNCH_SCORE &&
    failedChecks.filter((check) => check.critical).length === 0;

  return {
    readOnly: true,
    passed,
    verdict,
    passToken: passed
      ? UNIVERSAL_APP_BLUEPRINT_VISUAL_V1_PASS_TOKEN
      : 'UNIVERSAL_APP_BLUEPRINT_VISUAL_V1_FAIL',
    scores,
    checks: input.checks,
    failedChecks,
    blocksLaunchReadiness: launchBlock.blocks,
    blocksLaunchReadinessReason: launchBlock.reason,
    previewUrl: input.previewUrl,
    viewportEvidence: input.viewportEvidence,
    generatedAt: new Date().toISOString(),
    reportMarkdown: input.reportMarkdown,
  };
}
