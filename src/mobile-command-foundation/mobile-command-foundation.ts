/**
 * DevPulse V2 Mobile Command Foundation — Phase 8.1.
 * Remote command center session establishment only.
 * Does NOT execute, modify files, generate code, or deploy.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';
import {
  checkCrossWorkspaceAccess,
  checkWorld1ModificationAttempt,
} from '../world2-workspace-foundation/workspace-boundary-rules.js';
import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { capabilitiesKey, evaluateCapabilities } from './capability-evaluation-engine.js';
import { cloudSessionKey, validateCloudSession } from './cloud-session-engine.js';
import {
  buildReadinessContext,
  determineConnectionReadiness,
  isSessionReady,
} from './connection-readiness-engine.js';
import { deviceValidationKey, validateDevice } from './device-validation-engine.js';
import {
  assertDistinctFromControlledExecutionBridge,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getMobileGovernanceSummary,
  governanceGatesKey,
  validateGovernance,
} from './mobile-governance-bridge.js';
import { ownershipGatesKey, validateWorkspaceOwnership } from './mobile-ownership-engine.js';
import {
  assertNoApprovalSelfGrant,
  assertNoDuplicateProjectTruth,
  assertNoWorld2MutationPath,
  evaluateSecurity,
} from './mobile-security-engine.js';
import { buildMobileCommandReport, formatMobileCommandReport } from './mobile-command-report.js';
import type {
  ConnectionReadiness,
  MobileCommandFoundationState,
  MobileSessionInput,
  MobileSessionResult,
  SessionState,
} from './types.js';
import {
  DUPLICATE_PATTERNS,
  MOBILE_COMMAND_FOUNDATION_OWNER_MODULE,
  MOBILE_COMMAND_FOUNDATION_PASS_TOKEN,
  SESSION_STATE_SEQUENCE,
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

let singleton: DevPulseV2MobileCommandFoundation | null = null;
let sessionCounter = 0;

export function resetSessionCounterForTests(): void {
  sessionCounter = 0;
}

function createFoundationId(): string {
  return `mobile-command-foundation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMobileSessionId(): string {
  sessionCounter += 1;
  return `mobile-session-${sessionCounter.toString().padStart(4, '0')}`;
}

function buildStateSequence(
  deviceValid: boolean,
  ownershipValid: boolean,
  governanceValid: boolean,
  cloudValid: boolean,
  securityBlocked: boolean,
  readiness: ConnectionReadiness,
): SessionState[] {
  if (securityBlocked || !deviceValid) return ['SESSION_REQUEST_RECEIVED', 'SESSION_BLOCKED'];

  const sequence: SessionState[] = ['SESSION_REQUEST_RECEIVED', 'DEVICE_VALIDATED'];

  if (ownershipValid) sequence.push('OWNERSHIP_VALIDATED');
  if (governanceValid) sequence.push('GOVERNANCE_VALIDATED');
  if (cloudValid) sequence.push('CLOUD_SESSION_VALIDATED');

  sequence.push('CAPABILITIES_EVALUATED');

  if (isSessionReady(readiness)) {
    sequence.push('SESSION_READY');
  } else if (
    !ownershipValid ||
    !governanceValid ||
    !cloudValid ||
    readiness === 'NOT_READY' ||
    readiness === 'NEEDS_AUTH'
  ) {
    sequence.push('SESSION_BLOCKED');
  } else {
    sequence.push('SESSION_READY');
  }

  return sequence;
}

function compileRecommendations(
  input: MobileSessionInput,
  readiness: ConnectionReadiness,
): string[] {
  const recommendations: string[] = [
    'Mobile Command Foundation V1 — remote command center only. No execution performed.',
  ];

  if (readiness === 'NEEDS_AUTH') {
    recommendations.push('Authenticate device before establishing command intent session.');
  }
  if (readiness === 'NEEDS_OWNERSHIP') {
    recommendations.push('Resolve workspace and project ownership before command intent.');
  }
  if (readiness === 'NEEDS_GOVERNANCE') {
    recommendations.push('Complete governance validation before approval-required capabilities.');
  }
  if (readiness === 'NEEDS_CLOUD_CONNECTION') {
    recommendations.push('Establish DevPulse Cloud connection before command intent.');
  }
  if (readiness === 'READY_READ_ONLY') {
    recommendations.push('Session ready for read-only monitoring — no local execution.');
  }
  if (readiness === 'READY_COMMAND_INTENT_ONLY') {
    recommendations.push(
      'Session ready for command intent — AiDev Engine in cloud performs actual work.',
    );
  }
  if (input.connectionMode === 'QR_PAIRING') {
    recommendations.push('QR pairing established — verify cloud session before project commands.');
  }

  return recommendations;
}

function cloneSessionResult(result: MobileSessionResult): MobileSessionResult {
  return {
    ...result,
    allowedCapabilities: result.allowedCapabilities.map((c) => ({ ...c })),
    blockedCapabilities: result.blockedCapabilities.map((c) => ({ ...c })),
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    securityWarnings: [...result.securityWarnings],
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
  };
}

export function establishMobileSession(input: MobileSessionInput): MobileSessionResult {
  const security = evaluateSecurity(input);
  const device = validateDevice(input);
  const ownership = validateWorkspaceOwnership(input);
  const governance = validateGovernance(input);
  const cloud = validateCloudSession(input);

  const deviceValid = device.valid && !security.blocked;
  const ownershipValid = ownership.valid;
  const governanceValid = governance.valid;
  const cloudValid = cloud.valid;

  const { allowed, blocked } = evaluateCapabilities(input, input.governanceStatus);

  const readinessCtx = buildReadinessContext(
    input,
    deviceValid,
    ownershipValid,
    governanceValid,
    cloudValid,
    allowed,
  );
  const connectionReadiness = security.blocked
    ? input.authStatus === 'FAIL'
      ? 'NEEDS_AUTH'
      : 'NOT_READY'
    : determineConnectionReadiness(readinessCtx);

  const stateSequence = buildStateSequence(
    deviceValid,
    ownershipValid,
    governanceValid,
    cloudValid,
    security.blocked,
    connectionReadiness,
  );
  const sessionState = stateSequence[stateSequence.length - 1] ?? 'SESSION_BLOCKED';

  const securityWarnings = [
    ...security.warnings,
    ...device.warnings,
  ];

  return {
    mobileSessionId: createMobileSessionId(),
    cloudSessionId: input.cloudSessionId,
    deviceId: input.deviceId,
    userId: input.userId,
    workspaceId: input.workspaceId,
    projectId: normalizeProjectId(input.projectId),
    sessionState,
    allowedCapabilities: allowed,
    blockedCapabilities: blocked,
    connectionReadiness,
    cloudConnectionStatus: input.cloudConnectionStatus,
    cloudSessionReadiness: cloud.cloudSessionReadiness,
    governanceGates: governance.gates,
    ownershipGates: ownership.gates,
    securityWarnings,
    recommendations: compileRecommendations(input, connectionReadiness),
    confirmation: {
      mobileCommandFoundationOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noApprovalSelfGranted: true,
    },
    stateSequence,
    createdAt: Date.now(),
  };
}

export function sessionStructuralKey(result: MobileSessionResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.sessionState,
    result.connectionReadiness,
    capabilitiesKey(result.allowedCapabilities, result.blockedCapabilities),
    governanceGatesKey(result.governanceGates),
    ownershipGatesKey(result.ownershipGates),
    String(result.securityWarnings.length),
  ].join('|');
}

export function sessionStateIncludes(states: SessionState[], target: SessionState): boolean {
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

export class DevPulseV2MobileCommandFoundation {
  private readonly foundationId = createFoundationId();
  private readonly sessions: MobileSessionResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 8.1 Mobile Command Foundation V1 — remote command center only.',
    'No execution, file modification, code generation, or deployment.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = MOBILE_COMMAND_FOUNDATION_OWNER_MODULE;
  static readonly ownerDomain = 'mobile_command_foundation' as const;
  static readonly passToken = MOBILE_COMMAND_FOUNDATION_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('mobile_command_foundation');
    return owner.ownerModule === MOBILE_COMMAND_FOUNDATION_OWNER_MODULE && owner.phase === 8.1;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const mobileOwner = getDevPulseV2Owner('mobile_command_foundation').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== mobileOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromControlledExecutionBridge();
  }

  static assertDoesNotExecute(): boolean {
    const foundation = new DevPulseV2MobileCommandFoundation();
    return (
      typeof (foundation as { execute?: unknown }).execute === 'undefined' &&
      typeof (foundation as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (foundation as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (foundation as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (foundation as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (foundation as { writeFile?: unknown }).writeFile === 'undefined' &&
      typeof (foundation as { approveAction?: unknown }).approveAction === 'undefined'
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
      getDevPulseV2Owner('controlled_execution_bridge').phase === 7.7 &&
      getDevPulseV2Owner('mobile_command_foundation').phase === 8.1
    );
  }

  registerMobileSession(input: MobileSessionInput): MobileSessionResult {
    const result = establishMobileSession(input);
    this.sessions.push(cloneSessionResult(result));
    this.publishSummary(result);
    return cloneSessionResult(result);
  }

  getSessions(): MobileSessionResult[] {
    return this.sessions.map(cloneSessionResult);
  }

  getSessionByWorkspace(workspaceId: string): MobileSessionResult | null {
    const result = this.sessions.find((s) => s.workspaceId === workspaceId);
    return result ? cloneSessionResult(result) : null;
  }

  getSessionByProject(projectId: string): MobileSessionResult | null {
    const normalized = normalizeProjectId(projectId);
    const result = this.sessions.find((s) => s.projectId === normalized);
    return result ? cloneSessionResult(result) : null;
  }

  getFoundationState(): MobileCommandFoundationState {
    return {
      foundationId: this.foundationId,
      sessionCount: this.sessions.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: MobileSessionResult) {
    return buildMobileCommandReport(this.getFoundationState(), result);
  }

  formatReport(result: MobileSessionResult): string {
    return formatMobileCommandReport(this.getFoundationState(), result);
  }

  getGovernanceSummary(): string {
    return getMobileGovernanceSummary();
  }

  checkCrossWorkspaceSessionAccess(
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

  checkNoApprovalSelfGrant(input: MobileSessionInput): boolean {
    return assertNoApprovalSelfGrant(input);
  }

  checkNoWorld2Mutation(capabilities: string[]): boolean {
    return assertNoWorld2MutationPath(capabilities);
  }

  checkNoDuplicateProjectTruth(): boolean {
    return assertNoDuplicateProjectTruth();
  }

  private publishSummary(result: MobileSessionResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Mobile session established: ${result.mobileSessionId}`,
      summary: `Mobile command session for ${result.projectId} — ${result.allowedCapabilities.length} allowed, ${result.blockedCapabilities.length} blocked. Foundation only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.mobileSessionId,
      status: 'INFO',
      warnings: ['Mobile command foundation only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2MobileCommandFoundation(): DevPulseV2MobileCommandFoundation {
  singleton = new DevPulseV2MobileCommandFoundation();
  return singleton;
}

export function getDevPulseV2MobileCommandFoundation(): DevPulseV2MobileCommandFoundation {
  if (!singleton) {
    singleton = new DevPulseV2MobileCommandFoundation();
  }
  return singleton;
}

export function resetDevPulseV2MobileCommandFoundationForTests(): DevPulseV2MobileCommandFoundation {
  resetSessionCounterForTests();
  singleton = new DevPulseV2MobileCommandFoundation();
  return singleton;
}

export {
  capabilitiesKey,
  cloudSessionKey,
  deviceValidationKey,
  governanceGatesKey,
  ownershipGatesKey,
  SESSION_STATE_SEQUENCE,
  MOBILE_COMMAND_FOUNDATION_OWNER_MODULE,
  MOBILE_COMMAND_FOUNDATION_PASS_TOKEN,
};
