/**
 * Validation Evidence Reuse Engine (VERE) V1 — public entry point.
 *
 * General, engine-wide infrastructure that lets any validator avoid repeating identical
 * deterministic work when its inputs, its own source, its declared relevant files, its declared
 * dependency signature, and its declared environment assumptions have not changed since the last
 * proven-complete run. VERE has no knowledge of any specific validator, product, or application
 * domain — it only understands fingerprints, policies, and evidence records.
 */

export {
  VALIDATION_EVIDENCE_REUSE_V1_CONTRACT,
  DEFAULT_EVIDENCE_KIND,
  DEFAULT_EVIDENCE_TTL_MS,
} from './validation-evidence-types.js';

export type {
  ValidatorResultStatus,
  ValidationEvidenceSafetyLevel,
  ValidationEvidenceFingerprintSet,
  ValidationEvidenceRecord,
  ValidationEvidencePolicy,
  ValidationEvidenceExecutionOutcome,
  ValidationEvidenceReuseOutcome,
  ValidationEvidenceReuseDecision,
  ValidationEvidenceSessionEntry,
  ValidationEvidenceCacheReport,
  ValidationEvidenceEngineOptions,
} from './validation-evidence-types.js';

export {
  sha256Hex,
  normalizePath,
  toRepoRelativePath,
  stableStringify,
  stableMapSignature,
  computeInputFingerprint,
  fingerprintFiles,
  computeRelevantFileFingerprints,
  computeValidatorSourceFingerprint,
  computeDependencyFingerprint,
  computeEnvironmentFingerprint,
} from './validation-evidence-fingerprint.js';

export {
  getEvidenceCacheDir,
  computeEvidenceCacheKey,
  readEvidenceRecord,
  writeEvidenceRecordToDisk,
  deleteEvidenceRecordFromDisk,
  listAllEvidenceRecords,
  invalidateEvidenceOnDisk,
} from './validation-evidence-cache.js';

export {
  defineValidationEvidencePolicy,
  primaryEvidenceKind,
  isFreshRequired,
  freshRequiredReason,
} from './validation-evidence-policy.js';
export type { ValidationEvidencePolicyInput } from './validation-evidence-policy.js';

export {
  computeEvidenceFingerprint,
  readReusableEvidence,
  writeEvidenceRecord,
  invalidateEvidence,
  runWithEvidenceReuse,
  explainReuseDecision,
} from './validation-evidence-reuse-engine.js';

export {
  buildValidationEvidenceCacheReport,
  renderValidationEvidenceCacheReportText,
} from './validation-evidence-report.js';

export {
  runChildProcessValidatorWithEvidenceReuse,
} from './validation-evidence-validator.js';
export type {
  ChildProcessValidatorEvidencePolicy,
  ChildProcessValidatorExecutionResult,
  ChildProcessValidatorReuseResult,
} from './validation-evidence-validator.js';
