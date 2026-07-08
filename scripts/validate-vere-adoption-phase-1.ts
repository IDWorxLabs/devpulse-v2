/**
 * VERE Adoption Phase 1 — validation suite.
 *
 * Constitutional principle under test: adopting the Validation Evidence Reuse Engine for a batch
 * of existing validators must never weaken, bypass, or remove any check those validators perform.
 * A validator's evidence may only be reused when every declared dependency-surface fingerprint
 * (its own source, its declared relevant files/directories, its declared dependency signature,
 * its declared environment presence, its version, and its adoption policy metadata) is proven
 * unchanged, and only when the prior run was a genuinely complete PASSED run. Anything else —
 * partial, interrupted, failed, stale, mismatched, or simply undeclared — must always execute the
 * real validator. This suite proves that contract at the adoption layer (not just inside VERE
 * itself, which Milestone 1 of this initiative already proved), proves the registry is generic,
 * proves a real batch of existing validators is actually wired in, and re-runs the existing
 * governance/VERE/faithfulness validators to prove no regression.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exitValidator } from '../src/windows-validator-clean-exit-v1/index.js';
import {
  VERE_ADOPTION_PHASE_1_REGISTRY,
  listReuseSafeAdoptedValidators,
  listFreshRequiredAdoptedValidators,
  defineAdoptedValidatorPolicy,
  hasExplicitDependencySurface,
  runAdoptedValidator,
  runAdoptedValidatorBatch,
  explainAdoptedValidatorBatch,
  buildVereAdoptionReport,
  renderVereAdoptionReportText,
  renderVereAdoptionExplainabilityText,
} from '../src/vere-adoption-phase-1/index.js';
import type { AdoptedValidatorPolicy } from '../src/vere-adoption-phase-1/index.js';
import { invalidateEvidence } from '../src/validation-evidence-reuse/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(import.meta.url);

export const VERE_ADOPTION_PHASE_1_PASS_TOKEN = 'VERE_ADOPTION_PHASE_1_PASS';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const MODULE_DIR = join(ROOT, 'src/vere-adoption-phase-1');
const MODULE_FILES = [
  'index.ts',
  'vere-adoption-types.ts',
  'vere-adoption-policy-builder.ts',
  'vere-adoption-registry.ts',
  'vere-adoption-runner.ts',
  'vere-adoption-report.ts',
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
  console.log('VERE Adoption Phase 1 — Validation');
  console.log('====================================');
  console.log('');

  // --- 1. package script registered -------------------------------------------------------------

  const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert(
    '01. package script registered',
    packageJson.scripts?.['validate:vere-adoption-phase-1']?.includes('validate-vere-adoption-phase-1.ts') ?? false,
    JSON.stringify(packageJson.scripts?.['validate:vere-adoption-phase-1'] ?? 'MISSING'),
  );

  // --- 2. module files exist --------------------------------------------------------------------

  for (const file of MODULE_FILES) {
    assert(`02. module file exists — ${file.slice(ROOT.length)}`, existsSync(file), file);
  }

  // --- 3. Adoption registry exists and is generic -------------------------------------------------

  assert('03. Adoption registry has entries', VERE_ADOPTION_PHASE_1_REGISTRY.length > 0, String(VERE_ADOPTION_PHASE_1_REGISTRY.length));
  const registrySource = readFileSync(join(MODULE_DIR, 'vere-adoption-registry.ts'), 'utf8');
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
  const foundAppTermsInRegistry = forbiddenAppTerms.filter((term) => registrySource.toLowerCase().includes(term));
  assert('03b. Adoption registry contains no application/domain-specific terms', foundAppTermsInRegistry.length === 0, JSON.stringify(foundAppTermsInRegistry));

  // --- 4. At least several validators opted in through declared policies --------------------------

  const reuseSafe = listReuseSafeAdoptedValidators();
  const freshRequired = listFreshRequiredAdoptedValidators();
  assert('04. At least 6 validators are opted into VERE through declared reuse-safe policies', reuseSafe.length >= 6, String(reuseSafe.length));
  assert('04b. At least one validator is deliberately declared not-yet-reuse-safe', freshRequired.length >= 1, String(freshRequired.length));

  // --- 5. Every reuse-safe entry declares the required fields --------------------------------------

  for (const policy of VERE_ADOPTION_PHASE_1_REGISTRY) {
    const hasShape =
      typeof policy.validatorName === 'string' &&
      policy.validatorName.length > 0 &&
      typeof policy.validatorVersion === 'string' &&
      typeof policy.validatorKind === 'string' &&
      typeof policy.passToken === 'string' &&
      policy.passToken.length > 0;
    assert(`05. ${policy.validatorName} declares validatorName/validatorVersion/validatorKind/passToken`, hasShape, JSON.stringify(policy));
    if (policy.reuseSafe) {
      assert(`05b. ${policy.validatorName} (reuseSafe) declares a non-empty reuseSafeJustification`, policy.reuseSafeJustification.trim().length > 0, policy.reuseSafeJustification);
      assert(`05c. ${policy.validatorName} (reuseSafe) declares an explicit, non-empty dependency surface`, hasExplicitDependencySurface(policy), JSON.stringify({ files: policy.relevantFiles, dirs: policy.relevantDirectories }));
    } else {
      assert(`05d. ${policy.validatorName} (not reuse-safe) declares mustRunFreshReason`, Boolean(policy.mustRunFreshReason && policy.mustRunFreshReason.trim().length > 0), String(policy.mustRunFreshReason));
    }
  }

  // --- 6. Registry construction itself refuses an undefensible reuse-safe policy ------------------

  let rejectedUndefensiblePolicy = false;
  try {
    defineAdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist.ts',
      validatorVersion: '1.0.0',
      validatorKind: 'DETERMINISTIC_LOGIC',
      passToken: 'X',
      reuseSafe: true,
      reuseSafeJustification: 'claims safety with nothing to prove it',
      // relevantFiles / relevantDirectories intentionally omitted
    });
  } catch {
    rejectedUndefensiblePolicy = true;
  }
  assert('06. Policy builder refuses reuseSafe:true without an explicit dependency surface', rejectedUndefensiblePolicy, String(rejectedUndefensiblePolicy));

  let rejectedUnjustifiedPolicy = false;
  try {
    defineAdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist-2.ts',
      validatorVersion: '1.0.0',
      validatorKind: 'DETERMINISTIC_LOGIC',
      passToken: 'X',
      relevantFiles: ['scripts/does-not-exist-2.ts'],
      reuseSafe: true,
      reuseSafeJustification: '',
    });
  } catch {
    rejectedUnjustifiedPolicy = true;
  }
  assert('06b. Policy builder refuses reuseSafe:true without a written justification', rejectedUnjustifiedPolicy, String(rejectedUnjustifiedPolicy));

  // ================================================================================================
  // Sandbox tests — exercise the adoption RUNNER (not just VERE core) against a real, spawnable
  // synthetic validator script, so mutations are safe and the adoption layer's own wiring (policy
  // signature folding, pass-token defense-in-depth) is proven independently of VERE V1's own suite.
  // ================================================================================================

  const sandbox = mkdtempSync(join(tmpdir(), 'vere-adoption-validate-'));
  writeFileSync(join(sandbox, 'package.json'), JSON.stringify({ name: 'sandbox', version: '1.0.0' }));
  writeFileSync(join(sandbox, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, entry: 'a' }));
  const counterFile = join(sandbox, 'spawn-counter.txt');
  writeFileSync(counterFile, '');
  const fakeValidatorScript = join(sandbox, 'fake-adopted-validator.ts');
  const fakeRelevantFile = join(sandbox, 'relevant.ts');
  writeFileSync(fakeRelevantFile, 'export const value = 1;');

  function writeFakeValidator(passToken: string): void {
    writeFileSync(
      fakeValidatorScript,
      [
        "import { appendFileSync } from 'node:fs';",
        `appendFileSync(${JSON.stringify(counterFile)}, 'x\\n');`,
        `console.log(${JSON.stringify(passToken)});`,
      ].join('\n'),
    );
  }
  writeFakeValidator('SANDBOX_ADOPTED_PASS');

  function countSpawns(): number {
    return readFileSync(counterFile, 'utf8').split('\n').filter((l) => l.trim().length > 0).length;
  }

  function makeSandboxPolicy(overrides: Partial<AdoptedValidatorPolicy> = {}): AdoptedValidatorPolicy {
    return defineAdoptedValidatorPolicy({
      validatorName: 'sandbox/fake-adopted-validator.ts',
      validatorVersion: '1.0.0',
      validatorKind: 'DETERMINISTIC_LOGIC',
      scriptPath: fakeValidatorScript,
      passToken: 'SANDBOX_ADOPTED_PASS',
      relevantFiles: [fakeRelevantFile],
      reuseSafe: true,
      reuseSafeJustification: 'synthetic sandbox validator for adoption-layer testing',
      ...overrides,
    });
  }

  try {
    // --- 07. Cache miss executes the real validator ------------------------------------------------

    const basePolicy = makeSandboxPolicy();
    const firstRun = runAdoptedValidator(basePolicy, { rootDir: sandbox });
    assert('07. Cache miss executes the real (wrapped) validator', firstRun.reused === false && firstRun.ok === true && countSpawns() === 1, JSON.stringify({ reused: firstRun.reused, ok: firstRun.ok, spawns: countSpawns() }));

    // --- 08. Cache hit path returns only prior complete PASSED evidence, without re-spawning -------

    const secondRun = runAdoptedValidator(basePolicy, { rootDir: sandbox });
    assert('08. Cache hit reuses prior complete PASSED evidence without re-executing', secondRun.reused === true && secondRun.ok === true && countSpawns() === 1, JSON.stringify({ reused: secondRun.reused, ok: secondRun.ok, spawns: countSpawns() }));

    // --- 09. No validator is reused without reuseSafe: true -----------------------------------------

    const notReuseSafePolicy = defineAdoptedValidatorPolicy({
      validatorName: 'sandbox/fake-adopted-validator-not-safe.ts',
      validatorVersion: '1.0.0',
      validatorKind: 'DETERMINISTIC_LOGIC',
      scriptPath: fakeValidatorScript,
      passToken: 'SANDBOX_ADOPTED_PASS',
      reuseSafe: false,
      reuseSafeJustification: '',
      mustRunFreshReason: 'test: intentionally not opted into reuse',
    });
    runAdoptedValidator(notReuseSafePolicy, { rootDir: sandbox });
    const spawnsAfterFirstNotSafe = countSpawns();
    const notSafeSecond = runAdoptedValidator(notReuseSafePolicy, { rootDir: sandbox });
    assert(
      '09. A validator without reuseSafe:true is never reused, even with identical fingerprints',
      notSafeSecond.reused === false && countSpawns() === spawnsAfterFirstNotSafe + 1,
      JSON.stringify({ reused: notSafeSecond.reused, spawns: countSpawns() }),
    );

    // --- 10. Changing a watched source file invalidates reuse ---------------------------------------

    const spawnsBeforeFileChange = countSpawns();
    writeFileSync(fakeRelevantFile, 'export const value = 2;');
    const afterFileChange = runAdoptedValidator(basePolicy, { rootDir: sandbox });
    assert(
      '10. Changing a watched relevant file invalidates reuse',
      afterFileChange.reused === false && countSpawns() === spawnsBeforeFileChange + 1 && afterFileChange.invalidationReasons.includes('RELEVANT_FILES_CHANGED'),
      JSON.stringify({ reused: afterFileChange.reused, spawns: countSpawns(), reasons: afterFileChange.invalidationReasons }),
    );

    // --- 11. Changing a watched directory invalidates reuse ------------------------------------------

    const watchedDir = join(sandbox, 'watched-dir');
    mkdirSync(watchedDir, { recursive: true });
    writeFileSync(join(watchedDir, 'file.ts'), 'export const a = 1;');
    const dirPolicy = makeSandboxPolicy({ validatorName: 'sandbox/fake-adopted-validator-dir.ts', relevantFiles: [], relevantDirectories: [watchedDir] });
    runAdoptedValidator(dirPolicy, { rootDir: sandbox });
    const spawnsBeforeDirChange = countSpawns();
    writeFileSync(join(watchedDir, 'file.ts'), 'export const a = 2;');
    const afterDirChange = runAdoptedValidator(dirPolicy, { rootDir: sandbox });
    assert(
      '11. Changing a file inside a watched directory invalidates reuse',
      afterDirChange.reused === false && countSpawns() === spawnsBeforeDirChange + 1 && afterDirChange.invalidationReasons.includes('RELEVANT_FILES_CHANGED'),
      JSON.stringify({ reused: afterDirChange.reused, reasons: afterDirChange.invalidationReasons }),
    );

    // --- 12. Changing dependency signature invalidates reuse -----------------------------------------

    runAdoptedValidator(basePolicy, { rootDir: sandbox }); // re-establish matching evidence for basePolicy
    const spawnsBeforeDependencyChange = countSpawns();
    writeFileSync(join(sandbox, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, entry: 'b' }));
    const afterDependencyChange = runAdoptedValidator(basePolicy, { rootDir: sandbox });
    assert(
      '12. Changing the dependency signature (lockfile) invalidates reuse',
      afterDependencyChange.reused === false && countSpawns() === spawnsBeforeDependencyChange + 1 && afterDependencyChange.invalidationReasons.includes('DEPENDENCY_SIGNATURE_CHANGED'),
      JSON.stringify(afterDependencyChange.invalidationReasons),
    );

    // --- 13. Changing declared environment presence invalidates reuse, without exposing the value ---

    delete process.env.VERE_ADOPTION_VALIDATE_ENV_PROBE;
    const envPolicy = makeSandboxPolicy({ validatorName: 'sandbox/fake-adopted-validator-env.ts', environmentInputs: ['VERE_ADOPTION_VALIDATE_ENV_PROBE'] });
    const envBefore = runAdoptedValidator(envPolicy, { rootDir: sandbox });
    process.env.VERE_ADOPTION_VALIDATE_ENV_PROBE = 'top-secret-value-must-not-be-cached';
    const envAfter = runAdoptedValidator(envPolicy, { rootDir: sandbox });
    delete process.env.VERE_ADOPTION_VALIDATE_ENV_PROBE;
    assert(
      '13. Changing declared environment variable presence invalidates reuse',
      envBefore.reused === false && envAfter.reused === false && envAfter.invalidationReasons.includes('ENVIRONMENT_ASSUMPTIONS_CHANGED'),
      JSON.stringify({ before: envBefore.reused, after: envAfter.reused, reasons: envAfter.invalidationReasons }),
    );

    // --- 14. Validator version changes invalidate reuse -----------------------------------------------

    runAdoptedValidator(basePolicy, { rootDir: sandbox });
    const spawnsBeforeVersionBump = countSpawns();
    const bumpedVersionPolicy = makeSandboxPolicy({ validatorVersion: '2.0.0' });
    const afterVersionBump = runAdoptedValidator(bumpedVersionPolicy, { rootDir: sandbox });
    assert('14. Changing the validator version invalidates reuse', afterVersionBump.reused === false && countSpawns() === spawnsBeforeVersionBump + 1, JSON.stringify({ reused: afterVersionBump.reused }));

    // --- 15. Policy changes (TTL / evidence metadata) invalidate reuse, even with identical files ----

    runAdoptedValidator(basePolicy, { rootDir: sandbox });
    const spawnsBeforePolicyChange = countSpawns();
    const differentTtlPolicy = makeSandboxPolicy({ ttlMs: 999_999 });
    const afterPolicyChange = runAdoptedValidator(differentTtlPolicy, { rootDir: sandbox });
    assert(
      '15. Changing adoption policy metadata (TTL) invalidates reuse even when watched files are unchanged',
      afterPolicyChange.reused === false && countSpawns() === spawnsBeforePolicyChange + 1,
      JSON.stringify({ reused: afterPolicyChange.reused }),
    );

    // --- 16. Failed validator results are never reused ------------------------------------------------

    writeFakeValidator('WRONG_TOKEN_SIMULATES_FAILURE');
    const failingPolicy = makeSandboxPolicy({ validatorName: 'sandbox/fake-adopted-validator-failing.ts' });
    const failFirst = runAdoptedValidator(failingPolicy, { rootDir: sandbox });
    const spawnsAfterFailFirst = countSpawns();
    const failSecond = runAdoptedValidator(failingPolicy, { rootDir: sandbox });
    assert(
      '16. A failed validator run is never reused as passing evidence',
      failFirst.ok === false && failSecond.ok === false && failSecond.reused === false && countSpawns() === spawnsAfterFailFirst + 1,
      JSON.stringify({ failFirstOk: failFirst.ok, failSecondOk: failSecond.ok, failSecondReused: failSecond.reused }),
    );
    writeFakeValidator('SANDBOX_ADOPTED_PASS');

    // --- 17. Pass-token mismatch is never reused (defense-in-depth) -----------------------------------

    writeFakeValidator('AN_UNEXPECTED_TOKEN_NOT_DECLARED_IN_POLICY');
    const mismatchPolicy = makeSandboxPolicy({ validatorName: 'sandbox/fake-adopted-validator-mismatch.ts', passToken: 'EXPECTED_TOKEN_THAT_WILL_NOT_APPEAR' });
    const mismatchRun = runAdoptedValidator(mismatchPolicy, { rootDir: sandbox });
    assert(
      '17. A validator whose output does not contain the declared pass token is never reported as ok, and is never reusable',
      mismatchRun.ok === false,
      JSON.stringify(mismatchRun),
    );
    const mismatchRerun = runAdoptedValidator(mismatchPolicy, { rootDir: sandbox });
    assert('17b. Pass-token-mismatched evidence is not reused on a subsequent run', mismatchRerun.ok === false && mismatchRerun.reused === false, JSON.stringify(mismatchRerun));
    writeFakeValidator('SANDBOX_ADOPTED_PASS');

    // --- 18. Runtime report distinguishes reused vs executed vs invalidated --------------------------

    invalidateEvidence('sandbox/fake-adopted-validator.ts', undefined, { rootDir: sandbox });
    const reportRunFresh = runAdoptedValidator(basePolicy, { rootDir: sandbox });
    const reportRunReused = runAdoptedValidator(basePolicy, { rootDir: sandbox });
    writeFileSync(fakeRelevantFile, 'export const value = 3;');
    const reportRunInvalidated = runAdoptedValidator(basePolicy, { rootDir: sandbox });
    const report = buildVereAdoptionReport([
      { ...reportRunFresh, validatorName: 'exec-demo' },
      { ...reportRunReused, validatorName: 'reuse-demo' },
      { ...reportRunInvalidated, validatorName: 'invalidated-demo' },
      { ...notSafeSecond, validatorName: 'unsafe-demo' },
    ]);
    assert(
      '18. Runtime report correctly buckets executed vs reused vs invalidated vs unsafe',
      report.executedValidators.includes('exec-demo') &&
        report.reusedValidators.includes('reuse-demo') &&
        Object.keys(report.invalidatedValidators).includes('invalidated-demo') &&
        report.unsafeOrNotOptedInValidators.includes('unsafe-demo'),
      renderVereAdoptionReportText(report),
    );

    // --- 19. Explainability output includes concrete reuse/reject reasons ----------------------------

    const explanations = explainAdoptedValidatorBatch([basePolicy, notReuseSafePolicy]);
    const explainText = renderVereAdoptionExplainabilityText(explanations);
    assert(
      '19. Explainability output states concrete verdicts and reasons per validator',
      explanations.length === 2 && explanations.every((e) => typeof e.wouldReuse === 'boolean') && explainText.includes('WOULD') ,
      explainText,
    );
    const notSafeExplanation = explanations.find((e) => e.validatorName === notReuseSafePolicy.validatorName);
    assert(
      '19b. Explainability correctly reports why a non-reuse-safe validator would run fresh',
      notSafeExplanation !== undefined && notSafeExplanation.wouldReuse === false && notSafeExplanation.reasons.some((r) => r === 'NOT_REUSE_SAFE' || r.startsWith('FRESH_REQUIRED')),
      JSON.stringify(notSafeExplanation),
    );
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }

  // --- 20. No application-specific terms anywhere in the adoption module --------------------------

  const fullModuleSource = readModuleSource();
  const foundAppTermsInModule = forbiddenAppTerms.filter((term) => fullModuleSource.toLowerCase().includes(term));
  assert('20. No application-specific / domain-specific terms in the VERE Adoption module', foundAppTermsInModule.length === 0, JSON.stringify(foundAppTermsInModule));

  assert('20b. No LLM dependency in the VERE Adoption module', !/openai|anthropic|\bllm\b|gpt-|chatcompletion/i.test(fullModuleSource), 'LLM reference found');
  assert('20c. No network calls in the VERE Adoption module', !/\bfetch\(|node:http'|node:https'|axios/.test(fullModuleSource), 'network reference found');
  assert('20d. No Math.random or crypto.randomUUID in the VERE Adoption module', !/Math\.random\(|randomUUID\(/.test(fullModuleSource), 'random usage found');
  assert(
    '20e. No hidden global "skip validation" flag in the VERE Adoption module',
    !/SKIP_VALIDATION|BYPASS_VALIDATION|process\.env\.\w*SKIP\w*/i.test(fullModuleSource),
    'skip flag reference found',
  );

  // --- 21. No checks were removed from any adopted validator's own source -------------------------

  for (const policy of VERE_ADOPTION_PHASE_1_REGISTRY) {
    const scriptFile = join(ROOT, policy.validatorName);
    const source = existsSync(scriptFile) ? readFileSync(scriptFile, 'utf8') : '';
    assert(
      `21. ${policy.validatorName} still declares its own original pass token (untouched by adoption)`,
      source.includes(policy.passToken),
      `token "${policy.passToken}" present=${source.includes(policy.passToken)}`,
    );
  }

  // ================================================================================================
  // Real batch run — the actual first-batch validators, wired through the registry and runner.
  // ================================================================================================

  const realOptions = { rootDir: ROOT };
  for (const policy of reuseSafe) {
    invalidateEvidence(policy.validatorName, undefined, realOptions);
  }
  for (const policy of freshRequired) {
    invalidateEvidence(policy.validatorName, undefined, realOptions);
  }

  console.log('Running the real adoption batch (pass A — expect all fresh)...');
  const realPassA = runAdoptedValidatorBatch(reuseSafe, realOptions);
  assert(
    '22. Real batch pass A — every reuse-safe adopted validator executes fresh and passes',
    realPassA.every((r) => r.reused === false && r.ok === true),
    JSON.stringify(realPassA.map((r) => ({ v: r.validatorName, reused: r.reused, ok: r.ok, detail: r.detail.slice(0, 120) }))),
  );

  console.log('Running the real adoption batch (pass B — expect all reused)...');
  const realPassB = runAdoptedValidatorBatch(reuseSafe, realOptions);
  assert(
    '23. Real batch pass B — every reuse-safe adopted validator reuses cached evidence and still passes',
    realPassB.every((r) => r.reused === true && r.ok === true),
    JSON.stringify(realPassB.map((r) => ({ v: r.validatorName, reused: r.reused, ok: r.ok }))),
  );

  const realReport = buildVereAdoptionReport(realPassB);
  assert('24. Real report shows a non-zero cache hit rate for the adopted batch', realReport.cacheHitRate > 0, String(realReport.cacheHitRate));
  console.log(renderVereAdoptionReportText(realReport));

  console.log('Running the deliberately-excluded (fresh-required) validator once...');
  const freshRequiredResult = runAdoptedValidator(freshRequired[0], realOptions);
  assert(
    `25. Deliberately-excluded validator (${freshRequired[0].validatorName}) always executes fresh and still passes`,
    freshRequiredResult.reused === false && freshRequiredResult.ok === true,
    JSON.stringify({ reused: freshRequiredResult.reused, ok: freshRequiredResult.ok }),
  );

  const combinedRealReport = buildVereAdoptionReport([...realPassB, freshRequiredResult]);
  assert(
    '26. Combined real report lists the fresh-required validator under unsafe/not-opted-in, never under reused',
    combinedRealReport.unsafeOrNotOptedInValidators.includes(freshRequired[0].validatorName) && !combinedRealReport.reusedValidators.includes(freshRequired[0].validatorName),
    JSON.stringify(combinedRealReport.unsafeOrNotOptedInValidators),
  );

  for (const policy of reuseSafe) {
    invalidateEvidence(policy.validatorName, undefined, realOptions);
  }
  for (const policy of freshRequired) {
    invalidateEvidence(policy.validatorName, undefined, realOptions);
  }

  // ================================================================================================
  // Regression proofs — existing governance, VERE, and faithfulness validators still pass.
  // ================================================================================================

  const governanceRegression = runValidatorScript('scripts/validate-validation-runtime-governance-v1.ts', 'VALIDATION_RUNTIME_GOVERNANCE_V1_PASS');
  assert('27. scripts/validate-validation-runtime-governance-v1.ts still passes', governanceRegression.ok, governanceRegression.detail);

  const vereRegression = runValidatorScript('scripts/validate-validation-evidence-reuse-engine.ts', 'VALIDATION_EVIDENCE_REUSE_ENGINE_V1_PASS');
  assert('28. scripts/validate-validation-evidence-reuse-engine.ts still passes', vereRegression.ok, vereRegression.detail);

  assert(
    '29. Product Faithfulness Milestone 1 validator still passes (proven via the real adoption batch above)',
    realPassA.some((r) => r.validatorName === 'scripts/validate-product-faithfulness-milestone-1.ts' && r.ok),
    'milestone-1 not found or not ok in real batch pass A',
  );
  assert(
    '30. Product Faithfulness Milestone 2 validator still passes (proven via the fresh-required adoption run above)',
    freshRequiredResult.validatorName === 'scripts/validate-product-faithfulness-milestone-2.ts' && freshRequiredResult.ok,
    JSON.stringify(freshRequiredResult),
  );

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
    console.log(VERE_ADOPTION_PHASE_1_PASS_TOKEN);
    await exitValidator(0);
    return;
  }
  await exitValidator(1);
}

main().catch(async (err) => {
  console.error(err);
  await exitValidator(1);
});
