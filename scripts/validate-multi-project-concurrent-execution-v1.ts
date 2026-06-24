/**
 * Multi-Project Concurrent Execution V1 — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildMultiProjectConcurrentExecutionV1ReportMarkdown,
  MIN_CONCURRENT_PROJECTS_PROOF,
  MIN_CONCURRENT_WORLD2_EXECUTIONS,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_ARTIFACT_DIR,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_REPORT_TITLE,
  runMultiProjectConcurrentExecutionV1,
} from '../src/multi-project-concurrent-execution-v1/index.js';
import { buildMultiProjectConcurrentExecutionPayload } from '../server/multi-project-concurrent-execution-handler.js';
import { loadWorld2RegistryFromDisk } from '../src/world2-real-instantiation-v1/index.js';
import {
  buildMissingCapabilitiesReport,
  buildRecommendedRoadmap,
} from '../src/capability-audit-v3/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, MULTI_PROJECT_CONCURRENT_EXECUTION_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, MULTI_PROJECT_CONCURRENT_EXECUTION_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 2_400_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:canonical-ownership-v2',
  'validate:self-evolution-execution-v1',
  'validate:world2-real-instantiation-v1',
  'validate:mobile-runtime-validation-at-scale-v1',
  'validate:large-scale-pipeline-integration-v1',
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

function highestGapTitle(highestPriorityGap: string): string {
  const separator = ' — ';
  const idx = highestPriorityGap.indexOf(separator);
  return idx >= 0 ? highestPriorityGap.slice(0, idx) : highestPriorityGap;
}

function main(): void {
  console.log('');
  console.log('Multi-Project Concurrent Execution V1 — Validation');
  console.log('===================================================');
  console.log('');

  checkpoint('start');

  const requiredFiles = [
    'src/multi-project-concurrent-execution-v1/concurrent-execution-coordinator.ts',
    'src/multi-project-concurrent-execution-v1/multi-project-concurrent-execution-assessor.ts',
    'src/multi-project-concurrent-execution-v1/index.ts',
    'server/multi-project-concurrent-execution-handler.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 3_500_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:multi-project-concurrent-execution-v1']), 'script');
  assert('02. operator section', manifest.includes("'Multi-Project Execution'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/multi-project-concurrent-execution-v1'), 'route');
  assert('04. UI active projects', appJs.includes('Active projects'), 'active projects');
  assert('05. UI queued projects', appJs.includes('Queued projects'), 'queued projects');
  assert('06. UI contamination incidents', appJs.includes('Contamination incidents'), 'contamination');
  assert('07. UI worker allocation', appJs.includes('Worker allocation'), 'worker allocation');
  assert('08. UI concurrent pass rate', appJs.includes('Concurrent pass rate'), 'pass rate');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`09. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  loadWorld2RegistryFromDisk(ROOT);
  checkpoint('world2 registry loaded');

  const assessment = runMultiProjectConcurrentExecutionV1({
    projectRootDir: ROOT,
    resetRegistry: true,
    resetQueue: true,
  });
  checkpoint('concurrent execution completed');

  const reportMarkdown = buildMultiProjectConcurrentExecutionV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert(
    '10. concurrent projects proven',
    assessment.concurrentProjectsProven >= MIN_CONCURRENT_PROJECTS_PROOF,
    String(assessment.concurrentProjectsProven),
  );
  assert(
    '11. concurrent pass rate 100%',
    assessment.concurrentPassRate >= 100,
    String(assessment.concurrentPassRate),
  );
  assert('12. zero contamination', assessment.contaminationIncidents === 0, String(assessment.contaminationIncidents));
  assert(
    '13. world2 concurrent executions',
    assessment.concurrentWorld2Executions >= MIN_CONCURRENT_WORLD2_EXECUTIONS,
    String(assessment.concurrentWorld2Executions),
  );
  assert(
    '14. concurrent proof status',
    assessment.concurrentProofStatus === 'PROVEN',
    assessment.concurrentProofStatus,
  );
  assert(
    '15. pass token',
    assessment.passToken === MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN,
    assessment.passToken,
  );
  assert('16. build proof complete', assessment.buildProof.allBuildProofComplete, 'build proof');
  assert('17. evolution boundary', assessment.evolutionBoundary.boundaryEnforced, 'boundary');

  const artifactFiles = [
    'concurrent-execution-results.json',
    'resource-allocation.json',
    'contamination-assessment.json',
    'failure-classification.json',
    'concurrent-build-proof.json',
    'concurrent-verification-assessment.json',
    'world2-concurrent-results.json',
    'assessment.json',
  ];
  for (const file of artifactFiles) {
    assert(`18. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  assert('19. report written', existsSync(REPORT_PATH), MULTI_PROJECT_CONCURRENT_EXECUTION_V1_REPORT_TITLE);

  const payload = buildMultiProjectConcurrentExecutionPayload({ projectRootDir: ROOT, refresh: false });
  assert('20. operator payload', payload.concurrentProjectsProven >= MIN_CONCURRENT_PROJECTS_PROOF, String(payload.concurrentProjectsProven));

  const missing = buildMissingCapabilitiesReport({ projectRootDir: ROOT });
  assert(
    '21. parallel build gap closed',
    !missing.entries.some((e) => e.capability === 'Parallel build execution'),
    String(missing.entries.length),
  );

  const { highestPriorityGap, nextPriority, priorities: roadmap } = buildRecommendedRoadmap({
    projectRootDir: ROOT,
  });

  assert(
    '22. not highest gap',
    highestGapTitle(highestPriorityGap) !== 'Multi-Project Concurrent Execution',
    highestGapTitle(highestPriorityGap),
  );
  assert(
    '23. next priority not concurrent execution',
    nextPriority !== 'Multi-Project Concurrent Execution',
    nextPriority,
  );
  assert(
    '24. complete in roadmap',
    roadmap.some((p) => p.phase === 'Multi-Project Concurrent Execution' && p.action === 'COMPLETE'),
    'COMPLETE action',
  );

  checkpoint('audit impact verified');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Multi-Project Concurrent Execution V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN);
  console.log(
    `Concurrent: ${assessment.concurrentProjectsProven} projects, ${assessment.concurrentWorld2Executions} worlds, ${assessment.contaminationIncidents} contamination`,
  );
}

main();
