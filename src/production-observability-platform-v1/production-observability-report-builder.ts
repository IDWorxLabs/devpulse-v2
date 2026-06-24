/**
 * Production Observability Platform V1 — markdown report builder.
 */

import {
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN,
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_REPORT_TITLE,
} from './production-observability-platform-v1-bounds.js';
import type { ProductionObservabilityPlatformAssessment } from './production-observability-platform-v1-types.js';

export function buildProductionObservabilityPlatformV1ReportMarkdown(
  assessment: ProductionObservabilityPlatformAssessment,
): string {
  const appRows = assessment.applicationHealth
    .map(
      (a) =>
        `| ${a.applicationName} | ${a.status} | ${a.uptimePercent}% | ${a.errorRate}% | ${a.tenantId} |`,
    )
    .join('\n');

  return [
    `# ${PRODUCTION_OBSERVABILITY_PLATFORM_V1_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    'Production Observability Platform V1 enables continuous operational awareness of deployed customer applications — health, availability, incidents, and recovery recommendations after deployment.',
    '',
    `- Applications observed: ${assessment.applicationsObserved}`,
    `- Deployments tracked: ${assessment.deploymentsTracked}`,
    `- Open incidents: ${assessment.incidentRegistry.openIncidents}`,
    `- Availability score: ${assessment.availabilityAssessment.overallAvailabilityScore}/100 (${assessment.availabilityAssessment.availabilityRating})`,
    `- Tenant isolation: ${assessment.tenantIsolationProven ? 'PROVEN' : 'FAILED'}`,
    `- Commercialization: ${assessment.commercializationImpact.priorCommercializationScore} → ${assessment.commercializationImpact.projectedCommercializationScore}`,
    `- Proof status: ${assessment.observabilityProofStatus}`,
    '',
    '## Application Health',
    '',
    '| Application | Status | Uptime | Error Rate | Tenant |',
    '| --- | --- | --- | --- | --- |',
    appRows,
    '',
    '## Incidents',
    '',
    `- Total: ${assessment.incidentRegistry.totalIncidents} · Open: ${assessment.incidentRegistry.openIncidents} · Resolved: ${assessment.incidentRegistry.resolvedIncidents}`,
    `- Customer impact: ${assessment.incidentRegistry.customerImpactCount} customers`,
    '',
    '## Recovery Recommendations',
    '',
    ...assessment.recoveryRecommendations.map((r) => `- **${r.action}**: ${r.rationale.slice(0, 100)}`),
    '',
    '## Success Criteria',
    '',
    '| Question | Answer |',
    '| --- | --- |',
    `| Which applications are healthy? | ${assessment.applicationHealth.filter((a) => a.status === 'HEALTHY').length} healthy |`,
    `| Which deployments are healthy? | ${assessment.deploymentRegistry.filter((d) => d.deploymentHealth === 'HEALTHY').length} healthy |`,
    `| Which customers are impacted? | ${assessment.incidentRegistry.customerImpactCount} tracked |`,
    `| Which incidents are active? | ${assessment.incidentRegistry.openIncidents + assessment.incidentRegistry.escalatedIncidents} |`,
    `| Can production issues be detected? | ${assessment.incidentDetectionProven ? 'Yes' : 'No'} |`,
    `| Can recovery actions be recommended? | ${assessment.recoveryRecommendationsProven ? 'Yes' : 'No'} |`,
    '',
    '## Pass Token',
    '',
    assessment.passToken === PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN
      ? `\`${PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN}\``
      : assessment.passToken,
    '',
  ].join('\n');
}
