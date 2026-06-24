/**
 * General-Purpose Code Generation V1 — validation (leaf mode, 10 non-trivial app types).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildGeneralPurposeCodeGenerationV1ReportMarkdown,
  GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR,
  GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN,
  GENERAL_PURPOSE_CODE_GENERATION_V1_REPORT_TITLE,
  MIN_GENERAL_PURPOSE_PROOF_DOMAINS,
  resetGeneralPurposeHistoryForTests,
  runGeneralPurposeCodeGenerationV1,
} from '../src/general-purpose-code-generation-v1/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, GENERAL_PURPOSE_CODE_GENERATION_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 2_400_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:cloud-execution-path-v1',
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
  console.log('General-Purpose Code Generation V1 — Validation');
  console.log('===============================================');
  console.log('');

  resetGeneralPurposeHistoryForTests();
  checkpoint('start');

  const requiredFiles = [
    'src/general-purpose-code-generation-v1/generation-strategy-router.ts',
    'src/general-purpose-code-generation-v1/general-purpose-app-model-builder.ts',
    'src/general-purpose-code-generation-v1/general-purpose-generation-runner.ts',
    'src/general-purpose-code-generation-v1/general-purpose-code-generation-assessor.ts',
    'src/general-purpose-code-generation-v1/feature-contract-upgrade.ts',
    'src/general-purpose-code-generation-v1/general-purpose-extension-writer.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:general-purpose-code-generation-v1']),
    'script',
  );

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`02. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  const assessment = runGeneralPurposeCodeGenerationV1({ projectRootDir: ROOT, runNpmBuild: true });
  checkpoint('10 general-purpose domains completed');

  assert('03. pass token', assessment.passToken === GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN, assessment.passToken);
  assert('04. proof status PROVEN', assessment.proofStatus === 'PROVEN', assessment.proofStatus);
  assert(
    '05. 10/10 overall passed',
    assessment.domainResults.filter((r) => r.overallPassed).length >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS,
    `${assessment.domainResults.filter((r) => r.overallPassed).length}/${MIN_GENERAL_PURPOSE_PROOF_DOMAINS}`,
  );
  assert(
    '06. 10/10 build proven',
    assessment.domainsBuildProven >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS,
    String(assessment.domainsBuildProven),
  );
  assert(
    '07. 10/10 preview proven',
    assessment.domainsPreviewProven >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS,
    String(assessment.domainsPreviewProven),
  );
  assert(
    '08. 10/10 workflow proven',
    assessment.domainsWorkflowProven >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS,
    String(assessment.domainsWorkflowProven),
  );
  assert(
    '09. 10/10 production ready',
    assessment.domainsProductionReady >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS,
    String(assessment.domainsProductionReady),
  );
  assert('10. supportsComplexWorkflows', assessment.supportsComplexWorkflows, 'workflows');
  assert('11. supportsMultiRoleSystems', assessment.supportsMultiRoleSystems, 'roles');
  assert('12. supportsDomainSpecificApps', assessment.supportsDomainSpecificApps, 'domain');

  const artifactFiles = [
    'strategy-classification.json',
    'app-models.json',
    'workflow-contracts.json',
    'role-contracts.json',
    'domain-logic-report.json',
    'validation-summary.json',
    'assessment.json',
  ];

  for (const file of artifactFiles) {
    assert(`13. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, buildGeneralPurposeCodeGenerationV1ReportMarkdown(assessment), 'utf8');
  assert('14. report written', existsSync(REPORT_PATH), REPORT_PATH);

  const failed = results.filter((r) => !r.passed);
  console.log('');
  console.log(`Scenarios: ${results.length - failed.length}/${results.length} passed`);
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');

  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
  }

  if (failed.length > 0) {
    console.log('');
    console.log(GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN.replace('_PASS', '_FAIL'));
    process.exit(1);
  }

  console.log('');
  console.log(GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN);
}

main();
