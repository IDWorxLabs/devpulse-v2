/**
 * Autonomous Recovery Authority — validation.
 */
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  AUTONOMOUS_RECOVERY_ENGINE_V1_PASS_TOKEN,
  runAepPhase3Validation,
} from './lib/aep-phase3-validation.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const results = runAepPhase3Validation(ROOT, 'autonomous-recovery-authority');
let passed = 0;
for (const r of results) {
  console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name} — ${r.detail}`);
  if (r.passed) passed += 1;
}
console.log(`${passed}/${results.length} checks passed`);
if (passed === results.length) {
  console.log(AUTONOMOUS_RECOVERY_ENGINE_V1_PASS_TOKEN);
  process.exit(0);
}
process.exit(1);
