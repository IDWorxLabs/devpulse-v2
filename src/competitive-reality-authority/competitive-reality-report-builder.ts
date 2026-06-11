/**
 * Competitive Reality Authority Report Builder.
 */

import { COMPETITIVE_REALITY_REPORT_TITLE } from './competitive-reality-bounds.js';
import type { CompetitiveComparisonCategory, CompetitiveRealityAssessment } from './competitive-reality-types.js';

const CATEGORY_LABELS: Record<CompetitiveComparisonCategory, string> = {
  GENERAL_AI_COMPARISON: 'General AI Comparison',
  CODING_ASSISTANT_COMPARISON: 'Coding Assistant Comparison',
  APP_BUILDER_COMPARISON: 'App Builder Comparison',
  AUTONOMOUS_AGENT_COMPARISON: 'Autonomous Agent Comparison',
  MANUAL_WORKFLOW_COMPARISON: 'Manual Workflow Comparison',
};

function sectionForCategory(assessment: CompetitiveRealityAssessment, category: CompetitiveComparisonCategory): string {
  const findings = assessment.findings.filter((finding) => finding.category === category);
  if (!findings.length) return 'None evaluated.\n';
  return findings
    .map(
      (finding) =>
        `- **${finding.finding}** [${finding.differentiationLevel}]\n` +
        `  Evidence: ${finding.evidence.join('; ') || 'None'}\n` +
        `  Risk: ${finding.risk}\n` +
        `  Recommendation: ${finding.recommendation}`,
    )
    .join('\n');
}

export function buildCompetitiveRealityReportMarkdown(
  assessment: CompetitiveRealityAssessment,
  generatedAt: number,
): string {
  const date = new Date(generatedAt).toISOString();
  const verdict =
    assessment.readinessState === 'STRONGLY_DIFFERENTIATED'
      ? 'Strong evidence-backed differentiation exists — this is not GO / NO GO.'
      : assessment.readinessState === 'DIFFERENTIATED'
        ? 'Differentiation is evidenced but competitive risks remain.'
        : assessment.readinessState === 'WEAKLY_DIFFERENTIATED'
          ? 'Differentiation is weak and the product may appear replaceable.'
          : assessment.readinessState === 'COMMODITIZED'
            ? 'The product risks being perceived as commoditized versus alternatives.'
            : 'Differentiation is not proven enough to answer why users should choose AiDevEngine.';

  return `# ${COMPETITIVE_REALITY_REPORT_TITLE}

Generated: ${date}
Competitive differentiation evaluation — evidence-backed only

## Competitive Reality Summary

Competitive reality score: **${assessment.competitiveRealityScore}/100**

Differentiation score: **${assessment.differentiationScore}/100**

Competitive risk score: **${assessment.competitiveRiskScore}/100**

Unique advantages: **${assessment.uniqueAdvantageCount}**

Weak differentiation findings: **${assessment.weakDifferentiationCount}**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **Why would a rational user choose this instead of another solution?**

## General AI Comparison

${sectionForCategory(assessment, 'GENERAL_AI_COMPARISON')}

## Coding Assistant Comparison

${sectionForCategory(assessment, 'CODING_ASSISTANT_COMPARISON')}

## App Builder Comparison

${sectionForCategory(assessment, 'APP_BUILDER_COMPARISON')}

## Autonomous Agent Comparison

${sectionForCategory(assessment, 'AUTONOMOUS_AGENT_COMPARISON')}

## Manual Workflow Comparison

${sectionForCategory(assessment, 'MANUAL_WORKFLOW_COMPARISON')}

## Unique Advantages

${assessment.uniqueAdvantages.length ? assessment.uniqueAdvantages.map((item) => `- ${item}`).join('\n') : '- None proven with strong evidence.'}

## Competitive Risks

${assessment.competitiveRisks.length ? assessment.competitiveRisks.map((risk) => `- ${risk}`).join('\n') : '- None recorded.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. If the product cannot prove why users should choose it, differentiation is only an assumption.'}

## Competitive Reality Verdict

${verdict}
`;
}
