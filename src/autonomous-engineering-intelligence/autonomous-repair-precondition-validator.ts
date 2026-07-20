/**
 * Autonomous Engineering Intelligence V1 — repair precondition validation.
 */

import type { AutonomousEngineeringInput, AutonomousEngineeringPlan } from './autonomous-engineering-types.js';
import { validateAutonomousEngineeringInput } from './autonomous-engineering-input-loader.js';
import { validatePlanFingerprint } from '../universal-capability-composition-engine/capability-composition-plan-fingerprint.js';
import { workspaceFingerprint } from './autonomous-engineering-input-loader.js';

export function validateRepairPreconditions(input: AutonomousEngineeringInput, plan: AutonomousEngineeringPlan): string[] {
  const errors = [...validateAutonomousEngineeringInput(input)];
  if (plan.envelopeFingerprint !== input.readinessReport?.envelopeFingerprint) {
    errors.push('autonomous_finding_stale');
  }
  if (plan.workspaceFingerprint !== workspaceFingerprint(input.workspaceFiles)) {
    errors.push('autonomous_finding_stale');
  }
  if (input.compositionPlan && !validatePlanFingerprint(input.compositionPlan)) {
    errors.push('autonomous_finding_contradictory');
  }
  if (plan.selectedStrategies.length === 0 && plan.unresolvedFindings.length > 0) {
    errors.push('no_repair_strategy');
  }
  return errors;
}
