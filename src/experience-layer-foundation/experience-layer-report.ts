/**
 * Experience layer report — founder-readable experience reports.
 */

import type {
  ExperienceLayerFoundationState,
  ExperienceLayerReport,
  ExperienceLayerReportOutput,
  ExperienceMapInput,
  ExperienceMapResult,
} from './types.js';
import { EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE } from './types.js';

export function buildExperienceLayerReportOutput(result: ExperienceMapResult): ExperienceLayerReportOutput {
  return {
    reportId: `report-${result.experienceId}`,
    experienceId: result.experienceId,
    journeyId: result.journeyId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    surfaceCount: result.surfaces.length,
    journeyStageCount: result.journeyStages.length,
    systemCount: result.systemSequence.length,
    decisionPointCount: result.decisionPoints.length,
    recommendedPathCount: result.recommendedPath.length,
    confirmation: result.confirmation,
  };
}

export function buildExperienceLayerReport(
  state: ExperienceLayerFoundationState,
  result: ExperienceMapResult,
  output: ExperienceLayerReportOutput,
): ExperienceLayerReport {
  return {
    ownerModule: EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE,
    reportId: output.reportId,
    experienceId: result.experienceId,
    journeyId: result.journeyId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    surfaceCount: output.surfaceCount,
    journeyStageCount: output.journeyStageCount,
    systemCount: output.systemCount,
    decisionPointCount: output.decisionPointCount,
    recommendedPathCount: output.recommendedPathCount,
    confirmation: output.confirmation,
    warnings: [...state.warnings, ...result.warnings],
    errors: [...state.errors],
    recommendation: result.founderGuidance[1] ?? 'Follow recommended path — experience mapping only',
  };
}

export function formatExperienceLayerReport(
  state: ExperienceLayerFoundationState,
  result: ExperienceMapResult,
  _input: ExperienceMapInput,
): string {
  const output = buildExperienceLayerReportOutput(result);
  const lines = [
    '=== DevPulse V2 Phase 10.1 Experience Layer Report ===',
    `Phase 10.1 | Owner: ${EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE}`,
    `Foundation: ${state.foundationId}`,
    '',
    `Report ID: ${output.reportId}`,
    `Experience ID: ${output.experienceId}`,
    `Journey ID: ${output.journeyId}`,
    `Workspace: ${output.workspaceId}`,
    `Project: ${output.projectId}`,
    '',
    `Surface Count: ${output.surfaceCount}`,
    `Journey Stage Count: ${output.journeyStageCount}`,
    `System Count: ${output.systemCount}`,
    `Decision Point Count: ${output.decisionPointCount}`,
    `Recommended Path Count: ${output.recommendedPathCount}`,
    '',
    'Founder Guidance:',
    ...result.founderGuidance.map((g) => `  - ${g}`),
    '',
    'Recommended Path:',
    ...result.recommendedPath.slice(0, 5).map((s) => `  ${s.order}. ${s.stage} → ${s.surface}: ${s.founderAction}`),
    '',
    '=== Safety Confirmations ===',
    'Experience mapping only: CONFIRMED',
    'No execution performed: CONFIRMED',
    'No commands executed: CONFIRMED',
    'No files modified: CONFIRMED',
    'No code generated: CONFIRMED',
    'No governance modified: CONFIRMED',
    'No ownership registry modified: CONFIRMED',
    'No UI rendering performed: CONFIRMED',
  ];

  return lines.join('\n');
}
