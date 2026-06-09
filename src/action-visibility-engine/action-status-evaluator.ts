/**
 * Action status evaluator — determines visibility status without execution.
 */

import type { ActionStatus } from './action-visibility-types.js';

export function evaluateActionStatus(opts: {
  blocked: boolean;
  deferred: boolean;
  recommended: boolean;
  completed?: boolean;
  rejected?: boolean;
}): ActionStatus {
  if (opts.completed) return 'Completed';
  if (opts.rejected) return 'Rejected';
  if (opts.blocked) return 'Blocked';
  if (opts.deferred) return 'Deferred';
  if (opts.recommended) return 'Recommended';
  return 'Suggested';
}

export function isBlockedStatus(status: ActionStatus): boolean {
  return status === 'Blocked' || status === 'Rejected';
}

export function isDeferredStatus(status: ActionStatus): boolean {
  return status === 'Deferred' || status === 'Waiting';
}

export function isRecommendedStatus(status: ActionStatus): boolean {
  return status === 'Recommended';
}
