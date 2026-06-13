/**
 * Connected Workspace Creation — authority.
 * Orchestrates World 2 upstream chain and real disposable workspace creation.
 */

import { createHash } from 'node:crypto';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import {
  assessConnectedAutonomousBuildExecution,
  resetConnectedBuildExecutionModuleForTests,
} from '../connected-build-execution-foundation/index.js';
import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import { assessFounderAcceptanceGate } from '../founder-acceptance-gate/index.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import {
  assessWorld2DisposableWorkspaceInstantiator,
  resetWorld2DisposableWorkspaceInstantiatorModuleForTests,
} from '../world2-disposable-workspace-instantiator/index.js';
import type { World2DisposableWorkspaceInstantiatorAssessment } from '../world2-disposable-workspace-instantiator/world2-disposable-workspace-instantiator-types.js';
import {
  recordConnectedWorkspaceCreationAssessment,
  resetConnectedWorkspaceCreationHistoryForTests,
} from './connected-workspace-creation-history.js';
import { buildConnectedWorkspaceCreationReportMarkdown } from './connected-workspace-creation-report-builder.js';
import {
  CONNECTED_WORKSPACE_CREATION_CACHE_KEY_PREFIX,
  CONNECTED_WORKSPACE_CREATION_CORE_QUESTION,
  CONNECTED_WORKSPACE_CREATION_PASS_TOKEN,
  MAX_CREATION_BLOCKERS,
  MAX_RECOMMENDED_ACTIONS,
  resolveLogicalDisposableRoot,
} from './connected-workspace-creation-registry.js';
import type {
  AssessConnectedWorkspaceCreationInput,
  ConnectedWorkspaceCreationArtifacts,
  ConnectedWorkspaceCreationAssessment,
  ConnectedWorkspaceCreationInputSnapshot,
  ConnectedWorkspaceCreationReport,
  WorkspaceCreationArtifact,
  WorkspaceCreationContract,
  WorkspaceCreationQuestionAnswers,
  WorkspaceCreationState,
} from './connected-workspace-creation-types.js';
import {
  executeWorkspaceCreation,
  mapLogicalPathToRelative,
  resetWorkspaceCreationExecutorForTests,
} from './workspace-creation-executor.js';

let creationCounter = 0;

export function resetConnectedWorkspaceCreationCounterForTests(): void {
  creationCounter = 0;
}

function nextCreationId(): string {
  creationCounter += 1;
  return `connected-workspace-creation-${creationCounter}`;
}

