/**
 * Founder Testing Mode V1 — read-only orchestrator.
 * Aggregates static shell checks, workspace snapshot, and bounded brain prompts.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { buildPortfolioInsightsDemo } from '../../server/portfolio-demo-data.js';
import { buildProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';
import {
  FOUNDER_TEST_MAX_SCREENS,
  FOUNDER_TEST_MAX_TOTAL_MS,
} from './founder-testing-bounds.js';
import { runBoundedPromptChecks } from './founder-testing-prompt-checker.js';
import { assembleFounderTestReport } from './founder-testing-report-builder.js';
import {
  buildRecommendedFixOrder,
  computeScores,
  deriveVerdict,
} from './founder-testing-scorer.js';
import {
  checkAllScreensStatic,
  checkNavigation,
  checkVisualUx,
  checkWorkflowContinuity,
  screenIssuesFromResults,
  type ScreenCheckSources,
} from './founder-testing-screen-checker.js';
import type { FounderTestIssue, FounderTestReport, LiveScreenResultInput } from './founder-testing-types.js';

export interface RunFounderTestingModeInput {
  rootDir?: string;
  validatorScripts?: string[];
  liveResults?: LiveScreenResultInput[];
  liveSection?: string;
}

function loadShellSources(rootDir: string): ScreenCheckSources {
  const publicDir = join(rootDir, 'public', 'founder-reality');
  return {
    html: readFileSync(join(publicDir, 'index.html'), 'utf8'),
    appJs: readFileSync(join(publicDir, 'app.js'), 'utf8'),
    css: readFileSync(join(publicDir, 'styles.css'), 'utf8'),
  };
}

function checkWorkspaceSnapshot(validatorScripts: string[]): { issues: FounderTestIssue[]; passed: string[] } {
  const issues: FounderTestIssue[] = [];
  const passed: string[] = [];

  try {
    const snapshot = buildProductWorkspaceSnapshot(validatorScripts);
    passed.push('Product workspace snapshot builds successfully');

    if (snapshot.productBrand === 'AiDevEngine') {
      passed.push('Workspace snapshot uses AiDevEngine branding');
    }

    const portfolio = snapshot.portfolioInsights ?? buildPortfolioInsightsDemo();
    const projects = portfolio.projects ?? [];
    if (projects.length >= 3) {
      passed.push(`Portfolio has ${projects.length} demo projects`);
    } else {
      issues.push({
        severity: 'HIGH',
        screen: 'Project Insights',
        problem: `Expected 3 demo projects, found ${projects.length}`,
        userImpact: 'Portfolio view looks empty or incomplete during founder testing.',
        likelyCause: 'portfolioInsights missing or demo data not merged.',
        recommendedFix: 'Ensure buildPortfolioInsightsDemo returns 3 isDemo projects.',
        copyPasteFixPrompt:
          'Fix Project Insights portfolio: ensure 3 DEMO projects render with isDemo markers.',
      });
    }

    const demoMarked = projects.filter((p) => p.isDemo || p.label === 'DEMO').length;
    if (demoMarked >= 3) {
      passed.push('All demo projects marked DEMO');
    } else {
      issues.push({
        severity: 'MEDIUM',
        screen: 'Project Insights',
        problem: 'Not all portfolio projects marked DEMO',
        userImpact: 'Founder may confuse demo data with real projects.',
        likelyCause: 'Missing isDemo or label field on demo projects.',
        recommendedFix: 'Add isDemo: true and label: DEMO to all demo portfolio entries.',
      });
    }

    if (snapshot.verification?.readinessLabel) {
      passed.push('Verification readiness label present in workspace');
    }

    if (!snapshot.livePreview?.previewUrl) {
      passed.push('Live Preview honest idle state in workspace (no fake URL)');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'snapshot failed';
    issues.push({
      severity: 'HIGH',
      screen: 'Product Workspace',
      problem: `Workspace snapshot failed: ${message}`,
      userImpact: 'Product surfaces may show stale or missing data.',
      likelyCause: 'Snapshot builder exception.',
      recommendedFix: 'Fix buildProductWorkspaceSnapshot error handling.',
    });
  }

  return { issues, passed };
}

function mergeLiveResults(
  liveResults: LiveScreenResultInput[] | undefined,
): { issues: FounderTestIssue[]; passed: string[]; livePassed: number; liveTotal: number } {
  const issues: FounderTestIssue[] = [];
  const passed: string[] = [];
  if (!liveResults?.length) {
    return { issues, passed, livePassed: 0, liveTotal: 0 };
  }

  let livePassed = 0;
  for (const live of liveResults) {
    if (live.passed) {
      livePassed += 1;
      passed.push(`Live check: ${live.screen} opened with useful content`);
    } else {
      for (const check of live.checks.filter((c) => !c.passed)) {
        issues.push({
          severity: check.name.includes('loading') ? 'BLOCKER' : 'HIGH',
          screen: live.screen,
          problem: check.detail,
          userImpact: 'Founder sees broken or stuck screen during live usage.',
          likelyCause: 'DOM state or render path failed in browser.',
          recommendedFix: `Fix live ${live.screen}: ${check.name}.`,
          copyPasteFixPrompt: `Fix AiDevEngine ${live.screen} live check: ${check.detail}`,
        });
      }
    }
  }

  return { issues, passed, livePassed, liveTotal: liveResults.length };
}

export function runFounderTestingMode(input: RunFounderTestingModeInput = {}): FounderTestReport {
  const start = Date.now();
  const rootDir = input.rootDir ?? join(process.cwd());
  const deadline = start + FOUNDER_TEST_MAX_TOTAL_MS;
  const sources = loadShellSources(rootDir);

  const nav = checkNavigation(sources.html);
  const screenResults = checkAllScreensStatic(sources).slice(0, FOUNDER_TEST_MAX_SCREENS);
  const workflowResults = checkWorkflowContinuity(sources);
  const visualFindings = checkVisualUx(sources);

  const promptBudget = Math.max(0, deadline - Date.now());
  const promptResults = runBoundedPromptChecks(promptBudget);

  const validatorScripts = input.validatorScripts ?? [];
  const workspace = checkWorkspaceSnapshot(validatorScripts);
  const live = mergeLiveResults(input.liveResults);

  const screenIssues = screenIssuesFromResults(screenResults);
  const promptIssues: FounderTestIssue[] = promptResults
    .filter((p) => !p.passed)
    .map((p) => ({
      severity: 'MEDIUM' as const,
      screen: 'Command Center',
      problem: `Prompt "${p.prompt}" failed: ${p.issues.join('; ') || 'checks failed'}`,
      userImpact: 'Founder may get unclear or unhelpful Command Center answers.',
      likelyCause: 'Brain response quality or routing below product bar.',
      recommendedFix: 'Improve brain response for founder-facing prompts.',
      copyPasteFixPrompt: `Improve AiDevEngine Command Center response for: "${p.prompt}"`,
    }));

  const workflowIssues: FounderTestIssue[] = workflowResults
    .filter((w) => !w.passed)
    .map((w) => ({
      severity: 'MEDIUM' as const,
      screen: 'Workflow',
      problem: w.detail,
      userImpact: 'Founder workflow may feel disconnected.',
      likelyCause: 'Missing navigation or state wiring between surfaces.',
      recommendedFix: `Fix workflow: ${w.name}.`,
    }));

  const allIssues = [
    ...nav.issues,
    ...screenIssues,
    ...promptIssues,
    ...workflowIssues,
    ...workspace.issues,
    ...live.issues,
  ];

  const passed: string[] = [
    ...nav.checks.filter((c) => c.passed).map((c) => `Navigation: ${c.name}`),
    ...screenResults.filter((s) => s.passed).map((s) => `Screen: ${s.screen} static checks passed`),
    ...promptResults.filter((p) => p.passed).map((p) => `Prompt: "${p.prompt}" passed`),
    ...workflowResults.filter((w) => w.passed).map((w) => `Workflow: ${w.name}`),
    ...workspace.passed,
    ...live.passed,
  ];

  const scores = computeScores({
    screenResults,
    promptResults,
    workflowResults,
    visualFindings,
    issues: allIssues,
    liveChecksPassed: live.livePassed,
    liveChecksTotal: live.liveTotal,
  });

  const verdict = deriveVerdict(scores, allIssues);
  const recommendedFixOrder = buildRecommendedFixOrder(allIssues);

  return assembleFounderTestReport({
    reportId: randomUUID(),
    generatedAt: Date.now(),
    durationMs: Date.now() - start,
    readOnly: true,
    mode: 'founder-testing-v1',
    scores,
    verdict,
    issues: allIssues,
    passed,
    screenResults,
    promptResults,
    workflowResults,
    visualFindings,
    recommendedFixOrder,
    liveSection: input.liveSection,
  });
}
