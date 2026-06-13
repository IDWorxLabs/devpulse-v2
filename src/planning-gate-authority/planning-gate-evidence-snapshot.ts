/**
 * Planning gate evidence snapshot — consolidates upstream intelligence inputs (V1).
 */

import type {
  AssessPlanningGateInput,
  PlanningGateEvidenceSnapshot,
} from './planning-gate-types.js';

export function buildPlanningGateEvidenceSnapshot(
  input: AssessPlanningGateInput,
): PlanningGateEvidenceSnapshot | null {
  const intake = input.unifiedIntakeAnalysis;
  if (!intake) return null;

  const understanding = intake.projectUnderstanding;
  const completeness = input.requirementCompletenessAnalysis;

  const sources = [
    ...intake.evidence.activeSources,
    completeness ? 'REQUIREMENT_COMPLETENESS_INTELLIGENCE' : null,
    input.founderTestAutomationAnalysis ? 'FOUNDER_TEST_AUTOMATION' : null,
    input.voiceNotesAnalysis ? 'VOICE_NOTES_INTELLIGENCE' : null,
    input.visualReferenceAnalysis ? 'VISUAL_REFERENCE_INTELLIGENCE' : null,
    input.projectVaultContext?.facts.length ? 'PROJECT_VAULT_CONTEXT' : null,
  ].filter(Boolean) as string[];

  return {
    readOnly: true,
    sources: [...new Set(sources)],
    screens: understanding.screens,
    workflows: understanding.workflows,
    userRoles: understanding.userRoles,
    integrations: understanding.integrations,
    businessRules: understanding.businessRules,
    platforms: understanding.platforms,
    intakeConfidence: intake.unifiedIntakeConfidence,
    intakeReadinessScore: intake.intakeReadinessScore,
    completenessScore: completeness?.completenessScore ?? null,
    conflictCount: intake.evidenceConflicts.length,
    gapCount: intake.intakeGaps.length,
  };
}

export function hasMinimumPlanningGateEvidence(snapshot: PlanningGateEvidenceSnapshot): boolean {
  return snapshot.sources.length >= 1 && snapshot.intakeConfidence > 0;
}
