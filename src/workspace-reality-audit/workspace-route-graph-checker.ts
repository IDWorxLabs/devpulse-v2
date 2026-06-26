/**
 * Workspace Reality Audit V1 — route graph checker.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { WorkspaceRealityDimensionResult } from './workspace-reality-audit-types.js';

export interface RegistryEntry {
  id: string;
  route: string;
  sourcePath: string;
  contractId: string;
}

export function parseFeatureRegistry(source: string): RegistryEntry[] {
  const entries: RegistryEntry[] = [];
  const blocks = source.split(/\{\s*\n/).slice(1);
  for (const block of blocks) {
    const id = block.match(/id:\s*'([^']+)'/)?.[1];
    const route = block.match(/route:\s*'([^']+)'/)?.[1];
    const sourcePath = block.match(/sourcePath:\s*'([^']+)'/)?.[1];
    const contractId = block.match(/contractId:\s*'([^']+)'/)?.[1] ?? '';
    if (id && route && sourcePath) {
      entries.push({ id, route, sourcePath, contractId });
    }
  }
  return entries;
}

export function auditRouteGraphReality(sourceRoot: string): {
  dimension: WorkspaceRealityDimensionResult;
  brokenRoutes: string[];
  registryEntries: RegistryEntry[];
} {
  const brokenRoutes: string[] = [];
  const failureReasons: string[] = [];
  const evidencePaths: string[] = [];
  const registryPath = join(sourceRoot, 'src/features/registry.ts');
  const routesPath = join(sourceRoot, 'src/features/routes.ts');
  const routerPath = join(sourceRoot, 'src/features/FeatureAppRouter.tsx');

  if (!existsSync(registryPath) || !existsSync(routesPath) || !existsSync(routerPath)) {
    if (!existsSync(registryPath)) failureReasons.push('registry.ts missing');
    if (!existsSync(routesPath)) failureReasons.push('routes.ts missing');
    if (!existsSync(routerPath)) failureReasons.push('FeatureAppRouter.tsx missing');
    return {
      brokenRoutes,
      registryEntries: [],
      dimension: {
        readOnly: true,
        id: 'routeGraph',
        label: 'Route Graph Reality',
        status: 'FAIL',
        score: 0,
        evidencePaths,
        failureReasons,
        warnings: [],
      },
    };
  }

  const registrySource = readFileSync(registryPath, 'utf8');
  const routesSource = readFileSync(routesPath, 'utf8');
  const routerSource = readFileSync(routerPath, 'utf8');
  evidencePaths.push(registryPath.replace(/\\/g, '/'), routesPath.replace(/\\/g, '/'), routerPath.replace(/\\/g, '/'));

  const entries = parseFeatureRegistry(registrySource);
  let ok = 0;

  for (const entry of entries) {
    const componentExists = existsSync(join(sourceRoot, entry.sourcePath));
    const routeInRegistry = registrySource.includes(`route: '${entry.route}'`);
    const routeWired = routesSource.includes('FEATURE_REGISTRY') || routesSource.includes(entry.route);
    const routerReachable = routerSource.includes('FEATURE_REGISTRY') || routerSource.includes(entry.id);

    if (!componentExists || !routeInRegistry || !routeWired || !routerReachable) {
      brokenRoutes.push(`${entry.id} -> ${entry.route}`);
      failureReasons.push(`Broken route for ${entry.id}`);
    } else {
      ok += 1;
    }
  }

  const score = entries.length > 0 ? Math.round((ok / entries.length) * 100) : 0;
  return {
    brokenRoutes,
    registryEntries: entries,
    dimension: {
      readOnly: true,
      id: 'routeGraph',
      label: 'Route Graph Reality',
      status: brokenRoutes.length > 0 ? 'FAIL' : 'PASS',
      score,
      evidencePaths,
      failureReasons,
      warnings: [],
    },
  };
}
