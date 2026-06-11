/**
 * Gap Detection Authority Report Builder.
 */

import { GAP_DETECTION_REPORT_TITLE } from './gap-detection-bounds.js';
import type { GapDetectionAssessment, GapCategory } from './gap-detection-types.js';

const CATEGORY_LABELS: Record<GapCategory, string> = {
  CAPABILITY_GAPS: 'Capability Gaps',
  TRUST_GAPS: 'Trust Gaps',
  INTELLIGENCE_GAPS: 'Intelligence Gaps',
  READINESS_GAPS: 'Readiness Gaps',
  PRODUCT_GAPS: 'Product Gaps',
  DEPENDENCY_GAPS: 'Dependency Gaps',
};

function sectionForCategory(assessment: GapDetectionAssessment, category: GapCategory): string {
  const gaps = assessment.detectedGaps.filter((gap) => gap.category === category);
  if (!gaps.length) return 'None detected.\n';
  return gaps
    .map(
      (gap) =>
        `- **${gap.title}** [${gap.severity}] — impact ${gap.impact}\n` +
        `  ${gap.description}\n` +
        `  Evidence: ${gap.evidence.join('; ') || 'None'}\n` +
        `  Recommendations: ${gap.recommendations.join('; ') || 'None'}`,
    )
    .join('\n');
}

export function buildGapDetectionReportMarkdown(assessment: GapDetectionAssessment, generatedAt: number): string {
  const date = new Date(generatedAt).toISOString();
  const criticalGaps = assessment.detectedGaps.filter((gap) => gap.severity === 'CRITICAL');
  const verdict =
    assessment.readinessState === 'NO_CRITICAL_GAPS'
      ? 'No critical missing-capability gaps detected — this is not GO / NO GO.'
      : assessment.readinessState === 'GAPS_PRESENT'
        ? 'Missing capabilities are identified and should be addressed before launch confidence increases.'
        : assessment.readinessState === 'HIGH_RISK_GAPS'
          ? 'High-risk missing capabilities remain unresolved across user, trust, and readiness paths.'
          : 'Critical missing capabilities block safe launch understanding today.';

  return `# ${GAP_DETECTION_REPORT_TITLE}

Generated: ${date}
Missing-capability analysis — evidence-backed gaps only

## Gap Detection Summary

Gap detection score: **${assessment.gapDetectionScore}/100**

Total gaps: **${assessment.totalGaps}**

Critical gaps: **${assessment.criticalGapCount}**

High gaps: **${assessment.highGapCount}**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **What is missing that prevents success?**

## Capability Gaps

${sectionForCategory(assessment, 'CAPABILITY_GAPS')}

## Trust Gaps

${sectionForCategory(assessment, 'TRUST_GAPS')}

## Intelligence Gaps

${sectionForCategory(assessment, 'INTELLIGENCE_GAPS')}

## Readiness Gaps

${sectionForCategory(assessment, 'READINESS_GAPS')}

## Product Gaps

${sectionForCategory(assessment, 'PRODUCT_GAPS')}

## Dependency Gaps

${sectionForCategory(assessment, 'DEPENDENCY_GAPS')}

## Critical Gaps

${criticalGaps.length ? criticalGaps.map((gap) => `- **${gap.title}** — ${gap.description}`).join('\n') : '- None recorded.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. A problem is not understood until the missing capability causing it is identified.'}

## Gap Detection Verdict

${verdict}
`;
}
