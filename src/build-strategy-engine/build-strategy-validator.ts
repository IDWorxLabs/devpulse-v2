/**
 * Build Strategy Engine — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readSystemSummariesForBuildStrategy } from './read-cache.js';
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
import { listAutonomousBuilds } from '../autonomous-builder/index.js';
import { getStoredBuildStrategyRecord, listStoredBuildStrategyRecords } from './build-strategy-store.js';
import { resolveDeliveryForBuildStrategyRegistration } from './build-strategy-delivery-bridge.js';
import { resolvePushForBuildStrategyRegistration } from './build-strategy-push-bridge.js';
import { resolveNotificationForBuildStrategyRegistration } from './build-strategy-notification-bridge.js';
import { resolveInboxForBuildStrategyRegistration } from './build-strategy-inbox-bridge.js';
import { resolveAutonomousBuilderForBuildStrategyRegistration } from './build-strategy-autonomous-builder-bridge.js';
import { detectBuildStrategyCloudMismatch } from './build-strategy-cloud-bridge.js';
import { detectBuildStrategyDeliveryMismatch } from './build-strategy-delivery-bridge.js';
import { detectBuildStrategyPushMismatch } from './build-strategy-push-bridge.js';
import { detectBuildStrategyAutonomousBuilderMismatch } from './build-strategy-autonomous-builder-bridge.js';
import {
  validateBuildStrategyContext,
  detectBuildStrategyContextMismatch,
} from './build-strategy-context.js';
import type {
  BuildStrategySession,
  BuildStrategyValidationResult,
  DuplicateBuildStrategyRiskContext,
  RegisterBuildStrategyInput,
} from './build-strategy-types.js';
import {
  BUILD_STRATEGY_ENGINE_OWNER_MODULE,
  DUPLICATE_BUILD_STRATEGY_AUTHORITY_RISK_PREFIX,
  FORBIDDEN_BUILD_STRATEGY_DUPLICATES,
  BUILD_STRATEGY_COMPANION_DOMAINS,
  validateBuildStrategyState,
} from './build-strategy-types.js';

export function buildDuplicateBuildStrategyRiskContext(
  strategyName: string,
  strategyCategory: RegisterBuildStrategyInput['strategyCategory'] = 'GENERAL_BUILD_STRATEGY',
): DuplicateBuildStrategyRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('build') && (desc.includes('strategy') || desc.includes('executor'));
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('build') && (label.includes('strategy') || label.includes('executor'));
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const feedDiag = getOperatorFeedDiagnostics();

  return {
    strategyName,
    strategyCategory: strategyCategory ?? 'GENERAL_BUILD_STRATEGY',
    ownershipDomains,
    capabilityIds,
    vaultSummaries: vault.listProjects().map((p) => `${p.projectId} ${p.name} ${p.summary}`),
    brainSummaries: readSystemSummariesForBuildStrategy().map((s) => `${s.systemId}: ${s.summary}`),
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
    autonomousBuilderSummaries: listAutonomousBuilds().map(
      (b) => `${b.autonomousBuildId} ${b.buildMetadata.buildName}`,
    ),
  };
}

export function evaluateDuplicateBuildStrategyRisk(context: DuplicateBuildStrategyRiskContext): string[] {
  const risks: string[] = [];
  const companionDomains = new Set<string>(BUILD_STRATEGY_COMPANION_DOMAINS);

  for (const domain of context.ownershipDomains) {
    if (companionDomains.has(domain)) continue;
    if (domain.includes('build') && domain.includes('strategy') && domain !== 'build_strategy_engine') {
      risks.push(
        `${DUPLICATE_BUILD_STRATEGY_AUTHORITY_RISK_PREFIX}: ownership domain "${domain}" overlaps build strategy planning authority`,
      );
    }
  }

  for (const term of FORBIDDEN_BUILD_STRATEGY_DUPLICATES) {
    const normalized = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase().includes(normalized)) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase().includes(normalized))
    ) {
      risks.push(`${DUPLICATE_BUILD_STRATEGY_AUTHORITY_RISK_PREFIX}: parallel build strategy authority "${term}" registered`);
    }
  }

  return risks;
}

export function validateBuildStrategyRegistration(input: RegisterBuildStrategyInput): BuildStrategyValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link');
  if (!input.persistentBuildId?.trim()) blockers.push('Missing build link');
  if (!input.deviceId?.trim()) blockers.push('Missing device id');
  if (!input.crossDeviceSessionId?.trim()) blockers.push('Missing cross device session link');
  if (!input.autonomousBuildId?.trim()) blockers.push('Missing autonomous build reference');
  if (!input.pushId?.trim()) blockers.push('Missing push reference');
  if (!input.deliveryId?.trim()) blockers.push('Missing delivery reference');
  if (!input.notificationId?.trim()) blockers.push('Missing notification reference');
  if (!input.inboxEntryId?.trim()) blockers.push('Missing inbox entry reference');
  if (!input.strategyName?.trim()) blockers.push('Missing strategy name');

  if (!resolveAutonomousBuilderForBuildStrategyRegistration(input.autonomousBuildId).exists) {
    blockers.push('Broken autonomous build reference — Autonomous Builder Foundation is primary upstream');
  }
  if (!resolvePushForBuildStrategyRegistration(input.pushId).exists) {
    blockers.push('Broken push reference — Mobile Push Foundation is push authority');
  }
  if (!resolveDeliveryForBuildStrategyRegistration(input.deliveryId).exists) {
    blockers.push('Broken delivery reference — Notification Delivery Foundation is delivery authority');
  }
  if (!resolveNotificationForBuildStrategyRegistration(input.notificationId).exists) {
    blockers.push('Broken notification reference — Founder Notification Runtime is notification authority');
  }
  if (!resolveInboxForBuildStrategyRegistration(input.inboxEntryId).exists) {
    blockers.push('Broken inbox reference — Founder Inbox is visualization authority');
  }
  if (!getWorkspace(input.workspaceId)) blockers.push('Broken workspace reference');
  if (!getPersistentBuild(input.persistentBuildId)) blockers.push('Broken build reference');

  const riskContext = buildDuplicateBuildStrategyRiskContext(input.strategyName, input.strategyCategory);
  const duplicateRisks = evaluateDuplicateBuildStrategyRisk(riskContext);
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

export function validateBuildStrategyRecord(record: BuildStrategySession | null): BuildStrategyValidationResult {
  if (!record) {
    return { valid: false, blockers: ['Missing strategy record'], warnings: [], duplicateRisks: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!validateBuildStrategyState(record.strategyState)) {
    blockers.push(`Invalid state: ${record.strategyState}`);
  }

  if (!validateBuildStrategyContext(record.strategyContext)) {
    warnings.push('Invalid strategy context');
  }

  if (detectBuildStrategyContextMismatch(record.buildStrategyId)) {
    warnings.push('Context mismatch detected');
  }

  if (record.strategyOwnership.ownerModule !== BUILD_STRATEGY_ENGINE_OWNER_MODULE) {
    blockers.push('Invalid owner module');
  }

  if (!resolveAutonomousBuilderForBuildStrategyRegistration(record.autonomousBuildId).exists) {
    blockers.push('Broken autonomous build reference');
  }
  if (!resolvePushForBuildStrategyRegistration(record.pushId).exists) {
    blockers.push('Broken push reference');
  }
  if (!resolveDeliveryForBuildStrategyRegistration(record.deliveryId).exists) {
    blockers.push('Broken delivery reference');
  }
  if (!resolveNotificationForBuildStrategyRegistration(record.notificationId).exists) {
    blockers.push('Broken notification reference');
  }
  if (!resolveInboxForBuildStrategyRegistration(record.inboxEntryId).exists) {
    blockers.push('Broken inbox reference');
  }

  if (detectBuildStrategyAutonomousBuilderMismatch(record.buildStrategyId)) warnings.push('Autonomous builder mismatch');
  if (detectBuildStrategyDeliveryMismatch(record.buildStrategyId)) warnings.push('Delivery mismatch');
  if (detectBuildStrategyPushMismatch(record.buildStrategyId)) warnings.push('Push mismatch');
  if (detectBuildStrategyCloudMismatch(record.buildStrategyId)) warnings.push('Cloud mismatch');

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export { validateBuildStrategyState };
