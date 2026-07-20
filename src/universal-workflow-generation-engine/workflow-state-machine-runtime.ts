/**
 * Universal Workflow Generation Engine V1 — shared workflow runtime.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';

const RUNTIME_ROOT = 'src/universal-workflow-runtime';

export function buildUniversalWorkflowSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: `${RUNTIME_ROOT}/types.ts`,
      content: `/** Universal workflow runtime — shared types */
export type WorkflowStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'BLOCKED'
  | 'FAILED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'PAUSED';

export interface WorkflowTransitionRecord {
  transitionId: string;
  fromStateId: string;
  toStateId: string;
  eventType: string;
  at: string;
}

export interface WorkflowInstanceSnapshot {
  instanceId: string;
  workflowId: string;
  currentStateId: string;
  currentStepId: string;
  status: WorkflowStatus;
  inputData: Record<string, string>;
  completedStepIds: string[];
  transitionHistory: WorkflowTransitionRecord[];
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  failureReason: string | null;
  retryCount: number;
}
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/state-machine.ts`,
      content: `/** Universal workflow state machine evaluator */
import type { WorkflowTransitionRecord } from './types';

export interface WorkflowTransitionDef {
  transitionId: string;
  fromStateId: string;
  toStateId: string;
  eventType: string;
  guardIds: string[];
  reversible: boolean;
  retryable: boolean;
}

export function findTransition(
  transitions: WorkflowTransitionDef[],
  fromStateId: string,
  eventType: string,
): WorkflowTransitionDef | null {
  const matches = transitions.filter((t) => t.fromStateId === fromStateId && t.eventType === eventType);
  return matches.length === 1 ? matches[0]! : null;
}

export function appendHistory(
  history: WorkflowTransitionRecord[],
  transition: WorkflowTransitionDef,
): WorkflowTransitionRecord[] {
  return [
    ...history,
    {
      transitionId: transition.transitionId,
      fromStateId: transition.fromStateId,
      toStateId: transition.toStateId,
      eventType: transition.eventType,
      at: new Date().toISOString(),
    },
  ];
}
`,
    },
    {
      relativePath: `${RUNTIME_ROOT}/index.ts`,
      content: `export * from './types';
export * from './state-machine';
`,
    },
  ];
}
