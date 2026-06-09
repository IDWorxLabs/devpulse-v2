/**
 * Brain routing performance report builder — 10 report types.
 */

import { getCapabilityRoutingTableStats, getCapabilityRoutingTable, findCapabilityRoutesByKeyword } from './capability-routing-table.js';
import { getCapabilityRouteIndex, queryCapabilityRouteIndex, validateCapabilityRouteIndex } from './capability-route-index.js';
import { getRoutingPerformanceCacheStats, MAX_CACHE_SIZE } from './routing-performance-cache.js';
import { getLazyRouteLoaderStats, HOT_ROUTE_GROUPS, LAZY_ROUTE_GROUPS } from './lazy-route-loader.js';
import { runBrainRoutingPerformanceDiagnostics } from './brain-routing-performance-diagnostics.js';
import { getOwnershipLookupCacheStats } from '../../foundation/ownership-lookup-cache.js';
import { getUvlLookupCacheStats } from '../../unified-verification-lab/uvl-lookup-cache.js';
import { ALL_UVL_ROWS } from '../../unified-verification-lab/uvl-row-registry.js';
import { selectCapabilities } from './capability-selector.js';

export type BrainRoutingPerformanceReportType =
  | 'ROUTING_TABLE_SUMMARY'
  | 'ROUTE_INDEX_SUMMARY'
  | 'CACHE_STATS'
  | 'LAZY_LOADER_STATS'
  | 'OWNERSHIP_CACHE_STATS'
  | 'UVL_CACHE_STATS'
  | 'DIAGNOSTICS_SUMMARY'
  | 'PHASE_18_19_ROUTES'
  | 'CANONICAL_ROUTING_SNAPSHOTS'
  | 'UVL_COVERAGE';

export interface BrainRoutingPerformanceReport {
  type: BrainRoutingPerformanceReportType;
  title: string;
  generatedAt: string;
  payload: Record<string, unknown>;
}

const CANONICAL_QUERIES = [
  'Show cross device inventory',
  'Show autonomous builder inventory',
  'Show mobile push inventory',
  'Show notification delivery inventory',
  'Show founder inbox inventory',
] as const;

function buildRoutingTableSummaryReport(): BrainRoutingPerformanceReport {
  const stats = getCapabilityRoutingTableStats();
  const table = getCapabilityRoutingTable();
  return {
    type: 'ROUTING_TABLE_SUMMARY',
    title: 'Capability Routing Table Summary',
    generatedAt: new Date().toISOString(),
    payload: {
      stats,
      primaryRouteIds: table.primaryRoutes.map((r) => r.routeId),
      companionDetectorKeys: table.companionRoutes.map((r) => r.detectorKey),
    },
  };
}

function buildRouteIndexSummaryReport(): BrainRoutingPerformanceReport {
  const index = getCapabilityRouteIndex();
  const validation = validateCapabilityRouteIndex();
  return {
    type: 'ROUTE_INDEX_SUMMARY',
    title: 'Capability Route Index Summary',
    generatedAt: new Date().toISOString(),
    payload: {
      routeCount: index.routeCount,
      domainCount: index.byDomain.size,
      phaseCount: index.byPhase.size,
      keywordCount: index.byKeyword.size,
      validation,
      mobileRoutes: queryCapabilityRouteIndex({ kind: 'foundationCategory', value: 'mobile' }).length,
      autonomousRoutes: queryCapabilityRouteIndex({ kind: 'foundationCategory', value: 'autonomous' }).length,
    },
  };
}

function buildCacheStatsReport(): BrainRoutingPerformanceReport {
  const stats = getRoutingPerformanceCacheStats();
  return {
    type: 'CACHE_STATS',
    title: 'Routing Performance Cache Stats',
    generatedAt: new Date().toISOString(),
    payload: { stats, maxCacheSize: MAX_CACHE_SIZE, bounded: stats.routingDecisionSize <= MAX_CACHE_SIZE },
  };
}

function buildLazyLoaderStatsReport(): BrainRoutingPerformanceReport {
  return {
    type: 'LAZY_LOADER_STATS',
    title: 'Lazy Route Loader Stats',
    generatedAt: new Date().toISOString(),
    payload: {
      stats: getLazyRouteLoaderStats(),
      hotGroups: [...HOT_ROUTE_GROUPS],
      lazyGroups: [...LAZY_ROUTE_GROUPS],
    },
  };
}

function buildOwnershipCacheStatsReport(): BrainRoutingPerformanceReport {
  return {
    type: 'OWNERSHIP_CACHE_STATS',
    title: 'Ownership Lookup Cache Stats',
    generatedAt: new Date().toISOString(),
    payload: { stats: getOwnershipLookupCacheStats() },
  };
}

