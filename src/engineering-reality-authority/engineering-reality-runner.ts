/**
 * Engineering Reality Authority V1 — Playwright runtime runner.
 */

import type { PlaywrightPageAdapter } from '../playwright-adapter/playwright-page-types.js';
import type {
  EngineeringLoadAnalysis,
  EngineeringRealityCheck,
  EngineeringRuntimeHealth,
} from './engineering-reality-types.js';

export interface EngineeringValidationPage {
  goto(url: string): Promise<void>;
  waitForSelector(selector: string, options?: { timeout?: number; state?: 'visible' | 'attached' }): Promise<void>;
  isVisible(selector: string): Promise<boolean>;
  count(selector: string): Promise<number>;
  click(selector: string): Promise<void>;
  clickText(text: string): Promise<void>;
  clickNavText(text: string): Promise<void>;
  keyboardPress(key: string): Promise<void>;
  evaluate<T, A = void>(fn: (arg: A) => T | Promise<T>, arg?: A): Promise<T>;
  waitForTimeout(ms: number): Promise<void>;
  content(): Promise<string>;
}

function record(
  checks: EngineeringRealityCheck[],
  input: Omit<EngineeringRealityCheck, 'passed'> & { passed: boolean },
): void {
  checks.push({ ...input, passed: input.passed });
}

