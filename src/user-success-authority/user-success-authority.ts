/**
 * User Success Authority — deterministic outcome achievement evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithSelfAwareness } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  MAX_USER_SUCCESS_BLOCKERS,
  MAX_USER_SUCCESS_FINDINGS,
  MAX_USER_SUCCESS_RECOMMENDATIONS,
  MAX_USER_SUCCESS_SCENARIOS,
  USER_SUCCESS_BLOCK_SCORE,
  USER_SUCCESS_CACHE_KEY_PREFIX,
  USER_SUCCESS_OUTCOME_BLOCK_SCORE,
} from './user-success-bounds.js';
import { recordUserSuccessAssessment } from './user-success-history.js';
import { buildUserSuccessReportMarkdown } from './user-success-report-builder.js';
import { USER_SUCCESS_SCENARIOS } from './user-success-scenarios.js';
import type {
  UserSuccessAssessment,
  UserSuccessReadinessState,
  UserSuccessScenarioDefinition,
  UserSuccessScenarioResult,
} from './user-success-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function passThreshold(score: number): boolean {
  return score >= 60;
}

function evaluateUnderstandingGoal(report: FounderTestV4ReportWithSelfAwareness): UserSuccessScenarioResult {
  const ftu = report.firstTimeUserReality;
  const purposeScenario = report.skepticalFounderSimulator.scenarioResults.find(
    (scenario) => scenario.id === 'purpose-challenge',
  );
  const purposePromise = report.promiseFulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'understands-product-ideas',
  );
  const checks = [
    ftu.productUnderstandingPass,
    ftu.firstTimeUserScore >= 60,
    (purposeScenario?.passed ?? false) || (purposePromise?.status ?? 'UNPROVEN') !== 'CONTRADICTED',
    report.selfAwarenessAuthority.scenarioResults.find((scenario) => scenario.id === 'capability-awareness')
      ?.passed ?? false,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const blockers: string[] = [];
  if (!ftu.productUnderstandingPass) blockers.push('Users may not understand product purpose on first contact');
  if ((purposePromise?.status ?? 'UNPROVEN') === 'UNPROVEN') {
    blockers.push('Product purpose remains only partially proven for real users');
  }
  if ((purposeScenario?.passed ?? false) === false) {
    blockers.push('Skeptical review still questions whether users can understand what AiDevEngine is for');
  }
  return {
    id: 'understanding-goal',
    category: 'UNDERSTANDING_GOAL',
    userGoal: 'Understand what this product is',
    score,
    passed: passThreshold(score),
    blockers,
    findings: [
      `First-time user score: ${ftu.firstTimeUserScore}/100`,
      `Product understanding pass: ${ftu.productUnderstandingPass ? 'Yes' : 'No'}`,
      `Purpose promise status: ${purposePromise?.status ?? 'UNPROVEN'}`,
    ],
    recommendations: ftu.recommendedFixes.slice(0, 2).length
      ? ftu.recommendedFixes.slice(0, 2)
      : ['Make product purpose, audience, and first-session value obvious before expecting user success.'],
  };
}

function evaluatePlanningGoal(report: FounderTestV4ReportWithSelfAwareness): UserSuccessScenarioResult {
  const planningPromise = report.promiseFulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'assists-planning',
  );
  const requirementsPromise = report.promiseFulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'understands-requirements',
  );
  const chat = report.chatIntelligenceReality;
  const checks = [
    report.creationJourneyScore >= 55,
    report.ideaToAppScore >= 55,
    (planningPromise?.status ?? 'UNPROVEN') !== 'CONTRADICTED',
    chat.scenariosPassed >= 5,
    report.autonomousBuilderReality.canPlanWork,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const blockers: string[] = [];
  if (!report.autonomousBuilderReality.canPlanWork) blockers.push('Users cannot reliably plan work inside the product');
  if ((requirementsPromise?.status ?? 'UNPROVEN') === 'UNPROVEN') {
    blockers.push('Requirement planning outcomes remain unproven for users');
  }
  if (chat.scenariosPassed < 5) blockers.push('Chat does not consistently help users structure plans or requirements');
  return {
    id: 'planning-goal',
    category: 'PLANNING_GOAL',
    userGoal: 'Plan what they want to build',
    score,
    passed: passThreshold(score),
    blockers,
    findings: [
      `Creation journey score: ${report.creationJourneyScore}/100`,
      `Planning promise status: ${planningPromise?.status ?? 'UNPROVEN'}`,
      `Chat scenarios passed: ${chat.scenariosPassed}/${chat.scenariosRun}`,
    ],
    recommendations: [
      'Help users define requirements, plans, and next steps with bounded actionable guidance.',
      'Connect planning outputs to visible project structure and follow-through actions.',
    ],
  };
}

function evaluateProblemSolvingGoal(report: FounderTestV4ReportWithSelfAwareness): UserSuccessScenarioResult {
  const chat = report.chatIntelligenceReality;
  const intelligenceTrust = report.trustAuthority.scenarioResults.find(
    (scenario) => scenario.id === 'intelligence-trust',
  );
  const checks = [
    !chat.blocksLaunchReadiness,
    chat.chatIntelligenceScore >= 65,
    chat.failedScenarios.length <= 2,
    intelligenceTrust?.passed ?? false,
    chat.requiredFixesBeforeLaunch.length <= 4,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100 - chat.failedScenarios.length * 5);
  const blockers: string[] = [];
  if (chat.blocksLaunchReadiness) blockers.push('Chat intelligence failures block useful problem-solving outcomes');
  if (chat.failedScenarios.length >= 3) {
    blockers.push('Users receive too many weak answers when trying to solve real problems');
  }
  if (!(intelligenceTrust?.passed ?? false)) {
    blockers.push('Users should not rely on intelligence output for decision-making yet');
  }
  return {
    id: 'problem-solving-goal',
    category: 'PROBLEM_SOLVING_GOAL',
    userGoal: 'Solve problems with the system',
    score,
    passed: passThreshold(score),
    blockers,
    findings: [
      `Chat intelligence score: ${chat.chatIntelligenceScore}/100`,
      `Intelligence trust scenario score: ${intelligenceTrust?.score ?? 0}/100`,
      `Failed chat scenarios: ${chat.failedScenarios.length}`,
    ],
    recommendations: chat.requiredFixesBeforeLaunch.slice(0, 2).length
      ? chat.requiredFixesBeforeLaunch.slice(0, 2)
      : ['Provide actionable recommendations, not generic responses, when users ask for help.'],
  };
}

function evaluateBuildGoal(report: FounderTestV4ReportWithSelfAwareness): UserSuccessScenarioResult {
  const builderPromise = report.promiseFulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'software-creation',
  );
  const architecturePromise = report.promiseFulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'architecture-support',
  );
  const builder = report.autonomousBuilderReality;
  const checks = [
    builder.canExecuteBuilds || builder.canCreatePreviews,
    builder.canCreateArchitecture || builder.canPlanWork,
    (builderPromise?.status ?? 'UNPROVEN') !== 'CONTRADICTED',
    report.ideaToAppScore >= 50,
    report.customerOutcome.valueDelivered,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const blockers: string[] = [];
  if (!builder.canExecuteBuilds) blockers.push('Users cannot make meaningful software-creation progress yet');
  if ((builderPromise?.status ?? 'UNPROVEN') === 'UNPROVEN') {
    blockers.push('Build outcomes remain unproven even if planning features exist');
  }
  if (!report.customerOutcome.valueDelivered) {
    blockers.push('Customer outcome simulation does not show delivered build value');
  }
  if ((architecturePromise?.status ?? 'UNPROVEN') === 'CONTRADICTED') {
    blockers.push('Architecture support claims contradict observed build reality');
  }
  return {
    id: 'build-goal',
    category: 'BUILD_GOAL',
    userGoal: 'Make progress toward creating software',
    score,
    passed: passThreshold(score),
    blockers,
    findings: [
      `Autonomous builder score: ${builder.score}/100`,
      `Build promise status: ${builderPromise?.status ?? 'UNPROVEN'}`,
      `Customer value delivered: ${report.customerOutcome.valueDelivered ? 'Yes' : 'No'}`,
    ],
    recommendations: [
      'Tie visible user progress to connected build, preview, or architecture outcomes.',
      'Do not treat planning alone as software creation success.',
    ],
  };
}

function evaluateLaunchGoal(report: FounderTestV4ReportWithSelfAwareness): UserSuccessScenarioResult {
  const launchPromise = report.promiseFulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'launch-confidence',
  );
  const readinessTrust = report.trustAuthority.scenarioResults.find((scenario) => scenario.id === 'readiness-trust');
  const launchAwareness = report.selfAwarenessAuthority.scenarioResults.find(
    (scenario) => scenario.id === 'launch-awareness',
  );
  const checks = [
    report.verificationResultsVisibility.readinessExplained,
    report.recommendedFixOrder.length > 0 || report.topLaunchRisks.length === 0,
    (launchPromise?.status ?? 'UNPROVEN') !== 'CONTRADICTED',
    readinessTrust?.passed ?? false,
    launchAwareness?.passed ?? false,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const blockers: string[] = [];
  if (!report.verificationResultsVisibility.readinessExplained) {
    blockers.push('Users cannot evaluate launch readiness because readiness is not explained clearly');
  }
  if ((launchPromise?.status ?? 'UNPROVEN') === 'CONTRADICTED') {
    blockers.push('Launch readiness messaging contradicts what users can verify');
  }
  report.topLaunchRisks.slice(0, 2).forEach((risk) => blockers.push(`Launch risk visible to users: ${risk}`));
  return {
    id: 'launch-goal',
    category: 'LAUNCH_GOAL',
    userGoal: 'Determine launch readiness',
    score,
    passed: passThreshold(score),
    blockers,
    findings: [
      `Launch promise status: ${launchPromise?.status ?? 'UNPROVEN'}`,
      `Readiness explained: ${report.verificationResultsVisibility.readinessExplained ? 'Yes' : 'No'}`,
      `Launch awareness score: ${launchAwareness?.score ?? 0}/100`,
    ],
    recommendations: report.recommendedFixOrder.slice(0, 3).length
      ? report.recommendedFixOrder.slice(0, 3)
      : ['Help users identify blockers, risks, and missing evidence before they decide to launch.'],
  };
}

function evaluateConfidenceGoal(report: FounderTestV4ReportWithSelfAwareness): UserSuccessScenarioResult {
  const trust = report.trustAuthority;
  const skeptical = report.skepticalFounderSimulator;
  const evidenceScenario = report.trustAuthority.scenarioResults.find((scenario) => scenario.id === 'evidence-trust');
  const checks = [
    trust.trustScore >= 60,
    trust.criticalTrustFailures === 0,
    skeptical.skepticalFounderScore >= 55,
    report.verificationResultsVisibility.evidencePresent || report.verificationTrustEvidence.trustPass,
    evidenceScenario?.passed ?? false,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100 - trust.criticalTrustFailures * 10);
  const blockers: string[] = [];
  if (trust.criticalTrustFailures > 0) {
    blockers.push('Critical trust failures reduce user confidence in decisions and recommendations');
  }
  if (skeptical.blocksLaunchReadiness) {
    blockers.push('Skeptical founder objections would reduce user confidence at launch time');
  }
  if (!(evidenceScenario?.passed ?? false)) {
    blockers.push('Users lack enough visible evidence to feel confident in outcomes');
  }
  return {
    id: 'confidence-goal',
    category: 'CONFIDENCE_GOAL',
    userGoal: 'Leave with more confidence than they started',
    score,
    passed: passThreshold(score),
    blockers,
    findings: [
      `Trust score: ${trust.trustScore}/100`,
      `Skeptical founder score: ${skeptical.skepticalFounderScore}/100`,
      `Evidence trust scenario score: ${evidenceScenario?.score ?? 0}/100`,
    ],
    recommendations: trust.recommendations.slice(0, 2).length
      ? trust.recommendations.slice(0, 2)
      : ['Increase evidence visibility and honest limitation disclosure to improve user confidence.'],
  };
}

const EVALUATORS: Record<
  UserSuccessScenarioDefinition['id'],
  (report: FounderTestV4ReportWithSelfAwareness) => UserSuccessScenarioResult
> = {
  'understanding-goal': evaluateUnderstandingGoal,
  'planning-goal': evaluatePlanningGoal,
  'problem-solving-goal': evaluateProblemSolvingGoal,
  'build-goal': evaluateBuildGoal,
  'launch-goal': evaluateLaunchGoal,
  'confidence-goal': evaluateConfidenceGoal,
};

function detectCriticalSuccessFailures(
  report: FounderTestV4ReportWithSelfAwareness,
  scenarioResults: UserSuccessScenarioResult[],
): string[] {
  const failures: string[] = [];
  const failedGoals = scenarioResults.filter((result) => !result.passed);

  if (!report.firstTimeUserReality.productUnderstandingPass) {
    failures.push('User cannot understand product purpose');
  }

  if (
    report.recommendedFixOrder.length === 0 &&
    (report.topLaunchRisks.length > 0 || report.issues.some((issue) => issue.severity === 'BLOCKER'))
  ) {
    failures.push('User cannot determine next step despite active blockers or risks');
  }

  if (!report.verificationResultsVisibility.readinessExplained && report.topLaunchRisks.length > 0) {
    failures.push('User cannot identify blockers and readiness gaps clearly enough');
  }

  if (
    report.promiseFulfillment.promiseAssessments.find((assessment) => assessment.promiseId === 'launch-confidence')
      ?.status === 'CONTRADICTED'
  ) {
    failures.push('User cannot evaluate readiness because launch claims contradict evidence');
  }

  if (
    report.chatIntelligenceReality.chatIntelligenceScore >= 60 &&
    report.chatIntelligenceReality.failedScenarios.length >= 3 &&
    report.recommendedFixOrder.length === 0
  ) {
    failures.push('User receives answers without actionable outcomes');
  }

  if (
    !report.autonomousBuilderReality.canExecuteBuilds &&
    !report.customerOutcome.valueDelivered &&
    failedGoals.some((goal) => goal.id === 'build-goal')
  ) {
    failures.push('User cannot progress toward software creation in a meaningful way');
  }

  return [...new Set(failures)];
}

function calculateOutcomeAchievementScore(scenarioResults: UserSuccessScenarioResult[]): number {
  const weights = [1.1, 1, 1.1, 1.2, 1.1, 1];
  const weighted = scenarioResults.reduce(
    (sum, scenario, index) => sum + scenario.score * (weights[index] ?? 1),
    0,
  );
  const totalWeight = weights.slice(0, scenarioResults.length).reduce((sum, weight) => sum + weight, 0);
  return clamp(weighted / Math.max(1, totalWeight));
}

function deriveReadinessState(
  userSuccessScore: number,
  outcomeAchievementScore: number,
  blocksLaunchReadiness: boolean,
): UserSuccessReadinessState {
  if (blocksLaunchReadiness) return 'BLOCKED';
  if (userSuccessScore >= 75 && outcomeAchievementScore >= 70) return 'USERS_SUCCEED';
  if (userSuccessScore >= 60 && outcomeAchievementScore >= 60) return 'PARTIAL_SUCCESS';
  return 'HIGH_FAILURE_RISK';
}

function buildCacheKey(scenarioResults: UserSuccessScenarioResult[]): string {
  const digest = scenarioResults
    .map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed ? 1 : 0}`)
    .join('|');
  return `${USER_SUCCESS_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

export function assessUserSuccessAuthority(report: FounderTestV4ReportWithSelfAwareness): UserSuccessAssessment {
  const scenarioResults = USER_SUCCESS_SCENARIOS.slice(0, MAX_USER_SUCCESS_SCENARIOS).map((scenario) =>
    EVALUATORS[scenario.id](report),
  );
  const userSuccessScore = clamp(
    scenarioResults.reduce((sum, scenario) => sum + scenario.score, 0) / Math.max(1, scenarioResults.length),
  );
  const outcomeAchievementScore = calculateOutcomeAchievementScore(scenarioResults);
  const failedGoalCount = scenarioResults.filter((scenario) => !scenario.passed).length;
  const criticalSuccessFailureDetails = detectCriticalSuccessFailures(report, scenarioResults);
  const criticalSuccessFailures = criticalSuccessFailureDetails.length;
  const blocksLaunchReadiness =
    userSuccessScore < USER_SUCCESS_BLOCK_SCORE ||
    criticalSuccessFailures > 0 ||
    outcomeAchievementScore < USER_SUCCESS_OUTCOME_BLOCK_SCORE;
  const readinessState = deriveReadinessState(userSuccessScore, outcomeAchievementScore, blocksLaunchReadiness);
  const findings = [
    ...new Set([...scenarioResults.flatMap((scenario) => scenario.findings), ...criticalSuccessFailureDetails]),
  ].slice(0, MAX_USER_SUCCESS_FINDINGS);
  const blockers = [...new Set(scenarioResults.flatMap((scenario) => scenario.blockers))].slice(
    0,
    MAX_USER_SUCCESS_BLOCKERS,
  );
  const recommendations = [
    ...new Set([
      ...criticalSuccessFailureDetails.map((failure) => `Resolve critical success failure: ${failure}`),
      ...scenarioResults.flatMap((scenario) => scenario.recommendations),
    ]),
  ].slice(0, MAX_USER_SUCCESS_RECOMMENDATIONS);

  const assessment: UserSuccessAssessment = {
    readOnly: true,
    userSuccessScore,
    outcomeAchievementScore,
    failedGoalCount,
    criticalSuccessFailures,
    blocksLaunchReadiness,
    readinessState,
    scenarioResults,
    criticalSuccessFailureDetails,
    findings,
    blockers,
    recommendations,
    cacheKey: buildCacheKey(scenarioResults),
  };

  recordUserSuccessAssessment(assessment);
  return assessment;
}

export function buildUserSuccessAuthorityArtifacts(
  report: FounderTestV4ReportWithSelfAwareness,
): {
  userSuccessAuthority: UserSuccessAssessment;
  userSuccessAuthorityReportMarkdown: string;
} {
  const userSuccessAuthority = assessUserSuccessAuthority(report);
  return {
    userSuccessAuthority,
    userSuccessAuthorityReportMarkdown: buildUserSuccessReportMarkdown(userSuccessAuthority, report.generatedAt),
  };
}
