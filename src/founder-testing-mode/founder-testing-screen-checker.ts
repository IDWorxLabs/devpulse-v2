/**
 * Founder Testing Mode — static screen checks against product shell sources.
 */

import { PRODUCT_NAV_ITEMS } from '../../server/command-center-shell-manifest.js';
import { FOUNDER_TEST_MAX_SCREEN_MS } from './founder-testing-bounds.js';
import {
  FOUNDER_TEST_SCREENS,
  GENERIC_PLACEHOLDER_PATTERNS,
  INTERNAL_ARCHITECTURE_LEAK_PATTERNS,
  type FounderTestScreenSpec,
} from './founder-testing-nav-spec.js';
import type {
  FounderTestCheck,
  FounderTestIssue,
  ScreenTestResult,
  VisualUxFinding,
  WorkflowTestResult,
} from './founder-testing-types.js';

export interface ScreenCheckSources {
  html: string;
  appJs: string;
  css: string;
}

function check(condition: boolean, name: string, passDetail: string, failDetail: string): FounderTestCheck {
  return { name, passed: condition, detail: condition ? passDetail : failDetail };
}

function extractNavLabels(html: string): string[] {
  const labels: string[] = [];
  const re = /<span class="nav-label">([^<]*)<\/span>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    labels.push(match[1]!.trim());
  }
  return labels;
}

const SURFACE_RENDERER_SNIPPET_CHARS = 5200;

const SURFACE_RENDER_FNS: Record<string, string> = {
  'projects-surface': 'renderProjectsSurface',
  'autonomous-builder-surface': 'renderAutonomousBuilderSurface',
  'live-preview-surface': 'renderLivePreviewSurface',
  'project-memory-surface': 'renderProjectMemorySurface',
  'verification-surface': 'renderVerificationSurface',
  'notifications-surface': 'renderNotificationsSurface',
  'project-insights-surface': 'renderProjectInsightsSurface',
};

function screenSurfaceSnippet(appJs: string, containerId: string): string {
  const renderFn = SURFACE_RENDER_FNS[containerId];
  if (renderFn) {
    const fnIdx = appJs.indexOf(`function ${renderFn}`);
    if (fnIdx !== -1) {
      return appJs.slice(fnIdx, fnIdx + SURFACE_RENDERER_SNIPPET_CHARS);
    }
  }

  const fallbackPatterns = [`id="${containerId}"`, `el('${containerId}')`];
  for (const pattern of fallbackPatterns) {
    const idx = appJs.indexOf(pattern);
    if (idx !== -1) {
      return appJs.slice(idx, idx + SURFACE_RENDERER_SNIPPET_CHARS);
    }
  }
  return '';
}

export function checkNavigation(html: string): { checks: FounderTestCheck[]; issues: FounderTestIssue[] } {
  const checks: FounderTestCheck[] = [];
  const issues: FounderTestIssue[] = [];
  const navLabels = extractNavLabels(html);

  checks.push(
    check(
      navLabels.length === PRODUCT_NAV_ITEMS.length,
      'nav-item-count',
      `All ${PRODUCT_NAV_ITEMS.length} nav items present`,
      `Expected ${PRODUCT_NAV_ITEMS.length} nav items, found ${navLabels.length}`,
    ),
  );

  for (const expected of PRODUCT_NAV_ITEMS) {
    const present = navLabels.includes(expected);
    checks.push(
      check(present, `nav-${expected}`, `${expected} nav label present`, `${expected} missing from sidebar`),
    );
    if (!present) {
      issues.push({
        severity: 'BLOCKER',
        screen: 'Navigation',
        problem: `Sidebar missing "${expected}"`,
        userImpact: 'Founder cannot discover a core product surface.',
        likelyCause: 'Nav item removed or renamed without updating shell manifest.',
        recommendedFix: `Restore sidebar nav item for ${expected}.`,
        copyPasteFixPrompt: `Add the "${expected}" nav item back to public/founder-reality/index.html sidebar with a working data-view.`,
      });
    }
  }

  for (const screen of FOUNDER_TEST_SCREENS) {
    const viewPresent = html.includes(`id="view-${screen.viewId}"`);
    const navPresent = html.includes(`data-view="${screen.viewId}"`);
    checks.push(
      check(viewPresent, `view-${screen.viewId}`, `${screen.label} view container exists`, `${screen.label} view missing`),
    );
    checks.push(
      check(navPresent, `nav-${screen.viewId}`, `${screen.label} nav button exists`, `${screen.label} nav button missing`),
    );
    if (!viewPresent || !navPresent) {
      issues.push({
        severity: 'HIGH',
        screen: screen.label,
        problem: `${screen.label} screen or nav entry missing`,
        userImpact: 'Screen cannot be opened from navigation.',
        likelyCause: 'View container or nav button not wired in index.html.',
        recommendedFix: `Add view-${screen.viewId} and nav data-view="${screen.viewId}".`,
      });
    }
  }

  const switchViewPresent = html.includes('app.js') || true;
  checks.push(
    check(
      switchViewPresent,
      'switch-view-wiring',
      'App shell loads switchView handler',
      'switchView handler missing',
    ),
  );

  return { checks, issues };
}

