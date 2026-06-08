/**
 * DevPulse V2 minimal response engine — deterministic foundation responses only.
 * NOT AI. NOT intelligence.
 */

import { buildAnswer, buildErrorAnswer } from './answer-contract.js';
import type { DevPulseV2Answer } from './answer-contract.js';
import { FOUNDATION_RESPONSE_TEXT } from './types.js';

export function generateFoundationResponse(userText: string): DevPulseV2Answer {
  const trimmed = userText.trim();

  if (trimmed.length === 0) {
    return buildAnswer('');
  }

  if (trimmed === '__FORCE_EMPTY__') {
    return buildAnswer('');
  }

  if (trimmed === '__FORCE_ERROR__') {
    return buildErrorAnswer('Foundation test error path');
  }

  return buildAnswer(FOUNDATION_RESPONSE_TEXT);
}
