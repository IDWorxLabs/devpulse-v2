/**
 * Command Center Restart Resilience V1 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMMAND_CENTER_HEALTH_READY_TRACE,
  COMMAND_CENTER_RESTART_RESILIENCE_V1_PASS_TOKEN,
  COMMAND_CENTER_STALE_ERROR_CLEARED_TRACE,
  HEALTH_POLL_WINDOW_MS,
  SIDEBAR_STATUS_BY_LIFECYCLE,
  STALE_RUNTIME_ERROR_SESSION_KEY,
  isLocalRuntimeHealthPayloadOk,
  isStaleRuntimeChatText,
  isStaleRuntimeErrorText,
  mergeStatusBarWithCurrentHealth,
  planHealthPoll,
  resolveLifecycleFromHealth,
  runtimeRequestsAllowed,
  shouldClearStaleErrorOnHealthy,
  shouldShowRuntimeBanner,
} from '../../src/command-center-restart-resilience/index.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

export interface RestartResilienceCheck {
  name: string;
  passed: boolean;
  detail: string;
}

const HEALTHY_PAYLOAD = {
  postAllowed: true,
  serverCapability: 'command-center-brain-v11.1a',
  buildIntentRouting: true,
  registryLoaded: true,
  runtimeReady: true,
};

const STALE_OPERATOR_MESSAGE =
  'AiDevEngine local runtime is stale or unavailable. Restart using Start-AiDevEngine.';

export class CommandCenterRestartResilienceHarness {
  localRuntimeHealthy = false;

  lifecycle: 'STARTING' | 'CHECKING_HEALTH' | 'READY' | 'DEGRADED' | 'UNAVAILABLE' = 'UNAVAILABLE';

  lastError = 'Local runtime not ready';

  operatorMessage = STALE_OPERATOR_MESSAGE;

  bannerVisible = true;

  bodyBlocked = true;

  sendDisabled = true;

  footerText = SIDEBAR_STATUS_BY_LIFECYCLE.UNAVAILABLE;

  chatMessages: string[] = [STALE_OPERATOR_MESSAGE, 'Brain could not respond — Local runtime not ready'];

  sessionStorage: Record<string, string> = {
    [STALE_RUNTIME_ERROR_SESSION_KEY]: STALE_OPERATOR_MESSAGE,
  };

  consoleTraces: string[] = [];

  applyStalePersistedState(): void {
    this.localRuntimeHealthy = false;
    this.lifecycle = 'UNAVAILABLE';
    this.lastError = 'Local runtime not ready';
    this.operatorMessage = STALE_OPERATOR_MESSAGE;
    this.bannerVisible = true;
    this.bodyBlocked = true;
    this.sendDisabled = true;
    this.footerText = SIDEBAR_STATUS_BY_LIFECYCLE.UNAVAILABLE;
    this.chatMessages = [STALE_OPERATOR_MESSAGE, 'Brain could not respond — Local runtime not ready'];
    this.sessionStorage[STALE_RUNTIME_ERROR_SESSION_KEY] = STALE_OPERATOR_MESSAGE;
  }

  applyHealthyRuntimeFromHealthPayload(payload: typeof HEALTHY_PAYLOAD): boolean {
    if (!isLocalRuntimeHealthPayloadOk(payload)) return false;

    this.localRuntimeHealthy = true;
    this.lifecycle = 'READY';
    this.bannerVisible = false;
    this.bodyBlocked = false;
    this.sendDisabled = false;

    if (shouldClearStaleErrorOnHealthy(this.lastError)) {
      this.lastError = 'None';
    }
    if (isStaleRuntimeErrorText(this.operatorMessage)) {
      this.operatorMessage = '';
    }

    this.chatMessages = this.chatMessages.filter((message) => !isStaleRuntimeChatText(message));
    delete this.sessionStorage[STALE_RUNTIME_ERROR_SESSION_KEY];
    this.footerText = SIDEBAR_STATUS_BY_LIFECYCLE.READY;
    this.consoleTraces.push(COMMAND_CENTER_STALE_ERROR_CLEARED_TRACE);
    this.consoleTraces.push(COMMAND_CENTER_HEALTH_READY_TRACE);
    return true;
  }
}

export function assertRestartResilienceCheck(
  checks: RestartResilienceCheck[],
  name: string,
  condition: boolean,
  detail: string,
): void {
  checks.push({ name, passed: condition, detail });
}

export function runRestartResilienceEngineChecks(checks: RestartResilienceCheck[]): void {
  assertRestartResilienceCheck(
    checks,
    'engine.health payload ok',
    isLocalRuntimeHealthPayloadOk(HEALTHY_PAYLOAD),
    'healthy payload accepted',
  );
  assertRestartResilienceCheck(
    checks,
    'engine.health payload rejects stale',
    !isLocalRuntimeHealthPayloadOk({ postAllowed: true, runtimeReady: false, registryLoaded: false }),
    'stale payload rejected',
  );
  assertRestartResilienceCheck(
    checks,
    'engine.stale error text',
    isStaleRuntimeErrorText('Local runtime not ready'),
    'detects stale error',
  );
  assertRestartResilienceCheck(
    checks,
    'engine.stale chat text',
    isStaleRuntimeChatText(STALE_OPERATOR_MESSAGE),
    'detects stale chat',
  );
  assertRestartResilienceCheck(
    checks,
    'engine.lifecycle ready',
    resolveLifecycleFromHealth({ healthOk: true, payload: HEALTHY_PAYLOAD, elapsedMs: 0 }) === 'READY',
    'READY',
  );
  assertRestartResilienceCheck(
    checks,
    'engine.lifecycle checking',
    resolveLifecycleFromHealth({ healthOk: false, payload: null, elapsedMs: 500 }) === 'CHECKING_HEALTH',
    'CHECKING_HEALTH',
  );
  assertRestartResilienceCheck(
    checks,
    'engine.lifecycle unavailable after window',
    resolveLifecycleFromHealth({
      healthOk: false,
      payload: null,
      elapsedMs: HEALTH_POLL_WINDOW_MS,
    }) === 'UNAVAILABLE',
    'UNAVAILABLE',
  );
  assertRestartResilienceCheck(
    checks,
    'engine.lifecycle degraded',
    resolveLifecycleFromHealth({
      healthOk: false,
      payload: { registryLoaded: true, runtimeReady: false },
      elapsedMs: 1000,
    }) === 'DEGRADED',
    'DEGRADED',
  );

  const earlyPoll = planHealthPoll({ healthOk: false, attempt: 0, elapsedMs: 100 });
  assertRestartResilienceCheck(
    checks,
    'engine.poll continues early',
    earlyPoll.shouldContinue && earlyPoll.nextDelayMs > 0,
    `delay=${earlyPoll.nextDelayMs}`,
  );

  const latePoll = planHealthPoll({
    healthOk: false,
    attempt: 5,
    elapsedMs: HEALTH_POLL_WINDOW_MS,
  });
  assertRestartResilienceCheck(
    checks,
    'engine.poll stops after window',
    !latePoll.shouldContinue,
    'window exhausted',
  );

  assertRestartResilienceCheck(
    checks,
    'engine.runtime requests allowed when ready',
    runtimeRequestsAllowed('READY') && !runtimeRequestsAllowed('UNAVAILABLE'),
    'READY only',
  );
  assertRestartResilienceCheck(
    checks,
    'engine.banner only when unavailable',
    shouldShowRuntimeBanner('UNAVAILABLE') && !shouldShowRuntimeBanner('CHECKING_HEALTH'),
    'banner gating',
  );

  const merged = mergeStatusBarWithCurrentHealth({
    lifecycle: 'READY',
    existingItems: ['AiDevEngine runtime unavailable', 'Command Center brain connected'],
  });
  assertRestartResilienceCheck(
    checks,
    'engine.merge status bar on ready',
    merged[0] === 'AiDevEngine local runtime connected' && !merged.some((item) => /unavailable/i.test(item)),
    merged.join(' | '),
  );
}

export function runRestartResilienceRegressionHarness(checks: RestartResilienceCheck[]): void {
  const harness = new CommandCenterRestartResilienceHarness();
  harness.applyStalePersistedState();

  assertRestartResilienceCheck(
    checks,
    'regression.stale banner visible initially',
    harness.bannerVisible && harness.bodyBlocked,
    'banner blocked',
  );
  assertRestartResilienceCheck(
    checks,
    'regression.stale send disabled initially',
    harness.sendDisabled,
    'send disabled',
  );

  const healed = harness.applyHealthyRuntimeFromHealthPayload(HEALTHY_PAYLOAD);
  assertRestartResilienceCheck(checks, 'regression.health apply succeeds', healed, 'applied');

  assertRestartResilienceCheck(
    checks,
    'regression.banner clears after health',
    !harness.bannerVisible && !harness.bodyBlocked,
    'banner cleared',
  );
  assertRestartResilienceCheck(
    checks,
    'regression.send enabled after health',
    !harness.sendDisabled && harness.localRuntimeHealthy,
    'send enabled',
  );
  assertRestartResilienceCheck(
    checks,
    'regression.footer runtime connected',
    harness.footerText === SIDEBAR_STATUS_BY_LIFECYCLE.READY,
    harness.footerText,
  );
  assertRestartResilienceCheck(
    checks,
    'regression.no stale operatorMessage',
    harness.operatorMessage === '',
    harness.operatorMessage || 'cleared',
  );
  assertRestartResilienceCheck(
    checks,
    'regression.no stale chat messages',
    harness.chatMessages.every((message) => !isStaleRuntimeChatText(message)),
    harness.chatMessages.join(' | ') || 'empty',
  );
  assertRestartResilienceCheck(
    checks,
    'regression.session stale key cleared',
    harness.sessionStorage[STALE_RUNTIME_ERROR_SESSION_KEY] === undefined,
    'session cleared',
  );
  assertRestartResilienceCheck(
    checks,
    'regression.console health ready trace',
    harness.consoleTraces.includes(COMMAND_CENTER_HEALTH_READY_TRACE),
    harness.consoleTraces.join(', '),
  );
  assertRestartResilienceCheck(
    checks,
    'regression.console stale cleared trace',
    harness.consoleTraces.includes(COMMAND_CENTER_STALE_ERROR_CLEARED_TRACE),
    harness.consoleTraces.join(', '),
  );
}

export function runRestartResilienceWiringChecks(checks: RestartResilienceCheck[]): void {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const browserJs = readFileSync(
    join(ROOT, 'public/founder-reality/command-center-restart-resilience.js'),
    'utf8',
  );

  assertRestartResilienceCheck(
    checks,
    'wiring.npm script',
    Boolean(pkg.scripts?.['validate:restart-resilience']),
    'validate:restart-resilience',
  );
  assertRestartResilienceCheck(
    checks,
    'wiring.browser helper script',
    indexHtml.includes('command-center-restart-resilience.js'),
    'index.html script tag',
  );
  assertRestartResilienceCheck(
    checks,
    'wiring.module exists',
    existsSync(join(ROOT, 'src/command-center-restart-resilience/restart-resilience-engine.ts')),
    'engine module',
  );
  assertRestartResilienceCheck(
    checks,
    'wiring.startup health poll',
    appJs.includes('pollBrainHealthStartup') && appJs.includes("setRuntimeReadinessLifecycle('STARTING')"),
    'immediate startup poll',
  );
  assertRestartResilienceCheck(
    checks,
    'wiring.apply healthy runtime state',
    appJs.includes('applyHealthyRuntimeState') && appJs.includes('clearStaleRuntimeChatMessages'),
    'healthy clears stale UI',
  );
  assertRestartResilienceCheck(
    checks,
    'wiring.lifecycle states',
    appJs.includes('runtimeReadinessLifecycle') &&
      appJs.includes('CHECKING_HEALTH') &&
      appJs.includes('DEGRADED') &&
      appJs.includes('UNAVAILABLE'),
    'lifecycle states',
  );
  assertRestartResilienceCheck(
    checks,
    'wiring.health poll window',
    appJs.includes('fromStartupPoll: true') && browserJs.includes('HEALTH_POLL_WINDOW_MS'),
    '10s poll window',
  );
  assertRestartResilienceCheck(
    checks,
    'wiring.console traces',
    appJs.includes('COMMAND_CENTER_HEALTH_READY') &&
      appJs.includes('COMMAND_CENTER_STALE_ERROR_CLEARED'),
    'console traces',
  );
  assertRestartResilienceCheck(
    checks,
    'wiring.sidebar driven by health',
    appJs.includes('mergeRuntimeStatusBarItems') &&
      appJs.includes('localRuntimeHealthy && runtimeReadinessLifecycle === \'READY\''),
    'status bar merge',
  );
  assertRestartResilienceCheck(
    checks,
    'wiring.current health beats workspace',
    appJs.includes('updateRuntimeReadinessUi') && appJs.includes('renderSidebarStatus'),
    'sidebar health priority',
  );
  assertRestartResilienceCheck(
    checks,
    'wiring.askBrain retries during checking',
    appJs.includes("runtimeReadinessLifecycle === 'CHECKING_HEALTH'") &&
      appJs.includes('pollBrainHealthStartup().then'),
    'askBrain retry',
  );
  assertRestartResilienceCheck(
    checks,
    'wiring.no late-only health check',
    !appJs.includes('.then(function () {\n      return checkBrainHealth();\n    })'),
    'removed registry-chain-only health',
  );
}

export function runCommandCenterRestartResilienceValidation(): {
  checks: RestartResilienceCheck[];
  allPassed: boolean;
} {
  const checks: RestartResilienceCheck[] = [];
  runRestartResilienceEngineChecks(checks);
  runRestartResilienceRegressionHarness(checks);
  runRestartResilienceWiringChecks(checks);
  return {
    checks,
    allPassed: checks.every((check) => check.passed),
  };
}

export function printRestartResilienceResults(checks: RestartResilienceCheck[]): number {
  let passed = 0;
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`);
    if (check.passed) passed += 1;
  }
  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  return passed;
}

export { COMMAND_CENTER_RESTART_RESILIENCE_V1_PASS_TOKEN };
