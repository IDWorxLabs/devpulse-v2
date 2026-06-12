/**
 * World 2 Dry-Run Execution Verifier — independent dry-run package verification authority.
 * Inspects composed packages only — never executes commands or mutates files.
 */

import { createHash } from 'node:crypto';
import type { World2DryRunExecutionPackage } from '../world2-dry-run-execution-composer/world2-dry-run-execution-composer-types.js';
import {
  assessWorld2DryRunExecutionComposer,
  resetWorld2DryRunExecutionComposerModuleForTests,
} from '../world2-dry-run-execution-composer/index.js';
import {
  CHANGE_MATERIALIZER_SAFETY_CHECK_IDS,
  ENGINE_STEP_ACTION_TYPES,
  MAX_DRY_RUN_VERIFIER_REASONS,
  MAX_MISSING_COVERAGE,
  READINESS_SCORE_WEIGHTS,
  REQUIRED_ORDERED_STEP_DEFINITIONS,
  SNAPSHOT_MATERIALIZER_SAFETY_CHECK_IDS,
  VERIFIED_MIN_SCORE,
  VERIFIED_WITH_WARNINGS_MIN_SCORE,
  WORLD2_DRY_RUN_VERIFIER_CACHE_KEY_PREFIX,
  WORLD2_DRY_RUN_VERIFIER_CORE_QUESTION,
  WORLD2_DRY_RUN_EXECUTION_VERIFIER_OWNER_MODULE,
  WORLD2_DRY_RUN_EXECUTION_VERIFIER_PASS_TOKEN,
  WORLD2_DRY_RUN_EXECUTION_VERIFIER_PHASE,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  isDisposableOnlyTargetRoot,
  pathMatchesPatterns,
} from './world2-dry-run-execution-verifier-registry.js';
import {
  recordWorld2DryRunExecutionVerifierAssessment,
  resetWorld2DryRunExecutionVerifierHistoryForTests,
} from './world2-dry-run-execution-verifier-history.js';
import { buildWorld2DryRunExecutionVerifierReportMarkdown } from './world2-dry-run-execution-verifier-report-builder.js';
import type {
  AssessWorld2DryRunExecutionVerifierInput,
  DryRunVerificationStateContext,
  World2DryRunCoverageCheck,
  World2DryRunExecutionVerificationAssessment,
  World2DryRunExecutionVerifierInputSnapshot,
  World2DryRunExecutionVerifierReport,
  World2DryRunOrderedStepCheck,
  World2DryRunReadinessScoreBreakdown,
  World2DryRunVerificationSafetyCheck,
  World2DryRunVerificationState,
} from './world2-dry-run-execution-verifier-types.js';

let verifierCounter = 0;

export function resetWorld2DryRunExecutionVerifierCounterForTests(): void {
  verifierCounter = 0;
}

function nextVerificationId(): string {
  verifierCounter += 1;
  return `world2-dry-run-verification-${verifierCounter}`;
}

