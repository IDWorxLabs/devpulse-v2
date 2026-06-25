/**
 * Universal App Blueprint Visual Validation Authority V1 — rendered-app Playwright runner.
 */

import type { PlaywrightPageAdapter } from '../playwright-adapter/playwright-page-types.js';
import { VIEWPORTS } from './universal-app-blueprint-visual-registry.js';
import type { BlueprintVisualCheck } from './universal-app-blueprint-visual-types.js';

export interface VisualValidationPage {
  goto(url: string): Promise<void>;
  setViewport(size: { width: number; height: number }): Promise<void>;
  waitForSelector(selector: string, options?: { timeout?: number; state?: 'visible' | 'attached' }): Promise<void>;
  isVisible(selector: string): Promise<boolean>;
  count(selector: string): Promise<number>;
  textContent(selector: string): Promise<string | null>;
  click(selector: string): Promise<void>;
  clickText(text: string): Promise<void>;
  clickNavText(text: string): Promise<void>;
  clickTopbarText(text: string): Promise<void>;
  evaluate<T>(fn: () => T | Promise<T>): Promise<T>;
  keyboardPress(key: string): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
}

function check(
  checks: BlueprintVisualCheck[],
  input: Omit<BlueprintVisualCheck, 'passed'> & { passed: boolean },
): void {
  checks.push({ ...input, passed: input.passed });
}

async function advanceToShell(page: VisualValidationPage, checks: BlueprintVisualCheck[]): Promise<void> {
  await page.waitForSelector('[data-blueprint="launch-screen"]', { timeout: 8000, state: 'visible' });
  const logoVisible = await page.isVisible('.blueprint-logo');
  const nameVisible = ((await page.textContent('h1'))?.trim().length ?? 0) > 0;
  const taglineVisible = await page.isVisible('.blueprint-tagline');
  const loadingVisible = await page.isVisible('.blueprint-loading-bar');
  const bodyNotBlank = ((await page.textContent('body')) ?? '').trim().length > 20;

  check(checks, {
    id: 'launch-screen',
    category: 'launch',
    label: 'Launch screen renders',
    passed: true,
    detail: 'Launch screen visible in rendered DOM',
    critical: true,
  });
  check(checks, {
    id: 'launch-logo',
    category: 'launch',
    label: 'Logo visible',
    passed: logoVisible,
    detail: logoVisible ? 'Logo element visible' : 'Logo missing',
    critical: true,
  });
  check(checks, {
    id: 'launch-name',
    category: 'launch',
    label: 'App name visible',
    passed: nameVisible,
    detail: nameVisible ? 'App name heading visible' : 'App name missing',
    critical: true,
  });
  check(checks, {
    id: 'launch-tagline',
    category: 'launch',
    label: 'Tagline visible',
    passed: taglineVisible,
    detail: taglineVisible ? 'Tagline visible' : 'Tagline missing',
    critical: false,
  });
  check(checks, {
    id: 'launch-loading',
    category: 'loading',
    label: 'Loading indicator visible on launch',
    passed: loadingVisible,
    detail: loadingVisible ? 'Launch loading bar visible' : 'No loading feedback on launch',
    critical: false,
  });
  check(checks, {
    id: 'launch-not-blank',
    category: 'launch',
    label: 'No blank screen on launch',
    passed: bodyNotBlank,
    detail: bodyNotBlank ? 'Launch screen has content' : 'Blank launch screen',
    critical: true,
  });

  await page.waitForSelector('[data-blueprint="welcome-screen"]', { timeout: 5000, state: 'visible' });
  const headlineVisible = await page.isVisible('[data-blueprint="welcome-screen"] h1');
  const descriptionVisible = ((await page.textContent('[data-blueprint="welcome-screen"] p')) ?? '').length > 10;
  const ctaVisible = await page.isVisible('[data-blueprint="welcome-screen"] .blueprint-btn-primary');

  check(checks, {
    id: 'welcome-headline',
    category: 'welcome',
    label: 'Welcome headline visible',
    passed: headlineVisible,
    detail: headlineVisible ? 'Headline visible' : 'Headline missing',
    critical: true,
  });
  check(checks, {
    id: 'welcome-description',
    category: 'welcome',
    label: 'Welcome description visible',
    passed: descriptionVisible,
    detail: descriptionVisible ? 'Description visible' : 'Description missing',
    critical: false,
  });
  check(checks, {
    id: 'welcome-cta',
    category: 'welcome',
    label: 'Primary CTA visible',
    passed: ctaVisible,
    detail: ctaVisible ? 'Primary CTA visible' : 'CTA missing',
    critical: true,
  });

  await page.click('[data-blueprint="welcome-screen"] .blueprint-btn-primary');

  await page.waitForSelector('[data-blueprint="auth-layer"]', { timeout: 5000, state: 'visible' });
  const guestVisible = await page.isVisible('[data-blueprint="auth-guest"]');
  const emailVisible = await page.isVisible('[data-blueprint="auth-email"]');
  const socialVisible = (await page.count('[data-blueprint="auth-social"] button')) >= 3;

  check(checks, {
    id: 'auth-guest',
    category: 'auth',
    label: 'Guest mode available',
    passed: guestVisible,
    detail: guestVisible ? 'Guest mode button visible' : 'Guest mode missing',
    critical: true,
  });
  check(checks, {
    id: 'auth-email',
    category: 'auth',
    label: 'Email signup available',
    passed: emailVisible,
    detail: emailVisible ? 'Email/password form visible' : 'Email auth missing',
    critical: false,
  });
  check(checks, {
    id: 'auth-social',
    category: 'auth',
    label: 'Social login placeholders visible',
    passed: socialVisible,
    detail: socialVisible ? 'Social login placeholders visible' : 'Social placeholders missing',
    critical: false,
  });

  await page.click('[data-blueprint="auth-guest"]');
  await page.waitForSelector('[data-blueprint="onboarding"]', { timeout: 5000, state: 'visible' });
  check(checks, {
    id: 'onboarding-flow',
    category: 'welcome',
    label: 'Onboarding reachable',
    passed: true,
    detail: 'Onboarding screen rendered after auth',
    critical: false,
  });
  await page.clickText('Skip');
  await page.waitForSelector('[data-blueprint="app-shell"]', { timeout: 8000, state: 'visible' });
}

