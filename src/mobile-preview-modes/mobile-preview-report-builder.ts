/**
 * Mobile Preview Report Builder — markdown report (V1).
 */

import { MOBILE_PREVIEW_MODES_V1_PASS, MOBILE_PREVIEW_MODES_REPORT_TITLE } from './mobile-preview-registry.js';
import type {
  MobilePreviewAnalysis,
  MobilePreviewHistoryEntry,
  MobilePreviewModesReport,
} from './mobile-preview-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildMobilePreviewModesReport(input: {
  analyses: readonly MobilePreviewAnalysis[];
  history: readonly MobilePreviewHistoryEntry[];
}): MobilePreviewModesReport {
  const latestAnalysis = input.analyses[0] ?? null;
  const readinessScores = input.history.map((e) => e.previewReadinessScore);
  const navScores = input.history.map((e) => e.navigationUsabilityScore);
  const average = (values: number[]) =>
    values.length === 0 ? 0 : Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalAnalyses: input.history.length,
    latestAnalysis,
    historySummary: {
      totalAnalyses: input.history.length,
      averagePreviewReadinessScore: average(readinessScores),
      averageNavigationUsabilityScore: average(navScores),
      readyForPreviewCount: input.history.filter((e) => e.mobilePreviewReadiness === 'READY_FOR_PREVIEW').length,
    },
  };
}

export function buildMobilePreviewModesReportMarkdown(
  report: MobilePreviewModesReport,
  analyses: readonly MobilePreviewAnalysis[] = report.latestAnalysis ? [report.latestAnalysis] : [],
): string {
  const lines: string[] = [
    `# ${MOBILE_PREVIEW_MODES_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total analyses: ${report.historySummary.totalAnalyses}`,
    `- Average preview readiness score: ${report.historySummary.averagePreviewReadinessScore}/100`,
    `- Average navigation usability score: ${report.historySummary.averageNavigationUsabilityScore}/100`,
    `- Ready for preview count: ${report.historySummary.readyForPreviewCount}`,
    '',
  ];

  for (const analysis of analyses) {
    lines.push('## Device Analysis', '');
    lines.push(`- Analysis ID: ${analysis.analysisId}`);
    lines.push(`- Source viewport: ${analysis.sourceViewportWidth ?? 'unknown'} x ${analysis.sourceViewportHeight ?? 'unknown'}`);
    lines.push(`- Profiles analyzed: ${analysis.deviceProfilesAnalyzed.length}`);
    lines.push(`- Preview readiness: ${analysis.mobilePreviewReadiness} (${analysis.previewReadinessScore}/100)`);
    lines.push(`- Confidence score: ${analysis.confidenceScore}/100`);
    lines.push('');

    lines.push('### Layout Behaviors', '');
    for (const behavior of analysis.previewLayoutBehaviors.slice(0, 6)) {
      lines.push(`- **${behavior.profileId}**: ${behavior.likelyLayoutBehavior}`);
      lines.push(`  - Navigation: ${behavior.navigationBehavior}`);
      lines.push(`  - Fit: ${behavior.screenFit}, Density: ${behavior.contentDensity}`);
    }
    if (analysis.previewLayoutBehaviors.length > 6) {
      lines.push(`- ... and ${analysis.previewLayoutBehaviors.length - 6} more profiles`);
    }
    lines.push('');

    lines.push('## Compatibility Findings', '');
    for (const compat of analysis.deviceCompatibility) {
      lines.push(`- **${compat.category}**: ${compat.deviceCompatibilityScore}/100`);
      for (const profile of compat.profileScores) {
        lines.push(`  - ${profile.profileId}: ${profile.score}/100 — ${profile.summary}`);
      }
    }
    lines.push('');

    lines.push('## Responsive Risks', '');
    lines.push(`- Overall risk level: ${analysis.responsiveRiskAnalysis.overallRiskLevel}`);
    lines.push(`- Risk count: ${analysis.responsiveRiskAnalysis.riskCount}`);
    if (analysis.responsiveRiskAnalysis.risks.length === 0) {
      lines.push('- none');
    } else {
      for (const risk of analysis.responsiveRiskAnalysis.risks) {
        lines.push(`- [${risk.severity}] ${risk.riskType} (${risk.profileId}): ${risk.description}`);
      }
    }
    lines.push('');

    lines.push('## Navigation Review', '');
    lines.push(`- Navigation usability score: ${analysis.navigationReview.navigationUsabilityScore}/100`);
    lines.push(`- Bottom navigation: ${analysis.navigationReview.bottomNavigationPresent ? 'yes' : 'no'}`);
    lines.push(`- Side navigation: ${analysis.navigationReview.sideNavigationPresent ? 'yes' : 'no'}`);
    lines.push(`- Menu complexity: ${analysis.navigationReview.menuComplexity}`);
    lines.push(`- Discoverability: ${analysis.navigationReview.discoverability}`);
    lines.push('- Findings:');
    lines.push(formatList(analysis.navigationReview.findings));
    lines.push('');

    lines.push('## Preview Readiness', '');
    lines.push(`- Category: ${analysis.previewReadinessCategory}`);
    lines.push(`- Score: ${analysis.previewReadinessScore}/100`);
    lines.push('');

    lines.push('## Recommendations', '');
    if (analysis.deviceRecommendations.length === 0) {
      lines.push('- none');
    } else {
      for (const rec of analysis.deviceRecommendations) {
        lines.push(`- ${rec.title} (${rec.confidence}%)`);
        lines.push(`  - ${rec.rationale}`);
        lines.push(`  - Expected impact: ${rec.expectedImpact}`);
        lines.push(`  - Targets: ${rec.targetCategories.join(', ')}`);
      }
    }
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${MOBILE_PREVIEW_MODES_V1_PASS}`, '');

  return lines.join('\n');
}
