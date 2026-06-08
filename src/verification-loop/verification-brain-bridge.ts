/**
 * Central Brain bridge — awareness owner unchanged; verification publishes summaries only.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { summarizeVerification } from './verification-engine.js';
import type { VerificationReview, VerificationSummary } from './types.js';

let latestPublishedSummary: VerificationSummary | null = null;

export function publishVerificationSummary(review: VerificationReview): VerificationSummary {
  const summary: VerificationSummary = {
    verificationId: review.verificationId,
    subject: review.subject,
    status: review.status,
    confidence: review.confidence,
    summary: summarizeVerification(review),
    publishedAt: Date.now(),
  };
  latestPublishedSummary = { ...summary };
  return { ...summary };
}

export function getLatestVerificationSummary(): VerificationSummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

export function assertCentralBrainOwnershipUnchanged(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  return (
    brain.constructor.name === 'DevPulseV2CentralBrainAuthority' &&
    typeof brain.getBrainState === 'function' &&
    typeof (brain as { verifyClaim?: unknown }).verifyClaim === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetVerificationBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
