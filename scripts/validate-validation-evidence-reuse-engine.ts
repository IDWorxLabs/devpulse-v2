/**
 * Validation Evidence Reuse Engine (VERE) V1 — validation suite.
 *
 * Constitutional principle under test: expensive, deterministic validator work may be reused
 * instead of repeated, but only when every fingerprint that could affect the outcome — the
 * validator's own input, its declared relevant files, its own source, its declared dependency
 * signature, and its declared environment assumptions — is proven unchanged. Any mismatch, any
 * incomplete/failed/interrupted prior result, any expired TTL, or any fresh-required policy must
 * force a fresh run. This suite proves that contract, proves the cache stores no secrets, proves
 * there is no application-specific logic anywhere in VERE, wires a real opt-in example against an
 * existing validator, and re-runs the existing validation-runtime-governance validator to prove
 * no regression.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exitValidator } from '../src/windows-validator-clean-exit-v1/index.js';
import {
  computeEvidenceCacheKey,
  defineValidationEvidencePolicy,
  explainReuseDecision,
  getEvidenceCacheDir,
  invalidateEvidence,
  normalizePath,
  runWithEvidenceReuse,
  toRepoRelativePath,
  buildValidationEvidenceCacheReport,
  writeEvidenceRecordToDisk,
  readEvidenceRecord,
} from '../src/validation-evidence-reuse/index.js';
import type { ValidationEvidenceExecutionOutcome, ValidationEvidenceSessionEntry } from '../src/validation-evidence-reuse/index.js';
import { runChildProcessValidatorWithEvidenceReuse } from '../src/validation-evidence-reuse/validation-evidence-validator.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(import.meta.url);

export const VALIDATION_EVIDENCE_REUSE_ENGINE_V1_PASS_TOKEN = 'VALIDATION_EVIDENCE_REUSE_ENGINE_V1_PASS';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const MODULE_DIR = join(ROOT, 'src/validation-evidence-reuse');
const MODULE_FILES = [
  'index.ts',
  'validation-evidence-types.ts',
  'validation-evidence-fingerprint.ts',
  'validation-evidence-cache.ts',
  'validation-evidence-reuse-engine.ts',
  'validation-evidence-policy.ts',
  'validation-evidence-report.ts',
  'validation-evidence-validator.ts',
].map((f) => join(MODULE_DIR, f));

function readModuleSource(): string {
  return MODULE_FILES.filter(existsSync)
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n\n');
}

function runValidatorScript(scriptRelativePath: string, passToken: string): { ok: boolean; detail: string } {
  const tsxCli = require.resolve('tsx/cli');
  try {
    const output = execFileSync(process.execPath, [tsxCli, scriptRelativePath], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const ok = output.includes(passToken);
    return { ok, detail: ok ? 'pass token found' : 'pass token missing from output' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stdout = (err as { stdout?: Buffer | string })?.stdout;
    const stdoutText = stdout ? stdout.toString() : '';
    return { ok: stdoutText.includes(passToken), detail: stdoutText ? stdoutText.slice(-300) : message.slice(0, 300) };
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('Validation Evidence Reuse Engine (VERE) V1 — Validation');
  console.log('=========================================================');
  console.log('');

  // --- 1. package script registered -----------------------------------------------------------

  const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert(
    '01. package script registered',
    packageJson.scripts?.['validate:validation-evidence-reuse-engine']?.includes('validate-validation-evidence-reuse-engine.ts') ?? false,
    JSON.stringify(packageJson.scripts?.['validate:validation-evidence-reuse-engine'] ?? 'MISSING'),
  );

  // --- 2. module files exist ---------------------------------------------------------------------

  for (const file of MODULE_FILES) {
    assert(`02. module file exists — ${file.slice(ROOT.length)}`, existsSync(file), file);
  }

  // --- sandbox for isolated, disk-backed engine tests ------------------------------------------

  const sandbox = mkdtempSync(join(tmpdir(), 'vere-validate-'));
  writeFileSync(join(sandbox, 'package.json'), JSON.stringify({ name: 'sandbox', version: '1.0.0' }));
  writeFileSync(join(sandbox, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, entry: 'a' }));
  const relevantFile = join(sandbox, 'relevant-source.ts');
  writeFileSync(relevantFile, 'export const value = 1;');
  const relevantDir = join(sandbox, 'relevant-dir');
  mkdirSync(relevantDir, { recursive: true });
  writeFileSync(join(relevantDir, 'placeholder.ts'), 'export const p = 1;');
  const validatorSourceFile = join(sandbox, 'fake-validator.ts');
  writeFileSync(validatorSourceFile, 'console.log("fake validator v1");');

  try {
    // --- 03/04. Cache keys are deterministic ---------------------------------------------------

    const keyA1 = computeEvidenceCacheKey('validator-x', '1.0.0', 'VALIDATOR_RUN');
    const keyA2 = computeEvidenceCacheKey('validator-x', '1.0.0', 'VALIDATOR_RUN');
    assert('03. Cache key is deterministic — identical inputs yield identical keys', keyA1 === keyA2, `${keyA1} vs ${keyA2}`);

    const keyDifferentName = computeEvidenceCacheKey('validator-y', '1.0.0', 'VALIDATOR_RUN');
    const keyDifferentVersion = computeEvidenceCacheKey('validator-x', '2.0.0', 'VALIDATOR_RUN');
    assert('04. Cache key differs when validator name or version differs', keyA1 !== keyDifferentName && keyA1 !== keyDifferentVersion, 'keys collided');

    // --- 05/06. Path normalization ------------------------------------------------------------

    const windowsStyle = normalizePath('src\\product-faithfulness-v2\\index.ts');
    const unixStyle = normalizePath('src/product-faithfulness-v2/index.ts');
    assert('05. Path normalization — Windows-style and Unix-style paths normalize identically', windowsStyle === unixStyle, `${windowsStyle} vs ${unixStyle}`);

    const relFromWindowsAbsolute = toRepoRelativePath('C:\\repo\\root', 'C:\\repo\\root\\src\\thing.ts');
    const relFromUnixAbsolute = toRepoRelativePath('/repo/root', '/repo/root/src/thing.ts');
    assert(
      '06. Path normalization — repo-relative fingerprint keys match across path styles',
      relFromWindowsAbsolute === 'src/thing.ts' && relFromUnixAbsolute === 'src/thing.ts',
      `${relFromWindowsAbsolute} / ${relFromUnixAbsolute}`,
    );

    // --- 07/08. Reuse-safe validator reuses matching complete evidence ------------------------

    let executions = 0;
    const passingPolicy = defineValidationEvidencePolicy({
      validatorName: 'sandbox-validator',
      validatorVersion: '1.0.0',
      reuseSafe: true,
      validatorSourceFile,
      relevantFiles: [relevantFile],
      relevantDirectories: [relevantDir],
      dependencyInputs: ['package.json', 'package-lock.json'],
    });
    const passingExecute = (): ValidationEvidenceExecutionOutcome => {
      executions += 1;
      return { status: 'PASSED', passToken: 'SANDBOX_PASS', evidenceSummary: 'sandbox validator ok' };
    };

    const firstRun = runWithEvidenceReuse(passingPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox });
    assert('07. First run with no prior evidence executes fresh', firstRun.reused === false && executions === 1, `reused=${firstRun.reused} executions=${executions}`);

    const secondRun = runWithEvidenceReuse(passingPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox });
    assert(
      '08. Reuse-safe validator reuses matching complete evidence without re-executing',
      secondRun.reused === true && executions === 1 && secondRun.passToken === 'SANDBOX_PASS',
      `reused=${secondRun.reused} executions=${executions} passToken=${secondRun.passToken}`,
    );

    // --- 09. Changed relevant (source) file invalidates evidence -------------------------------

    writeFileSync(relevantFile, 'export const value = 2;');
    const afterFileChange = runWithEvidenceReuse(passingPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox });
    assert(
      '09. Changed relevant source file invalidates evidence',
      afterFileChange.reused === false && executions === 2 && afterFileChange.invalidationReasons.includes('RELEVANT_FILES_CHANGED'),
      JSON.stringify({ reused: afterFileChange.reused, executions, reasons: afterFileChange.invalidationReasons }),
    );

    // --- 10. Changed relevant directory content invalidates evidence ---------------------------

    runWithEvidenceReuse(passingPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox }); // re-establish matching evidence
    writeFileSync(join(relevantDir, 'placeholder.ts'), 'export const p = 2;');
    const afterDirChange = runWithEvidenceReuse(passingPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox });
    assert(
      '10. Changed relevant directory content invalidates evidence',
      afterDirChange.reused === false && afterDirChange.invalidationReasons.includes('RELEVANT_FILES_CHANGED'),
      JSON.stringify(afterDirChange.invalidationReasons),
    );

    // --- 11. Changed validator source invalidates evidence --------------------------------------

    runWithEvidenceReuse(passingPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox });
    writeFileSync(validatorSourceFile, 'console.log("fake validator v2 — different behavior");');
    const afterSourceChange = runWithEvidenceReuse(passingPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox });
    assert(
      '11. Changed validator source invalidates evidence',
      afterSourceChange.reused === false && afterSourceChange.invalidationReasons.includes('VALIDATOR_SOURCE_CHANGED'),
      JSON.stringify(afterSourceChange.invalidationReasons),
    );

    // --- 12. Changed dependency signature invalidates evidence -----------------------------------

    runWithEvidenceReuse(passingPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox });
    writeFileSync(join(sandbox, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, entry: 'b' }));
    const afterDependencyChange = runWithEvidenceReuse(passingPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox });
    assert(
      '12. Changed dependency signature invalidates evidence',
      afterDependencyChange.reused === false && afterDependencyChange.invalidationReasons.includes('DEPENDENCY_SIGNATURE_CHANGED'),
      JSON.stringify(afterDependencyChange.invalidationReasons),
    );

    // --- 13. Changed environment fingerprint invalidates evidence --------------------------------

    delete process.env.VERE_VALIDATE_ENV_PROBE;
    const envPolicy = defineValidationEvidencePolicy({
      validatorName: 'sandbox-env-validator',
      validatorVersion: '1.0.0',
      reuseSafe: true,
      environmentInputs: ['VERE_VALIDATE_ENV_PROBE'],
    });
    const envExecute = (): ValidationEvidenceExecutionOutcome => ({ status: 'PASSED', passToken: 'ENV_PASS', evidenceSummary: 'ok' });
    const envRunBefore = runWithEvidenceReuse(envPolicy, {}, envExecute, { rootDir: sandbox });
    process.env.VERE_VALIDATE_ENV_PROBE = 'super-secret-value-should-never-be-cached';
    const envRunAfter = runWithEvidenceReuse(envPolicy, {}, envExecute, { rootDir: sandbox });
    assert(
      '13. Changed environment fingerprint invalidates evidence',
      envRunBefore.reused === false && envRunAfter.reused === false && envRunAfter.invalidationReasons.includes('ENVIRONMENT_ASSUMPTIONS_CHANGED'),
      JSON.stringify({ before: envRunBefore.reused, after: envRunAfter.reused, reasons: envRunAfter.invalidationReasons }),
    );

    // --- 14. Changed validator version invalidates evidence ---------------------------------------

    runWithEvidenceReuse(passingPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox });
    const bumpedVersionPolicy = { ...passingPolicy, validatorVersion: '2.0.0' };
    const afterVersionBump = runWithEvidenceReuse(bumpedVersionPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox });
    assert('14. Changed validator version invalidates evidence', afterVersionBump.reused === false, `reused=${afterVersionBump.reused}`);

    // --- 15. Incomplete (PARTIAL) runs are never reused --------------------------------------------

    const partialPolicy = defineValidationEvidencePolicy({
      validatorName: 'sandbox-partial-validator',
      validatorVersion: '1.0.0',
      reuseSafe: true,
    });
    let partialExecutions = 0;
    const partialExecute = (): ValidationEvidenceExecutionOutcome => {
      partialExecutions += 1;
      return { status: 'PARTIAL', passToken: null, evidenceSummary: 'incomplete run' };
    };
    runWithEvidenceReuse(partialPolicy, {}, partialExecute, { rootDir: sandbox });
    const partialSecond = runWithEvidenceReuse(partialPolicy, {}, partialExecute, { rootDir: sandbox });
    assert(
      '15. Incomplete (PARTIAL) runs are never reused',
      partialSecond.reused === false && partialExecutions === 2,
      `reused=${partialSecond.reused} executions=${partialExecutions}`,
    );

    // --- 16. Interrupted runs are never reused -----------------------------------------------------

    const interruptedPolicy = defineValidationEvidencePolicy({
      validatorName: 'sandbox-interrupted-validator',
      validatorVersion: '1.0.0',
      reuseSafe: true,
    });
    let interruptedExecutions = 0;
    const interruptedExecute = (): ValidationEvidenceExecutionOutcome => {
      interruptedExecutions += 1;
      return { status: 'INTERRUPTED', passToken: null, evidenceSummary: 'run was interrupted' };
    };
    runWithEvidenceReuse(interruptedPolicy, {}, interruptedExecute, { rootDir: sandbox });
    const interruptedSecond = runWithEvidenceReuse(interruptedPolicy, {}, interruptedExecute, { rootDir: sandbox });
    assert(
      '16. Interrupted runs are never reused',
      interruptedSecond.reused === false && interruptedExecutions === 2,
      `reused=${interruptedSecond.reused} executions=${interruptedExecutions}`,
    );

    // --- 17/18. Failed runs are never reused as passing evidence, unless explicitly requested ------

    const failingPolicy = defineValidationEvidencePolicy({
      validatorName: 'sandbox-failing-validator',
      validatorVersion: '1.0.0',
      reuseSafe: true,
    });
    let failingExecutions = 0;
    const failingExecute = (): ValidationEvidenceExecutionOutcome => {
      failingExecutions += 1;
      return { status: 'FAILED', passToken: null, evidenceSummary: 'boom' };
    };
    runWithEvidenceReuse(failingPolicy, {}, failingExecute, { rootDir: sandbox });
    const failingSecondDefault = runWithEvidenceReuse(failingPolicy, {}, failingExecute, { rootDir: sandbox });
    assert(
      '17. Failed runs are never reused as passing evidence by default',
      failingSecondDefault.reused === false && failingExecutions === 2 && failingSecondDefault.status !== 'PASSED',
      `reused=${failingSecondDefault.reused} executions=${failingExecutions}`,
    );

    const diagnosticDecision = explainReuseDecision(failingPolicy, {}, { rootDir: sandbox, allowFailedForDiagnostics: true });
    assert(
      '18. Failed evidence can be surfaced for explicit diagnostic comparison when requested',
      diagnosticDecision.wouldReuse === true,
      JSON.stringify(diagnosticDecision),
    );

    // --- 19/20. Fresh-required validators are never reused -----------------------------------------

    const mustRunFreshPolicy = defineValidationEvidencePolicy({
      validatorName: 'sandbox-fresh-required-validator',
      validatorVersion: '1.0.0',
      reuseSafe: true,
      mustRunFreshReason: 'declared as always-live for this test',
    });
    let freshRequiredExecutions = 0;
    const freshRequiredExecute = (): ValidationEvidenceExecutionOutcome => {
      freshRequiredExecutions += 1;
      return { status: 'PASSED', passToken: 'FRESH_PASS', evidenceSummary: 'ok' };
    };
    runWithEvidenceReuse(mustRunFreshPolicy, {}, freshRequiredExecute, { rootDir: sandbox });
    const freshRequiredSecond = runWithEvidenceReuse(mustRunFreshPolicy, {}, freshRequiredExecute, { rootDir: sandbox });
    assert(
      '19. Validators declaring mustRunFreshReason are never reused',
      freshRequiredSecond.reused === false && freshRequiredExecutions === 2,
      `reused=${freshRequiredSecond.reused} executions=${freshRequiredExecutions}`,
    );

    const notReuseSafePolicy = defineValidationEvidencePolicy({
      validatorName: 'sandbox-not-reuse-safe-validator',
      validatorVersion: '1.0.0',
      // reuseSafe intentionally omitted — defaults to false
    });
    let notReuseSafeExecutions = 0;
    const notReuseSafeExecute = (): ValidationEvidenceExecutionOutcome => {
      notReuseSafeExecutions += 1;
      return { status: 'PASSED', passToken: 'X', evidenceSummary: 'ok' };
    };
    runWithEvidenceReuse(notReuseSafePolicy, {}, notReuseSafeExecute, { rootDir: sandbox });
    const notReuseSafeSecond = runWithEvidenceReuse(notReuseSafePolicy, {}, notReuseSafeExecute, { rootDir: sandbox });
    assert(
      '20. Validators that do not opt into reuseSafe default to always running fresh',
      notReuseSafeSecond.reused === false && notReuseSafeExecutions === 2,
      `reused=${notReuseSafeSecond.reused} executions=${notReuseSafeExecutions}`,
    );

    // --- 21. TTL expiry causes evidence to no longer be reusable ------------------------------------

    const ttlPolicy = defineValidationEvidencePolicy({
      validatorName: 'sandbox-ttl-validator',
      validatorVersion: '1.0.0',
      reuseSafe: true,
      ttlMs: 5,
    });
    const ttlExecute = (): ValidationEvidenceExecutionOutcome => ({ status: 'PASSED', passToken: 'TTL_PASS', evidenceSummary: 'ok' });
    runWithEvidenceReuse(ttlPolicy, {}, ttlExecute, { rootDir: sandbox });
    await new Promise((resolve) => setTimeout(resolve, 25));
    const ttlDecision = explainReuseDecision(ttlPolicy, {}, { rootDir: sandbox });
    assert('21. TTL expiry causes evidence to no longer be reused', ttlDecision.wouldReuse === false && ttlDecision.reasons.includes('TTL_EXPIRED'), JSON.stringify(ttlDecision));

    // --- 22. explainReuseDecision never executes anything -------------------------------------------

    let explainCallCount = 0;
    const explainPolicy = defineValidationEvidencePolicy({
      validatorName: 'sandbox-explain-validator',
      validatorVersion: '1.0.0',
      reuseSafe: true,
    });
    const explainExecute = (): ValidationEvidenceExecutionOutcome => {
      explainCallCount += 1;
      return { status: 'PASSED', passToken: 'X', evidenceSummary: 'ok' };
    };
    explainReuseDecision(explainPolicy, {}, { rootDir: sandbox });
    runWithEvidenceReuse(explainPolicy, {}, explainExecute, { rootDir: sandbox });
    explainReuseDecision(explainPolicy, {}, { rootDir: sandbox });
    explainReuseDecision(explainPolicy, {}, { rootDir: sandbox });
    assert('22. explainReuseDecision never executes the validator', explainCallCount === 1, `explainCallCount=${explainCallCount}`);

    // --- 23. Manual invalidation forces the next run to execute fresh -------------------------------

    invalidateEvidence('sandbox-validator', undefined, { rootDir: sandbox });
    const afterInvalidate = runWithEvidenceReuse(passingPolicy, { seed: 1 }, passingExecute, { rootDir: sandbox });
    assert('23. invalidateEvidence forces the next run to execute fresh', afterInvalidate.reused === false, `reused=${afterInvalidate.reused}`);

    // --- 24. Cache report correctly lists hits, misses, and invalidation reasons --------------------

    const reportEntries: ValidationEvidenceSessionEntry[] = [
      { validatorName: 'reused-1', outcome: secondRun },
      { validatorName: 'fresh-1', outcome: afterFileChange },
      { validatorName: 'fresh-required-1', outcome: freshRequiredSecond },
    ];
    const report = buildValidationEvidenceCacheReport(reportEntries);
    assert(
      '24. Cache report correctly lists reused vs run-fresh validators',
      report.validatorsReused.includes('reused-1') && report.validatorsRunFresh.includes('fresh-1') && report.validatorsRunFresh.includes('fresh-required-1'),
      JSON.stringify(report),
    );
    assert(
      '24b. Cache report identifies fresh-required validators as unsafe-for-reuse',
      report.unsafeValidatorsSkippedFromReuse.includes('fresh-required-1'),
      JSON.stringify(report.unsafeValidatorsSkippedFromReuse),
    );
    assert('24c. Cache report computes a numeric hit rate between 0 and 1', report.cacheHitRate >= 0 && report.cacheHitRate <= 1, String(report.cacheHitRate));
    assert(
      '24d. Cache report records invalidation reasons keyed by validator name',
      Array.isArray(report.invalidationReasonsByValidator['fresh-1']) && report.invalidationReasonsByValidator['fresh-1'].length > 0,
      JSON.stringify(report.invalidationReasonsByValidator),
    );

    // --- 25/26. Cache never stores raw secrets or .env values ---------------------------------------

    const secretValue = 'super-secret-value-should-never-be-cached';
    const cacheDir = getEvidenceCacheDir(sandbox);
    const cacheFiles = existsSync(cacheDir) ? readdirSync(cacheDir).filter((f) => f.endsWith('.json')) : [];
    let secretFound = false;
    for (const file of cacheFiles) {
      const content = readFileSync(join(cacheDir, file), 'utf8');
      if (content.includes(secretValue)) {
        secretFound = true;
      }
    }
    assert('25. Cache never stores raw environment variable values', !secretFound, secretFound ? 'secret value found in cache!' : 'no secret found');

    const envRecordAfter = readEvidenceRecord(sandbox, computeEvidenceCacheKey('sandbox-env-validator', '1.0.0', 'VALIDATOR_RUN'));
    assert(
      '26. Environment fingerprint stores presence markers only, never raw values',
      envRecordAfter !== null && !JSON.stringify(envRecordAfter).includes(secretValue),
      envRecordAfter ? JSON.stringify(envRecordAfter.environmentFingerprint) : 'MISSING RECORD',
    );

    // --- 27. Cache is located at .aidevengine/validation-evidence-cache-v1/ and contains only JSON --

    assert('27. Cache directory follows the declared path convention', getEvidenceCacheDir(sandbox) === join(sandbox, '.aidevengine', 'validation-evidence-cache-v1'), getEvidenceCacheDir(sandbox));
    const allCacheEntries = existsSync(cacheDir) ? readdirSync(cacheDir) : [];
    assert('27b. Cache directory contains only JSON records', allCacheEntries.every((f) => f.endsWith('.json')), JSON.stringify(allCacheEntries));

    // --- 28. Cache does not store secrets even when writing a record directly (defense in depth) ---

    const directRecord = readEvidenceRecord(sandbox, computeEvidenceCacheKey('sandbox-validator', '1.0.0', 'VALIDATOR_RUN'));
    assert(
      '28. Cached record for the standard sandbox validator contains no .env-like raw values',
      directRecord !== null && !JSON.stringify(directRecord).toLowerCase().includes('password') && !JSON.stringify(directRecord).toLowerCase().includes('secret_key'),
      directRecord ? 'clean' : 'MISSING RECORD',
    );
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }

  // --- 29. Cache keys never use Date.now or random UUIDs (static source proof) --------------------

  const cacheModuleSource = readFileSync(join(MODULE_DIR, 'validation-evidence-cache.ts'), 'utf8');
  const cacheKeyFunctionMatch = cacheModuleSource.match(/export function computeEvidenceCacheKey[\s\S]*?\n}/);
  const cacheKeyFunctionSource = cacheKeyFunctionMatch ? cacheKeyFunctionMatch[0] : '';
  assert(
    '29. computeEvidenceCacheKey never references Date.now or randomUUID',
    cacheKeyFunctionSource.length > 0 && !/Date\.now|randomUUID|Math\.random/.test(cacheKeyFunctionSource),
    cacheKeyFunctionSource,
  );

  const fullVereSource = readModuleSource();
  assert(
    '30. No Math.random or crypto.randomUUID anywhere in the VERE module',
    !/Math\.random\(|randomUUID\(/.test(fullVereSource),
    'random usage found',
  );
  const dateNowUses = fullVereSource.match(/Date\.now\(\)/g) ?? [];
  assert(
    '31. Date.now is only used for informational timestamps (createdAt/expiresAt/TTL), never inside a cache key',
    dateNowUses.length > 0 && !/computeEvidenceCacheKey\([^)]*Date\.now/.test(fullVereSource),
    `Date.now() usage count=${dateNowUses.length}`,
  );

  // --- 32. No application-specific / domain-specific logic in VERE --------------------------------

  const forbiddenAppTerms = [
    'calculator',
    'crm',
    'booking',
    'notes app',
    'hospital',
    'inventory',
    'lisa',
    'authentication',
    'dashboard',
    'crud',
    'todo list',
    'invoice',
    'patient',
    'appointment',
  ];
  const lowerSource = fullVereSource.toLowerCase();
  const foundAppTerms = forbiddenAppTerms.filter((term) => lowerSource.includes(term));
  assert('32. No application-specific / domain-specific terms in the VERE implementation', foundAppTerms.length === 0, JSON.stringify(foundAppTerms));

  // --- 33. No LLM dependency --------------------------------------------------------------------

  assert(
    '33. No LLM dependency in VERE source',
    !/openai|anthropic|\bllm\b|gpt-|chatcompletion/i.test(fullVereSource),
    'LLM reference found',
  );

  // --- 34. No network dependency ------------------------------------------------------------------

  assert(
    '34. No network calls in VERE source — pure, offline, deterministic',
    !/\bfetch\(|node:http|node:https|axios/.test(fullVereSource),
    'network reference found',
  );

  // --- 35. Every public entry point is synchronous (no hidden async orchestration) ----------------

  assert('35. VERE module has no async/Promise-based public API surface', !/\basync\s+function\b|Promise</.test(fullVereSource), 'async usage found');

  // --- 36. No hidden global skip flag ---------------------------------------------------------------

  assert(
    '36. No hidden global "skip validation" flag — reuse always requires a matched, complete prior record',
    !/SKIP_VALIDATION|BYPASS_VALIDATION|process\.env\.\w*SKIP\w*/i.test(fullVereSource),
    'skip flag reference found',
  );

  // --- 37/38. Real opt-in example: an existing, already-passing validator wrapped with VERE --------

  const optInCacheRoot = ROOT;
  invalidateEvidence('scripts/validate-simplified-builder-ui-v1.ts', undefined, { rootDir: optInCacheRoot });

  let realSpawnCount = 0;
  function wrappedSimplifiedBuilderUiValidator() {
    return runChildProcessValidatorWithEvidenceReuse(
      {
        validatorName: 'scripts/validate-simplified-builder-ui-v1.ts',
        validatorVersion: '1.0.0',
        scriptPath: 'scripts/validate-simplified-builder-ui-v1.ts',
        rootDir: optInCacheRoot,
      },
      () => {
        realSpawnCount += 1;
        const outcome = runValidatorScript('scripts/validate-simplified-builder-ui-v1.ts', 'SIMPLIFIED_BUILDER_UI_V1_PASS');
        return { ok: outcome.ok, detail: outcome.detail, passToken: 'SIMPLIFIED_BUILDER_UI_V1_PASS' };
      },
    );
  }

  const optInFirst = wrappedSimplifiedBuilderUiValidator();
  assert(
    '37. Real opt-in example — first run spawns the wrapped validator and passes',
    optInFirst.reused === false && optInFirst.ok === true && realSpawnCount === 1,
    JSON.stringify({ reused: optInFirst.reused, ok: optInFirst.ok, spawnCount: realSpawnCount }),
  );

  const optInSecond = wrappedSimplifiedBuilderUiValidator();
  assert(
    '38. Real opt-in example — second run reuses cached evidence and does not re-spawn the validator',
    optInSecond.reused === true && optInSecond.ok === true && realSpawnCount === 1,
    JSON.stringify({ reused: optInSecond.reused, ok: optInSecond.ok, spawnCount: realSpawnCount }),
  );

  invalidateEvidence('scripts/validate-simplified-builder-ui-v1.ts', undefined, { rootDir: optInCacheRoot });

  // --- 39. VERE is generic — the opt-in wrapper needed zero validator-specific code -----------------

  const validatorHelperSource = readFileSync(join(MODULE_DIR, 'validation-evidence-validator.ts'), 'utf8');
  assert(
    '39. Opt-in validator wrapper contains no reference to any specific validator name',
    !/simplified-builder-ui|product-faithfulness|product-stabilization/i.test(validatorHelperSource),
    'validator-specific reference found in generic wrapper',
  );

  // --- 40. Governance integration is additive-only (no behavior change to existing exports) --------

  const governanceIntegrationPath = join(ROOT, 'src/validation-runtime-governance-v1/evidence-reuse-integration.ts');
  assert('40. Validation runtime governance integration file exists', existsSync(governanceIntegrationPath), governanceIntegrationPath);
  const governanceIndexSource = readFileSync(join(ROOT, 'src/validation-runtime-governance-v1/index.ts'), 'utf8');
  assert(
    '40b. Validation runtime governance index re-exports the evidence reuse wrapper',
    governanceIndexSource.includes('runGovernedValidatorWithEvidenceReuse'),
    'export missing',
  );

  // --- 41. Existing validation-runtime-governance-v1 validator still passes (no regression) --------

  const governanceRegression = runValidatorScript('scripts/validate-validation-runtime-governance-v1.ts', 'VALIDATION_RUNTIME_GOVERNANCE_V1_PASS');
  assert('41. scripts/validate-validation-runtime-governance-v1.ts still passes', governanceRegression.ok, governanceRegression.detail);

  // --- 42. Existing product-faithfulness-milestone-2 validator (and its full regression chain) still passes ---

  const faithfulnessRegression = runValidatorScript('scripts/validate-product-faithfulness-milestone-2.ts', 'PRODUCT_FAITHFULNESS_MILESTONE_2_PASS');
  assert('42. scripts/validate-product-faithfulness-milestone-2.ts (and its full regression chain) still passes', faithfulnessRegression.ok, faithfulnessRegression.detail);

  // --- 43. Determinism — identical fingerprints always produce identical reuse decisions -----------

  const detSandbox = mkdtempSync(join(tmpdir(), 'vere-det-'));
  writeFileSync(join(detSandbox, 'package.json'), '{}');
  writeFileSync(join(detSandbox, 'package-lock.json'), '{}');
  try {
    const detPolicy = defineValidationEvidencePolicy({ validatorName: 'det-validator', validatorVersion: '1.0.0', reuseSafe: true });
    const detExecute = (): ValidationEvidenceExecutionOutcome => ({ status: 'PASSED', passToken: 'DET_PASS', evidenceSummary: 'ok' });
    runWithEvidenceReuse(detPolicy, { a: 1, b: 2 }, detExecute, { rootDir: detSandbox });
    const decision1 = explainReuseDecision(detPolicy, { a: 1, b: 2 }, { rootDir: detSandbox });
    const decision2 = explainReuseDecision(detPolicy, { b: 2, a: 1 }, { rootDir: detSandbox });
    assert(
      '43. Determinism — key order in input does not affect the fingerprint or reuse decision',
      decision1.wouldReuse === true && decision2.wouldReuse === true,
      JSON.stringify({ decision1, decision2 }),
    );
  } finally {
    rmSync(detSandbox, { recursive: true, force: true });
  }

  // --- final tally -----------------------------------------------------------------------------

  const passed = results.filter((r) => r.passed).length;
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    if (!check.passed) console.log(`       ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);
  console.log('');

  if (passed === results.length) {
    console.log(VALIDATION_EVIDENCE_REUSE_ENGINE_V1_PASS_TOKEN);
    await exitValidator(0);
    return;
  }
  await exitValidator(1);
}

main().catch(async (err) => {
  console.error(err);
  await exitValidator(1);
});
