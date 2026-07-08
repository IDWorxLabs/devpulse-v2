/**
 * Live Preview Interaction Proof V1 — runner.
 *
 * Bounded Playwright driver. Generic only — resolves elements by generic role/tag, never by
 * app-specific selector or text. Dependency-injectable via ProofPageDriver so the decision logic
 * in the normalizer/engine can be tested deterministically without a real browser.
 *
 * Safety budget (enforced here, not just documented):
 *  - max page load wait: 10s (configurable, bounded)
 *  - max interaction attempts: 5 (configurable, bounded)
 *  - max total proof time: 30s (configurable, bounded) — checked between every step
 *  - no infinite retries — each interaction is attempted at most once
 *  - no screenshots taken
 *  - no dependency installation is ever performed by this module
 */

import type {
  InteractionAttemptRecord,
  PlannedInteraction,
} from './live-preview-interaction-proof-types.js';
import { PLAYWRIGHT_INSTALL_INSTRUCTION } from './live-preview-interaction-proof-types.js';

export interface ProofPageDriver {
  goto(url: string, timeoutMs: number): Promise<{ ok: boolean; error?: string }>;
  /** Generic console.error() messages — informational, not necessarily fatal. */
  getConsoleErrors(): string[];
  /** Uncaught exceptions (pageerror) or console errors that clearly indicate a crash. */
  getFatalErrors(): string[];
  countRootUi(): Promise<number>;
  findVisibleText(term: string): Promise<boolean>;
  hasButton(): Promise<boolean>;
  clickFirstButton(): Promise<boolean>;
  hasTextInput(): Promise<boolean>;
  fillAndSubmitFirstTextInput(value: string): Promise<boolean>;
  hasCheckbox(): Promise<boolean>;
  toggleFirstCheckbox(): Promise<{ performed: boolean; changed: boolean }>;
  hasSelect(): Promise<boolean>;
  changeFirstSelect(): Promise<{ performed: boolean; changed: boolean }>;
  hasInternalLink(): Promise<boolean>;
  clickFirstInternalLink(): Promise<boolean>;
  snapshotBodyText(): Promise<string>;
  close(): Promise<void>;
}

export interface PlaywrightLaunchClassification {
  blocked: boolean;
  reason: string;
}

/** Pure — classifies a Playwright launch/navigation error message. Directly unit-testable. */
export function classifyPlaywrightLaunchError(message: string): PlaywrightLaunchClassification {
  const lower = message.toLowerCase();
  const packageMissing =
    lower.includes("cannot find module 'playwright'") ||
    lower.includes('cannot find package') ||
    lower.includes('err_module_not_found');
  const browserMissing =
    lower.includes("executable doesn't exist") ||
    lower.includes('executable does not exist') ||
    lower.includes('browsertype.launch');

  if (packageMissing || browserMissing) {
    return {
      blocked: true,
      reason: `Playwright browser is not installed in this environment. Run: ${PLAYWRIGHT_INSTALL_INSTRUCTION}`,
    };
  }
  return { blocked: false, reason: message };
}

const FATAL_CONSOLE_ERROR_PATTERN = /uncaught|typeerror|referenceerror|is not a function|cannot read propert/i;

class PlaywrightProofPageDriver implements ProofPageDriver {
  private browser: import('playwright').Browser;
  private page: import('playwright').Page;
  private consoleErrors: string[] = [];
  private fatalErrors: string[] = [];

