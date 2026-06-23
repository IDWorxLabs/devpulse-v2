/**
 * Route discovery — evidence-backed expected routes (Phase 26.83).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROUTE_DISCOVERY_SCAN_FILES,
  SPA_FALLBACK_PROBE_PATH,
} from './runtime-route-reachability-proof-registry.js';
import type {
  DiscoveredRoute,
  RouteDiscoverySource,
  RouteExpectation,
} from './runtime-route-reachability-proof-types.js';
import type { RuntimeAppType } from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

function addRoute(
  map: Map<string, DiscoveredRoute>,
  path: string,
  source: RouteDiscoverySource,
  expectation: RouteExpectation,
  confidence: number,
): void {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const existing = map.get(normalized);
  if (!existing || confidence > existing.confidence) {
    map.set(normalized, {
      readOnly: true,
      path: normalized,
      source,
      expectation,
      confidence,
    });
  }
}

function extractRoutePathsFromSource(content: string): string[] {
  const paths: string[] = [];
  const patterns = [
    /path\s*[=:]\s*['"`]([^'"`]+)['"`]/gi,
    /route\s*[=:]\s*['"`]([^'"`]+)['"`]/gi,
    /\.(?:get|post|put|delete|patch|use)\(\s*['"`]([^'"`]+)['"`]/gi,
    /['"`]\/(health|api|status|ready|ping)['"`]/gi,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const raw = match[1] ?? match[0].replace(/['"`]/g, '');
      if (raw && !raw.includes('*') && raw.length < 120) {
        paths.push(raw.startsWith('/') ? raw : `/${raw}`);
      }
    }
  }
  return paths;
}

function readTextIfExists(workspaceAbs: string, relative: string): string | null {
  const full = join(workspaceAbs, relative);
  if (!existsSync(full)) return null;
  try {
    return readFileSync(full, 'utf8');
  } catch {
    return null;
  }
}

function discoverFromBuildManifest(workspaceAbs: string, map: Map<string, DiscoveredRoute>): void {
  const text = readTextIfExists(workspaceAbs, 'build-manifest.json');
  if (!text) return;
  try {
    const manifest = JSON.parse(text) as {
      routes?: string[];
      runtimeEntry?: string;
      verificationRoutes?: string[];
    };
    for (const route of manifest.routes ?? []) {
      addRoute(map, route, 'BUILD_MANIFEST', 'UNKNOWN', 0.85);
    }
    for (const route of manifest.verificationRoutes ?? []) {
      addRoute(map, route, 'VERIFICATION_CONTRACT', 'UNKNOWN', 0.9);
    }
    if (manifest.runtimeEntry?.includes('dev-server')) {
      addRoute(map, '/', 'BUILD_MANIFEST', 'API_JSON', 0.9);
    }
  } catch {
    addRoute(map, '/', 'BUILD_MANIFEST', 'UNKNOWN', 0.5);
  }
}

function discoverFromDevServer(workspaceAbs: string, map: Map<string, DiscoveredRoute>): void {
  for (const rel of ['runtime/dev-server.mjs', 'runtime/dev-server.js']) {
    const text = readTextIfExists(workspaceAbs, rel);
    if (!text) continue;
    addRoute(map, '/', 'DEV_SERVER', 'API_JSON', 0.95);
    if (/\/health|['"`]health['"`]/i.test(text)) {
      addRoute(map, '/health', 'DEV_SERVER', 'HEALTH_JSON', 0.9);
    }
    for (const path of extractRoutePathsFromSource(text)) {
      addRoute(map, path, 'DEV_SERVER', 'API_JSON', 0.75);
    }
  }
}

function discoverFromServerRoutes(workspaceAbs: string, map: Map<string, DiscoveredRoute>): void {
  for (const rel of ['server/index.ts', 'server/index.js', 'server/routes.ts', 'server/routes.js']) {
    const text = readTextIfExists(workspaceAbs, rel);
    if (!text) continue;
    for (const path of extractRoutePathsFromSource(text)) {
      addRoute(map, path, 'SERVER_ROUTES', path.includes('health') ? 'HEALTH_JSON' : 'API_JSON', 0.8);
    }
  }
}

function discoverFromReactRouter(workspaceAbs: string, map: Map<string, DiscoveredRoute>): void {
  for (const rel of ['src/App.tsx', 'src/App.jsx', 'src/router.tsx', 'src/router.jsx', 'src/routes.tsx', 'src/routes.jsx']) {
    const text = readTextIfExists(workspaceAbs, rel);
    if (!text) continue;
    for (const path of extractRoutePathsFromSource(text)) {
      addRoute(map, path, 'REACT_ROUTER', 'HTML_PAGE', 0.75);
    }
  }
}

function discoverFromPackageManifest(workspaceAbs: string, map: Map<string, DiscoveredRoute>): void {
  const text = readTextIfExists(workspaceAbs, 'package.json');
  if (!text) return;
  try {
    const pkg = JSON.parse(text) as { homepage?: string; scripts?: Record<string, string> };
    if (pkg.homepage && pkg.homepage.startsWith('/')) {
      addRoute(map, pkg.homepage, 'PACKAGE_MANIFEST', 'HTML_PAGE', 0.6);
    }
    const scripts = Object.values(pkg.scripts ?? {}).join(' ');
    if (/vite|react-scripts|next dev/.test(scripts)) {
      addRoute(map, '/', 'PACKAGE_MANIFEST', 'HTML_PAGE', 0.55);
    }
  } catch {
    // ignore
  }
}

function discoverFromVerificationContracts(rootDir: string, workspaceId: string, map: Map<string, DiscoveredRoute>): void {
  const contractPaths = [
    join(rootDir, 'architecture', 'verification-contracts', `${workspaceId}.json`),
    join(rootDir, 'architecture', 'verification-contracts', 'default.json'),
  ];
  for (const contractPath of contractPaths) {
    if (!existsSync(contractPath)) continue;
    try {
      const contract = JSON.parse(readFileSync(contractPath, 'utf8')) as { routes?: string[] };
      for (const route of contract.routes ?? []) {
        addRoute(map, route, 'VERIFICATION_CONTRACT', 'UNKNOWN', 0.88);
      }
    } catch {
      // ignore
    }
  }
}

function discoverSpaFallback(appType: RuntimeAppType, map: Map<string, DiscoveredRoute>): void {
  if (appType === 'VITE' || appType === 'REACT') {
    addRoute(map, SPA_FALLBACK_PROBE_PATH, 'VITE_SPA_FALLBACK', 'SPA_FALLBACK', 0.7);
  }
  const viteConfigHint = [...map.values()].some((r) => r.source === 'PACKAGE_MANIFEST');
  if (viteConfigHint && appType === 'UNKNOWN') {
    addRoute(map, SPA_FALLBACK_PROBE_PATH, 'VITE_SPA_FALLBACK', 'SPA_FALLBACK', 0.55);
  }
}

export function discoverExpectedRoutes(input: {
  rootDir: string;
  workspaceAbs: string;
  workspaceId: string;
  appType: RuntimeAppType;
}): readonly DiscoveredRoute[] {
  const map = new Map<string, DiscoveredRoute>();

  addRoute(map, '/', 'ROOT_DEFAULT', 'ROOT_RESPONSE', 1);

  for (const rel of ROUTE_DISCOVERY_SCAN_FILES) {
    if (existsSync(join(input.workspaceAbs, rel))) {
      // presence contributes via specialized scanners
    }
  }

  discoverFromBuildManifest(input.workspaceAbs, map);
  discoverFromDevServer(input.workspaceAbs, map);
  discoverFromServerRoutes(input.workspaceAbs, map);
  discoverFromReactRouter(input.workspaceAbs, map);
  discoverFromPackageManifest(input.workspaceAbs, map);
  discoverFromVerificationContracts(input.rootDir, input.workspaceId, map);
  discoverSpaFallback(input.appType, map);

  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}
