/**
 * Mobile Runtime Validation at Scale V1 — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildMobileRuntimeValidationAtScaleV1ReportMarkdown,
  MIN_MOBILE_CATEGORY_COUNT,
  MIN_MOBILE_WORLD2_EXECUTIONS,
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_ARTIFACT_DIR,
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN,
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_REPORT_TITLE,
  MOBILE_RUNTIME_PROFILE_IDS,
  runMobileRuntimeValidationAtScaleV1,
} from '../src/mobile-runtime-validation-at-scale-v1/index.js';
import { buildMobileRuntimeValidationPayload } from '../server/mobile-runtime-validation-handler.js';
import { loadWorld2RegistryFromDisk } from '../src/world2-real-instantiation-v1/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 1_800_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:world2-real-instantiation-v1',
  'validate:large-scale-pipeline-integration-v1',
  'validate:cloud-execution-path-v1',
  'validate:production-readiness-gate-v1',
  'validate:general-purpose-code-generation-v1',
  'validate:uvl-verification-execution-v1',
  'validate:capability-audit-v3-1',
  'validate:validation-runtime-governance-v1',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function main(): void {
  console.log('');
  console.log('Mobile Runtime Validation at Scale V1 — Validation');
  console.log('==================================================');
  console.log('');

  checkpoint('start');

  const requiredFiles = [
    'src/mobile-runtime-validation-at-scale-v1/mobile-runtime-validator.ts',
    'src/mobile-runtime-validation-at-scale-v1/mobile-runtime-validation-assessor.ts',
    'src/mobile-runtime-validation-at-scale-v1/index.ts',
    'server/mobile-runtime-validation-handler.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 2_900_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:mobile-runtime-validation-at-scale-v1']), 'script');
  assert('02. operator section', manifest.includes("'Mobile Runtime Validation'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/mobile-runtime-validation-at-scale-v1'), 'route');
  assert('04. UI mobile pass rate', appJs.includes('Mobile Pass Rate'), 'mobile pass rate');
  assert('05. UI touch interaction', appJs.includes('Touch Interaction Score'), 'touch');
  assert('06. UI navigation score', appJs.includes('Navigation Score'), 'navigation');
  assert('07. UI performance score', appJs.includes('Performance Score'), 'performance score');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`08. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  loadWorld2RegistryFromDisk(ROOT);

  const assessment = runMobileRuntimeValidationAtScaleV1({ projectRootDir: ROOT });
  checkpoint('mobile validation completed');

  const reportMarkdown = buildMobileRuntimeValidationAtScaleV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');
  writeFileSync(join(ROOT, 'MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_REPORT.md'), reportMarkdown, 'utf8');

  assert(
    '09. categories mobile proven',
    assessment.categoriesMobileProven >= MIN_MOBILE_CATEGORY_COUNT,
    `${assessment.categoriesMobileProven}/${MIN_MOBILE_CATEGORY_COUNT}`,
  );

  assert(
    '10. mobile pass rate 100%',
    assessment.mobilePassRate >= 100,
    String(assessment.mobilePassRate),
  );

  assert(
    '11. runtime profiles validated',
    assessment.runtimeProfilesValidated.length >= MOBILE_RUNTIME_PROFILE_IDS.length,
    String(assessment.runtimeProfilesValidated.length),
  );

  assert(
    '12. world2 mobile executions',
    assessment.world2MobileExecutions >= MIN_MOBILE_WORLD2_EXECUTIONS,
    String(assessment.world2MobileExecutions),
  );

  assert(
    '13. touch interaction score',
    assessment.touchInteractionScore >= 50,
    String(assessment.touchInteractionScore),
  );

  assert(
    '14. navigation score',
    assessment.navigationScore >= 45,
    String(assessment.navigationScore),
  );

  assert(
    '15. mobile proof status',
    assessment.mobileProofStatus === 'PROVEN',
    assessment.mobileProofStatus,
  );

  assert(
    '16. pass token',
    assessment.passToken === MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN,
    assessment.passToken,
  );

  assert('17. mobile-proof.json', existsSync(join(ARTIFACT_DIR, 'mobile-proof.json')), 'written');
  assert(
    '18. mobile-category-results.json',
    existsSync(join(ARTIFACT_DIR, 'mobile-category-results.json')),
    'written',
  );
  assert(
    '19. touch-interaction-assessment.json',
    existsSync(join(ARTIFACT_DIR, 'touch-interaction-assessment.json')),
    'written',
  );
  assert(
    '20. mobile-navigation-assessment.json',
    existsSync(join(ARTIFACT_DIR, 'mobile-navigation-assessment.json')),
    'written',
  );
  assert(
    '21. mobile-performance-summary.json',
    existsSync(join(ARTIFACT_DIR, 'mobile-performance-summary.json')),
    'written',
  );
  assert(
    '22. mobile-world2-results.json',
    existsSync(join(ARTIFACT_DIR, 'mobile-world2-results.json')),
    'written',
  );

  const payload = buildMobileRuntimeValidationPayload({ projectRootDir: ROOT, refresh: false });
  assert(
    '23. operator payload',
    payload.categoriesMobileProven >= MIN_MOBILE_CATEGORY_COUNT,
    String(payload.categoriesMobileProven),
  );

  checkpoint('artifacts and operator smoke');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Mobile Runtime Validation at Scale V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN);
  console.log(
    `Mobile: ${assessment.categoriesMobileProven}/${assessment.categoriesValidated} @ ${assessment.mobilePassRate}%`,
  );
}

main();
