/**
 * World 2 autonomous builder founder-readable report.
 */

import type {
  BuilderResult,
  World2AutonomousBuilderState,
  World2BuilderReport,
} from './types.js';
import { WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE } from './types.js';
import { getWorld1ProtectionStatus } from './world1-protection-engine.js';

export function buildWorld2BuilderReport(
  state: World2AutonomousBuilderState,
  result: BuilderResult,
): World2BuilderReport {
  return {
    ownerModule: WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE,
    builderId: result.builderId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    planId: result.planId,
    simulationId: result.simulationId,
    buildReadiness: result.buildReadiness,
    builderState: result.builderState,
    preparedActionCount: result.preparedActions.length,
    blockedActionCount: result.blockedActions.length,
    approvalRequirementCount: result.approvalRequirements.length,
    verificationRequirementCount: result.verificationRequirements.length,
    rollbackRequirementCount: result.rollbackRequirements.length,
    riskControlCount: result.riskControls.length,
    world1ProtectionStatus: getWorld1ProtectionStatus(result.world1ProtectionChecks),
    workspaceIsolationStatus: result.workspaceProtectionChecks.every((c) => c.status === 'PROTECTED')
      ? 'ISOLATED'
      : 'BOUNDARY_VIOLATION',
    recommendationCount: result.recommendations.length,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'World 2 Autonomous Builder Foundation V1 — dry-run foundation only. No execution, file modification, or code generation.',
  };
}

export function formatWorld2BuilderReport(
  state: World2AutonomousBuilderState,
  result: BuilderResult,
): string {
  const report = buildWorld2BuilderReport(state, result);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'World 2 Autonomous Builder Foundation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Foundation ID: ${state.foundationId}`,
    `Builder ID: ${report.builderId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Plan ID: ${report.planId}`,
    `Simulation ID: ${report.simulationId}`,
    `Build readiness: ${report.buildReadiness}`,
    `Builder state: ${report.builderState}`,
    `Prepared action count: ${report.preparedActionCount}`,
    `Blocked action count: ${report.blockedActionCount}`,
    `Approval requirement count: ${report.approvalRequirementCount}`,
    `Verification requirement count: ${report.verificationRequirementCount}`,
    `Rollback requirement count: ${report.rollbackRequirementCount}`,
    `Risk control count: ${report.riskControlCount}`,
    `World 1 protection status: ${report.world1ProtectionStatus}`,
    `Workspace isolation status: ${report.workspaceIsolationStatus}`,
    `Recommendation count: ${report.recommendationCount}`,
    '',
    'Dry-run foundation confirmations:',
    '  Dry-run foundation only: CONFIRMED',
    '  No World 1 changes performed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No commands executed: CONFIRMED',
    '  No code generated: CONFIRMED',
    '  No execution performed: CONFIRMED',
    '',
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}