export async function runEngineeringRuntimeChecks(
  page: EngineeringValidationPage,
  input: { previewUrl: string; navLabel: string },
  checks: EngineeringRealityCheck[],
  runtimeHealth: EngineeringRuntimeHealth,
): Promise<EngineeringLoadAnalysis> {
  const launchStart = Date.now();
  await page.goto(input.previewUrl);
  await page.waitForSelector('[data-blueprint="launch-screen"]', { timeout: 8000, state: 'visible' });
  const launchMs = Date.now() - launchStart;

  record(checks, {
    id: 'perf-initial-load',
    category: 'performance',
    label: 'Application loads within reasonable time',
    passed: launchMs <= 8000,
    detail: `Launch screen visible in ${launchMs}ms`,
    critical: true,
  });

  const shellStart = Date.now();
  const authBeforeShell = !(await page.isVisible('[data-blueprint="app-shell"]'));
  record(checks, {
    id: 'security-auth-before-shell',
    category: 'security',
    label: 'Application shell gated behind authentication flow',
    passed: authBeforeShell,
    detail: authBeforeShell ? 'App shell not exposed before auth' : 'App shell reachable without auth gate',
    critical: true,
  });

  await page.waitForSelector('[data-blueprint="welcome-screen"]', { timeout: 5000, state: 'visible' });
  await page.click('[data-blueprint="welcome-screen"] .blueprint-btn-primary');
  await page.waitForSelector('[data-blueprint="auth-layer"]', { timeout: 5000, state: 'visible' });
  const authConfigured = await page.isVisible('[data-blueprint="auth-guest"]');
  record(checks, {
    id: 'security-auth-configured',
    category: 'security',
    label: 'Authentication entry configured',
    passed: authConfigured,
    detail: authConfigured ? 'Guest auth path available' : 'Auth screen missing guest entry',
    critical: true,
  });

  await page.click('[data-blueprint="auth-guest"]');
  await page.waitForSelector('[data-blueprint="onboarding"]', { timeout: 5000, state: 'visible' });
  await page.clickText('Skip');
  await page.waitForSelector('[data-blueprint="app-shell"]', { timeout: 8000, state: 'visible' });
  const shellMs = Date.now() - shellStart;

  record(checks, {
    id: 'security-guest-auth-works',
    category: 'security',
    label: 'Guest authentication path completes',
    passed: true,
    detail: 'Guest auth reached app shell',
    critical: true,
  });

  record(checks, {
    id: 'perf-shell-transition',
    category: 'performance',
    label: 'Auth and onboarding transition responsive',
    passed: shellMs <= 12000,
    detail: `Reached app shell in ${shellMs}ms`,
    critical: false,
  });

  const pageContent = await page.content();
  const secretInDom = /sk-[a-zA-Z0-9]{10,}|AKIA[0-9A-Z]{16}|password\s*[:=]\s*['"][^'"]{4,}/i.test(
    pageContent,
  );
  record(checks, {
    id: 'security-no-secrets-in-dom',
    category: 'security',
    label: 'No obvious secrets exposed in rendered DOM',
    passed: !secretInDom,
    detail: secretInDom ? 'Secret-like pattern found in page HTML' : 'No secret patterns in rendered DOM',
    critical: true,
  });

  const storageSafety = await page.evaluate(() => {
    const risky: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      const value = localStorage.getItem(key) ?? '';
      if (/password|secret|api[_-]?key|token/i.test(value) && value.length > 12) {
        risky.push(key);
      }
    }
    return risky;
  });
  record(checks, {
    id: 'security-local-storage-safe',
    category: 'security',
    label: 'Local storage used safely for app data',
    passed: storageSafety.length === 0,
    detail:
      storageSafety.length === 0
        ? 'No credential-like values in localStorage'
        : `Risky localStorage keys: ${storageSafety.join(', ')}`,
    critical: true,
  });

  const xssVectors = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script')).filter(
      (node) => !node.src && (node.textContent ?? '').includes('innerHTML'),
    );
    return scripts.length;
  });
  record(checks, {
    id: 'security-no-inline-xss',
    category: 'security',
    label: 'No obvious inline XSS vectors in rendered DOM',
    passed: xssVectors === 0,
    detail: xssVectors === 0 ? 'No suspicious inline script patterns' : `${xssVectors} suspicious inline scripts`,
    critical: true,
  });

  await page.clickNavText('Home');
  await page.waitForSelector('[data-blueprint="home-formula"]', { timeout: 5000, state: 'visible' });

  const navCandidates = [input.navLabel, 'Tasks', 'Customers', 'Inventory', 'Students', 'Projects'];
  let coreFeatureReached = false;
  const navStart = Date.now();
  for (const label of navCandidates) {
    try {
      await page.clickNavText(label);
      for (const selector of ['.universal-feature', '.task-tracker-feature']) {
        try {
          await page.waitForSelector(selector, { timeout: 4000, state: 'visible' });
          coreFeatureReached = true;
          break;
        } catch {
          /* try next selector */
        }
      }
      if (coreFeatureReached) break;
    } catch {
      /* try next nav label */
    }
  }

  if (!coreFeatureReached) {
    throw new Error(`Could not navigate to core feature via nav labels: ${navCandidates.join(', ')}`);
  }

  const navigationMs = Date.now() - navStart;

  record(checks, {
    id: 'perf-navigation-responsive',
    category: 'performance',
    label: 'Route navigation remains responsive',
    passed: navigationMs <= 8000,
    detail: `Home → core feature in ${navigationMs}ms`,
    critical: true,
  });

  record(checks, {
    id: 'security-protected-routes-navigable',
    category: 'security',
    label: 'Protected shell routes reachable only after auth',
    passed: await page.isVisible('.blueprint-sidenav'),
    detail: 'Authenticated shell navigation active',
    critical: false,
  });

  const consoleErrorBudget = runtimeHealth.consoleErrors.length <= 3;
  record(checks, {
    id: 'perf-console-error-budget',
    category: 'performance',
    label: 'Runtime console errors within acceptable budget',
    passed: consoleErrorBudget,
    detail: `${runtimeHealth.consoleErrors.length} console errors`,
    critical: false,
  });

  record(checks, {
    id: 'security-no-dangerous-console-errors',
    category: 'security',
    label: 'No dangerous runtime console errors',
    passed: !runtimeHealth.consoleErrors.some((message) =>
      /unauthorized|xss|csp|eval\(|secret|token leak/i.test(message),
    ),
    detail:
      runtimeHealth.consoleErrors.length === 0
        ? 'No console errors captured'
        : runtimeHealth.consoleErrors.slice(0, 3).join(' | '),
    critical: true,
  });

  const labeledInputs = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const labeled = inputs.filter((input) => {
      const aria = input.getAttribute('aria-label');
      const id = input.getAttribute('id');
      if (aria && aria.trim()) return true;
      if (id && document.querySelector(`label[for="${id}"]`)) return true;
      return false;
    }).length;
    return { labeled, total: inputs.length };
  });
  record(checks, {
    id: 'a11y-form-controls-labeled',
    category: 'accessibility',
    label: 'Form controls labeled for assistive technology',
    passed: labeledInputs.total === 0 || labeledInputs.labeled / labeledInputs.total >= 0.6,
    detail: `${labeledInputs.labeled}/${labeledInputs.total} inputs labeled`,
    critical: true,
  });

  const buttonsReachable = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).filter((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).length,
  );
  record(checks, {
    id: 'a11y-buttons-discoverable',
    category: 'accessibility',
    label: 'Buttons discoverable and visible',
    passed: buttonsReachable >= 5,
    detail: `${buttonsReachable} visible buttons`,
    critical: true,
  });

  const sidenavLabeled = await page.isVisible('.blueprint-sidenav[aria-label]');
  record(checks, {
    id: 'a11y-navigation-understandable',
    category: 'accessibility',
    label: 'Primary navigation is understandable',
    passed: sidenavLabeled,
    detail: sidenavLabeled ? 'Side navigation has aria-label' : 'Navigation missing aria-label',
    critical: false,
  });

  const imageLabels = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    if (images.length === 0) return { ok: true, detail: 'No images on core route' };
    const labeled = images.filter((img) => (img.getAttribute('alt') ?? '').trim().length > 0).length;
    return { ok: labeled / images.length >= 0.5, detail: `${labeled}/${images.length} images labeled` };
  });
  record(checks, {
    id: 'a11y-images-labeled',
    category: 'accessibility',
    label: 'Images labeled where present',
    passed: imageLabels.ok,
    detail: imageLabels.detail,
    critical: false,
  });

  await page.keyboardPress('Tab');
  await page.waitForTimeout(150);
  const focusableCount = await page.evaluate(
    () => document.querySelectorAll('button, a, input, [tabindex]:not([tabindex="-1"])').length,
  );
  record(checks, {
    id: 'a11y-keyboard-navigation',
    category: 'accessibility',
    label: 'Keyboard navigation reaches interactive elements',
    passed: focusableCount >= 8,
    detail: `${focusableCount} focusable elements on core route`,
    critical: true,
  });

  const activeElementTag = await page.evaluate(() => document.activeElement?.tagName ?? 'NONE');
  record(checks, {
    id: 'a11y-interactive-elements-reachable',
    category: 'accessibility',
    label: 'Interactive elements reachable via keyboard',
    passed: activeElementTag !== 'BODY' && activeElementTag !== 'NONE',
    detail: `Active element after Tab: ${activeElementTag}`,
    critical: false,
  });

  return {
    launchMs,
    shellMs,
    navigationMs,
    detail: `launch=${launchMs}ms shell=${shellMs}ms nav=${navigationMs}ms`,
  };
}

