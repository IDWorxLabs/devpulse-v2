/**
 * Phase 26.72 — Repository Typecheck Reality repair validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import {
  REPOSITORY_TYPECHECK_REALITY_PASS_TOKEN,
  REPOSITORY_TYPECHECK_REALITY_REPAIR_V1_PASS,
  NPM_TYPECHECK_SCRIPT,
  TYPECHECK_COMMAND,
  assessRepositoryTypecheckReality,
  buildRepositoryTypecheckRealityReport,
  getRepositoryTypecheckHistorySize,
  parseBoundedTypecheckOutput,
  resetRepositoryTypecheckHistoryForTests,
  runRepositoryTypecheckBaseline,
} from '../src/repository-typecheck-reality/index.js';

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
  'src/repository-typecheck-reality/repository-typecheck-reality-runner.ts',
  'src/repository-typecheck-reality/repository-typecheck-reality-authority.ts',
  'src/repository-typecheck-reality/repository-typecheck-reality-types.ts',
  'src/repository-typecheck-reality/repository-typecheck-reality-bounds.ts',
  'src/founder-testing-mode/founder-testing-v4-orchestrator.ts',
  'scripts/validate-repository-typecheck-reality.ts',
  'architecture/REPOSITORY_TYPECHECK_REALITY_REPAIR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
assert('package.json typecheck script', pkg.scripts?.[NPM_TYPECHECK_SCRIPT] === 'tsc --noEmit', pkg.scripts?.[NPM_TYPECHECK_SCRIPT] ?? 'missing');
assert('validate script registered', Boolean(pkg.scripts?.['validate:repository-typecheck-reality']), 'registered');

resetRepositoryTypecheckHistoryForTests();

const notRun = assessRepositoryTypecheckReality({ source: 'NOT_RUN' });
assert('NOT_RUN when evidence absent', notRun.readinessState === 'TYPECHECK_NOT_RUN', notRun.readinessState);
assert('NOT_RUN blocks launch', notRun.blocksLaunchReadiness, String(notRun.blocksLaunchReadiness));
assert('NOT_RUN no exitCode', notRun.exitCode === null, String(notRun.exitCode));

const failed = assessRepositoryTypecheckReality({
  source: 'SUPPLIED',
  errorCount: 2,
  warningCount: 0,
  exitCode: 2,
  durationMs: 1200,
  startedAt: '2026-01-01T00:00:00.000Z',
  completedAt: '2026-01-01T00:00:02.000Z',
  generatedAt: '2026-01-01T00:00:02.000Z',
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
assert('FAILED preserves errors', failed.readinessState === 'TYPECHECK_FAILED', failed.readinessState);
assert('FAILED blocks launch', failed.blocksLaunchReadiness, String(failed.blocksLaunchReadiness));
assert('FAILED records exitCode', failed.exitCode === 2, String(failed.exitCode));
assert('FAILED records durationMs', failed.durationMs === 1200, String(failed.durationMs));
assert('FAILED no fake clean', !failed.typecheckClean, String(failed.typecheckClean));

const parsed = parseBoundedTypecheckOutput(
  'src/example.ts(10,5): error TS2322: Type string is not assignable to type number.',
);
assert('parser finds error', parsed.errorCount === 1, String(parsed.errorCount));

const live = runRepositoryTypecheckBaseline({ projectRootDir: ROOT });
assert('live baseline command recorded', live.assessment.checkedCommand.includes('typecheck'), live.assessment.checkedCommand);
assert('live baseline generatedAt', Boolean(live.assessment.generatedAt), String(live.assessment.generatedAt));
assert('live baseline durationMs recorded', (live.assessment.durationMs ?? 0) > 0, String(live.assessment.durationMs));
assert('live baseline exitCode recorded', live.assessment.exitCode === 0, String(live.assessment.exitCode));
assert(
  'TYPECHECK_CLEAN requires successful command',
  live.assessment.readinessState === 'TYPECHECK_CLEAN' && live.assessment.exitCode === 0,
  live.assessment.readinessState,
);
assert('clean does not block launch', !live.assessment.blocksLaunchReadiness, String(live.assessment.blocksLaunchReadiness));

const founderSkipped = runFounderTestingModeV4({
  rootDir: ROOT,
  skipRepositoryTypecheckBaseline: true,
  validatorScripts: [],
});
assert(
  'founder skip fixture can use NOT_RUN',
  founderSkipped.repositoryTypecheckReality.readinessState === 'TYPECHECK_NOT_RUN',
  founderSkipped.repositoryTypecheckReality.readinessState,
);

const founderLive = runFounderTestingModeV4({
  rootDir: ROOT,
  validatorScripts: [],
});
assert(
  'founder test consumes live typecheck proof',
  founderLive.repositoryTypecheckReality.readinessState === 'TYPECHECK_CLEAN',
  founderLive.repositoryTypecheckReality.readinessState,
);
assert(
  'founder test typecheck no longer NOT_RUN by default',
  founderLive.repositoryTypecheckReality.readinessState !== 'TYPECHECK_NOT_RUN',
  founderLive.repositoryTypecheckReality.readinessState,
);
assert(
  'founder test launch blocker cleared when clean',
  !founderLive.repositoryTypecheckReality.blocksLaunchReadiness,
  String(founderLive.repositoryTypecheckReality.blocksLaunchReadiness),
);

const orchSource = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-orchestrator.ts'), 'utf8');
assert('orchestrator uses runRepositoryTypecheckBaseline', orchSource.includes('runRepositoryTypecheckBaseline'), 'wired');
assert('orchestrator skip flag', orchSource.includes('skipRepositoryTypecheckBaseline'), 'skip flag');

const report = buildRepositoryTypecheckRealityReport(live.assessment);
assert('report includes command evidence', report.includes('Exit code'), 'report');

resetRepositoryTypecheckHistoryForTests();
assessRepositoryTypecheckReality({ source: 'SUPPLIED', errorCount: 0, warningCount: 0, findings: [], exitCode: 0 });
assessRepositoryTypecheckReality({ source: 'SUPPLIED', errorCount: 1, warningCount: 0, findings: [], exitCode: 1 });
assert('history bounded', getRepositoryTypecheckHistorySize() <= 12, String(getRepositoryTypecheckHistorySize()));

assert('legacy pass token preserved', REPOSITORY_TYPECHECK_REALITY_PASS_TOKEN === 'REPOSITORY_TYPECHECK_REALITY_PASS', 'token');

const tsconfig = readFileSync(join(ROOT, 'tsconfig.json'), 'utf8');
assert('no global strictness weakening', tsconfig.includes('"strict": true'), 'strict');

const failedResults = results.filter((r) => !r.passed);
console.log('\n--- Repository Typecheck Reality Repair Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failedResults.length === 0) {
  console.log(`\n${REPOSITORY_TYPECHECK_REALITY_REPAIR_V1_PASS}`);
  console.log(`\n${REPOSITORY_TYPECHECK_REALITY_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failedResults.length} check(s) failed.`);
process.exit(1);
