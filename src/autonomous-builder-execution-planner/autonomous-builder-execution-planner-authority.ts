/**
 * Autonomous Builder Execution Planner — plan generation authority.
 * Planning only — does not execute plans.
 */

import { createHash } from 'node:crypto';
import { assessAutonomousRepairLoop } from '../autonomous-repair-loop/index.js';
import type { AutonomousRepairLoopAssessment } from '../autonomous-repair-loop/autonomous-repair-loop-types.js';
import type { RepairLoopAction, RepairLoopFinding } from '../autonomous-repair-loop/autonomous-repair-loop-types.js';
import {
  AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PASS_TOKEN,
  AUTONOMOUS_BUILDER_EXECUTION_PLANNER_OWNER_MODULE,
  AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PHASE,
  EXECUTION_PLANNER_CACHE_KEY_PREFIX,
  EXECUTION_PLANNER_CORE_QUESTION,
  MAX_PLAN_STEPS,
  MAX_SUCCESS_CRITERIA,
  complexityFromPlan,
  mapRepairActionToPlanType,
  riskFromFindingSeverity,
} from './autonomous-builder-execution-planner-registry.js';
import { recordExecutionPlannerAssessment, resetAutonomousBuilderExecutionPlannerHistoryForTests } from './autonomous-builder-execution-planner-history.js';
import { resetAutonomousRepairLoopModuleForTests } from '../autonomous-repair-loop/index.js';
import { buildAutonomousBuilderExecutionPlannerReportMarkdown } from './autonomous-builder-execution-planner-report-builder.js';
import type {
  BuildExecutionPlanInput,
  ExecutionPlan,
  ExecutionPlanStep,
  ExecutionPlanType,
  ExecutionPlannerAssessment,
  ExecutionPlannerInputSnapshot,
  ExecutionPlannerReport,
  ExecutionRollbackPlan,
  ExecutionVerificationPlan,
} from './autonomous-builder-execution-planner-types.js';

let planCounter = 0;

export function resetAutonomousBuilderExecutionPlannerCounterForTests(): void {
  planCounter = 0;
}

function nextPlanId(): string {
  planCounter += 1;
  return `exec-plan-${planCounter}`;
}

