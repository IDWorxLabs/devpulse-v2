/**
 * AEE Build AutoFix Loop V1 — validation entry script.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AEE_BUILD_AUTOFIX_LOOP_V1_PASS_TOKEN,
  printAeeBuildAutofixLoopResults,
  runAeeBuildAutofixLoopValidation,
} from './lib/aee-build-autofix-loop-validation.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

async function main(): Promise<void> {
  console.log('');
  console.log('AEE Build AutoFix Loop V1 — Validation');
  console.log('======================================');
  console.log('Matrix: expense tracker, SaaS CRM, AI chat (source: validator + simulated compile fault)');
  console.log('');

  const { checks, rows, allPassed } = await runAeeBuildAutofixLoopValidation(ROOT);
  const passed = printAeeBuildAutofixLoopResults(checks, rows);

  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  console.log('');

  if (allPassed && passed === checks.length) {
    console.log(AEE_BUILD_AUTOFIX_LOOP_V1_PASS_TOKEN);
    process.exit(0);
  }

  process.exit(1);
}

void main();
