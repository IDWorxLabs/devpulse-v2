/**
 * BUILD_REALITY_AUTOFIX_ENGINE_V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  BUILD_REALITY_AUTOFIX_ENGINE_V1_PASS,
  BUILD_REALITY_AUTOFIX_PLAYWRIGHT_INSTALL_COMMAND,
  classifyBuildRealityFailures,
  createAutofixFixtureWorkspace,
  createCustomValidationRunner,
  createPlaywrightUnavailableEvidence,
  createUnknownUnsafeEvidence,
  injectDomInteractionFailure,
  injectImportExportMismatch,
  injectMissingModule,
  injectRootMountMismatch,
  injectValidatorHarnessFailure,
  runBuildRealityAutofix,
  selectPrimaryFailureClass,
  validateDomInteractionFixture,
  validateImportExportFixture,
  validateMissingModuleFixture,
  validatePassingFixture,
  validateRootMountFixture,
  validateValidatorHarnessFixture,
} from '../src/build-reality-autofix-engine-v1/index.js';
import { buildEvidenceFromValidationResult } from '../src/build-reality-autofix-engine-v1/build-reality-autofix-classifier.js';
import { finishValidator } from './lib/validator-clean-exit.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readModuleSources(): Record<string, string> {
  const moduleDir = join(ROOT, 'src/build-reality-autofix-engine-v1');
  return {
    engine: readFileSync(join(moduleDir, 'build-reality-autofix-engine.ts'), 'utf8'),
    classifier: readFileSync(join(moduleDir, 'build-reality-autofix-classifier.ts'), 'utf8'),
    planner: readFileSync(join(moduleDir, 'build-reality-autofix-planner.ts'), 'utf8'),
    patcher: readFileSync(join(moduleDir, 'build-reality-autofix-patcher.ts'), 'utf8'),
    authority: readFileSync(join(ROOT, 'src/end-to-end-build-reality-engine-v1/e2e-build-reality-authority.ts'), 'utf8'),
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('BUILD_REALITY_AUTOFIX_ENGINE_V1 — Validation');
  console.log('============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const sources = readModuleSources();
  const moduleDir = join(ROOT, 'src/build-reality-autofix-engine-v1');
  const typesSource = readFileSync(join(moduleDir, 'build-reality-autofix-types.ts'), 'utf8');
  const combined = Object.values(sources).join('\n');

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:build-reality-autofix-engine-v1']), 'package.json');
  assert('02. module directory exists', existsSync(moduleDir), moduleDir);
  assert('03. required module files exist', [
    'index.ts',
    'build-reality-autofix-types.ts',
    'build-reality-autofix-engine.ts',
    'build-reality-autofix-classifier.ts',
    'build-reality-autofix-planner.ts',
    'build-reality-autofix-patcher.ts',
    'build-reality-autofix-validator.ts',
    'build-reality-autofix-report.ts',
  ].every((file) => existsSync(join(moduleDir, file))), 'files');
  assert('04. pass token defined', typesSource.includes(BUILD_REALITY_AUTOFIX_ENGINE_V1_PASS), 'pass token');
  assert('05. max attempts bounded', typesSource.includes('BUILD_REALITY_AUTOFIX_MAX_ATTEMPTS = 3'), 'max attempts');
  assert('06. e2e pipeline optional hook', sources.authority.includes('runBuildRealityAutofix'), 'e2e hook');

  assert(
    '08a. generality audit — no calculator hardcoding',
    !/\bcalculator\b/i.test(combined.replace(/demo-feature/g, '')),
    'calculator',
  );
  assert(
    '08b. generality audit — no todo hardcoding',
    !/\btodo\b/i.test(combined.replace(/demo-feature/g, '')),
    'todo',
  );
  assert(
    '08c. generality audit — no expense-tracker hardcoding',
    !/expense-tracker/i.test(combined),
    'expense-tracker',
  );
  assert('08d. generality audit — no LISA hardcoding', !/\blisa\b/i.test(combined), 'lisa');
  assert(
    '08e. generality audit — failure classes drive repair',
    sources.planner.includes('primaryFailureClass') && sources.classifier.includes('BuildRealityAutofixFailureClass'),
    'failure classes',
  );

  const fixtureRoot = mkdtempSync(join(tmpdir(), 'build-reality-autofix-'));

  try {
    const passing = createAutofixFixtureWorkspace(fixtureRoot, 'passing');
    const passingResult = await runBuildRealityAutofix({
      workspaceDir: passing.workspaceDir,
      validationCommand: 'fixture:passing',
      runValidation: createCustomValidationRunner({
        workspaceDir: passing.workspaceDir,
        validate: validatePassingFixture,
      }),
    });
    assert('07a. already passing — no patch', passingResult.report.filesTouched.length === 0, String(passingResult.report.filesTouched.length));
    assert('07b. already passing — AUTOFIX_NOT_NEEDED', passingResult.report.verdict === 'AUTOFIX_NOT_NEEDED', passingResult.report.verdict);
    assert('07c. already passing — final validation pass', passingResult.finalValidationPassed, String(passingResult.finalValidationPassed));

    const importFixture = createAutofixFixtureWorkspace(fixtureRoot, 'import-export');
    injectImportExportMismatch(importFixture.workspaceDir);
    const importResult = await runBuildRealityAutofix({
      workspaceDir: importFixture.workspaceDir,
      validationCommand: 'fixture:import-export',
      runValidation: createCustomValidationRunner({
        workspaceDir: importFixture.workspaceDir,
        validate: (workspaceDir) => {
          const result = validateImportExportFixture(workspaceDir);
          return { ...result, typescriptOutput: result.typescriptOutput ?? undefined };
        },
      }),
    });
    const importPrimary = selectPrimaryFailureClass(
      classifyBuildRealityFailures(
        buildEvidenceFromValidationResult({
          workspaceDir: importFixture.workspaceDir,
          detail: 'Import/export mismatch',
          passed: false,
          typescriptOutput: "Cannot find module './features/__broken_export__'",
        }),
      ),
    );
    assert(
      '09a. import/export classified',
      ['IMPORT_EXPORT_MISMATCH', 'TYPESCRIPT_COMPILE_FAILURE', 'MISSING_FILE_OR_MODULE'].includes(importPrimary),
      importPrimary,
    );
    assert('09b. import/export patch applied', importResult.report.filesTouched.length > 0, String(importResult.report.filesTouched.length));
    assert('09c. import/export validation passes', importResult.finalValidationPassed, importResult.report.finalValidationDetail);

    const missingFixture = createAutofixFixtureWorkspace(fixtureRoot, 'missing-module');
    injectMissingModule(missingFixture.workspaceDir);
    const missingResult = await runBuildRealityAutofix({
      workspaceDir: missingFixture.workspaceDir,
      validationCommand: 'fixture:missing-module',
      runValidation: createCustomValidationRunner({
        workspaceDir: missingFixture.workspaceDir,
        validate: (workspaceDir) => {
          const result = validateMissingModuleFixture(workspaceDir);
          return { ...result, typescriptOutput: result.typescriptOutput ?? undefined };
        },
      }),
    });
    assert(
      '10a. missing module classified',
      missingResult.report.primaryFailureClass === 'MISSING_FILE_OR_MODULE' ||
        missingResult.report.failureFindings.some((finding) => finding.failureClass === 'MISSING_FILE_OR_MODULE'),
      missingResult.report.primaryFailureClass ?? 'none',
    );
    assert('10b. missing module patch applied', missingResult.report.filesTouched.length > 0, String(missingResult.report.filesTouched.length));
    assert('10c. missing module validation passes', missingResult.finalValidationPassed, missingResult.report.finalValidationDetail);

    const rootFixture = createAutofixFixtureWorkspace(fixtureRoot, 'root-mount');
    injectRootMountMismatch(rootFixture.workspaceDir);
    const rootResult = await runBuildRealityAutofix({
      workspaceDir: rootFixture.workspaceDir,
      rawPrompt: 'build a demo feature app',
      validationCommand: 'fixture:root-mount',
      runValidation: createCustomValidationRunner({
        workspaceDir: rootFixture.workspaceDir,
        validate: (workspaceDir) => {
          const result = validateRootMountFixture(workspaceDir);
          return { ...result, domFailureDetail: result.detail };
        },
      }),
    });
    assert(
      '11a. root mount classified',
      rootResult.report.primaryFailureClass === 'ROUTE_OR_ROOT_MOUNT_MISMATCH' ||
        rootResult.report.failureFindings.some((finding) =>
          ['ROUTE_OR_ROOT_MOUNT_MISMATCH', 'CONTRACT_PRIMARY_FEATURE_NOT_RENDERED'].includes(finding.failureClass),
        ),
      rootResult.report.primaryFailureClass ?? 'none',
    );
    assert('11b. root mount patch applied', rootResult.report.filesTouched.some((file) => file.endsWith('App.tsx')), rootResult.report.filesTouched.join(', '));
    assert('11c. root mount validation passes', rootResult.finalValidationPassed, rootResult.report.finalValidationDetail);

    const domFixture = createAutofixFixtureWorkspace(fixtureRoot, 'dom-interaction');
    injectDomInteractionFailure(domFixture.workspaceDir);
    const domResult = await runBuildRealityAutofix({
      workspaceDir: domFixture.workspaceDir,
      validationCommand: 'fixture:dom-interaction',
      runValidation: createCustomValidationRunner({
        workspaceDir: domFixture.workspaceDir,
        validate: (workspaceDir) => {
          const result = validateDomInteractionFixture(workspaceDir);
          return { ...result, domFailureDetail: result.domFailureDetail ?? undefined };
        },
      }),
    });
    assert(
      '12a. dom interaction classified',
      domResult.report.primaryFailureClass === 'DOM_INTERACTION_FAILURE' ||
        domResult.report.failureFindings.some((finding) => finding.failureClass === 'DOM_INTERACTION_FAILURE'),
      domResult.report.primaryFailureClass ?? 'none',
    );
    assert('12b. dom interaction patch applied', domResult.report.filesTouched.length > 0, domResult.report.filesTouched.join(', '));
    assert('12c. dom interaction validation passes', domResult.finalValidationPassed, domResult.report.finalValidationDetail);

    const playwrightEvidence = createPlaywrightUnavailableEvidence();
    const playwrightResult = await runBuildRealityAutofix({
      validationCommand: 'fixture:playwright-env',
      runValidation: async () => ({
        readOnly: true,
        passed: false,
        detail: playwrightEvidence.detail,
        evidence: buildEvidenceFromValidationResult({
          detail: playwrightEvidence.detail,
          passed: false,
          playwrightDetail: playwrightEvidence.playwrightDetail,
        }),
      }),
    });
    assert(
      '13a. playwright classified',
      playwrightResult.report.primaryFailureClass === 'PLAYWRIGHT_OR_BROWSER_ENVIRONMENT_FAILURE',
      playwrightResult.report.primaryFailureClass ?? 'none',
    );
    assert('13b. playwright AUTOFIX_BLOCKED', playwrightResult.report.verdict === 'AUTOFIX_BLOCKED', playwrightResult.report.verdict);
    assert('13c. playwright no code patch', playwrightResult.report.filesTouched.length === 0, String(playwrightResult.report.filesTouched.length));
    assert(
      '13d. playwright install command',
      playwrightResult.report.blockedCommand === BUILD_REALITY_AUTOFIX_PLAYWRIGHT_INSTALL_COMMAND,
      playwrightResult.report.blockedCommand ?? 'missing',
    );

    const unsafeResult = await runBuildRealityAutofix({
      validationCommand: 'fixture:unknown-unsafe',
      runValidation: async () => {
        const unsafe = createUnknownUnsafeEvidence();
        return {
          readOnly: true,
          passed: false,
          detail: unsafe.detail,
          evidence: buildEvidenceFromValidationResult({
            detail: unsafe.detail,
            passed: false,
          }),
        };
      },
    });
    assert(
      '14a. unknown unsafe verdict',
      unsafeResult.report.verdict === 'AUTOFIX_UNSAFE' || unsafeResult.report.verdict === 'AUTOFIX_EXHAUSTED',
      unsafeResult.report.verdict,
    );
    assert('14b. unknown unsafe no blind patch', unsafeResult.report.filesTouched.length === 0, String(unsafeResult.report.filesTouched.length));

    const harnessFixture = createAutofixFixtureWorkspace(fixtureRoot, 'validator-harness');
    injectValidatorHarnessFailure(harnessFixture.workspaceDir);
    const harnessResult = await runBuildRealityAutofix({
      workspaceDir: harnessFixture.workspaceDir,
      validationCommand: 'fixture:validator-harness',
      runValidation: createCustomValidationRunner({
        workspaceDir: harnessFixture.workspaceDir,
        validate: (workspaceDir) => {
          const result = validateValidatorHarnessFixture(workspaceDir);
          return { ...result, validatorHarnessDetail: result.validatorHarnessDetail ?? undefined };
        },
      }),
    });
    assert(
      '15a. validator harness classified',
      harnessResult.report.primaryFailureClass === 'VALIDATOR_HARNESS_FAILURE' ||
        harnessResult.report.failureFindings.some((finding) => finding.failureClass === 'VALIDATOR_HARNESS_FAILURE'),
      harnessResult.report.primaryFailureClass ?? 'none',
    );
    assert('15b. validator harness repaired', harnessResult.finalValidationPassed, harnessResult.report.finalValidationDetail);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }

  console.log('');
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    if (!check.passed) console.log(`       ${check.detail}`);
  }

  const failed = results.filter((check) => !check.passed);
  console.log('');
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  console.log('');

  if (failed.length === 0) {
    console.log(BUILD_REALITY_AUTOFIX_ENGINE_V1_PASS);
    await finishValidator(0);
  } else {
    await finishValidator(1);
  }
}

main().catch(async (error) => {
  console.error(error);
  await finishValidator(1);
});
