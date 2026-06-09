/**
 * Phase 18.3.1 — shared cached fixtures for mobile foundation validators.
 * Performance only — no product behavior changes.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { createFounderRealityServer } from '../../server/founder-reality-server.js';

export const MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN = 'MOBILE_VALIDATION_RUNTIME_OPTIMIZER_V1_PASS';

export interface GroupTiming {
  group: string;
  elapsedMs: number;
}

export function createValidatorTimingHarness(options: {
  maxRuntimeMs: number;
  groupWarningMs: number;
}): {
  startedAt: number;
  groupTimings: GroupTiming[];
  beginGroup: (group: string) => number;
  endGroup: (group: string, started: number) => void;
  printRuntimeFooter: (lines: string[]) => void;
} {
  const startedAt = Date.now();
  const groupTimings: GroupTiming[] = [];

  return {
    startedAt,
    groupTimings,
    beginGroup(group: string): number {
      if (Date.now() - startedAt > options.maxRuntimeMs) {
        throw new Error(`Max runtime guard exceeded during ${group}`);
      }
      console.log(`▶ ${group} ...`);
      return Date.now();
    },
    endGroup(group: string, started: number): void {
      const elapsed = Date.now() - started;
      groupTimings.push({ group, elapsedMs: elapsed });
      if (elapsed > options.groupWarningMs) {
        console.log(`  ⚠ ${group} exceeded per-group warning threshold (${elapsed}ms > ${options.groupWarningMs}ms)`);
      }
    },
    printRuntimeFooter(lines: string[]): void {
      const elapsedMs = Date.now() - startedAt;
      const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
      console.log('');
      for (const line of lines) console.log(line);
      console.log(`Runtime: ${elapsedMs}ms`);
      if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
      for (const timing of groupTimings) {
        console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
      }
      console.log('');
    },
  };
}

export function createSourceTextCache(root: string): (path: string) => string {
  const cache = new Map<string, string>();
  return (path: string): string => {
    const key = path.replace(/\\/g, '/');
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const text = readFileSync(join(root, key), 'utf8');
    cache.set(key, text);
    return text;
  };
}

export function createPackageJsonCache(root: string): { scripts?: Record<string, string> } {
  return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
}

export function createUpstreamBootstrapper<T>(bootstrap: () => T): {
  ensure: () => T;
  invalidate: () => void;
} {
  let cached: T | null = null;
  return {
    ensure(): T {
      if (cached === null) cached = bootstrap();
      return cached;
    },
    invalidate(): void {
      cached = null;
    },
  };
}

export function createNormalizedQueryCache<T>(normalize: (query: string) => string): {
  get: (query: string, compute: (query: string) => T) => T;
  clear: () => void;
} {
  const cache = new Map<string, T>();
  return {
    get(query: string, compute: (query: string) => T): T {
      const key = normalize(query);
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const value = compute(query);
      cache.set(key, value);
      return value;
    },
    clear(): void {
      cache.clear();
    },
  };
}

export function normalizeBatchRoutingQuery(query: string): string {
  return query.replace(/\d+/g, 'N').trim().toLowerCase();
}

export async function runCachedHttpStatusChecks(options: {
  queries: readonly string[];
  iterations: number;
  onStatus: (index: number, status: number) => void;
}): Promise<void> {
  const server: Server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const statusByQuery = new Map<string, number>();

  for (const query of options.queries) {
    const res = await fetch(`http://127.0.0.1:${port}/api/brain/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query }),
    });
    statusByQuery.set(query.toLowerCase(), res.status);
  }

  for (let i = 0; i < options.iterations; i += 1) {
    const query = options.queries[i % options.queries.length]!;
    const status = statusByQuery.get(query.toLowerCase()) ?? 0;
    options.onStatus(i, status);
  }

  await new Promise<void>((resolve) => server.close(() => resolve()));
}
