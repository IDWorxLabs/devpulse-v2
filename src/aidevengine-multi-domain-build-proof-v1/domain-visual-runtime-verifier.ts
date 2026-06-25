/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1 — bounded domain visual/runtime verification.
 */

import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { VIEWPORTS } from '../universal-app-blueprint-visual/universal-app-blueprint-visual-registry.js';
import {
  resetGeneratedDevServerManagerForTests,
  startGeneratedAppDevServer,
  stopAllGeneratedDevServers,
} from '../one-prompt-live-preview/generated-dev-server-manager.js';
import { probePlaywrightAvailable } from '../aidevengine-build-proof-v1-3/bounded-visual-runtime-verifier.js';
import type { VisualRuntimeCheck, VisualRuntimeEvidence } from '../aidevengine-build-proof-v1-3/visual-runtime-evidence-types.js';
import type { MultiDomainScenarioDefinition } from './multi-domain-scenario-types.js';

function recordCheck(
  checks: VisualRuntimeCheck[],
  input: Omit<VisualRuntimeCheck, 'readOnly'>,
): void {
  checks.push({ readOnly: true, ...input });
}

function inspectStaticArtifact(previewArtifactPath: string | null): {
  checks: VisualRuntimeCheck[];
  completed: boolean;
} {
  const checks: VisualRuntimeCheck[] = [];

  if (!previewArtifactPath || !existsSync(previewArtifactPath)) {
    recordCheck(checks, {
      id: 'static-preview-artifact',
      label: 'Preview artifact dist/index.html exists',
      category: 'static-artifact',
      passed: false,
      detail: previewArtifactPath ?? 'missing preview artifact path',
      critical: true,
    });
    return { checks, completed: true };
  }

  const html = readFileSync(previewArtifactPath, 'utf8');
  const hasRoot = html.includes('id="root"') || html.includes("id='root'");
  const hasScript = /<script[^>]+type=["']module["']/i.test(html) || /<script/i.test(html);

  recordCheck(checks, {
    id: 'static-preview-artifact',
    label: 'Preview artifact dist/index.html exists',
    category: 'static-artifact',
    passed: true,
    detail: previewArtifactPath.replace(/\\/g, '/'),
    critical: true,
  });
  recordCheck(checks, {
    id: 'static-root-mount',
    label: 'Static artifact contains #root mount point',
    category: 'static-artifact',
    passed: hasRoot,
    detail: hasRoot ? '#root present in dist/index.html' : 'no #root mount in dist/index.html',
    critical: true,
  });
  recordCheck(checks, {
    id: 'static-script-bundle',
    label: 'Static artifact references bundled script',
    category: 'static-artifact',
    passed: hasScript,
    detail: hasScript ? 'script tag present in dist/index.html' : 'no script tag in dist/index.html',
    critical: false,
  });

  return { checks, completed: true };
}

async function navigateToCoreFeature(
  page: {
    waitForSelector(selector: string, options?: { timeout?: number; state?: 'visible' | 'attached' }): Promise<unknown>;
    waitForTimeout?(ms: number): Promise<void>;
    click(selector: string): Promise<void>;
    locator(selector: string): { click(): Promise<void> };
  },
  scenario: MultiDomainScenarioDefinition,
): Promise<void> {
  const entityInput = `[data-testid="${scenario.entitySlug}-input"]`;
  await page.waitForSelector(
    `[data-blueprint="welcome-screen"], [data-blueprint="launch-screen"], ${entityInput}`,
    { timeout: 15_000, state: 'visible' },
  );

  const entityReady = await page
    .waitForSelector(entityInput, { timeout: 1500, state: 'visible' })
    .then(() => true)
    .catch(() => false);
  if (entityReady) return;

  const welcomeReady = await page
    .waitForSelector('[data-blueprint="welcome-screen"]', { timeout: 5000, state: 'visible' })
    .then(() => true)
    .catch(async () => {
      await page.waitForSelector('[data-blueprint="welcome-screen"]', { timeout: 5000, state: 'visible' });
      return true;
    });

  if (welcomeReady) {
    await page.click('[data-blueprint="welcome-screen"] .blueprint-btn-primary');
  }

  await page.waitForSelector('[data-blueprint="auth-guest"]', { timeout: 8000, state: 'visible' });
  await page.click('[data-blueprint="auth-guest"]');

  await page.waitForSelector('[data-blueprint="onboarding"]', { timeout: 8000, state: 'visible' });
  await page.locator('button:has-text("Skip")').click();

  await page.waitForSelector('[data-blueprint="app-shell"]', { timeout: 10_000, state: 'visible' });

  try {
    await page.locator(`[data-blueprint="nav-item"]:has-text("${scenario.navLabel}")`).click();
  } catch {
    await page.locator(`.blueprint-sidenav >> text=${scenario.navLabel}`).click();
  }

  await page.waitForSelector(entityInput, { timeout: 10_000, state: 'visible' });
}

async function runBoundedPlaywrightChecks(input: {
  previewUrl: string;
  checks: VisualRuntimeCheck[];
  viewportEvidence: string[];
  scenario: MultiDomainScenarioDefinition;
}): Promise<void> {
  const playwright = await import('playwright');
  const browser = await playwright.chromium.launch({ headless: true });
  const { scenario } = input;
  const slug = scenario.entitySlug;

  try {
    const page = await browser.newPage();
    await page.goto(input.previewUrl, { waitUntil: 'domcontentloaded' });
    await navigateToCoreFeature(page, scenario);

    const entityInputVisible = await page.locator(`[data-testid="${slug}-input"]`).isVisible();
    recordCheck(input.checks, {
      id: 'runtime-entity-input',
      label: `${scenario.entityLabel} input is present in rendered UI`,
      category: 'runtime-ui',
      passed: entityInputVisible,
      detail: entityInputVisible ? `${slug}-input visible` : `${slug}-input not visible`,
      critical: true,
    });

    const addButtonVisible = await page.locator(`[data-testid="add-${slug}-button"]`).isVisible();
    recordCheck(input.checks, {
      id: 'runtime-add-action',
      label: `Add ${scenario.entityLabel} action is visible`,
      category: 'runtime-ui',
      passed: addButtonVisible,
      detail: addButtonVisible ? `add-${slug}-button visible` : `add-${slug}-button not visible`,
      critical: true,
    });

    if (scenario.hasSearch) {
      const searchVisible = await page.locator(`[data-testid="search-${slug}-input"]`).isVisible();
      recordCheck(input.checks, {
        id: 'runtime-search-input',
        label: `Search ${scenario.entityLabel} input is visible`,
        category: 'runtime-ui',
        passed: searchVisible,
        detail: searchVisible ? `search-${slug}-input visible` : `search-${slug}-input not visible`,
        critical: false,
      });
    }

    if (scenario.runtimeFilterMode === 'task-filters') {
      const filterActive = await page.locator('[data-testid="filter-active"]').isVisible();
      const filterCompleted = await page.locator('[data-testid="filter-completed"]').isVisible();
      const filtersPresent = filterActive && filterCompleted;
      recordCheck(input.checks, {
        id: 'runtime-filter-controls',
        label: 'Filter controls exist (active/completed)',
        category: 'runtime-ui',
        passed: filtersPresent,
        detail: filtersPresent
          ? 'filter-active, filter-completed visible'
          : `filters: active=${filterActive} completed=${filterCompleted}`,
        critical: true,
      });
    } else if (scenario.runtimeFilterMode === 'search-only') {
      recordCheck(input.checks, {
        id: 'runtime-filter-controls',
        label: 'Search/filter surface for domain records',
        category: 'runtime-ui',
        passed: scenario.hasSearch
          ? await page.locator(`[data-testid="search-${slug}-input"]`).isVisible()
          : true,
        detail: scenario.hasSearch
          ? `search-${slug}-input visible (search-based domain; task filters not required)`
          : 'search-only mode without search input configured',
        critical: true,
      });
    }

    const countText = ((await page.locator(`[data-testid="${slug}-count"]`).textContent()) ?? '').trim();
    const countPresent = countText.length > 0;
    recordCheck(input.checks, {
      id: 'runtime-entity-count',
      label: `${scenario.entityLabel} count element exists`,
      category: 'runtime-ui',
      passed: countPresent,
      detail: countPresent ? `${slug}-count=${countText}` : `${slug}-count missing`,
      critical: true,
    });

    recordCheck(input.checks, {
      id: 'runtime-preview-loads',
      label: 'Preview artifact loads in browser runtime',
      category: 'runtime-ui',
      passed: entityInputVisible && addButtonVisible,
      detail: `loaded ${input.previewUrl}`,
      critical: true,
    });

    for (const viewport of [VIEWPORTS.mobile, VIEWPORTS.desktop] as const) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(300);
      const inputVisible = await page.locator(`[data-testid="${slug}-input"]`).isVisible();
      const addVisible = await page.locator(`[data-testid="add-${slug}-button"]`).isVisible();
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth + 2;
      });
      const passed = inputVisible && addVisible && !overflow;
      input.viewportEvidence.push(
        `${viewport.label}: inputVisible=${inputVisible}, addVisible=${addVisible}, horizontalOverflow=${overflow}`,
      );
      recordCheck(input.checks, {
        id: `viewport-${viewport.label}`,
        label: `${viewport.label} viewport check`,
        category: 'viewport',
        passed,
        detail: passed
          ? `${viewport.width}x${viewport.height} — core controls visible, no horizontal overflow`
          : `${viewport.width}x${viewport.height} — input=${inputVisible} add=${addVisible} overflow=${overflow}`,
        critical: viewport.label === 'mobile',
      });
    }
  } finally {
    await browser.close();
  }
}

