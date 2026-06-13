/**
 * Connected Verification Execution — authority.
 */

import { createHash } from 'node:crypto';
import {
  assessConnectedVerification,
  resetConnectedVerificationModuleForTests,
} from '../connected-verification-foundation/index.js';
import type { ConnectedVerificationAssessment } from '../connected-verification-foundation/connected-verification-types.js';
import {
  resetConnectedBuildExecutionModuleForTests,
} from '../connected-build-execution-foundation/index.js';
import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import {
  assessConnectedLivePreviewExecution,
  resetConnectedLivePreviewExecutionModuleForTests,
} from '../connected-live-preview-execution/index.js';
import type { ConnectedLivePreviewExecutionAssessment } from '../connected-live-preview-execution/connected-live-preview-execution-types.js';
import type { ConnectedRuntimeExecutionAssessment } from '../connected-runtime-execution/connected-runtime-execution-types.js';
import type { ConnectedWorkspaceCreationAssessment } from '../connected-workspace-creation/connected-workspace-creation-types.js';
import { assessFounderAcceptanceGate } from '../founder-acceptance-gate/index.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import {
  buildExecutionVerificationReport,
  getDevPulseV2ExecutionVerificationLoop,
} from '../execution-verification/index.js';
import { assessWorld2DryRunExecutionVerifier } from '../world2-dry-run-execution-verifier/index.js';
import { cleanupActiveRuntime } from '../connected-runtime-execution/runtime-activation-engine.js';
import {
  recordConnectedVerificationExecutionAssessment,
  resetConnectedVerificationExecutionHistoryForTests,
} from './connected-verification-execution-history.js';
import { buildConnectedVerificationExecutionReportMarkdown } from './connected-verification-execution-report-builder.js';
import {
  CONNECTED_VERIFICATION_EXECUTION_CACHE_KEY_PREFIX,
  CONNECTED_VERIFICATION_EXECUTION_CORE_QUESTION,
  CONNECTED_VERIFICATION_EXECUTION_PASS_TOKEN,
  MAX_VERIFICATION_BLOCKERS,
  MAX_RECOMMENDED_ACTIONS,
  REQUIRED_BOUNDED_CHECKS,
} from './connected-verification-execution-registry.js';
import type {
  AssessConnectedVerificationExecutionInput,
  ConnectedVerificationExecutionArtifacts,
  ConnectedVerificationExecutionAssessment,
  ConnectedVerificationExecutionInputSnapshot,
  ConnectedVerificationExecutionReport,
  VerificationExecutionContract,
  VerificationExecutionQuestionAnswers,
  VerificationExecutionState,
} from './connected-verification-execution-types.js';
import {
  executeVerificationExecution,
  resetVerificationExecutionEngineForTests,
} from './verification-execution-engine.js';

let executionCounter = 0;

export function resetConnectedVerificationExecutionCounterForTests(): void {
  executionCounter = 0;
}

function nextExecutionId(): string {
  executionCounter += 1;
  return `connected-verification-execution-${executionCounter}`;
}

