/**
 * Phase 24.9.4 — Running Application Visibility validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  RUNNING_APPLICATION_VISIBILITY_PASS_TOKEN,
  assessRunningApplicationVisibility,
  type RunningApplicationVisibilityInput,
} from '../src/running-application-visibility/index.js';
import {
  runFounderTestingModeV3,
  runFounderTestingModeV4,
} from '../src/founder-testing-mode/index.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';
import {
  createPreviewSession,
  resetPreviewSessionManagerForTests,
  resetPreviewTargetRegistryForTests,
} from '../src/live-preview-runtime/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const textCache = new Map<string, string>();

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  const cached = textCache.get(relativePath);
  if (cached) return cached;
  const content = readFileSync(join(ROOT, relativePath), 'utf8');
  textCache.set(relativePath, content);
  return content;
}

function guardRuntime(group: string): void {
  const elapsed = Date.now() - START;
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Timeout in ${group} after ${elapsed}ms`);
  }
}

function baseInput(overrides: Partial<RunningApplicationVisibilityInput> = {}): RunningApplicationVisibilityInput {
  return {
    generatedAt: Date.now(),
    previewRealityState: 'NO_PREVIEW',
    previewReality: {
      validationReady: false,
      freshness: { passed: false, reason: 'No preview' },
      interactivity: { passed: false, reason: 'No preview' },
      loadReality: { passed: false, reason: 'No preview' },
      problems: [],
    },
    activeSession: null,
    previewUrl: null,
    buildStatus: 'No build output reported yet',
    latestProjectId: 'proj-latest',
    projectCount: 1,
    projectName: 'CRM Dashboard',
    recentChangeSummary: null,
    targetType: null,
    ...overrides,
  };
}

function readyPreviewReality(projectId: string) {
  return {
    previewRealityState: 'PREVIEW_READY' as const,
    previewReality: {
      validationReady: true,
      freshness: { passed: projectId === 'proj-latest', reason: 'freshness' },
      interactivity: { passed: true, reason: 'interactive' },
      loadReality: { passed: true, reason: 'loaded' },
      problems: [] as string[],
    },
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Running Application Visibility — Validation');
  console.log('==========================================');
  console.log('');

  const appJs = readText('public/founder-reality/app.js');
  const styles = readText('public/founder-reality/styles.css');
  const authority = readText('src/running-application-visibility/running-application-visibility-authority.ts');
  const responses = readText('src/command-center-brain/running-application-responses.ts');
  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/running-application-visibility/running-application-visibility-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/running-application-visibility/running-application-visibility-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:running-application-visibility']), 'package');
  assert('04. seven output states', authority.includes('NO_RUNNING_APP') && authority.includes('OUTPUT_READY_FOR_TESTING'), 'states');
  assert('05. alignment states', authority.includes('PARTIALLY_ALIGNED') && authority.includes('STALE'), 'alignment');
  assert('06. test readiness states', authority.includes('TESTABLE_WITH_WARNINGS') && authority.includes('STALE_TEST_TARGET'), 'test');
  assert('07. running app UI panel', appJs.includes('running-application-visibility') && appJs.includes('Running Application'), 'ui');
  assert('08. build output UI', appJs.includes('Build Output') && appJs.includes('Change summary'), 'build ui');
  assert('09. alignment testing UI', appJs.includes('Request alignment') && appJs.includes('Testing status'), 'alignment ui');
  assert('10. running app feed', appJs.includes('streamRunningApplicationFeed'), 'feed');
  assert('11. founder evaluation', engine.includes('evaluateRunningAppVisibility'), 'founder');
  assert('12. command center responses', responses.includes('resolveRunningApplicationResponse'), 'brain');
  assert('13. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs + responses), 'safety');
  assert('14. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch safety');
  guardRuntime('static');

  const noApp = assessRunningApplicationVisibility(baseInput());
  assert('15. NO_RUNNING_APP', noApp.outputState === 'NO_RUNNING_APP', noApp.outputState);
  assert('16. NO_RUNNING_APP honest testability', noApp.testReadiness === 'NOT_TESTABLE', noApp.testReadiness);

  const starting = assessRunningApplicationVisibility(
    baseInput({
      previewRealityState: 'PREVIEW_STARTING',
      previewReality: {
        validationReady: false,
        freshness: { passed: false, reason: 'starting' },
        interactivity: { passed: false, reason: 'starting' },
        loadReality: { passed: false, reason: 'starting' },
        problems: [],
      },
      activeSession: {
        previewSessionId: 'sess-1',
        projectId: 'proj-latest',
        previewState: 'REGISTERED',
        previewUrl: null,
        previewTargetName: 'CRM Dashboard Preview',
        createdAt: Date.now(),
        warnings: [],
        blockedReasons: [],
      },
    }),
  );
  assert('17. OUTPUT_STARTING', starting.outputState === 'OUTPUT_STARTING', starting.outputState);
  assert('18. starting identifiable', starting.identifiable, String(starting.identifiable));

  const stale = assessRunningApplicationVisibility(
    baseInput({
      ...readyPreviewReality('proj-old'),
      activeSession: {
        previewSessionId: 'sess-stale',
        projectId: 'proj-old',
        previewState: 'PREVIEW_READY',
        previewUrl: 'http://127.0.0.1:4173/preview',
        previewTargetName: 'CRM Dashboard Preview',
        createdAt: Date.now() - 60_000,
        warnings: [],
        blockedReasons: [],
      },
      previewUrl: 'http://127.0.0.1:4173/preview',
      previewRealityState: 'PREVIEW_STALE',
      previewReality: {
        validationReady: false,
        freshness: { passed: false, reason: 'stale project' },
        interactivity: { passed: true, reason: 'interactive' },
        loadReality: { passed: true, reason: 'loaded' },
        problems: ['Preview does not reflect latest project changes.'],
      },
    }),
  );
  assert('19. OUTPUT_STALE detected', stale.outputState === 'OUTPUT_STALE', stale.outputState);
  assert('20. stale alignment', stale.requestAlignment === 'STALE', stale.requestAlignment);
  assert('21. stale test target', stale.testReadiness === 'STALE_TEST_TARGET', stale.testReadiness);

  const degraded = assessRunningApplicationVisibility(
    baseInput({
      previewRealityState: 'PREVIEW_DEGRADED',
      previewReality: {
        validationReady: false,
        freshness: { passed: true, reason: 'aligned enough' },
        interactivity: { passed: false, reason: 'interaction failed' },
        loadReality: { passed: true, reason: 'loaded' },
        problems: ['Preview loaded but interaction failed.'],
      },
      activeSession: {
        previewSessionId: 'sess-degraded',
        projectId: 'proj-latest',
        previewState: 'PREVIEW_BLOCKED',
        previewUrl: 'http://127.0.0.1:4173/preview',
        previewTargetName: 'CRM Dashboard Preview',
        createdAt: Date.now(),
        warnings: ['Interaction probe failed'],
        blockedReasons: ['Interaction probe failed'],
      },
      previewUrl: 'http://127.0.0.1:4173/preview',
      buildStatus: 'Last preview state: PREVIEW_BLOCKED',
    }),
  );
  assert('22. OUTPUT_DEGRADED detected', degraded.outputState === 'OUTPUT_DEGRADED', degraded.outputState);
  assert('23. degraded warnings', degraded.degradedDetected, String(degraded.degradedDetected));

  const ready = assessRunningApplicationVisibility(
    baseInput({
      ...readyPreviewReality('proj-latest'),
      activeSession: {
        previewSessionId: 'sess-ready',
        projectId: 'proj-latest',
        previewState: 'PREVIEW_READY',
        previewUrl: 'http://127.0.0.1:4173/preview',
        previewTargetName: 'CRM Dashboard Preview',
        createdAt: Date.now(),
        warnings: [],
        blockedReasons: [],
      },
      previewUrl: 'http://127.0.0.1:4173/preview',
      buildStatus: 'Last preview state: PREVIEW_READY',
      recentChangeSummary: 'Navigation and project intelligence surfaces updated',
      targetType: 'WEB_APP',
    }),
  );
  assert('24. OUTPUT_READY_FOR_TESTING', ready.outputState === 'OUTPUT_READY_FOR_TESTING', ready.outputState);
  assert('25. ready for testing', ready.readyForTesting && ready.testReadiness === 'TESTABLE', ready.testReadiness);
  assert('26. aligned request', ready.requestAlignment === 'ALIGNED', ready.requestAlignment);
  guardRuntime('authority');

  resetPreviewSessionManagerForTests();
  resetPreviewTargetRegistryForTests();
  createPreviewSession({
    projectId: 'proj-latest',
    workspaceId: 'ws-1',
    targetName: 'CRM Dashboard Preview',
    targetType: 'WEB_APP',
    previewUrl: 'http://127.0.0.1:4173/preview',
    previewState: 'PREVIEW_READY',
  });
  const snapshot = buildProductWorkspaceSnapshot(Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')));
  assert('27. snapshot runningApplication', Boolean(snapshot.runningApplication?.outputState), snapshot.runningApplication?.outputState ?? 'missing');
  guardRuntime('snapshot');

  const whatRunning = processBrainRequest({ message: 'What is running?' });
  const canTest = processBrainRequest({ message: 'Can I test this?' });
  const latestBuild = processBrainRequest({ message: 'Is this the latest build?' });
  assert('28. brain what is running', /running application|output state|no running application/i.test(whatRunning.brainResponse ?? ''), (whatRunning.brainResponse ?? '').slice(0, 90));
  assert('29. brain can test', /test|not yet|ready|caution/i.test(canTest.brainResponse ?? ''), (canTest.brainResponse ?? '').slice(0, 90));
  assert('30. brain latest build', /aligned|stale|unknown|partially/i.test(latestBuild.brainResponse ?? ''), (latestBuild.brainResponse ?? '').slice(0, 90));
  assert('31. brain no architecture leak', !/devpulse_v2|ownership registry/i.test((whatRunning.brainResponse ?? '') + (canTest.brainResponse ?? '')), 'leak');
  guardRuntime('brain');

  const reportPath = join(ROOT, 'architecture', 'RUNNING_APPLICATION_VISIBILITY_REPORT.md');
  assert('32. report exists', existsSync(reportPath), reportPath);

  const v3 = runFounderTestingModeV3({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });
  const v4 = runFounderTestingModeV4({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });
  assert('33. V4 running app section', Boolean(v4.runningAppVisibility?.outputState), v4.runningAppVisibility.outputState);
  assert('34. V4 running app checks', v4.runningAppVisibility.identifiablePass !== undefined, 'checks');
  assert('35. V4 report markdown section', v4.reportMarkdown.includes('Running Application Visibility'), 'md');
  assert('36. V3 live preview patience', v3.patienceAssessments.some((p) => p.screen === 'Live Preview' && p.hasExplanation), 'v3');
  guardRuntime('founder');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const elapsed = Date.now() - START;

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`V4 running app: ${v4.runningAppVisibility.outputState} | score: ${v4.runningAppVisibility.score}`);
  console.log('');

  if (failed.length) {
    console.log('RUNNING_APPLICATION_VISIBILITY_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(RUNNING_APPLICATION_VISIBILITY_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
