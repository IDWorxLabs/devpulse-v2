/**
 * Founder Execution Proof — read-only authority.
 * Aggregates real execution evidence — no new execution.
 */

import { createHash } from 'node:crypto';
import {
  aggregateFounderExecutionProofBundle,
  extractMissingProofAreas,
  extractTopEvidence,
} from './execution-proof-aggregator.js';
import {
  recordFounderExecutionProofAssessment,
  resetFounderExecutionProofHistoryForTests,
} from './founder-execution-proof-history.js';
import { buildFounderExecutionProofReportMarkdown } from './founder-execution-proof-report-builder.js';
import {
  FOUNDER_EXECUTION_PROOF_CACHE_KEY_PREFIX,
  FOUNDER_EXECUTION_PROOF_CORE_QUESTION,
  FOUNDER_EXECUTION_PROOF_PASS_TOKEN,
  MAX_RECOMMENDED_ACTIONS,
  MAX_TOP_BLOCKERS,
  MAX_TOP_EVIDENCE,
} from './founder-execution-proof-registry.js';
import type {
  AssessFounderExecutionProofInput,
  ExecutionCompletenessBreakdown,
  FounderExecutionProofArtifacts,
  FounderExecutionProofAssessment,
  FounderExecutionProofBundle,
  FounderExecutionProofQuestionAnswers,
  FounderExecutionProofReport,
  FounderExecutionState,
  FounderTestExecutionProofSummary,
  LaunchRecommendationState,
} from './founder-execution-proof-types.js';

let proofCounter = 0;

export function resetFounderExecutionProofCounterForTests(): void {
  proofCounter = 0;
}

export function resetFounderExecutionProofModuleForTests(): void {
  resetFounderExecutionProofHistoryForTests();
  resetFounderExecutionProofCounterForTests();
}

function nextProofId(): string {
  proofCounter += 1;
  return `founder-execution-proof-${proofCounter}`;
}

