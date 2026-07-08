/**
 * Runtime Banner Truth Reconciliation V1 — validation entry script.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMMAND_CENTER_RUNTIME_TRUTH_READY_TRACE,
  RUNTIME_BANNER_TRUTH_RECONCILIATION_V1_PASS_TOKEN,
  RuntimeBannerTruthReconciliationHarness,
  STALE_RUNTIME_SESSION_STORAGE_KEYS,
  isRuntimeHealthReady,
  isRuntimeTruthFresh,
  reconcileRuntimeBannerState,
} from '../src/runtime-banner-truth-reconciliation/index.js';
import { STALE_RUNTIME_ERROR_SESSION_KEY } from '../src/command-center-restart-resilience/restart-resilience-types.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function main(): void {
  console.log('');
  console.log('Runtime Banner Truth Reconciliation V1 — Validation');
  console.log('===================================================');
  console.log('');

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const browserJs = readFileSync(join(ROOT, 'public/founder-reality/runtime-banner-truth-reconciliation.js'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:runtime-banner-truth-reconciliation']), 'script');
  assert('02. module index', existsSync(join(ROOT, 'src/runtime-banner-truth-reconciliation/index.ts')), 'module');
  assert('03. browser bridge', indexHtml.includes('runtime-banner-truth-reconciliation.js'), 'script tag');
  assert('04. clear persisted stale on startup', appJs.includes('clearPersistedStaleRuntimeState()'), 'startup clear');
  assert('05. reconciliation wiring', appJs.includes('applyRuntimeBannerReconciliation'), 'reconcile fn');
  assert('06. truth ready trace', appJs.includes('COMMAND_CENTER_RUNTIME_TRUTH_READY'), 'trace');
  assert('07. banner diagnostic', appJs.includes('RUNTIME_BANNER_TRUTH_DIAGNOSTIC'), 'diagnostic');
  assert('08. always poll health after truth', appJs.includes('pollBrainHealthStartup();'), 'health poll');
  assert('09. registry hydration health retry', appJs.includes('fromRegistryHydration'), 'registry retry');
  assert('10. no chat append on stale truth boot', !appJs.includes("appendChatMessage(runtimeTruthStaleMessage, 'system')"), 'no stale chat boot');
  assert('11. removes local-runtime-blocked', appJs.includes("classList.remove('local-runtime-blocked')"), 'body unblock');
  assert('12. stale session key registered', STALE_RUNTIME_SESSION_STORAGE_KEYS.includes(STALE_RUNTIME_ERROR_SESSION_KEY), 'session key');

  const freshTruth = {
    ok: true,
    stale: false,
    freshnessStatus: 'FRESH' as const,
    classifyRouteAvailable: true,
    runtimeId: 'runtime-fresh-1',
    staleReasons: [] as string[],
    message: null,
  };
  const healthyPayload = {
    postAllowed: true,
    serverCapability: 'command-center-brain-v11.1a',
    buildIntentRouting: true,
    registryLoaded: true,
    runtimeReady: true,
  };

  assert('13. truth fresh detector', isRuntimeTruthFresh(freshTruth), 'FRESH');
  assert('14. health ready detector', isRuntimeHealthReady(healthyPayload), 'runtimeReady');

  const reconciled = reconcileRuntimeBannerState({
    truth: freshTruth,
    healthPayload: healthyPayload,
    previousLifecycle: 'UNAVAILABLE',
  });
  assert('15. reconciliation hides banner', !reconciled.shouldShowBanner, reconciled.bannerSource);
  assert('16. reconciliation enables runtime', reconciled.localRuntimeHealthy, String(reconciled.lifecycle));
  assert('17. footer connected', reconciled.footerStatus.toLowerCase().includes('connected') || reconciled.footerStatus.includes('Runtime Authority READY'), reconciled.footerStatus);

  const harness = new RuntimeBannerTruthReconciliationHarness();
  harness.applyPersistedStaleState();
  assert('18. harness starts stale banner', harness.bannerVisible && harness.bodyBlocked, 'stale');

  harness.applyReconciliation({
    truth: freshTruth,
    healthPayload: healthyPayload,
  });
  assert('19. banner clears on FRESH truth', !harness.bannerVisible, 'banner hidden');
  assert('20. send enabled on reconcile', !harness.sendDisabled, 'send enabled');
  assert('21. footer connected on reconcile', harness.footerText.includes('connected'), harness.footerText);
  assert('22. stale session key cleared', harness.sessionStorage[STALE_RUNTIME_ERROR_SESSION_KEY] === undefined, 'cleared');
  assert('23. truth ready trace logged', harness.consoleTraces.includes(COMMAND_CENTER_RUNTIME_TRUTH_READY_TRACE), harness.consoleTraces.join(','));

  harness.simulateReloadWithFreshRuntime();
  assert('24. reload does not restore stale banner', !harness.bannerVisible, 'reload clean');
  assert('25. reload body unblocked', !harness.bodyBlocked, 'body clean');

  harness.applyPersistedStaleState();
  harness.applyReconciliation({
    truth: {
      ok: true,
      stale: false,
      freshnessStatus: 'FRESH',
      classifyRouteAvailable: true,
      runtimeId: 'runtime-after-id-change',
      runtimeIdChanged: true,
      staleReasons: [],
      message: null,
    },
    healthPayload: healthyPayload,
    runtimeIdChanged: true,
  });
  assert('26. runtimeId change clears stale session', harness.sessionStorage[STALE_RUNTIME_ERROR_SESSION_KEY] === undefined, 'cleared');
  assert(
    '27. runtimeId updated in localStorage',
    harness.localStorage['aidevengine.runtimeTruth.runtimeId'] === 'runtime-after-id-change',
    harness.localStorage['aidevengine.runtimeTruth.runtimeId'] || 'missing',
  );

  assert('28. browser reconcile fn', browserJs.includes('reconcileRuntimeBannerState'), 'bridge');
  assert('29. browser diagnostic trace', browserJs.includes('RUNTIME_BANNER_TRUTH_DIAGNOSTIC'), 'bridge diagnostic');
  assert('30. browser runtime authority support', browserJs.includes('normalizeRuntimeAuthorityPayload'), 'authority');
  assert('31. no legacy Start-AiDevEngine banner', !browserJs.includes('Start-AiDevEngine'), 'legacy');

  const passed = results.filter((r) => r.passed).length;
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);

  if (passed === results.length) {
    console.log(RUNTIME_BANNER_TRUTH_RECONCILIATION_V1_PASS_TOKEN);
    process.exit(0);
  }
  process.exit(1);
}

main();
