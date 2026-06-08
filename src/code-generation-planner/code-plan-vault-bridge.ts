/**
 * Project Vault bridge — vault remains owner; planner consumes summaries read-only.
 */

import type { ImplementationStrategy } from '../implementation-strategy-engine/types.js';
import { DUPLICATE_RISK_PREFIX as STRATEGY_DUP_PREFIX } from '../implementation-strategy-engine/types.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { getBrainSummariesForPlanDetection } from './code-plan-brain-bridge.js';
import type { PlanDuplicateContext } from './types.js';

export interface CodePlanContext {
  projectCount: number;
  summaries: string[];
  capabilityLabels: string[];
}

export function getCodePlanContext(): CodePlanContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const projects = vault.listProjects();
  const summaries = projects.map((p) => `${p.name}: ${p.summary}`);
  const capabilityLabels: string[] = [];

  for (const project of projects) {
    for (const fact of project.facts) {
      if (/module|screen|flow|service|integration|capability|package|plan|task/i.test(fact.label)) {
        capabilityLabels.push(fact.value);
      }
    }
    if (/module|screen|flow|service|integration|package|plan|task/i.test(project.summary)) {
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
  const ctx = getCodePlanContext();
  if (ctx.capabilityLabels.length === 0) {
    return `Vault: ${ctx.projectCount} projects; no registered capabilities`;
  }
  return `Vault capabilities: ${ctx.capabilityLabels.join(', ')}`;
}

export function buildPlanDuplicateContextFromBridges(
  strategy?: ImplementationStrategy,
  extra?: Partial<PlanDuplicateContext>,
): PlanDuplicateContext {
  const strategyDuplicateWarnings =
    strategy?.duplicateRisks.filter((w) => w.startsWith(STRATEGY_DUP_PREFIX)) ?? [];

  return {
    brainSummaries: getBrainSummariesForPlanDetection(),
    vaultCapabilities: getCodePlanContext().capabilityLabels,
    architectDuplicateWarnings: extra?.architectDuplicateWarnings ?? [],
    packageDuplicateWarnings: extra?.packageDuplicateWarnings ?? [],
    strategyDuplicateWarnings: extra?.strategyDuplicateWarnings ?? strategyDuplicateWarnings,
  };
}

export function assertProjectVaultOwnershipUnchanged(): boolean {
  const vault = getDevPulseV2ProjectVaultAuthority();
  return (
    vault.constructor.name === 'DevPulseV2ProjectVaultAuthority' &&
    typeof vault.createProject === 'function' &&
    typeof (vault as { generateCodePlan?: unknown }).generateCodePlan === 'undefined'
  );
}

export function getProjectVaultOwnerForBridge(): string {
  return VAULT_OWNER_MODULE;
}
