/**
 * Project Understanding Builder — unified project understanding model (V1).
 */

import type {
  ConsolidatedIntakeEvidence,
  ProjectIntentAnalysis,
  UnifiedProjectUnderstanding,
} from './unified-intake-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildUnifiedProjectUnderstanding(input: {
  evidence: ConsolidatedIntakeEvidence;
  projectIntent: ProjectIntentAnalysis;
  conflictPenalty: number;
}): UnifiedProjectUnderstanding {
  let confidence = input.projectIntent.confidence;
  confidence += Math.min(15, input.evidence.screens.length * 3);
  confidence += Math.min(10, input.evidence.workflows.length * 3);
  confidence += Math.min(10, input.evidence.integrations.length * 4);
  confidence -= input.conflictPenalty;

  return {
    readOnly: true,
    productType: input.projectIntent.applicationType,
    platforms: input.projectIntent.platformTargets,
    workflows: input.evidence.workflows,
    screens: input.evidence.screens,
    userRoles: input.evidence.userRoles.length > 0 ? input.evidence.userRoles : input.projectIntent.targetUsers,
    entities: input.evidence.dataEntities,
    integrations: input.evidence.integrations,
    businessRules: input.evidence.businessRules,
    confidence: clamp(confidence),
    evidenceSources: input.evidence.activeSources,
  };
}
