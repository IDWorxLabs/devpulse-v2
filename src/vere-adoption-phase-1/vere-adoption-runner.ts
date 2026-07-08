/**
 * VERE Adoption Phase 1 — runner.
 *
 * Executes (or reuses) one or more adopted validator policies through the general Validation
 * Evidence Reuse Engine. This module contains the only place that actually spawns a validator
 * script; the policy declarations in the registry never do.
 */

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  defineValidationEvidencePolicy,
  explainReuseDecision,
  normalizePath,
  runWithEvidenceReuse,
  stableStringify,
} from '../validation-evidence-reuse/index.js';
import type { ValidationEvidenceEngineOptions, ValidationEvidenceExecutionOutcome, ValidationEvidenceReuseOutcome } from '../validation-evidence-reuse/index.js';
import type { AdoptedValidatorExplanation, AdoptedValidatorPolicy, AdoptedValidatorRunResult } from './vere-adoption-types.js';

const require = createRequire(import.meta.url);

export interface AdoptedValidatorRunOptions {
  rootDir?: string;
}

/**
 * A policy's "signature" for reuse purposes beyond its declared files/directories/dependencies —
 * any change to TTL, evidence kind, expected pass token, or validator kind must invalidate prior
 * evidence even though none of those things are files on disk. Folding this into the run's input
 * (which VERE always fingerprints) achieves that without VERE itself needing to know about
 * adoption-specific policy metadata.
 */
function policySignature(policy: AdoptedValidatorPolicy, enginePolicyTtlMs: number): string {
  return stableStringify({
    ttlMs: enginePolicyTtlMs,
    passToken: policy.passToken,
    validatorKind: policy.validatorKind,
  });
}

function toEnginePolicy(policy: AdoptedValidatorPolicy) {
  return defineValidationEvidencePolicy({
    validatorName: policy.validatorName,
    validatorVersion: policy.validatorVersion,
    reuseSafe: policy.reuseSafe,
    validatorSourceFile: policy.scriptPath,
    relevantFiles: policy.relevantFiles ?? [],
    relevantDirectories: policy.relevantDirectories ?? [],
    dependencyInputs: policy.dependencyInputs,
    environmentInputs: policy.environmentInputs ?? [],
    ttlMs: policy.ttlMs,
    mustRunFreshReason: policy.mustRunFreshReason,
  });
}

function toEngineInput(policy: AdoptedValidatorPolicy, enginePolicyTtlMs: number): unknown {
  return {
    scriptPath: normalizePath(policy.scriptPath),
    policySignature: policySignature(policy, enginePolicyTtlMs),
  };
}

/** Spawns a validator script exactly as every existing regression gate in this repo already does. */
export function spawnValidatorScript(scriptRelativePath: string, expectedPassToken: string, rootDir: string): { ok: boolean; detail: string } {
  const tsxCli = require.resolve('tsx/cli');
  try {
    const output = execFileSync(process.execPath, [tsxCli, scriptRelativePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const ok = output.includes(expectedPassToken);
    return { ok, detail: ok ? 'pass token found' : 'pass token missing from output' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stdout = (err as { stdout?: Buffer | string })?.stdout;
    const stdoutText = stdout ? stdout.toString() : '';
    return { ok: stdoutText.includes(expectedPassToken), detail: stdoutText ? stdoutText.slice(-300) : message.slice(0, 300) };
  }
}

/**
 * Runs (or reuses) one adopted validator. Even when VERE reports a reused, PASSED outcome, this
 * function independently re-checks that the recorded pass token matches the policy's declared
 * expectation before reporting `ok: true` — defense in depth against ever silently trusting a
 * stale or mismatched pass token.
 */
export function runAdoptedValidator(policy: AdoptedValidatorPolicy, options?: AdoptedValidatorRunOptions): AdoptedValidatorRunResult & { rawOutcome: ValidationEvidenceReuseOutcome } {
  const rootDir = options?.rootDir ?? process.cwd();
  const enginePolicy = toEnginePolicy(policy);
  const input = toEngineInput(policy, enginePolicy.ttlMs);

  const outcome = runWithEvidenceReuse(
    enginePolicy,
    input,
    (): ValidationEvidenceExecutionOutcome => {
      const spawned = spawnValidatorScript(policy.scriptPath, policy.passToken, rootDir);
      return {
        status: spawned.ok ? 'PASSED' : 'FAILED',
        passToken: spawned.ok ? policy.passToken : null,
        evidenceSummary: spawned.detail,
      };
    },
    { rootDir },
  );

  const passTokenConfirmed = outcome.status === 'PASSED' && outcome.passToken === policy.passToken;

  return {
    validatorName: policy.validatorName,
    validatorKind: policy.validatorKind,
    ok: passTokenConfirmed,
    reused: outcome.reused,
    invalidationReasons: outcome.invalidationReasons,
    timeSavedMs: outcome.timeSavedMs,
    detail: outcome.evidenceSummary,
    rawOutcome: outcome,
  };
}

export function runAdoptedValidatorBatch(
  policies: AdoptedValidatorPolicy[],
  options?: AdoptedValidatorRunOptions,
): Array<AdoptedValidatorRunResult & { rawOutcome: ValidationEvidenceReuseOutcome }> {
  return policies.map((policy) => runAdoptedValidator(policy, options));
}

/** Explains what would happen for a policy without spawning anything. */
export function explainAdoptedValidator(policy: AdoptedValidatorPolicy, options?: AdoptedValidatorRunOptions): AdoptedValidatorExplanation {
  const rootDir = options?.rootDir ?? process.cwd();
  const enginePolicy = toEnginePolicy(policy);
  const input = toEngineInput(policy, enginePolicy.ttlMs);
  const decision = explainReuseDecision(enginePolicy, input, { rootDir });
  return { validatorName: policy.validatorName, wouldReuse: decision.wouldReuse, reasons: decision.reasons };
}

export function explainAdoptedValidatorBatch(policies: AdoptedValidatorPolicy[], options?: AdoptedValidatorRunOptions): AdoptedValidatorExplanation[] {
  return policies.map((policy) => explainAdoptedValidator(policy, options));
}

export type { ValidationEvidenceEngineOptions };
