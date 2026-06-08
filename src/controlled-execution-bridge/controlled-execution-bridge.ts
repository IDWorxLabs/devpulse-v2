/**
 * DevPulse V2 Controlled Execution Bridge Foundation — Phase 7.7.
 * Classifies execution eligibility only. Does NOT execute, modify files, or generate code.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import type { BuilderResult } from '../world2-autonomous-builder/types.js';
import type { VerifierResult } from '../world2-completion-verifier/types.js';
import type { LearningResult } from '../world2-learning-loop/types.js';
import {
  checkCrossWorkspaceAccess,
  checkWorld1ModificationAttempt,
  getDevPulseV2World2WorkspaceFoundation,
} from '../world2-workspace-foundation/index.js';
import { approvalGatesKey, generateApprovalGates } from './approval-gate-engine.js';
import {
  classifyPreparedActions,
  executionRequestsKey,
} from './action-eligibility-engine.js';
import {
  assertDistinctFromAutonomousBuilder,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getBridgeGovernanceSummary,
} from './bridge-governance-bridge.js';
import {
  buildControlledExecutionReport,
  formatControlledExecutionReport,
} from './controlled-execution-report.js';
import {
  determineExecutionReadiness,
  generateProtectionGates,
  protectionGatesKey,
} from './protection-gate-engine.js';
import { generateRollbackGates, rollbackGatesKey } from './rollback-gate-engine.js';
import { generateRiskGates, riskGatesKey } from './risk-gate-engine.js';
import { generateVerificationGates, verificationGatesKey } from './verification-gate-engine.js';
import type {
  BridgeInput,
  BridgeResult,
  BridgeState,
  ControlledExecutionBridgeState,
  GovernanceGateStatus,
  ProtectionGateStatus,
} from './types.js';
import {
  BRIDGE_STATE_SEQUENCE,
  CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE,
  CONTROLLED_EXECUTION_BRIDGE_PASS_TOKEN,
  DUPLICATE_PATTERNS,
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

let singleton: DevPulseV2ControlledExecutionBridge | null = null;
let bridgeCounter = 0;

export function resetBridgeCounterForTests(): void {
  bridgeCounter = 0;
}

function createFoundationId(): string {
  return `controlled-execution-bridge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBridgeId(): string {
  bridgeCounter += 1;
  return `controlled-exec-bridge-${bridgeCounter.toString().padStart(4, '0')}`;
}

function mapWorkspaceIsolation(checks: BuilderResult['workspaceProtectionChecks']): ProtectionGateStatus {
  if (checks.length === 0) return 'FAIL';
  return checks.every((c) => c.status === 'PROTECTED') ? 'PASS' : 'FAIL';
}

function mapWorld1Protection(checks: BuilderResult['world1ProtectionChecks']): ProtectionGateStatus {
  if (checks.length === 0) return 'FAIL';
  return checks.every((c) => c.status === 'PROTECTED') ? 'PASS' : 'FAIL';
}

function mapGovernanceStatus(verification: VerifierResult): GovernanceGateStatus {
  if (verification.governanceResults.length === 0) return 'PENDING';
  const allPassed = verification.governanceResults.every((g) => g.result === 'PASSED');
  const anyFailed = verification.governanceResults.some((g) => g.result === 'FAILED');
  if (anyFailed) return 'FAIL';
  return allPassed ? 'PASS' : 'PENDING';
}

export function bridgeInputFromStack(
  builder: BuilderResult,
  verification: VerifierResult,
  learning: LearningResult,
  options: {
    founderApproved?: boolean;
    simulationPassed?: boolean;
    specialApproval?: boolean;
  } = {},
  overrides: Partial<BridgeInput> = {},
): BridgeInput {
  return {
    workspaceId: builder.workspaceId,
    projectId: builder.projectId,
    planId: builder.planId,
    simulationId: builder.simulationId,
    builderId: builder.builderId,
    verificationId: verification.verificationId,
    learningId: learning.learningId,
    preparedActions: builder.preparedActions.map((a) => ({ ...a })),
    blockedActions: builder.blockedActions.map((a) => ({ ...a })),
    approvalRequirements: builder.approvalRequirements.map((a) => ({ ...a })),
    verificationRequirements: builder.verificationRequirements.map((v) => ({ ...v })),
    rollbackRequirements: builder.rollbackRequirements.map((r) => ({ ...r })),
    riskControls: builder.riskControls.map((r) => ({ ...r })),
    founderApproved: options.founderApproved ?? false,
    specialApproval: options.specialApproval,
    simulationPassed: options.simulationPassed ?? false,
    completionStatus: verification.completionStatus,
    completionConfidence: verification.completionConfidence,
    workspaceIsolationStatus: mapWorkspaceIsolation(builder.workspaceProtectionChecks),
    world1ProtectionStatus: mapWorld1Protection(builder.world1ProtectionChecks),
    governanceStatus: mapGovernanceStatus(verification),
    ...overrides,
  };
}

function cloneBridgeResult(result: BridgeResult): BridgeResult {
  return {
    ...result,
    eligibleExecutionRequests: result.eligibleExecutionRequests.map((r) => ({ ...r })),
    blockedExecutionRequests: result.blockedExecutionRequests.map((r) => ({ ...r })),
    approvalGates: result.approvalGates.map((g) => ({ ...g })),
    verificationGates: result.verificationGates.map((g) => ({ ...g })),
    rollbackGates: result.rollbackGates.map((g) => ({ ...g })),
    riskGates: result.riskGates.map((g) => ({ ...g })),
    protectionGates: result.protectionGates.map((g) => ({ ...g })),
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
  };
}

export function validateBridgeOwnership(input: BridgeInput): { valid: boolean; reason: string } {
  if (
    !input.workspaceId ||
    !input.projectId ||
    !input.planId ||
    !input.simulationId ||
    !input.builderId ||
    !input.verificationId ||
    !input.learningId
  ) {
    return {
      valid: false,
      reason:
        'Bridge requires workspaceId, projectId, planId, simulationId, builderId, verificationId, and learningId',
    };
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

  return { valid: true, reason: 'Bridge ownership confirmed' };
}

export function bridgeStructuralKey(result: BridgeResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.planId,
    result.executionReadiness,
    executionRequestsKey(result.eligibleExecutionRequests),
    executionRequestsKey(result.blockedExecutionRequests),
    approvalGatesKey(result.approvalGates),
    verificationGatesKey(result.verificationGates),
    rollbackGatesKey(result.rollbackGates),
    riskGatesKey(result.riskGates),
    protectionGatesKey(result.protectionGates),
    String(result.recommendations.length),
  ].join('|');
}

export function bridgeStateIncludes(states: BridgeState[], target: BridgeState): boolean {
  return states.includes(target);
}

function buildStateSequence(
  ownershipValid: boolean,
  input: BridgeInput,
  readiness: BridgeResult['executionReadiness'],
): BridgeState[] {
  if (!ownershipValid) return ['BRIDGE_REQUEST_RECEIVED', 'BLOCKED'];

  const sequence: BridgeState[] = ['BRIDGE_REQUEST_RECEIVED', 'OWNERSHIP_VALIDATED'];

  if (input.preparedActions.length > 0 || input.blockedActions.length > 0) {
    sequence.push('BUILDER_PACKET_VALIDATED');
  }

  if (input.verificationId) {
    sequence.push('COMPLETION_VERIFICATION_VALIDATED');
  }

  if (input.learningId) {
    sequence.push('LEARNING_CONTEXT_VALIDATED');
  }

  sequence.push('FOUNDER_APPROVAL_VALIDATED', 'GOVERNANCE_VALIDATED', 'PROTECTION_GATES_EVALUATED');
  sequence.push('EXECUTION_REQUESTS_CLASSIFIED');

  if (readiness === 'BLOCKED') {
    sequence.push('BLOCKED');
  } else {
    sequence.push('BRIDGE_READY');
  }

  return sequence;
}

function compileRecommendations(input: BridgeInput, readiness: BridgeResult['executionReadiness']): string[] {
  const recommendations: string[] = [
    'Controlled Execution Bridge Foundation V1 — classification only. No execution performed.',
  ];

  if (readiness === 'NEEDS_FOUNDER_APPROVAL') {
    recommendations.push('Obtain founder approval before submitting to gated execution.');
  }
  if (readiness === 'NEEDS_VERIFICATION_GATE') {
    recommendations.push('Complete verification_gated_apply requirements before gated execution.');
  }
  if (readiness === 'READY_FOR_GATED_EXECUTION') {
    recommendations.push('Eligible requests may be submitted to future gated execution — not executed here.');
  }
  if (readiness === 'BLOCKED') {
    recommendations.push('Bridge blocked — resolve protection and governance failures before retry.');
  }
  if (!input.simulationPassed) {
    recommendations.push('Simulation must pass before any execution request classification.');
  }
  if (input.completionConfidence === 'LOW') {
    recommendations.push('Low completion confidence — improve verification before gated execution.');
  }

  return recommendations;
}

export function classifyBridge(input: BridgeInput): BridgeResult {
  const ownership = validateBridgeOwnership(input);
  const ownershipValid = ownership.valid;
  const readiness = determineExecutionReadiness(input, ownershipValid);
  const { eligible, blocked } = classifyPreparedActions(input);
  const approvalGates = generateApprovalGates(input);
  const verificationGates = generateVerificationGates(input);
  const rollbackGates = generateRollbackGates(input);
  const riskGates = generateRiskGates(input);
  const protectionGates = generateProtectionGates(input);
  const stateSequence = buildStateSequence(ownershipValid, input, readiness);
  const bridgeState = stateSequence[stateSequence.length - 1] ?? 'BLOCKED';

  if (!ownershipValid) {
    throw new Error(ownership.reason);
  }

  return {
    bridgeId: createBridgeId(),
    workspaceId: input.workspaceId,
    projectId: input.projectId.trim().toLowerCase().replace(/\s+/g, '-'),
    planId: input.planId,
    simulationId: input.simulationId,
    builderId: input.builderId,
    verificationId: input.verificationId,
    learningId: input.learningId,
    bridgeState,
    executionReadiness: readiness,
    eligibleExecutionRequests: eligible,
    blockedExecutionRequests: blocked,
    approvalGates,
    verificationGates,
    rollbackGates,
    riskGates,
    protectionGates,
    recommendations: compileRecommendations(input, readiness),
    confirmation: {
      bridgeClassificationOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
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

export class DevPulseV2ControlledExecutionBridge {
  private readonly foundationId = createFoundationId();
  private readonly bridges: BridgeResult[] = [];
  private bridgeWarnings: string[] = [
    'Phase 7.7 Controlled Execution Bridge Foundation V1 — classification only.',
    'No execution, file modification, code generation, or deployment.',
  ];
  private bridgeErrors: string[] = [];

  static readonly ownerModule = CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE;
  static readonly ownerDomain = 'controlled_execution_bridge' as const;
  static readonly passToken = CONTROLLED_EXECUTION_BRIDGE_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('controlled_execution_bridge');
    return owner.ownerModule === CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE && owner.phase === 7.7;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const bridgeOwner = getDevPulseV2Owner('controlled_execution_bridge').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== bridgeOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromAutonomousBuilder();
  }

  static assertDoesNotExecute(): boolean {
    const bridge = new DevPulseV2ControlledExecutionBridge();
    return (
      typeof (bridge as { execute?: unknown }).execute === 'undefined' &&
      typeof (bridge as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (bridge as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (bridge as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (bridge as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (bridge as { writeFile?: unknown }).writeFile === 'undefined' &&
      typeof (bridge as { captureLessons?: unknown }).captureLessons === 'undefined' &&
      typeof (bridge as { generateBuilderPacket?: unknown }).generateBuilderPacket === 'undefined' &&
      typeof (bridge as { generateVerification?: unknown }).generateVerification === 'undefined'
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
      assertNoRegistryRuntimeMutation() &&
      getDevPulseV2Owner('world2_workspace_foundation').phase === 7.1 &&
      getDevPulseV2Owner('world2_execution_planner').phase === 7.2 &&
      getDevPulseV2Owner('world2_simulation_runtime').phase === 7.3 &&
      getDevPulseV2Owner('world2_autonomous_builder').phase === 7.4 &&
      getDevPulseV2Owner('world2_completion_verifier').phase === 7.5 &&
      getDevPulseV2Owner('world2_learning_loop').phase === 7.6 &&
      getDevPulseV2Owner('controlled_execution_bridge').phase === 7.7
    );
  }

  classifyExecutionEligibility(input: BridgeInput): BridgeResult {
    const result = classifyBridge(input);
    this.bridges.push(cloneBridgeResult(result));
    this.publishSummary(result);
    return cloneBridgeResult(result);
  }

  getBridges(): BridgeResult[] {
    return this.bridges.map(cloneBridgeResult);
  }

  getBridgeByWorkspace(workspaceId: string): BridgeResult | null {
    const result = this.bridges.find((b) => b.workspaceId === workspaceId);
    return result ? cloneBridgeResult(result) : null;
  }

  getBridgeByProject(projectId: string): BridgeResult | null {
    const normalized = projectId.trim().toLowerCase().replace(/\s+/g, '-');
    const result = this.bridges.find((b) => b.projectId === normalized);
    return result ? cloneBridgeResult(result) : null;
  }

  getBridgeState(): ControlledExecutionBridgeState {
    return {
      foundationId: this.foundationId,
      bridgePacketCount: this.bridges.length,
      warnings: [...this.bridgeWarnings],
      errors: [...this.bridgeErrors],
    };
  }

  buildReport(result: BridgeResult) {
    return buildControlledExecutionReport(this.getBridgeState(), result);
  }

  formatReport(result: BridgeResult): string {
    return formatControlledExecutionReport(this.getBridgeState(), result);
  }

  getGovernanceSummary(): string {
    return getBridgeGovernanceSummary();
  }

  checkCrossWorkspaceBridgeAccess(
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

  private publishSummary(result: BridgeResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Bridge classified: ${result.bridgeId}`,
      summary: `Execution eligibility for ${result.projectId} — ${result.eligibleExecutionRequests.length} eligible, ${result.blockedExecutionRequests.length} blocked. Classification only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.bridgeId,
      status: 'INFO',
      warnings: ['Bridge classification only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2ControlledExecutionBridge(): DevPulseV2ControlledExecutionBridge {
  singleton = new DevPulseV2ControlledExecutionBridge();
  return singleton;
}

export function getDevPulseV2ControlledExecutionBridge(): DevPulseV2ControlledExecutionBridge {
  if (!singleton) {
    singleton = new DevPulseV2ControlledExecutionBridge();
  }
  return singleton;
}

export function resetDevPulseV2ControlledExecutionBridgeForTests(): DevPulseV2ControlledExecutionBridge {
  resetBridgeCounterForTests();
  singleton = new DevPulseV2ControlledExecutionBridge();
  return singleton;
}

export {
  approvalGatesKey,
  executionRequestsKey,
  protectionGatesKey,
  rollbackGatesKey,
  riskGatesKey,
  verificationGatesKey,
  BRIDGE_STATE_SEQUENCE,
  CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE,
  CONTROLLED_EXECUTION_BRIDGE_PASS_TOKEN,
};
