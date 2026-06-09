/**
 * Cloud Recovery Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { listCloudVerifications } from '../cloud-verification/index.js';
import { getStoredCloudRecovery } from './cloud-recovery-store.js';
import { resolveRuntimeForRecoveryRegistration } from './cloud-recovery-runtime-bridge.js';
import { resolveWorkspaceForRecoveryRegistration } from './cloud-recovery-workspace-bridge.js';
import { resolvePersistentBuildForRecoveryRegistration } from './cloud-recovery-build-bridge.js';
import { resolveVerificationForRecoveryRegistration } from './cloud-recovery-verification-bridge.js';
import { validateCloudRecoveryScope, detectScopeMismatch } from './cloud-recovery-scope.js';
import { validateCloudRecoveryContext, detectContextMismatch } from './cloud-recovery-context.js';
import type {
  CloudRecovery,
  CloudRecoveryValidationResult,
  DuplicateCloudRecoveryRiskContext,
  RegisterRecoveryInput,
} from './cloud-recovery-types.js';
import {
  CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
  DUPLICATE_CLOUD_RECOVERY_RISK_PREFIX,
} from './cloud-recovery-types.js';

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildDuplicateCloudRecoveryRiskContext(
  recoveryName: string,
  recoveryType: RegisterRecoveryInput['recoveryType'] = 'GENERAL_RECOVERY',
): DuplicateCloudRecoveryRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('recovery') || desc.includes('cloud');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('recovery') || label.includes('cloud');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const vaultSummaries = vault.listProjects().map(
    (p) => `${p.projectId} ${p.name} ${p.summary} ${p.facts.map((f) => f.value).join(' ')}`,
  );

  return {
    recoveryName,
    recoveryType: recoveryType ?? 'GENERAL_RECOVERY',
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
  };
}

export function evaluateDuplicateCloudRecoveryRisk(context: DuplicateCloudRecoveryRiskContext): string[] {
  const risks: string[] = [];

  for (const domain of context.ownershipDomains) {
    if (domain !== 'cloud_recovery_foundation' && domain.includes('recovery')) {
      if (domain === 'world2_recovery_runtime') continue;
      risks.push(
        `${DUPLICATE_CLOUD_RECOVERY_RISK_PREFIX}: ownership domain "${domain}" overlaps recovery authority — integrate with existing authority`,
      );
    }
  }

  const parallelTerms = ['cloud_recovery_executor', 'cloud_recovery_worker', 'cloud_recovery_monolith'];
  for (const term of parallelTerms) {
    const normalizedTerm = normalizeName(term);
    if (
      context.ownershipDomains.some((d) => normalizeName(d) === normalizedTerm) ||
      context.capabilityIds.some((c) => normalizeName(c) === normalizedTerm)
    ) {
      risks.push(
        `${DUPLICATE_CLOUD_RECOVERY_RISK_PREFIX}: parallel cloud recovery authority "${term}" registered`,
      );
    }
  }

  return risks;
}

export function validateCloudRecoveryRegistration(input: RegisterRecoveryInput): CloudRecoveryValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project — projectId required');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link — runtimeId required');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link — workspaceId required');
  if (!input.persistentBuildId?.trim()) blockers.push('Missing persistent build link — persistentBuildId required');
  if (!input.verificationId?.trim()) blockers.push('Missing verification link — verificationId required');
  if (!input.recoveryName?.trim()) blockers.push('Missing recovery name');

  const runtimeCheck = resolveRuntimeForRecoveryRegistration(input.runtimeId);
  if (!runtimeCheck.exists) {
    blockers.push(`Broken runtime reference — runtime ${input.runtimeId} not in Cloud Runtime Foundation`);
  } else if (runtimeCheck.projectId && runtimeCheck.projectId !== input.projectId) {
    warnings.push('Cross-project risk — runtime project differs from recovery project');
  }

  const workspaceCheck = resolveWorkspaceForRecoveryRegistration(input.workspaceId);
  if (!workspaceCheck.exists) {
    blockers.push(`Broken workspace reference — workspace ${input.workspaceId} not in Workspace Hosting Foundation`);
  } else if (workspaceCheck.projectId && workspaceCheck.projectId !== input.projectId) {
    warnings.push('Cross-project risk — workspace project differs from recovery project');
  }

  const buildCheck = resolvePersistentBuildForRecoveryRegistration(input.persistentBuildId);
  if (!buildCheck.exists) {
    blockers.push(`Broken persistent build reference — build ${input.persistentBuildId} not in Persistent Build Runtime Foundation`);
  } else if (buildCheck.projectId && buildCheck.projectId !== input.projectId) {
    warnings.push('Cross-project risk — build project differs from recovery project');
  }

  const verificationCheck = resolveVerificationForRecoveryRegistration(input.verificationId);
  if (!verificationCheck.exists) {
    blockers.push(`Broken verification reference — verification ${input.verificationId} not in Cloud Verification Foundation`);
  } else if (verificationCheck.projectId && verificationCheck.projectId !== input.projectId) {
    warnings.push('Cross-project risk — verification project differs from recovery project');
  }

  const duplicateRisks = evaluateDuplicateCloudRecoveryRisk(
    buildDuplicateCloudRecoveryRiskContext(input.recoveryName, input.recoveryType),
  );
  if (duplicateRisks.length > 0) warnings.push(...duplicateRisks);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks };
}

export function validateCloudRecoveryRecord(recovery: CloudRecovery | null): CloudRecoveryValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!recovery) {
    blockers.push('Missing recovery reference');
    return { valid: false, blockers, warnings, duplicateRisks: [] };
  }

  if (!recovery.recoveryOwner.projectId) blockers.push('Missing project ownership');
  if (!recovery.recoveryOwner.runtimeId) blockers.push('Missing runtime link');
  if (!recovery.recoveryOwner.workspaceId) blockers.push('Missing workspace link');
  if (!recovery.recoveryOwner.persistentBuildId) blockers.push('Missing persistent build link');
  if (!recovery.recoveryOwner.verificationId) blockers.push('Missing verification link');
  if (recovery.recoveryOwner.ownerModule !== CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE) {
    blockers.push(`Invalid ownership — expected ${CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE}`);
  }
  if (!recovery.recoveryOwner.recoverySessionId && recovery.recoveryState !== 'CREATED') {
    warnings.push('Missing session id — session not yet linked');
  }

  warnings.push(...validateCloudRecoveryScope(recovery.recoveryScope));
  warnings.push(...validateCloudRecoveryContext(recovery.recoveryContext));
  if (detectScopeMismatch(recovery.recoveryId)) warnings.push('Scope mismatch detected');
  if (detectContextMismatch(recovery.recoveryId)) warnings.push('Context mismatch detected');

  const stored = getStoredCloudRecovery(recovery.recoveryId);
  if (!stored) blockers.push(`Broken reference — recovery ${recovery.recoveryId} not in store`);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export function validateCloudRecoveryState(state: string): boolean {
  return [
    'CREATED', 'INITIALIZING', 'READY', 'FAILURE_IDENTIFIED', 'RECOVERY_CANDIDATE_IDENTIFIED',
    'RECOVERY_PLAN_REGISTERED', 'WAITING_FOR_RUNTIME', 'WAITING_FOR_WORKSPACE', 'WAITING_FOR_BUILD',
    'WAITING_FOR_VERIFICATION', 'RECOVERY_READY', 'COMPLETED', 'FAILED', 'ARCHIVED',
  ].includes(state);
}
