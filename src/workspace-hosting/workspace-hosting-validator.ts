/**
 * Workspace Hosting Foundation — validation and duplicate workspace risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listRuntimes, getRuntime } from '../cloud-runtime/index.js';
import { resolveRuntimeForRegistration } from './workspace-hosting-runtime-bridge.js';
import { getStoredWorkspace } from './workspace-hosting-store.js';
import { evaluateIsolationBoundaryRisk } from './workspace-hosting-isolation.js';
import type {
  HostedWorkspace,
  WorkspaceValidationResult,
  DuplicateWorkspaceRiskContext,
  RegisterWorkspaceInput,
} from './workspace-hosting-types.js';
import {
  WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
  DUPLICATE_WORKSPACE_RISK_PREFIX,
} from './workspace-hosting-types.js';

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildDuplicateWorkspaceRiskContext(
  workspaceName: string,
  workspaceType: RegisterWorkspaceInput['workspaceType'] = 'GENERAL_WORKSPACE',
): DuplicateWorkspaceRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('workspace') || desc.includes('hosting') || desc.includes('cloud');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('workspace') || label.includes('hosting') || label.includes('cloud');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const vaultSummaries = vault.listProjects().map(
    (p) => `${p.projectId} ${p.name} ${p.summary} ${p.facts.map((f) => f.value).join(' ')}`,
  );

  const brainSummaries = readAllSystemSummaries().map((s) => `${s.systemId}: ${s.summary}`);
  const runtimeSummaries = listRuntimes().map(
    (r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName} ${r.runtimeType}`,
  );

  return {
    workspaceName,
    workspaceType: workspaceType ?? 'GENERAL_WORKSPACE',
    ownershipDomains,
    capabilityIds,
    vaultSummaries,
    brainSummaries,
    runtimeSummaries,
  };
}

export function evaluateDuplicateWorkspaceRisk(context: DuplicateWorkspaceRiskContext): string[] {
  const risks: string[] = [];
  const normalized = normalizeName(context.workspaceName);

  for (const domain of context.ownershipDomains) {
    if (domain !== 'workspace_hosting_foundation' && normalizeName(domain).includes(normalized)) {
      risks.push(
        `${DUPLICATE_WORKSPACE_RISK_PREFIX}: ownership domain "${domain}" overlaps workspace name "${context.workspaceName}" — integrate with existing authority`,
      );
    }
  }

  for (const cap of context.capabilityIds) {
    if (cap !== 'WORKSPACE_HOSTING_FOUNDATION' && normalizeName(cap).includes(normalized)) {
      risks.push(
        `${DUPLICATE_WORKSPACE_RISK_PREFIX}: capability "${cap}" overlaps workspace "${context.workspaceName}" — extend existing capability`,
      );
    }
  }

  const parallelTerms = ['workspace_hosting_executor', 'hosted_workspace_engine', 'cloud_workspace_runner'];
  for (const term of parallelTerms) {
    const normalizedTerm = normalizeName(term);
    if (
      context.ownershipDomains.some((d) => normalizeName(d) === normalizedTerm) ||
      context.capabilityIds.some((c) => normalizeName(c) === normalizedTerm)
    ) {
      risks.push(
        `${DUPLICATE_WORKSPACE_RISK_PREFIX}: parallel workspace authority "${term}" registered — do not create duplicate workspace authorities`,
      );
    }
  }

  return risks;
}

export function validateWorkspaceRegistration(input: RegisterWorkspaceInput): WorkspaceValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project — projectId required');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link — runtimeId required');
  if (!input.workspaceName?.trim()) blockers.push('Missing workspace name');

  const runtimeCheck = resolveRuntimeForRegistration(input.runtimeId);
  if (!runtimeCheck.exists) {
    blockers.push(`Broken runtime reference — runtime ${input.runtimeId} not found in Cloud Runtime Foundation`);
  } else if (runtimeCheck.projectId && runtimeCheck.projectId !== input.projectId) {
    warnings.push('Cross-project access risk — runtime project differs from workspace project');
  }

  const duplicateRisks = evaluateDuplicateWorkspaceRisk(
    buildDuplicateWorkspaceRiskContext(input.workspaceName, input.workspaceType),
  );
  if (duplicateRisks.length > 0) warnings.push(...duplicateRisks);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks };
}

export function validateHostedWorkspace(workspace: HostedWorkspace | null): WorkspaceValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!workspace) {
    blockers.push('Missing workspace reference');
    return { valid: false, blockers, warnings, duplicateRisks: [] };
  }

  if (!workspace.workspaceOwner.projectId) blockers.push('Missing project ownership');
  if (!workspace.workspaceOwner.runtimeId) blockers.push('Missing runtime link');
  if (workspace.workspaceOwner.ownerModule !== WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE) {
    blockers.push(`Invalid ownership — expected ${WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE}`);
  }
  if (!workspace.workspaceOwner.workspaceSessionId && workspace.workspaceState !== 'CREATED') {
    warnings.push('Missing session id — session not yet linked');
  }

  const runtime = getRuntime(workspace.workspaceOwner.runtimeId);
  if (!runtime) blockers.push(`Broken runtime reference — ${workspace.workspaceOwner.runtimeId}`);
  if (runtime && runtime.runtimeOwner.projectId !== workspace.workspaceOwner.projectId) {
    warnings.push('Cross-project access risk — workspace and runtime project mismatch');
  }

  const stored = getStoredWorkspace(workspace.workspaceId);
  if (!stored) blockers.push(`Broken reference — workspace ${workspace.workspaceId} not in store`);

  const isolationRisks = evaluateIsolationBoundaryRisk(workspace.workspaceId);
  warnings.push(...isolationRisks);

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export function validateWorkspaceState(state: string): boolean {
  return [
    'CREATED', 'INITIALIZING', 'READY', 'ACTIVE', 'PAUSED', 'RESUMABLE',
    'ISOLATED', 'COMPLETED', 'FAILED', 'ARCHIVED',
  ].includes(state);
}
