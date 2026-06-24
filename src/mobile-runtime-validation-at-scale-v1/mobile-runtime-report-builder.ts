/**
 * Mobile Runtime Validation at Scale V1 — markdown report.
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
    `- Categories mobile-proven: ${assessment.categoriesMobileProven}/${assessment.categoriesValidated}`,
    `- Mobile pass rate: ${assessment.mobilePassRate}%`,
    `- Runtime profiles: ${assessment.runtimeProfilesValidated.join(', ')}`,
    `- World2 mobile executions: ${assessment.world2MobileExecutions}`,
    `- Touch interaction score: ${assessment.touchInteractionScore}/100`,
    `- Navigation score: ${assessment.navigationScore}/100`,
    `- Performance score: ${assessment.performanceScore}/100`,
    '',
    '## Category Results',
    '',
    ...assessment.categoryResults.map(
      (c) =>
        `- **${c.productName}** (${c.profile}) — ${c.mobileRuntimeProven ? 'MOBILE_PROVEN' : 'NOT_PROVEN'}`,
    ),
    '',
    '## Pass Token',
    '',
    assessment.passToken === MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN
      ? `Pass token: \`${MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN}\``
      : `Status: \`${assessment.passToken}\``,
    '',
  ].join('\n');
}
