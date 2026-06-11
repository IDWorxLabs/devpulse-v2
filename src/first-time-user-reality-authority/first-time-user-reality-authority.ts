/**
 * First-Time User Reality Authority — deterministic first-time user evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithUnknownDiscovery } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  FIRST_TIME_USER_BLOCK_SCORE,
  FIRST_TIME_USER_CONFUSION_BLOCK_SCORE,
  FIRST_TIME_USER_CRITICAL_SCORE,
  FIRST_TIME_USER_PASS_THRESHOLD,
  FIRST_TIME_USER_REALITY_CACHE_KEY_PREFIX,
  MAX_FIRST_TIME_USER_BLOCKERS,
  MAX_FIRST_TIME_USER_CONFUSION_POINTS,
  MAX_FIRST_TIME_USER_FINDINGS,
  MAX_FIRST_TIME_USER_RECOMMENDATIONS,
} from './first-time-user-reality-bounds.js';
import { recordFirstTimeUserRealityAssessment } from './first-time-user-reality-history.js';
import { buildFirstTimeUserRealityReportMarkdown } from './first-time-user-reality-report-builder.js';
import type {
  FirstTimeUserReadinessState,
  FirstTimeUserScenarioResult,
  FirstTimeUserRealityAssessment,
} from './first-time-user-reality-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function passThreshold(score: number): boolean {
  return score >= FIRST_TIME_USER_PASS_THRESHOLD;
}

function evaluateProductUnderstanding(report: FounderTestV4ReportWithUnknownDiscovery): FirstTimeUserScenarioResult {
  const ftu = report.firstTimeUserReality;
  const success = report.userSuccessAuthority.scenarioResults.find((scenario) => scenario.id === 'understanding-goal');
  const purposeChallenge = report.skepticalFounderSimulator.scenarioResults.find(
    (scenario) => scenario.id === 'purpose-challenge',
  );
  const capabilityAwareness = report.selfAwarenessAuthority.scenarioResults.find(
    (scenario) => scenario.id === 'capability-awareness',
  );
  const checks = [
    ftu.productUnderstandingPass,
    ftu.firstTimeUserScore >= FIRST_TIME_USER_PASS_THRESHOLD,
    success?.passed ?? false,
    purposeChallenge?.passed ?? false,
    capabilityAwareness?.passed ?? false,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const confusionPoints: string[] = [];
  const blockers: string[] = [];
  if (!ftu.productUnderstandingPass) {
    confusionPoints.push('Cannot explain what AiDevEngine is on first contact');
    blockers.push('Product purpose is not clear to first-time users');
  }
  if (!(purposeChallenge?.passed ?? false)) {
    confusionPoints.push('Cannot explain who AiDevEngine is for');
  }
  if ((success?.passed ?? false) === false) {
    confusionPoints.push('Cannot identify product value from bounded user-success evidence');
    blockers.push(...(success?.blockers ?? []).slice(0, 2));
  }
  return {
    id: 'product-understanding',
    category: 'PRODUCT_UNDERSTANDING',
    score,
    passed: passThreshold(score),
    confusionPoints,
    blockers,
    findings: [
      `First-time user engine score: ${ftu.firstTimeUserScore}/100`,
      `Product understanding pass: ${ftu.productUnderstandingPass ? 'Yes' : 'No'}`,
      `Understanding goal passed: ${success?.passed ? 'Yes' : 'No'}`,
      `Purpose challenge passed: ${purposeChallenge?.passed ? 'Yes' : 'No'}`,
    ],
    recommendations: ftu.recommendedFixes.slice(0, 2).length
      ? ftu.recommendedFixes.slice(0, 2)
      : ['Make product purpose, audience, and first-session value obvious before expecting adoption.'],
  };
}

function evaluateCapabilityUnderstanding(report: FounderTestV4ReportWithUnknownDiscovery): FirstTimeUserScenarioResult {
  const fulfillment = report.promiseFulfillment;
  const trust = report.trustAuthority;
  const buildPromise = fulfillment.promiseAssessments.find((assessment) => assessment.promiseId === 'software-creation');
  const analysisPromise = fulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'assists-planning',
  );
  const checks = [
    (buildPromise?.status ?? 'UNPROVEN') !== 'CONTRADICTED',
    (analysisPromise?.status ?? 'UNPROVEN') !== 'CONTRADICTED',
    fulfillment.fulfilledCount + fulfillment.partiallyFulfilledCount >= 2,
    trust.scenarioResults.find((scenario) => scenario.id === 'honesty-trust')?.passed ?? false,
    report.autonomousBuilderReality.canExecuteBuilds || report.autonomousBuilderReality.canPlanWork,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const confusionPoints: string[] = [];
  const blockers: string[] = [];
  if ((buildPromise?.status ?? 'UNPROVEN') === 'UNPROVEN') {
    confusionPoints.push('Cannot understand what can be built');
  }
  if ((buildPromise?.status ?? 'UNPROVEN') === 'CONTRADICTED') {
    confusionPoints.push('Promised build capability contradicts evidence');
    blockers.push('Capability promises contradict what first-time users can observe');
  }
  if ((analysisPromise?.status ?? 'UNPROVEN') === 'UNPROVEN') {
    confusionPoints.push('Cannot understand what can be analyzed or planned');
  }
  return {
    id: 'capability-understanding',
    category: 'CAPABILITY_UNDERSTANDING',
    score,
    passed: passThreshold(score),
    confusionPoints,
    blockers,
    findings: [
      `Promise fulfillment score: ${fulfillment.fulfillmentScore}/100`,
      `Software creation promise: ${buildPromise?.status ?? 'UNPROVEN'}`,
      `Planning promise: ${analysisPromise?.status ?? 'UNPROVEN'}`,
    ],
    recommendations: fulfillment.recommendations.slice(0, 2).length
      ? fulfillment.recommendations.slice(0, 2)
      : ['Show visible capability boundaries and proof paths for build, analysis, and verification.'],
  };
}

function evaluateWorkflowUnderstanding(report: FounderTestV4ReportWithUnknownDiscovery): FirstTimeUserScenarioResult {
  const ftu = report.firstTimeUserReality;
  const success = report.userSuccessAuthority;
  const planningGoal = success.scenarioResults.find((scenario) => scenario.id === 'planning-goal');
  const buildGoal = success.scenarioResults.find((scenario) => scenario.id === 'build-goal');
  const checks = [
    ftu.workflowClarityPass,
    ftu.navigationUnderstandingPass,
    ftu.actionPathPass,
    planningGoal?.passed ?? false,
    buildGoal?.passed ?? false,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const confusionPoints: string[] = [];
  const blockers: string[] = [];
  if (!ftu.workflowClarityPass) {
    confusionPoints.push('Cannot identify first action or next action');
    blockers.push('First-time users cannot determine the success path');
  }
  if (!ftu.navigationUnderstandingPass) {
    confusionPoints.push('Cannot navigate the product without founder context');
  }
  if ((planningGoal?.passed ?? false) === false) {
    blockers.push(...(planningGoal?.blockers ?? []).slice(0, 1));
  }
  return {
    id: 'workflow-understanding',
    category: 'WORKFLOW_UNDERSTANDING',
    score,
    passed: passThreshold(score),
    confusionPoints,
    blockers,
    findings: [
      `Workflow clarity pass: ${ftu.workflowClarityPass ? 'Yes' : 'No'}`,
      `Navigation understanding pass: ${ftu.navigationUnderstandingPass ? 'Yes' : 'No'}`,
      `Action path steps visible: ${ftu.actionPathStepsVisible}`,
    ],
    recommendations: [
      'Make first action, next action, and success path visible without roadmap knowledge.',
      ...report.recommendedFixOrder.slice(0, 1),
    ],
  };
}

function evaluateConfidenceUnderstanding(report: FounderTestV4ReportWithUnknownDiscovery): FirstTimeUserScenarioResult {
  const trust = report.trustAuthority;
  const skeptical = report.skepticalFounderSimulator;
  const checks = [
    ftuPass(report.firstTimeUserReality.trustFormationPass),
    trust.trustScore >= FIRST_TIME_USER_PASS_THRESHOLD,
    report.verificationResultsVisibility.evidencePresent,
    !skeptical.criticalTrustObjection,
    trust.scenarioResults.find((scenario) => scenario.id === 'transparency-trust')?.passed ?? false,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const confusionPoints: string[] = [];
  const blockers: string[] = [];
  if (!report.verificationResultsVisibility.evidencePresent) {
    confusionPoints.push('Cannot see evidence that supports trust claims');
    blockers.push('First-time users cannot inspect proof before trusting recommendations');
  }
  if (skeptical.criticalTrustObjection) {
    confusionPoints.push('Would ask "Can I trust it?" without a satisfying answer');
    blockers.push('Skeptical first-time review surfaces unsupported trust claims');
  }
  if (trust.criticalTrustFailures > 0) {
    confusionPoints.push('Trust failures reduce first-time confidence');
  }
  return {
    id: 'confidence-understanding',
    category: 'CONFIDENCE_UNDERSTANDING',
    score,
    passed: passThreshold(score),
    confusionPoints,
    blockers,
    findings: [
      `Trust score: ${trust.trustScore}/100`,
      `Trust formation pass: ${report.firstTimeUserReality.trustFormationPass ? 'Yes' : 'No'}`,
      `Verification evidence visible: ${report.verificationResultsVisibility.evidencePresent ? 'Yes' : 'No'}`,
    ],
    recommendations: trust.recommendations.slice(0, 2).length
      ? trust.recommendations.slice(0, 2)
      : ['Expose evidence, uncertainty, and proof before asking first-time users for confidence.'],
  };
}

function ftuPass(value: boolean): boolean {
  return value;
}

function evaluateSuccessUnderstanding(report: FounderTestV4ReportWithUnknownDiscovery): FirstTimeUserScenarioResult {
  const success = report.userSuccessAuthority;
  const awareness = report.selfAwarenessAuthority;
  const confidenceGoal = success.scenarioResults.find((scenario) => scenario.id === 'confidence-goal');
  const launchGoal = success.scenarioResults.find((scenario) => scenario.id === 'launch-goal');
  const evidenceAwareness = awareness.scenarioResults.find((scenario) => scenario.id === 'evidence-awareness');
  const checks = [
    success.outcomeAchievementScore >= FIRST_TIME_USER_PASS_THRESHOLD,
    confidenceGoal?.passed ?? false,
    launchGoal?.passed ?? false,
    evidenceAwareness?.passed ?? false,
    success.criticalSuccessFailures === 0,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const confusionPoints: string[] = [];
  const blockers: string[] = [];
  if (success.outcomeAchievementScore < FIRST_TIME_USER_PASS_THRESHOLD) {
    confusionPoints.push('Cannot determine how success is achieved');
  }
  if ((launchGoal?.passed ?? false) === false) {
    confusionPoints.push('Cannot understand launch or progress milestones');
    blockers.push(...(launchGoal?.blockers ?? []).slice(0, 1));
  }
  if (success.criticalSuccessFailures > 0) {
    blockers.push(...success.criticalSuccessFailureDetails.slice(0, 2));
  }
  return {
    id: 'success-understanding',
    category: 'SUCCESS_UNDERSTANDING',
    score,
    passed: passThreshold(score),
    confusionPoints,
    blockers,
    findings: [
      `User success score: ${success.userSuccessScore}/100`,
      `Outcome achievement score: ${success.outcomeAchievementScore}/100`,
      `Critical success failures: ${success.criticalSuccessFailures}`,
    ],
    recommendations: success.recommendations.slice(0, 2).length
      ? success.recommendations.slice(0, 2)
      : ['Show outcome visibility, goal progress, and what success looks like for a new user.'],
  };
}

function evaluateLaunchImpression(report: FounderTestV4ReportWithUnknownDiscovery): FirstTimeUserScenarioResult {
  const ftu = report.firstTimeUserReality;
  const discovery = report.unknownDiscoveryAuthority;
  const unansweredQuestions = [
    !ftu.productUnderstandingPass ? 'What is this?' : null,
    !ftu.workflowClarityPass ? 'What do I do first?' : null,
    !report.verificationResultsVisibility.evidencePresent ? 'Can I trust it?' : null,
    ftu.firstTimeUserScore < FIRST_TIME_USER_PASS_THRESHOLD ? 'Why should I use it?' : null,
  ].filter((item): item is string => item !== null);
  const frictionSignals = [
    ...ftu.weaknesses.slice(0, 2),
    ftu.topConfusionRisk,
    ...discovery.findings
      .filter((finding) => finding.category === 'UNTESTED_USER_BEHAVIOR' || finding.category === 'LAUNCH_BLIND_SPOT')
      .slice(0, 2)
      .map((finding) => finding.title),
  ].filter((item): item is string => Boolean(item));
  const checks = [
    ftu.firstTimeUserScore >= FIRST_TIME_USER_PASS_THRESHOLD,
    ftu.cognitiveLoadPass,
    unansweredQuestions.length <= 1,
    frictionSignals.length <= 2,
    discovery.criticalFindingCount === 0,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const confusionPoints = [...unansweredQuestions, ...ftu.weaknesses.slice(0, 2)];
  const blockers = frictionSignals.slice(0, 3).map((signal) => `First-five-minutes friction: ${signal}`);
  return {
    id: 'launch-impression',
    category: 'LAUNCH_IMPRESSION',
    score,
    passed: passThreshold(score),
    confusionPoints,
    blockers,
    findings: [
      `First-time user engine score: ${ftu.firstTimeUserScore}/100`,
      `Top confusion risk: ${ftu.topConfusionRisk ?? 'None recorded'}`,
      `Unknown discovery findings: ${discovery.findingCount}`,
    ],
    recommendations: [
      ...(ftu.recommendedFixes.slice(0, 2)),
      'Reduce first-five-minute friction by answering purpose, first step, value, and trust immediately.',
    ],
  };
}

const EVALUATORS = [
  evaluateProductUnderstanding,
  evaluateCapabilityUnderstanding,
  evaluateWorkflowUnderstanding,
  evaluateConfidenceUnderstanding,
  evaluateSuccessUnderstanding,
  evaluateLaunchImpression,
] as const;

function calculateConfusionScore(
  scenarioResults: FirstTimeUserScenarioResult[],
  firstTimeUserScore: number,
): number {
  const confusionPoints = scenarioResults.flatMap((scenario) => scenario.confusionPoints);
  const blockers = scenarioResults.flatMap((scenario) => scenario.blockers);
  const failedCount = scenarioResults.filter((scenario) => !scenario.passed).length;
  return clamp(
    confusionPoints.length * 6 + blockers.length * 8 + failedCount * 10 + Math.max(0, FIRST_TIME_USER_PASS_THRESHOLD - firstTimeUserScore),
  );
}

function countCriticalConfusion(scenarioResults: FirstTimeUserScenarioResult[]): number {
  return scenarioResults.filter((scenario) => scenario.score < FIRST_TIME_USER_CRITICAL_SCORE || !scenario.passed).length;
}

function deriveReadinessState(
  firstTimeUserScore: number,
  confusionScore: number,
  criticalConfusionCount: number,
  blocksLaunchReadiness: boolean,
): FirstTimeUserReadinessState {
  if (blocksLaunchReadiness) return 'BLOCKED';
  if (criticalConfusionCount > 0 || confusionScore > FIRST_TIME_USER_CONFUSION_BLOCK_SCORE || firstTimeUserScore < FIRST_TIME_USER_BLOCK_SCORE) {
    return 'HIGH_CONFUSION';
  }
  if (confusionScore > 40 || firstTimeUserScore < 75) {
    return 'MINOR_CONFUSION';
  }
  return 'CLEAR_AND_USABLE';
}

function buildCacheKey(scenarioResults: FirstTimeUserScenarioResult[]): string {
  const digest = scenarioResults.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  return `${FIRST_TIME_USER_REALITY_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

export function assessFirstTimeUserRealityAuthority(
  report: FounderTestV4ReportWithUnknownDiscovery,
): FirstTimeUserRealityAssessment {
  const scenarioResults = EVALUATORS.map((evaluate) => evaluate(report));
  const firstTimeUserScore = clamp(
    scenarioResults.reduce((sum, scenario) => sum + scenario.score, 0) / scenarioResults.length,
  );
  const confusionScore = calculateConfusionScore(scenarioResults, firstTimeUserScore);
  const criticalConfusionCount = countCriticalConfusion(scenarioResults);
  const confusionPoints = [...new Set(scenarioResults.flatMap((scenario) => scenario.confusionPoints))].slice(
    0,
    MAX_FIRST_TIME_USER_CONFUSION_POINTS,
  );
  const blockers = [...new Set(scenarioResults.flatMap((scenario) => scenario.blockers))].slice(
    0,
    MAX_FIRST_TIME_USER_BLOCKERS,
  );
  const blockerCount = blockers.length;
  const blocksLaunchReadiness =
    firstTimeUserScore < FIRST_TIME_USER_BLOCK_SCORE ||
    criticalConfusionCount > 0 ||
    confusionScore > FIRST_TIME_USER_CONFUSION_BLOCK_SCORE;
  const readinessState = deriveReadinessState(
    firstTimeUserScore,
    confusionScore,
    criticalConfusionCount,
    blocksLaunchReadiness,
  );
  const findings = [...new Set(scenarioResults.flatMap((scenario) => scenario.findings))].slice(
    0,
    MAX_FIRST_TIME_USER_FINDINGS,
  );
  const recommendations = [
    'If a first-time user cannot understand the product, the product is not ready for widespread adoption.',
    ...new Set(scenarioResults.flatMap((scenario) => scenario.recommendations)),
    ...confusionPoints.slice(0, 3).map((point) => `Address confusion: ${point}`),
  ].slice(0, MAX_FIRST_TIME_USER_RECOMMENDATIONS);

  const assessment: FirstTimeUserRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    firstTimeUserScore,
    confusionScore,
    blockerCount,
    criticalConfusionCount,
    blocksLaunchReadiness,
    readinessState,
    scenarioResults,
    findings,
    confusionPoints,
    blockers,
    recommendations,
    cacheKey: buildCacheKey(scenarioResults),
  };

  recordFirstTimeUserRealityAssessment(assessment);
  return assessment;
}

export function buildFirstTimeUserRealityAuthorityArtifacts(
  report: FounderTestV4ReportWithUnknownDiscovery,
): {
  firstTimeUserRealityAuthority: FirstTimeUserRealityAssessment;
  firstTimeUserRealityAuthorityReportMarkdown: string;
} {
  const firstTimeUserRealityAuthority = assessFirstTimeUserRealityAuthority(report);
  return {
    firstTimeUserRealityAuthority,
    firstTimeUserRealityAuthorityReportMarkdown: buildFirstTimeUserRealityReportMarkdown(
      firstTimeUserRealityAuthority,
      report.generatedAt,
    ),
  };
}
