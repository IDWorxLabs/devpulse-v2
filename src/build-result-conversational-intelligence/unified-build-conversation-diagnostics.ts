/**
 * Unified Build Conversation Layer V1 — diagnostics returned on /api/brain/respond.
 */

import type { BuildResultLlmResponseSource } from '../llm-connection-proof-v1/index.js';

export interface UnifiedBuildConversationDiagnostics {
  readOnly: true;
  responseSource: BuildResultLlmResponseSource;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  llmInvoked: boolean;
  rawLlmResponsePreview: string | null;
  finalResponsePreview: string | null;
  profileMismatchPassedToLlm: boolean;
  promptUsedStructuredEvidence: boolean;
  buildConversationalIntelligence: true;
}

export function previewResponseText(text: string, maxLength = 240): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

export function buildUnifiedBuildConversationDiagnostics(input: {
  responseSource: BuildResultLlmResponseSource;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  llmInvoked: boolean;
  rawLlmResponse: string | null;
  finalBrainResponse: string;
  profileMismatchPassedToLlm: boolean;
  promptUsedStructuredEvidence: boolean;
}): UnifiedBuildConversationDiagnostics {
  return {
    readOnly: true,
    responseSource: input.responseSource,
    fallbackUsed: input.fallbackUsed,
    fallbackReason: input.fallbackReason,
    llmInvoked: input.llmInvoked,
    rawLlmResponsePreview: input.rawLlmResponse
      ? previewResponseText(input.rawLlmResponse)
      : null,
    finalResponsePreview: previewResponseText(input.finalBrainResponse),
    profileMismatchPassedToLlm: input.profileMismatchPassedToLlm,
    promptUsedStructuredEvidence: input.promptUsedStructuredEvidence,
    buildConversationalIntelligence: true,
  };
}
