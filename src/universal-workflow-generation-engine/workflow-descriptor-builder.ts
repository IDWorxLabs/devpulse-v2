/**
 * Universal Workflow Generation Engine V1 — workflow descriptor builder.
 */

import type { NormalizedWorkflowShape } from './workflow-normalization-engine.js';
import type { WorkflowSupportClassificationResult } from './workflow-support-classifier.js';
import type {
  UniversalWorkflowDescriptor,
  UniversalWorkflowMaterializationInput,
  UniversalWorkflowStep,
  UniversalWorkflowState,
  UniversalWorkflowTransition,
  UniversalWorkflowGuard,
  UniversalWorkflowEventType,
} from './universal-workflow-types.js';
import { stableWorkflowId } from './universal-workflow-types.js';

export function buildWorkflowDescriptor(
  normalized: NormalizedWorkflowShape,
  support: WorkflowSupportClassificationResult,
  input: UniversalWorkflowMaterializationInput,
): UniversalWorkflowDescriptor {
  const workflowId = stableWorkflowId([
    input.moduleId,
    normalized.raw.label,
    normalized.raw.sourceEnvelopePath,
    input.buildId,
  ]);

  if (
    support.classification === 'NOT_EXECUTABLE_INFORMATIONAL' ||
    support.classification === 'INVALID_WORKFLOW_CONTRACT' ||
    support.classification === 'BLOCKED_BY_FUTURE_CAPABILITY'
  ) {
    return minimalDescriptor(workflowId, normalized, support, input);
  }

  const states = buildStates(normalized);
  const steps = buildSteps(normalized, states);
  const guards = buildGuards();
  const transitions = buildTransitions(normalized, states, steps);

  return {
    workflowId,
    label: normalized.raw.label,
    description: `${normalized.raw.label} workflow for ${input.moduleDisplayName}`,
    moduleId: input.moduleId,
    sourceEnvelopePaths: [normalized.raw.sourceEnvelopePath],
    entryStateId: states[0]!.stateId,
    initialStepId: steps[0]!.stepId,
    states,
    steps,
    transitions,
    guards,
    terminalStateIds: states.filter((s) => s.terminal && !s.failure).map((s) => s.stateId),
    failureStateIds: states.filter((s) => s.failure).map((s) => s.stateId),
    supportClassification: support.classification,
    blockedReason: support.blockedReason,
    provenance: { buildId: input.buildId, promptHash: input.promptHash },
  };
}

function minimalDescriptor(
  workflowId: string,
  normalized: NormalizedWorkflowShape,
  support: WorkflowSupportClassificationResult,
  input: UniversalWorkflowMaterializationInput,
): UniversalWorkflowDescriptor {
  return {
    workflowId,
    label: normalized.raw.label,
    description: normalized.raw.label,
    moduleId: input.moduleId,
    sourceEnvelopePaths: [normalized.raw.sourceEnvelopePath],
    entryStateId: 'state-blocked',
    initialStepId: 'step-blocked',
    states: [{ stateId: 'state-blocked', label: 'Blocked', terminal: true, failure: true }],
    steps: [{ stepId: 'step-blocked', label: 'Blocked', stateId: 'state-blocked', progressWeight: 0, optional: false, allowedEvents: [] }],
    transitions: [],
    guards: [],
    terminalStateIds: ['state-blocked'],
    failureStateIds: ['state-blocked'],
    supportClassification: support.classification,
    blockedReason: support.blockedReason,
    provenance: { buildId: input.buildId, promptHash: input.promptHash },
  };
}

function buildStates(normalized: NormalizedWorkflowShape): UniversalWorkflowState[] {
  const states: UniversalWorkflowState[] = normalized.stageLabels.map((label, index) => ({
    stateId: `state-${index}`,
    label,
    terminal: false,
    failure: false,
  }));
  states.push({ stateId: 'state-completed', label: 'Completed', terminal: true, failure: false });
  states.push({ stateId: 'state-cancelled', label: 'Cancelled', terminal: true, failure: false });
  states.push({ stateId: 'state-failed', label: 'Failed', terminal: true, failure: true });
  if (normalized.hasApprovalBranch) {
    states.push({ stateId: 'state-rejected', label: 'Rejected', terminal: true, failure: true });
  }
  return states;
}

