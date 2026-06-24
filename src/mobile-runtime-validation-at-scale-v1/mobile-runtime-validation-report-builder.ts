/**
 * Mobile Runtime Validation at Scale V1 — markdown report builder.
 */

import {
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN,
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_REPORT_TITLE,
} from './mobile-runtime-validation-v1-bounds.js';
import type { MobileRuntimeValidationAssessment } from './mobile-runtime-validation-v1-types.js';

export function buildMobileRuntimeValidationAtScaleV1ReportMarkdown(
  assessment: MobileRuntimeValidationAssessment,
): string {
  return [
    `# ${MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    'Mobile Runtime Validation at Scale V1 proves generated applications function in mobile runtime profiles with touch interaction, navigation, workflow, and performance evidence.',
    '',
    `- Categories validated: ${assessment.categoriesValidated}`,
    `- Categories mobile-proven: ${assessment.categoriesMobileProven}`,
    `- Mobile pass rate: ${assessment.mobilePassRate}%`,
    `- Runtime profiles validated: ${assessment.runtimeProfilesValidated.join(', ')}`,
    `- World2 mobile executions: ${assessment.world2MobileExecutions}`,
    `- Mobile proof status: ${assessment.mobileProofStatus}`,
    '',
    '## Assessment Scores',
    '',
    `| Dimension | Score |`,
    `| --- | --- |`,
    `| Touch interaction | ${assessment.touchInteractionScore}/100 |`,
    `| Navigation | ${assessment.navigationScore}/100 |`,
    `| Performance | ${assessment.performanceScore}/100 |`,
    '',
    '## Category Results',
    '',
    ...assessment.categoryResults.map(
      (c) =>
        `- **${c.productName}** (${c.profile}) — ${c.mobileRuntimeProven ? 'MOBILE_PROVEN' : 'NOT_PROVEN'} — profiles: ${c.profilesValidated.join(', ') || 'none'}`,
    ),
    '',
    '## World2 Mobile Executions',
    '',
    ...assessment.world2Results.map(
      (w) =>
        `- **${w.productName}** (${w.profile}) — world ${w.worldId} — ${w.mobileRuntimeProven ? 'PASS' : 'FAIL'}`,
    ),
    '',
    '## UVL Integration',
    '',
    `- Mobile coverage: ${assessment.mobileVerificationEvidence.mobileCoveragePercent}%`,
    `- Verification confidence boost: +${assessment.mobileVerificationEvidence.verificationConfidenceBoost}`,
    '',
    '## Product Architect Integration',
    '',
    `- Mobile product readiness: ${assessment.mobileProductCoverage.mobileProductReadinessScore}/100`,
    `- Desktop-only assumptions: ${assessment.mobileProductCoverage.desktopOnlyAssumptions.length}`,
    '',
    '## Pass Token',
    '',
    assessment.passToken === MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN
      ? `Pass token: \`${MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN}\``
      : `Status: \`${assessment.passToken}\``,
    '',
  ].join('\n');
}
