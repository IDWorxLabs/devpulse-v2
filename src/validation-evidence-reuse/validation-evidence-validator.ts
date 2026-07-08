/**
 * Validation Evidence Reuse Engine (VERE) V1 — validator opt-in helper.
 *
 * Many validators across this repository run *other* validator scripts as child processes and
 * assert that a pass token appears in their output (a "regression gate"). That pattern is
 * completely generic — it never depends on which validator is being run — which makes it the
 * natural place to offer a drop-in reuse wrapper: any validator script can opt an existing
 * `execFileSync(...)` call into evidence reuse by wrapping it with the function below, without
 * writing any custom caching logic itself.
 */

import { normalizePath } from './validation-evidence-fingerprint.js';
import { defineValidationEvidencePolicy } from './validation-evidence-policy.js';
import { runWithEvidenceReuse } from './validation-evidence-reuse-engine.js';
import type { ValidationEvidenceEngineOptions, ValidationEvidenceReuseOutcome } from './validation-evidence-types.js';

export interface ChildProcessValidatorEvidencePolicy {
  /** Stable identity for the wrapped validator, e.g. its script path. */
  validatorName: string;
  /** Bump when the wrapped validator's *contract* changes in a way old evidence can't reflect. */
  validatorVersion: string;
  /** The validator script's own source file — changes to it always invalidate its evidence. */
  scriptPath: string;
  /** Additional files this validator's outcome depends on (besides its own source). */
  relevantFiles?: string[];
  /** Directories this validator's outcome depends on (recursively fingerprinted). */
  relevantDirectories?: string[];
  dependencyInputs?: string[];
  environmentInputs?: string[];
  ttlMs?: number;
  /** Defaults to true — this wrapper exists specifically to let validators opt in. */
  reuseSafe?: boolean;
  mustRunFreshReason?: string;
  rootDir?: string;
}

export interface ChildProcessValidatorExecutionResult {
  ok: boolean;
  detail: string;
  passToken: string;
}

export interface ChildProcessValidatorReuseResult {
  ok: boolean;
  detail: string;
  reused: boolean;
  invalidationReasons: string[];
  timeSavedMs: number;
}

/**
 * Runs (or reuses) a previously-run validator script's outcome.
 *
 * `execute` should perform the actual `execFileSync`/spawn call and interpret its output exactly
 * as the caller normally would — this wrapper only decides *whether* to call `execute` at all.
 */
export function runChildProcessValidatorWithEvidenceReuse(
  policy: ChildProcessValidatorEvidencePolicy,
  execute: () => ChildProcessValidatorExecutionResult,
): ChildProcessValidatorReuseResult {
  const rootDir = policy.rootDir ?? process.cwd();
  const enginePolicy = defineValidationEvidencePolicy({
    validatorName: policy.validatorName,
    validatorVersion: policy.validatorVersion,
    reuseSafe: policy.reuseSafe ?? true,
    validatorSourceFile: policy.scriptPath,
    relevantFiles: policy.relevantFiles ?? [],
    relevantDirectories: policy.relevantDirectories ?? [],
    dependencyInputs: policy.dependencyInputs,
    environmentInputs: policy.environmentInputs ?? [],
    ttlMs: policy.ttlMs,
    mustRunFreshReason: policy.mustRunFreshReason,
  });

  const engineOptions: ValidationEvidenceEngineOptions = { rootDir };
  const input = { scriptPath: normalizePath(policy.scriptPath) };

  const outcome: ValidationEvidenceReuseOutcome = runWithEvidenceReuse(
    enginePolicy,
    input,
    () => {
      const result = execute();
      return {
        status: result.ok ? 'PASSED' : 'FAILED',
        passToken: result.ok ? result.passToken : null,
        evidenceSummary: result.detail,
      };
    },
    engineOptions,
  );

  return {
    ok: outcome.status === 'PASSED',
    detail: outcome.evidenceSummary,
    reused: outcome.reused,
    invalidationReasons: outcome.invalidationReasons,
    timeSavedMs: outcome.timeSavedMs,
  };
}
