/**
 * World 2 Execution Engine — step modeling and audit authority.
 * Represents, queues, and simulates World 2 steps — never mutates live workspace.
 */

import { createHash } from 'node:crypto';
import type { ExecutionPlan } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import {
  assessWorld2ControlledExecutionRuntime,
  resetWorld2ControlledExecutionRuntimeModuleForTests,
} from '../world2-controlled-execution-runtime/index.js';
import type {
  World2ExecutionContract,
  World2ExecutionState,
  World2RuntimeAssessment,
} from '../world2-controlled-execution-runtime/world2-controlled-execution-runtime-types.js';
import {
  MAX_AUDIT_TRAIL_ENTRIES,
  MAX_ENGINE_REASONS,
  WORLD2_ALLOWED_SCOPE,
  WORLD2_ENGINE_CACHE_KEY_PREFIX,
  WORLD2_ENGINE_CORE_QUESTION,
  WORLD2_EXECUTION_ENGINE_OWNER_MODULE,
  WORLD2_EXECUTION_ENGINE_PASS_TOKEN,
  WORLD2_EXECUTION_ENGINE_PHASE,
  WORLD2_FORBIDDEN_SCOPE,
} from './world2-execution-engine-registry.js';
import {
  buildWorld2ExecutionQueueSnapshot,
  enqueueWorld2ExecutionSteps,
  enforceSimulatedStepCap,
  registerEngineRun,
  resetWorld2ExecutionEngineQueueForTests,
} from './world2-execution-engine-queue.js';
import {
  recordWorld2ExecutionEngineAssessment,
  resetWorld2ExecutionEngineHistoryForTests,
} from './world2-execution-engine-history.js';
import { buildWorld2ExecutionEngineReportMarkdown } from './world2-execution-engine-report-builder.js';
import type {
  AssessWorld2ExecutionEngineInput,
  World2EngineFinalState,
  World2EngineInputSnapshot,
  World2ExecutionAuditEntry,
  World2ExecutionEngineAssessment,
  World2ExecutionEngineReport,
  World2ExecutionMode,
  World2ExecutionStep,
  World2ExecutionStepStatus,
} from './world2-execution-engine-types.js';

let engineRunCounter = 0;
let auditCounter = 0;

export function resetWorld2ExecutionEngineCounterForTests(): void {
  engineRunCounter = 0;
  auditCounter = 0;
}

function nextEngineRunId(): string {
  engineRunCounter += 1;
  return `world2-engine-run-${engineRunCounter}`;
}

function nextAuditId(): string {
  auditCounter += 1;
  return `world2-engine-audit-${auditCounter}`;
}

