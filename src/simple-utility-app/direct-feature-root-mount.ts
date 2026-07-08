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
}): DirectFeatureRootMountResolution | null {
  if (promptExplicitlyRequiresAuth(input.rawPrompt)) {
    return null;
  }

  const modules = materializableFeatureModules(input.definition).filter((id) => id !== 'auth');
  if (modules.length === 0) {
    return null;
  }

  const primaryModuleId = modules[0]!;
  const primaryRoute =
    input.definition.routes[0] && input.definition.routes[0] !== '/auth'
      ? input.definition.routes[0]!
      : '/';

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
    primaryRoute,
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
  const routePattern = new RegExp(
    `(id:\\s*['"]${primaryModuleId}['"][\\s\\S]*?route:\\s*['"])([^'"]+)(['"])`,
    'm',
  );
  if (!routePattern.test(registrySource)) {
    return registrySource;
  }
  return registrySource.replace(routePattern, `$1/$3`);
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

  if (!alreadyDirect || blueprintShellAppSource(current)) {
    writeFileSync(appPath, resolution.appTsx, 'utf8');
  }

  const registryPath = join(input.workspaceDir, 'src/features/registry.ts');
  if (existsSync(registryPath) && resolution.primaryRoute === '/') {
    const registrySource = readFileSync(registryPath, 'utf8');
    const patched = patchRegistryPrimaryRoute(registrySource, resolution.primaryModuleId);
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
