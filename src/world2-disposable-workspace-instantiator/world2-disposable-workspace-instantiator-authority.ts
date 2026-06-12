/**
 * World 2 Disposable Workspace Instantiator — instantiation operation authority.
 * Prepares the real creation interface safely — never copies repositories or applies change sets.
 */

import { createHash } from 'node:crypto';
import {
  assessWorld2DisposableWorkspaceCreator,
  resetWorld2DisposableWorkspaceCreatorModuleForTests,
} from '../world2-disposable-workspace-creator/index.js';
import type { World2DisposableWorkspaceCreatorAssessment } from '../world2-disposable-workspace-creator/world2-disposable-workspace-creator-types.js';
import {
  DEFAULT_INSTANTIATION_MODE,
  MAX_INSTANTIATOR_REASONS,
  WORLD2_INSTANTIATOR_CACHE_KEY_PREFIX,
  WORLD2_INSTANTIATOR_CORE_QUESTION,
  WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_OWNER_MODULE,
  WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PASS_TOKEN,
  WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PHASE,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  pathMatchesPatterns,
} from './world2-disposable-workspace-instantiator-registry.js';
import {
  recordWorld2DisposableWorkspaceInstantiatorAssessment,
  resetWorld2DisposableWorkspaceInstantiatorHistoryForTests,
} from './world2-disposable-workspace-instantiator-history.js';
import { buildWorld2DisposableWorkspaceInstantiatorReportMarkdown } from './world2-disposable-workspace-instantiator-report-builder.js';
import type {
  AssessWorld2DisposableWorkspaceInstantiatorInput,
  InstantiationModeContext,
  World2DisposableWorkspaceInstantiatorAssessment,
  World2DisposableWorkspaceInstantiatorReport,
  World2DisposableWorkspaceInstantiationOperation,
  World2InstantiatorInputSnapshot,
  World2InstantiationExecutionOverride,
  World2InstantiationMode,
  World2InstantiationResultState,
  World2InstantiationSafetyCheck,
} from './world2-disposable-workspace-instantiator-types.js';

let instantiatorCounter = 0;
let operationCounter = 0;

export function resetWorld2DisposableWorkspaceInstantiatorCounterForTests(): void {
  instantiatorCounter = 0;
  operationCounter = 0;
}

function nextInstantiatorAssessmentId(): string {
  instantiatorCounter += 1;
  return `world2-instantiator-assessment-${instantiatorCounter}`;
}

function nextOperationId(): string {
  operationCounter += 1;
  return `world2-instantiation-operation-${operationCounter}`;
}

