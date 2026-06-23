/**
 * Feature Reality Validation Authority V1 — rendered runtime Playwright runner.
 */

import type { FeatureContract, FeatureRealityCheck } from './feature-reality-validation-types.js';

export interface FeatureValidationPage {
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
  evaluate<T>(fn: () => T | Promise<T>): Promise<T>;
  waitForTimeout(ms: number): Promise<void>;
}

function record(
  checks: FeatureRealityCheck[],
  input: Omit<FeatureRealityCheck, 'passed'> & { passed: boolean },
): void {
  checks.push({ ...input, passed: input.passed });
}

async function navigateToTaskFeature(
  page: FeatureValidationPage,
  previewUrl: string,
  options?: { resetStorage?: boolean },
): Promise<void> {
  await page.goto(previewUrl);
  if (options?.resetStorage) {
    await page.evaluate(() => localStorage.removeItem('task-tracker-tasks-v1'));
  }
  await page.waitForSelector('[data-blueprint="welcome-screen"]', { timeout: 8000, state: 'visible' });
  await page.click('[data-blueprint="welcome-screen"] .blueprint-btn-primary');
  await page.waitForSelector('[data-blueprint="auth-guest"]', { timeout: 5000, state: 'visible' });
  await page.click('[data-blueprint="auth-guest"]');
  await page.waitForSelector('[data-blueprint="onboarding"]', { timeout: 5000, state: 'visible' });
  await page.clickText('Skip');
  await page.waitForSelector('[data-blueprint="app-shell"]', { timeout: 8000, state: 'visible' });
  await page.clickNavText('Tasks');
  await page.waitForSelector('.task-tracker-feature', { timeout: 8000, state: 'visible' });
}

async function addTask(page: FeatureValidationPage, text: string): Promise<void> {
  await page.fill('[data-testid="task-input"]', text);
  await page.click('[data-testid="add-task-button"]');
  await page.waitForSelector(`[data-testid="task-text"]:has-text("${text}")`, { timeout: 5000, state: 'visible' });
}

