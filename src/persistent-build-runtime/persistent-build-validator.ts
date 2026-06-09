/**
 * Persistent Build Runtime Foundation — validation and duplicate build risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { getStoredPersistentBuild } from './persistent-build-store.js';
import { resolveRuntimeForBuildRegistration } from './persistent-build-cloud-bridge.js';
import { resolveWorkspaceForBuildRegistration } from './persistent-build-workspace-bridge.js';
import { validateBuildContext } from './persistent-build-context.js';
import { validateProgressPercent } from './persistent-build-progress.js';
import { validateResumeMetadata } from './persistent-build-resume.js';
import type {
  PersistentBuild,
  PersistentBuildValidationResult,
  DuplicatePersistentBuildRiskContext,
  RegisterPersistentBuildInput,
} from './persistent-build-types.js';
import {
  PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_PERSISTENT_BUILD_RISK_PREFIX,
} from './persistent-build-types.js';

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildDuplicatePersistentBuildRiskContext(
  buildName: string,
  buildType: RegisterPersistentBuildInput['buildType'] = 'GENERAL_BUILD',
): DuplicatePersistentBuildRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('build') || desc.includes('persistent') || desc.includes('execution') || desc.includes('runtime');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('build') || label.includes('persistent') || label.includes('execution');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const vaultSummaries = vault.listProjects().map(
    (p) => `${p.projectId} ${p.name} ${p.summary} ${p.facts.map((f) => f.value).join(' ')}`,
  );

  const brainSummaries = readAllSystemSummaries().map((s) => `${s.systemId}: ${s.summary}`);
  const runtimeSummaries = listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`);
  const workspaceSummaries = listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`);

  const aidevSummaries = listDevPulseV2Owners()
    .filter((o) => o.domain.includes('execution') || o.domain.includes('build_task') || o.domain.includes('code_generation'))
    .map((o) => `${o.domain}: ${o.description}`);

  const world2Summaries = listDevPulseV2Owners()
    .filter((o) => o.domain.includes('world2'))
    .map((o) => `${o.domain}: ${o.description}`);

  return {
    buildName,
    buildType: buildType ?? 'GENERAL_BUILD',
    ownershipDomains,
    capabilityIds,
    vaultSummaries,
    brainSummaries,
    runtimeSummaries,
    workspaceSummaries,
    aidevSummaries,
    world2Summaries,
  };
}

export function evaluateDuplicatePersistentBuildRisk(context: DuplicatePersistentBuildRiskContext): string[] {
  const risks: string[] = [];
  const normalized = normalizeName(context.buildName);

  for (const domain of context.ownershipDomains) {
    if (domain !== 'persistent_build_runtime_foundation' && normalizeName(domain).includes(normalized)) {
      risks.push(
        `${DUPLICATE_PERSISTENT_BUILD_RISK_PREFIX}: ownership domain "${domain}" overlaps build name "${context.buildName}" — integrate with existing authority`,
      );
    }
  }

  const parallelTerms = ['persistent_build_executor', 'build_runner_engine', 'long_running_build_engine'];
  for (const term of parallelTerms) {
    const normalizedTerm = normalizeName(term);
    if (
      context.ownershipDomains.some((d) => normalizeName(d) === normalizedTerm) ||
      context.capabilityIds.some((c) => normalizeName(c) === normalizedTerm)
    ) {
      risks.push(
        `${DUPLICATE_PERSISTENT_BUILD_RISK_PREFIX}: parallel persistent build authority "${term}" registered`,
      );
    }
  }

  return risks;
}

export function validatePersistentBuildRegistration(input: RegisterPersistentBuildInput): PersistentBuildValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project — projectId required');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link — workspaceId required');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link — runtimeId required');
  if (!input.buildName?.trim()) blockers.push('Missing build name');

  const runtimeCheck = resolveRuntimeForBuildRegistration(input.runtimeId);
  if (!runtimeCheck.exists) {
    blockers.push(`Broken runtime reference — runtime ${input.runtimeId} not in Cloud Runtime Foundation`);
  } else if (runtimeCheck.projectId && runtimeCheck.projectId !== input.projectId) {
    warnings.push('Cross-project risk — runtime project differs from build project');
  }

  const workspaceCheck = resolveWorkspaceForBuildRegistration(input.workspaceId);
  if (!workspaceCheck.exists) {
    blockers.push(`Broken workspace reference — workspace ${input.workspaceId} not in Workspace Hosting Foundation`);
  } else {
    if (workspaceCheck.projectId && workspaceCheck.projectId !== input.projectId) {
      warnings.push('Cross-project risk — workspace project differs from build project');
    }
    if (workspaceCheck.runtimeId && workspaceCheck.runtimeId !== input.runtimeId) {
      warnings.push('Runtime/workspace mismatch risk');
    }
  }

  const duplicateRisks = evaluateDuplicatePersistentBuildRisk(
    buildDuplicatePersistentBuildRiskContext(input.buildName, input.buildType),
  );
  if (duplicateRisks.length > 0) warnings.push(...duplicateRisks);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks };
}

export function validatePersistentBuildRecord(build: PersistentBuild | null): PersistentBuildValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!build) {
    blockers.push('Missing build reference');
    return { valid: false, blockers, warnings, duplicateRisks: [] };
  }

  if (!build.buildOwner.projectId) blockers.push('Missing project ownership');
  if (!build.buildOwner.workspaceId) blockers.push('Missing workspace link');
  if (!build.buildOwner.runtimeId) blockers.push('Missing runtime link');
  if (build.buildOwner.ownerModule !== PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE) {
    blockers.push(`Invalid ownership — expected ${PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE}`);
  }
  if (!build.buildOwner.buildSessionId && build.buildState !== 'CREATED') {
    warnings.push('Missing session id — session not yet linked');
  }

  if (!validateProgressPercent(build.buildProgress.progressPercent)) {
    blockers.push('Invalid progress percent');
  }

  warnings.push(...validateBuildContext(build.buildContext));
  warnings.push(...validateResumeMetadata(build.buildResumeState));

  const stored = getStoredPersistentBuild(build.buildId);
  if (!stored) blockers.push(`Broken reference — build ${build.buildId} not in store`);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export function validatePersistentBuildState(state: string): boolean {
  return [
    'CREATED', 'INITIALIZING', 'READY', 'ACTIVE', 'PAUSED', 'RESUMABLE',
    'WAITING_FOR_APPROVAL', 'WAITING_FOR_VERIFICATION', 'WAITING_FOR_RECOVERY',
    'COMPLETED', 'FAILED', 'ARCHIVED',
  ].includes(state);
}
