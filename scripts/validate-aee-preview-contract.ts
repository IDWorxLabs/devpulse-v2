/**
 * AEE Preview Unlock and Degraded Preview Contract V1 — validation entry script.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AEE_PREVIEW_CONTRACT_V1_PASS_TOKEN,
  printAeePreviewContractResults,
  runAeePreviewContractValidation,
} from './lib/aee-preview-contract-validation.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

async function main(): Promise<void> {
  console.log('');
  console.log('AEE Preview Unlock and Degraded Preview Contract V1 — Validation');
  console.log('================================================================');
  console.log('Matrix: expense tracker, SaaS CRM, AI chat (source: api)');
  console.log('');

  const { checks, rows, allPassed } = await runAeePreviewContractValidation(ROOT);
  const passed = printAeePreviewContractResults(checks, rows);

  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  console.log('');

  if (allPassed && passed === checks.length) {
    console.log(AEE_PREVIEW_CONTRACT_V1_PASS_TOKEN);
    process.exit(0);
  }

  process.exit(1);
}

void main();
