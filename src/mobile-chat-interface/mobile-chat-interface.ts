/**
 * DevPulse V2 Mobile Chat Interface Foundation — Phase 8.2.
 * Project-aware mobile chat command interface only.
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
import {
  createAiDevConversationPacket,
  createCloudCommandPacket,
  cloudPacketKey,
} from './cloud-command-packet-engine.js';
import { classifyMessageIntent, intentKey } from './message-intent-classifier.js';
import {
  assertDistinctFromMobileCommandFoundation,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getMobileChatGovernanceSummary,
  governanceGatesKey,
  validateChatGovernance,
} from './mobile-chat-governance-bridge.js';
import {
  validateCloudChatSession,
  validateMobileChatSession,
  mobileSessionKey,
} from './mobile-chat-session-engine.js';
import {
  assertNoApprovalSelfGrant,
  assertNoDuplicateProjectTruth,
  evaluateChatSecurity,
} from './mobile-chat-security-engine.js';
import { buildMobileChatReport, formatMobileChatReport } from './mobile-chat-report.js';
import {
  createProjectCreationRequest,
  projectCreationKey,
} from './project-creation-request-engine.js';
import {
  createProjectSwitchRequest,
  projectSwitchKey,
} from './project-switch-request-engine.js';
import {
  evaluateProjectContext,
  inferConversationMode,
  projectContextKey,
} from './project-context-engine.js';
import { classifyWorldTarget, worldTargetKey } from './world-target-classifier.js';
import type {
  ChatReadiness,
  ChatState,
  GateRecord,
  MobileChatInput,
  MobileChatInterfaceState,
  MobileChatResult,
  ProjectContextStatus,
} from './types.js';
import {
  CHAT_STATE_SEQUENCE,
  DUPLICATE_PATTERNS,
  MOBILE_CHAT_INTERFACE_OWNER_MODULE,
  MOBILE_CHAT_INTERFACE_PASS_TOKEN,
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

let singleton: DevPulseV2MobileChatInterface | null = null;
let chatPacketCounter = 0;

export function resetChatPacketCounterForTests(): void {
  chatPacketCounter = 0;
}

function createFoundationId(): string {
  return `mobile-chat-interface-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createChatPacketId(): string {
  chatPacketCounter += 1;
  return `mobile-chat-pkt-${chatPacketCounter.toString().padStart(4, '0')}`;
}

function buildOwnershipGates(input: MobileChatInput, projectId: string): GateRecord[] {
  const gates: GateRecord[] = [];

  if (!input.workspaceId?.trim() && input.conversationMode !== 'NEW_PROJECT') {
    gates.push({
      gateId: 'own-ws-0001',
      gateType: 'WORKSPACE_OWNERSHIP',
      status: 'CLOSED',
      description: 'workspaceId required for existing project chat',
    });
    return gates;
  }

  if (projectId && input.workspaceId) {
    const foundation = getDevPulseV2World2WorkspaceFoundation();
    const workspace = foundation.getManager().getWorkspace(input.workspaceId);
    if (workspace && workspace.projectId === normalizeProjectId(projectId)) {
      gates.push({
        gateId: 'own-proj-0001',
        gateType: 'PROJECT_OWNERSHIP',
        status: 'OPEN',
        description: `Project ownership confirmed: ${projectId}`,
      });
    }
  }

  if (input.targetWorkspaceId && input.targetWorkspaceId !== input.workspaceId) {
    const foundation = getDevPulseV2World2WorkspaceFoundation();
    const target = foundation.getManager().getWorkspace(input.targetWorkspaceId);
    const check = checkCrossWorkspaceAccess(input.workspaceId, target);
    gates.push({
      gateId: 'own-cross-0001',
      gateType: 'CROSS_WORKSPACE',
      status: check.allowed ? 'OPEN' : 'CLOSED',
      description: check.reason,
    });
  }

  return gates;
}

function determineChatReadiness(
  securityBlocked: boolean,
  mobileValid: boolean,
  cloudValid: boolean,
  governanceValid: boolean,
  projectContextStatus: ProjectContextStatus,
  intentBlocked: boolean,
  authStatus: MobileChatInput['authStatus'],
): ChatReadiness {
  if (securityBlocked) {
    if (authStatus === 'FAIL') return 'NEEDS_AUTH';
    if (!mobileValid) return 'NEEDS_MOBILE_SESSION';
    return 'NOT_READY';
  }
  if (!mobileValid) return 'NEEDS_MOBILE_SESSION';
  if (!cloudValid) return 'NEEDS_CLOUD_CONNECTION';
  if (!governanceValid) return 'NEEDS_PROJECT_CONTEXT';
  if (intentBlocked) return 'NOT_READY';
  if (projectContextStatus === 'PROJECT_SELECTION_REQUIRED') return 'NEEDS_PROJECT_SELECTION';
  if (projectContextStatus === 'PROJECT_CONTEXT_BLOCKED') return 'NEEDS_PROJECT_CONTEXT';
  if (projectContextStatus === 'PROJECT_CONTEXT_INVALID') return 'NEEDS_PROJECT_CONTEXT';
  if (projectContextStatus === 'PROJECT_CREATION_REQUIRED') return 'READY_PROJECT_CREATION';
  if (projectContextStatus === 'PROJECT_CONTEXT_READY') return 'READY_PROJECT_COMMAND';
  return 'NOT_READY';
}

function buildStateSequence(
  securityBlocked: boolean,
  mobileValid: boolean,
  cloudValid: boolean,
  governanceValid: boolean,
  projectContextEvaluated: boolean,
  worldClassified: boolean,
  intentClassified: boolean,
  packetCreated: boolean,
  creationCreated: boolean,
  switchCreated: boolean,
  readiness: ChatReadiness,
): ChatState[] {
  if (securityBlocked || !mobileValid) return ['CHAT_REQUEST_RECEIVED', 'CHAT_BLOCKED'];

  const sequence: ChatState[] = ['CHAT_REQUEST_RECEIVED', 'MOBILE_SESSION_VALIDATED'];
  if (cloudValid) sequence.push('CLOUD_SESSION_VALIDATED');
  if (projectContextEvaluated) sequence.push('PROJECT_CONTEXT_EVALUATED');
  if (worldClassified) sequence.push('WORLD_TARGET_CLASSIFIED');
  if (intentClassified) sequence.push('MESSAGE_INTENT_CLASSIFIED');
  if (packetCreated) sequence.push('CONVERSATION_PACKET_CREATED');
  if (creationCreated) sequence.push('PROJECT_CREATION_REQUEST_CREATED');
  if (switchCreated) sequence.push('PROJECT_SWITCH_REQUEST_CREATED');

  if (readiness === 'READY_PROJECT_CREATION' || readiness === 'READY_PROJECT_COMMAND') {
    sequence.push('CHAT_READY');
  } else {
    sequence.push('CHAT_BLOCKED');
  }

  return sequence;
}

function compileRecommendations(
  input: MobileChatInput,
  readiness: ChatReadiness,
  worldRecommendation: string,
): string[] {
  const recommendations: string[] = [
    'Mobile Chat Interface Foundation V1 — project command interface only. No execution performed.',
    worldRecommendation,
  ];

  if (readiness === 'NEEDS_AUTH') {
    recommendations.push('Authenticate before sending project commands.');
  }
  if (readiness === 'NEEDS_CLOUD_CONNECTION') {
    recommendations.push('Establish DevPulse Cloud connection before chat commands.');
  }
  if (readiness === 'NEEDS_PROJECT_SELECTION') {
    recommendations.push('Select a project context before sending project commands.');
  }
  if (readiness === 'READY_PROJECT_CREATION') {
    recommendations.push('Project creation request created — AiDev Engine will process in cloud.');
  }
  if (readiness === 'READY_PROJECT_COMMAND') {
    recommendations.push('Command packet created — cloud-hosted AiDev Engine performs work later.');
  }

  return recommendations;
}

function cloneChatResult(result: MobileChatResult): MobileChatResult {
  return {
    ...result,
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    cloudGates: result.cloudGates.map((g) => ({ ...g })),
    projectContextGates: result.projectContextGates.map((g) => ({ ...g })),
    securityWarnings: [...result.securityWarnings],
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
    projectCreationRequest: result.projectCreationRequest ? { ...result.projectCreationRequest } : null,
    projectSwitchRequest: result.projectSwitchRequest ? { ...result.projectSwitchRequest } : null,
    aiDevConversationPacket: result.aiDevConversationPacket
      ? { ...result.aiDevConversationPacket }
      : null,
    cloudCommandPacket: result.cloudCommandPacket ? { ...result.cloudCommandPacket } : null,
  };
}

export function processMobileChat(input: MobileChatInput): MobileChatResult {
  const security = evaluateChatSecurity(input);
  const mobileSession = validateMobileChatSession(input);
  const cloudSession = validateCloudChatSession(input);
  const governance = validateChatGovernance(input);

  const conversationMode =
    input.conversationMode === 'UNKNOWN' ? inferConversationMode(input) : input.conversationMode;
  const enrichedInput: MobileChatInput = { ...input, conversationMode };

  const projectContext = evaluateProjectContext(enrichedInput);
  const worldClassification = classifyWorldTarget(enrichedInput);
  const intentResult = classifyMessageIntent(enrichedInput);

  const mobileValid = mobileSession.valid && !security.blocked;
  const cloudValid = cloudSession.valid;
  const governanceValid = governance.valid && !intentResult.blocked;

  const creationRequest = createProjectCreationRequest(
    enrichedInput,
    intentResult.intent,
    worldClassification.worldTarget,
  );
  const switchRequest = createProjectSwitchRequest(
    enrichedInput,
    projectContext.effectiveProjectId,
  );

  const effectiveProjectId =
    projectContext.effectiveProjectId ||
    normalizeProjectId(enrichedInput.projectId) ||
    '';

  const cloudPacket =
    mobileValid && cloudValid && governanceValid && !intentResult.blocked
      ? createCloudCommandPacket(
          enrichedInput,
          intentResult.intent,
          worldClassification.worldTarget,
          effectiveProjectId,
          creationRequest,
          enrichedInput.governanceStatus,
        )
      : null;

  const aiDevPacket =
    mobileValid && cloudValid && governanceValid && !intentResult.blocked
      ? createAiDevConversationPacket(
          enrichedInput,
          intentResult.intent,
          worldClassification.worldTarget,
          effectiveProjectId,
          creationRequest,
        )
      : null;

  const ownershipGates = buildOwnershipGates(enrichedInput, effectiveProjectId);

  const chatReadiness = determineChatReadiness(
    security.blocked,
    mobileValid,
    cloudValid,
    governanceValid,
    projectContext.status,
    intentResult.blocked,
    enrichedInput.authStatus,
  );

  const stateSequence = buildStateSequence(
    security.blocked,
    mobileValid,
    cloudValid,
    governanceValid,
    true,
    true,
    true,
    cloudPacket !== null,
    creationRequest !== null && creationRequest.status === 'REQUEST_CREATED',
    switchRequest !== null && switchRequest.status === 'REQUEST_CREATED',
    chatReadiness,
  );

  const chatState = stateSequence[stateSequence.length - 1] ?? 'CHAT_BLOCKED';
  const blockedReason = security.blocked
    ? security.reason
    : intentResult.blocked
      ? intentResult.blockReason
      : !mobileValid
        ? mobileSession.reason
        : !cloudValid
          ? cloudSession.reason
          : !governanceValid
            ? governance.reason
            : '';

  return {
    chatPacketId: createChatPacketId(),
    mobileSessionId: enrichedInput.mobileSessionId,
    cloudSessionId: enrichedInput.cloudSessionId,
    userId: enrichedInput.userId,
    workspaceId: projectContext.effectiveWorkspaceId || enrichedInput.workspaceId,
    projectId: effectiveProjectId,
    conversationId: enrichedInput.conversationId,
    messageId: enrichedInput.messageId,
    chatState,
    worldTarget: worldClassification.worldTarget,
    messageIntent: intentResult.intent,
    conversationMode,
    projectContextStatus: projectContext.status,
    chatReadiness,
    projectCreationRequestId: creationRequest?.projectCreationRequestId ?? enrichedInput.projectCreationRequestId,
    projectCreationRequest: creationRequest,
    projectSwitchRequest: switchRequest,
    aiDevConversationPacket: aiDevPacket,
    cloudCommandPacket: cloudPacket,
    blockedReason,
    ownershipGates,
    governanceGates: governance.gates,
    cloudGates: [...mobileSession.gates, ...cloudSession.gates],
    projectContextGates: projectContext.gates,
    securityWarnings: [...security.warnings],
    recommendations: compileRecommendations(enrichedInput, chatReadiness, worldClassification.recommendation),
    confirmation: {
      mobileChatFoundationOnly: true,
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

export function chatStructuralKey(result: MobileChatResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.chatState,
    result.chatReadiness,
    intentKey(result.messageIntent, result.blockedReason.length > 0),
    worldTargetKey(result.worldTarget),
    projectContextKey(result.projectContextStatus, result.projectId),
    cloudPacketKey(result.cloudCommandPacket),
    projectCreationKey(result.projectCreationRequest),
    projectSwitchKey(result.projectSwitchRequest),
    governanceGatesKey(result.governanceGates),
    String(result.securityWarnings.length),
  ].join('|');
}

export function chatStateIncludes(states: ChatState[], target: ChatState): boolean {
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

export class DevPulseV2MobileChatInterface {
  private readonly foundationId = createFoundationId();
  private readonly chatPackets: MobileChatResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 8.2 Mobile Chat Interface Foundation V1 — project command interface only.',
    'No execution, file modification, code generation, or deployment.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = MOBILE_CHAT_INTERFACE_OWNER_MODULE;
  static readonly ownerDomain = 'mobile_chat_interface' as const;
  static readonly passToken = MOBILE_CHAT_INTERFACE_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('mobile_chat_interface');
    return owner.ownerModule === MOBILE_CHAT_INTERFACE_OWNER_MODULE && owner.phase === 8.2;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const chatOwner = getDevPulseV2Owner('mobile_chat_interface').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== chatOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromMobileCommandFoundation();
  }

  static assertDoesNotExecute(): boolean {
    const chat = new DevPulseV2MobileChatInterface();
    return (
      typeof (chat as { execute?: unknown }).execute === 'undefined' &&
      typeof (chat as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (chat as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (chat as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (chat as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (chat as { writeFile?: unknown }).writeFile === 'undefined' &&
      typeof (chat as { approveAction?: unknown }).approveAction === 'undefined'
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
      getDevPulseV2Owner('mobile_chat_interface').phase === 8.2
    );
  }

  processChatMessage(input: MobileChatInput): MobileChatResult {
    const result = processMobileChat(input);
    this.chatPackets.push(cloneChatResult(result));
    this.publishSummary(result);
    return cloneChatResult(result);
  }

  getChatPackets(): MobileChatResult[] {
    return this.chatPackets.map(cloneChatResult);
  }

  getChatByConversation(conversationId: string): MobileChatResult | null {
    const result = this.chatPackets.find((p) => p.conversationId === conversationId);
    return result ? cloneChatResult(result) : null;
  }

  getChatByProject(projectId: string): MobileChatResult | null {
    const normalized = normalizeProjectId(projectId);
    const result = this.chatPackets.find((p) => p.projectId === normalized);
    return result ? cloneChatResult(result) : null;
  }

  getInterfaceState(): MobileChatInterfaceState {
    return {
      foundationId: this.foundationId,
      chatPacketCount: this.chatPackets.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: MobileChatResult) {
    return buildMobileChatReport(this.getInterfaceState(), result);
  }

  formatReport(result: MobileChatResult): string {
    return formatMobileChatReport(this.getInterfaceState(), result);
  }

  getGovernanceSummary(): string {
    return getMobileChatGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkNoApprovalSelfGrant(input: MobileChatInput): boolean {
    return assertNoApprovalSelfGrant(input);
  }

  checkNoDuplicateProjectTruth(): boolean {
    return assertNoDuplicateProjectTruth();
  }

  private publishSummary(result: MobileChatResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Mobile chat packet: ${result.chatPacketId}`,
      summary: `Chat for ${result.projectId || 'new-project'} — intent ${result.messageIntent}. Foundation only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.chatPacketId,
      status: 'INFO',
      warnings: ['Mobile chat foundation only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2MobileChatInterface(): DevPulseV2MobileChatInterface {
  singleton = new DevPulseV2MobileChatInterface();
  return singleton;
}

export function getDevPulseV2MobileChatInterface(): DevPulseV2MobileChatInterface {
  if (!singleton) {
    singleton = new DevPulseV2MobileChatInterface();
  }
  return singleton;
}

export function resetDevPulseV2MobileChatInterfaceForTests(): DevPulseV2MobileChatInterface {
  resetChatPacketCounterForTests();
  singleton = new DevPulseV2MobileChatInterface();
  return singleton;
}

export {
  mobileSessionKey,
  governanceGatesKey,
  CHAT_STATE_SEQUENCE,
  MOBILE_CHAT_INTERFACE_OWNER_MODULE,
  MOBILE_CHAT_INTERFACE_PASS_TOKEN,
};
