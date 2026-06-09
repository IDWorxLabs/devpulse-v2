/**
 * Cloud Verification Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { processUnifiedVerificationRequest } from '../unified-verification-entry/index.js';
import { listEvidence } from '../verification-evidence-engine/index.js';
import { listReports } from '../verification-reporting-engine/index.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { getStoredCloudVerification } from './cloud-verification-store.js';
import { resolveRuntimeForVerificationRegistration } from './cloud-verification-runtime-bridge.js';
import { resolveWorkspaceForVerificationRegistration } from './cloud-verification-workspace-bridge.js';
import { resolvePersistentBuildForVerificationRegistration } from './cloud-verification-build-bridge.js';
import { validateCloudVerificationScope, detectScopeMismatch } from './cloud-verification-scope.js';
import { validateCloudVerificationContext, detectContextMismatch } from './cloud-verification-context.js';
import type {
  CloudVerification,
  CloudVerificationValidationResult,
  DuplicateCloudVerificationRiskContext,
  RegisterCloudVerificationInput,
} from './cloud-verification-types.js';
import {
  CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
  DUPLICATE_CLOUD_VERIFICATION_RISK_PREFIX,
} from './cloud-verification-types.js';

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildDuplicateCloudVerificationRiskContext(
  verificationName: string,
  verificationType: RegisterCloudVerificationInput['verificationType'] = 'GENERAL_CLOUD_VERIFICATION',
): DuplicateCloudVerificationRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('verification') || desc.includes('cloud') || desc.includes('uvl');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('verification') || label.includes('cloud');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const vaultSummaries = vault.listProjects().map(
    (p) => `${p.projectId} ${p.name} ${p.summary} ${p.facts.map((f) => f.value).join(' ')}`,
  );

  const brainSummaries = readAllSystemSummaries().map((s) => `${s.systemId}: ${s.summary}`);
  const unifiedEntrySummaries = ['unified_verification_entry: global verification authority'];
  try {
    const uvent = processUnifiedVerificationRequest('Show verification inventory');
    unifiedEntrySummaries.push(`authority=${uvent.authorityId} valid=${uvent.validationValid}`);
  } catch {
    unifiedEntrySummaries.push('unified entry unavailable');
  }

  return {
    verificationName,
    verificationType: verificationType ?? 'GENERAL_CLOUD_VERIFICATION',
    ownershipDomains,
    capabilityIds,
    vaultSummaries,
    brainSummaries,
    unifiedEntrySummaries,
    evidenceSummaries: listEvidence().slice(0, 5).map((e) => `${e.evidenceId} ${e.evidenceType}`),
    reportSummaries: listReports().slice(0, 5).map((r) => `${r.reportId} ${r.reportType}`),
    runtimeSummaries: listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`),
    workspaceSummaries: listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`),
    persistentBuildSummaries: listPersistentBuilds().map((b) => `${b.buildId} ${b.buildMetadata.buildName}`),
  };
}

export function evaluateDuplicateCloudVerificationRisk(
  context: DuplicateCloudVerificationRiskContext,
): string[] {
  const risks: string[] = [];
  const normalized = normalizeName(context.verificationName);

  for (const domain of context.ownershipDomains) {
    if (domain !== 'cloud_verification_foundation' && normalizeName(domain).includes('verification')) {
      if (domain === 'unified_verification_entry' || domain.includes('verification_evidence') || domain.includes('verification_reporting')) {
        continue;
      }
      if (normalizeName(domain).includes(normalized)) {
        risks.push(
          `${DUPLICATE_CLOUD_VERIFICATION_RISK_PREFIX}: ownership domain "${domain}" overlaps verification name "${context.verificationName}" — integrate with existing authority`,
        );
      }
    }
  }

  const parallelTerms = ['cloud_verification_executor', 'cloud_verification_provider', 'cloud_verification_monolith'];
  for (const term of parallelTerms) {
    const normalizedTerm = normalizeName(term);
    if (
      context.ownershipDomains.some((d) => normalizeName(d) === normalizedTerm) ||
      context.capabilityIds.some((c) => normalizeName(c) === normalizedTerm)
    ) {
      risks.push(
        `${DUPLICATE_CLOUD_VERIFICATION_RISK_PREFIX}: parallel cloud verification authority "${term}" registered`,
      );
    }
  }

  return risks;
}

export function validateCloudVerificationRegistration(
  input: RegisterCloudVerificationInput,
): CloudVerificationValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project — projectId required');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link — runtimeId required');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link — workspaceId required');
  if (!input.persistentBuildId?.trim()) blockers.push('Missing persistent build link — persistentBuildId required');
  if (!input.verificationName?.trim()) blockers.push('Missing verification name');

  const runtimeCheck = resolveRuntimeForVerificationRegistration(input.runtimeId);
  if (!runtimeCheck.exists) {
    blockers.push(`Broken runtime reference — runtime ${input.runtimeId} not in Cloud Runtime Foundation`);
  } else if (runtimeCheck.projectId && runtimeCheck.projectId !== input.projectId) {
    warnings.push('Cross-project risk — runtime project differs from verification project');
  }

  const workspaceCheck = resolveWorkspaceForVerificationRegistration(input.workspaceId);
  if (!workspaceCheck.exists) {
    blockers.push(`Broken workspace reference — workspace ${input.workspaceId} not in Workspace Hosting Foundation`);
  } else {
    if (workspaceCheck.projectId && workspaceCheck.projectId !== input.projectId) {
      warnings.push('Cross-project risk — workspace project differs from verification project');
    }
    if (workspaceCheck.runtimeId && workspaceCheck.runtimeId !== input.runtimeId) {
      warnings.push('Runtime/workspace mismatch risk');
    }
  }

  const buildCheck = resolvePersistentBuildForVerificationRegistration(input.persistentBuildId);
  if (!buildCheck.exists) {
    blockers.push(`Broken persistent build reference — build ${input.persistentBuildId} not in Persistent Build Runtime Foundation`);
  } else {
    if (buildCheck.projectId && buildCheck.projectId !== input.projectId) {
      warnings.push('Cross-project risk — build project differs from verification project');
    }
  }

  const duplicateRisks = evaluateDuplicateCloudVerificationRisk(
    buildDuplicateCloudVerificationRiskContext(input.verificationName, input.verificationType),
  );
  if (duplicateRisks.length > 0) warnings.push(...duplicateRisks);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks };
}

export function validateCloudVerificationRecord(
  verification: CloudVerification | null,
): CloudVerificationValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!verification) {
    blockers.push('Missing verification reference');
    return { valid: false, blockers, warnings, duplicateRisks: [] };
  }

  if (!verification.verificationOwner.projectId) blockers.push('Missing project ownership');
  if (!verification.verificationOwner.runtimeId) blockers.push('Missing runtime link');
  if (!verification.verificationOwner.workspaceId) blockers.push('Missing workspace link');
  if (!verification.verificationOwner.persistentBuildId) blockers.push('Missing persistent build link');
  if (verification.verificationOwner.ownerModule !== CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE) {
    blockers.push(`Invalid ownership — expected ${CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE}`);
  }
  if (!verification.verificationOwner.verificationSessionId && verification.verificationState !== 'CREATED') {
    warnings.push('Missing session id — session not yet linked');
  }
  if (!verification.verificationUnifiedEntryLink.unifiedSessionId) {
    warnings.push('Missing unified verification entry link');
  }

  warnings.push(...validateCloudVerificationScope(verification.verificationScope));
  warnings.push(...validateCloudVerificationContext(verification.verificationContext));
  if (detectScopeMismatch(verification.verificationId)) warnings.push('Scope mismatch detected');
  if (detectContextMismatch(verification.verificationId)) warnings.push('Context mismatch detected');

  const stored = getStoredCloudVerification(verification.verificationId);
  if (!stored) blockers.push(`Broken reference — verification ${verification.verificationId} not in store`);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export function validateCloudVerificationState(state: string): boolean {
  return [
    'CREATED', 'INITIALIZING', 'READY', 'REQUESTED', 'IN_PROGRESS_METADATA_ONLY',
    'EVIDENCE_LINKED', 'REPORT_LINKED', 'WAITING_FOR_RUNTIME', 'WAITING_FOR_WORKSPACE',
    'WAITING_FOR_BUILD', 'COMPLETED', 'FAILED', 'ARCHIVED',
  ].includes(state);
}
