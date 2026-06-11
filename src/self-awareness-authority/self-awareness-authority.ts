/**
 * Self-Awareness Authority — deterministic operational self-awareness evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithTrust } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  MAX_SELF_AWARENESS_FINDINGS,
  MAX_SELF_AWARENESS_LIMITATIONS,
  MAX_SELF_AWARENESS_RECOMMENDATIONS,
  MAX_SELF_AWARENESS_SCENARIOS,
  SELF_AWARENESS_BLOCK_SCORE,
  SELF_AWARENESS_CACHE_KEY_PREFIX,
  SELF_AWARENESS_RISK_BLOCK_THRESHOLD,
} from './self-awareness-bounds.js';
import { recordSelfAwarenessAssessment } from './self-awareness-history.js';
import { buildSelfAwarenessReportMarkdown } from './self-awareness-report-builder.js';
import { SELF_AWARENESS_SCENARIOS } from './self-awareness-scenarios.js';
import type {
  SelfAwarenessAssessment,
  SelfAwarenessReadinessState,
  SelfAwarenessScenarioDefinition,
  SelfAwarenessScenarioResult,
} from './self-awareness-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function passThreshold(score: number): boolean {
  return score >= 60;
}

function countAuthorityLaunchBlockers(report: FounderTestV4ReportWithTrust): number {
  let count = 0;
  if (report.chatIntelligenceReality.blocksLaunchReadiness) count += 1;
  if (report.repositoryTypecheckReality.blocksLaunchReadiness) count += 1;
  if (report.skepticalFounderSimulator.blocksLaunchReadiness) count += 1;
  if (report.promiseFulfillment.blocksLaunchReadiness) count += 1;
  if (report.trustAuthority.blocksLaunchReadiness) count += 1;
  if (report.issues.some((issue) => issue.severity === 'BLOCKER')) count += 1;
  return count;
}

function evaluateCapabilityAwareness(report: FounderTestV4ReportWithTrust): SelfAwarenessScenarioResult {
  const fulfillment = report.promiseFulfillment;
  const builder = report.autonomousBuilderReality;
  const checks = [
    fulfillment.fulfilledCount >= 4,
    builder.canPlanWork,
    builder.canExecuteBuilds || builder.canCreatePreviews,
    report.ideaToAppScore >= 55,
    report.creationJourneyScore >= 55,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const limitations: string[] = [];
  if (!builder.canExecuteBuilds) limitations.push('Bounded build execution is not fully connected');
  if (fulfillment.unprovenCount > 0) {
    limitations.push(`${fulfillment.unprovenCount} capability promise(s) remain unproven`);
  }
  if (report.ideaToAppScore < 55) limitations.push('Idea-to-app capability proof remains weak');
  return {
    id: 'capability-awareness',
    category: 'CAPABILITY_AWARENESS',
    score,
    passed: passThreshold(score),
    findings: [
      `Fulfilled promises: ${fulfillment.fulfilledCount}`,
      `Autonomous builder score: ${builder.score}/100`,
      `Idea-to-app score: ${report.ideaToAppScore}/100`,
    ],
    limitations,
    recommendations: [
      'Report only capabilities with bounded Founder Testing and promise fulfillment proof.',
      'Separate planning support from connected build execution when describing what the system can do.',
    ],
  };
}

function evaluateLimitationAwareness(report: FounderTestV4ReportWithTrust): SelfAwarenessScenarioResult {
  const fulfillment = report.promiseFulfillment;
  const skeptical = report.skepticalFounderSimulator;
  const trust = report.trustAuthority;
  const surfacedLimitations =
    fulfillment.unprovenCount +
    fulfillment.contradictedCount +
    skeptical.objections.length +
    trust.trustRisks.length;
  const checks = [
    fulfillment.contradictedCount === 0 || fulfillment.recommendations.length > 0,
    fulfillment.unprovenCount <= 8 || fulfillment.recommendations.length > 0,
    skeptical.objections.length <= 12,
    trust.criticalTrustFailures === 0 || trust.criticalTrustFailureDetails.length > 0,
    surfacedLimitations >= 3,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100 - fulfillment.contradictedCount * 5);
  const limitations = [
    ...fulfillment.promiseAssessments
      .filter((assessment) => assessment.status === 'UNPROVEN' || assessment.status === 'CONTRADICTED')
      .slice(0, 4)
      .map((assessment) => `${assessment.promise}: ${assessment.status}`),
    ...skeptical.objections.slice(0, 3),
  ];
  if (fulfillment.contradictedCount > 0 && limitations.length === 0) {
    limitations.push('Contradicted promises exist but are not surfaced clearly enough');
  }
  return {
    id: 'limitation-awareness',
    category: 'LIMITATION_AWARENESS',
    score,
    passed: passThreshold(score),
    findings: [
      `Unproven promises: ${fulfillment.unprovenCount}`,
      `Contradicted promises: ${fulfillment.contradictedCount}`,
      `Skeptical objections: ${skeptical.objectionCount}`,
    ],
    limitations: [...new Set(limitations)].slice(0, 6),
    recommendations: fulfillment.recommendations.slice(0, 2).length
      ? fulfillment.recommendations.slice(0, 2)
      : ['Acknowledge unsupported claims and missing capabilities before describing readiness.'],
  };
}

function evaluateDependencyAwareness(report: FounderTestV4ReportWithTrust): SelfAwarenessScenarioResult {
  const typecheck = report.repositoryTypecheckReality;
  const verification = report.verificationResultsVisibility;
  const checks = [
    typecheck.founderProofNotes.length > 0 || typecheck.readinessState === 'TYPECHECK_CLEAN',
    verification.state !== 'NO_VERIFICATION_RUN' || typecheck.readinessState === 'TYPECHECK_NOT_RUN',
    report.chatIntelligenceReality.scenariosRun > 0,
    report.skepticalFounderSimulator.scenarioResults.length === 6,
    report.promiseFulfillment.promiseAssessments.length === 16,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const limitations: string[] = [];
  if (typecheck.readinessState === 'TYPECHECK_NOT_RUN') {
    limitations.push('Launch depends on repository typecheck baseline that is not established');
  }
  if (verification.state === 'NO_VERIFICATION_RUN') {
    limitations.push('Verification subsystem dependency has not produced visible evidence');
  }
  if (!report.autonomousBuilderReality.canExecuteBuilds) {
    limitations.push('Software creation depends on bounded execution paths that remain partially disconnected');
  }
  return {
    id: 'dependency-awareness',
    category: 'DEPENDENCY_AWARENESS',
    score,
    passed: passThreshold(score),
    findings: [
      `Repository typecheck state: ${typecheck.readinessState}`,
      `Verification state: ${verification.state}`,
      `Registered authority assessments available: skeptical, promise, trust`,
    ],
    limitations,
    recommendations: typecheck.recommendations.slice(0, 2).length
      ? typecheck.recommendations.slice(0, 2)
      : ['Identify repository, verification, and authority dependencies before claiming operational completeness.'],
  };
}

function evaluateLaunchAwareness(report: FounderTestV4ReportWithTrust): SelfAwarenessScenarioResult {
  const blockerCount = countAuthorityLaunchBlockers(report);
  const launchRisks = report.topLaunchRisks.length + report.skepticalFounderSimulator.objections.length;
  const explained =
    report.recommendedFixOrder.length > 0 ||
    report.skepticalFounderSimulator.recommendations.length > 0 ||
    report.trustAuthority.recommendations.length > 0;
  const checks = [
    blockerCount === 0 || explained,
    report.verificationResultsVisibility.readinessExplained,
    report.topLaunchRisks.length <= 4 || report.recommendedFixOrder.length > 0,
    report.skepticalFounderSimulator.blocksLaunchReadiness === (blockerCount > 0),
    report.trustAuthority.blocksLaunchReadiness === (blockerCount > 0 || report.trustAuthority.criticalTrustFailures > 0),
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100 - blockerCount * 4);
  const limitations: string[] = [];
  if (blockerCount > 0) {
    limitations.push(`${blockerCount} authority-level launch blocker signal(s) remain active`);
  }
  if (launchRisks > 0 && !explained) {
    limitations.push('Launch risks exist without enough visible explanation');
  }
  report.topLaunchRisks.slice(0, 3).forEach((risk) => limitations.push(`Launch risk: ${risk}`));
  return {
    id: 'launch-awareness',
    category: 'LAUNCH_AWARENESS',
    score,
    passed: passThreshold(score),
    findings: [
      `Authority launch blockers: ${blockerCount}`,
      `Founder Testing verdict: ${report.verdict}`,
      `Top launch risks recorded: ${report.topLaunchRisks.length}`,
    ],
    limitations: [...new Set(limitations)].slice(0, 6),
    recommendations: report.recommendedFixOrder.slice(0, 3).length
      ? report.recommendedFixOrder.slice(0, 3)
      : ['Explain why launch is blocked and what evidence remains missing.'],
  };
}

function evaluateEvidenceAwareness(report: FounderTestV4ReportWithTrust): SelfAwarenessScenarioResult {
  const fulfillment = report.promiseFulfillment;
  const trust = report.trustAuthority;
  const verification = report.verificationResultsVisibility;
  const checks = [
    verification.evidencePresent || verification.state === 'NO_VERIFICATION_RUN',
    fulfillment.unprovenCount <= fulfillment.fulfilledCount + fulfillment.partiallyFulfilledCount,
    fulfillment.contradictedCount === 0 || fulfillment.recommendations.length > 0,
    trust.scenarioResults.find((scenario) => scenario.id === 'evidence-trust')?.passed ?? false,
    report.verificationTrustEvidence.trustScore >= 0,
  ];
  const evidenceScenario = trust.scenarioResults.find((scenario) => scenario.id === 'evidence-trust');
  const score = clamp(
    ((checks.filter(Boolean).length / checks.length) * 100 +
      (evidenceScenario?.score ?? 0)) /
      2,
  );
  const limitations: string[] = [];
  if (fulfillment.unprovenCount > 0) {
    limitations.push(`${fulfillment.unprovenCount} claim(s) remain unproven by authority evidence`);
  }
  if (!verification.evidencePresent && verification.state !== 'NO_VERIFICATION_RUN') {
    limitations.push('Verification evidence is not visible enough to separate facts from assumptions');
  }
  if (fulfillment.contradictedCount > 0) {
    limitations.push(`${fulfillment.contradictedCount} claim(s) are contradicted by observed reality`);
  }
  return {
    id: 'evidence-awareness',
    category: 'EVIDENCE_AWARENESS',
    score,
    passed: passThreshold(score),
    findings: [
      `Verification evidence present: ${verification.evidencePresent ? 'Yes' : 'No'}`,
      `Fulfilled promises: ${fulfillment.fulfilledCount} | Unproven: ${fulfillment.unprovenCount}`,
      `Trust evidence scenario score: ${evidenceScenario?.score ?? 0}/100`,
    ],
    limitations,
    recommendations: [
      'Separate proven claims, unproven claims, assumptions, and uncertainty in every readiness narrative.',
      'Do not present assumptions as facts when authority evidence is missing.',
    ],
  };
}

function evaluateRealityAwareness(report: FounderTestV4ReportWithTrust): SelfAwarenessScenarioResult {
  const blockerCount = countAuthorityLaunchBlockers(report);
  const readinessClaim =
    report.verdict === 'READY_FOR_LAUNCH' ||
    report.verdict === 'READY_FOR_PUBLIC_BETA' ||
    report.launchReadinessReality.launchReadinessRealityScore >= 75;
  const authorityStates = [
    report.skepticalFounderSimulator.readinessState,
    report.promiseFulfillment.readinessState,
    report.trustAuthority.readinessState,
  ];
  const blockedStates = authorityStates.filter(
    (state) => state === 'BLOCKED' || state === 'HIGH_RISK' || state === 'RISK',
  ).length;
  const checks = [
    !readinessClaim || blockerCount === 0,
    report.launchReadinessReality.launchReadinessRealityScore >= 55 || !readinessClaim,
    blockedStates <= 2 || blockerCount > 0,
    report.verificationResultsVisibility.readinessExplained,
    report.topLaunchRisks.length <= 6,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100 - (readinessClaim && blockerCount > 0 ? 20 : 0));
  const limitations: string[] = [];
  if (readinessClaim && blockerCount > 0) {
    limitations.push('Product readiness messaging overstates authority-supported reality');
  }
  if (blockedStates >= 2) {
    limitations.push('Multiple authority readiness states indicate limited operational self-awareness');
  }
  limitations.push(`Aggregate authority blocker signals: ${blockerCount}`);
  return {
    id: 'reality-awareness',
    category: 'REALITY_AWARENESS',
    score,
    passed: passThreshold(score),
    findings: [
      `Launch readiness reality: ${report.launchReadinessReality.launchReadinessRealityScore}/100`,
      `Founder Testing verdict: ${report.verdict}`,
      `Authority readiness signals: skeptical=${report.skepticalFounderSimulator.readinessState}, promise=${report.promiseFulfillment.readinessState}, trust=${report.trustAuthority.readinessState}`,
    ],
    limitations: [...new Set(limitations)].slice(0, 6),
    recommendations: [
      'Describe current readiness using authority findings rather than optimistic product messaging alone.',
      'Align verdict, launch readiness reality, and authority blocker signals before claiming self-awareness.',
    ],
  };
}

const EVALUATORS: Record<
  SelfAwarenessScenarioDefinition['id'],
  (report: FounderTestV4ReportWithTrust) => SelfAwarenessScenarioResult
> = {
  'capability-awareness': evaluateCapabilityAwareness,
  'limitation-awareness': evaluateLimitationAwareness,
  'dependency-awareness': evaluateDependencyAwareness,
  'launch-awareness': evaluateLaunchAwareness,
  'evidence-awareness': evaluateEvidenceAwareness,
  'reality-awareness': evaluateRealityAwareness,
};

function detectCriticalAwarenessFailures(report: FounderTestV4ReportWithTrust): string[] {
  const failures: string[] = [];
  const blockerCount = countAuthorityLaunchBlockers(report);
  const readinessClaim =
    report.verdict === 'READY_FOR_LAUNCH' ||
    report.verdict === 'READY_FOR_PUBLIC_BETA' ||
    report.promiseFulfillment.promiseAssessments.find((assessment) => assessment.promiseId === 'launch-confidence')
      ?.status === 'FULFILLED';

  if (readinessClaim && blockerCount > 0) {
    failures.push('Claims readiness without proof while authority launch blockers remain active');
  }

  const hiddenBuilderGap =
    report.autonomousBuilderReality.canPlanWork &&
    !report.autonomousBuilderReality.canExecuteBuilds &&
    report.promiseFulfillment.fulfilledCount >= 6;
  if (hiddenBuilderGap) {
    failures.push('Claims capability without evidence — builder planning exists but execution is not connected');
  }

  if (report.promiseFulfillment.contradictedCount > 0 && report.promiseFulfillment.unprovenCount === 0) {
    failures.push('Misrepresents system state — contradicted promises are not balanced with visible limitations');
  }

  if (blockerCount >= 3 && !report.verificationResultsVisibility.readinessExplained) {
    failures.push('Hides launch blockers — multiple authority blockers exist without readiness explanation');
  }

  if (
    report.trustAuthority.criticalTrustFailures > 0 &&
    report.launchReadinessReality.launchReadinessRealityScore >= 70
  ) {
    failures.push('Confuses assumptions with facts — high readiness score despite critical trust failures');
  }

  if (
    report.repositoryTypecheckReality.blocksLaunchReadiness &&
    report.repositoryTypecheckReality.readinessState === 'TYPECHECK_NOT_RUN' &&
    report.launchReadinessReality.launchReadinessRealityScore >= 65
  ) {
    failures.push('Hides dependency failure — repository integrity baseline missing while readiness appears strong');
  }

  return failures;
}

function calculateSelfAwarenessRiskScore(
  scenarioResults: SelfAwarenessScenarioResult[],
  criticalAwarenessFailures: string[],
  report: FounderTestV4ReportWithTrust,
): number {
  const failedCount = scenarioResults.filter((scenario) => !scenario.passed).length;
  const limitationWeight = scenarioResults.reduce((sum, scenario) => sum + scenario.limitations.length, 0) * 2;
  const contradictionWeight =
    report.promiseFulfillment.contradictedCount * 8 + report.trustAuthority.criticalTrustFailures * 10;
  return clamp(failedCount * 12 + criticalAwarenessFailures.length * 15 + limitationWeight + contradictionWeight);
}

function deriveReadinessState(
  selfAwarenessScore: number,
  selfAwarenessRiskScore: number,
  blocksLaunchReadiness: boolean,
): SelfAwarenessReadinessState {
  if (blocksLaunchReadiness) return 'BLOCKED';
  if (selfAwarenessScore >= 75 && selfAwarenessRiskScore <= 40) return 'SELF_AWARE';
  if (selfAwarenessScore >= 60 && selfAwarenessRiskScore <= 70) return 'PARTIALLY_AWARE';
  return 'LIMITED_AWARENESS';
}

function buildCacheKey(scenarioResults: SelfAwarenessScenarioResult[]): string {
  const digest = scenarioResults
    .map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed ? 1 : 0}`)
    .join('|');
  return `${SELF_AWARENESS_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

export function assessSelfAwarenessAuthority(report: FounderTestV4ReportWithTrust): SelfAwarenessAssessment {
  const scenarioResults = SELF_AWARENESS_SCENARIOS.slice(0, MAX_SELF_AWARENESS_SCENARIOS).map((scenario) =>
    EVALUATORS[scenario.id](report),
  );
  const selfAwarenessScore = clamp(
    scenarioResults.reduce((sum, scenario) => sum + scenario.score, 0) / Math.max(1, scenarioResults.length),
  );
  const criticalAwarenessFailureDetails = detectCriticalAwarenessFailures(report);
  const criticalAwarenessFailures = criticalAwarenessFailureDetails.length;
  const selfAwarenessRiskScore = calculateSelfAwarenessRiskScore(
    scenarioResults,
    criticalAwarenessFailureDetails,
    report,
  );
  const blocksLaunchReadiness =
    selfAwarenessScore < SELF_AWARENESS_BLOCK_SCORE ||
    criticalAwarenessFailures > 0 ||
    selfAwarenessRiskScore > SELF_AWARENESS_RISK_BLOCK_THRESHOLD;
  const readinessState = deriveReadinessState(selfAwarenessScore, selfAwarenessRiskScore, blocksLaunchReadiness);
  const findings = [
    ...new Set([...scenarioResults.flatMap((scenario) => scenario.findings), ...criticalAwarenessFailureDetails]),
  ].slice(0, MAX_SELF_AWARENESS_FINDINGS);
  const limitations = [...new Set(scenarioResults.flatMap((scenario) => scenario.limitations))].slice(
    0,
    MAX_SELF_AWARENESS_LIMITATIONS,
  );
  const recommendations = [
    ...new Set([
      ...criticalAwarenessFailureDetails.map((failure) => `Resolve critical awareness failure: ${failure}`),
      ...scenarioResults.flatMap((scenario) => scenario.recommendations),
    ]),
  ].slice(0, MAX_SELF_AWARENESS_RECOMMENDATIONS);

  const assessment: SelfAwarenessAssessment = {
    readOnly: true,
    selfAwarenessScore,
    selfAwarenessRiskScore,
    criticalAwarenessFailures,
    blocksLaunchReadiness,
    readinessState,
    scenarioResults,
    criticalAwarenessFailureDetails,
    findings,
    limitations,
    recommendations,
    cacheKey: buildCacheKey(scenarioResults),
  };

  recordSelfAwarenessAssessment(assessment);
  return assessment;
}

export function buildSelfAwarenessAuthorityArtifacts(
  report: FounderTestV4ReportWithTrust,
): {
  selfAwarenessAuthority: SelfAwarenessAssessment;
  selfAwarenessAuthorityReportMarkdown: string;
} {
  const selfAwarenessAuthority = assessSelfAwarenessAuthority(report);
  return {
    selfAwarenessAuthority,
    selfAwarenessAuthorityReportMarkdown: buildSelfAwarenessReportMarkdown(
      selfAwarenessAuthority,
      report.generatedAt,
    ),
  };
}
