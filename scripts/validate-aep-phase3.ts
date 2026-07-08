/**
 * AEP Phase 3 — Autonomous Recovery Engine validation.
 */

import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  AEP_PHASE3_PASS_TOKEN,
  runAepPhase3Validation,
} from './lib/aep-phase3-validation.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const section = process.argv[2];

function main(): void {
  const title = section ? `AEP Phase 3 — ${section}` : 'AEP Phase 3 — Autonomous Recovery Engine';
  console.log('');
  console.log(`${title} — Validation`);
  console.log('='.repeat(title.length + 14));
  console.log('');

  const results = runAepPhase3Validation(ROOT, section);
  let passed = 0;
  for (const result of results) {
    const mark = result.passed ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${result.name} — ${result.detail}`);
    if (result.passed) passed += 1;
  }

  console.log('');
  console.log(`${passed}/${results.length} checks passed`);
  console.log('');

  if (passed === results.length) {
    if (!section) {
      console.log(AEP_PHASE3_PASS_TOKEN);
    }
    process.exit(0);
  }
  process.exit(1);
}

main();
