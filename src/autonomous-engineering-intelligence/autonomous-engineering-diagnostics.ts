/**
 * Autonomous Engineering Intelligence V1 — diagnostics.
 */

import type { AutonomousEngineeringPlan, RepairOutcome } from './autonomous-engineering-types.js';

export function buildAutonomousEngineeringDiagnostics(input: {
  plan: AutonomousEngineeringPlan;
  outcome: RepairOutcome;
  preconditionErrors: readonly string[];
  validationErrors: readonly string[];
}): { code: string; detail: string }[] {
  const diagnostics: { code: string; detail: string }[] = [];
  for (const code of input.preconditionErrors) {
    diagnostics.push({ code, detail: 'precondition_failed' });
  }
  for (const code of input.validationErrors) {
    diagnostics.push({ code, detail: 'plan_validation_failed' });
  }
  if (input.outcome === 'REPAIR_SUCCEEDED') {
    diagnostics.push({ code: 'missing_artifact_repaired', detail: 'repair_cycle_complete' });
  }
  if (input.outcome === 'REPAIR_REQUIRES_NEW_CAPABILITY') {
    diagnostics.push({ code: 'capability_not_implemented', detail: 'new_capability_required' });
  }
  if (input.outcome === 'REPAIR_REQUIRES_HUMAN_DECISION') {
    diagnostics.push({ code: 'human_architectural_decision_required', detail: 'human_required' });
  }
  if (input.outcome === 'REPAIR_UNSAFE') {
    diagnostics.push({ code: 'unsafe_autonomous_repair', detail: 'unsafe_blocked' });
  }
  if (input.plan.humanRequiredFindings.length > 0) {
    diagnostics.push({
      code: 'capability_pack_not_implemented',
      detail: `${input.plan.humanRequiredFindings.length} findings require new capability`,
    });
  }
  return diagnostics.sort((a, b) => a.code.localeCompare(b.code));
}
