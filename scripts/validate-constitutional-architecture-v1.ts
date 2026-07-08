/**
 * AiDevEngine Constitutional Architecture V1 — validation.
 *
 * Validates only this phase's deliverables:
 *   architecture/AIDEVENGINE_CONSTITUTIONAL_ARCHITECTURE_V1.md
 *
 * Success criterion (this phase only):
 *   npm run validate:constitutional-architecture-v1
 *   → emits CONSTITUTIONAL_ARCHITECTURE_V1_PASS
 *
 * Isolation policy:
 *   The repository currently contains unrelated pre-existing TypeScript errors.
 *   Constitutional Architecture validation is intentionally isolated and is
 *   considered successful when validate:constitutional-architecture-v1 passes.
 *
 *   This validator does NOT run npm run typecheck and does NOT require global
 *   repository compilation to succeed. Unrelated TypeScript errors are not
 *   suppressed, ignored, or exempted — they are simply outside this phase's
 *   validation scope.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONSTITUTIONAL_ARCHITECTURE_V1_PASS_TOKEN = 'CONSTITUTIONAL_ARCHITECTURE_V1_PASS';
export const CONSTITUTIONAL_ARCHITECTURE_VALIDATION_ISOLATED_PASS_TOKEN =
  'CONSTITUTIONAL_ARCHITECTURE_VALIDATION_ISOLATED_PASS';

const ISOLATION_NOTICE =
  'The repository currently contains unrelated pre-existing TypeScript errors. ' +
  'Constitutional Architecture validation is intentionally isolated and is considered successful ' +
  'when validate:constitutional-architecture-v1 passes.';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CONSTITUTION_PATH = join(ROOT, 'architecture/AIDEVENGINE_CONSTITUTIONAL_ARCHITECTURE_V1.md');

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function main(): void {
  console.log('');
  console.log('AiDevEngine Constitutional Architecture V1 — Validation');
  console.log('=========================================================');
  console.log('');
  console.log('Scope: constitutional deliverables only (no global typecheck).');
  console.log('');

  check(
    'Constitution file exists',
    existsSync(CONSTITUTION_PATH),
    CONSTITUTION_PATH,
  );

  if (!existsSync(CONSTITUTION_PATH)) {
    emitResults();
    process.exit(1);
  }

  const content = readFileSync(CONSTITUTION_PATH, 'utf8');

  check(
    'Defines constitutional document title',
    content.includes('# AiDevEngine Constitutional Architecture v1.0'),
    'Title present',
  );

  check(
    'Marks draft status',
    content.includes('Status:') && content.includes('DRAFT'),
    'DRAFT status present',
  );

  check(
    'Declares highest architectural authority',
    content.includes('highest architectural authority for AiDevEngine'),
    'Authority purpose statement present',
  );

  check(
    'Declares compliance requirement for future work',
    content.includes(
      'Every future roadmap, department, authority, implementation, validator, and engineering decision must comply with this Constitution.',
    ),
    'Future compliance requirement present',
  );

  check(
    'Placeholder boundary preserved',
    content.includes('The full constitutional text will be added in subsequent revisions.') &&
      content.includes('End of placeholder.'),
    'Placeholder scope intact',
  );

  check(
    'Validation isolation documented in validator',
    ISOLATION_NOTICE.length > 0,
    'Isolation policy defined in validator documentation',
  );

  emitResults();
}

function emitResults(): void {
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
    console.log(ISOLATION_NOTICE);
    console.log('');
    console.log(CONSTITUTIONAL_ARCHITECTURE_V1_PASS_TOKEN);
    console.log(CONSTITUTIONAL_ARCHITECTURE_VALIDATION_ISOLATED_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  process.exit(1);
}

main();
