/**
 * Cloud Execution Path V1 — validation (leaf mode, 3 cloud-simulated jobs).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCloudExecutionPathV1ReportMarkdown,
  CLOUD_EXECUTION_PATH_V1_ARTIFACT_DIR,
  CLOUD_EXECUTION_PATH_V1_PASS_TOKEN,
  CLOUD_EXECUTION_PATH_V1_REPORT_TITLE,
  getLastCloudExecutionAssessment,
  MIN_CONCURRENT_JOBS_PROOF,
  resetCloudExecutionHistoryForTests,
  runCloudExecutionPathV1,
  seedCloudExecutionHistoryForTests,
} from '../src/cloud-execution-path-v1/index.js';
import { resetCloudExecutionQueueForTests } from '../src/cloud-execution-path-v1/cloud-execution-queue.js';
import { buildCloudExecutionPayload } from '../server/cloud-execution-path-handler.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, CLOUD_EXECUTION_PATH_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, CLOUD_EXECUTION_PATH_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 1_800_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:production-readiness-gate-v1',
  'validate:uvl-verification-execution-v1',
  'validate:real-build-execution-pipeline-v1-1',
  'validate:validation-runtime-governance-v1',
  'validate:capability-audit-v3-1',
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
  console.log('Cloud Execution Path V1 — Validation');
  console.log('====================================');
  console.log('');

  resetCloudExecutionHistoryForTests();
  resetCloudExecutionQueueForTests(ROOT);
  checkpoint('start');

  const requiredFiles = [
    'src/cloud-execution-path-v1/cloud-execution-path-v1-types.ts',
    'src/cloud-execution-path-v1/cloud-execution-queue.ts',
    'src/cloud-execution-path-v1/cloud-execution-job-lifecycle.ts',
    'src/cloud-execution-path-v1/cloud-execution-worker.ts',
    'src/cloud-execution-path-v1/cloud-execution-adapters.ts',
    'src/cloud-execution-path-v1/cloud-execution-assessor.ts',
    'server/cloud-execution-path-handler.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 2_600_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:cloud-execution-path-v1']), 'script');
  assert('02. operator section', manifest.includes("'Cloud Execution'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/cloud-execution-path-v1'), 'route');
  assert('04. UI queued jobs', appJs.includes('Queued jobs'), 'queued jobs');
  assert('05. UI execution mode', appJs.includes('Execution mode'), 'execution mode');
  assert('06. UI artifact status', appJs.includes('Artifact status'), 'artifact status');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`07. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  const assessment = runCloudExecutionPathV1({ projectRootDir: ROOT, resetQueue: true });
  checkpoint('3 cloud-simulated jobs completed');

  assert(
    '08. jobs submitted',
    assessment.jobsSubmitted >= MIN_CONCURRENT_JOBS_PROOF,
    String(assessment.jobsSubmitted),
  );
  assert(
    '09. jobs completed',
    assessment.jobsCompleted >= MIN_CONCURRENT_JOBS_PROOF,
    String(assessment.jobsCompleted),
  );
  assert(
    '10. zero contamination',
    assessment.contaminationIncidents === 0,
    String(assessment.contaminationIncidents),
  );
  assert(
    '11. cloud simulated proof',
    assessment.cloudSimulatedProofStatus === 'PROVEN',
    assessment.cloudSimulatedProofStatus,
  );
  assert(
    '12. all jobs have build proof',
    assessment.jobResults.every((r) => r.buildProof),
    String(assessment.jobResults.filter((r) => r.buildProof).length),
  );
  assert(
    '13. all jobs have preview proof',
    assessment.jobResults.every((r) => r.previewProof),
    String(assessment.jobResults.filter((r) => r.previewProof).length),
  );
  assert(
    '14. all jobs have cloud package',
    assessment.jobResults.every((r) => r.cloudJobPackage !== null),
    String(assessment.jobResults.filter((r) => r.cloudJobPackage).length),
  );
  assert(
    '15. pass token',
    assessment.passToken === CLOUD_EXECUTION_PATH_V1_PASS_TOKEN,
    assessment.passToken,
  );

  seedCloudExecutionHistoryForTests(assessment);
  const payload = buildCloudExecutionPayload({ refresh: false, projectRootDir: ROOT });
  assert('16. payload smoke test', payload.passToken === assessment.passToken, payload.passToken);

  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(join(ARTIFACT_DIR, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
  writeFileSync(
    join(ARTIFACT_DIR, 'queue-snapshot.json'),
    `${JSON.stringify(assessment.queueSnapshot, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'job-results.json'),
    `${JSON.stringify(assessment.jobResults, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(REPORT_PATH, buildCloudExecutionPathV1ReportMarkdown(assessment), 'utf8');

  assert('17. artifacts written', existsSync(join(ARTIFACT_DIR, 'assessment.json')), ARTIFACT_DIR);
  assert('18. report written', existsSync(REPORT_PATH), CLOUD_EXECUTION_PATH_V1_REPORT_TITLE);
  assert('19. history recorded', getLastCloudExecutionAssessment() !== null, 'recorded');

  const failed = results.filter((r) => !r.passed);
  console.log('\n--- Cloud Execution Path V1 Validation ---');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }

  console.log('\n--- Summary ---');
  console.log(`Jobs Completed: ${assessment.jobsCompleted}/${assessment.jobsSubmitted}`);
  console.log(`Contamination Incidents: ${assessment.contaminationIncidents}`);
  console.log(`Cloud Simulated Proof: ${assessment.cloudSimulatedProofStatus}`);
  console.log(`Report: ${CLOUD_EXECUTION_PATH_V1_REPORT_TITLE}`);

  if (failed.length === 0) {
    console.log(`\n${CLOUD_EXECUTION_PATH_V1_PASS_TOKEN}`);
    process.exit(0);
  }

  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}

main();
