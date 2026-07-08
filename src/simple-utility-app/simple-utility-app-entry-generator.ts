/**
 * Simple Utility App — direct-mount App.tsx (no blueprint onboarding shell).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SimpleUtilityAppKind } from './simple-utility-app-registry.js';
import { simpleUtilityFeatureModules } from './simple-utility-app-registry.js';
import { moduleIdToPascalCase } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';

export function buildSimpleUtilityAppTsx(kind: SimpleUtilityAppKind, _appTitle: string): string {
  const moduleId = simpleUtilityFeatureModules(kind)[0]!;
  const componentName = `${moduleIdToPascalCase(moduleId)}Feature`;
  return `import ${componentName} from './features/${moduleId}';

export default function App() {
  return (
    <main data-simple-utility-app="${kind}" data-root-feature="${moduleId}" data-feature-module="${moduleId}">
      <${componentName} />
    </main>
  );
}
`;

}

export interface SimpleUtilityWorkspaceMountAudit {
  readOnly: true;
  passed: boolean;
  failureReasons: string[];
}

export function auditSimpleUtilityWorkspaceMount(
  workspaceDir: string,
  kind: SimpleUtilityAppKind,
): SimpleUtilityWorkspaceMountAudit {
  const moduleId = simpleUtilityFeatureModules(kind)[0]!;
  const componentName = `${moduleIdToPascalCase(moduleId)}Feature`;
  const failures: string[] = [];

  const appPath = join(workspaceDir, 'src/App.tsx');
  if (!existsSync(appPath)) {
    return { readOnly: true, passed: false, failureReasons: ['src/App.tsx missing'] };
  }
  const appSource = readFileSync(appPath, 'utf8');
  if (!appSource.includes(componentName)) {
    failures.push(`App.tsx does not import ${componentName}`);
  }
  if (!appSource.includes(`<${componentName}`)) {
    failures.push(`App.tsx does not render ${componentName} at root`);
  }
  if (appSource.includes('WelcomeScreen') || appSource.includes("phase === 'welcome'")) {
    failures.push('App.tsx still uses blueprint welcome/onboarding shell instead of direct feature mount');
  }

  const registryPath = join(workspaceDir, 'src/features/registry.ts');
  if (existsSync(registryPath)) {
    const registrySource = readFileSync(registryPath, 'utf8');
    if (!registrySource.includes(`route: '/'`) && !registrySource.includes("route: \"/\"")) {
      failures.push(`Feature registry root route is not '/' — calculator must mount at /`);
    }
  } else {
    failures.push('src/features/registry.ts missing');
  }

  const featurePath = join(workspaceDir, `src/features/${moduleId}/${componentName}.tsx`);
  if (!existsSync(featurePath)) {
    failures.push(`${componentName}.tsx missing at src/features/${moduleId}/`);
  }

  return { readOnly: true, passed: failures.length === 0, failureReasons: failures };
}
