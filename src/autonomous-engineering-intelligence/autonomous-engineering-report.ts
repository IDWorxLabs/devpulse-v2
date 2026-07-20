/**
 * Autonomous Engineering Intelligence V1 — deterministic report generation.
 */

import type {
  AutonomousEngineeringFinding,
  AutonomousEngineeringPlan,
  AutonomousEngineeringReport,
  AutonomousEngineeringExecutionResult,
} from './autonomous-engineering-types.js';
import { buildAutonomousEngineeringDiagnostics } from './autonomous-engineering-diagnostics.js';
import { isTraceabilityComplete, buildAutonomousEngineeringTraceability } from './autonomous-engineering-traceability.js';

export function generateAutonomousEngineeringReport(input: {
  plan: AutonomousEngineeringPlan;
  execution: AutonomousEngineeringExecutionResult | null;
  findings: readonly AutonomousEngineeringFinding[];
  preconditionErrors?: readonly string[];
  validationErrors?: readonly string[];
}): AutonomousEngineeringReport {
  const repairableCount = input.plan.eligibilityDecisions.filter((d) =>
    ['AUTONOMOUSLY_REPAIRABLE', 'AUTONOMOUSLY_REPAIRABLE_WITH_GUARDS', 'REQUIRES_EXISTING_GENERATOR_REEXECUTION'].includes(
      d.eligibility,
    ),
  ).length;
  const traceability = buildAutonomousEngineeringTraceability({
    findings: input.findings,
    plan: input.plan,
    execution: input.execution,
  });
  const outcome = input.execution?.outcome ?? 'REPAIR_BLOCKED';
  return {
    readOnly: true,
    plan: input.plan,
    execution: input.execution,
    findingsAnalyzed: input.findings.length,
    repairableCount,
    humanRequiredCount: input.plan.humanRequiredFindings.length,
    traceabilityComplete: isTraceabilityComplete(traceability),
    diagnostics: buildAutonomousEngineeringDiagnostics({
      plan: input.plan,
      outcome,
      preconditionErrors: input.preconditionErrors ?? [],
      validationErrors: input.validationErrors ?? [],
    }),
  };
}
