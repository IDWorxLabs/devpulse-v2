/**
 * Self-Evolution Execution V1 — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSelfEvolutionExecutionV1ReportMarkdown,
  MIN_EVOLUTION_EXPERIMENTS,
  MIN_EVOLUTION_PROPOSALS,
  MIN_GAP_DETECTION_COUNT,
  runSelfEvolutionExecutionV1,
  SELF_EVOLUTION_EXECUTION_V1_ARTIFACT_DIR,
  SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN,
  SELF_EVOLUTION_EXECUTION_V1_REPORT_TITLE,
} from '../src/self-evolution-execution-v1/index.js';
import { buildSelfEvolutionExecutionPayload } from '../server/self-evolution-execution-v1-handler.js';
import { loadWorld2RegistryFromDisk } from '../src/world2-real-instantiation-v1/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, SELF_EVOLUTION_EXECUTION_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, SELF_EVOLUTION_EXECUTION_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 1_800_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:world2-real-instantiation-v1',
  'validate:mobile-runtime-validation-at-scale-v1',
  'validate:large-scale-pipeline-integration-v1',
  'validate:production-readiness-gate-v1',
  'validate:general-purpose-code-generation-v1',
  'validate:uvl-verification-execution-v1',
  'validate:capability-audit-v3-1',
  'validate:validation-runtime-governance-v1',
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
  console.log('Self-Evolution Execution V1 — Validation');
  console.log('=========================================');
  console.log('');

  checkpoint('start');

  const requiredFiles = [
    'src/self-evolution-execution-v1/self-evolution-execution-assessor.ts',
    'src/self-evolution-execution-v1/evolution-gap-detector.ts',
    'src/self-evolution-execution-v1/evolution-proposal-engine.ts',
    'src/self-evolution-execution-v1/evolution-world2-experiment-runner.ts',
    'src/self-evolution-execution-v1/index.ts',
    'server/self-evolution-execution-v1-handler.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 3_000_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:self-evolution-execution-v1']), 'script');
  assert('02. operator section', manifest.includes("'Self-Evolution'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/self-evolution-execution-v1'), 'route');
  assert('04. UI detected gaps', appJs.includes('Detected Gaps'), 'detected gaps');
  assert('05. UI active proposals', appJs.includes('Active Proposals'), 'active proposals');
  assert('06. UI experiment status', appJs.includes('Experiment Status'), 'experiment status');
  assert('07. UI promotion candidates', appJs.includes('Promotion Candidates'), 'promotion candidates');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`08. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  loadWorld2RegistryFromDisk(ROOT);
  checkpoint('world2 registry loaded');

  const assessment = runSelfEvolutionExecutionV1({
    projectRootDir: ROOT,
    resetRegistry: true,
    operatorApproval: true,
  });
  checkpoint('self-evolution execution completed');

  const reportMarkdown = buildSelfEvolutionExecutionV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert(
    '09. gap detection proven',
    assessment.gapDetectionProven && assessment.gapsDetected >= MIN_GAP_DETECTION_COUNT,
    String(assessment.gapsDetected),
  );
  assert(
    '10. proposal generation proven',
    assessment.proposalGenerationProven &&
      assessment.proposalsGenerated >= MIN_EVOLUTION_PROPOSALS,
    String(assessment.proposalsGenerated),
  );
  assert(
    '11. world2 experimentation proven',
    assessment.world2ExperimentationProven &&
      assessment.experimentsCompleted >= MIN_EVOLUTION_EXPERIMENTS,
    String(assessment.experimentsCompleted),
  );
  assert('12. impact measurement proven', assessment.impactMeasurementProven, 'impact');
  assert('13. promotion path proven', assessment.promotionPathProven, 'promotion');
  assert('14. production protection proven', assessment.productionProtectionProven, 'world1');
  assert(
    '15. evolution proof status',
    assessment.evolutionProofStatus === 'PROVEN',
    assessment.evolutionProofStatus,
  );
  assert(
    '16. pass token',
    assessment.passToken === SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN,
    assessment.passToken,
  );

  assert('17. gap-assessments.json', existsSync(join(ARTIFACT_DIR, 'gap-assessments.json')), 'written');
  assert(
    '18. evolution-proposals.json',
    existsSync(join(ARTIFACT_DIR, 'evolution-proposals.json')),
    'written',
  );
  assert(
    '19. experiment-results.json',
    existsSync(join(ARTIFACT_DIR, 'experiment-results.json')),
    'written',
  );
  assert(
    '20. impact-assessments.json',
    existsSync(join(ARTIFACT_DIR, 'impact-assessments.json')),
    'written',
  );
  assert(
    '21. approval-decisions.json',
    existsSync(join(ARTIFACT_DIR, 'approval-decisions.json')),
    'written',
  );
  assert(
    '22. evolution-registry.json',
    existsSync(join(ARTIFACT_DIR, 'evolution-registry.json')),
    'written',
  );

  const payload = buildSelfEvolutionExecutionPayload({ projectRootDir: ROOT, refresh: false });
  assert('23. operator payload', payload.gapsDetected >= MIN_GAP_DETECTION_COUNT, String(payload.gapsDetected));

  checkpoint('artifacts and operator smoke');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Self-Evolution Execution V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN);
  console.log(
    `Evolution: ${assessment.gapsDetected} gaps, ${assessment.proposalsGenerated} proposals, ${assessment.promotionsCompleted} promoted`,
  );
}

main();
