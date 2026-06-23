/**
 * Engineering Reality Authority V1 — scoring and verdicts.
 */

import {
  ENGINEERING_REALITY_MIN_LAUNCH_SCORE,
  ENGINEERING_REALITY_V1_PASS_TOKEN,
} from './engineering-reality-registry.js';
import type {
  AccessibilityVerdict,
  EngineeringAccessibilityAnalysis,
  EngineeringBuildAnalysis,
  EngineeringLoadAnalysis,
  EngineeringPerformanceAnalysis,
  EngineeringRealityAssessment,
  EngineeringRealityCheck,
  EngineeringRealityScores,
  EngineeringRealityVerdict,
  EngineeringRuntimeHealth,
  EngineeringSecurityAnalysis,
  PerformanceVerdict,
  SecurityVerdict,
} from './engineering-reality-types.js';

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreCategory(checks: EngineeringRealityCheck[], categories: string[]): number {
  const relevant = checks.filter((check) => categories.includes(check.category));
  if (relevant.length === 0) return 100;
  const passed = relevant.filter((check) => check.passed).length;
  return clampScore((passed / relevant.length) * 100);
}

function toSecurityVerdict(score: number, criticalFailures: EngineeringRealityCheck[]): SecurityVerdict {
  if (criticalFailures.length > 0 || score < 60) return 'SECURITY_FAIL';
  if (score >= 95) return 'SECURITY_EXCELLENT';
  if (score >= 85) return 'SECURITY_GOOD';
  return 'SECURITY_ACCEPTABLE';
}

function toPerformanceVerdict(score: number, criticalFailures: EngineeringRealityCheck[]): PerformanceVerdict {
  if (criticalFailures.length > 0 || score < 60) return 'PERFORMANCE_FAIL';
  if (score >= 95) return 'PERFORMANCE_EXCELLENT';
  if (score >= 85) return 'PERFORMANCE_GOOD';
  return 'PERFORMANCE_ACCEPTABLE';
}

function toAccessibilityVerdict(score: number, criticalFailures: EngineeringRealityCheck[]): AccessibilityVerdict {
  if (criticalFailures.length > 0 || score < 60) return 'ACCESSIBILITY_FAIL';
  if (score >= 95) return 'ACCESSIBILITY_EXCELLENT';
  if (score >= 85) return 'ACCESSIBILITY_GOOD';
  return 'ACCESSIBILITY_ACCEPTABLE';
}

export function computeEngineeringRealityScores(checks: EngineeringRealityCheck[]): EngineeringRealityScores {
  const securityScore = scoreCategory(checks, ['security']);
  const performanceScore = scoreCategory(checks, ['performance', 'build']);
  const accessibilityScore = scoreCategory(checks, ['accessibility']);

  const weightedSum = securityScore * 1.2 + performanceScore * 1.1 + accessibilityScore * 1;
  return {
    securityScore,
    performanceScore,
    accessibilityScore,
    overallEngineeringScore: clampScore(weightedSum / 3.3),
  };
}

function buildSecurityAnalysis(
  checks: EngineeringRealityCheck[],
  score: number,
): EngineeringSecurityAnalysis {
  const securityChecks = checks.filter((check) => check.category === 'security');
  const failed = securityChecks.filter((check) => !check.passed);
  const critical = failed.filter((check) => check.critical);
  const warnings = failed.filter((check) => !check.critical).map((check) => check.detail);
  return {
    verdict: toSecurityVerdict(score, critical),
    score,
    criticalFindings: critical.map((check) => `${check.label}: ${check.detail}`),
    warnings,
    recommendations:
      critical.length > 0
        ? ['Resolve critical security findings before launch.', 'Re-run validate:engineering-reality-v1.']
        : ['Security posture acceptable for generated app baseline.'],
  };
}

function buildPerformanceAnalysis(input: {
  checks: EngineeringRealityCheck[];
  score: number;
  loadTimeAnalysis: EngineeringLoadAnalysis;
  runtimeHealth: EngineeringRuntimeHealth;
  buildAnalysis: EngineeringBuildAnalysis;
}): EngineeringPerformanceAnalysis {
  const performanceChecks = input.checks.filter((check) => check.category === 'performance' || check.category === 'build');
  const critical = performanceChecks.filter((check) => check.critical && !check.passed);
  return {
    verdict: toPerformanceVerdict(input.score, critical),
    score: input.score,
    loadTimeAnalysis: input.loadTimeAnalysis,
    interactionAnalysis: `Navigation ${input.loadTimeAnalysis.navigationMs}ms; build ${input.buildAnalysis.detail}`,
    runtimeHealth: input.runtimeHealth,
  };
}

function buildAccessibilityAnalysis(checks: EngineeringRealityCheck[], score: number): EngineeringAccessibilityAnalysis {
  const a11yChecks = checks.filter((check) => check.category === 'accessibility');
  const failed = a11yChecks.filter((check) => !check.passed);
  const critical = failed.filter((check) => check.critical);
  return {
    verdict: toAccessibilityVerdict(score, critical),
    score,
    findings: failed.map((check) => `${check.label}: ${check.detail}`),
    recommendations:
      critical.length > 0
        ? ['Improve form labeling and keyboard reachability.', 'Verify navigation labels for screen readers.']
        : ['Accessibility baseline acceptable for generated app shell.'],
  };
}

