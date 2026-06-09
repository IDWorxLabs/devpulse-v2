/**
 * Cross Device Runtime Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readSystemSummariesForCrossDevice } from './cross-device-read-cache.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { listMobileCommandSessionsAll } from '../mobile-command-runtime/index.js';
import { listMobileChatSessionsAll } from '../mobile-chat-runtime/index.js';
import { listMobilePreviewSessionsAll } from '../mobile-preview-runtime/index.js';
import { listMobileApprovalSessionsAll } from '../mobile-approval-runtime/index.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getStoredCrossDeviceSession, listStoredCrossDeviceSessions } from './cross-device-store.js';
import { resolveCommandForCrossDeviceRegistration } from './cross-device-command-bridge.js';
import { resolveChatForCrossDeviceRegistration } from './cross-device-chat-bridge.js';
import { resolvePreviewForCrossDeviceRegistration } from './cross-device-preview-bridge.js';
import { resolveApprovalForCrossDeviceRegistration } from './cross-device-approval-bridge.js';
import { resolveRuntimeForCrossDeviceRegistration } from './cross-device-cloud-bridge.js';
import {
  validateCrossDeviceContext,
  detectCrossDeviceContextMismatch,
} from './cross-device-context.js';
import type {
  CrossDeviceSession,
  CrossDeviceValidationResult,
  DuplicateCrossDeviceRiskContext,
  RegisterCrossDeviceInput,
  CrossDeviceState,
} from './cross-device-types.js';
import {
  CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_CROSS_DEVICE_RISK_PREFIX,
  FORBIDDEN_CROSS_DEVICE_DUPLICATES,
  CROSS_DEVICE_COMPANION_DOMAINS,
  validateCrossDeviceState,
} from './cross-device-types.js';

export function buildDuplicateCrossDeviceRiskContext(
  crossDeviceName: string,
  crossDeviceType: RegisterCrossDeviceInput['crossDeviceType'] = 'GENERAL_CROSS_DEVICE',
): DuplicateCrossDeviceRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('cross') && desc.includes('device');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('cross') && label.includes('device');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const feedDiag = getOperatorFeedDiagnostics();

  return {
    crossDeviceName,
    crossDeviceType: crossDeviceType ?? 'GENERAL_CROSS_DEVICE',
    ownershipDomains,
    capabilityIds,
    vaultSummaries: vault.listProjects().map((p) => `${p.projectId} ${p.name} ${p.summary}`),
    brainSummaries: readSystemSummariesForCrossDevice().map((s) => `${s.systemId}: ${s.summary}`),
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
    mobileApprovalSummaries: listMobileApprovalSessionsAll().map(
      (a) => `${a.mobileApprovalId} ${a.mobileApprovalMetadata.approvalName}`,
    ),
    runtimeSummaries: listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`),
    workspaceSummaries: listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`),
    persistentBuildSummaries: listPersistentBuilds().map((b) => `${b.buildId} ${b.buildMetadata.buildName}`),
  };
}

export function evaluateDuplicateCrossDeviceRisk(context: DuplicateCrossDeviceRiskContext): string[] {
  const risks: string[] = [];
  const companionDomains = new Set<string>(CROSS_DEVICE_COMPANION_DOMAINS);

  for (const domain of context.ownershipDomains) {
    if (companionDomains.has(domain)) continue;
    if (domain.includes('cross') && domain.includes('device')) {
      risks.push(
        `${DUPLICATE_CROSS_DEVICE_RISK_PREFIX}: ownership domain "${domain}" overlaps cross device authority`,
      );
    }
  }

  for (const term of FORBIDDEN_CROSS_DEVICE_DUPLICATES) {
    const normalized = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase().includes(normalized)) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase().includes(normalized))
    ) {
      risks.push(`${DUPLICATE_CROSS_DEVICE_RISK_PREFIX}: parallel cross device authority "${term}" registered`);
    }
  }

  return risks;
}

export function validateCrossDeviceRegistration(input: RegisterCrossDeviceInput): CrossDeviceValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project');
  if (!input.deviceId?.trim()) blockers.push('Missing device id');
  if (!input.deviceSessionId?.trim()) blockers.push('Missing device session id');
  if (!input.mobileCommandSessionId?.trim()) blockers.push('Missing mobile command session link');
  if (!input.mobileChatSessionId?.trim()) blockers.push('Missing mobile chat session link');
  if (!input.mobilePreviewSessionId?.trim()) blockers.push('Missing mobile preview session link');
  if (!input.mobileApprovalSessionId?.trim()) blockers.push('Missing mobile approval session link');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link');
  if (!input.persistentBuildId?.trim()) blockers.push('Missing build link');
  if (!input.crossDeviceName?.trim()) blockers.push('Missing cross device name');

  if (!resolveCommandForCrossDeviceRegistration(input.mobileCommandSessionId).exists) {
    blockers.push('Broken mobile command reference');
  }
  if (!resolveChatForCrossDeviceRegistration(input.mobileChatSessionId).exists) {
    blockers.push('Broken mobile chat reference');
  }
  if (!resolvePreviewForCrossDeviceRegistration(input.mobilePreviewSessionId).exists) {
    blockers.push('Broken mobile preview reference');
  }
  if (!resolveApprovalForCrossDeviceRegistration(input.mobileApprovalSessionId).exists) {
    blockers.push('Broken mobile approval reference');
  }
  if (!resolveRuntimeForCrossDeviceRegistration(input.runtimeId).exists) blockers.push('Broken runtime reference');
  if (!getWorkspace(input.workspaceId)) blockers.push('Broken workspace reference');
  if (!getPersistentBuild(input.persistentBuildId)) blockers.push('Broken build reference');

  const riskContext = buildDuplicateCrossDeviceRiskContext(input.crossDeviceName, input.crossDeviceType);
  const duplicateRisks = evaluateDuplicateCrossDeviceRisk(riskContext);
  if (duplicateRisks.length > 0 && !input.allowDuplicate) {
    warnings.push(...duplicateRisks);
  }

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
    duplicateRisks,
  };
}

export function validateCrossDeviceRecord(session: CrossDeviceSession | null): CrossDeviceValidationResult {
  if (!session) {
    return { valid: false, blockers: ['Missing cross device session'], warnings: [], duplicateRisks: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!validateCrossDeviceState(session.crossDeviceState)) {
    blockers.push(`Invalid state: ${session.crossDeviceState}`);
  }

  const contextIssues = validateCrossDeviceContext(session.crossDeviceContext);
  warnings.push(...contextIssues);

  if (detectCrossDeviceContextMismatch(session.crossDeviceId)) {
    warnings.push('Context mismatch detected');
  }

  if (session.crossDeviceOwner.ownerModule !== CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE) {
    blockers.push('Invalid owner module');
  }

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export { validateCrossDeviceState };
