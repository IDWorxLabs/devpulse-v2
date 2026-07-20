/**
 * Universal Workflow Generation Engine V1 — workflow instance persistence (B1 abstraction reuse).
 */

import type { UniversalWorkflowDescriptor, UniversalWorkflowMaterializationInput } from './universal-workflow-types.js';
import { escWorkflowString } from './universal-workflow-types.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';

export function generateWorkflowInstanceRepositorySource(
  descriptor: UniversalWorkflowDescriptor,
  input: UniversalWorkflowMaterializationInput,
): string {
  return `/** Workflow instance persistence — reuses universal CRUD runtime providers */
import { createMemoryCrudProvider } from '../../universal-crud-runtime/memory-provider';
import type { WorkflowInstanceSnapshot } from '../../universal-workflow-runtime/types';

const provider = createMemoryCrudProvider<WorkflowInstanceSnapshot & { id: string; label: string; createdAt: string; updatedAt: string }>(
  '${escWorkflowString(input.moduleId)}-workflow-instance',
);

export function saveWorkflowInstance(instance: WorkflowInstanceSnapshot): WorkflowInstanceSnapshot {
  const existing = provider.findById(instance.instanceId);
  const record = {
    id: instance.instanceId,
    label: instance.workflowId,
    createdAt: existing?.createdAt ?? instance.startedAt,
    updatedAt: new Date().toISOString(),
    ...instance,
  };
  return existing
    ? (provider.update(instance.instanceId, record) as unknown as WorkflowInstanceSnapshot)
    : (provider.create(record) as unknown as WorkflowInstanceSnapshot);
}

export function loadWorkflowInstance(instanceId: string): WorkflowInstanceSnapshot | null {
  const found = provider.findById(instanceId);
  return found ? (found as unknown as WorkflowInstanceSnapshot) : null;
}

export function listWorkflowInstances(workflowId: string): WorkflowInstanceSnapshot[] {
  return provider.list({ search: workflowId }).items as unknown as WorkflowInstanceSnapshot[];
}
`;
}

