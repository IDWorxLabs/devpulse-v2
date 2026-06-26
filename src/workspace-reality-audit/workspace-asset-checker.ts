/**
 * Workspace Reality Audit V1 — public asset checker.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { WorkspaceRealityDimensionResult } from './workspace-reality-audit-types.js';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

export function auditAssetReality(sourceRoot: string): {
  dimension: WorkspaceRealityDimensionResult;
  missingAssets: string[];
} {
  const missingAssets: string[] = [];
  const failureReasons: string[] = [];
  const evidencePaths: string[] = [];
  const publicDir = join(sourceRoot, 'public');
  const indexHtml = join(sourceRoot, 'index.html');

  if (existsSync(publicDir)) evidencePaths.push(publicDir.replace(/\\/g, '/'));
  if (existsSync(indexHtml)) {
    const html = readFileSync(indexHtml, 'utf8');
    const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1]!);
    for (const ref of refs) {
      if (ref.startsWith('http') || ref.startsWith('//')) continue;
      const assetPath = join(sourceRoot, ref.replace(/^\//, ''));
      if (!existsSync(assetPath)) {
        missingAssets.push(ref);
        failureReasons.push(`Missing referenced asset: ${ref}`);
      }
    }
  }

  const srcFiles: string[] = [];
  walk(join(sourceRoot, 'src'), srcFiles);
  for (const file of srcFiles) {
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(/['"](\/[^'"]+\.(?:svg|png|jpg|webp|ico))['"]/g)) {
      const ref = match[1]!;
      const assetPath = join(sourceRoot, 'public', ref.replace(/^\/+/, ''));
      if (!existsSync(assetPath) && !existsSync(join(sourceRoot, ref.replace(/^\//, '')))) {
        missingAssets.push(ref);
      }
    }
  }

  const uniqueMissing = [...new Set(missingAssets)];
  const score = uniqueMissing.length === 0 ? 100 : Math.max(0, 100 - uniqueMissing.length * 20);

  return {
    missingAssets: uniqueMissing,
    dimension: {
      readOnly: true,
      id: 'assetReality',
      label: 'Asset Reality',
      status: uniqueMissing.length > 0 ? 'WARN' : 'PASS',
      score,
      evidencePaths,
      failureReasons: uniqueMissing.length > 0 ? [`${uniqueMissing.length} missing asset references`] : [],
      warnings: uniqueMissing,
    },
  };
}

function walk(dir: string, files: string[]): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|html|css)$/.test(name)) files.push(full);
  }
}
