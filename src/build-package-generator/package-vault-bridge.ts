/**
 * Project Vault bridge — vault remains owner; generator consumes summaries read-only.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import type { ArchitectureBlueprint } from '../product-architect/types.js';
import { DUPLICATE_RISK_PREFIX as ARCHITECT_DUP_PREFIX } from '../product-architect/types.js';
import { getBrainSummariesForPackageDetection } from './package-brain-bridge.js';
import type { PackageDuplicateContext } from './types.js';

export interface PackageContext {
  projectCount: number;
  summaries: string[];
  capabilityLabels: string[];
}

export function getPackageContext(): PackageContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const projects = vault.listProjects();
  const summaries = projects.map((p) => `${p.name}: ${p.summary}`);
  const capabilityLabels: string[] = [];

  for (const project of projects) {
    for (const fact of project.facts) {
      if (/module|screen|flow|service|integration|capability|package/i.test(fact.label)) {
        capabilityLabels.push(fact.value);
      }
    }
    if (/module|screen|flow|service|integration|package/i.test(project.summary)) {
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
  const ctx = getPackageContext();
  if (ctx.capabilityLabels.length === 0) {
    return `Vault: ${ctx.projectCount} projects; no registered capabilities`;
  }
  return `Vault capabilities: ${ctx.capabilityLabels.join(', ')}`;
}

export function buildPackageDuplicateContextFromBridges(
  blueprint?: ArchitectureBlueprint,
): PackageDuplicateContext {
  const architectDuplicateWarnings =
    blueprint?.components
      .flatMap((c) => c.warnings)
      .filter((w) => w.startsWith(ARCHITECT_DUP_PREFIX)) ?? [];

  return {
    brainSummaries: getBrainSummariesForPackageDetection(),
    vaultCapabilities: getPackageContext().capabilityLabels,
    architectDuplicateWarnings,
  };
}

export function assertProjectVaultOwnershipUnchanged(): boolean {
  const vault = getDevPulseV2ProjectVaultAuthority();
  return (
    vault.constructor.name === 'DevPulseV2ProjectVaultAuthority' &&
    typeof vault.createProject === 'function' &&
    typeof (vault as { generateBuildPackages?: unknown }).generateBuildPackages === 'undefined'
  );
}

export function getProjectVaultOwnerForBridge(): string {
  return VAULT_OWNER_MODULE;
}
