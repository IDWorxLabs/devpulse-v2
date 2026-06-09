/**
 * Cloud Monitoring Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { listCloudVerifications } from '../cloud-verification/index.js';
import { listRecoveries } from '../cloud-recovery/index.js';
import { getStoredCloudMonitoringRecord } from './cloud-monitoring-store.js';
import { resolveRuntimeForMonitoringRegistration } from './cloud-monitoring-runtime-bridge.js';
import { resolveWorkspaceForMonitoringRegistration } from './cloud-monitoring-workspace-bridge.js';
import { resolveBuildForMonitoringRegistration } from './cloud-monitoring-build-bridge.js';
import { resolveVerificationForMonitoringRegistration } from './cloud-monitoring-verification-bridge.js';
import { resolveRecoveryForMonitoringRegistration } from './cloud-monitoring-recovery-bridge.js';
import { validateCloudMonitoringContext, detectContextMismatch } from './cloud-monitoring-context.js';
import { validateMonitoringHealth } from './cloud-monitoring-health.js';
import { validateMonitoringAlert } from './cloud-monitoring-alerts.js';
import type {
  CloudMonitoringRecord,
  CloudMonitoringValidationResult,
  DuplicateCloudMonitoringRiskContext,
  RegisterMonitoringInput,
} from './cloud-monitoring-types.js';
import {
  CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
  DUPLICATE_CLOUD_MONITORING_RISK_PREFIX,
} from './cloud-monitoring-types.js';

export function buildDuplicateCloudMonitoringRiskContext(
  monitoringName: string,
  monitoringType: RegisterMonitoringInput['monitoringType'] = 'GENERAL_MONITORING',
): DuplicateCloudMonitoringRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('monitoring') || desc.includes('cloud');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('monitoring') || label.includes('cloud');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const vaultSummaries = vault.listProjects().map(
    (p) => `${p.projectId} ${p.name} ${p.summary} ${p.facts.map((f) => f.value).join(' ')}`,
  );

  return {
    monitoringName,
    monitoringType: monitoringType ?? 'GENERAL_MONITORING',
    ownershipDomains,
    capabilityIds,
    vaultSummaries,
    brainSummaries: readAllSystemSummaries().map((s) => `${s.systemId}: ${s.summary}`),
    runtimeSummaries: listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`),
    workspaceSummaries: listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`),
    persistentBuildSummaries: listPersistentBuilds().map((b) => `${b.buildId} ${b.buildMetadata.buildName}`),
    verificationSummaries: listCloudVerifications().map(
      (v) => `${v.verificationId} ${v.verificationMetadata.verificationName}`,
    ),
    recoverySummaries: listRecoveries().map(
      (r) => `${r.recoveryId} ${r.recoveryMetadata.recoveryName}`,
    ),
  };
}

export function evaluateDuplicateCloudMonitoringRisk(context: DuplicateCloudMonitoringRiskContext): string[] {
  const risks: string[] = [];

  for (const domain of context.ownershipDomains) {
    if (domain !== 'cloud_monitoring_foundation' && domain.includes('monitoring')) {
      if (domain === 'world2_recovery_runtime') continue;
      risks.push(
        `${DUPLICATE_CLOUD_MONITORING_RISK_PREFIX}: ownership domain "${domain}" overlaps monitoring authority — integrate with existing authority`,
      );
    }
  }

  const parallelTerms = ['cloud_monitoring_executor', 'cloud_monitoring_worker', 'cloud_monitoring_monolith'];
  for (const term of parallelTerms) {
    const normalizedTerm = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase() === normalizedTerm) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase() === normalizedTerm)
    ) {
      risks.push(
        `${DUPLICATE_CLOUD_MONITORING_RISK_PREFIX}: parallel cloud monitoring authority "${term}" registered`,
      );
    }
  }

  return risks;
}

export function validateCloudMonitoringRegistration(input: RegisterMonitoringInput): CloudMonitoringValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project — projectId required');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link — runtimeId required');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link — workspaceId required');
  if (!input.persistentBuildId?.trim()) blockers.push('Missing persistent build link — persistentBuildId required');
  if (!input.verificationId?.trim()) blockers.push('Missing verification link — verificationId required');
  if (!input.recoveryId?.trim()) blockers.push('Missing recovery link — recoveryId required');
  if (!input.monitoringName?.trim()) blockers.push('Missing monitoring name');

  const runtimeCheck = resolveRuntimeForMonitoringRegistration(input.runtimeId);
  if (!runtimeCheck.exists) {
    blockers.push(`Broken runtime reference — runtime ${input.runtimeId} not in Cloud Runtime Foundation`);
  } else if (runtimeCheck.projectId && runtimeCheck.projectId !== input.projectId) {
    warnings.push('Cross-project risk — runtime project differs from monitoring project');
  }

  const workspaceCheck = resolveWorkspaceForMonitoringRegistration(input.workspaceId);
  if (!workspaceCheck.exists) {
    blockers.push(`Broken workspace reference — workspace ${input.workspaceId} not in Workspace Hosting Foundation`);
  }

  const buildCheck = resolveBuildForMonitoringRegistration(input.persistentBuildId);
  if (!buildCheck.exists) {
    blockers.push(`Broken persistent build reference — build ${input.persistentBuildId} not in Persistent Build Runtime Foundation`);
  }

  const verificationCheck = resolveVerificationForMonitoringRegistration(input.verificationId);
  if (!verificationCheck.exists) {
    blockers.push(`Broken verification reference — verification ${input.verificationId} not in Cloud Verification Foundation`);
  }

  const recoveryCheck = resolveRecoveryForMonitoringRegistration(input.recoveryId);
  if (!recoveryCheck.exists) {
    blockers.push(`Broken recovery reference — recovery ${input.recoveryId} not in Cloud Recovery Foundation`);
  }

  const duplicateRisks = evaluateDuplicateCloudMonitoringRisk(
    buildDuplicateCloudMonitoringRiskContext(input.monitoringName, input.monitoringType),
  );
  if (duplicateRisks.length > 0) warnings.push(...duplicateRisks);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks };
}

export function validateCloudMonitoringRecord(record: CloudMonitoringRecord | null): CloudMonitoringValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!record) {
    blockers.push('Missing monitoring reference');
    return { valid: false, blockers, warnings, duplicateRisks: [] };
  }

  if (!record.monitoringOwner.projectId) blockers.push('Missing project ownership');
  if (!record.monitoringOwner.runtimeId) blockers.push('Missing runtime link');
  if (!record.monitoringOwner.workspaceId) blockers.push('Missing workspace link');
  if (!record.monitoringOwner.persistentBuildId) blockers.push('Missing persistent build link');
  if (!record.monitoringOwner.verificationId) blockers.push('Missing verification link');
  if (!record.monitoringOwner.recoveryId) blockers.push('Missing recovery link');
  if (record.monitoringOwner.ownerModule !== CLOUD_MONITORING_FOUNDATION_OWNER_MODULE) {
    blockers.push(`Invalid ownership — expected ${CLOUD_MONITORING_FOUNDATION_OWNER_MODULE}`);
  }
  if (!record.monitoringOwner.monitoringSessionId && record.monitoringState !== 'CREATED') {
    warnings.push('Missing session id — session not yet linked');
  }

  warnings.push(...validateCloudMonitoringContext(record.monitoringContext));
  warnings.push(...validateMonitoringHealth(record.monitoringHealth));
  for (const alert of record.monitoringAlerts) {
    warnings.push(...validateMonitoringAlert(alert));
  }
  if (detectContextMismatch(record.monitoringId)) warnings.push('Context mismatch detected');

  const stored = getStoredCloudMonitoringRecord(record.monitoringId);
  if (!stored) blockers.push(`Broken reference — monitoring ${record.monitoringId} not in store`);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export function validateCloudMonitoringState(state: string): boolean {
  return [
    'CREATED', 'INITIALIZING', 'READY', 'MONITORING_ACTIVE', 'HEALTH_UPDATED', 'ALERT_CREATED',
    'ALERT_ACKNOWLEDGED', 'WAITING_FOR_RUNTIME', 'WAITING_FOR_WORKSPACE', 'WAITING_FOR_BUILD',
    'WAITING_FOR_VERIFICATION', 'WAITING_FOR_RECOVERY', 'COMPLETED', 'FAILED', 'ARCHIVED',
  ].includes(state);
}
