/**
 * Self-Evolution Execution V1 — approval gate evaluation.
 */

import type {
  EvolutionApprovalDecision,
  EvolutionExperimentResult,
  EvolutionImpactAssessment,
} from './self-evolution-execution-v1-types.js';

export function evaluateEvolutionApproval(input: {
  experiment: EvolutionExperimentResult;
  impact: EvolutionImpactAssessment;
  operatorApprovalPresent: boolean;
}): EvolutionApprovalDecision {
  const regressionsDetected =
    !input.experiment.buildPassed ||
    !input.experiment.previewPassed ||
    input.impact.regressionRisk === 'HIGH';

  const promotable =
    input.impact.improvement > 0 &&
    !regressionsDetected &&
    input.experiment.validationPassed &&
    input.operatorApprovalPresent;

  return {
    readOnly: true,
    proposalId: input.experiment.proposalId,
    experimentId: input.experiment.experimentId,
    improvement: input.impact.improvement,
    regressionsDetected,
    validationPassed: input.experiment.validationPassed,
    operatorApprovalPresent: input.operatorApprovalPresent,
    decision: promotable ? 'PROMOTABLE' : regressionsDetected ? 'REJECTED' : 'PENDING',
    decidedAt: new Date().toISOString(),
  };
}