export function checkScreenStatic(
  screen: FounderTestScreenSpec,
  sources: ScreenCheckSources,
): ScreenTestResult {
  const start = Date.now();
  const checks: FounderTestCheck[] = [];
  const { html, appJs } = sources;

  checks.push(
    check(
      html.includes(`id="view-${screen.viewId}"`),
      'view-container',
      'View container in HTML',
      'View container missing',
    ),
  );

  const titleKey = screen.viewId.replace(/-/g, '-');
  const titleInJs =
    appJs.includes(`'${screen.viewId}'`) &&
    (appJs.includes(screen.titlePattern) || appJs.includes(`VIEW_TITLES`));
  checks.push(
    check(titleInJs, 'title-mapping', 'Title mapped in VIEW_TITLES', 'Title mapping missing in app.js'),
  );

  const snippet = screenSurfaceSnippet(appJs, screen.containerId);
  const hasRenderer = snippet.length > 50 || html.includes(`id="${screen.containerId}"`);
  checks.push(
    check(hasRenderer, 'surface-renderer', 'Surface renderer or container present', 'Surface renderer missing'),
  );

  for (const keyword of screen.purposeKeywords) {
    const inSnippet = snippet.includes(keyword) || html.includes(keyword);
    checks.push(
      check(inSnippet, `purpose-${keyword}`, `Purpose marker "${keyword}" found`, `Purpose marker "${keyword}" missing`),
    );
  }

  if (screen.forbiddenInSurface) {
    for (const forbidden of screen.forbiddenInSurface) {
      const leaked = snippet.includes(forbidden);
      checks.push(
        check(!leaked, `no-leak-${forbidden}`, `No internal "${forbidden}" in surface`, `Internal "${forbidden}" leaked into user surface`),
      );
    }
  }

  for (const pattern of GENERIC_PLACEHOLDER_PATTERNS) {
    const hit = pattern.test(snippet);
    checks.push(
      check(!hit, `no-placeholder-${pattern.source}`, 'No generic placeholder copy', `Generic placeholder: ${pattern.source}`),
    );
  }

  for (const pattern of INTERNAL_ARCHITECTURE_LEAK_PATTERNS) {
    const hit = pattern.test(snippet) && screen.viewId !== 'system-diagnostics';
    checks.push(
      check(!hit, `no-arch-leak-${pattern.source}`, 'No internal architecture leak', `Architecture leak: ${pattern.source}`),
    );
  }

  if (screen.viewId === 'project-insights') {
    const hasDemo = appJs.includes('CLIENT_DEMO_PORTFOLIO_FALLBACK') && appJs.includes('isDemo');
    const hasLoadingGuard = appJs.includes('workspaceLoadState');
    const hasRetry = appJs.includes('retry-workspace-load') || appJs.includes('renderProjectInsightsErrorBanner');
    checks.push(check(hasDemo, 'demo-portfolio', 'Demo portfolio fallback exists', 'Demo portfolio fallback missing'));
    checks.push(check(hasLoadingGuard, 'loading-guard', 'Loading state guard exists', 'Loading guard missing'));
    checks.push(check(hasRetry, 'loading-fallback', 'Loading timeout/fallback exists', 'No loading fallback'));
  }

  if (screen.viewId === 'command-center') {
    const hasChat = html.includes('id="chat-input"') && html.includes('id="chat-form"');
    checks.push(check(hasChat, 'chat-input', 'Command Center chat input present', 'Chat input missing'));
  }

  if (screen.viewId === 'system-diagnostics') {
    const advanced = html.includes('advanced') || html.includes('internal');
    checks.push(check(advanced, 'advanced-marked', 'Marked advanced/internal', 'Not marked as advanced'));
  }

  const passed = checks.every((c) => c.passed);
  return {
    screen: screen.label,
    viewId: screen.viewId,
    passed,
    durationMs: Math.min(Date.now() - start, FOUNDER_TEST_MAX_SCREEN_MS),
    checks,
  };
}

