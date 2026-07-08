/**
 * One-Prompt Calculator Build Ready V1 — validator script.
 */

import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  ONE_PROMPT_CALCULATOR_BUILD_READY_PASS,
  validateOnePromptCalculatorBuildReady,
} from './lib/one-prompt-calculator-build-ready-v1.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

async function main(): Promise<void> {
  console.log('');
  console.log('One-Prompt Calculator Build Ready V1');
  console.log('====================================');
  console.log('');

  const result = await validateOnePromptCalculatorBuildReady(ROOT);

  for (const check of result.checks) {
    console.log(`[${check.passed ? 'PASS' : 'FAIL'}] ${check.name} — ${check.detail}`);
  }

  console.log('');
  console.log(`Duration: ${result.durationMs}ms`);
  console.log(`Materialization quality: ${result.materializationQualityScore ?? 'n/a'}%`);
  console.log('');

  if (result.passed) {
    console.log(ONE_PROMPT_CALCULATOR_BUILD_READY_PASS);
    return;
  }

  console.log('ONE_PROMPT_CALCULATOR_BUILD_READY_FAIL');
  process.exit(1);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
