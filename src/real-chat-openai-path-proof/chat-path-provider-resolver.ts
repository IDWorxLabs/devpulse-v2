/**
 * Chat Path Provider Resolver — routes chat to OpenAI provider (V1).
 */

import { loadLlmModelConfig } from '../llm-chat-brain/llm-provider.js';
import { detectOpenAiKey } from '../openai-connectivity-proof/openai-key-detector.js';
import { validateOpenAiClient } from '../openai-connectivity-proof/openai-client-validator.js';
import type { ChatPathProofMode, ChatPathProviderResolution } from './real-chat-openai-path-types.js';

export function resolveChatPathProvider(input: {
  env?: NodeJS.ProcessEnv;
  mode: ChatPathProofMode;
}): ChatPathProviderResolution {
  const env = input.env ?? process.env;
  const keyStatus = detectOpenAiKey(env);
  const clientStatus = validateOpenAiClient({ env, keyStatus });
  const config = loadLlmModelConfig(env);

  const connectivityPrerequisitesMet =
    keyStatus.status === 'PRESENT' && clientStatus.status === 'READY';

  if (input.mode === 'real') {
    if (config.provider !== 'openai') {
      return {
        readOnly: true,
        providerResolved: config.provider,
        providerRoutingValid: false,
        openAiProviderSelected: false,
        connectivityPrerequisitesMet,
        model: config.model,
        reason: `Real mode requires OpenAI provider but LLM_PROVIDER resolves to ${config.provider}.`,
      };
    }

    if (!connectivityPrerequisitesMet) {
      return {
        readOnly: true,
        providerResolved: config.provider,
        providerRoutingValid: false,
        openAiProviderSelected: true,
        connectivityPrerequisitesMet: false,
        model: config.model,
        reason: 'OpenAI connectivity prerequisites not met (key or client invalid).',
      };
    }

    return {
      readOnly: true,
      providerResolved: 'openai',
      providerRoutingValid: true,
      openAiProviderSelected: true,
      connectivityPrerequisitesMet: true,
      model: config.model,
      reason: 'Chat path resolves to OpenAI with valid connectivity prerequisites.',
    };
  }

  // Mock mode — provider override expected from caller
  return {
    readOnly: true,
    providerResolved: config.provider,
    providerRoutingValid: true,
    openAiProviderSelected: config.provider === 'openai' || input.mode === 'mock',
    connectivityPrerequisitesMet,
    model: config.model,
    reason: 'Mock mode — provider override supplied by diagnostic runner.',
  };
}