function stableCacheKey(planId: string, planType: string): string {
  const digest = createHash('sha256')
    .update([AUTONOMOUS_BUILDER_EXECUTION_PLANNER_OWNER_MODULE, planId, planType].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${EXECUTION_PLANNER_CACHE_KEY_PREFIX}:${digest}`;
}

function buildVerificationPlan(planType: ExecutionPlanType): ExecutionVerificationPlan {
  return {
    validationStrategy: `Run leaf validate scripts relevant to ${planType} scope — no nested npm cascade.`,
    executionProofStrategy:
      'Collect before/after evidence and retest the exact original failing signal via assessExecutionProofEvolution.',
    founderTestStrategy:
      'Run read-only assessFounderTestIntegration after planned work to confirm portfolio impact.',
    acceptanceStrategy:
      'Run assessFounderAcceptanceGate to confirm founder-acceptable state before treating plan as complete.',
  };
}

function buildRollbackPlan(planType: ExecutionPlanType, repairAction: RepairLoopAction): ExecutionRollbackPlan {
  if (planType === 'ROLLBACK_PLAN' || repairAction === 'REVERT_FIX') {
    return {
      rollbackTrigger: 'Execution proof reports REGRESSION_DETECTED or founder acceptance becomes BLOCKED.',
      rollbackMethod: 'Revert the claimed fix path and restore last known good advisory snapshot.',
      rollbackSuccessCriteria:
        'Original regression signal absent and founder test score returns to pre-fix baseline.',
    };
  }

  return {
    rollbackTrigger: 'Execution proof regression, acceptance BLOCKED, or verification strategy fails.',
    rollbackMethod: 'Stop planned steps and revert to prior read-only advisory state — no file mutation in this phase.',
    rollbackSuccessCriteria: 'System returns to pre-plan advisory baseline without new regressions.',
  };
}

function buildSteps(
  planType: ExecutionPlanType,
  repairAction: RepairLoopAction,
  finding: RepairLoopFinding | null,
): ExecutionPlanStep[] {
  const target = finding?.summary ?? 'Portfolio finding';
  const steps: ExecutionPlanStep[] = [];
  let order = 0;

  const add = (title: string, description: string) => {
    order += 1;
    steps.push({
      stepId: `step-${order}`,
      order,
      title,
      description,
      readOnly: true,
    });
  };

  switch (planType) {
    case 'VALIDATION_PLAN':
      add('Confirm finding scope', `Validate scope for: ${target}`);
      add('Collect missing evidence', 'Gather before/after evidence tied to the original failure.');
      add('Re-run founder test', 'Execute read-only founder test integration for portfolio confirmation.');
      break;
    case 'FIX_PLAN':
      add('Diagnose root cause', `Analyze failing signal: ${target}`);
      add('Propose different fix path', 'Select an alternative AutoFix strategy — advisory only in this phase.');
      add('Define proof requirements', 'Specify execution proof evidence required before acceptance.');
      add('Schedule verification', 'Plan founder test + acceptance gate checks after fix.');
      break;
    case 'RETEST_PLAN':
      add('Retest original failure', `Retest exact signal: ${target}`);
      add('Capture before/after metrics', 'Record quantitative before/after proof if available.');
      add('Assess execution proof', 'Evaluate proof verdict against original failure.');
      break;
    case 'ROLLBACK_PLAN':
      add('Identify regression signal', 'Document regression evidence from execution proof.');
      add('Plan revert path', 'Define revert steps for the claimed fix — advisory only.');
      add('Verify post-rollback state', 'Confirm original failure state or improved baseline after revert.');
      break;
    case 'ESCALATION_PLAN':
      add('Stop repeated fix path', 'Halt current repair loop iteration.');
      add('Document escalation reasons', `Escalation triggered by repair action: ${repairAction}`);
      add('Request new diagnostic capability', 'Identify missing capability or evidence from repair loop guidance.');
      add('Await founder review', 'Route to human/founder review before further autonomous action.');
      break;
    case 'REFACTOR_PLAN':
      add('Scope refactor boundary', `Limit refactor to area affecting: ${target}`);
      add('Plan structural change', 'Document intended structural improvement — no execution in this phase.');
      add('Plan extended verification', 'Extend founder test and proof coverage for refactor blast radius.');
      break;
    default:
      add('Review plan', 'Review advisory plan — no execution in this phase.');
      break;
  }

  return steps.slice(0, MAX_PLAN_STEPS);
}

function buildSuccessCriteria(
  planType: ExecutionPlanType,
  repairAction: RepairLoopAction,
): string[] {
  const criteria: string[] = [
    'Verification plan completed with read-only assessors only.',
    'Execution proof verdict improves or stabilizes without regression.',
    'Founder acceptance gate does not return BLOCKED.',
  ];

  if (planType === 'FIX_PLAN') {
    criteria.push('Original failing signal retested and improved.');
    criteria.push('Alternative fix path documented with causal linkage rationale.');
  }

  if (planType === 'RETEST_PLAN') {
    criteria.push('Exact original failure retested with before/after evidence.');
  }

  if (planType === 'ROLLBACK_PLAN') {
    criteria.push('Regression signal cleared or reverted to known baseline.');
  }

  if (planType === 'ESCALATION_PLAN') {
    criteria.push('Escalation guidance delivered to founder review path.');
    criteria.push('Repair loop attempt budget respected — no endless retry.');
  }

  if (repairAction === 'ACCEPT_FIX') {
    criteria.push('Execution proof PROVEN_FIXED and founder acceptance ACCEPTED maintained.');
  }

  return criteria.slice(0, MAX_SUCCESS_CRITERIA);
}

function buildExpectedOutcome(planType: ExecutionPlanType, finding: RepairLoopFinding | null): string {
  const target = finding?.summary ?? 'portfolio finding';
  switch (planType) {
    case 'VALIDATION_PLAN':
      return `Sufficient evidence collected to evaluate ${target} with complete verification coverage.`;
    case 'FIX_PLAN':
      return `Alternative fix path defined for ${target} with proof and acceptance requirements.`;
    case 'RETEST_PLAN':
      return `Original failure retested with measurable before/after proof for ${target}.`;
    case 'ROLLBACK_PLAN':
      return `Regression from claimed fix reverted and baseline stability restored for ${target}.`;
    case 'ESCALATION_PLAN':
      return `Repair loop stopped with clear escalation guidance — no endless autonomous retry.`;
    case 'REFACTOR_PLAN':
      return `Structural improvement scoped for ${target} with extended verification plan.`;
    default:
      return 'Advisory plan outcome documented — no execution in this phase.';
  }
}

function resolveInputSnapshot(input: BuildExecutionPlanInput): ExecutionPlannerInputSnapshot {
  const repairLoopAssessment =
    input.repairLoopAssessment ??
    assessAutonomousRepairLoop({
      rootDir: input.rootDir ?? process.cwd(),
      founderTestAssessment: input.founderTestAssessment,
      executionProofAssessment: input.executionProofAssessment,
      founderAcceptanceAssessment: input.founderAcceptanceAssessment,
    });

  return {
    repairLoopAssessment,
    founderTestAssessment: repairLoopAssessment.inputSnapshot.founderTestAssessment,
    executionProofAssessment: repairLoopAssessment.inputSnapshot.executionProofAssessment,
    founderAcceptanceAssessment: repairLoopAssessment.inputSnapshot.founderAcceptanceAssessment,
  };
}

export function buildExecutionPlanFromSnapshot(
  snapshot: ExecutionPlannerInputSnapshot,
): ExecutionPlan | null {
  const repair = snapshot.repairLoopAssessment;
  const repairAction = repair.decision.recommendedAction;
  const planType = mapRepairActionToPlanType(repairAction);

  if (!planType) {
    return null;
  }

  const finding = repair.inputSnapshot.finding;
  const riskLevel = riskFromFindingSeverity(finding?.severity);
  const estimatedComplexity = complexityFromPlan(planType, riskLevel);
  const planId = nextPlanId();

  return {
    readOnly: true,
    planId,
    planType,
    planSource: 'repair',
    reason: repair.decision.decisionReason,
    targetFinding: finding,
    repairDecision: repairAction,
    steps: buildSteps(planType, repairAction, finding),
    expectedOutcome: buildExpectedOutcome(planType, finding),
    verificationPlan: buildVerificationPlan(planType),
    rollbackPlan: buildRollbackPlan(planType, repairAction),
    riskLevel,
    estimatedComplexity,
    successCriteria: buildSuccessCriteria(planType, repairAction),
  };
}

export function buildExecutionPlan(input: BuildExecutionPlanInput): ExecutionPlan | null {
  return buildExecutionPlanFromSnapshot(resolveInputSnapshot(input));
}

export function assessAutonomousBuilderExecutionPlanner(
  input: BuildExecutionPlanInput = {},
): ExecutionPlannerAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const plan = buildExecutionPlanFromSnapshot(inputSnapshot);
  const repairAction = inputSnapshot.repairLoopAssessment.decision.recommendedAction;
  const nonExecutableReason =
    plan === null ? `Repair decision ${repairAction} does not produce an executable plan.` : null;

  const assessment: ExecutionPlannerAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: EXECUTION_PLANNER_CORE_QUESTION,
    inputSnapshot,
    plan,
    planExecutable: plan !== null,
    nonExecutableReason,
    cacheKey: stableCacheKey(plan?.planId ?? 'none', plan?.planType ?? repairAction),
  };

  recordExecutionPlannerAssessment(assessment);
  return assessment;
}

export function buildAutonomousBuilderExecutionPlannerReport(
  assessment: ExecutionPlannerAssessment,
  generatedAt = new Date().toISOString(),
): ExecutionPlannerReport {
  return {
    generatedAt,
    phaseName: AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PHASE,
    purpose:
      'Transform repair decisions into structured executable plans — planning only, no execution or mutation.',
    assessment,
    passToken: AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PASS_TOKEN,
  };
}

export function buildAutonomousBuilderExecutionPlannerArtifacts(
  input: BuildExecutionPlanInput = {},
): {
  executionPlannerAssessment: ExecutionPlannerAssessment;
  executionPlannerReportMarkdown: string;
} {
  const executionPlannerAssessment = assessAutonomousBuilderExecutionPlanner(input);
  const report = buildAutonomousBuilderExecutionPlannerReport(executionPlannerAssessment);
  return {
    executionPlannerAssessment,
    executionPlannerReportMarkdown: buildAutonomousBuilderExecutionPlannerReportMarkdown(report),
  };
}

export function resetAutonomousBuilderExecutionPlannerModuleForTests(): void {
  resetAutonomousBuilderExecutionPlannerHistoryForTests();
  resetAutonomousBuilderExecutionPlannerCounterForTests();
  resetAutonomousRepairLoopModuleForTests();
}
