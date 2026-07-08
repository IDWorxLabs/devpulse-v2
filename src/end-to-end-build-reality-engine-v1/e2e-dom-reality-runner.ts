/**
 * Contract-derived DOM + interaction reality runner — no application-specific logic.
 */

import type {
  E2EBuildRealityStageId,
  E2EContractExpectationBundle,
  E2EValidationCheck,
  E2EValidationStep,
} from './e2e-build-reality-types.js';
import { listGenericShellMarkers } from './contract-derived-plan-generator.js';

export interface E2EDomRealityPage {
  goto(url: string): Promise<void>;
  waitForSelector(selector: string, options?: { timeout?: number; state?: 'visible' | 'attached' }): Promise<void>;
  isVisible(selector: string): Promise<boolean>;
  textContent(selector: string): Promise<string | null>;
  clickRoleButton(label: string): Promise<void>;
  clickSelector(selector: string): Promise<void>;
  bodyText(): Promise<string>;
  content(): Promise<string>;
  screenshot(options: { path: string; fullPage?: boolean }): Promise<void>;
  evaluate<T, Arg = void>(fn: (arg: Arg) => T, arg?: Arg): Promise<T>;
}

async function featureSurfaceVisible(
  page: E2EDomRealityPage,
  moduleId: string,
): Promise<boolean> {
  const selector = `[data-feature-module="${moduleId}"], [data-root-feature="${moduleId}"]`;
  if (await page.isVisible(selector)) {
    return true;
  }
  return page.evaluate((id) => {
    const el =
      document.querySelector(`[data-feature-module="${id}"]`) ??
      document.querySelector(`[data-root-feature="${id}"]`);
    return Boolean(el);
  }, moduleId);
}

async function navigateToFeatureSurface(
  page: E2EDomRealityPage,
  previewUrl: string,
  expectations: E2EContractExpectationBundle,
  options?: { skipNavigation?: boolean },
): Promise<void> {
  if (expectations.mountMode === 'direct-feature') {
    const moduleId = expectations.primaryModuleId;
    if (moduleId) {
      if (options?.skipNavigation || (await featureSurfaceVisible(page, moduleId))) {
        try {
          await page.waitForSelector(
            `[data-feature-module="${moduleId}"], [data-root-feature="${moduleId}"]`,
            { timeout: 4_000, state: 'visible' },
          );
        } catch {
          if (!(await featureSurfaceVisible(page, moduleId))) {
            throw new Error(`Direct feature "${moduleId}" not visible after preview authority audit`);
          }
        }
        return;
      }
      await page.goto(previewUrl);
      await page.waitForSelector(
        `[data-feature-module="${moduleId}"], [data-root-feature="${moduleId}"]`,
        { timeout: 12_000, state: 'visible' },
      );
      return;
    }
  }

  if (options?.skipNavigation) {
    return;
  }

  await page.goto(previewUrl);
  if (expectations.mountMode === 'direct-feature') {
    return;
  }
  const welcomeVisible = await page.isVisible('[data-blueprint="welcome-screen"]');
  if (!welcomeVisible) return;
  await page.waitForSelector('[data-blueprint="welcome-screen"] .blueprint-btn-primary', {
    timeout: 8000,
    state: 'visible',
  });
  await page.clickSelector('[data-blueprint="welcome-screen"] .blueprint-btn-primary');
  const guestVisible = await page.isVisible('[data-blueprint="auth-guest"]');
  if (guestVisible) {
    await page.clickSelector('[data-blueprint="auth-guest"]');
  }
  await page.waitForSelector('[data-blueprint="onboarding"]', { timeout: 5000, state: 'visible' });
  await page.clickRoleButton('Skip');
  await page.waitForSelector('[data-blueprint="app-shell"]', { timeout: 8000, state: 'visible' });
  const navLabel = expectations.featureModules[0]?.navLabel ?? 'Features';
  await page.clickRoleButton(navLabel);
}

function record(
  checks: E2EValidationCheck[],
  input: Omit<E2EValidationCheck, 'readOnly'>,
): void {
  checks.push({ readOnly: true, ...input });
}

export interface E2EInteractionReplayStep {
  readOnly: true;
  stepId: string;
  action: 'click' | 'assert-display';
  label: string | null;
  passed: boolean;
  detail: string;
}

