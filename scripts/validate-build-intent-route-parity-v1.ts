/**
 * Build Intent Route Parity V1 — validation entry script.
 */

import {
  BUILD_INTENT_ROUTE_PARITY_V1_PASS_TOKEN,
  printBuildIntentRouteParityResults,
  runBuildIntentRouteParityValidation,
} from './lib/build-intent-route-parity-validation.js';

async function main(): Promise<void> {
  console.log('');
  console.log('Build Intent Route Parity V1 — Validation');
  console.log('=========================================');
  console.log('');

  const { checks, allPassed } = await runBuildIntentRouteParityValidation();
  const passed = printBuildIntentRouteParityResults(checks);

  if (allPassed && passed === checks.length) {
    console.log(BUILD_INTENT_ROUTE_PARITY_V1_PASS_TOKEN);
    process.exit(0);
  }

  process.exit(1);
}

void main();
