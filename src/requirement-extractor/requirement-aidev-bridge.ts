/**
 * AiDev bridge — AiDev remains request owner; extractor consumes requests read-only.
 */

import type { AiDevRequest } from '../aidev-engine/types.js';
import { getDevPulseV2AiDevEngineAuthority } from '../aidev-engine/aidev-engine-authority.js';
import { AIDEV_OWNER_MODULE } from '../aidev-engine/types.js';
import { extractRequirements } from './requirement-extraction-engine.js';
import type { RequirementExtractionResult } from './types.js';

let lastAttachment: { requestId: string; extractionId: string } | null = null;

export function extractRequirementsForRequest(request: AiDevRequest): RequirementExtractionResult {
  return extractRequirements({
    requestId: request.requestId,
    userInput: request.normalizedInput || request.userInput,
  });
}

export function attachRequirementsToRequest(
  request: AiDevRequest,
  result: RequirementExtractionResult,
): RequirementExtractionResult {
  if (result.requestId !== request.requestId) {
    return {
      ...result,
      requestId: request.requestId,
      errors: [...result.errors, 'Extraction requestId mismatch — realigned to AiDev request.'],
    };
  }
  lastAttachment = { requestId: request.requestId, extractionId: result.extractionId };
  return { ...result, requirements: result.requirements.map((r) => ({ ...r })) };
}

export function getLastRequirementAttachment(): { requestId: string; extractionId: string } | null {
  return lastAttachment ? { ...lastAttachment } : null;
}

export function assertAiDevOwnershipUnchanged(): boolean {
  const aidev = getDevPulseV2AiDevEngineAuthority();
  return (
    aidev.constructor.name === 'DevPulseV2AiDevEngineAuthority' &&
    typeof aidev.intakeBuildRequest === 'function' &&
    typeof (aidev as { extractRequirements?: unknown }).extractRequirements === 'undefined'
  );
}

export function getAiDevOwnerForBridge(): string {
  return AIDEV_OWNER_MODULE;
}

export function resetRequirementAiDevBridgeForTests(): void {
  lastAttachment = null;
}
