/**
 * Autonomous Engineering Intelligence V1 — repair plan builder.
 */

import { createHash } from 'node:crypto';
import type {
  AutonomousEngineeringFinding,
  AutonomousEngineeringInput,
  AutonomousEngineeringPlan,
  EligibilityDecision,
} from './autonomous-engineering-types.js';
import { AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE } from './autonomous-engineering-types.js';
import { classifyRepairEligibilityBatch } from './autonomous-repair-eligibility-classifier.js';
import { selectRepairStrategy } from './autonomous-repair-strategy-selector.js';
import { buildRepairDependencyGraph } from './autonomous-repair-dependency-graph.js';
import { workspaceFingerprint } from './autonomous-engineering-input-loader.js';
import { fingerprintAutonomousEngineeringPlan } from './autonomous-repair-plan-fingerprint.js';
import { bootstrapRepairStrategyRegistry } from './autonomous-repair-strategy-registry.js';

const REPAIRABLE = new Set([
  'AUTONOMOUSLY_REPAIRABLE',
  'AUTONOMOUSLY_REPAIRABLE_WITH_GUARDS',
  'REQUIRES_EXISTING_GENERATOR_REEXECUTION',
]);

export function buildAutonomousEngineeringPlan(input: {
  engineeringInput: AutonomousEngineeringInput;
  findings: readonly AutonomousEngineeringFinding[];
}): AutonomousEngineeringPlan {
  bootstrapRepairStrategyRegistry();
  const eligibilityDecisions = classifyRepairEligibilityBatch(input.findings);
  const selectedStrategies: { findingId: string; strategyId: string }[] = [];
  const rejectedStrategies: { findingId: string; strategyId: string; reason: string }[] = [];
  const humanRequiredFindings: string[] = [];
  const unresolvedFindings: string[] = [];

  for (const finding of input.findings) {
    const eligibility = eligibilityDecisions.find((d) => d.findingId === finding.findingId)!;
    if (!REPAIRABLE.has(eligibility.eligibility)) {
      if (
        ['REQUIRES_NEW_CAPABILITY', 'REQUIRES_NEW_CAPABILITY_PACK', 'REQUIRES_HUMAN_ARCHITECTURAL_DECISION'].includes(
          eligibility.eligibility,
        )
      ) {
        humanRequiredFindings.push(finding.findingId);
      } else {
        unresolvedFindings.push(finding.findingId);
      }
      continue;
    }
    const selection = selectRepairStrategy(finding, eligibility);
    if (!selection.selectedStrategyId) {
      unresolvedFindings.push(finding.findingId);
      for (const c of selection.candidates) {
        rejectedStrategies.push({
          findingId: finding.findingId,
          strategyId: c.strategyId,
          reason: c.rejectionReason ?? 'not_selected',
        });
      }
      continue;
    }
    selectedStrategies.push({ findingId: finding.findingId, strategyId: selection.selectedStrategyId });
    for (const c of selection.candidates.filter((x) => !x.selected)) {
      rejectedStrategies.push({
        findingId: finding.findingId,
        strategyId: c.strategyId,
        reason: c.rejectionReason ?? 'lower_rank',
      });
    }
  }

  const graph = buildRepairDependencyGraph({ selectedStrategies });
  const planId = `ae-plan-${createHash('sha256').update(input.findings.map((f) => f.fingerprint).join(',')).digest('hex').slice(0, 12)}`;
  const readinessReport = input.engineeringInput.readinessReport;

  const planBase = {
    planId,
    envelopeFingerprint: readinessReport?.envelopeFingerprint ?? '',
    workspaceFingerprint: workspaceFingerprint(input.engineeringInput.workspaceFiles),
    readinessEvaluationFingerprint: readinessReport?.fingerprint ?? '',
    sourceFindingIds: input.findings.map((f) => f.findingId),
    eligibilityDecisions,
    selectedStrategies,
    rejectedStrategies,
    executionOrder: graph.order,
    validationPlan: graph.order.map((s) => `validate:${s}`),
    maximumAttempts: 1,
    unresolvedFindings,
    humanRequiredFindings,
    provenance: [AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE, planId],
  };

  const fingerprint = fingerprintAutonomousEngineeringPlan(planBase);
  return { ...planBase, readOnly: true as const, fingerprint };
}