function buildUvlCacheStatsReport(): BrainRoutingPerformanceReport {
  return {
    type: 'UVL_CACHE_STATS',
    title: 'UVL Lookup Cache Stats',
    generatedAt: new Date().toISOString(),
    payload: { stats: getUvlLookupCacheStats(), allUvlRowCount: ALL_UVL_ROWS.length },
  };
}

function buildDiagnosticsSummaryReport(): BrainRoutingPerformanceReport {
  const diagnostics = runBrainRoutingPerformanceDiagnostics();
  return {
    type: 'DIAGNOSTICS_SUMMARY',
    title: 'Brain Routing Performance Diagnostics',
    generatedAt: new Date().toISOString(),
    payload: diagnostics as unknown as Record<string, unknown>,
  };
}

function buildPhase1819RoutesReport(): BrainRoutingPerformanceReport {
  const phaseRoutes = [
    ...findCapabilityRoutesByKeyword('autonomous'),
    ...findCapabilityRoutesByKeyword('mobile push'),
    ...findCapabilityRoutesByKeyword('notification delivery'),
    ...findCapabilityRoutesByKeyword('founder inbox'),
    ...findCapabilityRoutesByKeyword('cross device'),
  ];
  return {
    type: 'PHASE_18_19_ROUTES',
    title: 'Phase 18.5–19.1 Route Preservation',
    generatedAt: new Date().toISOString(),
    payload: {
      routeCount: phaseRoutes.length,
      routes: phaseRoutes.map((r) => ({
        routeId: r.routeId,
        capabilityId: r.capabilityId,
        phase: r.phase,
        foundationCategory: r.foundationCategory,
        companionCount: r.companionCapabilities.length,
      })),
    },
  };
}

function buildCanonicalRoutingSnapshotsReport(): BrainRoutingPerformanceReport {
  const snapshots: Record<string, ReturnType<typeof selectCapabilities>> = {};
  for (const query of CANONICAL_QUERIES) {
    snapshots[query] = selectCapabilities(query, [], [], []);
  }
  return {
    type: 'CANONICAL_ROUTING_SNAPSHOTS',
    title: 'Canonical Query Routing Snapshots',
    generatedAt: new Date().toISOString(),
    payload: { snapshots },
  };
}

function buildUvlCoverageReport(): BrainRoutingPerformanceReport {
  const phases = new Map<number, number>();
  for (const row of ALL_UVL_ROWS) {
    phases.set(row.phase, (phases.get(row.phase) ?? 0) + 1);
  }
  return {
    type: 'UVL_COVERAGE',
    title: 'UVL Coverage Report',
    generatedAt: new Date().toISOString(),
    payload: {
      totalRows: ALL_UVL_ROWS.length,
      rowsByPhase: Object.fromEntries(phases),
      extensionOnlyCount: ALL_UVL_ROWS.filter((r) => r.extensionOnly).length,
    },
  };
}

export function buildBrainRoutingPerformanceReport(type: BrainRoutingPerformanceReportType): BrainRoutingPerformanceReport {
  switch (type) {
    case 'ROUTING_TABLE_SUMMARY':
      return buildRoutingTableSummaryReport();
    case 'ROUTE_INDEX_SUMMARY':
      return buildRouteIndexSummaryReport();
    case 'CACHE_STATS':
      return buildCacheStatsReport();
    case 'LAZY_LOADER_STATS':
      return buildLazyLoaderStatsReport();
    case 'OWNERSHIP_CACHE_STATS':
      return buildOwnershipCacheStatsReport();
    case 'UVL_CACHE_STATS':
      return buildUvlCacheStatsReport();
    case 'DIAGNOSTICS_SUMMARY':
      return buildDiagnosticsSummaryReport();
    case 'PHASE_18_19_ROUTES':
      return buildPhase1819RoutesReport();
    case 'CANONICAL_ROUTING_SNAPSHOTS':
      return buildCanonicalRoutingSnapshotsReport();
    case 'UVL_COVERAGE':
      return buildUvlCoverageReport();
    default:
      throw new Error(`Unknown report type: ${type satisfies never}`);
  }
}

export function buildAllBrainRoutingPerformanceReports(): BrainRoutingPerformanceReport[] {
  const types: BrainRoutingPerformanceReportType[] = [
    'ROUTING_TABLE_SUMMARY',
    'ROUTE_INDEX_SUMMARY',
    'CACHE_STATS',
    'LAZY_LOADER_STATS',
    'OWNERSHIP_CACHE_STATS',
    'UVL_CACHE_STATS',
    'DIAGNOSTICS_SUMMARY',
    'PHASE_18_19_ROUTES',
    'CANONICAL_ROUTING_SNAPSHOTS',
    'UVL_COVERAGE',
  ];
  return types.map((type) => buildBrainRoutingPerformanceReport(type));
}
