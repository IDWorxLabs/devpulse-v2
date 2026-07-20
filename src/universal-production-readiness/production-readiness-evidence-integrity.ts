/**
 * Universal Production Readiness Verification V1 — evidence integrity validation.
 */

import { validatePlanFingerprint } from '../universal-capability-composition-engine/capability-composition-plan-fingerprint.js';
import type { ProductionReadinessInput } from './universal-production-readiness-types.js';
import { buildReadinessFingerprints } from './production-readiness-input-loader.js';
import { createReadinessFinding, dimensionResult } from './production-readiness-finding-utils.js';

export function evaluateEvidenceIntegrity(input: ProductionReadinessInput) {
  const findings = [];
  const fps = buildReadinessFingerprints(input);

  if (!input.compositionPlan) {
    findings.push(createReadinessFinding({ code: 'evidence_missing', severity: 'BLOCKER', dimension: 'EVIDENCE_INTEGRITY', detail: 'composition plan' }));
  } else if (!validatePlanFingerprint(input.compositionPlan)) {
    findings.push(createReadinessFinding({ code: 'evidence_fingerprint_mismatch', severity: 'BLOCKER', dimension: 'EVIDENCE_INTEGRITY', detail: 'composition plan' }));
  }

  if (!input.behaviorReport) {
    findings.push(createReadinessFinding({ code: 'evidence_missing', severity: 'BLOCKER', dimension: 'EVIDENCE_INTEGRITY', detail: 'behavior report' }));
  } else if (fps.behaviorReportFingerprint.length === 0) {
    findings.push(createReadinessFinding({ code: 'evidence_invalid', severity: 'BLOCKER', dimension: 'EVIDENCE_INTEGRITY', detail: 'behavior fingerprint empty' }));
  }

  if (!input.coverageSnapshot) {
    findings.push(createReadinessFinding({ code: 'evidence_missing', severity: 'BLOCKER', dimension: 'EVIDENCE_INTEGRITY', detail: 'coverage snapshot' }));
  }

  if (input.compositionPlan && input.compositionPlan.approvedEnvelopeFingerprint !== fps.envelopeFingerprint) {
    findings.push(createReadinessFinding({
      code: 'evidence_fingerprint_mismatch',
      severity: 'BLOCKER',
      dimension: 'EVIDENCE_INTEGRITY',
      detail: 'envelope vs composition',
    }));
  }

  return dimensionResult('EVIDENCE_INTEGRITY', findings);
}
