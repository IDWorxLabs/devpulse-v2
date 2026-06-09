/**
 * Project Summarization Engine diagnostics.
 */

import type {
  ProjectSummarizationDiagnostics,
  ProjectSummary,
  SummaryConfidence,
  SummaryType,
} from './project-summarization-types.js';

let diagnostics: ProjectSummarizationDiagnostics = {
  projectSummarizationActive: false,
  summaryCount: 0,
  lastSummaryType: null,
  lastSummaryConfidence: 'LOW',
  summarySourceCount: 0,
  lastSummarizationQuery: null,
};

export function getProjectSummarizationDiagnostics(): ProjectSummarizationDiagnostics {
  return { ...diagnostics };
}

export function updateProjectSummarizationDiagnostics(
  query: string,
  summaries: ProjectSummary[],
  primaryType: SummaryType,
): void {
  const primary = summaries.find((s) => s.summaryType === primaryType) ?? summaries[0];
  diagnostics = {
    projectSummarizationActive: true,
    summaryCount: summaries.length,
    lastSummaryType: primaryType,
    lastSummaryConfidence: primary?.confidence ?? 'MEDIUM',
    summarySourceCount: primary?.sourceCount ?? 0,
    lastSummarizationQuery: query,
  };
}

export function resetProjectSummarizationDiagnostics(): void {
  diagnostics = {
    projectSummarizationActive: false,
    summaryCount: 0,
    lastSummaryType: null,
    lastSummaryConfidence: 'LOW',
    summarySourceCount: 0,
    lastSummarizationQuery: null,
  };
}

export function projectSummarizationKey(): string {
  const d = diagnostics;
  return [
    String(d.projectSummarizationActive),
    String(d.summaryCount),
    d.lastSummaryType ?? 'none',
    d.lastSummaryConfidence,
    String(d.summarySourceCount),
  ].join('|');
}
