/**
 * Feature Reality Validation Authority V1 — orchestrator.
 */

import {
  createPlaywrightFeatureValidationPage,
  runFeatureRealityChecks,
} from './feature-reality-validation-runner.js';
import { buildFeatureRealityAssessment } from './feature-reality-validation-scoring.js';
import { formatFeatureRealityReportMarkdown } from './feature-reality-validation-report.js';
import type {
  FeatureRealityAssessment,
  RunFeatureRealityValidationInput,
} from './feature-reality-validation-types.js';

let lastAssessment: FeatureRealityAssessment | null = null;

export function getLastFeatureRealityAssessment(): FeatureRealityAssessment | null {
  return lastAssessment;
}

export function resetFeatureRealityAssessmentForTests(): void {
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

export async function runFeatureRealityValidation(
  input: RunFeatureRealityValidationInput,
): Promise<FeatureRealityAssessment> {
  const playwrightAvailable = await probePlaywright();
  if (!playwrightAvailable) {
    const assessment = buildFeatureRealityAssessment({
      previewUrl: input.previewUrl,
      contractId: input.contract.contractId,
      checks: [
        {
          id: 'playwright-required',
          category: 'execution',
          featureId: null,
          label: 'Playwright available for rendered feature validation',
          passed: false,
          detail: 'Playwright is required for Feature Reality Validation',
          critical: true,
        },
      ],
      reportMarkdown: '',
    });
    assessment.reportMarkdown = formatFeatureRealityReportMarkdown(assessment);
    lastAssessment = assessment;
    return assessment;
  }

  const playwright = await import('playwright');
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const featurePage = createPlaywrightFeatureValidationPage(page);
    const checks = await runFeatureRealityChecks(featurePage, input);
    const draft = buildFeatureRealityAssessment({
      previewUrl: input.previewUrl,
      contractId: input.contract.contractId,
      checks,
      reportMarkdown: '',
    });
    draft.reportMarkdown = formatFeatureRealityReportMarkdown(draft);
    lastAssessment = draft;
    return draft;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const assessment = buildFeatureRealityAssessment({
      previewUrl: input.previewUrl,
      contractId: input.contract.contractId,
      checks: [
        {
          id: 'feature-validation-runtime',
          category: 'execution',
          featureId: null,
          label: 'Feature runtime validation completed',
          passed: false,
          detail: message,
          critical: true,
        },
      ],
      reportMarkdown: '',
    });
    assessment.reportMarkdown = formatFeatureRealityReportMarkdown(assessment);
    lastAssessment = assessment;
    return assessment;
  } finally {
    await browser.close();
  }
}