function stableCacheKey(creationId: string, state: WorkspaceCreationState, score: number): string {
  const digest = createHash('sha256')
    .update([CONNECTED_WORKSPACE_CREATION_PASS_TOKEN, creationId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_WORKSPACE_CREATION_CACHE_KEY_PREFIX}:${digest}`;
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

function resolveInstantiatorAssessment(
  input: AssessConnectedWorkspaceCreationInput,
): World2DisposableWorkspaceInstantiatorAssessment {
  if (input.instantiatorAssessment) {
    return input.instantiatorAssessment;
  }
  return assessWorld2DisposableWorkspaceInstantiator({
    rootDir: input.rootDir ?? process.cwd(),
    executionModeOverride: input.performRealCreation ? 'REAL_INSTANTIATION' : undefined,
  });
}

function resolveFounderAcceptance(
  input: AssessConnectedWorkspaceCreationInput,
): FounderAcceptanceAssessment | null {
  if (input.founderAcceptanceAssessment !== undefined) {
    return input.founderAcceptanceAssessment;
  }
  if (input.founderTestAssessment) {
    return assessFounderAcceptanceGate({ founderTestAssessment: input.founderTestAssessment });
  }
  return null;
}

function resolveConnectedBuildExecution(
  input: AssessConnectedWorkspaceCreationInput,
): ConnectedBuildExecutionAssessment | null {
  if (input.connectedBuildExecutionAssessment) {
    return input.connectedBuildExecutionAssessment;
  }
  try {
    return assessConnectedAutonomousBuildExecution({
      rootDir: input.rootDir ?? process.cwd(),
    });
  } catch {
    return null;
  }
}

function buildInputSnapshot(
  instantiatorAssessment: World2DisposableWorkspaceInstantiatorAssessment,
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment | null,
  founderAcceptanceAssessment: FounderAcceptanceAssessment | null,
  executionProofAssessment: ExecutionProofAssessment | null | undefined,
): ConnectedWorkspaceCreationInputSnapshot {
  const creator = instantiatorAssessment.inputSnapshot.creatorAssessment;
  const missingAuthorities = dedupeStrings([
    ...instantiatorAssessment.inputSnapshot.missingAuthorities,
    ...creator.inputSnapshot.missingAuthorities,
    ...(connectedBuildExecutionAssessment === null ? ['connected-build-execution-foundation'] : []),
    ...(founderAcceptanceAssessment === null ? ['founder-acceptance-gate'] : []),
  ]);

  return {
    readOnly: true,
    disposableWorkspaceAssessment: creator.inputSnapshot.disposableWorkspaceAssessment,
    populationAssessment: creator.inputSnapshot.populationAssessment,
    materializationAssessment: creator.inputSnapshot.materializationAssessment,
    instantiationGovernanceAssessment: creator.inputSnapshot.instantiationGovernanceAssessment,
    creatorAssessment: creator,
    instantiatorAssessment,
    connectedBuildExecutionAssessment,
    executionProofAssessment: executionProofAssessment ?? null,
    founderAcceptanceAssessment,
    missingAuthorities,
  };
}

function buildArtifactsToCreate(
  snapshot: ConnectedWorkspaceCreationInputSnapshot,
  workspaceId: string,
): WorkspaceCreationArtifact[] {
  const plan = snapshot.creatorAssessment.creationPlan;
  const artifacts: WorkspaceCreationArtifact[] = [];

  for (const path of plan?.validationAssets ?? []) {
    artifacts.push({
      readOnly: true,
      path,
      category: 'VALIDATION',
      sourceAuthority: 'world2-workspace-population',
    });
  }
  for (const path of plan?.rollbackAssets ?? []) {
    artifacts.push({
      readOnly: true,
      path,
      category: 'ROLLBACK',
      sourceAuthority: 'world2-workspace-population',
    });
  }

  return artifacts.filter((a) => mapLogicalPathToRelative(a.path, workspaceId).length > 0);
}

export function deriveWorkspaceCreationQuestionAnswers(
  snapshot: ConnectedWorkspaceCreationInputSnapshot,
  contract: WorkspaceCreationContract | null,
): WorkspaceCreationQuestionAnswers {
  const fs = contract?.filesystemEvidence;
  const governance = snapshot.instantiationGovernanceAssessment;
  const plan = snapshot.creatorAssessment.creationPlan;

  const workspaceCreated = contract?.realFileMutationPerformed === true && (fs?.creationSuccessful ?? false);
  const workspaceExists = fs?.workspaceExists === true;
  const isDisposable = contract?.disposableOnly === true;
  const isIsolated = contract?.world1Protected === true && workspaceExists;
  const world1Protected = contract?.world1Protected === true;
  const governanceSatisfied =
    governance.approvalState === 'APPROVED' || governance.approvalState === 'APPROVED_WITH_RESTRICTIONS';
  const creationAuditable = (contract?.creationEvidence.length ?? 0) > 0;
  const rollbackAvailable = (plan?.rollbackAssets.length ?? 0) > 0;
  const founderInspectable =
    creationAuditable &&
    workspaceExists &&
    (contract?.createdDirectories.length ?? 0) > 0;

  const proofProven =
    snapshot.executionProofAssessment === null ||
    snapshot.executionProofAssessment.verdict === 'PROVEN_FIXED';

  const workspaceCreationProven =
    workspaceCreated &&
    workspaceExists &&
    isDisposable &&
    isIsolated &&
    world1Protected &&
    governanceSatisfied &&
    creationAuditable &&
    rollbackAvailable &&
    founderInspectable &&
    proofProven &&
    snapshot.instantiatorAssessment.resultState === 'INSTANTIATION_READY';

  return {
    workspaceCreated,
    workspaceExists,
    isDisposable,
    isIsolated,
    world1Protected,
    governanceSatisfied,
    creationAuditable,
    rollbackAvailable,
    founderInspectable,
    workspaceCreationProven,
  };
}

export function deriveWorkspaceCreationScore(answers: WorkspaceCreationQuestionAnswers): number {
  const values = Object.values(answers);
  const yesCount = values.filter(Boolean).length;
  return Math.round((yesCount / values.length) * 100);
}

export function deriveWorkspaceCreationState(
  snapshot: ConnectedWorkspaceCreationInputSnapshot,
  answers: WorkspaceCreationQuestionAnswers,
  executionSuccess: boolean,
  hasWarnings: boolean,
): WorkspaceCreationState {
  if (snapshot.missingAuthorities.length > 0) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    snapshot.instantiatorAssessment.resultState === 'INSTANTIATION_BLOCKED' ||
    snapshot.creatorAssessment.creationState === 'CREATION_BLOCKED' ||
    snapshot.instantiationGovernanceAssessment.approvalState === 'BLOCKED'
  ) {
    return 'WORKSPACE_CREATION_BLOCKED';
  }

  if (answers.workspaceCreationProven) {
    return 'WORKSPACE_CREATED';
  }

  if (executionSuccess && (hasWarnings || !answers.workspaceCreationProven)) {
    return 'WORKSPACE_CREATED_WITH_WARNINGS';
  }

  if (executionSuccess) {
    return 'WORKSPACE_CREATED';
  }

  if (
    snapshot.instantiatorAssessment.resultState === 'INSUFFICIENT_EVIDENCE' ||
    snapshot.creatorAssessment.creationState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  return 'WORKSPACE_CREATION_FAILED';
}

function buildRecommendedActions(
  snapshot: ConnectedWorkspaceCreationInputSnapshot,
  state: WorkspaceCreationState,
): string[] {
  const actions: string[] = [];
  if (state === 'WORKSPACE_CREATED') {
    actions.push('Maintain disposable workspace isolation before any build or runtime phase.');
  }
  if (state === 'WORKSPACE_CREATED_WITH_WARNINGS') {
    actions.push('Resolve creation warnings before proceeding to change set or build phases.');
  }
  if (state === 'WORKSPACE_CREATION_FAILED') {
    actions.push('Review instantiator safety checks and retry bounded workspace creation.');
  }
  if (state === 'WORKSPACE_CREATION_BLOCKED') {
    actions.push('Clear upstream governance or creator blockers before workspace creation.');
  }
  if (state === 'INSUFFICIENT_EVIDENCE') {
    actions.push('Restore missing upstream authority outputs before workspace creation.');
  }
  actions.push(...snapshot.instantiatorAssessment.blockingReasons.slice(0, 2));
  actions.push(...snapshot.creatorAssessment.warningReasons.slice(0, 2));
  return dedupeStrings(actions).slice(0, MAX_RECOMMENDED_ACTIONS);
}

export function assessConnectedWorkspaceCreation(
  input: AssessConnectedWorkspaceCreationInput = {},
): ConnectedWorkspaceCreationAssessment {
  const projectRootDir = input.rootDir ?? process.cwd();
  const instantiatorAssessment = resolveInstantiatorAssessment(input);
  const connectedBuildExecutionAssessment = resolveConnectedBuildExecution(input);
  const founderAcceptanceAssessment = resolveFounderAcceptance(input);
  const inputSnapshot = buildInputSnapshot(
    instantiatorAssessment,
    connectedBuildExecutionAssessment,
    founderAcceptanceAssessment,
    input.executionProofAssessment,
  );

  const operation = instantiatorAssessment.instantiationOperation;
  const plan = inputSnapshot.creatorAssessment.creationPlan;
  const workspaceId = operation?.workspaceId ?? plan?.workspaceId ?? 'unknown';
  const logicalRoot = operation?.plannedRoot ?? resolveLogicalDisposableRoot(workspaceId);

  const eligibleForRealCreation =
    input.performRealCreation === true &&
    (instantiatorAssessment.resultState === 'INSTANTIATION_READY' ||
      instantiatorAssessment.resultState === 'INSTANTIATION_SIMULATED') &&
    operation !== null &&
    founderAcceptanceAssessment !== null &&
    (founderAcceptanceAssessment.acceptanceState === 'ACCEPTED' ||
      founderAcceptanceAssessment.acceptanceState === 'ACCEPTED_WITH_WARNINGS') &&
    !inputSnapshot.missingAuthorities.includes('founder-acceptance-gate') &&
    !inputSnapshot.missingAuthorities.includes('world2-disposable-workspace-instantiator');

  const creationMode = eligibleForRealCreation ? 'REAL_CREATION' : 'DRY_RUN';

  const executionResult = executeWorkspaceCreation({
    projectRootDir,
    workspaceId,
    logicalRoot,
    directoriesToCreate: operation?.directoriesToCreate ?? plan?.plannedDirectories ?? [],
    artifactsToCreate: buildArtifactsToCreate(inputSnapshot, workspaceId),
    creationMode: eligibleForRealCreation ? 'REAL_CREATION' : creationMode === 'DRY_RUN' ? 'DRY_RUN' : 'BLOCKED',
  });

  let creationContract: WorkspaceCreationContract | null = null;

  if (executionResult.realFileMutationPerformed || executionResult.filesystemEvidence.workspaceRootExists) {
    creationContract = {
      readOnly: true,
      workspaceId,
      workspaceRoot: executionResult.workspaceRoot,
      logicalRoot: executionResult.logicalRoot,
      creationTimestamp: new Date().toISOString(),
      creationMode: eligibleForRealCreation ? 'REAL_CREATION' : 'DRY_RUN',
      createdDirectories: executionResult.createdDirectories,
      createdArtifacts: executionResult.createdArtifacts,
      creationWarnings: executionResult.creationWarnings,
      creationEvidence: executionResult.creationEvidence,
      filesystemEvidence: executionResult.filesystemEvidence,
      realFileMutationPerformed: executionResult.realFileMutationPerformed,
      world1Protected: true,
      disposableOnly: true,
    };
  }

  const questionAnswers = deriveWorkspaceCreationQuestionAnswers(inputSnapshot, creationContract);
  const workspaceCreationScore = deriveWorkspaceCreationScore(questionAnswers);
  const hasWarnings =
    executionResult.creationWarnings.length > 0 ||
    inputSnapshot.instantiatorAssessment.warningReasons.length > 0;
  const workspaceState = deriveWorkspaceCreationState(
    inputSnapshot,
    questionAnswers,
    executionResult.success,
    hasWarnings,
  );
  const creationId = nextCreationId();

  const blockingStages: string[] = [];
  const warningStages: string[] = [];
  if (workspaceState === 'WORKSPACE_CREATION_BLOCKED') blockingStages.push('INSTANTIATOR');
  if (workspaceState === 'WORKSPACE_CREATED_WITH_WARNINGS') warningStages.push('CREATION');

  const blockingReasons = dedupeStrings([
    ...inputSnapshot.instantiatorAssessment.blockingReasons,
    ...executionResult.blockingReasons,
    ...inputSnapshot.missingAuthorities.map((a) => `Missing authority: ${a}`),
  ]).slice(0, MAX_CREATION_BLOCKERS);

  const warningReasons = dedupeStrings([
    ...inputSnapshot.instantiatorAssessment.warningReasons,
    ...executionResult.creationWarnings,
  ]);

  const report: ConnectedWorkspaceCreationReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: CONNECTED_WORKSPACE_CREATION_CORE_QUESTION,
    creationId,
    generatedAt: new Date().toISOString(),
    workspaceCreationScore,
    workspaceState,
    creationContract,
    blockingStages,
    warningStages,
    recommendedNextActions: buildRecommendedActions(inputSnapshot, workspaceState),
    questionAnswers,
    inputSnapshot,
    blockingReasons,
    warningReasons,
    cacheKey: stableCacheKey(creationId, workspaceState, workspaceCreationScore),
  };

  const assessment: ConnectedWorkspaceCreationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: executionResult.success ? 'WORKSPACE_CREATION_COMPLETE' : 'WORKSPACE_CREATION_FAILED',
    report,
  };

  recordConnectedWorkspaceCreationAssessment(assessment);
  return assessment;
}

export function buildConnectedWorkspaceCreationArtifacts(
  input: AssessConnectedWorkspaceCreationInput = {},
): ConnectedWorkspaceCreationArtifacts {
  const connectedWorkspaceCreationAssessment = assessConnectedWorkspaceCreation(input);
  return {
    connectedWorkspaceCreationAssessment,
    connectedWorkspaceCreationReportMarkdown: buildConnectedWorkspaceCreationReportMarkdown(
      connectedWorkspaceCreationAssessment.report,
    ),
  };
}

export function resetConnectedWorkspaceCreationModuleForTests(): void {
  resetConnectedWorkspaceCreationHistoryForTests();
  resetConnectedWorkspaceCreationCounterForTests();
  resetWorkspaceCreationExecutorForTests();
  resetWorld2DisposableWorkspaceInstantiatorModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
}
