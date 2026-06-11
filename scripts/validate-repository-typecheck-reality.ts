/**
 * Phase 24D.1 — Repository Typecheck Reality validation (leaf mode).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REPOSITORY_TYPECHECK_REALITY_PASS_TOKEN,
  TYPECHECK_COMMAND,
  assessRepositoryTypecheckReality,
  buildRepositoryTypecheckRealityReport,
  getLatestRepositoryTypecheckBaseline,
  getRepositoryTypecheckHistorySize,
  parseBoundedTypecheckOutput,
  resetRepositoryTypecheckHistoryForTests,
} from '../src/repository-typecheck-reality/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REQUIRED_FILES = [
  'src/repository-typecheck-reality/repository-typecheck-reality-bounds.ts',
  'src/repository-typecheck-reality/repository-typecheck-reality-types.ts',
  'src/repository-typecheck-reality/repository-typecheck-reality-authority.ts',
  'src/repository-typecheck-reality/repository-typecheck-reality-report-builder.ts',
  'src/repository-typecheck-reality/repository-typecheck-reality-history.ts',
  'src/repository-typecheck-reality/repository-typecheck-reality-validator.ts',
  'src/repository-typecheck-reality/index.ts',
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

function runTypecheck(): { exitCode: number; output: string } {
  const result = spawnSync('npx', ['tsc', '--noEmit'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: true,
    maxBuffer: 512_000,
  });
  return {
    exitCode: result.status ?? 1,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
  };
}

function main(): void {
  console.log('');
  console.log('Repository Typecheck Reality — Validation (leaf mode)');
  console.log('====================================================');
  console.log('');

  resetRepositoryTypecheckHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const clean = assessRepositoryTypecheckReality({
    source: 'SUPPLIED',
    errorCount: 0,
    warningCount: 0,
    findings: [],
  });
  assert('01. clean state', clean.readinessState === 'TYPECHECK_CLEAN', clean.readinessState);
  assert('02. clean does not block', !clean.blocksLaunchReadiness, String(clean.blocksLaunchReadiness));
  assert('03. clean typecheckClean', clean.typecheckClean, String(clean.typecheckClean));

  const failed = assessRepositoryTypecheckReality({
    source: 'SUPPLIED',
    errorCount: 2,
    warningCount: 0,
    findings: [
      {
        file: 'src/example.ts',
        line: 1,
        column: 1,
        code: 'TS2322',
        message: 'Example compile error',
        severity: 'ERROR',
        recommendedAction: 'Fix TS2322 in src/example.ts:1',
      },
    ],
  });
  assert('04. failed state', failed.readinessState === 'TYPECHECK_FAILED', failed.readinessState);
  assert('05. failed blocks launch', failed.blocksLaunchReadiness, String(failed.blocksLaunchReadiness));
  assert('06. no fake clean on errors', !failed.typecheckClean, String(failed.typecheckClean));

  const parsed = parseBoundedTypecheckOutput(
    'src/example.ts(10,5): error TS2322: Type string is not assignable to type number.',
  );
  assert('07. parser finds error', parsed.errorCount === 1, String(parsed.errorCount));
  assert('08. parser bounded findings', parsed.findings.length === 1, parsed.findings[0]?.code ?? 'none');

  const report = buildRepositoryTypecheckRealityReport(failed);
  assert('09. report generation', report.includes('Repository Typecheck Reality'), 'report');

  resetRepositoryTypecheckHistoryForTests();
  assessRepositoryTypecheckReality({ source: 'SUPPLIED', errorCount: 0, warningCount: 0, findings: [] });
  assessRepositoryTypecheckReality({ source: 'SUPPLIED', errorCount: 1, warningCount: 0, findings: [] });
  assert('10. history bounded', getRepositoryTypecheckHistorySize() <= 12, String(getRepositoryTypecheckHistorySize()));
  assert('11. latest baseline stored', getLatestRepositoryTypecheckBaseline()?.readinessState === 'TYPECHECK_FAILED', 'baseline');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('12. npm script', Boolean(pkg.scripts?.['validate:repository-typecheck-reality']), 'package script');

  const orch = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-orchestrator.ts'), 'utf8');
  assert('13. founder testing wired', orch.includes('assessRepositoryTypecheckReality'), 'orchestrator');

  checkpoint('authority checks');

  const typecheck = runTypecheck();
  const liveAssessment = assessRepositoryTypecheckReality({
    source: 'BASELINE',
    ...parseBoundedTypecheckOutput(typecheck.output),
    checkedCommand: TYPECHECK_COMMAND,
    checkedAt: Date.now(),
  });
  assert('14. live typecheck exit matches assessment', typecheck.exitCode === 0 ? liveAssessment.typecheckClean : !liveAssessment.typecheckClean, `exit=${typecheck.exitCode}, state=${liveAssessment.readinessState}`);
  assert('15. live repo clean', liveAssessment.readinessState === 'TYPECHECK_CLEAN', liveAssessment.readinessState);

  checkpoint('live typecheck');

  const failedResults = results.filter((r) => !r.passed);
  console.log(`Scenarios: ${results.length}`);
  console.log(`Passed: ${results.length - failedResults.length}`);
  console.log(`Failed: ${failedResults.length}`);
  console.log('');

  if (failedResults.length > 0) {
    for (const item of failedResults) {
      console.log(`  ✗ ${item.name}: ${item.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(REPOSITORY_TYPECHECK_REALITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:repository-typecheck-reality');
}

main();
