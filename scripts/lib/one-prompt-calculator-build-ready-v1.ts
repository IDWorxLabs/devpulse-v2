/**
 * One-Prompt Calculator Build Ready V1 — validation engine for simple utility calculator builds.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isBuildIntentRequest } from '../../src/build-intent-routing/index.js';
import { runOnePromptLivePreviewBuild } from '../../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import { resetOnePromptLivePreviewForTests } from '../../src/one-prompt-live-preview/index.js';
import { resetGeneratedDevServerManagerForTests } from '../../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetPreviewSessionManagerForTests } from '../../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../../src/aidev-engine/aidev-engine-authority.js';
import { assessRequirementsToPlanExecutionContract } from '../../src/requirements-to-plan-execution-contract/requirements-to-plan-contract-authority.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { SIMPLE_UTILITY_FORBIDDEN_MODULES } from '../../src/simple-utility-app/simple-utility-app-registry.js';
import { calculateMaterializationQualityScore } from '../../src/materialization-quality-score/materialization-quality-score-calculator.js';
import {
  createProjectRegistryTestRoot,
  invalidateProjectRegistryV1Cache,
} from '../../src/project-registry-v1/index.js';
import { resolveRegistryRootForPersistentProject } from '../../src/audit-project-isolation/audit-registry-root.js';
import { tmpdir } from 'node:os';

export const ONE_PROMPT_CALCULATOR_BUILD_READY_PASS = 'ONE_PROMPT_CALCULATOR_BUILD_READY_PASS' as const;

export const CALCULATOR_BUILD_PROMPT = 'build a calculator app' as const;

export interface CalculatorBuildReadyCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface CalculatorBuildReadyValidationResult {
  readOnly: true;
  passed: boolean;
  prompt: string;
  checks: CalculatorBuildReadyCheck[];
  materializationQualityScore: number | null;
  durationMs: number;
}

async function resetBuildModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

export async function validateOnePromptCalculatorBuildReady(
  rootDir: string,
): Promise<CalculatorBuildReadyValidationResult> {
  const checks: CalculatorBuildReadyCheck[] = [];
  const push = (name: string, passed: boolean, detail: string): void => {
    checks.push({ name, passed, detail });
  };

  const startedAt = Date.now();
  const isolatedRegistryRoot = createProjectRegistryTestRoot(
    join(tmpdir(), 'calculator-build-ready-registry-'),
  );
  const priorRegistryEnv = process.env.AIDEVENGINE_REGISTRY_ROOT;
  process.env.AIDEVENGINE_REGISTRY_ROOT = isolatedRegistryRoot;
  process.env.AIDEVENGINE_VALIDATION_RUN = '1';
  invalidateProjectRegistryV1Cache();

  try {
    await resetBuildModules();

    push(
      'build intent category BUILD',
      isBuildIntentRequest(CALCULATOR_BUILD_PROMPT),
      isBuildIntentRequest(CALCULATOR_BUILD_PROMPT) ? 'BUILD' : 'not detected',
    );

    resetRequirementsToPlanContractModuleForTests();
    const planning = assessRequirementsToPlanExecutionContract({ rawPrompt: CALCULATOR_BUILD_PROMPT });
    const buildReady = planning.report.buildReadyContract;
    push(
      'build-ready contract produced',
      buildReady?.readinessState === 'BUILD_READY',
      buildReady?.readinessState ?? 'missing',
    );

    const requirements = planning.report.requirementContract?.requirements ?? [];
    const forbiddenReqs = requirements.filter((req) =>
      /dashboard|settings panel|authentication/i.test(req.description),
    );
    push(
      'no dashboard/settings false requirements',
      forbiddenReqs.length === 0,
      forbiddenReqs.length ? forbiddenReqs.map((r) => r.description).join('; ') : 'none',
    );

    const projectId = `calculator-build-ready-${Date.now()}`;
    const build = await runOnePromptLivePreviewBuild({
      rawPrompt: CALCULATOR_BUILD_PROMPT,
      projectRootDir: rootDir,
      source: 'api',
      projectId,
      projectName: 'Calculator App',
      projectKind: 'VALIDATION',
    });

    const workspaceRel = build.workspacePath;
    const { artifactRoot } = resolveRegistryRootForPersistentProject({
      projectRootDir: rootDir,
      explicitProjectKind: 'VALIDATION',
    });
    const workspaceDir = workspaceRel ? join(artifactRoot, workspaceRel.replace(/\//g, '\\')) : null;

    push(
      'generated workspace exists',
      Boolean(workspaceDir && existsSync(workspaceDir)),
      workspaceRel ?? 'missing workspace path',
    );

    const packageJsonPath = workspaceDir ? join(workspaceDir, 'package.json') : null;
    push(
      'package.json exists',
      Boolean(packageJsonPath && existsSync(packageJsonPath)),
      packageJsonPath ?? 'missing',
    );

    push('npm install succeeds', build.npmInstallOk, build.failureReason ?? String(build.npmInstallOk));
    push('npm run build succeeds', build.npmBuildOk, build.failureReason ?? String(build.npmBuildOk));

    const previewUrl = build.previewUrl ?? build.diagnosticPreviewUrl ?? build.limitedPreviewUrl;
    push('live preview URL exists', Boolean(previewUrl), previewUrl ?? 'missing');

    let previewStatus = 0;
    if (previewUrl) {
      try {
        const previewRes = await fetch(previewUrl);
        previewStatus = previewRes.status;
        const html = await previewRes.text();
        push(
          'preview HTML returns 200',
          previewRes.ok && /id="root"|calculator|Calculator/i.test(html),
          `status ${previewRes.status}`,
        );
      } catch (err) {
        push(
          'preview HTML returns 200',
          false,
          err instanceof Error ? err.message : String(err),
        );
      }
    } else {
      push('preview HTML returns 200', false, 'no preview URL');
    }

    const manifest = build.materializationManifest;
    const qualityScore =
      manifest && workspaceDir && existsSync(workspaceDir)
        ? calculateMaterializationQualityScore({
            projectRootDir: rootDir,
            workspaceDir,
            manifest,
          }).overallScore
        : (manifest?.materializationQualityScore ?? null);
    push(
      'materialization quality >= 90%',
      qualityScore !== null && qualityScore >= 90,
      qualityScore === null ? 'score not recorded' : `${qualityScore}%`,
    );

    if (workspaceDir && existsSync(workspaceDir)) {
      const registrySource = readFileSync(join(workspaceDir, 'src/features/registry.ts'), 'utf8');
      const forbiddenModules = [...SIMPLE_UTILITY_FORBIDDEN_MODULES].filter((moduleId) =>
        registrySource.includes(`'${moduleId}'`),
      );
      push(
        'workspace excludes dashboard/settings modules',
        forbiddenModules.length === 0,
        forbiddenModules.length ? forbiddenModules.join(', ') : 'none',
      );

      const calculatorFeaturePath = join(workspaceDir, 'src/features/calculator/CalculatorFeature.tsx');
      push(
        'calculator feature module generated',
        existsSync(calculatorFeaturePath),
        calculatorFeaturePath,
      );
    }

    void previewStatus;

    const passed = checks.every((check) => check.passed);
    return {
      readOnly: true,
      passed,
      prompt: CALCULATOR_BUILD_PROMPT,
      checks,
      materializationQualityScore: qualityScore,
      durationMs: Date.now() - startedAt,
    };
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
}
