/**
 * Chat Path Proof History — bounded proof history (max 16).
 */

import { MAX_CHAT_PATH_PROOF_HISTORY } from './real-chat-openai-path-registry.js';
import type {
  ChatPathProofHistoryEntry,
  RealChatOpenAiPathProofResult,
} from './real-chat-openai-path-types.js';

const history: ChatPathProofHistoryEntry[] = [];
const results: RealChatOpenAiPathProofResult[] = [];

export function resetChatPathProofHistoryForTests(): void {
  history.length = 0;
  results.length = 0;
}

export function recordChatPathProofResult(result: RealChatOpenAiPathProofResult): void {
  const entry: ChatPathProofHistoryEntry = {
    proofId: result.proofId,
    timestamp: result.analyzedAt,
    mode: result.mode,
    finalVerdict: result.finalVerdict,
    realResponseReceived: result.realResponseReceived,
    requestDurationMs: result.requestResult.requestDurationMs,
    founderFacingQualityScore: result.responseValidation.founderFacingQualityScore,
  };

  history.unshift(entry);
  results.unshift(result);

  if (history.length > MAX_CHAT_PATH_PROOF_HISTORY) {
    history.length = MAX_CHAT_PATH_PROOF_HISTORY;
  }
  if (results.length > MAX_CHAT_PATH_PROOF_HISTORY) {
    results.length = MAX_CHAT_PATH_PROOF_HISTORY;
  }
}

export function getChatPathProofHistorySize(): number {
  return history.length;
}

export function getChatPathProofHistory(): readonly ChatPathProofHistoryEntry[] {
  return [...history];
}

export function getChatPathProofResults(): readonly RealChatOpenAiPathProofResult[] {
  return [...results];
}

export function getLatestChatPathProofResult(): RealChatOpenAiPathProofResult | null {
  return results[0] ?? null;
}
