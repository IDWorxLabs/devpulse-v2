/**
 * Repository Typecheck Reality — live baseline execution (Phase 26.72).
 * Runs npm run typecheck and records bounded command evidence.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MAX_TYPECHECK_OUTPUT_SUMMARY_CHARS,
  NPM_TYPECHECK_SCRIPT,
  TYPECHECK_COMMAND,
} from './repository-typecheck-reality-bounds.js';
import { assessRepositoryTypecheckReality } from './repository-typecheck-reality-authority.js';
import type { RepositoryTypecheckAssessment } from './repository-typecheck-reality-types.js';
import { parseBoundedTypecheckOutput } from './repository-typecheck-reality-validator.js';

export interface RunRepositoryTypecheckBaselineInput {
  projectRootDir?: string;
  command?: string;
  skipExecution?: boolean;
}

export interface RepositoryTypecheckBaselineResult {
  readOnly: true;
  assessment: RepositoryTypecheckAssessment;
}

function summarizeOutput(text: string, maxChars = MAX_TYPECHECK_OUTPUT_SUMMARY_CHARS): string {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}\n… [truncated ${normalized.length - maxChars} chars]`;
}

function resolveTypecheckCommand(projectRootDir: string, override?: string): string {
  if (override) return override;
  const pkgPath = join(projectRootDir, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
    if (pkg.scripts?.[NPM_TYPECHECK_SCRIPT]) {
      return `npm run ${NPM_TYPECHECK_SCRIPT}`;
    }
  }
  return TYPECHECK_COMMAND;
}

export function runRepositoryTypecheckBaseline(
  input: RunRepositoryTypecheckBaselineInput = {},
): RepositoryTypecheckBaselineResult {
  const projectRootDir = input.projectRootDir ?? process.cwd();
  const command = resolveTypecheckCommand(projectRootDir, input.command);
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  if (input.skipExecution) {
    const assessment = assessRepositoryTypecheckReality({ source: 'NOT_RUN' });
    return { readOnly: true, assessment };
  }

  const result = spawnSync(command, {
    cwd: projectRootDir,
    encoding: 'utf8',
    shell: true,
    maxBuffer: 2_000_000,
  });

  const completedAt = new Date().toISOString();
  const durationMs = Date.now() - startMs;
  const exitCode = result.status ?? 1;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const combinedOutput = `${stdout}\n${stderr}`.trim();
  const parsed = parseBoundedTypecheckOutput(combinedOutput);

  const assessment = assessRepositoryTypecheckReality({
    source: 'BASELINE',
    ...parsed,
    checkedCommand: command,
    checkedAt: Date.parse(completedAt),
    exitCode,
    durationMs,
    startedAt,
    completedAt,
    generatedAt: completedAt,
    stdoutSummary: summarizeOutput(stdout),
    stderrSummary: summarizeOutput(stderr),
  });

  return { readOnly: true, assessment };
}
