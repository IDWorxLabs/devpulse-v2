/**
 * Customer Operations Platform V1 — markdown report builder.
 */

import {
  CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN,
  CUSTOMER_OPERATIONS_PLATFORM_V1_REPORT_TITLE,
} from './customer-operations-platform-v1-bounds.js';
import type { CustomerOperationsPlatformAssessment } from './customer-operations-platform-v1-types.js';

export function buildCustomerOperationsPlatformV1ReportMarkdown(
  assessment: CustomerOperationsPlatformAssessment,
): string {
  const customerRows = assessment.customerRegistry
    .map(
      (c) =>
        `| ${c.organizationName} | ${c.status} | ${c.planType} | ${c.tenantId} | ${c.email} |`,
    )
    .join('\n');

  const projectRows = assessment.projectOwnership
    .slice(0, 8)
    .map(
      (p) =>
        `| ${p.projectName} | ${p.customerId} | ${p.tenantId} | ${p.buildHistoryCount} | ${p.world2HistoryCount} |`,
    )
    .join('\n');

  return [
    `# ${CUSTOMER_OPERATIONS_PLATFORM_V1_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    'Customer Operations Platform V1 transforms AiDevEngine from a proven software factory into a commercial platform that real customers can use — with identity, workspace, projects, usage history, and operational visibility per customer.',
    '',
    `- Customers registered: ${assessment.customersRegistered}`,
    `- Active tenants: ${assessment.tenantsActive}`,
    `- Projects registered: ${assessment.projectsRegistered}`,
    `- Tenant isolation: ${assessment.tenantIsolationProven ? 'PROVEN (0 violations)' : 'FAILED'}`,
    `- Onboarding activation rate: ${assessment.onboardingMetrics.activationRate}%`,
    `- Commercialization score: ${assessment.commercializationImpact.priorCommercializationScore} → ${assessment.commercializationImpact.projectedCommercializationScore}`,
    `- Platform proof status: ${assessment.platformProofStatus}`,
    '',
    '## Customer Registry',
    '',
    '| Organization | Status | Plan | Tenant | Email |',
    '| --- | --- | --- | --- | --- |',
    customerRows,
    '',
    '## Project Ownership',
    '',
    '| Project | Customer | Tenant | Builds | World2 |',
    '| --- | --- | --- | --- | --- |',
    projectRows,
    '',
    '## Onboarding Metrics',
    '',
    `- Completion: ${assessment.onboardingMetrics.completionPercent}%`,
    `- Activation rate: ${assessment.onboardingMetrics.activationRate}%`,
    `- Time to first project: ${assessment.onboardingMetrics.averageTimeToFirstProjectHours}h avg`,
    '',
    '## Subscription Plans',
    '',
    ...assessment.subscriptionPlans.map(
      (p) =>
        `- **${p.planType}**: ${p.monthlyProjectLimit} projects, ${p.monthlyBuildLimit} builds/mo, upgrade → ${p.upgradePath ?? 'none'}`,
    ),
    '',
    '## Tenant Isolation',
    '',
    `- Violations: ${assessment.tenantIsolation.isolationViolations}`,
    `- Checks: ${assessment.tenantIsolation.checksPerformed.join(', ')}`,
    '',
    '## Success Criteria',
    '',
    '| Question | Answer |',
    '| --- | --- |',
    `| Can customers use the platform? | ${assessment.onboardingProven ? 'Yes' : 'Partial'} |`,
    `| Can customers own projects? | ${assessment.projectOwnershipProven ? 'Yes' : 'No'} |`,
    `| Can customers be isolated? | ${assessment.tenantIsolationProven ? 'Yes' : 'No'} |`,
    `| Can usage be tracked? | ${assessment.usageTrackingProven ? 'Yes' : 'No'} |`,
    `| Can plans and quotas exist? | ${assessment.subscriptionReadinessProven ? 'Yes' : 'No'} |`,
    `| Can customer operations be managed? | ${assessment.platformProofStatus === 'PROVEN' ? 'Yes' : 'Partial'} |`,
    '',
    '## Pass Token',
    '',
    assessment.passToken === CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN
      ? `\`${CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN}\``
      : assessment.passToken,
    '',
  ].join('\n');
}
