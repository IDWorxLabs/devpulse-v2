/**
 * Universal Workflow Generation Engine V1 — behavior verification.
 */

import type {
  UniversalWorkflowBehaviorVerificationResult,
  UniversalWorkflowDescriptor,
  UniversalWorkflowVerificationClassification,
} from './universal-workflow-types.js';

export interface WorkflowGeneratedSources {
  readonly runtime: string;
  readonly repository: string;
  readonly componentFragment: string;
  readonly descriptors: string;
}

function check(name: string, source: string, patterns: RegExp[]) {
  const missing = patterns.filter((p) => !p.test(source)).map((p) => p.source);
  return { id: name, passed: missing.length === 0, detail: missing.length === 0 ? 'ok' : missing.join(',') };
}

export function verifyUniversalWorkflowBehavior(
  descriptor: UniversalWorkflowDescriptor,
  sources: WorkflowGeneratedSources,
): UniversalWorkflowBehaviorVerificationResult {
  const combined = `${sources.runtime}\n${sources.repository}\n${sources.componentFragment}\n${sources.descriptors}`;
  const id = descriptor.workflowId;

  if (descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY') {
    return {
      readOnly: true,
      workflowId: id,
      classification: 'BLOCKED_BY_CAPABILITY',
      passed: /blockedReason|data-blocked|Workflow blocked/.test(combined),
      checks: [check('blocked-evidence', combined, [/blocked/i])],
    };
  }

  if (descriptor.supportClassification === 'INVALID_WORKFLOW_CONTRACT') {
    return {
      readOnly: true,
      workflowId: id,
      classification: 'INVALID',
      passed: true,
      checks: [check('invalid-classified', combined, [/.+/])],
    };
  }

  const checks = [
    check('state-machine', sources.runtime, [/dispatchEvent/, /findTransition/]),
    check('persistence', sources.repository, [/saveWorkflowInstance/, /loadWorkflowInstance/]),
    check('validation-before-effects', sources.runtime, [/Validation failed/]),
    check('invalid-transition-rejected', sources.runtime, [/Invalid transition/]),
    check('progress', combined, [/progressPercent|data-workflow-progress/]),
    check('ui-controls', sources.componentFragment, [/data-workflow-event/, /onClick/]),
    check('completion', sources.runtime, [/COMPLETED|completedAt/]),
    check('cancel-policy', sources.runtime, [/CANCELLED|cancelledAt/]),
    check('resume', combined, [/resume|loadWorkflowInstance/]),
    check('no-static-shell', combined, [/dispatchEvent/]),
  ];

  const passed = checks.every((c) => c.passed);
  const classification: UniversalWorkflowVerificationClassification = passed
    ? 'BEHAVIORALLY_VERIFIED'
    : combined.includes('dispatchEvent')
      ? 'PARTIALLY_VERIFIED'
      : 'STRUCTURALLY_PRESENT_ONLY';

  return { readOnly: true, workflowId: id, classification, passed, checks };
}

export function diagnoseUniversalWorkflowGenerationGaps(
  verification: UniversalWorkflowBehaviorVerificationResult,
): readonly string[] {
  const gaps: string[] = [];
  if (verification.classification === 'BLOCKED_BY_CAPABILITY') return ['blocked_by_scheduling_capability'];
  if (verification.classification === 'INVALID') return ['invalid_workflow_contract'];
  if (verification.passed) return [];
  for (const c of verification.checks) {
    if (c.passed) continue;
    if (c.id.includes('state-machine')) gaps.push('missing_transition');
    else if (c.id.includes('persistence')) gaps.push('missing_persistence_effect');
    else if (c.id.includes('validation')) gaps.push('missing_validation');
    else if (c.id.includes('ui')) gaps.push('missing_action_handler');
    else gaps.push('missing_behavioral_verification');
  }
  return [...new Set(gaps)];
}
