/**
 * OpenAI Client Validator — client configuration validation (V1).
 */

import { loadLlmModelConfig } from '../llm-chat-brain/llm-provider.js';
import type { LlmModelConfig } from '../llm-chat-brain/llm-provider-types.js';
import { detectOpenAiKey } from './openai-key-detector.js';
import type { OpenAiClientStatusResult, OpenAiKeyStatusResult } from './openai-connectivity-types.js';

export function buildConnectivityModelConfig(env: NodeJS.ProcessEnv = process.env): LlmModelConfig {
  const keyStatus = detectOpenAiKey(env);
  const base = loadLlmModelConfig(env);
  const resolvedKey = keyStatus.status === 'PRESENT' ? resolveKeyFromEnv(env) : null;

  return {
    ...base,
    provider: 'openai',
    apiKey: resolvedKey,
  };
}

function resolveKeyFromEnv(env: NodeJS.ProcessEnv): string | null {
  return env.OPENAI_API_KEY?.trim() || env.LLM_API_KEY?.trim() || null;
}

export function validateOpenAiClient(input: {
  env?: NodeJS.ProcessEnv;
  keyStatus: OpenAiKeyStatusResult;
}): OpenAiClientStatusResult {
  const env = input.env ?? process.env;
  const config = buildConnectivityModelConfig(env);

  if (input.keyStatus.status === 'MISSING') {
    return {
      readOnly: true,
      status: 'NOT_INITIALIZED',
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs,
      configurationValid: false,
      reason: 'Client cannot initialize without a valid API key.',
    };
  }

  if (input.keyStatus.status === 'INVALID') {
    return {
      readOnly: true,
      status: 'INVALID_CONFIG',
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs,
      configurationValid: false,
      reason: 'Client configuration rejected due to invalid API key.',
    };
  }

  if (!config.model || config.model.length === 0) {
    return {
      readOnly: true,
      status: 'INVALID_CONFIG',
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs,
      configurationValid: false,
      reason: 'LLM model is not configured.',
    };
  }

  if (!config.baseUrl.startsWith('http')) {
    return {
      readOnly: true,
      status: 'INVALID_CONFIG',
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs,
      configurationValid: false,
      reason: 'LLM base URL is invalid.',
    };
  }

  return {
    readOnly: true,
    status: 'READY',
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl,
    timeoutMs: config.timeoutMs,
    configurationValid: true,
    reason: 'OpenAI-compatible client configuration is valid.',
  };
}
