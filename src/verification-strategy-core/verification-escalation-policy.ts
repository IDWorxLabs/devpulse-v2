/**
 * Verification Strategy Core — escalation policy.
 */

import type { VerificationStrategyInput } from './verification-strategy-types.js';
import { getMinimumConfidenceForStrategy } from './verification-strategy-registry.js';

const DEFAULT_CONFIDENCE_THRESHOLD = 60;
const DEFAULT_TRUST_THRESHOLD = 50;

export function shouldEscalateVerification(
  input: VerificationStrategyInput,
  confidence: number,
  selectedStrategy?: string,
): boolean {
  if (confidence < DEFAULT_CONFIDENCE_THRESHOLD) return true;
  if (input.trustScore < DEFAULT_TRUST_THRESHOLD) return true;
  if (input.criticalSubsystemModified) return true;
  if (input.repeatFailuresDetected) return true;
  if (input.world2ExecutionActive) return true;
  if (input.verificationDisagreement) return true;
  if ((input.historicalFailures ?? 0) >= 3) return true;
  if (input.riskLevel === 'CRITICAL') return true;

  if (selectedStrategy) {
    const minConfidence = getMinimumConfidenceForStrategy(
      selectedStrategy as import('./verification-strategy-types.js').VerificationStrategy,
    );
    if (confidence < minConfidence) return true;
  }

  return false;
}