function stableCacheKey(engineRunId: string, mode: World2ExecutionMode): string {
  const digest = createHash('sha256')
    .update([WORLD2_EXECUTION_ENGINE_OWNER_MODULE, engineRunId, mode].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_ENGINE_CACHE_KEY_PREFIX}:${digest}`;
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

function resolveInputSnapshot(input: AssessWorld2ExecutionEngineInput): World2EngineInputSnapshot {
  const runtimeAssessment =
    input.runtimeAssessment ?? assessWorld2ControlledExecutionRuntime(input);

  const sandboxAssessment = runtimeAssessment.inputSnapshot.sandboxAssessment;
  const plan = runtimeAssessment.inputSnapshot.plan;
  const executionContract = runtimeAssessment.executionContract;

  const missingAuthorities: string[] = [...runtimeAssessment.inputSnapshot.missingAuthorities];
  if (!executionContract && runtimeAssessment.executionState === 'READY_FOR_WORLD2') {
    missingAuthorities.push('world2-execution-contract');
  }

  return {
    runtimeAssessment,
    sandboxAssessment,
    plan,
    executionContract,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

export interface World2ExecutionModeContext {
  runtimeState: World2ExecutionState;
  executionContract: World2ExecutionContract | null;
  missingAuthorities: string[];
  plan: ExecutionPlan | null;
}

export function deriveWorld2ExecutionMode(context: World2ExecutionModeContext): World2ExecutionMode {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('world2-execution-contract')
  ) {
    return 'BLOCKED';
  }

  if (context.runtimeState === 'INSUFFICIENT_EVIDENCE') {
    return 'BLOCKED';
  }

  if (context.runtimeState === 'BLOCKED') {
    return 'BLOCKED';
  }

  if (!context.executionContract) {
    return 'BLOCKED';
  }

  if (context.runtimeState === 'READY_FOR_WORLD2') {
    return 'SANDBOX_EXECUTION_ELIGIBLE';
  }

  if (context.runtimeState === 'READY_WITH_RESTRICTIONS') {
    return 'SIMULATED_EXECUTION';
  }

  if (context.runtimeState === 'NOT_READY' && context.plan) {
    return 'DRY_RUN';
  }

  return 'BLOCKED';
}

export function deriveWorld2EngineFinalState(
  mode: World2ExecutionMode,
  context: World2ExecutionModeContext,
): World2EngineFinalState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (mode === 'BLOCKED') {
    return context.missingAuthorities.length > 0 ? 'INSUFFICIENT_EVIDENCE' : 'BLOCKED';
  }

  if (mode === 'SANDBOX_EXECUTION_ELIGIBLE') {
    return 'SANDBOX_EXECUTION_ELIGIBLE';
  }

  if (mode === 'SIMULATED_EXECUTION') {
    return 'SIMULATED_EXECUTION';
  }

  if (mode === 'DRY_RUN') {
    return 'DRY_RUN_COMPLETE';
  }

  return 'BLOCKED';
}

function stepStatusForMode(
  mode: World2ExecutionMode,
  index: number,
  total: number,
): World2ExecutionStepStatus {
  switch (mode) {
    case 'SANDBOX_EXECUTION_ELIGIBLE':
      return index === total - 1 ? 'READY' : 'QUEUED';
    case 'SIMULATED_EXECUTION':
      return 'SIMULATED';
    case 'DRY_RUN':
      return 'COMPLETED_DRY_RUN';
    case 'BLOCKED':
    default:
      return 'BLOCKED';
  }
}

function buildExecutionSteps(
  plan: ExecutionPlan,
  contract: World2ExecutionContract | null,
  mode: World2ExecutionMode,
): World2ExecutionStep[] {
  const forbiddenScope = [...WORLD2_FORBIDDEN_SCOPE];
  const allowedScope = contract
    ? dedupe([...WORLD2_ALLOWED_SCOPE, ...contract.allowedActions.slice(0, 4)])
    : [...WORLD2_ALLOWED_SCOPE];

  const planSteps: World2ExecutionStep[] = plan.steps.map((step, index) => ({
    readOnly: true,
    stepId: `w2-step-${step.stepId}`,
    planId: plan.planId,
    actionType: 'PLAN_STEP',
    description: step.description || step.title,
    allowedScope,
    forbiddenScope,
    expectedResult: plan.expectedOutcome,
    validationRequired: index === plan.steps.length - 1,
    rollbackRequired: plan.rollbackPlan.rollbackTrigger.trim().length > 0,
    status: stepStatusForMode(mode, index, plan.steps.length + 2),
  }));

  const validationStep: World2ExecutionStep = {
    readOnly: true,
    stepId: `w2-step-validation-${plan.planId}`,
    planId: plan.planId,
    actionType: 'VALIDATION_STEP',
    description: plan.verificationPlan.validationStrategy,
    allowedScope,
    forbiddenScope,
    expectedResult: 'Validation signals collected without live mutation',
    validationRequired: true,
    rollbackRequired: false,
    status: stepStatusForMode(mode, plan.steps.length, plan.steps.length + 2),
  };

  const rollbackStep: World2ExecutionStep = {
    readOnly: true,
    stepId: `w2-step-rollback-${plan.planId}`,
    planId: plan.planId,
    actionType: 'ROLLBACK_CHECK',
    description: plan.rollbackPlan.rollbackMethod,
    allowedScope,
    forbiddenScope,
    expectedResult: plan.rollbackPlan.rollbackSuccessCriteria,
    validationRequired: true,
    rollbackRequired: true,
    status: stepStatusForMode(mode, plan.steps.length + 1, plan.steps.length + 2),
  };

  return [...planSteps, validationStep, rollbackStep];
}

function buildAuditTrail(
  engineRunId: string,
  steps: World2ExecutionStep[],
  plan: ExecutionPlan,
  contract: World2ExecutionContract | null,
  mode: World2ExecutionMode,
): World2ExecutionAuditEntry[] {
  const entries: World2ExecutionAuditEntry[] = [];

  for (const step of steps) {
    const whyAllowed =
      mode === 'SANDBOX_EXECUTION_ELIGIBLE'
        ? 'World 2 runtime READY_FOR_WORLD2 with valid execution contract'
        : mode === 'SIMULATED_EXECUTION'
          ? 'World 2 runtime READY_WITH_RESTRICTIONS — simulation only'
          : mode === 'DRY_RUN'
            ? 'Dry-run preview — no sandbox execution authorized'
            : 'Step blocked — execution not authorized';

    entries.push({
      readOnly: true,
      auditId: nextAuditId(),
      engineRunId,
      stepId: step.stepId,
      sourcePlanId: plan.planId,
      sourceContractId: contract?.contractId ?? null,
      whyAllowed,
      forbiddenScope: [...step.forbiddenScope],
      requiredValidation: step.validationRequired
        ? dedupe([
            plan.verificationPlan.validationStrategy,
            plan.verificationPlan.executionProofStrategy,
          ])
        : [],
      recordedAt: new Date().toISOString(),
    });
  }

  return entries.slice(0, MAX_AUDIT_TRAIL_ENTRIES);
}

function buildBlockersAndWarnings(
  snapshot: World2EngineInputSnapshot,
  mode: World2ExecutionMode,
): { blockers: string[]; warnings: string[]; nextRequiredValidation: string[] } {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const nextRequiredValidation: string[] = [];
  const runtime = snapshot.runtimeAssessment;
  const plan = snapshot.plan;

  if (snapshot.missingAuthorities.length > 0) {
    blockers.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockers.push(`Missing authority: ${missing}`);
    }
  }

  blockers.push(...runtime.blockingReasons);
  warnings.push(...runtime.warningReasons);

  if (!snapshot.executionContract) {
    blockers.push('World 2 execution contract missing — engine blocked.');
  }

  if (mode === 'BLOCKED') {
    blockers.push('Execution mode BLOCKED — no World 2 steps may run.');
  }

  if (mode === 'SIMULATED_EXECUTION') {
    warnings.push('Restricted runtime — simulated execution only, not sandbox-eligible.');
  }

  if (mode === 'DRY_RUN') {
    warnings.push('Dry-run mode — steps modeled only, no sandbox execution.');
  }

  if (plan) {
    nextRequiredValidation.push(plan.verificationPlan.validationStrategy);
    nextRequiredValidation.push(plan.verificationPlan.executionProofStrategy);
    nextRequiredValidation.push(plan.verificationPlan.founderTestStrategy);
    nextRequiredValidation.push(plan.verificationPlan.acceptanceStrategy);
  }

  if (snapshot.executionContract) {
    nextRequiredValidation.push(...snapshot.executionContract.verificationRequirements.slice(0, 4));
  }

  return {
    blockers: dedupe(blockers).slice(0, MAX_ENGINE_REASONS),
    warnings: dedupe(warnings).slice(0, MAX_ENGINE_REASONS),
    nextRequiredValidation: dedupe(nextRequiredValidation).slice(0, MAX_ENGINE_REASONS),
  };
}

export function assessWorld2ExecutionEngine(
  input: AssessWorld2ExecutionEngineInput = {},
): World2ExecutionEngineAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const runtime = inputSnapshot.runtimeAssessment;
  const plan = inputSnapshot.plan;

  const modeContext: World2ExecutionModeContext = {
    runtimeState: runtime.executionState,
    executionContract: inputSnapshot.executionContract,
    missingAuthorities: inputSnapshot.missingAuthorities,
    plan,
  };

  const executionMode = deriveWorld2ExecutionMode(modeContext);
  const finalState = deriveWorld2EngineFinalState(executionMode, modeContext);
  const engineRunId = nextEngineRunId();

  registerEngineRun(engineRunId);

  let steps: World2ExecutionStep[] = [];
  if (plan) {
    steps = buildExecutionSteps(plan, inputSnapshot.executionContract, executionMode);
    const enqueued = enqueueWorld2ExecutionSteps(engineRunId, steps);
    steps = enqueued.steps;
    if (enqueued.truncated) {
      // queue cap applied
    }
    const capped = enforceSimulatedStepCap(steps);
    steps = capped.steps;
  }

  const auditTrail = plan
    ? buildAuditTrail(
        engineRunId,
        steps,
        plan,
        inputSnapshot.executionContract,
        executionMode,
      )
    : [];

  const reasons = buildBlockersAndWarnings(inputSnapshot, executionMode);
  const queueSnapshot = buildWorld2ExecutionQueueSnapshot(steps);

  const assessment: World2ExecutionEngineAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_ENGINE_CORE_QUESTION,
    engineRunId,
    workspaceId: runtime.workspaceId,
    executionMode,
    inputSnapshot,
    steps,
    blockers: reasons.blockers,
    warnings: reasons.warnings,
    auditTrail,
    queueSnapshot,
    nextRequiredValidation: reasons.nextRequiredValidation,
    finalState,
    cacheKey: stableCacheKey(engineRunId, executionMode),
  };

  recordWorld2ExecutionEngineAssessment(assessment);
  return assessment;
}

export function buildWorld2ExecutionEngineReport(
  assessment: World2ExecutionEngineAssessment,
  generatedAt = new Date().toISOString(),
): World2ExecutionEngineReport {
  return {
    generatedAt,
    phaseName: WORLD2_EXECUTION_ENGINE_PHASE,
    purpose:
      'Represent, queue, simulate, and audit World 2 execution steps inside an isolated workspace contract.',
    assessment,
    passToken: WORLD2_EXECUTION_ENGINE_PASS_TOKEN,
  };
}

export function buildWorld2ExecutionEngineArtifacts(
  input: AssessWorld2ExecutionEngineInput = {},
): {
  world2ExecutionEngineAssessment: World2ExecutionEngineAssessment;
  world2ExecutionEngineReportMarkdown: string;
} {
  const world2ExecutionEngineAssessment = assessWorld2ExecutionEngine(input);
  const report = buildWorld2ExecutionEngineReport(world2ExecutionEngineAssessment);
  return {
    world2ExecutionEngineAssessment,
    world2ExecutionEngineReportMarkdown: buildWorld2ExecutionEngineReportMarkdown(report),
  };
}

export function resetWorld2ExecutionEngineModuleForTests(): void {
  resetWorld2ExecutionEngineHistoryForTests();
  resetWorld2ExecutionEngineQueueForTests();
  resetWorld2ExecutionEngineCounterForTests();
  resetWorld2ControlledExecutionRuntimeModuleForTests();
}
