/**
 * Project Vault bridge — vault remains owner; architect consumes summaries read-only.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { getBrainSummariesForDuplicateDetection } from './product-brain-bridge.js';
import type { DuplicateDetectionContext } from './types.js';

export interface ProjectArchitectureContext {
  projectCount: number;
  summaries: string[];
  capabilityLabels: string[];
}

export function getProjectArchitectureContext(): ProjectArchitectureContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const projects = vault.listProjects();
  const summaries = projects.map((p) => `${p.name}: ${p.summary}`);
  const capabilityLabels: string[] = [];

  for (const project of projects) {
    for (const fact of project.facts) {
      if (/module|screen|flow|service|integration|capability/i.test(fact.label)) {
        capabilityLabels.push(fact.value);
      }
    }
    if (/module|screen|flow|service|integration/i.test(project.summary)) {
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
  const ctx = getProjectArchitectureContext();
  if (ctx.capabilityLabels.length === 0) {
    return `Vault: ${ctx.projectCount} projects; no registered capabilities`;
  }
  return `Vault capabilities: ${ctx.capabilityLabels.join(', ')}`;
}

export function buildDuplicateContextFromBridges(): DuplicateDetectionContext {
  return {
    brainSummaries: getBrainSummariesForDuplicateDetection(),
    vaultCapabilities: getProjectArchitectureContext().capabilityLabels,
  };
}

export function assertProjectVaultOwnershipUnchanged(): boolean {
  const vault = getDevPulseV2ProjectVaultAuthority();
  return (
    vault.constructor.name === 'DevPulseV2ProjectVaultAuthority' &&
    typeof vault.createProject === 'function' &&
    typeof (vault as { generateArchitectureBlueprint?: unknown }).generateArchitectureBlueprint ===
      'undefined'
  );
}

export function getProjectVaultOwnerForBridge(): string {
  return VAULT_OWNER_MODULE;
}
