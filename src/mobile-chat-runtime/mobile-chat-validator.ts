/**
 * Mobile Chat Runtime Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { listMobileCommandSessionsAll } from '../mobile-command-runtime/index.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { listCloudVerifications } from '../cloud-verification/index.js';
import { listMonitoringRecords } from '../cloud-monitoring/index.js';
import { getLatestAiDevSummary } from '../aidev-engine/index.js';
import { getStoredMobileChatSession, listStoredMobileChatSessions } from './mobile-chat-store.js';
import { listStoredMobileChatMessages } from './mobile-chat-store.js';
import { resolveCommandForMobileChatRegistration } from './mobile-chat-command-bridge.js';
import { resolveRuntimeForMobileChatRegistration } from './mobile-chat-cloud-bridge.js';
import { resolveWorkspaceForMobileChatRegistration } from './mobile-chat-workspace-bridge.js';
import { resolveBuildForMobileChatRegistration } from './mobile-chat-build-bridge.js';
import { resolveVerificationForMobileChatRegistration } from './mobile-chat-verification-bridge.js';
import { resolveMonitoringForMobileChatRegistration } from './mobile-chat-monitoring-bridge.js';
import { validateMobileChatContext, detectMobileChatContextMismatch } from './mobile-chat-context.js';
import { validateMobileChatPermissions } from './mobile-chat-action-gate.js';
import { validateMobileChatPrompt } from './mobile-chat-prompt-intake.js';
import { validateMobileChatResponseState } from './mobile-chat-response-state.js';
import type {
  MobileChatSession,
  MobileChatValidationResult,
  DuplicateMobileChatRiskContext,
  RegisterMobileChatInput,
} from './mobile-chat-types.js';
import {
  MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_MOBILE_CHAT_RISK_PREFIX,
  FORBIDDEN_MOBILE_CHAT_DUPLICATES,
} from './mobile-chat-types.js';

export function buildDuplicateMobileChatRiskContext(
  chatName: string,
  mobileChatType: RegisterMobileChatInput['mobileChatType'] = 'GENERAL_MOBILE_CHAT',
): DuplicateMobileChatRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('mobile') && desc.includes('chat');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('mobile') && label.includes('chat');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const feedDiag = getOperatorFeedDiagnostics();
  const aidev = getLatestAiDevSummary();

  return {
    chatName,
    mobileChatType: mobileChatType ?? 'GENERAL_MOBILE_CHAT',
    ownershipDomains,
    capabilityIds,
    vaultSummaries: vault.listProjects().map((p) => `${p.projectId} ${p.name} ${p.summary}`),
    brainSummaries: readAllSystemSummaries().map((s) => `${s.systemId}: ${s.summary}`),
    operatorFeedSummaries: [`active=${feedDiag.operatorFeedActive} events=${feedDiag.eventCount}`],
    mobileCommandSummaries: listMobileCommandSessionsAll().map(
      (c) => `${c.mobileCommandId} ${c.mobileCommandMetadata.commandName}`,
    ),
    runtimeSummaries: listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`),
    workspaceSummaries: listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`),
    persistentBuildSummaries: listPersistentBuilds().map((b) => `${b.buildId} ${b.buildMetadata.buildName}`),
    verificationSummaries: listCloudVerifications().map((v) => `${v.verificationId} ${v.verificationMetadata.verificationName}`),
    monitoringSummaries: listMonitoringRecords().map((m) => `${m.monitoringId} ${m.monitoringMetadata.monitoringName}`),
    world2Summaries: readAllSystemSummaries().filter((s) => s.systemId.includes('world2')).map((s) => s.summary),
    aidevSummaries: aidev ? [aidev.summary] : [],
  };
}

export function evaluateDuplicateMobileChatRisk(context: DuplicateMobileChatRiskContext): string[] {
  const risks: string[] = [];

  const companionDomains = new Set([
    'mobile_chat_runtime_foundation',
    'mobile_command_runtime_foundation',
    'mobile_preview_runtime_foundation',
    'mobile_approval_runtime_foundation',
  ]);
  for (const domain of context.ownershipDomains) {
    if (companionDomains.has(domain)) continue;
    if (domain.includes('mobile') && domain.includes('chat')) {
      risks.push(
        `${DUPLICATE_MOBILE_CHAT_RISK_PREFIX}: ownership domain "${domain}" overlaps mobile chat authority`,
      );
    }
  }

  for (const term of FORBIDDEN_MOBILE_CHAT_DUPLICATES) {
    const normalized = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase().includes(normalized)) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase().includes(normalized))
    ) {
      risks.push(`${DUPLICATE_MOBILE_CHAT_RISK_PREFIX}: parallel mobile chat authority "${term}" registered`);
    }
  }

  return risks;
}

export function validateMobileChatRegistration(input: RegisterMobileChatInput): MobileChatValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project');
  if (!input.mobileCommandSessionId?.trim()) blockers.push('Missing mobile command session link');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link');
  if (!input.persistentBuildId?.trim()) blockers.push('Missing build link');
  if (!input.verificationId?.trim()) blockers.push('Missing verification link');
  if (!input.monitoringId?.trim()) blockers.push('Missing monitoring link');
  if (!input.chatName?.trim()) blockers.push('Missing chat name');

  const commandCheck = resolveCommandForMobileChatRegistration(input.mobileCommandSessionId);
  if (!commandCheck.exists) blockers.push(`Broken command reference — ${input.mobileCommandSessionId} not in Mobile Command Runtime Foundation`);

  if (!resolveRuntimeForMobileChatRegistration(input.runtimeId).exists) blockers.push('Broken runtime reference');
  if (!resolveWorkspaceForMobileChatRegistration(input.workspaceId).exists) blockers.push('Broken workspace reference');
  if (!resolveBuildForMobileChatRegistration(input.persistentBuildId).exists) blockers.push('Broken build reference');
  if (!resolveVerificationForMobileChatRegistration(input.verificationId).exists) blockers.push('Broken verification reference');
  if (!resolveMonitoringForMobileChatRegistration(input.monitoringId).exists) blockers.push('Broken monitoring reference');

  const duplicateRisks = evaluateDuplicateMobileChatRisk(
    buildDuplicateMobileChatRiskContext(input.chatName, input.mobileChatType),
  );
  if (duplicateRisks.length > 0) warnings.push(...duplicateRisks);

  const parallelBlockers = duplicateRisks.filter((r) =>
    FORBIDDEN_MOBILE_CHAT_DUPLICATES.some((term) => r.includes(term)),
  );
  if (parallelBlockers.length > 0 && !input.allowDuplicate) blockers.push(...parallelBlockers);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks };
}

export function validateMobileChatRecord(session: MobileChatSession | null): MobileChatValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!session) {
    blockers.push('Missing mobile chat reference');
    return { valid: false, blockers, warnings, duplicateRisks: [] };
  }

  if (!session.mobileChatOwner.projectId) blockers.push('Missing project ownership');
  if (!session.mobileChatOwner.mobileCommandSessionId) blockers.push('Missing mobile command session link');
  if (session.mobileChatOwner.ownerModule !== MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE) {
    blockers.push(`Invalid ownership — expected ${MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE}`);
  }

  warnings.push(...validateMobileChatContext(session.mobileChatContext));
  warnings.push(...validateMobileChatPermissions(session.mobileChatPermissions));
  for (const prompt of session.mobileChatPrompts) warnings.push(...validateMobileChatPrompt(prompt));
  warnings.push(...validateMobileChatResponseState(session.mobileChatResponseState));
  if (detectMobileChatContextMismatch(session.mobileChatId)) warnings.push('Context mismatch detected');

  const ids = listStoredMobileChatSessions().map((s) => s.mobileChatId);
  if (ids.filter((id) => id === session.mobileChatId).length > 1) blockers.push('Duplicate mobile chat ids');

  const messageIds = listStoredMobileChatMessages().map((m) => m.messageId);
  if (new Set(messageIds).size !== messageIds.length) blockers.push('Duplicate message ids');

  if (!getStoredMobileChatSession(session.mobileChatId)) blockers.push('Broken reference — not in store');

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export function validateMobileChatState(state: string): boolean {
  return [
    'CREATED', 'INITIALIZING', 'READY', 'PROMPT_RECEIVED', 'CONTEXT_READY', 'ROUTED_TO_COMMAND',
    'WAITING_FOR_APPROVAL', 'ACTION_BLOCKED', 'ACTION_ALLOWED', 'RESPONSE_PENDING', 'RESPONSE_READY',
    'COMPLETED', 'FAILED', 'ARCHIVED',
  ].includes(state);
}
