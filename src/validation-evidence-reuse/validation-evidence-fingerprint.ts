/**
 * Validation Evidence Reuse Engine (VERE) V1 — deterministic fingerprinting.
 *
 * Every function here is a pure hash over already-existing inputs (file contents, declared
 * environment variable names, declared dependency files, run inputs). Nothing here reads the
 * clock, generates a random identifier, or depends on the machine's absolute path layout.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';

const EXCLUDED_DIRECTORY_NAMES = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.playwright']);

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Converts any Windows-style or Unix-style path to a canonical forward-slash form. */
export function normalizePath(inputPath: string): string {
  return inputPath.replace(/\\/g, '/').replace(/\/+/g, '/');
}

/** Produces a deterministic, machine-independent path key relative to a project root. */
export function toRepoRelativePath(rootDir: string, targetPath: string): string {
  const normalizedRoot = normalizePath(rootDir);
  const normalizedTarget = normalizePath(targetPath);
  if (!isAbsolute(targetPath)) {
    return normalizedTarget.replace(/^\.\//, '');
  }
  if (normalizedTarget.toLowerCase().startsWith(normalizedRoot.toLowerCase())) {
    const rel = normalizedTarget.slice(normalizedRoot.length).replace(/^\/+/, '');
    return rel.length > 0 ? rel : normalizedTarget;
  }
  return normalizePath(relative(rootDir, targetPath));
}

function stableSortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableSortValue);
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = stableSortValue(record[key]);
        return acc;
      }, {});
  }
  return value;
}

/** Deterministic JSON stringification: identical data always yields identical bytes. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(stableSortValue(value));
}

/** Deterministic signature of a string->string map, independent of insertion order. */
export function stableMapSignature(map: Record<string, string>): string {
  return JSON.stringify(
    Object.keys(map)
      .sort()
      .map((key) => [key, map[key]]),
  );
}

export function computeInputFingerprint(input: unknown): string {
  return sha256Hex(stableStringify(input ?? null));
}

function hashFileContent(absolutePath: string): string {
  try {
    const content = readFileSync(absolutePath, 'utf8');
    return sha256Hex(content);
  } catch {
    return sha256Hex('__MISSING_FILE__');
  }
}

/** Fingerprints a set of files (absolute paths), keyed by their repo-relative normalized path. */
export function fingerprintFiles(rootDir: string, absolutePaths: string[]): Record<string, string> {
  const unique = Array.from(new Set(absolutePaths));
  const map: Record<string, string> = {};
  for (const absolutePath of unique.sort()) {
    const key = toRepoRelativePath(rootDir, absolutePath);
    map[key] = hashFileContent(absolutePath);
  }
  return map;
}

function resolveMaybeRelative(rootDir: string, maybeRelative: string): string {
  return isAbsolute(maybeRelative) ? maybeRelative : join(rootDir, maybeRelative);
}

function listFilesRecursively(directory: string): string[] {
  const results: string[] = [];
  const walk = (current: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(current);
    } catch {
      return;
    }
    for (const entry of entries.sort()) {
      if (EXCLUDED_DIRECTORY_NAMES.has(entry) || entry.startsWith('.aidevengine')) {
        continue;
      }
      const fullPath = join(current, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        results.push(fullPath);
      }
    }
  };
  if (existsSync(directory)) {
    walk(directory);
  }
  return results.sort();
}

export function computeRelevantFileFingerprints(
  rootDir: string,
  relevantFiles: string[],
  relevantDirectories: string[],
): Record<string, string> {
  const explicitFiles = relevantFiles.map((path) => resolveMaybeRelative(rootDir, path));
  const directoryFiles = relevantDirectories.flatMap((dir) => listFilesRecursively(resolveMaybeRelative(rootDir, dir)));
  return fingerprintFiles(rootDir, [...explicitFiles, ...directoryFiles]);
}

export function computeValidatorSourceFingerprint(rootDir: string, validatorSourceFile: string | undefined): string {
  if (!validatorSourceFile) {
    return sha256Hex('__NO_VALIDATOR_SOURCE_DECLARED__');
  }
  const absolutePath = resolveMaybeRelative(rootDir, validatorSourceFile);
  return hashFileContent(absolutePath);
}

export function computeDependencyFingerprint(rootDir: string, dependencyInputs: string[]): string {
  const absolutePaths = dependencyInputs.map((path) => resolveMaybeRelative(rootDir, path));
  const fileFingerprints = fingerprintFiles(rootDir, absolutePaths);
  return sha256Hex(stableMapSignature(fileFingerprints));
}

/**
 * Fingerprints declared environment assumptions by *presence only* — never the raw value.
 * This guarantees secrets and .env values are never embedded in a fingerprint or cache entry,
 * while still invalidating evidence whenever a declared assumption's presence changes.
 */
export function computeEnvironmentFingerprint(environmentInputs: string[]): string {
  const baseline = `platform=${process.platform};nodeMajor=${process.version.split('.')[0] ?? 'unknown'}`;
  const declared = Array.from(new Set(environmentInputs))
    .sort()
    .map((name) => `${name}=${process.env[name] !== undefined ? 'set' : 'unset'}`);
  return sha256Hex([baseline, ...declared].join(';'));
}
