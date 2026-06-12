/**
 * Adaptive AutoFix Intelligence — report builder.
 */

import { ADAPTIVE_AUTOFIX_REPORT_TITLE } from './adaptive-autofix-bounds.js';
import type { AdaptiveAutoFixAssessment } from './adaptive-autofix-types.js';

export function buildAdaptiveAutofixReportMarkdown(
  assessment: AdaptiveAutoFixAssessment,
  generatedAt: number,
): string {
  return `# ${ADAPTIVE_AUTOFIX_REPORT_TITLE}

Generated: ${new Date(generatedAt).toISOString()}

## Repeated Failure Analysis

Adaptive AutoFix Triggered: **${assessment.triggeredAdaptiveAutofix ? 'Yes — ADAPTIVE_AUTOFIX_REQUIRED' : 'No'}**

Repeated Failure Count: **${assessment.repeatedFailureCount}**

Adaptive AutoFix Score: **${assessment.adaptiveAutoFixScore}/100**

${assessment.failureRecords
  .slice(0, 5)
  .map(
    (record) =>
      `- **${record.failureCategory}** (${record.subsystem}) — ${record.rootCause} | attempts=${record.repeatedFailureCount}`,
  )
  .join('\n') || '- No repeated failure threshold reached in bounded analysis.'}

## Failure Categories

${assessment.failureCategories.map((category) => `- ${category}`).join('\n') || '- None recorded.'}

## Capability Gaps

Capability Gap Count: **${assessment.capabilityGapCount}**

${assessment.capabilityGaps
  .slice(0, 6)
  .map(
    (gap) =>
      `- **${gap.missingCapability}** (${gap.gapCategory}) — triggered by ${gap.failureCategory}`,
  )
  .join('\n') || '- No capability gaps detected.'}

## Missing Intelligence

${assessment.missingCapabilities.map((item) => `- ${item}`).join('\n') || '- None recorded.'}

## Evolution Recommendations

Evolution Required Count: **${assessment.evolutionRequiredCount}**

${assessment.recommendations
  .slice(0, 5)
  .map(
    (item, index) =>
      `${index + 1}. **[${item.implementationPriority}] ${item.missingCapability}** — ${item.expectedBenefit}\n   - Why current system failed: ${item.whyCurrentSystemFailed}\n   - Recommended authority: ${item.recommendedAuthority}\n   - Recommended validator: ${item.recommendedValidator}`,
  )
  .join('\n\n') || '1. No evolution recommendations required from bounded repeated-failure analysis.'}

## Expected Failure Reduction

Estimated Failure Reduction: **${assessment.estimatedFailureReduction}%**

Blocks Launch Readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

## Adaptive Readiness

Autofix Readiness: **${assessment.autofixReadiness}**

What capability is missing? Why are we failing repeatedly? What should be created next?

Do not repeat failed repair paths. Diagnose, evolve, then retry.
`;
}