export async function runFeatureRealityChecks(
  page: FeatureValidationPage,
  input: { previewUrl: string; contract: FeatureContract },
): Promise<FeatureRealityCheck[]> {
  const checks: FeatureRealityCheck[] = [];
  const requiredIds = new Set(input.contract.features.filter((feature) => feature.required).map((feature) => feature.id));

  await navigateToTaskFeature(page, input.previewUrl, { resetStorage: true });

  const tasksNavVisible = await page.isVisible('.blueprint-sidenav');
  const featureSurfaceVisible = await page.isVisible('.task-tracker-feature');
  record(checks, {
    id: 'discover-tasks-nav',
    category: 'discoverability',
    featureId: 'create-task',
    label: 'User can locate Tasks feature via navigation',
    passed: tasksNavVisible && featureSurfaceVisible,
    detail:
      tasksNavVisible && featureSurfaceVisible
        ? 'Tasks route reachable from app shell'
        : 'Tasks feature unreachable',
    critical: true,
  });

  if (requiredIds.has('create-task')) {
    await page.reload();
    await navigateToTaskFeature(page, input.previewUrl, { resetStorage: true });
    await addTask(page, 'Buy groceries');
    const taskVisible = await page.isVisible('[data-testid="task-text"]:has-text("Buy groceries")');
    const activeCount = await page.textContent('[data-testid="active-count"]');
    record(checks, {
      id: 'execute-create-task',
      category: 'execution',
      featureId: 'create-task',
      label: 'Create Task executes successfully',
      passed: taskVisible && activeCount === '1',
      detail: taskVisible ? `Task created, active count ${activeCount}` : 'Created task not visible',
      critical: true,
    });
  }

  if (requiredIds.has('complete-task')) {
    await page.reload();
    await navigateToTaskFeature(page, input.previewUrl, { resetStorage: true });
    await addTask(page, 'Complete me');
    await page.click('[data-testid="complete-toggle"]');
    const completedVisible = await page.isVisible('.task-item.is-completed');
    record(checks, {
      id: 'execute-complete-task',
      category: 'execution',
      featureId: 'complete-task',
      label: 'Complete Task executes successfully',
      passed: completedVisible,
      detail: completedVisible ? 'Task marked complete in rendered list' : 'Complete action failed',
      critical: true,
    });
  }

  if (requiredIds.has('edit-task')) {
    await page.reload();
    await navigateToTaskFeature(page, input.previewUrl, { resetStorage: true });
    await addTask(page, 'Draft task');
    await page.click('[data-testid="edit-task-button"]');
    await page.fill('[data-testid="edit-task-input"]', 'Published task');
    await page.click('[data-testid="save-task-button"]');
    const editedVisible = await page.isVisible('[data-testid="task-text"]:has-text("Published task")');
    const oldHidden = (await page.count('[data-testid="task-text"]:has-text("Draft task")')) === 0;
    record(checks, {
      id: 'edit-task-reflected',
      category: 'edit',
      featureId: 'edit-task',
      label: 'Edit Task updates rendered record',
      passed: editedVisible && oldHidden,
      detail: editedVisible ? 'Edited task text visible' : 'Edit not reflected in UI',
      critical: true,
    });
  }

  if (requiredIds.has('delete-task')) {
    await page.reload();
    await navigateToTaskFeature(page, input.previewUrl, { resetStorage: true });
    await addTask(page, 'Temporary task');
    await page.click('[data-testid="delete-task-button"]');
    const deleted = (await page.count('[data-testid="task-text"]:has-text("Temporary task")')) === 0;
    record(checks, {
      id: 'delete-task-removes-record',
      category: 'delete',
      featureId: 'delete-task',
      label: 'Delete Task removes rendered record',
      passed: deleted,
      detail: deleted ? 'Deleted task no longer visible' : 'Deleted task still visible',
      critical: true,
    });
  }

  if (requiredIds.has('filter-tasks')) {
    await page.reload();
    await navigateToTaskFeature(page, input.previewUrl, { resetStorage: true });
    await addTask(page, 'Active item');
    await addTask(page, 'Done item');
    const toggles = await page.count('[data-testid="complete-toggle"]');
    if (toggles >= 2) {
      await page.click('[data-testid="complete-toggle"] >> nth=1');
    }
    await page.click('[data-testid="filter-active"]');
    const activeOnly = await page.isVisible('[data-testid="task-text"]:has-text("Active item")');
    const completedHidden = (await page.count('[data-testid="task-text"]:has-text("Done item")')) === 0;
    await page.click('[data-testid="filter-completed"]');
    const completedVisible = await page.isVisible('[data-testid="task-text"]:has-text("Done item")');
    record(checks, {
      id: 'search-filter-tasks',
      category: 'search',
      featureId: 'filter-tasks',
      label: 'Filter Tasks locates records by state',
      passed: activeOnly && completedHidden && completedVisible,
      detail:
        activeOnly && completedHidden && completedVisible
          ? 'Active and completed filters show expected tasks'
          : 'Filter could not isolate task states',
      critical: true,
    });
  }

  await page.evaluate(() => localStorage.removeItem('task-tracker-tasks-v1'));
  await page.reload();
  await navigateToTaskFeature(page, input.previewUrl, { resetStorage: false });
  await addTask(page, 'Persist me');
  await page.clickNavText('Home');
  await page.waitForSelector('[data-blueprint="home-formula"]', { timeout: 5000, state: 'visible' });
  await page.clickNavText('Tasks');
  await page.waitForSelector('.task-tracker-feature', { timeout: 5000, state: 'visible' });
  const afterRouteChange = await page.isVisible('[data-testid="task-text"]:has-text("Persist me")');
  record(checks, {
    id: 'persistence-route-change',
    category: 'persistence',
    featureId: null,
    label: 'Task state persists across route change',
    passed: afterRouteChange,
    detail: afterRouteChange ? 'Task survived Home → Tasks navigation' : 'Task lost after route change',
    critical: true,
  });

  await page.reload();
  await navigateToTaskFeature(page, input.previewUrl, { resetStorage: false });
  const afterReload = await page.isVisible('[data-testid="task-text"]:has-text("Persist me")');
  record(checks, {
    id: 'persistence-reload',
    category: 'persistence',
    featureId: null,
    label: 'Task state persists after reload',
    passed: afterReload,
    detail: afterReload ? 'Task restored after page reload' : 'Task lost after reload',
    critical: true,
  });

  await page.fill('[data-testid="task-input"]', '   ');
  await page.click('[data-testid="add-task-button"]');
  const validationVisible = await page.isVisible('[data-testid="task-form-error"]');
  const stillUsable = await page.isVisible('[data-testid="task-input"]');
  await addTask(page, 'Recovered task');
  record(checks, {
    id: 'recovery-invalid-input',
    category: 'recovery',
    featureId: null,
    label: 'Invalid input shows validation and app remains usable',
    passed: validationVisible && stillUsable,
    detail: validationVisible
      ? 'Validation message shown; subsequent valid action succeeded'
      : 'No validation feedback for invalid input',
    critical: false,
  });

  const statusText = ((await page.textContent('[data-testid="task-status-message"]')) ?? '').trim();
  record(checks, {
    id: 'ux-action-feedback',
    category: 'ux',
    featureId: null,
    label: 'Feature action feedback shown to user',
    passed: statusText.length > 0,
    detail: statusText.length > 0 ? `Status: ${statusText}` : 'No success feedback after actions',
    critical: false,
  });

  const noDeadEnd = await page.isVisible('[data-testid="add-task-button"]');
  record(checks, {
    id: 'ux-no-dead-end',
    category: 'ux',
    featureId: null,
    label: 'Feature surface remains actionable',
    passed: noDeadEnd,
    detail: noDeadEnd ? 'Primary actions still available' : 'Feature surface became unusable',
    critical: false,
  });

  return checks;
}

export function createPlaywrightFeatureValidationPage(page: {
  goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void | null>;
  waitForSelector(selector: string, options?: { timeout?: number; state?: 'visible' | 'attached' }): Promise<unknown>;
  locator(selector: string): {
    isVisible(): Promise<boolean>;
    count(): Promise<number>;
    textContent(): Promise<string | null>;
    click(): Promise<void>;
    fill(value: string): Promise<void>;
    first(): {
      isVisible(): Promise<boolean>;
      count(): Promise<number>;
      textContent(): Promise<string | null>;
      click(): Promise<void>;
      fill(value: string): Promise<void>;
    };
  };
  getByText(text: string, options?: { exact?: boolean }): { first(): { click(): Promise<void> } };
  evaluate<T>(fn: () => T | Promise<T>): Promise<T>;
  reload(options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void | null>;
  waitForTimeout(ms: number): Promise<void>;
}): FeatureValidationPage {
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
    evaluate: (fn) => page.evaluate(fn),
    waitForTimeout: (ms) => page.waitForTimeout(ms),
  };
}
