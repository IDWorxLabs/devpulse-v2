/**
 * Trust Authority — deterministic trustworthiness evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithPromise } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  MAX_TRUST_FINDINGS,
  MAX_TRUST_RECOMMENDATIONS,
  MAX_TRUST_RISKS,
  MAX_TRUST_SCENARIOS,
  TRUST_AUTHORITY_CACHE_KEY_PREFIX,
  TRUST_LAUNCH_BLOCK_SCORE,
  TRUST_RISK_BLOCK_THRESHOLD,
} from './trust-authority-bounds.js';
import { recordTrustAuthorityAssessment } from './trust-history.js';
import { buildTrustAuthorityReportMarkdown } from './trust-report-builder.js';
import { TRUST_SCENARIOS } from './trust-scenarios.js';
import type {
  TrustAssessment,
  TrustReadinessState,
  TrustScenarioDefinition,
  TrustScenarioResult,
} from './trust-authority-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function passThreshold(score: number): boolean {
  return score >= 60;
}

function evaluateEvidenceTrust(report: FounderTestV4ReportWithPromise): TrustScenarioResult {
  const verification = report.verificationResultsVisibility;
  const trust = report.verificationTrustEvidence;
  const fulfillment = report.promiseFulfillment;
  const typecheck = report.repositoryTypecheckReality;
  const checks = [
    verification.evidencePresent,
    trust.trustPass,
    trust.trustScore >= 60,
    fulfillment.contradictedCount === 0,
    typecheck.readinessState !== 'TYPECHECK_FAILED',
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const trustRisks: string[] = [];
  if (!verification.evidencePresent) trustRisks.push('Confidence without visible verification evidence');
  if (!trust.trustPass) trustRisks.push('Verification trust checks do not pass');
  if (fulfillment.contradictedCount > 0) {
    trustRisks.push(`Contradicted promises undermine evidence trust (${fulfillment.contradictedCount})`);
  }
  if (typecheck.readinessState === 'TYPECHECK_NOT_RUN') {
    trustRisks.push('Repository compile integrity baseline not established');
  }
  return {
    id: 'evidence-trust',
    category: 'EVIDENCE_TRUST',
    score,
    passed: passThreshold(score),
    findings: [
      `Verification evidence present: ${verification.evidencePresent ? 'Yes' : 'No'}`,
      `Verification trust score: ${trust.trustScore}/100`,
      `Contradicted promises: ${fulfillment.contradictedCount}`,
      `Repository typecheck state: ${typecheck.readinessState}`,
    ],
    trustRisks,
    recommendations: [
      'Show explainable verification evidence before asking users to trust claims.',
      'Resolve contradicted promises or disclose them explicitly.',
    ],
  };
}

function evaluateHonestyTrust(report: FounderTestV4ReportWithPromise): TrustScenarioResult {
  const chat = report.chatIntelligenceReality;
  const skeptical = report.skepticalFounderSimulator;
  const honestyScenario = skeptical.scenarioResults.find((scenario) => scenario.id === 'honesty-challenge');
  const hiddenUncertainty = chat.failedScenarios.some(
    (scenario) => !scenario.passed && !scenario.criteria.self_diagnosis_present,
  );
  const checks = [
    chat.selfEvolution.advisoryOnly,
    honestyScenario?.passed ?? false,
    !skeptical.criticalTrustObjection,
    !hiddenUncertainty,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const trustRisks: string[] = [];
  if (hiddenUncertainty) trustRisks.push('Hidden uncertainty under direct honesty challenges');
  if (skeptical.criticalTrustObjection) trustRisks.push('Critical trust objection detected by skeptical founder review');
  if (!(honestyScenario?.passed ?? false)) trustRisks.push('System does not consistently admit limits under challenge');
  return {
    id: 'honesty-trust',
    category: 'HONESTY_TRUST',
    score,
    passed: passThreshold(score),
    findings: [
      `Chat self-evolution advisory only: ${chat.selfEvolution.advisoryOnly ? 'Yes' : 'No'}`,
      `Honesty challenge score: ${honestyScenario?.score ?? 0}/100`,
      `Critical trust objection: ${skeptical.criticalTrustObjection ? 'Yes' : 'No'}`,
    ],
    trustRisks,
    recommendations: skeptical.recommendations.slice(0, 2).length
      ? skeptical.recommendations.slice(0, 2)
      : ['State unknowns, limits, and disconnected systems explicitly before claiming readiness.'],
  };
}

function evaluateReadinessTrust(report: FounderTestV4ReportWithPromise): TrustScenarioResult {
  const fulfillment = report.promiseFulfillment;
  const launchPromise = fulfillment.promiseAssessments.find((assessment) => assessment.promiseId === 'launch-confidence');
  const launchBlockers =
    report.chatIntelligenceReality.blocksLaunchReadiness ||
    report.repositoryTypecheckReality.blocksLaunchReadiness ||
    report.skepticalFounderSimulator.blocksLaunchReadiness ||
    fulfillment.blocksLaunchReadiness ||
    report.issues.some((issue) => issue.severity === 'BLOCKER');
  const readinessClaim =
    report.verdict === 'READY_FOR_LAUNCH' ||
    report.verdict === 'READY_FOR_PUBLIC_BETA' ||
    launchPromise?.status === 'FULFILLED';
  const checks = [
    !launchBlockers || !readinessClaim,
    launchPromise?.status !== 'CONTRADICTED',
    report.launchReadinessReality.launchReadinessRealityScore >= 55 || !readinessClaim,
    report.verificationResultsVisibility.readinessExplained,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100 - (launchBlockers && readinessClaim ? 25 : 0));
  const trustRisks: string[] = [];
  if (launchBlockers && readinessClaim) trustRisks.push('Readiness without proof — launch claims exceed authority evidence');
  if (launchPromise?.status === 'CONTRADICTED') trustRisks.push('Launch-ready claim contradicted by evidence');
  if (!report.verificationResultsVisibility.readinessExplained) trustRisks.push('Readiness assessment not explained to users');
  return {
    id: 'readiness-trust',
    category: 'READINESS_TRUST',
    score,
    passed: passThreshold(score),
    findings: [
      `Founder Testing verdict: ${report.verdict}`,
      `Launch promise status: ${launchPromise?.status ?? 'UNPROVEN'}`,
      `Active launch blockers: ${launchBlockers ? 'Yes' : 'No'}`,
    ],
    trustRisks,
    recommendations: report.recommendedFixOrder.slice(0, 3).length
      ? report.recommendedFixOrder.slice(0, 3)
      : ['Align launch messaging with visible blockers and unresolved risks.'],
  };
}

function evaluateIntelligenceTrust(report: FounderTestV4ReportWithPromise): TrustScenarioResult {
  const chat = report.chatIntelligenceReality;
  const fakeConfidence = chat.chatIntelligenceScore >= 75 && chat.blocksLaunchReadiness;
  const genericFailures = chat.failedScenarios.filter((scenario) =>
    scenario.failureCategories.includes('GENERIC_ONBOARDING'),
  );
  const checks = [
    !chat.blocksLaunchReadiness,
    chat.scenariosPassed >= 6,
    chat.failedScenarios.length <= 2,
    !fakeConfidence,
    genericFailures.length === 0,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100 - chat.failedScenarios.length * 4);
  const trustRisks: string[] = [];
  if (fakeConfidence) trustRisks.push('Fake confidence — high intelligence score despite launch-blocking failures');
  if (genericFailures.length > 0) trustRisks.push('Generic responses undermine intelligence trust');
  if (chat.blocksLaunchReadiness) trustRisks.push('Intelligence trusted despite contradiction with bounded reality checks');
  return {
    id: 'intelligence-trust',
    category: 'INTELLIGENCE_TRUST',
    score,
    passed: passThreshold(score),
    findings: [
      `Chat intelligence score: ${chat.chatIntelligenceScore}/100`,
      `Scenarios passed: ${chat.scenariosPassed}/${chat.scenariosRun}`,
      `Blocks launch readiness: ${chat.blocksLaunchReadiness ? 'Yes' : 'No'}`,
    ],
    trustRisks,
    recommendations: chat.requiredFixesBeforeLaunch.slice(0, 2).length
      ? chat.requiredFixesBeforeLaunch.slice(0, 2)
      : ['Ground intelligence output in bounded evidence and disclose limits directly.'],
  };
}

function evaluateTransparencyTrust(report: FounderTestV4ReportWithPromise): TrustScenarioResult {
  const visibility = report.verificationResultsVisibility;
  const fulfillment = report.promiseFulfillment;
  const skeptical = report.skepticalFounderSimulator;
  const typecheck = report.repositoryTypecheckReality;
  const authorityFindings =
    skeptical.objections.length +
    fulfillment.recommendations.length +
    typecheck.founderProofNotes.length +
    report.recommendedFixOrder.length;
  const checks = [
    visibility.readinessExplained,
    visibility.evidencePresent || visibility.state === 'NO_VERIFICATION_RUN',
    fulfillment.recommendations.length > 0,
    typecheck.founderProofNotes.length > 0 || typecheck.readinessState === 'TYPECHECK_CLEAN',
    authorityFindings >= 3,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const trustRisks: string[] = [];
  if (!visibility.readinessExplained) trustRisks.push('Recommendation and readiness reasoning not visible enough');
  if (fulfillment.unprovenCount > 0 && fulfillment.contradictedCount === 0) {
    trustRisks.push(`${fulfillment.unprovenCount} unproven promise(s) not surfaced clearly enough`);
  }
  if (typecheck.readinessState === 'TYPECHECK_NOT_RUN') {
    trustRisks.push('Repository integrity issue not disclosed with sufficient founder proof');
  }
  return {
    id: 'transparency-trust',
    category: 'TRANSPARENCY_TRUST',
    score,
    passed: passThreshold(score),
    findings: [
      `Readiness explained: ${visibility.readinessExplained ? 'Yes' : 'No'}`,
      `Promise recommendations visible: ${fulfillment.recommendations.length > 0 ? 'Yes' : 'No'}`,
      `Authority findings surfaced: ${authorityFindings}`,
    ],
    trustRisks,
    recommendations: [
      'Make findings, recommendations, and reasoning visible across all authority outputs.',
      'Disclose unproven and contradicted claims before users rely on them.',
    ],
  };
}

const EVALUATORS: Record<
  TrustScenarioDefinition['id'],
  (report: FounderTestV4ReportWithPromise) => TrustScenarioResult
> = {
  'evidence-trust': evaluateEvidenceTrust,
  'honesty-trust': evaluateHonestyTrust,
  'readiness-trust': evaluateReadinessTrust,
  'intelligence-trust': evaluateIntelligenceTrust,
  'transparency-trust': evaluateTransparencyTrust,
};

function detectCriticalTrustFailures(report: FounderTestV4ReportWithPromise): string[] {
  const failures: string[] = [];
  const launchPromise = report.promiseFulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'launch-confidence',
  );
  const launchBlockers =
    report.chatIntelligenceReality.blocksLaunchReadiness ||
    report.repositoryTypecheckReality.blocksLaunchReadiness ||
    report.skepticalFounderSimulator.blocksLaunchReadiness ||
    report.promiseFulfillment.blocksLaunchReadiness;

  if (
    launchPromise?.status === 'CONTRADICTED' ||
    ((report.verdict === 'READY_FOR_LAUNCH' || report.verdict === 'READY_FOR_PUBLIC_BETA') && launchBlockers)
  ) {
    failures.push('Launch-ready claim contradicted by authority evidence');
  }

  const falselyFulfilled = report.promiseFulfillment.promiseAssessments.filter(
    (assessment) =>
      assessment.status === 'FULFILLED' &&
      assessment.supportingEvidence.length === 0 &&
      assessment.contradictoryEvidence.length > 0,
  );
  if (falselyFulfilled.length > 0) {
    failures.push('Promise marked fulfilled without sufficient supporting proof');
  }

  if (
    report.chatIntelligenceReality.chatIntelligenceScore >= 70 &&
    report.chatIntelligenceReality.blocksLaunchReadiness
  ) {
    failures.push('Intelligence appears trusted despite bounded contradiction signals');
  }

  if (
    launchBlockers &&
    !report.verificationResultsVisibility.readinessExplained &&
    report.launchReadinessReality.launchReadinessRealityScore >= 70
  ) {
    failures.push('Hidden launch blocker — readiness score overstates safe reliance');
  }

  if (
    report.repositoryTypecheckReality.blocksLaunchReadiness &&
    report.repositoryTypecheckReality.readinessState === 'TYPECHECK_NOT_RUN' &&
    report.launchReadinessReality.launchReadinessRealityScore >= 65
  ) {
    failures.push('Hidden repository integrity issue — compile baseline not established');
  }

  return failures;
}

function calculateTrustRiskScore(
  scenarioResults: TrustScenarioResult[],
  criticalTrustFailures: string[],
  report: FounderTestV4ReportWithPromise,
): number {
  const failedCount = scenarioResults.filter((scenario) => !scenario.passed).length;
  const riskWeight =
    report.promiseFulfillment.contradictedCount * 8 +
    report.skepticalFounderSimulator.objectionCount * 2 +
    scenarioResults.reduce((sum, scenario) => sum + scenario.trustRisks.length, 0) * 2;
  return clamp(failedCount * 12 + criticalTrustFailures.length * 15 + riskWeight);
}

function deriveReadinessState(
  trustScore: number,
  trustRiskScore: number,
  blocksLaunchReadiness: boolean,
): TrustReadinessState {
  if (blocksLaunchReadiness) return 'BLOCKED';
  if (trustScore >= 75 && trustRiskScore <= 40) return 'TRUSTED';
  if (trustScore >= 60 && trustRiskScore <= 70) return 'CAUTION';
  return 'HIGH_RISK';
}

function buildCacheKey(scenarioResults: TrustScenarioResult[]): string {
  const digest = scenarioResults
    .map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed ? 1 : 0}`)
    .join('|');
  return `${TRUST_AUTHORITY_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

export function assessTrustAuthority(report: FounderTestV4ReportWithPromise): TrustAssessment {
  const scenarioResults = TRUST_SCENARIOS.slice(0, MAX_TRUST_SCENARIOS).map((scenario) =>
    EVALUATORS[scenario.id](report),
  );
  const trustScore = clamp(
    scenarioResults.reduce((sum, scenario) => sum + scenario.score, 0) / Math.max(1, scenarioResults.length),
  );
  const criticalTrustFailureDetails = detectCriticalTrustFailures(report);
  const criticalTrustFailures = criticalTrustFailureDetails.length;
  const trustRiskScore = calculateTrustRiskScore(scenarioResults, criticalTrustFailureDetails, report);
  const blocksLaunchReadiness =
    trustScore < TRUST_LAUNCH_BLOCK_SCORE ||
    criticalTrustFailures > 0 ||
    trustRiskScore > TRUST_RISK_BLOCK_THRESHOLD;
  const readinessState = deriveReadinessState(trustScore, trustRiskScore, blocksLaunchReadiness);
  const findings = [
    ...new Set(scenarioResults.flatMap((scenario) => scenario.findings)),
    ...criticalTrustFailureDetails,
  ].slice(0, MAX_TRUST_FINDINGS);
  const trustRisks = [...new Set(scenarioResults.flatMap((scenario) => scenario.trustRisks))].slice(
    0,
    MAX_TRUST_RISKS,
  );
  const recommendations = [
    ...new Set([
      ...criticalTrustFailureDetails.map((failure) => `Resolve critical trust failure: ${failure}`),
      ...scenarioResults.flatMap((scenario) => scenario.recommendations),
    ]),
  ].slice(0, MAX_TRUST_RECOMMENDATIONS);

  const assessment: TrustAssessment = {
    readOnly: true,
    trustScore,
    trustRiskScore,
    criticalTrustFailures,
    blocksLaunchReadiness,
    readinessState,
    scenarioResults,
    criticalTrustFailureDetails,
    findings,
    trustRisks,
    recommendations,
    cacheKey: buildCacheKey(scenarioResults),
  };

  recordTrustAuthorityAssessment(assessment);
  return assessment;
}

export function buildTrustAuthorityArtifacts(
  report: FounderTestV4ReportWithPromise,
): {
  trustAuthority: TrustAssessment;
  trustAuthorityReportMarkdown: string;
} {
  const trustAuthority = assessTrustAuthority(report);
  return {
    trustAuthority,
    trustAuthorityReportMarkdown: buildTrustAuthorityReportMarkdown(trustAuthority, report.generatedAt),
  };
}
