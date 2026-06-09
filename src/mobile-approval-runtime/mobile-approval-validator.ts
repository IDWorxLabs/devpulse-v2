/**
 * Mobile Approval Runtime Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readSystemSummariesForMobileApproval } from './mobile-approval-read-cache.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { listMobileCommandSessionsAll } from '../mobile-command-runtime/index.js';
import { listMobileChatSessionsAll } from '../mobile-chat-runtime/index.js';
import { listMobilePreviewSessionsAll } from '../mobile-preview-runtime/index.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { getLatestAiDevSummary } from '../aidev-engine/index.js';
import { getDevPulseV2MobileApprovalFlowFoundation } from '../mobile-approval-flow-foundation/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getStoredMobileApprovalSession, listStoredMobileApprovalSessions } from './mobile-approval-store.js';
import { resolveCommandForMobileApprovalRegistration } from './mobile-approval-command-bridge.js';
import { resolveChatForMobileApprovalRegistration } from './mobile-approval-chat-bridge.js';
import { resolvePreviewForMobileApprovalRegistration } from './mobile-approval-preview-bridge.js';
import { resolveRuntimeForMobileApprovalRegistration } from './mobile-approval-cloud-bridge.js';
import {
  validateMobileApprovalContext,
  detectMobileApprovalContextMismatch,
} from './mobile-approval-context.js';
import type {
  MobileApprovalSession,
  MobileApprovalValidationResult,
  DuplicateMobileApprovalRiskContext,
  RegisterMobileApprovalInput,
  MobileApprovalState,
} from './mobile-approval-types.js';
import {
  MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_MOBILE_APPROVAL_RISK_PREFIX,
  FORBIDDEN_MOBILE_APPROVAL_DUPLICATES,
  MOBILE_APPROVAL_COMPANION_DOMAINS,
} from './mobile-approval-types.js';

export function buildDuplicateMobileApprovalRiskContext(
  approvalName: string,
  mobileApprovalType: RegisterMobileApprovalInput['mobileApprovalType'] = 'GENERAL_APPROVAL',
): DuplicateMobileApprovalRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('mobile') && desc.includes('approval');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('mobile') && label.includes('approval');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const feedDiag = getOperatorFeedDiagnostics();
  const aidev = getLatestAiDevSummary();
  const flowFoundation = getDevPulseV2MobileApprovalFlowFoundation();

  return {
    approvalName,
    mobileApprovalType: mobileApprovalType ?? 'GENERAL_APPROVAL',
    ownershipDomains,
    capabilityIds,
    vaultSummaries: vault.listProjects().map((p) => `${p.projectId} ${p.name} ${p.summary}`),
    brainSummaries: readSystemSummariesForMobileApproval().map((s) => `${s.systemId}: ${s.summary}`),
    operatorFeedSummaries: [`active=${feedDiag.operatorFeedActive} events=${feedDiag.eventCount}`],
    mobileCommandSummaries: listMobileCommandSessionsAll().map(
      (c) => `${c.mobileCommandId} ${c.mobileCommandMetadata.commandName}`,
    ),
    mobileChatSummaries: listMobileChatSessionsAll().map(
      (c) => `${c.mobileChatId} ${c.mobileChatMetadata.chatName}`,
    ),
    mobilePreviewSummaries: listMobilePreviewSessionsAll().map(
      (p) => `${p.mobilePreviewId} ${p.mobilePreviewMetadata.previewName}`,
    ),
    runtimeSummaries: listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`),
    workspaceSummaries: listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`),
    persistentBuildSummaries: listPersistentBuilds().map((b) => `${b.buildId} ${b.buildMetadata.buildName}`),
    flowFoundationSummaries: [
      `${flowFoundation.getFoundationState().foundationId} — Phase 8.4 governance interface`,
    ],
    world2Summaries: readSystemSummariesForMobileApproval()
      .filter((s) => s.systemId.includes('world2'))
      .map((s) => s.summary),
    aidevSummaries: aidev ? [aidev.summary] : [],
  };
}

export function evaluateDuplicateMobileApprovalRisk(context: DuplicateMobileApprovalRiskContext): string[] {
  const risks: string[] = [];
  const companionDomains = new Set<string>(MOBILE_APPROVAL_COMPANION_DOMAINS);

  for (const domain of context.ownershipDomains) {
    if (companionDomains.has(domain)) continue;
    if (domain.includes('mobile') && domain.includes('approval')) {
      risks.push(
        `${DUPLICATE_MOBILE_APPROVAL_RISK_PREFIX}: ownership domain "${domain}" overlaps mobile approval authority`,
      );
    }
  }

  for (const term of FORBIDDEN_MOBILE_APPROVAL_DUPLICATES) {
    const normalized = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase().includes(normalized)) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase().includes(normalized))
    ) {
      risks.push(`${DUPLICATE_MOBILE_APPROVAL_RISK_PREFIX}: parallel mobile approval authority "${term}" registered`);
    }
  }

  return risks;
}

export function validateMobileApprovalRegistration(input: RegisterMobileApprovalInput): MobileApprovalValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project');
  if (!input.mobileCommandSessionId?.trim()) blockers.push('Missing mobile command session link');
  if (!input.mobileChatSessionId?.trim()) blockers.push('Missing mobile chat session link');
  if (!input.mobilePreviewSessionId?.trim()) blockers.push('Missing mobile preview session link');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link');
  if (!input.persistentBuildId?.trim()) blockers.push('Missing build link');
  if (!input.approvalName?.trim()) blockers.push('Missing approval name');

  const commandCheck = resolveCommandForMobileApprovalRegistration(input.mobileCommandSessionId);
  if (!commandCheck.exists) {
    blockers.push(
      `Broken command reference — ${input.mobileCommandSessionId} not in Mobile Command Runtime Foundation`,
    );
  }

  if (!resolveChatForMobileApprovalRegistration(input.mobileChatSessionId).exists) {
    blockers.push('Broken mobile chat reference');
  }
  if (!resolvePreviewForMobileApprovalRegistration(input.mobilePreviewSessionId).exists) {
    blockers.push('Broken mobile preview reference');
  }
  if (!resolveRuntimeForMobileApprovalRegistration(input.runtimeId).exists) blockers.push('Broken runtime reference');
  if (!getWorkspace(input.workspaceId)) blockers.push('Broken workspace reference');
  if (!getPersistentBuild(input.persistentBuildId)) blockers.push('Broken build reference');

  const flowFoundation = getDevPulseV2MobileApprovalFlowFoundation();
  if (!flowFoundation.getFoundationState().foundationId) {
    blockers.push('Broken mobile approval flow foundation reference');
  }

  const duplicateRisks = evaluateDuplicateMobileApprovalRisk(
    buildDuplicateMobileApprovalRiskContext(input.approvalName, input.mobileApprovalType),
  );
  if (duplicateRisks.length > 0) warnings.push(...duplicateRisks);

  const parallelBlockers = duplicateRisks.filter((r) =>
    FORBIDDEN_MOBILE_APPROVAL_DUPLICATES.some((term) => r.includes(term)),
  );
  if (parallelBlockers.length > 0 && !input.allowDuplicate) blockers.push(...parallelBlockers);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks };
}

export function validateMobileApprovalRecord(session: MobileApprovalSession | null): MobileApprovalValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!session) {
    blockers.push('Missing mobile approval reference');
    return { valid: false, blockers, warnings, duplicateRisks: [] };
  }

  if (!session.mobileApprovalOwner.projectId) blockers.push('Missing project ownership');
  if (!session.mobileApprovalOwner.mobileCommandSessionId) blockers.push('Missing mobile command session link');
  if (!session.mobileApprovalOwner.mobileChatSessionId) blockers.push('Missing mobile chat session link');
  if (!session.mobileApprovalOwner.mobilePreviewSessionId) blockers.push('Missing mobile preview session link');
  if (session.mobileApprovalOwner.ownerModule !== MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE) {
    blockers.push(`Invalid ownership — expected ${MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE}`);
  }

  warnings.push(...validateMobileApprovalContext(session.mobileApprovalContext));
  if (detectMobileApprovalContextMismatch(session.mobileApprovalId)) warnings.push('Context mismatch detected');

  const ids = listStoredMobileApprovalSessions().map((s) => s.mobileApprovalId);
  if (ids.filter((id) => id === session.mobileApprovalId).length > 1) blockers.push('Duplicate mobile approval ids');

  if (!getStoredMobileApprovalSession(session.mobileApprovalId)) blockers.push('Broken reference — not in store');

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export function validateMobileApprovalState(state: string): boolean {
  const validStates: MobileApprovalState[] = [
    'CREATED',
    'INITIALIZING',
    'READY',
    'REQUEST_REGISTERED',
    'WAITING_FOR_DECISION',
    'DECISION_RECORDED',
    'APPROVED_STATE',
    'REJECTED_STATE',
    'COMPLETED',
    'FAILED',
    'ARCHIVED',
  ];
  return validStates.includes(state as MobileApprovalState);
}
