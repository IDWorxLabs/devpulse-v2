/**
 * Mobile Chat Runtime Foundation — registry and orchestrator.
 * Authority only — no mobile UI, LLM execution, or cloud execution.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { processCloudRuntimeRequest, listRuntimes } from '../cloud-runtime/index.js';
import { processWorkspaceHostingRequest, listWorkspaces } from '../workspace-hosting/index.js';
import { processPersistentBuildRequest, listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { processCloudVerificationRequest, listCloudVerifications } from '../cloud-verification/index.js';
import { processCloudMonitoringRequest, listMonitoringRecords } from '../cloud-monitoring/index.js';
import {
  processMobileCommandRequest,
  listMobileCommandSessionsAll,
} from '../mobile-command-runtime/index.js';
import { publishMobileChatFeedStages } from '../operator-feed/mobile-chat-feed-bridge.js';
import {
  nextMobileChatId,
  storeMobileChatSession,
  getStoredMobileChatSession,
  listStoredMobileChatSessions,
} from './mobile-chat-store.js';
import { buildMobileChatOwnership, recordMobileChatOwnershipHistory } from './mobile-chat-ownership.js';
import { buildDefaultMobileChatContext, refreshMobileChatContext } from './mobile-chat-context.js';
import { buildDefaultMobileChatPermissions, evaluateMobileChatAction, registerMobileChatActionGateResult } from './mobile-chat-action-gate.js';
import { linkMobileChatToCommandSession } from './mobile-chat-command-bridge.js';
import { linkMobileChatToCloud } from './mobile-chat-cloud-bridge.js';
import { linkMobileChatToWorkspace } from './mobile-chat-workspace-bridge.js';
import { linkMobileChatToBuild } from './mobile-chat-build-bridge.js';
import { linkMobileChatToVerification } from './mobile-chat-verification-bridge.js';
import { linkMobileChatToMonitoring } from './mobile-chat-monitoring-bridge.js';
import { linkMobileChatToOperatorFeed } from './mobile-chat-operator-feed-bridge.js';
import { linkMobileChatToProjectVault } from './mobile-chat-project-vault-bridge.js';
import { createMobileChatSession as createTrackedMobileChatSession } from './mobile-chat-session-manager.js';
import { recordMobileChatLifecycleEvent, initializeMobileChat, completeMobileChat } from './mobile-chat-lifecycle.js';
import { setMobileChatState } from './mobile-chat-state-manager.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import { intakeMobileChatPrompt } from './mobile-chat-prompt-intake.js';
import { routeMobileChatIntent } from './mobile-chat-command-router.js';
import { setMobileChatResponsePending, setMobileChatResponseReady } from './mobile-chat-response-state.js';
import { registerMobileMessage } from './mobile-chat-message-store.js';
import { validateMobileChatRegistration, validateMobileChatRecord } from './mobile-chat-validator.js';
import { updateMobileChatDiagnostics, getMobileChatDiagnostics } from './mobile-chat-diagnostics.js';
import { buildAllMobileChatReports, composeMobileChatResponse } from './mobile-chat-report-builder.js';
import type {
  MobileChatSession,
  MobileChatCategory,
  MobileChatValidationResult,
  PrepareMobileChatRuntimeFoundationInput,
  PrepareMobileChatRuntimeFoundationResult,
  RegisterMobileChatInput,
  RegisterMobileChatResult,
} from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE, isDuplicateMobileChatExecutorQuestion } from './mobile-chat-types.js';

const BOOTSTRAP_MOBILE_CHATS: Array<{
  name: string;
  type: MobileChatCategory;
  description: string;
  commandNameMatch: string;
}> = [
  { name: 'General Mobile Chat', type: 'GENERAL_MOBILE_CHAT', description: 'General mobile chat authority', commandNameMatch: 'General Mobile Command' },
  { name: 'Project Mobile Chat', type: 'PROJECT_MOBILE_CHAT', description: 'Project mobile chat authority', commandNameMatch: 'Project Mobile Command' },
  { name: 'World 2 Mobile Chat', type: 'WORLD2_MOBILE_CHAT', description: 'World 2 mobile chat authority', commandNameMatch: 'World 2 Mobile Command' },
  { name: 'AiDev Mobile Chat', type: 'AIDEV_MOBILE_CHAT', description: 'AiDev mobile chat authority', commandNameMatch: 'AiDev Mobile Command' },
  { name: 'Autonomous Mobile Chat', type: 'AUTONOMOUS_MOBILE_CHAT', description: 'Autonomous mobile chat authority', commandNameMatch: 'Autonomous Mobile Command' },
  { name: 'Founder Mobile Chat', type: 'FOUNDER_MOBILE_CHAT', description: 'Founder mobile chat authority', commandNameMatch: 'Founder Mobile Command' },
  { name: 'Verification Mobile Chat', type: 'VERIFICATION_MOBILE_CHAT', description: 'Verification mobile chat authority', commandNameMatch: 'Verification Mobile Command' },
  { name: 'Monitoring Mobile Chat', type: 'MONITORING_MOBILE_CHAT', description: 'Monitoring mobile chat authority', commandNameMatch: 'Monitoring Mobile Command' },
  { name: 'App Build Mobile Chat', type: 'APP_BUILD_MOBILE_CHAT', description: 'App build mobile chat authority', commandNameMatch: 'General Mobile Command' },
];

let bootstrapped = false;

export function resetMobileChatBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processWorkspaceHostingRequest('Show hosted workspace inventory');
  processPersistentBuildRequest('Show persistent build inventory');
  processCloudVerificationRequest('Show cloud verification inventory');
  processCloudMonitoringRequest('Show cloud monitoring inventory');
  processMobileCommandRequest('Show mobile command inventory');
}

function resolveLinksFromCommand(commandNameMatch: string): {
  mobileCommandSessionId: string;
  workspaceId: string;
  runtimeId: string;
  persistentBuildId: string;
  verificationId: string;
  monitoringId: string;
  projectId: string;
} | null {
  const command =
    listMobileCommandSessionsAll().find((c) => c.mobileCommandMetadata.commandName.includes(commandNameMatch)) ??
    listMobileCommandSessionsAll()[0];
  if (!command) return null;
  return {
    mobileCommandSessionId: command.mobileCommandId,
    workspaceId: command.mobileCommandOwner.workspaceId,
    runtimeId: command.mobileCommandOwner.runtimeId,
    persistentBuildId: command.mobileCommandOwner.persistentBuildId,
    verificationId: command.mobileCommandOwner.verificationId,
    monitoringId: command.mobileCommandOwner.monitoringId,
    projectId: command.mobileCommandOwner.projectId,
  };
}

function bootstrapMobileChats(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_MOBILE_CHATS) {
    const links = resolveLinksFromCommand(seed.commandNameMatch);
    if (!links) continue;
    registerMobileChatSession({
      chatName: seed.name,
      mobileChatType: seed.type,
      projectId: links.projectId || projectId,
      mobileCommandSessionId: links.mobileCommandSessionId,
      workspaceId: links.workspaceId,
      runtimeId: links.runtimeId,
      persistentBuildId: links.persistentBuildId,
      verificationId: links.verificationId,
      monitoringId: links.monitoringId,
      chatDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerMobileChatSession(input: RegisterMobileChatInput): RegisterMobileChatResult {
  const existing = listStoredMobileChatSessions().find(
    (s) =>
      s.mobileChatMetadata.chatName === input.chatName &&
      s.mobileChatOwner.projectId === input.projectId &&
      s.mobileChatOwner.mobileCommandSessionId === input.mobileCommandSessionId &&
      s.mobileChatType === (input.mobileChatType ?? 'GENERAL_MOBILE_CHAT'),
  );
  if (existing && !input.allowDuplicate) {
    return { session: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateMobileChatRegistration(input);
  if (!validation.valid) {
    return { session: null, duplicate: false, duplicateRisks: validation.duplicateRisks, blocked: true };
  }

  const now = Date.now();
  const mobileChatId = nextMobileChatId();
  const chatType = input.mobileChatType ?? 'GENERAL_MOBILE_CHAT';
  const ownership = buildMobileChatOwnership({
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    monitoringId: input.monitoringId,
    createdBy: input.createdBy,
  });

  const session: MobileChatSession = {
    mobileChatId,
    mobileChatType: chatType,
    mobileChatOwner: ownership,
    mobileChatState: 'CREATED',
    mobileChatStatus: 'UNKNOWN',
    mobileChatMetadata: {
      chatName: input.chatName,
      chatDescription: input.chatDescription ?? '',
      tags: [chatType],
      monitorable: true,
    },
    mobileChatVisibility: input.visibility ?? 'PROJECT',
    mobileChatProvenance: {
      sourceSystem: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    mobileChatContext: buildDefaultMobileChatContext({
      projectId: input.projectId,
      mobileCommandSessionId: input.mobileCommandSessionId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      verificationId: input.verificationId,
      monitoringId: input.monitoringId,
      mobileChatType: chatType,
    }),
    mobileChatPermissions: buildDefaultMobileChatPermissions(chatType),
    mobileChatPrompts: [],
    mobileChatResponseState: null,
    mobileChatCommandRoutes: [],
    mobileChatActionGateResults: [],
    mobileChatCommandLink: {
      mobileCommandId: input.mobileCommandSessionId,
      linkedAt: now,
      linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileChatCloudLink: { runtimeId: input.runtimeId, linkedAt: now, linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE, mismatchDetected: false },
    mobileChatWorkspaceLink: { workspaceId: input.workspaceId, linkedAt: now, linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE, mismatchDetected: false },
    mobileChatBuildLink: { persistentBuildId: input.persistentBuildId, linkedAt: now, linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE, mismatchDetected: false },
    mobileChatVerificationLink: { verificationId: input.verificationId, linkedAt: now, linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE, mismatchDetected: false },
    mobileChatMonitoringLink: { monitoringId: input.monitoringId, linkedAt: now, linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE, mismatchDetected: false },
    mobileChatOperatorFeedLink: { feedAuthorityId: 'devpulse_v2_operator_feed_foundation', linkedAt: now, linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE, mismatchDetected: false },
    mobileChatProjectVaultLink: { vaultProjectId: input.projectId, linkedAt: now, linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE, mismatchDetected: false },
    createdAt: now,
    updatedAt: now,
  };

  storeMobileChatSession(session);
  recordMobileChatLifecycleEvent(mobileChatId, 'MOBILE_CHAT_CREATED', `Registered ${input.chatName}`);
  linkMobileChatToCommandSession(mobileChatId, input.mobileCommandSessionId);
  linkMobileChatToCloud(mobileChatId, input.runtimeId);
  linkMobileChatToWorkspace(mobileChatId, input.workspaceId);
  linkMobileChatToBuild(mobileChatId, input.persistentBuildId);
  linkMobileChatToVerification(mobileChatId, input.verificationId);
  linkMobileChatToMonitoring(mobileChatId, input.monitoringId);
  linkMobileChatToOperatorFeed(mobileChatId);
  linkMobileChatToProjectVault(mobileChatId, input.projectId);
  recordMobileChatOwnershipHistory(mobileChatId, `Ownership assigned to ${ownership.ownerModule}`);
  recordMobileChatHistoryEntry({
    mobileChatId,
    category: 'MOBILE_CHAT',
    summary: `Mobile chat ${mobileChatId} registered: ${input.chatName}`,
    scopeUsed: input.projectId,
  });

  return {
    session: getStoredMobileChatSession(mobileChatId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function getMobileChatSession(mobileChatId: string): MobileChatSession | null {
  return getStoredMobileChatSession(mobileChatId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareMobileChatRuntimeFoundationInput> = {},
): PrepareMobileChatRuntimeFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('mobile_chat_runtime_foundation');
  const command = listMobileCommandSessionsAll()[0];
  const monitoring = listMonitoringRecords()[0];
  const build = listPersistentBuilds()[0];

  return {
    query,
    projectId: project.projectId,
    mobileCommandSessionId: command?.mobileCommandId ?? 'mcmd-0001',
    runtimeId: command?.mobileCommandOwner.runtimeId ?? listRuntimes()[0]?.runtimeId ?? 'crrt-0001',
    workspaceId: command?.mobileCommandOwner.workspaceId ?? build?.buildOwner.workspaceId ?? 'hws-0001',
    persistentBuildId: command?.mobileCommandOwner.persistentBuildId ?? build?.buildId ?? 'pbuild-0001',
    verificationId: command?.mobileCommandOwner.verificationId ?? listCloudVerifications()[0]?.verificationId ?? 'cver-0001',
    monitoringId: command?.mobileCommandOwner.monitoringId ?? monitoring?.monitoringId ?? 'cmon-0001',
    chatName: 'DevPulse Mobile Chat',
    mobileChatType: 'GENERAL_MOBILE_CHAT',
    promptText: 'Show mobile chat status',
    projectExists: project.projectId !== 'none',
    commandSessionExists: listMobileCommandSessionsAll().length > 0,
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: listWorkspaces().length > 0,
    persistentBuildExists: listPersistentBuilds().length > 0,
    verificationExists: listCloudVerifications().length > 0,
    monitoringExists: listMonitoringRecords().length > 0,
    ownershipValid: owner.ownerModule === MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

export function prepareMobileChatRuntimeFoundation(
  input: PrepareMobileChatRuntimeFoundationInput,
): PrepareMobileChatRuntimeFoundationResult {
  const query = input.query ?? 'Show mobile chat inventory';

  if (isDuplicateMobileChatExecutorQuestion(query)) {
    publishMobileChatFeedStages(query, false);
    updateMobileChatDiagnostics(query, 'FAILED');
    return {
      session: null,
      trackedSession: null,
      reports: buildAllMobileChatReports(),
      diagnostics: getMobileChatDiagnostics(),
      validation: { valid: false, blockers: ['Duplicate mobile chat executor rejected'], warnings: [], duplicateRisks: [] },
      responseText: 'Recommendation: No.\nDo not create mobile_chat_executor or parallel chat authorities.',
      authorityOnly: true,
    };
  }

  if (
    !input.projectExists ||
    !input.commandSessionExists ||
    !input.runtimeExists ||
    !input.workspaceExists ||
    !input.persistentBuildExists ||
    !input.verificationExists ||
    !input.monitoringExists
  ) {
    publishMobileChatFeedStages(query, false);
    updateMobileChatDiagnostics(query, 'FAILED');
    return {
      session: null,
      trackedSession: null,
      reports: buildAllMobileChatReports(),
      diagnostics: getMobileChatDiagnostics(),
      validation: { valid: false, blockers: ['Missing upstream links'], warnings: [], duplicateRisks: [] },
      responseText: composeMobileChatResponse(query, null, null, buildAllMobileChatReports(), true),
      authorityOnly: true,
    };
  }

  bootstrapMobileChats(input.projectId);

  const registration = registerMobileChatSession({
    chatName: input.chatName ?? 'DevPulse Mobile Chat',
    mobileChatType: input.mobileChatType ?? 'GENERAL_MOBILE_CHAT',
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    workspaceId: input.workspaceId,
    runtimeId: input.runtimeId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    monitoringId: input.monitoringId,
    chatDescription: 'Mobile chat authority session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let session = registration.session;
  let validation: MobileChatValidationResult = {
    valid: !registration.blocked && session !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && session) {
    validation.warnings.push(`Using existing mobile chat session: ${session.mobileChatId}`);
  }

  if (session && !registration.blocked) {
    initializeMobileChat(session.mobileChatId);
    session = getStoredMobileChatSession(session.mobileChatId);
    if (session && session.mobileChatState !== 'READY') {
      setMobileChatState(session.mobileChatId, 'READY', true);
      session = getStoredMobileChatSession(session.mobileChatId);
    }

    const promptText = input.promptText ?? 'Show mobile chat status';
    intakeMobileChatPrompt({ mobileChatId: session!.mobileChatId, promptText, promptSource: 'MOBILE_CHAT_AUTHORITY' });
    refreshMobileChatContext(session!.mobileChatId);
    routeMobileChatIntent(session!.mobileChatId, promptText);

    const viewGate = evaluateMobileChatAction(session!.mobileChatId, 'view_status');
    registerMobileChatActionGateResult({ mobileChatId: session!.mobileChatId, actionName: 'view_status', result: viewGate });
    const buildGate = evaluateMobileChatAction(session!.mobileChatId, 'execute_build');
    registerMobileChatActionGateResult({ mobileChatId: session!.mobileChatId, actionName: 'execute_build', result: buildGate });

    if (buildGate === 'BLOCK') {
      recordMobileChatLifecycleEvent(session!.mobileChatId, 'MOBILE_CHAT_ACTION_BLOCKED', 'execute_build blocked');
    } else {
      recordMobileChatLifecycleEvent(session!.mobileChatId, 'MOBILE_CHAT_ACTION_ALLOWED', 'view_status allowed');
    }

    registerMobileMessage({
      mobileChatId: session!.mobileChatId,
      messageRole: 'USER',
      messageText: promptText,
      promptId: session!.mobileChatPrompts[session!.mobileChatPrompts.length - 1]?.promptId ?? null,
    });

    setMobileChatResponsePending(session!.mobileChatId);
    setMobileChatResponseReady(session!.mobileChatId, 'Mobile chat response metadata ready — no LLM generation', [
      session!.mobileChatId,
      session!.mobileChatOwner.mobileCommandSessionId,
    ]);

    session = getStoredMobileChatSession(session!.mobileChatId);
  }

  const trackedSession = session
    ? createTrackedMobileChatSession({
        mobileChatId: session.mobileChatId,
        projectId: input.projectId,
        mobileCommandSessionId: input.mobileCommandSessionId,
        runtimeId: input.runtimeId,
        workspaceId: input.workspaceId,
        persistentBuildId: input.persistentBuildId,
        verificationId: input.verificationId,
        monitoringId: input.monitoringId,
      })
    : null;

  if (session && trackedSession) {
    completeMobileChat(session.mobileChatId);
    session = getStoredMobileChatSession(session.mobileChatId);
    validation = validateMobileChatRecord(session);
  }

  const blocked = !validation.valid || registration.blocked;
  const reports = buildAllMobileChatReports();
  const finalState = session?.mobileChatState ?? (blocked ? 'FAILED' : 'COMPLETED');

  publishMobileChatFeedStages(query, !blocked, session?.mobileChatId);
  updateMobileChatDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    session,
    trackedSession,
    reports,
    diagnostics: getMobileChatDiagnostics(),
    validation,
    responseText: composeMobileChatResponse(query, session, trackedSession, reports, blocked),
    authorityOnly: true,
  };
}

export function processMobileChatRequest(query: string): PrepareMobileChatRuntimeFoundationResult {
  return prepareMobileChatRuntimeFoundation(resolveInputFromQuery(query));
}

export function getMobileChatContext(query: string): PrepareMobileChatRuntimeFoundationResult {
  return processMobileChatRequest(query);
}
