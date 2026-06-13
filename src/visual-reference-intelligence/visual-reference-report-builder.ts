/**
 * Visual Reference Report Builder — markdown intelligence report (V1).
 */

import { VISUAL_REFERENCE_INTELLIGENCE_PASS_TOKEN, VISUAL_REFERENCE_INTELLIGENCE_REPORT_TITLE } from './visual-reference-registry.js';
import type {
  VisualReferenceAnalysis,
  VisualReferenceHistoryEntry,
  VisualReferenceIntelligenceReport,
} from './visual-reference-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildVisualReferenceIntelligenceReport(input: {
  analyses: readonly VisualReferenceAnalysis[];
  history: readonly VisualReferenceHistoryEntry[];
}): VisualReferenceIntelligenceReport {
  const latestAnalysis = input.analyses[0] ?? null;
  const byPlatform = {
    MOBILE: 0,
    WEB: 0,
    DESKTOP: 0,
    UNKNOWN: 0,
  } as Record<VisualReferenceHistoryEntry['platform'], number>;

  for (const entry of input.history) {
    byPlatform[entry.platform] += 1;
  }

  const completenessScores = input.history.map((e) => e.completenessScore);
  const confidenceScores = input.history.map((e) => e.confidenceScore);

  const average = (values: number[]) =>
    values.length === 0 ? 0 : Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalAnalyses: input.history.length,
    latestAnalysis,
    historySummary: {
      totalAnalyses: input.history.length,
      byPlatform,
      averageCompletenessScore: average(completenessScores),
      averageConfidenceScore: average(confidenceScores),
    },
  };
}

export function buildVisualReferenceIntelligenceReportMarkdown(
  report: VisualReferenceIntelligenceReport,
  analyses: readonly VisualReferenceAnalysis[] = report.latestAnalysis ? [report.latestAnalysis] : [],
): string {
  const lines: string[] = [
    `# ${VISUAL_REFERENCE_INTELLIGENCE_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total analyses: ${report.historySummary.totalAnalyses}`,
    `- Average completeness score: ${report.historySummary.averageCompletenessScore}/100`,
    `- Average confidence score: ${report.historySummary.averageConfidenceScore}/100`,
    `- Platform distribution: MOBILE=${report.historySummary.byPlatform.MOBILE}, WEB=${report.historySummary.byPlatform.WEB}, DESKTOP=${report.historySummary.byPlatform.DESKTOP}, UNKNOWN=${report.historySummary.byPlatform.UNKNOWN}`,
    '',
  ];

  for (const analysis of analyses) {
    lines.push('## Analysis Results', '');
    lines.push(`- Analysis ID: ${analysis.analysisId}`);
    lines.push(`- Upload ID: ${analysis.uploadId ?? 'direct-buffer'}`);
    lines.push(`- Filename: ${analysis.filename}`);
    lines.push(`- Analyzed at: ${analysis.analyzedAt}`);
    lines.push(`- Detected platform: ${analysis.screenDetection.platform}`);
    lines.push(`- Screen classification: ${analysis.screenDetection.classification}`);
    lines.push(`- Screen count estimate: ${analysis.screenDetection.screenCountEstimate}`);
    lines.push(`- Confidence score: ${analysis.confidenceScore}/100`);
    lines.push(`- Visual completeness score: ${analysis.completeness.visualCompletenessScore}/100`);
    lines.push('');

    lines.push('### Detected UI Structures', '');
    if (analysis.layoutRegions.length === 0) {
      lines.push('- none');
    } else {
      for (const region of analysis.layoutRegions) {
        lines.push(`- ${region.region} (${region.confidence}%): ${region.evidence.join(', ')}`);
      }
    }
    lines.push('');

    lines.push('### Component Evidence', '');
    if (analysis.detectedComponents.length === 0) {
      lines.push('- none');
    } else {
      for (const component of analysis.detectedComponents) {
        lines.push(`- ${component.token} (${component.confidence}%): ${component.evidence.join(', ')}`);
      }
    }
    lines.push('');

    lines.push('### Flow Summaries', '');
    if (analysis.inferredFlows.length === 0) {
      lines.push('- none');
    } else {
      for (const flow of analysis.inferredFlows) {
        lines.push(`- ${flow.flow} (${flow.confidence}%): ${flow.evidence.join(', ')}`);
      }
    }
    lines.push('');

    lines.push('### Completeness Findings', '');
    lines.push(`- Score: ${analysis.completeness.visualCompletenessScore}/100`);
    lines.push('- Missing screens:');
    lines.push(formatList(analysis.completeness.missingScreens));
    lines.push('- Incomplete flows:');
    lines.push(formatList(analysis.completeness.incompleteFlows));
    lines.push('- Navigation gaps:');
    lines.push(formatList(analysis.completeness.navigationGaps));
    lines.push('- UX risks:');
    lines.push(formatList(analysis.completeness.uxRisks));
    lines.push('');

    lines.push('### Recommendations', '');
    lines.push(formatList(analysis.recommendations));
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${VISUAL_REFERENCE_INTELLIGENCE_PASS_TOKEN}`, '');

  return lines.join('\n');
}
