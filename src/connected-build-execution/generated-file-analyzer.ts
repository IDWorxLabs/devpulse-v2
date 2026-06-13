/**
 * Generated File Analyzer — detect real generated project artifacts on disk.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { MAX_SCAN_DEPTH, MAX_SCAN_FILES, WORKSPACE_ROOT_DIR } from './connected-build-execution-registry.js';
import type {
  ArtifactEvidenceLevel,
  GeneratedFileEvidence,
  ObservedFileEvidence,
} from './connected-build-execution-types.js';

function categorizePath(path: string): string {
  const lower = path.toLowerCase();
  if (/src\/screens|src\/app|\.tsx|\.jsx|frontend|ui/i.test(lower)) return 'frontend';
  if (/src\/server|backend|routes/i.test(lower)) return 'backend';
  if (/schema|db|database|migration/i.test(lower)) return 'database';
  if (/auth|login|session/i.test(lower)) return 'auth';
  if (/api\//i.test(lower)) return 'api';
  if (/verification|\.test\.|spec\./i.test(lower)) return 'verification';
  if (/readme|\.md|docs/i.test(lower)) return 'documentation';
  if (/package\.json|tsconfig|config/i.test(lower)) return 'configuration';
  return 'other';
}

function scanDirectory(rootDir: string, relativeDir: string, depth: number, acc: string[]): void {
  if (depth > MAX_SCAN_DEPTH || acc.length >= MAX_SCAN_FILES) return;
  const abs = join(rootDir, relativeDir);
  if (!existsSync(abs)) return;

  let entries: string[];
  try {
    entries = readdirSync(abs);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (acc.length >= MAX_SCAN_FILES) break;
    const rel = join(relativeDir, entry).replace(/\\/g, '/');
    const full = join(rootDir, rel);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        scanDirectory(rootDir, rel, depth + 1, acc);
      }
    } else if (stat.isFile()) {
      acc.push(rel);
    }
  }
}

export function scanObservedFileEvidence(rootDir: string): ObservedFileEvidence {
  const paths: string[] = [];
  const directories: string[] = [];

  const workspaceRoot = join(rootDir, WORKSPACE_ROOT_DIR);
  if (existsSync(workspaceRoot)) {
    directories.push(`${WORKSPACE_ROOT_DIR}`);
    scanDirectory(rootDir, WORKSPACE_ROOT_DIR, 0, paths);
  }

  return { paths, directories };
}

export function mergeObservedEvidence(
  scanned: ObservedFileEvidence,
  injected?: ObservedFileEvidence,
): ObservedFileEvidence {
  if (!injected) return scanned;
  const pathSet = new Set([...scanned.paths, ...injected.paths]);
  const dirSet = new Set([...scanned.directories, ...injected.directories]);
  return {
    paths: [...pathSet],
    directories: [...dirSet],
  };
}

export function analyzeGeneratedFiles(input: {
  rootDir: string;
  expectedPaths: string[];
  observed: ObservedFileEvidence;
}): GeneratedFileEvidence {
  const normalizedExpected = input.expectedPaths.map((p) => p.replace(/\\/g, '/'));
  const observedSet = new Set(input.observed.paths.map((p) => p.replace(/\\/g, '/')));

  const generatedPaths = normalizedExpected.filter((p) => observedSet.has(p));
  const missingPaths = normalizedExpected.filter((p) => !observedSet.has(p));

  const byCategory: Record<string, number> = {};
  for (const path of generatedPaths) {
    const cat = categorizePath(path);
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
  }

  let proofLevel: ArtifactEvidenceLevel = 'NOT_PROVEN';
  if (generatedPaths.length === 0) {
    proofLevel = 'NOT_PROVEN';
  } else if (generatedPaths.length >= normalizedExpected.length && normalizedExpected.length > 0) {
    proofLevel = 'PROVEN';
  } else {
    proofLevel = 'PARTIAL';
  }

  const confidence =
    normalizedExpected.length === 0
      ? 0
      : Math.round((generatedPaths.length / normalizedExpected.length) * 100);

  return {
    readOnly: true,
    proofLevel,
    fileCount: generatedPaths.length,
    artifactCount: generatedPaths.length,
    generatedPaths,
    missingPaths,
    confidence,
    byCategory,
  };
}

export function listOrphanPaths(input: {
  expectedPaths: string[];
  observed: ObservedFileEvidence;
  workspacePrefix: string;
}): string[] {
  const expectedSet = new Set(input.expectedPaths.map((p) => p.replace(/\\/g, '/')));
  return input.observed.paths.filter((p) => {
    const norm = p.replace(/\\/g, '/');
    return norm.startsWith(input.workspacePrefix) && !expectedSet.has(norm);
  });
}

export function relativeFromRoot(rootDir: string, absPath: string): string {
  return relative(rootDir, absPath).replace(/\\/g, '/');
}
