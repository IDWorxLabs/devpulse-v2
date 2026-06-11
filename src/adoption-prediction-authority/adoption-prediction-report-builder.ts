/**
 * Adoption Prediction Authority Report Builder.
 */

import { ADOPTION_PREDICTION_REPORT_TITLE } from './adoption-prediction-bounds.js';
import type { AdoptionPredictionAssessment } from './adoption-prediction-types.js';

function sectionForPrefix(assessment: AdoptionPredictionAssessment, prefix: string): string {
  const lines = assessment.findings.filter((finding) => finding.startsWith(`[${prefix}]`));
  if (!lines.length) return '- None recorded.\n';
  return lines.map((line) => `- ${line.replace(/^\[[^\]]+\]\s*/, '')}`).join('\n');
}

export function buildAdoptionPredictionReportMarkdown(
  assessment: AdoptionPredictionAssessment,
  generatedAt: number,
): string {
  const date = new Date(generatedAt).toISOString();
  const verdict =
    assessment.readinessState === 'HIGH_ADOPTION_PROBABILITY'
      ? 'Evidence suggests continued usage is likely — this is a prediction, not observed user behavior.'
      : assessment.readinessState === 'BLOCKED'
        ? 'Adoption predictions block expanded launch exposure.'
        : assessment.readinessState === 'HIGH_ABANDONMENT_RISK'
          ? 'Abandonment risk is elevated based on existing authority evidence.'
          : assessment.evidenceConfidenceScore < 50
            ? 'Low evidence confidence — do not treat predictions as facts.'
            : 'Adoption outlook is mixed; monitor retention and abandonment signals closely.';

  return `# ${ADOPTION_PREDICTION_REPORT_TITLE}

Generated: ${date}
Adoption prediction — evidence-derived forecasts only

## Adoption Prediction Summary

Adoption prediction score: **${assessment.adoptionPredictionScore}/100**

Retention prediction score: **${assessment.retentionPredictionScore}/100**

Recommendation prediction score: **${assessment.recommendationPredictionScore}/100**

Abandonment risk score: **${assessment.abandonmentRiskScore}/100**

Growth potential score: **${assessment.growthPotentialScore}/100**

Evidence confidence score: **${assessment.evidenceConfidenceScore}/100**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **If users experience this product today, what is likely to happen next?**

## Retention Prediction

${sectionForPrefix(assessment, 'RETENTION')}

## Recommendation Prediction

${sectionForPrefix(assessment, 'RECOMMENDATION')}

## Adoption Friction

${sectionForPrefix(assessment, 'FRICTION')}

## Growth Potential

${sectionForPrefix(assessment, 'GROWTH')}

## Abandonment Risk

${sectionForPrefix(assessment, 'ABANDONMENT')}

## Evidence Confidence

${sectionForPrefix(assessment, 'CONFIDENCE')}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. Launch readiness is not only about whether users succeed today, but whether they are likely to keep succeeding tomorrow.'}

## Adoption Prediction Verdict

${verdict}
`;
}
