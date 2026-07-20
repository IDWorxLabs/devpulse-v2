/** Universal Workflow Generation Engine V1 — cancellation, retry, recovery */
import type { UniversalWorkflowDescriptor } from './universal-workflow-types.js';

export function supportsWorkflowCancellation(descriptor: UniversalWorkflowDescriptor): boolean {
  return descriptor.transitions.some((t) => t.eventType === 'CANCEL');
}

export function supportsWorkflowRetry(descriptor: UniversalWorkflowDescriptor): boolean {
  return descriptor.transitions.some((t) => t.eventType === 'RETRY' && t.retryable);
}

export function supportsWorkflowResume(descriptor: UniversalWorkflowDescriptor): boolean {
  return descriptor.supportClassification !== 'NOT_EXECUTABLE_INFORMATIONAL';
}