export function generateWorkflowRuntimeHookSource(
  descriptor: UniversalWorkflowDescriptor,
  input: UniversalWorkflowMaterializationInput,
): string {
  const pascal = moduleIdToPascalCase(input.moduleId);
  const transitionsJson = JSON.stringify(
    descriptor.transitions.map((t) => ({
      transitionId: t.transitionId,
      fromStateId: t.fromStateId,
      toStateId: t.toStateId,
      eventType: t.eventType,
      guardIds: t.guardIds,
      reversible: t.reversible,
      retryable: t.retryable,
    })),
    null,
    2,
  );

  return `/** Universal workflow runtime hook — ${escWorkflowString(descriptor.label)} */
import { useCallback, useMemo, useState } from 'react';
import { findTransition, appendHistory } from '../../universal-workflow-runtime/state-machine';
import type { WorkflowInstanceSnapshot, WorkflowStatus } from '../../universal-workflow-runtime/types';
import { saveWorkflowInstance, loadWorkflowInstance } from './${input.moduleId}.workflow-instance.repository';

const WORKFLOW_ID = '${descriptor.workflowId}';
const ENTRY_STATE = '${descriptor.entryStateId}';
const INITIAL_STEP = '${descriptor.initialStepId}';
const TRANSITIONS = ${transitionsJson} as const;
const TERMINAL_STATES = new Set(${JSON.stringify(descriptor.terminalStateIds)});
const FAILURE_STATES = new Set(${JSON.stringify(descriptor.failureStateIds)});

export interface ${pascal}WorkflowRuntime {
  instance: WorkflowInstanceSnapshot;
  status: WorkflowStatus;
  progressPercent: number;
  currentStepLabel: string;
  error: string | null;
  success: string | null;
  blockedReason: string | null;
  pending: boolean;
  dispatchEvent: (eventType: string, inputData?: Record<string, string>) => void;
  resume: () => void;
}

function computeProgress(instance: WorkflowInstanceSnapshot): number {
  const total = ${descriptor.steps.filter((s) => !s.optional).length || 1};
  const completed = instance.completedStepIds.length;
  return Math.min(100, Math.round((completed / total) * 100));
}

function stepLabelFor(stateId: string): string {
  const map: Record<string, string> = { ${descriptor.steps.map((s) => `'${s.stateId}': '${escWorkflowString(s.label)}'`).join(', ')} };
  return map[stateId] ?? stateId;
}

export function use${pascal}WorkflowRuntime(instanceId = '${descriptor.workflowId}-default'): ${pascal}WorkflowRuntime {
  const [instance, setInstance] = useState<WorkflowInstanceSnapshot>(() => {
    const saved = loadWorkflowInstance(instanceId);
    if (saved) return saved;
    const now = new Date().toISOString();
    return {
      instanceId,
      workflowId: WORKFLOW_ID,
      currentStateId: ENTRY_STATE,
      currentStepId: INITIAL_STEP,
      status: 'NOT_STARTED',
      inputData: {},
      completedStepIds: [],
      transitionHistory: [],
      startedAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
      failureReason: null,
      retryCount: 0,
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const persist = useCallback((next: WorkflowInstanceSnapshot) => {
    setInstance(saveWorkflowInstance(next));
  }, []);

  const dispatchEvent = useCallback(
    (eventType: string, inputData: Record<string, string> = {}) => {
      setPending(true);
      setError(null);
      setSuccess(null);
      setBlockedReason(null);
      try {
        if (${JSON.stringify(descriptor.supportClassification)} === 'BLOCKED_BY_FUTURE_CAPABILITY') {
          setBlockedReason('${escWorkflowString(descriptor.blockedReason ?? 'Workflow blocked')}');
          setError('Workflow blocked by missing capability');
          return;
        }
        const transition = findTransition(TRANSITIONS as never, instance.currentStateId, eventType);
        if (!transition) {
          setError('Invalid transition');
          return;
        }
        if (transition.guardIds.includes('guard-validation') && eventType !== 'CANCEL' && eventType !== 'PREVIOUS') {
          const label = inputData.label ?? instance.inputData.label ?? '';
          if (['SUBMIT', 'COMPLETE', 'NEXT'].includes(eventType) && label.trim().length === 0) {
            setError('Validation failed: required input missing');
            return;
          }
        }
        const nextStep = ${JSON.stringify(descriptor.steps)}.find((s) => s.stateId === transition.toStateId);
        const completedStepIds = [...new Set([...instance.completedStepIds, instance.currentStepId])];
        let status: WorkflowStatus = 'IN_PROGRESS';
        if (TERMINAL_STATES.has(transition.toStateId)) status = transition.toStateId.includes('cancel') ? 'CANCELLED' : 'COMPLETED';
        if (FAILURE_STATES.has(transition.toStateId)) status = 'FAILED';
        const next: WorkflowInstanceSnapshot = {
          ...instance,
          currentStateId: transition.toStateId,
          currentStepId: nextStep?.stepId ?? instance.currentStepId,
          status,
          inputData: { ...instance.inputData, ...inputData },
          completedStepIds,
          transitionHistory: appendHistory(instance.transitionHistory, transition),
          updatedAt: new Date().toISOString(),
          completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
          cancelledAt: status === 'CANCELLED' ? new Date().toISOString() : null,
          failureReason: status === 'FAILED' ? 'Transition failed' : null,
          retryCount: eventType === 'RETRY' ? instance.retryCount + 1 : instance.retryCount,
        };
        persist(next);
        setSuccess(status === 'COMPLETED' ? 'Workflow completed' : 'Transition applied');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Workflow transition failed');
      } finally {
        setPending(false);
      }
    },
    [instance, persist],
  );

  const resume = useCallback(() => {
    const saved = loadWorkflowInstance(instanceId);
    if (saved) {
      setInstance(saved);
      setSuccess('Workflow resumed');
    }
  }, [instanceId]);

  const progressPercent = useMemo(() => computeProgress(instance), [instance]);
  const currentStepLabel = useMemo(() => stepLabelFor(instance.currentStateId), [instance.currentStateId]);

  return {
    instance,
    status: instance.status,
    progressPercent,
    currentStepLabel,
    error,
    success,
    blockedReason,
    pending,
    dispatchEvent,
    resume,
  };
}
`;
}
