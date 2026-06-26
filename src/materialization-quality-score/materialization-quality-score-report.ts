/**
 * Materialization Quality Score V1 — founder-facing report and chat summary.
 */

import type {
  MaterializationQualityScore,
  MaterializationQualityScoreEvidence,
} from './materialization-quality-score-types.js';

export function buildMaterializationQualityScoreReport(score: MaterializationQualityScore): string {
  const lines = [
    `Materialization Score: ${score.overallScore}%`,
    `Verdict: ${score.verdict}`,
    '',
    'Breakdown:',
    ...score.categories.map(
      (category) => `- ${category.label}: ${category.score}% (${category.status})`,
    ),
  ];

  if (score.strengths.length > 0) {
    lines.push('', 'Strengths:', ...score.strengths.map((item) => `- ${item}`));
  }

  if (score.gaps.length > 0) {
    lines.push('', 'Missing:', ...score.gaps.map((item) => `- ${item}`));
  }

  if (score.recommendedNextActions.length > 0) {
    lines.push('', 'Recommended next actions:', ...score.recommendedNextActions.map((item) => `- ${item}`));
  }

  return lines.join('\n');
}

export function buildMaterializationQualityChatSummary(
  evidence: MaterializationQualityScoreEvidence | null,
): string | null {
  if (!evidence || evidence.materializationQualityScore <= 0) return null;

  const strengths =
    evidence.materializationQualityStrengths.length > 0
      ? evidence.materializationQualityStrengths.join(', ')
      : evidence.materializationQualityCategories
          .filter((category) => category.score >= 90)
          .map((category) => category.label.toLowerCase())
          .join(', ');

  const gaps =
    evidence.materializationQualityGaps.length > 0
      ? evidence.materializationQualityGaps.join(' and ')
      : 'no major gaps detected';

  return [
    `This app scored ${evidence.materializationQualityScore}% materialization quality.`,
    strengths
      ? `The strongest areas are ${strengths}.`
      : 'Review the category breakdown for strongest areas.',
    `The remaining gaps are ${gaps}.`,
  ].join('\n\n');
}

export function materializationQualityEvidenceForChat(
  evidence: MaterializationQualityScoreEvidence | null,
): Record<string, unknown> | null {
  if (!evidence) return null;
  return {
    readOnly: true,
    source: 'materialization_quality_score',
    overallScore: evidence.materializationQualityScore,
    verdict: evidence.materializationQualityVerdict,
    strengths: evidence.materializationQualityStrengths,
    gaps: evidence.materializationQualityGaps,
    criticalFailures: evidence.materializationQualityCriticalFailures,
    categories: evidence.materializationQualityCategories.map((category) => ({
      id: category.id,
      label: category.label,
      score: category.score,
      status: category.status,
      reasons: category.reasons,
      missingEvidence: category.missingEvidence,
    })),
    scoreArtifactPath: evidence.materializationQualityScorePath,
    persistentScoreArtifactPath: evidence.materializationQualityPersistentScorePath,
    chatSummary: buildMaterializationQualityChatSummary(evidence),
  };
}
