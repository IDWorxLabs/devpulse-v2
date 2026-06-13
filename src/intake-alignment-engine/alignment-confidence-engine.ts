/**
 * Alignment Confidence Engine — alignment score and confidence repair (V1).
 */

import type {
  AlignmentCategory,
  AlignmentRecommendation,
  ClassifiedConflict,
  PlatformAlignmentResult,
  RoleAlignmentResult,
  SemanticAgreementItem,
  WorkflowAlignmentResult,
} from './intake-alignment-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function mapAlignmentCategory(score: number): AlignmentCategory {
  if (score >= 90) return 'STRONG_ALIGNMENT';
  if (score >= 70) return 'HIGH_ALIGNMENT';
  if (score >= 40) return 'PARTIAL_ALIGNMENT';
  return 'CONFLICTED';
}

export function computeAlignmentScore(input: {
  platformAlignment: PlatformAlignmentResult;
  roleAlignment: RoleAlignmentResult;
  workflowAlignment: WorkflowAlignmentResult;
  semanticAgreements: readonly SemanticAgreementItem[];
  realConflictCount: number;
}): number {
  let score =
    input.platformAlignment.alignmentScore * 0.3 +
    input.roleAlignment.roleAlignmentScore * 0.25 +
    input.workflowAlignment.workflowAlignmentScore * 0.25;

  score += Math.min(20, input.semanticAgreements.length * 4);
  score -= input.realConflictCount * 15;

  if (input.platformAlignment.truePlatformConflict) score -= 20;

  return clamp(score);
}

export function computeAlignedConfidence(input: {
  intakeConfidence: number;
  alignmentScore: number;
  falseConflictCount: number;
  realConflictCount: number;
  semanticAgreements: readonly SemanticAgreementItem[];
}): number {
  let confidence = input.intakeConfidence;

  if (input.falseConflictCount > 0 && input.realConflictCount === 0) {
    confidence += Math.min(15, input.falseConflictCount * 5);
  } else if (input.falseConflictCount > 0) {
    confidence += Math.min(8, input.falseConflictCount * 3);
  }

  if (input.alignmentScore >= 70) {
    confidence = confidence * 0.4 + input.alignmentScore * 0.6;
  } else if (input.alignmentScore >= 40) {
    confidence = confidence * 0.6 + input.alignmentScore * 0.4;
  }

  confidence -= input.realConflictCount * 10;
  confidence += input.semanticAgreements.filter((a) => a.confidence >= 80).length * 2;

  return clamp(Math.min(confidence, input.intakeConfidence + 25));
}

export function generateAlignmentRecommendations(input: {
  alignmentScore: number;
  realConflictCount: number;
  falseConflictCount: number;
  platformAlignment: PlatformAlignmentResult;
  classifiedConflicts: readonly ClassifiedConflict[];
}): AlignmentRecommendation[] {
  const recs: AlignmentRecommendation[] = [];
  let counter = 0;

  const push = (
    priority: AlignmentRecommendation['priority'],
    action: string,
    rationale: string,
    evidence: string[],
  ) => {
    counter += 1;
    recs.push({ readOnly: true, recommendationId: `align-rec-${counter}`, priority, action, rationale, evidence });
  };

  if (input.alignmentScore >= 85 && input.realConflictCount === 0) {
    push('LOW', 'No action needed', 'Evidence is already aligned across intake sources.', ['STRONG_ALIGNMENT']);
  }

  if (input.falseConflictCount > 0) {
    push(
      'MEDIUM',
      'Apply alignment repair to intake confidence',
      `${input.falseConflictCount} false conflict(s) detected; repaired confidence is justified.`,
      ['FALSE_CONFLICT_REPAIR'],
    );
  }

  if (input.platformAlignment.truePlatformConflict) {
    push(
      'CRITICAL',
      'Clarify platform',
      'Sources genuinely disagree on primary launch platform.',
      ['TRUE_PLATFORM_CONFLICT'],
    );
  }

  for (const conflict of input.classifiedConflicts.filter((c) => c.classification === 'REAL_CONFLICT')) {
    push('HIGH', 'Resolve intake conflict', conflict.reason, [conflict.conflictId, conflict.originalConflict.conflictType]);
  }

  if (recs.length === 0) {
    push('MEDIUM', 'Review intake evidence', 'Alignment is partial; founder clarification may improve confidence.', ['PARTIAL_ALIGNMENT']);
  }

  return recs;
}
