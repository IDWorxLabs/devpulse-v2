/**
 * Customer Value Authority — deterministic customer value evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithFirstTimeUser } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  CUSTOMER_VALUE_BLOCK_SCORE,
  CUSTOMER_VALUE_CACHE_KEY_PREFIX,
  CUSTOMER_VALUE_CRITICAL_SCORE,
  CUSTOMER_VALUE_PASS_THRESHOLD,
  MAX_CUSTOMER_VALUE_FINDINGS,
  MAX_CUSTOMER_VALUE_RECOMMENDATIONS,
  MAX_CUSTOMER_VALUE_RISKS,
  MAX_CUSTOMER_VALUE_SIGNALS,
} from './customer-value-bounds.js';
import { recordCustomerValueAssessment } from './customer-value-history.js';
import { buildCustomerValueReportMarkdown } from './customer-value-report-builder.js';
import type {
  CustomerValueAssessment,
  CustomerValueReadinessState,
  CustomerValueScenarioResult,
} from './customer-value-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function passThreshold(score: number): boolean {
  return score >= CUSTOMER_VALUE_PASS_THRESHOLD;
}

function evaluateProblemValue(report: FounderTestV4ReportWithFirstTimeUser): CustomerValueScenarioResult {
  const success = report.userSuccessAuthority;
  const fulfillment = report.promiseFulfillment;
  const skeptical = report.skepticalFounderSimulator;
  const understandingGoal = success.scenarioResults.find((scenario) => scenario.id === 'understanding-goal');
  const problemPromise = fulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'understands-product-ideas',
  );
  const checks = [
    (understandingGoal?.passed ?? false),
    (problemPromise?.status ?? 'UNPROVEN') !== 'CONTRADICTED',
    fulfillment.fulfillmentScore >= CUSTOMER_VALUE_PASS_THRESHOLD,
    skeptical.scenarioResults.find((scenario) => scenario.id === 'purpose-challenge')?.passed ?? false,
    report.firstTimeUserRealityAuthority.scenarioResults.find((scenario) => scenario.id === 'product-understanding')
      ?.passed ?? false,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const valueSignals: string[] = [];
  const valueRisks: string[] = [];
  if (understandingGoal?.passed) valueSignals.push('Users can connect the product to a meaningful founder problem');
  if ((problemPromise?.status ?? 'UNPROVEN') === 'FULFILLED') {
    valueSignals.push('Problem relevance is supported by promise fulfillment evidence');
  }
  if (!understandingGoal?.passed) valueRisks.push('Problem clarity may be too weak to justify continued usage');
  if ((problemPromise?.status ?? 'UNPROVEN') === 'UNPROVEN') {
    valueRisks.push('Problem importance remains only partially proven');
  }
  return {
    id: 'problem-value',
    category: 'PROBLEM_VALUE',
    score,
    passed: passThreshold(score),
    valueSignals,
    valueRisks,
    findings: [
      `User success understanding goal: ${understandingGoal?.passed ? 'Passed' : 'Failed'}`,
      `Problem promise status: ${problemPromise?.status ?? 'UNPROVEN'}`,
      `Promise fulfillment score: ${fulfillment.fulfillmentScore}/100`,
    ],
    recommendations: [
      'Make the meaningful founder problem and outcome relevance obvious before expecting retention.',
      ...success.recommendations.slice(0, 1),
    ],
  };
}

function evaluateOutcomeValue(report: FounderTestV4ReportWithFirstTimeUser): CustomerValueScenarioResult {
  const success = report.userSuccessAuthority;
  const chat = report.chatIntelligenceReality;
  const problemGoal = success.scenarioResults.find((scenario) => scenario.id === 'problem-solving-goal');
  const planningGoal = success.scenarioResults.find((scenario) => scenario.id === 'planning-goal');
  const checks = [
    success.outcomeAchievementScore >= CUSTOMER_VALUE_PASS_THRESHOLD,
    problemGoal?.passed ?? false,
    planningGoal?.passed ?? false,
    chat.scenariosPassed >= 5,
    report.ideaToAppScore >= 55,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const valueSignals: string[] = [];
  const valueRisks: string[] = [];
  if (success.outcomeAchievementScore >= CUSTOMER_VALUE_PASS_THRESHOLD) {
    valueSignals.push('Users can leave with measurable outcome progress');
  }
  if (planningGoal?.passed) valueSignals.push('Planning outputs create actionable progress');
  if (success.outcomeAchievementScore < CUSTOMER_VALUE_PASS_THRESHOLD) {
    valueRisks.push('No meaningful outcome may be delivered to users');
  }
  if (!(problemGoal?.passed ?? false)) valueRisks.push('Useful results from problem-solving paths remain weak');
  return {
    id: 'outcome-value',
    category: 'OUTCOME_VALUE',
    score,
    passed: passThreshold(score),
    valueSignals,
    valueRisks,
    findings: [
      `Outcome achievement score: ${success.outcomeAchievementScore}/100`,
      `Problem-solving goal: ${problemGoal?.passed ? 'Passed' : 'Failed'}`,
      `Chat scenarios passed: ${chat.scenariosPassed}/${chat.scenariosRun}`,
    ],
    recommendations: [
      'Ensure each session leaves users with clearer requirements, better decisions, or visible progress.',
      ...success.recommendations.slice(0, 1),
    ],
  };
}

function evaluateTimeValue(report: FounderTestV4ReportWithFirstTimeUser): CustomerValueScenarioResult {
  const success = report.userSuccessAuthority;
  const checks = [
    report.creationJourneyScore >= 55,
    report.launchReadinessReality.executionReadiness >= 55,
    report.autonomousBuilderReality.canPlanWork,
    success.scenarioResults.find((scenario) => scenario.id === 'planning-goal')?.passed ?? false,
    report.recommendedFixOrder.length <= 6,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const valueSignals: string[] = [];
  const valueRisks: string[] = [];
  if (report.creationJourneyScore >= 55) valueSignals.push('Creation journey suggests meaningful acceleration');
  if (report.autonomousBuilderReality.canPlanWork) valueSignals.push('Planning work can be simplified for users');
  if (report.creationJourneyScore < CUSTOMER_VALUE_PASS_THRESHOLD) {
    valueRisks.push('Time savings may be too limited to justify continued usage');
  }
  if (!report.autonomousBuilderReality.canPlanWork) {
    valueRisks.push('Users may spend effort without simplified validation paths');
  }
  return {
    id: 'time-value',
    category: 'TIME_VALUE',
    score,
    passed: passThreshold(score),
    valueSignals,
    valueRisks,
    findings: [
      `Creation journey score: ${report.creationJourneyScore}/100`,
      `Execution readiness: ${report.launchReadinessReality.executionReadiness}/100`,
      `Can plan work: ${report.autonomousBuilderReality.canPlanWork ? 'Yes' : 'No'}`,
    ],
    recommendations: [
      'Reduce effort in planning, validation, and problem solving so users save meaningful time.',
      ...report.recommendedFixOrder.slice(0, 1),
    ],
  };
}

function evaluateTrustValue(report: FounderTestV4ReportWithFirstTimeUser): CustomerValueScenarioResult {
  const trust = report.trustAuthority;
  const fulfillment = report.promiseFulfillment;
  const honestyPromise = fulfillment.promiseAssessments.find((assessment) => assessment.promiseId === 'honesty');
  const checks = [
    trust.trustScore >= CUSTOMER_VALUE_PASS_THRESHOLD,
    report.verificationResultsVisibility.evidencePresent,
    (honestyPromise?.status ?? 'UNPROVEN') !== 'CONTRADICTED',
    trust.scenarioResults.find((scenario) => scenario.id === 'transparency-trust')?.passed ?? false,
    !report.skepticalFounderSimulator.criticalTrustObjection,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const valueSignals: string[] = [];
  const valueRisks: string[] = [];
  if (report.verificationResultsVisibility.evidencePresent) {
    valueSignals.push('Evidence visibility increases confidence in recommendations');
  }
  if (trust.trustScore >= CUSTOMER_VALUE_PASS_THRESHOLD) {
    valueSignals.push('Trustworthy guidance can increase perceived value');
  }
  if (trust.criticalTrustFailures > 0) valueRisks.push('Value claims may be unsupported by evidence');
  if (!report.verificationResultsVisibility.evidencePresent) {
    valueRisks.push('Users may not trust results enough to act on them');
  }
  return {
    id: 'trust-value',
    category: 'TRUST_VALUE',
    score,
    passed: passThreshold(score),
    valueSignals,
    valueRisks,
    findings: [
      `Trust score: ${trust.trustScore}/100`,
      `Verification evidence visible: ${report.verificationResultsVisibility.evidencePresent ? 'Yes' : 'No'}`,
      `Honesty promise status: ${honestyPromise?.status ?? 'UNPROVEN'}`,
    ],
    recommendations: trust.recommendations.slice(0, 2).length
      ? trust.recommendations.slice(0, 2)
      : ['Increase trust value by making evidence and uncertainty visible with recommendations.'],
  };
}

function evaluateRepeatUsageValue(report: FounderTestV4ReportWithFirstTimeUser): CustomerValueScenarioResult {
  const success = report.userSuccessAuthority;
  const awareness = report.selfAwarenessAuthority;
  const skeptical = report.skepticalFounderSimulator;
  const confidenceGoal = success.scenarioResults.find((scenario) => scenario.id === 'confidence-goal');
  const launchGoal = success.scenarioResults.find((scenario) => scenario.id === 'launch-goal');
  const checks = [
    success.userSuccessScore >= CUSTOMER_VALUE_PASS_THRESHOLD,
    confidenceGoal?.passed ?? false,
    launchGoal?.passed ?? false,
    awareness.readinessState === 'SELF_AWARE' || awareness.readinessState === 'PARTIALLY_AWARE',
    skeptical.scenarioResults.find((scenario) => scenario.id === 'competitive-challenge')?.passed ?? false,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const valueSignals: string[] = [];
  const valueRisks: string[] = [];
  if (confidenceGoal?.passed) valueSignals.push('Users have reason to return for ongoing decision support');
  if (launchGoal?.passed) valueSignals.push('Launch and verification paths support recurring usefulness');
  if (!(confidenceGoal?.passed ?? false)) valueRisks.push('No strong reason to return tomorrow');
  if (success.criticalSuccessFailures > 0) valueRisks.push('Users may succeed once but gain little repeatable value');
  return {
    id: 'repeat-usage-value',
    category: 'REPEAT_USAGE_VALUE',
    score,
    passed: passThreshold(score),
    valueSignals,
    valueRisks,
    findings: [
      `User success score: ${success.userSuccessScore}/100`,
      `Confidence goal: ${confidenceGoal?.passed ? 'Passed' : 'Failed'}`,
      `Self-awareness readiness: ${awareness.readinessState}`,
    ],
    recommendations: [
      'Design repeatable outcomes for ongoing planning, verification, and decision support.',
      ...awareness.recommendations.slice(0, 1),
    ],
  };
}

function evaluateDifferentiationValue(report: FounderTestV4ReportWithFirstTimeUser): CustomerValueScenarioResult {
  const fulfillment = report.promiseFulfillment;
  const gaps = report.gapDetectionAuthority;
  const skeptical = report.skepticalFounderSimulator;
  const launchPromise = fulfillment.promiseAssessments.find((assessment) => assessment.promiseId === 'launch-confidence');
  const verificationPromise = fulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'verification-visibility',
  );
  const checks = [
    fulfillment.fulfilledCount >= 2,
    (launchPromise?.status ?? 'UNPROVEN') !== 'CONTRADICTED',
    (verificationPromise?.status ?? 'UNPROVEN') !== 'CONTRADICTED',
    gaps.detectedGaps.filter((gap) => gap.category === 'CAPABILITY_GAPS').length <= 2,
    skeptical.scenarioResults.find((scenario) => scenario.id === 'competitive-challenge')?.passed ?? false,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const valueSignals: string[] = [];
  const valueRisks: string[] = [];
  if ((verificationPromise?.status ?? 'UNPROVEN') === 'FULFILLED') {
    valueSignals.push('Authority-based verification creates differentiated value');
  }
  if (fulfillment.fulfilledCount >= 2) valueSignals.push('Multiple fulfilled promises suggest unique capability advantage');
  if (!(skeptical.scenarioResults.find((scenario) => scenario.id === 'competitive-challenge')?.passed ?? false)) {
    valueRisks.push('No differentiated value versus alternatives is clearly proven');
  }
  if (gaps.criticalGapCount > 0) valueRisks.push('Missing capabilities weaken differentiated outcomes');
  return {
    id: 'differentiation-value',
    category: 'DIFFERENTIATION_VALUE',
    score,
    passed: passThreshold(score),
    valueSignals,
    valueRisks,
    findings: [
      `Fulfilled promises: ${fulfillment.fulfilledCount}`,
      `Launch confidence promise: ${launchPromise?.status ?? 'UNPROVEN'}`,
      `Critical gaps: ${gaps.criticalGapCount}`,
    ],
    recommendations: [
      'Make differentiated value explicit: launch intelligence, authority-based verification, founder readiness evaluation.',
      ...fulfillment.recommendations.slice(0, 1),
    ],
  };
}

const EVALUATORS = [
  evaluateProblemValue,
  evaluateOutcomeValue,
  evaluateTimeValue,
  evaluateTrustValue,
  evaluateRepeatUsageValue,
  evaluateDifferentiationValue,
] as const;

function calculateRetentionValueScore(scenarioResults: CustomerValueScenarioResult[]): number {
  const problem = scenarioResults.find((scenario) => scenario.id === 'problem-value')?.score ?? 0;
  const outcome = scenarioResults.find((scenario) => scenario.id === 'outcome-value')?.score ?? 0;
  const repeat = scenarioResults.find((scenario) => scenario.id === 'repeat-usage-value')?.score ?? 0;
  return clamp(repeat * 0.4 + outcome * 0.35 + problem * 0.25);
}

function calculateValueRiskScore(
  scenarioResults: CustomerValueScenarioResult[],
  customerValueScore: number,
  criticalValueFailures: number,
): number {
  const lowCategories = scenarioResults.filter((scenario) => scenario.score < CUSTOMER_VALUE_PASS_THRESHOLD).length;
  const riskCount = scenarioResults.reduce((sum, scenario) => sum + scenario.valueRisks.length, 0);
  return clamp(lowCategories * 12 + criticalValueFailures * 20 + riskCount * 4 + Math.max(0, CUSTOMER_VALUE_PASS_THRESHOLD - customerValueScore));
}

function countCriticalValueFailures(scenarioResults: CustomerValueScenarioResult[]): number {
  return scenarioResults.filter(
    (scenario) => !scenario.passed && scenario.score < CUSTOMER_VALUE_CRITICAL_SCORE,
  ).length;
}

function deriveReadinessState(
  customerValueScore: number,
  retentionValueScore: number,
  criticalValueFailures: number,
  blocksLaunchReadiness: boolean,
): CustomerValueReadinessState {
  if (blocksLaunchReadiness) return 'BLOCKED';
  if (criticalValueFailures > 0 || customerValueScore < CUSTOMER_VALUE_BLOCK_SCORE || retentionValueScore < CUSTOMER_VALUE_BLOCK_SCORE) {
    return 'LOW_VALUE';
  }
  if (customerValueScore >= 75 && retentionValueScore >= 70) return 'HIGH_VALUE';
  return 'MODERATE_VALUE';
}

function buildCacheKey(scenarioResults: CustomerValueScenarioResult[]): string {
  const digest = scenarioResults.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  return `${CUSTOMER_VALUE_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

export function assessCustomerValueAuthority(report: FounderTestV4ReportWithFirstTimeUser): CustomerValueAssessment {
  const scenarioResults = EVALUATORS.map((evaluate) => evaluate(report));
  const customerValueScore = clamp(
    scenarioResults.reduce((sum, scenario) => sum + scenario.score, 0) / scenarioResults.length,
  );
  const retentionValueScore = calculateRetentionValueScore(scenarioResults);
  const criticalValueFailures = countCriticalValueFailures(scenarioResults);
  const valueRiskScore = calculateValueRiskScore(scenarioResults, customerValueScore, criticalValueFailures);
  const valueSignals = [...new Set(scenarioResults.flatMap((scenario) => scenario.valueSignals))].slice(
    0,
    MAX_CUSTOMER_VALUE_SIGNALS,
  );
  const valueRisks = [...new Set(scenarioResults.flatMap((scenario) => scenario.valueRisks))].slice(
    0,
    MAX_CUSTOMER_VALUE_RISKS,
  );
  const blocksLaunchReadiness =
    customerValueScore < CUSTOMER_VALUE_BLOCK_SCORE ||
    retentionValueScore < CUSTOMER_VALUE_BLOCK_SCORE ||
    criticalValueFailures > 0;
  const readinessState = deriveReadinessState(
    customerValueScore,
    retentionValueScore,
    criticalValueFailures,
    blocksLaunchReadiness,
  );
  const findings = [...new Set(scenarioResults.flatMap((scenario) => scenario.findings))].slice(
    0,
    MAX_CUSTOMER_VALUE_FINDINGS,
  );
  const recommendations = [
    'A product only succeeds long-term if it creates meaningful value that users want to return for.',
    ...new Set(scenarioResults.flatMap((scenario) => scenario.recommendations)),
    ...valueRisks.slice(0, 3).map((risk) => `Reduce value risk: ${risk}`),
  ].slice(0, MAX_CUSTOMER_VALUE_RECOMMENDATIONS);

  const assessment: CustomerValueAssessment = {
    readOnly: true,
    advisoryOnly: true,
    customerValueScore,
    retentionValueScore,
    valueRiskScore,
    criticalValueFailures,
    blocksLaunchReadiness,
    readinessState,
    scenarioResults,
    findings,
    valueSignals,
    valueRisks,
    recommendations,
    cacheKey: buildCacheKey(scenarioResults),
  };

  recordCustomerValueAssessment(assessment);
  return assessment;
}

export function buildCustomerValueAuthorityArtifacts(
  report: FounderTestV4ReportWithFirstTimeUser,
): {
  customerValueAuthority: CustomerValueAssessment;
  customerValueAuthorityReportMarkdown: string;
} {
  const customerValueAuthority = assessCustomerValueAuthority(report);
  return {
    customerValueAuthority,
    customerValueAuthorityReportMarkdown: buildCustomerValueReportMarkdown(
      customerValueAuthority,
      report.generatedAt,
    ),
  };
}
