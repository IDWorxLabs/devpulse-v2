/**
 * Workspace Reality Audit V1 — registry consistency checker.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { WorkspaceRealityDimensionResult } from './workspace-reality-audit-types.js';
import { parseFeatureRegistry } from './workspace-route-graph-checker.js';

export function auditRegistryConsistency(sourceRoot: string): {
  dimension: WorkspaceRealityDimensionResult;
  duplicateModules: string[];
} {
  const duplicateModules: string[] = [];
  const failureReasons: string[] = [];
  const warnings: string[] = [];
  const registryPath = join(sourceRoot, 'src/features/registry.ts');

  if (!existsSync(registryPath)) {
    return {
      duplicateModules,
      dimension: {
        readOnly: true,
        id: 'registryConsistency',
        label: 'Registry Consistency',
        status: 'FAIL',
        score: 0,
        evidencePaths: [],
        failureReasons: ['registry.ts missing'],
        warnings: [],
      },
    };
  }

  const entries = parseFeatureRegistry(readFileSync(registryPath, 'utf8'));
  const ids = new Map<string, number>();
  const routes = new Map<string, number>();
  let componentOk = 0;

  for (const entry of entries) {
    ids.set(entry.id, (ids.get(entry.id) ?? 0) + 1);
    routes.set(entry.route, (routes.get(entry.route) ?? 0) + 1);
    if (existsSync(join(sourceRoot, entry.sourcePath))) {
      componentOk += 1;
    } else {
      failureReasons.push(`Registry component missing: ${entry.sourcePath}`);
    }
  }

  for (const [id, count] of ids) {
    if (count > 1) {
      duplicateModules.push(`duplicate id: ${id}`);
      failureReasons.push(`Duplicate feature id: ${id}`);
    }
  }
  for (const [route, count] of routes) {
    if (count > 1) {
      duplicateModules.push(`duplicate route: ${route}`);
      failureReasons.push(`Duplicate route: ${route}`);
    }
  }

  const score =
    entries.length > 0
      ? Math.round((componentOk / entries.length) * 100) - duplicateModules.length * 15
      : 0;

  return {
    duplicateModules,
    dimension: {
      readOnly: true,
      id: 'registryConsistency',
      label: 'Registry Consistency',
      status: failureReasons.length > 0 ? 'FAIL' : 'PASS',
      score: Math.max(0, Math.min(100, score)),
      evidencePaths: [registryPath.replace(/\\/g, '/')],
      failureReasons,
      warnings,
    },
  };
}