function stableCacheKey(executionId: string, state: VerificationExecutionState, score: number): string {
  const digest = createHash('sha256')
    .update([CONNECTED_VERIFICATION_EXECUTION_PASS_TOKEN, executionId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_VERIFICATION_EXECUTION_CACHE_KEY_PREFIX}:${digest}`;
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

function resolveVerificationFoundationAssessment(
  input: AssessConnectedVerificationExecutionInput,
  previewExecution: ConnectedLivePreviewExecutionAssessment,
): ConnectedVerificationAssessment {
  if (input.connectedVerificationFoundationAssessment) {
    return input.connectedVerificationFoundationAssessment;
  }
  const livePreviewFoundation =
    previewExecution.report.inputSnapshot.connectedLivePreviewFoundationAssessment;
  return assessConnectedVerification({
    rootDir: input.rootDir ?? process.cwd(),
    connectedLivePreviewAssessment: livePreviewFoundation,
    founderTestAssessment: input.founderTestAssessment,
  });
}

function buildInputSnapshot(
  previewExecution: ConnectedLivePreviewExecutionAssessment,
  verificationFoundation: ConnectedVerificationAssessment,
  workspaceAssessment: ConnectedWorkspaceCreationAssessment | null,
  buildFoundation: ConnectedBuildExecutionAssessment | null,
  founderAcceptance: FounderAcceptanceAssessment | null,
  executionProof: AssessConnectedVerificationExecutionInput['executionProofAssessment'],
): ConnectedVerificationExecutionInputSnapshot {
  const runtimeExecution = previewExecution.report.inputSnapshot.connectedRuntimeExecutionAssessment;
  const composerAssessment =
    buildFoundation?.report.inputSnapshot.dryRunComposerAssessment ??
    runtimeExecution.report.inputSnapshot.connectedBuildExecutionFoundationAssessment?.report
      .inputSnapshot.dryRunComposerAssessment;
  const dryRunVerifierAssessment = composerAssessment
    ? assessWorld2DryRunExecutionVerifier({ composerAssessment })
    : assessWorld2DryRunExecutionVerifier({ rootDir: process.cwd() });

  const missingAuthorities = dedupeStrings([
    ...(verificationFoundation.report.inputSnapshot.missingAuthorities ?? []),
    ...(previewExecution.report.inputSnapshot.missingAuthorities ?? []),
    ...(runtimeExecution.report.inputSnapshot.missingAuthorities ?? []),
    ...(workspaceAssessment === null ? ['connected-workspace-creation'] : []),
    ...(buildFoundation === null ? ['connected-build-execution'] : []),
    ...(founderAcceptance === null ? ['founder-acceptance-gate'] : []),
  ]);

  return {
    readOnly: true,
    connectedLivePreviewExecutionAssessment: previewExecution,
    connectedRuntimeExecutionAssessment: runtimeExecution,
    connectedWorkspaceCreationAssessment: workspaceAssessment,
    connectedBuildExecutionFoundationAssessment: buildFoundation,
    connectedVerificationFoundationAssessment: verificationFoundation,
    verificationRealityAssessment: verificationFoundation.report.inputSnapshot.verificationRealityAssessment,
    dryRunVerifierAssessment,
    executionVerificationReport: buildExecutionVerificationReport(
      getDevPulseV2ExecutionVerificationLoop().getLoopState(),
      getDevPulseV2ExecutionVerificationLoop().getResults(),
    ),
    executionProofAssessment: executionProof ?? null,
    founderAcceptanceAssessment: founderAcceptance,
    missingAuthorities,
  };
}

export function deriveVerificationCoverage(checksExecuted: number): number {
  return Math.round((checksExecuted / REQUIRED_BOUNDED_CHECKS.length) * 100);
}

export function deriveVerificationExecutionQuestionAnswers(
  snapshot: ConnectedVerificationExecutionInputSnapshot,
  contract: VerificationExecutionContract | null,
): VerificationExecutionQuestionAnswers {
  const evidence = contract?.executionEvidence;
  const foundationAnswers = snapshot.connectedVerificationFoundationAssessment.report.questionAnswers;

  const proofProven =
    snapshot.executionProofAssessment === null ||
    snapshot.executionProofAssessment.verdict === 'PROVEN_FIXED';

  const previewActivated =
    snapshot.connectedLivePreviewExecutionAssessment.report.previewState === 'PREVIEW_ACTIVATED' ||
    snapshot.connectedLivePreviewExecutionAssessment.report.previewState === 'PREVIEW_ACTIVATED_WITH_WARNINGS';

  const verificationExecuted =
    contract?.realVerificationExecutionPerformed === true || evidence?.verificationStarted === true;
  const checksActuallyRun = (evidence?.verificationChecksExecuted ?? 0) > 0;
  const resultsCollected = (contract?.verificationResults.length ?? 0) > 0;
  const verificationArtifactsGenerated = evidence?.verificationArtifactsGenerated === true;
  const executionIsolated = contract?.disposableOnly === true && contract?.world1Protected === true;
  const world1Protected = contract?.world1Protected === true;
  const verificationAuditable = (contract?.verificationEvidence.length ?? 0) > 0;
  const founderInspectable = verificationAuditable && verificationArtifactsGenerated;
  const verificationReadinessProven = foundationAnswers.verificationReadinessProven;

  const verificationExecutionProven =
    verificationExecuted &&
    checksActuallyRun &&
    resultsCollected &&
    verificationArtifactsGenerated &&
    executionIsolated &&
    world1Protected &&
    verificationAuditable &&
    founderInspectable &&
    verificationReadinessProven &&
    proofProven &&
    previewActivated &&
    (snapshot.connectedVerificationFoundationAssessment.report.verificationState === 'VERIFICATION_READY' ||
      snapshot.connectedVerificationFoundationAssessment.report.verificationState ===
        'VERIFICATION_READY_WITH_WARNINGS') &&
    evidence?.verificationCompleted === true &&
    evidence?.verificationSucceeded === true &&
    evidence?.previewProbeStatus === 'PASS' &&
    evidence?.workspaceEvidenceStatus === 'PASS' &&
    evidence?.runtimeEvidenceStatus === 'PASS' &&
    evidence?.previewEvidenceStatus === 'PASS';

  return {
    verificationExecuted,
    checksActuallyRun,
    resultsCollected,
    verificationArtifactsGenerated,
    executionIsolated,
    world1Protected,
    verificationAuditable,
    founderInspectable,
    verificationReadinessProven,
    verificationExecutionProven,
  };
}

export function deriveVerificationScore(answers: VerificationExecutionQuestionAnswers): number {
  const values = Object.values(answers);
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

export function deriveVerificationExecutionState(
  snapshot: ConnectedVerificationExecutionInputSnapshot,
  answers: VerificationExecutionQuestionAnswers,
  executionSuccess: boolean,
  hasWarnings: boolean,
): VerificationExecutionState {
  if (snapshot.missingAuthorities.length > 0) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (answers.verificationExecutionProven) {
    return 'VERIFICATION_EXECUTED';
  }

  if (executionSuccess && answers.verificationExecuted) {
    return hasWarnings ? 'VERIFICATION_EXECUTED_WITH_WARNINGS' : 'VERIFICATION_EXECUTED';
  }

  if (
    snapshot.connectedVerificationFoundationAssessment.report.verificationState === 'VERIFICATION_BLOCKED' ||
    snapshot.connectedLivePreviewExecutionAssessment.report.previewState === 'PREVIEW_ACTIVATION_BLOCKED'
  ) {
    return 'VERIFICATION_EXECUTION_BLOCKED';
  }

  if (
    snapshot.connectedVerificationFoundationAssessment.report.verificationState === 'INSUFFICIENT_EVIDENCE' ||
    snapshot.connectedLivePreviewExecutionAssessment.report.previewState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (executionSuccess) {
    return hasWarnings ? 'VERIFICATION_EXECUTED_WITH_WARNINGS' : 'VERIFICATION_EXECUTED';
  }

  return 'VERIFICATION_EXECUTION_FAILED';
}

function buildRecommendedActions(
  snapshot: ConnectedVerificationExecutionInputSnapshot,
  state: VerificationExecutionState,
): string[] {
  const actions: string[] = [];
  if (state === 'VERIFICATION_EXECUTED') {
    actions.push('Maintain verification isolation before any deployment phase.');
  }
  if (state === 'VERIFICATION_EXECUTED_WITH_WARNINGS') {
    actions.push('Resolve verification warning diagnostics before founder sign-off.');
  }
  if (state === 'VERIFICATION_EXECUTION_FAILED') {
    actions.push('Review failed verification checks and retry bounded execution.');
  }
  if (state === 'VERIFICATION_EXECUTION_BLOCKED') {
    actions.push('Clear preview and verification foundation blockers before real verification.');
  }
  if (state === 'INSUFFICIENT_EVIDENCE') {
    actions.push('Restore preview execution and verification foundation outputs before verification.');
  }
  actions.push(...snapshot.connectedVerificationFoundationAssessment.report.recommendedNextActions.slice(0, 2));
  return dedupeStrings(actions).slice(0, MAX_RECOMMENDED_ACTIONS);
}

export async function assessConnectedVerificationExecution(
  input: AssessConnectedVerificationExecutionInput = {},
): Promise<ConnectedVerificationExecutionAssessment> {
  const projectRootDir = input.rootDir ?? process.cwd();

  let workspaceAssessment = input.connectedWorkspaceCreationAssessment ?? null;
  let buildFoundation = input.connectedBuildExecutionFoundationAssessment ?? null;

  let founderAcceptance = input.founderAcceptanceAssessment ?? null;
  if (founderAcceptance === null && input.founderTestAssessment) {
    founderAcceptance = assessFounderAcceptanceGate({ founderTestAssessment: input.founderTestAssessment });
  }

  let previewExecution = input.connectedLivePreviewExecutionAssessment ?? null;
  if (!previewExecution && input.performRealVerification) {
    previewExecution = await assessConnectedLivePreviewExecution({
      rootDir: projectRootDir,
      connectedRuntimeExecutionAssessment: input.connectedRuntimeExecutionAssessment,
      connectedWorkspaceCreationAssessment: workspaceAssessment ?? undefined,
      connectedBuildExecutionFoundationAssessment: buildFoundation ?? undefined,
      founderAcceptanceAssessment: founderAcceptance,
      executionProofAssessment: input.executionProofAssessment,
      founderTestAssessment: input.founderTestAssessment,
      performRealPreview: true,
    });
    workspaceAssessment =
      previewExecution.report.inputSnapshot.connectedWorkspaceCreationAssessment ?? workspaceAssessment;
    buildFoundation =
      previewExecution.report.inputSnapshot.connectedBuildExecutionFoundationAssessment ?? buildFoundation;
  }

  if (!previewExecution) {
    previewExecution = await assessConnectedLivePreviewExecution({
      rootDir: projectRootDir,
      connectedRuntimeExecutionAssessment: input.connectedRuntimeExecutionAssessment,
      connectedWorkspaceCreationAssessment: workspaceAssessment ?? undefined,
      connectedBuildExecutionFoundationAssessment: buildFoundation ?? undefined,
      founderAcceptanceAssessment: founderAcceptance,
      executionProofAssessment: input.executionProofAssessment,
      founderTestAssessment: input.founderTestAssessment,
      performRealPreview: false,
    });
    workspaceAssessment =
      previewExecution.report.inputSnapshot.connectedWorkspaceCreationAssessment ?? workspaceAssessment;
    buildFoundation =
      previewExecution.report.inputSnapshot.connectedBuildExecutionFoundationAssessment ?? buildFoundation;
  }

  const verificationFoundation = resolveVerificationFoundationAssessment(input, previewExecution);

  const workspaceId =
    previewExecution.report.activationContract?.workspaceId ??
    workspaceAssessment?.report.creationContract?.workspaceId ??
    verificationFoundation.report.verificationCandidate.workspaceId;
  const workspaceRoot =
    workspaceAssessment?.report.creationContract?.workspaceRoot ?? '';

  const previewUrl =
    previewExecution.report.activationContract?.previewUrl ??
    previewExecution.report.previewUrl ??
    '';

  const previewActivated =
    previewExecution.report.previewState === 'PREVIEW_ACTIVATED' ||
    previewExecution.report.previewState === 'PREVIEW_ACTIVATED_WITH_WARNINGS';

  const eligibleForRealVerification =
    input.performRealVerification === true &&
    workspaceRoot.length > 0 &&
    previewUrl.length > 0 &&
    previewActivated &&
    founderAcceptance !== null &&
    (founderAcceptance.acceptanceState === 'ACCEPTED' ||
      founderAcceptance.acceptanceState === 'ACCEPTED_WITH_WARNINGS') &&
    (verificationFoundation.report.verificationState === 'VERIFICATION_READY' ||
      verificationFoundation.report.verificationState === 'VERIFICATION_READY_WITH_WARNINGS');

  const executionResult = await executeVerificationExecution({
    projectRootDir,
    workspaceId,
    workspaceRoot,
    previewUrl,
    executionMode: eligibleForRealVerification ? 'REAL_VERIFICATION' : 'DRY_RUN',
  });

  const inputSnapshot = buildInputSnapshot(
    previewExecution,
    verificationFoundation,
    workspaceAssessment,
    buildFoundation,
    founderAcceptance,
    input.executionProofAssessment,
  );

  let executionContract: VerificationExecutionContract | null = null;
  if (
    executionResult.realVerificationExecutionPerformed ||
    executionResult.executionEvidence.verificationStarted
  ) {
    executionContract = {
      readOnly: true,
      verificationId: executionResult.verificationId,
      workspaceId,
      previewUrl: executionResult.previewUrl,
      verificationPlan: executionResult.verificationPlan,
      verificationDurationMs: executionResult.verificationDurationMs,
      verificationResults: executionResult.verificationResults,
      verificationArtifacts: executionResult.verificationArtifacts,
      verificationEvidence: executionResult.verificationEvidence,
      verificationWarnings: executionResult.verificationWarnings,
      verificationDiagnostics: executionResult.verificationDiagnostics,
      executionEvidence: executionResult.executionEvidence,
      realVerificationExecutionPerformed: executionResult.realVerificationExecutionPerformed,
      world1Protected: true,
      disposableOnly: true,
    };
  }

  const questionAnswers = deriveVerificationExecutionQuestionAnswers(inputSnapshot, executionContract);
  const verificationScore = deriveVerificationScore(questionAnswers);
  const checksExecuted = executionContract?.executionEvidence.verificationChecksExecuted ?? 0;
  const verificationCoverage = deriveVerificationCoverage(checksExecuted);
  const hasWarnings =
    executionResult.verificationWarnings.length > 0 ||
    verificationFoundation.report.warningReasons.length > 0 ||
    previewExecution.report.warningReasons.length > 0;
  const verificationState = deriveVerificationExecutionState(
    inputSnapshot,
    questionAnswers,
    executionResult.success,
    hasWarnings,
  );
  const executionId = nextExecutionId();

  const blockingReasons = dedupeStrings([
    ...(verificationState === 'VERIFICATION_EXECUTION_BLOCKED'
      ? [
          ...verificationFoundation.report.blockingReasons,
          ...previewExecution.report.blockingReasons,
        ]
      : executionResult.blockingReasons),
    ...inputSnapshot.missingAuthorities.map((a) => `Missing authority: ${a}`),
  ]).slice(0, MAX_VERIFICATION_BLOCKERS);

  const warningReasons = dedupeStrings([
    ...verificationFoundation.report.warningReasons,
    ...previewExecution.report.warningReasons,
    ...executionResult.verificationWarnings,
  ]);

  const report: ConnectedVerificationExecutionReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: CONNECTED_VERIFICATION_EXECUTION_CORE_QUESTION,
    executionId,
    generatedAt: new Date().toISOString(),
    verificationScore,
    verificationState,
    verificationCoverage,
    previewProbeResult: executionContract?.executionEvidence.previewProbeStatus ?? 'SKIP',
    workspaceEvidenceResult: executionContract?.executionEvidence.workspaceEvidenceStatus ?? 'SKIP',
    runtimeEvidenceResult: executionContract?.executionEvidence.runtimeEvidenceStatus ?? 'SKIP',
    previewEvidenceResult: executionContract?.executionEvidence.previewEvidenceStatus ?? 'SKIP',
    verificationDurationMs: executionContract?.verificationDurationMs ?? 0,
    executionContract,
    blockingStages: verificationState === 'VERIFICATION_EXECUTION_BLOCKED' ? ['VERIFICATION'] : [],
    warningStages: verificationState === 'VERIFICATION_EXECUTED_WITH_WARNINGS' ? ['VERIFICATION'] : [],
    recommendedNextActions: buildRecommendedActions(inputSnapshot, verificationState),
    questionAnswers,
    inputSnapshot,
    blockingReasons,
    warningReasons,
    cacheKey: stableCacheKey(executionId, verificationState, verificationScore),
  };

  const assessment: ConnectedVerificationExecutionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: executionResult.success
      ? 'VERIFICATION_EXECUTION_COMPLETE'
      : 'VERIFICATION_EXECUTION_FAILED',
    report,
  };

  recordConnectedVerificationExecutionAssessment(assessment);
  return assessment;
}

export async function buildConnectedVerificationExecutionArtifacts(
  input: AssessConnectedVerificationExecutionInput = {},
): Promise<ConnectedVerificationExecutionArtifacts> {
  const connectedVerificationExecutionAssessment = await assessConnectedVerificationExecution(input);
  return {
    connectedVerificationExecutionAssessment,
    connectedVerificationExecutionReportMarkdown: buildConnectedVerificationExecutionReportMarkdown(
      connectedVerificationExecutionAssessment.report,
    ),
  };
}

export function resetConnectedVerificationExecutionModuleForTests(): void {
  resetConnectedVerificationExecutionHistoryForTests();
  resetConnectedVerificationExecutionCounterForTests();
  resetVerificationExecutionEngineForTests();
  resetConnectedVerificationModuleForTests();
  resetConnectedLivePreviewExecutionModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  cleanupActiveRuntime();
}
