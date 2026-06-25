/**
 * Minimal Playwright page/locator shapes for validation runners.
 * Compatible with real Playwright Page (goto returns Response | null).
 */

export type PlaywrightNavigationResult = unknown;

export interface PlaywrightLocator {
  isVisible(): Promise<boolean>;
  count(): Promise<number>;
  textContent(): Promise<string | null>;
  click(): Promise<void>;
  fill(value: string): Promise<void>;
  first(): PlaywrightLocator;
  getByText(text: string, options?: { exact?: boolean }): PlaywrightLocator;
}

export interface PlaywrightPageAdapter {
  goto(
    url: string,
    options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' },
  ): Promise<PlaywrightNavigationResult | null>;
  reload?(options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<PlaywrightNavigationResult | null>;
  setViewportSize?(size: { width: number; height: number }): Promise<void>;
  waitForSelector(
    selector: string,
    options?: { timeout?: number; state?: 'visible' | 'attached' },
  ): Promise<unknown>;
  waitForTimeout?(ms: number): Promise<void>;
  locator(selector: string): PlaywrightLocator;
  getByText(text: string, options?: { exact?: boolean }): PlaywrightLocator;
  evaluate?<T, U = void>(fn: U extends void ? () => T | Promise<T> : (arg: U) => T | Promise<T>, arg?: U): Promise<T>;
  keyboard?: { press(key: string): Promise<void> };
  content?(): Promise<string>;
  on?(event: 'console', handler: (message: { type(): string; text(): string }) => void): void;
}
