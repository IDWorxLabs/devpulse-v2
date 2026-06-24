/**
 * World2 Real Instantiation V1 — validation (3 disposable worlds, isolation proof).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildWorld2RealInstantiationV1ReportMarkdown,
  MIN_MULTI_WORLD_PROOF,
  resetWorld2RegistryForTests,
  runWorld2RealInstantiationV1,
  WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR,
  WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN,
  WORLD2_REAL_INSTANTIATION_V1_REPORT_TITLE,
  writeWorld2RealInstantiationArtifacts,
} from '../src/world2-real-instantiation-v1/index.js';
import { buildWorld2RealInstantiationPayload } from '../server/world2-real-instantiation-handler.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, WORLD2_REAL_INSTANTIATION_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 1_800_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:large-scale-pipeline-integration-v1',
  'validate:cloud-execution-path-v1',
  'validate:production-readiness-gate-v1',
  'validate:general-purpose-code-generation-v1',
  'validate:uvl-verification-execution-v1',
  'validate:real-build-execution-pipeline-v1-1',
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
  console.log('World2 Real Instantiation V1 — Validation');
  console.log('=========================================');
  console.log('');

  resetWorld2RegistryForTests();
  checkpoint('start');

  const requiredFiles = [
    'src/world2-real-instantiation-v1/world2-instance-lifecycle.ts',
    'src/world2-real-instantiation-v1/world2-registry.ts',
    'src/world2-real-instantiation-v1/world2-isolation-proof.ts',
    'src/world2-real-instantiation-v1/world2-real-instantiation-assessor.ts',
    'src/world2-real-instantiation-v1/index.ts',
    'server/world2-real-instantiation-handler.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 2_800_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:world2-real-instantiation-v1']), 'script');
  assert('02. operator section', manifest.includes("'World2'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/world2-real-instantiation-v1'), 'route');
  assert('04. UI world count', appJs.includes('World Count'), 'world count');
  assert('05. UI isolation status', appJs.includes('Isolation Status'), 'isolation status');
  assert('06. UI promotion status', appJs.includes('Promotion Status'), 'promotion status');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`07. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  const assessment = runWorld2RealInstantiationV1({ projectRootDir: ROOT, resetRegistry: true });
  checkpoint('3-world multi-world proof completed');

  writeWorld2RealInstantiationArtifacts(ROOT, assessment);
  const reportMarkdown = buildWorld2RealInstantiationV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');
  writeFileSync(join(ROOT, 'WORLD2_REAL_INSTANTIATION_V1_REPORT.md'), reportMarkdown, 'utf8');

  assert(
    '08. worlds instantiated',
    assessment.worldsInstantiated >= MIN_MULTI_WORLD_PROOF,
    String(assessment.worldsInstantiated),
  );

  assert(
    '09. worlds executed',
    assessment.worldsExecuted >= MIN_MULTI_WORLD_PROOF,
    String(assessment.worldsExecuted),
  );

  assert(
    '10. worlds completed',
    assessment.worldsCompleted >= MIN_MULTI_WORLD_PROOF,
    String(assessment.worldsCompleted),
  );

  assert(
    '11. zero contamination',
    assessment.contaminationIncidents === 0,
    String(assessment.contaminationIncidents),
  );

  assert(
    '12. world1 protected',
    assessment.world1Protected,
    'world1 sentinels unchanged',
  );

  assert(
    '13. promotion proven',
    assessment.promotionProofs.length >= 1,
    String(assessment.promotionProofs.length),
  );

  assert(
    '14. destruction proven',
    assessment.destructionProofs.length >= 1,
    String(assessment.destructionProofs.length),
  );

  assert(
    '15. isolation proof',
    assessment.isolationProof.workspaceSeparation && assessment.isolationProof.world1Protected,
    'isolation',
  );

  assert(
    '16. instantiation proof status',
    assessment.instantiationProofStatus === 'PROVEN',
    assessment.instantiationProofStatus,
  );

  assert(
    '17. pass token',
    assessment.passToken === WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN,
    assessment.passToken,
  );

  assert('18. world-registry.json', existsSync(join(ARTIFACT_DIR, 'world-registry.json')), 'written');
  assert('19. isolation-proof.json', existsSync(join(ARTIFACT_DIR, 'isolation-proof.json')), 'written');
  assert('20. multi-world-results.json', existsSync(join(ARTIFACT_DIR, 'multi-world-results.json')), 'written');

  const payload = buildWorld2RealInstantiationPayload({ projectRootDir: ROOT, refresh: false });
  assert('21. operator payload', payload.worldCount >= MIN_MULTI_WORLD_PROOF, String(payload.worldCount));

  checkpoint('artifacts and operator smoke');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`World2 Real Instantiation V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN);
  console.log(
    `Worlds: ${assessment.worldsInstantiated} instantiated, ${assessment.worldsCompleted} completed, ${assessment.contaminationIncidents} contamination`,
  );
}

main();
