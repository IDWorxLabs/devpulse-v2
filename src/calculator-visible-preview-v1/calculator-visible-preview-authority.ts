/**
 * Calculator Visible Preview V1 — DOM + interaction validation for one-prompt calculator builds.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  auditSimpleUtilityWorkspaceMount,
} from '../simple-utility-app/simple-utility-app-entry-generator.js';
import { CALCULATOR_BUILD_PROMPT } from '../simple-utility-app/simple-utility-constants.js';

export const ONE_PROMPT_CALCULATOR_VISIBLE_PREVIEW_PASS =
  'ONE_PROMPT_CALCULATOR_VISIBLE_PREVIEW_PASS' as const;

export const GENERIC_SHELL_MARKERS = [
  'modular application shell with navigation',
  'Welcome to calculator',
  'Get started',
  'data-blueprint="welcome-screen"',
] as const;

export interface CalculatorVisiblePreviewCheck {
  readOnly: true;
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  critical: boolean;
}

export interface CalculatorVisiblePreviewResult {
  readOnly: true;
  passed: boolean;
  status: 'PASS' | 'FAIL' | 'PENDING' | 'SKIPPED';
  previewUrl: string | null;
  checks: CalculatorVisiblePreviewCheck[];
  failureReasons: string[];
  interactionResult: string | null;
  genericShellDetected: boolean;
  workspaceMountPassed: boolean;
  previewFreshnessPassed: boolean;
}

export interface ValidateCalculatorVisiblePreviewInput {
  previewUrl: string | null;
  workspaceDir: string;
  projectRootDir?: string;
  expectedWorkspaceFingerprint?: string | null;
}

function pushCheck(
  checks: CalculatorVisiblePreviewCheck[],
  input: Omit<CalculatorVisiblePreviewCheck, 'readOnly'>,
): void {
  checks.push({ readOnly: true, ...input });
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

function auditPreviewFreshness(
  workspaceDir: string,
  html: string,
): { passed: boolean; detail: string } {
  const packagePath = join(workspaceDir, 'package.json');
  if (!existsSync(packagePath)) {
    return { passed: false, detail: 'workspace package.json missing for freshness check' };
  }
  const pkgName = JSON.parse(readFileSync(packagePath, 'utf8')) as { name?: string };
  if (pkgName.name && html.includes(pkgName.name)) {
    return { passed: true, detail: 'Preview HTML references current workspace package name' };
  }
  if (html.includes('/src/main.tsx') || html.includes('@vite/client') || html.includes('id="root"')) {
    return { passed: true, detail: 'Preview serves Vite dev shell for current workspace' };
  }
  return {
    passed: false,
    detail: 'Preview HTML does not match expected Vite workspace shell markers',
  };
}

async function runPlaywrightCalculatorChecks(
  previewUrl: string,
): Promise<{
  checks: CalculatorVisiblePreviewCheck[];
  interactionResult: string | null;
  genericShellDetected: boolean;
}> {
  const checks: CalculatorVisiblePreviewCheck[] = [];
  const playwright = await import('playwright');
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(previewUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForSelector('[data-testid="calculator-display"]', {
      timeout: 15_000,
      state: 'visible',
    });

    const welcomeVisible = await page.locator('[data-blueprint="welcome-screen"]').isVisible().catch(() => false);
    const bodyText = ((await page.locator('body').innerText()) ?? '').toLowerCase();
    const genericShellDetected = GENERIC_SHELL_MARKERS.some((marker) =>
      bodyText.includes(marker.toLowerCase()),
    );

    pushCheck(checks, {
      id: 'calculator-display-visible',
      label: 'Calculator display visible at root route',
      passed: await page.locator('[data-testid="calculator-display"]').isVisible(),
      detail: 'Calculator display element rendered without navigation',
      critical: true,
    });

    pushCheck(checks, {
      id: 'no-welcome-shell',
      label: 'Generic blueprint welcome shell not shown',
      passed: !welcomeVisible && !genericShellDetected,
      detail:
        welcomeVisible || genericShellDetected
          ? 'Generic welcome/shell content detected instead of calculator UI'
          : 'No generic welcome shell at root',
      critical: true,
    });

    const operatorButtons = ['+', '-', '×', '÷', '=', 'C'];
    for (const label of operatorButtons) {
      const visible = await page.getByRole('button', { name: label, exact: true }).isVisible();
      pushCheck(checks, {
        id: `operator-${label}`,
        label: `Calculator control "${label}" visible`,
        passed: visible,
        detail: visible ? `Button ${label} visible` : `Button ${label} missing`,
        critical: label !== 'C',
      });
    }

    for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      const visible = await page.getByRole('button', { name: digit, exact: true }).isVisible();
      if (!visible) {
        pushCheck(checks, {
          id: `digit-${digit}`,
          label: `Calculator digit ${digit} visible`,
          passed: false,
          detail: `Digit button ${digit} missing`,
          critical: true,
        });
        break;
      }
    }
    if (!checks.some((check) => check.id.startsWith('digit-') && !check.passed)) {
      pushCheck(checks, {
        id: 'digit-keypad',
        label: 'Calculator digit keypad visible',
        passed: true,
        detail: 'Digits 0-9 present',
        critical: true,
      });
    }

    await page.getByRole('button', { name: 'C', exact: true }).click();
    await page.getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: '+', exact: true }).click();
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.getByRole('button', { name: '=', exact: true }).click();
    const displayText = ((await page.locator('[data-testid="calculator-display"]').innerText()) ?? '').trim();
    const interactionPassed = displayText === '5';
    pushCheck(checks, {
      id: 'interaction-2-plus-3-equals-5',
      label: 'Live preview interaction: 2 + 3 = 5',
      passed: interactionPassed,
      detail: interactionPassed ? 'Display shows 5 after 2+3=' : `Display shows "${displayText}" instead of 5`,
      critical: true,
    });

    return {
      checks,
      interactionResult: displayText,
      genericShellDetected: welcomeVisible || genericShellDetected,
    };
  } finally {
    await browser.close();
  }
}

export async function validateCalculatorVisiblePreview(
  input: ValidateCalculatorVisiblePreviewInput,
): Promise<CalculatorVisiblePreviewResult> {
  const checks: CalculatorVisiblePreviewCheck[] = [];
  const mountAudit = auditSimpleUtilityWorkspaceMount(input.workspaceDir, 'calculator');

  pushCheck(checks, {
    id: 'workspace-calculator-feature-exists',
    label: 'CalculatorFeature.tsx exists in workspace',
    passed: existsSync(join(input.workspaceDir, 'src/features/calculator/CalculatorFeature.tsx')),
    detail: mountAudit.failureReasons.join('; ') || 'Calculator feature module present',
    critical: true,
  });

  pushCheck(checks, {
    id: 'workspace-root-mount',
    label: 'App.tsx mounts CalculatorFeature at root route',
    passed: mountAudit.passed,
    detail: mountAudit.passed
      ? 'App.tsx renders CalculatorFeature directly without blueprint shell'
      : mountAudit.failureReasons.join('; '),
    critical: true,
  });

  pushCheck(checks, {
    id: 'registry-root-route',
    label: 'Feature registry points calculator to /',
    passed:
      mountAudit.passed ||
      (existsSync(join(input.workspaceDir, 'src/features/registry.ts')) &&
        readFileSync(join(input.workspaceDir, 'src/features/registry.ts'), 'utf8').includes("route: '/'")),
    detail: "Registry route must be '/' for calculator root mount",
    critical: true,
  });

  if (!input.previewUrl) {
    pushCheck(checks, {
      id: 'preview-url',
      label: 'Preview URL available for DOM validation',
      passed: false,
      detail: 'No preview URL — cannot validate rendered calculator UI',
      critical: true,
    });
    const failureReasons = checks.filter((check) => check.critical && !check.passed).map((check) => check.detail);
    return {
      readOnly: true,
      passed: false,
      status: 'FAIL',
      previewUrl: null,
      checks,
      failureReasons,
      interactionResult: null,
      genericShellDetected: false,
      workspaceMountPassed: mountAudit.passed,
      previewFreshnessPassed: false,
    };
  }

  let html = '';
  try {
    const res = await fetch(input.previewUrl);
    html = await res.text();
    pushCheck(checks, {
      id: 'preview-http',
      label: 'Preview URL responds',
      passed: res.ok,
      detail: `HTTP ${res.status}`,
      critical: true,
    });
  } catch (error) {
    pushCheck(checks, {
      id: 'preview-http',
      label: 'Preview URL responds',
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
      critical: true,
    });
  }

  const freshness = auditPreviewFreshness(input.workspaceDir, html);
  pushCheck(checks, {
    id: 'preview-freshness',
    label: 'Preview serves current workspace (not stale shell)',
    passed: freshness.passed,
    detail: freshness.detail,
    critical: true,
  });

  const playwrightReady = await probePlaywright();
  if (!playwrightReady) {
    pushCheck(checks, {
      id: 'playwright-required',
      label: 'Playwright available for rendered DOM validation',
      passed: false,
      detail: 'Playwright required to validate calculator controls in live preview',
      critical: true,
    });
  } else {
    try {
      const rendered = await runPlaywrightCalculatorChecks(input.previewUrl);
      checks.push(...rendered.checks);
      const criticalFailures = checks.filter((check) => check.critical && !check.passed);
      return {
        readOnly: true,
        passed: criticalFailures.length === 0,
        status: criticalFailures.length === 0 ? 'PASS' : 'FAIL',
        previewUrl: input.previewUrl,
        checks,
        failureReasons: criticalFailures.map((check) => `${check.label}: ${check.detail}`),
        interactionResult: rendered.interactionResult,
        genericShellDetected: rendered.genericShellDetected,
        workspaceMountPassed: mountAudit.passed,
        previewFreshnessPassed: freshness.passed,
      };
    } catch (error) {
      pushCheck(checks, {
        id: 'playwright-runtime',
        label: 'Playwright calculator DOM validation completed',
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
        critical: true,
      });
    }
  }

  const criticalFailures = checks.filter((check) => check.critical && !check.passed);
  return {
    readOnly: true,
    passed: criticalFailures.length === 0,
    status: criticalFailures.length === 0 ? 'PASS' : 'FAIL',
    previewUrl: input.previewUrl,
    checks,
    failureReasons: criticalFailures.map((check) => `${check.label}: ${check.detail}`),
    interactionResult: null,
    genericShellDetected: false,
    workspaceMountPassed: mountAudit.passed,
    previewFreshnessPassed: freshness.passed,
  };
}

export { CALCULATOR_BUILD_PROMPT };
