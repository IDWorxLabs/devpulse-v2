/**
 * Universal Production Readiness Verification V1 — input validation.
 */

import type { ProductionReadinessInput } from './universal-production-readiness-types.js';
import { isUniversalCapabilityCompositionPlanValid } from '../universal-capability-composition-engine/capability-composition-plan-validator.js';
import { envelopeFingerprint } from '../universal-capability-composition-engine/capability-composition-requirement-loader.js';

export function validateProductionReadinessInput(input: ProductionReadinessInput | null | undefined): string[] {
  const errors: string[] = [];
  if (!input) {
    errors.push('production_readiness_input_invalid');
    return errors;
  }
  if (!input.envelope) errors.push('production_envelope_missing');
  if (!input.moduleIds.length) errors.push('production_readiness_input_invalid');
  if (!input.compositionPlan) errors.push('composition_plan_missing');
  else if (!isUniversalCapabilityCompositionPlanValid(input.compositionPlan)) errors.push('composition_plan_invalid');
  else if (input.compositionPlan.approvedEnvelopeFingerprint !== envelopeFingerprint(input.envelope)) {
    errors.push('composition_fingerprint_mismatch');
  }
  if (!input.behaviorReport) errors.push('behavior_verification_missing');
  if (!input.coverageSnapshot) errors.push('capability_coverage_missing');
  return errors;
}

export function isProductionReadinessInputValid(input: ProductionReadinessInput | null | undefined): boolean {
  return validateProductionReadinessInput(input).length === 0;
}
