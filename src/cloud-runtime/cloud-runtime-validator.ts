/**
 * Cloud Runtime Foundation — validation and duplicate runtime risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getStoredRuntime, listStoredRuntimes } from './cloud-runtime-store.js';
import type {
  CloudRuntime,
  CloudRuntimeValidationResult,
  DuplicateRuntimeRiskContext,
  RegisterRuntimeInput,
} from './cloud-runtime-types.js';
import {
  CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_RUNTIME_RISK_PREFIX,
} from './cloud-runtime-types.js';

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildDuplicateRuntimeRiskContext(
  runtimeName: string,
  runtimeType: RegisterRuntimeInput['runtimeType'] = 'GENERAL_RUNTIME',
): DuplicateRuntimeRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return (
        desc.includes('cloud') ||
        desc.includes('runtime') ||
        desc.includes('execution') ||
        desc.includes('builder')
      );
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('cloud') || label.includes('runtime') || label.includes('execution');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const vaultSummaries = vault.listProjects().map(
    (p) => `${p.projectId} ${p.name} ${p.summary} ${p.facts.map((f) => f.value).join(' ')}`,
  );

  const brainSummaries = readAllSystemSummaries().map((s) => `${s.systemId}: ${s.summary}`);

  return {
    runtimeName,
    runtimeType: runtimeType ?? 'GENERAL_RUNTIME',
    ownershipDomains,
    capabilityIds,
    vaultSummaries,
    brainSummaries,
  };
}

export function evaluateDuplicateRuntimeRisk(context: DuplicateRuntimeRiskContext): string[] {
  const risks: string[] = [];
  const normalized = normalizeName(context.runtimeName);
  const corpus = [
    ...context.ownershipDomains,
    ...context.capabilityIds,
    ...context.vaultSummaries,
    ...context.brainSummaries,
  ]
    .join(' ')
    .toLowerCase();

  for (const domain of context.ownershipDomains) {
    if (domain !== 'cloud_runtime_foundation' && normalizeName(domain).includes(normalized)) {
      risks.push(
        `${DUPLICATE_RUNTIME_RISK_PREFIX}: ownership domain "${domain}" overlaps runtime name "${context.runtimeName}" — integrate with existing authority`,
      );
    }
  }

  for (const cap of context.capabilityIds) {
    if (cap !== 'CLOUD_RUNTIME_FOUNDATION' && normalizeName(cap).includes(normalized)) {
      risks.push(
        `${DUPLICATE_RUNTIME_RISK_PREFIX}: capability "${cap}" overlaps runtime "${context.runtimeName}" — extend existing capability`,
      );
    }
  }

  if (normalized.length > 3 && corpus.includes(normalized) && risks.length === 0) {
    risks.push(
      `${DUPLICATE_RUNTIME_RISK_PREFIX}: "${context.runtimeName}" may overlap Project Vault or Central Brain summaries — verify before parallel authority`,
    );
  }

  const parallelAuthorityTerms = ['cloud_runtime_executor', 'cloud_execution_engine', 'cloud_build_runner'];
  for (const term of parallelAuthorityTerms) {
    const normalizedTerm = normalizeName(term);
    if (
      context.ownershipDomains.some((d) => normalizeName(d) === normalizedTerm) ||
      context.capabilityIds.some((c) => normalizeName(c) === normalizedTerm)
    ) {
      risks.push(
        `${DUPLICATE_RUNTIME_RISK_PREFIX}: parallel cloud authority "${term}" registered — do not create duplicate runtime authorities`,
      );
    }
  }

  return risks;
}

export function validateRuntimeRegistration(input: RegisterRuntimeInput): CloudRuntimeValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project — projectId required');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace — workspaceId required');
  if (!input.runtimeName?.trim()) blockers.push('Missing runtime name');

  const duplicateRisks = evaluateDuplicateRuntimeRisk(
    buildDuplicateRuntimeRiskContext(input.runtimeName, input.runtimeType),
  );

  if (duplicateRisks.length > 0) {
    warnings.push(...duplicateRisks);
  }

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
    duplicateRisks,
  };
}

export function validateCloudRuntime(runtime: CloudRuntime | null): CloudRuntimeValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!runtime) {
    blockers.push('Missing runtime reference');
    return { valid: false, blockers, warnings, duplicateRisks: [] };
  }

  if (!runtime.runtimeOwner.projectId) blockers.push('Missing project ownership');
  if (!runtime.runtimeOwner.workspaceId) blockers.push('Missing workspace ownership');
  if (runtime.runtimeOwner.ownerModule !== CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE) {
    blockers.push(`Invalid ownership — expected ${CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE}`);
  }
  if (!runtime.runtimeOwner.runtimeSessionId && runtime.runtimeState !== 'CREATED') {
    warnings.push('Missing session id — session not yet linked');
  }

  const stored = getStoredRuntime(runtime.runtimeId);
  if (!stored) blockers.push(`Broken reference — runtime ${runtime.runtimeId} not in store`);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export function validateRuntimeState(state: string): boolean {
  const valid = [
    'CREATED',
    'INITIALIZING',
    'READY',
    'ACTIVE',
    'PAUSED',
    'RESUMABLE',
    'COMPLETED',
    'FAILED',
    'ARCHIVED',
  ];
  return valid.includes(state);
}
