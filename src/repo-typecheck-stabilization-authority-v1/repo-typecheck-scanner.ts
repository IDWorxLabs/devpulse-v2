/**
 * REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — diagnostic collection and normalization.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RepoTypecheckDiagnostic, RepoTypecheckScanResult } from './repo-typecheck-types.js';
import { classifyTypeScriptDiagnostic } from './repo-typecheck-classifier.js';

const TSC_LINE_PATTERN = /^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$/;
const MAX_DIAGNOSTICS = 256;

export function discoverRepositoryTypecheckCommand(projectRootDir: string): string {
  const pkgPath = join(projectRootDir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
      if (pkg.scripts?.typecheck) {
        return 'npm run typecheck';
      }
      if (pkg.scripts?.['type-check']) {
        return 'npm run type-check';
      }
    } catch {
      // Fall through to tsc.
    }
  }
  const tsconfigPath = join(projectRootDir, 'tsconfig.json');
  if (existsSync(tsconfigPath)) {
    return 'npx tsc --noEmit -p tsconfig.json';
  }
  return 'npx tsc --noEmit';
}

export function parseTypeScriptCompilerOutput(output: string): Omit<RepoTypecheckScanResult, 'command' | 'passed' | 'exitCode' | 'durationMs'> {
  const diagnostics: RepoTypecheckDiagnostic[] = [];
  let errorCount = 0;
  let warningCount = 0;

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(TSC_LINE_PATTERN);
    if (match) {
      errorCount += 1;
      if (diagnostics.length < MAX_DIAGNOSTICS) {
        const code = match[4]!;
        const message = match[5]!;
        const diagnostic: RepoTypecheckDiagnostic = {
          readOnly: true,
          code,
          file: normalizeDiagnosticPath(match[1]!),
          line: Number(match[2]),
          column: Number(match[3]),
          message,
          severity: 'ERROR',
          failureClass: classifyTypeScriptDiagnostic(code, message),
        };
        diagnostics.push(diagnostic);
      }
      continue;
    }

    if (/error TS\d+:/i.test(line)) {
      errorCount += 1;
      if (diagnostics.length < MAX_DIAGNOSTICS) {
        const codeMatch = line.match(/TS\d+/);
        const code = codeMatch?.[0] ?? 'TS_UNKNOWN';
        diagnostics.push({
          readOnly: true,
          code,
          file: 'unknown',
          line: 0,
          column: 0,
          message: line.slice(0, 240),
          severity: 'ERROR',
          failureClass: classifyTypeScriptDiagnostic(code, line),
        });
      }
      continue;
    }

    if (/warning TS\d+:/i.test(line)) {
      warningCount += 1;
    }
  }

  return {
    readOnly: true,
    errorCount,
    warningCount,
    diagnostics,
    rawOutput: output,
  };
}

function normalizeDiagnosticPath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function runRepositoryTypecheckScan(input: {
  projectRootDir: string;
  command?: string;
}): RepoTypecheckScanResult {
  const command = input.command ?? discoverRepositoryTypecheckCommand(input.projectRootDir);
  const startMs = Date.now();
  const result = spawnSync(command, {
    cwd: input.projectRootDir,
    encoding: 'utf8',
    shell: true,
    maxBuffer: 4_000_000,
  });
  const durationMs = Date.now() - startMs;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const combined = `${stdout}\n${stderr}`.trim();
  const parsed = parseTypeScriptCompilerOutput(combined);
  const exitCode = result.status ?? 1;

  return {
    readOnly: true,
    command,
    passed: exitCode === 0 && parsed.errorCount === 0,
    exitCode,
    durationMs,
    ...parsed,
  };
}
