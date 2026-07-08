import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { ENGINEERING_CONTINUATION_V1_PASS_TOKEN, runAepPhase3Validation } from './lib/aep-phase3-validation.js';
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const results = runAepPhase3Validation(ROOT, 'engineering-continuation');
let passed = results.filter((r) => r.passed).length;
console.log(`${passed}/${results.length} checks passed`);
if (passed === results.length) { console.log(ENGINEERING_CONTINUATION_V1_PASS_TOKEN); process.exit(0); }
process.exit(1);
