/**
 * Simulation Alignment Impact — before/after repair comparison (V1).
 */

import { assessIntakeAlignment, applyAlignmentRepairToUnifiedIntake } from './intake-alignment-authority.js';
import { runPlanningGateAuthority } from '../planning-gate-authority/index.js';
import type { SimulationAlignmentImpact } from './intake-alignment-types.js';
import type { UnifiedIntakeAnalysis } from '../unified-intake-intelligence/unified-intake-types.js';
import type { VoiceNotesAnalysis } from '../voice-notes-intelligence/voice-notes-types.js';
import type { VisualReferenceAnalysis } from '../visual-reference-intelligence/visual-reference-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';

function computeReadinessFromIntake(intake: UnifiedIntakeAnalysis | null): number {
  if (!intake) return 0;
  let score = intake.unifiedIntakeConfidence * 0.5 + intake.intakeReadinessScore * 0.5;
  score -= intake.evidenceConflicts.length * 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeSimulationAlignmentImpact(input: {
  scenarioType: string;
  unifiedIntakeAnalysis: UnifiedIntakeAnalysis;
  voiceNotesAnalysis?: VoiceNotesAnalysis | null;
  visualReferenceAnalysis?: VisualReferenceAnalysis | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  typedPrompt?: string | null;
}): SimulationAlignmentImpact {
  const beforeConfidence = input.unifiedIntakeAnalysis.unifiedIntakeConfidence;
  const beforeReadiness = computeReadinessFromIntake(input.unifiedIntakeAnalysis);

  const gateBefore = runPlanningGateAuthority({
    unifiedIntakeAnalysis: input.unifiedIntakeAnalysis,
    requirementCompletenessAnalysis: input.requirementCompletenessAnalysis,
    voiceNotesAnalysis: input.voiceNotesAnalysis,
    visualReferenceAnalysis: input.visualReferenceAnalysis,
    skipHistoryRecording: true,
  });

  const alignment = assessIntakeAlignment({
    unifiedIntakeAnalysis: input.unifiedIntakeAnalysis,
    voiceNotesAnalysis: input.voiceNotesAnalysis,
    visualReferenceAnalysis: input.visualReferenceAnalysis,
    requirementCompletenessAnalysis: input.requirementCompletenessAnalysis,
    typedPrompt: input.typedPrompt,
    skipHistoryRecording: true,
  });

  const repairedIntake = alignment
    ? applyAlignmentRepairToUnifiedIntake(input.unifiedIntakeAnalysis, alignment)
    : input.unifiedIntakeAnalysis;

  const afterConfidence = repairedIntake.unifiedIntakeConfidence;
  const afterReadiness = computeReadinessFromIntake(repairedIntake);

  const gateAfter = runPlanningGateAuthority({
    unifiedIntakeAnalysis: repairedIntake,
    requirementCompletenessAnalysis: input.requirementCompletenessAnalysis,
    voiceNotesAnalysis: input.voiceNotesAnalysis,
    visualReferenceAnalysis: input.visualReferenceAnalysis,
    skipHistoryRecording: true,
  });

  return {
    readOnly: true,
    scenarioType: input.scenarioType,
    readinessBeforeRepair: beforeReadiness,
    readinessAfterRepair: afterReadiness,
    confidenceBeforeRepair: beforeConfidence,
    confidenceAfterRepair: afterConfidence,
    falseConflictsRepaired: alignment?.falseConflictCount ?? 0,
    realConflictsRetained: alignment?.realConflictCount ?? 0,
    gateDecisionBefore: gateBefore.analysis?.planningGateDecision ?? null,
    gateDecisionAfter: gateAfter.analysis?.planningGateDecision ?? null,
  };
}
