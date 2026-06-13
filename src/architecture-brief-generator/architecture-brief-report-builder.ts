/**
 * Architecture Brief Report Builder — markdown generator report (V1).
 */

import {
  ARCHITECTURE_BRIEF_GENERATOR_REPORT_TITLE,
  ARCHITECTURE_BRIEF_GENERATOR_V1_PASS,
} from './architecture-brief-registry.js';
import type {
  ArchitectureBrief,
  ArchitectureBriefGeneratorReport,
  ArchitectureBriefHistoryEntry,
} from './architecture-brief-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildArchitectureBriefGeneratorReport(input: {
  briefs: readonly ArchitectureBrief[];
  history: readonly ArchitectureBriefHistoryEntry[];
}): ArchitectureBriefGeneratorReport {
  const latestBrief = input.briefs[0] ?? null;
  const confidences = input.history.map((e) => e.architectureBriefConfidence);
  const averageConfidence =
    confidences.length === 0 ? 0 : Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalBriefs: input.history.length,
    latestBrief,
    historySummary: {
      totalBriefs: input.history.length,
      averageConfidence,
      architectureReadyCount: input.history.filter((e) => e.architectureBriefReadiness === 'ARCHITECTURE_READY').length,
      highConfidenceCount: input.history.filter((e) => e.architectureBriefQuality === 'HIGH_CONFIDENCE').length,
    },
  };
}

export function buildArchitectureBriefGeneratorReportMarkdown(
  report: ArchitectureBriefGeneratorReport,
  briefs: readonly ArchitectureBrief[] = report.latestBrief ? [report.latestBrief] : [],
): string {
  const lines: string[] = [
    `# ${ARCHITECTURE_BRIEF_GENERATOR_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total briefs: ${report.historySummary.totalBriefs}`,
    `- Average confidence: ${report.historySummary.averageConfidence}/100`,
    `- Architecture ready count: ${report.historySummary.architectureReadyCount}`,
    `- High confidence count: ${report.historySummary.highConfidenceCount}`,
    '',
  ];

  for (const brief of briefs) {
    lines.push('## System Overview', '');
    lines.push(`- Brief ID: ${brief.briefId}`);
    lines.push(`- Planning brief ID: ${brief.planningBriefId}`);
    lines.push(`- Product type: ${brief.systemOverview.productType}`);
    lines.push(`- Objective: ${brief.systemOverview.objective}`);
    lines.push('- Platforms:');
    lines.push(formatList(brief.systemOverview.platforms));
    lines.push(`- Scale expectations: ${brief.systemOverview.scaleExpectations}`);
    lines.push('');

    lines.push('## Frontend Summary', '');
    lines.push(`- Web UI: ${brief.frontendSummary.webUi ? 'yes' : 'no'}`);
    lines.push(`- Mobile UI: ${brief.frontendSummary.mobileUi ? 'yes' : 'no'}`);
    lines.push(`- Tablet UI: ${brief.frontendSummary.tabletUi ? 'yes' : 'no'}`);
    lines.push(`- Desktop UI: ${brief.frontendSummary.desktopUi ? 'yes' : 'no'}`);
    lines.push('- Detected needs:');
    lines.push(formatList(brief.frontendSummary.detectedNeeds));
    lines.push('');

    lines.push('## Backend Summary', '');
    lines.push(`- APIs: ${brief.backendSummary.apis ? 'yes' : 'no'}`);
    lines.push(`- Business services: ${brief.backendSummary.businessServices ? 'yes' : 'no'}`);
    lines.push(`- Background jobs: ${brief.backendSummary.backgroundJobs ? 'yes' : 'no'}`);
    lines.push(`- Workflow orchestration: ${brief.backendSummary.workflowOrchestration ? 'yes' : 'no'}`);
    lines.push('- Detected needs:');
    lines.push(formatList(brief.backendSummary.detectedNeeds));
    lines.push('');

    lines.push('## Data Model Summary', '');
    lines.push('- Entities:');
    if (brief.dataModelSummary.entities.length === 0) {
      lines.push('- none');
    } else {
      for (const entity of brief.dataModelSummary.entities) {
        lines.push(`- ${entity.name}`);
      }
    }
    lines.push('- Relationships:');
    lines.push(formatList(brief.dataModelSummary.relationships));
    lines.push('- Ownership models:');
    lines.push(formatList(brief.dataModelSummary.ownershipModels));
    lines.push('');

    lines.push('## Integration Summary', '');
    if (brief.integrationSummary.integrations.length === 0) {
      lines.push('- none');
    } else {
      for (const integration of brief.integrationSummary.integrations) {
        lines.push(`- [${integration.category}] ${integration.name}`);
      }
    }
    lines.push('');

    lines.push('## Security Summary', '');
    lines.push('- Authentication:');
    lines.push(formatList(brief.securitySummary.authentication));
    lines.push('- Authorization:');
    lines.push(formatList(brief.securitySummary.authorization));
    lines.push('- User roles:');
    lines.push(formatList(brief.securitySummary.userRoles));
    lines.push('');

    lines.push('## Risk Analysis', '');
    lines.push(`- Overall risk level: ${brief.architectureRiskAnalysis.overallRiskLevel}`);
    lines.push(`- Risk count: ${brief.architectureRiskAnalysis.riskCount}`);
    if (brief.architectureRiskAnalysis.risks.length === 0) {
      lines.push('- none');
    } else {
      for (const risk of brief.architectureRiskAnalysis.risks) {
        lines.push(`- [${risk.severity}] ${risk.riskType}: ${risk.description}`);
      }
    }
    lines.push('');

    lines.push('## Confidence & Readiness', '');
    lines.push(`- Architecture brief confidence: ${brief.architectureBriefConfidence}/100`);
    lines.push(`- Architecture brief quality: ${brief.architectureBriefQuality}`);
    lines.push(`- Architecture brief readiness: ${brief.architectureBriefReadiness}`);
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${ARCHITECTURE_BRIEF_GENERATOR_V1_PASS}`, '');

  return lines.join('\n');
}
