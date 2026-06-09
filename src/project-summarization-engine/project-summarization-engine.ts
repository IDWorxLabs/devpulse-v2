/**
 * Project Summarization Engine — orchestrates unified summaries from all intelligence sources.
 */

import { buildExecutiveSummary, buildFounderSummary } from './executive-summary-builder.js';
import { buildProjectHealthSummary, buildRiskSummary } from './project-health-builder.js';
import {
  buildAiOnboardingSummary,
  buildDependencySummary,
  buildMilestoneSummary,
  buildProjectStatusSummary,
  buildWorkspaceSummary,
} from './project-status-builder.js';
import { buildTechnicalSummary } from './technical-summary-builder.js';
import { compressProjectContext } from './project-context-compressor.js';
import {
  getProjectSummarizationDiagnostics,
  updateProjectSummarizationDiagnostics,
} from './project-summarization-diagnostics.js';
import { publishOperatorFeedStage } from '../operator-feed/index.js';
import {
  resolveSummaryType,
  type ProjectSummary,
  type SummarizationResult,
  type SummaryType,
} from './project-summarization-types.js';

function buildAllSummaries(ctx: ReturnType<typeof compressProjectContext>): ProjectSummary[] {
  return [
    buildExecutiveSummary(ctx),
    buildTechnicalSummary(ctx),
    buildProjectStatusSummary(ctx),
    buildProjectHealthSummary(ctx),
    buildAiOnboardingSummary(ctx),
    buildMilestoneSummary(ctx),
    buildRiskSummary(ctx),
    buildDependencySummary(ctx),
    buildWorkspaceSummary(ctx),
  ];
}

function selectSummaries(type: SummaryType, ctx: ReturnType<typeof compressProjectContext>): ProjectSummary[] {
  switch (type) {
    case 'EXECUTIVE':
      return [buildExecutiveSummary(ctx), buildFounderSummary(ctx)];
    case 'TECHNICAL':
      return [buildTechnicalSummary(ctx)];
    case 'PROJECT_STATUS':
      return [buildProjectStatusSummary(ctx)];
    case 'PROJECT_HEALTH':
      return [buildProjectHealthSummary(ctx)];
    case 'AI_ONBOARDING':
      return [buildAiOnboardingSummary(ctx)];
    case 'MILESTONE':
      return [buildMilestoneSummary(ctx)];
    case 'RISK':
      return [buildRiskSummary(ctx)];
    case 'DEPENDENCY':
      return [buildDependencySummary(ctx)];
    case 'WORKSPACE':
      return [buildWorkspaceSummary(ctx)];
    default:
      return buildAllSummaries(ctx);
  }
}

function composeResponse(query: string, summaries: ProjectSummary[], type: SummaryType): string {
  const lines: string[] = ['Project Summarization Engine Response', ''];
  const lower = query.toLowerCase();

  if (lower.includes('founder')) {
    const founder = summaries.find((s) => s.title === 'Founder Summary') ?? summaries[0];
    if (founder) {
      lines.push(founder.title);
      lines.push(founder.body);
    }
  } else {
    for (const summary of summaries) {
      lines.push(summary.title);
      lines.push(summary.body);
      lines.push('');
    }
  }

  lines.push(`Summary type: ${type}`);
  lines.push(`Confidence: ${summaries[0]?.confidence ?? 'MEDIUM'}`);
  lines.push(`Sources: ${summaries[0]?.sourceCount ?? 0}`);
  lines.push('');
  lines.push('Advisory only — intelligence compression, no execution or file modification.');
  return lines.join('\n').trim();
}

export function processProjectSummarizationRequest(query: string): SummarizationResult {
  publishOperatorFeedStage('Reading Summaries', 'project_summarization_engine', { query });
  const ctx = compressProjectContext(query);
  const requestedType = resolveSummaryType(query);
  const summaries = selectSummaries(requestedType, ctx);
  updateProjectSummarizationDiagnostics(query, summaries, requestedType);

  return {
    query,
    requestedType,
    summaries,
    context: ctx,
    responseText: composeResponse(query, summaries, requestedType),
  };
}

export function getProjectSummarizationContext(query: string): {
  result: SummarizationResult;
  diagnostics: ReturnType<typeof getProjectSummarizationDiagnostics>;
  latestExecutiveSummary: string;
  latestProjectHealth: string;
  latestMilestoneSummary: string;
  latestRiskSummary: string;
} {
  const result = processProjectSummarizationRequest(query);
  const exec = result.summaries.find((s) => s.summaryType === 'EXECUTIVE');
  const health = result.summaries.find((s) => s.summaryType === 'PROJECT_HEALTH');
  const milestone = result.summaries.find((s) => s.summaryType === 'MILESTONE');
  const risk = result.summaries.find((s) => s.summaryType === 'RISK');

  return {
    result,
    diagnostics: getProjectSummarizationDiagnostics(),
    latestExecutiveSummary: exec?.body ?? buildExecutiveSummary(result.context).body,
    latestProjectHealth: health?.body ?? buildProjectHealthSummary(result.context).body,
    latestMilestoneSummary: milestone?.body ?? buildMilestoneSummary(result.context).body,
    latestRiskSummary: risk?.body ?? buildRiskSummary(result.context).body,
  };
}
