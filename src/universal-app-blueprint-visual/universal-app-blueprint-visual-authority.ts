/**
 * Universal App Blueprint Visual Validation Authority V1 — orchestrator.
 */

import {
  createPlaywrightVisualValidationPage,
  runBlueprintVisualChecks,
} from './universal-app-blueprint-visual-runner.js';
import { buildBlueprintVisualAssessment } from './universal-app-blueprint-visual-scoring.js';
import { formatBlueprintVisualReportMarkdown } from './universal-app-blueprint-visual-report.js';
import type {
  BlueprintVisualAssessment,
  RunBlueprintVisualValidationInput,
} from './universal-app-blueprint-visual-types.js';

let lastAssessment: BlueprintVisualAssessment | null = null;

export function getLastBlueprintVisualAssessment(): BlueprintVisualAssessment | null {
  return lastAssessment;
}

export function resetBlueprintVisualAssessmentForTests(): void {
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

export async function runUniversalAppBlueprintVisualValidation(
  input: RunBlueprintVisualValidationInput,
): Promise<BlueprintVisualAssessment> {
  const playwrightAvailable = await probePlaywright();
  if (!playwrightAvailable) {
    const assessment = buildBlueprintVisualAssessment({
      previewUrl: input.previewUrl,
      checks: [
        {
          id: 'playwright-required',
          category: 'launch',
          label: 'Playwright available for rendered validation',
          passed: false,
          detail: 'Playwright is required for Universal App Blueprint visual validation',
          critical: true,
        },
      ],
      viewportEvidence: [],
      reportMarkdown: '',
    });
    assessment.reportMarkdown = formatBlueprintVisualReportMarkdown(assessment);
    lastAssessment = assessment;
    return assessment;
  }

  const playwright = await import('playwright');
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const visualPage = createPlaywrightVisualValidationPage(page);
    const { checks, viewportEvidence } = await runBlueprintVisualChecks(visualPage, input.previewUrl, {
      coreNavLabel: input.coreNavLabel,
    });
    const draft = buildBlueprintVisualAssessment({
      previewUrl: input.previewUrl,
      checks,
      viewportEvidence,
      reportMarkdown: '',
    });
    draft.reportMarkdown = formatBlueprintVisualReportMarkdown(draft);
    lastAssessment = draft;
    return draft;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const assessment = buildBlueprintVisualAssessment({
      previewUrl: input.previewUrl,
      checks: [
        {
          id: 'rendered-validation-runtime',
          category: 'launch',
          label: 'Rendered application validation completed',
          passed: false,
          detail: message,
          critical: true,
        },
      ],
      viewportEvidence: [],
      reportMarkdown: '',
    });
    assessment.reportMarkdown = formatBlueprintVisualReportMarkdown(assessment);
    lastAssessment = assessment;
    return assessment;
  } finally {
    await browser.close();
  }
}

/** Register source-derived blueprint visual checks (structure/build artifact — not Playwright viewport). */
export function registerSourceDerivedBlueprintVisualAssessment(input: {
  previewUrl: string;
  checks: import('./universal-app-blueprint-visual-types.js').BlueprintVisualCheck[];
  viewportEvidence?: string[];
}): BlueprintVisualAssessment {
  const assessment = buildBlueprintVisualAssessment({
    previewUrl: input.previewUrl,
    checks: input.checks,
    viewportEvidence: input.viewportEvidence ?? [],
    reportMarkdown: '',
  });
  assessment.reportMarkdown = formatBlueprintVisualReportMarkdown(assessment);
  lastAssessment = assessment;
  return assessment;
}
