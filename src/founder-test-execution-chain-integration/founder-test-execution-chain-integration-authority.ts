/**
 * Founder Test Execution Chain Integration — authority.
 * Read-only orchestration — consumes execution proof chain and launch readiness.
 */

import { createHash } from 'node:crypto';
import {
  assessEndToEndExecutionProofChain,
  resetEndToEndExecutionProofModuleForTests,
} from '../end-to-end-execution-proof-chain/index.js';
import type { EndToEndExecutionProofAssessment } from '../end-to-end-execution-proof-chain/end-to-end-execution-proof-types.js';
import type { EndToEndProofState } from '../end-to-end-execution-proof-chain/end-to-end-execution-proof-types.js';
import { resetFounderTestLaunchReadinessModuleForTests } from '../founder-test-launch-readiness/index.js';
import {
  recordFounderTestExecutionChainAssessment,
  resetFounderTestExecutionChainHistoryForTests,
} from './founder-test-execution-chain-integration-history.js';
import { buildFounderTestExecutionChainReportMarkdown } from './founder-test-execution-chain-integration-report-builder.js';
import {
  FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_CACHE_KEY_PREFIX,
  FOUNDER_TEST_EXECUTION_CHAIN_CORE_QUESTION,
  FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PASS_TOKEN,
  MAX_EXECUTION_CHAIN_BLOCKERS,
  MAX_EXECUTION_CHAIN_WARNINGS,
  MAX_RECOMMENDED_ACTIONS,
} from './founder-test-execution-chain-integration-registry.js';
import type {
  AssessFounderTestExecutionChainInput,
  ExecutionChainBlocker,
  ExecutionChainQuestionAnswers,
  ExecutionChainState,
  ExecutionChainWarning,
  ExecutionStage,
  FounderExecutionChainAssessment,
  FounderExecutionChainReport,
  FounderTestExecutionChainArtifacts,
  FounderTestExecutionChainInputSnapshot,
} from './founder-test-execution-chain-integration-types.js';

let integrationCounter = 0;

export function resetFounderTestExecutionChainCounterForTests(): void {
  integrationCounter = 0;
}

function nextIntegrationId(): string {
  integrationCounter += 1;
  return `founder-test-execution-chain-${integrationCounter}`;
}

