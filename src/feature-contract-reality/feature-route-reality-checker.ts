/**
 * Feature Contract Reality V1 — registry and route reality checks.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function checkFeatureRegistryReality(input: {
  workspaceDir: string;
  featureId: string;
  contractId: string;
  route: string;
}): {
  registryEntryPresent: boolean;
  routePresent: boolean;
  reachable: boolean;
  evidencePaths: string[];
  missingEvidence: string[];
  failureReasons: string[];
} {
  const registryPath = join(input.workspaceDir, 'src/features/registry.ts');
  const routesPath = join(input.workspaceDir, 'src/features/routes.ts');
  const routerPath = join(input.workspaceDir, 'src/features/FeatureAppRouter.tsx');
  const evidencePaths: string[] = [];
  const missingEvidence: string[] = [];
  const failureReasons: string[] = [];

  if (!existsSync(registryPath)) {
    missingEvidence.push('src/features/registry.ts');
    return {
      registryEntryPresent: false,
      routePresent: false,
      reachable: false,
      evidencePaths,
      missingEvidence,
      failureReasons: ['registry.ts missing'],
    };
  }

  const registrySource = readFileSync(registryPath, 'utf8');
  const routesSource = existsSync(routesPath) ? readFileSync(routesPath, 'utf8') : '';
  const routerSource = existsSync(routerPath) ? readFileSync(routerPath, 'utf8') : '';

  evidencePaths.push(registryPath.replace(/\\/g, '/'));
  if (existsSync(routesPath)) evidencePaths.push(routesPath.replace(/\\/g, '/'));
  if (existsSync(routerPath)) evidencePaths.push(routerPath.replace(/\\/g, '/'));

  const registryEntryPresent =
    registrySource.includes(`id: '${input.featureId}'`) &&
    registrySource.includes(`contractId: '${input.contractId}'`);

  const routePresent =
    registrySource.includes(`route: '${input.route}'`) &&
    (routesSource.includes('FEATURE_REGISTRY') || routesSource.includes(input.route));

  const reachable =
    routePresent &&
    routerSource.includes('FEATURE_REGISTRY') &&
    (routerSource.includes(input.featureId) || routerSource.includes(input.route));

  if (!registryEntryPresent) {
    missingEvidence.push(`registry entry for ${input.featureId}`);
    failureReasons.push(`Registry missing entry for ${input.featureId}`);
  }
  if (!routePresent) {
    missingEvidence.push(`route ${input.route}`);
    failureReasons.push(`Route missing for ${input.featureId}`);
  }
  if (!reachable) {
    missingEvidence.push('FeatureAppRouter reachability');
    failureReasons.push(`Feature ${input.featureId} not reachable through router`);
  }

  return {
    registryEntryPresent,
    routePresent,
    reachable,
    evidencePaths,
    missingEvidence,
    failureReasons,
  };
}