export async function runDomainBoundedVisualRuntimeVerification(input: {
  scenario: MultiDomainScenarioDefinition;
  workspacePath: string | null;
  previewArtifactPath: string | null;
  projectRootDir: string;
}): Promise<VisualRuntimeEvidence> {
  const checks: VisualRuntimeCheck[] = [];
  const viewportEvidence: string[] = [];

  const staticResult = inspectStaticArtifact(input.previewArtifactPath);
  checks.push(...staticResult.checks);

  const playwrightProbe = await probePlaywrightAvailable(input.projectRootDir);
  let previewUrl: string | null = null;
  let devServerOk = false;

  if (!playwrightProbe.supported) {
    recordCheck(checks, {
      id: 'playwright-runtime-unsupported',
      label: 'Playwright bounded runtime checks',
      category: 'runtime-ui',
      passed: false,
      detail: playwrightProbe.reason ?? 'Playwright unavailable',
      critical: false,
    });
  } else if (!input.workspacePath) {
    recordCheck(checks, {
      id: 'playwright-runtime-unsupported',
      label: 'Playwright bounded runtime checks',
      category: 'runtime-ui',
      passed: false,
      detail: 'No workspace path — runtime checks skipped',
      critical: false,
    });
  } else {
    await resetGeneratedDevServerManagerForTests();
    const workspaceId = basename(input.workspacePath);
    const devServer = await startGeneratedAppDevServer({
      workspaceDir: input.workspacePath,
      workspaceId,
      timeoutMs: 45_000,
    });
    devServerOk = devServer.ok && Boolean(devServer.url);
    previewUrl = devServer.url ?? null;

    if (!devServerOk || !previewUrl) {
      recordCheck(checks, {
        id: 'playwright-runtime-unsupported',
        label: 'Playwright bounded runtime checks',
        category: 'runtime-ui',
        passed: false,
        detail: devServer.error ?? 'Dev server failed to start for runtime verification',
        critical: false,
      });
    } else {
      try {
        await runBoundedPlaywrightChecks({
          previewUrl,
          checks,
          viewportEvidence,
          scenario: input.scenario,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        recordCheck(checks, {
          id: 'playwright-runtime-error',
          label: 'Playwright bounded runtime checks',
          category: 'runtime-ui',
          passed: false,
          detail: message,
          critical: false,
        });
      } finally {
        await stopAllGeneratedDevServers();
      }
    }
  }

  const runtimeChecks = checks.filter((c) => c.category === 'runtime-ui' || c.category === 'viewport');
  const playwrightSupported =
    playwrightProbe.supported &&
    devServerOk &&
    runtimeChecks.some((c) => c.id.startsWith('runtime-') || c.id.startsWith('viewport-'));
  const boundedRuntimePassed =
    staticResult.completed &&
    checks.filter((c) => c.critical).every((c) => c.passed) &&
    (playwrightSupported
      ? runtimeChecks.filter((c) => c.critical).every((c) => c.passed)
      : false);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    workspacePath: input.workspacePath,
    previewArtifactPath: input.previewArtifactPath,
    previewUrl,
    staticArtifactInspectionCompleted: staticResult.completed,
    playwrightSupported,
    playwrightUnsupportedReason: playwrightSupported ? null : playwrightProbe.reason ?? 'Runtime checks not executed',
    devServerOk,
    checks,
    viewportEvidence,
    passedCount: checks.filter((c) => c.passed).length,
    totalCount: checks.length,
    boundedRuntimePassed,
  };
}
