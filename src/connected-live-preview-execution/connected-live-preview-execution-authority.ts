/**
 * Connected Live Preview Execution — authority.
 */

import { createHash } from 'node:crypto';
import {
  assessConnectedLivePreview,
  resetConnectedLivePreviewModuleForTests,
} from '../connected-live-preview-foundation/index.js';
import type { ConnectedLivePreviewAssessment } from '../connected-live-preview-foundation/connected-live-preview-types.js';
import {
  assessConnectedAutonomousBuildExecution,
  resetConnectedBuildExecutionModuleForTests,
} from '../connected-build-execution-foundation/index.js';
import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import {
  assessConnectedRuntimeExecution,
  resetConnectedRuntimeExecutionModuleForTests,
} from '../connected-runtime-execution/index.js';
import type { ConnectedRuntimeExecutionAssessment } from '../connected-runtime-execution/connected-runtime-execution-types.js';
import type { ConnectedWorkspaceCreationAssessment } from '../connected-workspace-creation/connected-workspace-creation-types.js';
import { assessFounderAcceptanceGate } from '../founder-acceptance-gate/index.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import {
  buildExecutionPackageRuntimeReport,
  getDevPulseV2ExecutionPackageRuntime,
} from '../execution-runtime/index.js';
import {
  buildExecutionVerificationReport,
  getDevPulseV2ExecutionVerificationLoop,
} from '../execution-verification/index.js';
import {
  recordConnectedLivePreviewExecutionAssessment,
  resetConnectedLivePreviewExecutionHistoryForTests,
} from './connected-live-preview-execution-history.js';
import { buildConnectedLivePreviewExecutionReportMarkdown } from './connected-live-preview-execution-report-builder.js';
import {
  CONNECTED_LIVE_PREVIEW_EXECUTION_CACHE_KEY_PREFIX,
  CONNECTED_LIVE_PREVIEW_EXECUTION_CORE_QUESTION,
  CONNECTED_LIVE_PREVIEW_EXECUTION_PASS_TOKEN,
  MAX_PREVIEW_BLOCKERS,
  MAX_RECOMMENDED_ACTIONS,
} from './connected-live-preview-execution-registry.js';
import type {
  AssessConnectedLivePreviewExecutionInput,
  ConnectedLivePreviewExecutionArtifacts,
  ConnectedLivePreviewExecutionAssessment,
  ConnectedLivePreviewExecutionInputSnapshot,
  ConnectedLivePreviewExecutionReport,
  PreviewActivationContract,
  PreviewExecutionQuestionAnswers,
  PreviewExecutionState,
} from './connected-live-preview-execution-types.js';
import {
  executePreviewActivation,
  resetPreviewActivationEngineForTests,
} from './preview-activation-engine.js';
import { cleanupActiveRuntime } from '../connected-runtime-execution/runtime-activation-engine.js';

let executionCounter = 0;

export function resetConnectedLivePreviewExecutionCounterForTests(): void {
  executionCounter = 0;
}

function nextExecutionId(): string {
  executionCounter += 1;
  return `connected-live-preview-execution-${executionCounter}`;
}

