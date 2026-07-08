/**
 * Runtime Truth Authority V1 — validation entry script.
 */

import {
  RUNTIME_TRUTH_AUTHORITY_V1_PASS_TOKEN,
  printRtaValidationResults,
  runRuntimeTruthAuthorityValidation,
} from '../src/runtime-truth-authority/rta-validator.js';

async function main(): Promise<void> {
  console.log('');
  console.log('Runtime Truth Authority V1 — Validation');
  console.log('=======================================');
  console.log('');

  const { checks, allPassed } = await runRuntimeTruthAuthorityValidation();
  const passed = printRtaValidationResults(checks);

  if (allPassed && passed === checks.length) {
    console.log(RUNTIME_TRUTH_AUTHORITY_V1_PASS_TOKEN);
    process.exit(0);
  }

  process.exit(1);
}

void main();
