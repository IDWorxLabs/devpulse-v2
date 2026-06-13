/**
 * Connected Workspace Creation — constants and registry.
 */

import type { WorkspaceCreationState } from './connected-workspace-creation-types.js';

export const CONNECTED_WORKSPACE_CREATION_PASS_TOKEN = 'CONNECTED_WORKSPACE_CREATION_PASS';
export const CONNECTED_WORKSPACE_CREATION_OWNER_MODULE = 'devpulse_connected_workspace_creation';
export const CONNECTED_WORKSPACE_CREATION_PHASE = 'Phase 25.26 — Connected Workspace Creation';
export const CONNECTED_WORKSPACE_CREATION_REPORT_TITLE = 'CONNECTED_WORKSPACE_CREATION_REPORT';
export const CONNECTED_WORKSPACE_CREATION_CACHE_KEY_PREFIX = 'connected-workspace-creation-v1';
export const MAX_CONNECTED_WORKSPACE_CREATION_HISTORY = 16;
export const MAX_CREATION_WARNINGS = 12;
export const MAX_CREATION_BLOCKERS = 12;
export const MAX_RECOMMENDED_ACTIONS = 12;
export const MAX_CREATED_DIRECTORIES = 24;
export const MAX_CREATED_ARTIFACTS = 16;
export const MAX_CREATION_EVIDENCE = 32;

export const WORLD2_DISPOSABLE_LOGICAL_ROOT_PREFIX = '/world2/disposable/';
export const VALIDATION_WORKSPACE_ID_PREFIX = 'connected-ws-validate-';

export const CONNECTED_WORKSPACE_CREATION_CORE_QUESTION =
  'Can AiDevEngine create a real disposable workspace from an approved execution plan?';

export const WORKSPACE_CREATION_STATES: readonly WorkspaceCreationState[] = [
  'WORKSPACE_CREATED',
  'WORKSPACE_CREATED_WITH_WARNINGS',
  'WORKSPACE_CREATION_FAILED',
  'WORKSPACE_CREATION_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'world2-disposable-workspace',
  'world2-workspace-population',
  'world2-workspace-materialization',
  'world2-workspace-instantiation-governance',
  'world2-disposable-workspace-creator',
  'world2-disposable-workspace-instantiator',
  'connected-build-execution-foundation',
  'founder-acceptance-gate',
] as const;

export const ORCHESTRATION_FLOW = [
  'Execution Plan',
  'Workspace Blueprint',
  'Workspace Population',
  'Workspace Materialization',
  'Instantiation Governance',
  'Workspace Creator',
  'Workspace Instantiator',
  'Real Workspace Creation',
  'Workspace Creation Evidence',
] as const;

export const WORKSPACE_CREATION_SAFETY_GUARANTEES = [
  'Bounded execution only — max 1 disposable workspace per validation run',
  'Automatic cleanup after validation',
  'No World 1 access',
  'No production access',
  'No build execution',
  'No runtime launch',
  'No preview launch',
  'No verification launch',
  'No deployment',
  'No repository deletion',
  'No change set application',
  'Disposable workspace directories only under generated builder workspaces root',
] as const;

export function isWorkspaceCreationState(value: string): value is WorkspaceCreationState {
  return (WORKSPACE_CREATION_STATES as readonly string[]).includes(value);
}

export function resolveLogicalDisposableRoot(workspaceId: string): string {
  return `${WORLD2_DISPOSABLE_LOGICAL_ROOT_PREFIX}${workspaceId}`;
}
