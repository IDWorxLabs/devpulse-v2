/**
 * Universal Workflow Generation Engine V1 — workflow graph validation.
 */

import type { UniversalWorkflowDescriptor } from './universal-workflow-types.js';

export interface WorkflowGraphValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function validateWorkflowGraph(descriptor: UniversalWorkflowDescriptor): WorkflowGraphValidationResult {
  const errors: string[] = [];
  const stateIds = new Set(descriptor.states.map((s) => s.stateId));
  const stepIds = new Set(descriptor.steps.map((s) => s.stepId));

  if (!stateIds.has(descriptor.entryStateId)) errors.push('missing_entry_state');
  if (descriptor.terminalStateIds.length === 0 && descriptor.supportClassification !== 'BLOCKED_BY_FUTURE_CAPABILITY') {
    errors.push('missing_terminal_state');
  }
  if (!stepIds.has(descriptor.initialStepId) && descriptor.supportClassification !== 'BLOCKED_BY_FUTURE_CAPABILITY') {
    errors.push('missing_initial_step');
  }

  const transitionKeys = new Set<string>();
  for (const t of descriptor.transitions) {
    if (!stateIds.has(t.fromStateId)) errors.push(`invalid_transition_from:${t.transitionId}`);
    if (!stateIds.has(t.toStateId)) errors.push(`invalid_transition_to:${t.transitionId}`);
    const key = `${t.fromStateId}|${t.eventType}`;
    if (transitionKeys.has(key) && t.eventType !== 'CANCEL') errors.push(`ambiguous_transition:${key}`);
    transitionKeys.add(key);
    if (descriptor.terminalStateIds.includes(t.fromStateId) && t.eventType !== 'REOPEN') {
      errors.push(`transition_from_terminal:${t.transitionId}`);
    }
  }

  const reachable = reachableStates(descriptor);
  for (const step of descriptor.steps) {
    if (!reachable.has(step.stateId)) errors.push(`unreachable_step:${step.stepId}`);
  }

  const duplicateState = descriptor.states.map((s) => s.stateId).filter((id, i, arr) => arr.indexOf(id) !== i);
  if (duplicateState.length > 0) errors.push('duplicate_state_ids');

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

function reachableStates(descriptor: UniversalWorkflowDescriptor): Set<string> {
  const reachable = new Set<string>([descriptor.entryStateId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of descriptor.transitions) {
      if (reachable.has(t.fromStateId) && !reachable.has(t.toStateId)) {
        reachable.add(t.toStateId);
        changed = true;
      }
    }
  }
  return reachable;
}

export function validateAllWorkflowGraphs(descriptors: readonly UniversalWorkflowDescriptor[]): WorkflowGraphValidationResult {
  const errors = descriptors.flatMap((d) => validateWorkflowGraph(d).errors);
  return { valid: errors.length === 0, errors };
}
