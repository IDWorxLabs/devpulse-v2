/**
 * REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  REPO_TYPECHECK_MAX_REPAIR_CYCLES,
  REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1_PASS,
  classifyTypeScriptDiagnostic,
  createRepoTypecheckFixtureWorkspace,
  discoverRepositoryTypecheckCommand,
  groupDiagnosticsByRootCause,
  injectBrokenImportPathFixture,
  injectCleanFixture,
  injectDuplicateIdentifierFixture,
  injectMissingExportFixture,
  injectMultipleDownstreamFixture,
  injectReadonlyMutationFixture,
  injectRegressionTrapFixture,
  injectUnsafeFixture,
  injectUnusedImportFixture,
  runRepositoryTypecheckScan,
  runRepositoryTypecheckStabilization,
  selectPrimaryRootCause,
} from '../src/repo-typecheck-stabilization-authority-v1/index.js';
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
  const moduleDir = join(ROOT, 'src/repo-typecheck-stabilization-authority-v1');
  const files = [
    'repo-typecheck-engine.ts',
    'repo-typecheck-scanner.ts',
    'repo-typecheck-classifier.ts',
    'repo-typecheck-repair-planner.ts',
    'repo-typecheck-safe-patcher.ts',
    'repo-typecheck-validator.ts',
    'repo-typecheck-report.ts',
    'repo-typecheck-types.ts',
  ];
  const sources: Record<string, string> = {};
  for (const file of files) {
    sources[file] = readFileSync(join(moduleDir, file), 'utf8');
  }
  return sources;
}

async function main(): Promise<void> {
  console.log('');
  console.log('REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — Validation');
  console.log('======================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const sources = readModuleSources();
  const combined = Object.values(sources).join('\n');
  const moduleDir = join(ROOT, 'src/repo-typecheck-stabilization-authority-v1');

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:repo-typecheck-stabilization-authority-v1']), 'package.json');
  assert('02. module directory exists', existsSync(moduleDir), moduleDir);
  assert(
    '03. required module files exist',
    [
      'index.ts',
      'repo-typecheck-types.ts',
      'repo-typecheck-engine.ts',
      'repo-typecheck-scanner.ts',
      'repo-typecheck-classifier.ts',
      'repo-typecheck-repair-planner.ts',
      'repo-typecheck-safe-patcher.ts',
      'repo-typecheck-validator.ts',
      'repo-typecheck-report.ts',
    ].every((file) => existsSync(join(moduleDir, file))),
    'files',
  );
  assert('04. pass token defined', combined.includes(REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1_PASS), 'pass token');
  assert('05. max repair cycles bounded', combined.includes(`REPO_TYPECHECK_MAX_REPAIR_CYCLES = ${REPO_TYPECHECK_MAX_REPAIR_CYCLES}`), 'max cycles');
  assert('06. typecheck command discovery', sources['repo-typecheck-scanner.ts']!.includes('discoverRepositoryTypecheckCommand'), 'discovery');
  assert('07. rollback on regression', sources['repo-typecheck-engine.ts']!.includes('rollbackPatchSnapshot'), 'rollback');
  assert('08. no suppress errors', !combined.includes('@ts-ignore') && !combined.includes('// @ts-nocheck'), 'no suppress');
  assert('09. no strict disable', !combined.includes('"strict": false') && !combined.includes('strict: false'), 'strict intact');

  assert(
    '10a. generality audit — no calculator hardcoding',
    !/\bcalculator\b/i.test(combined),
    'calculator',
  );
  assert('10b. generality audit — no todo hardcoding', !/\btodo\b/i.test(combined), 'todo');
  assert('10c. generality audit — no expense-tracker hardcoding', !/expense-tracker/i.test(combined), 'expense-tracker');
  assert('10d. generality audit — no LISA hardcoding', !/\blisa\b/i.test(combined), 'lisa');
  assert('10e. generality audit — no auth assumptions', !/\bauthentication\b/i.test(combined), 'authentication');
  assert(
    '10f. generality audit — diagnostics drive repair',
    sources['repo-typecheck-repair-planner.ts']!.includes('groupDiagnosticsByRootCause') &&
      sources['repo-typecheck-classifier.ts']!.includes('RepoTypecheckFailureClass'),
    'diagnostics',
  );

  const discovered = discoverRepositoryTypecheckCommand(ROOT);
  assert('11. repository command discovered', discovered.includes('typecheck') || discovered.includes('tsc'), discovered);

  const fixtureRoot = mkdtempSync(join(tmpdir(), 'repo-typecheck-stabilization-'));

  try {
    const clean = createRepoTypecheckFixtureWorkspace(fixtureRoot, 'clean');
    injectCleanFixture(clean.workspaceDir);
    const cleanResult = runRepositoryTypecheckStabilization({ projectRootDir: clean.workspaceDir });
    assert('12a. clean — TYPECHECK_ALREADY_CLEAN', cleanResult.report.verdict === 'TYPECHECK_ALREADY_CLEAN', cleanResult.report.verdict);
    assert('12b. clean — typecheck clean', cleanResult.typecheckClean, String(cleanResult.typecheckClean));
    assert('12c. clean — pass token', cleanResult.report.passToken === REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1_PASS, String(cleanResult.report.passToken));

    const importFixture = createRepoTypecheckFixtureWorkspace(fixtureRoot, 'import-path');
    injectBrokenImportPathFixture(importFixture.workspaceDir);
    const importBefore = runRepositoryTypecheckScan({ projectRootDir: importFixture.workspaceDir });
    const importClass = classifyTypeScriptDiagnostic(
      importBefore.diagnostics[0]?.code ?? 'TS2307',
      importBefore.diagnostics[0]?.message ?? '',
    );
    const importResult = runRepositoryTypecheckStabilization({ projectRootDir: importFixture.workspaceDir });
    assert('13a. import path classified', ['IMPORT_PATH_ERROR', 'MODULE_NOT_FOUND'].includes(importClass), importClass);
    assert('13b. import path repaired', importResult.typecheckClean, importResult.report.verdict);
    assert('13c. import path verdict', importResult.report.verdict === 'TYPECHECK_REPAIRED', importResult.report.verdict);

    const exportFixture = createRepoTypecheckFixtureWorkspace(fixtureRoot, 'missing-export');
    injectMissingExportFixture(exportFixture.workspaceDir);
    const exportBefore = runRepositoryTypecheckScan({ projectRootDir: exportFixture.workspaceDir });
    const exportClass = exportBefore.diagnostics[0]?.failureClass ?? 'UNKNOWN';
    const exportResult = runRepositoryTypecheckStabilization({ projectRootDir: exportFixture.workspaceDir });
    assert('14a. missing export classified', exportClass === 'EXPORT_NOT_FOUND', exportClass);
    assert('14b. missing export repaired', exportResult.typecheckClean, exportResult.report.verdict);
    assert('14c. missing export verdict', exportResult.report.verdict === 'TYPECHECK_REPAIRED', exportResult.report.verdict);

    const readonlyFixture = createRepoTypecheckFixtureWorkspace(fixtureRoot, 'readonly');
    injectReadonlyMutationFixture(readonlyFixture.workspaceDir);
    const readonlyBefore = runRepositoryTypecheckScan({ projectRootDir: readonlyFixture.workspaceDir });
    const readonlyClass = readonlyBefore.diagnostics[0]?.failureClass ?? 'UNKNOWN';
    const readonlyResult = runRepositoryTypecheckStabilization({ projectRootDir: readonlyFixture.workspaceDir });
    assert('15a. readonly classified', readonlyClass === 'READONLY_MUTATION', readonlyClass);
    assert('15b. readonly repaired', readonlyResult.typecheckClean, readonlyResult.report.verdict);
    assert('15c. readonly verdict', readonlyResult.report.verdict === 'TYPECHECK_REPAIRED', readonlyResult.report.verdict);

    const duplicateFixture = createRepoTypecheckFixtureWorkspace(fixtureRoot, 'duplicate');
    injectDuplicateIdentifierFixture(duplicateFixture.workspaceDir);
    const duplicateBefore = runRepositoryTypecheckScan({ projectRootDir: duplicateFixture.workspaceDir });
    const duplicateClass = duplicateBefore.diagnostics[0]?.failureClass ?? 'UNKNOWN';
    const duplicateResult = runRepositoryTypecheckStabilization({ projectRootDir: duplicateFixture.workspaceDir });
    assert('16a. duplicate classified', duplicateClass === 'DUPLICATE_IDENTIFIER', duplicateClass);
    assert('16b. duplicate repaired', duplicateResult.typecheckClean, duplicateResult.report.verdict);
    assert('16c. duplicate verdict', duplicateResult.report.verdict === 'TYPECHECK_REPAIRED', duplicateResult.report.verdict);

    const unusedFixture = createRepoTypecheckFixtureWorkspace(fixtureRoot, 'unused-import');
    injectUnusedImportFixture(unusedFixture.workspaceDir);
    const unusedBefore = runRepositoryTypecheckScan({ projectRootDir: unusedFixture.workspaceDir });
    const unusedClass =
      unusedBefore.diagnostics.find((d) => ['UNUSED_IMPORT', 'UNUSED_VARIABLE'].includes(d.failureClass))
        ?.failureClass ?? 'UNKNOWN';
    const unusedResult = runRepositoryTypecheckStabilization({ projectRootDir: unusedFixture.workspaceDir });
    assert('17a. unused import classified', ['UNUSED_IMPORT', 'UNUSED_VARIABLE'].includes(unusedClass), unusedClass);
    assert('17b. unused import repaired', unusedResult.typecheckClean, unusedResult.report.verdict);
    assert('17c. unused import verdict', unusedResult.report.verdict === 'TYPECHECK_REPAIRED', unusedResult.report.verdict);

    const downstreamFixture = createRepoTypecheckFixtureWorkspace(fixtureRoot, 'downstream');
    injectMultipleDownstreamFixture(downstreamFixture.workspaceDir);
    const downstreamBefore = runRepositoryTypecheckScan({ projectRootDir: downstreamFixture.workspaceDir });
    const groups = groupDiagnosticsByRootCause(downstreamBefore.diagnostics);
    const primary = selectPrimaryRootCause(groups);
    const downstreamResult = runRepositoryTypecheckStabilization({ projectRootDir: downstreamFixture.workspaceDir });
    assert('18a. downstream initial errors >= 3', downstreamBefore.errorCount >= 3, String(downstreamBefore.errorCount));
    assert('18b. downstream root cause selected', primary?.failureClass === 'EXPORT_NOT_FOUND', primary?.failureClass ?? 'none');
    assert('18c. downstream single patch cycle', downstreamResult.report.repairCycles <= 1, String(downstreamResult.report.repairCycles));
    assert('18d. downstream repaired', downstreamResult.typecheckClean, downstreamResult.report.verdict);
    assert(
      '18e. downstream errors collapsed',
      downstreamResult.report.errorsRemoved >= 2,
      String(downstreamResult.report.errorsRemoved),
    );

    const unsafeFixture = createRepoTypecheckFixtureWorkspace(fixtureRoot, 'unsafe');
    injectUnsafeFixture(unsafeFixture.workspaceDir);
    const unsafeResult = runRepositoryTypecheckStabilization({ projectRootDir: unsafeFixture.workspaceDir });
    assert(
      '19a. unsafe verdict',
      ['TYPECHECK_UNSAFE', 'TYPECHECK_BLOCKED', 'TYPECHECK_EXHAUSTED'].includes(unsafeResult.report.verdict),
      unsafeResult.report.verdict,
    );
    assert('19b. unsafe no blind patch', unsafeResult.report.filesModified.length === 0, String(unsafeResult.report.filesModified.length));

    const regressionFixture = createRepoTypecheckFixtureWorkspace(fixtureRoot, 'regression');
    injectRegressionTrapFixture(regressionFixture.workspaceDir);
    const regressionResult = runRepositoryTypecheckStabilization({ projectRootDir: regressionFixture.workspaceDir });
    assert('20a. regression verdict', regressionResult.report.verdict === 'TYPECHECK_REPAIR_REGRESSION', regressionResult.report.verdict);
    assert(
      '20b. regression rolled back',
      regressionResult.report.patches.some((patch) => patch.rolledBack),
      String(regressionResult.report.patches.some((patch) => patch.rolledBack)),
    );
    assert('20c. regression not clean', !regressionResult.typecheckClean, String(regressionResult.typecheckClean));
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
    console.log(REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1_PASS);
    await finishValidator(0);
  } else {
    await finishValidator(1);
  }
}

main().catch(async (error) => {
  console.error(error);
  await finishValidator(1);
});
