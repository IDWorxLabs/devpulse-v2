/**
 * Reality confidence engine — computes trust confidence from chain analysis.
 */

import type { ExecutionRealityChainInput, RealityConfidence, RealityVerdict } from './types.js';
import {
  detectRealityContradictions,
  hasCriticalContradictions,
  hasWarningContradictions,
} from './reality-contradiction-detector.js';
import {
  isApprovalRequired,
  isRecoveryRequired,
} from './reality-consistency-checker.js';

export function computeRealityConfidence(
  chain: ExecutionRealityChainInput,
  chainComplete: boolean,
): RealityConfidence {
  const contradictions = detectRealityContradictions(chain);

  if (hasCriticalContradictions(contradictions) || !chainComplete) {
    return 'LOW';
  }

  if (hasWarningContradictions(contradictions)) {
    return 'MEDIUM';
  }

  const recoveryOk = !isRecoveryRequired(chain) || chain.recoveryRecord !== null;
  const approvalOk = !isApprovalRequired(chain) || chain.approvalRecord !== null;

  if (chainComplete && recoveryOk && approvalOk) {
    return 'HIGH';
  }

  return 'MEDIUM';
}

export function computeRealityVerdict(
  chain: ExecutionRealityChainInput,
  confidence: RealityConfidence,
  chainComplete: boolean,
): RealityVerdict {
  const contradictions = detectRealityContradictions(chain);

  if (hasCriticalContradictions(contradictions) || !chainComplete || confidence === 'LOW') {
    return 'REALITY_FAILED';
  }
  if (hasWarningContradictions(contradictions) || confidence === 'MEDIUM') {
    return 'REALITY_WARNING';
  }
  return 'REALITY_TRUSTED';
}
