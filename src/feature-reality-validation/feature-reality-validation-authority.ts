/**
 * Feature Reality Validation Authority V1 — orchestrator.
 */

import {
  createPlaywrightFeatureValidationPage,
  runFeatureRealityChecks,
} from './feature-reality-validation-runner.js';
import { buildFeatureRealityAssessment } from './feature-reality-validation-scoring.js';
import { formatFeatureRealityReportMarkdown } from './feature-reality-validation-report.js';
import { FEATURE_REALITY_V1_PASS_TOKEN } from './feature-reality-validation-registry.js';
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

/** Register source-derived feature checks (static inspection — not Playwright runtime). */
export function registerSourceDerivedFeatureRealityAssessment(input: {
  previewUrl: string;
  contractId: string;
  checks: import('./feature-reality-validation-types.js').FeatureRealityCheck[];
}): FeatureRealityAssessment {
  const assessment = buildFeatureRealityAssessment({
    previewUrl: input.previewUrl,
    contractId: input.contractId,
    checks: input.checks,
    reportMarkdown: '',
  });
  assessment.reportMarkdown = formatFeatureRealityReportMarkdown(assessment);
  lastAssessment = assessment;
  return assessment;
}

/** Register workspace-scanned feature checks when live preview evidence is not yet available. */
export function registerWorkspaceDerivedFeatureRealityAssessment(input: {
  previewUrl: string;
  contractId: string;
  checks: import('./feature-reality-validation-types.js').FeatureRealityCheck[];
  evidenceStatus?: 'DEGRADED_WITH_WORKSPACE_EVIDENCE' | 'PASS' | 'FAIL';
}): FeatureRealityAssessment {
  const assessment = buildFeatureRealityAssessment({
    previewUrl: input.previewUrl,
    contractId: input.contractId,
    checks: input.checks,
    reportMarkdown: '',
  });
  const criticalMissing = assessment.checks.filter((check) => check.critical && !check.passed);
  const degraded = input.evidenceStatus === 'DEGRADED_WITH_WORKSPACE_EVIDENCE';
  const workspaceSufficient = degraded && criticalMissing.length === 0;

  const finalized: FeatureRealityAssessment = workspaceSufficient
    ? {
        ...assessment,
        passed: true,
        passToken: FEATURE_REALITY_V1_PASS_TOKEN,
        blocksLaunchReadiness: false,
        blocksLaunchReadinessReason: null,
        evidenceMode: 'WORKSPACE_DERIVED',
        degradedWithWorkspaceEvidence: true,
        verdict:
          assessment.verdict === 'FEATURE_FAIL' ? 'FEATURE_ACCEPTABLE' : assessment.verdict,
      }
    : {
        ...assessment,
        evidenceMode: 'WORKSPACE_DERIVED',
        degradedWithWorkspaceEvidence: degraded,
      };

  finalized.reportMarkdown = formatFeatureRealityReportMarkdown(finalized);
  lastAssessment = finalized;
  return finalized;
}
