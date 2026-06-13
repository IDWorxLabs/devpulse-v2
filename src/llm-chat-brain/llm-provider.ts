/**
 * Phase 26 — LLM provider abstraction (OpenAI-compatible fetch, mock for tests).
 */

import type {
  LlmChatRequest,
  LlmChatResponse,
  LlmModelConfig,
  LlmProvider,
  LlmProviderError,
  LlmProviderName,
  LlmProviderStatus,
} from './llm-provider-types.js';

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_TOKENS = 1800;
const DEFAULT_TEMPERATURE = 0.55;
const DEFAULT_OPENAI_BASE = 'https://api.openai.com/v1';

let testProviderOverride: LlmProvider | null = null;

export function setLlmProviderForTests(provider: LlmProvider | null): void {
  testProviderOverride = provider;
}

export function resetLlmProviderForTests(): void {
  testProviderOverride = null;
}

function parseIntEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseFloatEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadLlmModelConfig(env: NodeJS.ProcessEnv = process.env): LlmModelConfig {
  const providerRaw = (env.LLM_PROVIDER ?? 'openai').trim().toLowerCase();
  const provider: LlmProviderName =
    providerRaw === 'mock' ? 'mock' : providerRaw === 'none' ? 'none' : 'openai';

  return {
    readOnly: true,
    provider,
    model: env.LLM_MODEL?.trim() || DEFAULT_MODEL,
    apiKey: env.LLM_API_KEY?.trim() || null,
    timeoutMs: parseIntEnv(env.LLM_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    maxTokens: parseIntEnv(env.LLM_MAX_TOKENS, DEFAULT_MAX_TOKENS),
    temperature: parseFloatEnv(env.LLM_TEMPERATURE, DEFAULT_TEMPERATURE),
    baseUrl: env.LLM_BASE_URL?.trim() || DEFAULT_OPENAI_BASE,
  };
}

function createProviderError(
  message: string,
  code: LlmProviderError['code'],
  provider: LlmProviderName,
  extra?: Partial<LlmProviderError>,
): LlmProviderError {
  const error = new Error(message) as LlmProviderError;
  error.name = 'LlmProviderError';
  error.code = code;
  error.provider = provider;
  error.retryable = extra?.retryable ?? false;
  error.statusCode = extra?.statusCode;
  return error;
}

class OpenAiLlmProvider implements LlmProvider {
  readonly name: LlmProviderName = 'openai';

  constructor(private readonly config: LlmModelConfig) {}

  get model(): string {
    return this.config.model;
  }

  getStatus(): LlmProviderStatus {
    if (!this.config.apiKey) {
      return {
        readOnly: true,
        connected: false,
        provider: this.name,
        model: this.config.model,
        reason: 'LLM_API_KEY is not configured',
      };
    }
    return {
      readOnly: true,
      connected: true,
      provider: this.name,
      model: this.config.model,
    };
  }

  async chat(request: LlmChatRequest): Promise<LlmChatResponse> {
    const status = this.getStatus();
    if (!status.connected) {
      throw createProviderError('LLM_API_KEY is missing', 'MISSING_API_KEY', this.name, {
        retryable: false,
      });
    }

    const controller = new AbortController();
    const timeoutMs = request.timeoutMs ?? this.config.timeoutMs;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model ?? this.config.model,
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: request.maxTokens ?? this.config.maxTokens,
          temperature: request.temperature ?? this.config.temperature,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw createProviderError(
          `LLM HTTP ${response.status}`,
          'HTTP_ERROR',
          this.name,
          { statusCode: response.status, retryable: response.status >= 500 },
        );
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const content = payload.choices?.[0]?.message?.content?.trim() ?? '';
      if (!content) {
        throw createProviderError('LLM returned empty content', 'INVALID_RESPONSE', this.name);
      }

      return {
        readOnly: true,
        content,
        provider: this.name,
        model: request.model ?? this.config.model,
        finishReason: payload.choices?.[0]?.finish_reason ?? null,
        usage: {
          promptTokens: payload.usage?.prompt_tokens ?? null,
          completionTokens: payload.usage?.completion_tokens ?? null,
          totalTokens: payload.usage?.total_tokens ?? null,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw createProviderError(`LLM request timed out after ${timeoutMs}ms`, 'TIMEOUT', this.name, {
          retryable: true,
        });
      }
      if ((error as LlmProviderError).code) throw error;
      throw createProviderError(
        error instanceof Error ? error.message : 'Unknown LLM error',
        'HTTP_ERROR',
        this.name,
        { retryable: true },
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

class MockLlmProvider implements LlmProvider {
  readonly name: LlmProviderName = 'mock';
  private queue: string[];

  constructor(
    private readonly config: LlmModelConfig,
    responses: string[] = [],
  ) {
    this.queue = [...responses];
  }

  get model(): string {
    return this.config.model;
  }

  getStatus(): LlmProviderStatus {
    return {
      readOnly: true,
      connected: true,
      provider: this.name,
      model: this.config.model,
    };
  }

  async chat(request: LlmChatRequest): Promise<LlmChatResponse> {
    const lastUser = [...request.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const queued = this.queue.shift();
    const content =
      queued ??
      `Mock LLM response for: ${lastUser.slice(0, 120)}. I am AiDevEngine with bounded DevPulse evidence. Next: run Founder Test if you want fresh proof.`;

    return {
      readOnly: true,
      content,
      provider: this.name,
      model: this.config.model,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 80, totalTokens: 180 },
    };
  }
}

class DisconnectedLlmProvider implements LlmProvider {
  readonly name: LlmProviderName = 'none';

  constructor(private readonly config: LlmModelConfig) {}

  get model(): string {
    return this.config.model;
  }

  getStatus(): LlmProviderStatus {
    return {
      readOnly: true,
      connected: false,
      provider: this.name,
      model: this.config.model,
      reason: 'LLM provider disabled',
    };
  }

  async chat(): Promise<LlmChatResponse> {
    throw createProviderError('LLM provider is disabled', 'MISSING_API_KEY', this.name);
  }
}

export function createMockLlmProvider(responses: string[], config?: Partial<LlmModelConfig>): LlmProvider {
  const base = loadLlmModelConfig({ LLM_PROVIDER: 'mock', LLM_MODEL: 'mock-model' });
  return new MockLlmProvider({ ...base, ...config, provider: 'mock' }, responses);
}

export function createLlmProvider(config: LlmModelConfig = loadLlmModelConfig()): LlmProvider {
  if (testProviderOverride) return testProviderOverride;
  if (config.provider === 'mock') return new MockLlmProvider(config);
  if (config.provider === 'none') return new DisconnectedLlmProvider(config);
  return new OpenAiLlmProvider(config);
}

export function getLlmProviderStatus(config: LlmModelConfig = loadLlmModelConfig()): LlmProviderStatus {
  return createLlmProvider(config).getStatus();
}

export const LLM_NOT_CONNECTED_MESSAGE =
  'LLM brain is not connected. I can use local bounded responses only.';
