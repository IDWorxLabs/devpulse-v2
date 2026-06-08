/**
 * DevPulse V2 Mobile Live Preview Foundation — Phase 8.3.
 * Remote preview viewer only. Does NOT execute, render, modify files, or deploy.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import { evaluateDeviceSuitability, deviceSuitabilityKey } from './device-suitability-engine.js';
import {
  assertDistinctFromMobileChatInterface,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getMobilePreviewGovernanceSummary,
  governanceGatesKey,
  validatePreviewGovernance,
} from './mobile-preview-governance-bridge.js';
import {
  assertNoApprovalSelfGrant,
  assertNoDuplicatePreviewTruth,
  assertNoPreviewSourceOfTruthClaim,
  evaluatePreviewSecurity,
} from './mobile-preview-security-engine.js';
import { buildMobilePreviewReport, formatMobilePreviewReport } from './mobile-preview-report.js';
import {
  evaluatePreviewCapabilities,
  capabilitiesKey,
} from './preview-capability-engine.js';
import {
  validatePreviewProjectContext,
  projectContextKey,
  assertNoProjectCreationThroughPreview,
  assertNoProjectSwitchMutation,
} from './preview-access-engine.js';
import {
  validatePreviewSession,
  validateMobilePreviewSession,
  validateChatPreviewContext,
  validateCloudPreviewSession,
  previewSessionKey,
} from './preview-session-engine.js';
import { evaluatePreviewSource, previewSourceKey } from './preview-source-engine.js';
import { generatePreviewSummary, summaryKey } from './preview-summary-engine.js';
import type {
  MobileLivePreviewFoundationState,
  MobilePreviewResult,
  PreviewReadiness,
  PreviewSessionInput,
  PreviewSourceStatus,
  PreviewState,
} from './types.js';
import {
  DUPLICATE_PATTERNS,
  MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE,
  MOBILE_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN,
  PREVIEW_STATE_SEQUENCE,
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

let singleton: DevPulseV2MobileLivePreviewFoundation | null = null;
let previewPacketCounter = 0;

export function resetPreviewPacketCounterForTests(): void {
  previewPacketCounter = 0;
}

function createFoundationId(): string {
  return `mobile-live-preview-foundation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPreviewPacketId(): string {
  previewPacketCounter += 1;
  return `mobile-preview-pkt-${previewPacketCounter.toString().padStart(4, '0')}`;
}

function determinePreviewReadiness(
  securityBlocked: boolean,
  mobileSessionValid: boolean,
  chatValid: boolean,
  cloudValid: boolean,
  projectValid: boolean,
  sourceStatus: PreviewSourceStatus,
  desktopRequired: boolean,
  mobileSafe: boolean,
  authStatus: PreviewSessionInput['authStatus'],
): PreviewReadiness {
  if (securityBlocked) {
    if (authStatus === 'FAIL') return 'NEEDS_AUTH';
    if (!chatValid) return 'NEEDS_CHAT_CONTEXT';
    if (!mobileSessionValid) return 'NEEDS_MOBILE_SESSION';
    return 'NOT_READY';
  }
  if (!mobileSessionValid) return 'NEEDS_MOBILE_SESSION';
  if (!chatValid) return 'NEEDS_CHAT_CONTEXT';
  if (!cloudValid) return 'NEEDS_CLOUD_CONNECTION';
  if (!projectValid) return 'NEEDS_PROJECT_CONTEXT';
  if (sourceStatus === 'NOT_CREATED' || sourceStatus === 'FAILED') return 'PREVIEW_UNAVAILABLE';
  if (desktopRequired && !mobileSafe) return 'DESKTOP_REQUIRED';
  if (mobileSafe) return 'READY_MOBILE_SAFE_PREVIEW';
  return 'READY_SUMMARY_ONLY';
}

function buildStateSequence(
  securityBlocked: boolean,
  mobileValid: boolean,
  chatValid: boolean,
  cloudValid: boolean,
  projectValid: boolean,
  sourceEvaluated: boolean,
  deviceEvaluated: boolean,
  accessClassified: boolean,
  packetCreated: boolean,
  readiness: PreviewReadiness,
): PreviewState[] {
  if (securityBlocked || !mobileValid) return ['PREVIEW_REQUEST_RECEIVED', 'PREVIEW_BLOCKED'];

  const sequence: PreviewState[] = ['PREVIEW_REQUEST_RECEIVED', 'MOBILE_SESSION_VALIDATED'];
  if (chatValid) sequence.push('CHAT_CONTEXT_VALIDATED');
  if (cloudValid) sequence.push('CLOUD_SESSION_VALIDATED');
  if (projectValid) sequence.push('PROJECT_CONTEXT_VALIDATED');
  if (sourceEvaluated) sequence.push('PREVIEW_SOURCE_EVALUATED');
  if (deviceEvaluated) sequence.push('DEVICE_SUITABILITY_EVALUATED');
  if (accessClassified) sequence.push('PREVIEW_ACCESS_CLASSIFIED');
  if (packetCreated) sequence.push('PREVIEW_PACKET_CREATED');

  if (
    readiness === 'READY_MOBILE_SAFE_PREVIEW' ||
    readiness === 'READY_SUMMARY_ONLY' ||
    readiness === 'DESKTOP_REQUIRED'
  ) {
    sequence.push('PREVIEW_READY');
  } else {
    sequence.push('PREVIEW_BLOCKED');
  }

  return sequence;
}

function compileRecommendations(
  input: PreviewSessionInput,
  readiness: PreviewReadiness,
  desktopRequired: boolean,
): string[] {
  const recommendations: string[] = [
    'Mobile Live Preview Foundation V1 — remote viewer only. Cloud workspace owns preview truth.',
  ];

  if (readiness === 'NEEDS_AUTH') recommendations.push('Authenticate before requesting preview.');
  if (readiness === 'NEEDS_CLOUD_CONNECTION') recommendations.push('Establish cloud connection before preview.');
  if (readiness === 'NEEDS_PROJECT_CONTEXT') recommendations.push('Valid project context required for preview.');
  if (readiness === 'PREVIEW_UNAVAILABLE') recommendations.push('Preview unavailable — wait for cloud workspace build.');
  if (readiness === 'DESKTOP_REQUIRED' || desktopRequired) {
    recommendations.push('Desktop preview recommended — mobile shows summary notice only.');
  }
  if (readiness === 'READY_MOBILE_SAFE_PREVIEW') {
    recommendations.push(`Mobile-safe preview summary for ${input.previewTarget} — viewer only.`);
  }

  return recommendations;
}

function clonePreviewResult(result: MobilePreviewResult): MobilePreviewResult {
  return {
    ...result,
    allowedPreviewCapabilities: result.allowedPreviewCapabilities.map((c) => ({ ...c })),
    blockedPreviewCapabilities: result.blockedPreviewCapabilities.map((c) => ({ ...c })),
    previewAccessGates: result.previewAccessGates.map((g) => ({ ...g })),
    deviceSuitabilityGates: result.deviceSuitabilityGates.map((g) => ({ ...g })),
    cloudGates: result.cloudGates.map((g) => ({ ...g })),
    projectContextGates: result.projectContextGates.map((g) => ({ ...g })),
    previewWarnings: [...result.previewWarnings],
    securityWarnings: [...result.securityWarnings],
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
  };
}

export function processMobilePreview(input: PreviewSessionInput): MobilePreviewResult {
  const security = evaluatePreviewSecurity(input);
  const previewSession = validatePreviewSession(input);
  const mobileSession = validateMobilePreviewSession(input);
  const chatContext = validateChatPreviewContext(input);
  const cloudSession = validateCloudPreviewSession(input);
  const governance = validatePreviewGovernance(input);
  const projectContext = validatePreviewProjectContext(input);
  const sourceEval = evaluatePreviewSource(input);
  const deviceSuit = evaluateDeviceSuitability(input);

  const mobileSessionValid = mobileSession.valid && previewSession.valid;
  const mobileValid = mobileSessionValid && !security.blocked;
  const chatValid = chatContext.valid;
  const cloudValid = cloudSession.valid;
  const projectValid = projectContext.valid;
  const governanceValid = governance.valid;
  const sourceAvailable = sourceEval.sourceStatus === 'AVAILABLE' || sourceEval.sourceStatus === 'STALE';

  const { allowed, blocked } = evaluatePreviewCapabilities(
    input,
    sourceAvailable,
    deviceSuit.mobileSafe,
  );

  const summaryResult = generatePreviewSummary(
    input,
    sourceEval.previewType,
    sourceEval.sourceStatus,
    deviceSuit.mobileSafe,
    deviceSuit.desktopRequired,
  );

  const allWarnings = [
    ...security.warnings,
    ...sourceEval.warnings,
    ...deviceSuit.warnings,
    ...summaryResult.warnings,
  ];

  const previewReadiness = determinePreviewReadiness(
    security.blocked,
    mobileSessionValid,
    chatValid,
    cloudValid,
    projectValid && governanceValid,
    sourceEval.sourceStatus,
    deviceSuit.desktopRequired,
    deviceSuit.mobileSafe,
    input.authStatus,
  );

  const stateSequence = buildStateSequence(
    security.blocked,
    mobileValid,
    chatValid,
    cloudValid,
    projectValid,
    true,
    true,
    true,
    mobileValid && cloudValid && projectValid,
    previewReadiness,
  );

  const previewState = stateSequence[stateSequence.length - 1] ?? 'PREVIEW_BLOCKED';

  const previewAccessGates: typeof governance.gates = [
    ...governance.gates,
    {
      gateId: 'access-0001',
      gateType: 'PREVIEW_ACCESS',
      status:
        previewReadiness === 'READY_MOBILE_SAFE_PREVIEW' ||
        previewReadiness === 'READY_SUMMARY_ONLY' ||
        previewReadiness === 'DESKTOP_REQUIRED'
          ? 'OPEN'
          : 'CLOSED',
      description: `Preview access: ${previewReadiness}`,
    },
  ];

  return {
    mobilePreviewPacketId: createPreviewPacketId(),
    previewSessionId: input.previewSessionId,
    mobileSessionId: input.mobileSessionId,
    cloudSessionId: input.cloudSessionId,
    conversationId: input.conversationId,
    userId: input.userId,
    workspaceId: projectContext.effectiveWorkspaceId || input.workspaceId,
    projectId: projectContext.effectiveProjectId || input.projectId,
    previewRequestId: input.previewRequestId,
    previewState,
    previewReadiness,
    previewTarget: input.previewTarget,
    previewType: sourceEval.previewType,
    previewSourceStatus: sourceEval.sourceStatus,
    allowedPreviewCapabilities: allowed,
    blockedPreviewCapabilities: blocked,
    desktopRequired: deviceSuit.desktopRequired,
    mobileSafe: deviceSuit.mobileSafe,
    previewSummary: summaryResult.summary,
    previewWarnings: allWarnings,
    previewAccessGates,
    deviceSuitabilityGates: deviceSuit.gates,
    cloudGates: [...mobileSession.gates, ...cloudSession.gates],
    projectContextGates: projectContext.gates,
    securityWarnings: security.warnings,
    recommendations: compileRecommendations(input, previewReadiness, deviceSuit.desktopRequired),
    confirmation: {
      mobileLivePreviewFoundationOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noApprovalSelfGranted: true,
      noPreviewSourceOfTruthClaim: true,
    },
    stateSequence,
    createdAt: Date.now(),
  };
}

export function previewStructuralKey(result: MobilePreviewResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.previewState,
    result.previewReadiness,
    result.previewTarget,
    previewSourceKey(result.previewSourceStatus, result.previewType),
    deviceSuitabilityKey(result.mobileSafe, result.desktopRequired),
    capabilitiesKey(result.allowedPreviewCapabilities, result.blockedPreviewCapabilities),
    projectContextKey(result.projectContextGates.length > 0, result.projectId),
    governanceGatesKey(result.previewAccessGates),
    summaryKey(result.previewSummary, result.previewWarnings.length),
  ].join('|');
}

export function previewStateIncludes(states: PreviewState[], target: PreviewState): boolean {
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

export class DevPulseV2MobileLivePreviewFoundation {
  private readonly foundationId = createFoundationId();
  private readonly previewPackets: MobilePreviewResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 8.3 Mobile Live Preview Foundation V1 — remote viewer only.',
    'No execution, rendering, file modification, code generation, or deployment.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE;
  static readonly ownerDomain = 'mobile_live_preview_foundation' as const;
  static readonly passToken = MOBILE_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('mobile_live_preview_foundation');
    return owner.ownerModule === MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE && owner.phase === 8.3;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const previewOwner = getDevPulseV2Owner('mobile_live_preview_foundation').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== previewOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromMobileChatInterface();
  }

  static assertDoesNotExecute(): boolean {
    const foundation = new DevPulseV2MobileLivePreviewFoundation();
    return (
      typeof (foundation as { execute?: unknown }).execute === 'undefined' &&
      typeof (foundation as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (foundation as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (foundation as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (foundation as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (foundation as { renderPreview?: unknown }).renderPreview === 'undefined' &&
      typeof (foundation as { startServer?: unknown }).startServer === 'undefined' &&
      typeof (foundation as { openBrowser?: unknown }).openBrowser === 'undefined'
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
      getDevPulseV2Owner('mobile_live_preview_foundation').phase === 8.3
    );
  }

  requestMobilePreview(input: PreviewSessionInput): MobilePreviewResult {
    const result = processMobilePreview(input);
    this.previewPackets.push(clonePreviewResult(result));
    this.publishSummary(result);
    return clonePreviewResult(result);
  }

  getPreviewPackets(): MobilePreviewResult[] {
    return this.previewPackets.map(clonePreviewResult);
  }

  getPreviewBySession(previewSessionId: string): MobilePreviewResult | null {
    const result = this.previewPackets.find((p) => p.previewSessionId === previewSessionId);
    return result ? clonePreviewResult(result) : null;
  }

  getPreviewByProject(projectId: string): MobilePreviewResult | null {
    const result = this.previewPackets.find((p) => p.projectId === projectId);
    return result ? clonePreviewResult(result) : null;
  }

  getFoundationState(): MobileLivePreviewFoundationState {
    return {
      foundationId: this.foundationId,
      previewPacketCount: this.previewPackets.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: MobilePreviewResult) {
    return buildMobilePreviewReport(this.getFoundationState(), result);
  }

  formatReport(result: MobilePreviewResult): string {
    return formatMobilePreviewReport(this.getFoundationState(), result);
  }

  getGovernanceSummary(): string {
    return getMobilePreviewGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkNoDuplicatePreviewTruth(): boolean {
    return assertNoDuplicatePreviewTruth();
  }

  checkNoPreviewSourceOfTruthClaim(): boolean {
    return assertNoPreviewSourceOfTruthClaim();
  }

  checkNoProjectCreation(): boolean {
    return assertNoProjectCreationThroughPreview();
  }

  checkNoProjectSwitchMutation(): boolean {
    return assertNoProjectSwitchMutation();
  }

  checkNoApprovalSelfGrant(): boolean {
    return assertNoApprovalSelfGrant();
  }

  private publishSummary(result: MobilePreviewResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Mobile preview packet: ${result.mobilePreviewPacketId}`,
      summary: `Preview for ${result.projectId} — ${result.previewTarget}, ${result.previewReadiness}. Viewer only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.mobilePreviewPacketId,
      status: 'INFO',
      warnings: ['Mobile live preview foundation only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2MobileLivePreviewFoundation(): DevPulseV2MobileLivePreviewFoundation {
  singleton = new DevPulseV2MobileLivePreviewFoundation();
  return singleton;
}

export function getDevPulseV2MobileLivePreviewFoundation(): DevPulseV2MobileLivePreviewFoundation {
  if (!singleton) {
    singleton = new DevPulseV2MobileLivePreviewFoundation();
  }
  return singleton;
}

export function resetDevPulseV2MobileLivePreviewFoundationForTests(): DevPulseV2MobileLivePreviewFoundation {
  resetPreviewPacketCounterForTests();
  singleton = new DevPulseV2MobileLivePreviewFoundation();
  return singleton;
}

export {
  previewSessionKey,
  governanceGatesKey,
  PREVIEW_STATE_SEQUENCE,
  MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE,
  MOBILE_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN,
};
