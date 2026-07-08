/**
 * VERE Adoption Phase 2 — runner.
 *
 * Executes (or reuses) one or more Phase 2 adopted validator policies through the general
 * Validation Evidence Reuse Engine. This module contains the only place that actually spawns a
 * validator script; the policy declarations in the registry never do.
 *
 * For CHILD_GRAPH_AGGREGATOR_UNSAFE policies marked `reuseSafe: true`, the engine's fingerprinted
 * dependency surface is the *union* of the aggregator's own declared files/directories and every
 * declared child's files/directories — so a change anywhere in any child's dependency surface
 * invalidates the aggregate's cached evidence, even though the runner never spawns those children
 * independently (the aggregator's own script already does that internally).
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
import type { Phase2AdoptedValidatorExplanation, Phase2AdoptedValidatorPolicy, Phase2AdoptedValidatorRunResult } from './vere-adoption-phase-2-types.js';

const require = createRequire(import.meta.url);

export interface Phase2AdoptedValidatorRunOptions {
  rootDir?: string;
}

/**
 * A policy's "signature" for reuse purposes beyond its declared files/directories/dependencies —
 * any change to TTL, risk class, expected pass token, or (for aggregators) the exact set of
 * declared children/pass-tokens must invalidate prior evidence even though those things are not
 * files on disk. Folding this into the run's input (which VERE always fingerprints) achieves that
 * without VERE itself needing to know about adoption-specific policy metadata.
 */
function policySignature(policy: Phase2AdoptedValidatorPolicy, enginePolicyTtlMs: number): string {
  return stableStringify({
    ttlMs: enginePolicyTtlMs,
    passToken: policy.passToken,
    riskClass: policy.riskClass,
    childGraph: (policy.childGraph ?? []).map((child) => ({ validatorName: child.validatorName, passToken: child.passToken })),
  });
}

function mergedRelevantFiles(policy: Phase2AdoptedValidatorPolicy): string[] {
  const own = policy.relevantFiles ?? [];
  const fromChildren = (policy.childGraph ?? []).flatMap((child) => child.relevantFiles ?? []);
  return Array.from(new Set([...own, ...fromChildren]));
}

function mergedRelevantDirectories(policy: Phase2AdoptedValidatorPolicy): string[] {
  const own = policy.relevantDirectories ?? [];
  const fromChildren = (policy.childGraph ?? []).flatMap((child) => child.relevantDirectories ?? []);
  return Array.from(new Set([...own, ...fromChildren]));
}

function toEnginePolicy(policy: Phase2AdoptedValidatorPolicy) {
  return defineValidationEvidencePolicy({
    validatorName: policy.validatorName,
    validatorVersion: policy.validatorVersion,
    reuseSafe: policy.reuseSafe,
    validatorSourceFile: policy.scriptPath,
    relevantFiles: mergedRelevantFiles(policy),
    relevantDirectories: mergedRelevantDirectories(policy),
    dependencyInputs: policy.dependencyInputs,
    environmentInputs: policy.environmentInputs ?? [],
    ttlMs: policy.ttlMs,
    mustRunFreshReason: policy.mustRunFreshReason,
  });
}

function toEngineInput(policy: Phase2AdoptedValidatorPolicy, enginePolicyTtlMs: number): unknown {
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
 * A genuine first-time cache miss (no prior evidence has ever been recorded) is reported by VERE
 * as `invalidationReasons: ['NO_PRIOR_EVIDENCE']` — this is not an "invalidation" of anything that
 * previously existed, so it must be classified as a plain fresh execution, not INVALIDATED.
 */
function isGenuineFirstRun(invalidationReasons: string[]): boolean {
  return invalidationReasons.length === 0 || (invalidationReasons.length === 1 && invalidationReasons[0] === 'NO_PRIOR_EVIDENCE');
}

function classifyOutcomeKind(reused: boolean, invalidationReasons: string[], reuseSafe: boolean): 'EXECUTED' | 'REUSED' | 'INVALIDATED' | 'SKIPPED_UNSAFE' {
  if (reused) return 'REUSED';
  if (!reuseSafe) return 'SKIPPED_UNSAFE';
  return isGenuineFirstRun(invalidationReasons) ? 'EXECUTED' : 'INVALIDATED';
}

/**
 * Runs (or reuses) one adopted validator. Even when VERE reports a reused, PASSED outcome, this
 * function independently re-checks that the recorded pass token matches the policy's declared
 * expectation before reporting `ok: true` — defense in depth against ever silently trusting a
 * stale or mismatched pass token.
 */
export function runPhase2AdoptedValidator(
  policy: Phase2AdoptedValidatorPolicy,
  options?: Phase2AdoptedValidatorRunOptions,
): Phase2AdoptedValidatorRunResult & { rawOutcome: ValidationEvidenceReuseOutcome } {
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
    riskClass: policy.riskClass,
    ok: passTokenConfirmed,
    outcomeKind: classifyOutcomeKind(outcome.reused, outcome.invalidationReasons, policy.reuseSafe),
    reused: outcome.reused,
    invalidationReasons: outcome.invalidationReasons,
    timeSavedMs: outcome.timeSavedMs,
    detail: outcome.evidenceSummary,
    rawOutcome: outcome,
  };
}

export function runPhase2AdoptedValidatorBatch(
  policies: Phase2AdoptedValidatorPolicy[],
  options?: Phase2AdoptedValidatorRunOptions,
): Array<Phase2AdoptedValidatorRunResult & { rawOutcome: ValidationEvidenceReuseOutcome }> {
  return policies.map((policy) => runPhase2AdoptedValidator(policy, options));
}

/** Explains what would happen for a policy without spawning anything. */
export function explainPhase2AdoptedValidator(policy: Phase2AdoptedValidatorPolicy, options?: Phase2AdoptedValidatorRunOptions): Phase2AdoptedValidatorExplanation {
  const rootDir = options?.rootDir ?? process.cwd();
  const enginePolicy = toEnginePolicy(policy);
  const input = toEngineInput(policy, enginePolicy.ttlMs);
  const decision = explainReuseDecision(enginePolicy, input, { rootDir });
  return { validatorName: policy.validatorName, riskClass: policy.riskClass, wouldReuse: decision.wouldReuse, reasons: decision.reasons };
}

export function explainPhase2AdoptedValidatorBatch(
  policies: Phase2AdoptedValidatorPolicy[],
  options?: Phase2AdoptedValidatorRunOptions,
): Phase2AdoptedValidatorExplanation[] {
  return policies.map((policy) => explainPhase2AdoptedValidator(policy, options));
}

export type { ValidationEvidenceEngineOptions };