export async function runBlueprintVisualChecks(
  page: VisualValidationPage,
  previewUrl: string,
  options: { coreNavLabel?: string } = {},
): Promise<{ checks: BlueprintVisualCheck[]; viewportEvidence: string[] }> {
  const checks: BlueprintVisualCheck[] = [];
  const viewportEvidence: string[] = [];

  await page.setViewport(VIEWPORTS.desktop);
  await page.goto(previewUrl);
  await advanceToShell(page, checks);

  const sidenavVisible = await page.isVisible('.blueprint-sidenav');
  const topbarVisible = await page.isVisible('.blueprint-topbar');
  const homeVisible = await page.isVisible('[data-blueprint="home-formula"]');

  check(checks, {
    id: 'nav-sidenav',
    category: 'navigation',
    label: 'Desktop sidebar visible',
    passed: sidenavVisible,
    detail: sidenavVisible ? 'Side navigation visible' : 'Sidebar missing on desktop',
    critical: true,
  });
  check(checks, {
    id: 'nav-topbar',
    category: 'navigation',
    label: 'Top bar visible',
    passed: topbarVisible,
    detail: topbarVisible ? 'Top bar visible' : 'Top bar missing',
    critical: true,
  });
  check(checks, {
    id: 'home-formula',
    category: 'home',
    label: 'Home screen formula present',
    passed: homeVisible,
    detail: homeVisible ? 'Home dashboard visible' : 'Home content missing',
    critical: true,
  });

  const quickActions = await page.isVisible('[data-blueprint="home-formula"] .blueprint-btn-primary');
  const recentActivity = ((await page.textContent('[data-blueprint="home-formula"]')) ?? '').includes('Recent activity');
  const insights = ((await page.textContent('[data-blueprint="home-formula"]')) ?? '').includes('Insights');

  check(checks, {
    id: 'home-quick-actions',
    category: 'home',
    label: 'Quick actions visible',
    passed: quickActions,
    detail: quickActions ? 'Quick actions present' : 'Quick actions missing',
    critical: false,
  });
  check(checks, {
    id: 'home-recent',
    category: 'home',
    label: 'Recent activity visible',
    passed: recentActivity,
    detail: recentActivity ? 'Recent activity section present' : 'Recent activity missing',
    critical: false,
  });
  check(checks, {
    id: 'home-insights',
    category: 'home',
    label: 'Insights section visible',
    passed: insights,
    detail: insights ? 'Insights section present' : 'Insights missing',
    critical: false,
  });

  await page.clickTopbarText('Search');
  await page.waitForSelector('[data-blueprint="search"]', { timeout: 5000, state: 'visible' });
  const searchInputVisible = await page.isVisible('[data-blueprint="search"] input[type="search"], [data-blueprint="search"] .blueprint-input');
  check(checks, {
    id: 'search-ui',
    category: 'search',
    label: 'Search UI visible',
    passed: searchInputVisible,
    detail: searchInputVisible ? 'Search input visible' : 'Search control missing',
    critical: true,
  });
  const emptyStateVisible = await page.isVisible('[data-blueprint="empty-state"]');
  check(checks, {
    id: 'search-empty-state',
    category: 'empty',
    label: 'Search empty state explains and offers action',
    passed: emptyStateVisible,
    detail: emptyStateVisible ? 'Empty state with recovery CTA visible' : 'Blank search results area',
    critical: false,
  });

  await page.click('.blueprint-topbar-actions button >> nth=1');
  await page.waitForSelector('[data-blueprint="notifications"]', { timeout: 5000, state: 'visible' });
  const markReadVisible = ((await page.textContent('body')) ?? '').includes('Mark read');
  const archiveVisible = ((await page.textContent('body')) ?? '').includes('Archive');
  check(checks, {
    id: 'notifications-center',
    category: 'notifications',
    label: 'Notification center accessible',
    passed: true,
    detail: 'Notifications page rendered',
    critical: true,
  });
  check(checks, {
    id: 'notifications-mark-read',
    category: 'notifications',
    label: 'Mark read action available',
    passed: markReadVisible,
    detail: markReadVisible ? 'Mark read action visible' : 'Mark read missing',
    critical: false,
  });
  check(checks, {
    id: 'notifications-archive',
    category: 'notifications',
    label: 'Archive action available',
    passed: archiveVisible,
    detail: archiveVisible ? 'Archive action visible' : 'Archive missing',
    critical: false,
  });

  await page.click('.blueprint-topbar-actions button >> nth=2');
  await page.waitForSelector('[data-blueprint="profile"]', { timeout: 5000, state: 'visible' });
  const profileInfo = ((await page.textContent('[data-blueprint="profile"]')) ?? '').includes('Email');
  check(checks, {
    id: 'profile-page',
    category: 'profile',
    label: 'Profile page renders with user info',
    passed: profileInfo,
    detail: profileInfo ? 'Profile information visible' : 'Profile route broken',
    critical: true,
  });

  await page.clickNavText('Settings');
  await page.waitForSelector('[data-blueprint="settings"]', { timeout: 5000, state: 'visible' });
  const settingsText = (await page.textContent('[data-blueprint="settings"]')) ?? '';
  check(checks, {
    id: 'settings-general',
    category: 'settings',
    label: 'General settings visible',
    passed: settingsText.includes('General'),
    detail: settingsText.includes('General') ? 'General settings present' : 'General settings missing',
    critical: false,
  });
  check(checks, {
    id: 'settings-appearance',
    category: 'settings',
    label: 'Appearance settings visible',
    passed: settingsText.includes('Appearance'),
    detail: settingsText.includes('Appearance') ? 'Appearance settings present' : 'Appearance missing',
    critical: false,
  });
  check(checks, {
    id: 'settings-security',
    category: 'settings',
    label: 'Security settings visible',
    passed: settingsText.includes('Security'),
    detail: settingsText.includes('Security') ? 'Security settings present' : 'Security missing',
    critical: false,
  });
  const loadingStateVisible = await page.isVisible('[data-blueprint="loading-state"]');
  check(checks, {
    id: 'loading-state-settings',
    category: 'loading',
    label: 'Loading state feedback visible',
    passed: loadingStateVisible,
    detail: loadingStateVisible ? 'Skeleton/progress loading state visible' : 'No loading feedback',
    critical: false,
  });

  await page.clickNavText('Help');
  await page.waitForSelector('[data-blueprint="help-center"]', { timeout: 5000, state: 'visible' });
  const helpText = (await page.textContent('[data-blueprint="help-center"]')) ?? '';
  check(checks, {
    id: 'help-center',
    category: 'help',
    label: 'Help center exists',
    passed: helpText.includes('Help Center'),
    detail: 'Help center page rendered',
    critical: true,
  });
  await page.clickText('Report a bug');
  await page.waitForSelector('[data-blueprint="error-state"]', { timeout: 3000, state: 'visible' });
  const retryVisible = ((await page.textContent('[data-blueprint="error-state"]')) ?? '').includes('Retry');
  check(checks, {
    id: 'error-state-recoverable',
    category: 'error',
    label: 'Error state shows message and retry',
    passed: retryVisible,
    detail: retryVisible ? 'Recoverable error state with retry action' : 'Error state incomplete',
    critical: false,
  });

  await page.clickNavText('Feedback');
  await page.waitForSelector('[data-blueprint="feedback"]', { timeout: 5000, state: 'visible' });
  check(checks, {
    id: 'feedback-page',
    category: 'feedback',
    label: 'Feedback page exists',
    passed: true,
    detail: 'Feedback page rendered',
    critical: true,
  });

  await page.clickNavText('Legal');
  await page.waitForSelector('[data-blueprint="legal"]', { timeout: 5000, state: 'visible' });
  const legalText = (await page.textContent('[data-blueprint="legal"]')) ?? '';
  check(checks, {
    id: 'legal-privacy',
    category: 'legal',
    label: 'Privacy Policy section visible',
    passed: legalText.includes('Privacy Policy'),
    detail: legalText.includes('Privacy Policy') ? 'Privacy Policy present' : 'Privacy Policy missing',
    critical: true,
  });
  check(checks, {
    id: 'legal-terms',
    category: 'legal',
    label: 'Terms of Service section visible',
    passed: legalText.includes('Terms of Service'),
    detail: legalText.includes('Terms of Service') ? 'Terms present' : 'Terms missing',
    critical: true,
  });

  const aiFabVisible = await page.isVisible('[data-blueprint="universal-ai"]');
  check(checks, {
    id: 'ai-fab-visible',
    category: 'ai',
    label: 'Floating AI assistant visible',
    passed: aiFabVisible,
    detail: aiFabVisible ? 'AI assistant FAB visible' : 'AI assistant missing',
    critical: false,
  });
  if (aiFabVisible) {
    await page.click('[data-blueprint="universal-ai"]');
    const panelVisible = await page.isVisible('.blueprint-ai-panel');
    check(checks, {
      id: 'ai-panel-opens',
      category: 'ai',
      label: 'AI assistant opens successfully',
      passed: panelVisible,
      detail: panelVisible ? 'AI panel opened' : 'AI panel did not open',
      critical: false,
    });
    const navStillVisible = await page.isVisible('.blueprint-topbar');
    check(checks, {
      id: 'ai-does-not-block-nav',
      category: 'ai',
      label: 'AI assistant does not block navigation',
      passed: navStillVisible,
      detail: navStillVisible ? 'Top navigation remains accessible' : 'Navigation blocked by AI panel',
      critical: false,
    });
  }

  const coreNavCandidates = [
    options.coreNavLabel,
    'Tasks',
    'Customers',
    'Inventory',
    'Students',
    'Projects',
  ].filter((label): label is string => Boolean(label));

  let coreFeatureVisible = false;
  let coreFeatureDetail = 'Core feature route did not render';
  for (const label of coreNavCandidates) {
    try {
      await page.clickNavText(label);
      for (const selector of ['.universal-feature', '.task-tracker-feature']) {
        try {
          await page.waitForSelector(selector, { timeout: 4000, state: 'visible' });
          coreFeatureVisible = true;
          coreFeatureDetail = `${label} core feature rendered (${selector})`;
          break;
        } catch {
          /* try next selector */
        }
      }
      if (coreFeatureVisible) break;
    } catch {
      /* try next nav label */
    }
  }

  check(checks, {
    id: 'core-feature-route',
    category: 'navigation',
    label: 'Core feature route works',
    passed: coreFeatureVisible,
    detail: coreFeatureDetail,
    critical: true,
  });

  const labeledInputs = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    return inputs.filter((input) => {
      const aria = input.getAttribute('aria-label');
      const id = input.getAttribute('id');
      if (aria && aria.trim()) return true;
      if (id && document.querySelector(`label[for="${id}"]`)) return true;
      return false;
    }).length;
  });
  const totalInputs = await page.count('input');
  check(checks, {
    id: 'a11y-input-labels',
    category: 'accessibility',
    label: 'Inputs labeled',
    passed: totalInputs === 0 || labeledInputs / totalInputs >= 0.6,
    detail: `${labeledInputs}/${totalInputs} inputs labeled`,
    critical: false,
  });
  const buttonsReachable = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.filter((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).length;
  });
  check(checks, {
    id: 'a11y-buttons-reachable',
    category: 'accessibility',
    label: 'Buttons reachable',
    passed: buttonsReachable > 5,
    detail: `${buttonsReachable} visible buttons`,
    critical: false,
  });

  for (const viewport of [VIEWPORTS.mobile, VIEWPORTS.tablet]) {
    await page.setViewport(viewport);
    await page.waitForTimeout(300);
    const bottomNavCount = await page.count('.blueprint-bottomnav-item');
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 2;
    });
    const bottomNavVisible = await page.isVisible('.blueprint-bottomnav');
    viewportEvidence.push(
      `${viewport.label}: bottomNavItems=${bottomNavCount}, bottomNavVisible=${bottomNavVisible}, horizontalOverflow=${overflow}`,
    );
    if (viewport.label === 'mobile') {
      check(checks, {
        id: 'responsive-mobile-bottom-nav',
        category: 'responsive',
        label: 'Mobile bottom navigation visible',
        passed: bottomNavVisible,
        detail: bottomNavVisible ? 'Bottom navigation visible on mobile' : 'Bottom navigation missing on mobile',
        critical: true,
      });
      check(checks, {
        id: 'responsive-mobile-tab-limit',
        category: 'responsive',
        label: 'Maximum five primary mobile tabs',
        passed: bottomNavCount > 0 && bottomNavCount <= 5,
        detail: `${bottomNavCount} mobile tabs`,
        critical: false,
      });
    }
    check(checks, {
      id: `responsive-${viewport.label}-overflow`,
      category: 'responsive',
      label: `No horizontal overflow on ${viewport.label}`,
      passed: !overflow,
      detail: overflow ? 'Layout overflow detected' : 'No overflow detected',
      critical: viewport.label === 'mobile',
    });
  }

  return { checks, viewportEvidence };
}

