/**
 * Registry Sovereignty V1 — validation entry script.
 */

import {
  REGISTRY_SOVEREIGNTY_V1_PASS_TOKEN,
  printRegistrySovereigntyResults,
  runRegistrySovereigntyValidation,
} from './lib/registry-sovereignty-validation.js';

async function main(): Promise<void> {
  console.log('');
  console.log('Registry Sovereignty V1 — Validation');
  console.log('=====================================');
  console.log('');

  const { checks, allPassed } = await runRegistrySovereigntyValidation();
  const passed = printRegistrySovereigntyResults(checks);

  if (allPassed && passed === checks.length) {
    console.log(REGISTRY_SOVEREIGNTY_V1_PASS_TOKEN);
    process.exit(0);
  }

  process.exit(1);
}

void main();