function stableCacheKey(verificationId: string, state: World2DryRunVerificationState): string {
  const digest = createHash('sha256')
    .update([WORLD2_DRY_RUN_EXECUTION_VERIFIER_OWNER_MODULE, verificationId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_DRY_RUN_VERIFIER_CACHE_KEY_PREFIX}:${digest}`;
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
  input: AssessWorld2DryRunExecutionVerifierInput,
): World2DryRunExecutionVerifierInputSnapshot {
  const composerAssessment =
    input.composerAssessment ?? assessWorld2DryRunExecutionComposer(input);

  const snapshotMaterializerAssessment =
    composerAssessment.inputSnapshot.snapshotMaterializerAssessment;
  const changeSetMaterializerAssessment =
    composerAssessment.inputSnapshot.changeSetMaterializerAssessment;
  const engineAssessment = composerAssessment.inputSnapshot.engineAssessment;

  const missingAuthorities: string[] = dedupe([
    ...composerAssessment.inputSnapshot.missingAuthorities,
    ...changeSetMaterializerAssessment.inputSnapshot.missingAuthorities,
    ...engineAssessment.inputSnapshot.missingAuthorities,
  ]);

  return {
    composerAssessment,
    snapshotMaterializerAssessment,
    changeSetMaterializerAssessment,
    engineAssessment,
    missingAuthorities,
  };
}

export function performWorld2DryRunOrderedStepChecks(
  executionPackage: World2DryRunExecutionPackage | null,
): World2DryRunOrderedStepCheck[] {
  const orderedSteps = executionPackage?.orderedSteps ?? [];

  return REQUIRED_ORDERED_STEP_DEFINITIONS.map((expected) => {
    const actual = orderedSteps.find((step) => step.stepId === expected.stepId);
    const present = actual !== undefined;
    const orderCorrect = present && actual.order === expected.order;
    const passed = present && orderCorrect;

    return {
      readOnly: true,
      checkId: `ordered-step-${expected.stepId}`,
      expectedStepId: expected.stepId,
      expectedOrder: expected.order,
      present,
      orderCorrect,
      passed,
      detail: passed
        ? `Step ${expected.stepId} present at order ${expected.order}.`
        : present
          ? `Step ${expected.stepId} present but order ${actual?.order} != ${expected.order}.`
          : `Required step ${expected.stepId} missing.`,
    };
  });
}

function assessOrderedStepsInSequence(orderedStepChecks: World2DryRunOrderedStepCheck[]): boolean {
  if (!orderedStepChecks.every((check) => check.passed)) {
    return false;
  }

  const orders = orderedStepChecks.map((check) => check.expectedOrder);
  for (let i = 1; i < orders.length; i += 1) {
    if (orders[i] <= orders[i - 1]) {
      return false;
    }
  }

  return true;
}

export function performWorld2DryRunVerificationSafetyChecks(
  snapshot: World2DryRunExecutionVerifierInputSnapshot,
  executionPackage: World2DryRunExecutionPackage | null,
): World2DryRunVerificationSafetyCheck[] {
  const pkg = executionPackage;
  const snapshotOp = pkg?.snapshotMaterializationOperation;
  const changeOp = pkg?.changeMaterializationOperation;

  const targetRoots = [
    snapshotOp?.targetWorkspaceRoot,
    changeOp?.targetWorkspaceRoot,
  ].filter((root): root is string => Boolean(root));

  const livePathDetected = targetRoots.some((root) =>
    pathMatchesPatterns(root, WORLD2_LIVE_PATH_PATTERNS),
  );
  const productionPathDetected = targetRoots.some((root) =>
    pathMatchesPatterns(root, WORLD2_PRODUCTION_PATH_PATTERNS),
  );
  const disposableOnly =
    targetRoots.length === 0 || targetRoots.every((root) => isDisposableOnlyTargetRoot(root));

  const packageSafetyPassed =
    pkg === null ? false : pkg.safetyChecks.every((check) => check.passed);

  const snapshotMaterializerChecks =
    snapshot.snapshotMaterializerAssessment.materializationOperation?.safetyChecks ?? [];
  const changeMaterializerChecks =
    snapshot.changeSetMaterializerAssessment.materializationOperation?.safetyChecks ?? [];

  const snapshotChecksRepresented = SNAPSHOT_MATERIALIZER_SAFETY_CHECK_IDS.every((checkId) =>
    snapshotMaterializerChecks.some((check) => check.checkId === checkId),
  );
  const changeChecksRepresented = CHANGE_MATERIALIZER_SAFETY_CHECK_IDS.every((checkId) =>
    changeMaterializerChecks.some((check) => check.checkId === checkId),
  );

  const engineSteps = snapshot.engineAssessment.steps;
  const engineStepsRepresented =
    engineSteps.length > 0 &&
    ENGINE_STEP_ACTION_TYPES.every((actionType) =>
      engineSteps.some((step) => step.actionType === actionType),
    );

  return [
    {
      readOnly: true,
      checkId: 'required-ordered-steps-exist',
      label: 'Required ordered steps exist',
      passed: performWorld2DryRunOrderedStepChecks(pkg).every((check) => check.present),
      detail: 'All required ordered steps present in package.',
    },
    {
      readOnly: true,
      checkId: 'ordered-steps-correct-order',
      label: 'Ordered steps are in correct order',
      passed: assessOrderedStepsInSequence(performWorld2DryRunOrderedStepChecks(pkg)),
      detail: 'Ordered steps appear in canonical sequence.',
    },
    {
      readOnly: true,
      checkId: 'validation-steps-exist',
      label: 'Validation steps exist',
      passed: (pkg?.validationSteps.length ?? 0) > 0,
      detail: `${pkg?.validationSteps.length ?? 0} validation steps in package.`,
    },
    {
      readOnly: true,
      checkId: 'rollback-steps-exist',
      label: 'Rollback steps exist',
      passed: (pkg?.rollbackSteps.length ?? 0) > 0,
      detail: `${pkg?.rollbackSteps.length ?? 0} rollback steps in package.`,
    },
    {
      readOnly: true,
      checkId: 'audit-trail-exists',
      label: 'Audit trail exists',
      passed: (pkg?.auditTrail.length ?? 0) > 0,
      detail: `${pkg?.auditTrail.length ?? 0} audit trail entries in package.`,
    },
    {
      readOnly: true,
      checkId: 'no-real-execution-performed',
      label: 'No real execution performed',
      passed: pkg?.realExecutionPerformed === false,
      detail: 'realExecutionPerformed is false.',
    },
    {
      readOnly: true,
      checkId: 'no-file-mutation-performed',
      label: 'No file mutation performed',
      passed:
        changeOp?.realFileMutationPerformed === false ||
        changeOp === undefined ||
        changeOp === null,
      detail: 'Change materialization realFileMutationPerformed is false.',
    },
    {
      readOnly: true,
      checkId: 'no-repository-copy-performed',
      label: 'No repository copy performed',
      passed:
        snapshotOp?.repositoryCopyPerformed === false ||
        snapshotOp === undefined ||
        snapshotOp === null,
      detail: 'Snapshot materialization repositoryCopyPerformed is false.',
    },
    {
      readOnly: true,
      checkId: 'no-live-workspace-path',
      label: 'No live workspace path',
      passed: !livePathDetected && disposableOnly,
      detail: livePathDetected
        ? 'Live workspace path detected.'
        : 'No live workspace path detected.',
    },
    {
      readOnly: true,
      checkId: 'no-production-path',
      label: 'No production path',
      passed: !productionPathDetected,
      detail: productionPathDetected
        ? 'Production path detected.'
        : 'No production path detected.',
    },
    {
      readOnly: true,
      checkId: 'package-safety-checks-pass',
      label: 'Package safety checks pass',
      passed: packageSafetyPassed,
      detail: packageSafetyPassed
        ? 'All package safety checks passed.'
        : 'One or more package safety checks failed.',
    },
    {
      readOnly: true,
      checkId: 'snapshot-materializer-safety-represented',
      label: 'Snapshot materializer safety checks represented',
      passed: snapshotChecksRepresented,
      detail: snapshotChecksRepresented
        ? 'Snapshot materializer safety checks present.'
        : 'Snapshot materializer safety checks incomplete.',
    },
    {
      readOnly: true,
      checkId: 'change-materializer-safety-represented',
      label: 'Change materializer safety checks represented',
      passed: changeChecksRepresented,
      detail: changeChecksRepresented
        ? 'Change materializer safety checks present.'
        : 'Change materializer safety checks incomplete.',
    },
    {
      readOnly: true,
      checkId: 'execution-engine-steps-represented',
      label: 'Execution engine steps are represented',
      passed: engineStepsRepresented,
      detail: engineStepsRepresented
        ? 'Engine plan, validation, and rollback steps represented.'
        : 'Execution engine steps incomplete.',
    },
  ];
}

export function performWorld2DryRunValidationCoverageChecks(
  executionPackage: World2DryRunExecutionPackage | null,
): World2DryRunCoverageCheck[] {
  const validationSteps = executionPackage?.validationSteps ?? [];
  const mandatoryCount = validationSteps.filter((step) => step.mandatory).length;

  return [
    {
      readOnly: true,
      checkId: 'validation-steps-present',
      label: 'Validation steps present',
      covered: validationSteps.length > 0,
      passed: validationSteps.length > 0,
      detail: `${validationSteps.length} validation steps recorded.`,
    },
    {
      readOnly: true,
      checkId: 'mandatory-validation-covered',
      label: 'Mandatory validation requirements covered',
      covered: mandatoryCount > 0,
      passed: mandatoryCount > 0,
      detail: `${mandatoryCount} mandatory validation steps recorded.`,
    },
    {
      readOnly: true,
      checkId: 'execution-plan-validation-covered',
      label: 'Execution plan validation strategy covered',
      covered: validationSteps.some((step) => step.source === 'execution-plan'),
      passed: validationSteps.some((step) => step.source === 'execution-plan'),
      detail: 'Execution plan validation requirements represented.',
    },
    {
      readOnly: true,
      checkId: 'change-set-validation-covered',
      label: 'Change set verification requirements covered',
      covered: validationSteps.some((step) => step.source === 'world2-change-set'),
      passed: validationSteps.some((step) => step.source === 'world2-change-set'),
      detail: 'Change set verification requirements represented.',
    },
  ];
}

export function performWorld2DryRunRollbackCoverageChecks(
  executionPackage: World2DryRunExecutionPackage | null,
): World2DryRunCoverageCheck[] {
  const rollbackSteps = executionPackage?.rollbackSteps ?? [];

  return [
    {
      readOnly: true,
      checkId: 'rollback-steps-present',
      label: 'Rollback steps present',
      covered: rollbackSteps.length > 0,
      passed: rollbackSteps.length > 0,
      detail: `${rollbackSteps.length} rollback steps recorded.`,
    },
    {
      readOnly: true,
      checkId: 'execution-plan-rollback-covered',
      label: 'Execution plan rollback covered',
      covered: rollbackSteps.some((step) => step.source === 'execution-plan'),
      passed: rollbackSteps.some((step) => step.source === 'execution-plan'),
      detail: 'Execution plan rollback requirements represented.',
    },
    {
      readOnly: true,
      checkId: 'change-set-rollback-covered',
      label: 'Change set rollback map covered',
      covered: rollbackSteps.some((step) => step.source === 'world2-change-set-materializer'),
      passed: rollbackSteps.some((step) => step.source === 'world2-change-set-materializer'),
      detail: 'Change set rollback map represented.',
    },
    {
      readOnly: true,
      checkId: 'disposal-rollback-covered',
      label: 'Disposable workspace disposal covered',
      covered: rollbackSteps.some((step) => step.targetScope === 'disposable-workspace'),
      passed: rollbackSteps.some((step) => step.targetScope === 'disposable-workspace'),
      detail: 'Disposable workspace disposal rollback represented.',
    },
  ];
}

export function performWorld2DryRunAuditCoverageChecks(
  executionPackage: World2DryRunExecutionPackage | null,
): World2DryRunCoverageCheck[] {
  const auditTrail = executionPackage?.auditTrail ?? [];
  const orderedSteps = executionPackage?.orderedSteps ?? [];
  const stepIds = new Set(orderedSteps.map((step) => step.stepId));
  const auditedStepIds = auditTrail.filter((entry) => stepIds.has(entry.stepId));

  return [
    {
      readOnly: true,
      checkId: 'audit-trail-present',
      label: 'Audit trail present',
      covered: auditTrail.length > 0,
      passed: auditTrail.length > 0,
      detail: `${auditTrail.length} audit entries recorded.`,
    },
    {
      readOnly: true,
      checkId: 'ordered-steps-audited',
      label: 'Ordered steps have audit entries',
      covered: auditedStepIds.length >= orderedSteps.length,
      passed: auditedStepIds.length >= orderedSteps.length,
      detail: `${auditedStepIds.length}/${orderedSteps.length} ordered steps audited.`,
    },
    {
      readOnly: true,
      checkId: 'package-composed-audited',
      label: 'Package composition audited',
      covered: auditTrail.some((entry) => entry.stepId === 'package-composed'),
      passed: auditTrail.some((entry) => entry.stepId === 'package-composed'),
      detail: 'Package composition audit entry present.',
    },
  ];
}

export function computeWorld2DryRunReadinessScore(input: {
  orderedStepChecks: World2DryRunOrderedStepCheck[];
  safetyChecks: World2DryRunVerificationSafetyCheck[];
  validationCoverageChecks: World2DryRunCoverageCheck[];
  rollbackCoverageChecks: World2DryRunCoverageCheck[];
  auditCoverageChecks: World2DryRunCoverageCheck[];
  snapshot: World2DryRunExecutionVerifierInputSnapshot;
  executionPackage: World2DryRunExecutionPackage | null;
}): World2DryRunReadinessScoreBreakdown {
  const orderedPassed = input.orderedStepChecks.filter((check) => check.passed).length;
  const orderedTotal = Math.max(input.orderedStepChecks.length, 1);
  const orderedStepsScore = Math.round(
    (orderedPassed / orderedTotal) * READINESS_SCORE_WEIGHTS.orderedSteps,
  );

  const safetyPassed = input.safetyChecks.filter((check) => check.passed).length;
  const safetyTotal = Math.max(input.safetyChecks.length, 1);
  const safetyChecksScore = Math.round(
    (safetyPassed / safetyTotal) * READINESS_SCORE_WEIGHTS.safetyChecks,
  );

  const validationPassed = input.validationCoverageChecks.filter((check) => check.passed).length;
  const validationTotal = Math.max(input.validationCoverageChecks.length, 1);
  const validationCoverageScore = Math.round(
    (validationPassed / validationTotal) * READINESS_SCORE_WEIGHTS.validationCoverage,
  );

  const rollbackPassed = input.rollbackCoverageChecks.filter((check) => check.passed).length;
  const rollbackTotal = Math.max(input.rollbackCoverageChecks.length, 1);
  const rollbackCoverageScore = Math.round(
    (rollbackPassed / rollbackTotal) * READINESS_SCORE_WEIGHTS.rollbackCoverage,
  );

  const auditPassed = input.auditCoverageChecks.filter((check) => check.passed).length;
  const auditTotal = Math.max(input.auditCoverageChecks.length, 1);
  const auditCoverageScore = Math.round(
    (auditPassed / auditTotal) * READINESS_SCORE_WEIGHTS.auditCoverage,
  );

  const composer = input.snapshot.composerAssessment;
  const snapshotMat = input.snapshot.snapshotMaterializerAssessment;
  const changeMat = input.snapshot.changeSetMaterializerAssessment;
  const engine = input.snapshot.engineAssessment;

  let upstreamPoints = 0;
  const upstreamChecks = [
    composer.packageState === 'DRY_RUN_PACKAGE_READY' ||
      composer.packageState === 'DRY_RUN_PACKAGE_READY_WITH_WARNINGS',
    snapshotMat.materializationState === 'MATERIALIZATION_READY' ||
      snapshotMat.materializationState === 'MATERIALIZATION_SIMULATED',
    changeMat.materializationState === 'CHANGE_MATERIALIZATION_READY' ||
      changeMat.materializationState === 'CHANGE_MATERIALIZATION_SIMULATED',
    engine.finalState === 'SANDBOX_EXECUTION_ELIGIBLE' ||
      engine.finalState === 'SIMULATED_EXECUTION',
    input.executionPackage !== null,
  ];

  upstreamPoints = upstreamChecks.filter(Boolean).length;
  const upstreamConsistencyScore = Math.round(
    (upstreamPoints / upstreamChecks.length) * READINESS_SCORE_WEIGHTS.upstreamConsistency,
  );

  const totalScore = Math.min(
    100,
    orderedStepsScore +
      safetyChecksScore +
      validationCoverageScore +
      rollbackCoverageScore +
      auditCoverageScore +
      upstreamConsistencyScore,
  );

  return {
    orderedStepsScore,
    safetyChecksScore,
    validationCoverageScore,
    rollbackCoverageScore,
    auditCoverageScore,
    upstreamConsistencyScore,
    totalScore,
  };
}

function collectMissingCoverage(input: {
  orderedStepChecks: World2DryRunOrderedStepCheck[];
  validationCoverageChecks: World2DryRunCoverageCheck[];
  rollbackCoverageChecks: World2DryRunCoverageCheck[];
  auditCoverageChecks: World2DryRunCoverageCheck[];
  safetyChecks: World2DryRunVerificationSafetyCheck[];
}): string[] {
  const missing: string[] = [];

  for (const check of input.orderedStepChecks) {
    if (!check.passed) {
      missing.push(`Ordered step missing or out of order: ${check.expectedStepId}`);
    }
  }

  for (const check of input.validationCoverageChecks) {
    if (!check.passed) {
      missing.push(`Validation coverage gap: ${check.label}`);
    }
  }

  for (const check of input.rollbackCoverageChecks) {
    if (!check.passed) {
      missing.push(`Rollback coverage gap: ${check.label}`);
    }
  }

  for (const check of input.auditCoverageChecks) {
    if (!check.passed) {
      missing.push(`Audit coverage gap: ${check.label}`);
    }
  }

  for (const check of input.safetyChecks) {
    if (!check.passed) {
      missing.push(`Safety check failed: ${check.label}`);
    }
  }

  return dedupe(missing).slice(0, MAX_MISSING_COVERAGE);
}

export function deriveWorld2DryRunVerificationState(
  context: DryRunVerificationStateContext,
): World2DryRunVerificationState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (context.packageState === 'INSUFFICIENT_EVIDENCE') {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.packageState === 'NOT_READY' ||
    (!context.hasExecutionPackage && context.packageState !== 'DRY_RUN_PACKAGE_BLOCKED')
  ) {
    return 'NOT_READY';
  }

  if (
    context.upstreamBlocked ||
    context.packageState === 'DRY_RUN_PACKAGE_BLOCKED' ||
    context.criticalBlockerCount > 0 ||
    (context.blockingReasonCount > 0 && context.readinessScore < VERIFIED_WITH_WARNINGS_MIN_SCORE) ||
    context.readinessScore < VERIFIED_WITH_WARNINGS_MIN_SCORE
  ) {
    return 'FAILED';
  }

  if (
    context.readinessScore >= VERIFIED_MIN_SCORE &&
    context.blockingReasonCount === 0 &&
    context.packageState === 'DRY_RUN_PACKAGE_READY'
  ) {
    return 'VERIFIED';
  }

  if (
    context.readinessScore >= VERIFIED_WITH_WARNINGS_MIN_SCORE &&
    context.criticalBlockerCount === 0
  ) {
    return 'VERIFIED_WITH_WARNINGS';
  }

  return 'FAILED';
}

function buildVerificationReasons(input: {
  snapshot: World2DryRunExecutionVerifierInputSnapshot;
  verificationState: World2DryRunVerificationState;
  safetyChecks: World2DryRunVerificationSafetyCheck[];
  missingCoverage: string[];
  readinessScore: number;
}): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];

  if (input.snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of input.snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...input.snapshot.composerAssessment.blockingReasons);
  warningReasons.push(...input.snapshot.composerAssessment.warningReasons);
  warningReasons.push(...input.snapshot.changeSetMaterializerAssessment.warningReasons);
  warningReasons.push(...input.snapshot.snapshotMaterializerAssessment.warningReasons);
  warningReasons.push(...input.snapshot.engineAssessment.warnings);

  for (const check of input.safetyChecks) {
    if (!check.passed) {
      blockingReasons.push(`${check.label}: ${check.detail}`);
    }
  }

  for (const gap of input.missingCoverage) {
    blockingReasons.push(gap);
  }

  if (input.verificationState === 'FAILED') {
    blockingReasons.push(
      'Dry-run execution verification FAILED — package is not execution-ready.',
    );
  }

  if (input.verificationState === 'VERIFIED_WITH_WARNINGS') {
    warningReasons.push(
      `Verification passed with warnings — readiness score ${input.readinessScore}.`,
    );
  }

  if (input.verificationState === 'VERIFIED') {
    warningReasons.push(
      `Verification passed — readiness score ${input.readinessScore}; realExecutionPerformed remains false.`,
    );
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_DRY_RUN_VERIFIER_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_DRY_RUN_VERIFIER_REASONS),
  };
}

function isUpstreamBlocked(snapshot: World2DryRunExecutionVerifierInputSnapshot): boolean {
  return (
    snapshot.composerAssessment.packageState === 'DRY_RUN_PACKAGE_BLOCKED' ||
    snapshot.snapshotMaterializerAssessment.materializationState === 'MATERIALIZATION_BLOCKED' ||
    snapshot.changeSetMaterializerAssessment.materializationState ===
      'CHANGE_MATERIALIZATION_BLOCKED' ||
    snapshot.engineAssessment.finalState === 'BLOCKED'
  );
}

export function assessWorld2DryRunExecutionVerifier(
  input: AssessWorld2DryRunExecutionVerifierInput = {},
): World2DryRunExecutionVerificationAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const executionPackage = inputSnapshot.composerAssessment.executionPackage;

  const orderedStepChecks = performWorld2DryRunOrderedStepChecks(executionPackage);
  const safetyChecks = performWorld2DryRunVerificationSafetyChecks(inputSnapshot, executionPackage);
  const validationCoverageChecks = performWorld2DryRunValidationCoverageChecks(executionPackage);
  const rollbackCoverageChecks = performWorld2DryRunRollbackCoverageChecks(executionPackage);
  const auditCoverageChecks = performWorld2DryRunAuditCoverageChecks(executionPackage);

  const scoreBreakdown = computeWorld2DryRunReadinessScore({
    orderedStepChecks,
    safetyChecks,
    validationCoverageChecks,
    rollbackCoverageChecks,
    auditCoverageChecks,
    snapshot: inputSnapshot,
    executionPackage,
  });

  const missingCoverage = collectMissingCoverage({
    orderedStepChecks,
    validationCoverageChecks,
    rollbackCoverageChecks,
    auditCoverageChecks,
    safetyChecks,
  });

  const criticalSafetyFailures = safetyChecks.filter((check) => !check.passed).length;
  const blockingReasonCount = missingCoverage.length;

  const stateContext: DryRunVerificationStateContext = {
    missingAuthorities: inputSnapshot.missingAuthorities,
    packageState: inputSnapshot.composerAssessment.packageState,
    verificationStateEligible: executionPackage !== null,
    readinessScore: scoreBreakdown.totalScore,
    blockingReasonCount,
    criticalBlockerCount: criticalSafetyFailures,
    hasExecutionPackage: executionPackage !== null,
    upstreamBlocked: isUpstreamBlocked(inputSnapshot),
  };

  const verificationState = deriveWorld2DryRunVerificationState(stateContext);
  const reasons = buildVerificationReasons({
    snapshot: inputSnapshot,
    verificationState,
    safetyChecks,
    missingCoverage,
    readinessScore: scoreBreakdown.totalScore,
  });

  const verificationId = nextVerificationId();

  const assessment: World2DryRunExecutionVerificationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_DRY_RUN_VERIFIER_CORE_QUESTION,
    verificationId,
    packageId: executionPackage?.packageId ?? null,
    verificationState,
    orderedStepChecks,
    safetyChecks,
    validationCoverageChecks,
    rollbackCoverageChecks,
    auditCoverageChecks,
    missingCoverage,
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    readinessScore: scoreBreakdown.totalScore,
    realExecutionPerformed: false,
    inputSnapshot,
    cacheKey: stableCacheKey(verificationId, verificationState),
  };

  recordWorld2DryRunExecutionVerifierAssessment(assessment);
  return assessment;
}

export function buildWorld2DryRunExecutionVerifierReport(
  assessment: World2DryRunExecutionVerificationAssessment,
  generatedAt = new Date().toISOString(),
): World2DryRunExecutionVerifierReport {
  return {
    generatedAt,
    phaseName: WORLD2_DRY_RUN_EXECUTION_VERIFIER_PHASE,
    purpose:
      'Independently verify composed World 2 dry-run execution packages for future execution readiness — no real execution.',
    assessment,
    passToken: WORLD2_DRY_RUN_EXECUTION_VERIFIER_PASS_TOKEN,
  };
}

export function buildWorld2DryRunExecutionVerifierArtifacts(
  input: AssessWorld2DryRunExecutionVerifierInput = {},
): {
  world2DryRunExecutionVerifierAssessment: World2DryRunExecutionVerificationAssessment;
  world2DryRunExecutionVerifierReportMarkdown: string;
} {
  const world2DryRunExecutionVerifierAssessment = assessWorld2DryRunExecutionVerifier(input);
  const report = buildWorld2DryRunExecutionVerifierReport(world2DryRunExecutionVerifierAssessment);
  return {
    world2DryRunExecutionVerifierAssessment,
    world2DryRunExecutionVerifierReportMarkdown:
      buildWorld2DryRunExecutionVerifierReportMarkdown(report),
  };
}

export function resetWorld2DryRunExecutionVerifierModuleForTests(): void {
  resetWorld2DryRunExecutionVerifierHistoryForTests();
  resetWorld2DryRunExecutionVerifierCounterForTests();
  resetWorld2DryRunExecutionComposerModuleForTests();
}
