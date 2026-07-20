/**
 * Resolves Universal Feature Contract / approved-module surfaces for live traceability.
 * Never invents empty feature lists when current-build approved evidence exists.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import { loadTraceabilityInputFromWorkspace } from './contract-to-module-traceability-authority.js';
import type { CanonicalProductContract } from '../product-faithfulness-v2/generation-faithfulness-types.js';

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/** Surfaces from the approved envelope alone — always available on the live production path. */
export function resolveUniversalFeatureNamesFromEnvelope(
  envelope: ApprovedProductionBuildEnvelope,
): string[] {
  return unique([
    ...envelope.approvedModulePlan.moduleIds,
    ...envelope.approvedModulePlan.moduleEntries.flatMap((entry) => [
      entry.moduleId,
      entry.displayName,
      entry.contractSource,
    ]),
    ...envelope.approvedNavigationPlan.productEntries,
    ...envelope.approvedNavigationPlan.navigationItems.flatMap((item) => [
      item.moduleId,
      item.label,
    ]),
  ]);
}

function readWorkspaceFeatureContractFiles(workspacePath: string | null | undefined): GeneratedWorkspaceFile[] {
  if (!workspacePath?.trim()) return [];
  const candidates = [
    'feature-contract.json',
    'universal-feature-contract.json',
    join('source', 'feature-contract.json'),
    join('source', 'universal-feature-contract.json'),
    join('.aidev', 'feature-contract.json'),
  ];
  const files: GeneratedWorkspaceFile[] = [];
  for (const relativePath of candidates) {
    try {
      const content = readFileSync(join(workspacePath, relativePath), 'utf8');
      files.push({ relativePath: relativePath.replace(/\\/g, '/').split('/').pop()!, content });
    } catch {
      /* optional surface */
    }
  }
  return files;
}

/**
 * Authoritative current-build feature surfaces for CMT/PF:
 * 1. workspace UFC JSON when present
 * 2. otherwise approved envelope module/navigation projections
 * Never returns [] when the envelope has approved product modules.
 */
export function resolveUniversalFeatureNamesForCurrentBuild(input: {
  contract: CanonicalProductContract;
  envelope: ApprovedProductionBuildEnvelope;
  workspaceFiles?: readonly GeneratedWorkspaceFile[];
  workspacePath?: string | null;
  proposedModuleIds?: readonly string[];
}): {
  universalFeatureNames: string[];
  workspaceFiles: GeneratedWorkspaceFile[];
  source: 'WORKSPACE_FEATURE_CONTRACT' | 'APPROVED_ENVELOPE';
} {
  const envelopeNames = resolveUniversalFeatureNamesFromEnvelope(input.envelope);
  const workspaceFiles =
    input.workspaceFiles && input.workspaceFiles.length > 0
      ? [...input.workspaceFiles]
      : readWorkspaceFeatureContractFiles(input.workspacePath);

  if (workspaceFiles.length > 0) {
    const loaded = loadTraceabilityInputFromWorkspace({
      contract: input.contract,
      envelope: input.envelope,
      workspaceFiles,
      proposedModuleIds: input.proposedModuleIds ?? [...input.envelope.approvedModulePlan.moduleIds],
    });
    const names = unique([...loaded.universalFeatureNames, ...envelopeNames]);
    if (names.length > 0) {
      return { universalFeatureNames: names, workspaceFiles, source: 'WORKSPACE_FEATURE_CONTRACT' };
    }
  }

  if (envelopeNames.length === 0) {
    throw new Error(
      'verification_integrity:unsupported_feature_contract_schema: no current-build feature surfaces in workspace UFC or approved envelope',
    );
  }

  return {
    universalFeatureNames: envelopeNames,
    workspaceFiles,
    source: 'APPROVED_ENVELOPE',
  };
}