function buildSteps(normalized: NormalizedWorkflowShape, states: UniversalWorkflowState[]): UniversalWorkflowStep[] {
  const nonTerminal = states.filter((s) => !s.terminal);
  return nonTerminal.map((state, index) => ({
    stepId: `step-${index}`,
    label: state.label,
    stateId: state.stateId,
    progressWeight: 1,
    optional: false,
    allowedEvents: eventsForStep(index, nonTerminal.length, normalized.hasApprovalBranch),
  }));
}

function eventsForStep(index: number, total: number, hasApproval: boolean): UniversalWorkflowEventType[] {
  const events: UniversalWorkflowEventType[] = ['CANCEL', 'SAVE_DRAFT'];
  if (index > 0) events.push('PREVIOUS');
  if (index < total - 1) events.push('NEXT', 'SUBMIT');
  if (index === total - 1) events.push('COMPLETE', 'SUBMIT');
  if (hasApproval && index === total - 2) events.push('APPROVE', 'REJECT');
  return events;
}

function buildGuards(): UniversalWorkflowGuard[] {
  return [
    { guardId: 'guard-validation', kind: 'validation-passed', message: 'Step validation must pass' },
    { guardId: 'guard-prior-step', kind: 'prior-step-completed', message: 'Prior step must be completed' },
    { guardId: 'guard-capability', kind: 'capability-available', message: 'Required capability must be available' },
  ];
}

function buildTransitions(
  normalized: NormalizedWorkflowShape,
  states: UniversalWorkflowState[],
  steps: UniversalWorkflowStep[],
): UniversalWorkflowTransition[] {
  const transitions: UniversalWorkflowTransition[] = [];
  const nonTerminal = states.filter((s) => !s.terminal);

  for (let i = 0; i < nonTerminal.length - 1; i++) {
    transitions.push({
      transitionId: `transition-${i}-next`,
      fromStateId: nonTerminal[i]!.stateId,
      eventType: 'NEXT',
      toStateId: nonTerminal[i + 1]!.stateId,
      guardIds: ['guard-validation'],
      actionSemantic: 'NEXT',
      reversible: true,
      retryable: false,
    });
    transitions.push({
      transitionId: `transition-${i}-prev`,
      fromStateId: nonTerminal[i + 1]!.stateId,
      eventType: 'PREVIOUS',
      toStateId: nonTerminal[i]!.stateId,
      guardIds: [],
      actionSemantic: 'PREVIOUS',
      reversible: true,
      retryable: false,
    });
  }

  const last = nonTerminal[nonTerminal.length - 1];
  if (last) {
    transitions.push({
      transitionId: 'transition-complete',
      fromStateId: last.stateId,
      eventType: 'COMPLETE',
      toStateId: 'state-completed',
      guardIds: ['guard-validation', 'guard-prior-step'],
      actionSemantic: 'COMPLETE',
      reversible: false,
      retryable: false,
    });
  }

  for (const step of steps) {
    transitions.push({
      transitionId: `transition-cancel-${step.stepId}`,
      fromStateId: step.stateId,
      eventType: 'CANCEL',
      toStateId: 'state-cancelled',
      guardIds: [],
      actionSemantic: 'CANCEL',
      reversible: false,
      retryable: false,
    });
  }

  if (normalized.hasApprovalBranch && nonTerminal.length >= 2) {
    const review = nonTerminal[nonTerminal.length - 2]!;
    transitions.push({
      transitionId: 'transition-approve',
      fromStateId: review.stateId,
      eventType: 'APPROVE',
      toStateId: 'state-completed',
      guardIds: ['guard-validation'],
      actionSemantic: 'APPROVE',
      reversible: false,
      retryable: false,
    });
    transitions.push({
      transitionId: 'transition-reject',
      fromStateId: review.stateId,
      eventType: 'REJECT',
      toStateId: 'state-rejected',
      guardIds: ['guard-validation'],
      actionSemantic: 'REJECT',
      reversible: false,
      retryable: true,
    });
  }

  transitions.push({
    transitionId: 'transition-retry-failed',
    fromStateId: 'state-failed',
    eventType: 'RETRY',
    toStateId: steps[0]?.stateId ?? 'state-0',
    guardIds: ['guard-capability'],
    actionSemantic: 'RETRY',
    reversible: false,
    retryable: true,
  });

  return transitions;
}

export function buildWorkflowDescriptors(
  normalizedWorkflows: readonly NormalizedWorkflowShape[],
  classifications: readonly WorkflowSupportClassificationResult[],
  input: UniversalWorkflowMaterializationInput,
): UniversalWorkflowDescriptor[] {
  return normalizedWorkflows.map((n, i) => buildWorkflowDescriptor(n, classifications[i]!, input));
}