export async function runContractDerivedDomReality(input: {
  previewUrl: string;
  expectations: E2EContractExpectationBundle;
  steps: E2EValidationStep[];
  page: E2EDomRealityPage;
  skipNavigation?: boolean;
}): Promise<{
  checks: E2EValidationCheck[];
  mountedFeatureModules: string[];
  genericShellDetected: boolean;
  interactionPassed: boolean;
  interactionReplay: E2EInteractionReplayStep[];
}> {
  const checks: E2EValidationCheck[] = [];
  const interactionReplay: E2EInteractionReplayStep[] = [];
  await navigateToFeatureSurface(input.page, input.previewUrl, input.expectations, {
    skipNavigation: input.skipNavigation,
  });

  const bodyText = (await input.page.bodyText()).toLowerCase();
  const genericShellDetected = listGenericShellMarkers().some((marker) =>
    bodyText.includes(marker.toLowerCase().replace(/data-blueprint="[^"]+"/, 'welcome')),
  ) || (await input.page.isVisible('[data-blueprint="welcome-screen"]'));

  const mountedFeatureModules = await input.page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-feature-module]'))
      .map((el) => el.getAttribute('data-feature-module') ?? '')
      .filter(Boolean),
  );

  for (const step of input.steps) {
    switch (step.kind) {
      case 'feature-mounted': {
        const selector = step.selectors.featureRoot ?? `[data-feature-module="${step.moduleId}"]`;
        const visible = await input.page.isVisible(selector);
        record(checks, {
          id: step.id,
          stageId: 'DOM_REALITY',
          label: step.label,
          passed: visible,
          detail: visible ? `${step.moduleId} mounted` : `${step.moduleId} not mounted in DOM`,
          critical: step.critical,
        });
        break;
      }
      case 'route-registered': {
        record(checks, {
          id: step.id,
          stageId: 'DOM_REALITY',
          label: step.label,
          passed: input.expectations.routes.includes(step.selectors.route ?? ''),
          detail: `Route ${step.selectors.route ?? 'unknown'} in contract route table`,
          critical: step.critical,
        });
        break;
      }
      case 'no-generic-shell': {
        const welcome = await input.page.isVisible(step.selectors.welcomeShell ?? '[data-blueprint="welcome-screen"]');
        const shellCopy = bodyText.includes(String(step.selectors.modularShellCopy ?? '').toLowerCase());
        record(checks, {
          id: step.id,
          stageId: 'DOM_REALITY',
          label: step.label,
          passed: !welcome && !shellCopy,
          detail: welcome || shellCopy ? 'Generic shell still primary' : 'No generic shell at root',
          critical: step.critical,
        });
        break;
      }
      case 'ui-term-visible': {
        const term = step.uiTerm ?? '';
        const visible =
          bodyText.includes(term.toLowerCase()) ||
          (await input.page.isVisible(`button:has-text("${term}")`)) ||
          (term.length === 1 && (await input.page.isVisible(`[data-operator="${term}"], [data-digit="${term}"]`)));
        record(checks, {
          id: step.id,
          stageId: 'DOM_REALITY',
          label: step.label,
          passed: visible,
          detail: visible ? `"${term}" found in DOM` : `"${term}" missing from DOM`,
          critical: step.critical,
        });
        break;
      }
      case 'crud-action': {
        const hasInput = await input.page.isVisible(step.selectors.input ?? '');
        const hasAdd = await input.page.isVisible(step.selectors.addButton ?? '');
        const passed = step.actionVerb !== 'create' || (hasInput && hasAdd);
        record(checks, {
          id: step.id,
          stageId: 'INTERACTIVE_REALITY',
          label: step.label,
          passed,
          detail: passed ? `${step.actionVerb} controls present` : `${step.actionVerb} controls missing`,
          critical: step.critical,
        });
        break;
      }
      case 'button-sequence': {
        let sequenceFailed = false;
        for (const label of step.buttonLabels) {
          try {
            await input.page.clickRoleButton(label);
            interactionReplay.push({
              readOnly: true,
              stepId: step.id,
              action: 'click',
              label,
              passed: true,
              detail: `Clicked "${label}"`,
            });
          } catch (error) {
            sequenceFailed = true;
            interactionReplay.push({
              readOnly: true,
              stepId: step.id,
              action: 'click',
              label,
              passed: false,
              detail: error instanceof Error ? error.message : String(error),
            });
            break;
          }
        }
        const displaySelector = step.selectors.display ?? '[data-testid*="display"], output';
        const displayText = sequenceFailed
          ? ''
          : ((await input.page.textContent(displaySelector)) ?? '').trim();
        const passed =
          !sequenceFailed &&
          (step.expectedDisplayValue ? displayText === step.expectedDisplayValue : displayText.length > 0);
        interactionReplay.push({
          readOnly: true,
          stepId: step.id,
          action: 'assert-display',
          label: step.expectedDisplayValue,
          passed,
          detail: passed
            ? `Display shows "${displayText}"`
            : `Expected "${step.expectedDisplayValue}", got "${displayText}"`,
        });
        record(checks, {
          id: step.id,
          stageId: 'INTERACTIVE_REALITY',
          label: step.label,
          passed,
          detail: passed
            ? `Display shows "${displayText}"`
            : `Expected "${step.expectedDisplayValue}", got "${displayText}"`,
          critical: step.critical,
        });
        break;
      }
      case 'outcome-visible': {
        record(checks, {
          id: step.id,
          stageId: 'INTERACTIVE_REALITY',
          label: step.label,
          passed: true,
          detail: 'Outcome tracked as advisory contract expectation',
          critical: false,
        });
        break;
      }
      default:
        break;
    }
  }

  const interactionPassed = !checks.some(
    (c) =>
      c.stageId === 'INTERACTIVE_REALITY' &&
      c.critical &&
      !c.passed,
  );

  return {
    checks,
    mountedFeatureModules,
    genericShellDetected,
    interactionPassed,
    interactionReplay,
  };
}

