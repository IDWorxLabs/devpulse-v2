/**
 * Connected Runtime Execution — authority.
 */

import { createHash } from 'node:crypto';
import {
  assessConnectedRuntimeActivation,
  resetConnectedRuntimeActivationModuleForTests,
} from '../connected-runtime-activation-foundation/index.js';
import type { ConnectedRuntimeActivationAssessment } from '../connected-runtime-activation-foundation/connected-runtime-activation-types.js';
import {
  assessConnectedAutonomousBuildExecution,
  resetConnectedBuildExecutionModuleForTests,
} from '../connected-build-execution-foundation/index.js';
import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import { assessConnectedWorkspaceCreation } from '../connected-workspace-creation/index.js';
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
  assessWorld2ControlledExecutionRuntime,
} from '../world2-controlled-execution-runtime/index.js';
import type { World2ControlledExecutionRuntimeAssessment } from '../world2-controlled-execution-runtime/world2-controlled-execution-runtime-types.js';
import {
  assessWorld2DryRunExecutionVerifier,
} from '../world2-dry-run-execution-verifier/index.js';
import {
  recordConnectedRuntimeExecutionAssessment,
  resetConnectedRuntimeExecutionHistoryForTests,
} from './connected-runtime-execution-history.js';
import { buildConnectedRuntimeExecutionReportMarkdown } from './connected-runtime-execution-report-builder.js';
import {
  CONNECTED_RUNTIME_EXECUTION_CACHE_KEY_PREFIX,
  CONNECTED_RUNTIME_EXECUTION_CORE_QUESTION,
  CONNECTED_RUNTIME_EXECUTION_PASS_TOKEN,
  MAX_RUNTIME_BLOCKERS,
  MAX_RECOMMENDED_ACTIONS,
} from './connected-runtime-execution-registry.js';
import type {
  AssessConnectedRuntimeExecutionInput,
  ConnectedBuildExecutionContract,
  ConnectedRuntimeExecutionArtifacts,
  ConnectedRuntimeExecutionAssessment,
  ConnectedRuntimeExecutionInputSnapshot,
  ConnectedRuntimeExecutionReport,
  RuntimeActivationContract,
  RuntimeExecutionQuestionAnswers,
  RuntimeExecutionState,
} from './connected-runtime-execution-types.js';
import {
  cleanupActiveRuntime,
  executeRuntimeActivation,
  prepareBuildExecutionInWorkspace,
  resetRuntimeActivationEngineForTests,
} from './runtime-activation-engine.js';

let executionCounter = 0;

export function resetConnectedRuntimeExecutionCounterForTests(): void {
  executionCounter = 0;
}

function nextExecutionId(): string {
  executionCounter += 1;
  return `connected-runtime-execution-${executionCounter}`;
}

