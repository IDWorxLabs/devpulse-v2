/**
 * Reality chain validator — determines governance chain completeness.
 */

import type { ExecutionRealityChainInput } from './types.js';
import {
  checkApprovalLayer,
  checkAuthorityLayer,
  checkRecoveryLayer,
  checkRuntimeLayer,
  checkVerificationLayer,
  isApprovalRequired,
  isRecoveryRequired,
} from './reality-consistency-checker.js';
import { detectRealityContradictions, hasCriticalContradictions } from './reality-contradiction-detector.js';

export function validateRealityChainCompleteness(chain: ExecutionRealityChainInput): boolean {
  const authority = checkAuthorityLayer(chain);
  const runtime = checkRuntimeLayer(chain);
  const verification = checkVerificationLayer(chain);

  if (!runtime.present || !verification.present) {
    return false;
  }

  if (!authority.present && chain.runtimeRecord?.runtimeDecision.finalState !== 'REJECTED_INVALID_PACKAGE') {
    return false;
  }

  if (isRecoveryRequired(chain) && !checkRecoveryLayer(chain).present) {
    return false;
  }

  if (isApprovalRequired(chain) && !checkApprovalLayer(chain).present) {
    return false;
  }

  const contradictions = detectRealityContradictions(chain);
  if (hasCriticalContradictions(contradictions)) {
    return false;
  }

  return true;
}

export function summarizeChainCompleteness(chain: ExecutionRealityChainInput): string {
  const complete = validateRealityChainCompleteness(chain);
  return complete ? 'REALITY_COMPLETE' : 'REALITY_INCOMPLETE';
}