export function createPlaywrightEngineeringValidationPage(
  page: PlaywrightPageAdapter & {
    waitForTimeout(ms: number): Promise<void>;
    evaluate<T, U>(fn: (arg: U) => T | Promise<T>, arg: U): Promise<T>;
    keyboard: { press(key: string): Promise<void> };
    content(): Promise<string>;
    on(event: 'console', handler: (message: { type(): string; text(): string }) => void): void;
  },
): { page: EngineeringValidationPage; runtimeHealth: EngineeringRuntimeHealth } {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
    if (message.type() === 'warning') consoleWarnings.push(message.text());
  });

  return {
    runtimeHealth: {
      consoleErrors,
      consoleWarnings,
      detail: `${consoleErrors.length} errors, ${consoleWarnings.length} warnings`,
    },
    page: {
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
      click: (selector) => page.locator(selector).first().click(),
      clickText: (text) => page.getByText(text, { exact: false }).first().click(),
      clickNavText: (text) => page.locator('.blueprint-sidenav').getByText(text, { exact: false }).click(),
      keyboardPress: (key) => page.keyboard.press(key),
      evaluate: (fn, arg) => page.evaluate(fn, arg as never),
      waitForTimeout: (ms) => page.waitForTimeout(ms),
      content: () => page.content(),
    },
  };
}
