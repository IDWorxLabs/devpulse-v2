/** Universal Workflow Generation Engine V1 — navigation continuity */
import type { UniversalWorkflowDescriptor } from './universal-workflow-types.js';

export function workflowRouteForState(descriptor: UniversalWorkflowDescriptor, moduleRoute: string): string {
  return moduleRoute;
}
