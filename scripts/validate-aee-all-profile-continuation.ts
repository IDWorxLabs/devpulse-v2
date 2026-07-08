/**
 * AEE All Profile Continuation V1 — validation entry script.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AEE_ALL_PROFILE_CONTINUATION_V1_PASS_TOKEN,
  printAeeAllProfileContinuationResults,
  runAeeAllProfileContinuationValidation,
} from './lib/aee-all-profile-continuation-validation.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

async function main(): Promise<void> {
  console.log('');
  console.log('AEE All Profile Continuation V1 — Validation');
  console.log('============================================');
  console.log('Matrix: expense tracker, SaaS CRM, AI chat, HR/admin (source: api)');
  console.log('');

  const { checks, rows, allPassed } = await runAeeAllProfileContinuationValidation(ROOT);
  const passed = printAeeAllProfileContinuationResults(checks, rows);

  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  console.log('');

  if (allPassed && passed === checks.length) {
    console.log(AEE_ALL_PROFILE_CONTINUATION_V1_PASS_TOKEN);
    process.exit(0);
  }

  process.exit(1);
}

void main();
