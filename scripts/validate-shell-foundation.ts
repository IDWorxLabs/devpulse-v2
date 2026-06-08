/**
 * DevPulse V2 Shell Foundation — validation scenarios.
 * VALIDATION_MODE: FULL_STACK_CHECK
 */

import { execSync } from 'node:child_process';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import {
  getDevPulseV2Owner,
  listDevPulseV2Owners,
} from '../src/foundation/ownership-registry.js';
import { FOUNDATION_ENFORCEMENT_PASS_TOKEN } from '../src/foundation/types.js';
import { TASK_GOVERNOR_PASS_TOKEN } from '../src/task-governor/types.js';
import {
  getClickabilityReport,
  markShellClickable,
  markShellVisible,
} from '../src/shell/clickability-tracker.js';
import {
  DevPulseV2ShellAuthority,
  resetDevPulseV2ShellAuthorityForTests,
} from '../src/shell/shell-authority.js';
import {
  buildShellReport,
  formatShellReport,
} from '../src/shell/shell-report.js';
import { getShellSurfaceSnapshot } from '../src/shell/shell-surface.js';
import {
  SHELL_CONSTITUTIONAL_TARGETS,
  SHELL_OWNER_MODULE,
  SHELL_PASS_TOKEN,
} from '../src/shell/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function runNpmScript(script: string, token: string): boolean {
  try {
    const output = execSync(`npm run ${script}`, {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    return output.includes(token);
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return ((err.stdout ?? '') + (err.stderr ?? '')).includes(token);
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Shell Foundation Validation');
  console.log('==========================================');
  console.log('');

  // 1. Build gate accepts shell Phase 1 packet
  const buildGate = runDevPulseV2BuildGate({
    phase: 1,
    systems: ['shell'],
    eagerModuleCount: 2,
    answerAuthorities: [],
    browserVerificationPresent: false,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts shell Phase 1 packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary + (buildGate.warningCount ? ` (${buildGate.warningCount} warning(s))` : ''),
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  // 2. Shell authority exists
  const authority = resetDevPulseV2ShellAuthorityForTests();
  assert(
    '2. Shell authority exists',
    authority instanceof DevPulseV2ShellAuthority,
    `ownerModule=${DevPulseV2ShellAuthority.ownerModule}`,
  );

  // 3. Ownership registry contains shell authority
  const shellOwner = getDevPulseV2Owner('shell_authority');
  const registryHasShell = listDevPulseV2Owners().some(
    (o) => o.domain === 'shell_authority' && o.ownerModule === SHELL_OWNER_MODULE,
  );
  assert(
    '3. Ownership registry contains shell authority',
    shellOwner.ownerModule === SHELL_OWNER_MODULE &&
      DevPulseV2ShellAuthority.assertRegistryOwnership() &&
      registryHasShell,
    `registered=${shellOwner.ownerModule}`,
  );

  // 4. Shell starts in BOOTING
  const bootState = authority.getState();
  assert(
    '4. Shell starts in BOOTING',
    bootState.status === 'BOOTING' && bootState.startupId.length > 0,
    `status=${bootState.status}`,
  );

  // 5. markShellVisible works
  const startedAt = Date.now();
  resetDevPulseV2ShellAuthorityForTests(startedAt);
  markShellVisible(startedAt + 100);
  const visibleReport = getClickabilityReport();
  assert(
    '5. markShellVisible works',
    visibleReport.visibleAt === startedAt + 100 && visibleReport.clickabilityState === 'pending',
    `visibleAt=${visibleReport.visibleAt}`,
  );

  // 6. markShellClickable works
  markShellClickable(startedAt + 300);
  const clickableReport = getClickabilityReport();
  assert(
    '6. markShellClickable works',
    clickableReport.clickabilityState === 'achieved' &&
      clickableReport.clickabilityAchievedAt === startedAt + 300,
    `clickability=${clickableReport.clickabilityState}`,
  );

  // 7. Visible timing calculated
  assert(
    '7. Visible timing calculated',
    clickableReport.visibleMs === 100,
    `visibleMs=${clickableReport.visibleMs}`,
  );

  // 8. Clickable timing calculated
  assert(
    '8. Clickable timing calculated',
    clickableReport.clickableMs === 300,
    `clickableMs=${clickableReport.clickableMs}`,
  );

  // 9. Shell report generated
  const bootAuthority = resetDevPulseV2ShellAuthorityForTests(startedAt);
  await bootAuthority.bootShell();
  const finalState = bootAuthority.getState();
  const report = buildShellReport(finalState, bootAuthority.getGovernorUsage());
  const reportText = formatShellReport(report);
  assert(
    '9. Shell report generated',
    reportText.includes('Shell Foundation Report') &&
      reportText.includes('Constitutional targets') &&
      report.summary.length > 0,
    report.summary,
  );

  // Surface placeholders only
  const surface = getShellSurfaceSnapshot({ title: 'DevPulse V2', status: 'READY' });
  assert(
    '9b. Shell surface has placeholders only',
    surface.hasChatPlaceholder &&
      surface.hasFeedPlaceholder &&
      surface.hasPrimaryControl &&
      !surface.html.includes('diagnostic'),
    'placeholders present, no diagnostics',
  );

  // 10. Task Governor used for startup work
  const usage = bootAuthority.getGovernorUsage();
  assert(
    '10. Task Governor used for startup work',
    usage.usedTaskGovernor &&
      usage.p0Tasks >= 1 &&
      usage.p1Tasks >= 1 &&
      usage.p3Tasks === 0 &&
      usage.p4Tasks === 0,
    `P0=${usage.p0Tasks} P1=${usage.p1Tasks} P3=${usage.p3Tasks} P4=${usage.p4Tasks}`,
  );

  // Constitutional targets met in fast boot
  assert(
    '10b. Fast boot meets constitutional targets',
    (finalState.visibleMs ?? 9999) <= SHELL_CONSTITUTIONAL_TARGETS.visibleTargetMs &&
      (finalState.clickableMs ?? 9999) <= SHELL_CONSTITUTIONAL_TARGETS.clickableTargetMs,
    `visible=${finalState.visibleMs}ms clickable=${finalState.clickableMs}ms`,
  );

  // 11. Foundation enforcement still passes
  assert(
    '11. Foundation Enforcement Layer still passes',
    runNpmScript('validate:foundation', FOUNDATION_ENFORCEMENT_PASS_TOKEN),
    'Foundation token verified',
  );

  // 12. Task Governor validation still passes
  assert(
    '12. Task Governor validation still passes',
    runNpmScript('validate:task-governor', TASK_GOVERNOR_PASS_TOKEN),
    'Task Governor token verified',
  );

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('==========================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(SHELL_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('SHELL FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
