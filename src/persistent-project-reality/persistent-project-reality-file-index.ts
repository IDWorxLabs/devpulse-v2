/**
 * Persistent Project Reality V1 — disk-backed project file index.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type {
  PersistentProjectFileIndex,
  PersistentProjectFileIndexEntry,
} from './persistent-project-reality-types.js';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

function hashFile(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function categorize(relativePath: string): PersistentProjectFileIndexEntry['category'] {
  if (relativePath.startsWith('src/features/') && relativePath.endsWith('Feature.tsx')) return 'feature';
  if (relativePath === 'src/features/registry.ts' || relativePath === 'src/features/routes.ts') return 'registry';
  if (relativePath.startsWith('public/')) return 'public';
  if (/\.(css|scss)$/.test(relativePath)) return 'style';
  if (/^(package\.json|vite\.config\.|tsconfig\.|index\.html)/.test(relativePath)) return 'config';
  if (relativePath.startsWith('.aidev/')) return 'metadata';
  if (relativePath.startsWith('src/')) return 'source';
  return 'source';
}

function walkDir(baseDir: string, prefix: string, entries: PersistentProjectFileIndexEntry[]): void {
  if (!existsSync(baseDir)) return;
  for (const name of readdirSync(baseDir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(baseDir, name);
    const rel = `${prefix}/${name}`.replace(/^\//, '');
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkDir(full, rel, entries);
      continue;
    }
    const content = readFileSync(full, 'utf8');
    entries.push({
      readOnly: true,
      relativePath: rel.replace(/\\/g, '/'),
      category: categorize(rel.replace(/\\/g, '/')),
      lines: content.split('\n').length,
      size: stat.size,
      hash: hashFile(full),
    });
  }
}

export function buildProjectFileIndex(input: {
  projectId: string;
  projectRoot: string;
  sourceRoot: string;
  aidevDir: string;
}): PersistentProjectFileIndex {
  const entries: PersistentProjectFileIndexEntry[] = [];
  walkDir(input.sourceRoot, 'source', entries);
  walkDir(input.aidevDir, '.aidev', entries);

  const fileHashes: Record<string, string> = {};
  for (const entry of entries) {
    fileHashes[entry.relativePath] = entry.hash;
  }

  return {
    readOnly: true,
    projectId: input.projectId,
    sourceRoot: input.sourceRoot.replace(/\\/g, '/'),
    scannedAt: new Date().toISOString(),
    sourceFiles: entries.filter((e) => e.category === 'source'),
    configFiles: entries.filter((e) => e.category === 'config'),
    publicAssets: entries.filter((e) => e.category === 'public'),
    featureModules: entries.filter((e) => e.category === 'feature'),
    routes: entries.filter((e) => e.relativePath.includes('routes')),
    registryFiles: entries.filter((e) => e.category === 'registry'),
    styles: entries.filter((e) => e.category === 'style'),
    metadataFiles: entries.filter((e) => e.category === 'metadata'),
    generatedLines: entries.reduce((sum, entry) => sum + entry.lines, 0),
    fileHashes,
  };
}
