/**
 * World 2 Controlled Execution Runtime — execution authorization authority.
 * Authorizes World 2 entry only — never executes or mutates live workspace.
 */

import { createHash } from 'node:crypto';
import { assessAutonomousBuilderExecutionSandbox } from '../autonomous-builder-execution-sandbox/index.js';
import { resetAutonomousBuilderExecutionSandboxModuleForTests } from '../autonomous-builder-execution-sandbox/index.js';
import type { ExecutionPlan } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import type { SandboxExecutionAssessment } from '../autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-types.js';
import {
  WORLD2_ALLOWED_ACTIONS,
  WORLD2_CACHE_KEY_PREFIX,
  WORLD2_CONTROLLED_EXECUTION_RUNTIME_OWNER_MODULE,
  WORLD2_CONTROLLED_EXECUTION_RUNTIME_PASS_TOKEN,
  WORLD2_CONTROLLED_EXECUTION_RUNTIME_PHASE,
  WORLD2_CORE_QUESTION,
  WORLD2_FORBIDDEN_ACTIONS,
  WORLD2_TERMINATION_CONDITIONS,
  MAX_WORLD2_REASONS,
  buildWorld2ResourceLimits,
} from './world2-controlled-execution-runtime-registry.js';
import {
  recordWorld2RuntimeAssessment,
  resetWorld2ControlledExecutionRuntimeHistoryForTests,
} from './world2-controlled-execution-runtime-history.js';
import { buildWorld2ControlledExecutionRuntimeReportMarkdown } from './world2-controlled-execution-runtime-report-builder.js';
import type {
  AssessWorld2ControlledExecutionRuntimeInput,
  World2ExecutionContract,
  World2ExecutionState,
  World2InputSnapshot,
  World2RuntimeAssessment,
  World2RuntimeReport,
  World2TerminationAssessment,
  World2TerminationDecision,
} from './world2-controlled-execution-runtime-types.js';

let runtimeCounter = 0;
let workspaceCounter = 0;

export function resetWorld2ControlledExecutionRuntimeCounterForTests(): void {
  runtimeCounter = 0;
  workspaceCounter = 0;
}

function nextRuntimeId(): string {
  runtimeCounter += 1;
  return `world2-runtime-${runtimeCounter}`;
}

function nextWorkspaceId(): string {
  workspaceCounter += 1;
  return `world2-ws-${workspaceCounter}`;
}

