/**
 * Self-Awareness Authority Report Builder.
 */

import { SELF_AWARENESS_REPORT_TITLE } from './self-awareness-bounds.js';
import type { SelfAwarenessAssessment, SelfAwarenessScenarioCategory } from './self-awareness-types.js';

const CATEGORY_LABELS: Record<SelfAwarenessScenarioCategory, string> = {
  CAPABILITY_AWARENESS: 'Capability Awareness',
  LIMITATION_AWARENESS: 'Limitation Awareness',
  DEPENDENCY_AWARENESS: 'Dependency Awareness',
  LAUNCH_AWARENESS: 'Launch Awareness',
  EVIDENCE_AWARENESS: 'Evidence Awareness',
  REALITY_AWARENESS: 'Reality Awareness',
};

function sectionForCategory(assessment: SelfAwarenessAssessment, category: SelfAwarenessScenarioCategory): string {
  const scenarios = assessment.scenarioResults.filter((scenario) => scenario.category === category);
  if (!scenarios.length) return 'None evaluated.\n';
  return scenarios
    .map(
      (scenario) =>
        `- Score ${scenario.score}/100 | passed ${scenario.passed ? 'Yes' : 'No'}\n` +
        `  Findings: ${scenario.findings.join('; ') || 'None'}\n` +
        `  Limitations: ${scenario.limitations.join('; ') || 'None'}`,
    )
    .join('\n');
}

export function buildSelfAwarenessReportMarkdown(assessment: SelfAwarenessAssessment, generatedAt: number): string {
  const date = new Date(generatedAt).toISOString();
  const verdict =
    assessment.readinessState === 'SELF_AWARE'
      ? 'The system demonstrates operational self-awareness about its capabilities, limits, and state — this is not consciousness or GO / NO GO.'
      : assessment.readinessState === 'PARTIALLY_AWARE'
        ? 'The system partially understands its own reality, but important limitations or blockers need clearer reporting.'
        : assessment.readinessState === 'LIMITED_AWARENESS'
          ? 'The system has limited self-awareness and may overstate readiness or under-report constraints.'
          : 'Critical self-awareness failures block safe reliance on the system’s own readiness understanding.';

  return `# ${SELF_AWARENESS_REPORT_TITLE}

Generated: ${date}
Operational self-awareness evaluation — not consciousness, sentience, or subjective awareness

## Self-Awareness Summary

Self-awareness score: **${assessment.selfAwarenessScore}/100**

Self-awareness risk score: **${assessment.selfAwarenessRiskScore}/100**

Critical awareness failures: **${assessment.criticalAwarenessFailures}**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **Does the system understand itself accurately?**

## Capability Awareness

${sectionForCategory(assessment, 'CAPABILITY_AWARENESS')}

## Limitation Awareness

${sectionForCategory(assessment, 'LIMITATION_AWARENESS')}

## Dependency Awareness

${sectionForCategory(assessment, 'DEPENDENCY_AWARENESS')}

## Launch Awareness

${sectionForCategory(assessment, 'LAUNCH_AWARENESS')}

## Evidence Awareness

${sectionForCategory(assessment, 'EVIDENCE_AWARENESS')}

## Reality Awareness

${sectionForCategory(assessment, 'REALITY_AWARENESS')}

## Critical Awareness Failures

${assessment.criticalAwarenessFailureDetails.length ? assessment.criticalAwarenessFailureDetails.map((item) => `- ${item}`).join('\n') : '- None recorded.'}

## Known Limitations

${assessment.limitations.length ? assessment.limitations.map((item) => `- ${item}`).join('\n') : '- None recorded.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. A system cannot be trusted to judge readiness if it does not accurately understand its own reality.'}

## Self-Awareness Verdict

${verdict}
`;
}
