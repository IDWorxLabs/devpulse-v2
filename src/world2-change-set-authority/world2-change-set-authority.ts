/**
 * World 2 Change Set Authority — change set modeling and safety authority.
 * Defines explicit allowed changes only — never executes or mutates files.
 */

import { createHash } from 'node:crypto';
import type { ExecutionPlan, ExecutionPlanRiskLevel } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import {
  assessWorld2DisposableWorkspace,
  resetWorld2DisposableWorkspaceModuleForTests,
} from '../world2-disposable-workspace/index.js';
import type { World2DisposableWorkspaceAssessment } from '../world2-disposable-workspace/world2-disposable-workspace-types.js';
import { WORLD2_FORBIDDEN_PATHS } from '../world2-disposable-workspace/world2-disposable-workspace-registry.js';
import {
  MAX_CHANGE_SET_REASONS,
  MAX_DELETE_OPERATIONS,
  MAX_OPERATIONS_PER_CHANGE_SET,
  WORLD2_BLOCKED_PATH_PATTERNS,
  WORLD2_CHANGE_SET_AUTHORITY_OWNER_MODULE,
  WORLD2_CHANGE_SET_AUTHORITY_PASS_TOKEN,
  WORLD2_CHANGE_SET_AUTHORITY_PHASE,
  WORLD2_CHANGE_SET_CACHE_KEY_PREFIX,
  WORLD2_CHANGE_SET_CORE_QUESTION,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  resolveWorld2TargetPath,
} from './world2-change-set-registry.js';
import {
  recordWorld2ChangeSetAssessment,
  resetWorld2ChangeSetHistoryForTests,
} from './world2-change-set-history.js';
import { buildWorld2ChangeSetReportMarkdown } from './world2-change-set-report-builder.js';
import type {
  AssessWorld2ChangeSetAuthorityInput,
  ChangeOperationSafetyInput,
  ChangeOperationSafetyResult,
  ChangeSetImpactInput,
  World2ChangeImpactLevel,
  World2ChangeOperation,
  World2ChangeOperationType,
  World2ChangeSet,
  World2ChangeSetAssessment,
  World2ChangeSetEligibilityState,
  World2ChangeSetInputSnapshot,
  World2ChangeSetReport,
} from './world2-change-set-types.js';

let assessmentCounter = 0;
let operationCounter = 0;

export function resetWorld2ChangeSetAuthorityCounterForTests(): void {
  assessmentCounter = 0;
  operationCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `world2-change-set-assessment-${assessmentCounter}`;
}

function nextChangeSetId(): string {
  return `world2-change-set-${assessmentCounter}`;
}

function nextOperationId(): string {
  operationCounter += 1;
  return `world2-change-op-${operationCounter}`;
}

