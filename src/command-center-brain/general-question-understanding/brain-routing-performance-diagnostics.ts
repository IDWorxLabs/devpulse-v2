/**
 * Brain routing performance diagnostics.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCapabilityRoutingTableStats, PRIMARY_ROUTE_ENTRIES } from './capability-routing-table.js';
import { validateCapabilityRouteIndex } from './capability-route-index.js';
import { getRoutingPerformanceCacheStats, MAX_CACHE_SIZE } from './routing-performance-cache.js';
import { getLazyRouteLoaderStats, LAZY_ROUTE_GROUPS, HOT_ROUTE_GROUPS } from './lazy-route-loader.js';
import { getOwnershipLookupCacheStats, MAX_OWNERSHIP_CACHE_SIZE } from '../../foundation/ownership-lookup-cache.js';
import { getUvlLookupCacheStats, MAX_UVL_CACHE_SIZE } from '../../unified-verification-lab/uvl-lookup-cache.js';
import { ALL_UVL_ROWS } from '../../unified-verification-lab/uvl-row-registry.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../../..');

export interface BrainRoutingPerformanceDiagnostic {
  id: string;
  severity: 'INFO' | 'WARN' | 'RISK';
  message: string;
}

export interface BrainRoutingPerformanceDiagnosticsReport {
  diagnostics: BrainRoutingPerformanceDiagnostic[];
  monolithRiskScore: number;
  staticImportCount: number;
  duplicateRouteCount: number;
  cacheRiskCount: number;
}

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function countStaticImports(source: string): number {
  return (source.match(/^import\s+/gm) ?? []).length;
}

export function runBrainRoutingPerformanceDiagnostics(): BrainRoutingPerformanceDiagnosticsReport {
  const diagnostics: BrainRoutingPerformanceDiagnostic[] = [];
  const gquIndexPath = 'src/command-center-brain/general-question-understanding/index.ts';
  const capabilitySelectorPath = 'src/command-center-brain/general-question-understanding/capability-selector.ts';

  const indexSource = existsSync(join(ROOT, gquIndexPath)) ? readSource(gquIndexPath) : '';
  const selectorSource = existsSync(join(ROOT, capabilitySelectorPath)) ? readSource(capabilitySelectorPath) : '';

  const staticImportCount = countStaticImports(indexSource) + countStaticImports(selectorSource);
  if (staticImportCount > 25) {
    diagnostics.push({
      id: 'static-import-count',
      severity: 'WARN',
      message: `General question understanding modules still have ${staticImportCount} static imports.`,
    });
  } else {
    diagnostics.push({
      id: 'static-import-count',
      severity: 'INFO',
      message: `Static import count reduced to ${staticImportCount}.`,
    });
  }

  const indexLines = indexSource.split('\n').length;
  if (indexLines > 900) {
    diagnostics.push({
      id: 'index-monolith',
      severity: 'RISK',
      message: `general-question-understanding/index.ts has ${indexLines} lines — monolith risk.`,
    });
  }

  const routeIds = new Set<string>();
  let duplicateRouteCount = 0;
  for (const route of PRIMARY_ROUTE_ENTRIES) {
    if (routeIds.has(route.routeId)) duplicateRouteCount += 1;
    routeIds.add(route.routeId);
  }
  if (duplicateRouteCount > 0) {
    diagnostics.push({
      id: 'duplicate-routes',
      severity: 'RISK',
      message: `${duplicateRouteCount} duplicate route IDs detected in PRIMARY_ROUTE_ENTRIES.`,
    });
  }

  const indexValidation = validateCapabilityRouteIndex();
  if (!indexValidation.valid) {
    diagnostics.push({
      id: 'route-index-invalid',
      severity: 'RISK',
      message: indexValidation.issues.join('; '),
    });
  }

  const routingStats = getCapabilityRoutingTableStats();
  if (routingStats.primaryRouteCount < 55) {
    diagnostics.push({
      id: 'primary-route-count',
      severity: 'RISK',
      message: `Only ${routingStats.primaryRouteCount} primary routes — expected 55+.`,
    });
  }

  const cacheStats = getRoutingPerformanceCacheStats();
  let cacheRiskCount = 0;
  if (cacheStats.routingDecisionSize > MAX_CACHE_SIZE) {
    cacheRiskCount += 1;
    diagnostics.push({
      id: 'routing-cache-unbounded',
      severity: 'RISK',
      message: `Routing decision cache size ${cacheStats.routingDecisionSize} exceeds MAX_CACHE_SIZE ${MAX_CACHE_SIZE}.`,
    });
  }

  const ownershipStats = getOwnershipLookupCacheStats();
  if (ownershipStats.size > MAX_OWNERSHIP_CACHE_SIZE) {
    cacheRiskCount += 1;
    diagnostics.push({
      id: 'ownership-cache-unbounded',
      severity: 'RISK',
      message: `Ownership cache size ${ownershipStats.size} exceeds bound.`,
    });
  }

  const uvlStats = getUvlLookupCacheStats();
  if (uvlStats.rowCacheSize > MAX_UVL_CACHE_SIZE) {
    cacheRiskCount += 1;
    diagnostics.push({
      id: 'uvl-cache-unbounded',
      severity: 'RISK',
      message: `UVL cache size ${uvlStats.rowCacheSize} exceeds bound.`,
    });
  }

  const loaderStats = getLazyRouteLoaderStats();
  diagnostics.push({
    id: 'lazy-loader-stats',
    severity: 'INFO',
    message: `Hot groups: ${HOT_ROUTE_GROUPS.length}, lazy groups: ${LAZY_ROUTE_GROUPS.length}, cached handlers: ${loaderStats.cachedHandlerCount}.`,
  });

  diagnostics.push({
    id: 'uvl-row-count',
    severity: 'INFO',
    message: `ALL_UVL_ROWS count: ${ALL_UVL_ROWS.length}.`,
  });

  const requiredFiles = [
    'src/command-center-brain/general-question-understanding/routing-performance-cache.ts',
    'src/command-center-brain/general-question-understanding/capability-routing-table.ts',
    'src/command-center-brain/general-question-understanding/capability-routing-detectors.ts',
    'src/command-center-brain/general-question-understanding/capability-route-index.ts',
    'src/command-center-brain/general-question-understanding/lazy-route-loader.ts',
    'src/foundation/ownership-lookup-cache.ts',
    'src/unified-verification-lab/uvl-lookup-cache.ts',
  ];
  for (const file of requiredFiles) {
    if (!existsSync(join(ROOT, file))) {
      diagnostics.push({
        id: `missing-${file}`,
        severity: 'RISK',
        message: `Required performance file missing: ${file}`,
      });
    }
  }

  const monolithRiskScore =
    (indexLines > 900 ? 30 : 0) +
    (staticImportCount > 40 ? 25 : staticImportCount > 25 ? 10 : 0) +
    duplicateRouteCount * 10 +
    cacheRiskCount * 15 +
    (routingStats.primaryRouteCount < 55 ? 20 : 0);

  return {
    diagnostics,
    monolithRiskScore,
    staticImportCount,
    duplicateRouteCount,
    cacheRiskCount,
  };
}
