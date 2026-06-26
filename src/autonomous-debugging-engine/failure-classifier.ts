/**
 * Autonomous Debugging Engine — failure classification.
 */

import type { DebuggingFailureCategory, NormalizedFailure } from './autonomous-debugging-types.js';

export function classifyDebuggingFailure(failure: NormalizedFailure): DebuggingFailureCategory {
  if (failure.category !== 'UNKNOWN_FAILURE') return failure.category;
  if (/typecheck|type error/i.test(failure.observed)) return 'TYPECHECK_FAILURE';
  if (/build fail|npm build/i.test(failure.observed)) return 'BUILD_FAILURE';
  if (/runtime/i.test(failure.observed)) return 'RUNTIME_ERROR';
  return 'UNKNOWN_FAILURE';
}

export function canAutoPatch(failure: NormalizedFailure): boolean {
  const category = classifyDebuggingFailure(failure);
  if (category === 'UNKNOWN_FAILURE') return failure.evidence.length > 20;
  if (category === 'SECURITY_FAILURE') return false;
  if (failure.safetyFlags.includes('SECURITY_SENSITIVE')) return false;
  return true;
}