export function deriveEngineeringRealityVerdict(input: {
  scores: EngineeringRealityScores;
  security: EngineeringSecurityAnalysis;
  performance: EngineeringPerformanceAnalysis;
  accessibility: EngineeringAccessibilityAnalysis;
}): EngineeringRealityVerdict {
  if (
    input.security.verdict === 'SECURITY_FAIL' ||
    input.performance.verdict === 'PERFORMANCE_FAIL' ||
    input.accessibility.verdict === 'ACCESSIBILITY_FAIL'
  ) {
    return 'ENGINEERING_FAIL';
  }
  if (input.scores.overallEngineeringScore < 60) return 'ENGINEERING_FAIL';
  if (input.scores.overallEngineeringScore >= 95) return 'ENGINEERING_EXCELLENT';
  if (input.scores.overallEngineeringScore >= 85) return 'ENGINEERING_GOOD';
  if (input.scores.overallEngineeringScore >= ENGINEERING_REALITY_MIN_LAUNCH_SCORE) {
    return 'ENGINEERING_ACCEPTABLE';
  }
  return 'ENGINEERING_NEEDS_IMPROVEMENT';
}

export function resolveEngineeringLaunchBlock(input: {
  verdict: EngineeringRealityVerdict;
  scores: EngineeringRealityScores;
  security: EngineeringSecurityAnalysis;
  performance: EngineeringPerformanceAnalysis;
  accessibility: EngineeringAccessibilityAnalysis;
}): { blocks: boolean; reason: string | null } {
  if (input.verdict === 'ENGINEERING_FAIL') {
    return { blocks: true, reason: 'Engineering Reality validation failed (ENGINEERING_FAIL).' };
  }
  if (input.security.verdict === 'SECURITY_FAIL') {
    return { blocks: true, reason: 'Security Reality verdict is SECURITY_FAIL.' };
  }
  if (input.performance.verdict === 'PERFORMANCE_FAIL') {
    return { blocks: true, reason: 'Performance Reality verdict is PERFORMANCE_FAIL.' };
  }
  if (input.accessibility.verdict === 'ACCESSIBILITY_FAIL') {
    return { blocks: true, reason: 'Accessibility Reality verdict is ACCESSIBILITY_FAIL.' };
  }
  if (input.scores.overallEngineeringScore < ENGINEERING_REALITY_MIN_LAUNCH_SCORE) {
    return {
      blocks: true,
      reason: `Overall Engineering Score ${input.scores.overallEngineeringScore} is below launch minimum ${ENGINEERING_REALITY_MIN_LAUNCH_SCORE}.`,
    };
  }
  return { blocks: false, reason: null };
}

export function buildEngineeringRealityAssessment(input: {
  previewUrl: string;
  contractId: string;
  productName: string;
  checks: EngineeringRealityCheck[];
  buildAnalysis: EngineeringBuildAnalysis;
  loadTimeAnalysis: EngineeringLoadAnalysis;
  runtimeHealth: EngineeringRuntimeHealth;
  reportMarkdown: string;
}): EngineeringRealityAssessment {
  const scores = computeEngineeringRealityScores(input.checks);
  const security = buildSecurityAnalysis(input.checks, scores.securityScore);
  const performance = buildPerformanceAnalysis({
    checks: input.checks,
    score: scores.performanceScore,
    loadTimeAnalysis: input.loadTimeAnalysis,
    runtimeHealth: input.runtimeHealth,
    buildAnalysis: input.buildAnalysis,
  });
  const accessibility = buildAccessibilityAnalysis(input.checks, scores.accessibilityScore);
  const verdict = deriveEngineeringRealityVerdict({ scores, security, performance, accessibility });
  const launchBlock = resolveEngineeringLaunchBlock({ verdict, scores, security, performance, accessibility });
  const failedChecks = input.checks.filter((check) => !check.passed);
  const passed =
    verdict !== 'ENGINEERING_FAIL' &&
    scores.overallEngineeringScore >= ENGINEERING_REALITY_MIN_LAUNCH_SCORE &&
    failedChecks.filter((check) => check.critical).length === 0;

  return {
    readOnly: true,
    passed,
    verdict,
    passToken: passed ? ENGINEERING_REALITY_V1_PASS_TOKEN : 'ENGINEERING_REALITY_V1_FAIL',
    scores,
    security,
    performance,
    accessibility,
    checks: input.checks,
    failedChecks,
    buildAnalysis: input.buildAnalysis,
    blocksLaunchReadiness: launchBlock.blocks,
    blocksLaunchReadinessReason: launchBlock.reason,
    previewUrl: input.previewUrl,
    contractId: input.contractId,
    productName: input.productName,
    generatedAt: new Date().toISOString(),
    reportMarkdown: input.reportMarkdown,
  };
}
