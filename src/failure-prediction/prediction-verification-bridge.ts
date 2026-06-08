/**
 * Verification Loop bridge — Verification Loop remains owner; Failure Prediction consumes verification history.
 */

import { getDevPulseV2VerificationLoopAuthority } from '../verification-loop/verification-loop-authority.js';
import { LOOP_OWNER_MODULE } from '../verification-loop/types.js';
import { createPredictionRecord, scoreConfidence } from './failure-prediction-scoring.js';
import type { PredictionRecord } from './types.js';
import { REPEATED_VALIDATION_FAILURES_TITLE } from './types.js';

export function analyzeVerificationPatterns(): PredictionRecord[] {
  const reviews = getDevPulseV2VerificationLoopAuthority().listVerifications();
  const failures = reviews.filter(
    (r) =>
      r.status === 'UNVERIFIED' ||
      r.status === 'CONFLICT' ||
      r.errors.length > 0,
  );

  const predictions: PredictionRecord[] = [];
  if (failures.length >= 2) {
    predictions.push(
      createPredictionRecord({
        sourceSystemId: 'verification_loop',
        title: REPEATED_VALIDATION_FAILURES_TITLE,
        description: `${failures.length} verification failure(s) indicate elevated validation risk.`,
        riskLevel: 'HIGH',
        confidence: scoreConfidence('HIGH', failures.length),
        supportingEvidenceIds: failures.flatMap((r) => r.evidenceIds),
        warnings: failures.flatMap((r) => r.warnings),
        errors: failures.flatMap((r) => r.errors),
      }),
    );
  }

  const partial = reviews.filter((r) => r.status === 'PARTIAL');
  if (partial.length >= 2) {
    predictions.push(
      createPredictionRecord({
        sourceSystemId: 'verification_loop',
        title: 'Repeated Partial Verifications',
        description: `${partial.length} partial verification(s) suggest incomplete proof chains.`,
        riskLevel: 'MEDIUM',
        confidence: scoreConfidence('MEDIUM', partial.length),
        supportingEvidenceIds: partial.flatMap((r) => r.evidenceIds),
        warnings: [],
        errors: [],
      }),
    );
  }

  return predictions;
}

export function getVerificationPredictionSummary(): string {
  const predictions = analyzeVerificationPatterns();
  if (predictions.length === 0) {
    return 'No elevated verification risk patterns detected.';
  }
  return `Verification patterns: ${predictions.length} prediction signal(s).`;
}

export function assertVerificationLoopOwnershipUnchanged(): boolean {
  const loop = getDevPulseV2VerificationLoopAuthority();
  return (
    loop.constructor.name === 'DevPulseV2VerificationLoopAuthority' &&
    typeof loop.listVerifications === 'function' &&
    typeof (loop as { predictFailure?: unknown }).predictFailure === 'undefined'
  );
}

export function getVerificationLoopOwnerForBridge(): string {
  return LOOP_OWNER_MODULE;
}
