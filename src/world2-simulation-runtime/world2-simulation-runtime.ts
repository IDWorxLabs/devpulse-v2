/**
 * DevPulse V2 World 2 Simulation Runtime — Phase 7.3 simulation layer.
 * Simulates execution plans only. Does NOT execute, modify files, or generate code.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import {
  checkCrossWorkspaceAccess,
  checkWorld1ModificationAttempt,
  getDevPulseV2World2WorkspaceFoundation,
} from '../world2-workspace-foundation/index.js';
import type { ExecutionPlan } from '../world2-execution-planner/types.js';
import {
  forecastCompletionLikelihood,
  forecastConfidence,
  generateRecommendations,
  generateSimulatedWarnings,
  completionForecastKey,
} from './completion-forecast-engine.js';
import { forecastRollback, rollbackForecastKey } from './rollback-forecast-engine.js';
import { simulateRisks, riskSimulationKey } from './risk-simulator.js';
import { simulateStages, stageSimulationKey } from './stage-simulator.js';
import {
  forecastVerification,
  verificationForecastKey,
} from './verification-forecast-engine.js';
import {
  assertDistinctFromExecutionPlanner,
  assertExecutionAuthorityPresent,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertWorld1Protected,
  getSimulationGovernanceSummary,
} from './world2-simulation-governance-bridge.js';
import {
  buildWorld2SimulationReport,
  formatWorld2SimulationReport,
} from './world2-simulation-report.js';
import type {
  SimulationInput,
  SimulationResult,
  SimulationState,
  World2SimulationRuntimeState,
} from './types.js';
import {
  DUPLICATE_PATTERNS,
  SIMULATION_STATE_SEQUENCE,
  WORLD2_SIMULATION_RUNTIME_OWNER_MODULE,
  WORLD2_SIMULATION_RUNTIME_PASS_TOKEN,
} from './types.js';

let singleton: DevPulseV2World2SimulationRuntime | null = null;
let simulationCounter = 0;

export function resetSimulationCounterForTests(): void {
  simulationCounter = 0;
}

function createRuntimeId(): string {
  return `world2-simulation-runtime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSimulationId(): string {
  simulationCounter += 1;
  return `world2-simulation-${simulationCounter.toString().padStart(4, '0')}`;
}

function cloneSimulation(simulation: SimulationResult): SimulationResult {
  return {
    ...simulation,
    simulatedStages: simulation.simulatedStages.map((s) => ({ ...s })),
    simulatedRisks: simulation.simulatedRisks.map((r) => ({ ...r })),
    simulatedWarnings: simulation.simulatedWarnings.map((w) => ({ ...w })),
    verificationForecasts: simulation.verificationForecasts.map((v) => ({ ...v })),
    rollbackForecasts: simulation.rollbackForecasts.map((r) => ({ ...r })),
    recommendations: [...simulation.recommendations],
    stateSequence: [...simulation.stateSequence],
  };
}

export function simulationInputFromPlan(plan: ExecutionPlan): SimulationInput {
  return {
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    planId: plan.planId,
    executionStages: plan.executionStages.map((s) => ({ ...s, dependsOn: [...s.dependsOn] })),
    riskItems: plan.riskItems.map((r) => ({ ...r })),
    verificationPoints: plan.verificationPoints.map((v) => ({ ...v })),
    rollbackPoints: plan.rollbackPoints.map((r) => ({ ...r })),
    completionCriteria: plan.completionCriteria.map((c) => ({ ...c })),
  };
}

export function validatePlanOwnership(input: SimulationInput): { valid: boolean; reason: string } {
  if (!input.workspaceId || !input.projectId || !input.planId) {
    return { valid: false, reason: 'Simulation requires workspaceId, projectId, and planId' };
  }

  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);

  if (!workspace) {
    return { valid: false, reason: `Workspace not found: ${input.workspaceId}` };
  }

  const normalizedProjectId = input.projectId.trim().toLowerCase().replace(/\s+/g, '-');
  if (workspace.projectId !== normalizedProjectId) {
    return { valid: false, reason: 'projectId does not match workspace ownership' };
  }

  return { valid: true, reason: 'Plan ownership confirmed' };
}

export function simulationStructuralKey(simulation: SimulationResult): string {
  return [
    simulation.simulationId,
    simulation.workspaceId,
    simulation.projectId,
    simulation.planId,
    stageSimulationKey(simulation.simulatedStages),
    riskSimulationKey(simulation.simulatedRisks),
    verificationForecastKey(simulation.verificationForecasts),
    rollbackForecastKey(simulation.rollbackForecasts),
    completionForecastKey(
      simulation.completionLikelihood,
      simulation.confidenceScore,
      simulation.recommendations.length,
    ),
  ].join('|');
}

export function simulationStateIncludes(
  states: SimulationState[],
  target: SimulationState,
): boolean {
  return states.includes(target);
}

export function generateSimulation(input: SimulationInput): SimulationResult {
  const ownership = validatePlanOwnership(input);
  if (!ownership.valid) {
    throw new Error(ownership.reason);
  }

  const simulatedStages = simulateStages(input.executionStages);
  const simulatedRisks = simulateRisks(input.riskItems);
  const verificationForecasts = forecastVerification(input.verificationPoints);
  const rollbackForecasts = forecastRollback(input.rollbackPoints);
  const completionLikelihood = forecastCompletionLikelihood(
    simulatedStages,
    simulatedRisks,
    verificationForecasts,
    rollbackForecasts,
  );
  const confidenceScore = forecastConfidence(
    simulatedStages,
    simulatedRisks,
    input.completionCriteria,
    verificationForecasts,
  );
  const recommendations = generateRecommendations(
    simulatedStages,
    simulatedRisks,
    verificationForecasts,
    completionLikelihood,
  );
  const simulatedWarnings = generateSimulatedWarnings(
    simulatedStages,
    simulatedRisks,
    completionLikelihood,
  );

  return {
    simulationId: createSimulationId(),
    workspaceId: input.workspaceId,
    projectId: input.projectId.trim().toLowerCase().replace(/\s+/g, '-'),
    planId: input.planId,
    simulatedStages,
    simulatedRisks,
    simulatedWarnings,
    verificationForecasts,
    rollbackForecasts,
    completionLikelihood,
    confidenceScore,
    recommendations,
    stateSequence: [...SIMULATION_STATE_SEQUENCE],
    createdAt: Date.now(),
    simulationOnlyConfirmed: true,
    noExecutionOccurred: true,
    noFilesModified: true,
    noCodeGenerated: true,
    simulationReady: true,
  };
}

export class DevPulseV2World2SimulationRuntime {
  private readonly runtimeId = createRuntimeId();
  private readonly simulations: SimulationResult[] = [];
  private runtimeWarnings: string[] = [
    'World 2 Simulation Runtime V1 — simulation only.',
    'No execution, file modification, or code generation.',
  ];
  private runtimeErrors: string[] = [];

  static readonly ownerModule = WORLD2_SIMULATION_RUNTIME_OWNER_MODULE;
  static readonly ownerDomain = 'world2_simulation_runtime' as const;
  static readonly passToken = WORLD2_SIMULATION_RUNTIME_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('world2_simulation_runtime');
    return owner.ownerModule === WORLD2_SIMULATION_RUNTIME_OWNER_MODULE && owner.phase === 7.3;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const simulationOwner = getDevPulseV2Owner('world2_simulation_runtime').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== simulationOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromExecutionPlanner();
  }

  static assertDoesNotExecute(): boolean {
    const runtime = new DevPulseV2World2SimulationRuntime();
    return (
      typeof (runtime as { execute?: unknown }).execute === 'undefined' &&
      typeof (runtime as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (runtime as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (runtime as { runBuilder?: unknown }).runBuilder === 'undefined' &&
      typeof (runtime as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (runtime as { createPlan?: unknown }).createPlan === 'undefined'
    );
  }

  static assertDependencyChain(): boolean {
    return (
      assertGovernanceDependenciesPresent() &&
      assertNoGovernanceBypass() &&
      assertWorld1Protected() &&
      assertExecutionAuthorityPresent() &&
      getDevPulseV2Owner('world2_workspace_foundation').phase === 7.1 &&
      getDevPulseV2Owner('world2_execution_planner').phase === 7.2 &&
      getDevPulseV2Owner('world2_simulation_runtime').phase === 7.3
    );
  }

  simulatePlan(input: SimulationInput): SimulationResult {
    const simulation = generateSimulation(input);
    this.simulations.push(cloneSimulation(simulation));
    this.publishSummary(simulation);
    return cloneSimulation(simulation);
  }

  simulateFromExecutionPlan(plan: ExecutionPlan): SimulationResult {
    return this.simulatePlan(simulationInputFromPlan(plan));
  }

  getSimulations(): SimulationResult[] {
    return this.simulations.map(cloneSimulation);
  }

  getSimulationByWorkspace(workspaceId: string): SimulationResult | null {
    const simulation = this.simulations.find((s) => s.workspaceId === workspaceId);
    return simulation ? cloneSimulation(simulation) : null;
  }

  getSimulationByPlan(planId: string): SimulationResult | null {
    const simulation = this.simulations.find((s) => s.planId === planId);
    return simulation ? cloneSimulation(simulation) : null;
  }

  getRuntimeState(): World2SimulationRuntimeState {
    return {
      runtimeId: this.runtimeId,
      simulationCount: this.simulations.length,
      warnings: [...this.runtimeWarnings],
      errors: [...this.runtimeErrors],
    };
  }

  buildReport(simulation: SimulationResult) {
    return buildWorld2SimulationReport(this.getRuntimeState(), simulation);
  }

  formatReport(simulation: SimulationResult): string {
    return formatWorld2SimulationReport(this.getRuntimeState(), simulation);
  }

  getGovernanceSummary(): string {
    return getSimulationGovernanceSummary();
  }

  checkCrossWorkspaceSimulationAccess(
    actorWorkspaceId: string,
    targetWorkspaceId: string,
  ): boolean {
    const foundation = getDevPulseV2World2WorkspaceFoundation();
    const target = foundation.getManager().getWorkspace(targetWorkspaceId);
    const check = checkCrossWorkspaceAccess(actorWorkspaceId, target);
    return check.allowed;
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  private publishSummary(simulation: SimulationResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Simulation created: ${simulation.simulationId}`,
      summary: `World 2 simulation for plan ${simulation.planId} — ${simulation.simulatedStages.length} stages forecast. Simulation only.`,
      relatedEvidenceIds: [],
      relatedRecordId: simulation.simulationId,
      status: 'INFO',
      warnings: ['Simulation generated only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2World2SimulationRuntime(): DevPulseV2World2SimulationRuntime {
  singleton = new DevPulseV2World2SimulationRuntime();
  return singleton;
}

export function getDevPulseV2World2SimulationRuntime(): DevPulseV2World2SimulationRuntime {
  if (!singleton) {
    singleton = new DevPulseV2World2SimulationRuntime();
  }
  return singleton;
}

export function resetDevPulseV2World2SimulationRuntimeForTests(): DevPulseV2World2SimulationRuntime {
  resetSimulationCounterForTests();
  singleton = new DevPulseV2World2SimulationRuntime();
  return singleton;
}

export {
  stageSimulationKey,
  riskSimulationKey,
  verificationForecastKey,
  rollbackForecastKey,
  completionForecastKey,
  WORLD2_SIMULATION_RUNTIME_OWNER_MODULE,
  WORLD2_SIMULATION_RUNTIME_PASS_TOKEN,
};