function stableCacheKey(proofId: string, state: FounderExecutionState, score: number): string {
  const digest = createHash('sha256')
    .update([FOUNDER_EXECUTION_PROOF_PASS_TOKEN, proofId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_EXECUTION_PROOF_CACHE_KEY_PREFIX}:${digest}`;
}

function deriveFounderExecutionState(
  answers: FounderExecutionProofQuestionAnswers,
  warnings: string[],
  blockers: string[],
  completeness: ExecutionCompletenessBreakdown,
): FounderExecutionState {
  const hasRealEvidence =
    answers.workspaceActuallyCreated ||
    answers.buildActuallyExecuted ||
    answers.runtimeActuallyActivated ||
    answers.previewActuallyActivated ||
    answers.verificationActuallyExecuted;

  if (blockers.some((b) => b.toLowerCase().includes('blocked'))) {
    return 'FOUNDER_EXECUTION_BLOCKED';
  }

  if (!hasRealEvidence && !answers.founderExecutionProven) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (answers.founderExecutionProven && warnings.length === 0) {
    return 'FOUNDER_EXECUTION_PROVEN';
  }

  if (answers.founderExecutionProven && warnings.length > 0) {
    return 'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS';
  }

  if (blockers.length > 0) {
    return 'FOUNDER_EXECUTION_BLOCKED';
  }

  return 'FOUNDER_EXECUTION_NOT_PROVEN';
}

function deriveLaunchRecommendation(
  founderState: FounderExecutionState,
  answers: FounderExecutionProofQuestionAnswers,
  warnings: string[],
  blockers: string[],
): LaunchRecommendationState {
  if (founderState === 'INSUFFICIENT_EVIDENCE') {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (founderState === 'FOUNDER_EXECUTION_BLOCKED' || blockers.length > 0) {
    return 'BLOCK_LAUNCH';
  }

  if (founderState === 'FOUNDER_EXECUTION_PROVEN' && answers.launchReadinessProven) {
    return 'RECOMMEND_LAUNCH';
  }

  if (
    founderState === 'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS' ||
    (answers.founderExecutionProven && warnings.length > 0)
  ) {
    return 'RECOMMEND_LAUNCH_WITH_WARNINGS';
  }

  if (answers.founderExecutionProven && !answers.launchReadinessProven) {
    return 'DO_NOT_RECOMMEND_LAUNCH';
  }

  return 'DO_NOT_RECOMMEND_LAUNCH';
}

function deriveLaunchConfidence(
  completeness: ExecutionCompletenessBreakdown,
  founderState: FounderExecutionState,
): number {
  if (founderState === 'INSUFFICIENT_EVIDENCE') return 0;
  if (founderState === 'FOUNDER_EXECUTION_BLOCKED') return 10;
  const base = completeness.overallFounderProofPercent;
  if (founderState === 'FOUNDER_EXECUTION_PROVEN') return Math.min(100, base);
  if (founderState === 'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS') return Math.min(85, base);
  return Math.min(50, base);
}

function buildRecommendedNextActions(
  founderState: FounderExecutionState,
  missingAreas: string[],
  blockers: string[],
): string[] {
  const actions: string[] = [];

  if (founderState === 'FOUNDER_EXECUTION_PROVEN') {
    actions.push('Founder execution proven — maintain evidence chain for future changes.');
  }

  for (const area of missingAreas) {
    actions.push(`Complete real ${area.toLowerCase()} execution and re-run founder proof.`);
  }

  for (const blocker of blockers.slice(0, 4)) {
    actions.push(`Resolve blocker: ${blocker}`);
  }

  if (founderState === 'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS') {
    actions.push('Address execution warnings before external launch.');
  }

  if (founderState === 'INSUFFICIENT_EVIDENCE') {
    actions.push('Run full connected execution chain (workspace → build → runtime → preview → verification).');
  }

  if (!actions.length) {
    actions.push('Re-run founder execution proof after connected execution completes.');
  }

  return actions.slice(0, MAX_RECOMMENDED_ACTIONS);
}

export function assessFounderExecutionProof(
  input: AssessFounderExecutionProofInput = {},
): FounderExecutionProofAssessment {
  const proofId = nextProofId();
  const generatedAt = new Date().toISOString();

  const launchReadiness = input.founderTestLaunchReadinessAssessment ?? null;

  const aggregated = aggregateFounderExecutionProofBundle(input, proofId, launchReadiness);
  const { bundle, completeness, questionAnswers, proofWarnings, proofBlockers, inputSnapshot } =
    aggregated;

  const founderExecutionState = deriveFounderExecutionState(
    questionAnswers,
    proofWarnings,
    proofBlockers,
    completeness,
  );

  const launchRecommendation = deriveLaunchRecommendation(
    founderExecutionState,
    questionAnswers,
    proofWarnings,
    proofBlockers,
  );

  const launchConfidence = deriveLaunchConfidence(completeness, founderExecutionState);
  const topEvidence = extractTopEvidence(bundle).slice(0, MAX_TOP_EVIDENCE);
  const topBlockers = proofBlockers.slice(0, MAX_TOP_BLOCKERS);
  const topWarnings = proofWarnings.slice(0, 8);
  const missingProofAreas = extractMissingProofAreas(bundle);
  const recommendedNextActions = buildRecommendedNextActions(
    founderExecutionState,
    missingProofAreas,
    proofBlockers,
  );

  const report: FounderExecutionProofReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: FOUNDER_EXECUTION_PROOF_CORE_QUESTION,
    proofId,
    generatedAt,
    founderExecutionScore: completeness.overallFounderProofPercent,
    founderExecutionState,
    launchRecommendation,
    launchConfidence,
    executionCompleteness: completeness,
    topEvidence,
    topBlockers,
    topWarnings,
    missingProofAreas,
    recommendedNextActions,
    questionAnswers,
    proofBundle: bundle,
    inputSnapshot,
    blockingReasons: proofBlockers,
    warningReasons: proofWarnings,
    cacheKey: stableCacheKey(proofId, founderExecutionState, completeness.overallFounderProofPercent),
  };

  const assessment: FounderExecutionProofAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: questionAnswers.founderExecutionProven
      ? 'FOUNDER_EXECUTION_PROOF_COMPLETE'
      : 'FOUNDER_EXECUTION_PROOF_FAILED',
    report,
  };

  recordFounderExecutionProofAssessment(assessment);
  return assessment;
}

export function buildFounderExecutionProofSummary(
  assessment: FounderExecutionProofAssessment,
): FounderTestExecutionProofSummary {
  const report = assessment.report;
  return {
    readOnly: true,
    founderExecutionState: report.founderExecutionState,
    launchRecommendation: report.launchRecommendation,
    launchConfidence: report.launchConfidence,
    overallFounderProofPercent: report.executionCompleteness.overallFounderProofPercent,
    executionCompletenessPercent: report.executionCompleteness.overallFounderProofPercent,
    topBlockers: report.topBlockers,
    topEvidence: report.topEvidence,
  };
}

export function buildFounderExecutionProofArtifacts(
  input: AssessFounderExecutionProofInput = {},
): FounderExecutionProofArtifacts {
  const founderExecutionProofAssessment = assessFounderExecutionProof(input);
  return {
    founderExecutionProofAssessment,
    founderExecutionProofReportMarkdown: buildFounderExecutionProofReportMarkdown(
      founderExecutionProofAssessment,
    ),
  };
}

export function buildFounderExecutionProofReport(
  assessment: FounderExecutionProofAssessment,
): FounderExecutionProofReport {
  return assessment.report;
}

export { FOUNDER_EXECUTION_PROOF_PASS_TOKEN };