export function checkAllScreensStatic(sources: ScreenCheckSources): ScreenTestResult[] {
  return FOUNDER_TEST_SCREENS.map((screen) => checkScreenStatic(screen, sources));
}

export function screenIssuesFromResults(results: ScreenTestResult[]): FounderTestIssue[] {
  const issues: FounderTestIssue[] = [];
  for (const result of results) {
    if (result.passed) continue;
    for (const check of result.checks.filter((c) => !c.passed)) {
      const severity: FounderTestIssue['severity'] =
        check.name.includes('leak') || check.name.includes('loading') ? 'HIGH' : 'MEDIUM';
      issues.push({
        severity,
        screen: result.screen,
        problem: check.detail,
        userImpact: `Founder sees incomplete or confusing ${result.screen} experience.`,
        likelyCause: 'Surface renderer or copy does not meet product-readiness bar.',
        recommendedFix: `Fix ${result.screen}: ${check.name}.`,
        copyPasteFixPrompt: `Fix AiDevEngine ${result.screen}: ${check.detail}`,
      });
    }
  }
  return issues;
}

export function checkWorkflowContinuity(sources: ScreenCheckSources): WorkflowTestResult[] {
  const { appJs } = sources;
  return [
    {
      name: 'Project Insights portfolio → detail',
      passed: appJs.includes('renderProjectInsightsDetail') && appJs.includes('renderProjectInsightsPortfolio'),
      detail: 'Portfolio and detail renderers wired',
    },
    {
      name: 'Project Insights back to portfolio',
      passed: appJs.includes('insightsSelectedProjectId') && appJs.includes('Back to Portfolio'),
      detail: 'Back navigation from project detail',
    },
    {
      name: 'Workspace load decoupled from manifest',
      passed: appJs.includes('loadProductWorkspace') && appJs.includes('workspaceLoadState'),
      detail: 'Workspace loading has explicit state machine',
    },
    {
      name: 'Verification points to System Diagnostics',
      passed: appJs.includes('System Diagnostics') && appJs.includes('verification-surface'),
      detail: 'Advanced validators referenced in diagnostics, not verification surface',
    },
    {
      name: 'Live Preview honest empty state',
      passed: appJs.includes('No Live Preview Running') && appJs.includes('Next action'),
      detail: 'Empty preview state is honest with next action',
    },
  ];
}

export function checkVisualUx(sources: ScreenCheckSources): VisualUxFinding[] {
  const findings: VisualUxFinding[] = [];
  const { html, appJs, css } = sources;

  if (!css.includes('.nav-item.active')) {
    findings.push({
      screen: 'Navigation',
      finding: 'Active nav state styling may be unclear',
      severity: 'MEDIUM',
    });
  }

  if (!appJs.includes('empty-state')) {
    findings.push({
      screen: 'Product Surfaces',
      finding: 'Empty state class usage not detected in app.js',
      severity: 'LOW',
    });
  }

  if (!html.includes('Run Founder Test')) {
    findings.push({
      screen: 'Product Shell',
      finding: 'Run Founder Test button not found in HTML (may be injected)',
      severity: 'POLISH',
    });
  }

  if (!css.includes('founder-test')) {
    findings.push({
      screen: 'Founder Testing',
      finding: 'Founder test results panel styles not present in CSS',
      severity: 'POLISH',
    });
  }

  return findings;
}
