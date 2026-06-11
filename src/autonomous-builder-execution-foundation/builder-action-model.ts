/**
 * Builder action model — planned executable actions (Phase 24B).
 */

export type BuilderActionType =
  | 'CREATE_FILE'
  | 'MODIFY_FILE'
  | 'DELETE_FILE'
  | 'CREATE_FOLDER'
  | 'UPDATE_CONFIGURATION'
  | 'INSTALL_DEPENDENCY'
  | 'RUN_COMMAND'
  | 'GENERATE_CODE'
  | 'GENERATE_COMPONENT'
  | 'GENERATE_SCREEN'
  | 'GENERATE_API';

export type BuilderActionStatus =
  | 'QUEUED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REPLAY_QUEUED';

export interface BuilderActionExecutionResult {
  success: boolean;
  summary: string;
  evidenceIds: string[];
  completedAt: number | null;
}

export interface BuilderAction {
  actionId: string;
  workspaceId: string;
  actionType: BuilderActionType;
  requestedBy: string;
  sourceRequirement: string;
  targetPath: string | null;
  payloadSummary: string;
  status: BuilderActionStatus;
  evidenceProduced: string[];
  executionResult: BuilderActionExecutionResult | null;
  createdAt: number;
  updatedAt: number;
}

let actionCounter = 0;

export function resetBuilderActionCounterForTests(): void {
  actionCounter = 0;
}

export function nextBuilderActionId(): string {
  actionCounter += 1;
  return `builder-action-${actionCounter}`;
}

export function createBuilderAction(input: {
  workspaceId: string;
  actionType: BuilderActionType;
  requestedBy: string;
  sourceRequirement: string;
  targetPath?: string | null;
  payloadSummary?: string;
}): BuilderAction {
  const now = Date.now();
  return {
    actionId: nextBuilderActionId(),
    workspaceId: input.workspaceId,
    actionType: input.actionType,
    requestedBy: input.requestedBy,
    sourceRequirement: input.sourceRequirement,
    targetPath: input.targetPath ?? null,
    payloadSummary: input.payloadSummary ?? '',
    status: 'QUEUED',
    evidenceProduced: [],
    executionResult: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function attachActionEvidence(action: BuilderAction, evidenceId: string): BuilderAction {
  if (!evidenceId) return action;
  return {
    ...action,
    evidenceProduced: [...action.evidenceProduced, evidenceId],
    updatedAt: Date.now(),
  };
}

export function markActionResult(
  action: BuilderAction,
  result: BuilderActionExecutionResult,
): BuilderAction {
  if (result.success && result.evidenceIds.length === 0) {
    throw new Error('No action may be marked successful without evidence');
  }
  return {
    ...action,
    status: result.success ? 'COMPLETED' : 'FAILED',
    evidenceProduced: [...new Set([...action.evidenceProduced, ...result.evidenceIds])],
    executionResult: result,
    updatedAt: Date.now(),
  };
}
