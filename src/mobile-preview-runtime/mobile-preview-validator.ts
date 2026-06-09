/**
 * Mobile Preview Runtime Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { listMobileCommandSessionsAll } from '../mobile-command-runtime/index.js';
import { listMobileChatSessionsAll } from '../mobile-chat-runtime/index.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { listCloudVerifications } from '../cloud-verification/index.js';
import { listPreviewSessions } from '../live-preview-runtime/index.js';
import { getLatestAiDevSummary } from '../aidev-engine/index.js';
import { getStoredMobilePreviewSession, listStoredMobilePreviewSessions } from './mobile-preview-store.js';
import { listPreviewLinks } from './mobile-preview-link-manager.js';
import { resolveCommandForMobilePreviewRegistration } from './mobile-preview-command-bridge.js';
import { resolveChatForMobilePreviewRegistration } from './mobile-preview-chat-bridge.js';
import { resolveRuntimeForMobilePreviewRegistration } from './mobile-preview-cloud-bridge.js';
import { resolveWorkspaceForMobilePreviewRegistration } from './mobile-preview-workspace-bridge.js';
import { resolveBuildForMobilePreviewRegistration } from './mobile-preview-build-bridge.js';
import { resolveVerificationForMobilePreviewRegistration } from './mobile-preview-verification-bridge.js';
import {
  validateMobilePreviewContext,
  detectMobilePreviewContextMismatch,
} from './mobile-preview-context.js';
import { validateMobilePreviewEligibility } from './mobile-preview-eligibility.js';
import { validateMobilePreviewSafety } from './mobile-preview-safety.js';
import { validateMobilePreviewDevicePolicy } from './mobile-preview-device-policy.js';
import type {
  MobilePreviewSession,
  MobilePreviewValidationResult,
  DuplicateMobilePreviewRiskContext,
  RegisterMobilePreviewInput,
  MobilePreviewState,
} from './mobile-preview-types.js';
import {
  MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_MOBILE_PREVIEW_RISK_PREFIX,
  FORBIDDEN_MOBILE_PREVIEW_DUPLICATES,
  MOBILE_PREVIEW_COMPANION_DOMAINS,
} from './mobile-preview-types.js';

export function buildDuplicateMobilePreviewRiskContext(
  previewName: string,
  mobilePreviewType: RegisterMobilePreviewInput['mobilePreviewType'] = 'GENERAL_MOBILE_PREVIEW',
): DuplicateMobilePreviewRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('mobile') && desc.includes('preview');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('mobile') && label.includes('preview');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const feedDiag = getOperatorFeedDiagnostics();
  const aidev = getLatestAiDevSummary();

  return {
    previewName,
    mobilePreviewType: mobilePreviewType ?? 'GENERAL_MOBILE_PREVIEW',
    ownershipDomains,
    capabilityIds,
    vaultSummaries: vault.listProjects().map((p) => `${p.projectId} ${p.name} ${p.summary}`),
    brainSummaries: readAllSystemSummaries().map((s) => `${s.systemId}: ${s.summary}`),
    operatorFeedSummaries: [`active=${feedDiag.operatorFeedActive} events=${feedDiag.eventCount}`],
    mobileCommandSummaries: listMobileCommandSessionsAll().map(
      (c) => `${c.mobileCommandId} ${c.mobileCommandMetadata.commandName}`,
    ),
    mobileChatSummaries: listMobileChatSessionsAll().map(
      (c) => `${c.mobileChatId} ${c.mobileChatMetadata.chatName}`,
    ),
    runtimeSummaries: listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`),
    workspaceSummaries: listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`),
    persistentBuildSummaries: listPersistentBuilds().map((b) => `${b.buildId} ${b.buildMetadata.buildName}`),
    verificationSummaries: listCloudVerifications().map(
      (v) => `${v.verificationId} ${v.verificationMetadata.verificationName}`,
    ),
    livePreviewSummaries: listPreviewSessions().map(
      (p) => `${p.previewSessionId} ${p.previewTargetName}`,
    ),
    world2Summaries: readAllSystemSummaries()
      .filter((s) => s.systemId.includes('world2'))
      .map((s) => s.summary),
    aidevSummaries: aidev ? [aidev.summary] : [],
  };
}

export function evaluateDuplicateMobilePreviewRisk(context: DuplicateMobilePreviewRiskContext): string[] {
  const risks: string[] = [];
  const companionDomains = new Set<string>(MOBILE_PREVIEW_COMPANION_DOMAINS);

  for (const domain of context.ownershipDomains) {
    if (companionDomains.has(domain)) continue;
    if (domain.includes('mobile') && domain.includes('preview')) {
      risks.push(
        `${DUPLICATE_MOBILE_PREVIEW_RISK_PREFIX}: ownership domain "${domain}" overlaps mobile preview authority`,
      );
    }
  }

  for (const term of FORBIDDEN_MOBILE_PREVIEW_DUPLICATES) {
    const normalized = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase().includes(normalized)) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase().includes(normalized))
    ) {
      risks.push(`${DUPLICATE_MOBILE_PREVIEW_RISK_PREFIX}: parallel mobile preview authority "${term}" registered`);
    }
  }

  return risks;
}

export function validateMobilePreviewRegistration(input: RegisterMobilePreviewInput): MobilePreviewValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project');
  if (!input.mobileCommandSessionId?.trim()) blockers.push('Missing mobile command session link');
  if (!input.mobileChatSessionId?.trim()) blockers.push('Missing mobile chat session link');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link');
  if (!input.persistentBuildId?.trim()) blockers.push('Missing build link');
  if (!input.verificationId?.trim()) blockers.push('Missing verification link');
  if (!input.previewName?.trim()) blockers.push('Missing preview name');

  const commandCheck = resolveCommandForMobilePreviewRegistration(input.mobileCommandSessionId);
  if (!commandCheck.exists) {
    blockers.push(
      `Broken command reference — ${input.mobileCommandSessionId} not in Mobile Command Runtime Foundation`,
    );
  }

  if (!resolveChatForMobilePreviewRegistration(input.mobileChatSessionId).exists) {
    blockers.push('Broken mobile chat reference');
  }
  if (!resolveRuntimeForMobilePreviewRegistration(input.runtimeId).exists) blockers.push('Broken runtime reference');
  if (!resolveWorkspaceForMobilePreviewRegistration(input.workspaceId).exists) {
    blockers.push('Broken workspace reference');
  }
  if (!resolveBuildForMobilePreviewRegistration(input.persistentBuildId).exists) blockers.push('Broken build reference');
  if (!resolveVerificationForMobilePreviewRegistration(input.verificationId).exists) {
    blockers.push('Broken verification reference');
  }

  const duplicateRisks = evaluateDuplicateMobilePreviewRisk(
    buildDuplicateMobilePreviewRiskContext(input.previewName, input.mobilePreviewType),
  );
  if (duplicateRisks.length > 0) warnings.push(...duplicateRisks);

  const parallelBlockers = duplicateRisks.filter((r) =>
    FORBIDDEN_MOBILE_PREVIEW_DUPLICATES.some((term) => r.includes(term)),
  );
  if (parallelBlockers.length > 0 && !input.allowDuplicate) blockers.push(...parallelBlockers);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks };
}

export function validateMobilePreviewRecord(session: MobilePreviewSession | null): MobilePreviewValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!session) {
    blockers.push('Missing mobile preview reference');
    return { valid: false, blockers, warnings, duplicateRisks: [] };
  }

  if (!session.mobilePreviewOwner.projectId) blockers.push('Missing project ownership');
  if (!session.mobilePreviewOwner.mobileCommandSessionId) blockers.push('Missing mobile command session link');
  if (!session.mobilePreviewOwner.mobileChatSessionId) blockers.push('Missing mobile chat session link');
  if (session.mobilePreviewOwner.ownerModule !== MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE) {
    blockers.push(`Invalid ownership — expected ${MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE}`);
  }

  warnings.push(...validateMobilePreviewContext(session.mobilePreviewContext));
  if (session.mobilePreviewEligibility) {
    warnings.push(...validateMobilePreviewEligibility(session.mobilePreviewEligibility));
  }
  if (session.mobilePreviewSafety) {
    warnings.push(...validateMobilePreviewSafety(session.mobilePreviewSafety));
  }
  if (session.mobilePreviewDevicePolicy) {
    warnings.push(...validateMobilePreviewDevicePolicy(session.mobilePreviewDevicePolicy));
  }
  if (detectMobilePreviewContextMismatch(session.mobilePreviewId)) warnings.push('Context mismatch detected');

  const ids = listStoredMobilePreviewSessions().map((s) => s.mobilePreviewId);
  if (ids.filter((id) => id === session.mobilePreviewId).length > 1) blockers.push('Duplicate mobile preview ids');

  const linkIds = listPreviewLinks().map((l) => l.linkId);
  if (new Set(linkIds).size !== linkIds.length) blockers.push('Duplicate preview link ids');

  if (!getStoredMobilePreviewSession(session.mobilePreviewId)) blockers.push('Broken reference — not in store');

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export function validateMobilePreviewState(state: string): boolean {
  const validStates: MobilePreviewState[] = [
    'CREATED',
    'INITIALIZING',
    'READY',
    'ELIGIBILITY_CHECKED',
    'SAFETY_CHECKED',
    'MOBILE_PREVIEW_ALLOWED',
    'MOBILE_PREVIEW_BLOCKED',
    'DESKTOP_RECOMMENDED',
    'PREVIEW_LINK_REGISTERED',
    'PREVIEW_PENDING',
    'PREVIEW_READY',
    'COMPLETED',
    'FAILED',
    'ARCHIVED',
  ];
  return validStates.includes(state as MobilePreviewState);
}
