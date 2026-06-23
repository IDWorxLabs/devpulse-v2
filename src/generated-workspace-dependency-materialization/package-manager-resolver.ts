/**
 * Package manager resolver — evidence-backed (Phase 26.78).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type {
  LockfileType,
  PackageManagerEvidenceSource,
  PackageManagerId,
  PackageManagerResolution,
  WorkspacePackageManifest,
} from './generated-workspace-dependency-materialization-types.js';

function parsePackageManagerField(field: string | null): PackageManagerId | null {
  if (!field) return null;
  const lower = field.toLowerCase();
  if (lower.startsWith('pnpm')) return 'pnpm';
  if (lower.startsWith('yarn')) return 'yarn';
  if (lower.startsWith('npm')) return 'npm';
  return null;
}

export function resolvePackageManager(input: {
  workspaceAbs: string;
  manifest: WorkspacePackageManifest;
}): PackageManagerResolution {
  const fromField = parsePackageManagerField(input.manifest.packageManagerField);
  if (fromField) {
    return {
      readOnly: true,
      packageManager: fromField,
      evidenceSource: 'PACKAGE_JSON_PACKAGE_MANAGER_FIELD',
      evidenceDetail: `package.json packageManager="${input.manifest.packageManagerField}"`,
      lockfileType: detectLockfileType(input.workspaceAbs),
      installCommand: installCommandFor(fromField),
    };
  }

  if (existsSync(join(input.workspaceAbs, 'pnpm-lock.yaml'))) {
    return buildResolution('pnpm', 'PNPM_LOCKFILE', 'pnpm-lock.yaml present', 'pnpm-lock.yaml');
  }
  if (existsSync(join(input.workspaceAbs, 'yarn.lock'))) {
    return buildResolution('yarn', 'YARN_LOCKFILE', 'yarn.lock present', 'yarn.lock');
  }
  if (existsSync(join(input.workspaceAbs, 'package-lock.json'))) {
    return buildResolution('npm', 'NPM_LOCKFILE', 'package-lock.json present', 'package-lock.json');
  }

  return buildResolution('npm', 'NPM_FALLBACK', 'No lockfile or packageManager field — npm fallback', 'none');
}

function detectLockfileType(workspaceAbs: string): LockfileType {
  if (existsSync(join(workspaceAbs, 'pnpm-lock.yaml'))) return 'pnpm-lock.yaml';
  if (existsSync(join(workspaceAbs, 'yarn.lock'))) return 'yarn.lock';
  if (existsSync(join(workspaceAbs, 'package-lock.json'))) return 'package-lock.json';
  return 'none';
}

function installCommandFor(pm: PackageManagerId): string {
  switch (pm) {
    case 'pnpm':
      return 'pnpm install --frozen-lockfile';
    case 'yarn':
      return 'yarn install --frozen-lockfile';
    default:
      return 'npm ci';
  }
}

function buildResolution(
  packageManager: PackageManagerId,
  evidenceSource: PackageManagerEvidenceSource,
  evidenceDetail: string,
  lockfileType: LockfileType,
): PackageManagerResolution {
  return {
    readOnly: true,
    packageManager,
    evidenceSource,
    evidenceDetail,
    lockfileType,
    installCommand:
      lockfileType === 'none' && packageManager === 'npm'
        ? 'npm install'
        : installCommandFor(packageManager),
  };
}

export function installCommandForLockfile(pm: PackageManagerId, lockfileType: LockfileType): string {
  if (lockfileType === 'none') {
    return pm === 'pnpm' ? 'pnpm install' : pm === 'yarn' ? 'yarn install' : 'npm install';
  }
  return installCommandFor(pm);
}
