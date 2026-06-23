/**
 * Engineering Reality Authority V1 — orchestrator.
 */

import { analyzeEngineeringBuild } from './engineering-build-analyzer.js';
import { formatEngineeringRealityReportMarkdown } from './engineering-reality-report.js';
import {
  createPlaywrightEngineeringValidationPage,
  runEngineeringRuntimeChecks,
} from './engineering-reality-runner.js';
import { buildEngineeringRealityAssessment } from './engineering-reality-scoring.js';
import type {
  EngineeringRealityAssessment,
  EngineeringRuntimeHealth,
  RunEngineeringRealityValidationInput,
} from './engineering-reality-types.js';

let lastAssessment: EngineeringRealityAssessment | null = null;

export function getLastEngineeringRealityAssessment(): EngineeringRealityAssessment | null {
  return lastAssessment;
}

export function resetEngineeringRealityAssessmentForTests(): void {
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

export async function runEngineeringRealityValidation(
  input: RunEngineeringRealityValidationInput,
): Promise<EngineeringRealityAssessment> {
  const checks: import('./engineering-reality-types.js').EngineeringRealityCheck[] = [];
  const buildAnalysis = analyzeEngineeringBuild({
    workspaceDir: input.workspaceDir,
    checks,
  });

  const playwrightAvailable = await probePlaywright();
  if (!playwrightAvailable) {
    const assessment = buildEngineeringRealityAssessment({
      previewUrl: input.previewUrl,
      contractId: input.contractId,
      productName: input.productName,
      checks: [
        ...checks,
        {
          id: 'playwright-required',
          category: 'performance',
          label: 'Playwright available for engineering runtime validation',
          passed: false,
          detail: 'Playwright is required for Engineering Reality validation',
          critical: true,
        },
      ],
      buildAnalysis,
      loadTimeAnalysis: { launchMs: 0, shellMs: 0, navigationMs: 0, detail: 'not measured' },
      runtimeHealth: { consoleErrors: [], consoleWarnings: [], detail: 'not measured' },
      reportMarkdown: '',
    });
    assessment.reportMarkdown = formatEngineeringRealityReportMarkdown(assessment);
    lastAssessment = assessment;
    return assessment;
  }

  const playwright = await import('playwright');
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const { page: engineeringPage, runtimeHealth } = createPlaywrightEngineeringValidationPage(page);
    const loadTimeAnalysis = await runEngineeringRuntimeChecks(
      engineeringPage,
      { previewUrl: input.previewUrl, navLabel: input.navLabel },
      checks,
      runtimeHealth,
    );
    const draft = buildEngineeringRealityAssessment({
      previewUrl: input.previewUrl,
      contractId: input.contractId,
      productName: input.productName,
      checks,
      buildAnalysis,
      loadTimeAnalysis,
      runtimeHealth,
      reportMarkdown: '',
    });
    draft.reportMarkdown = formatEngineeringRealityReportMarkdown(draft);
    lastAssessment = draft;
    return draft;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const assessment = buildEngineeringRealityAssessment({
      previewUrl: input.previewUrl,
      contractId: input.contractId,
      productName: input.productName,
      checks: [
        ...checks,
        {
          id: 'engineering-validation-runtime',
          category: 'performance',
          label: 'Engineering runtime validation completed',
          passed: false,
          detail: message,
          critical: true,
        },
      ],
      buildAnalysis,
      loadTimeAnalysis: { launchMs: 0, shellMs: 0, navigationMs: 0, detail: message },
      runtimeHealth: { consoleErrors: [message], consoleWarnings: [], detail: message },
      reportMarkdown: '',
    });
    assessment.reportMarkdown = formatEngineeringRealityReportMarkdown(assessment);
    lastAssessment = assessment;
    return assessment;
  } finally {
    await browser.close();
  }
}
