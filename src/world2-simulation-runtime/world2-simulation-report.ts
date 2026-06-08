/**
 * World 2 simulation runtime founder-readable report.
 */

import type {
  SimulationResult,
  World2SimulationReport,
  World2SimulationRuntimeState,
} from './types.js';
import { WORLD2_SIMULATION_RUNTIME_OWNER_MODULE } from './types.js';

export function buildWorld2SimulationReport(
  state: World2SimulationRuntimeState,
  simulation: SimulationResult,
): World2SimulationReport {
  return {
    ownerModule: WORLD2_SIMULATION_RUNTIME_OWNER_MODULE,
    simulationId: simulation.simulationId,
    workspaceId: simulation.workspaceId,
    projectId: simulation.projectId,
    planId: simulation.planId,
    stageCount: simulation.simulatedStages.length,
    riskCount: simulation.simulatedRisks.length,
    warningCount: simulation.simulatedWarnings.length,
    completionLikelihood: simulation.completionLikelihood,
    confidenceScore: simulation.confidenceScore,
    recommendationCount: simulation.recommendations.length,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'World 2 Simulation Runtime V1 — simulation only. No execution, file modification, or code generation.',
  };
}

export function formatWorld2SimulationReport(
  state: World2SimulationRuntimeState,
  simulation: SimulationResult,
): string {
  const report = buildWorld2SimulationReport(state, simulation);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'World 2 Simulation Runtime Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Runtime ID: ${state.runtimeId}`,
    `Simulation ID: ${report.simulationId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Plan ID: ${report.planId}`,
    `Stage count: ${report.stageCount}`,
    `Risk count: ${report.riskCount}`,
    `Warning count: ${report.warningCount}`,
    `Completion likelihood: ${report.completionLikelihood}`,
    `Confidence score: ${report.confidenceScore}`,
    `Recommendation count: ${report.recommendationCount}`,
    '',
    'Simulation-only confirmations:',
    '  Simulation only: CONFIRMED',
    '  No execution performed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No code generated: CONFIRMED',
    '',
    `Simulation ready: ${simulation.simulationReady ? 'YES' : 'NO'}`,
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}
