/**
 * Autonomous Builder Execution Sandbox — eligibility and safety authority.
 * Sandbox planning only — never executes against live workspace.
 */

import { createHash } from 'node:crypto';
import { assessAutonomousBuilderExecutionPlanner } from '../autonomous-builder-execution-planner/index.js';
import { resetAutonomousBuilderExecutionPlannerModuleForTests } from '../autonomous-builder-execution-planner/index.js';
import type { ExecutionPlan } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import {
  AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_OWNER_MODULE,
  AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PASS_TOKEN,
  AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PHASE,
  MAX_SANDBOX_REASONS,
  SANDBOX_ALLOWED_ACTIONS,
  SANDBOX_CACHE_KEY_PREFIX,
  SANDBOX_CORE_QUESTION,
  SANDBOX_FORBIDDEN_ACTIONS,
  clampReadinessPercent,
} from './autonomous-builder-execution-sandbox-registry.js';
import { recordSandboxExecutionAssessment, resetAutonomousBuilderExecutionSandboxHistoryForTests } from './autonomous-builder-execution-sandbox-history.js';
import { buildAutonomousBuilderExecutionSandboxReportMarkdown } from './autonomous-builder-execution-sandbox-report-builder.js';
import type {
  AssessAutonomousBuilderExecutionSandboxInput,
  ExecutionContract,
  SandboxEligibilityState,
  SandboxExecutionAssessment,
  SandboxExecutionReport,
  SandboxInputSnapshot,
  SandboxReadinessReview,
} from './autonomous-builder-execution-sandbox-types.js';

let sandboxCounter = 0;

export function resetAutonomousBuilderExecutionSandboxCounterForTests(): void {
  sandboxCounter = 0;
}

function nextSandboxId(): string {
  sandboxCounter += 1;
  return `sandbox-${sandboxCounter}`;
}

