/**
 * Multi Project Foundation — single-project coordination.
 */

import type { MultiProjectRecord, MultiProjectState, RegisterProjectInput } from './multi-project-types.js';
import { registerProject, getProject, updateProjectRecord } from './project-registry.js';
import { updateProjectState } from './project-state-manager.js';
import { storeProjectContext, getProjectContext } from './project-context-manager.js';
import { recordProjectEvent } from './project-history-manager.js';
import { evaluateProjectLifecycle } from './project-lifecycle-manager.js';
import { validateProjectIsolation } from './project-isolation-policy.js';
import { getWorkspace } from './project-workspace-mapper.js';

export interface CoordinateProjectResult {
  record: MultiProjectRecord;
  lifecycle: ReturnType<typeof evaluateProjectLifecycle>;
  isolation: ReturnType<typeof validateProjectIsolation>;
}

export function coordinateProject(input: RegisterProjectInput): CoordinateProjectResult {
  const record = registerProject(input);

  storeProjectContext(record.projectId, {
    planningContext: { initialized: true },
    strategyContext: {},
    verificationContext: {},
    completionContext: {},
  });

  recordProjectEvent(record.projectId, 'CREATION', `Project ${record.projectName} created`);

  const lifecycle = evaluateProjectLifecycle(record);
  const isolation = validateProjectIsolation(record.projectId, record.projectId);

  return { record, lifecycle, isolation };
}

export function coordinateProjectStateChange(
  projectId: string,
  newState: MultiProjectState,
): { ok: true; record: MultiProjectRecord } | { ok: false; error: string } {
  const record = getProject(projectId);
  if (!record) {
    return { ok: false, error: `Project ${projectId} not found` };
  }

  const transition = updateProjectState(record, newState);
  if (!transition.ok) {
    return transition;
  }

  updateProjectRecord(transition.record);
  recordProjectEvent(projectId, 'STATE_CHANGE', `State changed to ${newState}`);

  return { ok: true, record: transition.record };
}

export function getCoordinatedProjectSummary(projectId: string): {
  record: MultiProjectRecord;
  workspaceId: string | undefined;
  contextPresent: boolean;
  lifecycle: ReturnType<typeof evaluateProjectLifecycle>;
} | undefined {
  const record = getProject(projectId);
  if (!record) return undefined;

  return {
    record,
    workspaceId: getWorkspace(projectId),
    contextPresent: getProjectContext(projectId) !== undefined,
    lifecycle: evaluateProjectLifecycle(record),
  };
}
