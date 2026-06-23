/**
 * Runtime entrypoint discovery — workspace startup candidates (Phase 26.77).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listGeneratedWorkspaceIds } from '../build-materialization-reality/artifact-scanner.js';
import { RUNTIME_DEV_SERVER_RELATIVE_PATH } from '../connected-build-execution/build-proof-gap-materializer.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import {
  ENTRYPOINT_MARKERS,
  FRAMEWORK_DEFAULT_PORTS,
  SCRIPT_CANDIDATES,
} from './runtime-startup-proof-repair-registry.js';
import type { RuntimeAppType, RuntimeEntrypointCandidate } from './runtime-startup-proof-repair-types.js';

function detectAppType(input: {
  scripts: Record<string, string>;
  deps: string;
  markers: string[];
}): RuntimeAppType {
  const joined = Object.values(input.scripts).join(' ').toLowerCase();
  const deps = input.deps.toLowerCase();
  if (joined.includes('vite') || deps.includes('"vite"') || input.markers.some((m) => m.includes('vite.config')))
    return 'VITE';
  if (joined.includes('next') || deps.includes('"next"') || input.markers.some((m) => m.includes('next.config')))
    return 'NEXT';
  if (joined.includes('expo') || deps.includes('"expo"')) return 'EXPO';
  if (joined.includes('express') || deps.includes('"express"')) return 'EXPRESS';
  if (joined.includes('react') || deps.includes('"react"') || input.markers.some((m) => m.includes('App.tsx')))
    return 'REACT';
  if (joined.includes('node') || input.markers.some((m) => m.includes('dev-server'))) return 'NODE';
  return 'UNKNOWN';
}

function scanMarkers(workspaceAbs: string): string[] {
  return ENTRYPOINT_MARKERS.filter((marker) => existsSync(join(workspaceAbs, marker))).map(
    (m) => m.replace(/\\/g, '/'),
  );
}

function readPackageJson(workspaceAbs: string): {
  scripts: Record<string, string>;
  deps: string;
  exists: boolean;
} {
  const pkgPath = join(workspaceAbs, 'package.json');
  if (!existsSync(pkgPath)) return { scripts: {}, deps: '', exists: false };
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return {
      scripts: pkg.scripts ?? {},
      deps: JSON.stringify({ ...pkg.dependencies, ...pkg.devDependencies }),
      exists: true,
    };
  } catch {
    return { scripts: {}, deps: '', exists: true };
  }
}

function pickScript(scripts: Record<string, string>): string | null {
  for (const candidate of SCRIPT_CANDIDATES) {
    if (scripts[candidate]) return `npm run ${candidate}`;
  }
  const first = Object.keys(scripts)[0];
  return first ? `npm run ${first}` : null;
}

function resolveEntryFile(markers: string[], appType: RuntimeAppType): string | null {
  if (markers.includes(RUNTIME_DEV_SERVER_RELATIVE_PATH)) return RUNTIME_DEV_SERVER_RELATIVE_PATH;
  if (markers.includes('server/index.ts')) return 'server/index.ts';
  if (markers.includes('server/index.js')) return 'server/index.js';
  if (markers.includes('index.js')) return 'index.js';
  if (appType === 'VITE' && markers.includes('src/main.tsx')) return 'src/main.tsx';
  if (appType === 'REACT' && markers.includes('src/App.tsx')) return 'src/App.tsx';
  return markers[0] ?? null;
}

export function resolvePrimaryWorkspace(input: {
  rootDir: string;
  buildMaterializationReport: ConnectedBuildExecutionReport | null;
  workspacePath?: string | null;
  workspaceId?: string | null;
}): { workspaceRoot: string; workspaceId: string; workspaceAbs: string } | null {
  if (input.workspacePath) {
    const workspaceRoot = input.workspacePath.replace(/\\/g, '/');
    const workspaceId =
      input.workspaceId ?? workspaceRoot.split('/').pop() ?? 'unknown';
    return {
      workspaceRoot,
      workspaceId,
      workspaceAbs: join(input.rootDir, workspaceRoot),
    };
  }

  const fromReport = input.buildMaterializationReport?.workspaceMaterialization.workspacePath;
  if (fromReport) {
    const workspaceRoot = fromReport.replace(/\\/g, '/');
    const contractId = input.buildMaterializationReport?.buildMaterialization.contractId ?? 'unknown';
    return {
      workspaceRoot,
      workspaceId: contractId !== 'none' ? contractId : workspaceRoot.split('/').pop() ?? 'unknown',
      workspaceAbs: join(input.rootDir, workspaceRoot),
    };
  }

  const ids = listGeneratedWorkspaceIds(input.rootDir);
  if (ids.length === 0) return null;
  const workspaceId = ids[0]!;
  const workspaceRoot = `.generated-builder-workspaces/${workspaceId}`;
  return { workspaceRoot, workspaceId, workspaceAbs: join(input.rootDir, workspaceRoot) };
}

export function discoverRuntimeEntrypoint(input: {
  rootDir: string;
  workspaceRoot: string;
  workspaceId: string;
  workspaceAbs: string;
  buildMaterializationReport: ConnectedBuildExecutionReport | null;
}): RuntimeEntrypointCandidate {
  const missingPrerequisites: string[] = [];
  const discoverySources: string[] = [];
  const markers = scanMarkers(input.workspaceAbs);
  discoverySources.push(...markers.map((m) => `marker:${m}`));

  const pkg = readPackageJson(input.workspaceAbs);
  if (!pkg.exists) missingPrerequisites.push('package.json missing');
  else discoverySources.push('package.json');

  if (input.buildMaterializationReport?.buildManifest.manifestExists) {
    discoverySources.push('connected-build-manifest');
  }

  const appType = detectAppType({ scripts: pkg.scripts, deps: pkg.deps, markers });
  const startCommand = pickScript(pkg.scripts);
  const entryFile = resolveEntryFile(markers, appType);
  const expectedPort = FRAMEWORK_DEFAULT_PORTS[appType] ?? FRAMEWORK_DEFAULT_PORTS.UNKNOWN!;

  if (!startCommand && !entryFile) {
    missingPrerequisites.push('no start script or entry file');
  }
  if (!existsSync(join(input.workspaceAbs, 'node_modules'))) {
    missingPrerequisites.push('node_modules not installed');
  }

  let confidence = 40;
  if (pkg.exists && startCommand) confidence += 30;
  if (entryFile) confidence += 15;
  if (input.buildMaterializationReport?.proofLevel === 'PROVEN') confidence += 10;
  if (missingPrerequisites.length === 0) confidence += 5;

  return {
    readOnly: true,
    appType,
    workspaceRoot: input.workspaceRoot,
    workspaceId: input.workspaceId,
    startCommand,
    expectedPort,
    entryFile,
    confidence: Math.min(confidence, 100),
    missingPrerequisites,
    discoverySources,
  };
}
