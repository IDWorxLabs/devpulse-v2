/**
 * Module resolution probe — bounded checks only (Phase 26.78).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import {
  IMPORT_PROBE_FILES,
  MAX_EXTRACTED_IMPORTS,
  MAX_IMPORT_PROBE_FILES,
} from './generated-workspace-dependency-materialization-registry.js';
import type { ModuleResolutionProbeResult } from './generated-workspace-dependency-materialization-types.js';

const IMPORT_PATTERNS = [
  /import\s+(?:[\w*{}\s,]+)\s+from\s+['"]([^'"]+)['"]/g,
  /import\s+['"]([^'"]+)['"]/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function isRelativeImport(specifier: string): boolean {
  return specifier.startsWith('.') || specifier.startsWith('/');
}

function toPackageName(specifier: string): string {
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return specifier.split('/')[0] ?? specifier;
}

function extractImports(content: string): string[] {
  const found = new Set<string>();
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const spec = match[1];
      if (spec && !isRelativeImport(spec)) {
        found.add(toPackageName(spec));
      }
      if (found.size >= MAX_EXTRACTED_IMPORTS) break;
    }
  }
  return [...found];
}

function probeWithRequire(workspaceAbs: string, moduleName: string): boolean {
  try {
    const req = createRequire(join(workspaceAbs, 'package.json'));
    req.resolve(moduleName);
    return true;
  } catch {
    return false;
  }
}

export function probeModuleResolution(input: {
  workspaceAbs: string;
  skipProbe?: boolean;
}): ModuleResolutionProbeResult {
  if (input.skipProbe) {
    return {
      readOnly: true,
      probedFiles: [],
      extractedImports: [],
      unresolvedModules: [],
      resolvedModules: [],
      probeSucceeded: false,
      probeReason: 'Module probe skipped.',
    };
  }

  const probedFiles: string[] = [];
  const extractedImports = new Set<string>();

  for (const rel of IMPORT_PROBE_FILES) {
    if (probedFiles.length >= MAX_IMPORT_PROBE_FILES) break;
    const abs = join(input.workspaceAbs, rel);
    if (!existsSync(abs)) continue;
    probedFiles.push(rel);
    try {
      const content = readFileSync(abs, 'utf8');
      for (const imp of extractImports(content)) {
        extractedImports.add(imp);
      }
    } catch {
      /* skip unreadable */
    }
  }

  const imports = [...extractedImports].slice(0, MAX_EXTRACTED_IMPORTS);
  const nodeModulesExists = existsSync(join(input.workspaceAbs, 'node_modules'));
  const resolvedModules: string[] = [];
  const unresolvedModules: string[] = [];

  for (const mod of imports) {
    const pkgPath = join(input.workspaceAbs, 'node_modules', mod);
    const exists =
      mod.startsWith('@')
        ? existsSync(pkgPath)
        : existsSync(pkgPath) || (nodeModulesExists && probeWithRequire(input.workspaceAbs, mod));
    if (exists || probeWithRequire(input.workspaceAbs, mod)) {
      resolvedModules.push(mod);
    } else {
      unresolvedModules.push(mod);
    }
  }

  const probeSucceeded = unresolvedModules.length === 0;
  return {
    readOnly: true,
    probedFiles,
    extractedImports: imports,
    unresolvedModules,
    resolvedModules,
    probeSucceeded,
    probeReason: probeSucceeded
      ? `All ${imports.length} probed import(s) resolvable.`
      : `Unresolved: ${unresolvedModules.join(', ') || 'none extracted'}`,
  };
}

export function extractMissingModulesFromLogs(logs: readonly string[]): string[] {
  const missing = new Set<string>();
  for (const line of logs) {
    const match = line.match(/Cannot find module '([^']+)'/i);
    if (match?.[1] && !isRelativeImport(match[1])) {
      missing.add(toPackageName(match[1]));
    }
  }
  return [...missing];
}
