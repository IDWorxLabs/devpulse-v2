/**
 * Product Stabilization Phase 4 V1 — validation suite.
 *
 * Confirms that build EXECUTION (planning, generation, workspace stabilization, npm install,
 * npm build, preview startup, interaction proof, validation, result) is observable, bounded,
 * recoverable, and understandable via the build-execution-stabilizer-v1 module: real heartbeats
 * from real evidence, stall detection via configurable timeouts, at most one recovery attempt per
 * stage, a deterministic execution timeline, and plain-English status — wired into the real build
 * pipeline, the API response, the Phase 1 normalizer, and the simplified builder UI (with raw
 * process evidence only inside Advanced Diagnostics, hidden by default).
 */

import { existsSync, readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exitValidator } from '../src/windows-validator-clean-exit-v1/index.js';
import {
  createBuildExecutionMonitor,
  buildExecutionReport,
  runMonitoredCommand,
  runMonitoredPoll,
  type BuildExecutionStageName,
} from '../src/build-execution-stabilizer-v1/index.js';
import { normalizeBuildResult, type BuildResultNormalizerInput } from '../src/build-result-normalizer-v1/index.js';
import type { BuildExecutionReport } from '../src/build-execution-stabilizer-v1/build-execution-types.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export const PRODUCT_STABILIZATION_PHASE_4_V1_PASS_TOKEN = 'PRODUCT_STABILIZATION_PHASE_4_V1_PASS';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

/** Forbidden app-specific hardcoding — execution stabilization must work for every generated app. */
const FORBIDDEN_APP_SPECIFIC_TERMS = ['counter', 'todo', 'calculator', 'crm', 'lisa', 'expense-tracker', 'expense tracker'];

function containsForbiddenAppSpecificTerm(source: string): string | null {
  for (const term of FORBIDDEN_APP_SPECIFIC_TERMS) {
    const re = term.includes(' ') || term.includes('-') ? new RegExp(term, 'i') : new RegExp(`\\b${term}\\b`, 'i');
    if (re.test(source)) return term;
  }
  return null;
}

function containsAuthOnlyAssumption(source: string): boolean {
  return /\bauth\b/i.test(source);
}

/** A minimal fake child process — an EventEmitter with stdout/stderr streams and kill(). */
class FakeChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  killed = false;
  kill(): void {
    this.killed = true;
  }
}

function baseNormalizerInput(overrides: Partial<BuildResultNormalizerInput>): BuildResultNormalizerInput {
  return {
    status: 'READY',
    npmInstallOk: true,
    npmBuildOk: true,
    devServerRunning: true,
    previewUrl: 'http://127.0.0.1:5174/',
    failureReason: null,
    ...overrides,
  };
}

