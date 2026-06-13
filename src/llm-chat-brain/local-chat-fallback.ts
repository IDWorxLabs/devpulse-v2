/**
 * Phase 26 — Local bounded fallback when LLM is unavailable.
 */

import { generateWorldClassChatResponse } from '../world-class-chat-brain/index.js';
import { buildDevPulseContextPackage } from './devpulse-context-package.js';
import { metadataFromContextPackage } from './llm-chat-types.js';
import { LLM_NOT_CONNECTED_MESSAGE } from './llm-provider.js';
import type { LlmChatBrainMetadata } from './llm-chat-types.js';

export interface LocalChatFallbackInput {
  message: string;
  draftResponse?: string;
  rootDir?: string;
  timestamp?: number;
  reason: string;
  mode?: 'disconnected' | 'judge-failure' | 'error';
}

export interface LocalChatFallbackResult {
  readOnly: true;
  finalAnswer: string;
  metadata: LlmChatBrainMetadata;
}

export function generateLocalChatFallback(input: LocalChatFallbackInput): LocalChatFallbackResult {
  const worldClass = generateWorldClassChatResponse({
    message: input.message,
    draftResponse: input.draftResponse ?? '',
    rootDir: input.rootDir,
    timestamp: input.timestamp,
  });

  let finalAnswer = worldClass.finalAnswer.trim();
  const warnings = [input.reason];
  const mode = input.mode ?? 'disconnected';

  if (!finalAnswer) {
    finalAnswer = mode === 'disconnected' ? LLM_NOT_CONNECTED_MESSAGE : worldClass.finalAnswer;
  } else if (mode === 'disconnected' && !finalAnswer.toLowerCase().includes('llm brain is not connected')) {
    finalAnswer = `${LLM_NOT_CONNECTED_MESSAGE}\n\n${finalAnswer}`;
    warnings.push(LLM_NOT_CONNECTED_MESSAGE);
  }

  const contextPackage = buildDevPulseContextPackage({
    rootDir: input.rootDir,
    message: input.message,
  });
  const ctxMeta = metadataFromContextPackage(contextPackage);

  return {
    readOnly: true,
    finalAnswer,
    metadata: {
      readOnly: true,
      usedLlm: false,
      llmConnected: false,
      fallbackUsed: true,
      provider: null,
      model: null,
      contextIncluded: ctxMeta.contextIncluded,
      evidenceIncluded: ctxMeta.evidenceIncluded,
      judgeScore: worldClass.judgement.score,
      warnings,
      repaired: worldClass.repaired,
      repairAttempted: false,
      contextSourcesUsed: ctxMeta.contextSourcesUsed,
      lastContextHydration: ctxMeta.lastContextHydration,
      hydratedFactCount: ctxMeta.hydratedFactCount,
      contextConfidence: ctxMeta.contextConfidence,
      identityLoaded: ctxMeta.identityLoaded,
      founderLoaded: ctxMeta.founderLoaded,
      productLoaded: ctxMeta.productLoaded,
      historyLoaded: ctxMeta.historyLoaded,
      selfEvolutionLoaded: ctxMeta.selfEvolutionLoaded,
      identityVersion: ctxMeta.identityVersion,
      founderVersion: ctxMeta.founderVersion,
      productVersion: ctxMeta.productVersion,
      currentProductIdentity: ctxMeta.currentProductIdentity,
      founderIdentity: ctxMeta.founderIdentity,
      companyIdentity: ctxMeta.companyIdentity,
      legacyIdentity: ctxMeta.legacyIdentity,
    },
  };
}
