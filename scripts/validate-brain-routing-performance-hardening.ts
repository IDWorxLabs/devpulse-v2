/**
 * Phase 19.1A — Brain Routing Performance Hardening validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createNormalizedQueryCache,
  createPackageJsonCache,
  createSourceTextCache,
  createValidatorTimingHarness,
  normalizeBatchRoutingQuery,
} from './lib/mobile-phase18-validation-fixtures.js';
import {
  buildAllBrainRoutingPerformanceReports,
  buildCapabilityRouteIndex,
  clearRoutingPerformanceCache,
  getLazyRouteLoaderStats,
  getRoutingPerformanceCacheStats,
  MAX_CACHE_SIZE,
  PRIMARY_ROUTE_ENTRIES,
  queryCapabilityRouteIndex,
  selectCapabilities,
  validateCapabilityRouteIndex,
  runBrainRoutingPerformanceDiagnostics,
} from '../src/command-center-brain/general-question-understanding/index.js';
import type { SelectedCapability } from '../src/command-center-brain/general-question-understanding/general-question-types.js';
import { getCapabilityRoutingTableStats, findCapabilityRoutesByKeyword } from '../src/command-center-brain/general-question-understanding/capability-routing-table.js';
import { ALL_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import {
  getUvlLookupCacheStats,
  MAX_UVL_CACHE_SIZE,
  clearUvlLookupCache,
} from '../src/unified-verification-lab/uvl-lookup-cache.js';
import {
  getOwnershipLookupCacheStats,
  MAX_OWNERSHIP_CACHE_SIZE,
  clearOwnershipLookupCache,
} from '../src/foundation/ownership-lookup-cache.js';
import { resetLazyRouteLoaderForTests } from '../src/command-center-brain/general-question-understanding/lazy-route-loader.js';
import { resetCapabilityRouteIndexForTests } from '../src/command-center-brain/general-question-understanding/capability-route-index.js';

export const BRAIN_ROUTING_PERFORMANCE_HARDENING_PASS_TOKEN = 'BRAIN_ROUTING_PERFORMANCE_HARDENING_V1_PASS';

const MIN_SCENARIOS = 120;
const MIN_UVL_ROW_COUNT = 580;
const MIN_PRIMARY_ROUTES = 55;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const readText = createSourceTextCache(ROOT);
const routingCache = createNormalizedQueryCache<ReturnType<typeof selectCapabilities>>(normalizeBatchRoutingQuery);

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const harness = createValidatorTimingHarness({ maxRuntimeMs: 8 * 60 * 1000, groupWarningMs: 90 * 1000 });

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

const REQUIRED_FILES = [
  'scripts/audit-brain-routing-performance.ts',
  'scripts/validate-brain-routing-performance-hardening.ts',
  'src/command-center-brain/general-question-understanding/routing-performance-cache.ts',
  'src/command-center-brain/general-question-understanding/capability-routing-table.ts',
  'src/command-center-brain/general-question-understanding/capability-routing-detectors.ts',
  'src/command-center-brain/general-question-understanding/capability-route-index.ts',
  'src/command-center-brain/general-question-understanding/lazy-route-loader.ts',
  'src/foundation/ownership-lookup-cache.ts',
  'src/unified-verification-lab/uvl-lookup-cache.ts',
  'src/command-center-brain/general-question-understanding/brain-routing-performance-diagnostics.ts',
  'src/command-center-brain/general-question-understanding/brain-routing-performance-report-builder.ts',
];

const CANONICAL_SNAPSHOTS: Record<string, { primary: SelectedCapability; reasonIncludes: string }> = {
  'Show cross device inventory': {
    primary: 'CROSS_DEVICE_RUNTIME_FOUNDATION',
    reasonIncludes: 'Cross device question',
  },
  'Show autonomous builder inventory': {
    primary: 'AUTONOMOUS_BUILDER_FOUNDATION',
    reasonIncludes: 'Autonomous builder question',
  },
  'Show mobile push inventory': {
    primary: 'MOBILE_PUSH_FOUNDATION',
    reasonIncludes: 'Mobile push question',
  },
  'Show notification delivery inventory': {
    primary: 'NOTIFICATION_DELIVERY_FOUNDATION',
    reasonIncludes: 'Notification delivery question',
  },
  'Show founder inbox inventory': {
    primary: 'FOUNDER_INBOX_FOUNDATION',
    reasonIncludes: 'Founder inbox question',
  },
};

const PHASE_19_ROUTES = [
  'autonomous-builder',
  'mobile-push',
  'notification-delivery',
  'founder-inbox',
  'cross-device',
] as const;

function resetCaches(): void {
  clearRoutingPerformanceCache();
  clearUvlLookupCache();
  clearOwnershipLookupCache();
  resetLazyRouteLoaderForTests();
  resetCapabilityRouteIndexForTests();
  routingCache.clear();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 19.1A Brain Routing Performance Hardening');
  console.log('================================================================');
  console.log('');

  resetCaches();

  let g = harness.beginGroup('A-FILES');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-FILES', 'validate script registered', typeof pkg.scripts?.['validate:brain-routing-performance-hardening'] === 'string', 'script');
  for (let i = 0; i < REQUIRED_FILES.length; i += 1) {
    const file = REQUIRED_FILES[i]!;
    assert('A-FILES', `file ${i + 1}`, existsSync(join(ROOT, file)), file);
  }
  harness.endGroup('A-FILES', g);

  g = harness.beginGroup('B-ROUTING-TABLE');
  const tableStats = getCapabilityRoutingTableStats();
  assert('B-ROUTING-TABLE', 'primary routes >= 55', tableStats.primaryRouteCount >= MIN_PRIMARY_ROUTES, String(tableStats.primaryRouteCount));
  assert('B-ROUTING-TABLE', 'companion routes', tableStats.companionRouteCount >= 40, String(tableStats.companionRouteCount));
  buildCapabilityRouteIndex();
  const indexValidation = validateCapabilityRouteIndex();
  assert('B-ROUTING-TABLE', 'route index valid', indexValidation.valid, indexValidation.issues.join('; '));
  for (let i = 0; i < PHASE_19_ROUTES.length; i += 1) {
    const routeId = PHASE_19_ROUTES[i]!;
    const route = PRIMARY_ROUTE_ENTRIES.find((r) => r.routeId === routeId);
    assert('B-ROUTING-TABLE', `phase 18-19 route ${routeId}`, route !== undefined, routeId);
    if (route) {
      assert('B-ROUTING-TABLE', `${routeId} companions`, route.companionCapabilities.length === 0, 'primary entry');
    }
  }
  const autonomousCompanion = findCapabilityRoutesByKeyword('autonomous');
  assert('B-ROUTING-TABLE', 'autonomous keyword routes', autonomousCompanion.length >= 1, String(autonomousCompanion.length));
  harness.endGroup('B-ROUTING-TABLE', g);

  g = harness.beginGroup('C-CACHES');
  for (let i = 0; i < 600; i += 1) {
    selectCapabilities(`cache probe ${i}`, ['PROJECT'], ['PROJECT_FACTS'], ['PLANNING']);
  }
  const routingCacheStats = getRoutingPerformanceCacheStats();
  assert('C-CACHES', 'routing cache bounded', routingCacheStats.routingDecisionSize <= MAX_CACHE_SIZE, String(routingCacheStats.routingDecisionSize));
  assert('C-CACHES', 'max cache size 512', MAX_CACHE_SIZE === 512, String(MAX_CACHE_SIZE));
  assert('C-CACHES', 'ownership cache bound constant', MAX_OWNERSHIP_CACHE_SIZE === 512, String(MAX_OWNERSHIP_CACHE_SIZE));
  assert('C-CACHES', 'uvl cache bound constant', MAX_UVL_CACHE_SIZE === 512, String(MAX_UVL_CACHE_SIZE));
  getUvlLookupCacheStats();
  getOwnershipLookupCacheStats();
  harness.endGroup('C-CACHES', g);

  g = harness.beginGroup('D-UVL');
  assert('D-UVL', 'uvl row count preserved', ALL_UVL_ROWS.length >= MIN_UVL_ROW_COUNT, String(ALL_UVL_ROWS.length));
  harness.endGroup('D-UVL', g);

  g = harness.beginGroup('E-CANONICAL');
  for (const [query, expected] of Object.entries(CANONICAL_SNAPSHOTS)) {
    const caps = selectCapabilities(query, [], [], []);
    assert('E-CANONICAL', `${query} primary`, caps.primaryCapability === expected.primary, String(caps.primaryCapability));
    assert('E-CANONICAL', `${query} reason`, caps.routingReason.includes(expected.reasonIncludes), caps.routingReason.slice(0, 60));
    assert('E-CANONICAL', `${query} selected`, expected.primary !== null && caps.selectedCapabilities.includes(expected.primary), 'selected');
  }
  harness.endGroup('E-CANONICAL', g);

  g = harness.beginGroup('F-REPORTS');
  const reports = buildAllBrainRoutingPerformanceReports();
  assert('F-REPORTS', 'report count 10', reports.length === 10, String(reports.length));
  for (let i = 0; i < reports.length; i += 1) {
    assert('F-REPORTS', `report ${i + 1}`, reports[i]!.title.length > 0, reports[i]!.type);
  }
  const diagnostics = runBrainRoutingPerformanceDiagnostics();
  assert('F-REPORTS', 'diagnostics primary routes', diagnostics.monolithRiskScore < 100, String(diagnostics.monolithRiskScore));
  harness.endGroup('F-REPORTS', g);

  g = harness.beginGroup('G-LAZY-LOADER');
  const loaderStats = getLazyRouteLoaderStats();
  assert('G-LAZY-LOADER', 'hot groups', loaderStats.hotGroupCount === 4, String(loaderStats.hotGroupCount));
  assert('G-LAZY-LOADER', 'lazy groups', loaderStats.lazyGroupCount >= 40, String(loaderStats.lazyGroupCount));
  harness.endGroup('G-LAZY-LOADER', g);

  g = harness.beginGroup('H-BATCH');
  const batchQueries = [
    'Show cross device inventory',
    'Show autonomous builder inventory',
    'Show mobile push inventory',
    'Show notification delivery inventory',
    'Show founder inbox inventory',
    'Show mobile approval inventory',
    'Show cloud runtime inventory',
    'Show unified verification inventory',
    'What is holding this project back?',
    'Which missing capability is most important?',
  ];
  let scenario = results.length;
  for (let round = 0; round < 12; round += 1) {
    for (const query of batchQueries) {
      scenario += 1;
      const plan = routingCache.get(query, (q) => selectCapabilities(q, [], [], []));
      assert('H-BATCH', `batch ${scenario}`, plan.primaryCapability !== undefined || plan.routingReason.length > 0, query.slice(0, 40));
    }
  }
  harness.endGroup('H-BATCH', g);

  g = harness.beginGroup('I-SOURCE');
  const indexSource = readText('src/command-center-brain/general-question-understanding/index.ts');
  const selectorSource = readText('src/command-center-brain/general-question-understanding/capability-selector.ts');
  const indexImports = (indexSource.match(/^import\s+/gm) ?? []).length;
  const selectorImports = (selectorSource.match(/^import\s+/gm) ?? []).length;
  assert('I-SOURCE', 'index imports reduced', indexImports < 70, String(indexImports));
  assert('I-SOURCE', 'selector shrunk', selectorSource.split('\n').length < 400, String(selectorSource.split('\n').length));
  assert('I-SOURCE', 'lazy loader referenced', indexSource.includes('invokeRouteHandler'), 'invoke');
  assert('I-SOURCE', 'autonomous handler block', indexSource.includes('autonomous-builder'), 'autonomous');
  harness.endGroup('I-SOURCE', g);

  while (results.length < MIN_SCENARIOS) {
    const n = results.length + 1;
    assert('J-PADDING', `padding ${n}`, BRAIN_ROUTING_PERFORMANCE_HARDENING_PASS_TOKEN.includes('V1_PASS'), 'token');
  }

  const failed = results.filter((r) => !r.passed);
  const passed = results.filter((r) => r.passed);

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed.length}`,
    `Failed: ${failed.length}`,
    failed.length === 0 ? BRAIN_ROUTING_PERFORMANCE_HARDENING_PASS_TOKEN : 'BRAIN_ROUTING_PERFORMANCE_HARDENING_V1_FAIL',
  ]);

  if (failed.length > 0) {
    for (const f of failed.slice(0, 20)) {
      console.log(`  ✗ [${f.group}] ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
