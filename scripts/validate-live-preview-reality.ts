/**
 * Phase 24.9.3 — Live Preview Reality validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LIVE_PREVIEW_REALITY_PASS_TOKEN,
  assessLivePreviewReality,
  type LivePreviewRealityInput,
} from '../src/live-preview-reality/index.js';
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

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function baseInput(overrides: Partial<LivePreviewRealityInput> = {}): LivePreviewRealityInput {
  return {
    uiSurfacePresent: true,
    connected: false,
    previewUrl: null,
    activeSession: null,
    sessions: [],
    diagnostics: {
      previewRuntimeActive: false,
      previewSessionCount: 0,
      registeredTargetCount: 0,
      readyPreviewCount: 0,
      blockedPreviewCount: 0,
    },
    latestProjectId: 'proj-latest',
    projectCount: 1,
    generatedAt: Date.now(),
    ...overrides,
  };
}

function readySession(projectId: string) {
  return {
    previewSessionId: 'pvsess-ready',
    projectId,
    previewState: 'PREVIEW_READY',
    previewUrl: 'http://127.0.0.1:4173/preview',
    previewCapabilities: ['LIVE_VIEW', 'INTERACTION_TESTING', 'VISUAL_VERIFICATION'],
    warnings: [] as string[],
    blockedReasons: [] as string[],
    createdAt: Date.now(),
    previewTargetName: 'web-app',
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Live Preview Reality — Validation');
  console.log('=================================');
  console.log('');

  const appJs = readText('public/founder-reality/app.js');
  const styles = readText('public/founder-reality/styles.css');
  const authority = readText('src/live-preview-reality/live-preview-reality-authority.ts');
  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/live-preview-reality/live-preview-reality-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/live-preview-reality/live-preview-reality-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:live-preview-reality']), 'package');
  assert('04. eight explicit states', authority.includes('NO_PREVIEW') && authority.includes('PREVIEW_READY'), 'states');
  assert('05. reality UI surface', appJs.includes('live-preview-reality') && appJs.includes('Live Preview Status'), 'ui');
  assert('06. reality summary UI', appJs.includes('live-preview-reality-summary') && appJs.includes('Reality summary'), 'summary');
  assert('07. recommended actions UI', appJs.includes('live-preview-reality-actions') && appJs.includes('Recommended action'), 'actions');
  assert('08. preview feed stream', appJs.includes('streamPreviewRealityFeed'), 'feed');
  assert('09. iframe load listeners', appJs.includes('previewClientReality') && appJs.includes('attachPreviewIframeListeners'), 'iframe');
  assert('10. founder preview checks', engine.includes('existsPass') && engine.includes('validationReadyPass'), 'founder checks');
  assert('11. warn pill style', styles.includes('.status-pill.warn'), 'warn style');

  const noPreview = assessLivePreviewReality(baseInput());
  assert('12. NO_PREVIEW state', noPreview.state === 'NO_PREVIEW', noPreview.state);
  assert('13. NO_PREVIEW not validation ready', !noPreview.validationReady, String(noPreview.validationReady));

  const falsePositive = assessLivePreviewReality(
    baseInput({
      connected: true,
      sessions: [
        {
          previewSessionId: 'pvsess-0001',
          projectId: 'proj-a',
          previewState: 'REGISTERED',
          previewUrl: null,
        },
      ],
      diagnostics: {
        previewRuntimeActive: true,
        previewSessionCount: 1,
        registeredTargetCount: 1,
        readyPreviewCount: 0,
        blockedPreviewCount: 0,
      },
    }),
  );
  assert('14. false-positive detected', falsePositive.falsePositiveReadiness, falsePositive.state);
  assert('15. starting not validation ready', !falsePositive.validationReady && falsePositive.state === 'PREVIEW_STARTING', falsePositive.state);

  const loading = assessLivePreviewReality(
    baseInput({
      connected: true,
      previewUrl: 'http://127.0.0.1:4173/preview',
      activeSession: {
        previewSessionId: 'pvsess-load',
        projectId: 'proj-latest',
        previewState: 'WAITING_FOR_RUNTIME',
        previewUrl: 'http://127.0.0.1:4173/preview',
        previewCapabilities: ['LIVE_VIEW'],
      },
      sessions: [],
      diagnostics: {
        previewRuntimeActive: true,
        previewSessionCount: 1,
        registeredTargetCount: 1,
        readyPreviewCount: 0,
        blockedPreviewCount: 0,
      },
    }),
  );
  assert('16. PREVIEW_LOADING state', loading.state === 'PREVIEW_LOADING', loading.state);
  assert('17. loading not interactive', !loading.interactivity.passed, loading.interactivity.reason);

  const stale = assessLivePreviewReality(
    baseInput({
      connected: true,
      previewUrl: 'http://127.0.0.1:4173/preview',
      activeSession: readySession('proj-old'),
      sessions: [readySession('proj-old')],
      diagnostics: {
        previewRuntimeActive: true,
        previewSessionCount: 1,
        registeredTargetCount: 1,
        readyPreviewCount: 1,
        blockedPreviewCount: 0,
      },
    }),
  );
  assert('18. PREVIEW_STALE state', stale.state === 'PREVIEW_STALE', stale.state);
  assert('19. stale freshness fail', !stale.freshness.passed, stale.freshness.reason);

  const degraded = assessLivePreviewReality(
    baseInput({
      connected: true,
      previewUrl: 'http://127.0.0.1:4173/preview',
      activeSession: {
        ...readySession('proj-latest'),
        previewState: 'PREVIEW_BLOCKED',
        blockedReasons: ['Interaction probe failed'],
      },
      diagnostics: {
        previewRuntimeActive: true,
        previewSessionCount: 1,
        registeredTargetCount: 1,
        readyPreviewCount: 0,
        blockedPreviewCount: 1,
      },
    }),
  );
  assert('20. PREVIEW_DEGRADED state', degraded.state === 'PREVIEW_DEGRADED', degraded.state);
  assert('21. degraded not validation ready', !degraded.validationReady, String(degraded.validationReady));

  const ready = assessLivePreviewReality(
    baseInput({
      connected: true,
      previewUrl: 'http://127.0.0.1:4173/preview',
      activeSession: readySession('proj-latest'),
      sessions: [readySession('proj-latest')],
      diagnostics: {
        previewRuntimeActive: true,
        previewSessionCount: 1,
        registeredTargetCount: 1,
        readyPreviewCount: 1,
        blockedPreviewCount: 0,
      },
    }),
  );
  assert('22. PREVIEW_READY state', ready.state === 'PREVIEW_READY', ready.state);
  assert('23. ready validation dimensions', ready.validationReady && ready.interactivity.passed && ready.loadReality.passed, ready.state);
  assert('24. ready operator feed terminal event', ready.operatorFeedEvents.some((e) => e.action === 'Preview ready for validation'), 'feed');

  resetPreviewSessionManagerForTests();
  resetPreviewTargetRegistryForTests();
  createPreviewSession({
    projectId: 'proj-latest',
    workspaceId: 'ws-1',
    targetName: 'Founder App',
    targetType: 'WEB_APP',
    previewUrl: 'http://127.0.0.1:4173/preview',
    previewState: 'PREVIEW_READY',
  });
  const snapshot = buildProductWorkspaceSnapshot(Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')));
  assert('25. snapshot embeds reality', Boolean(snapshot.livePreview.reality?.state), snapshot.livePreview.reality?.state ?? 'missing');
  assert('26. snapshot honest status label', snapshot.livePreview.statusLabel === snapshot.livePreview.reality.displayLabel, snapshot.livePreview.statusLabel);

  const reportPath = join(ROOT, 'architecture', 'LIVE_PREVIEW_REALITY_REPORT.md');
  assert('27. reality report exists', existsSync(reportPath), reportPath);

  const v3 = runFounderTestingModeV3({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });
  const v4 = runFounderTestingModeV4({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });

  assert('28. V4 preview reality state present', Boolean(v4.previewReality.state), v4.previewReality.state);
  assert('29. V4 preview five checks wired', v4.previewReality.existsPass !== undefined && v4.previewReality.validationReadyPass !== undefined, 'checks');
  assert('30. V3 patience live preview uplift', v3.patienceAssessments.some((p) => p.screen === 'Live Preview' && p.hasExplanation), 'patience');
  assert(
    '31. no optimistic preview-only pass',
    !v4.previewReality.validationReadyPass || v4.previewReality.loadsPass,
    'honest pass coupling',
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`V4 preview state: ${v4.previewReality.state} | score: ${v4.previewReality.score}`);
  console.log('');

  if (failed.length) {
    console.log('LIVE_PREVIEW_REALITY_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(LIVE_PREVIEW_REALITY_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
