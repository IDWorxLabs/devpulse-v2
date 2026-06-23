/**
 * UI route discovery — evidence-backed UI candidate routes (Phase 26.84).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SPA_UI_FALLBACK_PROBE_PATH,
  UI_ROUTE_DISCOVERY_SCAN_FILES,
} from './runtime-ui-render-proof-registry.js';
import type {
  DiscoveredUiRoute,
  UiRouteDiscoverySource,
  UiRouteExpectation,
  UiSourceFileEvidence,
} from './runtime-ui-render-proof-types.js';
import type { RuntimeAppType } from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';
import type { RuntimeRouteReachabilityProofReport } from '../runtime-route-reachability-proof/runtime-route-reachability-proof-types.js';

function addRoute(
  map: Map<string, DiscoveredUiRoute>,
  path: string,
  source: UiRouteDiscoverySource,
  expectation: UiRouteExpectation,
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

function readTextIfExists(workspaceAbs: string, relative: string): string | null {
  const full = join(workspaceAbs, relative);
  if (!existsSync(full)) return null;
  try {
    return readFileSync(full, 'utf8');
  } catch {
    return null;
  }
}

function extractUiPaths(content: string): string[] {
  const paths: string[] = [];
  const patterns = [
    /path\s*[=:]\s*['"`]([^'"`]+)['"`]/gi,
    /href\s*=\s*['"`](\/[^'"`]+)['"`]/gi,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const raw = match[1]!;
      if (raw && !raw.includes('*') && raw.length < 120) {
        paths.push(raw.startsWith('/') ? raw : `/${raw}`);
      }
    }
  }
  return paths;
}

export function discoverUiSourceFiles(workspaceAbs: string): UiSourceFileEvidence {
  const discoveredFiles: string[] = [];
  for (const rel of UI_ROUTE_DISCOVERY_SCAN_FILES) {
    if (existsSync(join(workspaceAbs, rel))) discoveredFiles.push(rel);
  }
  const hasIndexHtml = existsSync(join(workspaceAbs, 'index.html'));
  const hasReactApp =
    existsSync(join(workspaceAbs, 'src/App.tsx')) || existsSync(join(workspaceAbs, 'src/App.jsx'));
  const hasReactEntrypoint =
    existsSync(join(workspaceAbs, 'src/main.tsx')) ||
    existsSync(join(workspaceAbs, 'src/main.jsx')) ||
    existsSync(join(workspaceAbs, 'src/index.tsx')) ||
    existsSync(join(workspaceAbs, 'src/index.jsx'));
  const hasViteConfig =
    existsSync(join(workspaceAbs, 'vite.config.ts')) || existsSync(join(workspaceAbs, 'vite.config.mjs'));

  return {
    readOnly: true,
    hasIndexHtml,
    hasReactApp,
    hasViteConfig,
    hasReactEntrypoint,
    uiSourceFilesPresent: hasIndexHtml || hasReactApp || hasReactEntrypoint || hasViteConfig,
    discoveredFiles,
  };
}

function discoverFromRouteProof(
  routeProof: RuntimeRouteReachabilityProofReport | null,
  map: Map<string, DiscoveredUiRoute>,
): void {
  if (!routeProof) return;
  for (const route of routeProof.discoveredRoutes) {
    addRoute(map, route.path, 'ROUTE_REACHABILITY_PROOF', 'UNKNOWN', route.confidence * 0.9);
  }
}

function discoverFromIndexHtml(workspaceAbs: string, map: Map<string, DiscoveredUiRoute>): void {
  if (!existsSync(join(workspaceAbs, 'index.html'))) return;
  addRoute(map, '/', 'INDEX_HTML', 'HTML_SHELL', 0.9);
  addRoute(map, '/index.html', 'INDEX_HTML', 'HTML_SHELL', 0.85);
}

function discoverFromBuildManifest(workspaceAbs: string, map: Map<string, DiscoveredUiRoute>): void {
  const text = readTextIfExists(workspaceAbs, 'build-manifest.json');
  if (!text) return;
  try {
    const manifest = JSON.parse(text) as { uiRoutes?: string[]; routes?: string[] };
    for (const route of manifest.uiRoutes ?? manifest.routes ?? []) {
      addRoute(map, route, 'BUILD_MANIFEST', 'HTML_SHELL', 0.8);
    }
  } catch {
    // ignore
  }
}

function discoverFromReactEntrypoints(workspaceAbs: string, map: Map<string, DiscoveredUiRoute>): void {
  for (const rel of ['src/App.tsx', 'src/App.jsx', 'src/main.tsx', 'src/main.jsx']) {
    const text = readTextIfExists(workspaceAbs, rel);
    if (!text) continue;
    addRoute(map, '/', 'REACT_ENTRYPOINT', 'REACT_MOUNT', 0.75);
    for (const path of extractUiPaths(text)) {
      addRoute(map, path, 'REACT_ENTRYPOINT', 'SPA_ENTRY', 0.7);
    }
  }
}

function discoverFromDevServer(workspaceAbs: string, map: Map<string, DiscoveredUiRoute>): void {
  for (const rel of ['runtime/dev-server.mjs', 'runtime/dev-server.js']) {
    const text = readTextIfExists(workspaceAbs, rel);
    if (!text) continue;
    if (/application\/json/i.test(text)) {
      addRoute(map, '/', 'DEV_SERVER', 'JSON_RUNTIME', 0.95);
    } else {
      addRoute(map, '/', 'DEV_SERVER', 'HTML_SHELL', 0.85);
    }
  }
}

function discoverFromPackageManifest(workspaceAbs: string, map: Map<string, DiscoveredUiRoute>): void {
  const text = readTextIfExists(workspaceAbs, 'package.json');
  if (!text) return;
  try {
    const pkg = JSON.parse(text) as { scripts?: Record<string, string> };
    const scripts = Object.values(pkg.scripts ?? {}).join(' ').toLowerCase();
    if (/vite|react-scripts|next dev/.test(scripts)) {
      addRoute(map, '/', 'PACKAGE_MANIFEST', 'SPA_ENTRY', 0.6);
    }
  } catch {
    // ignore
  }
}

function discoverFromVerificationContracts(
  rootDir: string,
  workspaceId: string,
  map: Map<string, DiscoveredUiRoute>,
): void {
  const contractPaths = [
    join(rootDir, 'architecture', 'verification-contracts', `${workspaceId}.json`),
    join(rootDir, 'architecture', 'verification-contracts', 'default.json'),
  ];
  for (const contractPath of contractPaths) {
    if (!existsSync(contractPath)) continue;
    try {
      const contract = JSON.parse(readFileSync(contractPath, 'utf8')) as {
        uiRoutes?: string[];
        routes?: string[];
      };
      for (const route of contract.uiRoutes ?? contract.routes ?? []) {
        addRoute(map, route, 'VERIFICATION_CONTRACT', 'HTML_SHELL', 0.88);
      }
    } catch {
      // ignore
    }
  }
}

function discoverSpaFallback(appType: RuntimeAppType, map: Map<string, DiscoveredUiRoute>): void {
  if (appType === 'VITE' || appType === 'REACT') {
    addRoute(map, SPA_UI_FALLBACK_PROBE_PATH, 'VITE_SPA_FALLBACK', 'SPA_ENTRY', 0.7);
  }
}

export function discoverUiRoutes(input: {
  rootDir: string;
  workspaceAbs: string;
  workspaceId: string;
  appType: RuntimeAppType;
  routeReachabilityProof: RuntimeRouteReachabilityProofReport | null;
}): { routes: readonly DiscoveredUiRoute[]; uiSourceFiles: UiSourceFileEvidence } {
  const map = new Map<string, DiscoveredUiRoute>();

  addRoute(map, '/', 'ROOT_DEFAULT', 'HTML_SHELL', 1);
  discoverFromRouteProof(input.routeReachabilityProof, map);
  discoverFromIndexHtml(input.workspaceAbs, map);
  discoverFromBuildManifest(input.workspaceAbs, map);
  discoverFromReactEntrypoints(input.workspaceAbs, map);
  discoverFromDevServer(input.workspaceAbs, map);
  discoverFromPackageManifest(input.workspaceAbs, map);
  discoverFromVerificationContracts(input.rootDir, input.workspaceId, map);
  discoverSpaFallback(input.appType, map);

  const uiSourceFiles = discoverUiSourceFiles(input.workspaceAbs);

  return {
    routes: [...map.values()].sort((a, b) => a.path.localeCompare(b.path)),
    uiSourceFiles,
  };
}
