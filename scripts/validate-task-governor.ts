/**
 * DevPulse V2 Task Governor Foundation — validation scenarios.
 * VALIDATION_MODE: FULL_STACK_CHECK
 */

import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { FOUNDATION_ENFORCEMENT_PASS_TOKEN } from '../src/foundation/types.js';
import { formatTaskGovernorReport } from '../src/task-governor/task-governor-report.js';
import {
  createTaskId,
  resetDevPulseV2TaskGovernorForTests,
} from '../src/task-governor/task-governor.js';
import { TASK_GOVERNOR_PASS_TOKEN } from '../src/task-governor/types.js';
import type { DevPulseV2Task } from '../src/task-governor/types.js';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Task Governor Foundation Validation');
  console.log('==================================================');
  console.log('');

  // 1. Build gate accepts task_governor Phase 1 packet
  const buildGate = runDevPulseV2BuildGate({
    phase: 1,
    systems: ['task_governor'],
    eagerModuleCount: 1,
    answerAuthorities: [],
    browserVerificationPresent: false,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts task_governor Phase 1 packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary + (buildGate.warningCount ? ` (${buildGate.warningCount} warning(s))` : ''),
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const gov = resetDevPulseV2TaskGovernorForTests();
  gov.setInteractionActive(false);
  gov.setLastInteractionAtForTests(0);

  // 2. P0 runs before P3/P4
  const order: string[] = [];
  const mk = (label: string, priority: DevPulseV2Task['priority']): DevPulseV2Task => ({
    id: createTaskId(label),
    label,
    priority,
    estimatedCostMs: 1,
    createdAt: Date.now(),
    run: () => {
      order.push(label);
    },
  });

  gov.enqueueTask(mk('idle-task', 'P4_IDLE_ONLY'));
  gov.enqueueTask(mk('heavy-task', 'P3_HEAVY_BACKGROUND'));
  gov.enqueueTask(mk('user-path', 'P0_VISIBLE_USER_PATH'));

  await gov.runUntilBudgetExhausted(200);
  assert(
    '2. P0 task runs before P3/P4',
    order[0] === 'user-path',
    `execution order: ${order.join(' → ') || '(empty)'}`,
  );

  // 3. P3 deferred/sliced does not block P0
  const gov3 = resetDevPulseV2TaskGovernorForTests();
  gov3.setInteractionActive(false);
  gov3.setLastInteractionAtForTests(0);

  const runOrder: string[] = [];
  gov3.enqueueTask({
    id: createTaskId('heavy-slice'),
    label: 'heavy-slice',
    priority: 'P3_HEAVY_BACKGROUND',
    estimatedCostMs: 60,
    createdAt: Date.now(),
    run: () => sleep(60),
  });
  gov3.enqueueTask({
    id: createTaskId('p0-critical'),
    label: 'p0-critical',
    priority: 'P0_VISIBLE_USER_PATH',
    estimatedCostMs: 1,
    createdAt: Date.now(),
    run: () => {
      runOrder.push('p0-critical');
    },
  });

  const first = await gov3.runNextTask();
  assert(
    '3. P0 runs before deferred P3 heavy task',
    first?.priority === 'P0_VISIBLE_USER_PATH' && runOrder.includes('p0-critical'),
    `first task: ${first?.priority ?? 'none'}`,
  );

  // 4. Interaction active defers P2/P3/P4 but allows P0/P1
  resetDevPulseV2TaskGovernorForTests();
  const gov4 = resetDevPulseV2TaskGovernorForTests();
  gov4.setInteractionActive(true, 'user typing');

  const interactionOrder: string[] = [];
  gov4.enqueueTask({
    id: createTaskId('p4'),
    label: 'p4',
    priority: 'P4_IDLE_ONLY',
    estimatedCostMs: 1,
    createdAt: Date.now(),
    run: () => {
      interactionOrder.push('p4');
    },
  });
  gov4.enqueueTask({
    id: createTaskId('p3'),
    label: 'p3',
    priority: 'P3_HEAVY_BACKGROUND',
    estimatedCostMs: 1,
    createdAt: Date.now(),
    run: () => {
      interactionOrder.push('p3');
    },
  });
  gov4.enqueueTask({
    id: createTaskId('p2'),
    label: 'p2',
    priority: 'P2_LIGHT_BACKGROUND',
    estimatedCostMs: 1,
    createdAt: Date.now(),
    run: () => {
      interactionOrder.push('p2');
    },
  });
  gov4.enqueueTask({
    id: createTaskId('p1'),
    label: 'p1',
    priority: 'P1_CORE_INTERACTION',
    estimatedCostMs: 1,
    createdAt: Date.now(),
    run: () => {
      interactionOrder.push('p1');
    },
  });
  gov4.enqueueTask({
    id: createTaskId('p0'),
    label: 'p0',
    priority: 'P0_VISIBLE_USER_PATH',
    estimatedCostMs: 1,
    createdAt: Date.now(),
    run: () => {
      interactionOrder.push('p0');
    },
  });

  await gov4.runUntilBudgetExhausted(200);
  const state4 = gov4.getState();
  assert(
    '4. Interaction active defers P2/P3/P4 but allows P0/P1',
    interactionOrder.includes('p0') &&
      interactionOrder.includes('p1') &&
      !interactionOrder.includes('p3') &&
      !interactionOrder.includes('p4') &&
      state4.responsivenessState === 'PROTECTED',
    `ran: [${interactionOrder.join(', ')}], responsiveness=${state4.responsivenessState}, queue=${state4.queueLength}`,
  );

  // 5. Stale task cancellation
  resetDevPulseV2TaskGovernorForTests();
  const gov5 = resetDevPulseV2TaskGovernorForTests();
  const staleId = createTaskId('stale');
  gov5.enqueueTask({
    id: staleId,
    label: 'stale-work',
    priority: 'P3_HEAVY_BACKGROUND',
    estimatedCostMs: 1,
    createdAt: Date.now() - 500,
    cancelWhenStale: true,
    staleAfterMs: 100,
    run: () => undefined,
  });
  const cancelled = gov5.cancelStaleTasks();
  assert(
    '5. Stale task cancellation works',
    cancelled === 1 && gov5.getState().cancelledCount >= 1,
    `cancelled=${cancelled}`,
  );

  // 6. Queue size limit
  resetDevPulseV2TaskGovernorForTests();
  const gov6 = resetDevPulseV2TaskGovernorForTests();
  let accepted = 0;
  let rejected = 0;
  for (let i = 0; i < 101; i += 1) {
    const r = gov6.enqueueTask({
      id: createTaskId(`q${i}`),
      label: `q${i}`,
      priority: 'P2_LIGHT_BACKGROUND',
      estimatedCostMs: 1,
      createdAt: Date.now(),
      run: () => undefined,
    });
    if (r.accepted) accepted += 1;
    else rejected += 1;
  }
  assert(
    '6. Queue size limit works',
    accepted === 100 && rejected === 1,
    `accepted=${accepted}, rejected=${rejected}`,
  );

  // 7. Long task warning recorded
  resetDevPulseV2TaskGovernorForTests();
  const gov7 = resetDevPulseV2TaskGovernorForTests();
  gov7.enqueueTask({
    id: createTaskId('long'),
    label: 'long-sync',
    priority: 'P1_CORE_INTERACTION',
    estimatedCostMs: 60,
    createdAt: Date.now(),
    run: () => {
      const start = Date.now();
      while (Date.now() - start < 55) {
        /* sync work */
      }
    },
  });
  await gov7.runNextTask();
  const state7 = gov7.getState();
  assert(
    '7. Long task warning is recorded',
    state7.longTaskCount >= 1 && state7.lastWarning !== null,
    `longTaskCount=${state7.longTaskCount}, warning=${state7.lastWarning}`,
  );

  // 8. Pause/resume works
  resetDevPulseV2TaskGovernorForTests();
  const gov8 = resetDevPulseV2TaskGovernorForTests();
  gov8.pause('maintenance');
  const pausedEnqueue = gov8.enqueueTask({
    id: createTaskId('paused'),
    label: 'paused',
    priority: 'P0_VISIBLE_USER_PATH',
    estimatedCostMs: 1,
    createdAt: Date.now(),
    run: () => undefined,
  });
  gov8.resume('maintenance complete');
  const afterResume = gov8.enqueueTask({
    id: createTaskId('after-resume'),
    label: 'after-resume',
    priority: 'P0_VISIBLE_USER_PATH',
    estimatedCostMs: 1,
    createdAt: Date.now(),
    run: () => undefined,
  });
  assert(
    '8. Pause/resume works',
    !pausedEnqueue.accepted &&
      afterResume.accepted &&
      gov8.getState().paused === false,
    `paused rejected=${!pausedEnqueue.accepted}, after resume accepted=${afterResume.accepted}`,
  );

  // 9. Report includes responsiveness state and founder-readable summary
  resetDevPulseV2TaskGovernorForTests();
  const gov9 = resetDevPulseV2TaskGovernorForTests();
  gov9.setInteractionActive(true, 'chat submit');
  const report = gov9.getReport();
  const reportText = formatTaskGovernorReport(report);
  assert(
    '9. Report includes responsiveness state and founder-readable summary',
    report.responsivenessState === 'PROTECTED' &&
      report.summary.includes('PROTECTED') &&
      reportText.includes('Responsiveness') &&
      reportText.includes('Recommended action'),
    `responsiveness=${report.responsivenessState}`,
  );

  // 10. Foundation enforcement still passes (spawn validate:foundation logic)
  const { execSync } = await import('node:child_process');
  let foundationOutput = '';
  try {
    foundationOutput = execSync('npm run validate:foundation', {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    foundationOutput = (err.stdout ?? '') + (err.stderr ?? '');
  }
  assert(
    '10. Foundation enforcement validator still passes',
    foundationOutput.includes(FOUNDATION_ENFORCEMENT_PASS_TOKEN),
    foundationOutput.includes(FOUNDATION_ENFORCEMENT_PASS_TOKEN)
      ? 'Foundation token present'
      : 'Foundation token missing',
  );

  // Print results
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('==================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(TASK_GOVERNOR_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('TASK GOVERNOR VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
