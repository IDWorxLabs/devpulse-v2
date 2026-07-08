/**
 * Validation Evidence Reuse Engine (VERE) V1 — validator-level policy declaration.
 *
 * A policy is how a validator opts into (or stays out of) evidence reuse. The safe default is
 * "run fresh every time" — a validator must explicitly declare `reuseSafe: true` before VERE will
 * ever consider reusing its evidence.
 */

import { DEFAULT_EVIDENCE_KIND, DEFAULT_EVIDENCE_TTL_MS } from './validation-evidence-types.js';
import type { ValidationEvidencePolicy } from './validation-evidence-types.js';

export type ValidationEvidencePolicyInput = Partial<ValidationEvidencePolicy> &
  Pick<ValidationEvidencePolicy, 'validatorName' | 'validatorVersion'>;

/** Fills in safe, generic defaults for any fields a validator does not explicitly declare. */
export function defineValidationEvidencePolicy(input: ValidationEvidencePolicyInput): ValidationEvidencePolicy {
  return {
    validatorName: input.validatorName,
    validatorVersion: input.validatorVersion,
    reuseSafe: input.reuseSafe ?? false,
    evidenceKinds: input.evidenceKinds && input.evidenceKinds.length > 0 ? input.evidenceKinds : [DEFAULT_EVIDENCE_KIND],
    relevantFiles: input.relevantFiles ?? [],
    relevantDirectories: input.relevantDirectories ?? [],
    dependencyInputs: input.dependencyInputs ?? ['package.json', 'package-lock.json'],
    environmentInputs: input.environmentInputs ?? [],
    ttlMs: input.ttlMs ?? DEFAULT_EVIDENCE_TTL_MS,
    validatorSourceFile: input.validatorSourceFile,
    mustRunFreshReason: input.mustRunFreshReason,
    allowFailedEvidenceForDiagnostics: input.allowFailedEvidenceForDiagnostics ?? false,
  };
}

export function primaryEvidenceKind(policy: ValidationEvidencePolicy): string {
  return policy.evidenceKinds[0] ?? DEFAULT_EVIDENCE_KIND;
}

/** True when this policy can never participate in reuse, regardless of fingerprint matches. */
export function isFreshRequired(policy: ValidationEvidencePolicy): boolean {
  return !policy.reuseSafe || Boolean(policy.mustRunFreshReason);
}

export function freshRequiredReason(policy: ValidationEvidencePolicy): string {
  if (policy.mustRunFreshReason) {
    return `FRESH_REQUIRED: ${policy.mustRunFreshReason}`;
  }
  return 'NOT_REUSE_SAFE';
}
