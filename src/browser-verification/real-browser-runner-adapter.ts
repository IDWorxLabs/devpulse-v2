/**
 * Real browser runner adapter — Playwright attachment boundary for Browser Verification Harness.
 * Does NOT replace the harness. Falls back honestly when package or environment is unavailable.
 */

import {
  runRealBrowserChecks,
  wrapHtmlForBrowserDocument,
  type RealBrowserCheckContext,
  type RealBrowserCheckPage,
} from './real-browser-checks.js';
import type { BrowserRealityCheck } from './types.js';
import {
  REAL_BROWSER_OWNER_MODULE,
  type RealBrowserRunnerStatus,
} from './types.js';

export interface RealBrowserRunnerAdapter {
  readonly status: RealBrowserRunnerStatus;
  readonly realBrowserRunnerAttached: boolean;
  getAdapterWarnings(): string[];
  verifyRenderedHtml(
    html: string,
    context: RealBrowserCheckContext,
  ): Promise<{ checks: BrowserRealityCheck[]; warnings: string[]; errors: string[] }>;
  dispose(): Promise<void>;
}

let singletonAdapter: RealBrowserRunnerAdapter | null = null;
let cachedStatus: RealBrowserRunnerStatus = 'PACKAGE_REQUIRED';
let statusProbed = false;

function isPackageMissingError(message: string): boolean {
  return (
    message.includes("Cannot find module 'playwright'") ||
    message.includes('Cannot find package') ||
    message.includes('Cannot find module "playwright"') ||
    message.includes('ERR_MODULE_NOT_FOUND')
  );
}

async function probePlaywrightAvailability(): Promise<RealBrowserRunnerStatus> {
  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    await browser.close();
    return 'ATTACHED';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isPackageMissingError(message)) {
      return 'PACKAGE_REQUIRED';
    }
    return 'FAILED';
  }
}

class PlaywrightRealBrowserRunnerAdapter implements RealBrowserRunnerAdapter {
  readonly status: RealBrowserRunnerStatus = 'ATTACHED';
  readonly realBrowserRunnerAttached = true;

  getAdapterWarnings(): string[] {
    return ['Real browser runner attached — Playwright Chromium verification active.'];
  }

  async verifyRenderedHtml(
    html: string,
    context: RealBrowserCheckContext,
  ): Promise<{ checks: BrowserRealityCheck[]; warnings: string[]; errors: string[] }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const playwright = await import('playwright');
      const browser = await playwright.chromium.launch({ headless: true });
      const page = await browser.newPage();

      try {
        await page.setContent(wrapHtmlForBrowserDocument(html), { waitUntil: 'domcontentloaded' });
        const checks = await runRealBrowserChecks(createPlaywrightPage(page), context);
        return { checks, warnings, errors };
      } finally {
        await browser.close();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Real browser verification failed: ${message}`);
      return { checks: [], warnings, errors };
    }
  }

  async dispose(): Promise<void> {
    // Per-run browser lifecycle — nothing to dispose at adapter level.
  }
}

class UnavailableRealBrowserRunnerAdapter implements RealBrowserRunnerAdapter {
  readonly status: RealBrowserRunnerStatus;
  readonly realBrowserRunnerAttached = false;

  constructor(status: Exclude<RealBrowserRunnerStatus, 'ATTACHED'>) {
    this.status = status;
  }

  getAdapterWarnings(): string[] {
    if (this.status === 'PACKAGE_REQUIRED') {
      return [
        'REAL_BROWSER_PACKAGE_REQUIRED — install Playwright to attach real browser runner.',
      ];
    }
    return [
      'Real browser runner probe failed — using simulated HTML verification fallback.',
    ];
  }

  async verifyRenderedHtml(): Promise<{
    checks: BrowserRealityCheck[];
    warnings: string[];
    errors: string[];
  }> {
    return {
      checks: [],
      warnings: this.getAdapterWarnings(),
      errors: [],
    };
  }

  async dispose(): Promise<void> {
    // No-op
  }
}

function createPlaywrightPage(page: {
  locator: (selector: string) => {
    isVisible: () => Promise<boolean>;
    isEnabled: () => Promise<boolean>;
    count: () => Promise<number>;
    textContent: () => Promise<string | null>;
  };
  textContent: (selector: string) => Promise<string | null>;
}): RealBrowserCheckPage {
  return {
    isVisible: (selector) => page.locator(selector).isVisible(),
    isEnabled: (selector) => page.locator(selector).isEnabled(),
    count: (selector) => page.locator(selector).count(),
    textContent: (selector) => page.locator(selector).textContent(),
    bodyText: async () => (await page.textContent('body')) ?? '',
  };
}

export async function createRealBrowserRunnerAdapter(): Promise<RealBrowserRunnerAdapter> {
  if (singletonAdapter) {
    return singletonAdapter;
  }

  if (!statusProbed) {
    cachedStatus = await probePlaywrightAvailability();
    statusProbed = true;
  }

  if (cachedStatus === 'ATTACHED') {
    singletonAdapter = new PlaywrightRealBrowserRunnerAdapter();
  } else {
    singletonAdapter = new UnavailableRealBrowserRunnerAdapter(cachedStatus);
  }

  return singletonAdapter;
}

export function getRealBrowserRunnerStatus(): RealBrowserRunnerStatus {
  return cachedStatus;
}

export function resetRealBrowserRunnerAdapterForTests(): void {
  singletonAdapter = null;
  cachedStatus = 'PACKAGE_REQUIRED';
  statusProbed = false;
}

export { REAL_BROWSER_OWNER_MODULE };
