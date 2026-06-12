/**
 * World 2 Dry-Run Execution Composer — composed dry-run execution package authority.
 * Combines snapshot and change materialization into one ordered package — never executes or mutates files.
 */

import { createHash } from 'node:crypto';
import {
  assessWorld2ChangeSetMaterializer,
  resetWorld2ChangeSetMaterializerModuleForTests,
} from '../world2-change-set-materializer/index.js';
import {
  assessWorld2ControlledExecutionRuntime,
  resetWorld2ControlledExecutionRuntimeModuleForTests,
} from '../world2-controlled-execution-runtime/index.js';
import {
  assessWorld2ExecutionEngine,
  resetWorld2ExecutionEngineModuleForTests,
} from '../world2-execution-engine/index.js';
import {
  MAX_AUDIT_TRAIL_ENTRIES,
  MAX_DRY_RUN_COMPOSER_REASONS,
  MAX_ROLLBACK_STEPS,
  MAX_VALIDATION_STEPS,
  WORLD2_DRY_RUN_COMPOSER_CACHE_KEY_PREFIX,
  WORLD2_DRY_RUN_COMPOSER_CORE_QUESTION,
  WORLD2_DRY_RUN_EXECUTION_COMPOSER_OWNER_MODULE,
  WORLD2_DRY_RUN_EXECUTION_COMPOSER_PASS_TOKEN,
  WORLD2_DRY_RUN_EXECUTION_COMPOSER_PHASE,
  WORLD2_DRY_RUN_ORDERED_STEP_DEFINITIONS,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  isDisposableOnlyTargetRoot,
  pathMatchesPatterns,
} from './world2-dry-run-execution-composer-registry.js';
import {
  recordWorld2DryRunExecutionComposerAssessment,
  resetWorld2DryRunExecutionComposerHistoryForTests,
} from './world2-dry-run-execution-composer-history.js';
import { buildWorld2DryRunExecutionComposerReportMarkdown } from './world2-dry-run-execution-composer-report-builder.js';
import type {
  AssessWorld2DryRunExecutionComposerInput,
  DryRunPackageStateContext,
  World2DryRunExecutionAuditEntry,
  World2DryRunExecutionComposerAssessment,
  World2DryRunExecutionComposerInputSnapshot,
  World2DryRunExecutionComposerReport,
  World2DryRunExecutionPackage,
  World2DryRunExecutionSafetyCheck,
  World2DryRunOrderedStep,
  World2DryRunPackageState,
  World2DryRunRollbackStep,
  World2DryRunValidationStep,
} from './world2-dry-run-execution-composer-types.js';

let composerCounter = 0;
let packageCounter = 0;
let auditCounter = 0;
let validationCounter = 0;
let rollbackCounter = 0;

export function resetWorld2DryRunExecutionComposerCounterForTests(): void {
  composerCounter = 0;
  packageCounter = 0;
  auditCounter = 0;
  validationCounter = 0;
  rollbackCounter = 0;
}

function nextComposerAssessmentId(): string {
  composerCounter += 1;
  return `world2-dry-run-composer-assessment-${composerCounter}`;
}

function nextPackageId(): string {
  packageCounter += 1;
  return `world2-dry-run-execution-package-${packageCounter}`;
}

function nextAuditId(): string {
  auditCounter += 1;
  return `world2-dry-run-audit-${auditCounter}`;
}

function nextValidationId(): string {
  validationCounter += 1;
  return `world2-dry-run-validation-${validationCounter}`;
}

function nextRollbackId(): string {
  rollbackCounter += 1;
  return `world2-dry-run-rollback-${rollbackCounter}`;
}

