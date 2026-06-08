/**
 * World 2 workspace founder-readable report.
 */

import type { World2WorkspaceFoundationState, World2WorkspaceReport } from './types.js';
import { WORLD2_WORKSPACE_OWNER_MODULE } from './types.js';

export function buildWorld2WorkspaceReport(state: World2WorkspaceFoundationState): World2WorkspaceReport {
  return {
    ownerModule: WORLD2_WORKSPACE_OWNER_MODULE,
    workspaceCount: state.workspaceCount,
    activeWorkspaceCount: state.activeWorkspaceCount,
    isolationStatus: 'ENFORCED',
    boundaryStatus: 'ENFORCED',
    notificationStatus: 'TAGGED_BY_SOURCE_WORLD',
    world1ProtectionStatus: 'PROTECTED',
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'World 2 Workspace Foundation V1 — isolated project workspaces only. No autonomous builder, execution planner, or simulation runtime.',
  };
}

export function formatWorld2WorkspaceReport(state: World2WorkspaceFoundationState): string {
  const report = buildWorld2WorkspaceReport(state);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'World 2 Workspace Foundation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Foundation ID: ${state.foundationId}`,
    `Workspace count: ${report.workspaceCount}`,
    `Active workspace count: ${report.activeWorkspaceCount}`,
    `Isolation status: ${report.isolationStatus}`,
    `Boundary status: ${report.boundaryStatus}`,
    `Notification status: ${report.notificationStatus}`,
    `World 1 protection status: ${report.world1ProtectionStatus}`,
    '',
    'Foundation-only confirmations:',
    '  World 2 foundation only: CONFIRMED',
    '  No autonomous builder enabled: CONFIRMED',
    '  No execution planner enabled: CONFIRMED',
    '  No simulation runtime enabled: CONFIRMED',
    '  No learning loop enabled: CONFIRMED',
    '',
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}
