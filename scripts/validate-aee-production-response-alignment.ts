/**
 * AEE Production Response Alignment V1 — validation entry script.
 */

import {
  AEE_PRODUCTION_RESPONSE_ALIGNMENT_V1_PASS_TOKEN,
  printAeeProductionResponseAlignmentResults,
  runAeeProductionResponseAlignmentValidation,
} from './lib/aee-production-response-alignment-validation.js';

async function main(): Promise<void> {
  console.log('');
  console.log('AEE Production Response Alignment V1 — Validation');
  console.log('=================================================');
  console.log('');

  const { checks, allPassed } = await runAeeProductionResponseAlignmentValidation();
  const passed = printAeeProductionResponseAlignmentResults(checks);

  if (allPassed && passed === checks.length) {
    console.log(AEE_PRODUCTION_RESPONSE_ALIGNMENT_V1_PASS_TOKEN);
    process.exit(0);
  }

  process.exit(1);
}

void main();
