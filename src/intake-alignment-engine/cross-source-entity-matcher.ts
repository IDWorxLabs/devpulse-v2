/**
 * Cross-Source Entity Matcher — matches entities across intake sources (V1).
 */

import { normalizeRole, normalizeWorkflow, detectProductDomain } from './evidence-normalizer.js';
import type { AssessIntakeAlignmentInput, AlignmentEvidenceBundle } from './intake-alignment-types.js';

export function buildAlignmentEvidenceBundle(input: AssessIntakeAlignmentInput): AlignmentEvidenceBundle | null {
  const intake = input.unifiedIntakeAnalysis;
  if (!intake) return null;

  const typedPrompt = input.typedPrompt ?? intake.evidence.typedPromptExcerpt ?? '';
  const roles = [
    ...intake.projectUnderstanding.userRoles,
    ...(input.voiceNotesAnalysis?.requirements.userRoles ?? []),
  ];
  const workflows = [
    ...intake.projectUnderstanding.workflows,
    ...(input.voiceNotesAnalysis?.requirements.workflows ?? []),
  ];
  const platforms = [
    ...intake.evidence.platforms,
    ...(input.voiceNotesAnalysis?.projectUnderstanding.platformTargets ?? []),
    input.visualReferenceAnalysis?.screenDetection.platform ?? '',
  ].filter(Boolean);

  const sources = [
    ...intake.evidence.activeSources,
    input.voiceNotesAnalysis ? 'VOICE_NOTES_INTELLIGENCE' : null,
    input.visualReferenceAnalysis ? 'VISUAL_REFERENCE_INTELLIGENCE' : null,
    input.requirementCompletenessAnalysis ? 'REQUIREMENT_COMPLETENESS_INTELLIGENCE' : null,
  ].filter(Boolean) as string[];

  return {
    readOnly: true,
    sources: [...new Set(sources)],
    typedPrompt,
    platforms,
    roles: [...new Set(roles)],
    workflows: [...new Set(workflows)],
    productType: intake.projectUnderstanding.productType,
    conflicts: [...intake.evidenceConflicts],
    intakeConfidence: intake.unifiedIntakeConfidence,
  };
}

export function matchCrossSourceEntities(bundle: AlignmentEvidenceBundle): {
  matchedRoles: string[];
  matchedWorkflows: string[];
  matchedDomains: string[];
  sourceCount: number;
} {
  const normalizedRoles = bundle.roles.map((r) => normalizeRole(r));
  const normalizedWorkflows = bundle.workflows.map((w) => normalizeWorkflow(w));
  const domains = [
    detectProductDomain(bundle.typedPrompt),
    bundle.productType,
    detectProductDomain(bundle.roles.join(' ')),
  ].filter(Boolean) as string[];

  return {
    matchedRoles: [...new Set(normalizedRoles.filter((r) => r !== 'UNKNOWN'))],
    matchedWorkflows: [...new Set(normalizedWorkflows)],
    matchedDomains: [...new Set(domains)],
    sourceCount: bundle.sources.length,
  };
}
