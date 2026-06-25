/**
 * Universal Feature Contract Intelligence V1 — dynamic Playwright runtime runner.
 */

import type { PlaywrightPageAdapter } from '../playwright-adapter/playwright-page-types.js';
import type {
  FeatureRealityValidationPlan,
  FeatureRealityValidationStep,
  UniversalFeatureRealityCheck,
} from './universal-feature-contract-types.js';

export interface UniversalValidationPage {
  goto(url: string): Promise<void>;
  waitForSelector(selector: string, options?: { timeout?: number; state?: 'visible' | 'attached' }): Promise<void>;
  isVisible(selector: string): Promise<boolean>;
  count(selector: string): Promise<number>;
  textContent(selector: string): Promise<string | null>;
  click(selector: string): Promise<void>;
  clickText(text: string): Promise<void>;
  clickNavText(text: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  reload(): Promise<void>;
  evaluate<T, A = void>(fn: (arg: A) => T | Promise<T>, arg: A): Promise<T>;
}

function record(
  checks: UniversalFeatureRealityCheck[],
  input: Omit<UniversalFeatureRealityCheck, 'passed'> & { passed: boolean },
): void {
  checks.push({ ...input, passed: input.passed });
}

async function navigateToFeature(
  page: UniversalValidationPage,
  previewUrl: string,
  plan: FeatureRealityValidationPlan,
  options?: { resetStorage?: boolean },
): Promise<void> {
  await page.goto(previewUrl);
  if (options?.resetStorage) {
    const storageKey = plan.storageKey;
    await page.evaluate((key) => localStorage.removeItem(key), storageKey);
  }
  await page.waitForSelector('[data-blueprint="welcome-screen"]', { timeout: 8000, state: 'visible' });
  await page.click('[data-blueprint="welcome-screen"] .blueprint-btn-primary');
  await page.waitForSelector('[data-blueprint="auth-guest"]', { timeout: 5000, state: 'visible' });
  await page.click('[data-blueprint="auth-guest"]');
  await page.waitForSelector('[data-blueprint="onboarding"]', { timeout: 5000, state: 'visible' });
  await page.clickText('Skip');
  await page.waitForSelector('[data-blueprint="app-shell"]', { timeout: 8000, state: 'visible' });
  await page.clickNavText(plan.navLabel);
  await page.waitForSelector(plan.featureRootSelector, { timeout: 8000, state: 'visible' });
}

async function addRecord(page: UniversalValidationPage, step: FeatureRealityValidationStep, text: string): Promise<void> {
  await page.fill(step.selectors.input, text);
  await page.click(step.selectors.addButton);
  await page.waitForSelector(`${step.selectors.recordText}:has-text("${text}")`, {
    timeout: 5000,
    state: 'visible',
  });
}

async function executeStep(
  page: UniversalValidationPage,
  previewUrl: string,
  plan: FeatureRealityValidationPlan,
  step: FeatureRealityValidationStep,
  checks: UniversalFeatureRealityCheck[],
): Promise<void> {
  switch (step.kind) {
    case 'discover': {
      const navVisible = await page.isVisible(step.selectors.sidenav ?? '.blueprint-sidenav');
      const featureVisible = await page.isVisible(step.selectors.featureRoot ?? plan.featureRootSelector);
      record(checks, {
        id: step.id,
        category: 'discoverability',
        entityId: step.entityId,
        actionId: step.actionId,
        label: step.label,
        passed: navVisible && featureVisible,
        detail:
          navVisible && featureVisible
            ? `${plan.navLabel} route reachable from app shell`
            : 'Feature unreachable via navigation',
        critical: step.critical,
      });
      break;
    }

    case 'create': {
      await page.reload();
      await navigateToFeature(page, previewUrl, plan, { resetStorage: true });
      await addRecord(page, step, step.sampleText);
      const visible = await page.isVisible(`${step.selectors.recordText}:has-text("${step.sampleText}")`);
      const countText = step.selectors.count
        ? ((await page.textContent(step.selectors.count)) ?? '').trim()
        : '1';
      record(checks, {
        id: step.id,
        category: 'execution',
        entityId: step.entityId,
        actionId: step.actionId,
        label: step.label,
        passed: visible && countText !== '0',
        detail: visible ? `Record created (${countText} visible)` : 'Created record not visible',
        critical: step.critical,
      });
      break;
    }

    case 'complete': {
      await page.reload();
      await navigateToFeature(page, previewUrl, plan, { resetStorage: true });
      await addRecord(page, step, step.sampleText);
      await page.click(step.selectors.completeToggle);
      const completedVisible = await page.isVisible(step.selectors.completedItem ?? '.universal-record.is-completed');
      record(checks, {
        id: step.id,
        category: 'workflow',
        entityId: step.entityId,
        actionId: step.actionId,
        label: step.label,
        passed: completedVisible,
        detail: completedVisible ? 'Record marked complete in rendered list' : 'Complete action failed',
        critical: step.critical,
      });
      break;
    }

    case 'edit': {
      await page.reload();
      await navigateToFeature(page, previewUrl, plan, { resetStorage: true });
      await addRecord(page, step, step.sampleText);
      await page.click(step.selectors.editButton);
      await page.fill(step.selectors.editInput, step.editedText ?? 'Updated record');
      await page.click(step.selectors.saveButton);
      const editedVisible = await page.isVisible(
        `${step.selectors.recordText}:has-text("${step.editedText ?? 'Updated record'}")`,
      );
      const oldHidden =
        (await page.count(`${step.selectors.recordText}:has-text("${step.sampleText}")`)) === 0;
      record(checks, {
        id: step.id,
        category: 'edit',
        entityId: step.entityId,
        actionId: step.actionId,
        label: step.label,
        passed: editedVisible && oldHidden,
        detail: editedVisible ? 'Edited record text visible' : 'Edit not reflected in UI',
        critical: step.critical,
      });
      break;
    }

    case 'delete': {
      await page.reload();
      await navigateToFeature(page, previewUrl, plan, { resetStorage: true });
      await addRecord(page, step, step.sampleText);
      await page.click(step.selectors.deleteButton);
      const deleted = (await page.count(`${step.selectors.recordText}:has-text("${step.sampleText}")`)) === 0;
      record(checks, {
        id: step.id,
        category: 'delete',
        entityId: step.entityId,
        actionId: step.actionId,
        label: step.label,
        passed: deleted,
        detail: deleted ? 'Deleted record no longer visible' : 'Deleted record still visible',
        critical: step.critical,
      });
      break;
    }

    case 'search': {
      await page.reload();
      await navigateToFeature(page, previewUrl, plan, { resetStorage: true });
      if (step.id === 'execute-filter') {
        await addRecord(page, step, step.sampleText);
        await addRecord(page, step, step.editedText ?? 'Done item');
        const toggles = await page.count(step.selectors.completeToggle);
        if (toggles >= 2) {
          await page.click(`${step.selectors.completeToggle} >> nth=1`);
        }
        await page.click(step.selectors.filterActive);
        const activeOnly = await page.isVisible(`${step.selectors.recordText}:has-text("${step.sampleText}")`);
        const completedHidden =
          (await page.count(`${step.selectors.recordText}:has-text("${step.editedText ?? 'Done item'}")`)) === 0;
        await page.click(step.selectors.filterCompleted);
        const completedVisible = await page.isVisible(
          `${step.selectors.recordText}:has-text("${step.editedText ?? 'Done item'}")`,
        );
        record(checks, {
          id: step.id,
          category: 'search',
          entityId: step.entityId,
          actionId: step.actionId,
          label: step.label,
          passed: activeOnly && completedHidden && completedVisible,
          detail:
            activeOnly && completedHidden && completedVisible
              ? 'Filters show expected records'
              : 'Filter could not isolate records',
          critical: step.critical,
        });
      } else if (step.selectors.searchInput) {
        await addRecord(page, step, step.sampleText);
        await page.fill(step.selectors.searchInput, step.sampleText.slice(0, 4));
        const found = await page.isVisible(`${step.selectors.recordText}:has-text("${step.sampleText}")`);
        record(checks, {
          id: step.id,
          category: 'search',
          entityId: step.entityId,
          actionId: step.actionId,
          label: step.label,
          passed: found,
          detail: found ? 'Search located created record' : 'Search could not locate record',
          critical: step.critical,
        });
      }
      break;
    }

    case 'persistence-route':
    case 'persistence-reload':
      break;

    case 'recovery': {
      await page.reload();
      await navigateToFeature(page, previewUrl, plan, { resetStorage: true });
      if (step.selectors.searchInput && (await page.isVisible(step.selectors.searchInput))) {
        await page.fill(step.selectors.searchInput, '');
      }
      await page.fill(step.selectors.input, '   ');
      await page.click(step.selectors.addButton);
      const validationVisible = await page.isVisible(step.selectors.formError);
      const stillUsable = await page.isVisible(step.selectors.input);
      await addRecord(page, step, step.sampleText);
      record(checks, {
        id: step.id,
        category: 'recovery',
        entityId: step.entityId,
        actionId: step.actionId,
        label: step.label,
        passed: validationVisible && stillUsable,
        detail: validationVisible
          ? 'Validation message shown; subsequent valid action succeeded'
          : 'No validation feedback for invalid input',
        critical: step.critical,
      });
      break;
    }

    case 'ux-feedback': {
      await page.reload();
      await navigateToFeature(page, previewUrl, plan, { resetStorage: true });
      await addRecord(page, step, step.sampleText);
      const statusText = ((await page.textContent(step.selectors.statusMessage)) ?? '').trim();
      record(checks, {
        id: step.id,
        category: 'ux',
        entityId: step.entityId,
        actionId: step.actionId,
        label: step.label,
        passed: statusText.length > 0,
        detail: statusText.length > 0 ? `Status: ${statusText}` : 'No success feedback after actions',
        critical: step.critical,
      });
      break;
    }

    case 'ux-actionable': {
      const actionable = await page.isVisible(step.selectors.addButton);
      record(checks, {
        id: step.id,
        category: 'ux',
        entityId: step.entityId,
        actionId: step.actionId,
        label: step.label,
        passed: actionable,
        detail: actionable ? 'Primary actions still available' : 'Feature surface became unusable',
        critical: step.critical,
      });
      break;
    }
  }
}

export async function runUniversalFeatureRealityChecks(
  page: UniversalValidationPage,
  input: { previewUrl: string; plan: FeatureRealityValidationPlan },
): Promise<UniversalFeatureRealityCheck[]> {
  const checks: UniversalFeatureRealityCheck[] = [];
  const { previewUrl, plan } = input;

  await navigateToFeature(page, previewUrl, plan, { resetStorage: true });

  for (const step of plan.steps) {
    if (step.kind === 'persistence-route' || step.kind === 'persistence-reload') {
      continue;
    }
    await executeStep(page, previewUrl, plan, step, checks);
  }

  const persistenceStep = plan.steps.find((step) => step.kind === 'persistence-route');
  if (persistenceStep) {
    await page.evaluate((key) => localStorage.removeItem(key), plan.storageKey);
    await page.reload();
    await navigateToFeature(page, previewUrl, plan, { resetStorage: false });
    await addRecord(page, persistenceStep, persistenceStep.sampleText);
    await page.clickNavText('Home');
    await page.waitForSelector('[data-blueprint="home-formula"]', { timeout: 5000, state: 'visible' });
    await page.clickNavText(plan.navLabel);
    await page.waitForSelector(plan.featureRootSelector, { timeout: 5000, state: 'visible' });
    const afterRoute = await page.isVisible(
      `${persistenceStep.selectors.recordText}:has-text("${persistenceStep.sampleText}")`,
    );
    record(checks, {
      id: persistenceStep.id,
      category: 'persistence',
      entityId: persistenceStep.entityId,
      actionId: persistenceStep.actionId,
      label: persistenceStep.label,
      passed: afterRoute,
      detail: afterRoute ? 'Record survived route change' : 'Record lost after route change',
      critical: persistenceStep.critical,
    });

    const reloadStep = plan.steps.find((step) => step.kind === 'persistence-reload');
    if (reloadStep) {
      await page.reload();
      await navigateToFeature(page, previewUrl, plan, { resetStorage: false });
      const afterReload = await page.isVisible(
        `${reloadStep.selectors.recordText}:has-text("${persistenceStep.sampleText}")`,
      );
      record(checks, {
        id: reloadStep.id,
        category: 'persistence',
        entityId: reloadStep.entityId,
        actionId: reloadStep.actionId,
        label: reloadStep.label,
        passed: afterReload,
        detail: afterReload ? 'Record restored after page reload' : 'Record lost after reload',
        critical: reloadStep.critical,
      });
    }
  }

  return checks;
}

export function createPlaywrightUniversalValidationPage(
  page: PlaywrightPageAdapter & {
    evaluate<T, U>(fn: (arg: U) => T | Promise<T>, arg: U): Promise<T>;
    reload(options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<unknown | null>;
  },
): UniversalValidationPage {
  return {
    goto: async (url) => {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
    },
    waitForSelector: (selector, options) =>
      page.waitForSelector(selector, { timeout: options?.timeout ?? 5000, state: options?.state ?? 'visible' }) as Promise<void>,
    isVisible: async (selector) => {
      const locator = page.locator(selector);
      if ((await locator.count()) === 0) return false;
      return locator.first().isVisible();
    },
    count: (selector) => page.locator(selector).count(),
    textContent: (selector) => page.locator(selector).first().textContent(),
    click: (selector) => page.locator(selector).first().click(),
    clickText: (text) => page.getByText(text, { exact: false }).first().click(),
    clickNavText: (text) => page.locator('.blueprint-sidenav').getByText(text, { exact: false }).click(),
    fill: (selector, value) => page.locator(selector).first().fill(value),
    reload: async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
    },
    evaluate: (fn, arg) => page.evaluate(fn, arg),
  };
}
