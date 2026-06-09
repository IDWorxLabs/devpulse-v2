/**
 * Recovery failure classifier — maps query and failure context to failure category.
 */

import type { FailureCategory, FailureContext } from './types.js';
import { REPEATED_FAILURE_LIMIT } from './types.js';

export function classifyFailure(
  query: string,
  failureContext: FailureContext | null,
): FailureCategory {
  const lower = query.toLowerCase();
  const count = failureContext?.failureCount ?? 0;

  if (count >= REPEATED_FAILURE_LIMIT || lower.includes('3 failed') || lower.includes('three failure')) {
    return 'REPEATED_FAILURE_LIMIT_REACHED';
  }

  if (lower.includes('apply fail') || lower.includes('apply failed')) {
    return 'APPLY_FAILED';
  }
  if (lower.includes('verification fail') || lower.includes('verify fail') || lower.includes('verify failed')) {
    return 'VERIFY_FAILED';
  }
  if (lower.includes('rollback fail') || lower.includes('rollback failed')) {
    return 'ROLLBACK_FAILED';
  }
  if (lower.includes('workspace isolation') || lower.includes('isolation fail')) {
    return 'WORKSPACE_ISOLATION_FAILED';
  }
  if (lower.includes('task governor') || lower.includes('governor blocked')) {
    return 'TASK_GOVERNOR_BLOCKED';
  }
  if (lower.includes('founder approval') || lower.includes('approval missing')) {
    return 'FOUNDER_APPROVAL_MISSING';
  }
  if (lower.includes('constitution')) {
    return 'CONSTITUTION_BLOCKED';
  }
  if (lower.includes('runtime verification') || lower.includes('verification failed')) {
    return 'RUNTIME_VERIFICATION_FAILED';
  }

  if (failureContext) {
    const path = failureContext.failurePath.toLowerCase();
    if (path.includes('apply')) return 'APPLY_FAILED';
    if (path.includes('verify') || path.includes('verification')) return 'VERIFY_FAILED';
    if (path.includes('rollback')) return 'ROLLBACK_FAILED';
    if (path.includes('isolation')) return 'WORKSPACE_ISOLATION_FAILED';
    if (path.includes('governor')) return 'TASK_GOVERNOR_BLOCKED';
    if (path.includes('founder') || path.includes('approval')) return 'FOUNDER_APPROVAL_MISSING';
    if (path.includes('constitution')) return 'CONSTITUTION_BLOCKED';
    if (path.includes('verification')) return 'RUNTIME_VERIFICATION_FAILED';
  }

  return 'UNKNOWN_RUNTIME_FAILURE';
}