function stableCacheKey(runtimeId: string, state: World2ExecutionState): string {
  const digest = createHash('sha256')
    .update([WORLD2_CONTROLLED_EXECUTION_RUNTIME_OWNER_MODULE, runtimeId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_CACHE_KEY_PREFIX}:${digest}`;
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

function hasVerificationPlan(plan: ExecutionPlan): boolean {
  const vp = plan.verificationPlan;
  return (
    vp.validationStrategy.trim().length > 0 &&
    vp.executionProofStrategy.trim().length > 0 &&
    vp.founderTestStrategy.trim().length > 0 &&
    vp.acceptanceStrategy.trim().length > 0
  );
}

function hasRollbackPlan(plan: ExecutionPlan): boolean {
  const rp = plan.rollbackPlan;
  return (
    rp.rollbackTrigger.trim().length > 0 &&
    rp.rollbackMethod.trim().length > 0 &&
    rp.rollbackSuccessCriteria.trim().length > 0
  );
}

function resolveInputSnapshot(
  input: AssessWorld2ControlledExecutionRuntimeInput,
): World2InputSnapshot {
  const sandboxAssessment =
    input.sandboxAssessment ?? assessAutonomousBuilderExecutionSandbox(input);

  const executionPlannerAssessment = sandboxAssessment.inputSnapshot.executionPlannerAssessment;
  const repairLoopAssessment = sandboxAssessment.inputSnapshot.repairLoopAssessment;
  const founderAcceptanceAssessment = sandboxAssessment.inputSnapshot.founderAcceptanceAssessment;

  const missingAuthorities: string[] = [...sandboxAssessment.inputSnapshot.missingAuthorities];
  if (!sandboxAssessment.executionContract && sandboxAssessment.eligibilityState === 'ELIGIBLE') {
    missingAuthorities.push('sandbox-execution-contract');
  }

  return {
    sandboxAssessment,
    executionPlannerAssessment,
    repairLoopAssessment,
    founderAcceptanceAssessment,
    plan: sandboxAssessment.inputSnapshot.plan,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

export interface World2ExecutionContext {
  sandboxAssessment: SandboxExecutionAssessment;
  plan: ExecutionPlan | null;
  planExecutable: boolean;
  missingAuthorities: string[];
  founderAcceptanceBlocked: boolean;
  sandboxContractPresent: boolean;
}

export function deriveWorld2ExecutionState(context: World2ExecutionContext): World2ExecutionState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (context.sandboxAssessment.eligibilityState === 'INSUFFICIENT_EVIDENCE') {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.sandboxAssessment.eligibilityState === 'BLOCKED' ||
    context.sandboxAssessment.eligibilityState === 'NOT_ELIGIBLE'
  ) {
    if (context.sandboxAssessment.eligibilityState === 'NOT_ELIGIBLE') {
      return 'NOT_READY';
    }
    return 'BLOCKED';
  }

  const plan = context.plan;
  if (!plan || !context.planExecutable) {
    return 'NOT_READY';
  }

  const missingRollback = !hasRollbackPlan(plan);
  const missingVerification = !hasVerificationPlan(plan);
  const criticalRisk = plan.riskLevel === 'CRITICAL';

  if (
    criticalRisk ||
    missingRollback ||
    missingVerification ||
    context.founderAcceptanceBlocked
  ) {
    return 'BLOCKED';
  }

  if (context.sandboxAssessment.eligibilityState === 'ELIGIBLE_WITH_WARNINGS') {
    return 'READY_WITH_RESTRICTIONS';
  }

  if (
    context.sandboxAssessment.eligibilityState === 'ELIGIBLE' &&
    context.sandboxContractPresent &&
    !context.founderAcceptanceBlocked
  ) {
    return 'READY_FOR_WORLD2';
  }

  return 'NOT_READY';
}

export interface World2TerminationContext {
  repairLoopAssessment: World2InputSnapshot['repairLoopAssessment'];
  sandboxAssessment: SandboxExecutionAssessment;
  executionState: World2ExecutionState;
  founderAcceptanceBlocked: boolean;
}

export function deriveWorld2TerminationAssessment(
  context: World2TerminationContext,
): World2TerminationAssessment {
  const snapshot = context.repairLoopAssessment.inputSnapshot;
  const proof = snapshot.executionProofAssessment;
  const reasons: string[] = [];

  const attemptBudgetRemaining = Math.max(
    0,
    snapshot.attemptBudget - snapshot.priorAttemptCount,
  );
  const proofFailureDetected =
    proof !== null &&
    (proof.verdict === 'NOT_PROVEN' ||
      proof.verdict === 'INSUFFICIENT_EVIDENCE' ||
      proof.regressionDetected);
  const acceptanceFailureDetected =
    context.founderAcceptanceBlocked ||
    snapshot.founderAcceptanceState === 'NOT_ACCEPTED' ||
    snapshot.founderAcceptanceState === 'BLOCKED';
  const regressionDetected = snapshot.regressionPresent || proof?.regressionDetected === true;
  const loopRiskDetected = snapshot.loopRiskPresent || snapshot.budgetExceeded;

  let decision: World2TerminationDecision = 'CONTINUE';

  if (
    snapshot.budgetExceeded ||
    context.repairLoopAssessment.decision.recommendedAction === 'ESCALATE'
  ) {
    decision = 'ESCALATE';
    reasons.push('Repair attempt budget exhausted or repair loop recommends ESCALATE.');
  } else if (
    context.repairLoopAssessment.decision.recommendedAction === 'STOP' ||
    context.executionState === 'BLOCKED'
  ) {
    decision = 'STOP';
    reasons.push('Repair loop STOP or World 2 entry BLOCKED.');
  } else if (regressionDetected || loopRiskDetected) {
    decision = 'PAUSE';
    if (regressionDetected) reasons.push('Regression detected — pause World 2 execution.');
    if (loopRiskDetected) reasons.push('Loop risk detected — pause before continuing.');
  } else if (proofFailureDetected && attemptBudgetRemaining > 0) {
    decision = 'PAUSE';
    reasons.push('Proof failure with remaining attempt budget — pause for review.');
  } else if (acceptanceFailureDetected) {
    decision = 'PAUSE';
    reasons.push('Acceptance failure detected — pause until founder gate clears.');
  } else if (context.executionState === 'NOT_READY' || context.executionState === 'INSUFFICIENT_EVIDENCE') {
    decision = 'STOP';
    reasons.push('World 2 not ready — stop before any execution attempt.');
  } else if (context.executionState === 'READY_WITH_RESTRICTIONS') {
    decision = 'CONTINUE';
    reasons.push('World 2 ready with restrictions — continue under elevated monitoring.');
  } else if (context.executionState === 'READY_FOR_WORLD2') {
    decision = 'CONTINUE';
    reasons.push('World 2 ready — continue within bounded contract.');
  }

  if (context.sandboxAssessment.eligibilityState === 'BLOCKED') {
    decision = 'STOP';
    reasons.push('Sandbox blocked — World 2 must not proceed.');
  }

  return {
    readOnly: true,
    decision,
    reasons: dedupe(reasons).slice(0, MAX_WORLD2_REASONS),
    attemptBudgetRemaining,
    proofFailureDetected,
    acceptanceFailureDetected,
    regressionDetected,
    loopRiskDetected,
  };
}

function buildReasons(
  snapshot: World2InputSnapshot,
  executionState: World2ExecutionState,
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];
  const sandbox = snapshot.sandboxAssessment;
  const plan = snapshot.plan;

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...sandbox.blockingReasons);
  warningReasons.push(...sandbox.warningReasons);

  if (plan?.riskLevel === 'CRITICAL') {
    blockingReasons.push('Plan risk level is CRITICAL — World 2 entry blocked.');
  }

  if (plan && !hasRollbackPlan(plan)) {
    blockingReasons.push('Rollback strategy missing — World 2 entry blocked.');
  }

  if (plan && !hasVerificationPlan(plan)) {
    blockingReasons.push('Verification strategy missing — World 2 entry blocked.');
  }

  if (snapshot.founderAcceptanceAssessment?.acceptanceState === 'BLOCKED') {
    blockingReasons.push('Founder acceptance gate is BLOCKED.');
  }

  if (executionState === 'READY_WITH_RESTRICTIONS') {
    warningReasons.push('World 2 entry allowed with restrictions — elevated monitoring required.');
  }

  if (executionState === 'READY_FOR_WORLD2') {
    warningReasons.push('World 2 may execute — World 1 live workspace remains protected.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_WORLD2_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_WORLD2_REASONS),
  };
}

function buildWorld2ExecutionContract(
  workspaceId: string,
  plan: ExecutionPlan,
  sandbox: SandboxExecutionAssessment,
): World2ExecutionContract {
  const sandboxContract = sandbox.executionContract;
  const rollbackRequirements =
    sandboxContract?.rollbackRequirements ?? [
      plan.rollbackPlan.rollbackTrigger,
      plan.rollbackPlan.rollbackMethod,
      plan.rollbackPlan.rollbackSuccessCriteria,
    ];
  const verificationRequirements =
    sandboxContract?.requiredValidation ?? [
      plan.verificationPlan.validationStrategy,
      plan.verificationPlan.executionProofStrategy,
      plan.verificationPlan.founderTestStrategy,
      plan.verificationPlan.acceptanceStrategy,
    ];

  return {
    readOnly: true,
    contractId: `world2-contract-${plan.planId}`,
    workspaceId,
    executionPlanId: plan.planId,
    allowedActions: [...WORLD2_ALLOWED_ACTIONS],
    forbiddenActions: [...WORLD2_FORBIDDEN_ACTIONS],
    resourceLimits: buildWorld2ResourceLimits(),
    rollbackRequirements: dedupe(rollbackRequirements).slice(0, MAX_WORLD2_REASONS),
    verificationRequirements: dedupe(verificationRequirements).slice(0, MAX_WORLD2_REASONS),
    acceptanceRequirements: [
      'Founder acceptance gate must not be BLOCKED during World 2 execution',
      plan.verificationPlan.acceptanceStrategy,
      ...plan.successCriteria,
    ].slice(0, MAX_WORLD2_REASONS),
    terminationConditions: [...WORLD2_TERMINATION_CONDITIONS],
  };
}

export function assessWorld2ControlledExecutionRuntime(
  input: AssessWorld2ControlledExecutionRuntimeInput = {},
): World2RuntimeAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const sandbox = inputSnapshot.sandboxAssessment;
  const founderAcceptanceBlocked =
    inputSnapshot.founderAcceptanceAssessment?.acceptanceState === 'BLOCKED';

  const executionState = deriveWorld2ExecutionState({
    sandboxAssessment: sandbox,
    plan: inputSnapshot.plan,
    planExecutable: inputSnapshot.executionPlannerAssessment.planExecutable,
    missingAuthorities: inputSnapshot.missingAuthorities,
    founderAcceptanceBlocked,
    sandboxContractPresent: sandbox.executionContract !== null,
  });

  const reasons = buildReasons(inputSnapshot, executionState);
  const workspaceId = nextWorkspaceId();
  const runtimeId = nextRuntimeId();

  const contractEligible =
    executionState === 'READY_FOR_WORLD2' || executionState === 'READY_WITH_RESTRICTIONS';

  const terminationAssessment = deriveWorld2TerminationAssessment({
    repairLoopAssessment: inputSnapshot.repairLoopAssessment,
    sandboxAssessment: sandbox,
    executionState,
    founderAcceptanceBlocked,
  });

  const assessment: World2RuntimeAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_CORE_QUESTION,
    runtimeId,
    workspaceId,
    executionPlanId: inputSnapshot.plan?.planId ?? null,
    executionState,
    sandboxEligibilityState: sandbox.eligibilityState,
    riskLevel: inputSnapshot.plan?.riskLevel ?? null,
    inputSnapshot,
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    executionContract:
      contractEligible && inputSnapshot.plan
        ? buildWorld2ExecutionContract(workspaceId, inputSnapshot.plan, sandbox)
        : null,
    terminationAssessment,
    cacheKey: stableCacheKey(runtimeId, executionState),
  };

  recordWorld2RuntimeAssessment(assessment);
  return assessment;
}

export function buildWorld2ControlledExecutionRuntimeReport(
  assessment: World2RuntimeAssessment,
  generatedAt = new Date().toISOString(),
): World2RuntimeReport {
  return {
    generatedAt,
    phaseName: WORLD2_CONTROLLED_EXECUTION_RUNTIME_PHASE,
    purpose:
      'Authorize approved execution plans to enter isolated World 2 workspaces — World 2 may execute, World 1 may not.',
    assessment,
    passToken: WORLD2_CONTROLLED_EXECUTION_RUNTIME_PASS_TOKEN,
  };
}

export function buildWorld2ControlledExecutionRuntimeArtifacts(
  input: AssessWorld2ControlledExecutionRuntimeInput = {},
): {
  world2RuntimeAssessment: World2RuntimeAssessment;
  world2RuntimeReportMarkdown: string;
} {
  const world2RuntimeAssessment = assessWorld2ControlledExecutionRuntime(input);
  const report = buildWorld2ControlledExecutionRuntimeReport(world2RuntimeAssessment);
  return {
    world2RuntimeAssessment,
    world2RuntimeReportMarkdown: buildWorld2ControlledExecutionRuntimeReportMarkdown(report),
  };
}

export function resetWorld2ControlledExecutionRuntimeModuleForTests(): void {
  resetWorld2ControlledExecutionRuntimeHistoryForTests();
  resetWorld2ControlledExecutionRuntimeCounterForTests();
  resetAutonomousBuilderExecutionSandboxModuleForTests();
}