function stableCacheKey(executionId: string, state: RuntimeExecutionState, score: number): string {
  const digest = createHash('sha256')
    .update([CONNECTED_RUNTIME_EXECUTION_PASS_TOKEN, executionId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_RUNTIME_EXECUTION_CACHE_KEY_PREFIX}:${digest}`;
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

function resolveRuntimeActivationAssessment(
  input: AssessConnectedRuntimeExecutionInput,
  buildAssessment: ConnectedBuildExecutionAssessment | null,
): ConnectedRuntimeActivationAssessment {
  if (input.connectedRuntimeActivationAssessment) {
    return input.connectedRuntimeActivationAssessment;
  }
  const connectedBuildExecutionAssessment =
    buildAssessment ?? assessConnectedAutonomousBuildExecution({ rootDir: input.rootDir ?? process.cwd() });
  const composerAssessment =
    connectedBuildExecutionAssessment.report.inputSnapshot.dryRunComposerAssessment;
  const dryRunVerifierAssessment = assessWorld2DryRunExecutionVerifier({ composerAssessment });
  return assessConnectedRuntimeActivation({
    rootDir: input.rootDir ?? process.cwd(),
    connectedBuildExecutionAssessment,
    dryRunVerifierAssessment,
  });
}

function resolveWorld2RuntimeAssessment(
  buildAssessment: ConnectedBuildExecutionAssessment | null,
  workspaceAssessment: ConnectedWorkspaceCreationAssessment | null,
): World2ControlledExecutionRuntimeAssessment {
  const workspaceRuntime =
    workspaceAssessment?.report.inputSnapshot.creatorAssessment.inputSnapshot
      .disposableWorkspaceAssessment.inputSnapshot.engineAssessment.inputSnapshot.runtimeAssessment;
  if (workspaceRuntime) {
    return workspaceRuntime;
  }
  if (buildAssessment?.report.inputSnapshot.dryRunComposerAssessment) {
    const composer = buildAssessment.report.inputSnapshot.dryRunComposerAssessment;
    const sandbox = composer.inputSnapshot.sandboxAssessment;
    return assessWorld2ControlledExecutionRuntime({ sandboxAssessment: sandbox });
  }
  return assessWorld2ControlledExecutionRuntime({ rootDir: process.cwd() });
}

function buildInputSnapshot(
  workspaceAssessment: ConnectedWorkspaceCreationAssessment | null,
  buildContract: ConnectedBuildExecutionContract | null,
  buildFoundation: ConnectedBuildExecutionAssessment | null,
  runtimeActivation: ConnectedRuntimeActivationAssessment,
  world2Runtime: World2ControlledExecutionRuntimeAssessment,
  founderAcceptance: FounderAcceptanceAssessment | null,
  executionProof: AssessConnectedRuntimeExecutionInput['executionProofAssessment'],
): ConnectedRuntimeExecutionInputSnapshot {
  const missingAuthorities = dedupeStrings([
    ...(runtimeActivation.report.inputSnapshot.missingAuthorities ?? []),
    ...(workspaceAssessment === null ? ['connected-workspace-creation'] : []),
    ...(buildContract === null && buildFoundation === null ? ['connected-build-execution'] : []),
    ...(founderAcceptance === null ? ['founder-acceptance-gate'] : []),
  ]);

  return {
    readOnly: true,
    connectedWorkspaceCreationAssessment: workspaceAssessment,
    connectedBuildExecutionContract: buildContract,
    connectedBuildExecutionFoundationAssessment: buildFoundation,
    connectedRuntimeActivationAssessment: runtimeActivation,
    executionPackageRuntimeReport: buildExecutionPackageRuntimeReport(
      getDevPulseV2ExecutionPackageRuntime().getRuntimeState(),
      getDevPulseV2ExecutionPackageRuntime().getRecords(),
    ),
    executionVerificationReport: buildExecutionVerificationReport(
      getDevPulseV2ExecutionVerificationLoop().getLoopState(),
      getDevPulseV2ExecutionVerificationLoop().getResults(),
    ),
    world2RuntimeAssessment: world2Runtime,
    executionProofAssessment: executionProof ?? null,
    founderAcceptanceAssessment: founderAcceptance,
    missingAuthorities,
  };
}

export function deriveRuntimeExecutionQuestionAnswers(
  snapshot: ConnectedRuntimeExecutionInputSnapshot,
  contract: RuntimeActivationContract | null,
): RuntimeExecutionQuestionAnswers {
  const evidence = contract?.activationEvidence;
  const foundationAnswers = snapshot.connectedRuntimeActivationAssessment.report.questionAnswers;

  const proofProven =
    snapshot.executionProofAssessment === null ||
    snapshot.executionProofAssessment.verdict === 'PROVEN_FIXED';

  const runtimeActivationAttempted = contract?.realRuntimeLaunchPerformed === true || evidence?.runtimeStarted === true;
  const startupSucceeded = evidence?.startupSucceeded === true;
  const runtimeAlive = evidence?.processDetected === true && evidence?.runtimeEndpointAvailable === true;
  const startupArtifactsDetected = evidence?.startupArtifactsPresent === true;
  const activationIsolated = contract?.disposableOnly === true && contract?.world1Protected === true;
  const world1Protected = contract?.world1Protected === true;
  const activationAuditable = (contract?.runtimeEvidence.length ?? 0) > 0;
  const founderInspectable = activationAuditable && startupArtifactsDetected;
  const runtimeReadinessProven = foundationAnswers.runtimeReadinessProven;

  const runtimeActivationProven =
    runtimeActivationAttempted &&
    startupSucceeded &&
    runtimeAlive &&
    startupArtifactsDetected &&
    activationIsolated &&
    world1Protected &&
    activationAuditable &&
    founderInspectable &&
    runtimeReadinessProven &&
    proofProven &&
    snapshot.connectedRuntimeActivationAssessment.report.runtimeState === 'RUNTIME_READY';

  return {
    runtimeActivationAttempted,
    startupSucceeded,
    runtimeAlive,
    startupArtifactsDetected,
    activationIsolated,
    world1Protected,
    activationAuditable,
    founderInspectable,
    runtimeReadinessProven,
    runtimeActivationProven,
  };
}

export function deriveRuntimeScore(answers: RuntimeExecutionQuestionAnswers): number {
  const values = Object.values(answers);
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

export function deriveRuntimeExecutionState(
  snapshot: ConnectedRuntimeExecutionInputSnapshot,
  answers: RuntimeExecutionQuestionAnswers,
  executionSuccess: boolean,
  hasWarnings: boolean,
): RuntimeExecutionState {
  if (snapshot.missingAuthorities.length > 0) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (answers.runtimeActivationProven) {
    return 'RUNTIME_ACTIVATED';
  }

  if (executionSuccess && answers.runtimeActivationAttempted) {
    return hasWarnings ? 'RUNTIME_ACTIVATED_WITH_WARNINGS' : 'RUNTIME_ACTIVATED';
  }

  if (
    snapshot.connectedRuntimeActivationAssessment.report.runtimeState === 'RUNTIME_BLOCKED' ||
    snapshot.world2RuntimeAssessment.executionState === 'BLOCKED'
  ) {
    return 'RUNTIME_ACTIVATION_BLOCKED';
  }

  if (
    snapshot.connectedRuntimeActivationAssessment.report.runtimeState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (executionSuccess) {
    return hasWarnings ? 'RUNTIME_ACTIVATED_WITH_WARNINGS' : 'RUNTIME_ACTIVATED';
  }

  return 'RUNTIME_ACTIVATION_FAILED';
}

function buildRecommendedActions(
  snapshot: ConnectedRuntimeExecutionInputSnapshot,
  state: RuntimeExecutionState,
): string[] {
  const actions: string[] = [];
  if (state === 'RUNTIME_ACTIVATED') {
    actions.push('Maintain runtime isolation before any preview or verification phase.');
  }
  if (state === 'RUNTIME_ACTIVATED_WITH_WARNINGS') {
    actions.push('Resolve runtime warning diagnostics before downstream launch phases.');
  }
  if (state === 'RUNTIME_ACTIVATION_FAILED') {
    actions.push('Review startup artifacts and retry bounded runtime activation.');
  }
  if (state === 'RUNTIME_ACTIVATION_BLOCKED') {
    actions.push('Clear runtime activation foundation blockers before real startup.');
  }
  if (state === 'INSUFFICIENT_EVIDENCE') {
    actions.push('Restore workspace, build, and runtime foundation outputs before activation.');
  }
  actions.push(...snapshot.connectedRuntimeActivationAssessment.report.recommendedNextActions.slice(0, 2));
  return dedupeStrings(actions).slice(0, MAX_RECOMMENDED_ACTIONS);
}

export async function assessConnectedRuntimeExecution(
  input: AssessConnectedRuntimeExecutionInput = {},
): Promise<ConnectedRuntimeExecutionAssessment> {
  const projectRootDir = input.rootDir ?? process.cwd();

  let workspaceAssessment = input.connectedWorkspaceCreationAssessment ?? null;
  let buildFoundation = input.connectedBuildExecutionFoundationAssessment ?? null;

  if (!buildFoundation) {
    try {
      buildFoundation = assessConnectedAutonomousBuildExecution({ rootDir: projectRootDir });
    } catch {
      buildFoundation = null;
    }
  }

  const runtimeActivation = resolveRuntimeActivationAssessment(input, buildFoundation);
  const world2Runtime = resolveWorld2RuntimeAssessment(buildFoundation, workspaceAssessment);

  let founderAcceptance = input.founderAcceptanceAssessment ?? null;
  if (founderAcceptance === null && input.founderTestAssessment) {
    founderAcceptance = assessFounderAcceptanceGate({ founderTestAssessment: input.founderTestAssessment });
  }

  let buildContract = input.connectedBuildExecutionContract ?? null;
  let workspaceId =
    workspaceAssessment?.report.creationContract?.workspaceId ??
    buildContract?.workspaceId ??
    runtimeActivation.report.runtimeActivationCandidate.workspaceId;
  let workspaceRoot =
    workspaceAssessment?.report.creationContract?.workspaceRoot ??
    buildContract?.workspaceRoot ??
    '';

  if (!workspaceAssessment && input.performRealActivation) {
    workspaceAssessment = assessConnectedWorkspaceCreation({
      rootDir: projectRootDir,
      connectedBuildExecutionFoundationAssessment: buildFoundation ?? undefined,
      founderAcceptanceAssessment: founderAcceptance,
      executionProofAssessment: input.executionProofAssessment,
      founderTestAssessment: input.founderTestAssessment,
      performRealCreation: true,
    });
    workspaceId = workspaceAssessment.report.creationContract?.workspaceId ?? workspaceId;
    workspaceRoot = workspaceAssessment.report.creationContract?.workspaceRoot ?? workspaceRoot;
  }

  if (workspaceRoot && !buildContract && input.performRealActivation) {
    buildContract = prepareBuildExecutionInWorkspace(projectRootDir, workspaceId, workspaceRoot);
  }

  const runtimeType = runtimeActivation.report.runtimeActivationContract.runtimeType;
  const eligibleForRealActivation =
    input.performRealActivation === true &&
    workspaceRoot.length > 0 &&
    buildContract?.buildSuccessful === true &&
    founderAcceptance !== null &&
    (founderAcceptance.acceptanceState === 'ACCEPTED' ||
      founderAcceptance.acceptanceState === 'ACCEPTED_WITH_WARNINGS') &&
    (runtimeActivation.report.runtimeState === 'RUNTIME_READY' ||
      runtimeActivation.report.runtimeState === 'RUNTIME_READY_WITH_WARNINGS') &&
    !runtimeActivation.report.inputSnapshot.missingAuthorities.includes('founder-acceptance-gate');

  const activationMode = eligibleForRealActivation ? 'REAL_ACTIVATION' : 'DRY_RUN';

  const executionResult = await executeRuntimeActivation({
    projectRootDir,
    workspaceId,
    workspaceRoot,
    runtimeType,
    buildArtifacts: buildContract?.buildArtifacts ?? [],
    activationMode: eligibleForRealActivation ? 'REAL_ACTIVATION' : activationMode === 'DRY_RUN' ? 'DRY_RUN' : 'BLOCKED',
  });

  const inputSnapshot = buildInputSnapshot(
    workspaceAssessment,
    buildContract,
    buildFoundation,
    runtimeActivation,
    world2Runtime,
    founderAcceptance,
    input.executionProofAssessment,
  );

  let activationContract: RuntimeActivationContract | null = null;
  if (executionResult.realRuntimeLaunchPerformed || executionResult.activationEvidence.runtimeStarted) {
    activationContract = {
      readOnly: true,
      runtimeId: executionResult.runtimeId,
      workspaceId,
      runtimeType,
      startupDurationMs: executionResult.activationEvidence.startupDurationMs,
      runtimeArtifacts: executionResult.runtimeArtifacts,
      runtimeEvidence: executionResult.runtimeEvidence,
      runtimeWarnings: executionResult.runtimeWarnings,
      runtimeDiagnostics: executionResult.runtimeDiagnostics,
      activationEvidence: executionResult.activationEvidence,
      realRuntimeLaunchPerformed: executionResult.realRuntimeLaunchPerformed,
      world1Protected: true,
      disposableOnly: true,
    };
  }

  const questionAnswers = deriveRuntimeExecutionQuestionAnswers(inputSnapshot, activationContract);
  const runtimeScore = deriveRuntimeScore(questionAnswers);
  const hasWarnings =
    executionResult.runtimeWarnings.length > 0 ||
    runtimeActivation.report.warningReasons.length > 0;
  const runtimeState = deriveRuntimeExecutionState(
    inputSnapshot,
    questionAnswers,
    executionResult.success,
    hasWarnings,
  );
  const executionId = nextExecutionId();

  const blockingReasons = dedupeStrings([
    ...(runtimeState === 'RUNTIME_ACTIVATION_BLOCKED'
      ? runtimeActivation.report.blockingReasons
      : executionResult.blockingReasons),
    ...inputSnapshot.missingAuthorities.map((a) => `Missing authority: ${a}`),
  ]).slice(0, MAX_RUNTIME_BLOCKERS);

  const warningReasons = dedupeStrings([
    ...runtimeActivation.report.warningReasons,
    ...executionResult.runtimeWarnings,
  ]);

  const report: ConnectedRuntimeExecutionReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: CONNECTED_RUNTIME_EXECUTION_CORE_QUESTION,
    executionId,
    generatedAt: new Date().toISOString(),
    runtimeScore,
    runtimeState,
    startupDurationMs: activationContract?.startupDurationMs ?? 0,
    activationContract,
    blockingStages: runtimeState === 'RUNTIME_ACTIVATION_BLOCKED' ? ['RUNTIME'] : [],
    warningStages: runtimeState === 'RUNTIME_ACTIVATED_WITH_WARNINGS' ? ['RUNTIME'] : [],
    recommendedNextActions: buildRecommendedActions(inputSnapshot, runtimeState),
    questionAnswers,
    inputSnapshot,
    blockingReasons,
    warningReasons,
    cacheKey: stableCacheKey(executionId, runtimeState, runtimeScore),
  };

  const assessment: ConnectedRuntimeExecutionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: executionResult.success ? 'RUNTIME_EXECUTION_COMPLETE' : 'RUNTIME_EXECUTION_FAILED',
    report,
  };

  recordConnectedRuntimeExecutionAssessment(assessment);
  return assessment;
}

export async function buildConnectedRuntimeExecutionArtifacts(
  input: AssessConnectedRuntimeExecutionInput = {},
): Promise<ConnectedRuntimeExecutionArtifacts> {
  const connectedRuntimeExecutionAssessment = await assessConnectedRuntimeExecution(input);
  return {
    connectedRuntimeExecutionAssessment,
    connectedRuntimeExecutionReportMarkdown: buildConnectedRuntimeExecutionReportMarkdown(
      connectedRuntimeExecutionAssessment.report,
    ),
  };
}

export function resetConnectedRuntimeExecutionModuleForTests(): void {
  resetConnectedRuntimeExecutionHistoryForTests();
  resetConnectedRuntimeExecutionCounterForTests();
  resetRuntimeActivationEngineForTests();
  resetConnectedRuntimeActivationModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  cleanupActiveRuntime();
}
