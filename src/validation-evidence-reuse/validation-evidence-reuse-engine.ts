/**
 * Validation Evidence Reuse Engine (VERE) V1 — reuse decision engine.
 *
 * This module is the only place that decides whether previously recorded evidence may stand in
 * for actually re-executing a validator. The decision is always conservative: any fingerprint
 * mismatch, any incomplete/failed/interrupted prior result, any expired TTL, or any
 * fresh-required policy causes VERE to run fresh. Nothing is ever skipped — the validator either
 * runs, or a byte-for-byte-provable-identical prior run is reused in its place.
 */

import {
  computeDependencyFingerprint,
  computeEnvironmentFingerprint,
  computeInputFingerprint,
  computeRelevantFileFingerprints,
  computeValidatorSourceFingerprint,
  stableMapSignature,
} from './validation-evidence-fingerprint.js';
import { computeEvidenceCacheKey, invalidateEvidenceOnDisk, readEvidenceRecord, writeEvidenceRecordToDisk } from './validation-evidence-cache.js';
import { freshRequiredReason, isFreshRequired, primaryEvidenceKind } from './validation-evidence-policy.js';
import type {
  ValidationEvidenceEngineOptions,
  ValidationEvidenceExecutionOutcome,
  ValidationEvidenceFingerprintSet,
  ValidationEvidencePolicy,
  ValidationEvidenceRecord,
  ValidationEvidenceReuseDecision,
  ValidationEvidenceReuseOutcome,
} from './validation-evidence-types.js';

function resolveRootDir(options?: ValidationEvidenceEngineOptions): string {
  return options?.rootDir ?? process.cwd();
}

export function computeEvidenceFingerprint(
  policy: ValidationEvidencePolicy,
  input: unknown,
  rootDir: string,
): ValidationEvidenceFingerprintSet {
  return {
    inputFingerprint: computeInputFingerprint(input),
    relevantFileFingerprints: computeRelevantFileFingerprints(rootDir, policy.relevantFiles, policy.relevantDirectories),
    validatorSourceFingerprint: computeValidatorSourceFingerprint(rootDir, policy.validatorSourceFile),
    dependencyFingerprint: computeDependencyFingerprint(rootDir, policy.dependencyInputs),
    environmentFingerprint: computeEnvironmentFingerprint(policy.environmentInputs),
  };
}

function matchFingerprints(
  record: ValidationEvidenceRecord,
  fingerprints: ValidationEvidenceFingerprintSet,
): string[] {
  const reasons: string[] = [];
  if (record.inputFingerprint !== fingerprints.inputFingerprint) {
    reasons.push('INPUT_CHANGED');
  }
  if (stableMapSignature(record.relevantFileFingerprints) !== stableMapSignature(fingerprints.relevantFileFingerprints)) {
    reasons.push('RELEVANT_FILES_CHANGED');
  }
  if (record.validatorSourceFingerprint !== fingerprints.validatorSourceFingerprint) {
    reasons.push('VALIDATOR_SOURCE_CHANGED');
  }
  if (record.dependencyFingerprint !== fingerprints.dependencyFingerprint) {
    reasons.push('DEPENDENCY_SIGNATURE_CHANGED');
  }
  if (record.environmentFingerprint !== fingerprints.environmentFingerprint) {
    reasons.push('ENVIRONMENT_ASSUMPTIONS_CHANGED');
  }
  return reasons;
}

/**
 * Attempts to find previously recorded evidence that can stand in for a fresh run. Returns the
 * record only when every conservative condition is satisfied; otherwise returns null plus the
 * specific reasons reuse was refused.
 */
export function readReusableEvidence(
  policy: ValidationEvidencePolicy,
  fingerprints: ValidationEvidenceFingerprintSet,
  options?: ValidationEvidenceEngineOptions,
): { record: ValidationEvidenceRecord | null; invalidationReasons: string[] } {
  const rootDir = resolveRootDir(options);
  const cacheKey = computeEvidenceCacheKey(policy.validatorName, policy.validatorVersion, primaryEvidenceKind(policy));
  const existing = readEvidenceRecord(rootDir, cacheKey);
  if (!existing) {
    return { record: null, invalidationReasons: ['NO_PRIOR_EVIDENCE'] };
  }
  if (existing.validatorName !== policy.validatorName) {
    return { record: null, invalidationReasons: ['VALIDATOR_NAME_MISMATCH'] };
  }
  if (existing.validatorVersion !== policy.validatorVersion) {
    return { record: null, invalidationReasons: ['VALIDATOR_VERSION_CHANGED'] };
  }
  if (existing.safetyLevel !== 'REUSE_SAFE') {
    return { record: null, invalidationReasons: ['PRIOR_EVIDENCE_NOT_REUSE_SAFE'] };
  }
  const allowFailed = Boolean(options?.allowFailedForDiagnostics ?? policy.allowFailedEvidenceForDiagnostics);
  if (existing.resultStatus !== 'PASSED' && !(allowFailed && existing.resultStatus === 'FAILED')) {
    return { record: null, invalidationReasons: [`PREVIOUS_RESULT_STATUS_${existing.resultStatus}`] };
  }
  if (Date.now() > existing.expiresAt) {
    return { record: null, invalidationReasons: ['TTL_EXPIRED'] };
  }
  const mismatchReasons = matchFingerprints(existing, fingerprints);
  if (mismatchReasons.length > 0) {
    return { record: null, invalidationReasons: mismatchReasons };
  }
  return { record: existing, invalidationReasons: [] };
}

