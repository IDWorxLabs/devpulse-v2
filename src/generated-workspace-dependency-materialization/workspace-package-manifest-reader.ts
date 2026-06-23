/**
 * Workspace package manifest reader (Phase 26.78).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { WorkspacePackageManifest } from './generated-workspace-dependency-materialization-types.js';

export function readWorkspacePackageManifest(workspaceAbs: string): WorkspacePackageManifest {
  const pkgPath = join(workspaceAbs, 'package.json');
  if (!existsSync(pkgPath)) {
    return {
      readOnly: true,
      packageJsonExists: false,
      packageName: null,
      packageManagerField: null,
      declaredDependencies: [],
      declaredDevDependencies: [],
      scripts: [],
      parseError: 'package.json not found',
    };
  }

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      name?: string;
      packageManager?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    return {
      readOnly: true,
      packageJsonExists: true,
      packageName: pkg.name ?? null,
      packageManagerField: pkg.packageManager ?? null,
      declaredDependencies: Object.keys(pkg.dependencies ?? {}),
      declaredDevDependencies: Object.keys(pkg.devDependencies ?? {}),
      scripts: Object.keys(pkg.scripts ?? {}),
      parseError: null,
    };
  } catch (err) {
    return {
      readOnly: true,
      packageJsonExists: true,
      packageName: null,
      packageManagerField: null,
      declaredDependencies: [],
      declaredDevDependencies: [],
      scripts: [],
      parseError: err instanceof Error ? err.message : String(err),
    };
  }
}
