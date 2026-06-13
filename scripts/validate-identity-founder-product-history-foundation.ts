/**
 * Phase 26.3 — Identity, founder, product, and history memory foundation validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDENTITY_FOUNDATION_PASS_TOKEN } from '../src/identity-foundation/index.js';
import {
  buildDevPulseContextPackage,
  buildLlmSystemInstructions,
  loadProductMemoryFoundations,
  selectOptionalProductMemoryFoundations,
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
  'src/identity-foundation/identity-foundation-types.ts',
  'src/identity-foundation/identity-foundation-registry.ts',
  'src/identity-foundation/identity-foundation-authority.ts',
  'src/founder-foundation/founder-profile.ts',
  'src/founder-foundation/founder-context-authority.ts',
  'src/product-foundation/product-profile.ts',
  'src/product-foundation/product-foundation-authority.ts',
  'src/history-foundation/history-memory-types.ts',
  'src/history-foundation/history-memory-authority.ts',
  'src/history-foundation/history-memory-builder.ts',
  'src/self-evolution-foundation/self-evolution-profile.ts',
  'src/self-evolution-foundation/self-evolution-authority.ts',
  'src/llm-chat-brain/product-memory-foundation-loader.ts',
  'architecture/IDENTITY_FOUNDER_PRODUCT_HISTORY_FOUNDATION_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

// A. Who created you — identity + founder
const creatorPkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'who created you' });
const creatorText = creatorPkg.productMemoryText + creatorPkg.groundedContextText;
assert('A mentions AiDevEngine', /AiDevEngine/i.test(creatorText), 'found');
assert('A mentions Lungelo Richard Zungu', /Lungelo Richard Zungu/i.test(creatorText), 'found');
assert('A mentions Asgard Dynamics', /Asgard Dynamics/i.test(creatorText), 'found');
assert('A identity loaded', creatorPkg.foundationDiagnostics.identityLoaded === true, 'yes');
assert('A founder loaded', creatorPkg.foundationDiagnostics.founderLoaded === true, 'yes');

// B. What company
const companyPkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'what company are you part of' });
assert(
  'B company answer context',
  /Asgard Dynamics/i.test(companyPkg.productMemoryText),
  companyPkg.productMemoryText.match(/Company:.+/)?.[0] ?? 'missing',
);

// C. What is AiDevEngine
const productPkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'what is AiDevEngine' });
assert(
  'C product foundation',
  /AiDevEngine/i.test(productPkg.productMemoryText) &&
    /AI-powered software creation platform/i.test(productPkg.productMemoryText) &&
    !/Current product: DevPulse/i.test(productPkg.productMemoryText),
  'AiDevEngine product profile present',
);
assert('C product loaded always', productPkg.foundationDiagnostics.productLoaded === true, 'yes');
assert(
  'C current product identity diagnostic',
  productPkg.foundationDiagnostics.currentProductIdentity === 'AiDevEngine',
  productPkg.foundationDiagnostics.currentProductIdentity ?? 'missing',
);

// D. What did we fix today — history
const historyOptional = selectOptionalProductMemoryFoundations('what did we fix today');
const historyPkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'what did we fix today' });
assert('D history selected', historyOptional.history === true, String(historyOptional.history));
assert('D history loaded', historyPkg.foundationDiagnostics.historyLoaded === true, 'yes');
assert(
  'D history content',
  historyPkg.productMemoryText.includes('Recent fixes') || historyPkg.productMemoryText.includes('History Foundation'),
  'history section present',
);

// E. Weaknesses — self-evolution
const weaknessOptional = selectOptionalProductMemoryFoundations('what are your weaknesses');
const weaknessPkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'what are your weaknesses' });
assert('E self-evolution selected', weaknessOptional.selfEvolution === true, String(weaknessOptional.selfEvolution));
assert('E self-evolution loaded', weaknessPkg.foundationDiagnostics.selfEvolutionLoaded === true, 'yes');
assert(
  'E weaknesses content',
  /Known weaknesses/i.test(weaknessPkg.productMemoryText) &&
    /Autonomous build execution not fully proven/i.test(weaknessPkg.productMemoryText),
  'self-evolution profile present',
);
assert(
  'E no project vault in optional-only check',
  !weaknessPkg.productMemoryText.includes('Vault project'),
  'product memory only',
);

// F. No consciousness claims in system instructions
const sys = buildLlmSystemInstructions(productPkg);
assert(
  'F no consciousness encouragement',
  /do not claim human consciousness/i.test(sys),
  'explicit rule present',
);
assert(
  'F consciousness disclaimer in context',
  /Not human conscious/i.test(sys) || /notHumanConsciousness/i.test(sys) || /not human conscious/i.test(sys),
  'disclaimer present',
);

// G. No invented founder details beyond registry
const founderBundle = loadProductMemoryFoundations({ message: 'who created you' });
const inventedBio =
  /\b(born in|childhood|married|wife|husband|age \d+|linkedin|twitter)\b/i.test(founderBundle.founderText);
assert('G no invented founder biography', !inventedBio, founderBundle.founderText.slice(0, 80));

// Always-loaded foundations
const defaultPkg = buildDevPulseContextPackage({ rootDir: ROOT, message: 'hello' });
assert('always identity', defaultPkg.foundationDiagnostics.identityLoaded, 'yes');
assert('always founder', defaultPkg.foundationDiagnostics.founderLoaded, 'yes');
assert('always product', defaultPkg.foundationDiagnostics.productLoaded, 'yes');
assert('context included with foundations', defaultPkg.contextIncluded === true, String(defaultPkg.contextIncluded));
assert('foundation versions set', Boolean(defaultPkg.foundationDiagnostics.identityVersion), defaultPkg.foundationDiagnostics.identityVersion ?? 'missing');
assert('legacy identity registered', defaultPkg.foundationDiagnostics.legacyIdentity === 'DevPulse', defaultPkg.foundationDiagnostics.legacyIdentity ?? 'missing');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Identity, Founder, Product & History Foundation Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${IDENTITY_FOUNDATION_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