export function writeEvidenceRecord(
  policy: ValidationEvidencePolicy,
  fingerprints: ValidationEvidenceFingerprintSet,
  outcome: ValidationEvidenceExecutionOutcome,
  durationMs: number,
  options?: ValidationEvidenceEngineOptions,
): ValidationEvidenceRecord {
  const rootDir = resolveRootDir(options);
  const now = Date.now();
  const record: ValidationEvidenceRecord = {
    validatorName: policy.validatorName,
    validatorVersion: policy.validatorVersion,
    evidenceKind: primaryEvidenceKind(policy),
    ...fingerprints,
    createdAt: now,
    ttlMs: policy.ttlMs,
    expiresAt: now + policy.ttlMs,
    resultStatus: outcome.status,
    passToken: outcome.passToken ?? null,
    evidenceSummary: outcome.evidenceSummary,
    reusedFromCache: false,
    invalidationReasons: [],
    safetyLevel: isFreshRequired(policy) ? 'FRESH_REQUIRED' : 'REUSE_SAFE',
    durationMs,
  };
  const cacheKey = computeEvidenceCacheKey(record.validatorName, record.validatorVersion, record.evidenceKind);
  writeEvidenceRecordToDisk(rootDir, cacheKey, record);
  return record;
}

export function invalidateEvidence(validatorName: string, evidenceKind?: string, options?: ValidationEvidenceEngineOptions): number {
  return invalidateEvidenceOnDisk(resolveRootDir(options), validatorName, evidenceKind);
}

/**
 * Runs `execute` fresh, or reuses matching prior evidence — never both, and never neither.
 * `execute` is only invoked when reuse is refused, so it is safe to pass the validator's real,
 * expensive work directly.
 */
export function runWithEvidenceReuse(
  policy: ValidationEvidencePolicy,
  input: unknown,
  execute: () => ValidationEvidenceExecutionOutcome,
  options?: ValidationEvidenceEngineOptions,
): ValidationEvidenceReuseOutcome {
  const rootDir = resolveRootDir(options);

  if (isFreshRequired(policy)) {
    const startedAt = Date.now();
    const outcome = execute();
    const durationMs = Date.now() - startedAt;
    const fingerprints = computeEvidenceFingerprint(policy, input, rootDir);
    const record = writeEvidenceRecord(policy, fingerprints, outcome, durationMs, options);
    return {
      reused: false,
      status: outcome.status,
      passToken: outcome.passToken ?? null,
      evidenceSummary: outcome.evidenceSummary,
      invalidationReasons: [freshRequiredReason(policy)],
      record,
      timeSavedMs: 0,
    };
  }

  const fingerprints = computeEvidenceFingerprint(policy, input, rootDir);
  const { record: reusable, invalidationReasons } = readReusableEvidence(policy, fingerprints, options);
  if (reusable) {
    return {
      reused: true,
      status: reusable.resultStatus,
      passToken: reusable.passToken,
      evidenceSummary: reusable.evidenceSummary,
      invalidationReasons: [],
      record: { ...reusable, reusedFromCache: true },
      timeSavedMs: reusable.durationMs ?? 0,
    };
  }

  const startedAt = Date.now();
  const outcome = execute();
  const durationMs = Date.now() - startedAt;
  const record = writeEvidenceRecord(policy, fingerprints, outcome, durationMs, options);
  return {
    reused: false,
    status: outcome.status,
    passToken: outcome.passToken ?? null,
    evidenceSummary: outcome.evidenceSummary,
    invalidationReasons,
    record,
    timeSavedMs: 0,
  };
}

/** Explains what would happen for this policy/input without executing or writing anything. */
export function explainReuseDecision(
  policy: ValidationEvidencePolicy,
  input: unknown,
  options?: ValidationEvidenceEngineOptions,
): ValidationEvidenceReuseDecision {
  const rootDir = resolveRootDir(options);
  if (isFreshRequired(policy)) {
    return { wouldReuse: false, reasons: [freshRequiredReason(policy)] };
  }
  const fingerprints = computeEvidenceFingerprint(policy, input, rootDir);
  const { record, invalidationReasons } = readReusableEvidence(policy, fingerprints, options);
  return { wouldReuse: record !== null, reasons: record ? [] : invalidationReasons };
}
