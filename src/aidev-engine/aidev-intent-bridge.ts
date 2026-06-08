/**
 * Intent Architecture bridge — intent owner unchanged; AiDev consumes summaries only.
 */

import { extractIntent, summarizeIntent } from '../intent-architecture/intent-extractor.js';
import { getDevPulseV2IntentArchitectureAuthority } from '../intent-architecture/intent-architecture-authority.js';
import { INTENT_OWNER_MODULE } from '../intent-architecture/types.js';
import type { IntentRecord } from '../intent-architecture/types.js';
import type { AiDevRequest, IntentAttachmentSummary } from './types.js';

let lastAttachment: IntentAttachmentSummary | null = null;

export function attachIntentToRequest(
  request: AiDevRequest,
  intent?: IntentRecord,
): AiDevRequest {
  const intentRecord = intent ?? extractIntent(request.normalizedInput);
  const updated: AiDevRequest = {
    ...request,
    intentId: intentRecord.intentId,
    warnings: [...request.warnings],
    errors: [...request.errors],
  };

  if (intentRecord.intentType === 'UNKNOWN') {
    updated.warnings.push('Intent could not be confidently classified — request remains intake-only.');
  }

  lastAttachment = {
    requestId: request.requestId,
    intentId: intentRecord.intentId,
    intentSummary: summarizeIntent(intentRecord),
  };

  return updated;
}

export function getIntentSummaryForRequest(requestId: string): IntentAttachmentSummary | null {
  if (lastAttachment?.requestId === requestId) {
    return { ...lastAttachment };
  }
  return null;
}

export function assertIntentArchitectureOwnershipUnchanged(): boolean {
  const authority = getDevPulseV2IntentArchitectureAuthority();
  return (
    authority.constructor.name === 'DevPulseV2IntentArchitectureAuthority' &&
    typeof authority.extractAndStoreIntent === 'function' &&
    typeof (authority as { createBuildRequest?: unknown }).createBuildRequest === 'undefined'
  );
}

export function getIntentArchitectureOwnerForBridge(): string {
  return INTENT_OWNER_MODULE;
}

export function resetAiDevIntentBridgeForTests(): void {
  lastAttachment = null;
}
