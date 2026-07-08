/**
 * Command Center Clean Startup V1 — validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMMAND_CENTER_CLEAN_STARTUP_V1_PASS_TOKEN,
  hasPersistedSessionStorageHints,
  resolveStartupActiveProjectId,
  shouldAutoHydrateProjectChat,
  shouldShowResumePreviousSession,
  shouldUseCachedRegistryFallback,
} from '../src/command-center-clean-startup-v1/index.js';
import {
  isRuntimeAuthorityReady,
  reconcileRuntimeBannerState,
} from '../src/runtime-banner-truth-reconciliation/index.js';

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
  console.log('Command Center Clean Startup V1 — Validation');
  console.log('============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const browserJs = readFileSync(join(ROOT, 'public/founder-reality/command-center-clean-startup.js'), 'utf8');
  const bannerJs = readFileSync(join(ROOT, 'public/founder-reality/runtime-banner-truth-reconciliation.js'), 'utf8');

  assert('01. package script', Boolean(pkg.scripts?.['validate:command-center-clean-startup']), 'script');
  assert('02. module exists', existsSync(join(ROOT, 'src/command-center-clean-startup-v1/index.ts')), 'module');
  assert('03. browser bridge loaded', indexHtml.includes('command-center-clean-startup.js'), 'script tag');
  assert('04. resume session UI', indexHtml.includes('welcome-resume-btn'), 'resume btn');
  assert('05. fresh load marker', appJs.includes('markFreshLoadSession'), 'fresh load');
  assert('06. no auto first project', !appJs.includes('return normalized.projects[0].projectId'), 'no auto pick');
  assert('07. cached fallback gated', appJs.includes('shouldUseCachedRegistryFallback'), 'cache gate');
  assert('08. chat hydrate gated', appJs.includes('shouldAutoHydrateChatForActiveProject'), 'hydrate gate');
  assert('09. resume handler wired', appJs.includes('resumePreviousCommandCenterSession'), 'resume fn');
  assert('10. legacy banner text removed', !indexHtml.includes('Start-AiDevEngine'), 'html banner');
  assert('11. runtime authority banner hook', appJs.includes('__applyRuntimeAuthorityBanner'), 'authority hook');
  assert('12. browser resolve helper', browserJs.includes('resolveStartupActiveProjectId'), 'browser resolve');

  assert(
    '13. fresh load no active project',
    resolveStartupActiveProjectId({
      registryActiveProjectId: 'lisa-1',
      registryProjectIds: ['lisa-1'],
      userExplicitlySelectedProjectId: null,
      resumeSessionRequested: false,
    }) === null,
    'null',
  );
  assert(
    '14. resume restores registry active',
    resolveStartupActiveProjectId({
      registryActiveProjectId: 'lisa-1',
      registryProjectIds: ['lisa-1'],
      userExplicitlySelectedProjectId: null,
      resumeSessionRequested: true,
    }) === 'lisa-1',
    'lisa-1',
  );
  assert(
    '15. stale cache blocked on fresh load',
    shouldUseCachedRegistryFallback({
      userExplicitlySelectedProjectId: null,
      resumeSessionRequested: false,
      freshLoadSession: true,
    }) === false,
    'blocked',
  );
  assert(
    '16. chat not auto-hydrated',
    shouldAutoHydrateProjectChat({
      activeProjectId: 'lisa-1',
      userExplicitlySelectedProjectId: null,
      resumeSessionRequested: false,
    }) === false,
    'no hydrate',
  );
  assert(
    '17. resume shows prompt when projects exist',
    shouldShowResumePreviousSession({
      registryProjectIds: ['proj-1'],
      hasPersistedSessionHints: false,
      resumeSessionRequested: false,
      activeProjectId: null,
    }) === true,
    'show',
  );
  assert(
    '18. persisted session hints detected',
    hasPersistedSessionStorageHints({ activeProjectId: 'lisa-1' }),
    'hint',
  );

  const authorityReady = reconcileRuntimeBannerState({
    truth: null,
    healthPayload: null,
    runtimeAuthority: { ok: true, ready: true, phase: 'READY', health: 'HEALTHY' },
    previousLifecycle: 'STARTING',
  });
  assert('19. healthy authority hides banner', !authorityReady.shouldShowBanner, authorityReady.bannerSource);
  assert(
    '20. healthy authority footer',
    authorityReady.footerStatus.includes('Runtime Authority READY'),
    authorityReady.footerStatus,
  );

  const authorityVerifying = reconcileRuntimeBannerState({
    truth: null,
    healthPayload: null,
    runtimeAuthority: { ok: false, ready: false, phase: 'VERIFYING', health: 'UNKNOWN' },
    previousLifecycle: 'STARTING',
  });
  assert('21. verifying no red banner', !authorityVerifying.shouldShowBanner, authorityVerifying.bannerTone);
  assert(
    '22. verifying neutral footer',
    authorityVerifying.footerStatus.includes('verifying'),
    authorityVerifying.footerStatus,
  );
  assert(
    '23. legacy Start-AiDevEngine absent from banner bridge',
    !bannerJs.includes('Start-AiDevEngine'),
    'legacy removed',
  );
  assert(
    '24. runtime authority ready detector',
    isRuntimeAuthorityReady({ ok: true, ready: true, phase: 'READY', health: 'HEALTHY' }),
    'ready',
  );

  const passed = results.filter((r) => r.passed).length;
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    if (!check.passed) console.log(`       ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);
  console.log('');

  if (passed === results.length) {
    console.log(COMMAND_CENTER_CLEAN_STARTUP_V1_PASS_TOKEN);
    process.exit(0);
  }
  process.exit(1);
}

main();
