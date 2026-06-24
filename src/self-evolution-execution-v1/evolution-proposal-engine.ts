/**
 * Self-Evolution Execution V1 — evolution proposal generation.
 */

import { randomUUID } from 'node:crypto';
import type {
  EvolutionGapEntry,
  EvolutionProposal,
  EvolutionRiskLevel,
} from './self-evolution-execution-v1-types.js';

function resolveRiskLevel(severity: string, gapClass: string): EvolutionRiskLevel {
  if (severity === 'BLOCKING') return 'CRITICAL';
  if (severity === 'HIGH' && gapClass.includes('Architecture')) return 'HIGH';
  if (severity === 'HIGH') return 'MEDIUM';
  return 'LOW';
}

function buildValidationPlan(gap: EvolutionGapEntry): readonly string[] {
  return [
    'CREATE_WORLD2_EXPERIMENT',
    'IMPLEMENT_BOUNDED_CHANGE',
    'BUILD',
    'PREVIEW',
    'UVL_VERIFICATION',
    'PRODUCT_ARCHITECT_REVIEW',
    'AFLA_VERDICT',
    'PRODUCTION_READINESS_GATE',
    'MEASURE_IMPACT',
    'OPERATOR_APPROVAL',
    'PROMOTE_OR_ARCHIVE',
  ];
}

function buildChangeScope(gap: EvolutionGapEntry): readonly string[] {
  const scopes = ['Configuration', 'Scoring', 'Validation Logic', 'Evidence Routing'];
  if (gap.gapClass === 'Architecture Gap') scopes.push('Capability Wiring', 'Registries');
  if (gap.gapClass === 'Workflow Gap') scopes.push('Rules');
  return scopes;
}

export function generateEvolutionProposal(gap: EvolutionGapEntry): EvolutionProposal {
  return {
    readOnly: true,
    proposalId: randomUUID(),
    gapId: gap.gapId,
    targetCapability: gap.capability,
    reason: gap.detail,
    expectedBenefit: `Close ${gap.gapClass.toLowerCase()} for ${gap.capability} via bounded World2 evolution`,
    riskLevel: resolveRiskLevel(gap.severity, gap.gapClass),
    validationPlan: buildValidationPlan(gap),
    changeScope: buildChangeScope(gap),
    pipelineStage: 'GENERATE_PROPOSAL',
  };
}

export function generateEvolutionProposals(gaps: readonly EvolutionGapEntry[]): readonly EvolutionProposal[] {
  return gaps.map((gap) => generateEvolutionProposal(gap));
}
