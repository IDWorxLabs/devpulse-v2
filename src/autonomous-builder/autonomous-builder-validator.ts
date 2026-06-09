/**
 * Autonomous Builder Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readSystemSummariesForAutonomousBuilder } from './read-cache.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { listDeliveryRecordsAll } from '../notification-delivery/index.js';
import { listPushRecordsAll } from '../mobile-push/index.js';
import { listNotificationsAll } from '../founder-notification-runtime/index.js';
import { listInboxEntriesAll } from '../founder-inbox/index.js';
import { getStoredAutonomousBuildRecord, listStoredAutonomousBuildRecords } from './autonomous-builder-store.js';
import { resolveDeliveryForAutonomousBuildRegistration } from './autonomous-builder-delivery-bridge.js';
import { resolvePushForAutonomousBuildRegistration } from './autonomous-builder-push-bridge.js';
import { resolveNotificationForAutonomousBuildRegistration } from './autonomous-builder-notification-bridge.js';
import { resolveInboxForAutonomousBuildRegistration } from './autonomous-builder-inbox-bridge.js';
import { detectAutonomousBuildCloudMismatch } from './autonomous-builder-cloud-bridge.js';
import { detectAutonomousBuildDeliveryMismatch } from './autonomous-builder-delivery-bridge.js';
import { detectAutonomousBuildPushMismatch } from './autonomous-builder-push-bridge.js';
import {
  validateAutonomousBuildContext,
  detectAutonomousBuildContextMismatch,
} from './autonomous-builder-context.js';
import type {
  AutonomousBuildSession,
  AutonomousBuildValidationResult,
  DuplicateAutonomousBuilderRiskContext,
  RegisterAutonomousBuildInput,
} from './autonomous-builder-types.js';
import {
  AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
  DUPLICATE_AUTONOMOUS_BUILDER_AUTHORITY_RISK_PREFIX,
  FORBIDDEN_AUTONOMOUS_BUILDER_DUPLICATES,
  AUTONOMOUS_BUILDER_COMPANION_DOMAINS,
  validateAutonomousBuildState,
} from './autonomous-builder-types.js';

export function buildDuplicateAutonomousBuilderRiskContext(
  buildName: string,
  buildCategory: RegisterAutonomousBuildInput['buildCategory'] = 'GENERAL_AUTONOMOUS_BUILD',
): DuplicateAutonomousBuilderRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('autonomous') && desc.includes('build');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('autonomous') && label.includes('build');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const feedDiag = getOperatorFeedDiagnostics();

  return {
    buildName,
    buildCategory: buildCategory ?? 'GENERAL_AUTONOMOUS_BUILD',
    ownershipDomains,
    capabilityIds,
    vaultSummaries: vault.listProjects().map((p) => `${p.projectId} ${p.name} ${p.summary}`),
    brainSummaries: readSystemSummariesForAutonomousBuilder().map((s) => `${s.systemId}: ${s.summary}`),
    operatorFeedSummaries: [`active=${feedDiag.operatorFeedActive} events=${feedDiag.eventCount}`],
    deliverySummaries: listDeliveryRecordsAll().map(
      (d) => `${d.deliveryId} ${d.deliveryMetadata.deliveryName}`,
    ),
    pushSummaries: listPushRecordsAll().map((p) => `${p.pushId} ${p.pushMetadata.pushName}`),
    notificationSummaries: listNotificationsAll().map(
      (n) => `${n.notificationId} ${n.notificationMetadata.notificationName}`,
    ),
    inboxSummaries: listInboxEntriesAll().map(
      (e) => `${e.inboxEntryId} ${e.inboxMetadata.inboxEntryName}`,
    ),
    runtimeSummaries: listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`),
    workspaceSummaries: listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`),
    persistentBuildSummaries: listPersistentBuilds().map((b) => `${b.buildId} ${b.buildMetadata.buildName}`),
  };
}

export function evaluateDuplicateAutonomousBuilderRisk(context: DuplicateAutonomousBuilderRiskContext): string[] {
  const risks: string[] = [];
  const companionDomains = new Set<string>(AUTONOMOUS_BUILDER_COMPANION_DOMAINS);

  for (const domain of context.ownershipDomains) {
    if (companionDomains.has(domain)) continue;
    if (domain.includes('autonomous') && domain.includes('build') && domain !== 'autonomous_builder_foundation') {
      risks.push(
        `${DUPLICATE_AUTONOMOUS_BUILDER_AUTHORITY_RISK_PREFIX}: ownership domain "${domain}" overlaps autonomous builder planning authority`,
      );
    }
  }

  for (const term of FORBIDDEN_AUTONOMOUS_BUILDER_DUPLICATES) {
    const normalized = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase().includes(normalized)) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase().includes(normalized))
    ) {
      risks.push(`${DUPLICATE_AUTONOMOUS_BUILDER_AUTHORITY_RISK_PREFIX}: parallel autonomous builder authority "${term}" registered`);
    }
  }

  return risks;
}

export function validateAutonomousBuildRegistration(input: RegisterAutonomousBuildInput): AutonomousBuildValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link');
  if (!input.persistentBuildId?.trim()) blockers.push('Missing build link');
  if (!input.deviceId?.trim()) blockers.push('Missing device id');
  if (!input.crossDeviceSessionId?.trim()) blockers.push('Missing cross device session link');
  if (!input.pushId?.trim()) blockers.push('Missing push reference');
  if (!input.deliveryId?.trim()) blockers.push('Missing delivery reference');
  if (!input.notificationId?.trim()) blockers.push('Missing notification reference');
  if (!input.inboxEntryId?.trim()) blockers.push('Missing inbox entry reference');
  if (!input.buildName?.trim()) blockers.push('Missing build name');

  if (!resolvePushForAutonomousBuildRegistration(input.pushId).exists) {
    blockers.push('Broken push reference — Mobile Push Foundation is push authority');
  }
  if (!resolveDeliveryForAutonomousBuildRegistration(input.deliveryId).exists) {
    blockers.push('Broken delivery reference — Notification Delivery Foundation is delivery authority');
  }
  if (!resolveNotificationForAutonomousBuildRegistration(input.notificationId).exists) {
    blockers.push('Broken notification reference — Founder Notification Runtime is notification authority');
  }
  if (!resolveInboxForAutonomousBuildRegistration(input.inboxEntryId).exists) {
    blockers.push('Broken inbox reference — Founder Inbox is visualization authority');
  }
  if (!getWorkspace(input.workspaceId)) blockers.push('Broken workspace reference');
  if (!getPersistentBuild(input.persistentBuildId)) blockers.push('Broken build reference');

  const riskContext = buildDuplicateAutonomousBuilderRiskContext(input.buildName, input.buildCategory);
  const duplicateRisks = evaluateDuplicateAutonomousBuilderRisk(riskContext);
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

export function validateAutonomousBuildRecord(record: AutonomousBuildSession | null): AutonomousBuildValidationResult {
  if (!record) {
    return { valid: false, blockers: ['Missing build record'], warnings: [], duplicateRisks: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!validateAutonomousBuildState(record.buildState)) {
    blockers.push(`Invalid state: ${record.buildState}`);
  }

  if (!validateAutonomousBuildContext(record.buildContext)) {
    warnings.push('Invalid build context');
  }

  if (detectAutonomousBuildContextMismatch(record.autonomousBuildId)) {
    warnings.push('Context mismatch detected');
  }

  if (record.buildOwnership.ownerModule !== AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE) {
    blockers.push('Invalid owner module');
  }

  if (!resolvePushForAutonomousBuildRegistration(record.pushId).exists) {
    blockers.push('Broken push reference');
  }
  if (!resolveDeliveryForAutonomousBuildRegistration(record.deliveryId).exists) {
    blockers.push('Broken delivery reference');
  }
  if (!resolveNotificationForAutonomousBuildRegistration(record.notificationId).exists) {
    blockers.push('Broken notification reference');
  }
  if (!resolveInboxForAutonomousBuildRegistration(record.inboxEntryId).exists) {
    blockers.push('Broken inbox reference');
  }

  if (detectAutonomousBuildDeliveryMismatch(record.autonomousBuildId)) warnings.push('Delivery mismatch');
  if (detectAutonomousBuildPushMismatch(record.autonomousBuildId)) warnings.push('Push mismatch');
  if (detectAutonomousBuildCloudMismatch(record.autonomousBuildId)) warnings.push('Cloud mismatch');

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export { validateAutonomousBuildState };
