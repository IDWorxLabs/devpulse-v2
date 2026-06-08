/**
 * Action preparation engine — prepares proposed build actions only.
 * Dry-run foundation. No file modification, command execution, or code generation.
 */

import type { ExecutionStage } from '../world2-execution-planner/types.js';
import type { BlockedAction, BuildReadiness, BuilderInput, PreparedAction } from './types.js';
import { APPROVAL_REQUIRED_ACTION_TYPES } from './types.js';

const STAGE_ACTION_MAP: Array<{
  stageType: ExecutionStage['stageType'];
  actionType: PreparedAction['actionType'];
  pathSuffix: string;
  description: string;
}> = [
  { stageType: 'DISCOVERY', actionType: 'UPDATE_PROJECT_MEMORY_PROPOSED', pathSuffix: 'memory/discovery.md', description: 'Proposed project memory update from discovery' },
  { stageType: 'ARCHITECTURE', actionType: 'CREATE_FILE_PROPOSED', pathSuffix: 'src/architecture.md', description: 'Proposed architecture document creation' },
  { stageType: 'IMPLEMENTATION', actionType: 'CREATE_FILE_PROPOSED', pathSuffix: 'src/index.ts', description: 'Proposed implementation file creation' },
  { stageType: 'IMPLEMENTATION', actionType: 'MODIFY_FILE_PROPOSED', pathSuffix: 'src/index.ts', description: 'Proposed implementation file modification' },
  { stageType: 'VERIFICATION', actionType: 'CREATE_TEST_PROPOSED', pathSuffix: 'tests/verify.test.ts', description: 'Proposed test file creation' },
  { stageType: 'VERIFICATION', actionType: 'RUN_VERIFICATION_PROPOSED', pathSuffix: 'tests/verify.test.ts', description: 'Proposed verification run (dry-run only)' },
  { stageType: 'STABILIZATION', actionType: 'CREATE_ROLLBACK_POINT_PROPOSED', pathSuffix: 'checkpoints/stabilization', description: 'Proposed rollback checkpoint creation' },
  { stageType: 'COMPLETION', actionType: 'UPDATE_WORKSPACE_STATE_PROPOSED', pathSuffix: 'workspace/state.json', description: 'Proposed workspace state update' },
];

function requiresApproval(actionType: PreparedAction['actionType']): boolean {
  return (APPROVAL_REQUIRED_ACTION_TYPES as readonly string[]).includes(actionType);
}

function workspacePath(projectId: string, suffix: string): string {
  return `world2/${projectId}/${suffix}`;
}

export function prepareProposedActions(
  input: BuilderInput,
  readiness: BuildReadiness,
): { prepared: PreparedAction[]; blocked: BlockedAction[] } {
  const prepared: PreparedAction[] = [];
  const blocked: BlockedAction[] = [];
  const stageTypes = new Set(input.executionStages.map((s) => s.stageType));

  let actionIndex = 0;

  for (const mapping of STAGE_ACTION_MAP) {
    if (!stageTypes.has(mapping.stageType)) continue;

    actionIndex += 1;
    const actionId = `world2-action-${actionIndex.toString().padStart(4, '0')}`;

    if (readiness === 'NOT_READY') {
      blocked.push({
        actionId,
        actionType: mapping.actionType,
        stageType: mapping.stageType,
        description: mapping.description,
        blockReason: 'Build readiness NOT_READY — action blocked until simulation and governance gates pass',
      });
      continue;
    }

    prepared.push({
      actionId,
      actionType: mapping.actionType,
      stageType: mapping.stageType,
      description: mapping.description,
      targetPath: workspacePath(input.projectId, mapping.pathSuffix),
      requiresApproval: requiresApproval(mapping.actionType),
      dryRunOnly: true,
      executed: false,
    });
  }

  if (input.executionStages.some((s) => s.stageType === 'IMPLEMENTATION')) {
    actionIndex += 1;
    const depAction: PreparedAction = {
      actionId: `world2-action-${actionIndex.toString().padStart(4, '0')}`,
      actionType: 'INSTALL_DEPENDENCY_PROPOSED',
      stageType: 'IMPLEMENTATION',
      description: 'Proposed dependency installation (dry-run only)',
      targetPath: workspacePath(input.projectId, 'package.json'),
      requiresApproval: true,
      dryRunOnly: true,
      executed: false,
    };

    if (readiness === 'NOT_READY') {
      blocked.push({
        actionId: depAction.actionId,
        actionType: depAction.actionType,
        stageType: depAction.stageType,
        description: depAction.description,
        blockReason: 'Build readiness NOT_READY — dependency proposal blocked',
      });
    } else {
      prepared.push(depAction);
    }
  }

  return { prepared, blocked };
}

export function preparedActionsKey(actions: PreparedAction[]): string {
  return actions
    .map((a) => `${a.actionType}|${a.stageType}|${a.targetPath}|${a.requiresApproval}`)
    .join(';');
}

export function blockedActionsKey(actions: BlockedAction[]): string {
  return actions.map((a) => `${a.actionType}|${a.stageType}|${a.blockReason.length}`).join(';');
}
