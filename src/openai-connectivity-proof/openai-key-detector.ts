/**
 * OpenAI Key Detector — API key presence and format validation (V1).
 */

import { PLACEHOLDER_KEY_PATTERNS } from './openai-connectivity-registry.js';
import type { OpenAiKeyStatusResult } from './openai-connectivity-types.js';

function maskKey(key: string): string {
  if (key.length <= 8) return '***';
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

function isPlaceholderKey(key: string): boolean {
  const trimmed = key.trim();
  for (const pattern of PLACEHOLDER_KEY_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  if (trimmed.includes('placeholder') || trimmed.includes('your-api-key')) return true;
  return false;
}

function isValidOpenAiKeyFormat(key: string): boolean {
  const trimmed = key.trim();
  if (trimmed.length < 20) return false;
  if (!trimmed.startsWith('sk-')) return false;
  if (isPlaceholderKey(trimmed)) return false;
  return true;
}

export function resolveOpenAiApiKey(env: NodeJS.ProcessEnv = process.env): {
  key: string | null;
  source: 'OPENAI_API_KEY' | 'LLM_API_KEY' | null;
} {
  const openAiKey = env.OPENAI_API_KEY?.trim();
  if (openAiKey) return { key: openAiKey, source: 'OPENAI_API_KEY' };

  const llmKey = env.LLM_API_KEY?.trim();
  if (llmKey) return { key: llmKey, source: 'LLM_API_KEY' };

  return { key: null, source: null };
}

export function detectOpenAiKey(env: NodeJS.ProcessEnv = process.env): OpenAiKeyStatusResult {
  const resolved = resolveOpenAiApiKey(env);

  if (!resolved.key) {
    return {
      readOnly: true,
      status: 'MISSING',
      keySource: null,
      maskedPreview: null,
      reason: 'Neither OPENAI_API_KEY nor LLM_API_KEY is configured.',
    };
  }

  if (!isValidOpenAiKeyFormat(resolved.key)) {
    return {
      readOnly: true,
      status: 'INVALID',
      keySource: resolved.source,
      maskedPreview: maskKey(resolved.key),
      reason: isPlaceholderKey(resolved.key)
        ? 'API key appears to be a placeholder value.'
        : 'API key format is invalid (expected sk- prefix and sufficient length).',
    };
  }

  return {
    readOnly: true,
    status: 'PRESENT',
    keySource: resolved.source,
    maskedPreview: maskKey(resolved.key),
    reason: `API key present via ${resolved.source}.`,
  };
}