function stableCacheKey(integrationId: string, state: ExecutionChainState, score: number): string {
  const digest = createHash('sha256')
    .update([FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_PASS_TOKEN, integrationId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_TEST_EXECUTION_CHAIN_INTEGRATION_CACHE_KEY_PREFIX}:${digest}`;
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function resolveAssessments(input: AssessFounderTestExecutionChainInput): {
  endToEndExecutionProofAssessment: EndToEndExecutionProofAssessment;
} {
  const endToEndExecutionProofAssessment =
    input.endToEndExecutionProofAssessment ??
    assessEndToEndExecutionProofChain({
      rootDir: input.rootDir ?? process.cwd(),
      executionProofAssessment: input.executionProofAssessment,
      founderTestAssessment: input.founderTestAssessment,
    });

  return { endToEndExecutionProofAssessment };
}

function buildInputSnapshot(
  endToEndExecutionProofAssessment: EndToEndExecutionProofAssessment,
): FounderTestExecutionChainInputSnapshot {
  const endToEndSnapshot = endToEndExecutionProofAssessment.report.inputSnapshot;

  return {
    readOnly: true,
    founderTestLaunchReadinessAssessment: endToEndSnapshot.founderTestLaunchReadinessAssessment,
    connectedBuildExecutionAssessment: endToEndSnapshot.connectedBuildExecutionAssessment,
    connectedRuntimeActivationAssessment: endToEndSnapshot.connectedRuntimeActivationAssessment,
    connectedLivePreviewAssessment: endToEndSnapshot.connectedLivePreviewAssessment,
    connectedVerificationAssessment: endToEndSnapshot.connectedVerificationAssessment,
    endToEndExecutionProofAssessment,
    executionProofAssessment: endToEndSnapshot.executionProofAssessment,
    founderAcceptanceAssessment: endToEndSnapshot.founderAcceptanceAssessment,
    launchCouncilAssessment: endToEndSnapshot.launchCouncilAssessment,
    missingAuthorities: dedupeStrings([...endToEndSnapshot.missingAuthorities]),
  };
}

export function mapEndToEndProofStateToExecutionChainState(
  proofState: EndToEndProofState,
): ExecutionChainState {
  switch (proofState) {
    case 'END_TO_END_PROVEN':
      return 'EXECUTION_CHAIN_CONNECTED';
    case 'END_TO_END_PARTIALLY_PROVEN':
      return 'EXECUTION_CHAIN_PARTIALLY_CONNECTED';
    case 'END_TO_END_NOT_PROVEN':
      return 'EXECUTION_CHAIN_DISCONNECTED';
    case 'END_TO_END_BLOCKED':
      return 'EXECUTION_CHAIN_BLOCKED';
    case 'INSUFFICIENT_EVIDENCE':
    default:
      return 'INSUFFICIENT_EVIDENCE';
  }
}

function findWeakestStage(
  snapshot: FounderTestExecutionChainInputSnapshot,
): ExecutionStage {
  const bundle = snapshot.endToEndExecutionProofAssessment.report.proofBundle;
  const stages: Array<{ stage: ExecutionStage; score: number }> = [
    { stage: 'BUILD', score: bundle.buildProof.score },
    { stage: 'RUNTIME', score: bundle.runtimeProof.score },
    { stage: 'PREVIEW', score: bundle.previewProof.score },
    { stage: 'VERIFICATION', score: bundle.verificationProof.score },
  ];
  stages.sort((a, b) => a.score - b.score);
  return stages[0]?.stage ?? 'BUILD';
}

function findStrongestStage(
  snapshot: FounderTestExecutionChainInputSnapshot,
): ExecutionStage {
  const bundle = snapshot.endToEndExecutionProofAssessment.report.proofBundle;
  const stages: Array<{ stage: ExecutionStage; score: number }> = [
    { stage: 'BUILD', score: bundle.buildProof.score },
    { stage: 'RUNTIME', score: bundle.runtimeProof.score },
    { stage: 'PREVIEW', score: bundle.previewProof.score },
    { stage: 'VERIFICATION', score: bundle.verificationProof.score },
  ];
  stages.sort((a, b) => b.score - a.score);
  return stages[0]?.stage ?? 'BUILD';
}

function findLaunchBlockingStage(
  snapshot: FounderTestExecutionChainInputSnapshot,
): ExecutionStage | null {
  const blockingStages =
    snapshot.endToEndExecutionProofAssessment.report.proofBundle.blockingStages;
  if (blockingStages.length === 0) return null;
  const first = blockingStages[0];
  if (first === 'BUILD' || first === 'RUNTIME' || first === 'PREVIEW' || first === 'VERIFICATION') {
    return first;
  }
  return 'END_TO_END';
}

function buildExecutionChainBlockers(
  snapshot: FounderTestExecutionChainInputSnapshot,
): ExecutionChainBlocker[] {
  const blockers: ExecutionChainBlocker[] = [];
  const endToEndReport = snapshot.endToEndExecutionProofAssessment.report;
  const proofState = endToEndReport.proofState;

  for (const stage of endToEndReport.proofBundle.blockingStages) {
    const execStage =
      stage === 'BUILD' || stage === 'RUNTIME' || stage === 'PREVIEW' || stage === 'VERIFICATION'
        ? stage
        : 'END_TO_END';
    blockers.push({
      readOnly: true,
      stage: execStage,
      sourceAuthority: `connected-${stage.toLowerCase()}-foundation`,
      explanation: `Stage ${stage} is blocked in the connected execution chain.`,
      recommendedAction: `Clear blockers in ${stage} before launch readiness can proceed.`,
    });
  }

  if (
    proofState === 'END_TO_END_BLOCKED' ||
    proofState === 'END_TO_END_NOT_PROVEN' ||
    proofState === 'INSUFFICIENT_EVIDENCE'
  ) {
    for (const reason of endToEndReport.blockingReasons.slice(0, 4)) {
      blockers.push({
        readOnly: true,
        stage: 'END_TO_END',
        sourceAuthority: 'end-to-end-execution-proof-chain',
        explanation: reason,
        recommendedAction: 'Resolve end-to-end proof blocker before claiming launch readiness.',
      });
    }
  }

  return blockers.slice(0, MAX_EXECUTION_CHAIN_BLOCKERS);
}

function buildExecutionChainWarnings(
  snapshot: FounderTestExecutionChainInputSnapshot,
): ExecutionChainWarning[] {
  const warnings: ExecutionChainWarning[] = [];
  const endToEndReport = snapshot.endToEndExecutionProofAssessment.report;

  for (const stage of endToEndReport.proofBundle.warningStages) {
    const execStage =
      stage === 'BUILD' || stage === 'RUNTIME' || stage === 'PREVIEW' || stage === 'VERIFICATION'
        ? stage
        : 'END_TO_END';
    warnings.push({
      readOnly: true,
      stage: execStage,
      sourceAuthority: `connected-${stage.toLowerCase()}-foundation`,
      explanation: `Stage ${stage} has warning-level gaps in the connected execution chain.`,
    });
  }

  for (const reason of endToEndReport.warningReasons.slice(0, 4)) {
    warnings.push({
      readOnly: true,
      stage: 'END_TO_END',
      sourceAuthority: 'end-to-end-execution-proof-chain',
      explanation: reason,
    });
  }

  return warnings.slice(0, MAX_EXECUTION_CHAIN_WARNINGS);
}

export function deriveExecutionChainQuestionAnswers(
  snapshot: FounderTestExecutionChainInputSnapshot,
): ExecutionChainQuestionAnswers {
  const endToEndAnswers = snapshot.endToEndExecutionProofAssessment.report.questionAnswers;
  const bundle = snapshot.endToEndExecutionProofAssessment.report.proofBundle;
  const proofState = snapshot.endToEndExecutionProofAssessment.report.proofState;

  const endToEndProofPresent =
    proofState !== 'INSUFFICIENT_EVIDENCE' &&
    snapshot.endToEndExecutionProofAssessment.report.proofChainId.length > 0;

  const weakestStage = findWeakestStage(snapshot);
  const launchBlockingStage = findLaunchBlockingStage(snapshot);

  const connectedExecutionProven = endToEndAnswers.connectedExecutionProven;

  return {
    buildOutputProven: endToEndAnswers.buildOutputProven,
    runtimeReadinessProven: endToEndAnswers.runtimeReadinessProven,
    previewReadinessProven: endToEndAnswers.previewReadinessProven,
    verificationReadinessProven: endToEndAnswers.verificationReadinessProven,
    endToEndProofPresent,
    weakestStageIdentified: weakestStage.length > 0,
    launchBlockingStageIdentified: launchBlockingStage !== null || bundle.blockingStages.length === 0,
    founderCanInspectChainHealth: endToEndAnswers.founderInspectable,
    connectedExecutionMeasurable:
      bundle.confidenceFactors.length >= 4 && bundle.chainCompleteness >= 0,
    connectedExecutionProven,
  };
}

export function deriveExecutionChainScore(answers: ExecutionChainQuestionAnswers): number {
  const values = Object.values(answers);
  const yesCount = values.filter(Boolean).length;
  return Math.round((yesCount / values.length) * 100);
}

function deriveLaunchImpact(
  state: ExecutionChainState,
  launchVerdict: string,
): string {
  if (state === 'EXECUTION_CHAIN_CONNECTED') {
    return `Launch readiness (${launchVerdict}) can proceed with connected execution proof evidence.`;
  }
  if (state === 'EXECUTION_CHAIN_PARTIALLY_CONNECTED') {
    return `Launch readiness (${launchVerdict}) is constrained by warning-level execution chain gaps.`;
  }
  if (state === 'EXECUTION_CHAIN_BLOCKED') {
    return `Launch readiness (${launchVerdict}) is blocked until execution chain blockers are cleared.`;
  }
  if (state === 'INSUFFICIENT_EVIDENCE') {
    return `Launch readiness (${launchVerdict}) cannot be trusted — execution chain evidence is insufficient.`;
  }
  return `Launch readiness (${launchVerdict}) is not supported — execution chain is disconnected.`;
}

function buildRecommendedActions(
  snapshot: FounderTestExecutionChainInputSnapshot,
  state: ExecutionChainState,
): string[] {
  const actions: string[] = [];

  if (state === 'EXECUTION_CHAIN_CONNECTED') {
    actions.push('Maintain connected execution chain traceability before any real execution phase.');
  }
  if (state === 'EXECUTION_CHAIN_PARTIALLY_CONNECTED') {
    actions.push('Resolve warning-level gaps across build, runtime, preview, and verification before launch.');
  }
  if (state === 'EXECUTION_CHAIN_DISCONNECTED') {
    actions.push('Complete all four connected foundation stages before evaluating launch readiness.');
  }
  if (state === 'EXECUTION_CHAIN_BLOCKED') {
    const blockingStage = findLaunchBlockingStage(snapshot);
    if (blockingStage) {
      actions.push(`Clear ${blockingStage} stage blockers first — this is the highest-priority execution chain blocker.`);
    } else {
      actions.push('Clear execution chain blockers before evaluating launch readiness.');
    }
  }
  if (state === 'INSUFFICIENT_EVIDENCE') {
    actions.push('Restore missing upstream authority outputs before Founder Test can evaluate the execution chain.');
  }

  actions.push(...snapshot.endToEndExecutionProofAssessment.report.recommendedNextActions);
  actions.push(...snapshot.founderTestLaunchReadinessAssessment.report.topRecommendedActions.map((a) => a.action));
  actions.push(...snapshot.launchCouncilAssessment.recommendations.slice(0, 2));

  return dedupeStrings(actions).slice(0, MAX_RECOMMENDED_ACTIONS);
}

export function assessFounderTestExecutionChain(
  input: AssessFounderTestExecutionChainInput = {},
): FounderExecutionChainAssessment {
  const { endToEndExecutionProofAssessment } = resolveAssessments(input);
  const inputSnapshot = buildInputSnapshot(endToEndExecutionProofAssessment);
  const endToEndReport = endToEndExecutionProofAssessment.report;
  const bundle = endToEndReport.proofBundle;

  const questionAnswers = deriveExecutionChainQuestionAnswers(inputSnapshot);
  const executionChainScore = deriveExecutionChainScore(questionAnswers);
  const executionChainState = mapEndToEndProofStateToExecutionChainState(endToEndReport.proofState);
  const executionChainConnected = executionChainState === 'EXECUTION_CHAIN_CONNECTED';
  const integrationId = nextIntegrationId();

  const executionChainBlockers = buildExecutionChainBlockers(inputSnapshot);
  const executionChainWarnings = buildExecutionChainWarnings(inputSnapshot);
  const launchVerdict = inputSnapshot.founderTestLaunchReadinessAssessment.report.launchReadinessVerdict;

  const blockingReasons = dedupeStrings([
    ...endToEndReport.blockingReasons,
    ...executionChainBlockers.map((b) => b.explanation),
  ]);

  const warningReasons = dedupeStrings([
    ...endToEndReport.warningReasons,
    ...executionChainWarnings.map((w) => w.explanation),
  ]);

  const report: FounderExecutionChainReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: FOUNDER_TEST_EXECUTION_CHAIN_CORE_QUESTION,
    integrationId,
    generatedAt: new Date().toISOString(),
    executionChainState,
    executionChainScore,
    executionChainCompleteness: endToEndReport.chainCompletenessPercent,
    executionChainConnected,
    connectedExecutionProven: questionAnswers.connectedExecutionProven,
    buildStatus: bundle.buildProof.state,
    runtimeStatus: bundle.runtimeProof.state,
    previewStatus: bundle.previewProof.state,
    verificationStatus: bundle.verificationProof.state,
    endToEndStatus: endToEndReport.proofState,
    weakestExecutionStage: findWeakestStage(inputSnapshot),
    strongestExecutionStage: findStrongestStage(inputSnapshot),
    launchBlockingStage: findLaunchBlockingStage(inputSnapshot),
    launchImpact: deriveLaunchImpact(executionChainState, launchVerdict),
    executionChainBlockers,
    executionChainWarnings,
    recommendedNextActions: buildRecommendedActions(inputSnapshot, executionChainState),
    questionAnswers,
    inputSnapshot,
    blockingReasons,
    warningReasons,
    cacheKey: stableCacheKey(integrationId, executionChainState, executionChainScore),
  };

  const assessment: FounderExecutionChainAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'EXECUTION_CHAIN_INTEGRATION_COMPLETE',
    report,
  };

  recordFounderTestExecutionChainAssessment(assessment);
  return assessment;
}

export function buildFounderTestExecutionChainArtifacts(
  input: AssessFounderTestExecutionChainInput = {},
): FounderTestExecutionChainArtifacts {
  const founderExecutionChainAssessment = assessFounderTestExecutionChain(input);
  return {
    founderExecutionChainAssessment,
    founderExecutionChainReportMarkdown: buildFounderTestExecutionChainReportMarkdown(
      founderExecutionChainAssessment.report,
    ),
  };
}

export function resetFounderTestExecutionChainModuleForTests(): void {
  resetFounderTestExecutionChainHistoryForTests();
  resetFounderTestExecutionChainCounterForTests();
  resetEndToEndExecutionProofModuleForTests();
  resetFounderTestLaunchReadinessModuleForTests();
}
