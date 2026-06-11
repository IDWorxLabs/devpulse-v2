/**
 * Self-Evolution Authority — deterministic repeated-failure evolution analysis.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithGapDetection } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  EVOLUTION_REQUIRED_BLOCK_THRESHOLD,
  MAX_EVOLUTION_PATTERNS,
  MAX_EVOLUTION_RECOMMENDATIONS,
  MAX_REQUIRED_EVOLUTIONS,
  REPEATED_FAILURE_THRESHOLD,
  SELF_EVOLUTION_BLOCK_SCORE,
  SELF_EVOLUTION_CACHE_KEY_PREFIX,
} from './self-evolution-bounds.js';
import { categoryRepeatedInHistory, recordSelfEvolutionAssessment } from './self-evolution-history.js';
import { buildSelfEvolutionReportMarkdown } from './self-evolution-report-builder.js';
import { SELF_EVOLUTION_PATTERNS } from './self-evolution-patterns.js';
import type {
  SelfEvolutionAssessment,
  SelfEvolutionPattern,
  SelfEvolutionPatternCategory,
  SelfEvolutionPatternSeverity,
  SelfEvolutionPatternStatus,
  SelfEvolutionReadinessState,
} from './self-evolution-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

interface PatternDraft {
  category: SelfEvolutionPatternCategory;
  failureSignal: string;
  signals: string[];
  evidence: string[];
  missingCapability: string;
  recommendedEvolution: string;
  severity: SelfEvolutionPatternSeverity;
}

function detectChatIntelligencePattern(report: FounderTestV4ReportWithGapDetection): PatternDraft | null {
  const chat = report.chatIntelligenceReality;
  const signals = [
    ...chat.failedScenarios.map((scenario) => `Chat failed: ${scenario.prompt}`),
    ...chat.requiredFixesBeforeLaunch.map((fix) => `Chat fix required: ${fix}`),
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => gap.category === 'INTELLIGENCE_GAPS')
      .map((gap) => `Gap: ${gap.title}`),
  ];
  if (chat.blocksLaunchReadiness) signals.push('Chat intelligence blocks launch readiness');
  if (signals.length < REPEATED_FAILURE_THRESHOLD) return null;

  return {
    category: 'CHAT_INTELLIGENCE',
    failureSignal: 'Repeated chat intelligence failures across scenarios and guidance paths',
    signals,
    evidence: signals.slice(0, 6),
    missingCapability: 'Reliable chat routing, context access, and purpose understanding',
    recommendedEvolution: 'Improve routing, context access, response evaluation, and purpose understanding',
    severity: chat.blocksLaunchReadiness ? 'CRITICAL' : chat.failedScenarios.length >= 3 ? 'HIGH' : 'MEDIUM',
  };
}

function detectTrustPattern(report: FounderTestV4ReportWithGapDetection): PatternDraft | null {
  const trust = report.trustAuthority;
  const skeptical = report.skepticalFounderSimulator;
  const signals = [
    ...trust.criticalTrustFailureDetails.map((detail) => `Trust critical: ${detail}`),
    ...trust.trustRisks.map((risk) => `Trust risk: ${risk}`),
    ...skeptical.objections.map((objection) => `Skeptical objection: ${objection}`),
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => gap.category === 'TRUST_GAPS')
      .map((gap) => `Gap: ${gap.title}`),
  ];
  if (trust.blocksLaunchReadiness) signals.push('Trust authority blocks launch readiness');
  if (skeptical.criticalTrustObjection) signals.push('Critical trust objection from skeptical founder review');
  if (signals.length < REPEATED_FAILURE_THRESHOLD) return null;

  return {
    category: 'TRUST',
    failureSignal: 'Repeated trust risks and unsupported claims across trust authorities',
    signals,
    evidence: signals.slice(0, 6),
    missingCapability: 'Evidence visibility, uncertainty reporting, and proof mapping',
    recommendedEvolution: 'Improve evidence visibility, uncertainty reporting, and proof mapping',
    severity: trust.criticalTrustFailures > 0 || skeptical.criticalTrustObjection ? 'CRITICAL' : 'HIGH',
  };
}

function detectUserSuccessPattern(report: FounderTestV4ReportWithGapDetection): PatternDraft | null {
  const success = report.userSuccessAuthority;
  const signals = [
    ...success.blockers.map((blocker) => `User blocker: ${blocker}`),
    ...success.criticalSuccessFailureDetails.map((detail) => `Critical success failure: ${detail}`),
    ...success.scenarioResults
      .filter((scenario) => !scenario.passed)
      .map((scenario) => `Failed goal: ${scenario.userGoal}`),
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => gap.impact === 'USER_SUCCESS' || gap.category === 'PRODUCT_GAPS')
      .map((gap) => `Gap: ${gap.title}`),
  ];
  if (success.blocksLaunchReadiness) signals.push('User success authority blocks launch readiness');
  if (signals.length < REPEATED_FAILURE_THRESHOLD) return null;

  return {
    category: 'USER_SUCCESS',
    failureSignal: 'Repeated user blockers and failed goals across success paths',
    signals,
    evidence: signals.slice(0, 6),
    missingCapability: 'Onboarding, next-step guidance, and goal completion flow',
    recommendedEvolution: 'Improve onboarding, next-step guidance, and goal completion flow',
    severity: success.criticalSuccessFailures > 0 ? 'CRITICAL' : 'HIGH',
  };
}

function detectPromiseFulfillmentPattern(report: FounderTestV4ReportWithGapDetection): PatternDraft | null {
  const fulfillment = report.promiseFulfillment;
  const signals = [
    ...fulfillment.promiseAssessments
      .filter((assessment) => assessment.status === 'CONTRADICTED')
      .map((assessment) => `Contradicted promise: ${assessment.promise}`),
    ...fulfillment.promiseAssessments
      .filter((assessment) => assessment.status === 'UNPROVEN')
      .map((assessment) => `Unproven promise: ${assessment.promise}`),
    ...fulfillment.recommendations.map((item) => `Promise recommendation: ${item}`),
  ];
  if (fulfillment.blocksLaunchReadiness) signals.push('Promise fulfillment blocks launch readiness');
  if (signals.length < REPEATED_FAILURE_THRESHOLD) return null;

  return {
    category: 'PROMISE_FULFILLMENT',
    failureSignal: 'Repeated unproven or contradicted promises across fulfillment checks',
    signals,
    evidence: signals.slice(0, 6),
    missingCapability: 'Proof paths and connected verification for product promises',
    recommendedEvolution: 'Build missing capability, reduce claim, add proof path, connect verification source',
    severity: fulfillment.contradictedCount > 0 ? 'CRITICAL' : 'HIGH',
  };
}

function detectGapDetectionPattern(report: FounderTestV4ReportWithGapDetection): PatternDraft | null {
  const gaps = report.gapDetectionAuthority;
  const signals = [
    ...gaps.detectedGaps
      .filter((gap) => gap.severity === 'CRITICAL' || gap.severity === 'HIGH')
      .map((gap) => `[${gap.severity}] ${gap.title}`),
    ...gaps.recommendations.map((item) => `Gap recommendation: ${item}`),
  ];
  if (gaps.blocksLaunchReadiness) signals.push('Gap detection blocks launch readiness');
  if (signals.length < REPEATED_FAILURE_THRESHOLD) return null;

  return {
    category: 'GAP_DETECTION',
    failureSignal: 'Repeated missing capabilities surfaced across gap detection categories',
    signals,
    evidence: signals.slice(0, 6),
    missingCapability: 'Connected authorities, dependencies, and validation coverage',
    recommendedEvolution: 'Create missing authority, connect missing dependency, improve validation coverage',
    severity: gaps.criticalGapCount > 0 ? 'CRITICAL' : 'HIGH',
  };
}

function detectRepositoryIntegrityPattern(report: FounderTestV4ReportWithGapDetection): PatternDraft | null {
  const typecheck = report.repositoryTypecheckReality;
  const signals = [
    ...typecheck.findings.map((finding) => `[${finding.severity}] ${finding.file}:${finding.line} ${finding.message}`),
    ...typecheck.recommendations.map((item) => `Typecheck recommendation: ${item}`),
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => gap.category === 'DEPENDENCY_GAPS')
      .map((gap) => `Gap: ${gap.title}`),
  ];
  if (typecheck.blocksLaunchReadiness) signals.push('Repository typecheck blocks launch readiness');
  if (typecheck.readinessState === 'TYPECHECK_NOT_RUN') signals.push('Repository typecheck not run');
  if (signals.length < REPEATED_FAILURE_THRESHOLD) return null;

  return {
    category: 'REPOSITORY_INTEGRITY',
    failureSignal: 'Repeated repository integrity and compile baseline failures',
    signals,
    evidence: signals.slice(0, 6),
    missingCapability: 'Persisted compile baseline and typecheck bridge visibility',
    recommendedEvolution: 'Persist baseline, improve typecheck bridge, add compile health visibility',
    severity: typecheck.errorCount > 0 ? 'CRITICAL' : 'HIGH',
  };
}

function detectLaunchReadinessPattern(report: FounderTestV4ReportWithGapDetection): PatternDraft | null {
  const launchBlockers = [
    report.chatIntelligenceReality.blocksLaunchReadiness,
    report.repositoryTypecheckReality.blocksLaunchReadiness,
    report.skepticalFounderSimulator.blocksLaunchReadiness,
    report.promiseFulfillment.blocksLaunchReadiness,
    report.trustAuthority.blocksLaunchReadiness,
    report.selfAwarenessAuthority.blocksLaunchReadiness,
    report.userSuccessAuthority.blocksLaunchReadiness,
    report.gapDetectionAuthority.blocksLaunchReadiness,
  ].filter(Boolean);

  const signals = [
    ...launchBlockers.map((_, index) => `Launch blocker active in authority layer ${index + 1}`),
    ...report.topLaunchRisks.map((risk) => `Launch risk: ${risk}`),
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => gap.category === 'READINESS_GAPS' || gap.impact === 'LAUNCH')
      .map((gap) => `Gap: ${gap.title}`),
    ...report.recommendedFixOrder.slice(0, 4).map((fix) => `Recommended fix: ${fix}`),
  ];
  if (report.launchReadinessReality.launchReadinessRealityScore < 60) {
    signals.push(
      `Founder Testing launch readiness score below threshold: ${report.launchReadinessReality.launchReadinessRealityScore}/100`,
    );
  }
  if (report.verdict !== 'READY_FOR_LAUNCH' && report.verdict !== 'READY_FOR_PUBLIC_BETA') {
    signals.push(`Founder Testing verdict indicates launch gaps: ${report.verdict}`);
  }
  if (signals.length < REPEATED_FAILURE_THRESHOLD) return null;

  return {
    category: 'LAUNCH_READINESS',
    failureSignal: 'Repeated launch blockers across authorities and readiness synthesis',
    signals,
    evidence: signals.slice(0, 6),
    missingCapability: 'Launch decision evidence and readiness synthesis',
    recommendedEvolution: 'Add launch decision authority, improve blocker evidence, improve readiness synthesis',
    severity: launchBlockers.length >= 4 ? 'CRITICAL' : 'HIGH',
  };
}

function detectSelfAwarenessPattern(report: FounderTestV4ReportWithGapDetection): PatternDraft | null {
  const awareness = report.selfAwarenessAuthority;
  const signals = [
    ...awareness.criticalAwarenessFailureDetails.map((detail) => `Awareness critical: ${detail}`),
    ...awareness.limitations.map((limitation) => `Hidden limitation: ${limitation}`),
    ...awareness.scenarioResults
      .filter((scenario) => !scenario.passed)
      .flatMap((scenario) => scenario.limitations.map((limitation) => `Scenario limitation: ${limitation}`)),
    ...report.gapDetectionAuthority.detectedGaps
      .filter((gap) => gap.category === 'DEPENDENCY_GAPS' || gap.category === 'READINESS_GAPS')
      .slice(0, 2)
      .map((gap) => `Gap: ${gap.title}`),
  ];
  if (awareness.blocksLaunchReadiness) signals.push('Self-awareness authority blocks launch readiness');
  if (signals.length < REPEATED_FAILURE_THRESHOLD) return null;

  return {
    category: 'SELF_AWARENESS',
    failureSignal: 'Repeated hidden limitations and misrepresented system state',
    signals,
    evidence: signals.slice(0, 6),
    missingCapability: 'State introspection, limitation registry, and dependency awareness',
    recommendedEvolution: 'Improve state introspection, limitation registry, and dependency awareness',
    severity: awareness.criticalAwarenessFailures > 0 ? 'CRITICAL' : 'HIGH',
  };
}

const DETECTORS: Array<(report: FounderTestV4ReportWithGapDetection) => PatternDraft | null> = [
  detectChatIntelligencePattern,
  detectTrustPattern,
  detectUserSuccessPattern,
  detectPromiseFulfillmentPattern,
  detectGapDetectionPattern,
  detectRepositoryIntegrityPattern,
  detectLaunchReadinessPattern,
  detectSelfAwarenessPattern,
];

function derivePatternStatus(
  draft: PatternDraft,
  repeatCount: number,
): SelfEvolutionPatternStatus {
  if (draft.severity === 'CRITICAL' && repeatCount >= REPEATED_FAILURE_THRESHOLD) {
    return 'BLOCKED';
  }
  if (repeatCount >= REPEATED_FAILURE_THRESHOLD && (draft.severity === 'CRITICAL' || draft.severity === 'HIGH')) {
    return 'EVOLUTION_REQUIRED';
  }
  if (repeatCount >= REPEATED_FAILURE_THRESHOLD) {
    return 'ESCALATE';
  }
  if (repeatCount >= 2 && categoryRepeatedInHistory(draft.category)) {
    return 'MONITOR';
  }
  return 'MONITOR';
}

function buildPattern(draft: PatternDraft, index: number): SelfEvolutionPattern {
  const historyBoost = categoryRepeatedInHistory(draft.category) ? 1 : 0;
  const repeatCount = draft.signals.length + historyBoost;
  const definition = SELF_EVOLUTION_PATTERNS.find((entry) => entry.category === draft.category);
  return {
    id: `${draft.category.toLowerCase()}-pattern-${index + 1}`,
    category: draft.category,
    failureSignal: draft.failureSignal,
    repeatCount,
    severity: draft.severity,
    missingCapability: draft.missingCapability,
    recommendedEvolution: draft.recommendedEvolution || definition?.recommendedEvolutions[0] || 'Improve bounded capability',
    evidence: draft.evidence,
    status: derivePatternStatus(draft, repeatCount),
  };
}

function calculateSelfEvolutionScore(patterns: SelfEvolutionPattern[]): number {
  let score = 100;
  for (const pattern of patterns) {
    score -= 10;
    if (pattern.status === 'EVOLUTION_REQUIRED') score -= 20;
    if (pattern.status === 'BLOCKED') score -= 30;
  }
  return clamp(score);
}

function deriveReadinessStateFromPatterns(
  patterns: SelfEvolutionPattern[],
  selfEvolutionScore: number,
  evolutionRequiredCount: number,
  blockedEvolutionCount: number,
  blocksLaunchReadiness: boolean,
): SelfEvolutionReadinessState {
  if (blocksLaunchReadiness || blockedEvolutionCount > 0) return 'BLOCKED';
  if (evolutionRequiredCount >= EVOLUTION_REQUIRED_BLOCK_THRESHOLD || selfEvolutionScore < SELF_EVOLUTION_BLOCK_SCORE) {
    return 'EVOLUTION_REQUIRED';
  }
  if (patterns.some((pattern) => pattern.status === 'MONITOR' || pattern.status === 'ESCALATE')) {
    return 'MONITORING';
  }
  return 'STABLE';
}

function buildCacheKey(patterns: SelfEvolutionPattern[]): string {
  const digest = patterns
    .map((pattern) => `${pattern.id}:${pattern.status}:${pattern.repeatCount}`)
    .join('|');
  return `${SELF_EVOLUTION_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

export function assessSelfEvolutionAuthority(report: FounderTestV4ReportWithGapDetection): SelfEvolutionAssessment {
  const drafts = DETECTORS.map((detect) => detect(report)).filter((draft): draft is PatternDraft => draft !== null);
  const patterns = drafts
    .map((draft, index) => buildPattern(draft, index))
    .slice(0, MAX_EVOLUTION_PATTERNS);

  const repeatedFailureCount = patterns.length;
  const evolutionRequiredCount = patterns.filter((pattern) => pattern.status === 'EVOLUTION_REQUIRED').length;
  const blockedEvolutionCount = patterns.filter((pattern) => pattern.status === 'BLOCKED').length;
  const selfEvolutionScore = calculateSelfEvolutionScore(patterns);
  const blocksLaunchReadiness =
    blockedEvolutionCount > 0 ||
    evolutionRequiredCount >= EVOLUTION_REQUIRED_BLOCK_THRESHOLD ||
    selfEvolutionScore < SELF_EVOLUTION_BLOCK_SCORE;
  const readinessState = deriveReadinessStateFromPatterns(
    patterns,
    selfEvolutionScore,
    evolutionRequiredCount,
    blockedEvolutionCount,
    blocksLaunchReadiness,
  );

  const requiredEvolutions = [
    ...new Set(
      patterns
        .filter((pattern) => pattern.status === 'EVOLUTION_REQUIRED' || pattern.status === 'BLOCKED')
        .map((pattern) => pattern.recommendedEvolution),
    ),
  ].slice(0, MAX_REQUIRED_EVOLUTIONS);

  const recommendations = [
    'If the same problem keeps appearing, stop repeating fixes and identify what must evolve.',
    ...requiredEvolutions,
    ...patterns
      .filter((pattern) => pattern.status === 'ESCALATE' || pattern.status === 'MONITOR')
      .map((pattern) => `Monitor ${pattern.category}: ${pattern.missingCapability}`),
    ...patterns.map((pattern) => `What should not be repeated? ${pattern.failureSignal}`),
  ].slice(0, MAX_EVOLUTION_RECOMMENDATIONS);

  const assessment: SelfEvolutionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    selfEvolutionScore,
    repeatedFailureCount,
    evolutionRequiredCount,
    blockedEvolutionCount,
    blocksLaunchReadiness,
    readinessState,
    patterns,
    requiredEvolutions,
    recommendations,
    cacheKey: buildCacheKey(patterns),
  };

  recordSelfEvolutionAssessment(assessment);
  return assessment;
}

export function buildSelfEvolutionAuthorityArtifacts(
  report: FounderTestV4ReportWithGapDetection,
): {
  selfEvolutionAuthority: SelfEvolutionAssessment;
  selfEvolutionAuthorityReportMarkdown: string;
} {
  const selfEvolutionAuthority = assessSelfEvolutionAuthority(report);
  return {
    selfEvolutionAuthority,
    selfEvolutionAuthorityReportMarkdown: buildSelfEvolutionReportMarkdown(
      selfEvolutionAuthority,
      report.generatedAt,
    ),
  };
}
