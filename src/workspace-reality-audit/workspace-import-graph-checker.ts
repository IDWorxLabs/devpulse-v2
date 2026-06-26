/**
 * Workspace Reality Audit V1 — relative import resolution checker.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { WorkspaceRealityDimensionResult } from './workspace-reality-audit-types.js';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.json'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

function walkSourceFiles(dir: string, files: string[]): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkSourceFiles(full, files);
      continue;
    }
    if (/\.(ts|tsx|js|jsx)$/.test(name)) files.push(full);
  }
}

function resolveImport(fromFile: string, spec: string, sourceRoot: string): string | null {
  if (!spec.startsWith('.')) return null;
  const base = dirname(fromFile);
  const candidates = [
    resolve(base, spec),
    `${resolve(base, spec)}.ts`,
    `${resolve(base, spec)}.tsx`,
    `${resolve(base, spec)}.js`,
    `${resolve(base, spec)}.jsx`,
    join(resolve(base, spec), 'index.ts'),
    join(resolve(base, spec), 'index.tsx'),
  ];
  for (const candidate of candidates) {
    if (candidate.startsWith(sourceRoot) && existsSync(candidate)) return candidate;
  }
  return null;
}

export function auditImportGraphReality(sourceRoot: string): {
  dimension: WorkspaceRealityDimensionResult;
  missingImports: string[];
} {
  const missingImports: string[] = [];
  const failureReasons: string[] = [];
  const evidencePaths: string[] = [];
  const srcDir = join(sourceRoot, 'src');
  const files: string[] = [];
  walkSourceFiles(srcDir, files);

  const importPatterns = [
    /from\s+['"](\.[^'"]+)['"]/g,
    /import\s+['"](\.[^'"]+)['"]/g,
  ];
  let resolved = 0;
  let checked = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const importPattern of importPatterns) {
      importPattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = importPattern.exec(content)) !== null) {
        checked += 1;
        const spec = match[1]!;
        const resolvedPath = resolveImport(file, spec, sourceRoot);
        if (resolvedPath) {
          resolved += 1;
        } else {
          const rel = `${file.replace(sourceRoot, '').replace(/\\/g, '/')} -> ${spec}`;
          missingImports.push(rel);
          failureReasons.push(`Missing import: ${rel}`);
        }
        if (spec.includes('.generated-builder-workspaces')) {
          missingImports.push(`${file}: temp workspace import ${spec}`);
          failureReasons.push(`Import points to temporary workspace: ${spec}`);
        }
      }
    }
  }

  const score = checked === 0 ? 100 : Math.round((resolved / checked) * 100);
  evidencePaths.push(srcDir.replace(/\\/g, '/'));

  return {
    missingImports,
    dimension: {
      readOnly: true,
      id: 'importGraph',
      label: 'Import Graph Reality',
      status: missingImports.length > 0 ? 'FAIL' : 'PASS',
      score,
      evidencePaths,
      failureReasons,
      warnings: [],
    },
  };
}
