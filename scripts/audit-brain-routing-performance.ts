/**
 * Phase 19.1A — read-only brain routing performance audit.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCapabilityRoutingTableStats } from '../src/command-center-brain/general-question-understanding/capability-routing-table.js';
import { getLazyRouteLoaderStats, HOT_ROUTE_GROUPS, LAZY_ROUTE_GROUPS } from '../src/command-center-brain/general-question-understanding/lazy-route-loader.js';
import { getRoutingPerformanceCacheStats, MAX_CACHE_SIZE } from '../src/command-center-brain/general-question-understanding/routing-performance-cache.js';
import { ALL_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const HOT_FILES = [
  'src/command-center-brain/general-question-understanding/index.ts',
  'src/command-center-brain/general-question-understanding/capability-selector.ts',
  'src/command-center-brain/general-question-understanding/capability-routing-table.ts',
  'src/command-center-brain/general-question-understanding/lazy-route-loader.ts',
];

function countImports(source: string): number {
  return (source.match(/^import\s+/gm) ?? []).length;
}

function main(): void {
  console.log('');
  console.log('DevPulse V2 — Phase 19.1A Brain Routing Performance Audit');
  console.log('==========================================================');
  console.log('');

  let importTotal = 0;
  for (const file of HOT_FILES) {
    const full = join(ROOT, file);
    const exists = existsSync(full);
    const lines = exists ? readFileSync(full, 'utf8').split('\n').length : 0;
    const imports = exists ? countImports(readFileSync(full, 'utf8')) : 0;
    importTotal += imports;
    console.log(`${exists ? '✓' : '✗'} ${file}`);
    console.log(`  lines: ${lines}, static imports: ${imports}`);
  }

  const routingStats = getCapabilityRoutingTableStats();
  const loaderStats = getLazyRouteLoaderStats();
  const cacheStats = getRoutingPerformanceCacheStats();

  console.log('');
  console.log('Routing table');
  console.log(`  primary routes: ${routingStats.primaryRouteCount}`);
  console.log(`  companion routes: ${routingStats.companionRouteCount}`);
  console.log(`  context map entries: ${routingStats.contextMapEntryCount}`);

  console.log('');
  console.log('Lazy loader');
  console.log(`  hot groups: ${HOT_ROUTE_GROUPS.length}`);
  console.log(`  lazy groups: ${LAZY_ROUTE_GROUPS.length}`);
  console.log(`  cached handlers: ${loaderStats.cachedHandlerCount}`);

  console.log('');
  console.log('Caches');
  console.log(`  max cache size: ${MAX_CACHE_SIZE}`);
  console.log(`  routing decision cache entries: ${cacheStats.routingDecisionSize}`);
  console.log(`  hits/misses: ${cacheStats.routingDecisionHits}/${cacheStats.routingDecisionMisses}`);

  console.log('');
  console.log(`UVL rows: ${ALL_UVL_ROWS.length}`);
  console.log(`Total static imports (hot files): ${importTotal}`);
  console.log('');
  console.log('Audit complete — exit 0');
}

main();