function stableCacheKey(assessmentId: string, state: World2ChangeSetEligibilityState): string {
  const digest = createHash('sha256')
    .update([WORLD2_CHANGE_SET_AUTHORITY_OWNER_MODULE, assessmentId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_CHANGE_SET_CACHE_KEY_PREFIX}:${digest}`;
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

function isDeleteOperation(type: World2ChangeOperationType): boolean {
  return type === 'DELETE_FILE' || type === 'DELETE_DIRECTORY';
}

function matchesForbiddenPath(
  targetPath: string,
  extraForbidden: readonly string[] = [],
): string | null {
  const normalized = targetPath.trim();
  if (!normalized) {
    return 'Undefined or empty target path.';
  }

  for (const pattern of WORLD2_BLOCKED_PATH_PATTERNS) {
    if (pattern.test(normalized)) {
      return `Target matches blocked path pattern: ${pattern.source}`;
    }
  }

  for (const forbidden of [...WORLD2_FORBIDDEN_PATHS, ...extraForbidden]) {
    if (normalized.startsWith(forbidden) || normalized.includes(forbidden)) {
      return `Target matches forbidden workspace path: ${forbidden}`;
    }
  }

  for (const pattern of WORLD2_PRODUCTION_PATH_PATTERNS) {
    if (pattern.test(normalized)) {
      return `Target matches production path pattern: ${pattern.source}`;
    }
  }

  if (!normalized.startsWith('/world2/')) {
    return 'Target outside World 2 disposable scope.';
  }

  return null;
}

export function evaluateChangeOperationSafety(
  input: ChangeOperationSafetyInput,
): ChangeOperationSafetyResult {
  const forbiddenPaths = input.forbiddenPaths ?? WORLD2_FORBIDDEN_PATHS;
  const pathBlock = matchesForbiddenPath(input.targetPath, forbiddenPaths);

  if (pathBlock) {
    return { allowed: false, blockReason: pathBlock };
  }

  if (isDeleteOperation(input.operationType)) {
    const deleteCount = input.deleteCountInSet ?? 0;
    if (deleteCount > MAX_DELETE_OPERATIONS) {
      return {
        allowed: false,
        blockReason: `Unbounded delete operations — exceeds max ${MAX_DELETE_OPERATIONS}.`,
      };
    }
  }

  return { allowed: true, blockReason: null };
}

export function computeChangeSetImpactAnalysis(input: ChangeSetImpactInput): World2ChangeImpactLevel {
  const opCount = input.operations.length;
  const deleteCount = input.operations.filter((op) => isDeleteOperation(op.operationType)).length;
  const blockedCount = input.operations.filter((op) => !op.allowed).length;
  const scopeCount = new Set(input.operations.map((op) => op.targetPath)).size;

  if (blockedCount > 0 || input.planRiskLevel === 'CRITICAL') {
    return 'CRITICAL';
  }

  if (
    deleteCount >= MAX_DELETE_OPERATIONS ||
    input.planRiskLevel === 'HIGH' ||
    (input.rollbackComplexity >= 3 && input.planRiskLevel === 'HIGH') ||
    opCount > 12
  ) {
    return 'HIGH';
  }

  if (
    deleteCount >= 1 ||
    input.planRiskLevel === 'MEDIUM' ||
    opCount > 5 ||
    scopeCount > 4 ||
    (input.rollbackComplexity >= 3 && input.planRiskLevel === 'MEDIUM')
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
}

export interface ChangeSetEligibilityContext {
  workspaceState: World2DisposableWorkspaceAssessment['workspaceState'];
  missingAuthorities: string[];
  blockedOperationCount: number;
  estimatedImpact: World2ChangeImpactLevel;
  hasChangeSet: boolean;
}

export function deriveChangeSetEligibilityState(
  context: ChangeSetEligibilityContext,
): World2ChangeSetEligibilityState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    !context.hasChangeSet ||
    context.workspaceState === 'BLOCKED' ||
    context.workspaceState === 'INSUFFICIENT_EVIDENCE' ||
    context.blockedOperationCount > 0 ||
    context.estimatedImpact === 'CRITICAL'
  ) {
    return 'BLOCKED';
  }

  if (
    context.workspaceState === 'READY_WITH_WARNINGS' ||
    context.estimatedImpact === 'HIGH'
  ) {
    return 'READY_WITH_WARNINGS';
  }

  if (context.workspaceState === 'READY') {
    return 'READY';
  }

  return 'BLOCKED';
}

function resolveInputSnapshot(
  input: AssessWorld2ChangeSetAuthorityInput,
): World2ChangeSetInputSnapshot {
  const disposableWorkspaceAssessment =
    input.disposableWorkspaceAssessment ?? assessWorld2DisposableWorkspace(input);

  const engineAssessment = disposableWorkspaceAssessment.inputSnapshot.engineAssessment;
  const plan = engineAssessment.inputSnapshot.plan;

  const missingAuthorities: string[] = dedupe([
    ...disposableWorkspaceAssessment.inputSnapshot.missingAuthorities,
    ...engineAssessment.inputSnapshot.missingAuthorities,
  ]);

  if (!disposableWorkspaceAssessment.workspaceContract) {
    if (
      disposableWorkspaceAssessment.workspaceState === 'READY' ||
      disposableWorkspaceAssessment.workspaceState === 'READY_WITH_WARNINGS'
    ) {
      missingAuthorities.push('world2-workspace-contract');
    }
  }

  return {
    disposableWorkspaceAssessment,
    engineAssessment,
    plan,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

function operationTypeForPlanStep(
  plan: ExecutionPlan,
  stepIndex: number,
): World2ChangeOperationType {
  if (plan.planType === 'ROLLBACK_PLAN') {
    return stepIndex === 0 ? 'NO_CHANGE' : 'MODIFY_FILE';
  }
  if (plan.planType === 'VALIDATION_PLAN' || plan.planType === 'RETEST_PLAN') {
    return 'NO_CHANGE';
  }
  if (stepIndex === 0) {
    return 'NO_CHANGE';
  }
  if (plan.planType === 'FIX_PLAN' || plan.planType === 'REFACTOR_PLAN') {
    return stepIndex === plan.steps.length - 1 ? 'MODIFY_FILE' : 'CREATE_FILE';
  }
  return 'NO_CHANGE';
}

function buildChangeOperations(
  plan: ExecutionPlan,
  workspaceId: string,
  forbiddenPaths: readonly string[],
): World2ChangeOperation[] {
  const operations: World2ChangeOperation[] = [];
  let deleteCount = 0;

  for (let i = 0; i < plan.steps.length; i += 1) {
    const step = plan.steps[i];
    const operationType = operationTypeForPlanStep(plan, i);
    const targetPath = resolveWorld2TargetPath(
      workspaceId,
      `src/fix-targets/${step.stepId}.ts`,
    );

    if (isDeleteOperation(operationType)) {
      deleteCount += 1;
    }

    const safety = evaluateChangeOperationSafety({
      operationType,
      targetPath,
      forbiddenPaths,
      deleteCountInSet: deleteCount,
    });

    operations.push({
      readOnly: true,
      operationId: nextOperationId(),
      operationType,
      targetPath,
      reason: step.description || step.title,
      allowed: safety.allowed,
      requiresVerification: operationType !== 'NO_CHANGE',
      requiresRollback: plan.rollbackPlan.rollbackTrigger.trim().length > 0,
      riskLevel: plan.riskLevel,
      blockReason: safety.blockReason,
    });
  }

  operations.push({
    readOnly: true,
    operationId: nextOperationId(),
    operationType: 'NO_CHANGE',
    targetPath: resolveWorld2TargetPath(workspaceId, 'audit/validation-checkpoint.json'),
    reason: plan.verificationPlan.validationStrategy,
    allowed: true,
    requiresVerification: true,
    requiresRollback: false,
    riskLevel: plan.riskLevel,
    blockReason: null,
  });

  return operations.slice(0, MAX_OPERATIONS_PER_CHANGE_SET);
}

function buildChangeSet(
  plan: ExecutionPlan,
  workspaceId: string,
  forbiddenPaths: readonly string[],
): World2ChangeSet {
  const operations = buildChangeOperations(plan, workspaceId, forbiddenPaths);
  const rollbackComplexity =
    (plan.rollbackPlan.rollbackTrigger ? 1 : 0) +
    (plan.rollbackPlan.rollbackMethod ? 1 : 0) +
    (plan.rollbackPlan.rollbackSuccessCriteria ? 1 : 0);

  const estimatedImpact = computeChangeSetImpactAnalysis({
    operations,
    planRiskLevel: plan.riskLevel,
    rollbackComplexity,
  });

  return {
    readOnly: true,
    changeSetId: nextChangeSetId(),
    workspaceId,
    sourcePlanId: plan.planId,
    operations,
    riskLevel: plan.riskLevel,
    estimatedImpact,
    verificationRequirements: dedupe([
      plan.verificationPlan.validationStrategy,
      plan.verificationPlan.executionProofStrategy,
      plan.verificationPlan.founderTestStrategy,
      plan.verificationPlan.acceptanceStrategy,
    ]),
    rollbackRequirements: dedupe([
      plan.rollbackPlan.rollbackTrigger,
      plan.rollbackPlan.rollbackMethod,
      plan.rollbackPlan.rollbackSuccessCriteria,
    ]),
  };
}

function buildReasons(
  snapshot: World2ChangeSetInputSnapshot,
  eligibilityState: World2ChangeSetEligibilityState,
  blockedOperations: World2ChangeOperation[],
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];
  const workspace = snapshot.disposableWorkspaceAssessment;

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...workspace.blockingReasons);
  warningReasons.push(...workspace.warningReasons);

  for (const op of blockedOperations) {
    if (op.blockReason) {
      blockingReasons.push(`${op.operationType} blocked for ${op.targetPath}: ${op.blockReason}`);
    }
  }

  if (eligibilityState === 'READY_WITH_WARNINGS') {
    warningReasons.push('Change set allowed with warnings — elevated verification required.');
  }

  if (eligibilityState === 'BLOCKED') {
    blockingReasons.push('Change set BLOCKED — no World 2 file changes authorized.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_CHANGE_SET_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_CHANGE_SET_REASONS),
  };
}

export function assessWorld2ChangeSetAuthority(
  input: AssessWorld2ChangeSetAuthorityInput = {},
): World2ChangeSetAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const workspace = inputSnapshot.disposableWorkspaceAssessment;
  const plan = inputSnapshot.plan;
  const contract = workspace.workspaceContract;
  const workspaceId =
    contract?.workspaceId ?? workspace.inputSnapshot.runtimeAssessment.workspaceId ?? 'world2-unassigned';

  let changeSet: World2ChangeSet | null = null;
  if (plan && (workspace.workspaceState === 'READY' || workspace.workspaceState === 'READY_WITH_WARNINGS')) {
    changeSet = buildChangeSet(
      plan,
      workspaceId,
      contract?.forbiddenPaths ?? [...WORLD2_FORBIDDEN_PATHS],
    );
  }

  const blockedOperations = changeSet?.operations.filter((op) => !op.allowed) ?? [];
  const estimatedImpact = changeSet?.estimatedImpact ?? 'CRITICAL';

  const eligibilityState = deriveChangeSetEligibilityState({
    workspaceState: workspace.workspaceState,
    missingAuthorities: inputSnapshot.missingAuthorities,
    blockedOperationCount: blockedOperations.length,
    estimatedImpact,
    hasChangeSet: changeSet !== null,
  });

  const reasons = buildReasons(inputSnapshot, eligibilityState, blockedOperations);
  const assessmentId = nextAssessmentId();

  const assessment: World2ChangeSetAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_CHANGE_SET_CORE_QUESTION,
    assessmentId,
    eligibilityState,
    inputSnapshot,
    changeSet,
    blockedOperations,
    warningReasons: reasons.warningReasons,
    blockingReasons: reasons.blockingReasons,
    cacheKey: stableCacheKey(assessmentId, eligibilityState),
  };

  recordWorld2ChangeSetAssessment(assessment);
  return assessment;
}

export function buildWorld2ChangeSetReport(
  assessment: World2ChangeSetAssessment,
  generatedAt = new Date().toISOString(),
): World2ChangeSetReport {
  return {
    generatedAt,
    phaseName: WORLD2_CHANGE_SET_AUTHORITY_PHASE,
    purpose:
      'Define, validate, and govern all proposed World 2 file changes before any disposable workspace is populated.',
    assessment,
    passToken: WORLD2_CHANGE_SET_AUTHORITY_PASS_TOKEN,
  };
}

export function buildWorld2ChangeSetArtifacts(
  input: AssessWorld2ChangeSetAuthorityInput = {},
): {
  world2ChangeSetAssessment: World2ChangeSetAssessment;
  world2ChangeSetReportMarkdown: string;
} {
  const world2ChangeSetAssessment = assessWorld2ChangeSetAuthority(input);
  const report = buildWorld2ChangeSetReport(world2ChangeSetAssessment);
  return {
    world2ChangeSetAssessment,
    world2ChangeSetReportMarkdown: buildWorld2ChangeSetReportMarkdown(report),
  };
}

export function resetWorld2ChangeSetAuthorityModuleForTests(): void {
  resetWorld2ChangeSetHistoryForTests();
  resetWorld2ChangeSetAuthorityCounterForTests();
  resetWorld2DisposableWorkspaceModuleForTests();
}
