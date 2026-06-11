/**
 * Skeptical Founder Simulator Authority — deterministic adversarial founder evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportCore } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  MAX_SKEPTICAL_OBJECTIONS,
  MAX_SKEPTICAL_RECOMMENDATIONS,
  MAX_SKEPTICAL_SCENARIOS,
  SKEPTICAL_FOUNDER_CACHE_KEY_PREFIX,
  SKEPTICAL_LAUNCH_BLOCK_SCORE,
  SKEPTICAL_LAUNCH_RISK_BLOCK_THRESHOLD,
} from './skeptical-founder-bounds.js';
import { recordSkepticalFounderAssessment } from './skeptical-founder-history.js';
import { buildSkepticalFounderReportMarkdown } from './skeptical-founder-report-builder.js';
import { SKEPTICAL_FOUNDER_SCENARIOS } from './skeptical-founder-scenarios.js';
import type {
  SkepticalFounderAssessment,
  SkepticalFounderReadinessState,
  SkepticalFounderScenarioDefinition,
  SkepticalFounderScenarioResult,
} from './skeptical-founder-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function passThreshold(score: number): boolean {
  return score >= 60;
}

function evaluateTrustChallenge(report: FounderTestV4ReportCore): SkepticalFounderScenarioResult {
  const trust = report.verificationTrustEvidence;
  const verification = report.verificationResultsVisibility;
  const promise = report.promiseRealityEngine;
  const checks = [
    trust.trustPass,
    trust.trustScore >= 60,
    verification.evidencePresent,
    verification.readinessExplained,
    promise.provenClaims.length > 0,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const objections: string[] = [];
  if (!trust.trustPass) objections.push('Trust evidence is not strong enough for a skeptical founder.');
  if (!verification.evidencePresent) objections.push('Verification evidence is not visible enough to prove claims.');
  if (promise.unprovenClaims.length > 0) {
    objections.push(`Major claims lack proof (${promise.unprovenClaims.length} unproven).`);
  }
  return {
    id: 'trust-challenge',
    category: 'TRUST_CHALLENGE',
    question: SKEPTICAL_FOUNDER_SCENARIOS[0].question,
    score,
    passed: passThreshold(score),
    findings: [
      `Verification trust score: ${trust.trustScore}/100`,
      `Verification evidence present: ${verification.evidencePresent ? 'Yes' : 'No'}`,
      `Proven claims: ${promise.provenClaims.length}`,
    ],
    objections,
    recommendations: [
      'Show explainable verification evidence before asking for launch trust.',
      'Convert unproven claims into evidence-backed proof or explicit caveats.',
    ],
  };
}

function evaluateIntelligenceChallenge(report: FounderTestV4ReportCore): SkepticalFounderScenarioResult {
  const chat = report.chatIntelligenceReality;
  const checks = [
    !chat.blocksLaunchReadiness,
    chat.scenariosPassed >= 6,
    chat.chatIntelligenceScore >= 70,
    chat.failedScenarios.length <= 2,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100 - chat.failedScenarios.length * 5);
  const objections: string[] = [];
  if (chat.blocksLaunchReadiness) objections.push('Chat intelligence fails bounded reality checks.');
  if (chat.failedScenarios.length > 0) {
    objections.push(`Chat failed ${chat.failedScenarios.length} intelligence scenario(s).`);
  }
  return {
    id: 'intelligence-challenge',
    category: 'INTELLIGENCE_CHALLENGE',
    question: SKEPTICAL_FOUNDER_SCENARIOS[1].question,
    score,
    passed: passThreshold(score),
    findings: [
      `Chat intelligence score: ${chat.chatIntelligenceScore}/100`,
      `Scenarios passed: ${chat.scenariosPassed}/${chat.scenariosRun}`,
    ],
    objections,
    recommendations: chat.requiredFixesBeforeLaunch.slice(0, 2).length
      ? chat.requiredFixesBeforeLaunch.slice(0, 2)
      : ['Keep chat answers grounded, useful, and purpose-aware under direct founder questions.'],
  };
}

function evaluatePurposeChallenge(report: FounderTestV4ReportCore): SkepticalFounderScenarioResult {
  const ftu = report.firstTimeUserReality;
  const sense = report.founderSensemaking;
  const checks = [
    ftu.productUnderstandingPass,
    ftu.firstTimeUserScore >= 60,
    sense.productCoherenceScore >= 55,
    report.creationJourneyScore >= 55,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const objections: string[] = [];
  if (!ftu.productUnderstandingPass) objections.push('First-time users may not understand what AiDevEngine is for.');
  if (sense.topConfusionRisks.length > 0) {
    objections.push(`Product coherence risks remain: ${sense.topConfusionRisks[0]?.whatDoesNotMakeSense ?? 'unclear purpose'}`);
  }
  return {
    id: 'purpose-challenge',
    category: 'PURPOSE_CHALLENGE',
    question: SKEPTICAL_FOUNDER_SCENARIOS[2].question,
    score,
    passed: passThreshold(score),
    findings: [
      `First-time user score: ${ftu.firstTimeUserScore}/100`,
      `Product coherence: ${sense.productCoherenceScore}/100`,
    ],
    objections,
    recommendations: [
      'Make product purpose, audience, and core workflow obvious within the first founder session.',
      'Resolve top confusion risks before asking for launch trust.',
    ],
  };
}

function evaluateLaunchChallenge(report: FounderTestV4ReportCore): SkepticalFounderScenarioResult {
  const launchDay = report.launchDaySimulation;
  const adoption = report.adoptionPrediction;
  const checks = [
    report.topLaunchRisks.length <= 2,
    report.verdict === 'READY_FOR_LAUNCH' || report.verdict === 'READY_FOR_PUBLIC_BETA',
    !launchDay.majorLaunchRisks,
    !adoption.majorAdoptionRisks,
    report.launchReadinessReality.launchReadinessRealityScore >= 70,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100 - report.topLaunchRisks.length * 4);
  const objections: string[] = [];
  if (report.topLaunchRisks.length > 0) {
    objections.push(`Launch risks remain: ${report.topLaunchRisks.slice(0, 2).join('; ')}`);
  }
  if (launchDay.majorLaunchRisks) objections.push('Launch day simulation detected major operational risks.');
  if (adoption.majorAdoptionRisks) objections.push('Adoption prediction detected major post-launch barriers.');
  return {
    id: 'launch-challenge',
    category: 'LAUNCH_CHALLENGE',
    question: SKEPTICAL_FOUNDER_SCENARIOS[3].question,
    score,
    passed: passThreshold(score),
    findings: [
      `Founder Testing verdict: ${report.verdict}`,
      `Launch readiness reality: ${report.launchReadinessReality.launchReadinessRealityScore}/100`,
    ],
    objections,
    recommendations: report.recommendedFixOrder.slice(0, 3),
  };
}

function evaluateCompetitiveChallenge(report: FounderTestV4ReportCore): SkepticalFounderScenarioResult {
  const competitive = report.competitiveReality;
  const checks = [
    competitive.competitiveRealityPass,
    competitive.strongestCompetitiveAdvantages.length > 0,
    !competitive.majorCompetitiveRisks,
    competitive.competitiveRealityScore >= 55,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const objections: string[] = [];
  if (!competitive.competitiveRealityPass) objections.push('Competitive differentiation is not yet convincing.');
  if (competitive.competitiveBlindSpots.length > 0) {
    objections.push(`Competitive blind spots: ${competitive.competitiveBlindSpots.slice(0, 2).join('; ')}`);
  }
  return {
    id: 'competitive-challenge',
    category: 'COMPETITIVE_CHALLENGE',
    question: SKEPTICAL_FOUNDER_SCENARIOS[4].question,
    score,
    passed: passThreshold(score),
    findings: [
      `Competitive reality score: ${competitive.competitiveRealityScore}/100`,
      `Position: ${competitive.competitivePosition}`,
    ],
    objections,
    recommendations: competitive.strongestCompetitiveAdvantages.slice(0, 2).length
      ? competitive.strongestCompetitiveAdvantages.slice(0, 2).map((item) => `Prove advantage: ${item}`)
      : ['Articulate a evidence-backed reason to choose AiDevEngine over generic builders.'],
  };
}

function evaluateHonestyChallenge(report: FounderTestV4ReportCore): SkepticalFounderScenarioResult {
  const chat = report.chatIntelligenceReality;
  const typecheck = report.repositoryTypecheckReality;
  const checks = [
    chat.selfEvolution.advisoryOnly,
    typecheck.readinessState !== 'TYPECHECK_NOT_RUN' || typecheck.errorCount === 0,
    report.chatIntelligenceReality.failedScenarios.every((s) => s.criteria.self_diagnosis_present || s.passed),
    report.repositoryTypecheckReality.founderProofNotes.length > 0,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100 - (typecheck.readinessState === 'TYPECHECK_NOT_RUN' ? 20 : 0));
  const objections: string[] = [];
  if (typecheck.readinessState === 'TYPECHECK_NOT_RUN') {
    objections.push('Repository compile integrity baseline has not been established.');
  }
  if (chat.failedScenarios.some((s) => !s.criteria.self_diagnosis_present && !s.passed)) {
    objections.push('Chat lacks operational self-diagnosis under direct honesty challenges.');
  }
  return {
    id: 'honesty-challenge',
    category: 'HONESTY_CHALLENGE',
    question: SKEPTICAL_FOUNDER_SCENARIOS[5].question,
    score,
    passed: passThreshold(score),
    findings: [
      `Repository typecheck state: ${typecheck.readinessState}`,
      `Chat self-evolution advisory only: ${chat.selfEvolution.advisoryOnly ? 'Yes' : 'No'}`,
    ],
    objections,
    recommendations: [
      'State unknowns, limits, and disconnected systems explicitly before claiming readiness.',
      'Establish a clean repository typecheck baseline and surface it to founders.',
    ],
  };
}

const EVALUATORS: Record<
  SkepticalFounderScenarioDefinition['id'],
  (report: FounderTestV4ReportCore) => SkepticalFounderScenarioResult
> = {
  'trust-challenge': evaluateTrustChallenge,
  'intelligence-challenge': evaluateIntelligenceChallenge,
  'purpose-challenge': evaluatePurposeChallenge,
  'launch-challenge': evaluateLaunchChallenge,
  'competitive-challenge': evaluateCompetitiveChallenge,
  'honesty-challenge': evaluateHonestyChallenge,
};

function detectCriticalTrustObjection(
  report: FounderTestV4ReportCore,
  scenarioResults: SkepticalFounderScenarioResult[],
): boolean {
  const trust = scenarioResults.find((scenario) => scenario.id === 'trust-challenge');
  const intelligence = scenarioResults.find((scenario) => scenario.id === 'intelligence-challenge');
  const launch = scenarioResults.find((scenario) => scenario.id === 'launch-challenge');

  const trustWithoutProof =
    !report.verificationTrustEvidence.trustPass &&
    report.launchReadinessReality.launchReadinessRealityScore >= 70;
  const launchClaimsWithoutEvidence =
    (report.verdict === 'READY_FOR_LAUNCH' || report.verdict === 'READY_FOR_PUBLIC_BETA') &&
    (trust?.objections.length ?? 0) > 0;
  const intelligenceWithoutVerification =
    report.chatIntelligenceReality.blocksLaunchReadiness &&
    report.launchReadinessReality.launchReadinessRealityScore >= 65;

  return trustWithoutProof || launchClaimsWithoutEvidence || intelligenceWithoutVerification || (launch?.objections.length ?? 0) >= 2;
}

function calculateLaunchRiskScore(
  scenarioResults: SkepticalFounderScenarioResult[],
  objectionCount: number,
  report: FounderTestV4ReportCore,
): number {
  const failedCount = scenarioResults.filter((scenario) => !scenario.passed).length;
  const blockerWeight =
    (report.chatIntelligenceReality.blocksLaunchReadiness ? 15 : 0) +
    (report.repositoryTypecheckReality.blocksLaunchReadiness ? 15 : 0) +
    report.topLaunchRisks.length * 4;
  return clamp(failedCount * 12 + objectionCount * 3 + blockerWeight);
}

function deriveReadinessState(
  skepticalFounderScore: number,
  launchRiskScore: number,
  blocksLaunchReadiness: boolean,
): SkepticalFounderReadinessState {
  if (blocksLaunchReadiness) return 'BLOCKED';
  if (skepticalFounderScore >= 75 && launchRiskScore <= 40) return 'TRUSTED';
  if (skepticalFounderScore >= 60 && launchRiskScore <= 70) return 'CAUTION';
  return 'HIGH_RISK';
}

function buildCacheKey(scenarioResults: SkepticalFounderScenarioResult[]): string {
  const digest = scenarioResults
    .map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed ? 1 : 0}`)
    .join('|');
  return `${SKEPTICAL_FOUNDER_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

export function assessSkepticalFounderSimulator(report: FounderTestV4ReportCore): SkepticalFounderAssessment {
  const scenarioResults = SKEPTICAL_FOUNDER_SCENARIOS.slice(0, MAX_SKEPTICAL_SCENARIOS).map((scenario) =>
    EVALUATORS[scenario.id](report),
  );
  const skepticalFounderScore = clamp(
    scenarioResults.reduce((sum, scenario) => sum + scenario.score, 0) / Math.max(1, scenarioResults.length),
  );
  const objections = [...new Set(scenarioResults.flatMap((scenario) => scenario.objections))].slice(
    0,
    MAX_SKEPTICAL_OBJECTIONS,
  );
  const recommendations = [...new Set(scenarioResults.flatMap((scenario) => scenario.recommendations))].slice(
    0,
    MAX_SKEPTICAL_RECOMMENDATIONS,
  );
  const failedScenarios = scenarioResults.filter((scenario) => !scenario.passed);
  const launchRiskScore = calculateLaunchRiskScore(scenarioResults, objections.length, report);
  const criticalTrustObjection = detectCriticalTrustObjection(report, scenarioResults);
  const blocksLaunchReadiness =
    skepticalFounderScore < SKEPTICAL_LAUNCH_BLOCK_SCORE ||
    launchRiskScore > SKEPTICAL_LAUNCH_RISK_BLOCK_THRESHOLD ||
    criticalTrustObjection;
  const readinessState = deriveReadinessState(skepticalFounderScore, launchRiskScore, blocksLaunchReadiness);

  const assessment: SkepticalFounderAssessment = {
    readOnly: true,
    skepticalFounderScore,
    launchRiskScore,
    objectionCount: objections.length,
    blocksLaunchReadiness,
    readinessState,
    failedScenarios,
    scenarioResults,
    objections,
    recommendations,
    criticalTrustObjection,
    cacheKey: buildCacheKey(scenarioResults),
  };

  recordSkepticalFounderAssessment(assessment);
  return assessment;
}

export function buildSkepticalFounderSimulatorArtifacts(
  report: FounderTestV4ReportCore,
): {
  skepticalFounderSimulator: SkepticalFounderAssessment;
  skepticalFounderReportMarkdown: string;
} {
  const skepticalFounderSimulator = assessSkepticalFounderSimulator(report);
  return {
    skepticalFounderSimulator,
    skepticalFounderReportMarkdown: buildSkepticalFounderReportMarkdown(
      skepticalFounderSimulator,
      report.generatedAt,
    ),
  };
}
