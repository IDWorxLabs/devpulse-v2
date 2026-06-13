/**
 * World 2 Change Set Materializer — change materialization operation authority.
 * Models change materialization only — never creates, modifies, or deletes real files.
 */

import { createHash } from 'node:crypto';
import type { World2ChangeOperation } from '../world2-change-set-authority/world2-change-set-types.js';
import {
  assessWorld2RepositorySnapshotMaterializer,
  resetWorld2RepositorySnapshotMaterializerModuleForTests,
} from '../world2-repository-snapshot-materializer/index.js';
import {
  DEFAULT_CHANGE_MATERIALIZATION_MODE,
  MAX_CHANGE_MATERIALIZER_REASONS,
  MAX_PLANNED_OPERATIONS,
  MAX_UNBOUNDED_DELETE_THRESHOLD,
  WORLD2_CHANGE_MATERIALIZATION_POSTCONDITIONS,
  WORLD2_CHANGE_MATERIALIZER_CACHE_KEY_PREFIX,
  WORLD2_CHANGE_MATERIALIZER_CORE_QUESTION,
  WORLD2_CHANGE_SET_MATERIALIZER_OWNER_MODULE,
  WORLD2_CHANGE_SET_MATERIALIZER_PASS_TOKEN,
  WORLD2_CHANGE_SET_MATERIALIZER_PHASE,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  isDeleteOperationType,
  isDisposableOnlyTargetRoot,
  isMutatingOperationType,
  pathMatchesPatterns,
  resolveTargetWorkspaceRoot,
} from './world2-change-set-materializer-registry.js';
import {
  recordWorld2ChangeSetMaterializerAssessment,
  resetWorld2ChangeSetMaterializerHistoryForTests,
} from './world2-change-set-materializer-history.js';
import { buildWorld2ChangeSetMaterializerReportMarkdown } from './world2-change-set-materializer-report-builder.js';
import type {
  AssessWorld2ChangeSetMaterializerInput,
  ChangeMaterializationModeContext,
  World2ChangeDryRunMaterializationResult,
  World2ChangeMaterializationMode,
  World2ChangeMaterializationOperation,
  World2ChangeMaterializationOverride,
  World2ChangeMaterializationSafetyCheck,
  World2ChangeMaterializationState,
  World2ChangeRollbackMapEntry,
  World2ChangeSetMaterializerAssessment,
  World2ChangeSetMaterializerInputSnapshot,
  World2ChangeSetMaterializerReport,
  World2PlannedChangeOperations,
} from './world2-change-set-materializer-types.js';

let materializerCounter = 0;
let operationCounter = 0;
let resultCounter = 0;

export function resetWorld2ChangeSetMaterializerCounterForTests(): void {
  materializerCounter = 0;
  operationCounter = 0;
  resultCounter = 0;
}

function nextMaterializerAssessmentId(): string {
  materializerCounter += 1;
  return `world2-change-materializer-assessment-${materializerCounter}`;
}

function nextOperationId(): string {
  operationCounter += 1;
  return `world2-change-materialization-operation-${operationCounter}`;
}

function nextDryRunResultId(): string {
  resultCounter += 1;
  return `world2-change-dry-run-materialization-${resultCounter}`;
}

