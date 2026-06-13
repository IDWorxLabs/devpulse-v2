/**
 * Phase 26.3.1 — AiDevEngine identity correction validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AIDEVENGINE_IDENTITY_CORRECTION_PASS_TOKEN,
  CURRENT_PRODUCT_NAME,
  LEGACY_PRODUCT_NAME,
  COMPANY_IDENTITY,
  FOUNDER_IDENTITY,
  usesDevPulseAsCurrentIdentity,
} from '../src/identity-foundation/index.js';
import {
  buildDevPulseContextPackage,
  buildLlmSystemInstructions,
} from '../src/llm-chat-brain/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/identity-foundation/legacy-product-identity.ts',
  'architecture/AIDEVENGINE_IDENTITY_CORRECTION_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

// A. Who created you
const creatorPkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'who created you' });
const creatorText = creatorPkg.productMemoryText + (creatorPkg.groundedContextText ?? '');
assert('A AiDevEngine', /AiDevEngine/i.test(creatorText), 'found');
assert('A Lungelo Richard Zungu', /Lungelo Richard Zungu/i.test(creatorText), 'found');
assert('A Asgard Dynamics', /Asgard Dynamics/i.test(creatorText), 'found');

// B. Company
const companyPkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'what company are you part of' });
assert('B Asgard Dynamics', companyPkg.productMemoryText.includes(COMPANY_IDENTITY), COMPANY_IDENTITY);

// C. What is AiDevEngine
const aiPkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'what is AiDevEngine' });
assert(
  'C current product description',
  aiPkg.productMemoryText.includes('Current product: AiDevEngine') &&
    /AI-powered software creation platform/i.test(aiPkg.productMemoryText),
  aiPkg.productMemoryText.match(/Description:.+/)?.[0] ?? 'missing',
);

// D. What is DevPulse — historical
const legacyPkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'what is DevPulse' });
assert(
  'D legacy explanation',
  legacyPkg.productMemoryText.includes('Legacy product name') &&
    legacyPkg.productMemoryText.includes(LEGACY_PRODUCT_NAME) &&
    legacyPkg.productMemoryText.includes('historical'),
  'legacy markers present',
);
assert(
  'D history loaded for legacy question',
  legacyPkg.foundationDiagnostics.historyLoaded === true,
  String(legacyPkg.foundationDiagnostics.historyLoaded),
);

// E. Current identity must not resolve to DevPulse
const sys = buildLlmSystemInstructions(aiPkg);
assert(
  'E system instructions current product',
  sys.includes(CURRENT_PRODUCT_NAME) && /historical development name/i.test(sys),
  'AiDevEngine current, DevPulse historical',
);
assert(
  'E no DevPulse ecosystem intro',
  !usesDevPulseAsCurrentIdentity(sys),
  'system instructions clean',
);
assert(
  'E identity foundation current name',
  creatorPkg.foundationDiagnostics.currentProductIdentity === CURRENT_PRODUCT_NAME,
  creatorPkg.foundationDiagnostics.currentProductIdentity ?? 'missing',
);
assert(
  'E product profile not DevPulse',
  !/Current product: DevPulse/i.test(aiPkg.productMemoryText),
  'product is AiDevEngine',
);

// Diagnostics
assert(
  'diagnostics founder identity',
  creatorPkg.foundationDiagnostics.founderIdentity === FOUNDER_IDENTITY,
  creatorPkg.foundationDiagnostics.founderIdentity ?? 'missing',
);
assert(
  'diagnostics legacy identity',
  creatorPkg.foundationDiagnostics.legacyIdentity === LEGACY_PRODUCT_NAME,
  creatorPkg.foundationDiagnostics.legacyIdentity ?? 'missing',
);

const failed = results.filter((r) => !r.passed);
console.log('\n--- AiDevEngine Identity Correction Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${AIDEVENGINE_IDENTITY_CORRECTION_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