function stableCacheKey(instantiatorAssessmentId: string, state: World2InstantiationResultState): string {
  const digest = createHash('sha256')
    .update(
      [WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_OWNER_MODULE, instantiatorAssessmentId, state].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_INSTANTIATOR_CACHE_KEY_PREFIX}:${digest}`;
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
  input: AssessWorld2DisposableWorkspaceInstantiatorInput,
): World2InstantiatorInputSnapshot {
  const creatorAssessment =
    input.creatorAssessment ?? assessWorld2DisposableWorkspaceCreator(input);

  const instantiationGovernanceAssessment =
    creatorAssessment.inputSnapshot.instantiationGovernanceAssessment;
  const materializationAssessment = creatorAssessment.inputSnapshot.materializationAssessment;

  const missingAuthorities: string[] = dedupe([
    ...creatorAssessment.inputSnapshot.missingAuthorities,
    ...(creatorAssessment.creationPlan === null &&
    (creatorAssessment.creationState === 'CREATION_READY' ||
      creatorAssessment.creationState === 'CREATION_READY_WITH_RESTRICTIONS')
      ? ['world2-disposable-workspace-creation-plan']
      : []),
  ]);

  return {
    creatorAssessment,
    materializationAssessment,
    instantiationGovernanceAssessment,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

export function performWorld2InstantiationSafetyChecks(
  snapshot: World2InstantiatorInputSnapshot,
): World2InstantiationSafetyCheck[] {
  const creator = snapshot.creatorAssessment;
  const plan = creator.creationPlan;
  const governance = snapshot.instantiationGovernanceAssessment;
  const plannedRoot = plan?.plannedRoot ?? '';

  const creatorStateEligible =
    creator.creationState === 'CREATION_READY' ||
    creator.creationState === 'CREATION_READY_WITH_RESTRICTIONS';

  const plannedRootIsLive = pathMatchesPatterns(plannedRoot, WORLD2_LIVE_PATH_PATTERNS);
  const plannedRootIsProduction = pathMatchesPatterns(plannedRoot, WORLD2_PRODUCTION_PATH_PATTERNS);

  const disposalPolicyPresent = plan?.disposalPolicy.disposalRequired === true;
  const validationAssetsPresent = (plan?.validationAssets.length ?? 0) > 0;
  const rollbackAssetsPresent = (plan?.rollbackAssets.length ?? 0) > 0;
  const expirationPolicyPresent =
    governance.governanceApproval?.expirationPolicy.maxApprovalDurationMs !== undefined &&
    (governance.governanceApproval?.expirationPolicy.maxInstantiationAttempts ?? 0) > 0;

  return [
    {
      readOnly: true,
      checkId: 'creator-state-eligible',
      label: 'Creator state is CREATION_READY or CREATION_READY_WITH_RESTRICTIONS',
      passed: creatorStateEligible,
      detail: creatorStateEligible
        ? `Creator state ${creator.creationState} eligible.`
        : `Creator state ${creator.creationState} not eligible.`,
    },
    {
      readOnly: true,
      checkId: 'planned-root-not-live',
      label: 'Planned root is not live workspace',
      passed: !plannedRootIsLive,
      detail: plannedRootIsLive
        ? `Live workspace path detected: ${plannedRoot}`
        : 'Planned root is not a live workspace path.',
    },
    {
      readOnly: true,
      checkId: 'planned-root-not-production',
      label: 'Planned root is not production path',
      passed: !plannedRootIsProduction,
      detail: plannedRootIsProduction
        ? `Production path detected: ${plannedRoot}`
        : 'Planned root is not a production path.',
    },
    {
      readOnly: true,
      checkId: 'disposal-policy-present',
      label: 'Disposal policy exists',
      passed: disposalPolicyPresent,
      detail: disposalPolicyPresent ? 'Disposal policy present.' : 'Disposal policy missing.',
    },
    {
      readOnly: true,
      checkId: 'validation-assets-present',
      label: 'Validation assets exist',
      passed: validationAssetsPresent,
      detail: validationAssetsPresent
        ? 'Validation assets present.'
        : 'Validation assets missing.',
    },
    {
      readOnly: true,
      checkId: 'rollback-assets-present',
      label: 'Rollback assets exist',
      passed: rollbackAssetsPresent,
      detail: rollbackAssetsPresent ? 'Rollback assets present.' : 'Rollback assets missing.',
    },
    {
      readOnly: true,
      checkId: 'expiration-policy-present',
      label: 'Expiration policy exists',
      passed: expirationPolicyPresent,
      detail: expirationPolicyPresent
        ? 'Expiration policy present.'
        : 'Expiration policy missing.',
    },
    {
      readOnly: true,
      checkId: 'no-repository-copy',
      label: 'No repository copy performed',
      passed: true,
      detail: 'Repository copy not performed — adapter dry-run only.',
    },
    {
      readOnly: true,
      checkId: 'no-change-set-application',
      label: 'No change set application performed',
      passed: true,
      detail: 'Change set application not performed — adapter dry-run only.',
    },
  ];
}

export function deriveInstantiationEligibilityMode(
  context: InstantiationModeContext,
): World2InstantiationMode {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'BLOCKED';
  }

  if (
    context.creationState === 'INSUFFICIENT_EVIDENCE' ||
    context.materializationState === 'INSUFFICIENT_EVIDENCE' ||
    context.governanceState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'BLOCKED';
  }

  const blockedBySafety =
    context.creationState === 'CREATION_BLOCKED' ||
    context.materializationState === 'BLOCKED' ||
    context.governanceState === 'BLOCKED' ||
    !context.hasCreationPlan ||
    context.plannedRootIsLive ||
    context.plannedRootIsProduction ||
    !context.safetyChecksPassed ||
    context.criticalSafetyFailures > 0;

  if (blockedBySafety) {
    return 'BLOCKED';
  }

  if (
    context.creationState === 'CREATION_READY' &&
    context.materializationState === 'READY' &&
    context.governanceState === 'APPROVED' &&
    context.safetyChecksPassed
  ) {
    return 'REAL_INSTANTIATION_ELIGIBLE';
  }

  if (
    context.creationState === 'CREATION_READY_WITH_RESTRICTIONS' &&
    context.criticalSafetyFailures === 0
  ) {
    return 'SIMULATED_INSTANTIATION';
  }

  if (
    context.creationState === 'NOT_READY' ||
    context.materializationState === 'NOT_READY' ||
    context.governanceState === 'NOT_READY' ||
    !context.hasCreationPlan
  ) {
    return 'BLOCKED';
  }

  return DEFAULT_INSTANTIATION_MODE;
}

function resolveOperationMode(
  eligibilityMode: World2InstantiationMode,
  override: World2InstantiationExecutionOverride | undefined,
): World2InstantiationMode {
  if (eligibilityMode === 'BLOCKED') {
    return 'BLOCKED';
  }

  if (!override) {
    return DEFAULT_INSTANTIATION_MODE;
  }

  if (override === 'REAL_INSTANTIATION' && eligibilityMode === 'REAL_INSTANTIATION_ELIGIBLE') {
    return 'REAL_INSTANTIATION_ELIGIBLE';
  }

  if (
    override === 'SIMULATED_INSTANTIATION' &&
    (eligibilityMode === 'SIMULATED_INSTANTIATION' ||
      eligibilityMode === 'REAL_INSTANTIATION_ELIGIBLE')
  ) {
    return 'SIMULATED_INSTANTIATION';
  }

  return DEFAULT_INSTANTIATION_MODE;
}

export function deriveInstantiationResultState(
  eligibilityMode: World2InstantiationMode,
  operationMode: World2InstantiationMode,
  context: InstantiationModeContext,
): World2InstantiationResultState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.creationState === 'INSUFFICIENT_EVIDENCE' ||
    context.materializationState === 'INSUFFICIENT_EVIDENCE' ||
    context.governanceState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    eligibilityMode === 'BLOCKED' ||
    operationMode === 'BLOCKED' ||
    context.creationState === 'CREATION_BLOCKED'
  ) {
    return 'INSTANTIATION_BLOCKED';
  }

  if (
    context.creationState === 'NOT_READY' ||
    context.materializationState === 'NOT_READY' ||
    context.governanceState === 'NOT_READY' ||
    !context.hasCreationPlan
  ) {
    return 'NOT_READY';
  }

  if (
    operationMode === 'SIMULATED_INSTANTIATION' ||
    eligibilityMode === 'SIMULATED_INSTANTIATION'
  ) {
    return 'INSTANTIATION_SIMULATED';
  }

  if (
    operationMode === 'DRY_RUN' ||
    operationMode === 'REAL_INSTANTIATION_ELIGIBLE' ||
    eligibilityMode === 'REAL_INSTANTIATION_ELIGIBLE'
  ) {
    return 'INSTANTIATION_READY';
  }

  return 'INSTANTIATION_BLOCKED';
}

function buildInstantiationOperation(
  snapshot: World2InstantiatorInputSnapshot,
  eligibilityMode: World2InstantiationMode,
  operationMode: World2InstantiationMode,
  resultState: World2InstantiationResultState,
  safetyChecks: World2InstantiationSafetyCheck[],
): World2DisposableWorkspaceInstantiationOperation | null {
  const plan = snapshot.creatorAssessment.creationPlan;
  const operationEligible =
    resultState === 'INSTANTIATION_READY' || resultState === 'INSTANTIATION_SIMULATED';

  if (!operationEligible || !plan) {
    return null;
  }

  return {
    readOnly: true,
    operationId: nextOperationId(),
    workspaceId: plan.workspaceId,
    plannedRoot: plan.plannedRoot,
    directoriesToCreate: [...plan.plannedDirectories],
    filesToPrepare: [...plan.plannedFiles],
    artifactsToPrepare: [...plan.plannedArtifacts],
    validationAssetsToPrepare: [...plan.validationAssets],
    rollbackAssetsToPrepare: [...plan.rollbackAssets],
    safetyChecks,
    mode: operationMode,
    resultState,
    eligibilityMode,
    repositoryCopyPerformed: false,
    changeSetApplicationPerformed: false,
  };
}

function buildInstantiatorReasons(
  snapshot: World2InstantiatorInputSnapshot,
  resultState: World2InstantiationResultState,
  safetyChecks: World2InstantiationSafetyCheck[],
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];
  const creator = snapshot.creatorAssessment;

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...creator.blockingReasons);
  warningReasons.push(...creator.warningReasons);
  warningReasons.push(...snapshot.instantiationGovernanceAssessment.warningReasons);
  warningReasons.push(...snapshot.materializationAssessment.warningReasons);

  for (const check of safetyChecks) {
    if (!check.passed) {
      blockingReasons.push(`${check.label}: ${check.detail}`);
    }
  }

  if (resultState === 'INSTANTIATION_BLOCKED') {
    blockingReasons.push('Disposable workspace instantiation BLOCKED.');
  }

  if (resultState === 'INSTANTIATION_SIMULATED') {
    warningReasons.push('Instantiation simulated only — no real repository copy or change set application.');
  }

  if (resultState === 'INSTANTIATION_READY') {
    warningReasons.push('Default dry-run mode — no repository copy or change set application yet.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_INSTANTIATOR_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_INSTANTIATOR_REASONS),
  };
}

export function assessWorld2DisposableWorkspaceInstantiator(
  input: AssessWorld2DisposableWorkspaceInstantiatorInput = {},
): World2DisposableWorkspaceInstantiatorAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const creator = inputSnapshot.creatorAssessment;
  const plan = creator.creationPlan;
  const plannedRoot = plan?.plannedRoot ?? '';

  const safetyChecks = performWorld2InstantiationSafetyChecks(inputSnapshot);
  const safetyChecksPassed = safetyChecks.every((check) => check.passed);
  const criticalSafetyFailures = safetyChecks.filter((check) => !check.passed).length;

  const modeContext: InstantiationModeContext = {
    missingAuthorities: inputSnapshot.missingAuthorities,
    creationState: creator.creationState,
    materializationState: inputSnapshot.materializationAssessment.materializationState,
    governanceState: inputSnapshot.instantiationGovernanceAssessment.approvalState,
    safetyChecksPassed,
    criticalSafetyFailures,
    hasCreationPlan: plan !== null,
    plannedRootIsLive: pathMatchesPatterns(plannedRoot, WORLD2_LIVE_PATH_PATTERNS),
    plannedRootIsProduction: pathMatchesPatterns(plannedRoot, WORLD2_PRODUCTION_PATH_PATTERNS),
  };

  const eligibilityMode = deriveInstantiationEligibilityMode(modeContext);
  const operationMode = resolveOperationMode(eligibilityMode, input.executionModeOverride);
  const resultState = deriveInstantiationResultState(eligibilityMode, operationMode, modeContext);
  const reasons = buildInstantiatorReasons(inputSnapshot, resultState, safetyChecks);
  const instantiatorAssessmentId = nextInstantiatorAssessmentId();

  const assessment: World2DisposableWorkspaceInstantiatorAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_INSTANTIATOR_CORE_QUESTION,
    instantiatorAssessmentId,
    workspaceId: creator.workspaceId,
    resultState,
    inputSnapshot,
    instantiationOperation: buildInstantiationOperation(
      inputSnapshot,
      eligibilityMode,
      operationMode,
      resultState,
      safetyChecks,
    ),
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    cacheKey: stableCacheKey(instantiatorAssessmentId, resultState),
  };

  recordWorld2DisposableWorkspaceInstantiatorAssessment(assessment);
  return assessment;
}

export function buildWorld2DisposableWorkspaceInstantiatorReport(
  assessment: World2DisposableWorkspaceInstantiatorAssessment,
  generatedAt = new Date().toISOString(),
): World2DisposableWorkspaceInstantiatorReport {
  return {
    generatedAt,
    phaseName: WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PHASE,
    purpose:
      'Prepare the real disposable workspace instantiation interface safely — no repository copy or change set application.',
    assessment,
    passToken: WORLD2_DISPOSABLE_WORKSPACE_INSTANTIATOR_PASS_TOKEN,
  };
}

export function buildWorld2DisposableWorkspaceInstantiatorArtifacts(
  input: AssessWorld2DisposableWorkspaceInstantiatorInput = {},
): {
  world2DisposableWorkspaceInstantiatorAssessment: World2DisposableWorkspaceInstantiatorAssessment;
  world2DisposableWorkspaceInstantiatorReportMarkdown: string;
} {
  const world2DisposableWorkspaceInstantiatorAssessment =
    assessWorld2DisposableWorkspaceInstantiator(input);
  const report = buildWorld2DisposableWorkspaceInstantiatorReport(
    world2DisposableWorkspaceInstantiatorAssessment,
  );
  return {
    world2DisposableWorkspaceInstantiatorAssessment,
    world2DisposableWorkspaceInstantiatorReportMarkdown:
      buildWorld2DisposableWorkspaceInstantiatorReportMarkdown(report),
  };
}

export function resetWorld2DisposableWorkspaceInstantiatorModuleForTests(): void {
  resetWorld2DisposableWorkspaceInstantiatorHistoryForTests();
  resetWorld2DisposableWorkspaceInstantiatorCounterForTests();
  resetWorld2DisposableWorkspaceCreatorModuleForTests();
}
