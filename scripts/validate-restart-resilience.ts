/**
 * Command Center Restart Resilience V1 — validation entry script.
 */

import {
  COMMAND_CENTER_RESTART_RESILIENCE_V1_PASS_TOKEN,
  printRestartResilienceResults,
  runCommandCenterRestartResilienceValidation,
} from './lib/command-center-restart-resilience-validation.js';

async function main(): Promise<void> {
  console.log('');
  console.log('Command Center Restart Resilience V1 — Validation');
  console.log('=================================================');
  console.log('');

  const { checks, allPassed } = runCommandCenterRestartResilienceValidation();
  const passed = printRestartResilienceResults(checks);

  if (allPassed && passed === checks.length) {
    console.log(COMMAND_CENTER_RESTART_RESILIENCE_V1_PASS_TOKEN);
    process.exit(0);
  }

  process.exit(1);
}

void main();
