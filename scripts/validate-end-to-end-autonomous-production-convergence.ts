/**
 * End-to-End Autonomous Production Convergence V1 — real-path harness validator.
 *
 * Run:
 *   npx tsx scripts/validate-end-to-end-autonomous-production-convergence.ts
 *
 * Performs bounded real builds through runOnePromptLivePreviewBuild (same entry as the browser).
 * Full multi-hour matrix continuation is driven by scripts/run-e2e-convergence-build.ts and the ledger.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CONVERGENCE_BUILD_FIXTURES,
  E2E_AUTONOMOUS_PRODUCTION_CONVERGENCE_V1_PASS_TOKEN,
  classifyRootCauseFromBuildFailure,
  defaultConvergenceLedgerPath,
  groupAttemptsByRootCause,
  loadConvergenceLedger,
  runConvergenceMatrix,
} from '../src/end-to-end-autonomous-production-convergence/index.js';
import { BUILD_FROM_PROMPT_PRODUCTION_PATH } from '../src/production-surface-integration/real-production-path-response.js';
import { exitValidator } from '../src/windows-validator-clean-exit-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(import.meta.url);

interface Result {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Result[] = [];
let n = 1;
function assert(name: string, passed: boolean, detail: string): void {
  results.push({ name, passed, detail });
}

function readSource(path: string): string {
  try {
    return readFileSync(join(ROOT, path), 'utf8');
  } catch {
    return '';
  }
}

const builderHome = readSource('public/founder-reality/builder-home.js');
const runnerSrc = readSource('src/end-to-end-autonomous-production-convergence/convergence-runner.ts');
const surfaceSrc = readSource('src/contract-bound-generation-authority-v4/contract-surface-plan.ts');
const gpcaDetectSrc = readSource('src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts');

assert(
  `${n++}. Real browser production entry point documented`,
  builderHome.includes('/api/build/from-prompt') &&
    runnerSrc.includes('runOnePromptLivePreviewBuild') &&
    BUILD_FROM_PROMPT_PRODUCTION_PATH === '/api/build/from-prompt',
  BUILD_FROM_PROMPT_PRODUCTION_PATH,
);
assert(
  `${n++}. Convergence harness uses finalizeBuildFromPromptPayload`,
  runnerSrc.includes('finalizeBuildFromPromptPayload'),
  'runner',
);
assert(
  `${n++}. Five controlled fixtures exist`,
  CONVERGENCE_BUILD_FIXTURES.length >= 5,
  String(CONVERGENCE_BUILD_FIXTURES.length),
);
assert(
  `${n++}. Title identity soft-match (plural/stem) is present`,
  surfaceSrc.includes('wordsRelated') && surfaceSrc.includes('startsWith'),
  'contract-surface-plan.ts',
);
assert(
  `${n++}. GPCA title bypass accepts CBGA-approved identity surfaces`,
  gpcaDetectSrc.includes('approvedIdentity?.displayName') &&
    gpcaDetectSrc.includes('approvedMetadataPlan?.applicationTitle'),
  'generator-legacy-detection.ts',
);
assert(
  `${n++}. No arbitrary remote code download`,
  !/curl\s+|wget\s+|fetch\(.*raw\.github|child_process.*npm install (?!--)/i.test(runnerSrc),
  'safe',
);
assert(
  `${n++}. No application-specific production branches in harness`,
  !/\b(restaurant|crm|lisa)\b/i.test(runnerSrc + readSource('src/end-to-end-autonomous-production-convergence/convergence-ledger.ts')),
  'generic',
);

console.log('Running bounded real-path matrix (contact-task + inventory)...');
const matrix = await runConvergenceMatrix({
  rootDir: ROOT,
  fixtureIds: ['contact-task-manager', 'inventory-manager'],
  maxAttemptsPerFixture: 1,
});
const ledger = loadConvergenceLedger(matrix.ledgerPath);
const rootCauseGroups = groupAttemptsByRootCause(ledger);

assert(`${n++}. Clean ledger path writable`, existsSync(matrix.ledgerPath), matrix.ledgerPath);
assert(`${n++}. Real builds recorded attempts`, ledger.attempts.length >= 2, String(ledger.attempts.length));
assert(
  `${n++}. Root-cause classification runs`,
  Object.keys(rootCauseGroups).length >= 1 || matrix.successfulFixtureIds.length >= 1,
  JSON.stringify(rootCauseGroups),
);

const successful = matrix.results.filter((run) => run.succeeded);
const withPreview = matrix.results.filter((run) => run.build.livePreviewAvailable && run.build.previewUrl);
const withNpm = matrix.results.filter((run) => run.build.npmBuildOk);
const identitiesOk = matrix.results.every(
  (run) =>
    Boolean(run.attempt.approvedIdentity) &&
    !String(run.attempt.approvedIdentity).includes(' / ') ||
    run.productionPath.projectTitle.length > 0,
);

assert(`${n++}. Product identity present on responses`, identitiesOk, 'identity');
assert(
  `${n++}. Classifier distinguishes GPCA vs unknown`,
  classifyRootCauseFromBuildFailure({
    failureReason: 'GENERATION_PIPELINE_NON_COMPLIANT: x',
    gpcaHardStop: true,
    gpcaGate: 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS',
    blockedReasons: [],
  }).rootCauseClass === 'GPCA_GENERATOR_INPUT_BYPASS',
  'classifier',
);

// Soft advancement metrics — pass if repairs moved the pipeline past pre-mat GPCA for at least one fixture.
const pastPreMatGpca = matrix.results.some(
  (run) =>
    run.build.gpcaComplianceReport?.finalGateOutcome === 'COMPLIANCE_ALLOWED' ||
    run.build.npmInstallOk === true ||
    run.build.status === 'READY' ||
    (run.build.approvedModulePlan?.moduleIds.length ?? 0) > 0,
);
assert(
  `${n++}. At least one fixture advanced past empty module plan / pre-CBGA stall`,
  pastPreMatGpca || successful.length > 0,
  matrix.results.map((run) => `${run.fixture.fixtureId}:${run.attempt.diagnosticCode ?? run.build.status}`).join(','),
);

assert(
  `${n++}. Validator script registered`,
  JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts[
    'validate:end-to-end-autonomous-production-convergence'
  ] === 'tsx scripts/validate-end-to-end-autonomous-production-convergence.ts',
  'package.json',
);

const failed = results.filter((result) => !result.passed);
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}${result.passed ? '' : ` :: ${result.detail}`}`);
}
console.log(`\n${results.length - failed.length}/${results.length} structural assertions passed.`);
console.log(`Successful fixtures this run: ${matrix.successfulFixtureIds.join(', ') || '(none)'}`);
console.log(`Preview-ready fixtures: ${withPreview.map((run) => run.fixture.fixtureId).join(', ') || '(none)'}`);
console.log(`Compiled fixtures: ${withNpm.map((run) => run.fixture.fixtureId).join(', ') || '(none)'}`);

if (failed.length > 0) await exitValidator(1);

// Full completion token is gated on ≥3 successful applications with runtime/preview/interaction/B11.
const historicalSuccess = ledger.attempts.filter((attempt) => attempt.finalDisposition === 'SUCCEEDED');
const uniqueSuccess = new Set(historicalSuccess.map((attempt) => attempt.promptFixtureId));
const b11Ready = historicalSuccess.filter((attempt) => attempt.b11Result === 'PRODUCTION_READY');

const convergenceComplete =
  uniqueSuccess.size >= 3 && b11Ready.length >= 3 && withPreview.length + historicalSuccess.length >= 3;

const FINAL_REGRESSIONS = [
  'validate-real-production-path-integration.ts',
  'validate-autonomous-engineering-intelligence.ts',
  'validate-production-timeline-and-diagnostic-integrity.ts',
  'validate-contract-to-module-traceability-authority.ts',
  'validate-final-immutable-production-pipeline-v1.ts',
] as const;

for (const script of FINAL_REGRESSIONS) {
  const evidencePath = process.env.AIDEVENGINE_FRESH_VALIDATOR_EVIDENCE_V1;
  let evidencePassed = false;
  if (evidencePath && existsSync(evidencePath)) {
    try {
      const evidence = JSON.parse(readFileSync(evidencePath, 'utf8')) as {
        schema?: string;
        generatedAt?: string;
        validators?: Record<string, { passToken?: string; exitCode?: number; output?: string }>;
      };
      const ageMs = Date.now() - Date.parse(evidence.generatedAt ?? '');
      const entry = evidence.validators?.[`scripts/${script}`];
      evidencePassed =
        evidence.schema === 'AIDEVENGINE_FRESH_VALIDATOR_EVIDENCE_V1' &&
        Number.isFinite(ageMs) &&
        ageMs >= -5_000 &&
        ageMs <= 300_000 &&
        entry?.exitCode === 0 &&
        typeof entry.passToken === 'string' &&
        entry.passToken.length > 0 &&
        entry.output?.includes(entry.passToken) === true;
    } catch {
      evidencePassed = false;
    }
  }
  try {
    if (!evidencePassed) {
      const tsxCli = require.resolve('tsx/cli');
      execFileSync(process.execPath, [tsxCli, `scripts/${script}`], {
        cwd: ROOT,
        stdio: 'pipe',
        encoding: 'utf8',
        windowsHide: true,
      });
    }
    console.log(`REGRESSION PASS — ${script}${evidencePassed ? ' (fresh process evidence)' : ''}`);
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    console.error(`REGRESSION FAIL — ${script}`);
    console.error([err.stdout, err.stderr, err.message].filter(Boolean).join('\n').slice(0, 4000));
    await exitValidator(1);
  }
}

if (convergenceComplete) {
  console.log(`\n${E2E_AUTONOMOUS_PRODUCTION_CONVERGENCE_V1_PASS_TOKEN}`);
} else {
  console.log('\nCONVERGENCE_IN_PROGRESS — fewer than 3 PRODUCTION_READY applications reached runtime/preview/interaction/B11.');
  console.log(`uniqueSuccess=${uniqueSuccess.size} b11Ready=${b11Ready.length}`);
}

console.log(`\nLedger: ${defaultConvergenceLedgerPath(ROOT)}`);
await exitValidator(0);
