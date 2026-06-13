/**
 * Phase 26.4 — Chat response simulator using the same brain path as the UI.
 */

import { processBrainRequest } from '../command-center-brain/index.js';
import { generateLlmBackedChatResponseAsync } from '../llm-chat-brain/index.js';
import type { LlmProvider } from '../llm-chat-brain/llm-provider-types.js';
import type { ChatStressScenarioDefinition, ChatStressScenarioRun } from './chat-stress-simulation-types.js';

export async function simulateChatStressResponse(input: {
  scenario: ChatStressScenarioDefinition;
  rootDir?: string;
  providerOverride?: LlmProvider;
}): Promise<ChatStressScenarioRun> {
  const started = Date.now();
  const rootDir = input.rootDir ?? process.cwd();
  const prompt = input.scenario.prompt;

  const brainResult = processBrainRequest({
    message: prompt,
    timestamp: Date.now(),
  });

  const llmResult = await generateLlmBackedChatResponseAsync({
    message: prompt,
    draftResponse: brainResult.brainResponse,
    rootDir,
    providerOverride: input.providerOverride,
  });

  return {
    readOnly: true,
    scenarioId: input.scenario.id,
    category: input.scenario.category,
    prompt,
    draftResponse: brainResult.brainResponse,
    finalAnswer: llmResult.finalAnswer,
    brainPath: 'command-center-brain+llm-chat-brain',
    usedLlm: llmResult.metadata.usedLlm,
    fallbackUsed: llmResult.metadata.fallbackUsed,
    contextIncluded: llmResult.metadata.contextIncluded,
    judgeScore: llmResult.metadata.judgeScore,
    durationMs: Date.now() - started,
  };
}

export async function simulateChatStressBatch(input: {
  scenarios: ChatStressScenarioDefinition[];
  rootDir?: string;
  providerOverride?: LlmProvider;
  concurrency?: number;
}): Promise<ChatStressScenarioRun[]> {
  const concurrency = Math.max(1, input.concurrency ?? 4);
  const runs: ChatStressScenarioRun[] = [];
  const queue = [...input.scenarios];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const scenario = queue.shift();
      if (!scenario) return;
      runs.push(
        await simulateChatStressResponse({
          scenario,
          rootDir: input.rootDir,
          providerOverride: input.providerOverride,
        }),
      );
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, input.scenarios.length) }, () => worker()));
  return runs.sort((a, b) => a.scenarioId.localeCompare(b.scenarioId));
}
