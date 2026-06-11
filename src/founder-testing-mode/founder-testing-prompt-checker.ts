/**
 * Founder Testing Mode — bounded Command Center brain prompt checks.
 */

import { processBrainRequest } from '../command-center-brain/index.js';
import { FOUNDER_TEST_MAX_PROMPTS } from './founder-testing-bounds.js';
import { FOUNDER_TEST_PROMPTS } from './founder-testing-nav-spec.js';
import type { FounderTestCheck, PromptTestResult } from './founder-testing-types.js';

const OVERPROMISE_PATTERNS = [
  /\bdeployed\b/i,
  /\bexecuted successfully\b/i,
  /\bfiles? (have been|were) (written|modified)\b/i,
  /\bbuild completed\b/i,
  /\bpreview is live at http/i,
] as const;

const ARCHITECTURE_LEAK_PATTERNS = [
  /devpulse_v2_/i,
  /owner_module/i,
  /phase \d+\.\d+ foundation registry/i,
  /validate:[a-z0-9-]+/i,
] as const;

const NEXT_ACTION_PATTERNS = [
  /\bnext\b/i,
  /\bstart\b/i,
  /\btry\b/i,
  /\bask\b/i,
  /\bopen\b/i,
  /\bgo to\b/i,
  /\brecommend/i,
  /\bsuggest/i,
] as const;

function check(condition: boolean, name: string, passDetail: string, failDetail: string): FounderTestCheck {
  return { name, passed: condition, detail: condition ? passDetail : failDetail };
}

function evaluatePromptResponse(prompt: string, response: string): PromptTestResult {
  const trimmed = response.trim();
  const issues: string[] = [];
  const checks: FounderTestCheck[] = [];

  checks.push(
    check(trimmed.length >= 40, 'response-exists', 'Response has substance', 'Response too short or empty'),
  );

  const understandable = trimmed.split(/\s+/).length >= 8 && !/^error\b/i.test(trimmed);
  checks.push(
    check(understandable, 'understandable', 'Response is understandable', 'Response unclear or error-like'),
  );

  const productLanguage =
    /aidevengine/i.test(trimmed) ||
    /project memory/i.test(trimmed) ||
    /live preview/i.test(trimmed) ||
    /verification/i.test(trimmed) ||
    /command center/i.test(trimmed) ||
    /build/i.test(trimmed);
  checks.push(
    check(productLanguage, 'product-language', 'Uses AiDevEngine product language', 'Missing product-facing language'),
  );

  const overpromises = OVERPROMISE_PATTERNS.some((p) => p.test(trimmed));
  checks.push(
    check(!overpromises, 'no-overpromise', 'Does not overpromise execution', 'Overpromises unavailable execution'),
  );
  if (overpromises) issues.push('Response overpromises execution or deployment');

  const archLeak = ARCHITECTURE_LEAK_PATTERNS.some((p) => p.test(trimmed));
  checks.push(
    check(!archLeak, 'no-arch-leak', 'No internal architecture exposure', 'Exposes internal architecture'),
  );
  if (archLeak) issues.push('Response exposes internal architecture details');

  const hasNextAction = NEXT_ACTION_PATTERNS.some((p) => p.test(trimmed));
  checks.push(
    check(hasNextAction, 'next-action', 'Gives next action guidance', 'Missing clear next action'),
  );
  if (!hasNextAction) issues.push('Response lacks clear next action');

  return {
    prompt,
    passed: checks.every((c) => c.passed),
    responsePreview: trimmed.slice(0, 280) + (trimmed.length > 280 ? '…' : ''),
    issues,
    checks,
  };
}

export function runBoundedPromptChecks(deadlineMs: number): PromptTestResult[] {
  const results: PromptTestResult[] = [];
  const prompts = FOUNDER_TEST_PROMPTS.slice(0, FOUNDER_TEST_MAX_PROMPTS);
  const start = Date.now();

  for (const prompt of prompts) {
    if (Date.now() - start > deadlineMs) {
      results.push({
        prompt,
        passed: false,
        responsePreview: '',
        issues: ['Skipped — total runtime budget exceeded'],
        checks: [{ name: 'timeout', passed: false, detail: 'Prompt skipped due to runtime bound' }],
      });
      break;
    }

    try {
      const result = processBrainRequest({ message: prompt, timestamp: Date.now() });
      results.push(evaluatePromptResponse(prompt, result.brainResponse ?? ''));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'brain request failed';
      results.push({
        prompt,
        passed: false,
        responsePreview: '',
        issues: [message],
        checks: [{ name: 'brain-error', passed: false, detail: message }],
      });
    }
  }

  return results;
}
