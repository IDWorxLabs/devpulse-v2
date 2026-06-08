/**
 * DevPulse V2 World 2 Autonomous Builder Foundation — Phase 7.4 dry-run builder layer.
 * Prepares build actions only. Does NOT execute, modify files, generate code, or touch World 1.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import type { ExecutionPlan } from '../world2-execution-planner/types.js';
import {
  checkCrossWorkspaceAccess,
  checkWorld1ModificationAttempt,
  getDevPulseV2World2WorkspaceFoundation,
} from '../world2-workspace-foundation/index.js';
import type { SimulationResult } from '../world2-simulation-runtime/types.js';
import {
  blockedActionsKey,
  prepareProposedActions,
  preparedActionsKey,
} from './action-preparation-engine.js';
import {
  approvalRequirementsKey,
  generateApprovalRequirements,
  unsatisfiedApprovalCount,
} from './approval-requirement-engine.js';
import {
  assertDistinctFromSimulationRuntime,
  assertExecutionAuthorityPresent,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getBuilderGovernanceSummary,
} from './builder-governance-bridge.js';
import {
  generateRollbackRequirements,
  rollbackRequirementsKey,
} from './rollback-requirement-engine.js';
import { generateRiskControls, riskControlsKey } from './risk-control-engine.js';
import {
  generateVerificationRequirements,
  verificationRequirementsKey,
} from './verification-requirement-engine.js';
import {
  generateWorkspaceProtectionChecks,
  validateWorkspaceIsolation,
  workspaceProtectionKey,
} from './workspace-protection-engine.js';
import {
  generateWorld1ProtectionChecks,
  world1ProtectionKey,
} from './world1-protection-engine.js';
import { buildWorld2BuilderReport, formatWorld2BuilderReport } from './world2-builder-report.js';
import type {
  BuildReadiness,
  BuilderInput,
  BuilderResult,
  BuilderState,
  World2AutonomousBuilderState,
} from './types.js';
import {
  BUILDER_STATE_SEQUENCE,
  DUPLICATE_PATTERNS,
  WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE,
  WORLD2_AUTONOMOUS_BUILDER_PASS_TOKEN,
} from './types.js';

function getForbiddenExecutionPatterns(): string[] {
  return [
    'fs' + '.writeFileSync',
    'fs' + '.rmSync',
    'fs' + '.unlinkSync',
    'child' + '_process',
    'exec' + '(',
    'spawn' + '(',
    'eval' + '(',
  ];
}

let singleton: DevPulseV2World2AutonomousBuilder | null = null;
let builderCounter = 0;

export function resetBuilderCounterForTests(): void {
  builderCounter = 0;
}

function createFoundationId(): string {
  return `world2-autonomous-builder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBuilderId(): string {
  builderCounter += 1;
  return `world2-builder-${builderCounter.toString().padStart(4, '0')}`;
}

function cloneBuilderResult(result: BuilderResult): BuilderResult {
  return {
    ...result,
    preparedActions: result.preparedActions.map((a) => ({ ...a })),
    blockedActions: result.blockedActions.map((a) => ({ ...a })),
    approvalRequirements: result.approvalRequirements.map((a) => ({ ...a })),
    verificationRequirements: result.verificationRequirements.map((v) => ({ ...v })),
    rollbackRequirements: result.rollbackRequirements.map((r) => ({ ...r })),
    riskControls: result.riskControls.map((r) => ({ ...r })),
    workspaceProtectionChecks: result.workspaceProtectionChecks.map((c) => ({ ...c })),
    world1ProtectionChecks: result.world1ProtectionChecks.map((c) => ({ ...c })),
    recommendations: [...result.recommendations],
    stateSequence: [...result.stateSequence],
    confirmation: { ...result.confirmation },
  };
}

export function builderInputFromSimulation(
  simulation: SimulationResult,
  overrides: Partial<BuilderInput> = {},
): BuilderInput {
  return {
    workspaceId: simulation.workspaceId,
    projectId: simulation.projectId,
    planId: simulation.planId,
    simulationId: simulation.simulationId,
    approvedByFounder: false,
    simulationPassed: simulation.simulationReady,
    simulationConfidence: simulation.confidenceScore,
    completionLikelihood: simulation.completionLikelihood,
    executionStages: [],
    verificationForecasts: simulation.verificationForecasts.map((v) => ({ ...v })),
    rollbackForecasts: simulation.rollbackForecasts.map((r) => ({ ...r })),
    riskForecasts: simulation.simulatedRisks.map((r) => ({ ...r })),
    workspaceIsolationStatus: 'ISOLATED',
    governanceStatus: 'VALIDATED',
    ...overrides,
  };
}

export function builderInputFromPlanAndSimulation(
  plan: ExecutionPlan,
  simulation: SimulationResult,
  overrides: Partial<BuilderInput> = {},
): BuilderInput {
  return builderInputFromSimulation(simulation, {
    executionStages: plan.executionStages.map((s) => ({ ...s, dependsOn: [...s.dependsOn] })),
    ...overrides,
  });
}

export function determineBuildReadiness(input: BuilderInput): BuildReadiness {
  if (!input.simulationPassed) return 'NOT_READY';
  if (input.workspaceIsolationStatus !== 'ISOLATED') return 'NOT_READY';
  if (input.governanceStatus !== 'VALIDATED') return 'NOT_READY';

  const needsApproval =
    !input.approvedByFounder ||
    input.simulationConfidence === 'LOW' ||
    input.completionLikelihood === 'VERY_LOW' ||
    input.completionLikelihood === 'LOW';

  if (needsApproval) return 'NEEDS_APPROVAL';

  if (
    input.approvedByFounder &&
    input.simulationConfidence === 'HIGH' &&
    (input.completionLikelihood === 'HIGH' || input.completionLikelihood === 'VERY_HIGH')
  ) {
    return 'READY_FOR_GATED_EXECUTION_FUTURE';
  }

  return 'READY_FOR_DRY_RUN';
}

export function resolveBuilderState(
  input: BuilderInput,
  readiness: BuildReadiness,
  ownershipValid: boolean,
): BuilderState {
  if (!ownershipValid) return 'BLOCKED';
  if (!input.simulationPassed) return 'BLOCKED';
  if (input.governanceStatus !== 'VALIDATED') return 'BLOCKED';
  if (input.workspaceIsolationStatus !== 'ISOLATED') return 'BLOCKED';
  if (readiness === 'NOT_READY') return 'BLOCKED';
  if (readiness === 'NEEDS_APPROVAL') return 'APPROVALS_REQUIRED';
  return 'DRY_RUN_READY';
}

export function validateBuilderOwnership(input: BuilderInput): { valid: boolean; reason: string } {
  if (!input.workspaceId || !input.projectId || !input.planId || !input.simulationId) {
    return {
      valid: false,
      reason: 'Builder requires workspaceId, projectId, planId, and simulationId',
    };
  }

  return validateWorkspaceIsolation(input);
}

export function builderStructuralKey(result: BuilderResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.planId,
    result.simulationId,
    result.buildReadiness,
    result.builderState,
    preparedActionsKey(result.preparedActions),
    blockedActionsKey(result.blockedActions),
    approvalRequirementsKey(result.approvalRequirements),
    verificationRequirementsKey(result.verificationRequirements),
    rollbackRequirementsKey(result.rollbackRequirements),
    riskControlsKey(result.riskControls),
    workspaceProtectionKey(result.workspaceProtectionChecks),
    world1ProtectionKey(result.world1ProtectionChecks),
  ].join('|');
}

export function builderStateIncludes(states: BuilderState[], target: BuilderState): boolean {
  return states.includes(target);
}

function generateRecommendations(
  input: BuilderInput,
  readiness: BuildReadiness,
  unsatisfiedApprovals: number,
): string[] {
  const recommendations: string[] = [
    'World 2 Autonomous Builder Foundation V1 — dry-run foundation only. No execution performed.',
  ];

  if (!input.simulationPassed) {
    recommendations.push('Simulation must pass before builder packet can proceed.');
  }

  if (!input.approvedByFounder) {
    recommendations.push('Founder approval required before any future gated execution.');
  }

  if (input.simulationConfidence === 'LOW') {
    recommendations.push('Low simulation confidence — obtain additional verification before proceeding.');
  }

  if (input.completionLikelihood === 'VERY_LOW' || input.completionLikelihood === 'LOW') {
    recommendations.push('Low completion likelihood — revise plan or simulation before builder phase.');
  }

  if (unsatisfiedApprovals > 0) {
    recommendations.push(`${unsatisfiedApprovals} approval requirement(s) remain unsatisfied.`);
  }

  if (readiness === 'READY_FOR_DRY_RUN') {
    recommendations.push('Build packet ready for dry-run review — no execution authorized.');
  }

  if (readiness === 'READY_FOR_GATED_EXECUTION_FUTURE') {
    recommendations.push('Build packet ready for future gated execution — still no execution in this phase.');
  }

  recommendations.push('Confirm governance stack via verification_gated_apply before any future execution.');

  return recommendations;
}

export function generateBuilderPacket(input: BuilderInput): BuilderResult {
  const ownership = validateBuilderOwnership(input);
  const readiness = determineBuildReadiness(input);
  const builderState = resolveBuilderState(input, readiness, ownership.valid);

  const { prepared, blocked } = prepareProposedActions(input, readiness);
  const approvalRequirements = generateApprovalRequirements(input, prepared);
  const verificationRequirements = generateVerificationRequirements(input);
  const rollbackRequirements = generateRollbackRequirements(input);
  const riskControls = generateRiskControls(input);
  const workspaceProtectionChecks = generateWorkspaceProtectionChecks(input);
  const world1ProtectionChecks = generateWorld1ProtectionChecks();
  const unsatisfiedApprovals = unsatisfiedApprovalCount(approvalRequirements);

  const stateSequence: BuilderState[] =
    builderState === 'BLOCKED'
      ? ['BUILDER_REQUEST_RECEIVED', 'BLOCKED']
      : builderState === 'APPROVALS_REQUIRED'
        ? [...BUILDER_STATE_SEQUENCE.slice(0, 8), 'APPROVALS_REQUIRED']
        : [...BUILDER_STATE_SEQUENCE];

  return {
    builderId: createBuilderId(),
    workspaceId: input.workspaceId,
    projectId: input.projectId.trim().toLowerCase().replace(/\s+/g, '-'),
    planId: input.planId,
    simulationId: input.simulationId,
    buildReadiness: ownership.valid ? readiness : 'NOT_READY',
    builderState,
    preparedActions: ownership.valid ? prepared : [],
    blockedActions: ownership.valid ? blocked : blocked.length > 0 ? blocked : prepared.map((a) => ({
      actionId: a.actionId,
      actionType: a.actionType,
      stageType: a.stageType,
      description: a.description,
      blockReason: ownership.reason,
    })),
    approvalRequirements,
    verificationRequirements,
    rollbackRequirements,
    riskControls,
    workspaceProtectionChecks,
    world1ProtectionChecks,
    recommendations: generateRecommendations(input, readiness, unsatisfiedApprovals),
    confirmation: {
      dryRunFoundationOnly: true,
      noWorld1ChangesPerformed: true,
      noFilesModified: true,
      noCommandsExecuted: true,
      noCodeGenerated: true,
      noExecutionPerformed: true,
    },
    stateSequence,
    createdAt: Date.now(),
  };
}

export function scanModuleForForbiddenPatterns(moduleDir: string): string[] {
  const violations: string[] = [];

  function scanDir(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.ts')) continue;

      const content = readFileSync(fullPath, 'utf8');
      for (const pattern of getForbiddenExecutionPatterns()) {
        if (content.includes(pattern)) {
          violations.push(`${fullPath}: contains forbidden pattern "${pattern}"`);
        }
      }
    }
  }

  scanDir(moduleDir);
  return violations;
}

export class DevPulseV2World2AutonomousBuilder {
  private readonly foundationId = createFoundationId();
  private readonly builderPackets: BuilderResult[] = [];
  private builderWarnings: string[] = [
    'World 2 Autonomous Builder Foundation V1 — dry-run foundation only.',
    'No execution, file modification, command execution, or code generation.',
  ];
  private builderErrors: string[] = [];

  static readonly ownerModule = WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE;
  static readonly ownerDomain = 'world2_autonomous_builder' as const;
  static readonly passToken = WORLD2_AUTONOMOUS_BUILDER_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('world2_autonomous_builder');
    return owner.ownerModule === WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE && owner.phase === 7.4;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const builderOwner = getDevPulseV2Owner('world2_autonomous_builder').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== builderOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromSimulationRuntime();
  }

  static assertDoesNotExecute(): boolean {
    const builder = new DevPulseV2World2AutonomousBuilder();
    return (
      typeof (builder as { execute?: unknown }).execute === 'undefined' &&
      typeof (builder as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (builder as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (builder as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (builder as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (builder as { writeFile?: unknown }).writeFile === 'undefined' &&
      typeof (builder as { runSimulation?: unknown }).runSimulation === 'undefined' &&
      typeof (builder as { createPlan?: unknown }).createPlan === 'undefined'
    );
  }

  static assertNoForbiddenExecutionPatterns(): boolean {
    const moduleDir = join(fileURLToPath(new URL('.', import.meta.url)));
    return scanModuleForForbiddenPatterns(moduleDir).length === 0;
  }

  static assertDependencyChain(): boolean {
    return (
      assertGovernanceDependenciesPresent() &&
      assertNoGovernanceBypass() &&
      assertWorld1Protected() &&
      assertExecutionAuthorityPresent() &&
      assertNoRegistryRuntimeMutation() &&
      getDevPulseV2Owner('world2_workspace_foundation').phase === 7.1 &&
      getDevPulseV2Owner('world2_execution_planner').phase === 7.2 &&
      getDevPulseV2Owner('world2_simulation_runtime').phase === 7.3 &&
      getDevPulseV2Owner('world2_autonomous_builder').phase === 7.4
    );
  }

  prepareBuildPacket(input: BuilderInput): BuilderResult {
    const result = generateBuilderPacket(input);
    this.builderPackets.push(cloneBuilderResult(result));
    this.publishSummary(result);
    return cloneBuilderResult(result);
  }

  getBuilderPackets(): BuilderResult[] {
    return this.builderPackets.map(cloneBuilderResult);
  }

  getBuilderPacketByWorkspace(workspaceId: string): BuilderResult | null {
    const packet = this.builderPackets.find((b) => b.workspaceId === workspaceId);
    return packet ? cloneBuilderResult(packet) : null;
  }

  getBuilderPacketBySimulation(simulationId: string): BuilderResult | null {
    const packet = this.builderPackets.find((b) => b.simulationId === simulationId);
    return packet ? cloneBuilderResult(packet) : null;
  }

  getFoundationState(): World2AutonomousBuilderState {
    return {
      foundationId: this.foundationId,
      builderPacketCount: this.builderPackets.length,
      warnings: [...this.builderWarnings],
      errors: [...this.builderErrors],
    };
  }

  buildReport(result: BuilderResult) {
    return buildWorld2BuilderReport(this.getFoundationState(), result);
  }

  formatReport(result: BuilderResult): string {
    return formatWorld2BuilderReport(this.getFoundationState(), result);
  }

  getGovernanceSummary(): string {
    return getBuilderGovernanceSummary();
  }

  checkCrossWorkspaceBuilderAccess(
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

  private publishSummary(result: BuilderResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Builder packet prepared: ${result.builderId}`,
      summary: `World 2 dry-run builder for plan ${result.planId} — ${result.preparedActions.length} proposed actions. No execution.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.builderId,
      status: 'INFO',
      warnings: ['Builder packet prepared only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2World2AutonomousBuilder(): DevPulseV2World2AutonomousBuilder {
  singleton = new DevPulseV2World2AutonomousBuilder();
  return singleton;
}

export function getDevPulseV2World2AutonomousBuilder(): DevPulseV2World2AutonomousBuilder {
  if (!singleton) {
    singleton = new DevPulseV2World2AutonomousBuilder();
  }
  return singleton;
}

export function resetDevPulseV2World2AutonomousBuilderForTests(): DevPulseV2World2AutonomousBuilder {
  resetBuilderCounterForTests();
  singleton = new DevPulseV2World2AutonomousBuilder();
  return singleton;
}

export {
  preparedActionsKey,
  blockedActionsKey,
  approvalRequirementsKey,
  verificationRequirementsKey,
  rollbackRequirementsKey,
  riskControlsKey,
  workspaceProtectionKey,
  world1ProtectionKey,
  WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE,
  WORLD2_AUTONOMOUS_BUILDER_PASS_TOKEN,
};
