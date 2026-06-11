/**
 * DevPulse V2 World 2 Execution Planner — Phase 7.2 planning layer.
 * Creates execution plans only. Does NOT execute, modify files, or generate code.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import {
  checkCrossWorkspaceAccess,
  checkWorld1ModificationAttempt,
  getDevPulseV2World2WorkspaceFoundation,
} from '../world2-workspace-foundation/index.js';
import { mapExecutionStages, dependencyMapKey, validateStageDependencies } from './dependency-mapper.js';
import { buildCompletionCriteria, completionOutputKey, resetCompletionCounterForTests } from './completion-criteria-builder.js';
import { analyzeProjectGoal, deriveNextRecommendedStep, goalAnalysisKey } from './project-goal-analyzer.js';
import { identifyRisks, resetRiskCounterForTests, riskOutputKey } from './risk-identifier.js';
import { buildRollbackPoints, resetRollbackCounterForTests, rollbackOutputKey } from './rollback-point-builder.js';
import { generateExecutionPlanWithClarifyingGate } from '../clarifying-question-intelligence/clarifying-question-world2-bridge.js';
import {
  buildVerificationPoints,
  resetVerificationCounterForTests,
  verificationOutputKey,
} from './verification-point-builder.js';
import {
  assertDistinctFromPhase4Planners,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertWorld1Protected,
  getPlannerGovernanceSummary,
} from './world2-planner-governance-bridge.js';
import { buildWorld2PlannerReport, formatWorld2PlannerReport } from './world2-planner-report.js';
import type { ExecutionPlan, PlannerInput, PlanningState, World2ExecutionPlannerState } from './types.js';
import {
  DUPLICATE_PATTERNS,
  PLANNING_STATE_SEQUENCE,
  WORLD2_EXECUTION_PLANNER_OWNER_MODULE,
  WORLD2_EXECUTION_PLANNER_PASS_TOKEN,
} from './types.js';

let singleton: DevPulseV2World2ExecutionPlanner | null = null;
let planCounter = 0;

export function resetPlanCounterForTests(): void {
  planCounter = 0;
}

function createPlannerId(): string {
  return `world2-execution-planner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPlanId(): string {
  planCounter += 1;
  return `world2-plan-${planCounter.toString().padStart(4, '0')}`;
}

function clonePlan(plan: ExecutionPlan): ExecutionPlan {
  return {
    ...plan,
    executionStages: plan.executionStages.map((s) => ({ ...s, dependsOn: [...s.dependsOn] })),
    riskItems: plan.riskItems.map((r) => ({ ...r })),
    verificationPoints: plan.verificationPoints.map((v) => ({ ...v })),
    rollbackPoints: plan.rollbackPoints.map((r) => ({ ...r })),
    completionCriteria: plan.completionCriteria.map((c) => ({ ...c })),
    stateSequence: [...plan.stateSequence],
  };
}

export function validateWorkspaceOwnership(input: PlannerInput): { valid: boolean; reason: string } {
  if (!input.workspaceId || !input.projectId) {
    return { valid: false, reason: 'Plan requires workspaceId and projectId' };
  }

  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);

  if (!workspace) {
    return { valid: false, reason: `Workspace not found: ${input.workspaceId}` };
  }

  if (workspace.projectId !== input.projectId.trim().toLowerCase().replace(/\s+/g, '-')) {
    return { valid: false, reason: 'projectId does not match workspace ownership' };
  }

  return { valid: true, reason: 'Workspace ownership confirmed' };
}

export function planStructuralKey(plan: ExecutionPlan): string {
  return [
    plan.planId,
    plan.workspaceId,
    plan.projectId,
    plan.executionStages.length,
    plan.riskItems.length,
    plan.verificationPoints.length,
    plan.rollbackPoints.length,
    plan.completionCriteria.length,
    dependencyMapKey(plan.executionStages),
    riskOutputKey(plan.riskItems),
    verificationOutputKey(plan.verificationPoints),
    rollbackOutputKey(plan.rollbackPoints),
    completionOutputKey(plan.completionCriteria),
  ].join('|');
}

export function planningStateIncludes(states: PlanningState[], target: PlanningState): boolean {
  return states.includes(target);
}

export function generateExecutionPlan(input: PlannerInput): ExecutionPlan {
  const ownership = validateWorkspaceOwnership(input);
  if (!ownership.valid) {
    throw new Error(ownership.reason);
  }

  const analysis = analyzeProjectGoal(input);
  const stages = mapExecutionStages(input);

  if (!validateStageDependencies(stages)) {
    throw new Error('Invalid stage dependency mapping');
  }

  const risks = identifyRisks(input, stages);
  const verificationPoints = buildVerificationPoints(input, stages);
  const rollbackPoints = buildRollbackPoints(stages);
  const completionCriteria = buildCompletionCriteria(input);
  const firstStage = stages[0]?.stageName ?? 'Discovery';

  return {
    planId: createPlanId(),
    workspaceId: input.workspaceId,
    projectId: input.projectId.trim().toLowerCase().replace(/\s+/g, '-'),
    projectGoal: analysis.normalizedGoal,
    executionStages: stages,
    riskItems: risks,
    verificationPoints,
    rollbackPoints,
    completionCriteria,
    nextRecommendedStep: deriveNextRecommendedStep(analysis, firstStage),
    stateSequence: [...PLANNING_STATE_SEQUENCE],
    createdAt: Date.now(),
    planningOnlyConfirmed: true,
    noExecutionOccurred: true,
    noFilesModified: true,
    noCodeGenerated: true,
  };
}

export class DevPulseV2World2ExecutionPlanner {
  private readonly plannerId = createPlannerId();
  private readonly plans: ExecutionPlan[] = [];
  private plannerWarnings: string[] = [
    'World 2 Execution Planner V1 — planning only.',
    'No execution, file modification, or code generation.',
  ];
  private plannerErrors: string[] = [];

  static readonly ownerModule = WORLD2_EXECUTION_PLANNER_OWNER_MODULE;
  static readonly ownerDomain = 'world2_execution_planner' as const;
  static readonly passToken = WORLD2_EXECUTION_PLANNER_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('world2_execution_planner');
    return owner.ownerModule === WORLD2_EXECUTION_PLANNER_OWNER_MODULE && owner.phase === 7.2;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const plannerOwner = getDevPulseV2Owner('world2_execution_planner').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== plannerOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromPhase4Planners();
  }

  static assertDoesNotExecute(): boolean {
    const planner = new DevPulseV2World2ExecutionPlanner();
    return (
      typeof (planner as { execute?: unknown }).execute === 'undefined' &&
      typeof (planner as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (planner as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (planner as { runBuilder?: unknown }).runBuilder === 'undefined' &&
      typeof (planner as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (planner as { runSimulation?: unknown }).runSimulation === 'undefined'
    );
  }

  static assertDependencyChain(): boolean {
    return (
      assertGovernanceDependenciesPresent() &&
      assertNoGovernanceBypass() &&
      assertWorld1Protected() &&
      getDevPulseV2Owner('world2_workspace_foundation').phase === 7.1 &&
      getDevPulseV2Owner('world2_execution_planner').phase === 7.2
    );
  }

  createPlan(input: PlannerInput): ExecutionPlan {
    const gated = generateExecutionPlanWithClarifyingGate(input);
    if (gated.blocked) {
      throw new Error(`CLARIFICATION_REQUIRED: ${gated.gate.missingCriticalCategories.join(', ')}`);
    }
    const plan = gated.plan!;
    this.plans.push(clonePlan(plan));
    this.publishSummary(plan);
    return clonePlan(plan);
  }

  getPlans(): ExecutionPlan[] {
    return this.plans.map(clonePlan);
  }

  getPlanByWorkspace(workspaceId: string): ExecutionPlan | null {
    const plan = this.plans.find((p) => p.workspaceId === workspaceId);
    return plan ? clonePlan(plan) : null;
  }

  getPlannerState(): World2ExecutionPlannerState {
    return {
      plannerId: this.plannerId,
      planCount: this.plans.length,
      warnings: [...this.plannerWarnings],
      errors: [...this.plannerErrors],
    };
  }

  buildReport(plan: ExecutionPlan) {
    return buildWorld2PlannerReport(this.getPlannerState(), plan);
  }

  formatReport(plan: ExecutionPlan): string {
    return formatWorld2PlannerReport(this.getPlannerState(), plan);
  }

  getGovernanceSummary(): string {
    return getPlannerGovernanceSummary();
  }

  checkCrossWorkspacePlanAccess(actorWorkspaceId: string, targetWorkspaceId: string): boolean {
    const foundation = getDevPulseV2World2WorkspaceFoundation();
    const target = foundation.getManager().getWorkspace(targetWorkspaceId);
    const check = checkCrossWorkspaceAccess(actorWorkspaceId, target);
    return check.allowed;
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  private publishSummary(plan: ExecutionPlan): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Execution plan created: ${plan.planId}`,
      summary: `World 2 plan for ${plan.projectId} — ${plan.executionStages.length} stages. Planning only.`,
      relatedEvidenceIds: [],
      relatedRecordId: plan.planId,
      status: 'INFO',
      warnings: ['Execution plan generated only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2World2ExecutionPlanner(): DevPulseV2World2ExecutionPlanner {
  singleton = new DevPulseV2World2ExecutionPlanner();
  return singleton;
}

export function getDevPulseV2World2ExecutionPlanner(): DevPulseV2World2ExecutionPlanner {
  if (!singleton) {
    singleton = new DevPulseV2World2ExecutionPlanner();
  }
  return singleton;
}

export function resetDevPulseV2World2ExecutionPlannerForTests(): DevPulseV2World2ExecutionPlanner {
  resetPlanCounterForTests();
  resetRiskCounterForTests();
  resetVerificationCounterForTests();
  resetRollbackCounterForTests();
  resetCompletionCounterForTests();
  singleton = new DevPulseV2World2ExecutionPlanner();
  return singleton;
}

export {
  goalAnalysisKey,
  dependencyMapKey,
  riskOutputKey,
  verificationOutputKey,
  rollbackOutputKey,
  completionOutputKey,
  WORLD2_EXECUTION_PLANNER_OWNER_MODULE,
  WORLD2_EXECUTION_PLANNER_PASS_TOKEN,
};
