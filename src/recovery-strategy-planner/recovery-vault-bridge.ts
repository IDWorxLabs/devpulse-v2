/**
 * Project Vault bridge — vault remains owner; recovery planner consumes summaries read-only.
 */

import type { CodeGenerationPlan } from '../code-generation-planner/types.js';
import { DUPLICATE_RISK_PREFIX as PLAN_DUP_PREFIX } from '../code-generation-planner/types.js';
import type { ImplementationStrategy } from '../implementation-strategy-engine/types.js';
import { DUPLICATE_RISK_PREFIX as STRATEGY_DUP_PREFIX } from '../implementation-strategy-engine/types.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { getBrainSummariesForRecoveryDetection } from './recovery-brain-bridge.js';
import type { RecoveryDuplicateContext } from './types.js';

export interface RecoveryContext {
  projectCount: number;
  summaries: string[];
  capabilityLabels: string[];
}

export function getRecoveryContext(): RecoveryContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const projects = vault.listProjects();
  const summaries = projects.map((p) => `${p.name}: ${p.summary}`);
  const capabilityLabels: string[] = [];

  for (const project of projects) {
    for (const fact of project.facts) {
      if (/module|recovery|rollback|capability|plan|strategy/i.test(fact.label)) {
        capabilityLabels.push(fact.value);
      }
    }
    if (/module|recovery|rollback|capability|plan|strategy/i.test(project.summary)) {
      capabilityLabels.push(project.summary);
    }
  }

  return {
    projectCount: projects.length,
    summaries,
    capabilityLabels,
  };
}

export function getExistingCapabilitySummary(): string {
  const ctx = getRecoveryContext();
  if (ctx.capabilityLabels.length === 0) {
    return `Vault: ${ctx.projectCount} projects; no registered capabilities`;
  }
  return `Vault capabilities: ${ctx.capabilityLabels.join(', ')}`;
}

export function buildRecoveryDuplicateContextFromBridges(
  codePlan?: CodeGenerationPlan,
  implementationStrategy?: ImplementationStrategy,
  extra?: Partial<RecoveryDuplicateContext>,
): RecoveryDuplicateContext {
  const codePlanDuplicateWarnings =
    codePlan?.tasks.flatMap((t) => t.duplicateRisks).filter((w) => w.startsWith(PLAN_DUP_PREFIX)) ??
    [];
  const strategyDuplicateWarnings =
    implementationStrategy?.duplicateRisks.filter((w) => w.startsWith(STRATEGY_DUP_PREFIX)) ?? [];

  return {
    brainSummaries: getBrainSummariesForRecoveryDetection(),
    vaultCapabilities: getRecoveryContext().capabilityLabels,
    architectDuplicateWarnings: extra?.architectDuplicateWarnings ?? [],
    packageDuplicateWarnings: extra?.packageDuplicateWarnings ?? [],
    strategyDuplicateWarnings: extra?.strategyDuplicateWarnings ?? strategyDuplicateWarnings,
    codePlanDuplicateWarnings: extra?.codePlanDuplicateWarnings ?? codePlanDuplicateWarnings,
  };
}

export function assertProjectVaultOwnershipUnchanged(): boolean {
  const vault = getDevPulseV2ProjectVaultAuthority();
  return (
    vault.constructor.name === 'DevPulseV2ProjectVaultAuthority' &&
    typeof vault.createProject === 'function' &&
    typeof (vault as { generateRecoveryStrategy?: unknown }).generateRecoveryStrategy ===
      'undefined'
  );
}

export function getProjectVaultOwnerForBridge(): string {
  return VAULT_OWNER_MODULE;
}
