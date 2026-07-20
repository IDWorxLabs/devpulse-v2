/**
 * Direct feature root mount — initial preview shows contract-primary surface without auth shell.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promptExplicitlyRequiresAuth } from '../universal-build-pipeline-verification/build-profile-policy.js';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { materializableFeatureModules } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import {
  detectSimpleUtilityAppKind,
  type SimpleUtilityAppKind,
} from './simple-utility-app-registry.js';
import { buildSimpleUtilityAppTsx } from './simple-utility-app-entry-generator.js';

export interface DirectFeatureRootMountResolution {
  readOnly: true;
  apply: boolean;
  primaryModuleId: string;
  primaryRoute: string;
  simpleUtilityKind: SimpleUtilityAppKind | null;
  appTsx: string;
  reason: string;
}

function blueprintShellAppSource(source: string): boolean {
  return (
    source.includes('WelcomeScreen') ||
    source.includes('AuthScreen') ||
    source.includes("phase === 'welcome'") ||
    source.includes("phase === 'auth'") ||
    source.includes('data-blueprint="welcome-screen"')
  );
}

export function resolveDirectFeatureRootMount(input: {
  rawPrompt: string;
  definition: ProfileFeatureDefinition;
  displayName?: string;
  /** CBGA/router home module — must match FeatureAppRouter default and registry `/`. */
  preferredPrimaryModuleId?: string | null;
}): DirectFeatureRootMountResolution | null {
  if (promptExplicitlyRequiresAuth(input.rawPrompt)) {
    return null;
  }

  const modules = materializableFeatureModules(input.definition).filter((id) => id !== 'auth');
  if (modules.length === 0) {
    return null;
  }

  const preferred =
    input.preferredPrimaryModuleId && modules.includes(input.preferredPrimaryModuleId)
      ? input.preferredPrimaryModuleId
      : null;
  const homeIndex = input.definition.routes.findIndex((route) => route === '/');
  const primaryModuleId =
    preferred ??
    (homeIndex >= 0 && modules.includes(input.definition.featureModules[homeIndex] ?? '')
      ? (input.definition.featureModules[homeIndex] as string)
      : modules[0]!);
  const primaryRoute = '/';

  const simpleUtilityKind = detectSimpleUtilityAppKind(input.rawPrompt);
  if (simpleUtilityKind) {
    return {
      readOnly: true,
      apply: true,
      primaryModuleId,
      primaryRoute: '/',
      simpleUtilityKind,
      appTsx: buildSimpleUtilityAppTsx(simpleUtilityKind, input.displayName ?? primaryModuleId),
      reason: 'Simple utility app — direct mount primary feature at root',
    };
  }

  if (modules.includes('auth')) {
    return null;
  }

  if (modules.length === 1) {
    const pascal = primaryModuleId
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    const componentName = `${pascal}Feature`;
    return {
      readOnly: true,
      apply: true,
      primaryModuleId,
      primaryRoute,
      simpleUtilityKind: null,
      appTsx: `import ${componentName} from './features/${primaryModuleId}';

export default function App() {
  return (
    <main data-direct-feature-app="true" data-root-feature="${primaryModuleId}" data-feature-module="${primaryModuleId}">
      <${componentName} />
    </main>
  );
}
`,
      reason: 'Single primary feature without auth — direct mount at root',
    };
  }

  return {
    readOnly: true,
    apply: true,
    primaryModuleId,
    // Multi-module router always homes at `/`; patchRegistryPrimaryRoute demotes any other `/`.
    primaryRoute: '/',
    simpleUtilityKind: null,
    appTsx: `import FeatureAppRouter from './features/FeatureAppRouter';

export default function App() {
  return (
    <main data-direct-feature-app="true" data-root-feature="${primaryModuleId}">
      <FeatureAppRouter />
    </main>
  );
}
`,
    reason: 'Multi-module app without auth — feature router at root (no blueprint phase machine)',
  };
}

export function patchRegistryPrimaryRoute(registrySource: string, primaryModuleId: string): string {
  // Rewrite every registry entry's route: only primaryModuleId owns `/`.
  return registrySource.replace(
    /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']*)',\s*route:\s*'([^']*)'/g,
    (_match, id: string, name: string) => {
      const route = id === primaryModuleId ? '/' : `/${id}`;
      return `{
    id: '${id}',
    name: '${name}',
    route: '${route}'`;
    },
  );
}

export function enforceDirectFeatureRootMountInWorkspace(input: {
  workspaceDir: string;
  rawPrompt: string;
  definition: ProfileFeatureDefinition;
  displayName?: string;
}): { applied: boolean; reason: string | null } {
  const resolution = resolveDirectFeatureRootMount(input);
  if (!resolution) {
    return { applied: false, reason: null };
  }

  const appPath = join(input.workspaceDir, 'src/App.tsx');
  if (!existsSync(appPath)) {
    return { applied: false, reason: 'src/App.tsx missing' };
  }

  const current = readFileSync(appPath, 'utf8');
  const alreadyDirect =
    current.includes('data-simple-utility-app') ||
    current.includes('data-direct-feature-app') ||
    (current.includes('data-root-feature') && !blueprintShellAppSource(current));

  // Home Module Consistency V1 — when App.tsx is ALREADY a materialized direct-feature mount, its
  // `data-root-feature` reflects the CBGA-approved home module chosen during materialization. That
  // decision is authoritative; this post-materialization pass must NOT recompute a different home
  // from `definition` (which lacks the CBGA route plan) and patch only the registry — that produced
  // a registry/App.tsx/router disagreement (registry `/`=X, App.tsx root=Y) that fails DOM reality.
  const alreadyMountedRootFeature =
    alreadyDirect && !blueprintShellAppSource(current)
      ? current.match(/data-root-feature="([^"]+)"/)?.[1] ?? null
      : null;

  if (!alreadyDirect || blueprintShellAppSource(current)) {
    writeFileSync(appPath, resolution.appTsx, 'utf8');
  }

  // Registry primary must match whatever home App.tsx actually mounts.
  const effectivePrimaryModuleId = alreadyMountedRootFeature ?? resolution.primaryModuleId;

  const registryPath = join(input.workspaceDir, 'src/features/registry.ts');
  if (existsSync(registryPath) && resolution.primaryRoute === '/') {
    const registrySource = readFileSync(registryPath, 'utf8');
    const patched = patchRegistryPrimaryRoute(registrySource, effectivePrimaryModuleId);
    if (patched !== registrySource) {
      writeFileSync(registryPath, patched, 'utf8');
    }
  }

  return { applied: true, reason: resolution.reason };
}

export function usesBlueprintAuthShell(workspaceDir: string): boolean {
  const appPath = join(workspaceDir, 'src/App.tsx');
  if (!existsSync(appPath)) return false;
  return blueprintShellAppSource(readFileSync(appPath, 'utf8'));
}