export function createPlaywrightVisualValidationPage(
  page: PlaywrightPageAdapter & {
    setViewportSize(size: { width: number; height: number }): Promise<void>;
    waitForTimeout(ms: number): Promise<void>;
    keyboard: { press(key: string): Promise<void> };
    evaluate<T>(fn: () => T | Promise<T>): Promise<T>;
  },
): VisualValidationPage {
  return {
    goto: async (url) => {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
    },
    setViewport: (size) => page.setViewportSize(size),
    waitForSelector: (selector, options) =>
      page.waitForSelector(selector, { timeout: options?.timeout ?? 5000, state: options?.state ?? 'visible' }) as Promise<void>,
    isVisible: async (selector) => {
      const locator = page.locator(selector);
      if ((await locator.count()) === 0) return false;
      return locator.first().isVisible();
    },
    count: (selector) => page.locator(selector).count(),
    textContent: (selector) => page.locator(selector).textContent(),
    click: (selector) => page.locator(selector).click(),
    clickText: (text) => page.getByText(text, { exact: false }).first().click(),
    clickNavText: (text) => page.locator('.blueprint-sidenav').getByText(text, { exact: false }).click(),
    clickTopbarText: (text) => page.locator('.blueprint-topbar-actions').getByText(text, { exact: false }).click(),
    evaluate: (fn) => page.evaluate(fn),
    keyboardPress: (key) => page.keyboard.press(key),
    waitForTimeout: (ms) => page.waitForTimeout(ms),
  };
}
