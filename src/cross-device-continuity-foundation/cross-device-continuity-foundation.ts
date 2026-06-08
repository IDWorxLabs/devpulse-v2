/**
 * DevPulse V2 Cross-device Continuity Foundation — Phase 8.5.
 * Context transfer only. Cloud workspace remains source of truth. Does NOT execute.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import { capabilitiesKey, evaluateContinuityCapabilities } from './continuity-capability-engine.js';
import {
  assertDistinctFromMobileApprovalFlowFoundation,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getContinuityGovernanceSummary,
  governanceGatesKey,
  validateContinuityGovernance,
} from './continuity-governance-bridge.js';
import {
  createContinuityPacketId,
  generateHandoffSummary,
  handoffSummaryKey,
} from './continuity-packet-engine.js';
import { determineContinuityReadiness } from './continuity-readiness-engine.js';
import { buildContinuityReport, formatContinuityReport } from './continuity-report.js';
import {
  assertNoDuplicateApprovalTruth,
  assertNoDuplicateChatTruth,
  assertNoDuplicateExecutionTruth,
  assertNoDuplicatePreviewTruth,
  assertNoDuplicateProjectTruth,
  assertNoDuplicateProjectVault,
  evaluateContinuitySecurity,
} from './continuity-security-engine.js';
import {
  classifyContinuityScope,
  requiresCloudStateRefresh,
  scopeClassificationKey,
} from './continuity-scope-engine.js';
import {
  classifyHandoff,
  handoffClassificationKey,
  handoffKey,
  validateCloudContinuitySession,
  validateHandoffRequest,
  validateSourceDevice,
  validateTargetDevice,
} from './device-handoff-engine.js';
import type {
  ContinuityInput,
  ContinuityReadiness,
  ContinuityResult,
  ContinuityState,
  CrossDeviceContinuityFoundationState,
} from './types.js';
import {
  CONTINUITY_STATE_SEQUENCE,
  CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE,
  CROSS_DEVICE_CONTINUITY_FOUNDATION_PASS_TOKEN,
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

let singleton: DevPulseV2CrossDeviceContinuityFoundation | null = null;

function createFoundationId(): string {
  return `cross-device-continuity-foundation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildStateSequence(
  securityBlocked: boolean,
  sourceValid: boolean,
  targetValid: boolean,
  cloudValid: boolean,
  projectValid: boolean,
  handoffClassified: boolean,
  scopeEvaluated: boolean,
  capabilitiesEvaluated: boolean,
  packetCreated: boolean,
  readiness: ContinuityReadiness,
): ContinuityState[] {
  if (securityBlocked || !sourceValid) return ['CONTINUITY_REQUEST_RECEIVED', 'CONTINUITY_BLOCKED'];

  const sequence: ContinuityState[] = ['CONTINUITY_REQUEST_RECEIVED', 'SOURCE_DEVICE_VALIDATED'];
  if (targetValid) sequence.push('TARGET_DEVICE_VALIDATED');
  if (cloudValid) sequence.push('CLOUD_SESSION_VALIDATED');
  if (projectValid) sequence.push('PROJECT_CONTEXT_VALIDATED');
  if (handoffClassified) sequence.push('HANDOFF_CLASSIFIED');
  if (scopeEvaluated) sequence.push('SCOPE_EVALUATED');
  if (capabilitiesEvaluated) sequence.push('CAPABILITIES_EVALUATED');
  if (packetCreated) sequence.push('CONTINUITY_PACKET_CREATED');

  if (readiness === 'READY_CONTEXT_RESUME' || readiness === 'READY_CLOUD_STATE_REFRESH') {
    sequence.push('CONTINUITY_READY');
  } else {
    sequence.push('CONTINUITY_BLOCKED');
  }

  return sequence;
}

function compileRecommendations(
  input: ContinuityInput,
  readiness: ContinuityReadiness,
  cloudRefreshRequired: boolean,
): string[] {
  const recommendations: string[] = [
    'Cross-device Continuity Foundation V1 — context transfer only. Cloud workspace owns project truth.',
  ];

  if (readiness === 'NEEDS_AUTH') recommendations.push('Authenticate before resuming continuity.');
  if (readiness === 'NEEDS_CLOUD_CONNECTION') recommendations.push('Establish cloud connection before handoff.');
  if (readiness === 'NEEDS_SOURCE_DEVICE') recommendations.push('Valid source device required for handoff.');
  if (readiness === 'NEEDS_TARGET_DEVICE') recommendations.push('Valid target device required for handoff.');
  if (readiness === 'NEEDS_PROJECT_CONTEXT') recommendations.push('Valid project context required for continuity.');
  if (readiness === 'NEEDS_GOVERNANCE') recommendations.push('Governance validation required before continuity.');
  if (cloudRefreshRequired) recommendations.push('Request cloud state refresh — do not sync full project files.');
  if (readiness === 'READY_CONTEXT_RESUME') {
    recommendations.push(`Resume ${input.continuityScope} on ${input.toDeviceId} — viewer/context only.`);
  }

  return recommendations;
}

function cloneContinuityResult(result: ContinuityResult): ContinuityResult {
  return {
    ...result,
    allowedContinuityCapabilities: result.allowedContinuityCapabilities.map((c) => ({ ...c })),
    blockedContinuityCapabilities: result.blockedContinuityCapabilities.map((c) => ({ ...c })),
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    cloudGates: result.cloudGates.map((g) => ({ ...g })),
    deviceGates: result.deviceGates.map((g) => ({ ...g })),
    scopeGates: result.scopeGates.map((g) => ({ ...g })),
    securityWarnings: [...result.securityWarnings],
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
  };
}

export function processContinuityHandoff(input: ContinuityInput): ContinuityResult {
  const security = evaluateContinuitySecurity(input);
  const handoffRequest = validateHandoffRequest(input);
  const sourceDevice = validateSourceDevice(input);
  const targetDevice = validateTargetDevice(input);
  const cloudSession = validateCloudContinuitySession(input);
  const governance = validateContinuityGovernance(input);
  const handoff = classifyHandoff(input);
  const scope = classifyContinuityScope(input);

  const sourceValid = sourceDevice.valid && handoffRequest.valid && !security.blocked;
  const targetValid = targetDevice.valid;
  const cloudValid = cloudSession.valid;
  const projectValid = scope.valid;
  const governanceValid = governance.valid;
  const handoffValid = handoff.valid;

  const { allowed, blocked } = evaluateContinuityCapabilities(
    input,
    scope.continuityScope,
    scope.valid,
  );

  const capabilitiesValid = allowed.length > 0;

  const cloudStateRefreshRequired =
    requiresCloudStateRefresh(scope.continuityScope) ||
    allowed.some((c) => c.capability === 'REQUEST_CLOUD_STATE_REFRESH');

  const requestedCaps = input.requestedContinuityCapabilities;
  const cloudRefreshOnly =
    capabilitiesValid &&
    allowed.every((c) => c.capability === 'REQUEST_CLOUD_STATE_REFRESH') &&
    requestedCaps.length > 0 &&
    requestedCaps.every((c) => c === 'REQUEST_CLOUD_STATE_REFRESH');

  const missingCloudSession = !input.cloudSessionId?.trim();
  const missingSourceDevice = !input.fromDeviceId?.trim();
  const missingTargetDevice = !input.toDeviceId?.trim();

  const continuityReadiness = determineContinuityReadiness(
    security.blocked,
    sourceValid,
    targetValid,
    cloudValid,
    projectValid,
    governanceValid,
    capabilitiesValid || allowed.length > 0,
    cloudRefreshOnly,
    input.authStatus,
    input.cloudConnectionStatus,
    input.governanceStatus,
    missingCloudSession,
    missingSourceDevice,
    missingTargetDevice,
  );

  const readyForPacket =
    (continuityReadiness === 'READY_CONTEXT_RESUME' ||
      continuityReadiness === 'READY_CLOUD_STATE_REFRESH') &&
    sourceValid &&
    targetValid &&
    cloudValid &&
    projectValid &&
    governanceValid &&
    handoffValid &&
    allowed.length > 0;

  const handoffSummary = readyForPacket
    ? generateHandoffSummary(input, handoff.handoffType, allowed, cloudStateRefreshRequired)
    : security.blocked
      ? `Continuity blocked: ${security.reason}`
      : 'Continuity not ready — cloud workspace remains source of truth.';

  const stateSequence = buildStateSequence(
    security.blocked,
    sourceValid,
    targetValid,
    cloudValid,
    projectValid,
    handoffValid,
    scope.valid,
    allowed.length > 0 || blocked.length > 0,
    readyForPacket,
    continuityReadiness,
  );

  const continuityState = stateSequence[stateSequence.length - 1] ?? 'CONTINUITY_BLOCKED';

  const deviceGates = [...sourceDevice.gates, ...targetDevice.gates, ...handoff.gates];

  return {
    continuityPacketId: readyForPacket ? createContinuityPacketId() : '',
    continuitySessionId: input.continuitySessionId,
    fromDeviceId: input.fromDeviceId,
    toDeviceId: input.toDeviceId,
    userId: input.userId,
    mobileSessionId: input.mobileSessionId,
    cloudSessionId: input.cloudSessionId,
    conversationId: input.conversationId,
    workspaceId: scope.effectiveWorkspaceId || input.workspaceId,
    projectId: scope.effectiveProjectId || input.projectId,
    handoffRequestId: input.handoffRequestId,
    handoffType: handoff.handoffType,
    continuityState,
    continuityReadiness,
    continuityScope: scope.continuityScope,
    allowedContinuityCapabilities: allowed,
    blockedContinuityCapabilities: blocked,
    handoffSummary,
    cloudStateRefreshRequired,
    ownershipGates: [...scope.gates],
    governanceGates: governance.gates,
    cloudGates: [...cloudSession.gates],
    deviceGates,
    scopeGates: scope.gates,
    securityWarnings: security.warnings,
    recommendations: compileRecommendations(input, continuityReadiness, cloudStateRefreshRequired),
    confirmation: {
      crossDeviceContinuityFoundationOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noApprovalSelfGranted: true,
      noDuplicateProjectTruthCreated: true,
    },
    stateSequence,
    createdAt: Date.now(),
  };
}

export function continuityStructuralKey(result: ContinuityResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.continuityState,
    result.continuityReadiness,
    result.handoffType,
    result.continuityScope,
    handoffClassificationKey(result.handoffType, result.deviceGates.some((g) => g.gateType === 'HANDOFF_TYPE' && g.status === 'OPEN')),
    scopeClassificationKey(result.continuityScope, result.scopeGates.some((g) => g.status === 'OPEN')),
    capabilitiesKey(result.allowedContinuityCapabilities, result.blockedContinuityCapabilities),
    governanceGatesKey(result.governanceGates),
    handoffSummaryKey(result.handoffSummary, result.allowedContinuityCapabilities.length),
  ].join('|');
}

export function continuityStateIncludes(states: ContinuityState[], target: ContinuityState): boolean {
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

export class DevPulseV2CrossDeviceContinuityFoundation {
  private readonly foundationId = createFoundationId();
  private readonly continuityPackets: ContinuityResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 8.5 Cross-device Continuity Foundation V1 — context transfer only.',
    'No execution, file sync, code generation, or deployment.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE;
  static readonly ownerDomain = 'cross_device_continuity_foundation' as const;
  static readonly passToken = CROSS_DEVICE_CONTINUITY_FOUNDATION_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('cross_device_continuity_foundation');
    return owner.ownerModule === CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE && owner.phase === 8.5;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const continuityOwner = getDevPulseV2Owner('cross_device_continuity_foundation').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== continuityOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromMobileApprovalFlowFoundation();
  }

  static assertDoesNotExecute(): boolean {
    const foundation = new DevPulseV2CrossDeviceContinuityFoundation();
    return (
      typeof (foundation as { execute?: unknown }).execute === 'undefined' &&
      typeof (foundation as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (foundation as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (foundation as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (foundation as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (foundation as { syncProjectFiles?: unknown }).syncProjectFiles === 'undefined' &&
      typeof (foundation as { duplicateProjectState?: unknown }).duplicateProjectState === 'undefined'
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
      getDevPulseV2Owner('mobile_command_foundation').phase === 8.1 &&
      getDevPulseV2Owner('mobile_chat_interface').phase === 8.2 &&
      getDevPulseV2Owner('mobile_live_preview_foundation').phase === 8.3 &&
      getDevPulseV2Owner('mobile_approval_flow_foundation').phase === 8.4 &&
      getDevPulseV2Owner('cross_device_continuity_foundation').phase === 8.5
    );
  }

  processHandoff(input: ContinuityInput): ContinuityResult {
    const result = processContinuityHandoff(input);
    this.continuityPackets.push(cloneContinuityResult(result));
    this.publishSummary(result);
    return cloneContinuityResult(result);
  }

  getContinuityPackets(): ContinuityResult[] {
    return this.continuityPackets.map(cloneContinuityResult);
  }

  getContinuityBySession(continuitySessionId: string): ContinuityResult | null {
    const result = this.continuityPackets.find((p) => p.continuitySessionId === continuitySessionId);
    return result ? cloneContinuityResult(result) : null;
  }

  getContinuityByProject(projectId: string): ContinuityResult | null {
    const result = this.continuityPackets.find((p) => p.projectId === projectId);
    return result ? cloneContinuityResult(result) : null;
  }

  getFoundationState(): CrossDeviceContinuityFoundationState {
    return {
      foundationId: this.foundationId,
      continuityPacketCount: this.continuityPackets.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: ContinuityResult, input: ContinuityInput) {
    return buildContinuityReport(this.getFoundationState(), result, input);
  }

  formatReport(result: ContinuityResult, input: ContinuityInput): string {
    return formatContinuityReport(this.getFoundationState(), result, input);
  }

  getGovernanceSummary(): string {
    return getContinuityGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkNoDuplicateProjectTruth(): boolean {
    return assertNoDuplicateProjectTruth();
  }

  checkNoDuplicateProjectVault(): boolean {
    return assertNoDuplicateProjectVault();
  }

  checkNoDuplicateChatTruth(): boolean {
    return assertNoDuplicateChatTruth();
  }

  checkNoDuplicatePreviewTruth(): boolean {
    return assertNoDuplicatePreviewTruth();
  }

  checkNoDuplicateApprovalTruth(): boolean {
    return assertNoDuplicateApprovalTruth();
  }

  checkNoDuplicateExecutionTruth(): boolean {
    return assertNoDuplicateExecutionTruth();
  }

  private publishSummary(result: ContinuityResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Continuity packet: ${result.continuityPacketId || result.handoffRequestId}`,
      summary: `Handoff ${result.handoffType} for ${result.projectId} — ${result.continuityReadiness}. Context only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.continuityPacketId || result.handoffRequestId,
      status: 'INFO',
      warnings: ['Cross-device continuity foundation only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2CrossDeviceContinuityFoundation(): DevPulseV2CrossDeviceContinuityFoundation {
  singleton = new DevPulseV2CrossDeviceContinuityFoundation();
  return singleton;
}

export function getDevPulseV2CrossDeviceContinuityFoundation(): DevPulseV2CrossDeviceContinuityFoundation {
  if (!singleton) {
    singleton = new DevPulseV2CrossDeviceContinuityFoundation();
  }
  return singleton;
}

export function resetDevPulseV2CrossDeviceContinuityFoundationForTests(): DevPulseV2CrossDeviceContinuityFoundation {
  singleton = new DevPulseV2CrossDeviceContinuityFoundation();
  return singleton;
}

export {
  handoffKey,
  governanceGatesKey,
  CONTINUITY_STATE_SEQUENCE,
  CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE,
  CROSS_DEVICE_CONTINUITY_FOUNDATION_PASS_TOKEN,
};
