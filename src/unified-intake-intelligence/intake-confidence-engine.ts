/**
 * Intake Confidence Engine — unified confidence and readiness scoring (V1).
 */

import type {
  ConsolidatedIntakeEvidence,
  EvidenceConflict,
  IntakeGap,
  IntakeReadiness,
  IntakeReadinessCategory,
  IntakeRecommendation,
  UnifiedProjectUnderstanding,
} from './unified-intake-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeUnifiedIntakeConfidence(input: {
  evidence: ConsolidatedIntakeEvidence;
  projectUnderstanding: UnifiedProjectUnderstanding;
  conflicts: readonly EvidenceConflict[];
}): number {
  let score = 35;

  score += Math.min(25, input.evidence.activeSources.length * 7);
  score += Math.min(15, input.projectUnderstanding.confidence / 5);
  score += Math.min(10, input.evidence.screens.length * 2);
  score += Math.min(8, input.evidence.workflows.length * 2);

  const uniquePlatforms = new Set(input.evidence.platforms.map((p) => p.toUpperCase()));
  if (uniquePlatforms.size === 1) score += 8;

  score -= input.conflicts.length * 10;
  score -= input.conflicts.filter((c) => c.conflictType === 'PLATFORM_CONFLICT').length * 5;

  if (input.evidence.activeSources.length >= 3) score += 5;

  return clamp(score);
}

export function mapIntakeReadinessCategory(score: number): IntakeReadinessCategory {
  if (score >= 90) return 'READY_FOR_PLANNING';
  if (score >= 70) return 'HIGH_CONFIDENCE_UNDERSTANDING';
  if (score >= 40) return 'PARTIAL_UNDERSTANDING';
  return 'INSUFFICIENT_INPUT';
}

export function computeIntakeReadinessScore(input: {
  unifiedIntakeConfidence: number;
  gaps: readonly IntakeGap[];
  conflicts: readonly EvidenceConflict[];
  projectUnderstanding: UnifiedProjectUnderstanding;
}): number {
  let score = input.unifiedIntakeConfidence;
  score += Math.min(10, input.projectUnderstanding.workflows.length * 3);
  score -= input.gaps.filter((g) => g.category === 'WORKFLOW' || g.category === 'SCREEN').length * 6;
  score -= input.gaps.filter((g) => g.category === 'BUSINESS_LOGIC').length * 5;
  score -= input.conflicts.length * 4;
  return clamp(score);
}

export function mapIntakeReadiness(category: IntakeReadinessCategory): IntakeReadiness {
  return category;
}

export function generateIntakeRecommendations(input: {
  evidence: ConsolidatedIntakeEvidence;
  gaps: readonly IntakeGap[];
  conflicts: readonly EvidenceConflict[];
}): IntakeRecommendation[] {
  const recommendations: IntakeRecommendation[] = [];
  let counter = 0;

  const push = (title: string, rationale: string, priority: IntakeRecommendation['priority'], gapEvidence: string[]) => {
    counter += 1;
    recommendations.push({
      readOnly: true,
      recommendationId: `intake-rec-${counter}`,
      title,
      rationale,
      priority,
      evidence: gapEvidence,
    });
  };

  for (const conflict of input.conflicts) {
    push(
      `Resolve ${conflict.conflictType.replace(/_/g, ' ').toLowerCase()}`,
      conflict.recommendedClarification,
      'CRITICAL',
      [...conflict.conflictingEvidence],
    );
  }

  for (const gap of input.gaps) {
    if (gap.category === 'SCREEN' && gap.description.includes('visual')) {
      push('Upload additional screenshots', gap.description, 'HIGH', [gap.gapId]);
    } else if (gap.category === 'WORKFLOW') {
      push('Provide workflow details', gap.description, 'HIGH', [gap.gapId]);
    } else if (gap.category === 'ROLE') {
      push('Clarify user roles', gap.description, 'HIGH', [gap.gapId]);
    } else if (gap.category === 'INTEGRATION' && /payment|stripe|paypal/i.test(gap.description)) {
      push('Clarify payment requirements', gap.description, 'HIGH', [gap.gapId]);
    } else if (gap.category === 'BUSINESS_LOGIC') {
      push('Define business rules and edge cases', gap.description, 'MEDIUM', [gap.gapId]);
    } else {
      push(`Address intake gap: ${gap.category.toLowerCase()}`, gap.description, 'MEDIUM', [gap.gapId]);
    }
  }

  if (input.evidence.uploadSummary && input.evidence.uploadSummary.imageUploads === 0) {
    push(
      'Upload visual references for UI validation',
      'Accepted uploads exist but no image references were provided.',
      'MEDIUM',
      ['NO_IMAGE_UPLOADS'],
    );
  }

  if (recommendations.length === 0) {
    push(
      'Validate unified understanding with founder review',
      'Intake evidence is coherent across sources.',
      'LOW',
      ['COHERENT_INTAKE'],
    );
  }

  const seen = new Set<string>();
  return recommendations.filter((r) => {
    const key = r.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}
