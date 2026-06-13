/**
 * Risk-Aware Prioritizer — build priority order and risk items (V1).
 */

import type {
  BuildPlanEvidenceBundle,
  BuildPlanRiskItem,
  BuildPriorityItem,
  BuildPlanPhase,
} from './build-plan-types.js';

let priorityCounter = 0;
let riskCounter = 0;

export function resetPrioritizerCountersForTests(): void {
  priorityCounter = 0;
  riskCounter = 0;
}

export function detectBuildPlanRisks(bundle: BuildPlanEvidenceBundle): BuildPlanRiskItem[] {
  const risks: BuildPlanRiskItem[] = [];

  const push = (
    category: BuildPlanRiskItem['category'],
    description: string,
    evidence: string[],
  ) => {
    riskCounter += 1;
    risks.push({ readOnly: true, riskId: `build-risk-${riskCounter}`, category, description, evidence });
  };

  if (bundle.integrations.some((i) => /stripe|payment/i.test(i))) {
    push('INTEGRATION_RISK', 'Payment integration requires careful sequencing and test coverage.', ['INTEGRATION:Stripe']);
  }
  if (bundle.integrations.some((i) => /openai|ai/i.test(i))) {
    push('INTEGRATION_RISK', 'AI integration introduces latency, cost, and reliability considerations.', ['INTEGRATION:AI']);
  }
  if (bundle.workflows.length >= 4) {
    push('COMPLEX_WORKFLOW', 'Multiple workflows increase orchestration and testing complexity.', [`WORKFLOWS_${bundle.workflows.length}`]);
  }
  if (bundle.knownGaps.length > 0) {
    push('UNCLEAR_REQUIREMENT', `Unresolved gaps may block build sequencing: ${bundle.knownGaps[0]}`, ['KNOWN_GAPS']);
  }
  if (bundle.architectureRisks.length > 0) {
    push('HIGH_RISK_FEATURE', bundle.architectureRisks[0], ['ARCHITECTURE_RISK']);
  }

  return risks;
}

export function prioritizeBuildOrder(input: {
  bundle: BuildPlanEvidenceBundle;
  phases: readonly BuildPlanPhase[];
  risks: readonly BuildPlanRiskItem[];
}): BuildPriorityItem[] {
  const items: BuildPriorityItem[] = [];

  const push = (label: string, reason: string, riskLevel: BuildPriorityItem['riskLevel'], evidence: string[]) => {
    priorityCounter += 1;
    items.push({
      readOnly: true,
      priorityRank: priorityCounter,
      itemId: `priority-${priorityCounter}`,
      label,
      reason,
      riskLevel,
      evidence,
    });
  };

  for (const phase of input.phases) {
    const riskMatch = input.risks.find((r) =>
      (phase.name === 'Integrations' && r.category === 'INTEGRATION_RISK') ||
      (phase.name === 'Core Features' && r.category === 'COMPLEX_WORKFLOW'),
    );
    push(
      phase.name,
      riskMatch ? `${phase.name} prioritized due to ${riskMatch.category.toLowerCase().replace(/_/g, ' ')}` : `Sequential build phase ${phase.phaseNumber}`,
      riskMatch?.category === 'INTEGRATION_RISK' ? 'HIGH' : riskMatch ? 'MEDIUM' : 'LOW',
      [phase.phaseId, ...phase.evidence.slice(0, 2)],
    );
  }

  if (input.bundle.knownGaps.length > 0) {
    push('Resolve requirement gaps', 'Clarify unresolved requirements before execution planning.', 'HIGH', ['KNOWN_GAPS']);
  }

  return items.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.riskLevel] - order[b.riskLevel] || a.priorityRank - b.priorityRank;
  }).map((item, index) => ({ ...item, priorityRank: index + 1 }));
}
