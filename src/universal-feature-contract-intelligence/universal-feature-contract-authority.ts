/**
 * Universal Feature Contract Intelligence V1 — orchestrator.
 */

import { generateFeatureRealityValidationPlan } from './feature-reality-validation-plan-generator.js';
import { formatUniversalFeatureContractReportMarkdown } from './universal-feature-contract-report.js';
import { buildUniversalFeatureContractAssessment } from './universal-feature-contract-scoring.js';
import type {
  RunUniversalFeatureValidationInput,
  UniversalFeatureContractAssessment,
} from './universal-feature-contract-types.js';
import {
  createPlaywrightUniversalValidationPage,
  runUniversalFeatureRealityChecks,
} from './universal-feature-validation-runner.js';

let lastAssessment: UniversalFeatureContractAssessment | null = null;

export function getLastUniversalFeatureContractAssessment(): UniversalFeatureContractAssessment | null {
  return lastAssessment;
}

export function resetUniversalFeatureContractAssessmentForTests(): void {
  lastAssessment = null;
}

async function probePlaywright(): Promise<boolean> {
  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

export async function runUniversalFeatureValidation(
  input: RunUniversalFeatureValidationInput,
): Promise<UniversalFeatureContractAssessment> {
  const plan = generateFeatureRealityValidationPlan(input.contract);

  const playwrightAvailable = await probePlaywright();
  if (!playwrightAvailable) {
    const assessment = buildUniversalFeatureContractAssessment({
      previewUrl: input.previewUrl,
      contract: input.contract,
      plan,
      checks: [
        {
          id: 'playwright-required',
          category: 'execution',
          entityId: null,
          actionId: null,
          label: 'Playwright available for universal feature validation',
          passed: false,
          detail: 'Playwright is required for Universal Feature Contract validation',
          critical: true,
        },
      ],
      reportMarkdown: '',
    });
    assessment.reportMarkdown = formatUniversalFeatureContractReportMarkdown(assessment);
    lastAssessment = assessment;
    return assessment;
  }

  const playwright = await import('playwright');
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const validationPage = createPlaywrightUniversalValidationPage(page);
    const checks = await runUniversalFeatureRealityChecks(validationPage, {
      previewUrl: input.previewUrl,
      plan,
    });
    const draft = buildUniversalFeatureContractAssessment({
      previewUrl: input.previewUrl,
      contract: input.contract,
      plan,
      checks,
      reportMarkdown: '',
    });
    draft.reportMarkdown = formatUniversalFeatureContractReportMarkdown(draft);
    lastAssessment = draft;
    return draft;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const assessment = buildUniversalFeatureContractAssessment({
      previewUrl: input.previewUrl,
      contract: input.contract,
      plan,
      checks: [
        {
          id: 'universal-feature-validation-runtime',
          category: 'execution',
          entityId: null,
          actionId: null,
          label: 'Universal feature runtime validation completed',
          passed: false,
          detail: message,
          critical: true,
        },
      ],
      reportMarkdown: '',
    });
    assessment.reportMarkdown = formatUniversalFeatureContractReportMarkdown(assessment);
    lastAssessment = assessment;
    return assessment;
  } finally {
    await browser.close();
  }
}