function stableCacheKey(
  materializerAssessmentId: string,
  state: World2ChangeMaterializationState,
): string {
  const digest = createHash('sha256')
    .update([WORLD2_CHANGE_SET_MATERIALIZER_OWNER_MODULE, materializerAssessmentId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_CHANGE_MATERIALIZER_CACHE_KEY_PREFIX}:${digest}`;
}

function dedupe(items: string[]): string[] {
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

function resolveInputSnapshot(
  input: AssessWorld2ChangeSetMaterializerInput,
): World2ChangeSetMaterializerInputSnapshot {
  const snapshotMaterializerAssessment =
    input.snapshotMaterializerAssessment ??
    assessWorld2RepositorySnapshotMaterializer(
      input as import('../world2-repository-snapshot-materializer/world2-repository-snapshot-materializer-types.js').AssessWorld2RepositorySnapshotMaterializerInput,
    );

  const creator =
    snapshotMaterializerAssessment.inputSnapshot.instantiatorAssessment.inputSnapshot
      .creatorAssessment;
  const materializationAssessment = creator.inputSnapshot.materializationAssessment;
  const changeSetAssessment =
    materializationAssessment.inputSnapshot.populationAssessment.inputSnapshot.changeSetAssessment;
  const instantiatorAssessment = snapshotMaterializerAssessment.inputSnapshot.instantiatorAssessment;

  const missingAuthorities: string[] = dedupe([
    ...snapshotMaterializerAssessment.inputSnapshot.missingAuthorities,
    ...changeSetAssessment.inputSnapshot.missingAuthorities,
    ...(changeSetAssessment.changeSet === null &&
    (changeSetAssessment.eligibilityState === 'READY' ||
      changeSetAssessment.eligibilityState === 'READY_WITH_WARNINGS')
      ? ['world2-change-set']
      : []),
  ]);

  return {
    changeSetAssessment,
    materializationAssessment,
    snapshotMaterializerAssessment,
    instantiatorAssessment,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

function resolveTargetRoot(snapshot: World2ChangeSetMaterializerInputSnapshot): string {
  const operation =
    snapshot.snapshotMaterializerAssessment.materializationOperation?.targetWorkspaceRoot;
  const instantiatorOp = snapshot.instantiatorAssessment.instantiationOperation?.plannedRoot;
  const workspaceId = snapshot.changeSetAssessment.changeSet?.workspaceId ?? 'unknown';
  return operation ?? instantiatorOp ?? resolveTargetWorkspaceRoot(workspaceId);
}

export function mapChangeOperationsToPlannedFields(
  operations: readonly World2ChangeOperation[],
): World2PlannedChangeOperations {
  const planned: World2PlannedChangeOperations = {
    plannedFileCreates: [],
    plannedFileModifies: [],
    plannedFileDeletes: [],
    plannedDirectoryCreates: [],
    plannedDirectoryDeletes: [],
    plannedMoves: [],
    skippedOperations: [],
  };

  for (const op of operations.slice(0, MAX_PLANNED_OPERATIONS)) {
    if (!op.allowed || op.operationType === 'NO_CHANGE') {
      if (op.operationType !== 'NO_CHANGE' || !op.allowed) {
        planned.skippedOperations.push(`${op.operationType}:${op.targetPath}`);
      }
      continue;
    }

    switch (op.operationType) {
      case 'CREATE_FILE':
        planned.plannedFileCreates.push(op.targetPath);
        break;
      case 'MODIFY_FILE':
        planned.plannedFileModifies.push(op.targetPath);
        break;
      case 'DELETE_FILE':
        planned.plannedFileDeletes.push(op.targetPath);
        break;
      case 'CREATE_DIRECTORY':
        planned.plannedDirectoryCreates.push(op.targetPath);
        break;
      case 'DELETE_DIRECTORY':
        planned.plannedDirectoryDeletes.push(op.targetPath);
        break;
      case 'MOVE_FILE':
        planned.plannedMoves.push(op.targetPath);
        break;
      default:
        planned.skippedOperations.push(`${op.operationType}:${op.targetPath}`);
        break;
    }
  }

  return planned;
}

function buildRollbackMap(
  operations: readonly World2ChangeOperation[],
  rollbackRequirements: readonly string[],
): World2ChangeRollbackMapEntry[] {
  const rollbackAction =
    rollbackRequirements[0] ?? 'Revert mutating operation and restore disposable workspace baseline';
  const mutating = operations.filter((op) => op.allowed && isMutatingOperationType(op.operationType));

  return mutating.slice(0, MAX_PLANNED_OPERATIONS).map((op) => ({
    readOnly: true,
    operationId: op.operationId,
    targetPath: op.targetPath,
    rollbackAction,
  }));
}

function assessRollbackMapComplete(
  operations: readonly World2ChangeOperation[],
  rollbackMap: readonly World2ChangeRollbackMapEntry[],
): boolean {
  const mutating = operations.filter((op) => op.allowed && isMutatingOperationType(op.operationType));
  if (mutating.length === 0) {
    return true;
  }
  return mutating.every((op) => rollbackMap.some((entry) => entry.operationId === op.operationId));
}

function assessVerificationComplete(operations: readonly World2ChangeOperation[]): boolean {
  const mutating = operations.filter((op) => op.allowed && isMutatingOperationType(op.operationType));
  if (mutating.length === 0) {
    return true;
  }
  return mutating.every((op) => op.requiresVerification);
}

export function performWorld2ChangeMaterializationSafetyChecks(
  snapshot: World2ChangeSetMaterializerInputSnapshot,
): World2ChangeMaterializationSafetyCheck[] {
  const changeSet = snapshot.changeSetAssessment.changeSet;
  const operations = changeSet?.operations ?? [];
  const targetRoot = resolveTargetRoot(snapshot);

  const changeSetStateEligible =
    snapshot.changeSetAssessment.eligibilityState === 'READY' ||
    snapshot.changeSetAssessment.eligibilityState === 'READY_WITH_WARNINGS';

  const materializationStateEligible =
    snapshot.materializationAssessment.materializationState === 'READY' ||
    snapshot.materializationAssessment.materializationState === 'READY_WITH_WARNINGS';

  const snapshotMaterializerNotBlocked =
    snapshot.snapshotMaterializerAssessment.materializationState === 'MATERIALIZATION_READY' ||
    snapshot.snapshotMaterializerAssessment.materializationState === 'MATERIALIZATION_SIMULATED';

  const instantiatorNotBlocked =
    snapshot.instantiatorAssessment.resultState !== 'INSTANTIATION_BLOCKED';

  const operationPaths = operations.map((op) => op.targetPath);
  const livePathDetected = operationPaths.some((p) => pathMatchesPatterns(p, WORLD2_LIVE_PATH_PATTERNS));
  const productionPathDetected = operationPaths.some((p) =>
    pathMatchesPatterns(p, WORLD2_PRODUCTION_PATH_PATTERNS),
  );
  const deleteCount = operations.filter(
    (op) => op.allowed && isDeleteOperationType(op.operationType),
  ).length;
  const unboundedDelete = deleteCount > MAX_UNBOUNDED_DELETE_THRESHOLD;

  const rollbackMap = buildRollbackMap(operations, changeSet?.rollbackRequirements ?? []);
  const rollbackMapComplete = assessRollbackMapComplete(operations, rollbackMap);
  const verificationComplete = assessVerificationComplete(operations);

  return [
    {
      readOnly: true,
      checkId: 'change-set-state-eligible',
      label: 'Change set state is READY or READY_WITH_WARNINGS',
      passed: changeSetStateEligible,
      detail: changeSetStateEligible
        ? `Change set state ${snapshot.changeSetAssessment.eligibilityState}.`
        : `Change set state ${snapshot.changeSetAssessment.eligibilityState} not eligible.`,
    },
    {
      readOnly: true,
      checkId: 'workspace-materialization-eligible',
      label: 'Workspace materialization is READY or READY_WITH_WARNINGS',
      passed: materializationStateEligible,
      detail: materializationStateEligible
        ? `Materialization state ${snapshot.materializationAssessment.materializationState}.`
        : `Materialization state ${snapshot.materializationAssessment.materializationState} not eligible.`,
    },
    {
      readOnly: true,
      checkId: 'snapshot-materializer-not-blocked',
      label: 'Snapshot materializer not blocked',
      passed: snapshotMaterializerNotBlocked,
      detail: snapshotMaterializerNotBlocked
        ? `Snapshot materializer state ${snapshot.snapshotMaterializerAssessment.materializationState}.`
        : 'Snapshot materializer blocked.',
    },
    {
      readOnly: true,
      checkId: 'instantiator-not-blocked',
      label: 'Instantiator not blocked',
      passed: instantiatorNotBlocked,
      detail: instantiatorNotBlocked
        ? `Instantiator state ${snapshot.instantiatorAssessment.resultState}.`
        : 'Instantiator blocked.',
    },
    {
      readOnly: true,
      checkId: 'target-root-disposable-only',
      label: 'Target workspace root is disposable-only',
      passed: isDisposableOnlyTargetRoot(targetRoot),
      detail: isDisposableOnlyTargetRoot(targetRoot)
        ? `Target root ${targetRoot} is disposable-only.`
        : `Target root ${targetRoot} is not disposable-only.`,
    },
    {
      readOnly: true,
      checkId: 'no-live-workspace-path',
      label: 'No live workspace path in change operations',
      passed: !livePathDetected,
      detail: livePathDetected
        ? 'Live workspace path detected in change operations.'
        : 'No live workspace path in change operations.',
    },
    {
      readOnly: true,
      checkId: 'no-production-path',
      label: 'No production path in change operations',
      passed: !productionPathDetected,
      detail: productionPathDetected
        ? 'Production path detected in change operations.'
        : 'No production path in change operations.',
    },
    {
      readOnly: true,
      checkId: 'no-unbounded-delete',
      label: 'No unbounded delete',
      passed: !unboundedDelete,
      detail: unboundedDelete
        ? `Delete operation count ${deleteCount} exceeds threshold.`
        : 'Delete operations within bounded threshold.',
    },
    {
      readOnly: true,
      checkId: 'rollback-map-complete',
      label: 'Rollback map exists for every mutating operation',
      passed: rollbackMapComplete,
      detail: rollbackMapComplete
        ? 'Rollback map complete for mutating operations.'
        : 'Rollback map missing for one or more mutating operations.',
    },
    {
      readOnly: true,
      checkId: 'verification-requirements-complete',
      label: 'Verification requirement exists for every mutating operation',
      passed: verificationComplete,
      detail: verificationComplete
        ? 'Verification requirements present for mutating operations.'
        : 'Verification missing for one or more mutating operations.',
    },
  ];
}

export function deriveChangeMaterializationEligibilityMode(
  context: ChangeMaterializationModeContext,
): World2ChangeMaterializationMode {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'BLOCKED';
  }

  if (
    context.changeSetState === 'INSUFFICIENT_EVIDENCE' ||
    context.materializationState === 'INSUFFICIENT_EVIDENCE' ||
    context.snapshotMaterializerState === 'INSUFFICIENT_EVIDENCE' ||
    context.instantiatorResultState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'BLOCKED';
  }

  const blockedBySafety =
    context.changeSetState === 'BLOCKED' ||
    context.materializationState === 'BLOCKED' ||
    context.snapshotMaterializerState === 'MATERIALIZATION_BLOCKED' ||
    context.instantiatorResultState === 'INSTANTIATION_BLOCKED' ||
    !context.hasChangeSet ||
    !context.targetRootDisposableOnly ||
    context.livePathDetected ||
    context.productionPathDetected ||
    context.unboundedDelete ||
    !context.rollbackMapComplete ||
    !context.verificationComplete ||
    !context.safetyChecksPassed ||
    context.criticalSafetyFailures > 0;

  if (blockedBySafety) {
    return 'BLOCKED';
  }

  if (
    context.changeSetState === 'READY' &&
    context.materializationState === 'READY' &&
    context.snapshotMaterializerState === 'MATERIALIZATION_READY' &&
    context.safetyChecksPassed &&
    context.criticalSafetyFailures === 0
  ) {
    return 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE';
  }

  if (
    context.changeSetState === 'READY_WITH_WARNINGS' ||
    context.materializationState === 'READY_WITH_WARNINGS' ||
    context.snapshotMaterializerState === 'MATERIALIZATION_SIMULATED'
  ) {
    if (context.criticalSafetyFailures === 0) {
      return 'SIMULATED_CHANGE_MATERIALIZATION';
    }
  }

  if (
    context.changeSetState === 'READY' &&
    context.hasChangeSet &&
    context.criticalSafetyFailures === 0
  ) {
    return DEFAULT_CHANGE_MATERIALIZATION_MODE;
  }

  if (
    context.materializationState === 'NOT_READY' ||
    context.snapshotMaterializerState === 'NOT_READY' ||
    context.instantiatorResultState === 'NOT_READY' ||
    !context.hasChangeSet
  ) {
    return 'BLOCKED';
  }

  return DEFAULT_CHANGE_MATERIALIZATION_MODE;
}

function resolveMaterializationMode(
  eligibilityMode: World2ChangeMaterializationMode,
  override: World2ChangeMaterializationOverride | undefined,
): World2ChangeMaterializationMode {
  if (eligibilityMode === 'BLOCKED') {
    return 'BLOCKED';
  }

  if (!override) {
    return DEFAULT_CHANGE_MATERIALIZATION_MODE;
  }

  if (
    override === 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE' &&
    eligibilityMode === 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE'
  ) {
    return 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE';
  }

  if (
    override === 'SIMULATED_CHANGE_MATERIALIZATION' &&
    (eligibilityMode === 'SIMULATED_CHANGE_MATERIALIZATION' ||
      eligibilityMode === 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE')
  ) {
    return 'SIMULATED_CHANGE_MATERIALIZATION';
  }

  return DEFAULT_CHANGE_MATERIALIZATION_MODE;
}

export function deriveChangeMaterializationState(
  eligibilityMode: World2ChangeMaterializationMode,
  materializationMode: World2ChangeMaterializationMode,
  context: ChangeMaterializationModeContext,
): World2ChangeMaterializationState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.changeSetState === 'INSUFFICIENT_EVIDENCE' ||
    context.materializationState === 'INSUFFICIENT_EVIDENCE' ||
    context.snapshotMaterializerState === 'INSUFFICIENT_EVIDENCE' ||
    context.instantiatorResultState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    eligibilityMode === 'BLOCKED' ||
    materializationMode === 'BLOCKED' ||
    context.changeSetState === 'BLOCKED'
  ) {
    return 'CHANGE_MATERIALIZATION_BLOCKED';
  }

  if (
    context.materializationState === 'NOT_READY' ||
    context.snapshotMaterializerState === 'NOT_READY' ||
    context.instantiatorResultState === 'NOT_READY' ||
    !context.hasChangeSet
  ) {
    return 'NOT_READY';
  }

  if (
    materializationMode === 'SIMULATED_CHANGE_MATERIALIZATION' ||
    eligibilityMode === 'SIMULATED_CHANGE_MATERIALIZATION'
  ) {
    return 'CHANGE_MATERIALIZATION_SIMULATED';
  }

  if (
    materializationMode === 'DRY_RUN' ||
    materializationMode === 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE' ||
    eligibilityMode === 'REAL_CHANGE_MATERIALIZATION_ELIGIBLE'
  ) {
    return 'CHANGE_MATERIALIZATION_READY';
  }

  return 'CHANGE_MATERIALIZATION_BLOCKED';
}

function buildMaterializationOperation(
  snapshot: World2ChangeSetMaterializerInputSnapshot,
  eligibilityMode: World2ChangeMaterializationMode,
  materializationMode: World2ChangeMaterializationMode,
  materializationState: World2ChangeMaterializationState,
  safetyChecks: World2ChangeMaterializationSafetyCheck[],
): World2ChangeMaterializationOperation | null {
  const operationEligible =
    materializationState === 'CHANGE_MATERIALIZATION_READY' ||
    materializationState === 'CHANGE_MATERIALIZATION_SIMULATED';

  const changeSet = snapshot.changeSetAssessment.changeSet;
  if (!operationEligible || !changeSet) {
    return null;
  }

  const planned = mapChangeOperationsToPlannedFields(changeSet.operations);
  const rollbackMap = buildRollbackMap(changeSet.operations, changeSet.rollbackRequirements);
  const targetWorkspaceRoot = resolveTargetRoot(snapshot);

  return {
    readOnly: true,
    operationId: nextOperationId(),
    changeSetId: changeSet.changeSetId,
    workspaceId: changeSet.workspaceId,
    targetWorkspaceRoot,
    plannedFileCreates: planned.plannedFileCreates,
    plannedFileModifies: planned.plannedFileModifies,
    plannedFileDeletes: planned.plannedFileDeletes,
    plannedDirectoryCreates: planned.plannedDirectoryCreates,
    plannedDirectoryDeletes: planned.plannedDirectoryDeletes,
    plannedMoves: planned.plannedMoves,
    skippedOperations: planned.skippedOperations,
    rollbackMap,
    safetyChecks,
    postconditions: [...WORLD2_CHANGE_MATERIALIZATION_POSTCONDITIONS],
    mode: materializationMode,
    materializationState,
    eligibilityMode,
    realFileMutationPerformed: false,
  };
}

function buildDryRunMaterializationResult(
  operation: World2ChangeMaterializationOperation | null,
): World2ChangeDryRunMaterializationResult | null {
  if (!operation) {
    return null;
  }

  return {
    readOnly: true,
    resultId: nextDryRunResultId(),
    operationId: operation.operationId,
    mode: operation.mode,
    simulatedCreateCount: operation.plannedFileCreates.length,
    simulatedModifyCount: operation.plannedFileModifies.length,
    simulatedDeleteCount:
      operation.plannedFileDeletes.length + operation.plannedDirectoryDeletes.length,
    simulatedMoveCount: operation.plannedMoves.length,
    realFileMutationPerformed: false,
    completedAt: new Date().toISOString(),
  };
}

function buildMaterializerReasons(
  snapshot: World2ChangeSetMaterializerInputSnapshot,
  materializationState: World2ChangeMaterializationState,
  safetyChecks: World2ChangeMaterializationSafetyCheck[],
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...snapshot.changeSetAssessment.blockingReasons);
  warningReasons.push(...snapshot.changeSetAssessment.warningReasons);
  warningReasons.push(...snapshot.materializationAssessment.warningReasons);
  warningReasons.push(...snapshot.snapshotMaterializerAssessment.warningReasons);
  warningReasons.push(...snapshot.instantiatorAssessment.warningReasons);

  for (const check of safetyChecks) {
    if (!check.passed) {
      blockingReasons.push(`${check.label}: ${check.detail}`);
    }
  }

  if (materializationState === 'CHANGE_MATERIALIZATION_BLOCKED') {
    blockingReasons.push(
      'Change materialization BLOCKED — change set is not write permission.',
    );
  }

  if (materializationState === 'CHANGE_MATERIALIZATION_SIMULATED') {
    warningReasons.push('Change materialization simulated only — no real file mutation performed.');
  }

  if (materializationState === 'CHANGE_MATERIALIZATION_READY') {
    warningReasons.push('Default dry-run mode — no real file mutation performed.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_CHANGE_MATERIALIZER_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_CHANGE_MATERIALIZER_REASONS),
  };
}

export function assessWorld2ChangeSetMaterializer(
  input: AssessWorld2ChangeSetMaterializerInput = {},
): World2ChangeSetMaterializerAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const changeSet = inputSnapshot.changeSetAssessment.changeSet;
  const operations = changeSet?.operations ?? [];
  const targetRoot = resolveTargetRoot(inputSnapshot);

  const safetyChecks = performWorld2ChangeMaterializationSafetyChecks(inputSnapshot);
  const safetyChecksPassed = safetyChecks.every((check) => check.passed);
  const criticalSafetyFailures = safetyChecks.filter((check) => !check.passed).length;

  const rollbackMap = buildRollbackMap(operations, changeSet?.rollbackRequirements ?? []);

  const modeContext: ChangeMaterializationModeContext = {
    missingAuthorities: inputSnapshot.missingAuthorities,
    changeSetState: inputSnapshot.changeSetAssessment.eligibilityState,
    materializationState: inputSnapshot.materializationAssessment.materializationState,
    snapshotMaterializerState: inputSnapshot.snapshotMaterializerAssessment.materializationState,
    instantiatorResultState: inputSnapshot.instantiatorAssessment.resultState,
    safetyChecksPassed,
    criticalSafetyFailures,
    hasChangeSet: changeSet !== null,
    targetRootDisposableOnly: isDisposableOnlyTargetRoot(targetRoot),
    livePathDetected: operations.some((op) => pathMatchesPatterns(op.targetPath, WORLD2_LIVE_PATH_PATTERNS)),
    productionPathDetected: operations.some((op) =>
      pathMatchesPatterns(op.targetPath, WORLD2_PRODUCTION_PATH_PATTERNS),
    ),
    unboundedDelete:
      operations.filter((op) => op.allowed && isDeleteOperationType(op.operationType)).length >
      MAX_UNBOUNDED_DELETE_THRESHOLD,
    rollbackMapComplete: assessRollbackMapComplete(operations, rollbackMap),
    verificationComplete: assessVerificationComplete(operations),
  };

  const eligibilityMode = deriveChangeMaterializationEligibilityMode(modeContext);
  const materializationMode = resolveMaterializationMode(
    eligibilityMode,
    input.materializationModeOverride,
  );
  const materializationState = deriveChangeMaterializationState(
    eligibilityMode,
    materializationMode,
    modeContext,
  );
  const reasons = buildMaterializerReasons(inputSnapshot, materializationState, safetyChecks);
  const materializerAssessmentId = nextMaterializerAssessmentId();

  const materializationOperation = buildMaterializationOperation(
    inputSnapshot,
    eligibilityMode,
    materializationMode,
    materializationState,
    safetyChecks,
  );

  const assessment: World2ChangeSetMaterializerAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_CHANGE_MATERIALIZER_CORE_QUESTION,
    materializerAssessmentId,
    workspaceId: changeSet?.workspaceId ?? inputSnapshot.snapshotMaterializerAssessment.workspaceId,
    materializationState,
    inputSnapshot,
    materializationOperation,
    dryRunMaterializationResult: buildDryRunMaterializationResult(materializationOperation),
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    cacheKey: stableCacheKey(materializerAssessmentId, materializationState),
  };

  recordWorld2ChangeSetMaterializerAssessment(assessment);
  return assessment;
}

export function buildWorld2ChangeSetMaterializerReport(
  assessment: World2ChangeSetMaterializerAssessment,
  generatedAt = new Date().toISOString(),
): World2ChangeSetMaterializerReport {
  return {
    generatedAt,
    phaseName: WORLD2_CHANGE_SET_MATERIALIZER_PHASE,
    purpose:
      'Convert approved World 2 change sets into bounded materialization operations — no real file mutations.',
    assessment,
    passToken: WORLD2_CHANGE_SET_MATERIALIZER_PASS_TOKEN,
  };
}

export function buildWorld2ChangeSetMaterializerArtifacts(
  input: AssessWorld2ChangeSetMaterializerInput = {},
): {
  world2ChangeSetMaterializerAssessment: World2ChangeSetMaterializerAssessment;
  world2ChangeSetMaterializerReportMarkdown: string;
} {
  const world2ChangeSetMaterializerAssessment = assessWorld2ChangeSetMaterializer(input);
  const report = buildWorld2ChangeSetMaterializerReport(world2ChangeSetMaterializerAssessment);
  return {
    world2ChangeSetMaterializerAssessment,
    world2ChangeSetMaterializerReportMarkdown:
      buildWorld2ChangeSetMaterializerReportMarkdown(report),
  };
}

export function resetWorld2ChangeSetMaterializerModuleForTests(): void {
  resetWorld2ChangeSetMaterializerHistoryForTests();
  resetWorld2ChangeSetMaterializerCounterForTests();
  resetWorld2RepositorySnapshotMaterializerModuleForTests();
}
