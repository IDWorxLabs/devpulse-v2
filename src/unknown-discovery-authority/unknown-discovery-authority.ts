/**
 * Unknown Discovery Authority — deterministic blind-spot evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithSelfEvolution } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  MAX_RECOMMENDED_TESTS,
  MAX_UNKNOWN_FINDINGS,
  MAX_UNKNOWN_RECOMMENDATIONS,
  UNKNOWN_DISCOVERY_BLOCK_SCORE,
  UNKNOWN_DISCOVERY_CACHE_KEY_PREFIX,
  UNKNOWN_HIGH_COUNT_BLOCK_THRESHOLD,
} from './unknown-discovery-bounds.js';
import { recordUnknownDiscoveryAssessment } from './unknown-discovery-history.js';
import { buildUnknownDiscoveryReportMarkdown } from './unknown-discovery-report-builder.js';
import { BOUNDED_UNCOVERED_AREAS } from './unknown-discovery-scenarios.js';
import type {
  UnknownDiscoveryAssessment,
  UnknownDiscoveryCategory,
  UnknownDiscoveryFinding,
  UnknownDiscoveryReadinessState,
  UnknownDiscoverySeverity,
} from './unknown-discovery-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function makeFinding(input: {
  id: string;
  category: UnknownDiscoveryCategory;
  title: string;
  description: string;
  severity: UnknownDiscoverySeverity;
  evidence: string[];
  whyItMayBeMissed: string;
  recommendedTest: string;
}): UnknownDiscoveryFinding {
  return {
    ...input,
    evidence: input.evidence.slice(0, 6),
  };
}

function discoverUntestedUserBehavior(report: FounderTestV4ReportWithSelfEvolution): UnknownDiscoveryFinding[] {
  const findings: UnknownDiscoveryFinding[] = [];
  const chat = report.chatIntelligenceReality;
  const success = report.userSuccessAuthority;
  const skeptical = report.skepticalFounderSimulator;

  const understandingGoal = success.scenarioResults.find((scenario) => scenario.id === 'understanding-goal');
  if (understandingGoal && !understandingGoal.passed) {
    findings.push(
      makeFinding({
        id: 'untested-purpose-misunderstanding',
        category: 'UNTESTED_USER_BEHAVIOR',
        title: 'Product purpose misunderstanding not fully exercised',
        description: 'Users may misunderstand product purpose in ways bounded success scenarios do not cover.',
        severity: 'HIGH',
        evidence: understandingGoal.findings,
        whyItMayBeMissed: 'Founder-centric scenarios may pass while first-time user confusion remains untested.',
        recommendedTest: 'Add first-time user purpose confusion scenarios with unexpected question sequences.',
      }),
    );
  }

  if (chat.failedScenarios.length > 0 && chat.scenariosPassed > 0) {
    findings.push(
      makeFinding({
        id: 'untested-abandonment-path',
        category: 'UNTESTED_USER_BEHAVIOR',
        title: 'Partial chat success hides abandonment risk',
        description: 'Some chat scenarios pass while others fail, suggesting users may abandon after unexpected answers.',
        severity: 'MEDIUM',
        evidence: chat.failedScenarios.slice(0, 3).map((scenario) => `[${scenario.prompt}] ${scenario.whyFailed[0] ?? 'Failed'}`),
        whyItMayBeMissed: 'Aggregate chat score can hide failure on the exact prompt a real user asks.',
        recommendedTest: 'Add abandonment-flow tests when chat returns generic or incomplete guidance.',
      }),
    );
  }

  if (skeptical.failedScenarios.some((scenario) => scenario.category === 'PURPOSE_CHALLENGE')) {
    findings.push(
      makeFinding({
        id: 'untested-unexpected-questions',
        category: 'UNTESTED_USER_BEHAVIOR',
        title: 'Unexpected skeptical questions remain partially untested',
        description: 'Skeptical founder purpose challenges failed, indicating untested real-user question paths.',
        severity: 'HIGH',
        evidence: skeptical.objections.slice(0, 4),
        whyItMayBeMissed: 'Happy-path chat prompts may not include adversarial or off-script user behavior.',
        recommendedTest: 'Add off-script user question battery beyond bounded chat scenarios.',
      }),
    );
  }

  const buildGoal = success.scenarioResults.find((scenario) => scenario.id === 'build-goal');
  if (buildGoal && !buildGoal.passed) {
    findings.push(
      makeFinding({
        id: 'untested-unavailable-capability-expectation',
        category: 'UNTESTED_USER_BEHAVIOR',
        title: 'Users may expect unavailable capability',
        description: 'Build-goal failure suggests users may attempt workflows the product cannot yet complete.',
        severity: 'HIGH',
        evidence: buildGoal.findings,
        whyItMayBeMissed: 'Marketing or UI copy can imply capability that bounded tests never attempt end-to-end.',
        recommendedTest: 'Add wrong-input-format and unavailable-capability expectation tests.',
      }),
    );
  }

  return findings;
}

function discoverEdgeCases(report: FounderTestV4ReportWithSelfEvolution): UnknownDiscoveryFinding[] {
  const findings: UnknownDiscoveryFinding[] = [];
  const chat = report.chatIntelligenceReality;
  const gaps = report.gapDetectionAuthority;

  if (chat.failedScenarios.length >= 2) {
    findings.push(
      makeFinding({
        id: 'edge-multiple-chat-failures',
        category: 'EDGE_CASE',
        title: 'Multiple chat edge paths fail together',
        description: 'Several bounded chat scenarios fail, suggesting vague, contradictory, or edge prompts break confidence.',
        severity: chat.blocksLaunchReadiness ? 'CRITICAL' : 'HIGH',
        evidence: chat.failedScenarios.slice(0, 4).map((scenario) => scenario.prompt),
        whyItMayBeMissed: 'Scenario suites often test representative prompts, not edge combinations.',
        recommendedTest: 'Add empty, vague, contradictory, oversized, and impossible-request prompt tests.',
      }),
    );
  }

  const intelligenceGaps = gaps.detectedGaps.filter((gap) => gap.category === 'INTELLIGENCE_GAPS');
  if (intelligenceGaps.length > 0) {
    findings.push(
      makeFinding({
        id: 'edge-intelligence-gap-blindness',
        category: 'EDGE_CASE',
        title: 'Intelligence edge cases may remain untested',
        description: 'Gap detection surfaced intelligence gaps that bounded chat scenarios may not fully exercise.',
        severity: intelligenceGaps.some((gap) => gap.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH',
        evidence: intelligenceGaps.slice(0, 3).map((gap) => gap.title),
        whyItMayBeMissed: 'Gap findings can exist without dedicated edge-case prompt coverage.',
        recommendedTest: 'Add explicit edge-case chat battery mapped to each intelligence gap.',
      }),
    );
  }

  if (chat.requiredFixesBeforeLaunch.length >= 2) {
    findings.push(
      makeFinding({
        id: 'edge-required-fix-cluster',
        category: 'EDGE_CASE',
        title: 'Cluster of required chat fixes implies untested edge behavior',
        description: 'Multiple required chat fixes suggest edge or failure-mode prompts are not yet covered.',
        severity: 'MEDIUM',
        evidence: chat.requiredFixesBeforeLaunch.slice(0, 4),
        whyItMayBeMissed: 'Fix lists accumulate from known failures, not from systematically generated edge cases.',
        recommendedTest: 'Generate bounded edge-case matrix from required chat fixes and retest.',
      }),
    );
  }

  return findings;
}

function discoverContradictions(report: FounderTestV4ReportWithSelfEvolution): UnknownDiscoveryFinding[] {
  const findings: UnknownDiscoveryFinding[] = [];
  const trust = report.trustAuthority;
  const fulfillment = report.promiseFulfillment;
  const success = report.userSuccessAuthority;
  const typecheck = report.repositoryTypecheckReality;
  const passSignals = [
    report.trustAuthority.readinessState === 'TRUSTED',
    report.userSuccessAuthority.readinessState === 'USERS_SUCCEED',
    report.selfAwarenessAuthority.readinessState === 'SELF_AWARE',
    report.gapDetectionAuthority.readinessState === 'NO_CRITICAL_GAPS',
    report.selfEvolutionAuthority.readinessState === 'STABLE',
  ].filter(Boolean).length;
  const blockerCount = [
    report.chatIntelligenceReality.blocksLaunchReadiness,
    report.repositoryTypecheckReality.blocksLaunchReadiness,
    report.skepticalFounderSimulator.blocksLaunchReadiness,
    report.promiseFulfillment.blocksLaunchReadiness,
    report.trustAuthority.blocksLaunchReadiness,
    report.selfAwarenessAuthority.blocksLaunchReadiness,
    report.userSuccessAuthority.blocksLaunchReadiness,
    report.gapDetectionAuthority.blocksLaunchReadiness,
    report.selfEvolutionAuthority.blocksLaunchReadiness,
  ].filter(Boolean).length;
  if (passSignals >= 2 && blockerCount >= 4) {
    findings.push(
      makeFinding({
        id: 'contradiction-mixed-authority-signals',
        category: 'CONTRADICTION',
        title: 'Mixed pass and blocker signals across authorities',
        description: 'Several authorities pass while many others remain launch blockers.',
        severity: 'HIGH',
        evidence: [
          `Passing readiness signals: ${passSignals}`,
          `Launch blockers: ${blockerCount}`,
        ],
        whyItMayBeMissed: 'No single authority reconciles partial pass with widespread blockers.',
        recommendedTest: 'Add authority reconciliation test for mixed pass/blocker council states.',
      }),
    );
  }

  if (
    (trust.readinessState === 'HIGH_RISK' || trust.readinessState === 'BLOCKED') &&
    fulfillment.readinessState === 'FULFILLED'
  ) {
    findings.push(
      makeFinding({
        id: 'contradiction-trust-vs-promise',
        category: 'CONTRADICTION',
        title: 'Trust risk contradicts promise fulfillment',
        description: 'Trust authority reports high risk while promise fulfillment reports fulfilled readiness.',
        severity: 'CRITICAL',
        evidence: [
          `Trust readiness: ${trust.readinessState} (${trust.trustScore}/100)`,
          `Promise fulfillment readiness: ${fulfillment.readinessState} (${fulfillment.fulfillmentScore}/100)`,
        ],
        whyItMayBeMissed: 'Authorities evaluate different evidence slices and may not reconcile automatically.',
        recommendedTest: 'Add cross-authority contradiction test comparing trust and promise verdicts.',
      }),
    );
  }

  if (
    success.blocksLaunchReadiness &&
    (report.verdict === 'READY_FOR_LAUNCH' || report.verdict === 'READY_FOR_PUBLIC_BETA')
  ) {
    findings.push(
      makeFinding({
        id: 'contradiction-user-success-vs-founder-verdict',
        category: 'CONTRADICTION',
        title: 'User success blocks while founder verdict suggests readiness',
        description: 'User Success Authority blocks launch while Founder Testing verdict suggests launch readiness.',
        severity: 'CRITICAL',
        evidence: [
          `User success readiness: ${success.readinessState}`,
          `Founder Testing verdict: ${report.verdict}`,
        ],
        whyItMayBeMissed: 'Founder verdict synthesis may overweight technical readiness over user outcome readiness.',
        recommendedTest: 'Add launch council contradiction audit for user success vs founder verdict.',
      }),
    );
  }

  if (
    typecheck.readinessState === 'TYPECHECK_NOT_RUN' &&
    report.launchReadinessReality.launchReadinessRealityScore >= 70
  ) {
    findings.push(
      makeFinding({
        id: 'contradiction-typecheck-vs-launch-confidence',
        category: 'CONTRADICTION',
        title: 'Typecheck not run while launch confidence is high',
        description: 'Repository typecheck has not run but launch readiness reality score remains high.',
        severity: 'HIGH',
        evidence: [
          `Repository typecheck readiness: ${typecheck.readinessState}`,
          `Launch readiness reality score: ${report.launchReadinessReality.launchReadinessRealityScore}/100`,
        ],
        whyItMayBeMissed: 'Launch confidence can be computed before compile baseline proof exists.',
        recommendedTest: 'Add contradiction test requiring typecheck participation before high launch confidence.',
      }),
    );
  }

  return findings;
}

function discoverCoverageGaps(report: FounderTestV4ReportWithSelfEvolution): UnknownDiscoveryFinding[] {
  const findings: UnknownDiscoveryFinding[] = [];
  const gaps = report.gapDetectionAuthority;
  const evolution = report.selfEvolutionAuthority;

  for (const area of BOUNDED_UNCOVERED_AREAS) {
    findings.push(
      makeFinding({
        id: `coverage-${area.id}`,
        category: 'COVERAGE_GAP',
        title: `No bounded authority coverage for ${area.title}`,
        description: `${area.title} is not represented by a dedicated Launch Council authority in this bounded pass.`,
        severity: 'MEDIUM',
        evidence: [`Uncovered area: ${area.title}`],
        whyItMayBeMissed: 'Current authority registry focuses on known founder, trust, and intelligence paths.',
        recommendedTest: area.recommendedTest,
      }),
    );
  }

  if (gaps.criticalGapCount > 0) {
    findings.push(
      makeFinding({
        id: 'coverage-gap-detection-followthrough',
        category: 'COVERAGE_GAP',
        title: 'Critical gaps lack dedicated validation follow-through',
        description: 'Gap Detection surfaced critical gaps without guaranteed downstream validation coverage.',
        severity: 'HIGH',
        evidence: gaps.detectedGaps
          .filter((gap) => gap.severity === 'CRITICAL')
          .slice(0, 3)
          .map((gap) => gap.title),
        whyItMayBeMissed: 'Gap findings identify missing capability but do not themselves add new tests.',
        recommendedTest: 'Add validation coverage mapped to each critical gap category.',
      }),
    );
  }

  if (evolution.evolutionRequiredCount > 0) {
    findings.push(
      makeFinding({
        id: 'coverage-self-evolution-followthrough',
        category: 'COVERAGE_GAP',
        title: 'Required evolutions lack dedicated unknown-risk tests',
        description: 'Self-Evolution required changes may still lack tests for untested failure modes.',
        severity: 'MEDIUM',
        evidence: evolution.requiredEvolutions.slice(0, 3),
        whyItMayBeMissed: 'Evolution recommendations describe change direction, not new blind-spot tests.',
        recommendedTest: 'Add unknown-risk test battery for each required evolution path.',
      }),
    );
  }

  return findings;
}

function discoverAssumptionRisks(report: FounderTestV4ReportWithSelfEvolution): UnknownDiscoveryFinding[] {
  const findings: UnknownDiscoveryFinding[] = [];
  const trust = report.trustAuthority;
  const fulfillment = report.promiseFulfillment;
  const awareness = report.selfAwarenessAuthority;

  if (fulfillment.unprovenCount > 0) {
    findings.push(
      makeFinding({
        id: 'assumption-unproven-promises',
        category: 'ASSUMPTION_RISK',
        title: 'Unproven promises may be treated as fulfilled',
        description: 'Promise Fulfillment reports unproven promises that may still be assumed true elsewhere.',
        severity: fulfillment.unprovenCount >= 2 ? 'HIGH' : 'MEDIUM',
        evidence: fulfillment.promiseAssessments
          .filter((assessment) => assessment.status === 'UNPROVEN')
          .slice(0, 3)
          .map((assessment) => assessment.promise),
        whyItMayBeMissed: 'Product language can imply fulfillment before proof exists.',
        recommendedTest: 'Add assumption audit test requiring proof before promise-dependent UX copy.',
      }),
    );
  }

  if (fulfillment.contradictedCount > 0) {
    findings.push(
      makeFinding({
        id: 'assumption-contradicted-promises',
        category: 'ASSUMPTION_RISK',
        title: 'Contradicted promises may still influence readiness assumptions',
        description: 'Contradicted promises remain a risk if other layers assume partial fulfillment.',
        severity: 'CRITICAL',
        evidence: fulfillment.promiseAssessments
          .filter((assessment) => assessment.status === 'CONTRADICTED')
          .slice(0, 3)
          .map((assessment) => assessment.promise),
        whyItMayBeMissed: 'Downstream scoring may not fully propagate contradicted promise status.',
        recommendedTest: 'Add cross-layer assumption test for contradicted promises.',
      }),
    );
  }

  if (trust.trustRisks.length >= 2) {
    findings.push(
      makeFinding({
        id: 'assumption-trust-without-evidence',
        category: 'ASSUMPTION_RISK',
        title: 'Trust may be assumed without sufficient evidence',
        description: 'Multiple trust risks remain while other surfaces may still imply confidence.',
        severity: trust.criticalTrustFailures > 0 ? 'CRITICAL' : 'HIGH',
        evidence: trust.trustRisks.slice(0, 4),
        whyItMayBeMissed: 'Validator pass or UI presence can be mistaken for evidentiary trust.',
        recommendedTest: 'Add test that blocks trust language when evidence visibility is missing.',
      }),
    );
  }

  if (awareness.limitations.length >= 2 || awareness.criticalAwarenessFailures > 0) {
    findings.push(
      makeFinding({
        id: 'assumption-hidden-limitations',
        category: 'ASSUMPTION_RISK',
        title: 'Hidden limitations may be treated as resolved',
        description: 'Self-Awareness reports limitations that other layers may not surface to users.',
        severity: awareness.criticalAwarenessFailures > 0 ? 'HIGH' : 'MEDIUM',
        evidence: [...awareness.limitations.slice(0, 3), ...awareness.criticalAwarenessFailureDetails.slice(0, 2)],
        whyItMayBeMissed: 'Internal limitation registry may not propagate to launch-facing assumptions.',
        recommendedTest: 'Add assumption audit ensuring limitations appear before readiness claims.',
      }),
    );
  }

  return findings;
}

function discoverLaunchBlindSpots(report: FounderTestV4ReportWithSelfEvolution): UnknownDiscoveryFinding[] {
  const findings: UnknownDiscoveryFinding[] = [];

  if (!report.verificationResultsVisibility.evidencePresent) {
    findings.push(
      makeFinding({
        id: 'blindspot-missing-proof',
        category: 'LAUNCH_BLIND_SPOT',
        title: 'Missing proof visibility for launch confidence',
        description: 'Verification evidence is not visible, leaving launch confidence vulnerable to unsupported claims.',
        severity: 'CRITICAL',
        evidence: [
          `Verification evidence present: ${report.verificationResultsVisibility.evidencePresent ? 'Yes' : 'No'}`,
          `Trust score: ${report.trustAuthority.trustScore}/100`,
        ],
        whyItMayBeMissed: 'Launch reviews may focus on scores rather than visible proof artifacts.',
        recommendedTest: 'Add launch blind-spot test requiring visible proof before confidence messaging.',
      }),
    );
  }

  if (report.topLaunchRisks.length >= 2) {
    findings.push(
      makeFinding({
        id: 'blindspot-unaddressed-launch-risks',
        category: 'LAUNCH_BLIND_SPOT',
        title: 'Top launch risks may lack dedicated unknown-risk tests',
        description: 'Founder Testing surfaced launch risks that may not have explicit blind-spot test coverage.',
        severity: 'HIGH',
        evidence: report.topLaunchRisks.slice(0, 4),
        whyItMayBeMissed: 'Risk lists identify known risks, not untested ones adjacent to them.',
        recommendedTest: 'Add adjacent-risk discovery test for each top launch risk.',
      }),
    );
  }

  const blockerAuthorities = [
    report.chatIntelligenceReality.blocksLaunchReadiness ? 'Chat Intelligence Reality' : null,
    report.repositoryTypecheckReality.blocksLaunchReadiness ? 'Repository Typecheck Reality' : null,
    report.skepticalFounderSimulator.blocksLaunchReadiness ? 'Skeptical Founder Simulator' : null,
    report.promiseFulfillment.blocksLaunchReadiness ? 'Promise Fulfillment Authority' : null,
    report.trustAuthority.blocksLaunchReadiness ? 'Trust Authority' : null,
    report.selfAwarenessAuthority.blocksLaunchReadiness ? 'Self-Awareness Authority' : null,
    report.userSuccessAuthority.blocksLaunchReadiness ? 'User Success Authority' : null,
    report.gapDetectionAuthority.blocksLaunchReadiness ? 'Gap Detection Authority' : null,
    report.selfEvolutionAuthority.blocksLaunchReadiness ? 'Self-Evolution Authority' : null,
  ].filter((item): item is string => item !== null);

  if (blockerAuthorities.length >= 3) {
    findings.push(
      makeFinding({
        id: 'blindspot-hidden-blocker-cluster',
        category: 'LAUNCH_BLIND_SPOT',
        title: 'Hidden blocker cluster may damage launch confidence',
        description: 'Multiple authorities block launch readiness, suggesting blind spots in holistic launch messaging.',
        severity: 'CRITICAL',
        evidence: blockerAuthorities.slice(0, 5),
        whyItMayBeMissed: 'Individual blockers may be visible while their combined launch impact is under-tested.',
        recommendedTest: 'Add holistic launch blind-spot test when three or more authorities block readiness.',
      }),
    );
  }

  if (!report.verificationResultsVisibility.readinessExplained) {
    findings.push(
      makeFinding({
        id: 'blindspot-unclear-first-impression',
        category: 'LAUNCH_BLIND_SPOT',
        title: 'Unclear readiness explanation may weaken first impression',
        description: 'Launch readiness is not explained with evidence, creating first-impression blind spots.',
        severity: 'HIGH',
        evidence: [
          `Readiness explained: ${report.verificationResultsVisibility.readinessExplained ? 'Yes' : 'No'}`,
          `Human readiness: ${report.launchReadinessReality.humanReadiness}/100`,
        ],
        whyItMayBeMissed: 'First-impression testing may not include readiness explanation quality.',
        recommendedTest: 'Add first-impression blind-spot test for readiness explanation and onboarding clarity.',
      }),
    );
  }

  return findings;
}

const DISCOVERERS: Array<(report: FounderTestV4ReportWithSelfEvolution) => UnknownDiscoveryFinding[]> = [
  discoverUntestedUserBehavior,
  discoverEdgeCases,
  discoverContradictions,
  discoverCoverageGaps,
  discoverAssumptionRisks,
  discoverLaunchBlindSpots,
];

function calculateUnknownDiscoveryScore(findings: UnknownDiscoveryFinding[]): number {
  let score = 100;
  for (const finding of findings) {
    score -= 8;
    if (finding.severity === 'HIGH') score -= 15;
    if (finding.severity === 'CRITICAL') score -= 25;
  }
  return clamp(score);
}

function deriveReadinessState(
  unknownDiscoveryScore: number,
  criticalFindingCount: number,
  highFindingCount: number,
  blocksLaunchReadiness: boolean,
): UnknownDiscoveryReadinessState {
  if (blocksLaunchReadiness) return 'BLOCKED';
  if (criticalFindingCount > 0 || highFindingCount >= 3 || unknownDiscoveryScore < 60) {
    return 'HIGH_UNKNOWN_RISK';
  }
  if (highFindingCount > 0 || unknownDiscoveryScore < 75) {
    return 'MODERATE_UNKNOWN_RISK';
  }
  return 'LOW_UNKNOWN_RISK';
}

function buildCacheKey(findings: UnknownDiscoveryFinding[]): string {
  const digest = findings.map((finding) => `${finding.id}:${finding.severity}`).join('|');
  return `${UNKNOWN_DISCOVERY_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

function dedupeFindings(findings: UnknownDiscoveryFinding[]): UnknownDiscoveryFinding[] {
  const seen = new Set<string>();
  const unique: UnknownDiscoveryFinding[] = [];
  for (const finding of findings) {
    const key = `${finding.category}:${finding.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(finding);
  }
  return unique.slice(0, MAX_UNKNOWN_FINDINGS);
}

export function assessUnknownDiscoveryAuthority(
  report: FounderTestV4ReportWithSelfEvolution,
): UnknownDiscoveryAssessment {
  const findings = dedupeFindings(DISCOVERERS.flatMap((discover) => discover(report)));
  const criticalFindingCount = findings.filter((finding) => finding.severity === 'CRITICAL').length;
  const highFindingCount = findings.filter((finding) => finding.severity === 'HIGH').length;
  const unknownDiscoveryScore = calculateUnknownDiscoveryScore(findings);
  const blocksLaunchReadiness =
    criticalFindingCount > 0 ||
    highFindingCount >= UNKNOWN_HIGH_COUNT_BLOCK_THRESHOLD ||
    unknownDiscoveryScore < UNKNOWN_DISCOVERY_BLOCK_SCORE;
  const readinessState = deriveReadinessState(
    unknownDiscoveryScore,
    criticalFindingCount,
    highFindingCount,
    blocksLaunchReadiness,
  );

  const recommendedTests = [
    ...new Set(findings.map((finding) => finding.recommendedTest)),
  ].slice(0, MAX_RECOMMENDED_TESTS);

  const recommendations = [
    'The system must look for what its current tests may be missing.',
    ...recommendedTests,
    ...findings.slice(0, 4).map((finding) => `Investigate blind spot: ${finding.title}`),
  ].slice(0, MAX_UNKNOWN_RECOMMENDATIONS);

  const assessment: UnknownDiscoveryAssessment = {
    readOnly: true,
    advisoryOnly: true,
    unknownDiscoveryScore,
    findingCount: findings.length,
    criticalFindingCount,
    highFindingCount,
    blocksLaunchReadiness,
    readinessState,
    findings,
    recommendedTests,
    recommendations,
    cacheKey: buildCacheKey(findings),
  };

  recordUnknownDiscoveryAssessment(assessment);
  return assessment;
}

export function buildUnknownDiscoveryAuthorityArtifacts(
  report: FounderTestV4ReportWithSelfEvolution,
): {
  unknownDiscoveryAuthority: UnknownDiscoveryAssessment;
  unknownDiscoveryAuthorityReportMarkdown: string;
} {
  const unknownDiscoveryAuthority = assessUnknownDiscoveryAuthority(report);
  return {
    unknownDiscoveryAuthority,
    unknownDiscoveryAuthorityReportMarkdown: buildUnknownDiscoveryReportMarkdown(
      unknownDiscoveryAuthority,
      report.generatedAt,
    ),
  };
}
