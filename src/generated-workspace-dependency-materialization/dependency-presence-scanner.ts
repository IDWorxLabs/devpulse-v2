/**
 * Dependency presence scanner (Phase 26.78).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type {
  DependencyPresenceScan,
  DependencyState,
  LockfileType,
  ModuleResolutionProbeResult,
  WorkspacePackageManifest,
} from './generated-workspace-dependency-materialization-types.js';

function detectLockfile(workspaceAbs: string): LockfileType {
  if (existsSync(join(workspaceAbs, 'pnpm-lock.yaml'))) return 'pnpm-lock.yaml';
  if (existsSync(join(workspaceAbs, 'yarn.lock'))) return 'yarn.lock';
  if (existsSync(join(workspaceAbs, 'package-lock.json'))) return 'package-lock.json';
  return 'none';
}

function isPackageInstalled(nodeModulesAbs: string, packageName: string): boolean {
  if (packageName.startsWith('@')) {
    const parts = packageName.split('/');
    if (parts.length >= 2) {
      return existsSync(join(nodeModulesAbs, parts[0]!, parts[1]!));
    }
  }
  return existsSync(join(nodeModulesAbs, packageName));
}

function missingFromNodeModules(
  nodeModulesAbs: string,
  declared: readonly string[],
): string[] {
  if (!existsSync(nodeModulesAbs)) return [...declared];
  return declared.filter((dep) => !isPackageInstalled(nodeModulesAbs, dep));
}

export function scanDependencyPresence(input: {
  workspaceAbs: string;
  manifest: WorkspacePackageManifest;
  moduleProbe: ModuleResolutionProbeResult;
  startupLogHints: readonly string[];
}): DependencyPresenceScan {
  const lockfileType = detectLockfile(input.workspaceAbs);
  const nodeModulesAbs = join(input.workspaceAbs, 'node_modules');
  const nodeModulesExists = existsSync(nodeModulesAbs);

  if (!input.manifest.packageJsonExists) {
    return {
      readOnly: true,
      packageJsonExists: false,
      declaredDependencies: [],
      declaredDevDependencies: [],
      lockfileType,
      nodeModulesExists,
      missingRuntimeDependencies: [],
      missingDevDependencies: [],
      importGraphMissingModules: input.moduleProbe.unresolvedModules,
      dependencyState: 'PACKAGE_MANIFEST_MISSING',
      dependencyStateReason: 'Generated workspace has no package.json.',
    };
  }

  const missingRuntime = missingFromNodeModules(nodeModulesAbs, input.manifest.declaredDependencies);
  const missingDev = missingFromNodeModules(nodeModulesAbs, input.manifest.declaredDevDependencies);
  const importMissing = input.moduleProbe.unresolvedModules;
  const logBlob = input.startupLogHints.join(' ').toLowerCase();

  let dependencyState: DependencyState = 'UNKNOWN_DEPENDENCY_STATE';
  let dependencyStateReason = 'Dependency state could not be determined.';

  const zeroDeclaredDeps =
    input.manifest.declaredDependencies.length === 0 &&
    input.manifest.declaredDevDependencies.length === 0;

  if (
    !nodeModulesExists &&
    zeroDeclaredDeps &&
    importMissing.length === 0 &&
    missingRuntime.length === 0 &&
    !logBlob.includes('cannot find module')
  ) {
    dependencyState = 'DEPENDENCIES_READY';
    dependencyStateReason =
      'No runtime dependencies declared; import probe passed (node_modules optional).';
  } else if (!nodeModulesExists) {
    dependencyState = 'INSTALL_REQUIRED';
    dependencyStateReason = 'node_modules directory missing in generated workspace.';
  } else if (importMissing.length > 0 || logBlob.includes('cannot find module')) {
    dependencyState = 'MODULE_RESOLUTION_FAILED';
    dependencyStateReason = `Unresolved modules: ${importMissing.slice(0, 6).join(', ') || 'from startup logs'}`;
  } else if (missingRuntime.length > 0) {
    dependencyState = 'DEPENDENCIES_MISSING';
    dependencyStateReason = `Missing runtime dependencies: ${missingRuntime.slice(0, 6).join(', ')}`;
  } else if (missingDev.length > 0 && missingRuntime.length === 0) {
    dependencyState = 'DEPENDENCIES_READY';
    dependencyStateReason = 'Runtime dependencies present; devDependencies partially missing (non-blocking).';
  } else if (lockfileType === 'none' && input.manifest.declaredDependencies.length > 0) {
    dependencyState = nodeModulesExists ? 'DEPENDENCIES_READY' : 'LOCKFILE_MISSING';
    dependencyStateReason = nodeModulesExists
      ? 'Dependencies present without lockfile.'
      : 'No lockfile and node_modules absent.';
  } else {
    dependencyState = 'DEPENDENCIES_READY';
    dependencyStateReason = 'Declared runtime dependencies appear installed and import probe passed.';
  }

  if (dependencyState === 'LOCKFILE_MISSING' && nodeModulesExists && missingRuntime.length === 0) {
    dependencyState = 'DEPENDENCIES_READY';
    dependencyStateReason = 'node_modules present despite missing lockfile.';
  }

  return {
    readOnly: true,
    packageJsonExists: true,
    declaredDependencies: input.manifest.declaredDependencies,
    declaredDevDependencies: input.manifest.declaredDevDependencies,
    lockfileType,
    nodeModulesExists,
    missingRuntimeDependencies: missingRuntime,
    missingDevDependencies: missingDev,
    importGraphMissingModules: importMissing,
    dependencyState,
    dependencyStateReason,
  };
}

export function dependenciesReadyFromScan(scan: DependencyPresenceScan): boolean {
  return scan.dependencyState === 'DEPENDENCIES_READY';
}
