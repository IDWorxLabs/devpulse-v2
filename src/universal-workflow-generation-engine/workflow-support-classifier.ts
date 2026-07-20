/**
 * Universal Workflow Generation Engine V1 — support classification.
 */

import type { NormalizedWorkflowShape } from './workflow-normalization-engine.js';
import type { UniversalWorkflowSupportClassification } from './universal-workflow-types.js';

export interface WorkflowSupportClassificationResult {
  readonly classification: UniversalWorkflowSupportClassification;
  readonly blockedReason?: string;
}

export function classifyWorkflowSupport(normalized: NormalizedWorkflowShape): WorkflowSupportClassificationResult {
  if (normalized.kind === 'informational') {
    return { classification: 'NOT_EXECUTABLE_INFORMATIONAL' };
  }
  if (normalized.hasSchedulingSemantics) {
    return {
      classification: 'BLOCKED_BY_FUTURE_CAPABILITY',
      blockedReason: 'blocked_by_scheduling_capability: Scheduling infrastructure not available in B3',
    };
  }
  if (normalized.stageLabels.length < 2) {
    return {
      classification: 'INVALID_WORKFLOW_CONTRACT',
      blockedReason: 'Workflow lacks sufficient step definition',
    };
  }
  if (normalized.kind === 'approval' || normalized.hasApprovalBranch) {
    return { classification: 'APPROVAL_SUPPORTED' };
  }
  if (normalized.kind === 'form') {
    return { classification: 'FORM_WORKFLOW_SUPPORTED' };
  }
  if (normalized.kind === 'branching') {
    return { classification: 'BRANCHING_SUPPORTED' };
  }
  return { classification: 'LINEAR_SUPPORTED' };
}
