/**
 * Founder Testing Mode V2 — bounded founder-style prompt vision checks.
 */

import { processBrainRequest } from '../command-center-brain/index.js';
import { evaluatePromptVision } from './founder-proxy-evaluator.js';
import { FOUNDER_TEST_V2_MAX_PROMPTS, FOUNDER_TEST_V2_PROMPTS } from './founder-testing-v2-bounds.js';
import type { PromptVisionResult } from './founder-testing-v2-types.js';

export function runBoundedPromptVisionChecks(deadlineMs: number): PromptVisionResult[] {
  const results: PromptVisionResult[] = [];
  const prompts = FOUNDER_TEST_V2_PROMPTS.slice(0, FOUNDER_TEST_V2_MAX_PROMPTS);
  const start = Date.now();

  for (const prompt of prompts) {
    if (Date.now() - start > deadlineMs) {
      results.push({
        prompt,
        responsePreview: '',
        visionAlignment: 0,
        usefulness: 0,
        clarity: 0,
        actionability: 0,
        nextStepQuality: 0,
        architectureLeakage: 'HIGH',
        leakageFindings: [],
        passed: false,
        issues: ['Skipped — V2 runtime budget exceeded'],
      });
      break;
    }

    try {
      const brain = processBrainRequest({ message: prompt, timestamp: Date.now() });
      results.push(evaluatePromptVision(prompt, brain.brainResponse ?? ''));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'brain request failed';
      results.push({
        prompt,
        responsePreview: '',
        visionAlignment: 0,
        usefulness: 0,
        clarity: 0,
        actionability: 0,
        nextStepQuality: 0,
        architectureLeakage: 'HIGH',
        leakageFindings: [],
        passed: false,
        issues: [message],
      });
    }
  }

  return results;
}