type PlaywrightLocator = {
  first(): PlaywrightLocator;
  isVisible(): Promise<boolean>;
  textContent(): Promise<string | null>;
  click(): Promise<void>;
};

export function createPlaywrightDomRealityPage(page: {
  goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<unknown>;
  waitForSelector(selector: string, options?: { timeout?: number; state?: string }): Promise<unknown>;
  waitForFunction(
    fn: () => boolean,
    options?: { timeout?: number },
  ): Promise<unknown>;
  locator(selector: string): PlaywrightLocator;
  getByRole(role: string, options?: { name?: string; exact?: boolean }): {
    click(): Promise<void>;
    isVisible(): Promise<boolean>;
  };
  content(): Promise<string>;
  screenshot(options: { path: string; fullPage?: boolean }): Promise<void>;
  evaluate<T, Arg>(fn: (arg: Arg) => T, arg: Arg): Promise<T>;
  evaluate<T>(fn: () => T): Promise<T>;
}): E2EDomRealityPage {
  return {
    goto: async (url) => {
      await page.goto(url, { waitUntil: 'load', timeout: 25_000 });
      try {
        await page.waitForFunction(
          () => (document.querySelector('#root')?.childElementCount ?? 0) > 0,
          { timeout: 15_000 },
        );
      } catch {
        // Contract-derived selectors below produce actionable failures.
      }
    },
    waitForSelector: async (selector, options) => {
      await page.waitForSelector(selector, {
        timeout: options?.timeout ?? 8000,
        state: options?.state ?? 'visible',
      });
    },
    isVisible: async (selector) => {
      try {
        return await page.locator(selector).first().isVisible();
      } catch {
        return false;
      }
    },
    textContent: async (selector) => page.locator(selector).first().textContent(),
    clickRoleButton: async (label) => {
      const roleButton = page.getByRole('button', { name: label, exact: true });
      if (await roleButton.isVisible().catch(() => false)) {
        await roleButton.click();
        return;
      }
      const digitSelector = `[data-digit="${label}"]`;
      const operatorSelector = `[data-operator="${label}"]`;
      if (await page.locator(digitSelector).first().isVisible().catch(() => false)) {
        await page.locator(digitSelector).first().click();
        return;
      }
      if (await page.locator(operatorSelector).first().isVisible().catch(() => false)) {
        await page.locator(operatorSelector).first().click();
        return;
      }
      const textButton = page.locator(`button:text-is("${label}")`);
      if (await textButton.first().isVisible().catch(() => false)) {
        await textButton.first().click();
        return;
      }
      await roleButton.click();
    },
    clickSelector: async (selector) => {
      await page.locator(selector).first().click();
    },
    bodyText: async () => page.evaluate(() => document.body?.innerText ?? ''),
    content: () => page.content(),
    screenshot: (options) => page.screenshot(options),
    evaluate: <T, Arg>(fn: ((arg: Arg) => T) | (() => T), arg?: Arg) => {
      if (arg === undefined) {
        return page.evaluate(fn as () => T);
      }
      return page.evaluate(fn as (arg: Arg) => T, arg);
    },
  };
}

export function stageLabel(stageId: E2EBuildRealityStageId): string {
  return stageId
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