function fakeExecutionReport(overrides: Partial<BuildExecutionReport>): BuildExecutionReport {
  const base = buildExecutionReport(createBuildExecutionMonitor());
  return { ...base, ...overrides };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Product Stabilization Phase 4 V1 — Validation');
  console.log('===============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert(
    '00. package script registered',
    Boolean(pkg.scripts?.['validate:product-stabilization-phase-4-v1']),
    'validate:product-stabilization-phase-4-v1',
  );

  // --- Module exists with all required files --------------------------------------

  const moduleDir = join(ROOT, 'src/build-execution-stabilizer-v1');
  const expectedFiles = [
    'index.ts',
    'build-execution-types.ts',
    'build-execution-monitor.ts',
    'build-execution-heartbeat.ts',
    'build-execution-timeouts.ts',
    'build-execution-recovery.ts',
    'build-execution-report.ts',
    'build-execution-stabilizer.ts',
  ];
  const missingFiles = expectedFiles.filter((f) => !existsSync(join(moduleDir, f)));
  assert(
    '01. build-execution-stabilizer-v1 module exists with all required files',
    missingFiles.length === 0,
    missingFiles.join(', ') || 'all present',
  );
  assert(
    '02. module exports runMonitoredCommand, runMonitoredPoll, createBuildExecutionMonitor, buildExecutionReport',
    typeof runMonitoredCommand === 'function' &&
      typeof runMonitoredPoll === 'function' &&
      typeof createBuildExecutionMonitor === 'function' &&
      typeof buildExecutionReport === 'function',
    'all exported',
  );

  // --- Scenario 1: healthy build -> COMPLETED --------------------------------------

  {
    const monitor = createBuildExecutionMonitor();
    const spawnFn = () => {
      const child = new FakeChildProcess();
      setTimeout(() => child.stdout.emit('data', Buffer.from('added 12 packages')), 5);
      setTimeout(() => child.emit('exit', 0), 15);
      return child as unknown as ReturnType<typeof import('node:child_process').spawn>;
    };
    const result = await runMonitoredCommand({
      stage: 'NPM_INSTALL',
      command: 'npm',
      args: ['install'],
      cwd: '.',
      monitor,
      spawnFn,
      stallConfig: { stallTimeoutMs: 200, totalTimeoutMs: 500 },
      pollIntervalMs: 5,
    });
    const report = buildExecutionReport(monitor);
    assert(
      '03. Scenario 1 — healthy build reports COMPLETED',
      result.ok && report.overallState === 'COMPLETED',
      `ok=${result.ok}, state=${report.overallState}`,
    );
  }

  // --- Scenario 2: long-but-active npm install -> heartbeat stays active, no false stall --

  {
    const monitor = createBuildExecutionMonitor();
    const spawnFn = () => {
      const child = new FakeChildProcess();
      [15, 30, 45, 60].forEach((t) => setTimeout(() => child.stdout.emit('data', Buffer.from('reify fetching...')), t));
      setTimeout(() => child.emit('exit', 0), 70);
      return child as unknown as ReturnType<typeof import('node:child_process').spawn>;
    };
    const result = await runMonitoredCommand({
      stage: 'NPM_INSTALL',
      command: 'npm',
      args: ['install'],
      cwd: '.',
      monitor,
      spawnFn,
      stallConfig: { stallTimeoutMs: 200, totalTimeoutMs: 500 },
      pollIntervalMs: 5,
    });
    const report = buildExecutionReport(monitor);
    assert(
      '04. Scenario 2 — long-but-active install completes with multiple real heartbeats and no false stall',
      result.ok && report.overallState === 'COMPLETED' && report.heartbeats.length >= 4,
      `ok=${result.ok}, state=${report.overallState}, heartbeats=${report.heartbeats.length}`,
    );
  }

  // --- Scenario 3: hung npm install -> STALL_DETECTED -> single recovery attempt --------

  {
    const monitor = createBuildExecutionMonitor();
    const spawnFn = () => new FakeChildProcess() as unknown as ReturnType<typeof import('node:child_process').spawn>;
    let restartCalls = 0;
    const result = await runMonitoredCommand({
      stage: 'NPM_INSTALL',
      command: 'npm',
      args: ['install'],
      cwd: '.',
      monitor,
      spawnFn,
      stallConfig: { stallTimeoutMs: 30, totalTimeoutMs: 1000 },
      pollIntervalMs: 5,
      recoveryHost: {
        restartNpmInstall: async () => {
          restartCalls += 1;
          return { ok: true, detail: 'restarted' };
        },
      },
    });
    const report = buildExecutionReport(monitor);
    const sawStall = report.timeline.some((e) => e.state === 'STALL_DETECTED' || e.state === 'RECOVERING' || e.state === 'RECOVERED');
    assert(
      '05. Scenario 3 — hung npm install is detected as a stall and triggers exactly one recovery attempt',
      sawStall && restartCalls === 1 && report.recoveryAttempts.length === 1,
      `sawStall=${sawStall}, restartCalls=${restartCalls}, recoveryAttempts=${report.recoveryAttempts.length}, ok=${result.ok}`,
    );
  }

  // --- Scenario 4: hung npm build -> recovery attempted once ----------------------------

  {
    const monitor = createBuildExecutionMonitor();
    const spawnFn = () => new FakeChildProcess() as unknown as ReturnType<typeof import('node:child_process').spawn>;
    let restartCalls = 0;
    await runMonitoredCommand({
      stage: 'NPM_BUILD',
      command: 'npm',
      args: ['run', 'build'],
      cwd: '.',
      monitor,
      spawnFn,
      stallConfig: { stallTimeoutMs: 30, totalTimeoutMs: 200 },
      pollIntervalMs: 5,
      recoveryHost: {
        restartNpmBuild: async () => {
          restartCalls += 1;
          return { ok: false, detail: 'still hung' };
        },
      },
    });
    assert('06. Scenario 4 — hung npm build triggers exactly one recovery attempt', restartCalls === 1, `restartCalls=${restartCalls}`);
  }

  // --- Scenario 5: preview never starts -> preview restart attempted once ---------------

  {
    const monitor = createBuildExecutionMonitor();
    let restartCalls = 0;
    let readyAfterRestart = false;
    const result = await runMonitoredPoll({
      stage: 'PREVIEW_STARTUP',
      monitor,
      stallConfig: { stallTimeoutMs: 30, totalTimeoutMs: 200 },
      pollIntervalMs: 5,
      checkReady: async () => ({ ready: readyAfterRestart, detail: readyAfterRestart ? 'Preview responded.' : 'No response yet.' }),
      recoveryHost: {
        restartPreviewServer: async () => {
          restartCalls += 1;
          readyAfterRestart = true;
          return { ok: true, detail: 'Preview server restarted.' };
        },
      },
    });
    assert(
      '07. Scenario 5 — preview never starting triggers exactly one restart attempt and can recover',
      restartCalls === 1 && result.ok,
      `restartCalls=${restartCalls}, ok=${result.ok}`,
    );
  }

  // --- Scenario 6: child process exits unexpectedly -> clear failure report -------------

  {
    const monitor = createBuildExecutionMonitor();
    const spawnFn = () => {
      const child = new FakeChildProcess();
      setTimeout(() => child.emit('exit', 1), 5);
      return child as unknown as ReturnType<typeof import('node:child_process').spawn>;
    };
    const result = await runMonitoredCommand({
      stage: 'NPM_BUILD',
      command: 'npm',
      args: ['run', 'build'],
      cwd: '.',
      monitor,
      spawnFn,
      stallConfig: { stallTimeoutMs: 200, totalTimeoutMs: 500 },
      pollIntervalMs: 5,
    });
    const report = buildExecutionReport(monitor);
    assert(
      '08. Scenario 6 — unexpected child process exit produces a clear, specific failure report',
      !result.ok && report.overallState === 'FAILED' && /exited with code/i.test(result.detail),
      `ok=${result.ok}, state=${report.overallState}, detail=${result.detail}`,
    );
  }

  // --- Scenario 7: recovery succeeds -> RECOVERED -> build continues --------------------

  {
    const monitor = createBuildExecutionMonitor();
    let callCount = 0;
    const spawnFn = () => {
      callCount += 1;
      const child = new FakeChildProcess();
      if (callCount === 1) {
        // first attempt hangs forever (never emits, never exits)
      } else {
        setTimeout(() => child.emit('exit', 0), 5);
      }
      return child as unknown as ReturnType<typeof import('node:child_process').spawn>;
    };
    const result = await runMonitoredCommand({
      stage: 'NPM_INSTALL',
      command: 'npm',
      args: ['install'],
      cwd: '.',
      monitor,
      spawnFn,
      stallConfig: { stallTimeoutMs: 30, totalTimeoutMs: 1000 },
      pollIntervalMs: 5,
      recoveryHost: {
        restartNpmInstall: async () => ({ ok: true, detail: 'Restarted npm install after stall.' }),
      },
    });
    const report = buildExecutionReport(monitor);
    const sawRecoveredState = report.timeline.some((e) => e.state === 'RECOVERED') || report.recoveryAttempts.some((a) => a.succeeded);
    assert(
      '09. Scenario 7 — a succeeding recovery is marked RECOVERED and the build continues to COMPLETED',
      result.ok && result.recovered && sawRecoveredState && report.overallState === 'COMPLETED',
      `ok=${result.ok}, recovered=${result.recovered}, state=${report.overallState}, callCount=${callCount}`,
    );
  }

  // --- Scenario 8: recovery fails -> FAILED, no endless retries -------------------------

  {
    const monitor = createBuildExecutionMonitor();
    let restartCalls = 0;
    const spawnFn = () => new FakeChildProcess() as unknown as ReturnType<typeof import('node:child_process').spawn>;
    const result = await runMonitoredCommand({
      stage: 'NPM_BUILD',
      command: 'npm',
      args: ['run', 'build'],
      cwd: '.',
      monitor,
      spawnFn,
      stallConfig: { stallTimeoutMs: 20, totalTimeoutMs: 150 },
      pollIntervalMs: 5,
      recoveryHost: {
        restartNpmBuild: async () => {
          restartCalls += 1;
          return { ok: false, detail: 'still hung after restart' };
        },
      },
    });
    const report = buildExecutionReport(monitor);
    assert(
      '10. Scenario 8 — a failing recovery ends in FAILED with exactly one attempt, never endless retries',
      !result.ok && report.overallState === 'FAILED' && restartCalls === 1 && report.recoveryAttempts.length === 1,
      `ok=${result.ok}, state=${report.overallState}, restartCalls=${restartCalls}`,
    );
  }

  // --- Scenario 9: timeline — every execution stage can be recorded ---------------------

  {
    const monitor = createBuildExecutionMonitor();
    const allStages: BuildExecutionStageName[] = [
      'PLANNING',
      'GENERATION',
      'WORKSPACE_STABILIZATION',
      'NPM_INSTALL',
      'NPM_BUILD',
      'PREVIEW_STARTUP',
      'INTERACTION_PROOF',
      'VALIDATION',
      'RESULT',
    ];
    for (const stage of allStages) {
      monitor.startStage(stage);
      monitor.completeStage(stage, 'ok');
    }
    const report = buildExecutionReport(monitor);
    const recordedStages = new Set(report.timeline.map((e) => e.stage));
    const allRecorded = allStages.every((s) => recordedStages.has(s));
    assert(
      '11. Scenario 9 — the execution timeline records every defined stage',
      allRecorded && report.timeline.length === allStages.length,
      `recorded=${[...recordedStages].join(',')}`,
    );
  }

  // --- Orchestrator integration: monitor created and wired at real stage boundaries -----

  const orchestratorTs = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
  assert(
    '12. Orchestrator creates a BuildExecutionMonitor per build and registers it by projectId',
    orchestratorTs.includes('createBuildExecutionMonitor()') && orchestratorTs.includes('activeExecutionMonitors.set(projectId'),
    'monitor creation + registration present',
  );
  const stageWiring: [string, BuildExecutionStageName][] = [
    ["executionMonitor.startStage('PLANNING')", 'PLANNING'],
    ["executionMonitor.startStage('GENERATION')", 'GENERATION'],
    ["executionMonitor.startStage('WORKSPACE_STABILIZATION')", 'WORKSPACE_STABILIZATION'],
    ["executionMonitor.startStage('NPM_INSTALL')", 'NPM_INSTALL'],
    ["executionMonitor.startStage('NPM_BUILD')", 'NPM_BUILD'],
    ["executionMonitor.startStage('PREVIEW_STARTUP')", 'PREVIEW_STARTUP'],
    ["executionMonitor.startStage('VALIDATION')", 'VALIDATION'],
    ["executionMonitor.startStage('RESULT')", 'RESULT'],
  ];
  const missingStageWiring = stageWiring.filter(([needle]) => !orchestratorTs.includes(needle)).map(([, s]) => s);
  assert(
    '13. Orchestrator wires the execution monitor into every real stage boundary it owns',
    missingStageWiring.length === 0,
    missingStageWiring.length ? `missing: ${missingStageWiring.join(', ')}` : 'all 8 stages wired',
  );
  assert(
    '14. Orchestrator records a single recovery attempt for npm install using the real retry-once mechanism',
    orchestratorTs.includes("actionKind: 'RESTART_NPM_INSTALL'") && orchestratorTs.includes('recordRecoveryAttempt'),
    'npm install recovery attempt recorded',
  );
  assert(
    '15. Orchestrator records a single recovery attempt for npm build using the AutoFix loop outcome',
    orchestratorTs.includes("actionKind: 'RESTART_NPM_BUILD'"),
    'npm build recovery attempt recorded',
  );
  assert(
    '16. Orchestrator records a single recovery attempt for preview startup',
    orchestratorTs.includes("actionKind: 'RESTART_PREVIEW_SERVER'"),
    'preview recovery attempt recorded',
  );

  const handlerTs = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
  assert(
    '17. Handler records the INTERACTION_PROOF stage against the same execution monitor',
    handlerTs.includes("monitor?.startStage('INTERACTION_PROOF')") || handlerTs.includes('startStage(\'INTERACTION_PROOF\')'),
    'interaction proof stage wired in handler',
  );

  // --- Scenario 10: API — build response includes execution status ----------------------

  const apiFieldMatches = ['buildExecutionStatus', 'executionTimeline', 'executionRecovery'].map(
    (field) => (handlerTs.match(new RegExp(field, 'g')) || []).length,
  );
  assert(
    '18. Scenario 10 — build response includes buildExecutionStatus, executionTimeline, and executionRecovery in both response paths',
    apiFieldMatches.every((count) => count >= 2),
    `counts=${apiFieldMatches.join(',')}`,
  );

  // --- Scenario 11: UI — execution status panel exists -----------------------------------

  const indexPath = join(ROOT, 'public/founder-reality/index.html');
  const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
  const builderHomeJsPath = join(ROOT, 'public/founder-reality/builder-home.js');
  const builderHomeJs = existsSync(builderHomeJsPath) ? readFileSync(builderHomeJsPath, 'utf8') : '';
  assert(
    '19. Scenario 11 — UI displays an Execution status panel with stage, elapsed, heartbeat, recovery, and next step',
    indexHtml.includes('id="builder-execution-section"') &&
      indexHtml.includes('id="builder-execution-badge"') &&
      indexHtml.includes('id="builder-execution-stage"') &&
      indexHtml.includes('id="builder-execution-elapsed"') &&
      indexHtml.includes('id="builder-execution-heartbeat"') &&
      indexHtml.includes('id="builder-execution-next"') &&
      builderHomeJs.includes('renderExecutionStatus') &&
      builderHomeJs.includes('EXECUTION_BADGE'),
    'execution panel markup + renderer present',
  );

  // --- Scenario 12: Advanced Diagnostics — raw process logs hidden by default -----------

  const diagnosticsMarkupMatch = indexHtml.match(
    /<aside\s+class="builder-diagnostics-drawer[^>]*id="builder-diagnostics-drawer"[\s\S]*?>/,
  );
  const diagnosticsTagOpen = diagnosticsMarkupMatch ? diagnosticsMarkupMatch[0] : '';
  assert(
    '20a. Scenario 12 — diagnostics drawer (holding the raw execution timeline) starts hidden by default',
    diagnosticsTagOpen.includes('hidden') && diagnosticsTagOpen.includes('aria-hidden="true"'),
    diagnosticsTagOpen || 'diagnostics drawer tag not found',
  );
  assert(
    '20b. Scenario 12 — raw execution timeline JSON only rendered inside renderDiagnostics, never in the main execution panel',
    /function renderDiagnostics[\s\S]*?builder-diagnostics-execution-raw/.test(builderHomeJs) &&
      !/function renderExecutionStatus[\s\S]{0,900}JSON\.stringify/.test(builderHomeJs),
    'raw execution JSON only inside renderDiagnostics',
  );
  assert(
    '20c. Execution panel itself never renders raw heartbeats/timeline arrays, only plain-English strings',
    !/function renderExecutionStatus[\s\S]{0,900}\.timeline/.test(builderHomeJs) &&
      !/function renderExecutionStatus[\s\S]{0,900}\.heartbeats/.test(builderHomeJs),
    'no raw timeline/heartbeats referenced in the founder-facing panel',
  );

  // --- Normalizer integration: Execution is its own independent stage -------------------

  const completedExecutionReport = fakeExecutionReport({
    overallState: 'COMPLETED',
    summary: {
      readOnly: true,
      headline: 'Build completed.',
      currentStageLabel: 'Finishing up',
      elapsedLabel: '42s elapsed',
      heartbeatLabel: 'Finishing up…',
      recoveryLabel: null,
      nextStepLabel: 'Your app is ready to preview.',
    },
  });
  const normalizedHealthy = normalizeBuildResult(baseNormalizerInput({ buildExecutionReport: completedExecutionReport }));
  assert(
    '21. Normalizer reports Execution as its own independent, healthy stage on a completed build',
    normalizedHealthy.stages.executionHealthy === true &&
      normalizedHealthy.buildExecution !== null &&
      normalizedHealthy.buildExecution.state === 'COMPLETED' &&
      normalizedHealthy.result === 'BUILT_SUCCESSFULLY',
    JSON.stringify(normalizedHealthy.stages),
  );

  const failedExecutionReport = fakeExecutionReport({
    overallState: 'FAILED',
    recoveryAttempts: [
      {
        readOnly: true,
        stage: 'NPM_INSTALL',
        actionKind: 'RESTART_NPM_INSTALL',
        attemptedAtMs: Date.now(),
        succeeded: false,
        detail: 'npm install stopped responding.',
      },
    ],
    summary: {
      readOnly: true,
      headline: 'Build stopped.',
      currentStageLabel: 'Installing dependencies',
      elapsedLabel: '95s elapsed',
      heartbeatLabel: 'No activity received for over 90s.',
      recoveryLabel: 'AiDevEngine attempted one restart of Installing dependencies, but it did not recover.',
      nextStepLabel: 'The installing dependencies stage stopped responding. Further progress requires investigation.',
    },
  });
  const normalizedUnrecovered = normalizeBuildResult(baseNormalizerInput({ buildExecutionReport: failedExecutionReport }));
  assert(
    '22. Normalizer downgrades an unrecovered execution failure to BUILT_WITH_WARNINGS (not a fake success) and surfaces the recovery attempt',
    normalizedUnrecovered.stages.executionHealthy === false &&
      normalizedUnrecovered.result === 'BUILT_WITH_WARNINGS' &&
      normalizedUnrecovered.summary.whatAiDevEngineTried.some((line) => /automatic recovery/i.test(line)),
    JSON.stringify(normalizedUnrecovered.stages),
  );

  // --- Scenario 13: Generality audit ------------------------------------------------------

  const moduleFiles = expectedFiles.map((f) => join(moduleDir, f));
  const normalizerFiles = [
    join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer.ts'),
    join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer-adapter.ts'),
    join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer-types.ts'),
  ];
  let hardcodingFound: string | null = null;
  let authOnlyFound: string | null = null;
  for (const file of [...moduleFiles, ...normalizerFiles, builderHomeJsPath, indexPath]) {
    if (!existsSync(file)) continue;
    const source = readFileSync(file, 'utf8');
    const found = containsForbiddenAppSpecificTerm(source);
    if (found && !hardcodingFound) hardcodingFound = `${found} in ${file}`;
    if (containsAuthOnlyAssumption(source) && !authOnlyFound) authOnlyFound = file;
  }
  assert(
    '23. No app-specific hardcoding (calculator/counter/todo/CRM/LISA) in the execution stabilizer module, normalizer, or UI',
    hardcodingFound === null,
    hardcodingFound || 'clean',
  );
  assert('24. No authentication-specific assumptions baked into the execution stabilizer or normalizer', authOnlyFound === null, authOnlyFound || 'clean');

  // --- Bounded execution: recovery is capped at 1 attempt per stage, never re-attempted --

  {
    const monitor = createBuildExecutionMonitor();
    const spawnFn = () => new FakeChildProcess() as unknown as ReturnType<typeof import('node:child_process').spawn>;
    let restartCalls = 0;
    await runMonitoredCommand({
      stage: 'NPM_INSTALL',
      command: 'npm',
      args: ['install'],
      cwd: '.',
      monitor,
      spawnFn,
      stallConfig: { stallTimeoutMs: 15, totalTimeoutMs: 60 },
      pollIntervalMs: 5,
      recoveryHost: { restartNpmInstall: async () => { restartCalls += 1; return { ok: false, detail: 'still hung' }; } },
    });
    // A second, independent monitored call against the SAME monitor/stage must not re-attempt recovery.
    await runMonitoredCommand({
      stage: 'NPM_INSTALL',
      command: 'npm',
      args: ['install'],
      cwd: '.',
      monitor,
      spawnFn,
      stallConfig: { stallTimeoutMs: 15, totalTimeoutMs: 60 },
      pollIntervalMs: 5,
      recoveryHost: { restartNpmInstall: async () => { restartCalls += 1; return { ok: false, detail: 'still hung' }; } },
    });
    assert(
      '25. Maximum of 1 recovery attempt per execution stage is enforced even across repeated calls for the same stage',
      restartCalls === 1,
      `restartCalls=${restartCalls}`,
    );
  }

  const passed = results.filter((r) => r.passed).length;
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    if (!check.passed) console.log(`       ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);
  console.log('');

  if (passed === results.length) {
    console.log(PRODUCT_STABILIZATION_PHASE_4_V1_PASS_TOKEN);
    await exitValidator(0);
    return;
  }
  await exitValidator(1);
}

main().catch(async (err) => {
  console.error(err);
  await exitValidator(1);
});
