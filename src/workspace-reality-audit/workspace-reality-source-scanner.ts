/**
 * Workspace Reality Audit V1 — source tree scanner.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { WorkspaceRealityDimensionResult } from './workspace-reality-audit-types.js';

const REQUIRED_ROOT_FILES = ['package.json', 'index.html'];
const REQUIRED_DIRS = ['src'];
const EXPECTED_CONFIG = ['vite.config.ts', 'vite.config.js', 'tsconfig.json'];

export function resolveAuditSourceRoot(input: {
  workspaceDir: string;
  projectRootDir: string;
  persistentProjectSourceRoot: string | null;
  promotionStatus: string;
}): string {
  if (input.persistentProjectSourceRoot && input.promotionStatus === 'PASS') {
    const abs = join(input.projectRootDir, input.persistentProjectSourceRoot.replace(/\\/g, '/'));
    if (existsSync(abs)) return abs;
  }
  return input.workspaceDir;
}

export function auditSourceTreeReality(sourceRoot: string): WorkspaceRealityDimensionResult {
  const failureReasons: string[] = [];
  const warnings: string[] = [];
  const evidencePaths: string[] = [];
  let score = 0;

  for (const file of REQUIRED_ROOT_FILES) {
    const path = join(sourceRoot, file);
    if (existsSync(path)) {
      score += 25;
      evidencePaths.push(path.replace(/\\/g, '/'));
    } else {
      failureReasons.push(`${file} missing in source root`);
    }
  }

  for (const dir of REQUIRED_DIRS) {
    const path = join(sourceRoot, dir);
    if (existsSync(path)) {
      score += 25;
      evidencePaths.push(path.replace(/\\/g, '/'));
    } else {
      failureReasons.push(`${dir}/ missing in source root`);
    }
  }

  const hasConfig = EXPECTED_CONFIG.some((file) => existsSync(join(sourceRoot, file)));
  if (hasConfig) {
    score += 25;
    for (const file of EXPECTED_CONFIG) {
      const path = join(sourceRoot, file);
      if (existsSync(path)) evidencePaths.push(path.replace(/\\/g, '/'));
    }
  } else {
    warnings.push('vite/tsconfig config not found');
    score += 10;
  }

  if (!sourceRoot.includes('.generated-builder-workspaces')) {
    score += 25;
    evidencePaths.push(sourceRoot.replace(/\\/g, '/'));
  } else {
    failureReasons.push('audit root is temporary build workspace only');
  }

  const status = failureReasons.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARN' : 'PASS';
  return {
    readOnly: true,
    id: 'sourceTree',
    label: 'Source Tree Reality',
    status,
    score: Math.min(100, score),
    evidencePaths,
    failureReasons,
    warnings,
  };
}
