/**
 * World 2 Disposable Workspace — core models.
 * Workspace boundary definition only — no creation, copy, or mutation.
 */

import type { SandboxExecutionAssessment } from '../autonomous-builder-execution-sandbox/autonomous-builder-execution-sandbox-types.js';
import type { World2ExecutionEngineAssessment } from '../world2-execution-engine/world2-execution-engine-types.js';
import type { AssessWorld2ExecutionEngineInput } from '../world2-execution-engine/world2-execution-engine-types.js';
import type { World2RuntimeAssessment } from '../world2-controlled-execution-runtime/world2-controlled-execution-runtime-types.js';

export type World2WorkspaceState =
  | 'NOT_CREATED'
  | 'READY'
  | 'READY_WITH_WARNINGS'
  | 'BLOCKED'
  | 'DISPOSED'
  | 'INSUFFICIENT_EVIDENCE';

export type World2IsolationMode =
  | 'DRY_RUN_ONLY'
  | 'SIMULATED_WORKSPACE'
  | 'DISPOSABLE_COPY_ELIGIBLE'
  | 'BLOCKED';

export type World2WorkspaceLifecycleDecision =
  | 'CREATE_ALLOWED'
  | 'CREATE_WITH_RESTRICTIONS'
  | 'DO_NOT_CREATE'
  | 'DISPOSE_REQUIRED'
  | 'ESCALATE';

export interface World2DisposableWorkspaceContract {
  readOnly: true;
  workspaceId: string;
  sourceProjectId: string;
  isolationMode: World2IsolationMode;
  allowedPaths: string[];
  forbiddenPaths: string[];
  allowedOperations: string[];
  forbiddenOperations: string[];
  lifecycleState: World2WorkspaceState;
  disposalRequired: boolean;
  validationRequired: boolean;
  rollbackReference: string | null;
}

export interface World2WorkspaceLifecycleAssessment {
  readOnly: true;
  decision: World2WorkspaceLifecycleDecision;
  reasons: string[];
}

export interface World2DisposableWorkspaceInputSnapshot {
  runtimeAssessment: World2RuntimeAssessment;
  engineAssessment: World2ExecutionEngineAssessment;
  sandboxAssessment: SandboxExecutionAssessment;
  missingAuthorities: string[];
}

export interface World2DisposableWorkspaceAssessment {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  assessmentId: string;
  workspaceState: World2WorkspaceState;
  isolationMode: World2IsolationMode;
  inputSnapshot: World2DisposableWorkspaceInputSnapshot;
  workspaceContract: World2DisposableWorkspaceContract | null;
  lifecycleAssessment: World2WorkspaceLifecycleAssessment;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface World2DisposableWorkspaceReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessment: World2DisposableWorkspaceAssessment;
  passToken: string;
}

export interface AssessWorld2DisposableWorkspaceInput extends AssessWorld2ExecutionEngineInput {
  engineAssessment?: World2ExecutionEngineAssessment;
}

export interface World2DisposableWorkspaceHistorySummary {
  totalAssessments: number;
  readyWorkspaces: number;
  warningWorkspaces: number;
  blockedWorkspaces: number;
  insufficientEvidenceWorkspaces: number;
  notCreatedWorkspaces: number;
  lifecycleCreateAllowed: number;
  lifecycleDisposeRequired: number;
}
