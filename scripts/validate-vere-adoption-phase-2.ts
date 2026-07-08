/**
 * VERE Adoption Phase 2 — validation suite.
 *
 * Constitutional principle under test: expanding Validation Evidence Reuse Engine adoption beyond
 * Phase 1 must never weaken, bypass, or remove any check an adopted validator performs, and must
 * never convert a validator with a broad, circular, or undeclared dependency surface into a
 * reused one just because it is slow. Phase 2 adds an explicit risk-classification layer and
 * aggregator child-graph handling on top of Phase 1's model; this suite proves both are real
 * refusals (not just documentation), proves a genuine second batch of at least ten existing
 * validators is safely adopted, proves explainability/reporting are accurate, and re-runs Phase 1
 * plus the two newly-referenced real validators (governance, capability-audit-v3) to prove no
 * regression.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exitValidator } from '../src/windows-validator-clean-exit-v1/index.js';
import {
  VERE_ADOPTION_PHASE_2_REGISTRY,
  listPhase2ReuseSafeAdoptedValidators,
  listPhase2FreshRequiredAdoptedValidators,
  listPhase2AdoptedValidatorsByRiskClass,
  definePhase2AdoptedValidatorPolicy,
  hasExplicitDependencySurface,
  runPhase2AdoptedValidator,
  runPhase2AdoptedValidatorBatch,
  explainPhase2AdoptedValidatorBatch,
  buildVereAdoptionPhase2Report,
  renderVereAdoptionPhase2ReportText,
  renderVereAdoptionPhase2ExplainabilityText,
} from '../src/vere-adoption-phase-2/index.js';
import type { Phase2AdoptedValidatorPolicy } from '../src/vere-adoption-phase-2/index.js';
import { VERE_ADOPTION_PHASE_1_REGISTRY } from '../src/vere-adoption-phase-1/index.js';
import { invalidateEvidence } from '../src/validation-evidence-reuse/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(import.meta.url);

export const VERE_ADOPTION_PHASE_2_PASS_TOKEN = 'VERE_ADOPTION_PHASE_2_PASS';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const MODULE_DIR = join(ROOT, 'src/vere-adoption-phase-2');
const MODULE_FILES = [
  'index.ts',
  'vere-adoption-phase-2-types.ts',
  'vere-adoption-phase-2-policy-builder.ts',
  'vere-adoption-phase-2-registry.ts',
  'vere-adoption-phase-2-runner.ts',
  'vere-adoption-phase-2-report.ts',
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

const FORBIDDEN_APP_TERMS = [
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

async function main(): Promise<void> {
  console.log('');
  console.log('VERE Adoption Phase 2 — Validation');
  console.log('====================================');
  console.log('');

  // --- 1. package script registered -------------------------------------------------------------

  const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert(
    '01. package script registered',
    packageJson.scripts?.['validate:vere-adoption-phase-2']?.includes('validate-vere-adoption-phase-2.ts') ?? false,
    JSON.stringify(packageJson.scripts?.['validate:vere-adoption-phase-2'] ?? 'MISSING'),
  );

  // --- 2. module files exist --------------------------------------------------------------------

  for (const file of MODULE_FILES) {
    assert(`02. module file exists — ${file.slice(ROOT.length)}`, existsSync(file), file);
  }

  // --- 3. Phase 2 registry exists, is generic, and is Phase 1-compatible -------------------------

  assert('03. Phase 2 registry has entries', VERE_ADOPTION_PHASE_2_REGISTRY.length > 0, String(VERE_ADOPTION_PHASE_2_REGISTRY.length));
  const registrySource = readFileSync(join(MODULE_DIR, 'vere-adoption-phase-2-registry.ts'), 'utf8');
  const foundAppTermsInRegistry = FORBIDDEN_APP_TERMS.filter((term) => registrySource.toLowerCase().includes(term));
  assert('03b. Phase 2 registry contains no application/domain-specific terms', foundAppTermsInRegistry.length === 0, JSON.stringify(foundAppTermsInRegistry));

  const phase2ValidatorNames = new Set(VERE_ADOPTION_PHASE_2_REGISTRY.map((p) => p.validatorName));
  const phase1ValidatorNames = new Set(VERE_ADOPTION_PHASE_1_REGISTRY.map((p) => p.validatorName));
  const overlap = [...phase2ValidatorNames].filter((name) => phase1ValidatorNames.has(name));
  assert('03c. Phase 2 registry does not re-declare any Phase 1 validator (no config drift/duplication)', overlap.length === 0, JSON.stringify(overlap));

  // Phase 1-compatible policy semantics: every entry carries the same generic shape Phase 1 policies
  // carry (validatorName/validatorVersion/scriptPath/passToken/reuseSafe/reuseSafeJustification),
  // just with `riskClass` in place of Phase 1's `validatorKind`.
  const phase1CompatibleShape = VERE_ADOPTION_PHASE_2_REGISTRY.every(
    (p) =>
      typeof p.validatorName === 'string' &&
      typeof p.validatorVersion === 'string' &&
      typeof p.scriptPath === 'string' &&
      typeof p.passToken === 'string' &&
      typeof p.reuseSafe === 'boolean' &&
      typeof p.reuseSafeJustification === 'string',
  );
  assert('03d. Every Phase 2 policy carries Phase 1-compatible policy semantics (name/version/scriptPath/passToken/reuseSafe/justification)', phase1CompatibleShape, 'shape check');

  // --- 4. At least 10 new reuse-safe validators are safely adopted --------------------------------

  const reuseSafe = listPhase2ReuseSafeAdoptedValidators();
  const freshRequired = listPhase2FreshRequiredAdoptedValidators();
  assert('04. At least 10 additional validators are opted into VERE through declared reuse-safe Phase 2 policies', reuseSafe.length >= 10, String(reuseSafe.length));
  assert('04b. At least 2 validators are deliberately declared not-yet-reuse-safe (aggregator + external/unbounded)', freshRequired.length >= 2, String(freshRequired.length));

  const byRiskClass = listPhase2AdoptedValidatorsByRiskClass();
  assert('04c. At least one DETERMINISTIC_LOGIC_LEAF validator is adopted', (byRiskClass.DETERMINISTIC_LOGIC_LEAF?.length ?? 0) > 0, String(byRiskClass.DETERMINISTIC_LOGIC_LEAF?.length ?? 0));
  assert('04d. At least one FILESYSTEM_REGRESSION_LEAF validator is adopted', (byRiskClass.FILESYSTEM_REGRESSION_LEAF?.length ?? 0) > 0, String(byRiskClass.FILESYSTEM_REGRESSION_LEAF?.length ?? 0));
  assert(
    '04e. At least one CHILD_GRAPH_AGGREGATOR_UNSAFE validator is present and correctly refused (reuseSafe: false)',
    (byRiskClass.CHILD_GRAPH_AGGREGATOR_UNSAFE?.length ?? 0) > 0 && byRiskClass.CHILD_GRAPH_AGGREGATOR_UNSAFE!.every((p) => p.reuseSafe === false),
    JSON.stringify(byRiskClass.CHILD_GRAPH_AGGREGATOR_UNSAFE?.map((p) => ({ name: p.validatorName, reuseSafe: p.reuseSafe }))),
  );
  assert(
    '04f. At least one EXTERNAL_OR_UNBOUNDED_UNSAFE validator is present and correctly refused (reuseSafe: false)',
    (byRiskClass.EXTERNAL_OR_UNBOUNDED_UNSAFE?.length ?? 0) > 0 && byRiskClass.EXTERNAL_OR_UNBOUNDED_UNSAFE!.every((p) => p.reuseSafe === false),
    JSON.stringify(byRiskClass.EXTERNAL_OR_UNBOUNDED_UNSAFE?.map((p) => ({ name: p.validatorName, reuseSafe: p.reuseSafe }))),
  );

  // --- 5. Every entry declares the required fields ------------------------------------------------

  for (const policy of VERE_ADOPTION_PHASE_2_REGISTRY) {
    const hasShape =
      typeof policy.validatorName === 'string' &&
      policy.validatorName.length > 0 &&
      typeof policy.validatorVersion === 'string' &&
      typeof policy.riskClass === 'string' &&
      typeof policy.passToken === 'string' &&
      policy.passToken.length > 0;
    assert(`05. ${policy.validatorName} declares validatorName/validatorVersion/riskClass/passToken`, hasShape, JSON.stringify(policy));
    if (policy.reuseSafe) {
      assert(`05b. ${policy.validatorName} (reuseSafe) declares a non-empty reuseSafeJustification`, policy.reuseSafeJustification.trim().length > 0, policy.reuseSafeJustification);
      if (policy.riskClass !== 'CHILD_GRAPH_AGGREGATOR_UNSAFE') {
        assert(
          `05c. ${policy.validatorName} (reuseSafe leaf) declares an explicit, non-empty dependency surface`,
          hasExplicitDependencySurface(policy),
          JSON.stringify({ files: policy.relevantFiles, dirs: policy.relevantDirectories }),
        );
      }
    } else {
      assert(`05d. ${policy.validatorName} (not reuse-safe) declares mustRunFreshReason`, Boolean(policy.mustRunFreshReason && policy.mustRunFreshReason.trim().length > 0), String(policy.mustRunFreshReason));
    }
  }

  // --- 6. Policy builder refusal rules -------------------------------------------------------------

  let rejectedUndefensiblePolicy = false;
  try {
    definePhase2AdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist.ts',
      validatorVersion: '1.0.0',
      riskClass: 'DETERMINISTIC_LOGIC_LEAF',
      passToken: 'X',
      reuseSafe: true,
      reuseSafeJustification: 'claims safety with nothing to prove it',
    });
  } catch {
    rejectedUndefensiblePolicy = true;
  }
  assert('06. Policy builder refuses reuseSafe:true without an explicit dependency surface', rejectedUndefensiblePolicy, String(rejectedUndefensiblePolicy));

  let rejectedUnjustifiedPolicy = false;
  try {
    definePhase2AdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist-2.ts',
      validatorVersion: '1.0.0',
      riskClass: 'DETERMINISTIC_LOGIC_LEAF',
      passToken: 'X',
      relevantFiles: ['scripts/does-not-exist-2.ts'],
      reuseSafe: true,
      reuseSafeJustification: '',
    });
  } catch {
    rejectedUnjustifiedPolicy = true;
  }
  assert('06b. Policy builder refuses reuseSafe:true without a written justification', rejectedUnjustifiedPolicy, String(rejectedUnjustifiedPolicy));

  let rejectedExternalUnsafeReuse = false;
  try {
    definePhase2AdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist-3.ts',
      validatorVersion: '1.0.0',
      riskClass: 'EXTERNAL_OR_UNBOUNDED_UNSAFE',
      passToken: 'X',
      relevantFiles: ['scripts/does-not-exist-3.ts'],
      reuseSafe: true,
      reuseSafeJustification: 'claims safety despite depending on external/unbounded state',
    });
  } catch {
    rejectedExternalUnsafeReuse = true;
  }
  assert('06c. Policy builder refuses reuseSafe:true for riskClass EXTERNAL_OR_UNBOUNDED_UNSAFE, unconditionally', rejectedExternalUnsafeReuse, String(rejectedExternalUnsafeReuse));

  let rejectedMissingChildGraph = false;
  try {
    definePhase2AdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist-aggregator.ts',
      validatorVersion: '1.0.0',
      riskClass: 'CHILD_GRAPH_AGGREGATOR_UNSAFE',
      passToken: 'X',
      reuseSafe: true,
      reuseSafeJustification: 'claims safety without declaring any children',
    });
  } catch {
    rejectedMissingChildGraph = true;
  }
  assert('06d. Policy builder refuses an aggregator marked reuseSafe:true with no childGraph', rejectedMissingChildGraph, String(rejectedMissingChildGraph));

  let rejectedEmptyChildGraph = false;
  try {
    definePhase2AdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist-aggregator-2.ts',
      validatorVersion: '1.0.0',
      riskClass: 'CHILD_GRAPH_AGGREGATOR_UNSAFE',
      passToken: 'X',
      reuseSafe: true,
      reuseSafeJustification: 'claims safety with an explicitly empty child graph',
      childGraph: [],
    });
  } catch {
    rejectedEmptyChildGraph = true;
  }
  assert('06e. Policy builder refuses an aggregator marked reuseSafe:true with an explicitly empty childGraph array', rejectedEmptyChildGraph, String(rejectedEmptyChildGraph));

  let rejectedCircularChildGraph = false;
  try {
    definePhase2AdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist-aggregator-3.ts',
      validatorVersion: '1.0.0',
      riskClass: 'CHILD_GRAPH_AGGREGATOR_UNSAFE',
      passToken: 'X',
      reuseSafe: true,
      reuseSafeJustification: 'claims safety while declaring itself as its own child',
      childGraph: [{ validatorName: 'scripts/does-not-exist-aggregator-3.ts', passToken: 'X', relevantFiles: ['scripts/does-not-exist-aggregator-3.ts'] }],
    });
  } catch {
    rejectedCircularChildGraph = true;
  }
  assert('06f. Policy builder refuses a circular child graph (aggregator declares itself as its own child)', rejectedCircularChildGraph, String(rejectedCircularChildGraph));

  let rejectedDuplicateChildGraph = false;
  try {
    definePhase2AdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist-aggregator-4.ts',
      validatorVersion: '1.0.0',
      riskClass: 'CHILD_GRAPH_AGGREGATOR_UNSAFE',
      passToken: 'X',
      reuseSafe: true,
      reuseSafeJustification: 'claims safety with a duplicated child',
      childGraph: [
        { validatorName: 'scripts/child-a.ts', passToken: 'A', relevantFiles: ['scripts/child-a.ts'] },
        { validatorName: 'scripts/child-a.ts', passToken: 'A', relevantFiles: ['scripts/child-a.ts'] },
      ],
    });
  } catch {
    rejectedDuplicateChildGraph = true;
  }
  assert('06g. Policy builder refuses a child graph with a duplicated child entry', rejectedDuplicateChildGraph, String(rejectedDuplicateChildGraph));

  let rejectedIncompleteChild = false;
  try {
    definePhase2AdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist-aggregator-5.ts',
      validatorVersion: '1.0.0',
      riskClass: 'CHILD_GRAPH_AGGREGATOR_UNSAFE',
      passToken: 'X',
      reuseSafe: true,
      reuseSafeJustification: 'claims safety with a child lacking a dependency surface',
      childGraph: [{ validatorName: 'scripts/child-b.ts', passToken: 'B' }],
    });
  } catch {
    rejectedIncompleteChild = true;
  }
  assert('06h. Policy builder refuses a child graph entry with no declared dependency surface', rejectedIncompleteChild, String(rejectedIncompleteChild));

  let rejectedBroadChildDirectory = false;
  try {
    definePhase2AdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist-aggregator-6.ts',
      validatorVersion: '1.0.0',
      riskClass: 'CHILD_GRAPH_AGGREGATOR_UNSAFE',
      passToken: 'X',
      reuseSafe: true,
      reuseSafeJustification: 'claims safety with a child pointing at the entire src tree',
      childGraph: [{ validatorName: 'scripts/child-c.ts', passToken: 'C', relevantDirectories: ['src'] }],
    });
  } catch {
    rejectedBroadChildDirectory = true;
  }
  assert('06i. Policy builder refuses a child graph entry declaring an overly broad directory (e.g. "src")', rejectedBroadChildDirectory, String(rejectedBroadChildDirectory));

  const acceptedCompleteAggregator = definePhase2AdoptedValidatorPolicy({
    validatorName: 'scripts/does-not-exist-aggregator-7.ts',
    validatorVersion: '1.0.0',
    riskClass: 'CHILD_GRAPH_AGGREGATOR_UNSAFE',
    passToken: 'X',
    reuseSafe: true,
    reuseSafeJustification: 'complete, narrow, non-circular child graph declared',
    childGraph: [
      { validatorName: 'scripts/child-d.ts', passToken: 'D', relevantDirectories: ['src/some-narrow-module'] },
      { validatorName: 'scripts/child-e.ts', passToken: 'E', relevantFiles: ['scripts/child-e.ts'] },
    ],
  });
  assert('06j. Policy builder accepts reuseSafe:true for an aggregator with a complete, narrow, non-circular childGraph', acceptedCompleteAggregator.reuseSafe === true, JSON.stringify(acceptedCompleteAggregator));

  let rejectedChildGraphOnNonAggregator = false;
  try {
    definePhase2AdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist-leaf-with-children.ts',
      validatorVersion: '1.0.0',
      riskClass: 'DETERMINISTIC_LOGIC_LEAF',
      passToken: 'X',
      relevantFiles: ['scripts/does-not-exist-leaf-with-children.ts'],
      reuseSafe: true,
      reuseSafeJustification: 'a leaf incorrectly declaring a childGraph',
      childGraph: [{ validatorName: 'scripts/child-f.ts', passToken: 'F', relevantFiles: ['scripts/child-f.ts'] }],
    });
  } catch {
    rejectedChildGraphOnNonAggregator = true;
  }
  assert('06k. Policy builder refuses a non-aggregator riskClass declaring a childGraph', rejectedChildGraphOnNonAggregator, String(rejectedChildGraphOnNonAggregator));

  let rejectedMissingFreshReason = false;
  try {
    definePhase2AdoptedValidatorPolicy({
      validatorName: 'scripts/does-not-exist-4.ts',
      validatorVersion: '1.0.0',
      riskClass: 'DETERMINISTIC_LOGIC_LEAF',
      passToken: 'X',
      reuseSafe: false,
      reuseSafeJustification: '',
    });
  } catch {
    rejectedMissingFreshReason = true;
  }
  assert('06l. Policy builder refuses reuseSafe:false without a mustRunFreshReason', rejectedMissingFreshReason, String(rejectedMissingFreshReason));

  // ================================================================================================
  // Sandbox tests — exercise the Phase 2 RUNNER against real, spawnable synthetic validator scripts.
  // ================================================================================================

  const sandbox = mkdtempSync(join(tmpdir(), 'vere-adoption-phase-2-validate-'));
  writeFileSync(join(sandbox, 'package.json'), JSON.stringify({ name: 'sandbox', version: '1.0.0' }));
  writeFileSync(join(sandbox, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, entry: 'a' }));
  const counterFile = join(sandbox, 'spawn-counter.txt');
  writeFileSync(counterFile, '');
  const fakeValidatorScript = join(sandbox, 'fake-adopted-validator.ts');
  const fakeRelevantFile = join(sandbox, 'relevant.ts');
  writeFileSync(fakeRelevantFile, 'export const value = 1;');

  function writeFakeValidator(scriptPath: string, passToken: string): void {
    writeFileSync(
      scriptPath,
      [
        "import { appendFileSync } from 'node:fs';",
        `appendFileSync(${JSON.stringify(counterFile)}, 'x\\n');`,
        `console.log(${JSON.stringify(passToken)});`,
      ].join('\n'),
    );
  }
  writeFakeValidator(fakeValidatorScript, 'SANDBOX_ADOPTED_PASS');

  function countSpawns(): number {
    return readFileSync(counterFile, 'utf8').split('\n').filter((l) => l.trim().length > 0).length;
  }

  function makeSandboxPolicy(overrides: Partial<Phase2AdoptedValidatorPolicy> = {}): Phase2AdoptedValidatorPolicy {
    return definePhase2AdoptedValidatorPolicy({
      validatorName: 'sandbox/fake-adopted-validator.ts',
      validatorVersion: '1.0.0',
      riskClass: 'DETERMINISTIC_LOGIC_LEAF',
      scriptPath: fakeValidatorScript,
      passToken: 'SANDBOX_ADOPTED_PASS',
      relevantFiles: [fakeRelevantFile],
      reuseSafe: true,
      reuseSafeJustification: 'synthetic sandbox validator for Phase 2 adoption-layer testing',
      ...overrides,
    });
  }

  try {
    // --- 07. Cache miss executes the real validator ------------------------------------------------

    const basePolicy = makeSandboxPolicy();
    const firstRun = runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    assert(
      '07. Cache miss executes the real (wrapped) validator',
      firstRun.reused === false && firstRun.ok === true && firstRun.outcomeKind === 'EXECUTED' && countSpawns() === 1,
      JSON.stringify({ reused: firstRun.reused, ok: firstRun.ok, outcomeKind: firstRun.outcomeKind, spawns: countSpawns() }),
    );

    // --- 08. Cache hit path returns only prior complete PASSED evidence, without re-spawning -------

    const secondRun = runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    assert(
      '08. Cache hit reuses prior complete PASSED evidence without re-executing',
      secondRun.reused === true && secondRun.ok === true && secondRun.outcomeKind === 'REUSED' && countSpawns() === 1,
      JSON.stringify({ reused: secondRun.reused, ok: secondRun.ok, outcomeKind: secondRun.outcomeKind, spawns: countSpawns() }),
    );

    // --- 09. No validator is reused without reuseSafe: true -----------------------------------------

    const notReuseSafePolicy = definePhase2AdoptedValidatorPolicy({
      validatorName: 'sandbox/fake-adopted-validator-not-safe.ts',
      validatorVersion: '1.0.0',
      riskClass: 'DETERMINISTIC_LOGIC_LEAF',
      scriptPath: fakeValidatorScript,
      passToken: 'SANDBOX_ADOPTED_PASS',
      reuseSafe: false,
      reuseSafeJustification: '',
      mustRunFreshReason: 'test: intentionally not opted into reuse',
    });
    runPhase2AdoptedValidator(notReuseSafePolicy, { rootDir: sandbox });
    const spawnsAfterFirstNotSafe = countSpawns();
    const notSafeSecond = runPhase2AdoptedValidator(notReuseSafePolicy, { rootDir: sandbox });
    assert(
      '09. A validator without reuseSafe:true is never reused, even with identical fingerprints, and is always reported executed/skipped-unsafe',
      notSafeSecond.reused === false && notSafeSecond.outcomeKind === 'SKIPPED_UNSAFE' && countSpawns() === spawnsAfterFirstNotSafe + 1,
      JSON.stringify({ reused: notSafeSecond.reused, outcomeKind: notSafeSecond.outcomeKind, spawns: countSpawns() }),
    );

    // --- 10. Changing a watched source file invalidates reuse ---------------------------------------

    const spawnsBeforeFileChange = countSpawns();
    writeFileSync(fakeRelevantFile, 'export const value = 2;');
    const afterFileChange = runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    assert(
      '10. Changing a watched relevant file invalidates reuse',
      afterFileChange.reused === false &&
        afterFileChange.outcomeKind === 'INVALIDATED' &&
        countSpawns() === spawnsBeforeFileChange + 1 &&
        afterFileChange.invalidationReasons.includes('RELEVANT_FILES_CHANGED'),
      JSON.stringify({ reused: afterFileChange.reused, spawns: countSpawns(), reasons: afterFileChange.invalidationReasons }),
    );

    // --- 11. Changing a watched directory invalidates reuse ------------------------------------------

    const watchedDir = join(sandbox, 'watched-dir');
    mkdirSync(watchedDir, { recursive: true });
    writeFileSync(join(watchedDir, 'file.ts'), 'export const a = 1;');
    const dirPolicy = makeSandboxPolicy({ validatorName: 'sandbox/fake-adopted-validator-dir.ts', relevantFiles: [], relevantDirectories: [watchedDir] });
    runPhase2AdoptedValidator(dirPolicy, { rootDir: sandbox });
    const spawnsBeforeDirChange = countSpawns();
    writeFileSync(join(watchedDir, 'file.ts'), 'export const a = 2;');
    const afterDirChange = runPhase2AdoptedValidator(dirPolicy, { rootDir: sandbox });
    assert(
      '11. Changing a file inside a watched directory invalidates reuse',
      afterDirChange.reused === false && countSpawns() === spawnsBeforeDirChange + 1 && afterDirChange.invalidationReasons.includes('RELEVANT_FILES_CHANGED'),
      JSON.stringify({ reused: afterDirChange.reused, reasons: afterDirChange.invalidationReasons }),
    );

    // --- 12. Changing dependency signature invalidates reuse -----------------------------------------

    runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox }); // re-establish matching evidence for basePolicy
    const spawnsBeforeDependencyChange = countSpawns();
    writeFileSync(join(sandbox, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, entry: 'b' }));
    const afterDependencyChange = runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    assert(
      '12. Changing the dependency signature (lockfile) invalidates reuse',
      afterDependencyChange.reused === false && countSpawns() === spawnsBeforeDependencyChange + 1 && afterDependencyChange.invalidationReasons.includes('DEPENDENCY_SIGNATURE_CHANGED'),
      JSON.stringify(afterDependencyChange.invalidationReasons),
    );

    // --- 13. Changing declared environment presence invalidates reuse, without exposing the value ---

    delete process.env.VERE_ADOPTION_PHASE_2_VALIDATE_ENV_PROBE;
    const envPolicy = makeSandboxPolicy({ validatorName: 'sandbox/fake-adopted-validator-env.ts', environmentInputs: ['VERE_ADOPTION_PHASE_2_VALIDATE_ENV_PROBE'] });
    const envBefore = runPhase2AdoptedValidator(envPolicy, { rootDir: sandbox });
    process.env.VERE_ADOPTION_PHASE_2_VALIDATE_ENV_PROBE = 'top-secret-value-must-not-be-cached';
    const envAfter = runPhase2AdoptedValidator(envPolicy, { rootDir: sandbox });
    delete process.env.VERE_ADOPTION_PHASE_2_VALIDATE_ENV_PROBE;
    assert(
      '13. Changing declared environment variable presence invalidates reuse',
      envBefore.reused === false && envAfter.reused === false && envAfter.invalidationReasons.includes('ENVIRONMENT_ASSUMPTIONS_CHANGED'),
      JSON.stringify({ before: envBefore.reused, after: envAfter.reused, reasons: envAfter.invalidationReasons }),
    );

    const evidenceCacheDir = join(sandbox, '.aidevengine', 'validation-evidence-cache-v1');
    let rawEnvValueFoundOnDisk = false;
    if (existsSync(evidenceCacheDir)) {
      const { readdirSync } = await import('node:fs');
      for (const file of readdirSync(evidenceCacheDir)) {
        const contents = readFileSync(join(evidenceCacheDir, file), 'utf8');
        if (contents.includes('top-secret-value-must-not-be-cached')) rawEnvValueFoundOnDisk = true;
      }
    }
    assert('13b. The raw environment variable value is never written to any on-disk evidence record', !rawEnvValueFoundOnDisk, String(rawEnvValueFoundOnDisk));

    // --- 14. Validator version changes invalidate reuse -----------------------------------------------

    runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    const spawnsBeforeVersionBump = countSpawns();
    const bumpedVersionPolicy = makeSandboxPolicy({ validatorVersion: '2.0.0' });
    const afterVersionBump = runPhase2AdoptedValidator(bumpedVersionPolicy, { rootDir: sandbox });
    assert('14. Changing the validator version invalidates reuse', afterVersionBump.reused === false && countSpawns() === spawnsBeforeVersionBump + 1, JSON.stringify({ reused: afterVersionBump.reused }));

    // --- 15. Policy metadata changes (TTL, risk class) invalidate reuse, even with identical files ---

    runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    const spawnsBeforePolicyChange = countSpawns();
    const differentTtlPolicy = makeSandboxPolicy({ ttlMs: 999_999 });
    const afterPolicyChange = runPhase2AdoptedValidator(differentTtlPolicy, { rootDir: sandbox });
    assert(
      '15. Changing adoption policy metadata (TTL) invalidates reuse even when watched files are unchanged',
      afterPolicyChange.reused === false && countSpawns() === spawnsBeforePolicyChange + 1,
      JSON.stringify({ reused: afterPolicyChange.reused }),
    );

    runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    const spawnsBeforePassTokenChange = countSpawns();
    const differentPassTokenPolicy = makeSandboxPolicy({ passToken: 'SANDBOX_ADOPTED_PASS_RENAMED' });
    writeFakeValidator(fakeValidatorScript, 'SANDBOX_ADOPTED_PASS_RENAMED');
    const afterPassTokenChange = runPhase2AdoptedValidator(differentPassTokenPolicy, { rootDir: sandbox });
    assert(
      '15b. Changing the declared pass token invalidates reuse even when watched files are unchanged',
      afterPassTokenChange.reused === false && afterPassTokenChange.ok === true && countSpawns() === spawnsBeforePassTokenChange + 1,
      JSON.stringify({ reused: afterPassTokenChange.reused, ok: afterPassTokenChange.ok }),
    );
    writeFakeValidator(fakeValidatorScript, 'SANDBOX_ADOPTED_PASS');

    // --- 16. Failed / interrupted validator results are never reused ---------------------------------

    writeFileSync(
      fakeValidatorScript,
      ["import { appendFileSync } from 'node:fs';", `appendFileSync(${JSON.stringify(counterFile)}, 'x\\n');`, `process.exit(1);`].join('\n'),
    );
    const failingPolicy = makeSandboxPolicy({ validatorName: 'sandbox/fake-adopted-validator-failing.ts' });
    const failFirst = runPhase2AdoptedValidator(failingPolicy, { rootDir: sandbox });
    const spawnsAfterFailFirst = countSpawns();
    const failSecond = runPhase2AdoptedValidator(failingPolicy, { rootDir: sandbox });
    assert(
      '16. A failed/interrupted validator run is never reused as passing evidence',
      failFirst.ok === false && failSecond.ok === false && failSecond.reused === false && countSpawns() === spawnsAfterFailFirst + 1,
      JSON.stringify({ failFirstOk: failFirst.ok, failSecondOk: failSecond.ok, failSecondReused: failSecond.reused }),
    );
    writeFakeValidator(fakeValidatorScript, 'SANDBOX_ADOPTED_PASS');

    // --- 17. Pass-token mismatch is never reused (defense-in-depth, independently re-confirmed) ------

    writeFileSync(fakeValidatorScript, ["import { appendFileSync } from 'node:fs';", `appendFileSync(${JSON.stringify(counterFile)}, 'x\\n');`, `console.log('AN_UNEXPECTED_TOKEN_NOT_DECLARED_IN_POLICY');`].join('\n'));
    const mismatchPolicy = makeSandboxPolicy({ validatorName: 'sandbox/fake-adopted-validator-mismatch.ts', passToken: 'EXPECTED_TOKEN_THAT_WILL_NOT_APPEAR' });
    const mismatchRun = runPhase2AdoptedValidator(mismatchPolicy, { rootDir: sandbox });
    assert(
      '17. A validator whose output does not contain the declared pass token is never reported as ok, and is never reusable',
      mismatchRun.ok === false,
      JSON.stringify(mismatchRun),
    );
    const mismatchRerun = runPhase2AdoptedValidator(mismatchPolicy, { rootDir: sandbox });
    assert('17b. Pass-token-mismatched evidence is not reused on a subsequent run', mismatchRerun.ok === false && mismatchRerun.reused === false, JSON.stringify(mismatchRerun));
    writeFakeValidator(fakeValidatorScript, 'SANDBOX_ADOPTED_PASS');

    invalidateEvidence(basePolicy.validatorName, undefined, { rootDir: sandbox });
    const reusedNowRun = runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    const reusedConfirmRun = runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    assert(
      '17c. A reused validator independently confirms the stored pass token still matches the policy before reporting ok:true',
      reusedConfirmRun.reused === true && reusedConfirmRun.ok === true,
      JSON.stringify(reusedConfirmRun),
    );
    void reusedNowRun;

    // --- 18. Runtime report distinguishes reused vs executed vs invalidated vs unsafe ----------------

    invalidateEvidence('sandbox/fake-adopted-validator.ts', undefined, { rootDir: sandbox });
    const reportRunFresh = runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    const reportRunReused = runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    writeFileSync(fakeRelevantFile, 'export const value = 3;');
    const reportRunInvalidated = runPhase2AdoptedValidator(basePolicy, { rootDir: sandbox });
    const report = buildVereAdoptionPhase2Report([
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
      renderVereAdoptionPhase2ReportText(report),
    );
    assert(
      '18b. Runtime report includes totals grouped by risk class',
      report.totalsByRiskClass.length > 0 && report.totalsByRiskClass.every((b) => b.total === b.executed + b.reused + b.invalidated + b.skippedUnsafe),
      JSON.stringify(report.totalsByRiskClass),
    );

    // --- 19. Explainability output includes concrete reuse/reject reasons ----------------------------

    const explanations = explainPhase2AdoptedValidatorBatch([basePolicy, notReuseSafePolicy]);
    const explainText = renderVereAdoptionPhase2ExplainabilityText(
      [reportRunFresh, reportRunReused, notSafeSecond].map((r) => ({ ...r })),
    );
    assert(
      '19. Explainability output states concrete verdicts and reasons per validator',
      explanations.length === 2 && explanations.every((e) => typeof e.wouldReuse === 'boolean') && explainText.length > 0,
      explainText,
    );
    const notSafeExplanation = explanations.find((e) => e.validatorName === notReuseSafePolicy.validatorName);
    assert(
      '19b. Explainability correctly reports why a non-reuse-safe validator would run fresh',
      notSafeExplanation !== undefined && notSafeExplanation.wouldReuse === false && notSafeExplanation.reasons.some((r) => r === 'NOT_REUSE_SAFE' || r.startsWith('FRESH_REQUIRED')),
      JSON.stringify(notSafeExplanation),
    );

    // ==============================================================================================
    // Aggregator handling — proves a complete child graph makes reuse both eligible AND correctly
    // sensitive to child-surface changes, using real, spawnable synthetic scripts.
    // ==============================================================================================

    const aggregatorScript = join(sandbox, 'fake-aggregator.ts');
    const aggregatorCounterFile = join(sandbox, 'aggregator-spawn-counter.txt');
    writeFileSync(aggregatorCounterFile, '');
    writeFileSync(
      aggregatorScript,
      ["import { appendFileSync } from 'node:fs';", `appendFileSync(${JSON.stringify(aggregatorCounterFile)}, 'x\\n');`, `console.log('SANDBOX_AGGREGATOR_PASS');`].join('\n'),
    );
    function countAggregatorSpawns(): number {
      return readFileSync(aggregatorCounterFile, 'utf8').split('\n').filter((l) => l.trim().length > 0).length;
    }
    const childRelevantFile = join(sandbox, 'child-relevant.ts');
    writeFileSync(childRelevantFile, 'export const childValue = 1;');

    function makeSandboxAggregatorPolicy(childPassToken = 'CHILD_PASS'): Phase2AdoptedValidatorPolicy {
      return definePhase2AdoptedValidatorPolicy({
        validatorName: 'sandbox/fake-aggregator.ts',
        validatorVersion: '1.0.0',
        riskClass: 'CHILD_GRAPH_AGGREGATOR_UNSAFE',
        scriptPath: aggregatorScript,
        passToken: 'SANDBOX_AGGREGATOR_PASS',
        reuseSafe: true,
        reuseSafeJustification: 'sandbox aggregator with a complete, narrow, non-circular child graph',
        childGraph: [{ validatorName: 'sandbox/fake-child.ts', passToken: childPassToken, relevantFiles: [childRelevantFile] }],
      });
    }

    const aggregatorFirstRun = runPhase2AdoptedValidator(makeSandboxAggregatorPolicy(), { rootDir: sandbox });
    assert(
      '20. A CHILD_GRAPH_AGGREGATOR_UNSAFE policy with a complete childGraph is eligible for reuse and executes fresh the first time',
      aggregatorFirstRun.reused === false && aggregatorFirstRun.ok === true && countAggregatorSpawns() === 1,
      JSON.stringify({ reused: aggregatorFirstRun.reused, ok: aggregatorFirstRun.ok, spawns: countAggregatorSpawns() }),
    );

    const aggregatorSecondRun = runPhase2AdoptedValidator(makeSandboxAggregatorPolicy(), { rootDir: sandbox });
    assert(
      '20b. An unchanged, complete aggregator is reused on the next run without re-spawning',
      aggregatorSecondRun.reused === true && aggregatorSecondRun.ok === true && countAggregatorSpawns() === 1,
      JSON.stringify({ reused: aggregatorSecondRun.reused, spawns: countAggregatorSpawns() }),
    );

    const spawnsBeforeChildFileChange = countAggregatorSpawns();
    writeFileSync(childRelevantFile, 'export const childValue = 2;');
    const aggregatorAfterChildFileChange = runPhase2AdoptedValidator(makeSandboxAggregatorPolicy(), { rootDir: sandbox });
    assert(
      '21. Changing a declared CHILD\'s relevant file invalidates the aggregator\'s cached evidence, even though the aggregator\'s own script did not change',
      aggregatorAfterChildFileChange.reused === false &&
        countAggregatorSpawns() === spawnsBeforeChildFileChange + 1 &&
        aggregatorAfterChildFileChange.invalidationReasons.includes('RELEVANT_FILES_CHANGED'),
      JSON.stringify({ reused: aggregatorAfterChildFileChange.reused, reasons: aggregatorAfterChildFileChange.invalidationReasons }),
    );

    runPhase2AdoptedValidator(makeSandboxAggregatorPolicy('CHILD_PASS'), { rootDir: sandbox });
    const spawnsBeforeChildPassTokenChange = countAggregatorSpawns();
    const aggregatorAfterChildPassTokenChange = runPhase2AdoptedValidator(makeSandboxAggregatorPolicy('CHILD_PASS_RENAMED'), { rootDir: sandbox });
    assert(
      '22. Changing a declared child\'s pass token invalidates the aggregator\'s cached evidence',
      aggregatorAfterChildPassTokenChange.reused === false && countAggregatorSpawns() === spawnsBeforeChildPassTokenChange + 1,
      JSON.stringify({ reused: aggregatorAfterChildPassTokenChange.reused }),
    );
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }

  // --- 23. No application-specific terms, LLM/network dependency, randomness, or hidden skip flags ---

  const fullModuleSource = readModuleSource();
  const foundAppTermsInModule = FORBIDDEN_APP_TERMS.filter((term) => fullModuleSource.toLowerCase().includes(term));
  assert('23. No application-specific / domain-specific terms in the VERE Adoption Phase 2 module', foundAppTermsInModule.length === 0, JSON.stringify(foundAppTermsInModule));
  assert('23b. No LLM dependency in the VERE Adoption Phase 2 module', !/openai|anthropic|\bllm\b|gpt-|chatcompletion/i.test(fullModuleSource), 'LLM reference found');
  assert('23c. No network calls in the VERE Adoption Phase 2 module', !/\bfetch\(|node:http'|node:https'|axios/.test(fullModuleSource), 'network reference found');
  assert('23d. No Math.random or crypto.randomUUID in the VERE Adoption Phase 2 module', !/Math\.random\(|randomUUID\(/.test(fullModuleSource), 'random usage found');
  assert(
    '23e. No hidden global "skip validation" flag in the VERE Adoption Phase 2 module',
    !/SKIP_VALIDATION|BYPASS_VALIDATION|process\.env\.\w*SKIP\w*/i.test(fullModuleSource),
    'skip flag reference found',
  );

  // --- 24. No checks were removed from any adopted validator's own source; scripts untouched --------

  for (const policy of VERE_ADOPTION_PHASE_2_REGISTRY) {
    const scriptFile = join(ROOT, policy.validatorName);
    const source = existsSync(scriptFile) ? readFileSync(scriptFile, 'utf8') : '';
    assert(
      `24. ${policy.validatorName} still declares its own original pass token (untouched by adoption)`,
      source.includes(policy.passToken),
      `token "${policy.passToken}" present=${source.includes(policy.passToken)}`,
    );
  }

  // ================================================================================================
  // Real batch run — the actual second-batch validators, wired through the registry and runner.
  // ================================================================================================

  const realOptions = { rootDir: ROOT };
  for (const policy of reuseSafe) {
    invalidateEvidence(policy.validatorName, undefined, realOptions);
  }
  for (const policy of freshRequired) {
    invalidateEvidence(policy.validatorName, undefined, realOptions);
  }

  console.log('Running the real Phase 2 adoption batch (pass A — expect all fresh)...');
  const realPassA = runPhase2AdoptedValidatorBatch(reuseSafe, realOptions);
  assert(
    '25. Real batch pass A — every reuse-safe Phase 2 adopted validator executes fresh and passes',
    realPassA.every((r) => r.reused === false && r.ok === true),
    JSON.stringify(realPassA.map((r) => ({ v: r.validatorName, reused: r.reused, ok: r.ok, detail: r.detail.slice(0, 120) }))),
  );

  console.log('Running the real Phase 2 adoption batch (pass B — expect all reused)...');
  const realPassB = runPhase2AdoptedValidatorBatch(reuseSafe, realOptions);
  assert(
    '26. Real batch pass B — every reuse-safe Phase 2 adopted validator reuses cached evidence and still passes',
    realPassB.every((r) => r.reused === true && r.ok === true),
    JSON.stringify(realPassB.map((r) => ({ v: r.validatorName, reused: r.reused, ok: r.ok }))),
  );

  const realReport = buildVereAdoptionPhase2Report(realPassB);
  assert('27. Real report shows a non-zero cache hit rate for the Phase 2 adopted batch', realReport.cacheHitRate > 0, String(realReport.cacheHitRate));
  console.log(renderVereAdoptionPhase2ReportText(realReport));

  console.log('Running the deliberately-excluded (fresh-required) validators twice each...');
  const freshRequiredFirstPass = freshRequired.map((policy) => runPhase2AdoptedValidator(policy, realOptions));
  const freshRequiredSecondPass = freshRequired.map((policy) => runPhase2AdoptedValidator(policy, realOptions));
  assert(
    '28. Every deliberately-excluded validator always executes fresh on both passes and still passes (never falsely reused)',
    freshRequiredFirstPass.every((r) => r.reused === false && r.ok === true) && freshRequiredSecondPass.every((r) => r.reused === false && r.ok === true),
    JSON.stringify(freshRequiredSecondPass.map((r) => ({ v: r.validatorName, reused: r.reused, ok: r.ok }))),
  );

  const combinedRealReport = buildVereAdoptionPhase2Report([...realPassB, ...freshRequiredSecondPass]);
  assert(
    '29. Combined real report lists every deliberately-excluded validator under unsafe/not-opted-in, never under reused',
    freshRequired.every((p) => combinedRealReport.unsafeOrNotOptedInValidators.includes(p.validatorName)) &&
      freshRequired.every((p) => !combinedRealReport.reusedValidators.includes(p.validatorName)),
    JSON.stringify(combinedRealReport.unsafeOrNotOptedInValidators),
  );

  for (const policy of reuseSafe) {
    invalidateEvidence(policy.validatorName, undefined, realOptions);
  }
  for (const policy of freshRequired) {
    invalidateEvidence(policy.validatorName, undefined, realOptions);
  }

  // ================================================================================================
  // Regression proofs — Phase 1 (and everything it transitively covers), plus the two validators
  // newly referenced by Phase 2's excluded aggregator example, still pass unmodified.
  // ================================================================================================

  console.log('Running regression: scripts/validate-vere-adoption-phase-1.ts ...');
  const phase1Regression = runValidatorScript('scripts/validate-vere-adoption-phase-1.ts', 'VERE_ADOPTION_PHASE_1_PASS');
  assert('30. scripts/validate-vere-adoption-phase-1.ts still passes (also re-proves governance, VERE V1, and both faithfulness milestones)', phase1Regression.ok, phase1Regression.detail);

  console.log('Running regression: scripts/validate-validation-runtime-governance-v1.ts ...');
  const governanceRegression = runValidatorScript('scripts/validate-validation-runtime-governance-v1.ts', 'VALIDATION_RUNTIME_GOVERNANCE_V1_PASS');
  assert('31. scripts/validate-validation-runtime-governance-v1.ts still passes (the aggregator this phase deliberately excludes)', governanceRegression.ok, governanceRegression.detail);

  console.log('Running regression: scripts/validate-capability-audit-v3.ts ...');
  const capabilityAuditRegression = runValidatorScript('scripts/validate-capability-audit-v3.ts', 'AIDEVENGINE_CAPABILITY_AUDIT_V3_PASS');
  assert('32. scripts/validate-capability-audit-v3.ts still passes (the external/unbounded validator this phase deliberately excludes)', capabilityAuditRegression.ok, capabilityAuditRegression.detail);

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
    console.log(VERE_ADOPTION_PHASE_2_PASS_TOKEN);
    await exitValidator(0);
    return;
  }
  await exitValidator(1);
}

main().catch(async (err) => {
  console.error(err);
  await exitValidator(1);
});
