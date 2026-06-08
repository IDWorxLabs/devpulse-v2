/**
 * DevPulse V2 World 2 Completion Verifier Foundation — Phase 7.5 verification layer.
 * Determines completion truth only. Does NOT execute, modify files, or generate code.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import type { ExecutionPlan } from '../world2-execution-planner/types.js';
import type { BuilderResult } from '../world2-autonomous-builder/types.js';
import type { SimulationResult } from '../world2-simulation-runtime/types.js';
import {
  checkCrossWorkspaceAccess,
  checkWorld1ModificationAttempt,
  getDevPulseV2World2WorkspaceFoundation,
} from '../world2-workspace-foundation/index.js';
import {
  completionCriteriaKey,
  evaluateCompletionCriteria,
} from './completion-criteria-engine.js';
import {
  assertDistinctFromAutonomousBuilder,
  assertExecutionAuthorityPresent,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getVerifierGovernanceSummary,
} from './completion-governance-bridge.js';
import {
  completionDecisionKey,
  decideCompletionStatus,
  determineCompletionConfidence,
  evaluateGovernance,
  governanceResultsKey,
} from './completion-decision-engine.js';
import {
  evaluateEvidence,
  evidenceResultsKey,
} from './evidence-evaluation-engine.js';
import {
  evaluateRiskControls,
  riskControlResultsKey,
} from './risk-control-evaluation-engine.js';
import {
  evaluateRollbackRequirements,
  rollbackResultsKey,
} from './rollback-evaluation-engine.js';
import {
  evaluateVerificationRequirements,
  verificationResultsKey,
} from './verification-evaluation-engine.js';
import {
  evaluateWorkspaceIntegrity,
  workspaceIntegrityKey,
} from './workspace-integrity-engine.js';
import {
  buildWorld2CompletionReport,
  formatWorld2CompletionReport,
} from './world2-completion-report.js';
import type {
  VerifierInput,
  VerifierResult,
  VerifierState,
  World2CompletionVerifierState,
} from './types.js';
import {
  DUPLICATE_PATTERNS,
  VERIFIER_STATE_SEQUENCE,
  WORLD2_COMPLETION_VERIFIER_OWNER_MODULE,
  WORLD2_COMPLETION_VERIFIER_PASS_TOKEN,
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

let singleton: DevPulseV2World2CompletionVerifier | null = null;
let verificationCounter = 0;

export function resetVerificationCounterForTests(): void {
  verificationCounter = 0;
}

function createVerifierId(): string {
  return `world2-completion-verifier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createVerificationId(): string {
  verificationCounter += 1;
  return `world2-verification-${verificationCounter.toString().padStart(4, '0')}`;
}

function cloneVerifierResult(result: VerifierResult): VerifierResult {
  return {
    ...result,
    completionReasons: [...result.completionReasons],
    failedRequirements: result.failedRequirements.map((r) => ({ ...r })),
    passedRequirements: result.passedRequirements.map((r) => ({ ...r })),
    verificationResults: result.verificationResults.map((v) => ({ ...v })),
    riskControlResults: result.riskControlResults.map((r) => ({ ...r })),
    rollbackResults: result.rollbackResults.map((r) => ({ ...r })),
    workspaceIntegrityResults: result.workspaceIntegrityResults.map((w) => ({ ...w })),
    governanceResults: result.governanceResults.map((g) => ({ ...g })),
    evidenceResults: result.evidenceResults.map((e) => ({ ...e })),
    recommendations: [...result.recommendations],
    stateSequence: [...result.stateSequence],
    confirmation: { ...result.confirmation },
  };
}

export function verifierInputFromBuilderPacket(
  plan: ExecutionPlan,
  simulation: SimulationResult,
  builderPacket: BuilderResult,
  overrides: Partial<VerifierInput> = {},
): VerifierInput {
  return {
    workspaceId: builderPacket.workspaceId,
    projectId: builderPacket.projectId,
    planId: builderPacket.planId,
    simulationId: builderPacket.simulationId,
    builderId: builderPacket.builderId,
    completionCriteria: plan.completionCriteria.map((c) => ({ ...c })),
    verificationRequirements: builderPacket.verificationRequirements.map((v) => ({ ...v })),
    rollbackRequirements: builderPacket.rollbackRequirements.map((r) => ({ ...r })),
    riskControls: builderPacket.riskControls.map((r) => ({ ...r })),
    approvalRequirements: builderPacket.approvalRequirements.map((a) => ({ ...a })),
    workspaceProtectionChecks: builderPacket.workspaceProtectionChecks.map((c) => ({ ...c })),
    world1ProtectionChecks: builderPacket.world1ProtectionChecks.map((c) => ({ ...c })),
    completionLikelihood: simulation.completionLikelihood,
    confidenceScore: simulation.confidenceScore,
    evidenceReferences: [
      `plan-evidence:${plan.planId}`,
      `simulation-evidence:${simulation.simulationId}`,
      `builder-evidence:${builderPacket.builderId}`,
    ],
    ...overrides,
  };
}

export function validateVerifierOwnership(input: VerifierInput): { valid: boolean; reason: string } {
  if (!input.workspaceId || !input.projectId || !input.planId || !input.simulationId || !input.builderId) {
    return {
      valid: false,
      reason: 'Verifier requires workspaceId, projectId, planId, simulationId, and builderId',
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

  return { valid: true, reason: 'Verifier ownership confirmed' };
}

export function verifierStructuralKey(result: VerifierResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.planId,
    result.simulationId,
    result.builderId,
    result.completionStatus,
    result.completionConfidence,
    completionCriteriaKey(result.passedRequirements),
    verificationResultsKey(result.verificationResults),
    riskControlResultsKey(result.riskControlResults),
    rollbackResultsKey(result.rollbackResults),
    workspaceIntegrityKey(result.workspaceIntegrityResults),
    governanceResultsKey(result.governanceResults),
    evidenceResultsKey(result.evidenceResults),
    completionDecisionKey(result.completionStatus, result.completionConfidence, result.completionReasons.length),
  ].join('|');
}

export function verifierStateIncludes(states: VerifierState[], target: VerifierState): boolean {
  return states.includes(target);
}

export function generateVerification(input: VerifierInput): VerifierResult {
  const ownership = validateVerifierOwnership(input);
  const { passed: criteriaPassed, failed: criteriaFailed } = evaluateCompletionCriteria(
    input.completionCriteria,
  );
  const verificationResults = evaluateVerificationRequirements(input.verificationRequirements);
  const riskControlResults = evaluateRiskControls(input.riskControls);
  const rollbackResults = evaluateRollbackRequirements(input.rollbackRequirements);
  const workspaceIntegrityResults = evaluateWorkspaceIntegrity(input.workspaceProtectionChecks);
  const governanceResults = evaluateGovernance(input.world1ProtectionChecks, ownership.valid);
  const evidenceResults = evaluateEvidence(input.evidenceReferences);

  const warningCount =
    verificationResults.filter((v) => v.result === 'WARNING').length +
    riskControlResults.filter((r) => r.result === 'WARNING').length +
    rollbackResults.filter((r) => r.result === 'WARNING').length;

  const decision = decideCompletionStatus({
    ownershipValid: ownership.valid,
    criteriaPassed,
    criteriaFailed,
    verificationResults,
    riskControlResults,
    rollbackResults,
    workspaceIntegrityResults,
    governanceResults,
    evidenceResults,
    confidenceScore: input.confidenceScore,
    warningCount,
  });

  const failedRequirements = [
    ...criteriaFailed,
    ...verificationResults
      .filter((v) => v.result === 'FAILED')
      .map((v) => ({
        requirementId: v.pointId,
        requirementType: 'verification',
        result: 'FAILED' as const,
        description: v.description,
      })),
    ...evidenceResults
      .filter((e) => e.result === 'FAILED')
      .map((e) => ({
        requirementId: e.evidenceId,
        requirementType: 'evidence',
        result: 'FAILED' as const,
        description: e.description,
      })),
  ];

  const passedRequirements = [
    ...criteriaPassed,
    ...verificationResults
      .filter((v) => v.result === 'PASSED')
      .map((v) => ({
        requirementId: v.pointId,
        requirementType: 'verification',
        result: 'PASSED' as const,
        description: v.description,
      })),
  ];

  const completionConfidence = determineCompletionConfidence(
    decision.status,
    input.confidenceScore,
    failedRequirements.length,
  );

  const stateSequence: VerifierState[] = ownership.valid
    ? [...VERIFIER_STATE_SEQUENCE]
    : ['VERIFICATION_REQUEST_RECEIVED', 'OWNERSHIP_VALIDATED'];

  return {
    verificationId: createVerificationId(),
    workspaceId: input.workspaceId,
    projectId: input.projectId.trim().toLowerCase().replace(/\s+/g, '-'),
    planId: input.planId,
    simulationId: input.simulationId,
    builderId: input.builderId,
    completionStatus: decision.status,
    completionConfidence,
    completionReasons: decision.reasons,
    failedRequirements,
    passedRequirements,
    verificationResults,
    riskControlResults,
    rollbackResults,
    workspaceIntegrityResults,
    governanceResults,
    evidenceResults,
    recommendations: decision.recommendations,
    confirmation: {
      verificationOnlyFoundation: true,
      noExecutionPerformed: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noCommandsExecuted: true,
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

export class DevPulseV2World2CompletionVerifier {
  private readonly verifierId = createVerifierId();
  private readonly verifications: VerifierResult[] = [];
  private verifierWarnings: string[] = [
    'World 2 Completion Verifier Foundation V1 — verification only.',
    'No execution, file modification, command execution, or code generation.',
  ];
  private verifierErrors: string[] = [];

  static readonly ownerModule = WORLD2_COMPLETION_VERIFIER_OWNER_MODULE;
  static readonly ownerDomain = 'world2_completion_verifier' as const;
  static readonly passToken = WORLD2_COMPLETION_VERIFIER_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('world2_completion_verifier');
    return owner.ownerModule === WORLD2_COMPLETION_VERIFIER_OWNER_MODULE && owner.phase === 7.5;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const verifierOwner = getDevPulseV2Owner('world2_completion_verifier').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== verifierOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromAutonomousBuilder();
  }

  static assertDoesNotExecute(): boolean {
    const verifier = new DevPulseV2World2CompletionVerifier();
    return (
      typeof (verifier as { execute?: unknown }).execute === 'undefined' &&
      typeof (verifier as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (verifier as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (verifier as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (verifier as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (verifier as { writeFile?: unknown }).writeFile === 'undefined' &&
      typeof (verifier as { prepareBuildPacket?: unknown }).prepareBuildPacket === 'undefined' &&
      typeof (verifier as { simulatePlan?: unknown }).simulatePlan === 'undefined'
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
      getDevPulseV2Owner('world2_autonomous_builder').phase === 7.4 &&
      getDevPulseV2Owner('world2_completion_verifier').phase === 7.5
    );
  }

  verifyCompletion(input: VerifierInput): VerifierResult {
    const result = generateVerification(input);
    this.verifications.push(cloneVerifierResult(result));
    this.publishSummary(result);
    return cloneVerifierResult(result);
  }

  getVerifications(): VerifierResult[] {
    return this.verifications.map(cloneVerifierResult);
  }

  getVerificationByWorkspace(workspaceId: string): VerifierResult | null {
    const result = this.verifications.find((v) => v.workspaceId === workspaceId);
    return result ? cloneVerifierResult(result) : null;
  }

  getVerificationByBuilder(builderId: string): VerifierResult | null {
    const result = this.verifications.find((v) => v.builderId === builderId);
    return result ? cloneVerifierResult(result) : null;
  }

  getVerifierState(): World2CompletionVerifierState {
    return {
      verifierId: this.verifierId,
      verificationCount: this.verifications.length,
      warnings: [...this.verifierWarnings],
      errors: [...this.verifierErrors],
    };
  }

  buildReport(result: VerifierResult) {
    return buildWorld2CompletionReport(this.getVerifierState(), result);
  }

  formatReport(result: VerifierResult): string {
    return formatWorld2CompletionReport(this.getVerifierState(), result);
  }

  getGovernanceSummary(): string {
    return getVerifierGovernanceSummary();
  }

  checkCrossWorkspaceVerificationAccess(
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

  private publishSummary(result: VerifierResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Completion verification: ${result.verificationId}`,
      summary: `World 2 completion truth for ${result.projectId} — status ${result.completionStatus}. Verification only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.verificationId,
      status: 'INFO',
      warnings: ['Completion verification only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2World2CompletionVerifier(): DevPulseV2World2CompletionVerifier {
  singleton = new DevPulseV2World2CompletionVerifier();
  return singleton;
}

export function getDevPulseV2World2CompletionVerifier(): DevPulseV2World2CompletionVerifier {
  if (!singleton) {
    singleton = new DevPulseV2World2CompletionVerifier();
  }
  return singleton;
}

export function resetDevPulseV2World2CompletionVerifierForTests(): DevPulseV2World2CompletionVerifier {
  resetVerificationCounterForTests();
  singleton = new DevPulseV2World2CompletionVerifier();
  return singleton;
}

export {
  completionCriteriaKey,
  verificationResultsKey,
  riskControlResultsKey,
  rollbackResultsKey,
  workspaceIntegrityKey,
  governanceResultsKey,
  evidenceResultsKey,
  completionDecisionKey,
  WORLD2_COMPLETION_VERIFIER_OWNER_MODULE,
  WORLD2_COMPLETION_VERIFIER_PASS_TOKEN,
};
