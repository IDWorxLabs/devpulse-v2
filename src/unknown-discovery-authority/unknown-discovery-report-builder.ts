/**
 * Unknown Discovery Authority Report Builder.
 */

import { UNKNOWN_DISCOVERY_REPORT_TITLE } from './unknown-discovery-bounds.js';
import type { UnknownDiscoveryAssessment, UnknownDiscoveryCategory } from './unknown-discovery-types.js';

const CATEGORY_LABELS: Record<UnknownDiscoveryCategory, string> = {
  UNTESTED_USER_BEHAVIOR: 'Untested User Behavior',
  EDGE_CASE: 'Edge Cases',
  CONTRADICTION: 'Contradictions',
  COVERAGE_GAP: 'Coverage Gaps',
  ASSUMPTION_RISK: 'Assumption Risks',
  LAUNCH_BLIND_SPOT: 'Launch Blind Spots',
};

function sectionForCategory(assessment: UnknownDiscoveryAssessment, category: UnknownDiscoveryCategory): string {
  const findings = assessment.findings.filter((finding) => finding.category === category);
  if (!findings.length) return 'None detected.\n';
  return findings
    .map(
      (finding) =>
        `- **${finding.title}** [${finding.severity}]\n` +
        `  ${finding.description}\n` +
        `  Why it may be missed: ${finding.whyItMayBeMissed}\n` +
        `  Recommended test: ${finding.recommendedTest}\n` +
        `  Evidence: ${finding.evidence.join('; ') || 'None'}`,
    )
    .join('\n');
}

export function buildUnknownDiscoveryReportMarkdown(
  assessment: UnknownDiscoveryAssessment,
  generatedAt: number,
): string {
  const date = new Date(generatedAt).toISOString();
  const verdict =
    assessment.readinessState === 'LOW_UNKNOWN_RISK'
      ? 'Low unknown-risk pressure detected — this is not GO / NO GO.'
      : assessment.readinessState === 'MODERATE_UNKNOWN_RISK'
        ? 'Moderate unknown risks remain in blind spots not covered by current tests.'
        : assessment.readinessState === 'HIGH_UNKNOWN_RISK'
          ? 'High unknown risks suggest important untested failure modes remain.'
          : 'Critical unknown risks block safe launch understanding today.';

  return `# ${UNKNOWN_DISCOVERY_REPORT_TITLE}

Generated: ${date}
Blind-spot discovery — evidence-backed findings only

## Unknown Discovery Summary

Unknown discovery score: **${assessment.unknownDiscoveryScore}/100**

Findings: **${assessment.findingCount}**

Critical findings: **${assessment.criticalFindingCount}**

High findings: **${assessment.highFindingCount}**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **What failures have we not thought to test yet?**

## Untested User Behavior

${sectionForCategory(assessment, 'UNTESTED_USER_BEHAVIOR')}

## Edge Cases

${sectionForCategory(assessment, 'EDGE_CASE')}

## Contradictions

${sectionForCategory(assessment, 'CONTRADICTION')}

## Coverage Gaps

${sectionForCategory(assessment, 'COVERAGE_GAP')}

## Assumption Risks

${sectionForCategory(assessment, 'ASSUMPTION_RISK')}

## Launch Blind Spots

${sectionForCategory(assessment, 'LAUNCH_BLIND_SPOT')}

## Recommended New Tests

${assessment.recommendedTests.length ? assessment.recommendedTests.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. Expand bounded discovery tests for adjacent blind spots.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. The system must look for what its current tests may be missing.'}

## Unknown Discovery Verdict

${verdict}
`;
}
