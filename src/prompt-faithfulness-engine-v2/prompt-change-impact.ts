/**
 * Prompt Faithfulness Engine V2 — change impact analysis.
 */

import type { PromptRequirement, TraceabilityLink } from './prompt-faithfulness-v2-types.js';

export interface ChangeImpactAnalysis {
  readOnly: true;
  changeId: string;
  affectedRequirementIds: readonly string[];
  affectedArtifactPaths: readonly string[];
  impactedCapabilities: readonly string[];
  estimatedRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

let changeCounter = 0;

export function resetPromptChangeImpactForTests(): void {
  changeCounter = 0;
}

export function analyzeChangeImpact(input: {
  changedArtifactPath: string;
  traceabilityLinks: readonly TraceabilityLink[];
  requirements: readonly PromptRequirement[];
}): ChangeImpactAnalysis {
  changeCounter += 1;
  const link = input.traceabilityLinks.find((l) => l.artifactPath === input.changedArtifactPath);
  const affectedRequirementIds = link?.requirementIds ?? [];
  const affectedRequirements = input.requirements.filter((r) =>
    affectedRequirementIds.includes(r.requirementId),
  );

  const impactedCapabilities = affectedRequirements
    .map((r) => r.category)
    .filter((v, i, a) => a.indexOf(v) === i);

  const estimatedRisk: ChangeImpactAnalysis['estimatedRisk'] =
    affectedRequirementIds.length >= 3 ? 'HIGH' :
    affectedRequirementIds.length >= 1 ? 'MEDIUM' : 'LOW';

  const relatedArtifacts = input.traceabilityLinks
    .filter((l) => l.requirementIds.some((id) => affectedRequirementIds.includes(id)))
    .map((l) => l.artifactPath);

  return {
    readOnly: true,
    changeId: `change-${changeCounter}`,
    affectedRequirementIds,
    affectedArtifactPaths: relatedArtifacts,
    impactedCapabilities,
    estimatedRisk,
  };
}
