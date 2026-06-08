/**
 * Project Vault bridge — vault remains owner; strategy engine consumes summaries read-only.
 */

import type { BuildPackageGenerationResult } from '../build-package-generator/types.js';
import { DUPLICATE_RISK_PREFIX as PACKAGE_DUP_PREFIX } from '../build-package-generator/types.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { getBrainSummariesForStrategyDetection } from './strategy-brain-bridge.js';
import type { StrategyDuplicateContext } from './types.js';

export interface StrategyContext {
  projectCount: number;
  summaries: string[];
  capabilityLabels: string[];
}

export function getStrategyContext(): StrategyContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const projects = vault.listProjects();
  const summaries = projects.map((p) => `${p.name}: ${p.summary}`);
  const capabilityLabels: string[] = [];

  for (const project of projects) {
    for (const fact of project.facts) {
      if (/module|screen|flow|service|integration|capability|package|strategy/i.test(fact.label)) {
        capabilityLabels.push(fact.value);
      }
    }
    if (/module|screen|flow|service|integration|package|strategy/i.test(project.summary)) {
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
  const ctx = getStrategyContext();
  if (ctx.capabilityLabels.length === 0) {
    return `Vault: ${ctx.projectCount} projects; no registered capabilities`;
  }
  return `Vault capabilities: ${ctx.capabilityLabels.join(', ')}`;
}

export function buildStrategyDuplicateContextFromBridges(
  generation?: BuildPackageGenerationResult,
): StrategyDuplicateContext {
  const packageDuplicateWarnings =
    generation?.packages.flatMap((p) => p.duplicateRisks).filter((w) => w.startsWith(PACKAGE_DUP_PREFIX)) ??
    [];

  return {
    brainSummaries: getBrainSummariesForStrategyDetection(),
    vaultCapabilities: getStrategyContext().capabilityLabels,
    packageDuplicateWarnings,
  };
}

export function assertProjectVaultOwnershipUnchanged(): boolean {
  const vault = getDevPulseV2ProjectVaultAuthority();
  return (
    vault.constructor.name === 'DevPulseV2ProjectVaultAuthority' &&
    typeof vault.createProject === 'function' &&
    typeof (vault as { generateImplementationStrategy?: unknown }).generateImplementationStrategy ===
      'undefined'
  );
}

export function getProjectVaultOwnerForBridge(): string {
  return VAULT_OWNER_MODULE;
}