function stableCacheKey(executionId: string, state: PreviewExecutionState, score: number): string {
  const digest = createHash('sha256')
    .update([CONNECTED_LIVE_PREVIEW_EXECUTION_PASS_TOKEN, executionId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_LIVE_PREVIEW_EXECUTION_CACHE_KEY_PREFIX}:${digest}`;
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

function resolveLivePreviewFoundationAssessment(
  input: AssessConnectedLivePreviewExecutionInput,
  runtimeExecution: ConnectedRuntimeExecutionAssessment,
): ConnectedLivePreviewAssessment {
  if (input.connectedLivePreviewFoundationAssessment) {
    return input.connectedLivePreviewFoundationAssessment;
  }
  const runtimeActivation =
    runtimeExecution.report.inputSnapshot.connectedRuntimeActivationAssessment;
  return assessConnectedLivePreview({
    rootDir: input.rootDir ?? process.cwd(),
    connectedRuntimeActivationAssessment: runtimeActivation,
  });
}

function buildInputSnapshot(
  runtimeExecution: ConnectedRuntimeExecutionAssessment,
  workspaceAssessment: ConnectedWorkspaceCreationAssessment | null,
  buildFoundation: ConnectedBuildExecutionAssessment | null,
  livePreviewFoundation: ConnectedLivePreviewAssessment,
  founderAcceptance: FounderAcceptanceAssessment | null,
  executionProof: AssessConnectedLivePreviewExecutionInput['executionProofAssessment'],
): ConnectedLivePreviewExecutionInputSnapshot {
  const missingAuthorities = dedupeStrings([
    ...(livePreviewFoundation.report.inputSnapshot.missingAuthorities ?? []),
    ...(runtimeExecution.report.inputSnapshot.missingAuthorities ?? []),
    ...(workspaceAssessment === null ? ['connected-workspace-creation'] : []),
    ...(buildFoundation === null ? ['connected-build-execution'] : []),
    ...(founderAcceptance === null ? ['founder-acceptance-gate'] : []),
  ]);

  return {
    readOnly: true,
    connectedRuntimeExecutionAssessment: runtimeExecution,
    connectedWorkspaceCreationAssessment: workspaceAssessment,
    connectedBuildExecutionFoundationAssessment: buildFoundation,
    connectedLivePreviewFoundationAssessment: livePreviewFoundation,
    livePreviewRealityAssessment: livePreviewFoundation.report.inputSnapshot.livePreviewRealityAssessment,
    executionPackageRuntimeReport: buildExecutionPackageRuntimeReport(
      getDevPulseV2ExecutionPackageRuntime().getRuntimeState(),
      getDevPulseV2ExecutionPackageRuntime().getRecords(),
    ),
    executionVerificationReport: buildExecutionVerificationReport(
      getDevPulseV2ExecutionVerificationLoop().getLoopState(),
      getDevPulseV2ExecutionVerificationLoop().getResults(),
    ),
    executionProofAssessment: executionProof ?? null,
    founderAcceptanceAssessment: founderAcceptance,
    missingAuthorities,
  };
}

export function derivePreviewExecutionQuestionAnswers(
  snapshot: ConnectedLivePreviewExecutionInputSnapshot,
  contract: PreviewActivationContract | null,
): PreviewExecutionQuestionAnswers {
  const evidence = contract?.activationEvidence;
  const foundationAnswers = snapshot.connectedLivePreviewFoundationAssessment.report.questionAnswers;

  const proofProven =
    snapshot.executionProofAssessment === null ||
    snapshot.executionProofAssessment.verdict === 'PROVEN_FIXED';

  const runtimeActivated =
    snapshot.connectedRuntimeExecutionAssessment.report.runtimeState === 'RUNTIME_ACTIVATED' ||
    snapshot.connectedRuntimeExecutionAssessment.report.runtimeState === 'RUNTIME_ACTIVATED_WITH_WARNINGS';

  const previewActivationAttempted =
    contract?.realPreviewLaunchPerformed === true || evidence?.previewActivated === true;
  const previewUrlGenerated = evidence?.previewUrlGenerated === true;
  const previewReachable = evidence?.previewReachable === true;
  const contentBeingServed = evidence?.previewContentServed === true;
  const previewIsolated = contract?.disposableOnly === true && contract?.world1Protected === true;
  const world1Protected = contract?.world1Protected === true;
  const activationAuditable = (contract?.previewEvidence.length ?? 0) > 0;
  const founderInspectable =
    contract?.founderViewable === true && activationAuditable && previewUrlGenerated;
  const previewReadinessProven = foundationAnswers.previewReadinessProven;

  const previewActivationProven =
    previewActivationAttempted &&
    previewUrlGenerated &&
    previewReachable &&
    contentBeingServed &&
    previewIsolated &&
    world1Protected &&
    activationAuditable &&
    founderInspectable &&
    previewReadinessProven &&
    proofProven &&
    runtimeActivated &&
    (snapshot.connectedLivePreviewFoundationAssessment.report.previewState === 'PREVIEW_READY' ||
      snapshot.connectedLivePreviewFoundationAssessment.report.previewState === 'PREVIEW_READY_WITH_WARNINGS') &&
    evidence?.previewResponseSuccessful === true &&
    evidence?.previewEndpointAvailable === true &&
    evidence?.previewArtifactsPresent === true;

  return {
    previewActivationAttempted,
    previewUrlGenerated,
    previewReachable,
    contentBeingServed,
    previewIsolated,
    world1Protected,
    activationAuditable,
    founderInspectable,
    previewReadinessProven,
    previewActivationProven,
  };
}

export function derivePreviewScore(answers: PreviewExecutionQuestionAnswers): number {
  const values = Object.values(answers);
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

export function derivePreviewExecutionState(
  snapshot: ConnectedLivePreviewExecutionInputSnapshot,
  answers: PreviewExecutionQuestionAnswers,
  executionSuccess: boolean,
  hasWarnings: boolean,
): PreviewExecutionState {
  if (snapshot.missingAuthorities.length > 0) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (answers.previewActivationProven) {
    return 'PREVIEW_ACTIVATED';
  }

  if (executionSuccess && answers.previewActivationAttempted) {
    return hasWarnings ? 'PREVIEW_ACTIVATED_WITH_WARNINGS' : 'PREVIEW_ACTIVATED';
  }

  if (
    snapshot.connectedLivePreviewFoundationAssessment.report.previewState === 'PREVIEW_BLOCKED' ||
    snapshot.connectedRuntimeExecutionAssessment.report.runtimeState === 'RUNTIME_ACTIVATION_BLOCKED'
  ) {
    return 'PREVIEW_ACTIVATION_BLOCKED';
  }

  if (
    snapshot.connectedLivePreviewFoundationAssessment.report.previewState === 'INSUFFICIENT_EVIDENCE' ||
    snapshot.connectedRuntimeExecutionAssessment.report.runtimeState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (executionSuccess) {
    return hasWarnings ? 'PREVIEW_ACTIVATED_WITH_WARNINGS' : 'PREVIEW_ACTIVATED';
  }

  return 'PREVIEW_ACTIVATION_FAILED';
}

function buildRecommendedActions(
  snapshot: ConnectedLivePreviewExecutionInputSnapshot,
  state: PreviewExecutionState,
): string[] {
  const actions: string[] = [];
  if (state === 'PREVIEW_ACTIVATED') {
    actions.push('Maintain preview isolation before any verification or deployment phase.');
  }
  if (state === 'PREVIEW_ACTIVATED_WITH_WARNINGS') {
    actions.push('Resolve preview warning diagnostics before founder sign-off.');
  }
  if (state === 'PREVIEW_ACTIVATION_FAILED') {
    actions.push('Review preview URL probe results and retry bounded preview activation.');
  }
  if (state === 'PREVIEW_ACTIVATION_BLOCKED') {
    actions.push('Clear runtime and preview foundation blockers before real preview activation.');
  }
  if (state === 'INSUFFICIENT_EVIDENCE') {
    actions.push('Restore runtime execution and preview foundation outputs before activation.');
  }
  actions.push(...snapshot.connectedLivePreviewFoundationAssessment.report.recommendedNextActions.slice(0, 2));
  return dedupeStrings(actions).slice(0, MAX_RECOMMENDED_ACTIONS);
}

export async function assessConnectedLivePreviewExecution(
  input: AssessConnectedLivePreviewExecutionInput = {},
): Promise<ConnectedLivePreviewExecutionAssessment> {
  const projectRootDir = input.rootDir ?? process.cwd();

  let workspaceAssessment = input.connectedWorkspaceCreationAssessment ?? null;
  let buildFoundation = input.connectedBuildExecutionFoundationAssessment ?? null;

  let founderAcceptance = input.founderAcceptanceAssessment ?? null;
  if (founderAcceptance === null && input.founderTestAssessment) {
    founderAcceptance = assessFounderAcceptanceGate({ founderTestAssessment: input.founderTestAssessment });
  }

  let runtimeExecution = input.connectedRuntimeExecutionAssessment ?? null;
  if (!runtimeExecution && input.performRealPreview) {
    runtimeExecution = await assessConnectedRuntimeExecution({
      rootDir: projectRootDir,
      connectedWorkspaceCreationAssessment: workspaceAssessment ?? undefined,
      connectedBuildExecutionFoundationAssessment: buildFoundation ?? undefined,
      founderAcceptanceAssessment: founderAcceptance,
      executionProofAssessment: input.executionProofAssessment,
      founderTestAssessment: input.founderTestAssessment,
      performRealActivation: true,
    });
    workspaceAssessment =
      runtimeExecution.report.inputSnapshot.connectedWorkspaceCreationAssessment ?? workspaceAssessment;
    buildFoundation =
      runtimeExecution.report.inputSnapshot.connectedBuildExecutionFoundationAssessment ?? buildFoundation;
  }

  if (!runtimeExecution) {
    runtimeExecution = await assessConnectedRuntimeExecution({
      rootDir: projectRootDir,
      connectedWorkspaceCreationAssessment: workspaceAssessment ?? undefined,
      connectedBuildExecutionFoundationAssessment: buildFoundation ?? undefined,
      founderAcceptanceAssessment: founderAcceptance,
      executionProofAssessment: input.executionProofAssessment,
      founderTestAssessment: input.founderTestAssessment,
      performRealActivation: false,
    });
    workspaceAssessment =
      runtimeExecution.report.inputSnapshot.connectedWorkspaceCreationAssessment ?? workspaceAssessment;
    buildFoundation =
      runtimeExecution.report.inputSnapshot.connectedBuildExecutionFoundationAssessment ?? buildFoundation;
  }

  const livePreviewFoundation = resolveLivePreviewFoundationAssessment(input, runtimeExecution);

  const workspaceId =
    runtimeExecution.report.activationContract?.workspaceId ??
    workspaceAssessment?.report.creationContract?.workspaceId ??
    livePreviewFoundation.report.previewCandidate.workspaceId;
  const workspaceRoot =
    workspaceAssessment?.report.creationContract?.workspaceRoot ??
    runtimeExecution.report.inputSnapshot.connectedBuildExecutionContract?.workspaceRoot ??
    '';

  const previewType = livePreviewFoundation.report.previewReadinessContract.previewType;
  const runtimeType =
    runtimeExecution.report.activationContract?.runtimeType ??
    livePreviewFoundation.report.inputSnapshot.connectedRuntimeActivationAssessment.report
      .runtimeActivationContract.runtimeType;

  const runtimeActivated =
    runtimeExecution.report.runtimeState === 'RUNTIME_ACTIVATED' ||
    runtimeExecution.report.runtimeState === 'RUNTIME_ACTIVATED_WITH_WARNINGS';

  const eligibleForRealPreview =
    input.performRealPreview === true &&
    workspaceRoot.length > 0 &&
    founderAcceptance !== null &&
    (founderAcceptance.acceptanceState === 'ACCEPTED' ||
      founderAcceptance.acceptanceState === 'ACCEPTED_WITH_WARNINGS') &&
    runtimeActivated &&
    (livePreviewFoundation.report.previewState === 'PREVIEW_READY' ||
      livePreviewFoundation.report.previewState === 'PREVIEW_READY_WITH_WARNINGS');

  const buildArtifacts =
    runtimeExecution.report.inputSnapshot.connectedBuildExecutionContract?.buildArtifacts ?? [];

  const executionResult = await executePreviewActivation({
    projectRootDir,
    workspaceId,
    workspaceRoot,
    previewType,
    runtimeType,
    buildArtifacts,
    activationMode: eligibleForRealPreview ? 'REAL_PREVIEW' : 'DRY_RUN',
  });

  const inputSnapshot = buildInputSnapshot(
    runtimeExecution,
    workspaceAssessment,
    buildFoundation,
    livePreviewFoundation,
    founderAcceptance,
    input.executionProofAssessment,
  );

  let activationContract: PreviewActivationContract | null = null;
  if (executionResult.realPreviewLaunchPerformed || executionResult.activationEvidence.previewActivated) {
    activationContract = {
      readOnly: true,
      previewId: executionResult.previewId,
      workspaceId,
      previewUrl: executionResult.previewUrl,
      previewType,
      previewActivationDurationMs: executionResult.previewActivationDurationMs,
      previewArtifacts: executionResult.previewArtifacts,
      previewEvidence: executionResult.previewEvidence,
      previewWarnings: executionResult.previewWarnings,
      previewDiagnostics: executionResult.previewDiagnostics,
      activationEvidence: executionResult.activationEvidence,
      realPreviewLaunchPerformed: executionResult.realPreviewLaunchPerformed,
      founderViewable: executionResult.realPreviewLaunchPerformed,
      world1Protected: true,
      disposableOnly: true,
    };
  }

  const questionAnswers = derivePreviewExecutionQuestionAnswers(inputSnapshot, activationContract);
  const previewScore = derivePreviewScore(questionAnswers);
  const hasWarnings =
    executionResult.previewWarnings.length > 0 ||
    livePreviewFoundation.report.warningReasons.length > 0 ||
    runtimeExecution.report.warningReasons.length > 0;
  const previewState = derivePreviewExecutionState(
    inputSnapshot,
    questionAnswers,
    executionResult.success,
    hasWarnings,
  );
  const executionId = nextExecutionId();

  const blockingReasons = dedupeStrings([
    ...(previewState === 'PREVIEW_ACTIVATION_BLOCKED'
      ? [
          ...livePreviewFoundation.report.blockingReasons,
          ...runtimeExecution.report.blockingReasons,
        ]
      : executionResult.blockingReasons),
    ...inputSnapshot.missingAuthorities.map((a) => `Missing authority: ${a}`),
  ]).slice(0, MAX_PREVIEW_BLOCKERS);

  const warningReasons = dedupeStrings([
    ...livePreviewFoundation.report.warningReasons,
    ...runtimeExecution.report.warningReasons,
    ...executionResult.previewWarnings,
  ]);

  const report: ConnectedLivePreviewExecutionReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: CONNECTED_LIVE_PREVIEW_EXECUTION_CORE_QUESTION,
    executionId,
    generatedAt: new Date().toISOString(),
    previewScore,
    previewState,
    previewUrl: activationContract?.previewUrl ?? null,
    previewActivationDurationMs: activationContract?.previewActivationDurationMs ?? 0,
    activationContract,
    blockingStages: previewState === 'PREVIEW_ACTIVATION_BLOCKED' ? ['PREVIEW'] : [],
    warningStages: previewState === 'PREVIEW_ACTIVATED_WITH_WARNINGS' ? ['PREVIEW'] : [],
    recommendedNextActions: buildRecommendedActions(inputSnapshot, previewState),
    questionAnswers,
    inputSnapshot,
    blockingReasons,
    warningReasons,
    cacheKey: stableCacheKey(executionId, previewState, previewScore),
  };

  const assessment: ConnectedLivePreviewExecutionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: executionResult.success ? 'PREVIEW_EXECUTION_COMPLETE' : 'PREVIEW_EXECUTION_FAILED',
    report,
  };

  recordConnectedLivePreviewExecutionAssessment(assessment);
  return assessment;
}

export async function buildConnectedLivePreviewExecutionArtifacts(
  input: AssessConnectedLivePreviewExecutionInput = {},
): Promise<ConnectedLivePreviewExecutionArtifacts> {
  const connectedLivePreviewExecutionAssessment = await assessConnectedLivePreviewExecution(input);
  return {
    connectedLivePreviewExecutionAssessment,
    connectedLivePreviewExecutionReportMarkdown: buildConnectedLivePreviewExecutionReportMarkdown(
      connectedLivePreviewExecutionAssessment.report,
    ),
  };
}

export function resetConnectedLivePreviewExecutionModuleForTests(): void {
  resetConnectedLivePreviewExecutionHistoryForTests();
  resetConnectedLivePreviewExecutionCounterForTests();
  resetPreviewActivationEngineForTests();
  resetConnectedLivePreviewModuleForTests();
  resetConnectedRuntimeExecutionModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  cleanupActiveRuntime();
}
