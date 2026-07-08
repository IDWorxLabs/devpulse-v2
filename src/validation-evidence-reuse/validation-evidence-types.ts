/**
 * Validation Evidence Reuse Engine (VERE) V1 — shared types.
 *
 * VERE lets any validator declare that it is safe to skip re-running expensive, deterministic
 * work when nothing that could change the outcome has changed: its own inputs, its own source
 * code, the source files it inspects, its declared dependency signature, and its declared
 * environment assumptions. This module contains no knowledge of any particular validator,
 * product, or application domain — it only understands "evidence" and "fingerprints".
 */

export const VALIDATION_EVIDENCE_REUSE_V1_CONTRACT = 'validation-evidence-reuse-v1' as const;

/** Default evidence kind used when a policy does not declare one explicitly. */
export const DEFAULT_EVIDENCE_KIND = 'VALIDATOR_RUN';

/** Default time-to-live for a piece of reusable evidence. */
export const DEFAULT_EVIDENCE_TTL_MS = 15 * 60 * 1000;

/** Outcome status of the underlying deterministic work an evidence record describes. */
export type ValidatorResultStatus = 'PASSED' | 'FAILED' | 'PARTIAL' | 'INTERRUPTED';

/**
 * Whether a piece of evidence is even eligible to be reused. Evidence produced by a validator
 * that declared itself "fresh-required" (or that opted out of reuse) is always FRESH_REQUIRED
 * and can never satisfy a future reuse request, regardless of fingerprint matches.
 */
export type ValidationEvidenceSafetyLevel = 'REUSE_SAFE' | 'FRESH_REQUIRED';

/**
 * The fingerprint set that determines whether previously recorded evidence still describes the
 * current state of the world. Every field is a deterministic hash — no timestamps, no random
 * identifiers, no machine-specific absolute paths.
 */
export interface ValidationEvidenceFingerprintSet {
  /** Fingerprint of whatever run-specific input the validator was invoked with. */
  inputFingerprint: string;
  /** Normalized-relative-path -> content hash, for every file the validator declared relevant. */
  relevantFileFingerprints: Record<string, string>;
  /** Fingerprint of the validator's own source file(s), if declared. */
  validatorSourceFingerprint: string;
  /** Fingerprint of the declared dependency inputs (e.g. package.json / lockfile). */
  dependencyFingerprint: string;
  /** Fingerprint of the declared environment assumptions (presence only, never raw values). */
  environmentFingerprint: string;
}

/**
 * A durable, on-disk record proving that a validator previously ran to completion with a given
 * set of fingerprints and produced a given result. This is the unit of reuse.
 */
export interface ValidationEvidenceRecord extends ValidationEvidenceFingerprintSet {
  validatorName: string;
  validatorVersion: string;
  evidenceKind: string;
  createdAt: number;
  ttlMs: number;
  expiresAt: number;
  resultStatus: ValidatorResultStatus;
  passToken: string | null;
  evidenceSummary: string;
  reusedFromCache: boolean;
  invalidationReasons: string[];
  safetyLevel: ValidationEvidenceSafetyLevel;
  /** How long the original fresh run took to execute, used for "time saved" estimates. */
  durationMs: number | null;
}

/**
 * Validator-level policy declaring what this validator considers relevant to its own
 * correctness, and whether it is willing to have its evidence reused at all.
 */
export interface ValidationEvidencePolicy {
  validatorName: string;
  validatorVersion: string;
  /** Must be explicitly opted into. Defaults to false (always run fresh) when unset. */
  reuseSafe: boolean;
  evidenceKinds: string[];
  /** Explicit file paths (absolute or repo-relative) this validator's outcome depends on. */
  relevantFiles: string[];
  /** Directories (absolute or repo-relative) recursively fingerprinted for this validator. */
  relevantDirectories: string[];
  /** Files whose content represents the declared dependency signature (e.g. lockfiles). */
  dependencyInputs: string[];
  /** Names (never values) of environment variables this validator's outcome depends on. */
  environmentInputs: string[];
  ttlMs: number;
  /** The validator's own source file, fingerprinted separately from relevantFiles. */
  validatorSourceFile?: string;
  /** If set, this validator can never reuse evidence, regardless of fingerprint matches. */
  mustRunFreshReason?: string;
  /** Allows a validator to explicitly ask for prior FAILED evidence for diagnostic comparison. */
  allowFailedEvidenceForDiagnostics?: boolean;
}

/** What a validator's fresh execution produced, before it becomes a durable evidence record. */
export interface ValidationEvidenceExecutionOutcome {
  status: ValidatorResultStatus;
  passToken?: string | null;
  evidenceSummary: string;
}

/** The result of asking VERE to run (or reuse) a validator's work. */
export interface ValidationEvidenceReuseOutcome {
  reused: boolean;
  status: ValidatorResultStatus;
  passToken: string | null;
  evidenceSummary: string;
  invalidationReasons: string[];
  record: ValidationEvidenceRecord;
  timeSavedMs: number;
}

/** A read-only explanation of what would happen without actually executing anything. */
export interface ValidationEvidenceReuseDecision {
  wouldReuse: boolean;
  reasons: string[];
}

/** One validator's participation in a validation session, for reporting purposes. */
export interface ValidationEvidenceSessionEntry {
  validatorName: string;
  outcome: ValidationEvidenceReuseOutcome;
}

/** Aggregate, human-readable summary of a validation session's cache behavior. */
export interface ValidationEvidenceCacheReport {
  validatorsRequested: string[];
  validatorsReused: string[];
  validatorsRunFresh: string[];
  unsafeValidatorsSkippedFromReuse: string[];
  cacheHitRate: number;
  estimatedTimeSavedMs: number;
  invalidationReasonsByValidator: Record<string, string[]>;
  finalStatus: 'PASSED' | 'FAILED';
}

export interface ValidationEvidenceEngineOptions {
  rootDir?: string;
  allowFailedForDiagnostics?: boolean;
}
