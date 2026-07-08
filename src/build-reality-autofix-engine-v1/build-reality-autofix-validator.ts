/**
 * BUILD_REALITY_AUTOFIX_ENGINE_V1 — validation rerun helpers.
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BuildRealityAutofixValidationResult } from './build-reality-autofix-types.js';
import { buildEvidenceFromValidationResult } from './build-reality-autofix-classifier.js';

export function runWorkspaceTypeScriptBuild(workspaceDir: string): {
  passed: boolean;
  output: string;
} {
  if (!existsSync(join(workspaceDir, 'package.json'))) {
    return { passed: true, output: 'No package.json — skipping npm build' };
  }
  try {
    execSync('npm run build', {
      cwd: workspaceDir,
      stdio: 'pipe',
      timeout: 120_000,
      encoding: 'utf8',
    });
    return { passed: true, output: 'npm run build passed' };
  } catch (error) {
    const output =
      typeof error === 'object' &&
      error !== null &&
      'stdout' in error &&
      'stderr' in error
        ? `${String((error as { stdout?: string }).stdout ?? '')}\n${String((error as { stderr?: string }).stderr ?? '')}`
        : error instanceof Error
          ? error.message
          : String(error);
    return { passed: false, output };
  }
}

export function createTypeScriptBuildValidationRunner(input: {
  workspaceDir: string;
  rawPrompt?: string | null;
}): () => Promise<BuildRealityAutofixValidationResult> {
  return async () => {
    const build = runWorkspaceTypeScriptBuild(input.workspaceDir);
    const evidence = buildEvidenceFromValidationResult({
      workspaceDir: input.workspaceDir,
      rawPrompt: input.rawPrompt ?? null,
      typescriptOutput: build.output,
      detail: build.passed ? 'TypeScript build passed' : build.output.slice(0, 240),
      passed: build.passed,
    });
    return {
      readOnly: true,
      passed: build.passed,
      detail: build.passed ? 'TypeScript build passed' : build.output.slice(0, 240),
      evidence,
    };
  };
}

export function createCustomValidationRunner(input: {
  workspaceDir: string;
  rawPrompt?: string | null;
  validate: (workspaceDir: string) => { passed: boolean; detail: string; typescriptOutput?: string | null; domFailureDetail?: string | null; previewAuthorityDetail?: string | null; playwrightDetail?: string | null; validatorHarnessDetail?: string | null };
}): () => Promise<BuildRealityAutofixValidationResult> {
  return async () => {
    const result = input.validate(input.workspaceDir);
    const evidence = buildEvidenceFromValidationResult({
      workspaceDir: input.workspaceDir,
      rawPrompt: input.rawPrompt ?? null,
      typescriptOutput: result.typescriptOutput ?? null,
      domFailureDetail: result.domFailureDetail ?? null,
      previewAuthorityDetail: result.previewAuthorityDetail ?? null,
      playwrightDetail: result.playwrightDetail ?? null,
      validatorHarnessDetail: result.validatorHarnessDetail ?? null,
      detail: result.detail,
      passed: result.passed,
    });
    return {
      readOnly: true,
      passed: result.passed,
      detail: result.detail,
      evidence,
    };
  };
}