function stableCacheKey(sandboxId: string, state: SandboxEligibilityState): string {
  const digest = createHash('sha256')
    .update([AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_OWNER_MODULE, sandboxId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${SANDBOX_CACHE_KEY_PREFIX}:${digest}`;
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
  input: AssessAutonomousBuilderExecutionSandboxInput,
): SandboxInputSnapshot {
  const executionPlannerAssessment =
    input.executionPlannerAssessment ??
    assessAutonomousBuilderExecutionPlanner({
      repairLoopAssessment: input.repairLoopAssessment,
      founderTestAssessment: input.founderTestAssessment,
      executionProofAssessment: input.executionProofAssessment,
      founderAcceptanceAssessment: input.founderAcceptanceAssessment,
      rootDir: input.rootDir,
    });

  const repairLoopAssessment = executionPlannerAssessment.inputSnapshot.repairLoopAssessment;
  const executionProofAssessment = executionPlannerAssessment.inputSnapshot.executionProofAssessment;
  const founderAcceptanceAssessment =
    executionPlannerAssessment.inputSnapshot.founderAcceptanceAssessment;

  const missingAuthorities: string[] = [];
  if (!executionProofAssessment) missingAuthorities.push('execution-proof-evolution');
  if (!founderAcceptanceAssessment) missingAuthorities.push('founder-acceptance-gate');

  return {
    executionPlannerAssessment,
    repairLoopAssessment,
    executionProofAssessment,
    founderAcceptanceAssessment,
    plan: executionPlannerAssessment.plan,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

export function computeSandboxReadinessReview(snapshot: SandboxInputSnapshot): SandboxReadinessReview {
  const plan = snapshot.plan;
  const proof = snapshot.executionProofAssessment;
  const acceptance = snapshot.founderAcceptanceAssessment;

  const rollbackReadinessPercent = clampReadinessPercent(
    plan && hasRollbackPlan(plan) ? (plan.riskLevel === 'CRITICAL' ? 40 : 95) : 0,
  );

  const verificationReadinessPercent = clampReadinessPercent(
    plan && hasVerificationPlan(plan) ? 95 : 0,
  );

  const proofReadinessPercent = clampReadinessPercent(
    proof
      ? proof.verdict === 'PROVEN_FIXED'
        ? 100
        : proof.verdict === 'PARTIALLY_PROVEN'
          ? 72
          : proof.verdict === 'INSUFFICIENT_EVIDENCE'
            ? 25
            : 45
      : 20,
  );

  const executionReadinessPercent = clampReadinessPercent(
    plan
      ? plan.steps.length >= 2
        ? acceptance?.acceptanceState === 'ACCEPTED'
          ? 95
          : 70
        : 40
      : 0,
  );

  const riskReadinessPercent = clampReadinessPercent(
    plan
      ? plan.riskLevel === 'LOW'
        ? 95
        : plan.riskLevel === 'MEDIUM'
          ? 80
          : plan.riskLevel === 'HIGH'
            ? 55
            : 20
      : 0,
  );

  return {
    rollbackReadinessPercent,
    verificationReadinessPercent,
    proofReadinessPercent,
    executionReadinessPercent,
    riskReadinessPercent,
  };
}

export interface SandboxEligibilityContext {
  plan: ExecutionPlan | null;
  planExecutable: boolean;
  missingAuthorities: string[];
  founderAcceptanceBlocked: boolean;
  readiness: SandboxReadinessReview;
}

export function deriveSandboxEligibilityState(context: SandboxEligibilityContext): SandboxEligibilityState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (!context.plan || !context.planExecutable) {
    return 'NOT_ELIGIBLE';
  }

  const plan = context.plan;
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

  if (
    plan.riskLevel !== 'CRITICAL' &&
    !missingRollback &&
    !missingVerification &&
    !context.founderAcceptanceBlocked
  ) {
    if (plan.riskLevel === 'HIGH' || context.readiness.proofReadinessPercent < 70) {
      return 'ELIGIBLE_WITH_WARNINGS';
    }
    return 'ELIGIBLE';
  }

  return 'NOT_ELIGIBLE';
}

function buildReasons(
  snapshot: SandboxInputSnapshot,
  readiness: SandboxReadinessReview,
  state: SandboxEligibilityState,
): {
  blockingReasons: string[];
  warningReasons: string[];
  requiredPreconditions: string[];
  requiredValidation: string[];
  requiredProof: string[];
  requiredRollback: string[];
} {
  const plan = snapshot.plan;
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];
  const requiredPreconditions: string[] = [];
  const requiredValidation: string[] = [];
  const requiredProof: string[] = [];
  const requiredRollback: string[] = [];

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
      requiredPreconditions.push(`Restore read-only output for ${missing}.`);
    }
  }

  if (!plan) {
    blockingReasons.push('No executable plan available for sandbox entry.');
    return {
      blockingReasons: dedupe(blockingReasons).slice(0, MAX_SANDBOX_REASONS),
      warningReasons: [],
      requiredPreconditions: dedupe(requiredPreconditions).slice(0, MAX_SANDBOX_REASONS),
      requiredValidation: [],
      requiredProof: [],
      requiredRollback: [],
    };
  }

  if (!hasRollbackPlan(plan)) {
    blockingReasons.push('Rollback strategy missing from execution plan.');
  } else {
    requiredRollback.push(plan.rollbackPlan.rollbackTrigger);
    requiredRollback.push(plan.rollbackPlan.rollbackMethod);
    requiredRollback.push(plan.rollbackPlan.rollbackSuccessCriteria);
  }

  if (!hasVerificationPlan(plan)) {
    blockingReasons.push('Verification strategy missing from execution plan.');
  } else {
    requiredValidation.push(plan.verificationPlan.validationStrategy);
    requiredValidation.push(plan.verificationPlan.founderTestStrategy);
    requiredValidation.push(plan.verificationPlan.acceptanceStrategy);
    requiredProof.push(plan.verificationPlan.executionProofStrategy);
  }

  if (plan.riskLevel === 'CRITICAL') {
    blockingReasons.push('Plan risk level is CRITICAL — sandbox entry blocked.');
  }

  if (snapshot.founderAcceptanceAssessment?.acceptanceState === 'BLOCKED') {
    blockingReasons.push('Founder acceptance gate is BLOCKED.');
  }

  if (plan.riskLevel === 'HIGH') {
    warningReasons.push('Plan risk level is HIGH — proceed only with elevated sandbox monitoring.');
  }

  if (readiness.proofReadinessPercent < 70) {
    warningReasons.push('Execution proof readiness below 70% — strengthen before sandbox simulation.');
  }

  if (state === 'ELIGIBLE') {
    requiredPreconditions.push('Use isolated disposable sandbox workspace only.');
    requiredPreconditions.push('Never execute against live project workspace.');
  }

  if (state === 'ELIGIBLE_WITH_WARNINGS') {
    warningReasons.push('Sandbox entry allowed with warnings — complete elevated verification after simulation.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_SANDBOX_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_SANDBOX_REASONS),
    requiredPreconditions: dedupe(requiredPreconditions).slice(0, MAX_SANDBOX_REASONS),
    requiredValidation: dedupe(requiredValidation).slice(0, MAX_SANDBOX_REASONS),
    requiredProof: dedupe(requiredProof).slice(0, MAX_SANDBOX_REASONS),
    requiredRollback: dedupe(requiredRollback).slice(0, MAX_SANDBOX_REASONS),
  };
}

function buildExecutionContract(
  plan: ExecutionPlan,
  reasons: ReturnType<typeof buildReasons>,
): ExecutionContract {
  return {
    readOnly: true,
    contractId: `contract-${plan.planId}`,
    planId: plan.planId,
    allowedActions: [...SANDBOX_ALLOWED_ACTIONS],
    forbiddenActions: [...SANDBOX_FORBIDDEN_ACTIONS],
    requiredValidation: reasons.requiredValidation,
    rollbackRequirements: reasons.requiredRollback,
    successRequirements: plan.successCriteria,
  };
}

export function assessAutonomousBuilderExecutionSandbox(
  input: AssessAutonomousBuilderExecutionSandboxInput = {},
): SandboxExecutionAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const readinessReview = computeSandboxReadinessReview(inputSnapshot);

  const founderAcceptanceBlocked =
    inputSnapshot.founderAcceptanceAssessment?.acceptanceState === 'BLOCKED';

  const eligibilityState = deriveSandboxEligibilityState({
    plan: inputSnapshot.plan,
    planExecutable: inputSnapshot.executionPlannerAssessment.planExecutable,
    missingAuthorities: inputSnapshot.missingAuthorities,
    founderAcceptanceBlocked,
    readiness: readinessReview,
  });

  const reasons = buildReasons(inputSnapshot, readinessReview, eligibilityState);
  const sandboxId = nextSandboxId();

  const contractEligible =
    eligibilityState === 'ELIGIBLE' || eligibilityState === 'ELIGIBLE_WITH_WARNINGS';

  const assessment: SandboxExecutionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: SANDBOX_CORE_QUESTION,
    sandboxId,
    planId: inputSnapshot.plan?.planId ?? null,
    eligibilityState,
    riskLevel: inputSnapshot.plan?.riskLevel ?? null,
    inputSnapshot,
    readinessReview,
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    requiredPreconditions: reasons.requiredPreconditions,
    requiredValidation: reasons.requiredValidation,
    requiredProof: reasons.requiredProof,
    requiredRollback: reasons.requiredRollback,
    executionContract:
      contractEligible && inputSnapshot.plan
        ? buildExecutionContract(inputSnapshot.plan, reasons)
        : null,
    cacheKey: stableCacheKey(sandboxId, eligibilityState),
  };

  recordSandboxExecutionAssessment(assessment);
  return assessment;
}

export function buildAutonomousBuilderExecutionSandboxReport(
  assessment: SandboxExecutionAssessment,
  generatedAt = new Date().toISOString(),
): SandboxExecutionReport {
  return {
    generatedAt,
    phaseName: AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PHASE,
    purpose:
      'Determine sandbox eligibility for execution plans — isolated disposable workspace only, never live mutation.',
    assessment,
    passToken: AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PASS_TOKEN,
  };
}

export function buildAutonomousBuilderExecutionSandboxArtifacts(
  input: AssessAutonomousBuilderExecutionSandboxInput = {},
): {
  sandboxExecutionAssessment: SandboxExecutionAssessment;
  sandboxExecutionReportMarkdown: string;
} {
  const sandboxExecutionAssessment = assessAutonomousBuilderExecutionSandbox(input);
  const report = buildAutonomousBuilderExecutionSandboxReport(sandboxExecutionAssessment);
  return {
    sandboxExecutionAssessment,
    sandboxExecutionReportMarkdown: buildAutonomousBuilderExecutionSandboxReportMarkdown(report),
  };
}

export function resetAutonomousBuilderExecutionSandboxModuleForTests(): void {
  resetAutonomousBuilderExecutionSandboxHistoryForTests();
  resetAutonomousBuilderExecutionSandboxCounterForTests();
  resetAutonomousBuilderExecutionPlannerModuleForTests();
}
