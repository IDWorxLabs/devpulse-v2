/**
 * General Windows Process Cleanup V1 — validation entry script.
 */

import {
  awaitManagedProcessCleanup,
  safeProcessExit,
} from '../src/windows-process-cleanup/index.js';
import {
  WINDOWS_PROCESS_CLEANUP_V1_PASS_TOKEN,
  printWindowsProcessCleanupResults,
  runWindowsProcessCleanupSmokeExit,
  runWindowsProcessCleanupValidation,
} from './lib/windows-process-cleanup-validation.js';

async function main(): Promise<void> {
  if (process.argv.includes('--smoke-exit')) {
    await runWindowsProcessCleanupSmokeExit();
    return;
  }

  console.log('');
  console.log('General Windows Process Cleanup V1 — Validation');
  console.log('=================================================');
  console.log('');

  const { checks, allPassed } = await runWindowsProcessCleanupValidation();
  const passed = printWindowsProcessCleanupResults(checks);

  await awaitManagedProcessCleanup();

  if (allPassed && passed === checks.length) {
    console.log(WINDOWS_PROCESS_CLEANUP_V1_PASS_TOKEN);
    await safeProcessExit(0);
  }

  await safeProcessExit(1);
}

void main();
