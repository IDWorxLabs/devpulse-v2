/**
 * One-Prompt Calculator Visible Preview V1 — end-to-end validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import {
  ONE_PROMPT_CALCULATOR_VISIBLE_PREVIEW_PASS,
  validateCalculatorVisiblePreview,
  GENERIC_SHELL_MARKERS,
} from '../src/calculator-visible-preview-v1/index.js';
import { CALCULATOR_BUILD_PROMPT } from '../src/simple-utility-app/simple-utility-constants.js';
import { runOnePromptLivePreviewBuild } from '../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
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
import { resolveRegistryRootForPersistentProject } from '../src/audit-project-isolation/audit-registry-root.js';
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
  console.log('One-Prompt Calculator Visible Preview V1 — Validation');
  console.log('=====================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const materializationEngine = readFileSync(
    join(ROOT, 'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts'),
    'utf8',
  );
  const orchestrator = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  const visibilityAuthority = readFileSync(
    join(ROOT, 'src/running-application-visibility/running-application-visibility-authority.ts'),
    'utf8',
  );

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:one-prompt-calculator-visible-preview-v1']),
    'package.json',
  );
  assert(
    '02. simple utility direct App.tsx generator',
    existsSync(join(ROOT, 'src/simple-utility-app/simple-utility-app-entry-generator.ts')),
    'entry generator',
  );
  assert(
    '03. materialization overrides App.tsx for simple utility',
    materializationEngine.includes('buildSimpleUtilityAppTsx'),
    'universal-app-materialization-engine.ts',
  );
  assert(
    '04. PBM routes use simpleUtilityRoutes',
    readFileSync(join(ROOT, 'src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts'), 'utf8').includes(
      'simpleUtilityRoutes',
    ),
    'prompt-bounded-module-resolver.ts',
  );
  assert(
    '05. orchestrator runs visible preview validation',
    orchestrator.includes('validateCalculatorVisiblePreview'),
    'one-prompt-build-orchestrator.ts',
  );
  assert(
    '06. workspace reality FAIL blocks READY',
    orchestrator.includes('workspaceRealityAuditStatus') && orchestrator.includes("finalBuildStatus = launchEvidenceBlocked ? 'FAILED'"),
    'orchestrator launch gate',
  );
  assert(
    '07. false success language gated on DOM validation',
    visibilityAuthority.includes('visibleFeatureDomValidated'),
    'running-application-visibility-authority.ts',
  );
  assert(
    '08. generic shell markers defined',
    GENERIC_SHELL_MARKERS.length > 0,
    String(GENERIC_SHELL_MARKERS.length),
  );

  const isolatedRegistryRoot = createProjectRegistryTestRoot(
    join(tmpdir(), 'calc-visible-preview-registry-'),
  );
  const priorRegistryEnv = process.env.AIDEVENGINE_REGISTRY_ROOT;
  process.env.AIDEVENGINE_REGISTRY_ROOT = isolatedRegistryRoot;
  process.env.AIDEVENGINE_VALIDATION_RUN = '1';
  invalidateProjectRegistryV1Cache();

  try {
    await resetBuildModules();

    const projectId = `calc-visible-preview-${Date.now()}`;
    const build = await runOnePromptLivePreviewBuild({
      rawPrompt: CALCULATOR_BUILD_PROMPT,
      projectRootDir: ROOT,
      source: 'api',
      projectId,
      projectName: 'Calculator App',
      projectKind: 'VALIDATION',
    });

    const workspaceRel = build.workspacePath;
    const { artifactRoot } = resolveRegistryRootForPersistentProject({
      projectRootDir: ROOT,
      explicitProjectKind: 'VALIDATION',
    });
    const workspaceDir = workspaceRel ? join(artifactRoot, workspaceRel.replace(/\//g, '\\')) : null;

    assert('09. build completes with workspace', Boolean(workspaceDir && existsSync(workspaceDir)), workspaceRel ?? 'missing');

    const appSource =
      workspaceDir && existsSync(join(workspaceDir, 'src/App.tsx'))
        ? readFileSync(join(workspaceDir, 'src/App.tsx'), 'utf8')
        : '';
    assert(
      '10. App.tsx mounts CalculatorFeature at root',
      appSource.includes('CalculatorFeature') && !appSource.includes('WelcomeScreen'),
      appSource.slice(0, 120),
    );

    const registrySource =
      workspaceDir && existsSync(join(workspaceDir, 'src/features/registry.ts'))
        ? readFileSync(join(workspaceDir, 'src/features/registry.ts'), 'utf8')
        : '';
    assert(
      '11. registry route is /',
      registrySource.includes("route: '/'") || registrySource.includes('route: "/"'),
      registrySource.match(/route:\s*['"][^'"]+['"]/)?.[0] ?? 'missing',
    );

    const previewUrl = build.previewUrl ?? build.diagnosticPreviewUrl ?? build.limitedPreviewUrl ?? null;
    assert('12. preview URL available', Boolean(previewUrl), previewUrl ?? 'missing');

    const visiblePreview =
      workspaceDir && previewUrl
        ? await validateCalculatorVisiblePreview({ previewUrl, workspaceDir, projectRootDir: ROOT })
        : null;

    assert(
      '13. visible preview validation PASS',
      visiblePreview?.passed === true,
      visiblePreview?.failureReasons.join('; ') ?? 'validation not run',
    );
    assert(
      '14. no generic shell-only welcome page',
      visiblePreview?.genericShellDetected !== true,
      String(visiblePreview?.genericShellDetected),
    );
    assert(
      '15. calculator interaction 2+3=5',
      visiblePreview?.interactionResult === '5',
      visiblePreview?.interactionResult ?? 'no interaction result',
    );
    assert(
      '16. workspace reality audit PASS required for READY',
      build.materializationManifest?.workspaceRealityAuditStatus === 'PASS' || build.status === 'FAILED',
      build.materializationManifest?.workspaceRealityAuditStatus ?? 'unknown',
    );
    assert(
      '17. build READY only when evidence passes',
      build.status === 'READY' && build.buildResult === 'PASS',
      `status=${build.status} buildResult=${build.buildResult} reason=${build.failureReason ?? 'none'}`,
    );
    assert(
      '18. previewHtmlStatus PASS when visible preview passes',
      build.materializationManifest?.previewHtmlStatus === 'PASS',
      build.materializationManifest?.previewHtmlStatus ?? 'unknown',
    );
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
    console.log(ONE_PROMPT_CALCULATOR_VISIBLE_PREVIEW_PASS);
    await finishValidator(0);
  } else {
    await finishValidator(1);
  }
}

main().catch(async (err) => {
  console.error(err);
  await finishValidator(1);
});
