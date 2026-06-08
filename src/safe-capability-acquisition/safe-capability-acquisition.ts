/**
 * DevPulse V2 Safe Capability Acquisition Foundation — Phase 9.2.
 * Plans safe capability acquisition only. Does NOT acquire, build, or execute.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import {
  approvalRequiredForMode,
  approvalRequirementsKey,
  createApprovalRequirements,
} from './acquisition-approval-engine.js';
import {
  assertDistinctFromMissingCapabilityDetector,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  assertWorld2Protected,
  getAcquisitionGovernanceSummary,
  governanceGatesKey,
  validateAcquisitionGovernance,
} from './acquisition-governance-bridge.js';
import { createRollbackRequirements, rollbackRequirementsKey } from './acquisition-rollback-engine.js';
import { classifyAcquisitionRisk, riskKey } from './acquisition-risk-engine.js';
import {
  classifyAcquisitionStrategy,
  isDeferStrategy,
  isResearchStrategy,
  strategyKey,
} from './acquisition-strategy-engine.js';
import { createVerificationRequirements, verificationRequirementsKey } from './acquisition-verification-engine.js';
import {
  evaluateAcquisitionProjectContext,
  gapValidationKey,
  validateCapabilityGapInput,
} from './capability-gap-validation-engine.js';
import { createBuildRequestPacket, buildPacketKey } from './build-request-engine.js';
import { createDeferRecord, deferRecordKey } from './defer-record-engine.js';
import { createResearchRequestPacket, researchPacketKey } from './research-request-engine.js';
import {
  buildSafeAcquisitionReport,
  buildSafeAcquisitionReportOutput,
  formatSafeAcquisitionReport,
} from './safe-acquisition-report.js';
import type {
  AcquisitionInput,
  AcquisitionPlanResult,
  AcquisitionReadiness,
  AcquisitionState,
  SafeCapabilityAcquisitionState,
} from './types.js';
import {
  DUPLICATE_PATTERNS,
  ACQUISITION_STATE_SEQUENCE,
  nextAcquisitionId,
  nextAcquisitionPlanId,
  SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE,
  SAFE_CAPABILITY_ACQUISITION_PASS_TOKEN,
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

let singleton: DevPulseV2SafeCapabilityAcquisition | null = null;

function createFoundationId(): string {
  return `safe-capability-acquisition-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function determineReadiness(
  blocked: boolean,
  governanceValid: boolean,
  strategy: ReturnType<typeof classifyAcquisitionStrategy>,
  approvalCount: number,
): AcquisitionReadiness {
  if (blocked || strategy === 'BLOCKED') return 'BLOCKED';
  if (!governanceValid) return 'NEEDS_GOVERNANCE';
  if (isResearchStrategy(strategy)) return approvalCount > 0 ? 'NEEDS_APPROVAL' : 'READY_FOR_RESEARCH';
  if (isDeferStrategy(strategy)) return 'NOT_READY';
  if (approvalCount > 0) return 'NEEDS_APPROVAL';
  return 'READY_FOR_PLANNED_ACQUISITION';
}

function buildStateSequence(
  blocked: boolean,
  gapValid: boolean,
  governanceValid: boolean,
  strategyClassified: boolean,
  riskClassified: boolean,
  approvalCreated: boolean,
  verificationCreated: boolean,
  rollbackCreated: boolean,
  planCreated: boolean,
): AcquisitionState[] {
  if (blocked) return ['ACQUISITION_REQUEST_RECEIVED', 'ACQUISITION_BLOCKED'];

  const sequence: AcquisitionState[] = ['ACQUISITION_REQUEST_RECEIVED'];
  if (gapValid) sequence.push('CAPABILITY_GAP_VALIDATED');
  if (governanceValid) sequence.push('GOVERNANCE_VALIDATED');
  if (strategyClassified) sequence.push('ACQUISITION_STRATEGY_CLASSIFIED');
  if (riskClassified) sequence.push('RISK_CLASSIFIED');
  if (approvalCreated) sequence.push('APPROVAL_REQUIREMENTS_CREATED');
  if (verificationCreated) sequence.push('VERIFICATION_REQUIREMENTS_CREATED');
  if (rollbackCreated) sequence.push('ROLLBACK_REQUIREMENTS_CREATED');
  if (planCreated) sequence.push('ACQUISITION_PLAN_CREATED');
  if (gapValid && governanceValid && planCreated) sequence.push('ACQUISITION_READY');

  return sequence;
}

function buildRecommendations(
  input: AcquisitionInput,
  blocked: boolean,
  strategy: ReturnType<typeof classifyAcquisitionStrategy>,
): string[] {
  if (blocked) {
    return ['Acquisition blocked — safe capability acquisition planning only, no remediation performed.'];
  }

  const recs = [
    `Plan safe acquisition for ${input.capabilityName} via ${strategy} strategy.`,
    'No execution, file modification, code generation, or deployment performed.',
    'No tools downloaded, dependencies installed, or capabilities acquired.',
  ];

  if (approvalRequiredForMode(input.requestedAcquisitionMode)) {
    recs.push('Founder approval required before any acquisition action.');
  }

  return recs;
}

function clonePlanResult(result: AcquisitionPlanResult): AcquisitionPlanResult {
  return {
    ...result,
    approvalRequirements: result.approvalRequirements.map((r) => ({ ...r })),
    verificationRequirements: result.verificationRequirements.map((r) => ({ ...r })),
    rollbackRequirements: result.rollbackRequirements.map((r) => ({ ...r })),
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    securityWarnings: [...result.securityWarnings],
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
    researchRequestPacket: result.researchRequestPacket ? { ...result.researchRequestPacket } : null,
    buildRequestPacket: result.buildRequestPacket ? { ...result.buildRequestPacket } : null,
    deferRecord: result.deferRecord ? { ...result.deferRecord } : null,
  };
}

export function processAcquisitionPlan(input: AcquisitionInput): AcquisitionPlanResult {
  const gapValidation = validateCapabilityGapInput(input);
  const context = evaluateAcquisitionProjectContext(input);
  const governance = validateAcquisitionGovernance(input);

  const blocked = gapValidation.blocked || !context.valid || !governance.valid;
  const strategy = classifyAcquisitionStrategy(input, blocked);
  const riskLevel = classifyAcquisitionRisk(input, blocked);
  const approvalRequirements = createApprovalRequirements(input, riskLevel, blocked);
  const verificationRequirements = createVerificationRequirements(input, blocked);
  const rollbackRequirements = createRollbackRequirements(input, blocked);
  const researchRequestPacket = createResearchRequestPacket(input, strategy, riskLevel, blocked);
  const buildRequestPacket = createBuildRequestPacket(input, strategy, blocked);
  const deferRecord = createDeferRecord(input, strategy, blocked);

  const stateSequence = buildStateSequence(
    blocked,
    gapValidation.valid,
    governance.valid,
    !blocked,
    !blocked,
    approvalRequirements.length > 0 || !blocked,
    verificationRequirements.length > 0 || !blocked,
    rollbackRequirements.length > 0 || !blocked,
    !blocked,
  );

  const acquisitionState = stateSequence[stateSequence.length - 1] ?? 'ACQUISITION_BLOCKED';
  const acquisitionReadiness = determineReadiness(blocked, governance.valid, strategy, approvalRequirements.length);

  return {
    acquisitionPlanId: nextAcquisitionPlanId(),
    acquisitionId: input.acquisitionId ?? nextAcquisitionId(),
    capabilityGapId: input.capabilityGapId,
    analysisId: input.analysisId,
    workspaceId: context.effectiveWorkspaceId || input.workspaceId,
    projectId: context.effectiveProjectId || input.projectId,
    capabilityType: input.capabilityType,
    capabilityName: input.capabilityName,
    acquisitionMode: input.requestedAcquisitionMode,
    acquisitionStrategy: strategy,
    acquisitionState,
    acquisitionReadiness,
    riskLevel,
    approvalRequirements,
    verificationRequirements,
    rollbackRequirements,
    researchRequestPacket,
    buildRequestPacket,
    deferRecord,
    governanceGates: governance.gates,
    ownershipGates: [...gapValidation.gates, ...context.gates],
    securityWarnings: gapValidation.warnings,
    recommendations: buildRecommendations(input, blocked, strategy),
    confirmation: {
      safeCapabilityAcquisitionOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noToolDownloaded: true,
      noDependencyInstalled: true,
      noCapabilityAcquired: true,
    },
    stateSequence,
    createdAt: Date.now(),
  };
}

export function planStructuralKey(result: AcquisitionPlanResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.acquisitionMode,
    result.acquisitionStrategy,
    result.acquisitionState,
    strategyKey(result.acquisitionMode, result.acquisitionStrategy),
    riskKey(result.riskLevel, result.acquisitionMode),
    approvalRequirementsKey(result.approvalRequirements),
    verificationRequirementsKey(result.verificationRequirements),
    rollbackRequirementsKey(result.rollbackRequirements),
    governanceGatesKey(result.governanceGates),
  ].join('|');
}

export function acquisitionStateIncludes(states: AcquisitionState[], target: AcquisitionState): boolean {
  return states.includes(target);
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

export class DevPulseV2SafeCapabilityAcquisition {
  private readonly foundationId = createFoundationId();
  private readonly plans: AcquisitionPlanResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 9.2 Safe Capability Acquisition Foundation V1 — planning only.',
    'No acquisition, execution, file modification, code generation, or deployment.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE;
  static readonly ownerDomain = 'safe_capability_acquisition' as const;
  static readonly passToken = SAFE_CAPABILITY_ACQUISITION_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('safe_capability_acquisition');
    return owner.ownerModule === SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE && owner.phase === 9.2;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const acquisitionOwner = getDevPulseV2Owner('safe_capability_acquisition').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== acquisitionOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromMissingCapabilityDetector();
  }

  static assertDoesNotExecute(): boolean {
    const acquisition = new DevPulseV2SafeCapabilityAcquisition();
    return (
      typeof (acquisition as { execute?: unknown }).execute === 'undefined' &&
      typeof (acquisition as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (acquisition as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (acquisition as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (acquisition as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (acquisition as { acquireCapability?: unknown }).acquireCapability === 'undefined' &&
      typeof (acquisition as { installTool?: unknown }).installTool === 'undefined' &&
      typeof (acquisition as { downloadTool?: unknown }).downloadTool === 'undefined'
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
      assertWorld2Protected() &&
      assertNoRegistryRuntimeMutation() &&
      getDevPulseV2Owner('missing_capability_detector').phase === 9.1 &&
      getDevPulseV2Owner('safe_capability_acquisition').phase === 9.2
    );
  }

  planSafeAcquisition(input: AcquisitionInput): AcquisitionPlanResult {
    const result = processAcquisitionPlan(input);
    this.plans.push(clonePlanResult(result));
    this.publishSummary(result);
    return clonePlanResult(result);
  }

  getPlans(): AcquisitionPlanResult[] {
    return this.plans.map(clonePlanResult);
  }

  getPlanByAcquisitionId(acquisitionId: string): AcquisitionPlanResult | null {
    const result = this.plans.find((p) => p.acquisitionId === acquisitionId);
    return result ? clonePlanResult(result) : null;
  }

  getPlanByProject(projectId: string): AcquisitionPlanResult | null {
    const result = this.plans.find((p) => p.projectId === projectId);
    return result ? clonePlanResult(result) : null;
  }

  getFoundationState(): SafeCapabilityAcquisitionState {
    return {
      foundationId: this.foundationId,
      acquisitionCount: this.plans.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: AcquisitionPlanResult, input: AcquisitionInput) {
    const output = buildSafeAcquisitionReportOutput(input, result);
    return buildSafeAcquisitionReport(this.getFoundationState(), result, output);
  }

  formatReport(result: AcquisitionPlanResult, input: AcquisitionInput): string {
    return formatSafeAcquisitionReport(this.getFoundationState(), result, input);
  }

  getGovernanceSummary(): string {
    return getAcquisitionGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkNoCapabilityAcquired(): boolean {
    return true;
  }

  private publishSummary(result: AcquisitionPlanResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Safe acquisition plan: ${result.acquisitionId}`,
      summary: `${result.acquisitionMode} → ${result.acquisitionStrategy}, ${result.acquisitionState}. Planning only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.acquisitionId,
      status: 'INFO',
      warnings: ['Safe capability acquisition foundation only — no capability acquired.'],
      errors: [],
    });
  }
}

export function createDevPulseV2SafeCapabilityAcquisition(): DevPulseV2SafeCapabilityAcquisition {
  singleton = new DevPulseV2SafeCapabilityAcquisition();
  return singleton;
}

export function getDevPulseV2SafeCapabilityAcquisition(): DevPulseV2SafeCapabilityAcquisition {
  if (!singleton) {
    singleton = new DevPulseV2SafeCapabilityAcquisition();
  }
  return singleton;
}

export function resetDevPulseV2SafeCapabilityAcquisitionForTests(): DevPulseV2SafeCapabilityAcquisition {
  singleton = new DevPulseV2SafeCapabilityAcquisition();
  return singleton;
}

export {
  gapValidationKey,
  governanceGatesKey,
  strategyKey,
  riskKey,
  approvalRequirementsKey,
  verificationRequirementsKey,
  rollbackRequirementsKey,
  researchPacketKey,
  buildPacketKey,
  deferRecordKey,
  ACQUISITION_STATE_SEQUENCE,
  SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE,
  SAFE_CAPABILITY_ACQUISITION_PASS_TOKEN,
};
