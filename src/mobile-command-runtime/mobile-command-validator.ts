/**
 * Mobile Command Runtime Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { listCloudVerifications } from '../cloud-verification/index.js';
import { listRecoveries } from '../cloud-recovery/index.js';
import { listMonitoringRecords } from '../cloud-monitoring/index.js';
import { getLatestAiDevSummary } from '../aidev-engine/index.js';
import { getStoredMobileCommandSession, listStoredMobileCommandSessions } from './mobile-command-store.js';
import { resolveRuntimeForMobileCommandRegistration } from './mobile-command-cloud-bridge.js';
import { resolveWorkspaceForMobileCommandRegistration } from './mobile-command-workspace-bridge.js';
import { resolveBuildForMobileCommandRegistration } from './mobile-command-build-bridge.js';
import { resolveVerificationForMobileCommandRegistration } from './mobile-command-verification-bridge.js';
import { resolveRecoveryForMobileCommandRegistration } from './mobile-command-recovery-bridge.js';
import { resolveMonitoringForMobileCommandRegistration } from './mobile-command-monitoring-bridge.js';
import {
  validateMobileCommandContext,
  detectMobileCommandContextMismatch,
} from './mobile-command-context.js';
import { validateMobileCommandPermissions } from './mobile-command-permissions.js';
import type {
  MobileCommandSession,
  MobileCommandValidationResult,
  DuplicateMobileCommandRiskContext,
  RegisterMobileCommandInput,
} from './mobile-command-types.js';
import {
  MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_MOBILE_COMMAND_RISK_PREFIX,
  FORBIDDEN_MOBILE_COMMAND_DUPLICATES,
  MOBILE_COMMAND_COMPANION_DOMAINS,
} from './mobile-command-types.js';

const MOBILE_COMMAND_COMPANION_DOMAIN_SET = new Set<string>(MOBILE_COMMAND_COMPANION_DOMAINS);

export function buildDuplicateMobileCommandRiskContext(
  commandName: string,
  mobileCommandType: RegisterMobileCommandInput['mobileCommandType'] = 'GENERAL_MOBILE_COMMAND',
): DuplicateMobileCommandRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('mobile') || desc.includes('command');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('mobile') || label.includes('command');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const vaultSummaries = vault.listProjects().map(
    (p) => `${p.projectId} ${p.name} ${p.summary} ${p.facts.map((f) => f.value).join(' ')}`,
  );

  const feedDiag = getOperatorFeedDiagnostics();
  const operatorFeedSummaries = [
    `active=${feedDiag.operatorFeedActive} events=${feedDiag.eventCount} source=${feedDiag.lastSourceSystem ?? 'none'}`,
  ];

  const aidev = getLatestAiDevSummary();

  return {
    commandName,
    mobileCommandType: mobileCommandType ?? 'GENERAL_MOBILE_COMMAND',
    ownershipDomains,
    capabilityIds,
    vaultSummaries,
    brainSummaries: readAllSystemSummaries().map((s) => `${s.systemId}: ${s.summary}`),
    operatorFeedSummaries,
    runtimeSummaries: listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`),
    workspaceSummaries: listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`),
    persistentBuildSummaries: listPersistentBuilds().map((b) => `${b.buildId} ${b.buildMetadata.buildName}`),
    verificationSummaries: listCloudVerifications().map(
      (v) => `${v.verificationId} ${v.verificationMetadata.verificationName}`,
    ),
    recoverySummaries: listRecoveries().map((r) => `${r.recoveryId} ${r.recoveryMetadata.recoveryName}`),
    monitoringSummaries: listMonitoringRecords().map(
      (m) => `${m.monitoringId} ${m.monitoringMetadata.monitoringName}`,
    ),
    world2Summaries: readAllSystemSummaries()
      .filter((s) => s.systemId.includes('world2'))
      .map((s) => `${s.systemId}: ${s.summary}`),
    aidevSummaries: aidev ? [`${aidev.summary}`] : [],
  };
}

export function evaluateDuplicateMobileCommandRisk(context: DuplicateMobileCommandRiskContext): string[] {
  const risks: string[] = [];

  for (const domain of context.ownershipDomains) {
    if (MOBILE_COMMAND_COMPANION_DOMAIN_SET.has(domain)) continue;
    if (domain.includes('mobile')) {
      if (domain === 'mobile_command_foundation') {
        risks.push(
          `${DUPLICATE_MOBILE_COMMAND_RISK_PREFIX}: ownership domain "${domain}" overlaps mobile command authority — integrate with Phase 8.1 foundation instead of parallel authority`,
        );
        continue;
      }
      risks.push(
        `${DUPLICATE_MOBILE_COMMAND_RISK_PREFIX}: ownership domain "${domain}" overlaps mobile command authority — integrate with existing authority`,
      );
    }
  }

  for (const term of FORBIDDEN_MOBILE_COMMAND_DUPLICATES) {
    const normalizedTerm = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase().includes(normalizedTerm)) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase().includes(normalizedTerm))
    ) {
      risks.push(
        `${DUPLICATE_MOBILE_COMMAND_RISK_PREFIX}: parallel mobile command authority "${term}" registered`,
      );
    }
  }

  const nameLower = context.commandName.toLowerCase();
  if (context.vaultSummaries.some((s) => s.toLowerCase().includes('mobile command') && s.toLowerCase().includes(nameLower))) {
    risks.push(`${DUPLICATE_MOBILE_COMMAND_RISK_PREFIX}: Project Vault summary overlap for "${context.commandName}"`);
  }

  if (context.brainSummaries.some((s) => s.toLowerCase().includes('parallel mobile command'))) {
    risks.push(`${DUPLICATE_MOBILE_COMMAND_RISK_PREFIX}: Central Brain summary indicates parallel mobile command authority risk`);
  }

  return risks;
}

export function validateMobileCommandRegistration(input: RegisterMobileCommandInput): MobileCommandValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project — projectId required');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link — runtimeId required');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link — workspaceId required');
  if (!input.persistentBuildId?.trim()) blockers.push('Missing build link — persistentBuildId required');
  if (!input.verificationId?.trim()) blockers.push('Missing verification link — verificationId required');
  if (!input.recoveryId?.trim()) blockers.push('Missing recovery link — recoveryId required');
  if (!input.monitoringId?.trim()) blockers.push('Missing monitoring link — monitoringId required');
  if (!input.commandName?.trim()) blockers.push('Missing command name');

  const runtimeCheck = resolveRuntimeForMobileCommandRegistration(input.runtimeId);
  if (!runtimeCheck.exists) {
    blockers.push(`Broken runtime reference — runtime ${input.runtimeId} not in Cloud Runtime Foundation`);
  }

  const workspaceCheck = resolveWorkspaceForMobileCommandRegistration(input.workspaceId);
  if (!workspaceCheck.exists) {
    blockers.push(`Broken workspace reference — workspace ${input.workspaceId} not in Workspace Hosting Foundation`);
  }

  const buildCheck = resolveBuildForMobileCommandRegistration(input.persistentBuildId);
  if (!buildCheck.exists) {
    blockers.push(`Broken build reference — build ${input.persistentBuildId} not in Persistent Build Runtime Foundation`);
  }

  const verificationCheck = resolveVerificationForMobileCommandRegistration(input.verificationId);
  if (!verificationCheck.exists) {
    blockers.push(`Broken verification reference — verification ${input.verificationId} not in Cloud Verification Foundation`);
  }

  const recoveryCheck = resolveRecoveryForMobileCommandRegistration(input.recoveryId);
  if (!recoveryCheck.exists) {
    blockers.push(`Broken recovery reference — recovery ${input.recoveryId} not in Cloud Recovery Foundation`);
  }

  const monitoringCheck = resolveMonitoringForMobileCommandRegistration(input.monitoringId);
  if (!monitoringCheck.exists) {
    blockers.push(`Broken monitoring reference — monitoring ${input.monitoringId} not in Cloud Monitoring Foundation`);
  }

  const duplicateRisks = evaluateDuplicateMobileCommandRisk(
    buildDuplicateMobileCommandRiskContext(input.commandName, input.mobileCommandType),
  );
  if (duplicateRisks.length > 0) warnings.push(...duplicateRisks);

  const parallelBlockers = duplicateRisks.filter((r) =>
    FORBIDDEN_MOBILE_COMMAND_DUPLICATES.some((term) => r.includes(term)),
  );
  if (parallelBlockers.length > 0 && !input.allowDuplicate) {
    blockers.push(...parallelBlockers);
  }

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks };
}

export function validateMobileCommandRecord(session: MobileCommandSession | null): MobileCommandValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!session) {
    blockers.push('Missing mobile command reference');
    return { valid: false, blockers, warnings, duplicateRisks: [] };
  }

  if (!session.mobileCommandOwner.projectId) blockers.push('Missing project ownership');
  if (!session.mobileCommandOwner.runtimeId) blockers.push('Missing runtime link');
  if (!session.mobileCommandOwner.workspaceId) blockers.push('Missing workspace link');
  if (!session.mobileCommandOwner.persistentBuildId) blockers.push('Missing build link');
  if (!session.mobileCommandOwner.verificationId) blockers.push('Missing verification link');
  if (!session.mobileCommandOwner.recoveryId) blockers.push('Missing recovery link');
  if (!session.mobileCommandOwner.monitoringId) blockers.push('Missing monitoring link');
  if (session.mobileCommandOwner.ownerModule !== MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE) {
    blockers.push(`Invalid ownership — expected ${MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE}`);
  }

  warnings.push(...validateMobileCommandContext(session.mobileCommandContext));
  warnings.push(...validateMobileCommandPermissions(session.mobileCommandPermissions));
  if (detectMobileCommandContextMismatch(session.mobileCommandId)) warnings.push('Context mismatch detected');

  const ids = listStoredMobileCommandSessions().map((s) => s.mobileCommandId);
  if (ids.filter((id) => id === session.mobileCommandId).length > 1) {
    blockers.push('Duplicate mobile command ids detected');
  }

  const stored = getStoredMobileCommandSession(session.mobileCommandId);
  if (!stored) blockers.push(`Broken reference — mobile command ${session.mobileCommandId} not in store`);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export function validateMobileCommandState(state: string): boolean {
  return [
    'CREATED', 'INITIALIZING', 'READY', 'CONNECTED_TO_CLOUD', 'CONNECTED_TO_WORKSPACE',
    'CONNECTED_TO_BUILD', 'CONNECTED_TO_VERIFICATION', 'CONNECTED_TO_RECOVERY', 'CONNECTED_TO_MONITORING',
    'WAITING_FOR_APPROVAL', 'ACTION_BLOCKED', 'ACTION_ALLOWED', 'COMPLETED', 'FAILED', 'ARCHIVED',
  ].includes(state);
}
