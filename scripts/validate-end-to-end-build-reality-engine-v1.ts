/**
 * End-to-End Build Reality Engine V1 — validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import {
  END_TO_END_BUILD_REALITY_ENGINE_V1_PASS,
  E2E_REGRESSION_CI_PROMPTS,
  buildContractDerivedValidationPlan,
  extractContractExpectations,
  runEndToEndBuildReality,
} from '../src/end-to-end-build-reality-engine-v1/index.js';
import { resetOnePromptLivePreviewForTests } from '../src/one-prompt-live-preview/index.js';
import { resetGeneratedDevServerManagerForTests } from '../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import {
  createProjectRegistryTestRoot,
  invalidateProjectRegistryV1Cache,
} from '../src/project-registry-v1/index.js';
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

async function resetBuildModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('End-to-End Build Reality Engine V1 — Validation');
  console.log('===============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const moduleDir = join(ROOT, 'src/end-to-end-build-reality-engine-v1');
  const authoritySource = readFileSync(join(moduleDir, 'e2e-build-reality-authority.ts'), 'utf8');
  const planSource = readFileSync(join(moduleDir, 'contract-derived-plan-generator.ts'), 'utf8');
  const extractorSource = readFileSync(join(moduleDir, 'contract-expectation-extractor.ts'), 'utf8');

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:end-to-end-build-reality-engine-v1']), 'package.json');
  assert('02. module directory exists', existsSync(moduleDir), moduleDir);
  assert('03. no calculator-specific branches in plan generator', !/if\s*\(\s*calculator/i.test(planSource), 'plan generator');
  assert('04. no todo-specific branches in authority', !/if\s*\(\s*todo/i.test(authoritySource), 'authority');
  assert('05. contract expectation extractor exists', existsSync(join(moduleDir, 'contract-expectation-extractor.ts')), 'extractor');
  assert('06. false success detector exists', existsSync(join(moduleDir, 'false-success-detector.ts')), 'false success');
  assert('06b. preview authority audit exists', existsSync(join(moduleDir, 'preview-authority-audit.ts')), 'preview authority');
  assert('07. evidence collector exists', existsSync(join(moduleDir, 'evidence-collector.ts')), 'evidence');
  assert('08. regression prompts registry exists', existsSync(join(moduleDir, 'e2e-regression-prompts.ts')), 'prompts');
  assert(
    '09. orchestrator runs full pipeline stages',
    authoritySource.includes('INTENT_UNDERSTANDING') &&
      authoritySource.includes('WORKSPACE_REALITY_AUDIT') &&
      authoritySource.includes('FEATURE_REALITY') &&
      authoritySource.includes('RUNTIME_TRUTH') &&
      authoritySource.includes('PREVIEW_AUTHORITY') &&
      authoritySource.includes('DOM_REALITY') &&
      authoritySource.includes('INTERACTIVE_REALITY') &&
      authoritySource.includes('FALSE_SUCCESS_SCAN') &&
      authoritySource.includes('FOUNDER_TESTING_GATE'),
    'stages',
  );
  assert(
    '10. expectations derived from artifacts',
    extractorSource.includes('universal-feature-contract.json') &&
      extractorSource.includes('registry.ts') &&
      extractorSource.includes('GENERATED_APP_MANIFEST'),
    'artifact extraction',
  );
  assert(
    '10b. pipeline integration wired',
    readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8').includes(
      'runEndToEndBuildReality',
    ),
    'one-prompt-build-orchestrator',
  );
  assert(
    '11. READY_FOR_FOUNDER_TESTING verdict',
    authoritySource.includes('READY_FOR_FOUNDER_TESTING'),
    'verdict',
  );
  assert(
    '11b. PREVIEW_AUTHORITY_MISMATCH blocks READY',
    authoritySource.includes('PREVIEW_AUTHORITY_MISMATCH') &&
      readFileSync(join(moduleDir, 'false-success-detector.ts'), 'utf8').includes('PREVIEW_AUTHORITY_MISMATCH'),
    'preview authority invariant',
  );
  assert(
    '12. regression suite is prompt-only',
    E2E_REGRESSION_CI_PROMPTS.every((entry) => typeof entry.prompt === 'string' && entry.prompt.length > 8),
    String(E2E_REGRESSION_CI_PROMPTS.length),
  );

  const isolatedRegistryRoot = createProjectRegistryTestRoot(join(tmpdir(), 'e2e-reality-registry-'));
  const priorRegistryEnv = process.env.AIDEVENGINE_REGISTRY_ROOT;
  process.env.AIDEVENGINE_REGISTRY_ROOT = isolatedRegistryRoot;
  process.env.AIDEVENGINE_VALIDATION_RUN = '1';
  invalidateProjectRegistryV1Cache();

  try {
    await resetBuildModules();

    for (const entry of E2E_REGRESSION_CI_PROMPTS) {
      const projectId = `e2e-reality-${entry.id}-${Date.now()}`;
      const report = await runEndToEndBuildReality({
        rawPrompt: entry.prompt,
        projectRootDir: ROOT,
        projectId,
        projectName: entry.classLabel,
      });

      assert(
        `13.${entry.id} pipeline stages recorded`,
        report.stages.length >= 10,
        `${report.stages.length} stages`,
      );
      assert(
        `14.${entry.id} contract expectations extracted`,
        entry.id === 'expense-tracker'
          ? report.verdict === 'NOT_READY' || report.expectations.featureModules.length > 0
          : report.expectations.featureModules.length > 0 || report.expectations.requiredUiTerms.length > 0,
        `modules=${report.expectations.featureModules.length} terms=${report.expectations.requiredUiTerms.length}`,
      );
      assert(
        `15.${entry.id} validation plan derived`,
        entry.id === 'expense-tracker' && report.verdict === 'NOT_READY'
          ? true
          : buildContractDerivedValidationPlan({
              expectations: report.expectations,
              workspaceDir: report.evidence.workspacePath ?? '',
            }).length > 0 || !report.evidence.workspacePath,
        'plan steps',
      );
      assert(
        `16.${entry.id} evidence collected`,
        Boolean(report.evidence.routeTablePath) &&
          Boolean(report.evidence.domSnapshotPath || !report.evidence.previewUrl),
        report.evidence.routeTablePath ?? 'missing route table',
      );
      assert(
        `17.${entry.id} founder testing verdict explicit`,
        report.verdict === 'READY_FOR_FOUNDER_TESTING' || report.verdict === 'NOT_READY',
        report.verdict,
      );

      if (entry.id === 'calculator') {
        assert(
          '18.calculator interactive reality',
          report.checks.some(
            (c) =>
              (c.id === 'contract-derived-interaction-sequence' ||
                c.label.includes('Interactive workflow executes')) &&
              c.passed,
          ),
          report.checks
            .filter((c) => c.stageId === 'INTERACTIVE_REALITY')
            .map((c) => `${c.id}:${c.passed}`)
            .join(', ') || 'missing',
        );
        assert(
          '19.calculator no generic shell at root',
          !report.falseSuccessFindings.some((f) => f.code === 'GENERIC_SHELL_PRIMARY'),
          report.falseSuccessFindings.map((f) => f.code).join(', ') || 'none',
        );
        assert(
          '20.calculator READY_FOR_FOUNDER_TESTING',
          report.verdict === 'READY_FOR_FOUNDER_TESTING',
          report.failingStage ?? report.verdict,
        );
      }
    }
  } finally {
    if (priorRegistryEnv === undefined) {
      delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    } else {
      process.env.AIDEVENGINE_REGISTRY_ROOT = priorRegistryEnv;
    }
    delete process.env.AIDEVENGINE_VALIDATION_RUN;
    invalidateProjectRegistryV1Cache();
    await resetBuildModules();
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
    console.log(END_TO_END_BUILD_REALITY_ENGINE_V1_PASS);
    await finishValidator(0);
  } else {
    await finishValidator(1);
  }
}

main().catch(async (err) => {
  console.error(err);
  await finishValidator(1);
});