function stableCacheKey(composerAssessmentId: string, state: World2DryRunPackageState): string {
  const digest = createHash('sha256')
    .update([WORLD2_DRY_RUN_EXECUTION_COMPOSER_OWNER_MODULE, composerAssessmentId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_DRY_RUN_COMPOSER_CACHE_KEY_PREFIX}:${digest}`;
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
  input: AssessWorld2DryRunExecutionComposerInput,
): World2DryRunExecutionComposerInputSnapshot {
  const changeSetMaterializerAssessment =
    input.changeSetMaterializerAssessment ?? assessWorld2ChangeSetMaterializer(input);

  const engineAssessment =
    input.engineAssessment ??
    changeSetMaterializerAssessment.inputSnapshot.changeSetAssessment.inputSnapshot.engineAssessment ??
    assessWorld2ExecutionEngine(input);

  const runtimeAssessment =
    input.runtimeAssessment ??
    engineAssessment.inputSnapshot.runtimeAssessment ??
    assessWorld2ControlledExecutionRuntime(input);

  const snapshotMaterializerAssessment =
    changeSetMaterializerAssessment.inputSnapshot.snapshotMaterializerAssessment;

  const missingAuthorities: string[] = dedupe([
    ...changeSetMaterializerAssessment.inputSnapshot.missingAuthorities,
    ...engineAssessment.inputSnapshot.missingAuthorities,
    ...runtimeAssessment.inputSnapshot.missingAuthorities,
  ]);

  return {
    snapshotMaterializerAssessment,
    changeSetMaterializerAssessment,
    engineAssessment,
    runtimeAssessment,
    missingAuthorities,
  };
}

function resolveWorkspaceId(snapshot: World2DryRunExecutionComposerInputSnapshot): string {
  return (
    snapshot.changeSetMaterializerAssessment.workspaceId ??
    snapshot.snapshotMaterializerAssessment.workspaceId ??
    snapshot.runtimeAssessment.workspaceId ??
    'unknown'
  );
}

function resolveTargetRoots(snapshot: World2DryRunExecutionComposerInputSnapshot): string[] {
  const roots: string[] = [];
  const snapshotOp = snapshot.snapshotMaterializerAssessment.materializationOperation;
  const changeOp = snapshot.changeSetMaterializerAssessment.materializationOperation;
  const instantiatorOp =
    snapshot.snapshotMaterializerAssessment.inputSnapshot.instantiatorAssessment
      .instantiationOperation?.plannedRoot;

  if (snapshotOp?.targetWorkspaceRoot) {
    roots.push(snapshotOp.targetWorkspaceRoot);
  }
  if (changeOp?.targetWorkspaceRoot) {
    roots.push(changeOp.targetWorkspaceRoot);
  }
  if (instantiatorOp) {
    roots.push(instantiatorOp);
  }

  return dedupe(roots);
}

function detectForbiddenPaths(snapshot: World2DryRunExecutionComposerInputSnapshot): boolean {
  const roots = resolveTargetRoots(snapshot);
  const changeOps =
    snapshot.changeSetMaterializerAssessment.inputSnapshot.changeSetAssessment.changeSet
      ?.operations ?? [];

  const paths = [
    ...roots,
    ...changeOps.map((op) => op.targetPath),
    ...(snapshot.snapshotMaterializerAssessment.materializationOperation?.includedPaths ?? []),
  ];

  return paths.some(
    (path) =>
      pathMatchesPatterns(path, WORLD2_LIVE_PATH_PATTERNS) ||
      pathMatchesPatterns(path, WORLD2_PRODUCTION_PATH_PATTERNS) ||
      (path.includes('/') && !isDisposableOnlyTargetRoot(path) && roots.includes(path)),
  );
}

function detectRealExecution(snapshot: World2DryRunExecutionComposerInputSnapshot): boolean {
  const snapshotOp = snapshot.snapshotMaterializerAssessment.materializationOperation;
  const changeOp = snapshot.changeSetMaterializerAssessment.materializationOperation;

  if (snapshotOp?.repositoryCopyPerformed === true) {
    return true;
  }
  if (changeOp?.realFileMutationPerformed === true) {
    return true;
  }

  return false;
}

function isUpstreamBlocked(snapshot: World2DryRunExecutionComposerInputSnapshot): boolean {
  return (
    snapshot.snapshotMaterializerAssessment.materializationState === 'MATERIALIZATION_BLOCKED' ||
    snapshot.changeSetMaterializerAssessment.materializationState ===
      'CHANGE_MATERIALIZATION_BLOCKED' ||
    snapshot.runtimeAssessment.executionState === 'BLOCKED' ||
    snapshot.engineAssessment.finalState === 'BLOCKED'
  );
}

export function buildWorld2DryRunOrderedSteps(): World2DryRunOrderedStep[] {
  return WORLD2_DRY_RUN_ORDERED_STEP_DEFINITIONS.map((def) => ({
    readOnly: true,
    stepId: def.stepId,
    order: def.order,
    label: def.label,
    description: def.description,
    sourceAuthority: def.sourceAuthority,
    dryRunOnly: true,
    realExecutionPerformed: false,
  }));
}

export function buildWorld2DryRunValidationSteps(
  snapshot: World2DryRunExecutionComposerInputSnapshot,
): World2DryRunValidationStep[] {
  const steps: World2DryRunValidationStep[] = [];
  const plan = snapshot.runtimeAssessment.inputSnapshot.plan;
  const contract = snapshot.runtimeAssessment.executionContract;
  const changeSet =
    snapshot.changeSetMaterializerAssessment.inputSnapshot.changeSetAssessment.changeSet;

  if (plan) {
    steps.push({
      readOnly: true,
      validationId: nextValidationId(),
      requirement: plan.verificationPlan.validationStrategy,
      source: 'execution-plan',
      mandatory: true,
    });
    steps.push({
      readOnly: true,
      validationId: nextValidationId(),
      requirement: plan.verificationPlan.executionProofStrategy,
      source: 'execution-plan',
      mandatory: true,
    });
    steps.push({
      readOnly: true,
      validationId: nextValidationId(),
      requirement: plan.verificationPlan.founderTestStrategy,
      source: 'execution-plan',
      mandatory: false,
    });
    steps.push({
      readOnly: true,
      validationId: nextValidationId(),
      requirement: plan.verificationPlan.acceptanceStrategy,
      source: 'execution-plan',
      mandatory: false,
    });
  }

  if (contract) {
    for (const req of contract.verificationRequirements.slice(0, 4)) {
      steps.push({
        readOnly: true,
        validationId: nextValidationId(),
        requirement: req,
        source: 'world2-execution-contract',
        mandatory: true,
      });
    }
  }

  if (changeSet) {
    for (const req of changeSet.verificationRequirements.slice(0, 4)) {
      steps.push({
        readOnly: true,
        validationId: nextValidationId(),
        requirement: req,
        source: 'world2-change-set',
        mandatory: true,
      });
    }
  }

  for (const req of snapshot.engineAssessment.nextRequiredValidation.slice(0, 4)) {
    steps.push({
      readOnly: true,
      validationId: nextValidationId(),
      requirement: req,
      source: 'world2-execution-engine',
      mandatory: false,
    });
  }

  return steps.slice(0, MAX_VALIDATION_STEPS);
}

export function buildWorld2DryRunRollbackSteps(
  snapshot: World2DryRunExecutionComposerInputSnapshot,
): World2DryRunRollbackStep[] {
  const steps: World2DryRunRollbackStep[] = [];
  const plan = snapshot.runtimeAssessment.inputSnapshot.plan;
  const contract = snapshot.runtimeAssessment.executionContract;
  const changeOp = snapshot.changeSetMaterializerAssessment.materializationOperation;

  if (plan?.rollbackPlan) {
    steps.push({
      readOnly: true,
      rollbackId: nextRollbackId(),
      targetScope: plan.rollbackPlan.rollbackTrigger,
      rollbackAction: plan.rollbackPlan.rollbackMethod,
      source: 'execution-plan',
    });
    steps.push({
      readOnly: true,
      rollbackId: nextRollbackId(),
      targetScope: 'disposable-workspace',
      rollbackAction: plan.rollbackPlan.rollbackSuccessCriteria,
      source: 'execution-plan',
    });
  }

  if (contract) {
    for (const req of contract.rollbackRequirements.slice(0, 3)) {
      steps.push({
        readOnly: true,
        rollbackId: nextRollbackId(),
        targetScope: 'world2-execution-contract',
        rollbackAction: req,
        source: 'world2-execution-contract',
      });
    }
  }

  if (changeOp) {
    for (const entry of changeOp.rollbackMap.slice(0, 4)) {
      steps.push({
        readOnly: true,
        rollbackId: nextRollbackId(),
        targetScope: entry.targetPath,
        rollbackAction: entry.rollbackAction,
        source: 'world2-change-set-materializer',
      });
    }
  }

  steps.push({
    readOnly: true,
    rollbackId: nextRollbackId(),
    targetScope: 'disposable-workspace',
    rollbackAction: 'Dispose disposable workspace without affecting live repository',
    source: 'world2-dry-run-execution-composer',
  });

  return steps.slice(0, MAX_ROLLBACK_STEPS);
}

function buildPackageAuditTrail(
  packageId: string,
  orderedSteps: World2DryRunOrderedStep[],
  packageState: World2DryRunPackageState,
): World2DryRunExecutionAuditEntry[] {
  const entries: World2DryRunExecutionAuditEntry[] = [];
  const recordedAt = new Date().toISOString();

  for (const step of orderedSteps) {
    entries.push({
      readOnly: true,
      auditId: nextAuditId(),
      packageId,
      stepId: step.stepId,
      event: 'DRY_RUN_STEP_PLANNED',
      detail: `${step.label} — ${packageState} — no real execution performed`,
      recordedAt,
    });
  }

  entries.push({
    readOnly: true,
    auditId: nextAuditId(),
    packageId,
    stepId: 'package-composed',
    event: 'DRY_RUN_PACKAGE_COMPOSED',
    detail: `Dry-run execution package composed with state ${packageState}`,
    recordedAt,
  });

  return entries.slice(0, MAX_AUDIT_TRAIL_ENTRIES);
}

export function performWorld2DryRunExecutionSafetyChecks(
  snapshot: World2DryRunExecutionComposerInputSnapshot,
  validationSteps: World2DryRunValidationStep[],
  rollbackSteps: World2DryRunRollbackStep[],
): World2DryRunExecutionSafetyCheck[] {
  const snapshotState = snapshot.snapshotMaterializerAssessment.materializationState;
  const changeState = snapshot.changeSetMaterializerAssessment.materializationState;
  const runtimeState = snapshot.runtimeAssessment.executionState;
  const engineState = snapshot.engineAssessment.finalState;
  const roots = resolveTargetRoots(snapshot);
  const disposableOnly =
    roots.length === 0 || roots.every((root) => isDisposableOnlyTargetRoot(root));
  const forbiddenPathDetected = detectForbiddenPaths(snapshot);
  const realExecutionDetected = detectRealExecution(snapshot);

  const snapshotNotBlocked =
    snapshotState === 'MATERIALIZATION_READY' || snapshotState === 'MATERIALIZATION_SIMULATED';
  const changeNotBlocked =
    changeState === 'CHANGE_MATERIALIZATION_READY' ||
    changeState === 'CHANGE_MATERIALIZATION_SIMULATED';
  const runtimeNotBlocked =
    runtimeState === 'READY_FOR_WORLD2' || runtimeState === 'READY_WITH_RESTRICTIONS';
  const engineNotBlocked =
    engineState === 'SANDBOX_EXECUTION_ELIGIBLE' || engineState === 'SIMULATED_EXECUTION';

  return [
    {
      readOnly: true,
      checkId: 'snapshot-materializer-not-blocked',
      label: 'Snapshot materializer not blocked',
      passed: snapshotNotBlocked,
      detail: snapshotNotBlocked
        ? `Snapshot materializer state ${snapshotState}.`
        : 'Snapshot materializer blocked.',
    },
    {
      readOnly: true,
      checkId: 'change-materializer-not-blocked',
      label: 'Change materializer not blocked',
      passed: changeNotBlocked,
      detail: changeNotBlocked
        ? `Change materializer state ${changeState}.`
        : 'Change materializer blocked.',
    },
    {
      readOnly: true,
      checkId: 'runtime-not-blocked',
      label: 'Controlled execution runtime not blocked',
      passed: runtimeNotBlocked,
      detail: runtimeNotBlocked
        ? `Runtime state ${runtimeState}.`
        : 'Controlled execution runtime blocked.',
    },
    {
      readOnly: true,
      checkId: 'execution-engine-not-blocked',
      label: 'Execution engine not blocked',
      passed: engineNotBlocked,
      detail: engineNotBlocked
        ? `Engine final state ${engineState}.`
        : 'Execution engine blocked.',
    },
    {
      readOnly: true,
      checkId: 'no-real-file-mutation',
      label: 'No real file mutation',
      passed: !realExecutionDetected,
      detail: realExecutionDetected
        ? 'Real file mutation or repository copy detected.'
        : 'No real file mutation detected.',
    },
    {
      readOnly: true,
      checkId: 'no-repository-copy',
      label: 'No repository copy',
      passed:
        snapshot.snapshotMaterializerAssessment.materializationOperation?.repositoryCopyPerformed !==
        true,
      detail: 'Repository copy not performed.',
    },
    {
      readOnly: true,
      checkId: 'no-live-workspace-path',
      label: 'No live workspace path',
      passed: !forbiddenPathDetected && disposableOnly,
      detail: forbiddenPathDetected
        ? 'Live or forbidden workspace path detected.'
        : 'Target roots are disposable-only.',
    },
    {
      readOnly: true,
      checkId: 'no-production-path',
      label: 'No production path',
      passed: !forbiddenPathDetected,
      detail: forbiddenPathDetected
        ? 'Production path detected.'
        : 'No production path detected.',
    },
    {
      readOnly: true,
      checkId: 'rollback-steps-exist',
      label: 'Rollback steps exist',
      passed: rollbackSteps.length > 0,
      detail:
        rollbackSteps.length > 0
          ? `${rollbackSteps.length} rollback steps recorded.`
          : 'Rollback steps missing.',
    },
    {
      readOnly: true,
      checkId: 'validation-steps-exist',
      label: 'Validation steps exist',
      passed: validationSteps.length > 0,
      detail:
        validationSteps.length > 0
          ? `${validationSteps.length} validation steps recorded.`
          : 'Validation steps missing.',
    },
  ];
}

export function deriveWorld2DryRunPackageState(context: DryRunPackageStateContext): World2DryRunPackageState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.snapshotMaterializerState === 'INSUFFICIENT_EVIDENCE' ||
    context.changeMaterializerState === 'INSUFFICIENT_EVIDENCE' ||
    context.runtimeState === 'INSUFFICIENT_EVIDENCE' ||
    context.engineFinalState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.upstreamBlocked ||
    context.realExecutionDetected ||
    context.forbiddenPathDetected ||
    !context.rollbackStepsExist ||
    !context.validationStepsExist ||
    context.criticalSafetyFailures > 0 ||
    context.snapshotMaterializerState === 'MATERIALIZATION_BLOCKED' ||
    context.changeMaterializerState === 'CHANGE_MATERIALIZATION_BLOCKED' ||
    context.runtimeState === 'BLOCKED' ||
    context.engineFinalState === 'BLOCKED'
  ) {
    return 'DRY_RUN_PACKAGE_BLOCKED';
  }

  if (
    context.snapshotMaterializerState === 'NOT_READY' ||
    context.changeMaterializerState === 'NOT_READY' ||
    context.runtimeState === 'NOT_READY' ||
    !context.hasSnapshotOperation ||
    !context.hasChangeOperation
  ) {
    return 'NOT_READY';
  }

  const readyExact =
    context.snapshotMaterializerState === 'MATERIALIZATION_READY' &&
    context.changeMaterializerState === 'CHANGE_MATERIALIZATION_READY' &&
    context.runtimeState === 'READY_FOR_WORLD2' &&
    context.engineFinalState === 'SANDBOX_EXECUTION_ELIGIBLE' &&
    context.safetyChecksPassed;

  if (readyExact) {
    return 'DRY_RUN_PACKAGE_READY';
  }

  const hasWarnings =
    context.snapshotMaterializerState === 'MATERIALIZATION_SIMULATED' ||
    context.changeMaterializerState === 'CHANGE_MATERIALIZATION_SIMULATED' ||
    context.runtimeState === 'READY_WITH_RESTRICTIONS' ||
    context.engineFinalState === 'SIMULATED_EXECUTION';

  if (hasWarnings && context.criticalSafetyFailures === 0) {
    return 'DRY_RUN_PACKAGE_READY_WITH_WARNINGS';
  }

  if (
    context.snapshotMaterializerState === 'MATERIALIZATION_READY' &&
    context.changeMaterializerState === 'CHANGE_MATERIALIZATION_READY' &&
    context.safetyChecksPassed
  ) {
    return 'DRY_RUN_PACKAGE_READY';
  }

  return 'DRY_RUN_PACKAGE_BLOCKED';
}

function buildExecutionPackage(
  snapshot: World2DryRunExecutionComposerInputSnapshot,
  packageState: World2DryRunPackageState,
  safetyChecks: World2DryRunExecutionSafetyCheck[],
  validationSteps: World2DryRunValidationStep[],
  rollbackSteps: World2DryRunRollbackStep[],
): World2DryRunExecutionPackage | null {
  const packageEligible =
    packageState === 'DRY_RUN_PACKAGE_READY' ||
    packageState === 'DRY_RUN_PACKAGE_READY_WITH_WARNINGS';

  if (!packageEligible) {
    return null;
  }

  const snapshotOp = snapshot.snapshotMaterializerAssessment.materializationOperation;
  const changeOp = snapshot.changeSetMaterializerAssessment.materializationOperation;
  const orderedSteps = buildWorld2DryRunOrderedSteps();
  const packageId = nextPackageId();

  return {
    readOnly: true,
    packageId,
    workspaceId: resolveWorkspaceId(snapshot),
    snapshotMaterializationOperation: snapshotOp,
    changeMaterializationOperation: changeOp,
    orderedSteps,
    validationSteps,
    rollbackSteps,
    auditTrail: buildPackageAuditTrail(packageId, orderedSteps, packageState),
    safetyChecks,
    finalReadinessState: packageState,
    realExecutionPerformed: false,
  };
}

function buildComposerReasons(
  snapshot: World2DryRunExecutionComposerInputSnapshot,
  packageState: World2DryRunPackageState,
  safetyChecks: World2DryRunExecutionSafetyCheck[],
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...snapshot.snapshotMaterializerAssessment.blockingReasons);
  blockingReasons.push(...snapshot.changeSetMaterializerAssessment.blockingReasons);
  blockingReasons.push(...snapshot.runtimeAssessment.blockingReasons);
  blockingReasons.push(...snapshot.engineAssessment.blockers);

  warningReasons.push(...snapshot.snapshotMaterializerAssessment.warningReasons);
  warningReasons.push(...snapshot.changeSetMaterializerAssessment.warningReasons);
  warningReasons.push(...snapshot.runtimeAssessment.warningReasons);
  warningReasons.push(...snapshot.engineAssessment.warnings);

  for (const check of safetyChecks) {
    if (!check.passed) {
      blockingReasons.push(`${check.label}: ${check.detail}`);
    }
  }

  if (packageState === 'DRY_RUN_PACKAGE_BLOCKED') {
    blockingReasons.push(
      'Dry-run execution package BLOCKED — separate materializations are not execution permission.',
    );
  }

  if (packageState === 'DRY_RUN_PACKAGE_READY_WITH_WARNINGS') {
    warningReasons.push(
      'Dry-run package ready with upstream warnings — no real execution performed.',
    );
  }

  if (packageState === 'DRY_RUN_PACKAGE_READY') {
    warningReasons.push('Dry-run package ready — realExecutionPerformed remains false.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_DRY_RUN_COMPOSER_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_DRY_RUN_COMPOSER_REASONS),
  };
}

export function assessWorld2DryRunExecutionComposer(
  input: AssessWorld2DryRunExecutionComposerInput = {},
): World2DryRunExecutionComposerAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const validationSteps = buildWorld2DryRunValidationSteps(inputSnapshot);
  const rollbackSteps = buildWorld2DryRunRollbackSteps(inputSnapshot);
  const safetyChecks = performWorld2DryRunExecutionSafetyChecks(
    inputSnapshot,
    validationSteps,
    rollbackSteps,
  );
  const safetyChecksPassed = safetyChecks.every((check) => check.passed);
  const criticalSafetyFailures = safetyChecks.filter((check) => !check.passed).length;

  const stateContext: DryRunPackageStateContext = {
    missingAuthorities: inputSnapshot.missingAuthorities,
    snapshotMaterializerState: inputSnapshot.snapshotMaterializerAssessment.materializationState,
    changeMaterializerState: inputSnapshot.changeSetMaterializerAssessment.materializationState,
    runtimeState: inputSnapshot.runtimeAssessment.executionState,
    engineFinalState: inputSnapshot.engineAssessment.finalState,
    safetyChecksPassed,
    criticalSafetyFailures,
    hasSnapshotOperation:
      inputSnapshot.snapshotMaterializerAssessment.materializationOperation !== null,
    hasChangeOperation:
      inputSnapshot.changeSetMaterializerAssessment.materializationOperation !== null,
    validationStepsExist: validationSteps.length > 0,
    rollbackStepsExist: rollbackSteps.length > 0,
    realExecutionDetected: detectRealExecution(inputSnapshot),
    forbiddenPathDetected: detectForbiddenPaths(inputSnapshot),
    upstreamBlocked: isUpstreamBlocked(inputSnapshot),
  };

  const packageState = deriveWorld2DryRunPackageState(stateContext);
  const composerAssessmentId = nextComposerAssessmentId();
  const reasons = buildComposerReasons(inputSnapshot, packageState, safetyChecks);

  const executionPackage = buildExecutionPackage(
    inputSnapshot,
    packageState,
    safetyChecks,
    validationSteps,
    rollbackSteps,
  );

  const assessment: World2DryRunExecutionComposerAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_DRY_RUN_COMPOSER_CORE_QUESTION,
    composerAssessmentId,
    workspaceId: resolveWorkspaceId(inputSnapshot),
    packageState,
    inputSnapshot,
    executionPackage,
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    cacheKey: stableCacheKey(composerAssessmentId, packageState),
  };

  recordWorld2DryRunExecutionComposerAssessment(assessment);
  return assessment;
}

export function buildWorld2DryRunExecutionComposerReport(
  assessment: World2DryRunExecutionComposerAssessment,
  generatedAt = new Date().toISOString(),
): World2DryRunExecutionComposerReport {
  return {
    generatedAt,
    phaseName: WORLD2_DRY_RUN_EXECUTION_COMPOSER_PHASE,
    purpose:
      'Combine repository snapshot materialization and change-set materialization into one ordered dry-run execution package — no real execution.',
    assessment,
    passToken: WORLD2_DRY_RUN_EXECUTION_COMPOSER_PASS_TOKEN,
  };
}

export function buildWorld2DryRunExecutionComposerArtifacts(
  input: AssessWorld2DryRunExecutionComposerInput = {},
): {
  world2DryRunExecutionComposerAssessment: World2DryRunExecutionComposerAssessment;
  world2DryRunExecutionComposerReportMarkdown: string;
} {
  const world2DryRunExecutionComposerAssessment = assessWorld2DryRunExecutionComposer(input);
  const report = buildWorld2DryRunExecutionComposerReport(world2DryRunExecutionComposerAssessment);
  return {
    world2DryRunExecutionComposerAssessment,
    world2DryRunExecutionComposerReportMarkdown:
      buildWorld2DryRunExecutionComposerReportMarkdown(report),
  };
}

export function resetWorld2DryRunExecutionComposerModuleForTests(): void {
  resetWorld2DryRunExecutionComposerHistoryForTests();
  resetWorld2DryRunExecutionComposerCounterForTests();
  resetWorld2ChangeSetMaterializerModuleForTests();
  resetWorld2ExecutionEngineModuleForTests();
  resetWorld2ControlledExecutionRuntimeModuleForTests();
}