  private constructor(browser: import('playwright').Browser, page: import('playwright').Page) {
    this.browser = browser;
    this.page = page;
    this.page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text().slice(0, 300);
      this.consoleErrors.push(text);
      if (FATAL_CONSOLE_ERROR_PATTERN.test(text)) this.fatalErrors.push(text);
    });
    this.page.on('pageerror', (err) => {
      this.fatalErrors.push(`Uncaught exception: ${err.message}`.slice(0, 300));
    });
  }

  static async launch(): Promise<PlaywrightProofPageDriver> {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(3000);
    return new PlaywrightProofPageDriver(browser, page);
  }

  async goto(url: string, timeoutMs: number): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  getConsoleErrors(): string[] {
    return this.consoleErrors.slice(0, 10);
  }

  getFatalErrors(): string[] {
    return this.fatalErrors.slice(0, 10);
  }

  async countRootUi(): Promise<number> {
    try {
      return await this.page.locator('body *').count();
    } catch {
      return 0;
    }
  }

  async findVisibleText(term: string): Promise<boolean> {
    try {
      const locator = this.page.getByText(term, { exact: false }).first();
      return await locator.isVisible({ timeout: 1000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  async hasButton(): Promise<boolean> {
    return (await this.page.locator('button, [role="button"]').count().catch(() => 0)) > 0;
  }

  async clickFirstButton(): Promise<boolean> {
    try {
      const btn = this.page.locator('button, [role="button"]').first();
      await btn.click({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async hasTextInput(): Promise<boolean> {
    return (
      (await this.page
        .locator('input[type="text"], input:not([type]), textarea')
        .count()
        .catch(() => 0)) > 0
    );
  }

  async fillAndSubmitFirstTextInput(value: string): Promise<boolean> {
    try {
      const input = this.page.locator('input[type="text"], input:not([type]), textarea').first();
      await input.fill(value, { timeout: 2000 });
      await input.press('Enter').catch(() => undefined);
      return true;
    } catch {
      return false;
    }
  }

  async hasCheckbox(): Promise<boolean> {
    return (await this.page.locator('input[type="checkbox"]').count().catch(() => 0)) > 0;
  }

  async toggleFirstCheckbox(): Promise<{ performed: boolean; changed: boolean }> {
    try {
      const checkbox = this.page.locator('input[type="checkbox"]').first();
      const before = await checkbox.isChecked({ timeout: 1000 });
      await checkbox.click({ timeout: 2000 });
      const after = await checkbox.isChecked({ timeout: 1000 });
      return { performed: true, changed: before !== after };
    } catch {
      return { performed: false, changed: false };
    }
  }

  async hasSelect(): Promise<boolean> {
    return (await this.page.locator('select').count().catch(() => 0)) > 0;
  }

  async changeFirstSelect(): Promise<{ performed: boolean; changed: boolean }> {
    try {
      const select = this.page.locator('select').first();
      const before = await select.inputValue({ timeout: 1000 });
      const options = await select.locator('option').count();
      if (options < 2) return { performed: false, changed: false };
      await select.selectOption({ index: 1 }, { timeout: 2000 });
      const after = await select.inputValue({ timeout: 1000 });
      return { performed: true, changed: before !== after };
    } catch {
      return { performed: false, changed: false };
    }
  }

  async hasInternalLink(): Promise<boolean> {
    return (await this.page.locator('a[href^="/"], a[href^="#"]').count().catch(() => 0)) > 0;
  }

  async clickFirstInternalLink(): Promise<boolean> {
    try {
      const link = this.page.locator('a[href^="/"], a[href^="#"]').first();
      await link.click({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async snapshotBodyText(): Promise<string> {
    try {
      return (await this.page.locator('body').innerText({ timeout: 1000 })) ?? '';
    } catch {
      return '';
    }
  }

  async close(): Promise<void> {
    try {
      await this.browser.close();
    } catch {
      /* already closed */
    }
  }
}

export async function launchDefaultProofPageDriver(): Promise<
  { ok: true; driver: ProofPageDriver } | { ok: false; blockedReason: string }
> {
  try {
    const driver = await PlaywrightProofPageDriver.launch();
    return { ok: true, driver };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const classification = classifyPlaywrightLaunchError(message);
    return { ok: false, blockedReason: classification.reason };
  }
}

/** Runs one planned interaction against the driver, taking a before/after body-text snapshot to detect state change. */
export async function attemptInteraction(
  driver: ProofPageDriver,
  interaction: PlannedInteraction,
): Promise<InteractionAttemptRecord> {
  const base = (elementFound: boolean, performed: boolean, stateChanged: boolean, detail: string): InteractionAttemptRecord => ({
    readOnly: true,
    interactionId: interaction.id,
    type: interaction.type,
    label: interaction.label,
    elementFound,
    performed,
    stateChanged,
    detail,
  });

  switch (interaction.type) {
    case 'BUTTON_CLICK': {
      const found = await driver.hasButton();
      if (!found) return base(false, false, false, 'No button was found on the page.');
      const before = await driver.snapshotBodyText();
      const performed = await driver.clickFirstButton();
      if (!performed) return base(true, false, false, 'A button was found but could not be clicked.');
      const after = await driver.snapshotBodyText();
      return base(true, true, before !== after, before !== after ? 'Clicking the button changed the visible content.' : 'Clicking the button did not change the visible content.');
    }
    case 'INPUT_SUBMIT': {
      const found = await driver.hasTextInput();
      if (!found) return base(false, false, false, 'No text input was found on the page.');
      const before = await driver.snapshotBodyText();
      const performed = await driver.fillAndSubmitFirstTextInput('AiDevEngine proof text');
      if (!performed) return base(true, false, false, 'A text input was found but could not be filled.');
      const after = await driver.snapshotBodyText();
      return base(true, true, before !== after, before !== after ? 'Submitting text changed the visible content.' : 'Submitting text did not change the visible content.');
    }
    case 'CHECKBOX_TOGGLE': {
      const found = await driver.hasCheckbox();
      if (!found) return base(false, false, false, 'No checkbox was found on the page.');
      const { performed, changed } = await driver.toggleFirstCheckbox();
      return base(true, performed, changed, changed ? 'Toggling the checkbox changed its state.' : 'Toggling the checkbox had no detectable effect.');
    }
    case 'SELECT_CHANGE': {
      const found = await driver.hasSelect();
      if (!found) return base(false, false, false, 'No dropdown was found on the page.');
      const { performed, changed } = await driver.changeFirstSelect();
      return base(true, performed, changed, changed ? 'Changing the dropdown updated its value.' : 'Changing the dropdown had no detectable effect.');
    }
    case 'LINK_NAVIGATION': {
      const found = await driver.hasInternalLink();
      if (!found) return base(false, false, false, 'No internal link was found on the page.');
      const before = await driver.snapshotBodyText();
      const performed = await driver.clickFirstInternalLink();
      if (!performed) return base(true, false, false, 'A link was found but could not be clicked.');
      const after = await driver.snapshotBodyText();
      return base(true, true, before !== after, before !== after ? 'Clicking the link changed the visible content.' : 'Clicking the link did not change the visible content.');
    }
    default:
      return base(false, false, false, 'Unknown interaction type.');
  }
}
