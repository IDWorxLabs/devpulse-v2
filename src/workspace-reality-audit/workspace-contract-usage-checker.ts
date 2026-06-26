/**
 * Workspace Reality Audit V1 — contract usage checker.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { WorkspaceRealityDimensionResult } from './workspace-reality-audit-types.js';
import { parseFeatureRegistry } from './workspace-route-graph-checker.js';

const INFRASTRUCTURE = new Set(['auth', 'persistence', 'dashboard']);

export function auditContractUsage(input: {
  sourceRoot: string;
  manifest: GeneratedAppManifest;
}): WorkspaceRealityDimensionResult {
  const failureReasons: string[] = [];
  const warnings: string[] = [];
  const evidencePaths: string[] = [];
  const contractPath = join(input.sourceRoot, 'universal-feature-contract.json');
  const registryPath = join(input.sourceRoot, 'src/features/registry.ts');

  if (existsSync(contractPath)) evidencePaths.push(contractPath.replace(/\\/g, '/'));
  if (existsSync(registryPath)) evidencePaths.push(registryPath.replace(/\\/g, '/'));

  const registryEntries = existsSync(registryPath)
    ? parseFeatureRegistry(readFileSync(registryPath, 'utf8'))
    : [];

  let matched = 0;
  for (const entry of registryEntries) {
    if (INFRASTRUCTURE.has(entry.id)) {
      matched += 1;
      continue;
    }
    const moduleDir = join(input.sourceRoot, 'src/features', entry.id);
    const validationPath = join(moduleDir, `${entry.id}.validation.ts`);
    const manifestEntry = input.manifest.featureModuleDetails.find((item) => item.id === entry.id);
    const contractOk =
      entry.contractId === `feature-${entry.id}` &&
      (existsSync(validationPath) || Boolean(manifestEntry?.contractId));

    if (!existsSync(moduleDir)) {
      failureReasons.push(`Feature module missing for contract item: ${entry.id}`);
    } else if (!contractOk) {
      failureReasons.push(`Stale or missing contract id for ${entry.id}`);
    } else {
      matched += 1;
    }
  }

  const score = registryEntries.length > 0 ? Math.round((matched / registryEntries.length) * 100) : 100;
  return {
    readOnly: true,
    id: 'contractUsage',
    label: 'Contract Usage',
    status: failureReasons.length > 0 ? 'FAIL' : 'PASS',
    score,
    evidencePaths,
    failureReasons,
    warnings,
  };
}
